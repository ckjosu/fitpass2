import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContratoGimnasio, Liquidacion, SolicitudBaja } from '../entities';
import { PrecioVisitaDto, SolicitudBajaDto } from './contracts.dto';
import { calcularMes, clasificar, pagoDelGimnasio, pagoPorVisita, topes } from '../common/tarifas';

/**
 * Afiliacion del gimnasio y pagos.
 * El gimnasio no paga nada. Pone su precio por visita (con tope segun su
 * categoria) y FITNEX se lo paga por cada visita, sin pasar el fondo de
 * cada socio (30% FITNEX / 70% gimnasios, como en el Canvas).
 * Ver common/tarifas.ts.
 */
@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(ContratoGimnasio) private afiliaciones: Repository<ContratoGimnasio>,
    @InjectRepository(SolicitudBaja) private solicitudesBaja: Repository<SolicitudBaja>,
    @InjectRepository(Liquidacion) private liquidaciones: Repository<Liquidacion>,
  ) {}

  private async vigente(idGimnasio: number) {
    const afiliacion = await this.afiliaciones.findOne({
      where: { idGimnasio, situacion: 'vigente' },
      order: { fechaInicio: 'DESC' },
    });
    if (!afiliacion) throw new NotFoundException('Este gimnasio no esta afiliado a Gymred');
    return afiliacion;
  }

  /** Pantalla "Mis ganancias". */
  async ver(idGimnasio: number) {
    const afiliacion = await this.vigente(idGimnasio);
    const m = this.afiliaciones.manager;
    const clase = await clasificar(m, idGimnasio);
    const precio = afiliacion.precioPorVisita;

    const hoy = new Date();
    const mesActual = await pagoDelGimnasio(m, idGimnasio, hoy.getFullYear(), hoy.getMonth() + 1);

    // Se cierra el ultimo dia del mes y se deposita el dia 5 del siguiente.
    const proximoCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const fechaPago = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 5);

    const baja = await this.solicitudesBaja.findOne({
      where: { idGimnasio, situacion: 'pendiente' },
      order: { creadoEn: 'DESC' },
    });
    const liquidaciones = await this.liquidaciones.find({
      where: { idGimnasio },
      order: { anio: 'DESC', mes: 'DESC' },
      take: 6,
    });

    return {
      afiliacion: {
        id: afiliacion.id,
        fechaInicio: afiliacion.fechaInicio,
        fechaFin: afiliacion.fechaFin,
        situacion: afiliacion.situacion,
        costo: 0,
        precioPorVisita: precio,
        pagoPorVisita: pagoPorVisita(precio, clase.tope),
      },
      clasificacion: clase,
      topes: await topes(m),
      mesActual,
      proximoCorte: proximoCorte.toISOString().slice(0, 10),
      fechaPago: fechaPago.toISOString().slice(0, 10),
      liquidaciones,
      solicitudBaja: baja || null,
    };
  }

  /** El dueno pone su precio por visita, sin pasar el tope de su clase. */
  async guardarPrecio(idGimnasio: number, dto: PrecioVisitaDto) {
    const afiliacion = await this.vigente(idGimnasio);
    const clase = await clasificar(this.afiliaciones.manager, idGimnasio);
    if (dto.precio > clase.tope) {
      throw new BadRequestException(
        `Como gimnasio ${clase.clase} se te puede pagar hasta $${clase.tope} por visita`,
      );
    }
    afiliacion.precioPorVisita = dto.precio;
    await this.afiliaciones.save(afiliacion);
    return this.ver(idGimnasio);
  }

  /**
   * Cierre de mes: guarda lo que se le debe a cada gimnasio. Se puede
   * correr de nuevo mientras las liquidaciones sigan pendientes.
   */
  async cerrarMes(anio: number, mes: number) {
    const calculo = await calcularMes(this.afiliaciones.manager, anio, mes);
    let guardadas = 0;
    for (const g of calculo.gimnasios.values()) {
      const previa = await this.liquidaciones.findOne({ where: { idGimnasio: g.idGimnasio, anio, mes } });
      if (previa && previa.situacion === 'pagada') continue;
      await this.liquidaciones.save({
        ...(previa ? { id: previa.id } : {}),
        idGimnasio: g.idGimnasio,
        anio,
        mes,
        visitas: g.visitas,
        montoBruto: g.montoBruto,
        comision: g.recorte,
        montoNeto: g.montoNeto,
        situacion: 'pendiente',
      });
      guardadas++;
    }
    return { mensaje: `Cierre de ${mes}/${anio} listo`, liquidaciones: guardadas, totales: calculo.totales };
  }

  /** Cuanto cobro FITNEX, cuanto pago a gimnasios y cuanto le quedo. */
  async resumenFitnex(anio: number, mes: number) {
    const calculo = await calcularMes(this.afiliaciones.manager, anio, mes);
    const [pasarela] = await this.afiliaciones.manager.query(
      `SELECT COALESCE(SUM(monto * 0.036 + 3), 0) AS comision FROM pagos
       WHERE situacion = 'pagado' AND YEAR(pagado_en) = ? AND MONTH(pagado_en) = ?`,
      [anio, mes],
    );
    const gimnasios = await this.afiliaciones.manager.query('SELECT id, nombre FROM gimnasios');
    const nombre = new Map<number, string>(gimnasios.map((g: any) => [Number(g.id), g.nombre]));
    return {
      anio,
      mes,
      ...calculo.totales,
      comisionPasarela: Math.round(Number(pasarela.comision) * 100) / 100,
      gimnasios: [...calculo.gimnasios.values()]
        .map((g) => ({ ...g, gimnasio: nombre.get(g.idGimnasio) || `#${g.idGimnasio}` }))
        .sort((a, b) => b.montoNeto - a.montoNeto),
    };
  }

  async solicitarBaja(idGimnasio: number, dto: SolicitudBajaDto) {
    await this.vigente(idGimnasio);
    const yaHay = await this.solicitudesBaja.findOne({
      where: { idGimnasio, situacion: 'pendiente' },
    });
    if (yaHay) throw new BadRequestException('Ya tienes una solicitud de baja en revision');

    return this.solicitudesBaja.save(
      this.solicitudesBaja.create({
        idGimnasio,
        motivo: dto.motivo,
        comentario: dto.comentario,
        situacion: 'pendiente',
      }),
    );
  }

  async cancelarBaja(idGimnasio: number) {
    const solicitud = await this.solicitudesBaja.findOne({
      where: { idGimnasio, situacion: 'pendiente' },
      order: { creadoEn: 'DESC' },
    });
    if (!solicitud) throw new NotFoundException('No tienes ninguna solicitud de baja pendiente');
    solicitud.situacion = 'cancelada';
    solicitud.resueltoEn = new Date();
    await this.solicitudesBaja.save(solicitud);
    return { mensaje: 'Solicitud de baja cancelada' };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContratoGimnasio, Gimnasio, Liquidacion, SolicitudBaja, SolicitudPlan, TipoContrato,
} from '../entities';
import { SolicitudBajaDto, SolicitudPlanDto } from './contracts.dto';

/** Catalogo de planes que contrata el GIMNASIO con Gymred. */
const CATALOGO: Record<TipoContrato, { nombre: string; precio: string; nivel: number; beneficios: string[] }> = {
  basico: {
    nombre: 'Basico',
    precio: '$499/mes',
    nivel: 1,
    beneficios: ['Panel web', 'Historial de accesos', 'Un lector incluido'],
  },
  premium: {
    nombre: 'Premium',
    precio: '$999/mes',
    nivel: 2,
    beneficios: ['Panel web', 'Historial de accesos', 'Reportes avanzados', 'Soporte prioritario', 'Hasta 3 lectores'],
  },
  elite: {
    nombre: 'Elite',
    precio: 'Cotizacion',
    nivel: 3,
    beneficios: ['Todo lo de Premium', 'Multiples sucursales', 'Integracion personalizada', 'Lectores ilimitados'],
  },
};

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(ContratoGimnasio) private contratos: Repository<ContratoGimnasio>,
    @InjectRepository(SolicitudPlan) private solicitudesPlan: Repository<SolicitudPlan>,
    @InjectRepository(SolicitudBaja) private solicitudesBaja: Repository<SolicitudBaja>,
    @InjectRepository(Liquidacion) private liquidaciones: Repository<Liquidacion>,
    @InjectRepository(Gimnasio) private gimnasios: Repository<Gimnasio>,
  ) {}

  private async vigente(idGimnasio: number) {
    const contrato = await this.contratos.findOne({
      where: { idGimnasio, situacion: 'vigente' },
      order: { fechaInicio: 'DESC' },
    });
    if (!contrato) throw new NotFoundException('Este gimnasio no tiene contrato vigente');
    return contrato;
  }

  /** Pantalla "Mi plan Gymred". */
  async ver(idGimnasio: number) {
    const contrato = await this.vigente(idGimnasio);
    const pendiente = await this.solicitudesPlan.findOne({
      where: { idGimnasio, situacion: 'pendiente' },
      order: { creadoEn: 'DESC' },
    });
    const baja = await this.solicitudesBaja.findOne({
      where: { idGimnasio, situacion: 'pendiente' },
      order: { creadoEn: 'DESC' },
    });
    const liquidaciones = await this.liquidaciones.find({
      where: { idGimnasio },
      order: { anio: 'DESC', mes: 'DESC' },
      take: 6,
    });

    // Proximo vencimiento: el mismo dia del mes, a partir de hoy.
    const inicio = new Date(contrato.fechaInicio);
    const hoy = new Date();
    const proximo = new Date(hoy.getFullYear(), hoy.getMonth(), inicio.getDate());
    if (proximo < hoy) proximo.setMonth(proximo.getMonth() + 1);

    return {
      contrato: {
        id: contrato.id,
        tipo: contrato.tipo,
        nombre: CATALOGO[contrato.tipo].nombre,
        nivel: contrato.nivel,
        tarifaPorVisita: contrato.tarifaPorVisita,
        cuotaFijaMensual: contrato.cuotaFijaMensual,
        comisionPlataforma: contrato.comisionPlataforma,
        fechaInicio: contrato.fechaInicio,
        fechaFin: contrato.fechaFin,
        situacion: contrato.situacion,
      },
      planes: (Object.keys(CATALOGO) as TipoContrato[]).map((tipo) => ({
        tipo,
        nombre: CATALOGO[tipo].nombre,
        precio: CATALOGO[tipo].precio,
        nivel: CATALOGO[tipo].nivel,
        beneficios: CATALOGO[tipo].beneficios,
        actual: tipo === contrato.tipo,
      })),
      facturacion: {
        proximoVencimiento: proximo.toISOString().slice(0, 10),
        ciclo: 'Mensual',
        comision: `${contrato.comisionPlataforma}% por visita`,
        tarifaPorVisita: contrato.tarifaPorVisita,
      },
      liquidaciones,
      solicitudPendiente: pendiente || null,
      solicitudBaja: baja || null,
    };
  }

  async solicitarCambio(idGimnasio: number, dto: SolicitudPlanDto) {
    const contrato = await this.vigente(idGimnasio);
    if (contrato.tipo === dto.tipoSolicitado) {
      throw new BadRequestException('Ya tienes ese plan contratado');
    }
    const yaHay = await this.solicitudesPlan.findOne({
      where: { idGimnasio, situacion: 'pendiente' },
    });
    if (yaHay) throw new BadRequestException('Ya tienes una solicitud de cambio en revision');

    return this.solicitudesPlan.save(
      this.solicitudesPlan.create({
        idGimnasio,
        tipoActual: contrato.tipo,
        tipoSolicitado: dto.tipoSolicitado,
        mensaje: dto.mensaje,
        situacion: 'pendiente',
      }),
    );
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

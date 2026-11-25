import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Gimnasio, Pago, PlanPlataforma, Resena, Suscripcion } from '../entities';
import { ContratarPlanDto, ResenaDto } from './mobile.dto';
import { AccessService } from '../access/access.service';
import { clasificar } from '../common/tarifas';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class MobileService {
  constructor(
    @InjectRepository(PlanPlataforma) private planes: Repository<PlanPlataforma>,
    @InjectRepository(Suscripcion) private suscripciones: Repository<Suscripcion>,
    @InjectRepository(Pago) private pagos: Repository<Pago>,
    @InjectRepository(Resena) private resenas: Repository<Resena>,
    @InjectRepository(Gimnasio) private gimnasiosRepo: Repository<Gimnasio>,
    private dataSource: DataSource,
    private accesos: AccessService,
    private inventario_: InventoryService,
  ) {}

  planesDisponibles() {
    return this.planes.find({ where: { activo: true }, order: { precioMensual: 'ASC' } });
  }

  /** Catalogo de gimnasios afiliados, opcionalmente ordenado por cercania. */
  async gimnasios(f: { buscar?: string; categoria?: string; lat?: number; lng?: number }) {
    const params: any[] = [];
    let distancia = 'NULL';
    if (f.lat !== undefined && f.lng !== undefined) {
      // Distancia aproximada en km (suficiente para ordenar el listado).
      distancia = `ROUND(111.045 * SQRT(POW(g.latitud - ?, 2) + POW((g.longitud - ?) * COS(RADIANS(?)), 2)), 2)`;
      params.push(f.lat, f.lng, f.lat);
    }

    let sql = `
      SELECT g.id, g.nombre, g.descripcion, g.calle, g.colonia, g.ciudad, g.categoria,
             g.latitud, g.longitud,
             ${distancia} AS distancia_km,
             (SELECT url FROM fotos_gimnasio f WHERE f.id_gimnasio = g.id
              ORDER BY f.portada DESC, f.orden ASC LIMIT 1) AS foto,
             ROUND(COALESCE((SELECT AVG(calificacion) FROM resenas r WHERE r.id_gimnasio = g.id), 0), 1) AS calificacion
      FROM gimnasios g
      JOIN contratos_gimnasio c ON c.id_gimnasio = g.id AND c.situacion = 'vigente'
      WHERE g.situacion = 'activo'`;

    if (f.buscar) {
      sql += ` AND (g.nombre LIKE ? OR g.colonia LIKE ? OR g.ciudad LIKE ?)`;
      params.push(`%${f.buscar}%`, `%${f.buscar}%`, `%${f.buscar}%`);
    }
    if (f.categoria) {
      sql += ` AND g.categoria = ?`;
      params.push(f.categoria);
    }
    sql += f.lat !== undefined ? ` ORDER BY distancia_km IS NULL, distancia_km ASC` : ` ORDER BY g.nombre ASC`;

    // Cada gimnasio lleva su clase (Esencial o Plus) para que la app sepa
    // si el plan del socio lo incluye: plan.nivel >= nivel del gimnasio.
    const filas = await this.dataSource.query(sql, params);
    for (const g of filas) {
      const c = await clasificar(this.dataSource.manager, g.id);
      g.clase = c.clase;
      g.nivel = c.nivel;
    }
    return filas;
  }

  async gimnasio(id: number) {
    const gimnasio = await this.gimnasiosRepo.findOne({
      where: { id },
      relations: ['horarios', 'fotos', 'servicios', 'amenidades'],
    });
    if (!gimnasio) throw new NotFoundException('Ese gimnasio no existe');

    const resenas = await this.dataSource.query(
      `SELECT r.calificacion, r.comentario, r.creado_en, u.nombre AS cliente,
              r.respuesta, r.respondido_en
       FROM resenas r JOIN usuarios u ON u.id = r.id_cliente
       WHERE r.id_gimnasio = ? ORDER BY r.creado_en DESC LIMIT 10`,
      [id],
    );
    const [prom] = await this.dataSource.query(
      `SELECT ROUND(COALESCE(AVG(calificacion),0),1) AS calificacion, COUNT(*) AS total
       FROM resenas WHERE id_gimnasio = ?`,
      [id],
    );

    const c = await clasificar(this.dataSource.manager, id);
    return {
      ...gimnasio,
      clase: c.clase,
      nivel: c.nivel,
      calificacion: Number(prom.calificacion),
      totalResenas: Number(prom.total),
      resenas,
    };
  }

  async miSuscripcion(idCliente: number) {
    const hoy = new Date().toISOString().slice(0, 10);
    const suscripcion = await this.suscripciones
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.plan', 'p')
      .where('s.id_cliente = :c', { c: idCliente })
      .andWhere("s.situacion = 'activa'")
      .andWhere('s.fecha_fin >= :hoy', { hoy })
      .orderBy('s.fecha_fin', 'DESC')
      .getOne();

    if (!suscripcion) return { activa: false, suscripcion: null };

    // Se cuenta por DIA: 'mes' son los dias distintos con entrada y 'hoy'
    // es 1 si ya entro hoy (los reingresos no cuentan).
    const [visitas] = await this.dataSource.query(
      `SELECT
         MAX(DATE(registrado_en)=CURDATE()) AS hoy,
         COUNT(DISTINCT CASE WHEN MONTH(registrado_en)=MONTH(CURDATE())
               AND YEAR(registrado_en)=YEAR(CURDATE()) THEN DATE(registrado_en) END) AS mes
       FROM accesos WHERE id_cliente = ? AND resultado='permitido'`,
      [idCliente],
    );

    return {
      activa: true,
      suscripcion: {
        id: suscripcion.id,
        plan: suscripcion.plan,
        fechaInicio: suscripcion.fechaInicio,
        fechaFin: suscripcion.fechaFin,
        visitasHoy: Number(visitas.hoy || 0),
        visitasMes: Number(visitas.mes || 0),
        // Siempre se puede escanear mientras queden dias en el mes: si ya
        // entro hoy, el escaneo cuenta como reingreso al mismo gimnasio.
        visitasRestantesHoy:
          Number(visitas.hoy || 0) > 0 ||
          !suscripcion.plan.visitasPorMes ||
          Number(visitas.mes || 0) < suscripcion.plan.visitasPorMes
            ? 1
            : 0,
        // null = sin tope al mes
        visitasRestantesMes: suscripcion.plan.visitasPorMes
          ? Math.max(0, suscripcion.plan.visitasPorMes - Number(visitas.mes || 0))
          : null,
      },
    };
  }

  /** Ocupacion del gimnasio. Es una funcion del plan Plus. */
  async ocupacion(idCliente: number, idGimnasio: number) {
    const { suscripcion } = await this.miSuscripcion(idCliente);
    if (!suscripcion || suscripcion.plan.nivel < 2) {
      throw new ForbiddenException('La ocupacion en vivo es parte del plan Plus');
    }
    const o = await this.accesos.ocupacion(idGimnasio);
    return {
      dentroAhora: o.dentroAhora,
      capacidadMaxima: o.capacidadMaxima,
      porcentaje: o.porcentaje,
      nivel: o.nivel,
      horaPico: o.horaPico,
      porHora: o.porHora,
    };
  }

  /** Contrata un plan por 30 dias y registra el pago. */
  async contratar(idCliente: number, dto: ContratarPlanDto) {
    const plan = await this.planes.findOne({ where: { id: dto.idPlan, activo: true } });
    if (!plan) throw new NotFoundException('Ese plan no existe');

    return this.dataSource.transaction(async (m) => {
      await m.query(
        `UPDATE suscripciones SET situacion='cancelada'
         WHERE id_cliente = ? AND situacion='activa'`,
        [idCliente],
      );

      const inicio = new Date();
      const fin = new Date();
      fin.setDate(fin.getDate() + 30);

      const suscripcion = await m.save(
        m.create(Suscripcion, {
          idCliente,
          idPlan: plan.id,
          fechaInicio: inicio.toISOString().slice(0, 10),
          fechaFin: fin.toISOString().slice(0, 10),
          situacion: 'activa',
          renovacionAutomatica: true,
        }),
      );

      await m.save(
        m.create(Pago, {
          idSuscripcion: suscripcion.id,
          monto: plan.precioMensual,
          metodo: (dto.metodo as any) || 'tarjeta',
          referencia: `FP-${Date.now()}`,
          situacion: 'pagado',
        }),
      );

      return { mensaje: `Plan ${plan.nombre} activado`, suscripcion };
    });
  }

  /** Entrada del socio: escanea la pantalla del gimnasio. */
  entrar(idCliente: number, codigo: string) {
    return this.accesos.entrar(idCliente, codigo);
  }

  /** Que equipo y actividades hay disponibles en ese gimnasio. */
  inventario(idGimnasio: number) {
    return this.inventario_.paraSocio(idGimnasio);
  }

  historial(idCliente: number) {
    return this.dataSource.query(
      `SELECT a.registrado_en, a.resultado, a.motivo, g.nombre AS gimnasio
       FROM accesos a JOIN gimnasios g ON g.id = a.id_gimnasio
       WHERE a.id_cliente = ? ORDER BY a.registrado_en DESC LIMIT 50`,
      [idCliente],
    );
  }

  async resena(idCliente: number, idGimnasio: number, dto: ResenaDto) {
    const visito = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM accesos
       WHERE id_cliente = ? AND id_gimnasio = ? AND resultado='permitido'`,
      [idCliente, idGimnasio],
    );
    if (Number(visito[0].n) === 0) {
      throw new BadRequestException('Solo puedes calificar gimnasios que ya visitaste');
    }

    const existente = await this.resenas.findOne({ where: { idCliente, idGimnasio } });
    if (existente) {
      existente.calificacion = dto.calificacion;
      existente.comentario = dto.comentario;
      return this.resenas.save(existente);
    }
    return this.resenas.save(
      this.resenas.create({
        idCliente,
        idGimnasio,
        calificacion: dto.calificacion,
        comentario: dto.comentario,
      }),
    );
  }
}

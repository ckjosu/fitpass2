import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Acceso, ContratoGimnasio, Gimnasio, Lector, PlanPlataforma, Suscripcion,
} from '../entities';
import { FiltroHistorialDto } from './access.dto';

interface Respuesta {
  permitido: boolean;
  motivo?: string;
  cliente?: string;
  gimnasio?: string;
  plan?: string;
  visitasRestantesHoy?: number;
}

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(Acceso) private accesos: Repository<Acceso>,
    @InjectRepository(Lector) private lectores: Repository<Lector>,
    @InjectRepository(Suscripcion) private suscripciones: Repository<Suscripcion>,
    @InjectRepository(PlanPlataforma) private planes: Repository<PlanPlataforma>,
    @InjectRepository(Gimnasio) private gimnasios: Repository<Gimnasio>,
    @InjectRepository(ContratoGimnasio) private contratos: Repository<ContratoGimnasio>,
  ) {}

  private async registrar(
    idGimnasio: number,
    idLector: number,
    codigo: string,
    resultado: 'permitido' | 'denegado',
    motivo?: string,
    idCliente?: number,
  ) {
    await this.accesos.save(
      this.accesos.create({
        idGimnasio,
        idLector,
        idCliente: idCliente ?? null,
        codigoLeido: codigo,
        resultado,
        motivo: motivo ?? null,
      }),
    );
  }

  /**
   * Entrada del socio. La app movil escanea el QR que muestra la pantalla
   * de la entrada y manda ese codigo aqui junto con su sesion.
   * Todo intento queda en la bitacora, se permita o no.
   */
  async entrar(idCliente: number, codigoLeido: string): Promise<Respuesta> {
    const codigo = codigoLeido.trim();

    // 1. El codigo tiene que ser de una pantalla real
    const pantalla = await this.lectores.findOne({ where: { codigoActual: codigo } });
    if (!pantalla || !pantalla.activo) {
      return { permitido: false, motivo: 'Ese codigo no es de ninguna pantalla de acceso' };
    }

    const gym = pantalla.idGimnasio;

    // 2. Y no debe estar vencido: la pantalla lo rota cada pocos segundos
    if (!pantalla.codigoVenceEn || pantalla.codigoVenceEn < new Date()) {
      await this.registrar(gym, pantalla.id, codigo, 'denegado',
        'El codigo de la pantalla ya vencio', idCliente);
      return { permitido: false, motivo: 'El codigo ya vencio, vuelve a escanear la pantalla' };
    }

    // 3. Suscripcion vigente
    const hoy = new Date().toISOString().slice(0, 10);
    const suscripcion = await this.suscripciones
      .createQueryBuilder('s')
      .where('s.id_cliente = :c', { c: idCliente })
      .andWhere("s.situacion = 'activa'")
      .andWhere('s.fecha_fin >= :hoy', { hoy })
      .orderBy('s.fecha_fin', 'DESC')
      .getOne();

    if (!suscripcion) {
      await this.registrar(gym, pantalla.id, codigo, 'denegado', 'Sin suscripcion vigente', idCliente);
      return { permitido: false, motivo: 'Sin suscripcion vigente' };
    }

    const plan = await this.planes.findOne({ where: { id: suscripcion.idPlan } });
    const contrato = await this.contratos.findOne({
      where: { idGimnasio: gym, situacion: 'vigente' },
    });

    // 4. El nivel del plan debe alcanzar el nivel del gimnasio
    if (contrato && plan.nivel < contrato.nivel) {
      await this.registrar(gym, pantalla.id, codigo, 'denegado',
        'Tu plan no incluye este gimnasio', idCliente);
      return { permitido: false, motivo: 'Tu plan no incluye este gimnasio', plan: plan.nombre };
    }

    // 5. Limite de visitas por dia
    const visitasHoy = await this.accesos
      .createQueryBuilder('a')
      .where('a.id_cliente = :c', { c: idCliente })
      .andWhere("a.resultado = 'permitido'")
      .andWhere('DATE(a.registrado_en) = CURDATE()')
      .getCount();

    if (visitasHoy >= plan.visitasPorDia) {
      const motivo =
        plan.visitasPorDia === 1
          ? 'Ya registraste tu visita de hoy'
          : 'Alcanzaste tus visitas de hoy';
      await this.registrar(gym, pantalla.id, codigo, 'denegado', motivo, idCliente);
      return { permitido: false, motivo, plan: plan.nombre };
    }

    // 6. Limite de visitas por mes (si el plan lo tiene)
    if (plan.visitasPorMes) {
      const visitasMes = await this.accesos
        .createQueryBuilder('a')
        .where('a.id_cliente = :c', { c: idCliente })
        .andWhere("a.resultado = 'permitido'")
        .andWhere('MONTH(a.registrado_en) = MONTH(CURDATE())')
        .andWhere('YEAR(a.registrado_en) = YEAR(CURDATE())')
        .getCount();

      if (visitasMes >= plan.visitasPorMes) {
        await this.registrar(gym, pantalla.id, codigo, 'denegado',
          'Alcanzaste el limite de visitas del mes', idCliente);
        return { permitido: false, motivo: 'Alcanzaste el limite de visitas del mes', plan: plan.nombre };
      }
    }

    // 7. Pase
    await this.registrar(gym, pantalla.id, codigo, 'permitido', null, idCliente);

    const gimnasio = await this.gimnasios.findOne({ where: { id: gym } });
    const cliente = await this.accesos.manager.query(
      'SELECT nombre FROM usuarios WHERE id = ?',
      [idCliente],
    );

    return {
      permitido: true,
      cliente: cliente[0]?.nombre,
      gimnasio: gimnasio?.nombre,
      plan: plan.nombre,
      visitasRestantesHoy: plan.visitasPorDia - (visitasHoy + 1),
    };
  }

  /** Cifras y grafica del dashboard. */
  async resumen(idGimnasio: number) {
    const gimnasio = await this.gimnasios.findOne({ where: { id: idGimnasio } });
    const contrato = await this.contratos.findOne({
      where: { idGimnasio, situacion: 'vigente' },
    });

    const [conteos] = await this.accesos.manager.query(
      `SELECT
         SUM(resultado='permitido' AND DATE(registrado_en)=CURDATE())              AS accesos_hoy,
         SUM(resultado='denegado'  AND DATE(registrado_en)=CURDATE())              AS denegados_hoy,
         SUM(resultado='permitido' AND MONTH(registrado_en)=MONTH(CURDATE())
             AND YEAR(registrado_en)=YEAR(CURDATE()))                              AS accesos_mes,
         COUNT(DISTINCT CASE WHEN resultado='permitido'
               AND MONTH(registrado_en)=MONTH(CURDATE())
               AND YEAR(registrado_en)=YEAR(CURDATE()) THEN id_cliente END)        AS clientes_mes
       FROM accesos WHERE id_gimnasio = ?`,
      [idGimnasio],
    );

    const porHora = await this.accesos.manager.query(
      `SELECT HOUR(registrado_en) AS hora, COUNT(*) AS visitas
       FROM accesos
       WHERE id_gimnasio = ? AND resultado='permitido' AND DATE(registrado_en)=CURDATE()
       GROUP BY HOUR(registrado_en) ORDER BY hora`,
      [idGimnasio],
    );

    const ultimos = await this.accesos.manager.query(
      `SELECT a.id, a.registrado_en, a.resultado, a.motivo, a.codigo_leido,
              u.nombre AS cliente, l.numero_serie AS lector
       FROM accesos a
       LEFT JOIN usuarios u ON u.id = a.id_cliente
       LEFT JOIN lectores l ON l.id = a.id_lector
       WHERE a.id_gimnasio = ?
       ORDER BY a.registrado_en DESC LIMIT 8`,
      [idGimnasio],
    );

    const lectores = await this.lectores.find({ where: { idGimnasio } });

    const accesosMes = Number(conteos.accesos_mes || 0);
    const tarifa = contrato ? Number(contrato.tarifaPorVisita) : 0;
    const cuota = contrato ? Number(contrato.cuotaFijaMensual) : 0;
    const comision = contrato ? Number(contrato.comisionPlataforma) : 0;
    const bruto = accesosMes * tarifa + cuota;

    return {
      gimnasio: { id: gimnasio.id, nombre: gimnasio.nombre, situacion: gimnasio.situacion },
      accesosHoy: Number(conteos.accesos_hoy || 0),
      denegadosHoy: Number(conteos.denegados_hoy || 0),
      accesosMes,
      clientesMes: Number(conteos.clientes_mes || 0),
      ingresoEstimadoMes: Number((bruto - (bruto * comision) / 100).toFixed(2)),
      contrato: contrato
        ? { tipo: contrato.tipo, tarifaPorVisita: tarifa, comision }
        : null,
      porHora: porHora.map((r: any) => ({ hora: Number(r.hora), visitas: Number(r.visitas) })),
      ultimosAccesos: ultimos,
      lectores: lectores.map((l) => ({
        numeroSerie: l.numeroSerie,
        ubicacion: l.ubicacion,
        activo: l.activo,
        ultimaConexion: l.ultimaConexion,
      })),
    };
  }

  /** Historial con filtros y paginacion. */
  async historial(idGimnasio: number, f: FiltroHistorialDto) {
    const pagina = Number(f.pagina) > 0 ? Number(f.pagina) : 1;
    const porPagina = Number(f.porPagina) > 0 ? Math.min(Number(f.porPagina), 100) : 15;

    const qb = this.accesos
      .createQueryBuilder('a')
      .leftJoin('a.cliente', 'u')
      .select([
        'a.id AS id',
        'a.registrado_en AS registradoEn',
        'a.resultado AS resultado',
        'a.motivo AS motivo',
        'a.codigo_leido AS codigoLeido',
        'u.nombre AS cliente',
      ])
      .where('a.id_gimnasio = :g', { g: idGimnasio });

    if (f.desde) qb.andWhere('DATE(a.registrado_en) >= :desde', { desde: f.desde });
    if (f.hasta) qb.andWhere('DATE(a.registrado_en) <= :hasta', { hasta: f.hasta });
    if (f.resultado) qb.andWhere('a.resultado = :r', { r: f.resultado });
    if (f.buscar) qb.andWhere('(u.nombre LIKE :b OR a.codigo_leido LIKE :b)', { b: `%${f.buscar}%` });

    const total = await qb.getCount();
    const filas = await qb
      .orderBy('a.registrado_en', 'DESC')
      .limit(porPagina)
      .offset((pagina - 1) * porPagina)
      .getRawMany();

    return {
      total,
      pagina,
      porPagina,
      paginas: Math.max(1, Math.ceil(total / porPagina)),
      filas,
    };
  }

  /** Pantalla de reportes. */
  async reportes(idGimnasio: number, meses = 6) {
    const porMes = await this.accesos.manager.query(
      `SELECT DATE_FORMAT(registrado_en,'%Y-%m') AS periodo,
              SUM(resultado='permitido') AS permitidos,
              SUM(resultado='denegado')  AS denegados
       FROM accesos
       WHERE id_gimnasio = ? AND registrado_en >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY periodo ORDER BY periodo`,
      [idGimnasio, meses],
    );

    const porDiaSemana = await this.accesos.manager.query(
      `SELECT DAYOFWEEK(registrado_en) AS dia, COUNT(*) AS visitas
       FROM accesos
       WHERE id_gimnasio = ? AND resultado='permitido'
         AND registrado_en >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
       GROUP BY dia ORDER BY dia`,
      [idGimnasio],
    );

    const topClientes = await this.accesos.manager.query(
      `SELECT u.nombre AS cliente, COUNT(*) AS visitas
       FROM accesos a JOIN usuarios u ON u.id = a.id_cliente
       WHERE a.id_gimnasio = ? AND a.resultado='permitido'
         AND a.registrado_en >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
       GROUP BY u.id, u.nombre ORDER BY visitas DESC LIMIT 5`,
      [idGimnasio],
    );

    const motivos = await this.accesos.manager.query(
      `SELECT motivo, COUNT(*) AS veces
       FROM accesos
       WHERE id_gimnasio = ? AND resultado='denegado' AND motivo IS NOT NULL
         AND registrado_en >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
       GROUP BY motivo ORDER BY veces DESC`,
      [idGimnasio],
    );

    const nombres = ['', 'Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

    return {
      porMes: porMes.map((r: any) => ({
        periodo: r.periodo,
        permitidos: Number(r.permitidos),
        denegados: Number(r.denegados),
      })),
      porDiaSemana: porDiaSemana.map((r: any) => ({
        dia: nombres[Number(r.dia)],
        visitas: Number(r.visitas),
      })),
      topClientes: topClientes.map((r: any) => ({ cliente: r.cliente, visitas: Number(r.visitas) })),
      motivosDenegacion: motivos.map((r: any) => ({ motivo: r.motivo, veces: Number(r.veces) })),
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Acceso, ContratoGimnasio, Gimnasio, Lector, PlanPlataforma, Suscripcion,
} from '../entities';
import { FiltroHistorialDto } from './access.dto';
import { clasificar, pagoDelGimnasio, pagoPorVisita } from '../common/tarifas';

/** Minutos que se queda en promedio un socio; sirve para estimar quien sigue dentro. */
export const ESTANCIA_MINUTOS = 90;

interface Respuesta {
  permitido: boolean;
  motivo?: string;
  cliente?: string;
  gimnasio?: string;
  plan?: string;
  visitasRestantesHoy?: number;
  /** Dias que le quedan al socio este mes (null = sin limite). */
  diasRestantesMes?: number | null;
  /** true si ya habia entrado hoy a este gimnasio y solo volvio a pasar. */
  reingreso?: boolean;
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
    resultado: 'permitido' | 'denegado' | 'reingreso',
    motivo?: string,
    idCliente?: number,
    pago?: number,
  ) {
    await this.accesos.save(
      this.accesos.create({
        idGimnasio,
        idLector,
        idCliente: idCliente ?? null,
        codigoLeido: codigo,
        resultado,
        motivo: motivo ?? null,
        pagoGimnasio: pago ?? null,
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

    // 4. El gimnasio debe seguir afiliado
    const afiliado = await this.contratos.findOne({
      where: { idGimnasio: gym, situacion: 'vigente' },
    });
    if (!afiliado) {
      await this.registrar(gym, pantalla.id, codigo, 'denegado',
        'Este gimnasio ya no esta afiliado', idCliente);
      return { permitido: false, motivo: 'Este gimnasio ya no esta afiliado', plan: plan.nombre };
    }

    // 4.1 El plan tiene que incluir este gimnasio:
    //     Esencial -> gimnasios Esencial
    //     Plus     -> Esencial y Completo
    const clase = await clasificar(this.accesos.manager, gym);
    if (plan.nivel < clase.nivel) {
      const motivo = `Tu plan ${plan.nombre} no incluye gimnasios ${clase.clase}`;
      await this.registrar(gym, pantalla.id, codigo, 'denegado', motivo, idCliente);
      return { permitido: false, motivo, plan: plan.nombre };
    }

    // 5. Un gimnasio por dia, con reingresos libres.
    //    Si hoy ya entro a ESTE gimnasio, puede salir y volver a entrar las
    //    veces que quiera: se guarda como 'reingreso' y no gasta otro dia
    //    ni se le vuelve a pagar al gimnasio.
    //    Si hoy ya entro a OTRO gimnasio, se le niega: un gimnasio por dia.
    const entradaDeHoy = await this.accesos
      .createQueryBuilder('a')
      .where('a.id_cliente = :c', { c: idCliente })
      .andWhere("a.resultado = 'permitido'")
      .andWhere('DATE(a.registrado_en) = CURDATE()')
      .orderBy('a.registrado_en', 'ASC')
      .getOne();

    const diasUsados = await this.diasUsadosDelMes(idCliente);
    const diasRestantesMes = plan.visitasPorMes
      ? Math.max(0, plan.visitasPorMes - diasUsados)
      : null;

    if (entradaDeHoy) {
      if (entradaDeHoy.idGimnasio !== gym) {
        const otro = await this.gimnasios.findOne({ where: { id: entradaDeHoy.idGimnasio } });
        const motivo = `Hoy ya usaste tu dia en ${otro?.nombre || 'otro gimnasio'}`;
        await this.registrar(gym, pantalla.id, codigo, 'denegado', motivo, idCliente);
        return { permitido: false, motivo, plan: plan.nombre };
      }

      await this.registrar(gym, pantalla.id, codigo, 'reingreso', null, idCliente);
      const gimnasioHoy = await this.gimnasios.findOne({ where: { id: gym } });
      const clienteHoy = await this.accesos.manager.query('SELECT nombre FROM usuarios WHERE id = ?', [idCliente]);
      return {
        permitido: true,
        reingreso: true,
        cliente: clienteHoy[0]?.nombre,
        gimnasio: gimnasioHoy?.nombre,
        plan: plan.nombre,
        visitasRestantesHoy: 0,
        diasRestantesMes,
      };
    }

    // 6. Dias del mes segun el plan (Esencial 15, Plus 30)
    if (plan.visitasPorMes && diasUsados >= plan.visitasPorMes) {
      const motivo = `Ya usaste tus ${plan.visitasPorMes} dias del mes`;
      await this.registrar(gym, pantalla.id, codigo, 'denegado', motivo, idCliente);
      return { permitido: false, motivo, plan: plan.nombre };
    }

    // 7. Pase. Se guarda lo que vale esta visita para el gimnasio: su precio
    //    sin pasar el tope de su categoria. Al cierre del mes se revisa que
    //    el socio no pase su fondo.
    const pago = pagoPorVisita(afiliado.precioPorVisita, clase.tope);
    await this.registrar(gym, pantalla.id, codigo, 'permitido', null, idCliente, pago);

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
      visitasRestantesHoy: 0,
      diasRestantesMes: diasRestantesMes === null ? null : diasRestantesMes - 1,
    };
  }

  /** Dias distintos del mes en que el socio entro a algun gimnasio. */
  private async diasUsadosDelMes(idCliente: number): Promise<number> {
    const [fila] = await this.accesos.manager.query(
      `SELECT COUNT(DISTINCT DATE(registrado_en)) AS dias
       FROM accesos
       WHERE id_cliente = ? AND resultado = 'permitido'
         AND MONTH(registrado_en) = MONTH(CURDATE())
         AND YEAR(registrado_en) = YEAR(CURDATE())`,
      [idCliente],
    );
    return Number(fila?.dias || 0);
  }

  /** Cifras y grafica del dashboard. */
  async resumen(idGimnasio: number) {
    const gimnasio = await this.gimnasios.findOne({ where: { id: idGimnasio } });
    const afiliacion = await this.contratos.findOne({
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
    const hoy = new Date();
    const precio = afiliacion ? afiliacion.precioPorVisita : null;
    const clase = await clasificar(this.accesos.manager, idGimnasio);
    const ganancia = await pagoDelGimnasio(
      this.accesos.manager, idGimnasio, hoy.getFullYear(), hoy.getMonth() + 1,
    );

    return {
      gimnasio: { id: gimnasio.id, nombre: gimnasio.nombre, situacion: gimnasio.situacion },
      accesosHoy: Number(conteos.accesos_hoy || 0),
      denegadosHoy: Number(conteos.denegados_hoy || 0),
      accesosMes,
      clientesMes: Number(conteos.clientes_mes || 0),
      // Lo que Gymred le debe al gimnasio por las visitas del mes.
      ingresoEstimadoMes: ganancia.montoNeto,
      pagoPorVisita: pagoPorVisita(precio, clase.tope),
      precioPorVisita: precio,
      clase: clase.clase,
      sociosNuevosMes: ganancia.sociosNuevos,
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

  /**
   * Ocupacion y aforo. No hay registro de salida, asi que "dentro ahora"
   * son las entradas de los ultimos ESTANCIA_MINUTOS minutos.
   */
  async ocupacion(idGimnasio: number) {
    const gimnasio = await this.gimnasios.findOne({ where: { id: idGimnasio } });

    const [ahora] = await this.accesos.manager.query(
      `SELECT COUNT(*) AS dentro FROM accesos
       WHERE id_gimnasio = ? AND resultado = 'permitido'
         AND registrado_en >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [idGimnasio, ESTANCIA_MINUTOS],
    );

    // Promedio de entradas por hora del mismo dia de la semana, ultimas 8 semanas.
    const porHora = await this.accesos.manager.query(
      `SELECT HOUR(registrado_en) AS hora,
              COUNT(*) / COUNT(DISTINCT DATE(registrado_en)) AS promedio
       FROM accesos
       WHERE id_gimnasio = ? AND resultado = 'permitido'
         AND DAYOFWEEK(registrado_en) = DAYOFWEEK(CURDATE())
         AND registrado_en >= DATE_SUB(CURDATE(), INTERVAL 56 DAY)
       GROUP BY HOUR(registrado_en) ORDER BY hora`,
      [idGimnasio],
    );

    const [hoy] = await this.accesos.manager.query(
      `SELECT COUNT(*) AS entradas FROM accesos
       WHERE id_gimnasio = ? AND resultado = 'permitido' AND DATE(registrado_en) = CURDATE()`,
      [idGimnasio],
    );

    const capacidad = gimnasio?.capacidadMaxima || null;
    const dentro = Number(ahora.dentro || 0);
    const porcentaje = capacidad ? Math.min(100, Math.round((dentro / capacidad) * 100)) : null;
    const horas = porHora.map((r: any) => ({ hora: Number(r.hora), promedio: Number(Number(r.promedio).toFixed(1)) }));
    const pico = horas.reduce((a: any, b: any) => (!a || b.promedio > a.promedio ? b : a), null);

    return {
      capacidadMaxima: capacidad,
      dentroAhora: dentro,
      porcentaje,
      nivel: porcentaje === null ? 'sin_dato' : porcentaje < 40 ? 'tranquilo' : porcentaje < 75 ? 'moderado' : 'lleno',
      estanciaMinutos: ESTANCIA_MINUTOS,
      entradasHoy: Number(hoy.entradas || 0),
      horaPico: pico ? pico.hora : null,
      porHora: horas,
    };
  }

  async guardarCapacidad(idGimnasio: number, capacidad: number) {
    await this.gimnasios.update({ id: idGimnasio }, { capacidadMaxima: capacidad });
    return this.ocupacion(idGimnasio);
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

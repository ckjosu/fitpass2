import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CatalogoEquipo, ClaseGimnasio, HorarioClase, ReservaClase } from '../entities';
import { ClaseDto, HorarioClaseDto } from './classes.dto';
import { ahoraLocal, diaSemana, sumarDias } from '../common/fechas';
import { clasificar } from '../common/tarifas';

/** Dias hacia adelante que se pueden ver y reservar. */
export const DIAS_RESERVA = 7;

const DIAS = ['', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export interface Sesion {
  idHorario: number;
  idClase: number;
  clase: string;
  instructor: string | null;
  fecha: string;
  dia: string;
  horaInicio: string;
  duracionMin: number;
  cupo: number;
  inscritos: number;
  lugares: number;
}

/**
 * Clases del gimnasio.
 * El dueno arma sus clases con horario semanal y cupo. Los socios Gymred
 * reservan su lugar desde la app, sin pasar el cupo.
 */
@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClaseGimnasio) private clases: Repository<ClaseGimnasio>,
    @InjectRepository(HorarioClase) private horarios: Repository<HorarioClase>,
    @InjectRepository(ReservaClase) private reservas: Repository<ReservaClase>,
    @InjectRepository(CatalogoEquipo) private catalogo: Repository<CatalogoEquipo>,
    private dataSource: DataSource,
  ) {}

  // ------------------------------------------------------------------
  // Panel del dueno
  // ------------------------------------------------------------------

  /** Clases con su horario y las sesiones de los proximos dias. */
  async lista(idGimnasio: number) {
    const clases = await this.clases.find({
      where: { idGimnasio },
      relations: ['horarios'],
      order: { nombre: 'ASC' },
    });
    clases.forEach((c) =>
      c.horarios.sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio)),
    );

    const sesiones = await this.sesiones(idGimnasio, DIAS_RESERVA);
    const hoy = ahoraLocal().fecha;
    const deHoy = sesiones.filter((s) => s.fecha === hoy);

    return {
      resumen: {
        clasesActivas: clases.filter((c) => c.activa).length,
        sesionesSemana: sesiones.length,
        reservasSemana: sesiones.reduce((t, s) => t + s.inscritos, 0),
        sesionesHoy: deHoy.length,
        ocupacionPromedio: sesiones.length
          ? Math.round((sesiones.reduce((t, s) => t + s.inscritos / s.cupo, 0) / sesiones.length) * 100)
          : 0,
      },
      clases,
      sesiones,
    };
  }

  /** Sesiones (horario + fecha) desde hoy, con lugares ocupados. */
  async sesiones(idGimnasio: number, dias = DIAS_RESERVA, incluirPasadasDeHoy = false): Promise<Sesion[]> {
    const ahora = ahoraLocal();
    const hasta = sumarDias(ahora.fecha, dias - 1);

    const horarios = await this.dataSource.query(
      `SELECT h.id AS idHorario, h.dia_semana AS diaSemana, h.hora_inicio AS horaInicio,
              c.id AS idClase, c.nombre AS clase, c.instructor, c.duracion_min AS duracionMin, c.cupo
       FROM clases_horario h JOIN clases_gimnasio c ON c.id = h.id_clase
       WHERE c.id_gimnasio = ? AND c.activa = 1`,
      [idGimnasio],
    );
    if (horarios.length === 0) return [];

    const ocupados = await this.dataSource.query(
      `SELECT r.id_horario AS idHorario, DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha, COUNT(*) AS total
       FROM reservas_clase r JOIN clases_horario h ON h.id = r.id_horario
       JOIN clases_gimnasio c ON c.id = h.id_clase
       WHERE c.id_gimnasio = ? AND r.situacion = 'reservada' AND r.fecha BETWEEN ? AND ?
       GROUP BY r.id_horario, r.fecha`,
      [idGimnasio, ahora.fecha, hasta],
    );
    const mapa = new Map<string, number>(ocupados.map((o: any) => [`${o.idHorario}|${o.fecha}`, Number(o.total)]));

    const salida: Sesion[] = [];
    for (let i = 0; i < dias; i++) {
      const fecha = sumarDias(ahora.fecha, i);
      const dia = diaSemana(fecha);
      for (const h of horarios) {
        if (Number(h.diaSemana) !== dia) continue;
        if (i === 0 && !incluirPasadasDeHoy && h.horaInicio <= ahora.hora) continue;
        const inscritos = mapa.get(`${h.idHorario}|${fecha}`) || 0;
        salida.push({
          idHorario: Number(h.idHorario),
          idClase: Number(h.idClase),
          clase: h.clase,
          instructor: h.instructor,
          fecha,
          dia: DIAS[dia],
          horaInicio: String(h.horaInicio).slice(0, 5),
          duracionMin: Number(h.duracionMin),
          cupo: Number(h.cupo),
          inscritos,
          lugares: Math.max(0, Number(h.cupo) - inscritos),
        });
      }
    }
    return salida.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio));
  }

  /** Quien reservo una sesion. */
  async inscritos(idGimnasio: number, idHorario: number, fecha: string) {
    await this.horarioDelGimnasio(idGimnasio, idHorario);
    return this.dataSource.query(
      `SELECT r.id, u.nombre AS cliente, r.creado_en AS reservadoEn
       FROM reservas_clase r JOIN usuarios u ON u.id = r.id_cliente
       WHERE r.id_horario = ? AND r.fecha = ? AND r.situacion = 'reservada'
       ORDER BY r.creado_en`,
      [idHorario, fecha],
    );
  }

  async crear(idGimnasio: number, dto: ClaseDto) {
    const nombre = await this.nombreDeClase(dto);
    await this.revisarNombreLibre(idGimnasio, nombre);

    return this.dataSource.transaction(async (m) => {
      const clase = await m.save(
        m.create(ClaseGimnasio, {
          idGimnasio,
          idCatalogo: dto.idCatalogo ?? null,
          nombre,
          instructor: dto.instructor || null,
          descripcion: dto.descripcion || null,
          duracionMin: dto.duracionMin,
          cupo: dto.cupo,
          activa: dto.activa ?? true,
        }),
      );
      for (const h of this.sinRepetir(dto.horarios)) {
        await m.save(m.create(HorarioClase, { idClase: clase.id, diaSemana: h.diaSemana, horaInicio: h.horaInicio }));
      }
      return { mensaje: 'Clase creada', id: clase.id };
    });
  }

  async actualizar(idGimnasio: number, id: number, dto: ClaseDto) {
    const clase = await this.claseDelGimnasio(idGimnasio, id);
    const nombre = await this.nombreDeClase(dto);
    if (nombre.toLowerCase() !== clase.nombre.toLowerCase()) await this.revisarNombreLibre(idGimnasio, nombre, id);

    const nuevos = this.sinRepetir(dto.horarios);
    const clave = (d: number, h: string) => `${d}|${h.slice(0, 5)}`;
    const quedan = new Set(nuevos.map((h) => clave(h.diaSemana, h.horaInicio)));
    const quitar = clase.horarios.filter((h) => !quedan.has(clave(h.diaSemana, h.horaInicio)));
    const existentes = new Set(clase.horarios.map((h) => clave(h.diaSemana, h.horaInicio)));

    // No se borra un horario si alguien ya aparto lugar en una sesion futura.
    if (quitar.length) {
      const [r] = await this.dataSource.query(
        `SELECT COUNT(*) AS total FROM reservas_clase
         WHERE id_horario IN (?) AND situacion = 'reservada' AND fecha >= ?`,
        [quitar.map((h) => h.id), ahoraLocal().fecha],
      );
      if (Number(r.total) > 0) {
        throw new ConflictException(
          `Hay ${r.total} ${Number(r.total) === 1 ? 'reserva' : 'reservas'} en los horarios que quitaste. ` +
            'Desactiva la clase o espera a que pasen esas sesiones.',
        );
      }
    }

    // Si se baja el cupo, que no quede por debajo de lo ya reservado.
    if (dto.cupo < clase.cupo) {
      const [max] = await this.dataSource.query(
        `SELECT COALESCE(MAX(t.total), 0) AS maximo FROM (
           SELECT COUNT(*) AS total FROM reservas_clase r JOIN clases_horario h ON h.id = r.id_horario
           WHERE h.id_clase = ? AND r.situacion = 'reservada' AND r.fecha >= ?
           GROUP BY r.id_horario, r.fecha) t`,
        [id, ahoraLocal().fecha],
      );
      if (dto.cupo < Number(max.maximo)) {
        throw new ConflictException(`Ya hay ${max.maximo} socios en una sesion; el cupo no puede ser menor.`);
      }
    }

    return this.dataSource.transaction(async (m) => {
      Object.assign(clase, {
        idCatalogo: dto.idCatalogo ?? null,
        nombre,
        instructor: dto.instructor || null,
        descripcion: dto.descripcion || null,
        duracionMin: dto.duracionMin,
        cupo: dto.cupo,
        activa: dto.activa ?? clase.activa,
      });
      const { horarios, ...datos } = clase;
      await m.update(ClaseGimnasio, { id }, datos);
      if (quitar.length) await m.delete(HorarioClase, quitar.map((h) => h.id));
      for (const h of nuevos) {
        if (!existentes.has(clave(h.diaSemana, h.horaInicio))) {
          await m.save(m.create(HorarioClase, { idClase: id, diaSemana: h.diaSemana, horaInicio: h.horaInicio }));
        }
      }
      return { mensaje: 'Clase actualizada', id };
    });
  }

  async borrar(idGimnasio: number, id: number) {
    await this.claseDelGimnasio(idGimnasio, id);
    const [r] = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM reservas_clase rc JOIN clases_horario h ON h.id = rc.id_horario
       WHERE h.id_clase = ? AND rc.situacion = 'reservada' AND rc.fecha >= ?`,
      [id, ahoraLocal().fecha],
    );
    if (Number(r.total) > 0) {
      throw new ConflictException(
        `Esta clase tiene ${r.total} reservas proximas. Mejor desactivala para que ya no se pueda reservar.`,
      );
    }
    await this.clases.delete({ id });
    return { mensaje: 'Clase eliminada', id };
  }

  /** Tipos de clase del catalogo, para la lista desplegable. */
  tipos() {
    return this.catalogo.find({ where: { categoria: 'clases', activo: true }, order: { nombre: 'ASC' } });
  }

  // ------------------------------------------------------------------
  // App movil (socios)
  // ------------------------------------------------------------------

  /** Clases del gimnasio que ve el socio, con sus reservas marcadas. */
  async sesionesParaSocio(idCliente: number, idGimnasio: number) {
    const sesiones = await this.sesiones(idGimnasio);
    const mias = await this.dataSource.query(
      `SELECT r.id, r.id_horario AS idHorario, DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha
       FROM reservas_clase r WHERE r.id_cliente = ? AND r.situacion = 'reservada' AND r.fecha >= ?`,
      [idCliente, ahoraLocal().fecha],
    );
    const mapa = new Map<string, number>(mias.map((r: any) => [`${r.idHorario}|${r.fecha}`, Number(r.id)]));
    return sesiones.map((s) => ({ ...s, idReserva: mapa.get(`${s.idHorario}|${s.fecha}`) ?? null }));
  }

  async misReservas(idCliente: number) {
    return this.dataSource.query(
      `SELECT r.id, DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha, TIME_FORMAT(h.hora_inicio, '%H:%i') AS horaInicio,
              c.nombre AS clase, c.instructor, c.duracion_min AS duracionMin,
              g.id AS idGimnasio, g.nombre AS gimnasio
       FROM reservas_clase r
       JOIN clases_horario h ON h.id = r.id_horario
       JOIN clases_gimnasio c ON c.id = h.id_clase
       JOIN gimnasios g ON g.id = c.id_gimnasio
       WHERE r.id_cliente = ? AND r.situacion = 'reservada' AND r.fecha >= ?
       ORDER BY r.fecha, h.hora_inicio`,
      [idCliente, ahoraLocal().fecha],
    );
  }

  async reservar(idCliente: number, idHorario: number, fecha: string) {
    const ahora = ahoraLocal();
    const horario = await this.horarios.findOne({ where: { id: idHorario }, relations: ['clase'] });
    if (!horario || !horario.clase.activa) throw new NotFoundException('Esa clase ya no esta disponible');

    // La fecha tiene que caer en el dia del horario, de hoy a 7 dias.
    if (diaSemana(fecha) !== horario.diaSemana) throw new BadRequestException('Esa clase no se da ese dia');
    if (fecha < ahora.fecha || fecha > sumarDias(ahora.fecha, DIAS_RESERVA - 1)) {
      throw new BadRequestException(`Solo puedes reservar para los proximos ${DIAS_RESERVA} dias`);
    }
    if (fecha === ahora.fecha && horario.horaInicio <= ahora.hora) {
      throw new BadRequestException('Esa clase ya empezo');
    }

    // Suscripcion vigente y plan que alcance la clase del gimnasio.
    const [sus] = await this.dataSource.query(
      `SELECT p.nivel, p.nombre FROM suscripciones s JOIN planes_plataforma p ON p.id = s.id_plan
       WHERE s.id_cliente = ? AND s.situacion = 'activa' AND s.fecha_fin >= ?
       ORDER BY s.fecha_fin DESC LIMIT 1`,
      [idCliente, ahora.fecha],
    );
    if (!sus) throw new ForbiddenException('Necesitas una suscripcion vigente para reservar');
    const clase = await clasificar(this.dataSource.manager, horario.clase.idGimnasio);
    if (Number(sus.nivel) < clase.nivel) {
      throw new ForbiddenException(`Tu plan ${sus.nombre} no incluye gimnasios ${clase.clase}`);
    }

    // El conteo y el alta van juntos y con el horario bloqueado, para que
    // dos socios no se lleven el ultimo lugar al mismo tiempo.
    return this.dataSource.transaction(async (m) => {
      await m.query('SELECT id FROM clases_horario WHERE id = ? FOR UPDATE', [idHorario]);
      const previa = await m.findOne(ReservaClase, { where: { idHorario, idCliente, fecha } });
      if (previa && previa.situacion === 'reservada') throw new ConflictException('Ya tienes lugar en esa clase');

      const [ocupados] = await m.query(
        `SELECT COUNT(*) AS total FROM reservas_clase
         WHERE id_horario = ? AND fecha = ? AND situacion = 'reservada'`,
        [idHorario, fecha],
      );
      if (Number(ocupados.total) >= horario.clase.cupo) throw new ConflictException('La clase ya esta llena');

      let reserva: ReservaClase;
      if (previa) {
        previa.situacion = 'reservada';
        reserva = await m.save(previa);
      } else {
        reserva = await m.save(m.create(ReservaClase, { idHorario, idCliente, fecha, situacion: 'reservada' }));
      }
      return {
        mensaje: `Lugar apartado en ${horario.clase.nombre}`,
        idReserva: reserva.id,
        lugares: horario.clase.cupo - Number(ocupados.total) - 1,
      };
    });
  }

  async cancelarReserva(idCliente: number, idReserva: number) {
    const reserva = await this.reservas.findOne({ where: { id: idReserva, idCliente } });
    if (!reserva || reserva.situacion !== 'reservada') throw new NotFoundException('No tienes esa reserva');
    const horario = await this.horarios.findOne({ where: { id: reserva.idHorario } });
    const ahora = ahoraLocal();
    if (reserva.fecha < ahora.fecha || (reserva.fecha === ahora.fecha && horario && horario.horaInicio <= ahora.hora)) {
      throw new BadRequestException('Esa clase ya empezo');
    }
    reserva.situacion = 'cancelada';
    await this.reservas.save(reserva);
    return { mensaje: 'Reserva cancelada', idReserva };
  }

  // ------------------------------------------------------------------

  private async claseDelGimnasio(idGimnasio: number, id: number) {
    const clase = await this.clases.findOne({ where: { id, idGimnasio }, relations: ['horarios'] });
    if (!clase) throw new NotFoundException('Esa clase no es de este gimnasio');
    return clase;
  }

  private async horarioDelGimnasio(idGimnasio: number, idHorario: number) {
    const h = await this.horarios.findOne({ where: { id: idHorario }, relations: ['clase'] });
    if (!h || h.clase.idGimnasio !== idGimnasio) throw new NotFoundException('Ese horario no es de este gimnasio');
    return h;
  }

  /** El nombre sale del catalogo; si no hay catalogo, se usa el escrito. */
  private async nombreDeClase(dto: ClaseDto): Promise<string> {
    if (dto.idCatalogo) {
      const tipo = await this.catalogo.findOne({ where: { id: dto.idCatalogo, categoria: 'clases' } });
      if (!tipo) throw new BadRequestException('Ese tipo de clase no esta en el catalogo');
      return dto.nombre || tipo.nombre;
    }
    if (!dto.nombre) throw new BadRequestException('Elige el tipo de clase o escribe su nombre');
    return dto.nombre;
  }

  private async revisarNombreLibre(idGimnasio: number, nombre: string, exceptoId?: number) {
    // La intercalacion de la base no distingue mayusculas ni acentos.
    const [r] = await this.dataSource.query(
      'SELECT id FROM clases_gimnasio WHERE id_gimnasio = ? AND nombre = ? AND id <> ?',
      [idGimnasio, nombre, exceptoId ?? 0],
    );
    if (r) throw new ConflictException(`Ya tienes una clase llamada "${nombre}". Editala en lugar de crear otra.`);
  }

  private sinRepetir(horarios: HorarioClaseDto[]): HorarioClaseDto[] {
    const vistos = new Set<string>();
    return horarios
      .map((h) => ({ diaSemana: h.diaSemana, horaInicio: h.horaInicio.slice(0, 5) + ':00' }))
      .filter((h) => {
        const k = `${h.diaSemana}|${h.horaInicio}`;
        if (vistos.has(k)) return false;
        vistos.add(k);
        return true;
      });
  }
}

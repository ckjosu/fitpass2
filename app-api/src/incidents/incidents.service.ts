import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidencia } from '../entities';
import { ActualizarIncidenciaDto, CrearIncidenciaDto } from './incidents.dto';

@Injectable()
export class IncidentsService {
  constructor(@InjectRepository(Incidencia) private incidencias: Repository<Incidencia>) {}

  /** Lista de reportes del gimnasio con el conteo por situacion. */
  async lista(idGimnasio: number, situacion?: string, prioridad?: string) {
    const qb = this.incidencias
      .createQueryBuilder('i')
      .where('i.id_gimnasio = :g', { g: idGimnasio });

    if (situacion) qb.andWhere('i.situacion = :s', { s: situacion });
    if (prioridad) qb.andWhere('i.prioridad = :p', { p: prioridad });

    const filas = await qb
      .orderBy(
        `FIELD(i.situacion,'pendiente','en_progreso','resuelto'),
         FIELD(i.prioridad,'alta','media','baja'), i.creado_en`,
        'ASC',
      )
      .getMany();

    const [conteo] = await this.incidencias.manager.query(
      `SELECT
         SUM(situacion='pendiente')   AS pendientes,
         SUM(situacion='en_progreso') AS en_progreso,
         SUM(situacion='resuelto')    AS resueltos
       FROM incidencias WHERE id_gimnasio = ?`,
      [idGimnasio],
    );

    return {
      resumen: {
        pendientes: Number(conteo.pendientes || 0),
        enProgreso: Number(conteo.en_progreso || 0),
        resueltos: Number(conteo.resueltos || 0),
      },
      incidencias: filas,
    };
  }

  async crear(idGimnasio: number, idUsuario: number, dto: CrearIncidenciaDto) {
    await this.incidencias.save(
      this.incidencias.create({
        idGimnasio,
        equipo: dto.equipo,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        prioridad: dto.prioridad || 'media',
        situacion: 'pendiente',
        reportadoPor: idUsuario,
      }),
    );
    return this.lista(idGimnasio);
  }

  async actualizar(idGimnasio: number, id: number, dto: ActualizarIncidenciaDto) {
    const incidencia = await this.incidencias.findOne({ where: { id, idGimnasio } });
    if (!incidencia) throw new NotFoundException('Ese reporte no es de este gimnasio');

    Object.assign(incidencia, dto);

    // La fecha de resolucion se pone y se quita sola segun la situacion.
    if (dto.situacion === 'resuelto' && !incidencia.resueltoEn) {
      incidencia.resueltoEn = new Date();
    }
    if (dto.situacion && dto.situacion !== 'resuelto') {
      incidencia.resueltoEn = null;
    }

    await this.incidencias.save(incidencia);
    return this.lista(idGimnasio);
  }

  async borrar(idGimnasio: number, id: number) {
    const incidencia = await this.incidencias.findOne({ where: { id, idGimnasio } });
    if (!incidencia) throw new NotFoundException('Ese reporte no es de este gimnasio');
    await this.incidencias.remove(incidencia);
    return this.lista(idGimnasio);
  }
}

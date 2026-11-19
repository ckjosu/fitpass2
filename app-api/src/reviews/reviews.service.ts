import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resena } from '../entities';
import { FiltroResenasDto } from './reviews.dto';

/**
 * Resenas del gimnasio, vistas por el dueno.
 * Los socios las dejan desde la app; el dueno las lee y las contesta.
 * La respuesta aparece en la app debajo de cada resena.
 */
@Injectable()
export class ReviewsService {
  constructor(@InjectRepository(Resena) private resenas: Repository<Resena>) {}

  async lista(idGimnasio: number, f: FiltroResenasDto) {
    const [resumen] = await this.resenas.manager.query(
      `SELECT COUNT(*) AS total,
              ROUND(COALESCE(AVG(calificacion), 0), 1) AS promedio,
              SUM(respuesta IS NULL) AS sin_responder,
              SUM(calificacion = 5) AS e5, SUM(calificacion = 4) AS e4, SUM(calificacion = 3) AS e3,
              SUM(calificacion = 2) AS e2, SUM(calificacion = 1) AS e1,
              ROUND(COALESCE(AVG(CASE WHEN creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN calificacion END), 0), 1) AS promedio_30
       FROM resenas WHERE id_gimnasio = ?`,
      [idGimnasio],
    );

    const params: unknown[] = [idGimnasio];
    let sql = `
      SELECT r.id, r.calificacion, r.comentario, r.respuesta, r.respondido_en AS respondidoEn,
             r.creado_en AS creadoEn, u.nombre AS cliente,
             (SELECT COUNT(*) FROM accesos a
              WHERE a.id_gimnasio = r.id_gimnasio AND a.id_cliente = r.id_cliente
                AND a.resultado = 'permitido') AS visitas
      FROM resenas r JOIN usuarios u ON u.id = r.id_cliente
      WHERE r.id_gimnasio = ?`;
    if (f.filtro === 'sin_responder') sql += ' AND r.respuesta IS NULL';
    if (f.filtro === 'respondidas') sql += ' AND r.respuesta IS NOT NULL';
    if (f.estrellas) {
      sql += ' AND r.calificacion = ?';
      params.push(Number(f.estrellas));
    }
    sql += ' ORDER BY r.creado_en DESC';

    const filas = await this.resenas.manager.query(sql, params);
    const total = Number(resumen.total || 0);

    return {
      resumen: {
        total,
        promedio: Number(resumen.promedio || 0),
        promedioUltimos30: Number(resumen.promedio_30 || 0),
        sinResponder: Number(resumen.sin_responder || 0),
        distribucion: [5, 4, 3, 2, 1].map((e) => {
          const cantidad = Number(resumen['e' + e] || 0);
          return { estrellas: e, cantidad, porcentaje: total ? Math.round((cantidad / total) * 100) : 0 };
        }),
      },
      resenas: filas.map((r: any) => ({ ...r, calificacion: Number(r.calificacion), visitas: Number(r.visitas) })),
    };
  }

  private async deEste(idGimnasio: number, id: number) {
    const resena = await this.resenas.findOne({ where: { id, idGimnasio } });
    if (!resena) throw new NotFoundException('Esa resena no es de este gimnasio');
    return resena;
  }

  async responder(idGimnasio: number, id: number, respuesta: string) {
    const resena = await this.deEste(idGimnasio, id);
    resena.respuesta = respuesta;
    resena.respondidoEn = new Date();
    await this.resenas.save(resena);
    return { mensaje: 'Respuesta publicada', id, respuesta, respondidoEn: resena.respondidoEn };
  }

  async borrarRespuesta(idGimnasio: number, id: number) {
    const resena = await this.deEste(idGimnasio, id);
    resena.respuesta = null;
    resena.respondidoEn = null;
    await this.resenas.save(resena);
    return { mensaje: 'Respuesta eliminada', id };
  }
}

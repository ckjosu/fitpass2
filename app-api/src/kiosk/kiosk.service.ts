import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Lector } from '../entities';

/**
 * La pantalla de la entrada muestra un QR que rota. El socio lo escanea con
 * su celular y la app manda ese codigo a la API para pedir el paso.
 * El codigo es corto y dura poco: si alguien le toma foto a la pantalla,
 * la foto sirve unos segundos y ya.
 */
@Injectable()
export class KioskService {
  constructor(@InjectRepository(Lector) private pantallas: Repository<Lector>) {}

  lista(idGimnasio: number) {
    return this.pantallas.find({ where: { idGimnasio }, order: { numeroSerie: 'ASC' } });
  }

  /** Genera el codigo siguiente de una pantalla y dice cuanto le queda. */
  async rotar(idGimnasio: number, numeroSerie: string | undefined, segundos = 30) {
    const pantalla = numeroSerie
      ? await this.pantallas.findOne({ where: { idGimnasio, numeroSerie, activo: true } })
      : await this.pantallas.findOne({ where: { idGimnasio, activo: true } });

    if (!pantalla) throw new NotFoundException('Este gimnasio no tiene pantalla de acceso activa');

    const vida = Math.min(Math.max(segundos, 10), 300);
    pantalla.codigoActual = `FP.${pantalla.numeroSerie}.${randomBytes(6).toString('hex').toUpperCase()}`;
    pantalla.codigoVenceEn = new Date(Date.now() + vida * 1000);
    pantalla.ultimaConexion = new Date();
    await this.pantallas.save(pantalla);

    return {
      pantalla: { numeroSerie: pantalla.numeroSerie, ubicacion: pantalla.ubicacion },
      codigo: pantalla.codigoActual,
      venceEn: pantalla.codigoVenceEn,
      segundos: vida,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionGimnasio } from '../entities';
import { ConfiguracionDto } from './settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(ConfiguracionGimnasio)
    private config: Repository<ConfiguracionGimnasio>,
  ) {}

  /** Si el gimnasio todavia no tiene fila de configuracion, se crea con los valores por omision. */
  async ver(idGimnasio: number) {
    let fila = await this.config.findOne({ where: { idGimnasio } });
    if (!fila) {
      fila = await this.config.save(
        this.config.create({
          idGimnasio,
          tema: 'claro',
          colorAcento: 'naranja',
          modoValidacion: 'en_linea',
          toleranciaSegundos: 300,
          avisarPorCorreo: true,
          avisarAccesosDenegados: true,
          avisarIncidencias: true,
        }),
      );
    }
    return fila;
  }

  async guardar(idGimnasio: number, dto: ConfiguracionDto) {
    const fila = await this.ver(idGimnasio);
    Object.assign(fila, dto);
    await this.config.save(fila);
    return fila;
  }
}

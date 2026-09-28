import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventarioGimnasio } from '../entities';
import { ActualizarEquipoDto, CrearEquipoDto } from './inventory.dto';

/** Nombres bonitos de cada categoria, para el panel y para la app movil. */
export const CATEGORIAS: Record<string, string> = {
  peso_libre: 'Peso libre',
  maquinas: 'Máquinas',
  cardio: 'Cardio',
  funcional: 'Funcional',
  clases: 'Clases',
  otro: 'Otro',
};

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventarioGimnasio) private inventario: Repository<InventarioGimnasio>,
  ) {}

  /** Inventario agrupado por categoria, que es como se ve en pantalla. */
  async lista(idGimnasio: number) {
    const equipos = await this.inventario.find({
      where: { idGimnasio },
      order: { categoria: 'ASC', nombre: 'ASC' },
    });

    const grupos = Object.keys(CATEGORIAS)
      .map((clave) => ({
        categoria: clave,
        etiqueta: CATEGORIAS[clave],
        equipos: equipos.filter((e) => e.categoria === clave),
      }))
      .filter((g) => g.equipos.length > 0);

    return {
      resumen: {
        total: equipos.length,
        disponibles: equipos.filter((e) => e.situacion === 'disponible').length,
        fueraDeServicio: equipos.filter((e) => e.situacion === 'fuera_de_servicio').length,
      },
      grupos,
      equipos,
    };
  }

  async crear(idGimnasio: number, dto: CrearEquipoDto) {
    await this.inventario.save(
      this.inventario.create({
        idGimnasio,
        nombre: dto.nombre,
        categoria: dto.categoria,
        descripcion: dto.descripcion,
        cantidad: dto.cantidad || 1,
        situacion: dto.situacion || 'disponible',
      }),
    );
    return this.lista(idGimnasio);
  }

  async actualizar(idGimnasio: number, id: number, dto: ActualizarEquipoDto) {
    const equipo = await this.inventario.findOne({ where: { id, idGimnasio } });
    if (!equipo) throw new NotFoundException('Ese equipo no es de este gimnasio');
    Object.assign(equipo, dto);
    await this.inventario.save(equipo);
    return this.lista(idGimnasio);
  }

  async borrar(idGimnasio: number, id: number) {
    const equipo = await this.inventario.findOne({ where: { id, idGimnasio } });
    if (!equipo) throw new NotFoundException('Ese equipo no es de este gimnasio');
    await this.inventario.remove(equipo);
    return this.lista(idGimnasio);
  }

  /** Lo que ve el socio en la app: solo lo que si esta disponible. */
  async paraSocio(idGimnasio: number) {
    const equipos = await this.inventario.find({
      where: { idGimnasio, situacion: 'disponible' },
      order: { categoria: 'ASC', nombre: 'ASC' },
    });

    return Object.keys(CATEGORIAS)
      .map((clave) => ({
        categoria: clave,
        etiqueta: CATEGORIAS[clave],
        equipos: equipos
          .filter((e) => e.categoria === clave)
          .map((e) => ({ nombre: e.nombre, descripcion: e.descripcion, cantidad: e.cantidad })),
      }))
      .filter((g) => g.equipos.length > 0);
  }
}

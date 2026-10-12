import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogoEquipo, InventarioGimnasio } from '../entities';
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
    @InjectRepository(CatalogoEquipo) private catalogoRepo: Repository<CatalogoEquipo>,
  ) {}

  /** Lista de equipo estandar, agrupada por categoria. */
  async catalogo(categoria?: string) {
    const equipos = await this.catalogoRepo.find({
      where: categoria ? { activo: true, categoria: categoria as any } : { activo: true },
      order: { categoria: 'ASC', nombre: 'ASC' },
    });

    return Object.keys(CATEGORIAS)
      .map((clave) => ({
        categoria: clave,
        etiqueta: CATEGORIAS[clave],
        equipos: equipos.filter((e) => e.categoria === clave),
      }))
      .filter((g) => g.equipos.length > 0);
  }

  /**
   * Resuelve que equipo se va a guardar. Si viene del catalogo se toman de
   * ahi el nombre y la categoria; si es personalizado, se limpian los
   * espacios sobrantes.
   */
  private async resolverEquipo(dto: { idCatalogo?: number; nombre?: string; categoria?: string }) {
    if (dto.idCatalogo) {
      const delCatalogo = await this.catalogoRepo.findOne({ where: { id: dto.idCatalogo } });
      if (!delCatalogo) throw new NotFoundException('Ese equipo no esta en el catalogo');
      return {
        idCatalogo: delCatalogo.id,
        nombre: delCatalogo.nombre,
        categoria: delCatalogo.categoria,
      };
    }

    const nombre = (dto.nombre || '').trim().replace(/\s+/g, ' ');
    if (nombre.length < 2) {
      throw new BadRequestException('Elige un equipo del catalogo o escribe su nombre');
    }
    return { idCatalogo: null, nombre, categoria: (dto.categoria as any) || 'otro' };
  }

  /** Avisa con palabras claras cuando el equipo ya esta en el inventario. */
  private esDuplicado(error: any): boolean {
    return error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062;
  }

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
    const equipo = await this.resolverEquipo(dto);

    try {
      await this.inventario.save(
        this.inventario.create({
          idGimnasio,
          idCatalogo: equipo.idCatalogo,
          nombre: equipo.nombre,
          categoria: equipo.categoria,
          descripcion: dto.descripcion,
          cantidad: dto.cantidad || 1,
          situacion: dto.situacion || 'disponible',
        }),
      );
    } catch (error) {
      if (this.esDuplicado(error)) {
        throw new BadRequestException(
          `Ya tienes ${equipo.nombre} en tu inventario. Edita la cantidad en vez de agregarlo otra vez.`,
        );
      }
      throw error;
    }

    return this.lista(idGimnasio);
  }

  async actualizar(idGimnasio: number, id: number, dto: ActualizarEquipoDto) {
    const equipo = await this.inventario.findOne({ where: { id, idGimnasio } });
    if (!equipo) throw new NotFoundException('Ese equipo no es de este gimnasio');

    // Si cambian el equipo, se vuelve a resolver contra el catalogo.
    if (dto.idCatalogo || dto.nombre) {
      const resuelto = await this.resolverEquipo(dto);
      equipo.idCatalogo = resuelto.idCatalogo;
      equipo.nombre = resuelto.nombre;
      equipo.categoria = resuelto.categoria;
    }
    if (dto.descripcion !== undefined) equipo.descripcion = dto.descripcion;
    if (dto.cantidad !== undefined) equipo.cantidad = dto.cantidad;
    if (dto.situacion !== undefined) equipo.situacion = dto.situacion;

    try {
      await this.inventario.save(equipo);
    } catch (error) {
      if (this.esDuplicado(error)) {
        throw new BadRequestException(`Ya tienes ${equipo.nombre} en tu inventario.`);
      }
      throw error;
    }

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

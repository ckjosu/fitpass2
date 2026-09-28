import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AmenidadGimnasio,
  FotoGimnasio,
  Gimnasio,
  HorarioGimnasio,
  PrecioGimnasio,
  PrecioHistorial,
  ServicioGimnasio,
} from '../entities';
import {
  AmenidadDto,
  DatosGimnasioDto,
  FotoDto,
  HorariosDto,
  PrecioDto,
  ServicioDto,
} from './gyms.dto';

const DIAS = ['', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

@Injectable()
export class GymsService {
  constructor(
    @InjectRepository(Gimnasio) private gimnasios: Repository<Gimnasio>,
    @InjectRepository(HorarioGimnasio) private horarios: Repository<HorarioGimnasio>,
    @InjectRepository(FotoGimnasio) private fotos: Repository<FotoGimnasio>,
    @InjectRepository(ServicioGimnasio) private servicios: Repository<ServicioGimnasio>,
    @InjectRepository(AmenidadGimnasio) private amenidades: Repository<AmenidadGimnasio>,
    @InjectRepository(PrecioGimnasio) private precios: Repository<PrecioGimnasio>,
    @InjectRepository(PrecioHistorial) private historial: Repository<PrecioHistorial>,
  ) {}

  /** Gimnasios del dueno que trae el token (para el selector del topbar). */
  mios(idDueno: number) {
    return this.gimnasios.find({ where: { idDueno }, order: { nombre: 'ASC' } });
  }

  /** Ficha completa: es lo que carga la pantalla de Mantenimiento. */
  async detalle(id: number) {
    const gimnasio = await this.gimnasios.findOne({ where: { id } });
    if (!gimnasio) throw new NotFoundException('Ese gimnasio no existe');

    const [horarios, fotos, servicios, amenidades] = await Promise.all([
      this.horarios.find({ where: { idGimnasio: id }, order: { diaSemana: 'ASC' } }),
      this.fotos.find({ where: { idGimnasio: id }, order: { orden: 'ASC' } }),
      this.servicios.find({ where: { idGimnasio: id }, order: { id: 'ASC' } }),
      this.amenidades.find({ where: { idGimnasio: id }, order: { id: 'ASC' } }),
    ]);

    return {
      ...gimnasio,
      horarios: horarios.map((h) => ({ ...h, dia: DIAS[h.diaSemana] })),
      fotos,
      servicios,
      amenidades,
    };
  }

  /** Mantenimiento: datos generales del gimnasio. */
  async actualizarDatos(id: number, dto: DatosGimnasioDto) {
    const gimnasio = await this.gimnasios.findOne({ where: { id } });
    if (!gimnasio) throw new NotFoundException('Ese gimnasio no existe');
    Object.assign(gimnasio, dto);
    await this.gimnasios.save(gimnasio);
    return this.detalle(id);
  }

  /** Mantenimiento: reemplaza la tabla de horarios completa. */
  async guardarHorarios(id: number, dto: HorariosDto) {
    for (const h of dto.horarios) {
      if (!h.cerrado && (!h.horaApertura || !h.horaCierre)) {
        throw new BadRequestException(
          `Falta la hora de apertura o cierre del ${DIAS[h.diaSemana]}`,
        );
      }
      if (!h.cerrado && h.horaApertura >= h.horaCierre) {
        throw new BadRequestException(
          `En ${DIAS[h.diaSemana]} la hora de cierre debe ser mayor a la de apertura`,
        );
      }
    }

    await this.horarios.delete({ idGimnasio: id });
    await this.horarios.save(
      dto.horarios.map((h) =>
        this.horarios.create({
          idGimnasio: id,
          diaSemana: h.diaSemana,
          horaApertura: h.cerrado ? null : h.horaApertura,
          horaCierre: h.cerrado ? null : h.horaCierre,
          cerrado: !!h.cerrado,
        }),
      ),
    );

    const guardados = await this.horarios.find({
      where: { idGimnasio: id },
      order: { diaSemana: 'ASC' },
    });
    return guardados.map((h) => ({ ...h, dia: DIAS[h.diaSemana] }));
  }

  // ----- Fotos -----
  async agregarFoto(id: number, dto: FotoDto) {
    if (dto.portada) await this.fotos.update({ idGimnasio: id }, { portada: false });
    const foto = await this.fotos.save(
      this.fotos.create({
        idGimnasio: id,
        url: dto.url,
        descripcion: dto.descripcion,
        portada: !!dto.portada,
        orden: dto.orden ?? 0,
      }),
    );
    return foto;
  }

  async borrarFoto(id: number, idFoto: number) {
    const foto = await this.fotos.findOne({ where: { id: idFoto, idGimnasio: id } });
    if (!foto) throw new NotFoundException('Esa foto no es de este gimnasio');
    await this.fotos.remove(foto);
    return { mensaje: 'Foto eliminada' };
  }

  // ----- Servicios -----
  async agregarServicio(id: number, dto: ServicioDto) {
    return this.servicios.save(
      this.servicios.create({
        idGimnasio: id,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        activo: dto.activo ?? true,
      }),
    );
  }

  async borrarServicio(id: number, idServicio: number) {
    const s = await this.servicios.findOne({ where: { id: idServicio, idGimnasio: id } });
    if (!s) throw new NotFoundException('Ese servicio no es de este gimnasio');
    await this.servicios.remove(s);
    return { mensaje: 'Servicio eliminado' };
  }

  // ----- Amenidades -----
  async agregarAmenidad(id: number, dto: AmenidadDto) {
    return this.amenidades.save(
      this.amenidades.create({ idGimnasio: id, nombre: dto.nombre, icono: dto.icono }),
    );
  }

  async borrarAmenidad(id: number, idAmenidad: number) {
    const a = await this.amenidades.findOne({ where: { id: idAmenidad, idGimnasio: id } });
    if (!a) throw new NotFoundException('Esa amenidad no es de este gimnasio');
    await this.amenidades.remove(a);
    return { mensaje: 'Amenidad eliminada' };
  }

  // ----- Precios propios del gimnasio -----
  async listaPrecios(id: number) {
    const [precios, movimientos] = await Promise.all([
      this.precios.find({ where: { idGimnasio: id }, order: { id: 'ASC' } }),
      this.historial.find({
        where: { idGimnasio: id },
        order: { cambiadoEn: 'DESC' },
        take: 15,
      }),
    ]);
    return { precios, historial: movimientos };
  }

  /** El trigger de la base guarda solo el historial cuando cambia el monto. */
  async guardarPrecio(id: number, dto: PrecioDto) {
    if (dto.monto <= 0) throw new BadRequestException('El monto debe ser mayor a cero');

    const existente = await this.precios.findOne({
      where: { idGimnasio: id, concepto: dto.concepto },
    });

    if (existente) {
      existente.monto = dto.monto;
      if (dto.activo !== undefined) existente.activo = dto.activo;
      await this.precios.save(existente);
    } else {
      await this.precios.save(
        this.precios.create({
          idGimnasio: id,
          concepto: dto.concepto,
          monto: dto.monto,
          activo: dto.activo ?? true,
        }),
      );
    }
    return this.listaPrecios(id);
  }

  async borrarPrecio(id: number, idPrecio: number) {
    const p = await this.precios.findOne({ where: { id: idPrecio, idGimnasio: id } });
    if (!p) throw new NotFoundException('Ese precio no es de este gimnasio');
    await this.precios.remove(p);
    return this.listaPrecios(id);
  }
}

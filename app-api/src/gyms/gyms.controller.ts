import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GymsService } from './gyms.service';
import {
  AmenidadDto, DatosGimnasioDto, FotoDto, HorariosDto, PrecioDto, ServicioDto,
} from './gyms.dto';
import { Auth, DuenoDelGimnasioGuard, JwtGuard, Roles, RolesGuard, UsuarioToken } from '../common/security';

@ApiTags('gimnasios')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('gimnasios')
export class GymsController {
  constructor(private gyms: GymsService) {}

  @Get('mios')
  @Roles('dueno', 'admin')
  @ApiOperation({ summary: 'Gimnasios del dueno que inicio sesion' })
  mios(@Auth() u: UsuarioToken) {
    return this.gyms.mios(u.sub);
  }

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Ficha completa del gimnasio' })
  detalle(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.gyms.detalle(gymId);
  }

  @Put(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Mantenimiento: datos generales' })
  actualizar(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: DatosGimnasioDto) {
    return this.gyms.actualizarDatos(gymId, dto);
  }

  @Put(':gymId/horarios')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Mantenimiento: horarios de la semana' })
  horarios(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: HorariosDto) {
    return this.gyms.guardarHorarios(gymId, dto);
  }

  @Post(':gymId/fotos')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Agrega una foto por URL' })
  agregarFoto(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: FotoDto) {
    return this.gyms.agregarFoto(gymId, dto);
  }

  @Post(':gymId/fotos/subir')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Sube un archivo de imagen del gimnasio' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: process.env.UPLOADS_DIR || join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) =>
          cb(null, `gym-${Date.now()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  subirFoto(
    @Param('gymId', ParseIntPipe) gymId: number,
    @UploadedFile() archivo: any,
    @Body('descripcion') descripcion?: string,
  ) {
    return this.gyms.agregarFoto(gymId, {
      url: `/uploads/${archivo.filename}`,
      descripcion,
    });
  }

  @Delete(':gymId/fotos/:idFoto')
  @UseGuards(DuenoDelGimnasioGuard)
  borrarFoto(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('idFoto', ParseIntPipe) idFoto: number,
  ) {
    return this.gyms.borrarFoto(gymId, idFoto);
  }

  @Post(':gymId/servicios')
  @UseGuards(DuenoDelGimnasioGuard)
  agregarServicio(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: ServicioDto) {
    return this.gyms.agregarServicio(gymId, dto);
  }

  @Delete(':gymId/servicios/:idServicio')
  @UseGuards(DuenoDelGimnasioGuard)
  borrarServicio(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('idServicio', ParseIntPipe) idServicio: number,
  ) {
    return this.gyms.borrarServicio(gymId, idServicio);
  }

  @Post(':gymId/amenidades')
  @UseGuards(DuenoDelGimnasioGuard)
  agregarAmenidad(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: AmenidadDto) {
    return this.gyms.agregarAmenidad(gymId, dto);
  }

  @Delete(':gymId/amenidades/:idAmenidad')
  @UseGuards(DuenoDelGimnasioGuard)
  borrarAmenidad(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('idAmenidad', ParseIntPipe) idAmenidad: number,
  ) {
    return this.gyms.borrarAmenidad(gymId, idAmenidad);
  }
}

@ApiTags('precios')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('precios')
export class PricesController {
  constructor(private gyms: GymsService) {}

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Precios propios del gimnasio y su historial' })
  lista(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.gyms.listaPrecios(gymId);
  }

  @Put(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Guarda o actualiza un precio (el historial se llena solo)' })
  guardar(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: PrecioDto) {
    return this.gyms.guardarPrecio(gymId, dto);
  }

  @Delete(':gymId/:idPrecio')
  @UseGuards(DuenoDelGimnasioGuard)
  borrar(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('idPrecio', ParseIntPipe) idPrecio: number,
  ) {
    return this.gyms.borrarPrecio(gymId, idPrecio);
  }
}

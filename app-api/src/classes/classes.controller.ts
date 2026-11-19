import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { ClaseDto } from './classes.dto';
import { DuenoDelGimnasioGuard, JwtGuard, RolesGuard } from '../common/security';

@ApiTags('clases')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('clases')
export class ClassesController {
  constructor(private clases: ClassesService) {}

  @Get('tipos')
  @ApiOperation({ summary: 'Tipos de clase del catalogo (lista desplegable)' })
  tipos() {
    return this.clases.tipos();
  }

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Clases del gimnasio, horario semanal y sesiones de los proximos 7 dias' })
  lista(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.clases.lista(gymId);
  }

  @Get(':gymId/inscritos/:idHorario')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Socios que reservaron una sesion' })
  inscritos(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('idHorario', ParseIntPipe) idHorario: number,
    @Query('fecha') fecha: string,
  ) {
    return this.clases.inscritos(gymId, idHorario, fecha);
  }

  @Post(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Crea una clase con su horario' })
  crear(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: ClaseDto) {
    return this.clases.crear(gymId, dto);
  }

  @Put(':gymId/:id')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Edita una clase (no deja quitar horarios con reservas)' })
  actualizar(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ClaseDto,
  ) {
    return this.clases.actualizar(gymId, id, dto);
  }

  @Delete(':gymId/:id')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Elimina una clase sin reservas proximas' })
  borrar(@Param('gymId', ParseIntPipe) gymId: number, @Param('id', ParseIntPipe) id: number) {
    return this.clases.borrar(gymId, id);
  }
}

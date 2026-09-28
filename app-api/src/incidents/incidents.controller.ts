import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { ActualizarIncidenciaDto, CrearIncidenciaDto } from './incidents.dto';
import { Auth, DuenoDelGimnasioGuard, JwtGuard, RolesGuard, UsuarioToken } from '../common/security';

@ApiTags('incidencias')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('incidencias')
export class IncidentsController {
  constructor(private incidencias: IncidentsService) {}

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Reportes de mantenimiento del gimnasio' })
  lista(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Query('situacion') situacion?: string,
    @Query('prioridad') prioridad?: string,
  ) {
    return this.incidencias.lista(gymId, situacion, prioridad);
  }

  @Post(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Levanta un reporte de mantenimiento' })
  crear(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Auth() u: UsuarioToken,
    @Body() dto: CrearIncidenciaDto,
  ) {
    return this.incidencias.crear(gymId, u.sub, dto);
  }

  @Put(':gymId/:id')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Cambia la situacion o los datos de un reporte' })
  actualizar(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarIncidenciaDto,
  ) {
    return this.incidencias.actualizar(gymId, id, dto);
  }

  @Delete(':gymId/:id')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Elimina un reporte' })
  borrar(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.incidencias.borrar(gymId, id);
  }
}

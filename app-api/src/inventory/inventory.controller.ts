import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { ActualizarEquipoDto, CrearEquipoDto } from './inventory.dto';
import { DuenoDelGimnasioGuard, JwtGuard, RolesGuard } from '../common/security';

@ApiTags('inventario')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('inventario')
export class InventoryController {
  constructor(private inventario: InventoryService) {}

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Equipo y actividades que ofrece el gimnasio' })
  lista(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.inventario.lista(gymId);
  }

  @Post(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Agrega equipo o actividad al inventario' })
  crear(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: CrearEquipoDto) {
    return this.inventario.crear(gymId, dto);
  }

  @Put(':gymId/:id')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Edita un equipo o lo marca fuera de servicio' })
  actualizar(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEquipoDto,
  ) {
    return this.inventario.actualizar(gymId, id, dto);
  }

  @Delete(':gymId/:id')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Quita un equipo del inventario' })
  borrar(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventario.borrar(gymId, id);
  }
}

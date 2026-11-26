import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { PrecioVisitaDto, SolicitudBajaDto } from './contracts.dto';
import { DuenoDelGimnasioGuard, JwtGuard, Roles, RolesGuard } from '../common/security';

@ApiTags('contrato')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('contrato')
export class ContractsController {
  constructor(private contratos: ContractsService) {}

  @Get('fitnex/:anio/:mes')
  @Roles('admin')
  @ApiOperation({ summary: 'Solo admin: cuanto se cobro, cuanto se paga a gimnasios y cuanto queda para Gymred' })
  resumenFitnex(@Param('anio', ParseIntPipe) anio: number, @Param('mes', ParseIntPipe) mes: number) {
    return this.contratos.resumenFitnex(anio, mes);
  }

  @Post('cierre/:anio/:mes')
  @Roles('admin')
  @ApiOperation({ summary: 'Solo admin: genera las liquidaciones del mes (pago el dia 5)' })
  cerrarMes(@Param('anio', ParseIntPipe) anio: number, @Param('mes', ParseIntPipe) mes: number) {
    return this.contratos.cerrarMes(anio, mes);
  }

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Afiliacion (sin costo), clase del gimnasio, precio por visita y ganancias' })
  ver(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.contratos.ver(gymId);
  }

  @Put(':gymId/precio')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Guarda el precio por visita del gimnasio (con tope segun su clase)' })
  precio(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: PrecioVisitaDto) {
    return this.contratos.guardarPrecio(gymId, dto);
  }

  @Post(':gymId/baja')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Solicita darse de baja de la plataforma' })
  baja(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: SolicitudBajaDto) {
    return this.contratos.solicitarBaja(gymId, dto);
  }

  @Delete(':gymId/baja')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Cancela la solicitud de baja' })
  cancelar(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.contratos.cancelarBaja(gymId);
  }
}

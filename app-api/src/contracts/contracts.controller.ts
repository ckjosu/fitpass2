import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { SolicitudBajaDto, SolicitudPlanDto } from './contracts.dto';
import { DuenoDelGimnasioGuard, JwtGuard, RolesGuard } from '../common/security';

@ApiTags('contrato')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('contrato')
export class ContractsController {
  constructor(private contratos: ContractsService) {}

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Plan Gymred del gimnasio, facturacion y liquidaciones' })
  ver(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.contratos.ver(gymId);
  }

  @Post(':gymId/solicitud-plan')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Solicita cambio de plan' })
  cambiar(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: SolicitudPlanDto) {
    return this.contratos.solicitarCambio(gymId, dto);
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

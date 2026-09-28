import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessService } from './access.service';
import { FiltroHistorialDto } from './access.dto';
import { DuenoDelGimnasioGuard, JwtGuard, RolesGuard } from '../common/security';

@ApiTags('accesos')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('accesos')
export class AccessController {
  constructor(private access: AccessService) {}

  @Get(':gymId/resumen')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Datos del dashboard' })
  resumen(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.access.resumen(gymId);
  }

  @Get(':gymId/historial')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Historial de accesos con filtros' })
  historial(@Param('gymId', ParseIntPipe) gymId: number, @Query() filtro: FiltroHistorialDto) {
    return this.access.historial(gymId, filtro);
  }

  @Get(':gymId/reportes')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Reportes: visitas por mes, por dia, top clientes y motivos' })
  reportes(@Param('gymId', ParseIntPipe) gymId: number, @Query('meses') meses?: string) {
    return this.access.reportes(gymId, meses ? Number(meses) : 6);
  }
}

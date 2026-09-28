import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KioskService } from './kiosk.service';
import { DuenoDelGimnasioGuard, JwtGuard, RolesGuard } from '../common/security';

@ApiTags('pantalla')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('pantalla')
export class KioskController {
  constructor(private kiosco: KioskService) {}

  @Get(':gymId/pantallas')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Pantallas de acceso del gimnasio' })
  lista(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.kiosco.lista(gymId);
  }

  @Post(':gymId/codigo')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({
    summary: 'Genera el siguiente codigo QR de la pantalla',
    description: 'La pantalla lo vuelve a pedir sola antes de que venza.',
  })
  rotar(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Query('serie') serie?: string,
    @Query('segundos') segundos?: string,
  ) {
    return this.kiosco.rotar(gymId, serie, segundos ? Number(segundos) : 30);
  }
}

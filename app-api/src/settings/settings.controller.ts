import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { ConfiguracionDto } from './settings.dto';
import { DuenoDelGimnasioGuard, JwtGuard, RolesGuard } from '../common/security';

@ApiTags('configuracion')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('configuracion')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Preferencias del panel y del lector' })
  ver(@Param('gymId', ParseIntPipe) gymId: number) {
    return this.settings.ver(gymId);
  }

  @Put(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Guarda las preferencias' })
  guardar(@Param('gymId', ParseIntPipe) gymId: number, @Body() dto: ConfiguracionDto) {
    return this.settings.guardar(gymId, dto);
  }
}

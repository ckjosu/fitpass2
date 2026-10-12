import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtGuard } from '../common/security';

@ApiTags('catalogo')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('catalogo')
export class CatalogController {
  constructor(private inventario: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Catalogo de equipo estandar',
    description:
      'El panel lo usa para que el dueno elija el equipo de una lista ' +
      'en vez de escribirlo, y asi no se capture el mismo aparato de varias formas.',
  })
  catalogo(@Query('categoria') categoria?: string) {
    return this.inventario.catalogo(categoria);
  }
}

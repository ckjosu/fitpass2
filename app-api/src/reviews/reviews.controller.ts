import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { FiltroResenasDto, RespuestaResenaDto } from './reviews.dto';
import { DuenoDelGimnasioGuard, JwtGuard, RolesGuard } from '../common/security';

@ApiTags('resenas')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('resenas')
export class ReviewsController {
  constructor(private resenas: ReviewsService) {}

  @Get(':gymId')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Calificacion promedio, distribucion y resenas del gimnasio' })
  lista(@Param('gymId', ParseIntPipe) gymId: number, @Query() filtro: FiltroResenasDto) {
    return this.resenas.lista(gymId, filtro);
  }

  @Put(':gymId/:id/respuesta')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Publica o edita la respuesta del dueno a una resena' })
  responder(
    @Param('gymId', ParseIntPipe) gymId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespuestaResenaDto,
  ) {
    return this.resenas.responder(gymId, id, dto.respuesta);
  }

  @Delete(':gymId/:id/respuesta')
  @UseGuards(DuenoDelGimnasioGuard)
  @ApiOperation({ summary: 'Quita la respuesta del dueno' })
  borrar(@Param('gymId', ParseIntPipe) gymId: number, @Param('id', ParseIntPipe) id: number) {
    return this.resenas.borrarRespuesta(gymId, id);
  }
}

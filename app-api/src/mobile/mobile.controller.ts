import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MobileService } from './mobile.service';
import { ContratarPlanDto, EntrarDto, ResenaDto } from './mobile.dto';
import { Auth, JwtGuard, Roles, RolesGuard, UsuarioToken } from '../common/security';

@ApiTags('movil')
@Controller('movil')
export class MobileController {
  constructor(private movil: MobileService) {}

  @Get('planes')
  @ApiOperation({ summary: 'Planes de suscripcion disponibles' })
  planes() {
    return this.movil.planesDisponibles();
  }

  @Get('gimnasios')
  @ApiOperation({ summary: 'Catalogo de gimnasios afiliados (con filtros y cercania)' })
  gimnasios(
    @Query('buscar') buscar?: string,
    @Query('categoria') categoria?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.movil.gimnasios({
      buscar,
      categoria,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    });
  }

  @Get('gimnasios/:id')
  @ApiOperation({ summary: 'Ficha publica de un gimnasio' })
  gimnasio(@Param('id', ParseIntPipe) id: number) {
    return this.movil.gimnasio(id);
  }

  @Get('mi-suscripcion')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suscripcion vigente del cliente' })
  miSuscripcion(@Auth() u: UsuarioToken) {
    return this.movil.miSuscripcion(u.sub);
  }

  @Post('suscripcion')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contrata o renueva un plan' })
  contratar(@Auth() u: UsuarioToken, @Body() dto: ContratarPlanDto) {
    return this.movil.contratar(u.sub, dto);
  }

  @Post('acceso')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('cliente')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Entrar al gimnasio escaneando la pantalla',
    description:
      'La app escanea el QR que muestra la pantalla de la entrada y manda ese codigo aqui. ' +
      'La respuesta dice si se permite el paso y por que. Todo intento queda registrado.',
  })
  entrar(@Auth() u: UsuarioToken, @Body() dto: EntrarDto) {
    return this.movil.entrar(u.sub, dto.codigo);
  }

  @Get('gimnasios/:id/inventario')
  @ApiOperation({ summary: 'Que puede entrenar el socio en ese gimnasio' })
  inventario(@Param('id', ParseIntPipe) id: number) {
    return this.movil.inventario(id);
  }

  @Get('mi-historial')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Visitas del cliente' })
  historial(@Auth() u: UsuarioToken) {
    return this.movil.historial(u.sub);
  }

  @Post('gimnasios/:id/resena')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deja o actualiza una resena' })
  resena(
    @Auth() u: UsuarioToken,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResenaDto,
  ) {
    return this.movil.resena(u.sub, id, dto);
  }
}

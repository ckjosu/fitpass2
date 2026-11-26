import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ActualizarPerfilDto, CambiarPasswordDto, LoginDto, RecuperarDto, RegistroClienteDto, RegistroDuenoDto, RestablecerDto } from './auth.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Auth, JwtGuard, UsuarioToken } from '../common/security';

// Limite por IP en todo /auth (ademas del bloqueo por cuenta del login).
@ApiTags('auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Inicia sesion y devuelve el token' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('registro/dueno')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registra un dueno junto con su gimnasio' })
  registrarDueno(@Body() dto: RegistroDuenoDto) {
    return this.auth.registrarDueno(dto);
  }

  @Post('registro/cliente')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registra un cliente (app movil)' })
  registrarCliente(@Body() dto: RegistroClienteDto) {
    return this.auth.registrarCliente(dto);
  }

  @Post('recuperar')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Manda un codigo de 6 digitos al correo para cambiar la contrasena',
    description: 'Responde lo mismo exista o no el correo. El codigo vence en 15 minutos.',
  })
  recuperar(@Body() dto: RecuperarDto) {
    return this.auth.recuperar(dto);
  }

  @Post('restablecer')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cambia la contrasena con el codigo que llego por correo' })
  restablecer(@Body() dto: RestablecerDto) {
    return this.auth.restablecer(dto);
  }

  @Get('perfil')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos del usuario del token' })
  perfil(@Auth() u: UsuarioToken) {
    return this.auth.perfil(u.sub);
  }


  @Put('perfil')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza nombre, telefono y/o correo del usuario' })
  actualizarPerfil(@Auth() u: UsuarioToken, @Body() dto: ActualizarPerfilDto) {
    return this.auth.actualizarPerfil(u.sub, dto);
  }

  @Put('password')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambia la contrasena' })
  cambiar(@Auth() u: UsuarioToken, @Body() dto: CambiarPasswordDto) {
    return this.auth.cambiarPassword(u.sub, dto);
  }
}

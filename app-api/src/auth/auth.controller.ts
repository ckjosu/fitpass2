import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CambiarPasswordDto, LoginDto, RegistroClienteDto, RegistroDuenoDto } from './auth.dto';
import { Auth, JwtGuard, UsuarioToken } from '../common/security';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Inicia sesion y devuelve el token' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('registro/dueno')
  @ApiOperation({ summary: 'Registra un dueno junto con su gimnasio' })
  registrarDueno(@Body() dto: RegistroDuenoDto) {
    return this.auth.registrarDueno(dto);
  }

  @Post('registro/cliente')
  @ApiOperation({ summary: 'Registra un cliente (app movil)' })
  registrarCliente(@Body() dto: RegistroClienteDto) {
    return this.auth.registrarCliente(dto);
  }

  @Get('perfil')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Datos del usuario del token' })
  perfil(@Auth() u: UsuarioToken) {
    return this.auth.perfil(u.sub);
  }

  @Put('password')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambia la contrasena' })
  cambiar(@Auth() u: UsuarioToken, @Body() dto: CambiarPasswordDto) {
    return this.auth.cambiarPassword(u.sub, dto);
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UsuarioToken } from '../common/security';
import { Usuario } from '../entities';
import { secretoJwt } from '../common/config-seguridad';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@InjectRepository(Usuario) private usuarios: Repository<Usuario>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretoJwt(),
    });
  }

  /**
   * Ademas de la firma y la expiracion, revisa en la base que la cuenta siga
   * activa y que el token no sea de antes de un cambio de contrasena.
   */
  async validate(payload: UsuarioToken & { iat?: number }) {
    const usuario = await this.usuarios.findOne({
      where: { id: payload.sub },
      select: { id: true, activo: true, rol: true, sesionesDesde: true },
    });
    if (!usuario || !usuario.activo) throw new UnauthorizedException('Tu sesion ya no es valida');
    if (usuario.sesionesDesde && (payload.iat ?? 0) * 1000 < usuario.sesionesDesde.getTime()) {
      throw new UnauthorizedException('Tu sesion vencio, vuelve a iniciar sesion');
    }
    return { sub: payload.sub, email: payload.email, rol: usuario.rol, nombre: payload.nombre };
  }
}

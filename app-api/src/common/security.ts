import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gimnasio, Rol } from '../entities';

export interface UsuarioToken {
  sub: number;
  email: string;
  rol: Rol;
  nombre: string;
}

/** Protege una ruta con el token JWT. */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

/** Deja pasar solo a los roles marcados con @Roles(). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const req = ctx.switchToHttp().getRequest();
    if (!req.user || !roles.includes(req.user.rol)) {
      throw new ForbiddenException('Tu cuenta no tiene permiso para esta accion');
    }
    return true;
  }
}

/** Saca el usuario del token en los controladores. */
export const Auth = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioToken =>
    ctx.switchToHttp().getRequest().user,
);

/**
 * Verifica que el gimnasio de la ruta (:gymId) sea del dueno que va en el token.
 * El admin pasa siempre.
 */
@Injectable()
export class DuenoDelGimnasioGuard implements CanActivate {
  constructor(@InjectRepository(Gimnasio) private gimnasios: Repository<Gimnasio>) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const usuario: UsuarioToken = req.user;
    const id = Number(req.params.gymId ?? req.params.id);

    if (!id) throw new ForbiddenException('Falta el gimnasio');
    if (usuario?.rol === 'admin') return true;

    const gimnasio = await this.gimnasios.findOne({ where: { id } });
    if (!gimnasio) throw new NotFoundException('Ese gimnasio no existe');
    if (gimnasio.idDueno !== usuario.sub) {
      throw new ForbiddenException('Ese gimnasio no es tuyo');
    }
    return true;
  }
}

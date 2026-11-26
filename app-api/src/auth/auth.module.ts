import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratoGimnasio, Gimnasio, RecuperacionPassword, Usuario } from '../entities';
import { CorreoService } from '../common/correo.service';
import { DURACION_SESION, secretoJwt } from '../common/config-seguridad';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Gimnasio, ContratoGimnasio, RecuperacionPassword]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: secretoJwt(),
      signOptions: { expiresIn: DURACION_SESION },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, CorreoService],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}

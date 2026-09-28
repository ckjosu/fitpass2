import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Acceso, ContratoGimnasio, Gimnasio, Lector, PlanPlataforma, Suscripcion,
} from '../entities';
import { AccessService } from './access.service';
import { AccessController } from './access.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Acceso, Lector, Suscripcion, PlanPlataforma, Gimnasio, ContratoGimnasio,
    ]),
  ],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}

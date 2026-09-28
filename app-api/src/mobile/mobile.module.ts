import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Acceso, Gimnasio, Pago, PlanPlataforma, Resena, Suscripcion,
} from '../entities';
import { AccessModule } from '../access/access.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MobileService } from './mobile.service';
import { MobileController } from './mobile.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanPlataforma, Suscripcion, Pago, Resena, Gimnasio, Acceso,
    ]),
    AccessModule,
    InventoryModule,
  ],
  controllers: [MobileController],
  providers: [MobileService],
})
export class MobileModule {}

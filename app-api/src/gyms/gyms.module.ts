import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AmenidadGimnasio, FotoGimnasio, Gimnasio, HorarioGimnasio,
  PrecioGimnasio, PrecioHistorial, ServicioGimnasio,
} from '../entities';
import { GymsService } from './gyms.service';
import { GymsController, PricesController } from './gyms.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Gimnasio, HorarioGimnasio, FotoGimnasio, ServicioGimnasio,
      AmenidadGimnasio, PrecioGimnasio, PrecioHistorial,
    ]),
  ],
  controllers: [GymsController, PricesController],
  providers: [GymsService],
  exports: [GymsService],
})
export class GymsModule {}

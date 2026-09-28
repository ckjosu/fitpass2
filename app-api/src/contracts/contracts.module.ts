import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratoGimnasio, Gimnasio, Liquidacion, SolicitudBaja, SolicitudPlan } from '../entities';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContratoGimnasio, SolicitudPlan, SolicitudBaja, Liquidacion, Gimnasio]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}

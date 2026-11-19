import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratoGimnasio, Gimnasio, Liquidacion, SolicitudBaja } from '../entities';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';

@Module({
  imports: [
    // Gimnasio lo usa el guard que revisa que seas el dueno.
    TypeOrmModule.forFeature([ContratoGimnasio, SolicitudBaja, Liquidacion, Gimnasio]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}

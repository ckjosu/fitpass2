import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoEquipo, ClaseGimnasio, Gimnasio, HorarioClase, ReservaClase } from '../entities';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';

@Module({
  // Gimnasio lo usa el guard que revisa que seas el dueno.
  imports: [TypeOrmModule.forFeature([ClaseGimnasio, HorarioClase, ReservaClase, CatalogoEquipo, Gimnasio])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}

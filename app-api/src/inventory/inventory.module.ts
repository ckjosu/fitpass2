import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoEquipo, Gimnasio, InventarioGimnasio } from '../entities';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventarioGimnasio, CatalogoEquipo, Gimnasio])],
  controllers: [InventoryController, CatalogController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}

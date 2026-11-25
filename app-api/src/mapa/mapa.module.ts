import { Module } from '@nestjs/common';
import { MapaController } from './mapa.controller';

@Module({ controllers: [MapaController] })
export class MapaModule {}

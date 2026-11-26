import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { GymsModule } from './gyms/gyms.module';
import { ContractsModule } from './contracts/contracts.module';
import { AccessModule } from './access/access.module';
import { MobileModule } from './mobile/mobile.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SettingsModule } from './settings/settings.module';
import { KioskModule } from './kiosk/kiosk.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ClassesModule } from './classes/classes.module';
import { MapaModule } from './mapa/mapa.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite por IP; se aplica en las rutas que usan ThrottlerGuard (/auth)
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 30 }]),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'gymred',
      password: process.env.DB_PASSWORD || 'gymred123',
      database: process.env.DB_NAME || 'gymred',
      entities: [__dirname + '/entities{.ts,.js}'],
      // Las columnas DATE llegan como texto 'YYYY-MM-DD'. Si se convierten a
      // Date, la zona horaria las recorre un dia (15 de enero salia 14).
      dateStrings: ['DATE'],
      synchronize: false, // el esquema lo crean los scripts de db/
      timezone: 'Z',
      extra: {
        decimalNumbers: true,
        // Con DB_CA (el certificado CA de Aiven) se verifica que el servidor
        // sea de verdad Aiven; sin el, la conexion va cifrada pero sin verificar.
        ssl:
          process.env.DB_SSL === 'true'
            ? process.env.DB_CA
              ? { ca: process.env.DB_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true }
              : { rejectUnauthorized: false }
            : undefined,
      },
    }),
    AuthModule,
    GymsModule,
    ContractsModule,
    AccessModule,
    MobileModule,
    IncidentsModule,
    SettingsModule,
    KioskModule,
    InventoryModule,
    ReviewsModule,
    ClassesModule,
    MapaModule,
  ],
})
export class AppModule {}

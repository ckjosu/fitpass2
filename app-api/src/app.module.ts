import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'gymred',
      password: process.env.DB_PASSWORD || 'gymred123',
      database: process.env.DB_NAME || 'gymred',
      entities: [__dirname + '/entities{.ts,.js}'],
      synchronize: false, // el esquema lo crean los scripts de db/
      timezone: 'Z',
      extra: { decimalNumbers: true },
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
  ],
})
export class AppModule {}

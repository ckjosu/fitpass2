import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', allowedHeaders: 'Content-Type,Authorization' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  // Carpeta donde se guardan las fotos de los gimnasios.
  // Son archivos de imagen, no interfaz: la API sigue sin generar HTML.
  const uploads = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
  mkdirSync(uploads, { recursive: true });
  app.useStaticAssets(uploads, { prefix: '/uploads/' });

  // Contrato de la API en formato OpenAPI, para el equipo movil.
  // Se publica como JSON, no como pagina: la API no sirve ninguna interfaz.
  const config = new DocumentBuilder()
    .setTitle('Gymred API')
    .setDescription(
      'API de la plataforma de gimnasios Gymred. La usan el panel web, el lector de acceso y la app movil.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticacion de duenos y clientes')
    .addTag('gimnasios', 'Panel web: datos, horarios, fotos, servicios y amenidades')
    .addTag('precios', 'Panel web: precios propios del gimnasio')
    .addTag('contrato', 'Panel web: plan Gymred, liquidaciones y baja')
    .addTag('accesos', 'Panel web: dashboard, historial y reportes')
    .addTag('pantalla', 'Pantalla de acceso: genera el QR que escanea el socio')
    .addTag('inventario', 'Panel web: equipo y actividades del gimnasio')
    .addTag('incidencias', 'Panel web: reportes de mantenimiento')
    .addTag('configuracion', 'Panel web: preferencias del panel y del lector')
    .addTag('movil', 'Endpoints de la app movil (clientes)')
    .build();

  const contrato = SwaggerModule.createDocument(app, config);
  app.getHttpAdapter().get('/api/openapi.json', (_req: unknown, res: any) => res.json(contrato));

  const port = Number(process.env.PORT || 8000);
  await app.listen(port, '0.0.0.0');
  console.log(`Gymred API escuchando en http://localhost:${port}/api`);
  console.log(`Contrato de la API en http://localhost:${port}/api/openapi.json`);
}

bootstrap();

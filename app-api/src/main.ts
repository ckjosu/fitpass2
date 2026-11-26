import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { EN_PRODUCCION } from './common/config-seguridad';
import { LimpiarTextoPipe } from './common/limpiar-texto.pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Render esta detras de un proxy: asi la IP real del cliente llega al
  // limite de intentos y se sabe si la peticion vino por HTTPS.
  app.set('trust proxy', 1);

  // En produccion todo va por HTTPS: si algo llega por HTTP se rechaza.
  if (EN_PRODUCCION) {
    app.use((req: any, res: any, next: () => void) => {
      if (req.headers['x-forwarded-proto'] === 'http') {
        return res.status(403).json({ statusCode: 403, message: 'Usa HTTPS' });
      }
      next();
    });
  }

  // Cabeceras de seguridad (HSTS, nosniff, etc.). Las fotos se cargan desde
  // el panel en otro dominio, por eso cross-origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS_ORIGINS = dominios del panel separados por coma. La app movil no
  // manda Origin, asi que no le afecta.
  const origenes = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: origenes.length ? origenes : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });
  // El orden importa: primero se limpia el texto y luego se valida,
  // para que un nombre con espacios de sobra no pase como distinto.
  app.useGlobalPipes(
    new LimpiarTextoPipe(),
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
    .addTag('contrato', 'Panel web: afiliacion sin costo, clase del gimnasio, precio por visita, ganancias y baja')
    .addTag('accesos', 'Panel web: dashboard, historial y reportes')
    .addTag('pantalla', 'Pantalla de acceso: genera el QR que escanea el socio')
    .addTag('inventario', 'Panel web: equipo y actividades del gimnasio')
    .addTag('incidencias', 'Panel web: reportes de mantenimiento')
    .addTag('configuracion', 'Panel web: preferencias del panel y del lector')
    .addTag('resenas', 'Panel web: calificacion, comentarios y respuestas del dueno')
    .addTag('clases', 'Panel web: clases con horario semanal, cupo e inscritos')
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

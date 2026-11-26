# Servidor

En producción cada parte vive en un servicio distinto, todos con HTTPS.

| Parte | Servicio | Cómo se actualiza |
|---|---|---|
| Panel web | Netlify | Se compila solo al hacer push |
| API | Render (`gymred-api.onrender.com`) | Se publica sola al hacer push a `developers/josue` |
| Base de datos | Aiven (MySQL) | Los scripts nuevos se corren a mano, en orden |
| Documentación | Flask, en local con Docker (o en Render) | `docker compose up docs` |

## En local

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

| Servicio | Dirección |
|---|---|
| Panel | http://localhost:4200 |
| API | http://localhost:8000/api |
| Contrato de la API | http://localhost:8000/api/openapi.json |
| Documentación (Flask) | http://localhost:5000 |
| phpMyAdmin | http://localhost:8080 |

La página **Estado** de esta documentación revisa en vivo si la API responde.

## Variables de entorno de la API

| Variable | Para qué |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión a MySQL |
| `DB_SSL`, `DB_CA` | Conexión cifrada y verificada con Aiven |
| `JWT_SECRET` | Firma de los tokens (obligatoria en producción) |
| `CORS_ORIGINS` | Dominio del panel |
| `BREVO_API_KEY`, `CORREO_DESDE` | Correos de recuperación de contraseña |

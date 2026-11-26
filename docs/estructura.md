# Estructura del repositorio

```text
fitpass2/
├── app-api/                 API en NestJS
│   └── src/
│       ├── auth/            login, registro, recuperar contraseña
│       ├── gyms/            datos, fotos y horarios del gimnasio
│       ├── access/          entradas con QR y reglas de visitas
│       ├── classes/         clases, horarios y reservas
│       ├── reviews/         reseñas y respuestas
│       ├── contracts/       precio por visita, cierre y pagos
│       ├── mobile/          rutas que usa la app
│       ├── kiosk/           pantalla con el QR que rota
│       └── common/          tarifas.ts, seguridad, correo
├── app-angular/             panel web en Angular
│   └── src/app/
│       ├── core/            servicios HTTP, guard e interceptor
│       ├── layout/          menú lateral y barra superior
│       ├── pages/           una carpeta por pantalla
│       └── shared/          componentes reutilizables (mapa)
├── docs/                    esta documentación en Markdown
├── docs-flask/              servidor Flask que publica la documentación
├── tests-selenium/          pruebas automáticas del panel
├── docker/
│   ├── dev/                 Dockerfiles y SQL de desarrollo
│   └── prod/                Dockerfiles y SQL de producción
├── docker-compose.dev.yml   levanta todo en local
├── docker-compose.prod.yml
├── netlify.toml             publicación del panel
└── README.md
```

Regla del equipo: cada cosa en su carpeta, y si un cambio de código cambia algo de la
documentación, se actualiza en el mismo commit.

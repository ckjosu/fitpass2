# Gymred — Panel Web (estructura Angular)

Estructura base lista para el panel web de dueños de gimnasio de Gymred,
generada con componentes standalone de Angular (v18) y routing por carga
diferida (`loadComponent`).

## Cómo correrlo

```bash
npm install
npm start
```

Abre http://localhost:4200 — la app arranca en `/login`.

## Estructura

```
src/app/
  app.routes.ts        # todas las rutas del panel
  layout/
    shell/              # sidebar + topbar + <router-outlet> (usado por todas las
                          páginas excepto login/register)
    sidebar/
    topbar/
  pages/
    login/
    register/
    dashboard/           # Resumen
    maintenance/         # Mantenimiento del gimnasio (info, horarios, fotos)
    pricing/              # Gestión de precios propios del gimnasio
    plan/         # Plan contratado con la plataforma Gymred
    accesses/             # Historial de accesos
    reports/               # Reportes (ingresos, visitas)
    cancel/                 # Dar de baja el gimnasio de la plataforma
```

## Identidad visual

Los colores, tipografía y estilos base (tarjetas, botones, inputs, badges)
están centralizados en `src/styles.scss` como variables CSS (`--fp-orange`,
`--fp-blue`, etc.) y clases utilitarias (`.fp-card`, `.fp-btn-primary`, etc.),
para que todas las pantallas compartan el mismo lenguaje visual.

## Pendiente (marcado con `// TODO` en el código)

- Conectar cada página al backend real (API de Gymred) en vez de los datos
  de ejemplo hardcodeados.
- Autenticación real en `login` y `register` (guardas de ruta / interceptor
  para proteger las rutas dentro del `shell`).
- Reemplazar las barras CSS de `reports` por una librería de gráficos
  (ngx-charts, Chart.js, etc.) si se requiere algo más completo.
- Subida real de fotos en `maintenance`.

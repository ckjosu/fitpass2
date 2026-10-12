# Gymred — Plataforma de acceso a gimnasios

Proyecto de Programación Web (AEB-1055) — ITESCAM
Equipo TacoCoders

Plataforma que permite a un socio pagar una sola suscripción y entrar a cualquier
gimnasio afiliado. Este repositorio contiene el panel web para los dueños de gimnasio,
la API central y la base de datos, cada uno en su propio contenedor Docker.

---

## 1. Scaffolding (estructura de archivos)

```
gymred/
├── docker/
│   ├── dev/
│   │   ├── api/Dockerfile              # Imagen de la API con Node en modo watch
│   │   ├── angular/Dockerfile          # Imagen de Angular con ng serve
│   │   └── mysql/                      # Scripts de inicialización de la BD
│   │       ├── 01_schema.sql
│   │       ├── 02_seed.sql
│   │       ├── 03_catalogo.sql
│   │       └── 04_normalizacion.sql
│   └── prod/
│       ├── api/Dockerfile              # Imagen compilada de la API
│       ├── angular/Dockerfile          # Angular compilado servido por nginx
│       ├── angular/nginx.conf
│       └── mysql/Dockerfile            # MySQL con el esquema ya cargado
├── docker-compose.dev.yml              # Configuración de desarrollo
├── docker-compose.prod.yml             # Configuración de producción
├── app-api/                            # Código de la API (NestJS)
├── app-angular/                        # Código del frontend (Angular)
└── README.md
```

---

## 2. Wireframe: servicios, puertos e interacciones

```
                    ┌─────────────────────────┐
   Navegador ─────► │  Angular      :4200     │
                    └───────────┬─────────────┘
                                │  HTTP / JSON
                                ▼
                    ┌─────────────────────────┐
   App móvil ─────► │  API          :8000     │
                    └───────────┬─────────────┘
                                │  SQL
                                ▼
                    ┌─────────────────────────┐
                    │  MySQL        :3306     │ ◄──── phpMyAdmin :8080
                    └─────────────────────────┘
```

| Servicio | Puerto | URL |
|---|---|---|
| Angular (panel web) | 4200 | http://localhost:4200 |
| API | 8000 | http://localhost:8000/api |
| phpMyAdmin | 8080 | http://localhost:8080 |
| MySQL | 3306 | localhost:3306 |

Los tres programas son independientes y solo se hablan por la red, con URLs y JSON.
Angular no importa código de la API; la API nunca genera HTML, solo devuelve JSON;
MySQL solo entiende SQL.

---

## 3. Plan de pruebas básico

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Abrir http://localhost:4200 | Carga la pantalla de inicio de sesión de Gymred |
| 2 | Abrir http://localhost:8000/api/movil/planes | Devuelve el JSON con los planes Básico, Plus y Elite |
| 3 | Abrir http://localhost:8080 | Entra phpMyAdmin con usuario `gymred` y contraseña `gymred123` |
| 4 | En phpMyAdmin revisar la base `gymred` | Aparecen las 22 tablas y las 2 vistas |
| 5 | Iniciar sesión con `ricardo@ironhouse.mx` / `Gymred123` | Entra al panel y muestra el resumen del gimnasio |
| 6 | Cambiar un precio y recargar | El precio nuevo persiste y el cambio aparece en el historial |
| 7 | Apagar y volver a levantar sin `-v` | Los datos siguen ahí (persistencia por volumen) |
| 8 | Entrar al gimnasio de otra dueña por la API | Responde 403 Forbidden |
| 9 | Agregar un equipo que ya está en el inventario | Avisa que edite la cantidad |
| 10 | Escribir "caminadora" cuando ya existe "Caminadora" | Lo rechaza como repetido |
| 11 | Agregar la amenidad "  sauna  " | La guarda como "Sauna" con su ícono |
| 12 | Repetir esa amenidad en mayúsculas | Avisa que ya la tiene |

---

## 3.1 Alcance del Sprint 1

En el Sprint 1 el panel publicaba solo cuatro pantallas. **En el Sprint 2 ya se
publican todas**, porque `SOLO_SPRINT_1` está en `false`.

El resto del panel (Pantalla de acceso, Accesos, Reportes, Mantenimiento, Planes y
precios, Plan Gymred, Configuración y Baja) **sigue completo en el proyecto**: sus
carpetas, servicios y endpoints no se eliminaron. Simplemente no se registran en las
rutas ni aparecen en el menú.

Eso se controla desde un solo archivo, `app-angular/src/app/core/sprint.config.ts`:

```ts
export const SOLO_SPRINT_1 = false;
export const RUTAS_SPRINT_1 = ['dashboard', 'maintenance', 'inventory'];
```

El mecanismo se queda por si en otra entrega hay que volver a recortar: se pone
`true` y se ajusta la lista de rutas.

---

## 3.2 Catálogo de equipo

El inventario se capturaba escribiendo el nombre a mano, así que el mismo aparato
terminaba guardado de varias formas: "Caminadora", "caminadora", "Caminadoras",
"Cinta de correr". Para la base eran equipos distintos, lo que ensucia los reportes y
hace que el socio no encuentre nada al buscar en la app.

Ahora el dueño **elige de un catálogo** de 52 equipos estándar en vez de escribir, y la
base impide que un mismo equipo se repita dentro de un gimnasio: si tiene seis
caminadoras, pone cantidad 6. La comparación no distingue mayúsculas ni acentos, así
que "caminadora" choca con "Caminadora".

Si el equipo no está en el catálogo, se puede capturar con la opción
*No está en la lista…*, que guarda el nombre limpio de espacios sobrantes.

El archivo `03_catalogo.sql` sirve para los dos casos: instalación nueva, y base que
ya estaba en uso. En el segundo caso junta los duplicados que existan, sumando las
cantidades, antes de poner las restricciones.

El mismo problema estaba en otros tres lugares y `04_normalizacion.sql` los corrige:

- **Amenidades**: ahora salen de un catálogo de 16 y no se repiten dentro de un gimnasio.
- **Servicios**: un gimnasio ya no puede ofrecer dos veces el mismo.
- **Reportes de mantenimiento**: el equipo se elige del inventario del gimnasio en vez de escribirlo.
- **Ciudad y estado**: se dejan parejos, porque el socio busca por ciudad en la app.

Además, la API limpia el texto de **toda** petición antes de guardarlo: recorta espacios
de los lados y junta los repetidos de en medio. Así `"  Prensa   de piernas "` y
`"Prensa de piernas"` entran idénticos y las restricciones sí pueden hacer su trabajo.
Las contraseñas solo se recortan a los lados, nunca por dentro.

---

## 4. Ambiente de desarrollo

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml ps
```

En desarrollo el código se monta como volumen: al guardar un archivo, Angular
recarga el navegador y la API se reinicia sola. No hay que reconstruir la imagen.

Para ver los registros de un servicio:

```bash
docker compose -f docker-compose.dev.yml logs -f angular
docker compose -f docker-compose.dev.yml logs -f api
```

Para apagar:

```bash
docker compose -f docker-compose.dev.yml down        # conserva los datos
docker compose -f docker-compose.dev.yml down -v     # borra la base y recarga el seed
```

## 5. Ambiente de producción

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Diferencias con desarrollo:

- Angular se compila y lo sirve **nginx**, no `ng serve`. Pesa mucho menos y carga más rápido.
- La API se compila y la imagen final no lleva las dependencias de desarrollo.
- MySQL trae su propia imagen con el esquema ya incluido y **no publica el puerto 3306**:
  solo la API la alcanza desde la red interna.

---

## 6. Usuarios de prueba

| Correo | Rol | Contraseña |
|---|---|---|
| admin@gymred.mx | administrador de la plataforma | Admin123 |
| ricardo@ironhouse.mx | dueño, 2 gimnasios | Gymred123 |
| marisol@energymx.mx | dueña, 2 gimnasios | Gymred123 |
| erick@correo.com | socio, plan Plus | Gymred123 |
| luis@correo.com | socio, plan Básico | Gymred123 |
| mauricio@correo.com | socio, plan Elite | Gymred123 |
| tommy@correo.com | socio con suscripción vencida | Gymred123 |

En phpMyAdmin: servidor `mysql`, usuario `gymred`, contraseña `gymred123`.

---

## 7. Qué hace el panel web

| Pantalla | Qué resuelve |
|---|---|
| Resumen | Accesos del día y del mes, ingreso estimado, avisos pendientes |
| Pantalla de acceso | Genera el QR que se proyecta en la entrada, con modo pantalla completa |
| Accesos | Historial con filtros por fecha, resultado y búsqueda |
| Reportes | Visitas por mes y por día, socios más frecuentes, motivos de rechazo |
| Datos del gimnasio | Información general, horarios y fotos |
| Inventario | Equipo y actividades; es lo que el socio ve en la app |
| Planes y precios | Precios propios del gimnasio, con historial automático |
| Mantenimiento | Reportes de averías del equipo, con prioridad y seguimiento |
| Plan Gymred | Contrato con la plataforma, facturación y liquidaciones |
| Configuración | Tema, color de acento, vigencia del QR y avisos |

## 8. Cómo entra un socio

El gimnasio pone una tablet o un monitor en la entrada con el panel en modo pantalla
completa, mostrando un código QR que se renueva cada pocos segundos. El socio lo escanea
con la app y la app manda ese código a la API, que decide si lo deja pasar.

Que el código dure poco importa: si alguien le toma foto a la pantalla, esa foto deja de
servir casi enseguida.

La API revisa, en orden: que el código sea de una pantalla real y activa, que no esté
vencido, que el socio tenga suscripción vigente, que el nivel de su plan alcance el del
gimnasio, y que no haya pasado su límite de visitas del día ni del mes. Todo intento
queda registrado, se permita o no.

---

## 9. Tecnologías

| Capa | Herramienta |
|---|---|
| Base de datos | MySQL 8 |
| Backend | NestJS (Node + TypeScript) con TypeORM |
| Frontend | Angular 18 con componentes standalone |
| Administración de BD | phpMyAdmin |
| Contenedores | Docker y Docker Compose |

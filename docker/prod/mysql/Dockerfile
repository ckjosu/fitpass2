# Imagen de MySQL para produccion: carga el esquema y los datos base
# la primera vez que arranca el volumen.
FROM mysql:8.0

COPY 01_schema.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY 02_seed.sql   /docker-entrypoint-initdb.d/02_seed.sql
COPY 03_catalogo.sql /docker-entrypoint-initdb.d/03_catalogo.sql
COPY 04_normalizacion.sql /docker-entrypoint-initdb.d/04_normalizacion.sql
COPY 05_modelo_sin_cuota.sql /docker-entrypoint-initdb.d/05_modelo_sin_cuota.sql
COPY 06_clases_y_resenas.sql /docker-entrypoint-initdb.d/06_clases_y_resenas.sql
COPY 07_datos_clases_y_resenas.sql /docker-entrypoint-initdb.d/07_datos_clases_y_resenas.sql
COPY 08_modelo_wellhub.sql /docker-entrypoint-initdb.d/08_modelo_wellhub.sql
COPY 09_datos_modelo_wellhub.sql /docker-entrypoint-initdb.d/09_datos_modelo_wellhub.sql
COPY 10_diseno_negro_rojo.sql /docker-entrypoint-initdb.d/10_diseno_negro_rojo.sql
COPY 11_dias_y_fotos.sql /docker-entrypoint-initdb.d/11_dias_y_fotos.sql
COPY 12_seguridad.sql /docker-entrypoint-initdb.d/12_seguridad.sql

EXPOSE 3306

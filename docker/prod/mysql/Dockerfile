# Imagen de MySQL para produccion: carga el esquema y los datos base
# la primera vez que arranca el volumen.
FROM mysql:8.0

COPY 01_schema.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY 02_seed.sql   /docker-entrypoint-initdb.d/02_seed.sql
COPY 03_catalogo.sql /docker-entrypoint-initdb.d/03_catalogo.sql
COPY 04_normalizacion.sql /docker-entrypoint-initdb.d/04_normalizacion.sql

EXPOSE 3306

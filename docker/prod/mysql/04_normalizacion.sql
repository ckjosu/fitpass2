-- =====================================================================
-- Gymred - Normalizacion del resto de los campos de texto
--
-- Es la misma observacion del inventario, aplicada a los otros lugares
-- donde se capturaba texto libre y el mismo dato podia quedar guardado de
-- varias formas:
--
--   amenidades_gimnasio   "Regaderas" / "regaderas" / "Regadera"
--   servicios_gimnasio    "Spinning"  / "spinning"  / "Clase de spinning"
--   incidencias.equipo    "Cinta #2"  / "cinta 2"   / "Caminadora 2"
--   gimnasios             nombres y direcciones con espacios de sobra
--
-- Que hace este archivo:
--   1. Crea un catalogo de amenidades, igual que el de equipo.
--   2. Limpia los espacios sobrantes de lo que ya esta capturado.
--   3. Junta los duplicados que existan.
--   4. Pone las restricciones para que no vuelva a pasar.
--
-- Se puede correr en una base nueva o en una que ya este en uso.
-- =====================================================================

USE gymred;

-- ---------------------------------------------------------------------
-- 24. CATALOGO DE AMENIDADES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_amenidad (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  icono  VARCHAR(40) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_catalogo_amenidad (nombre)
) ENGINE=InnoDB;

INSERT IGNORE INTO catalogo_amenidad (nombre, icono) VALUES
('Regaderas','shower'),
('Vestidores','locker'),
('Lockers','lock'),
('Estacionamiento','parking'),
('Wifi','wifi'),
('Cafeteria','coffee'),
('Alberca','pool'),
('Sauna','sauna'),
('Vapor','steam'),
('Aire acondicionado','ac'),
('Area de estiramiento','stretch'),
('Tienda de suplementos','store'),
('Agua purificada','water'),
('Acceso para silla de ruedas','accessible'),
('Guarderia','childcare'),
('Area de descanso','lounge');

-- ---------------------------------------------------------------------
-- Limpiar espacios sobrantes de lo que ya esta capturado
-- ---------------------------------------------------------------------
UPDATE gimnasios SET
  nombre  = TRIM(nombre),
  calle   = TRIM(calle),
  colonia = TRIM(colonia),
  ciudad  = TRIM(ciudad),
  estado  = TRIM(estado);

UPDATE servicios_gimnasio  SET nombre = TRIM(nombre);
UPDATE amenidades_gimnasio SET nombre = TRIM(nombre);
UPDATE incidencias         SET equipo = TRIM(equipo), titulo = TRIM(titulo);

-- ---------------------------------------------------------------------
-- Amenidades: amarrar al catalogo y quitar repetidas
-- ---------------------------------------------------------------------
SET @hay_columna = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema='gymred' AND table_name='amenidades_gimnasio' AND column_name='id_catalogo'
);
SET @sql = IF(@hay_columna = 0,
  'ALTER TABLE amenidades_gimnasio ADD COLUMN id_catalogo INT UNSIGNED NULL AFTER id_gimnasio',
  'SELECT "la columna ya existe"');
PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;

-- La intercalacion de la base no distingue mayusculas ni acentos,
-- asi que "regaderas" encuentra "Regaderas".
UPDATE amenidades_gimnasio a
JOIN catalogo_amenidad c ON c.nombre = a.nombre
SET a.id_catalogo = c.id, a.nombre = c.nombre, a.icono = COALESCE(a.icono, c.icono)
WHERE a.id_catalogo IS NULL;

DELETE a FROM amenidades_gimnasio a
JOIN (
  SELECT id_gimnasio, nombre, MIN(id) AS conservar
  FROM amenidades_gimnasio GROUP BY id_gimnasio, nombre HAVING COUNT(*) > 1
) d ON a.id_gimnasio = d.id_gimnasio AND a.nombre = d.nombre AND a.id <> d.conservar;

SET @hay_fk = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema='gymred' AND table_name='amenidades_gimnasio'
    AND constraint_name='fk_amenidad_catalogo'
);
SET @sql = IF(@hay_fk = 0,
  'ALTER TABLE amenidades_gimnasio
     ADD CONSTRAINT fk_amenidad_catalogo FOREIGN KEY (id_catalogo)
     REFERENCES catalogo_amenidad(id) ON DELETE SET NULL',
  'SELECT "la llave ya existe"');
PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;

SET @hay_uq = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema='gymred' AND table_name='amenidades_gimnasio'
    AND index_name='uq_amenidad_gimnasio'
);
SET @sql = IF(@hay_uq = 0,
  'ALTER TABLE amenidades_gimnasio ADD UNIQUE KEY uq_amenidad_gimnasio (id_gimnasio, nombre)',
  'SELECT "la restriccion ya existe"');
PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;

-- ---------------------------------------------------------------------
-- Servicios: un gimnasio no puede ofrecer el mismo servicio dos veces
-- ---------------------------------------------------------------------
DELETE s FROM servicios_gimnasio s
JOIN (
  SELECT id_gimnasio, nombre, MIN(id) AS conservar
  FROM servicios_gimnasio GROUP BY id_gimnasio, nombre HAVING COUNT(*) > 1
) d ON s.id_gimnasio = d.id_gimnasio AND s.nombre = d.nombre AND s.id <> d.conservar;

SET @hay_uq = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema='gymred' AND table_name='servicios_gimnasio'
    AND index_name='uq_servicio_gimnasio'
);
SET @sql = IF(@hay_uq = 0,
  'ALTER TABLE servicios_gimnasio ADD UNIQUE KEY uq_servicio_gimnasio (id_gimnasio, nombre)',
  'SELECT "la restriccion ya existe"');
PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;

-- ---------------------------------------------------------------------
-- Ciudad y estado: el socio busca por ciudad en la app, asi que no pueden
-- quedar escritas de formas distintas.
-- ---------------------------------------------------------------------
UPDATE gimnasios SET ciudad = 'Merida'  WHERE ciudad LIKE 'merida%' OR ciudad LIKE 'Mérida%';
UPDATE gimnasios SET estado = 'Yucatan' WHERE estado LIKE 'yucatan%' OR estado LIKE 'Yucatán%';

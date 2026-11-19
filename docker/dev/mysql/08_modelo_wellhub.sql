-- =====================================================================
-- Gymred / FITNEX - Modelo de pago tipo Wellhub, con los planes del Canvas
--
--   * El gimnasio no paga nada.
--   * Categorias de gimnasio: Esencial y Completo. Cada una tiene un tope
--     de lo que se paga por visita.
--   * Planes del socio (Modelo Canvas):
--       Esencial $400  todos los gimnasios Esencial, 12 visitas al mes
--       Plus     $500  Esencial y Completo, 12 visitas al mes, ocupacion
--                      y recomendaciones
--   * Pago: por cada visita, el precio del gimnasio sin pasar el tope de
--     su categoria. Cada socio tiene un tope mensual = su fondo (70% de
--     su plan). Si sus visitas pasan del fondo, se pagan en proporcion.
--     Lo que no se usa del fondo se queda en FITNEX (30% / 70%).
--
-- Se puede correr en una base nueva o en una que ya este en uso, y mas
-- de una vez.
-- =====================================================================

USE gymred;

DROP PROCEDURE IF EXISTS agregar_columna;
DELIMITER //
CREATE PROCEDURE agregar_columna(IN tabla VARCHAR(64), IN columna VARCHAR(64), IN definicion VARCHAR(200))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gymred' AND table_name = tabla AND column_name = columna
  ) THEN
    SET @sql = CONCAT('ALTER TABLE ', tabla, ' ADD COLUMN ', columna, ' ', definicion);
    PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;
  END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 29. CATEGORIAS DE GIMNASIO Y SU TOPE POR VISITA
-- La categoria de cada gimnasio sale de su inventario
-- (ver app-api/src/common/tarifas.ts).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_gimnasio (
  nivel           TINYINT UNSIGNED PRIMARY KEY,
  nombre          VARCHAR(40)   NOT NULL,
  descripcion     VARCHAR(200)  NULL,
  tope_por_visita DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

INSERT INTO categorias_gimnasio (nivel, nombre, descripcion, tope_por_visita) VALUES
(1, 'Esencial', 'Gimnasio con herramientas limitadas', 30.00),
(2, 'Completo', 'Tiene peso libre, maquinas y cardio para todos los grupos musculares', 45.00)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion),
                        tope_por_visita = VALUES(tope_por_visita);

-- ---------------------------------------------------------------------
-- 30. PLANES DEL SOCIO
-- nivel: 1 = solo gimnasios Esencial, 2 = Esencial y Completo
-- porcentaje_fondo: parte del precio que se reparte a los gimnasios
-- ---------------------------------------------------------------------
CALL agregar_columna('planes_plataforma', 'codigo', "VARCHAR(10) NULL AFTER id");
CALL agregar_columna('planes_plataforma', 'porcentaje_fondo', 'DECIMAL(5,2) NOT NULL DEFAULT 70.00 AFTER precio_mensual');
CALL agregar_columna('planes_plataforma', 'invitados_por_mes', 'TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER visitas_por_mes');

UPDATE planes_plataforma SET
  codigo = 'esencial', nombre = 'Esencial',
  descripcion = 'Membresia FITNEX Esencial: todos los gimnasios Esencial de la red, 12 visitas al mes.',
  precio_mensual = 400.00, porcentaje_fondo = 70.00, nivel = 1,
  visitas_por_dia = 1, visitas_por_mes = 12, invitados_por_mes = 0, activo = 1
WHERE id = 1;

UPDATE planes_plataforma SET
  codigo = 'plus', nombre = 'Plus',
  descripcion = 'Membresia FITNEX Plus: gimnasios Esencial y Completo, 12 visitas al mes, ocupacion y recomendaciones.',
  precio_mensual = 500.00, porcentaje_fondo = 70.00, nivel = 2,
  visitas_por_dia = 1, visitas_por_mes = 12, invitados_por_mes = 0, activo = 1
WHERE id = 2;

-- Cualquier otro plan viejo (Elite) queda apagado y sus socios pasan a Plus.
UPDATE suscripciones SET id_plan = 2 WHERE id_plan NOT IN (1, 2);
UPDATE planes_plataforma SET activo = 0, codigo = NULL WHERE id NOT IN (1, 2);

-- El tope por visita ahora vive en la categoria del gimnasio.
DROP PROCEDURE IF EXISTS quitar_columna;
DELIMITER //
CREATE PROCEDURE quitar_columna(IN tabla VARCHAR(64), IN columna VARCHAR(64))
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'gymred' AND table_name = tabla AND column_name = columna
  ) THEN
    SET @sql = CONCAT('ALTER TABLE ', tabla, ' DROP COLUMN ', columna);
    PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;
  END IF;
END //
DELIMITER ;
CALL quitar_columna('planes_plataforma', 'tope_por_visita');

-- ---------------------------------------------------------------------
-- 31. LIQUIDACIONES
--   monto_bruto = visitas x precio del gimnasio (con tope de categoria)
--   comision    = ajuste proporcional cuando un socio paso su fondo
--   monto_neto  = monto_bruto - comision
-- (las columnas ya existen; no hace falta cambiar la tabla)
-- ---------------------------------------------------------------------

DROP PROCEDURE IF EXISTS agregar_columna;
DROP PROCEDURE IF EXISTS quitar_columna;

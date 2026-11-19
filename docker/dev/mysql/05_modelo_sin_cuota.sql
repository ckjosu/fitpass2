-- =====================================================================
-- Gymred - Cambio de modelo de negocio
--
-- Antes: el gimnasio contrataba un plan con Gymred (Basico $499,
-- Premium $999, Elite) y Gymred le pagaba una tarifa por visita.
--
-- Ahora:
--   * El gimnasio NO paga nada por estar afiliado.
--   * El dueno pone su precio por visita y Gymred se lo paga por cada dia
--     que entra un socio, sin pasar el tope de su clase.
--   * Los gimnasios se clasifican igual que los planes de la app:
--     Esencial (tope $30) y Plus (tope $45). La clase sale sola de su
--     inventario y amenidades (ver app-api/src/common/clasificacion.ts).
--   * Plan Esencial ($400) entra a gimnasios Esencial; Plus ($500) a todos.
--
-- Este archivo actualiza una base que ya esta en uso. En una base nueva
-- no cambia nada, porque 01_schema.sql y 02_seed.sql ya traen el modelo
-- nuevo. Se puede correr mas de una vez.
-- =====================================================================

USE gymred;

DROP PROCEDURE IF EXISTS quitar_columna;
DROP PROCEDURE IF EXISTS agregar_columna;
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
-- 1. Afiliacion: ya no hay plan del gimnasio; ahora guarda su precio
-- ---------------------------------------------------------------------
CALL agregar_columna('contratos_gimnasio', 'precio_por_visita', 'DECIMAL(10,2) NULL AFTER id_gimnasio');

-- Si ya tenia tarifa por visita, se usa como su precio inicial.
SET @hay_tarifa = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'gymred' AND table_name = 'contratos_gimnasio' AND column_name = 'tarifa_por_visita'
);
SET @sql = IF(@hay_tarifa = 1,
  'UPDATE contratos_gimnasio SET precio_por_visita = tarifa_por_visita WHERE precio_por_visita IS NULL',
  'SELECT 1');
PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;

CALL quitar_columna('contratos_gimnasio', 'tipo');
CALL quitar_columna('contratos_gimnasio', 'nivel');
CALL quitar_columna('contratos_gimnasio', 'tarifa_por_visita');
CALL quitar_columna('contratos_gimnasio', 'cuota_fija_mensual');
CALL quitar_columna('contratos_gimnasio', 'comision_plataforma');

DROP TABLE IF EXISTS solicitudes_plan;

-- ---------------------------------------------------------------------
-- 2. Planes del socio: Esencial y Plus, con el tope que se paga por visita
-- ---------------------------------------------------------------------
CALL agregar_columna('planes_plataforma', 'nivel', 'TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER precio_mensual');
CALL agregar_columna('planes_plataforma', 'tope_por_visita', 'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER nivel');

UPDATE planes_plataforma
SET nombre = 'Esencial',
    descripcion = 'Gimnasios Esencial de la red, una visita por dia.',
    precio_mensual = 400.00, nivel = 1, tope_por_visita = 30.00,
    visitas_por_dia = 1, visitas_por_mes = NULL, activo = 1
WHERE id = 1;

UPDATE planes_plataforma
SET nombre = 'Plus',
    descripcion = 'Todos los gimnasios, incluidos los Plus, dos visitas por dia, ocupacion y recomendaciones.',
    precio_mensual = 500.00, nivel = 2, tope_por_visita = 45.00,
    visitas_por_dia = 2, visitas_por_mes = NULL, activo = 1
WHERE id = 2;

-- Quien tenia Elite pasa a Plus. El plan Elite se apaga pero no se borra,
-- para no perder los pagos viejos que apuntan a el.
UPDATE suscripciones SET id_plan = 2 WHERE id_plan NOT IN (1, 2);
UPDATE planes_plataforma SET activo = 0, nivel = 2 WHERE id NOT IN (1, 2);

-- ---------------------------------------------------------------------
-- 3. Cada visita guarda lo que se le debe al gimnasio
-- ---------------------------------------------------------------------
CALL agregar_columna('accesos', 'pago_gimnasio', 'DECIMAL(10,2) NULL AFTER motivo');

-- Las visitas viejas se pagan con su precio y el tope Esencial; la API
-- usa la clase real del gimnasio para las visitas nuevas.
UPDATE accesos a
JOIN contratos_gimnasio c ON c.id_gimnasio = a.id_gimnasio AND c.situacion = 'vigente'
SET a.pago_gimnasio = LEAST(COALESCE(c.precio_por_visita, 0), 30.00)
WHERE a.resultado = 'permitido' AND a.pago_gimnasio IS NULL;

DROP PROCEDURE IF EXISTS quitar_columna;
DROP PROCEDURE IF EXISTS agregar_columna;

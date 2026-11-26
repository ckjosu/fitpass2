-- =====================================================================
-- Gymred - Seguridad de cuentas
--
--   usuarios.intentos_fallidos  intentos de login fallidos seguidos
--   usuarios.bloqueado_hasta    la cuenta no puede entrar hasta esta hora
--   usuarios.sesiones_desde     los tokens emitidos antes de esta hora ya
--                               no sirven (se llena al cambiar contrasena)
--   recuperaciones_password     codigos de 6 digitos para recuperar la
--                               contrasena (se guarda solo su hash)
--
-- Se puede correr mas de una vez. Textos con comillas simples (Aiven usa
-- ANSI_QUOTES).
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

CALL agregar_columna('usuarios', 'intentos_fallidos', 'INT UNSIGNED NOT NULL DEFAULT 0');
CALL agregar_columna('usuarios', 'bloqueado_hasta', 'DATETIME NULL');
CALL agregar_columna('usuarios', 'sesiones_desde', 'DATETIME NULL');

DROP PROCEDURE IF EXISTS agregar_columna;

CREATE TABLE IF NOT EXISTS recuperaciones_password (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario   INT UNSIGNED NOT NULL,
  codigo_hash  CHAR(64)     NOT NULL,
  vence_en     DATETIME     NOT NULL,
  intentos     INT UNSIGNED NOT NULL DEFAULT 0,
  usado        TINYINT(1)   NOT NULL DEFAULT 0,
  creado_en    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_recuperacion_usuario (id_usuario, creado_en),
  CONSTRAINT fk_recuperacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Gymred - Clases del gimnasio y respuestas a resenas
--
--   * El dueno responde las resenas de los socios desde el panel.
--   * El dueno arma sus clases (spinning, yoga, box...) con horario
--     semanal y cupo. Los socios Gymred reservan lugar desde la app.
--
-- Se puede correr en una base nueva o en una que ya este en uso, y mas
-- de una vez.
-- =====================================================================

USE gymred;

-- ---------------------------------------------------------------------
-- 25. RESPUESTA DEL DUENO A CADA RESENA
-- ---------------------------------------------------------------------
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

CALL agregar_columna('resenas', 'respuesta', 'VARCHAR(500) NULL AFTER comentario');
CALL agregar_columna('resenas', 'respondido_en', 'DATETIME NULL AFTER respuesta');
DROP PROCEDURE IF EXISTS agregar_columna;

-- ---------------------------------------------------------------------
-- 26. CLASES DEL GIMNASIO
-- El tipo sale del catalogo (categoria 'clases') para que "Spinning" no
-- quede capturado de tres formas. Si no esta en el catalogo, se escribe
-- el nombre y no se puede repetir dentro del mismo gimnasio.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clases_gimnasio (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio  INT UNSIGNED NOT NULL,
  id_catalogo  INT UNSIGNED NULL,
  nombre       VARCHAR(80)  NOT NULL,
  instructor   VARCHAR(100) NULL,
  descripcion  VARCHAR(300) NULL,
  duracion_min SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  cupo         SMALLINT UNSIGNED NOT NULL DEFAULT 20,
  activa       BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clase_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  CONSTRAINT fk_clase_catalogo FOREIGN KEY (id_catalogo) REFERENCES catalogo_equipo(id) ON DELETE SET NULL,
  UNIQUE KEY uq_clase_nombre (id_gimnasio, nombre)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 27. HORARIO SEMANAL DE CADA CLASE (1 = lunes ... 7 = domingo)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clases_horario (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_clase    INT UNSIGNED NOT NULL,
  dia_semana  TINYINT UNSIGNED NOT NULL,
  hora_inicio TIME NOT NULL,
  CONSTRAINT fk_horario_clase FOREIGN KEY (id_clase) REFERENCES clases_gimnasio(id) ON DELETE CASCADE,
  UNIQUE KEY uq_horario_clase (id_clase, dia_semana, hora_inicio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 28. RESERVAS DE LOS SOCIOS (una por sesion: horario + fecha)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas_clase (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_horario  INT UNSIGNED NOT NULL,
  id_cliente  INT UNSIGNED NOT NULL,
  fecha       DATE NOT NULL,
  situacion   ENUM('reservada','cancelada') NOT NULL DEFAULT 'reservada',
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reserva_horario FOREIGN KEY (id_horario) REFERENCES clases_horario(id) ON DELETE CASCADE,
  CONSTRAINT fk_reserva_cliente FOREIGN KEY (id_cliente) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_reserva (id_horario, id_cliente, fecha),
  INDEX idx_reservas_sesion (id_horario, fecha, situacion)
) ENGINE=InnoDB;

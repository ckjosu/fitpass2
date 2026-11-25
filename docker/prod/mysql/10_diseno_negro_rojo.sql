-- =====================================================================
-- Gymred - Nuevo diseño del panel (negro + rojo)
--
--   * Agrega 'rojo' como color de acento y lo deja por defecto.
--   * El tema por defecto pasa a ser 'oscuro'.
--   * Los gimnasios que nunca cambiaron su configuracion (claro + naranja)
--     pasan al diseño nuevo. Los que eligieron otra cosa se respetan.
--
-- Correr ANTES de subir la API y la web nuevas.
-- =====================================================================

ALTER TABLE configuracion_gimnasio
  MODIFY color_acento ENUM('rojo','naranja','azul','verde','morado') NOT NULL DEFAULT 'rojo',
  MODIFY tema ENUM('claro','oscuro') NOT NULL DEFAULT 'oscuro';

UPDATE configuracion_gimnasio
   SET tema = 'oscuro', color_acento = 'rojo'
 WHERE tema = 'claro' AND color_acento = 'naranja';

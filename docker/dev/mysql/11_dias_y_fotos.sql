-- =====================================================================
-- Gymred - Modelo por dias + fotos guardadas en la base
--
--   * Se cuenta por DIA: el socio puede salir y volver a entrar al mismo
--     gimnasio el mismo dia sin limite. Esas entradas extra se guardan
--     como 'reingreso': no gastan otro dia ni se le pagan al gimnasio.
--   * Un solo gimnasio por dia.
--   * Planes: Esencial 15 dias al mes ($400), Plus 30 dias al mes ($800).
--   * Las fotos se guardan dentro de la base. Antes se guardaban en el
--     disco de Render, que se borra en cada reinicio, y desaparecian.
--
-- Correr ANTES de subir la API nueva.
-- =====================================================================

ALTER TABLE accesos
  MODIFY resultado ENUM('permitido','denegado','reingreso') NOT NULL;

UPDATE planes_plataforma SET
  descripcion = 'Membresia Gymred Esencial: gimnasios Esencial de la red, 15 dias al mes. Puedes salir y volver a entrar el mismo dia.',
  precio_mensual = 400.00, visitas_por_dia = 1, visitas_por_mes = 15
WHERE codigo = 'esencial';

UPDATE planes_plataforma SET
  descripcion = 'Membresia Gymred Plus: gimnasios Esencial y Completo, 30 dias al mes. Puedes salir y volver a entrar el mismo dia.',
  precio_mensual = 800.00, visitas_por_dia = 1, visitas_por_mes = 30
WHERE codigo = 'plus';

ALTER TABLE fotos_gimnasio
  ADD COLUMN datos MEDIUMBLOB NULL AFTER descripcion,
  ADD COLUMN tipo VARCHAR(40) NULL AFTER datos;

-- Las fotos viejas apuntaban a archivos que Render ya borro: se quitan
-- para que la app no muestre imagenes rotas. Hay que volver a subirlas.
DELETE FROM fotos_gimnasio WHERE url LIKE '/uploads/%';

-- =====================================================================
-- Gymred - Plan Plus con 30 visitas al mes y Esencial con 15
--
--   Esencial $400  gimnasios Esencial, 15 visitas al mes (1 por dia)
--   Plus     $800  gimnasios Esencial y Completo, 30 visitas al mes
--                  (1 por dia). Fondo para gimnasios: 70% = $560.
--
-- Se puede correr mas de una vez.
-- =====================================================================

USE gymred;

UPDATE planes_plataforma SET
  descripcion = 'Membresia Gymred Plus: gimnasios Esencial y Completo, 30 visitas al mes, ocupacion y recomendaciones.',
  precio_mensual = 800.00, visitas_por_mes = 30, visitas_por_dia = 1
WHERE codigo = 'plus';

UPDATE planes_plataforma SET
  descripcion = 'Membresia Gymred Esencial: todos los gimnasios Esencial de la red, 15 visitas al mes.',
  visitas_por_mes = 15, visitas_por_dia = 1
WHERE codigo = 'esencial';

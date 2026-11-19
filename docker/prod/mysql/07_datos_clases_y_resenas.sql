-- =====================================================================
-- Gymred - Datos de prueba de clases y resenas
-- Solo para la base de demostracion. Se puede correr mas de una vez.
-- =====================================================================

USE gymred;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM reservas_clase;
DELETE FROM clases_horario;
DELETE FROM clases_gimnasio;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- CLASES (el id_catalogo se busca por nombre en el catalogo)
-- ---------------------------------------------------------------------
INSERT INTO clases_gimnasio (id, id_gimnasio, id_catalogo, nombre, instructor, descripcion, duracion_min, cupo) VALUES
(1, 1, (SELECT id FROM catalogo_equipo WHERE categoria='clases' AND nombre='Clase de spinning'), 'Clase de spinning', 'Karla Uc',      'Ritmo alto con musica, trae toalla.', 45, 15),
(2, 1, (SELECT id FROM catalogo_equipo WHERE categoria='clases' AND nombre='Clase funcional'),   'Clase funcional',   'Jorge May',     'Circuito de cuerpo completo.',        60, 20),
(3, 1, (SELECT id FROM catalogo_equipo WHERE categoria='clases' AND nombre='Clase de zumba'),    'Clase de zumba',    'Fany Ek',       'Baile para todos los niveles.',       50, 25),
(4, 3, (SELECT id FROM catalogo_equipo WHERE categoria='clases' AND nombre='Natacion'),          'Natacion',          'Luis Canche',   'Carriles para principiantes y medio.', 60, 10),
(5, 3, (SELECT id FROM catalogo_equipo WHERE categoria='clases' AND nombre='CrossFit'),          'CrossFit',          'Ana Pool',      'WOD del dia con coach.',               60, 12),
(6, 3, (SELECT id FROM catalogo_equipo WHERE categoria='clases' AND nombre='Clase de yoga'),     'Clase de yoga',     'Ana Pool',      'Trae tu tapete.',                      60, 18),
(7, 4, (SELECT id FROM catalogo_equipo WHERE categoria='clases' AND nombre='Clase de box'),      'Clase de box',      'Pedro Chan',    'Tecnica y saco. Vendas obligatorias.', 60, 12);

INSERT INTO clases_horario (id_clase, dia_semana, hora_inicio) VALUES
(1,1,'07:00:00'),(1,3,'07:00:00'),(1,5,'07:00:00'),(1,2,'19:00:00'),(1,4,'19:00:00'),
(2,1,'18:00:00'),(2,3,'18:00:00'),(2,5,'18:00:00'),
(3,2,'09:00:00'),(3,4,'09:00:00'),(3,6,'10:00:00'),
(4,1,'08:00:00'),(4,3,'08:00:00'),(4,5,'08:00:00'),
(5,1,'06:00:00'),(5,2,'06:00:00'),(5,3,'06:00:00'),(5,4,'06:00:00'),(5,5,'06:00:00'),(5,6,'09:00:00'),
(6,2,'19:30:00'),(6,4,'19:30:00'),
(7,1,'20:00:00'),(7,3,'20:00:00'),(7,5,'20:00:00');

-- Reservas en las proximas sesiones de cada horario, para ver el cupo ocupado.
-- La fecha es el siguiente dia de la semana del horario (incluye hoy).
INSERT INTO reservas_clase (id_horario, id_cliente, fecha)
SELECT h.id, u.id,
       DATE_ADD(CURDATE(), INTERVAL MOD(CAST(h.dia_semana AS SIGNED) + 6 - WEEKDAY(CURDATE()), 7) DAY)
FROM clases_horario h
JOIN clases_gimnasio c ON c.id = h.id_clase
JOIN usuarios u ON u.rol = 'cliente' AND u.id IN (4, 5, 6)
WHERE (c.id_gimnasio = 1 AND h.id_clase IN (1, 2))
   OR (c.id_gimnasio = 3 AND h.id_clase = 5 AND u.id IN (4, 6));

-- ---------------------------------------------------------------------
-- RESENAS: mas variedad y algunas ya respondidas por el dueno
-- ---------------------------------------------------------------------
INSERT IGNORE INTO resenas (id_gimnasio, id_cliente, calificacion, comentario, creado_en) VALUES
(1, 6, 3, 'Buen gimnasio pero la caminadora 2 lleva dias descompuesta.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 7, 2, 'En la noche no alcanzan los racks de sentadilla.',          DATE_SUB(NOW(), INTERVAL 9 DAY)),
(2, 4, 4, 'Tranquilo y limpio, ideal para entrenar temprano.',          DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3, 5, 5, 'La clase de natacion esta excelente.',                       DATE_SUB(NOW(), INTERVAL 12 DAY));

UPDATE resenas
SET respuesta = 'Gracias Erick, te esperamos en la clase de spinning de la manana.',
    respondido_en = DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE id_gimnasio = 1 AND id_cliente = 4;

UPDATE resenas
SET respuesta = 'Gracias por avisar. Ya se pidio la refaccion y en esta semana queda lista.',
    respondido_en = DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE id_gimnasio = 1 AND id_cliente = 6;

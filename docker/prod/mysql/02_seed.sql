-- =====================================================================
-- Gymred - Datos de prueba
-- Passwords reales: admin -> Admin123 | los demas -> Gymred123
-- API key de todos los lectores de QR: Gymred123
-- =====================================================================
USE gymred;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE inventario_gimnasio;
TRUNCATE TABLE configuracion_gimnasio;
TRUNCATE TABLE incidencias;
TRUNCATE TABLE accesos;
TRUNCATE TABLE liquidaciones;
TRUNCATE TABLE resenas;
TRUNCATE TABLE solicitudes_baja;
TRUNCATE TABLE solicitudes_plan;
TRUNCATE TABLE precios_historial;
TRUNCATE TABLE precios_gimnasio;
TRUNCATE TABLE contratos_gimnasio;
TRUNCATE TABLE lectores;
TRUNCATE TABLE credenciales;
TRUNCATE TABLE pagos;
TRUNCATE TABLE suscripciones;
TRUNCATE TABLE planes_plataforma;
TRUNCATE TABLE amenidades_gimnasio;
TRUNCATE TABLE servicios_gimnasio;
TRUNCATE TABLE fotos_gimnasio;
TRUNCATE TABLE horarios_gimnasio;
TRUNCATE TABLE gimnasios;
TRUNCATE TABLE usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- USUARIOS
-- ---------------------------------------------------------------------
INSERT INTO usuarios (id, nombre, email, password_hash, telefono, rol) VALUES
(1, 'Administrador Gymred', 'admin@gymred.mx',     '$2a$10$BFjRU2uHvVUTEspE.OdrduzKWPd/A76bhEylSj/D51j0W85X70IQa', '9991000000', 'admin'),
(2, 'Ricardo Pech Uc',       'ricardo@ironhouse.mx', '$2b$10$5tcQ79VHi1/oxgjyJGSvlu13vyFcJU2Tgez5Fg6Lgu5oVj6b/W7kK', '9991112233', 'dueno'),
(3, 'Marisol Canul Ake',     'marisol@energymx.mx',  '$2b$10$5tcQ79VHi1/oxgjyJGSvlu13vyFcJU2Tgez5Fg6Lgu5oVj6b/W7kK', '9992223344', 'dueno'),
(4, 'Erick Chi Calan',       'erick@correo.com',     '$2b$10$5tcQ79VHi1/oxgjyJGSvlu13vyFcJU2Tgez5Fg6Lgu5oVj6b/W7kK', '9993334455', 'cliente'),
(5, 'Luis Sanchez Ucan',     'luis@correo.com',      '$2b$10$5tcQ79VHi1/oxgjyJGSvlu13vyFcJU2Tgez5Fg6Lgu5oVj6b/W7kK', '9994445566', 'cliente'),
(6, 'Mauricio Cih Koh',      'mauricio@correo.com',  '$2b$10$5tcQ79VHi1/oxgjyJGSvlu13vyFcJU2Tgez5Fg6Lgu5oVj6b/W7kK', '9995556677', 'cliente'),
(7, 'Tommy Can Mut',         'tommy@correo.com',     '$2b$10$5tcQ79VHi1/oxgjyJGSvlu13vyFcJU2Tgez5Fg6Lgu5oVj6b/W7kK', '9996667788', 'cliente');

-- ---------------------------------------------------------------------
-- GIMNASIOS (Ricardo tiene dos sucursales)
-- ---------------------------------------------------------------------
INSERT INTO gimnasios (id, id_dueno, nombre, descripcion, calle, colonia, ciudad, estado, codigo_postal, telefono, latitud, longitud, capacidad_maxima, categoria, situacion) VALUES
(1, 2, 'Iron House Centro',  'Gimnasio de pesas y maquinas con area funcional.',      'Calle 59 #412',  'Centro',          'Merida', 'Yucatan', '97000', '9991112233', 20.9700000, -89.6200000, 120, 'gimnasio',  'activo'),
(2, 2, 'Iron House Norte',   'Sucursal norte, mas equipo de cardio y clases.',        'Av. Cupules #201','Garcia Gineres', 'Merida', 'Yucatan', '97070', '9991112244', 21.0100000, -89.6300000, 90,  'gimnasio',  'activo'),
(3, 3, 'Energy Fitness',     'Centro premium con alberca, spinning y crossfit.',      'Calle 21 #98',   'Montecristo',     'Merida', 'Yucatan', '97133', '9992223344', 20.9950000, -89.6050000, 200, 'crossfit',  'activo'),
(4, 3, 'Energy Box Studio',  'Estudio de box y funcional, grupos reducidos.',         'Calle 33 #145',  'Buenavista',      'Merida', 'Yucatan', '97127', '9992223355', 20.9880000, -89.6150000, 45,  'box',       'activo');

-- ---------------------------------------------------------------------
-- HORARIOS (1 = lunes ... 7 = domingo)
-- ---------------------------------------------------------------------
INSERT INTO horarios_gimnasio (id_gimnasio, dia_semana, hora_apertura, hora_cierre, cerrado) VALUES
(1,1,'05:30:00','22:00:00',0),(1,2,'05:30:00','22:00:00',0),(1,3,'05:30:00','22:00:00',0),
(1,4,'05:30:00','22:00:00',0),(1,5,'05:30:00','21:00:00',0),(1,6,'07:00:00','14:00:00',0),(1,7,NULL,NULL,1),
(2,1,'06:00:00','22:00:00',0),(2,2,'06:00:00','22:00:00',0),(2,3,'06:00:00','22:00:00',0),
(2,4,'06:00:00','22:00:00',0),(2,5,'06:00:00','21:00:00',0),(2,6,'08:00:00','13:00:00',0),(2,7,NULL,NULL,1),
(3,1,'05:00:00','23:00:00',0),(3,2,'05:00:00','23:00:00',0),(3,3,'05:00:00','23:00:00',0),
(3,4,'05:00:00','23:00:00',0),(3,5,'05:00:00','22:00:00',0),(3,6,'07:00:00','16:00:00',0),(3,7,'08:00:00','13:00:00',0),
(4,1,'06:00:00','21:00:00',0),(4,2,'06:00:00','21:00:00',0),(4,3,'06:00:00','21:00:00',0),
(4,4,'06:00:00','21:00:00',0),(4,5,'06:00:00','20:00:00',0),(4,6,'08:00:00','12:00:00',0),(4,7,NULL,NULL,1);

-- ---------------------------------------------------------------------
-- FOTOS
-- ---------------------------------------------------------------------
INSERT INTO fotos_gimnasio (id_gimnasio, url, descripcion, portada, orden) VALUES
(1,'/uploads/demo/ironhouse-1.jpg','Area de pesas',1,0),
(1,'/uploads/demo/ironhouse-2.jpg','Zona funcional',0,1),
(2,'/uploads/demo/ironhouse-norte.jpg','Recepcion',1,0),
(3,'/uploads/demo/energy-1.jpg','Sala de spinning',1,0),
(3,'/uploads/demo/energy-2.jpg','Alberca techada',0,1),
(4,'/uploads/demo/energybox-1.jpg','Ring de box',1,0);

-- ---------------------------------------------------------------------
-- SERVICIOS Y AMENIDADES
-- ---------------------------------------------------------------------
INSERT INTO servicios_gimnasio (id_gimnasio, nombre, descripcion) VALUES
(1,'Pesas libres','Area completa de barras y mancuernas'),
(1,'Funcional','Clases de 45 minutos por la tarde'),
(2,'Cardio','Caminadoras, eliptcas y escaladoras'),
(2,'Spinning','Clases lunes, miercoles y viernes'),
(3,'CrossFit','Box certificado con coach'),
(3,'Natacion','Alberca semiolimpica techada'),
(4,'Box','Clases de box y kickboxing');

INSERT INTO amenidades_gimnasio (id_gimnasio, nombre, icono) VALUES
(1,'Regaderas','shower'),(1,'Estacionamiento','parking'),(1,'Lockers','lock'),
(2,'Regaderas','shower'),(2,'Wifi','wifi'),
(3,'Regaderas','shower'),(3,'Estacionamiento','parking'),(3,'Cafeteria','coffee'),(3,'Alberca','pool'),
(4,'Regaderas','shower'),(4,'Lockers','lock');

-- ---------------------------------------------------------------------
-- PRECIOS PROPIOS DE CADA GIMNASIO (informativos)
-- ---------------------------------------------------------------------
INSERT INTO precios_gimnasio (id_gimnasio, concepto, monto) VALUES
(1,'visita',80.00),(1,'semana',250.00),(1,'mes',550.00),(1,'anual',5500.00),
(2,'visita',70.00),(2,'semana',220.00),(2,'mes',480.00),
(3,'visita',120.00),(3,'semana',400.00),(3,'mes',950.00),(3,'anual',9500.00),
(4,'visita',100.00),(4,'semana',320.00),(4,'mes',780.00);

-- ---------------------------------------------------------------------
-- CONTRATOS CON LA PLATAFORMA
-- Cada gimnasio negocia su tarifa por visita: por eso el precio unico
-- de la membresia no lo deja recibiendo menos de lo que necesita.
-- ---------------------------------------------------------------------
INSERT INTO contratos_gimnasio (id, id_gimnasio, tipo, nivel, tarifa_por_visita, cuota_fija_mensual, comision_plataforma, fecha_inicio, situacion) VALUES
(1, 1, 'basico',  1, 35.00,    0.00, 10.00, '2026-01-15', 'vigente'),
(2, 2, 'basico',  1, 32.00,    0.00, 10.00, '2026-02-01', 'vigente'),
(3, 3, 'premium', 2, 55.00, 1500.00,  8.00, '2026-01-10', 'vigente'),
(4, 4, 'premium', 2, 48.00,  800.00,  8.00, '2026-03-05', 'vigente');

-- ---------------------------------------------------------------------
-- PLANES DE LA PLATAFORMA (para el cliente)
-- ---------------------------------------------------------------------
INSERT INTO planes_plataforma (id, nombre, descripcion, precio_mensual, nivel, visitas_por_dia, visitas_por_mes) VALUES
(1, 'Basico', 'Acceso a gimnasios nivel 1, una visita por dia.',              399.00, 1, 1, 20),
(2, 'Plus',   'Acceso a gimnasios nivel 1 y 2, una visita por dia.',          699.00, 2, 1, 30),
(3, 'Elite',  'Acceso a todos los gimnasios, hasta dos visitas por dia.',     999.00, 3, 2, NULL);

-- ---------------------------------------------------------------------
-- SUSCRIPCIONES Y PAGOS
-- ---------------------------------------------------------------------
INSERT INTO suscripciones (id, id_cliente, id_plan, fecha_inicio, fecha_fin, situacion) VALUES
(1, 4, 2, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'activa'),
(2, 5, 1, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'activa'),
(3, 6, 3, DATE_SUB(CURDATE(), INTERVAL  5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'activa'),
(4, 7, 1, DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'vencida');

INSERT INTO pagos (id_suscripcion, monto, metodo, referencia, situacion) VALUES
(1, 699.00, 'tarjeta',      'FP-2026-0001', 'pagado'),
(2, 399.00, 'tarjeta',      'FP-2026-0002', 'pagado'),
(3, 999.00, 'transferencia','FP-2026-0003', 'pagado'),
(4, 399.00, 'efectivo',     'FP-2026-0004', 'pagado');

-- ---------------------------------------------------------------------
-- CREDENCIALES (solo QR del celular, ya no hay tarjetas)
-- En la app real el token dura 5 minutos y se renueva solo. Aqui se dejan
-- validos un dia para poder probar y presentar sin que expiren.
-- ---------------------------------------------------------------------
INSERT INTO credenciales (id, id_cliente, identificador, vence_en, activa) VALUES
(1, 4, 'QR-ERICK-8F3A21C7', DATE_ADD(NOW(), INTERVAL 1 DAY), 1),
(2, 5, 'QR-LUIS-2C4D6E8A',  DATE_ADD(NOW(), INTERVAL 1 DAY), 1),
(3, 6, 'QR-MAURI-1B7C93D2', DATE_ADD(NOW(), INTERVAL 1 DAY), 1),
(4, 7, 'QR-TOMMY-5F0E3B21', DATE_ADD(NOW(), INTERVAL 1 DAY), 1);

-- ---------------------------------------------------------------------
-- PANTALLAS DE ACCESO (api key de todas: Gymred123)
-- ---------------------------------------------------------------------
INSERT INTO lectores (id, id_gimnasio, numero_serie, ubicacion, api_key_hash, activo) VALUES
(1, 1, 'FP-LEC-0001', 'Entrada principal', '$2b$10$uZJFHtLlpEHNOixi1ydvG.k7jDgsAGp8q8kAE1pIErPkwJF.GU23.', 1),
(2, 2, 'FP-LEC-0002', 'Recepcion',         '$2b$10$uZJFHtLlpEHNOixi1ydvG.k7jDgsAGp8q8kAE1pIErPkwJF.GU23.', 1),
(3, 3, 'FP-LEC-0003', 'Torniquete 1',      '$2b$10$uZJFHtLlpEHNOixi1ydvG.k7jDgsAGp8q8kAE1pIErPkwJF.GU23.', 1),
(4, 4, 'FP-LEC-0004', 'Entrada',           '$2b$10$uZJFHtLlpEHNOixi1ydvG.k7jDgsAGp8q8kAE1pIErPkwJF.GU23.', 1);

-- ---------------------------------------------------------------------
-- BITACORA DE ACCESOS (ultimos dias, permitidos y denegados)
-- Mauricio tiene plan Elite (2 visitas/dia) y solo una visita de hoy, para poder
-- demostrar en vivo un acceso permitido y luego el limite diario con el mismo socio.
-- ---------------------------------------------------------------------
INSERT INTO accesos (id_gimnasio, id_lector, id_cliente, id_credencial, codigo_leido, resultado, motivo, registrado_en) VALUES
(1,1,4,1,'QR-ERICK-8F3A21C7','permitido',NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1,1,5,2,'QR-LUIS-4D2E77B1','permitido',NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(1,1,6,3,'QR-MAURI-1B7C93D2','permitido',NULL, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(1,1,7,4,'QR-TOMMY-9A0F62E5','denegado','Sin suscripcion vigente', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(1,1,NULL,NULL,'QR-CADUCADO-000000','denegado','Codigo no valido', DATE_SUB(NOW(), INTERVAL 7 HOUR)),
(2,2,4,1,'QR-ERICK-8F3A21C7','permitido',NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2,2,5,2,'QR-LUIS-4D2E77B1','permitido',NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3,3,6,3,'QR-MAURI-1B7C93D2','permitido',NULL, DATE_SUB(NOW(), INTERVAL 30 HOUR)),
(3,3,4,1,'QR-ERICK-8F3A21C7','permitido',NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3,3,5,2,'QR-LUIS-4D2E77B1','denegado','Tu plan no incluye este gimnasio', DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(3,3,4,1,'QR-ERICK-8F3A21C7','denegado','Ya registraste tu visita de hoy', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4,4,6,3,'QR-MAURI-1B7C93D2','permitido',NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1,1,4,1,'QR-ERICK-8F3A21C7','permitido',NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1,1,5,2,'QR-LUIS-4D2E77B1','permitido',NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1,1,6,3,'QR-MAURI-1B7C93D2','permitido',NULL, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1,1,4,1,'QR-ERICK-8F3A21C7','permitido',NULL, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(1,1,5,2,'QR-LUIS-4D2E77B1','permitido',NULL, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(1,1,6,3,'QR-MAURI-1B7C93D2','permitido',NULL, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(1,1,4,1,'QR-ERICK-8F3A21C7','permitido',NULL, DATE_SUB(NOW(), INTERVAL 35 DAY)),
(1,1,5,2,'QR-LUIS-4D2E77B1','permitido',NULL, DATE_SUB(NOW(), INTERVAL 40 DAY)),
(1,1,6,3,'QR-MAURI-1B7C93D2','permitido',NULL, DATE_SUB(NOW(), INTERVAL 65 DAY)),
(3,3,6,3,'QR-MAURI-1B7C93D2','permitido',NULL, DATE_SUB(NOW(), INTERVAL 33 DAY)),
(3,3,4,1,'QR-ERICK-8F3A21C7','permitido',NULL, DATE_SUB(NOW(), INTERVAL 38 DAY)),
(2,2,5,2,'QR-LUIS-4D2E77B1','permitido',NULL, DATE_SUB(NOW(), INTERVAL 45 DAY));

-- ---------------------------------------------------------------------
-- LIQUIDACIONES DEL MES PASADO
-- ---------------------------------------------------------------------
INSERT INTO liquidaciones (id_gimnasio, anio, mes, visitas, monto_bruto, comision, monto_neto, situacion) VALUES
(1, YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), 3, 105.00, 10.50,  94.50, 'pagada'),
(2, YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), 1,  32.00,  3.20,  28.80, 'pagada'),
(3, YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), 2, 110.00,  8.80, 101.20, 'pendiente');

-- ---------------------------------------------------------------------
-- RESENAS
-- ---------------------------------------------------------------------
INSERT INTO resenas (id_gimnasio, id_cliente, calificacion, comentario) VALUES
(1, 4, 5, 'Muy buen equipo y siempre hay lugar en las maquinas.'),
(1, 5, 4, 'Bien, aunque en la tarde se llena bastante.'),
(3, 6, 5, 'La alberca vale mucho la pena, excelente servicio.'),
(3, 4, 4, 'Las clases de crossfit estan muy completas.'),
(4, 6, 5, 'Los coaches de box explican muy bien.');

-- ---------------------------------------------------------------------
-- SOLICITUDES
-- ---------------------------------------------------------------------
INSERT INTO solicitudes_plan (id_gimnasio, tipo_actual, tipo_solicitado, mensaje, situacion) VALUES
(2, 'basico', 'premium', 'Queremos subir de plan para tener reportes avanzados.', 'pendiente');

-- ---------------------------------------------------------------------
-- INCIDENCIAS (reportes de mantenimiento)
-- ---------------------------------------------------------------------
INSERT INTO incidencias (id_gimnasio, equipo, titulo, descripcion, prioridad, situacion, reportado_por, creado_en, resuelto_en) VALUES
(1, 'Cinta de correr #2', 'La banda se traba al subir la velocidad',
 'A partir de 10 km/h la banda da tirones. Se marco como fuera de servicio.', 'alta', 'pendiente', 2, DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
(1, 'Bicicleta estatica #4', 'El monitor no enciende',
 'No prende aunque se cambiaron las pilas. Puede ser el cable del sensor.', 'media', 'pendiente', 2, DATE_SUB(NOW(), INTERVAL 4 DAY), NULL),
(1, 'Rack de pesas zona B', 'Tornilleria floja en el soporte',
 'El soporte derecho se mueve al cargar disco. Riesgo para los socios.', 'alta', 'pendiente', 2, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
(1, 'Aire acondicionado sala 1', 'Enfria poco por las tardes',
 'Tecnico vino a revisar, quedo pendiente cambiar el filtro.', 'media', 'en_progreso', 2, DATE_SUB(NOW(), INTERVAL 8 DAY), NULL),
(1, 'Regadera 3 vestidor hombres', 'Goteo constante',
 'Se cambio el empaque y quedo listo.', 'baja', 'resuelto', 2, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY)),
(2, 'Caminadora #1', 'Ruido en el motor',
 'Hace un zumbido fuerte al arrancar.', 'media', 'pendiente', 2, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL),
(3, 'Bomba de la alberca', 'Presion baja',
 'Se reviso el filtro y quedo resuelto.', 'alta', 'resuelto', 3, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY));

-- ---------------------------------------------------------------------
-- CONFIGURACION DE CADA GIMNASIO
-- ---------------------------------------------------------------------
INSERT INTO configuracion_gimnasio (id_gimnasio, tema, color_acento, modo_validacion, tolerancia_segundos) VALUES
(1, 'claro',  'naranja', 'en_linea', 300),
(2, 'claro',  'naranja', 'en_linea', 300),
(3, 'oscuro', 'azul',    'tolerancia_sin_conexion', 600),
(4, 'claro',  'naranja', 'en_linea', 300);

-- ---------------------------------------------------------------------
-- INVENTARIO: lo que ofrece cada gimnasio
-- ---------------------------------------------------------------------
INSERT INTO inventario_gimnasio (id_gimnasio, categoria, nombre, descripcion, cantidad, situacion) VALUES
(1,'peso_libre','Barras olimpicas','Barras de 20 kg con discos hasta 25 kg',6,'disponible'),
(1,'peso_libre','Mancuernas 2 a 45 kg','Juego completo en rack doble',2,'disponible'),
(1,'peso_libre','Rack de sentadilla','Con barra de seguridad',3,'disponible'),
(1,'peso_libre','Banca plana y declinada','Para press de pecho',4,'disponible'),
(1,'maquinas','Prensa de piernas','Carga por discos',2,'disponible'),
(1,'maquinas','Jalon al pecho','Polea alta',2,'disponible'),
(1,'maquinas','Remo sentado','Polea baja',2,'disponible'),
(1,'maquinas','Extension de cuadriceps','Carga por placas',1,'disponible'),
(1,'cardio','Caminadoras','Con inclinacion y programas',6,'disponible'),
(1,'cardio','Escaladora','Simulador de escaleras',2,'fuera_de_servicio'),
(1,'cardio','Bicicletas estaticas','Verticales y reclinadas',5,'disponible'),
(1,'funcional','Cuerdas de batalla','Zona funcional',2,'disponible'),
(1,'funcional','Kettlebells 8 a 32 kg','Juego completo',1,'disponible'),
(1,'funcional','Cajones pliometricos','Tres alturas',4,'disponible'),
(1,'clases','Funcional por la tarde','Lunes, miercoles y viernes 6 p.m.',1,'disponible'),

(2,'cardio','Caminadoras','Zona de cardio principal',8,'disponible'),
(2,'cardio','Elipticas','Bajo impacto',4,'disponible'),
(2,'maquinas','Circuito de maquinas','Ocho estaciones',8,'disponible'),
(2,'peso_libre','Mancuernas 2 a 30 kg','Rack sencillo',1,'disponible'),
(2,'clases','Spinning','Lunes, miercoles y viernes',1,'disponible'),

(3,'funcional','Area de CrossFit','Box certificado con coach',1,'disponible'),
(3,'funcional','Anillas y barras dominadas','Estructura completa',1,'disponible'),
(3,'peso_libre','Barras y bumpers','Para levantamiento olimpico',8,'disponible'),
(3,'cardio','Remadoras','Concept2',4,'disponible'),
(3,'clases','Natacion','Alberca semiolimpica techada',1,'disponible'),
(3,'clases','Spinning','Sala con 20 bicicletas',1,'disponible'),

(4,'funcional','Ring de box','Medida reglamentaria',1,'disponible'),
(4,'funcional','Costales pesados','Colgados en estructura',6,'disponible'),
(4,'funcional','Peras de velocidad','Para coordinacion',4,'disponible'),
(4,'clases','Box y kickboxing','Grupos de maximo 12 personas',1,'disponible');

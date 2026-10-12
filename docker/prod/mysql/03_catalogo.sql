-- =====================================================================
-- Gymred - Catalogo de equipo
--
-- Por que existe: el inventario se capturaba escribiendo el nombre a mano,
-- asi que el mismo aparato terminaba escrito de varias formas
-- ("Caminadora", "caminadora", "Caminadoras", "Cinta de correr") y para la
-- base eran equipos distintos. Eso ensucia los reportes y hace que el socio
-- no encuentre nada al buscar en la app.
--
-- Como se resuelve: el dueno ya no escribe, elige de esta lista. Y un mismo
-- equipo no se puede repetir dentro de un gimnasio: si tiene seis
-- caminadoras, pone cantidad 6.
--
-- Este archivo sirve para los dos casos:
--   - Instalacion nueva: corre despues de 01_schema.sql y 02_seed.sql.
--   - Base ya en uso: tambien se puede correr encima, junta los duplicados
--     que ya existan antes de poner las restricciones.
-- =====================================================================

USE gymred;

-- ---------------------------------------------------------------------
-- 23. CATALOGO DE EQUIPO
-- Los nombres van en singular: la cantidad la lleva el inventario.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_equipo (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoria   ENUM('peso_libre','maquinas','cardio','funcional','clases','otro')
              NOT NULL DEFAULT 'maquinas',
  nombre      VARCHAR(120) NOT NULL,
  descripcion VARCHAR(300) NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_catalogo_nombre (nombre),
  INDEX idx_catalogo_categoria (categoria, nombre)
) ENGINE=InnoDB;

INSERT IGNORE INTO catalogo_equipo (categoria, nombre, descripcion) VALUES
-- Peso libre
('peso_libre','Barra olimpica','Barra de 20 kg para levantamiento'),
('peso_libre','Barra Z','Barra curva para biceps y triceps'),
('peso_libre','Juego de mancuernas','Mancuernas en rack'),
('peso_libre','Rack de sentadilla','Con barras de seguridad'),
('peso_libre','Banca plana','Para press de pecho'),
('peso_libre','Banca inclinada','Para press inclinado'),
('peso_libre','Banca declinada','Para press declinado'),
('peso_libre','Juego de discos','Discos de peso para barra'),
('peso_libre','Barra hexagonal','Para peso muerto'),
('peso_libre','Soporte de dominadas','Barra fija para dominadas'),
-- Maquinas
('maquinas','Prensa de piernas','Carga por discos'),
('maquinas','Jalon al pecho','Polea alta'),
('maquinas','Remo sentado','Polea baja'),
('maquinas','Extension de cuadriceps','Carga por placas'),
('maquinas','Curl femoral','Para posterior de pierna'),
('maquinas','Press de pecho','Maquina guiada'),
('maquinas','Press de hombro','Maquina guiada'),
('maquinas','Maquina de aductores','Interior de pierna'),
('maquinas','Maquina de abductores','Exterior de pierna'),
('maquinas','Pec deck','Apertura de pecho'),
('maquinas','Maquina de pantorrillas','Elevacion de talones'),
('maquinas','Polea cruzada','Poleas dobles ajustables'),
('maquinas','Multiestacion','Varias estaciones en una'),
('maquinas','Maquina Smith','Barra guiada'),
-- Cardio
('cardio','Caminadora','Banda para caminar y correr'),
('cardio','Bicicleta estatica','Vertical'),
('cardio','Bicicleta reclinada','Con respaldo'),
('cardio','Bicicleta de spinning','Para clases de spinning'),
('cardio','Eliptica','Bajo impacto'),
('cardio','Escaladora','Simulador de escaleras'),
('cardio','Remadora','Maquina de remo'),
('cardio','Cuerda para saltar','Salto de cuerda'),
-- Funcional
('funcional','Kettlebell','Pesa rusa'),
('funcional','Cuerda de batalla','Para zona funcional'),
('funcional','Cajon pliometrico','Para saltos'),
('funcional','Balon medicinal','Balon con peso'),
('funcional','Trineo de empuje','Para empuje y arrastre'),
('funcional','TRX','Entrenamiento en suspension'),
('funcional','Colchoneta','Para piso y estiramiento'),
('funcional','Anillas','Para gimnasticos'),
('funcional','Rueda abdominal','Para core'),
('funcional','Costal de box','Costal pesado'),
('funcional','Pera de velocidad','Para coordinacion'),
('funcional','Ring de box','Ring reglamentario'),
('funcional','Barra de dominadas con anillas','Estructura completa'),
-- Clases
('clases','Clase de spinning','Clase grupal de bicicleta'),
('clases','Clase funcional','Clase grupal funcional'),
('clases','Clase de box','Box y kickboxing'),
('clases','Clase de yoga','Clase grupal de yoga'),
('clases','Clase de zumba','Clase grupal de baile'),
('clases','Natacion','Alberca con instructor'),
('clases','CrossFit','Box de CrossFit con coach');

-- ---------------------------------------------------------------------
-- El inventario ahora apunta al catalogo
-- ---------------------------------------------------------------------
SET @hay_columna = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = 'gymred' AND table_name = 'inventario_gimnasio'
    AND column_name = 'id_catalogo'
);
SET @sql = IF(@hay_columna = 0,
  'ALTER TABLE inventario_gimnasio ADD COLUMN id_catalogo INT UNSIGNED NULL AFTER id_gimnasio',
  'SELECT "la columna id_catalogo ya existe"');
PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;

-- Amarra lo que ya estaba capturado con su equipo del catalogo.
-- La comparacion no distingue mayusculas ni acentos por la intercalacion
-- de la base, asi que "caminadora" encuentra "Caminadora".
UPDATE inventario_gimnasio i
JOIN catalogo_equipo c ON c.nombre = i.nombre
SET i.id_catalogo = c.id
WHERE i.id_catalogo IS NULL;

-- Casos del seed viejo que estaban en plural o con otro nombre.
UPDATE inventario_gimnasio i
JOIN catalogo_equipo c ON c.nombre = 'Caminadora'
SET i.id_catalogo = c.id, i.nombre = c.nombre
WHERE i.id_catalogo IS NULL AND i.nombre LIKE 'Caminadora%';

UPDATE inventario_gimnasio i
JOIN catalogo_equipo c ON c.nombre = 'Bicicleta estatica'
SET i.id_catalogo = c.id, i.nombre = c.nombre
WHERE i.id_catalogo IS NULL AND i.nombre LIKE 'Bicicleta%estatica%';

UPDATE inventario_gimnasio i
JOIN catalogo_equipo c ON c.nombre = 'Eliptica'
SET i.id_catalogo = c.id, i.nombre = c.nombre
WHERE i.id_catalogo IS NULL AND i.nombre LIKE 'Eliptica%';

-- ---------------------------------------------------------------------
-- Juntar duplicados que ya existieran, sumando las cantidades
-- ---------------------------------------------------------------------
UPDATE inventario_gimnasio i
JOIN (
  SELECT MIN(id) AS conservar, SUM(cantidad) AS total
  FROM inventario_gimnasio
  GROUP BY id_gimnasio, nombre
  HAVING COUNT(*) > 1
) d ON i.id = d.conservar
SET i.cantidad = LEAST(d.total, 999);

DELETE i FROM inventario_gimnasio i
JOIN (
  SELECT id_gimnasio, nombre, MIN(id) AS conservar
  FROM inventario_gimnasio
  GROUP BY id_gimnasio, nombre
  HAVING COUNT(*) > 1
) d ON i.id_gimnasio = d.id_gimnasio AND i.nombre = d.nombre AND i.id <> d.conservar;

-- ---------------------------------------------------------------------
-- Restricciones: un equipo no se repite dentro del mismo gimnasio
-- ---------------------------------------------------------------------
SET @hay_fk = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = 'gymred' AND table_name = 'inventario_gimnasio'
    AND constraint_name = 'fk_inventario_catalogo'
);
SET @sql = IF(@hay_fk = 0,
  'ALTER TABLE inventario_gimnasio
     ADD CONSTRAINT fk_inventario_catalogo FOREIGN KEY (id_catalogo)
     REFERENCES catalogo_equipo(id) ON DELETE SET NULL',
  'SELECT "la llave foranea ya existe"');
PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;

SET @hay_uq = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = 'gymred' AND table_name = 'inventario_gimnasio'
    AND index_name = 'uq_inventario_nombre'
);
SET @sql = IF(@hay_uq = 0,
  'ALTER TABLE inventario_gimnasio ADD UNIQUE KEY uq_inventario_nombre (id_gimnasio, nombre)',
  'SELECT "la restriccion de nombre ya existe"');
PREPARE p FROM @sql; EXECUTE p; DEALLOCATE PREPARE p;

-- =====================================================================
-- Gymred - Esquema de base de datos
-- Plataforma de acceso universal a gimnasios (TacoCoders / ITESCAM)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS gymred
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gymred;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS inventario_gimnasio, configuracion_gimnasio, incidencias,
  solicitudes_baja, solicitudes_plan, precios_historial,
  resenas, liquidaciones, accesos, lectores, credenciales, pagos,
  suscripciones, planes_plataforma, contratos_gimnasio, precios_gimnasio,
  amenidades_gimnasio, servicios_gimnasio, fotos_gimnasio, horarios_gimnasio,
  gimnasios, usuarios;
DROP VIEW IF EXISTS v_accesos_detalle, v_resumen_gimnasio;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USUARIOS
-- Tres roles: admin (Gymred), dueno (panel web), cliente (app movil).
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120)  NOT NULL,
  email          VARCHAR(150)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255)  NOT NULL,
  telefono       VARCHAR(20)   NULL,
  rol            ENUM('admin','dueno','cliente') NOT NULL DEFAULT 'cliente',
  activo         BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_rol (rol)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. GIMNASIOS
-- Un dueno puede tener varias sucursales.
-- ---------------------------------------------------------------------
CREATE TABLE gimnasios (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_dueno         INT UNSIGNED  NOT NULL,
  nombre           VARCHAR(120)  NOT NULL,
  descripcion      TEXT          NULL,
  calle            VARCHAR(160)  NULL,
  colonia          VARCHAR(120)  NULL,
  ciudad           VARCHAR(100)  NOT NULL DEFAULT 'Merida',
  estado           VARCHAR(100)  NOT NULL DEFAULT 'Yucatan',
  codigo_postal    VARCHAR(10)   NULL,
  telefono         VARCHAR(20)   NULL,
  latitud          DECIMAL(10,7) NULL,
  longitud         DECIMAL(10,7) NULL,
  capacidad_maxima SMALLINT UNSIGNED NULL,
  categoria        ENUM('gimnasio','crossfit','yoga','box','funcional') NOT NULL DEFAULT 'gimnasio',
  situacion        ENUM('pendiente','activo','suspendido') NOT NULL DEFAULT 'pendiente',
  creado_en        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_gimnasio_dueno FOREIGN KEY (id_dueno) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_gimnasios_dueno (id_dueno),
  INDEX idx_gimnasios_situacion (situacion)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. HORARIOS DEL GIMNASIO
-- dia_semana: 1 = lunes ... 7 = domingo.
-- ---------------------------------------------------------------------
CREATE TABLE horarios_gimnasio (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio  INT UNSIGNED NOT NULL,
  dia_semana   TINYINT UNSIGNED NOT NULL,
  hora_apertura TIME        NULL,
  hora_cierre   TIME        NULL,
  cerrado      BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_horario_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_horario_dia (id_gimnasio, dia_semana)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. FOTOS DEL GIMNASIO
-- ---------------------------------------------------------------------
CREATE TABLE fotos_gimnasio (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio INT UNSIGNED NOT NULL,
  url         VARCHAR(300) NOT NULL,
  descripcion VARCHAR(160) NULL,
  portada     BOOLEAN      NOT NULL DEFAULT FALSE,
  orden       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_foto_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_fotos_gimnasio (id_gimnasio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. SERVICIOS DEL GIMNASIO (clases y actividades)
-- ---------------------------------------------------------------------
CREATE TABLE servicios_gimnasio (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio INT UNSIGNED NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_servicio_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_servicios_gimnasio (id_gimnasio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. AMENIDADES DEL GIMNASIO (regaderas, estacionamiento, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE amenidades_gimnasio (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio INT UNSIGNED NOT NULL,
  nombre      VARCHAR(80)  NOT NULL,
  icono       VARCHAR(40)  NULL,
  CONSTRAINT fk_amenidad_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_amenidades_gimnasio (id_gimnasio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. PRECIOS PROPIOS DEL GIMNASIO
-- Son informativos: Gymred NO los cobra. Cada gimnasio conserva los suyos.
-- ---------------------------------------------------------------------
CREATE TABLE precios_gimnasio (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio INT UNSIGNED NOT NULL,
  concepto    ENUM('visita','semana','quincena','mes','anual') NOT NULL,
  monto       DECIMAL(10,2) NOT NULL,
  activo      BOOLEAN       NOT NULL DEFAULT TRUE,
  actualizado_en TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_precio_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_precio_concepto (id_gimnasio, concepto)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. HISTORIAL DE PRECIOS
-- Se llena solo con un trigger cada vez que cambia un monto.
-- ---------------------------------------------------------------------
CREATE TABLE precios_historial (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio  INT UNSIGNED NOT NULL,
  concepto     ENUM('visita','semana','quincena','mes','anual') NOT NULL,
  monto_anterior DECIMAL(10,2) NOT NULL,
  monto_nuevo    DECIMAL(10,2) NOT NULL,
  cambiado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_historial_gimnasio (id_gimnasio, cambiado_en)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. PLANES DE LA PLATAFORMA (lo que contrata el CLIENTE)
-- nivel: define a que gimnasios da acceso.
-- ---------------------------------------------------------------------
CREATE TABLE planes_plataforma (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(60)   NOT NULL,
  descripcion    VARCHAR(255)  NULL,
  precio_mensual DECIMAL(10,2) NOT NULL,
  nivel          TINYINT UNSIGNED NOT NULL DEFAULT 1,
  visitas_por_dia TINYINT UNSIGNED NOT NULL DEFAULT 1,
  visitas_por_mes SMALLINT UNSIGNED NULL,
  activo         BOOLEAN       NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. SUSCRIPCIONES DE CLIENTES
-- ---------------------------------------------------------------------
CREATE TABLE suscripciones (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cliente   INT UNSIGNED NOT NULL,
  id_plan      INT UNSIGNED NOT NULL,
  fecha_inicio DATE         NOT NULL,
  fecha_fin    DATE         NOT NULL,
  situacion    ENUM('activa','vencida','cancelada') NOT NULL DEFAULT 'activa',
  renovacion_automatica BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_suscripcion_cliente FOREIGN KEY (id_cliente) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_suscripcion_plan FOREIGN KEY (id_plan) REFERENCES planes_plataforma(id),
  INDEX idx_suscripciones_cliente (id_cliente, situacion)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. PAGOS DE LOS CLIENTES
-- ---------------------------------------------------------------------
CREATE TABLE pagos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_suscripcion INT UNSIGNED NOT NULL,
  monto          DECIMAL(10,2) NOT NULL,
  metodo         ENUM('tarjeta','efectivo','transferencia') NOT NULL DEFAULT 'tarjeta',
  referencia     VARCHAR(60)  NULL,
  situacion      ENUM('pagado','pendiente','fallido') NOT NULL DEFAULT 'pagado',
  pagado_en      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pago_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES suscripciones(id) ON DELETE CASCADE,
  INDEX idx_pagos_suscripcion (id_suscripcion)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. CREDENCIALES DE ACCESO (codigo QR del celular)
-- El identificador es un token que la app genera y que vence a los pocos
-- minutos. Es la unica forma de entrar: no hay tarjetas fisicas.
-- ---------------------------------------------------------------------
CREATE TABLE credenciales (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cliente    INT UNSIGNED NOT NULL,
  identificador VARCHAR(120) NOT NULL,
  vence_en      DATETIME     NOT NULL,
  activa        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_credencial_cliente FOREIGN KEY (id_cliente) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_credencial_identificador (identificador),
  INDEX idx_credenciales_cliente (id_cliente)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 13. PANTALLAS DE ACCESO (la tablet o monitor de la entrada)
-- Muestra un codigo QR que rota cada pocos segundos. El socio lo escanea
-- con su celular y la app manda el codigo a la API para pedir el paso.
-- Cada lector pertenece a un gimnasio y se autentica con su api_key.
-- ---------------------------------------------------------------------
CREATE TABLE lectores (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio    INT UNSIGNED NOT NULL,
  numero_serie   VARCHAR(40)  NOT NULL UNIQUE,
  ubicacion      VARCHAR(100) NULL,
  api_key_hash   VARCHAR(255) NOT NULL,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  codigo_actual  VARCHAR(120) NULL,
  codigo_vence_en DATETIME    NULL,
  ultima_conexion DATETIME    NULL,
  CONSTRAINT fk_lector_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_lectores_gimnasio (id_gimnasio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 14. ACCESOS (bitacora: fuente de verdad de estadisticas y liquidaciones)
-- Se registra TODO intento, permitido o denegado.
-- ---------------------------------------------------------------------
CREATE TABLE accesos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio   INT UNSIGNED NOT NULL,
  id_lector     INT UNSIGNED NULL,
  id_cliente    INT UNSIGNED NULL,
  id_credencial INT UNSIGNED NULL,
  codigo_leido  VARCHAR(120) NOT NULL,
  resultado     ENUM('permitido','denegado') NOT NULL,
  motivo        VARCHAR(120) NULL,
  registrado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_acceso_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  CONSTRAINT fk_acceso_lector FOREIGN KEY (id_lector) REFERENCES lectores(id) ON DELETE SET NULL,
  CONSTRAINT fk_acceso_cliente FOREIGN KEY (id_cliente) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_acceso_credencial FOREIGN KEY (id_credencial) REFERENCES credenciales(id) ON DELETE SET NULL,
  INDEX idx_accesos_gimnasio_fecha (id_gimnasio, registrado_en),
  INDEX idx_accesos_cliente_fecha (id_cliente, registrado_en)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 15. CONTRATOS GIMNASIO - PLATAFORMA
-- tarifa_por_visita: lo que Gymred le paga al gimnasio por cada visita.
-- Se negocia gimnasio por gimnasio, por eso el precio unico no lo perjudica.
-- ---------------------------------------------------------------------
CREATE TABLE contratos_gimnasio (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio         INT UNSIGNED NOT NULL,
  tipo                ENUM('basico','premium','elite') NOT NULL DEFAULT 'basico',
  nivel               TINYINT UNSIGNED NOT NULL DEFAULT 1,
  tarifa_por_visita   DECIMAL(10,2) NOT NULL,
  cuota_fija_mensual  DECIMAL(10,2) NOT NULL DEFAULT 0,
  comision_plataforma DECIMAL(5,2)  NOT NULL DEFAULT 10.00,
  fecha_inicio        DATE          NOT NULL,
  fecha_fin           DATE          NULL,
  situacion           ENUM('vigente','terminado','suspendido') NOT NULL DEFAULT 'vigente',
  CONSTRAINT fk_contrato_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_contratos_gimnasio (id_gimnasio, situacion)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 16. LIQUIDACIONES MENSUALES
-- visitas x tarifa - comision = total a pagar al gimnasio.
-- ---------------------------------------------------------------------
CREATE TABLE liquidaciones (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio INT UNSIGNED NOT NULL,
  anio        SMALLINT UNSIGNED NOT NULL,
  mes         TINYINT UNSIGNED  NOT NULL,
  visitas     INT UNSIGNED  NOT NULL DEFAULT 0,
  monto_bruto DECIMAL(12,2) NOT NULL DEFAULT 0,
  comision    DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_neto  DECIMAL(12,2) NOT NULL DEFAULT 0,
  situacion   ENUM('pendiente','pagada') NOT NULL DEFAULT 'pendiente',
  generada_en TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_liquidacion_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_liquidacion_periodo (id_gimnasio, anio, mes)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 17. RESENAS DE CLIENTES
-- ---------------------------------------------------------------------
CREATE TABLE resenas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio INT UNSIGNED NOT NULL,
  id_cliente  INT UNSIGNED NOT NULL,
  calificacion TINYINT UNSIGNED NOT NULL,
  comentario  VARCHAR(400) NULL,
  creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resena_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  CONSTRAINT fk_resena_cliente FOREIGN KEY (id_cliente) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uq_resena_cliente (id_gimnasio, id_cliente),
  INDEX idx_resenas_gimnasio (id_gimnasio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 18. SOLICITUDES DE CAMBIO DE PLAN (las manda el dueno desde el panel)
-- ---------------------------------------------------------------------
CREATE TABLE solicitudes_plan (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio   INT UNSIGNED NOT NULL,
  tipo_actual   ENUM('basico','premium','elite') NOT NULL,
  tipo_solicitado ENUM('basico','premium','elite') NOT NULL,
  mensaje       VARCHAR(300) NULL,
  situacion     ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resuelto_en   DATETIME     NULL,
  CONSTRAINT fk_solplan_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_solplan_gimnasio (id_gimnasio, situacion)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 19. SOLICITUDES DE BAJA DE LA PLATAFORMA
-- ---------------------------------------------------------------------
CREATE TABLE solicitudes_baja (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio INT UNSIGNED NOT NULL,
  motivo      VARCHAR(300) NOT NULL,
  comentario  VARCHAR(500) NULL,
  situacion   ENUM('pendiente','aprobada','rechazada','cancelada') NOT NULL DEFAULT 'pendiente',
  creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resuelto_en DATETIME     NULL,
  CONSTRAINT fk_solbaja_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_solbaja_gimnasio (id_gimnasio, situacion)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 20. INCIDENCIAS (reportes de mantenimiento del gimnasio)
-- ---------------------------------------------------------------------
CREATE TABLE incidencias (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio    INT UNSIGNED NOT NULL,
  equipo         VARCHAR(120) NOT NULL,
  titulo         VARCHAR(160) NOT NULL,
  descripcion    VARCHAR(600) NULL,
  prioridad      ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
  situacion      ENUM('pendiente','en_progreso','resuelto') NOT NULL DEFAULT 'pendiente',
  reportado_por  INT UNSIGNED NULL,
  creado_en      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resuelto_en    DATETIME     NULL,
  CONSTRAINT fk_incidencia_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidencia_usuario FOREIGN KEY (reportado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_incidencias_gimnasio (id_gimnasio, situacion),
  INDEX idx_incidencias_prioridad (id_gimnasio, prioridad)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 21. CONFIGURACION DEL GIMNASIO
-- Preferencias del panel y del lector. Una fila por gimnasio.
-- ---------------------------------------------------------------------
CREATE TABLE configuracion_gimnasio (
  id_gimnasio          INT UNSIGNED PRIMARY KEY,
  tema                 ENUM('claro','oscuro') NOT NULL DEFAULT 'claro',
  color_acento         ENUM('naranja','azul','verde','morado') NOT NULL DEFAULT 'naranja',
  modo_validacion      ENUM('en_linea','tolerancia_sin_conexion') NOT NULL DEFAULT 'en_linea',
  tolerancia_segundos  SMALLINT UNSIGNED NOT NULL DEFAULT 300,
  avisar_por_correo    BOOLEAN NOT NULL DEFAULT TRUE,
  avisar_accesos_denegados BOOLEAN NOT NULL DEFAULT TRUE,
  avisar_incidencias   BOOLEAN NOT NULL DEFAULT TRUE,
  actualizado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 22. INVENTARIO DEL GIMNASIO
-- Que equipo y que actividades ofrece. La app movil lo usa para decirle
-- al socio que puede entrenar en el gimnasio al que va a entrar.
-- ---------------------------------------------------------------------
CREATE TABLE inventario_gimnasio (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_gimnasio   INT UNSIGNED NOT NULL,
  categoria     ENUM('peso_libre','maquinas','cardio','funcional','clases','otro')
                NOT NULL DEFAULT 'maquinas',
  nombre        VARCHAR(120) NOT NULL,
  descripcion   VARCHAR(300) NULL,
  cantidad      SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  situacion     ENUM('disponible','fuera_de_servicio') NOT NULL DEFAULT 'disponible',
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventario_gimnasio FOREIGN KEY (id_gimnasio) REFERENCES gimnasios(id) ON DELETE CASCADE,
  INDEX idx_inventario_gimnasio (id_gimnasio, categoria),
  INDEX idx_inventario_situacion (id_gimnasio, situacion)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TRIGGER: historial de precios automatico
-- ---------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER trg_precios_historial
AFTER UPDATE ON precios_gimnasio
FOR EACH ROW
BEGIN
  IF OLD.monto <> NEW.monto THEN
    INSERT INTO precios_historial (id_gimnasio, concepto, monto_anterior, monto_nuevo)
    VALUES (NEW.id_gimnasio, NEW.concepto, OLD.monto, NEW.monto);
  END IF;
END//
DELIMITER ;

-- ---------------------------------------------------------------------
-- VISTAS
-- ---------------------------------------------------------------------
CREATE VIEW v_accesos_detalle AS
SELECT a.id, a.id_gimnasio, g.nombre AS gimnasio, a.registrado_en, a.resultado,
       a.motivo, a.codigo_leido, u.id AS id_cliente, u.nombre AS cliente,
       l.numero_serie AS lector
FROM accesos a
JOIN gimnasios g ON g.id = a.id_gimnasio
LEFT JOIN usuarios u ON u.id = a.id_cliente
LEFT JOIN credenciales c ON c.id = a.id_credencial
LEFT JOIN lectores l ON l.id = a.id_lector;

CREATE VIEW v_resumen_gimnasio AS
SELECT g.id AS id_gimnasio, g.nombre,
       SUM(a.resultado = 'permitido' AND DATE(a.registrado_en) = CURDATE()) AS accesos_hoy,
       SUM(a.resultado = 'denegado'  AND DATE(a.registrado_en) = CURDATE()) AS denegados_hoy,
       SUM(a.resultado = 'permitido' AND MONTH(a.registrado_en) = MONTH(CURDATE())
           AND YEAR(a.registrado_en) = YEAR(CURDATE())) AS accesos_mes,
       COUNT(DISTINCT CASE WHEN a.resultado = 'permitido' THEN a.id_cliente END) AS clientes_unicos
FROM gimnasios g
LEFT JOIN accesos a ON a.id_gimnasio = g.id
GROUP BY g.id, g.nombre;

-- =====================================================================
-- Gymred / FITNEX - Datos de prueba del modelo de pago
-- Solo para la base de demostracion. Se puede correr mas de una vez.
-- =====================================================================

USE gymred;

-- Energy Fitness tambien tiene maquinas: asi queda como gimnasio Completo.
INSERT INTO inventario_gimnasio (id_gimnasio, id_catalogo, categoria, nombre, descripcion, cantidad, situacion)
SELECT 3, c.id, c.categoria, c.nombre, c.descripcion, 2, 'disponible'
FROM catalogo_equipo c
WHERE c.categoria = 'maquinas' AND c.nombre IN ('Prensa de piernas', 'Jalon al pecho', 'Remo sentado')
  AND NOT EXISTS (SELECT 1 FROM inventario_gimnasio i WHERE i.id_gimnasio = 3 AND i.nombre = c.nombre);

-- Ana: socia nueva con plan Esencial que entrena en Energy Box Studio.
-- Contrasena: Gymred123
INSERT INTO usuarios (nombre, email, password_hash, telefono, rol)
SELECT 'Ana Pool Ek', 'ana@correo.com', password_hash, '9995556677', 'cliente'
FROM usuarios WHERE email = 'erick@correo.com'
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'ana@correo.com');

INSERT INTO suscripciones (id_cliente, id_plan, fecha_inicio, fecha_fin, situacion)
SELECT u.id, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 27 DAY), 'activa'
FROM usuarios u
WHERE u.email = 'ana@correo.com'
  AND NOT EXISTS (SELECT 1 FROM suscripciones s WHERE s.id_cliente = u.id);

INSERT INTO pagos (id_suscripcion, monto, metodo, referencia, situacion, pagado_en)
SELECT s.id, 400.00, 'tarjeta', 'FP-2026-0005', 'pagado', NOW()
FROM suscripciones s JOIN usuarios u ON u.id = s.id_cliente
WHERE u.email = 'ana@correo.com'
  AND NOT EXISTS (SELECT 1 FROM pagos p WHERE p.id_suscripcion = s.id);

INSERT INTO credenciales (id_cliente, identificador, vence_en, activa)
SELECT u.id, 'QR-ANA-7C1D20F4', DATE_ADD(NOW(), INTERVAL 1 DAY), 1
FROM usuarios u WHERE u.email = 'ana@correo.com'
  AND NOT EXISTS (SELECT 1 FROM credenciales c WHERE c.identificador = 'QR-ANA-7C1D20F4');

INSERT INTO accesos (id_gimnasio, id_lector, id_cliente, codigo_leido, resultado, motivo, registrado_en)
SELECT 4, 4, u.id, 'QR-ANA-7C1D20F4', 'permitido', NULL, DATE_SUB(NOW(), INTERVAL d DAY)
FROM usuarios u JOIN (SELECT 1 AS d UNION SELECT 2) x
WHERE u.email = 'ana@correo.com'
  AND NOT EXISTS (SELECT 1 FROM accesos a WHERE a.id_cliente = u.id);

-- Lo que vale cada visita de prueba: precio del gimnasio con el tope de su
-- categoria (Iron House Centro, Iron House Norte y Energy Fitness son
-- Completo, Energy Box Studio es Esencial).
UPDATE accesos a
JOIN contratos_gimnasio c ON c.id_gimnasio = a.id_gimnasio AND c.situacion = 'vigente'
SET a.pago_gimnasio = LEAST(COALESCE(c.precio_por_visita, 0), IF(a.id_gimnasio IN (1, 2, 3), 45.00, 30.00))
WHERE a.resultado = 'permitido';

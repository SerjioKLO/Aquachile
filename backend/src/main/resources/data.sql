-- 1. SEMILLA DE ROLES
INSERT INTO roles (id, codigo, nombre, descripcion) VALUES
(1, 'ANALISTA_RECLUTAMIENTO', 'Analista de Reclutamiento', 'Registra candidatos y genera solicitudes de evaluación.'),
(2, 'PROFESIONAL_EVALUADOR', 'Profesional Evaluador', 'Realiza entrevistas y registra dictámenes clínicos.'),
(3, 'ADMIN_ACADEMICO', 'Administrador Académico', 'Configura usuarios de prueba y catálogos de cargos.'),
(4, 'JEFATURA', 'Jefatura o Contraparte Simulada', 'Consulta dashboards y reportes en modo de solo lectura.')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 2. SEMILLA DE FAMILIAS DE CARGO
INSERT INTO familias_cargo (id, nombre, descripcion, activo) VALUES
(1, 'Operaciones / Producción', 'Cargos operativos en plantas de procesamiento y centros de cultivo.', true),
(2, 'Tecnología / IT', 'Desarrollo de software, infraestructura, datos y soporte tecnológico.', true),
(3, 'Ventas / Comercial', 'Gestión de cuentas comerciales, sucursales y comercialización.', true),
(4, 'Recursos Humanos', 'Selección, capacitación, bienestar y administración de personal.', true),
(5, 'Calidad y Medio Ambiente', 'Auditoría de calidad, normas ISO y sustentabilidad ambiental.', true),
(6, 'Finanzas y Administración', 'Contabilidad, análisis financiero y soporte administrativo.', true)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 3. SEMILLA DE CARGOS VINCULADOS A FAMILIAS
INSERT INTO cargos (id, familia_id, nombre, descripcion, activo) VALUES
(1, 3, 'Ejecutiva Comercial', 'Gestión de ventas y relación con clientes.', true),
(2, 1, 'Supervisor de Planta', 'Supervisión operativa de turnos productivos.', true),
(3, 6, 'Analista Contable', 'Análisis de balances y registros contables.', true),
(4, 2, 'Desarrollador Backend', 'Diseño e implementación de APIs y servicios.', true),
(5, 1, 'Enfermera de Planta', 'Atención de salud ocupacional en faenas productivas.', true),
(6, 3, 'Jefe de Sucursal', 'Liderazgo de equipo comercial de sucursal.', true),
(7, 2, 'Ingeniera de Datos', 'Modelado de pipelines y analítica de datos.', true),
(8, 1, 'Operador Logístico', 'Gestión de despacho y almacenamiento de insumos.', true),
(9, 6, 'Asistente Administrativa', 'Apoyo documental y gestión de archivos.', true),
(10, 1, 'Técnico en Mantenimiento', 'Mantenimiento preventivo y correctivo de maquinarias.', true),
(11, 3, 'Ejecutiva de Cuentas', 'Fidelización de cartera corporativa.', true),
(12, 2, 'Soporte TI', 'Atención a usuarios internos y mesa de ayuda.', true)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 4. SEMILLA DE USUARIOS
INSERT INTO usuarios (id, rol_id, username, password_hash, nombre_completo, activo, creado_en) VALUES
(1, 1, 'analista', '1234', 'Ps. Camila Rojas', true, NOW()),
(2, 2, 'evaluador', '1234', 'Ps. Andrés Miranda', true, NOW()),
(3, 4, 'jefatura', '1234', 'Marcelo Crisóstomo', true, NOW()),
(4, 3, 'admin', '1234', 'Administrador Duoc UC', true, NOW())
ON DUPLICATE KEY UPDATE nombre_completo=VALUES(nombre_completo);

-- 5. SEMILLA DE CANDIDATOS
INSERT INTO candidatos (id, cargo_id, rut, nombre, correo, telefono, activo, creado_en, actualizado_en) VALUES
(1,  1,  '12.345.678-9', 'María Fernanda Aguilar', 'm.aguilar@correo.cl', '912345678', true, NOW(), NOW()),
(2,  2,  '13.876.221-4', 'Rodrigo Salinas Pérez',   'r.salinas@correo.cl', '987654321', true, NOW(), NOW()),
(3,  3,  '16.442.908-2', 'Catalina Núñez Vera',     'c.nunez@correo.cl',   '944112233', true, NOW(), NOW()),
(4,  4,  '17.998.334-1', 'Diego Contreras Lillo',   'd.contreras@correo.cl','955667788', true, NOW(), NOW()),
(5,  5,  '18.221.667-0', 'Javiera Muñoz Tapia',     'j.munoz@correo.cl',   '933221144', true, NOW(), NOW()),
(6,  6,  '15.334.112-8', 'Sebastián Ortega Ruiz',   's.ortega@correo.cl',  '966554433', true, NOW(), NOW()),
(7,  7,  '19.554.220-6', 'Antonia Pizarro Godoy',   'a.pizarro@correo.cl', '977889900', true, NOW(), NOW()),
(8,  8,  '14.002.556-3', 'Luis Alberto Cárdenas',   'l.cardenas@correo.cl','922334455', true, NOW(), NOW()),
(9,  9,  '20.114.998-5', 'Fernanda Rivas Soto',     'f.rivas@correo.cl',   '911223344', true, NOW(), NOW()),
(10, 10, '16.887.004-7', 'Matías Herrera Lagos',    'm.herrera@correo.cl', '988776655', true, NOW(), NOW()),
(11, 11, '13.221.775-k', 'Paulina Vergara Díaz',    'p.vergara@correo.cl', '999001122', true, NOW(), NOW()),
(12, 12, '18.660.331-2', 'Cristóbal Araya Mella',   'c.araya@correo.cl',   '934567890', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- 6. SEMILLA DE SOLICITUDES
INSERT INTO solicitudes (id, codigo, candidato_id, cargo_id, responsable_id, prioridad, estado, fecha_solicitud, creado_en, actualizado_en) VALUES
(1,  'SOL-1001', 1, 1, 2, 'Alta', 'Pendiente', CURDATE() - INTERVAL 2 DAY, NOW(), NOW()),
(2,  'SOL-1002', 2, 2, 2, 'Media', 'En proceso', CURDATE() - INTERVAL 4 DAY, NOW(), NOW()),
(3,  'SOL-1003', 3, 3, 2, 'Media', 'Finalizada', CURDATE() - INTERVAL 12 DAY, NOW(), NOW()),
(4,  'SOL-1004', 4, 4, 2, 'Alta', 'Pendiente', CURDATE() - INTERVAL 1 DAY, NOW(), NOW()),
(5,  'SOL-1005', 5, 5, 2, 'Alta', 'Finalizada', CURDATE() - INTERVAL 15 DAY, NOW(), NOW()),
(6,  'SOL-1006', 6, 6, 2, 'Baja', 'En proceso', CURDATE() - INTERVAL 6 DAY, NOW(), NOW()),
(7,  'SOL-1007', 7, 7, 2, 'Media', 'Pendiente', CURDATE() - INTERVAL 3 DAY, NOW(), NOW()),
(8,  'SOL-1008', 8, 8, 2, 'Baja', 'Finalizada', CURDATE() - INTERVAL 20 DAY, NOW(), NOW()),
(9,  'SOL-1009', 9, 9, 2, 'Media', 'En proceso', CURDATE() - INTERVAL 8 DAY, NOW(), NOW()),
(10, 'SOL-1010', 11, 11, 2, 'Alta', 'Pendiente', CURDATE() - INTERVAL 5 DAY, NOW(), NOW())
ON DUPLICATE KEY UPDATE estado=VALUES(estado);

-- 7. SEMILLA DE EVALUACIONES
INSERT INTO evaluaciones (id, solicitud_id, fecha_entrevista, conclusiones, dictamen, preguntas_respondidas, creado_en, actualizado_en) VALUES
(1, 3, CURDATE() - INTERVAL 9 DAY, 'Candidata con alto orden y rigurosidad. Buen manejo de plazos y comunicación clara con pares.', 'Recomendado', '{"¿Cómo organiza tareas cuando hay plazos superpuestos?": true}', NOW(), NOW()),
(2, 5, CURDATE() - INTERVAL 13 DAY, 'Muestra adecuada contención emocional; se sugiere acompañamiento inicial en turnos rotativos.', 'Con observaciones', '{"¿Cómo reacciona ante una falla crítica en el turno?": true}', NOW(), NOW()),
(3, 8, CURDATE() - INTERVAL 18 DAY, 'Dificultad para sostener ritmo bajo presión y baja tolerancia a la supervisión directa.', 'No recomendado', '{"Relate un error operativo y el aprendizaje obtenido": true}', NOW(), NOW())
ON DUPLICATE KEY UPDATE dictamen=VALUES(dictamen);

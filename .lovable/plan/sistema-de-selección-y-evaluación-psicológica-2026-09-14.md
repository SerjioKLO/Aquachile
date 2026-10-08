# Sistema de Selección y Evaluación Psicológica

App interna (en español) para gestionar candidatos, solicitudes de evaluación y resultados psicolaborales. Todo funciona con datos de prueba en memoria, sin necesidad de cuenta ni base de datos.

## Roles y acceso (RF01)

Selector de rol en la pantalla de inicio de sesión simulado:

- Analista de Reclutamiento: candidatos y solicitudes.
- Profesional Evaluador: solicitudes asignadas y evaluaciones.
- Jefatura: panel, consulta y reportes (solo lectura).
- Administrador Académico: acceso total.

El rol elegido queda guardado y la barra de navegación muestra solo las secciones permitidas. Botón para cambiar de rol o salir.

## Pantallas

### Panel principal (RF10)

- Tarjetas: Total Candidatos, Pendientes, En proceso, Finalizadas.
- Tabla de actividad reciente (últimos movimientos de solicitudes).
- Botones directos: "Registrar candidato" y "Nueva solicitud".

### Candidatos (RF02, RF03)

- Buscador por nombre y por familia de cargo.
- Tabla con RUT, nombre, correo, teléfono, familia de cargo, estado.
- Acciones: ver, editar, eliminar.
- Ventana para registrar/editar con validaciones (campos obligatorios, formato de RUT, correo válido, teléfono numérico).

### Solicitudes de evaluación (RF04-RF07)

- Filtros combinados: estado, familia de cargo, rango de fechas.
- Tabla con candidato, cargo, psicólogo asignado, fecha solicitud, estado con distintivo de color.
- Ventana de nueva solicitud: elegir candidato, cargo, familia, prioridad y asignar psicólogo evaluador.

### Detalle de evaluación y resultados (RF08, RF09)

- Encabezado con datos del postulante y de la solicitud.
- Flujo de estados: Pendiente → En proceso → Finalizada (avanza paso a paso).
- Formulario clínico: fecha de entrevista, conclusiones, dictamen (Recomendado / Con observaciones / No recomendado).
- Widget de preguntas sugeridas según la familia de cargo: se pueden marcar como usadas y agregar notas por pregunta.

## Datos de prueba

Se cargan de inicio: ~12 candidatos, ~10 solicitudes en distintos estados, 4 psicólogos evaluadores, familias de cargo (Ventas, Operaciones, Administración, TI, Salud) con sus baterías de preguntas sugeridas, y 3 evaluaciones ya finalizadas con dictamen.

## Diseño

Estilo institucional sobrio: base clara con acento azul petróleo, tipografía nítida, tablas densas y legibles, distintivos de estado en ámbar (pendiente), azul (en proceso) y verde (finalizada). Modo claro y oscuro coherentes mediante tokens de color.

## Detalles técnicos

- TanStack Start + rutas: `/` (inicio de sesión simulado), `/panel`, `/candidatos`, `/solicitudes`, `/solicitudes/$id`.
- `AuthContext` con rol y mapa de permisos; guardado en localStorage; barra de navegación derivada de permisos.
- `DataContext` (reducer) como fuente única de candidatos, solicitudes y evaluaciones, sembrado con datos de prueba; sin backend.
- Componentes shadcn (dialog, table, select, badge, tabs, form) y validación con react-hook-form + zod.
- `head()` propio por ruta con título y descripción específicos.

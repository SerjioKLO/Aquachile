# Candidate Compass

Construir el sistema de gestión de selección y evaluación psicológica de candidatos con:

1. Login simulado / Selector de rol (RF01): Analista de Reclutamiento, Profesional Evaluador, Jefatura, Administrador Académico, gestionado con AuthContext y permisos dinámicos en la barra de navegación.
2. Dashboard principal (RF10): Tarjetas KPI (Total Candidatos, Pendientes, En proceso, Finalizadas), tabla de actividad reciente y accesos directos para registrar candidatos y solicitudes.
3. Gestión de candidatos (RF02, RF03): Buscador por nombre/familia de cargo, tabla completa con acciones y modal para registrar/editar candidatos con validaciones.
4. Solicitudes de evaluación (RF04, RF05, RF06, RF07): Filtros combinados por estado, familia de cargo y fechas, tabla de solicitudes con badges de estado, y modal de nueva solicitud asignando psicólogo evaluador.
5. Detalle de evaluación y resultados (RF08, RF09): Encabezado de postulante, selector de flujo de estados (Pendiente -> En proceso -> Finalizada), formulario clínico (fecha entrevista, conclusiones, dictamen: Recomendado / Con observaciones / No recomendado) y widget interactivo de preguntas sugeridas por familia de cargo.
   Incluir datos de prueba iniciales para que el sistema sea completamente interactivo desde el primer momento.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/071e0fb6-9d38-4b83-8eea-72b739088e2d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

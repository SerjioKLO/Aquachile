# AquaChile — Sistema de Selección y Evaluación Psicolaboral

Plataforma web integral para la gestión y seguimiento del proceso de selección y evaluación psicológica de candidatos en **AquaChile**. El sistema abarca desde la postulación pública de los aspirantes hasta la emisión de dictámenes clínicos por parte de psicólogos evaluadores.

---

## Características y Módulos del Sistema

El sistema está organizado en módulos funcionales diseñados para distintos actores del proceso de selección:

### 1. Portal de Postulación Pública (`/`)
- Formulario de registro abierto para postulantes externos.
- Validación de datos personales (Nombre, RUT, Correo, Teléfono).
- Selección de familia de cargo (Operaciones, Administración, Mantenimiento, etc.).
- Carga de currículum vitae (PDF/Word).
- Fondo personalizable institucional y confirmación inmediata de postulación.

### 2. Control de Acceso y Perfiles (`/login`)
- Sistema de autenticación basado en roles con permisos dinámicos:
  - **Analista de Reclutamiento:** Gestión de candidatos y generación de solicitudes de evaluación.
  - **Profesional Evaluador:** Aplicación de pruebas, entrevistas y registro de dictámenes clínicos.
  - **Jefatura:** Supervisión global, visualización de métricas y consulta de estados.
  - **Administrador Académico / General:** Acceso completo a todos los módulos y configuraciones.

### 3. Panel de Control y KPIs (`/panel`)
- Indicadores en tiempo real:
  - Total de candidatos en el sistema.
  - Evaluaciones en estado **Pendiente**, **En proceso** y **Finalizada**.
- Tabla de actividad reciente con accesos directos al detalle de cada evaluación.
- Botones de acción rápida para registrar candidatos o generar solicitudes.

### 4. Gestión de Candidatos (`/candidatos`)
- Directorio centralizado de postulantes con búsqueda predictiva por nombre y RUT.
- Filtros por familia de cargo.
- Diálogo modal para registrar, editar y eliminar antecedentes.
- Ficha de vista rápida con historial de solicitudes asociadas.

### 5. Gestión de Solicitudes (`/solicitudes`)
- Tablero maestro de solicitudes con filtros cruzados por estado, familia de cargo y rango de fechas.
- Registro de nuevas solicitudes con asignación de prioridad y psicólogo evaluador responsable.
- Badges visuales de estado y dictamen asignado.

### 6. Ficha Clínica y Evaluación Psicolaboral (`/solicitudes/:id`)
- Flujo interactivo de avance de estados (**Pendiente** $\rightarrow$ **En proceso** $\rightarrow$ **Finalizada**).
- Formulario clínico con fecha de entrevista, notas y conclusiones diagnósticas.
- Emisión de dictamen final: **Recomendado**, **Con observaciones** o **No recomendado**.
- Batería de preguntas y competencias sugeridas según la familia del cargo, con notas por reactivo y control de avance.

---

## Stack Tecnológico

- **Frontend Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Framework & Routing:** [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) (file-based routing con tipado estricto)
- **Estilos & UI:** [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Notificaciones:** [Sonner](https://sonner.emilkowal.ski/)
- **Servidor & Empaquetador:** [Vite](https://vitejs.dev/) + [Nitro](https://nitro.unjs.io/) (Cloudflare Modules ready)

---

## Estructura del Proyecto

```text
├── public/                 # Archivos estáticos públicos (favicon, robots.txt)
├── src/
│   ├── assets/             # Recursos estáticos locales (imágenes, logos)
│   ├── components/         # Componentes reutilizables y primitivas de UI
│   │   ├── ui/             # Componentes base (Button, Card, Table, Dialog, etc.)
│   │   ├── app-shell.tsx   # Contenedor principal con barra de navegación y control de rol
│   │   ├── candidato-dialog.tsx
│   │   └── solicitud-dialog.tsx
│   ├── context/            # Proveedores de estado global (auth-context, data-context)
│   ├── lib/                # Modelos de dominio (domain.ts), utilidades y helpers
│   ├── pages/              # Pantallas del sistema desacopladas y estandarizadas
│   │   ├── LoginPage.tsx
│   │   ├── PostulacionPage.tsx
│   │   ├── PanelPage.tsx
│   │   ├── CandidatosPage.tsx
│   │   ├── SolicitudesPage.tsx
│   │   ├── DetalleSolicitudPage.tsx
│   │   └── index.ts
│   ├── routes/             # Controladores de rutas enlazados a TanStack Start
│   │   ├── __root.tsx      # Shell HTML raíz, metadatos y proveedores
│   │   ├── index.tsx       # Ruta / (Postulación)
│   │   ├── login.tsx       # Ruta /login
│   │   ├── panel.tsx       # Ruta /panel
│   │   ├── candidatos.tsx  # Ruta /candidatos
│   │   ├── solicitudes.index.tsx # Ruta /solicitudes
│   │   └── solicitudes.$id.tsx   # Ruta /solicitudes/:id
│   ├── routeTree.gen.ts    # Árbol de rutas autogenerado por TanStack Router
│   ├── server.ts           # Entrada del servidor SSR
│   └── styles.css          # Estilos globales y temas Tailwind
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Instalación y Desarrollo Local

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18.0.0 o superior
- [npm](https://www.npmjs.com/) v9+ (o bun / pnpm)

### Pasos

1. **Clonar el repositorio:**

   ```bash
   git clone <url-del-repositorio>
   cd Aquachile
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El sistema estará accesible en `http://localhost:8080/`.

---

## Scripts Disponibles

| Comando           | Descripción                                                             |
| :---------------- | :---------------------------------------------------------------------- |
| `npm run dev`     | Inicia el entorno de desarrollo local con Hot Module Replacement (HMR). |
| `npm run build`   | Compila el cliente y servidor optimizados para producción.              |
| `npm run preview` | Ejecuta la vista previa local de la compilación de producción.          |
| `npm run lint`    | Ejecuta ESLint para verificar buenas prácticas y calidad del código.    |
| `npm run format`  | Aplica el formateo de código con Prettier en todo el proyecto.          |

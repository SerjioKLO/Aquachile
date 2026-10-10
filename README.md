# Sistema de Gestión de Evaluaciones Psicolaborales — AquaChile

**Asignatura:** DSY1104 Full Stack II — Vinculación con el Medio (VcM)  
**Institución:** Duoc UC Sede Puerto Montt · AquaChile  
**Versión:** MVP Full Stack Monolítico Integrado (Frontend + Backend + Base de Datos)

---

## 1. Arquitectura de la Solución

El sistema centraliza el ciclo de vida de evaluación psicolaboral para postulantes a diversos cargos de AquaChile, estructurado en una arquitectura monolítica Full Stack:

```
Fullstack/
├── Aquachile/                 # Capa Frontend: React 19 + TanStack Start/Router + Tailwind CSS + Radix UI
├── backend/                   # Capa Backend: Spring Boot 3 + Java 21 + JPA/Hibernate + REST API
├── docker-compose.yml         # Orquestación de Base de Datos MySQL 8.0 y Backend
└── README.md                  # Documentación del proyecto
```

---

## 2. Requisitos Previos

- **Docker Desktop** (para levantar MySQL y Backend en contenedores)
- **Node.js 20+** y **npm** (para ejecutar el Frontend)
- (Opcional) **Java 21 LTS** y **Maven** (si se desea ejecutar el backend sin Docker)

---

## 3. Puesta en Marcha Rápida (Recomendado con Docker)

### Paso 1: Levantar Base de Datos y Backend con Docker
En la raíz del proyecto, ejecuta:

```bash
docker compose up -d --build
```

Esto aprovisionará:
- **Base de Datos:** MySQL 8.0 en el puerto `3306` (iniciando la base de datos `aquachile_db` y cargando automáticamente la semilla `data.sql`).
- **Backend API REST:** Spring Boot en `http://localhost:8080`.

Para verificar que la API está activa:
- Estado del Dashboard: `http://localhost:8080/api/dashboard/stats`
- Listado de Candidatos: `http://localhost:8080/api/candidatos`
- Catálogos: `http://localhost:8080/api/catalogos`

### Paso 2: Iniciar el Frontend
En otra terminal, ingresa a la carpeta del frontend y ejecuta:

```bash
cd Aquachile
npm install
npm run dev
```

Abre tu navegador en:
👉 **`http://localhost:5173`**

---

## 4. Perfiles y Roles Simulados para Demostración

El sistema incluye 4 perfiles preconfigurados según el caso de estudio académico:

| Rol | Usuario | Clave | Capacidades y Alcance |
| :--- | :--- | :---: | :--- |
| **Analista de Reclutamiento** | `analista` | `1234` | Registro de candidatos, creación de solicitudes y seguimiento. |
| **Profesional Evaluador** | `evaluador` | `1234` | Realización de entrevistas clínicas, registro de notas por familia y dictamen. |
| **Jefatura / Contraparte** | `jefatura` | `1234` | Modo de solo lectura: consulta de dashboard gerencial e indicadores. |
| **Administrador Académico** | `admin` | `1234` | Configuración de usuarios simulados, gestión de catálogo de cargos/familias y restablecimiento de datos de prueba en 1 clic. |

> **Nota:** La pantalla de login (`/login`) incluye selectores de acceso rápido en 1 clic para cada uno de los 4 roles.

---

## 5. Endpoints Principales de la API REST

- `POST /api/auth/login`: Autenticación y retorno de usuario simulado.
- `GET /api/candidatos`: Listar y buscar candidatos (parámetros `busqueda`, `familiaId`).
- `POST /api/candidatos`: Registrar nuevo candidato.
- `PUT /api/candidatos/{id}`: Actualizar candidato existente.
- `DELETE /api/candidatos/{id}`: Eliminar candidato.
- `GET /api/solicitudes`: Listado de solicitudes con filtros (`estado`, `familiaId`, `desde`, `hasta`, `candidato`, `cargo`).
- `POST /api/solicitudes`: Crear nueva solicitud de evaluación.
- `PATCH /api/solicitudes/{id}/estado`: Cambiar fase del flujo (`Pendiente`, `En proceso`, `Finalizada`).
- `PUT /api/solicitudes/{id}/evaluacion`: Registrar fecha de entrevista, conclusiones y dictamen clínico.
- `GET /api/dashboard/stats`: Métricas de KPI e indicadores para el panel ejecutivo.
- `GET /api/catalogos`: Consulta de familias, cargos asociados y psicólogos evaluadores.

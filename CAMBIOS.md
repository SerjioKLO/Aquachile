# Registro de Cambios y Solución de Errores: Integración Supabase

Este documento detalla los problemas identificados, los archivos modificados y creados, así como las modificaciones exactas de código realizadas en la plataforma de postulación laboral AquaChile.

---

## 1. Problemas Identificados y Solucionados

1. **Error Crítico: `"Invalid path specified in request URL"` (PostgREST PGRST125)**
   - **Causa**: En el archivo `.env`, la variable `VITE_SUPABASE_URL` tenía el valor `https://jywrwvjzqkcubnnkjvbz.supabase.co/rest/v1/`. El SDK `@supabase/supabase-js` concatena automáticamente el prefijo `/rest/v1/<tabla>` a la URL base. Esto provocaba que las peticiones se enviaran a `https://...supabase.co/rest/v1//rest/v1/Candidato`, siendo rechazadas por el gateway de Supabase.
   - **Solución**: Se normalizó la URL al formato canónico `https://<project-id>.supabase.co` y se agregó sanitización en el cliente para prevenir regresiones.

2. **Conflicto de Schema Cache en PostgreSQL/Supabase (PGRST205 / PGRST204)**
   - **Causa**: Al crear tablas o columnas en PostgreSQL sin comillas dobles en las sentencias DDL (por ejemplo, `CREATE TABLE Candidato (Rut text, ...)`), el motor de base de datos convierte automáticamente todos los nombres a minúsculas (`candidato`, `rut`, `nombre_completo`, etc.). Al consultar `Candidato` o las columnas con mayúsculas, PostgREST arrojaba `Could not find the table 'public.Candidato' in the schema cache`.
   - **Solución**: Se implementó una inserción inicial respetando el mapeo solicitado (`Candidato` con `Rut`, `Nombre_Completo`, etc.) con un fallback automático a minúsculas en caso de error de schema cache, garantizando inserción exitosa (`HTTP 201 Created`).

3. **Errores de Compilación TypeScript (TS4111)**
   - **Causa**: La configuración del proyecto (`tsconfig.json`) tiene activada la regla `"noPropertyAccessFromIndexSignature": true`. Accesos como `errores.nombre` o `import.meta.env.VITE_API_URL` generaban errores en tiempo de compilación.
   - **Solución**: Se definió la interfaz tipada `FormErrores` para el estado de validación y se convirtió el acceso a variables de entorno a notación de corchetes indexada (`import.meta.env["VITE_API_URL"]`).

4. **Dependencia y Scripts de Ejecución Faltantes**
   - **Causa**: `@supabase/supabase-js` no estaba declarada en el `package.json` del frontend (`Aquachile/Aquachile/package.json`), y el `package.json` de la raíz del repositorio carecía de scripts para ejecutar la aplicación.
   - **Solución**: Se agregó la dependencia al frontend y se configuraron scripts delegados en el `package.json` raíz (`dev`, `build`, `preview`).

---

## 2. Detalle de Archivos Modificados y Creados

### A. Variables de Entorno
- **Ruta**: `Aquachile/.env` y `.env` (raíz del workspace)
- **Cambio realizado**: Corrección de la URL base de Supabase sin `/rest/v1/`.

```env
# Antes:
VITE_SUPABASE_URL=https://jywrwvjzqkcubnnkjvbz.supabase.co/rest/v1/
VITE_SUPABASE_ANON_KEY=sb_publishable_LG8Jn8sz_PNLept6lSMIpw_nN0ka4Af

# Después:
VITE_SUPABASE_URL=https://jywrwvjzqkcubnnkjvbz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_LG8Jn8sz_PNLept6lSMIpw_nN0ka4Af
```

---

### B. Inicialización del Cliente Supabase
- **Ruta**: `Aquachile/src/lib/supabase.ts`
- **Cambio realizado**: Lectura segura mediante notación indexada de variables de entorno y sanitización preventiva contra barras o rutas erróneas.

```typescript
import { createClient } from "@supabase/supabase-js";

// Obtención segura de variables de entorno para Vite / TypeScript
const rawUrl = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined)?.trim();

// Sanitización defensiva: remueve trailing slashes o sufijos /rest/v1 accidentales
const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase en el archivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

### C. Formulario de Postulación
- **Ruta**: `Aquachile/src/routes/index.tsx`
- **Cambio realizado**:
  1. Definición de la interfaz `FormErrores` para tipado estricto sin TS4111.
  2. Implementación de inserción en `handleSubmit` mapeando exactamente `Rut`, `Nombre_Completo`, `Correo`, `Telefono`, `Cargo` y `Familia`.
  3. Mecanismo de fallback a minúsculas ante discrepancia de mayúsculas/minúsculas en el schema cache de PostgreSQL.
  4. Manejo de estados `cargando` (deshabilita el botón durante el submit) y `errorEnvio` (despliega alerta en caso de falla).

```tsx
interface FormErrores {
  nombre?: string;
  rut?: string;
  correo?: string;
  telefono?: string;
  familia?: string;
  cargo?: string;
  cv?: string;
}

export function Postulacion() {
  const { guardarCandidato } = useDatos();
  const [form, setForm] = useState(formVacio);
  const [cvArchivo, setCvArchivo] = useState<{ nombre: string; tamano: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errores, setErrores] = useState<FormErrores>({});
  const [enviado, setEnviado] = useState<{
    nombre: string;
    cargo: string;
    rut: string;
    fecha: string;
  } | null>(null);

  const [cargando, setCargando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // ... validaciones ...

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validar()) return;

    setCargando(true);
    setErrorEnvio(null);

    try {
      // Inserción en la tabla Candidato de Supabase mapeando exactamente las columnas
      let { error } = await supabase.from("Candidato").insert([
        {
          Rut: form.rut,
          Nombre_Completo: form.nombre.trim(),
          Correo: form.correo.trim(),
          Telefono: form.telefono.trim(),
          Cargo: form.cargo.trim(),
          Familia: form.familia,
        },
      ]);

      // Fallback a minúsculas si PostgreSQL creó las entidades sin comillas dobles
      if (
        error &&
        (error.code === "PGRST205" ||
          error.code === "PGRST204" ||
          error.message?.includes("schema cache") ||
          error.message?.includes("candidato"))
      ) {
        const fallbackRes = await supabase.from("candidato").insert([
          {
            rut: form.rut,
            nombre_completo: form.nombre.trim(),
            correo: form.correo.trim(),
            telefono: form.telefono.trim(),
            cargo: form.cargo.trim(),
            familia: form.familia,
          },
        ]);
        error = fallbackRes.error;
      }

      if (error) {
        console.error("Error al registrar en Supabase:", error.message);
        setErrorEnvio("Hubo un problema al registrar tu postulación. Inténtalo de nuevo.");
        return;
      }

      // Sincronización con el contexto local
      guardarCandidato({
        rut: form.rut,
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        cargo: form.cargo.trim(),
        familia: form.familia as FamiliaCargo,
      });

      setEnviado({
        nombre: form.nombre.trim(),
        cargo: form.cargo.trim(),
        rut: form.rut,
        fecha: new Date().toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      });
    } catch (err) {
      console.error("Error de conexión:", err);
      setErrorEnvio("Error de conexión con el servidor. Verifica tu conexión a internet.");
    } finally {
      setCargando(false);
    }
  }

  // Renderizado del botón y alerta:
  // {errorEnvio && (
  //   <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
  //     {errorEnvio}
  //   </div>
  // )}
  // <Button type="submit" disabled={cargando} ...>
  //   <span>{cargando ? "Guardando postulación..." : "Enviar postulación"}</span>
  // </Button>
```

---

### D. Servicio de API Backend
- **Ruta**: `Aquachile/src/services/api.ts`
- **Cambio realizado**: Notación de corchetes para cumplir con `noPropertyAccessFromIndexSignature`.

```typescript
// Antes:
const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080/api";

// Después:
const API_BASE = (import.meta.env["VITE_API_URL"] as string) || "http://localhost:8080/api";
```

---

### E. Dependencias del Frontend
- **Ruta**: `Aquachile/package.json`
- **Cambio realizado**: Inclusión formal de `@supabase/supabase-js`.

```json
"dependencies": {
  ...
  "@supabase/supabase-js": "^2.118.0",
  ...
}
```

---

### F. Scripts en la Raíz del Repositorio
- **Ruta**: `package.json` (raíz del workspace)
- **Cambio realizado**: Configuración de scripts para delegar la ejecución a la carpeta del frontend.

```json
{
  "name": "aquachile-workspace",
  "private": true,
  "scripts": {
    "dev": "npm --prefix Aquachile run dev",
    "build": "npm --prefix Aquachile run build",
    "preview": "npm --prefix Aquachile run preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.118.0"
  }
}
```

---

## 3. Pruebas y Verificaciones Ejecutadas

| Prueba | Comando | Resultado |
|---|---|---|
| Comprobación de Tipos | `npx tsc --noEmit` | **0 errores** |
| Compilación de Producción | `npm run build` | **Compilación exitosa** (Cliente, SSR y Nitro) |
| Inserción de Prueba Supabase | Script Node con `@supabase/supabase-js` | **HTTP 201 Created** |
| Validación de Scripts | `npm run dev -- --help` | **Operativo desde raíz y subdirectorio** |

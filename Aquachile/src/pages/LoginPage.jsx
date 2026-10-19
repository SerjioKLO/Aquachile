import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BrainCircuit,
  LogIn,
  ShieldCheck,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ROLES, USUARIOS } from "@/lib/domain";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
const ICONOS_ROL = {
  analista: UserCheck,
  evaluador: BrainCircuit,
  admin: Shield,
  jefatura: Eye
};
export function LoginPage() {
  const { ingresar } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [error, setError] = useState(false);
  function handleSubmit(ev) {
    ev.preventDefault();
    if (ingresar(usuario, clave)) {
      navigate("/panel");
    } else {
      setError(true);
    }
  }
  function ingresarConRol(rolId) {
    const u = USUARIOS.find((user) => user.rol === rolId);
    if (u) {
      if (ingresar(u.usuario, u.clave)) {
        navigate("/panel");
      }
    }
  }
  return <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans antialiased">
      {
    /* Barra superior mínima */
  }
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-slate-950">AquaChile</span>
            <span className="text-xs text-slate-500 border-l border-slate-300 pl-2">
              Evaluación Psicolaboral
            </span>
          </Link>

          <Link to="/" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
            ← Volver a postulación
          </Link>
        </div>
      </header>

      {
    /* Contenedor central */
  }
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-3xl space-y-8">
          {
    /* Título de la pantalla */
  }
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl text-balance">
              Ingreso de Evaluadores y Selección
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Plataforma interna para gestión de postulantes, entrevistas psicolaborales y emisión
              de dictámenes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {
    /* Columna Izquierda: Acceso Rápido por Perfil */
  }
            <div className="md:col-span-7 space-y-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Acceso directo por rol simulado
                </h2>
                <p className="text-[11px] text-slate-500">
                  Selecciona uno de los 4 perfiles para ingresar con un clic:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLES.map((r) => {
    const Icono = ICONOS_ROL[r.id] || ShieldCheck;
    const usuarioInfo = USUARIOS.find((u) => u.rol === r.id);
    return <button
      key={r.id}
      type="button"
      onClick={() => ingresarConRol(r.id)}
      className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 text-left shadow-xs hover:border-slate-400 hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 transition-colors"
    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Icono className="size-4 text-slate-700" aria-hidden="true" />
                          <span className="font-mono text-[10px] text-slate-500">
                            @{usuarioInfo?.usuario}
                          </span>
                        </div>
                        <h3 className="text-xs font-semibold text-slate-900 group-hover:text-slate-950">
                          {r.nombre}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {r.descripcion}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-700 group-hover:text-slate-950">
                        <span>Ingresar</span>
                        <ArrowRight
      className="size-3 text-slate-400 group-hover:text-slate-900"
      aria-hidden="true"
    />
                      </div>
                    </button>;
  })}
              </div>
            </div>

            {
    /* Columna Derecha: Formulario Manual */
  }
            <div className="md:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    O con usuario y contraseña
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label htmlFor="usuario" className="text-xs font-medium text-slate-700">
                      Usuario
                    </Label>
                    <div className="relative">
                      <User
    className="absolute left-3 top-2.5 size-4 text-slate-400"
    aria-hidden="true"
  />
                      <Input
    id="usuario"
    name="usuario"
    autoComplete="username"
    spellCheck={false}
    placeholder="analista, evaluador..."
    value={usuario}
    onChange={(e) => {
      setUsuario(e.target.value);
      setError(false);
    }}
    aria-invalid={error}
    className="bg-white border-slate-300 text-slate-900 text-xs h-9 pl-9 focus-visible:ring-slate-950 focus-visible:border-slate-950"
  />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clave" className="text-xs font-medium text-slate-700">
                        Contraseña
                      </Label>
                      <span className="text-[10px] text-slate-500">Clave demo: 1234</span>
                    </div>
                    <div className="relative">
                      <Lock
    className="absolute left-3 top-2.5 size-4 text-slate-400"
    aria-hidden="true"
  />
                      <Input
    id="clave"
    name="clave"
    type={mostrarClave ? "text" : "password"}
    autoComplete="current-password"
    placeholder="••••"
    value={clave}
    onChange={(e) => {
      setClave(e.target.value);
      setError(false);
    }}
    aria-invalid={error}
    className="bg-white border-slate-300 text-slate-900 text-xs h-9 pl-9 pr-9 focus-visible:ring-slate-950 focus-visible:border-slate-950"
  />
                      <button
    type="button"
    onClick={() => setMostrarClave(!mostrarClave)}
    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
    aria-label={mostrarClave ? "Ocultar contrase\xF1a" : "Mostrar contrase\xF1a"}
  >
                        {mostrarClave ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  {error && <p
    role="alert"
    aria-live="polite"
    className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-2"
  >
                      Credenciales incorrectas. Para la prueba usa analista, evaluador, admin o
                      jefatura con clave 1234.
                    </p>}

                  <Button
    type="submit"
    className="w-full h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
  >
                    <LogIn className="size-3.5 mr-1.5" aria-hidden="true" />
                    <span>Iniciar sesión</span>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {
    /* Footer sobrio */
  }
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <p>© {(/* @__PURE__ */ new Date()).getFullYear()} AquaChile S.A.</p>
          <p className="text-[11px]">Sistema de evaluación y gestión de candidatos</p>
        </div>
      </footer>
    </div>;
}
export const Ingreso = LoginPage;
export default LoginPage;

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LogIn,
  Mail,
  Loader2,
  ShieldAlert,
  Database,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const CUENTAS_SUGERIDAS = [
  { rol: "Analista", email: "analista@aquachile.cl" },
  { rol: "Evaluador", email: "evaluador@aquachile.cl" },
  { rol: "Administrador", email: "admin@aquachile.cl" },
  { rol: "Jefatura", email: "jefatura@aquachile.cl" }
];

export function LoginPage() {
  const { ingresar } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!correo.trim()) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      const res = await ingresar(correo);
      if (res && res.ok) {
        navigate("/panel", { replace: true });
      } else {
        setError(res?.error || "El correo no se encuentra registrado en la base de datos.");
      }
    } catch {
      setError("Error al comunicarse con la base de datos. Inténtalo nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  function seleccionarSugerido(email) {
    setCorreo(email);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans antialiased">
      {/* Barra superior mínima */}
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

      {/* Contenedor central del formulario */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Tarjeta de Inicio de Sesión */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Ingreso al Sistema
              </h1>
              <p className="text-xs text-slate-500">
                Acceso exclusivo para evaluadores y personal autorizado mediante correo registrado
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="correo" className="text-xs font-medium text-slate-700">
                  Correo Electrónico Institucional
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-2.5 size-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="correo"
                    name="correo"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    disabled={cargando}
                    placeholder="ej: analista@aquachile.cl"
                    value={correo}
                    onChange={(e) => {
                      setCorreo(e.target.value);
                      setError("");
                    }}
                    className="bg-white border-slate-300 text-slate-900 text-xs h-10 pl-9 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3"
                >
                  <ShieldAlert className="size-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={cargando}
                className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors gap-2 cursor-pointer"
              >
                {cargando ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    <span>Verificando correo en la base de datos…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="size-3.5" aria-hidden="true" />
                    <span>Ingresar al Sistema</span>
                  </>
                )}
              </Button>
            </form>

            {/* Accesos rápidos sugeridos */}
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <p className="text-[11px] font-medium text-slate-600">
                Cuentas registradas en la base de datos:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {CUENTAS_SUGERIDAS.map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => seleccionarSugerido(c.email)}
                    className="flex flex-col items-start p-2 rounded-md border border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-left transition-colors"
                  >
                    <span className="text-[10px] font-semibold text-slate-700">{c.rol}</span>
                    <span className="text-[10px] text-slate-500 truncate w-full">{c.email}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Database className="size-3 text-slate-400" aria-hidden="true" />
              <span>Verificación en tiempo real contra Supabase</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer sobrio */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <p>© {new Date().getFullYear()} AquaChile S.A.</p>
          <p className="text-[11px]">Sistema de evaluación y gestión de candidatos</p>
        </div>
      </footer>
    </div>
  );
}

export const Ingreso = LoginPage;
export default LoginPage;

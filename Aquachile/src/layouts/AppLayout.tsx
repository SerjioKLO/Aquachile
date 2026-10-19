import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, Users, ClipboardList, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useDatos } from "@/context/data-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Permiso } from "@/lib/domain";

const NAV: { to: string; label: string; icon: typeof Users; permiso: Permiso }[] = [
  { to: "/panel", label: "Dashboard", icon: LayoutDashboard, permiso: "ver_panel" },
  { to: "/candidatos", label: "Candidatos", icon: Users, permiso: "ver_candidatos" },
  { to: "/solicitudes", label: "Solicitudes", icon: ClipboardList, permiso: "ver_solicitudes" },
  { to: "/administracion", label: "Administración", icon: Shield, permiso: "administrar" },
];

export function AppLayout({ children }: { children?: ReactNode }) {
  const { rol, nombreRol, usuarioActual, listo, salir, puede } = useAuth();
  const { backendConectado } = useDatos();
  const navigate = useNavigate();

  useEffect(() => {
    if (listo && !rol) navigate("/", { replace: true });
  }, [listo, rol, navigate]);

  if (!listo || !rol) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs text-slate-500">
        Verificando sesión…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Header institucional */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/panel" className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-950">
                AquaChile
              </span>
              <span className="text-xs text-slate-500 border-l border-slate-300 pl-2 hidden sm:inline">
                Evaluación Psicolaboral
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV.filter((n) => puede(n.permiso)).map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors",
                      isActive && "bg-slate-100 text-slate-950 font-semibold",
                    )
                  }
                >
                  <n.icon className="size-3.5 text-slate-500" aria-hidden="true" />
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de persistencia */}
            <div
              className="hidden lg:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600"
              title={
                backendConectado
                  ? "Conectado a la API REST Spring Boot (puerto 8080)"
                  : "Modo Local: Datos almacenados en almacenamiento persistente"
              }
            >
              <span
                className={`size-1.5 rounded-full ${
                  backendConectado ? "bg-emerald-500" : "bg-slate-400"
                }`}
                aria-hidden="true"
              />
              <span className="font-mono text-[10px]">
                {backendConectado ? "API Spring Boot" : "Storage Local"}
              </span>
            </div>

            {/* Identificación de usuario */}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-900 leading-tight">
                {usuarioActual?.nombre}
              </p>
              <p className="text-[10px] text-slate-500">{nombreRol}</p>
            </div>

            {/* Botón salir */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                salir();
                navigate("/login", { replace: true });
              }}
              className="border-slate-200 text-slate-700 hover:bg-slate-100 h-8 px-2.5 text-xs gap-1.5 rounded-md"
            >
              <LogOut className="size-3 text-slate-500" aria-hidden="true" />
              <span>Salir</span>
            </Button>
          </div>
        </div>

        {/* Barra móvil */}
        <div className="flex md:hidden border-t border-slate-100 px-4 py-2 gap-1 overflow-x-auto bg-white">
          {NAV.filter((n) => puede(n.permiso)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100",
                  isActive && "bg-slate-100 text-slate-950 font-semibold",
                )
              }
            >
              <n.icon className="size-3 text-slate-500" aria-hidden="true" />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </div>
      </header>

      {/* Área de trabajo */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children ?? <Outlet />}
      </main>

      {/* Footer sobrio */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <p>© {new Date().getFullYear()} AquaChile S.A.</p>
          <Link to="/" className="text-slate-600 hover:text-slate-900 hover:underline">
            Ir a formulario de postulación
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;

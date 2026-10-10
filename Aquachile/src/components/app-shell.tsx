import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { BrainCircuit, LayoutDashboard, Users, ClipboardList, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useDatos } from "@/context/data-context";
import { Button } from "@/components/ui/button";
import type { Permiso } from "@/lib/domain";

const NAV: { to: string; label: string; icon: typeof Users; permiso: Permiso }[] = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard, permiso: "ver_panel" },
  { to: "/candidatos", label: "Candidatos", icon: Users, permiso: "ver_candidatos" },
  { to: "/solicitudes", label: "Solicitudes", icon: ClipboardList, permiso: "ver_solicitudes" },
  { to: "/administracion", label: "Administración", icon: Shield, permiso: "administrar" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { rol, nombreRol, usuarioActual, listo, salir, puede } = useAuth();
  const { backendConectado } = useDatos();
  const navigate = useNavigate();

  useEffect(() => {
    if (listo && !rol) navigate({ to: "/", replace: true });
  }, [listo, rol, navigate]);

  if (!listo || !rol) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/panel" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BrainCircuit className="size-5" />
            </span>
            <span className="hidden text-sm font-semibold leading-tight sm:block">
              Evaluación Psicolaboral
              <span className="block text-xs font-normal text-muted-foreground">
                AquaChile · Duoc UC
              </span>
            </span>
          </Link>

          <nav className="flex flex-1 items-center gap-1">
            {NAV.filter((n) => puede(n.permiso)).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground font-semibold" }}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Indicador sutil de persistencia / backend */}
            <div
              className="hidden lg:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-muted/50 text-muted-foreground"
              title={
                backendConectado
                  ? "Conectado a la API REST Spring Boot (MySQL en puerto 8080)"
                  : "Modo Local: Datos persistidos en localStorage (sin pérdida en F5)"
              }
            >
              <span
                className={`size-2 rounded-full ${
                  backendConectado ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{backendConectado ? "API REST Conectada" : "Almacenamiento Persistente"}</span>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-xs text-muted-foreground">
                {usuarioActual?.nombre || "Sesión activa"}
              </p>
              <p className="text-sm font-medium">{nombreRol}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                salir();
                navigate({ to: "/login", replace: true });
              }}
            >
              <LogOut className="size-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

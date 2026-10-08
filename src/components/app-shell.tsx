import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { BrainCircuit, LayoutDashboard, Users, ClipboardList, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import type { Permiso } from "@/lib/domain";

const NAV: { to: string; label: string; icon: typeof Users; permiso: Permiso }[] = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard, permiso: "ver_panel" },
  { to: "/candidatos", label: "Candidatos", icon: Users, permiso: "ver_candidatos" },
  { to: "/solicitudes", label: "Solicitudes", icon: ClipboardList, permiso: "ver_solicitudes" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { rol, nombreRol, listo, salir, puede } = useAuth();
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
                Selección de candidatos
              </span>
            </span>
          </Link>

          <nav className="flex flex-1 items-center gap-1">
            {NAV.filter((n) => puede(n.permiso)).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground" }}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-muted-foreground">Sesión activa</p>
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

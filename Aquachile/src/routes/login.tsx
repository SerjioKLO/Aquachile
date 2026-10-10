import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrainCircuit, LogIn, ShieldCheck, UserCheck, Shield, Eye } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ROLES, USUARIOS } from "@/lib/domain";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Ingreso | Sistema de Evaluación Psicolaboral" },
      {
        name: "description",
        content:
          "Acceda al sistema de gestión de selección y evaluación psicológica de candidatos con sus credenciales simuladas.",
      },
      { property: "og:title", content: "Ingreso | Sistema de Evaluación Psicolaboral" },
      {
        property: "og:description",
        content:
          "Gestione candidatos, solicitudes y evaluaciones psicolaborales según su rol asignado.",
      },
    ],
  }),
  component: Ingreso,
});

const ICONOS_ROL = {
  analista: UserCheck,
  evaluador: BrainCircuit,
  admin: Shield,
  jefatura: Eye,
};

export function Ingreso() {
  const { ingresar } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState(false);

  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (ingresar(usuario, clave)) {
      navigate({ to: "/panel" });
    } else {
      setError(true);
    }
  }

  function ingresarConRol(rolId: string) {
    const u = USUARIOS.find((user) => user.rol === rolId);
    if (u) {
      if (ingresar(u.usuario, u.clave)) {
        navigate({ to: "/panel" });
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <BrainCircuit className="size-7" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            Sistema de Evaluación Psicolaboral
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AquaChile & Duoc UC · Seleccione un perfil para ingresar directamente o use credenciales
            simuladas.
          </p>
        </div>

        {/* 1. Selector rápido de los 4 roles simulados */}
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Perfiles y Roles Simulados (Acceso en 1 Clic)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => {
              const Icono = ICONOS_ROL[r.id] || ShieldCheck;
              const usuarioInfo = USUARIOS.find((u) => u.rol === r.id);
              return (
                <Card
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => ingresarConRol(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      ingresarConRol(r.id);
                    }
                  }}
                  className="group flex flex-col justify-between p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-card"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icono className="size-4" />
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {usuarioInfo?.usuario}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {r.nombre}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                      {r.descripcion}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-medium text-primary">
                    <span>Ingresar como {r.id}</span>
                    <span>→</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 2. Formulario manual de login */}
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              O ingrese con usuario y contraseña
            </h2>
            <form onSubmit={enviar} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="usuario">Usuario</Label>
                <Input
                  id="usuario"
                  autoComplete="username"
                  placeholder="analista, evaluador, admin, jefatura"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    setError(false);
                  }}
                  aria-invalid={error}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clave">Contraseña</Label>
                  <span className="text-xs text-muted-foreground">Clave demo: 1234</span>
                </div>
                <Input
                  id="clave"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••"
                  value={clave}
                  onChange={(e) => {
                    setClave(e.target.value);
                    setError(false);
                  }}
                  aria-invalid={error}
                />
              </div>
              {error && (
                <p className="text-xs text-destructive">
                  Usuario o contraseña incorrectos. Use analista, evaluador, admin o jefatura con
                  clave 1234.
                </p>
              )}
              <Button type="submit" className="w-full gap-2">
                <LogIn className="size-4" />
                Ingresar al sistema
              </Button>
            </form>
          </Card>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Volver al formulario de postulación ciudadana
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Datos 100% simulados y anonimizados para fines académicos Duoc UC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

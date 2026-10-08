import { Link, useNavigate } from "@tanstack/react-router";
import { BrainCircuit, ShieldCheck } from "lucide-react";
import { ROLES } from "@/lib/domain";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";

export function LoginPage() {
  const { ingresar } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BrainCircuit className="size-7" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            Sistema de Evaluación Psicolaboral
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seleccione su perfil para ingresar. El acceso a los módulos depende del rol elegido.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <Card
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                ingresar(r.id);
                navigate({ to: "/panel" });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  ingresar(r.id);
                  navigate({ to: "/panel" });
                }
              }}
              className="cursor-pointer p-5 transition-all hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold">{r.nombre}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{r.descripcion}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Volver al formulario de postulación
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            Inicio de sesión simulado con datos de prueba precargados.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, FileQuestion, LogIn, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { rol } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans antialiased">
      {/* Barra superior institucional */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-slate-950">AquaChile</span>
            <span className="text-xs text-slate-500 border-l border-slate-300 pl-2">
              Evaluación Psicolaboral
            </span>
          </Link>

          <Link to="/" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
            Inicio
          </Link>
        </div>
      </header>

      {/* Contenido principal 404 */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center space-y-6">
          {/* Badge & Icono */}
          <img 
            src="/404_icon.svg" 
            alt="Página no encontrada" 
            className="size-70 mx-auto object-contain" 
          />

          <div className="space-y-2">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">
              Error 404
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Página no encontrada
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              El enlace al que intentas acceder no existe, ha sido movido o la dirección URL fue
              escrita de forma incorrecta.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">

            {rol ? (
              <Button
                asChild
                size="sm"
                className="w-full sm:w-auto h-9 text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Link to="/panel">
                  <LayoutDashboard className="size-3.5" aria-hidden="true" />
                  <span>Ir al Dashboard</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="sm"
                  className="w-full sm:w-auto h-9 text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Link to="/">
                    <Home className="size-3.5" aria-hidden="true" />
                    <span>Volver a la página de inicio</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer institucional */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <p>© {new Date().getFullYear()} AquaChile S.A.</p>
          <p className="text-[11px]">Sistema de evaluación y gestión de candidatos</p>
        </div>
      </footer>
    </div>
  );
}

export default NotFoundPage;


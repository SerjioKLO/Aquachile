import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/layouts/AppLayout";
import {
  PostulacionPage,
  LoginPage,
  PanelPage,
  CandidatosPage,
  SolicitudesPage,
  DetalleSolicitudPage,
  AdministracionPage,
} from "@/pages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<PostulacionPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Rutas anidadas en el layout institucional */}
              <Route element={<AppLayout />}>
                <Route path="/panel" element={<PanelPage />} />
                <Route path="/candidatos" element={<CandidatosPage />} />
                <Route path="/solicitudes" element={<SolicitudesPage />} />
                <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
                <Route path="/administracion" element={<AdministracionPage />} />
              </Route>

              {/* Redirección por defecto para rutas no encontradas */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

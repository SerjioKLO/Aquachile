import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PERMISOS_POR_ROL, ROLES, type Permiso, type Rol } from "@/lib/domain";

interface AuthValue {
  rol: Rol | null;
  nombreRol: string;
  listo: boolean;
  ingresar: (rol: Rol) => void;
  salir: () => void;
  puede: (permiso: Permiso) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);
const STORAGE_KEY = "psi-rol";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [rol, setRol] = useState<Rol | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY) as Rol | null;
    if (guardado && guardado in PERMISOS_POR_ROL) setRol(guardado);
    setListo(true);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      rol,
      listo,
      nombreRol: ROLES.find((r) => r.id === rol)?.nombre ?? "",
      ingresar: (r) => {
        localStorage.setItem(STORAGE_KEY, r);
        setRol(r);
      },
      salir: () => {
        localStorage.removeItem(STORAGE_KEY);
        setRol(null);
      },
      puede: (permiso) => (rol ? PERMISOS_POR_ROL[rol].includes(permiso) : false),
    }),
    [rol, listo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

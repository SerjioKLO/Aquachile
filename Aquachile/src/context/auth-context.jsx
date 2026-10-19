import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PERMISOS_POR_ROL, ROLES, USUARIOS } from "@/lib/domain";
const AuthContext = createContext(null);
const STORAGE_KEY = "psi-rol";
export function AuthProvider({ children }) {
  const [rol, setRol] = useState(null);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado && guardado in PERMISOS_POR_ROL) setRol(guardado);
    setListo(true);
  }, []);
  const value = useMemo(() => {
    const uActual = USUARIOS.find((u) => u.rol === rol) ?? null;
    return {
      rol,
      listo,
      nombreRol: ROLES.find((r) => r.id === rol)?.nombre ?? "",
      usuarioActual: uActual,
      ingresar: (usuario, clave) => {
        const encontrado = USUARIOS.find(
          (u) => u.usuario === usuario.trim().toLowerCase() && u.clave === clave
        );
        if (!encontrado) return false;
        localStorage.setItem(STORAGE_KEY, encontrado.rol);
        setRol(encontrado.rol);
        return true;
      },
      salir: () => {
        localStorage.removeItem(STORAGE_KEY);
        setRol(null);
      },
      puede: (permiso) => rol ? PERMISOS_POR_ROL[rol].includes(permiso) : false
    };
  }, [rol, listo]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

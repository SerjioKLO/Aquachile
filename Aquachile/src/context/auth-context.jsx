import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { PERMISOS_POR_ROL, ROLES, USUARIOS } from "@/lib/domain";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);
const STORAGE_KEY = "psi-rol";
const STORAGE_USER_KEY = "psi-usuario";

export function AuthProvider({ children }) {
  const [rol, setRol] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const guardadoRol = localStorage.getItem(STORAGE_KEY);
      const guardadoUser = localStorage.getItem(STORAGE_USER_KEY);

      if (guardadoRol && guardadoRol in PERMISOS_POR_ROL) {
        setRol(guardadoRol);
        if (guardadoUser) {
          try {
            setUsuarioActual(JSON.parse(guardadoUser));
          } catch {
            // Si falla el parseo, se busca en la lista fallback
            const uFallback = USUARIOS.find((u) => u.rol === guardadoRol) ?? null;
            setUsuarioActual(uFallback);
          }
        } else {
          const uFallback = USUARIOS.find((u) => u.rol === guardadoRol) ?? null;
          setUsuarioActual(uFallback);
        }
      }
    } finally {
      setListo(true);
    }
  }, []);

  const ingresar = useCallback(async (identificador, clave) => {
    const input = (identificador || "").trim().toLowerCase();
    const pass = (clave || "").trim();

    if (!input || !pass) {
      return { ok: false, error: "Ingresa tu usuario/correo y contraseña." };
    }

    // 1. Intentar autenticar contra la base de datos Supabase
    try {
      const { data: usuarios, error } = await supabase
        .from("usuario")
        .select(`
          id,
          nombre_completo,
          correo,
          password,
          rol_id,
          rol:rol_id (
            id,
            nombre,
            descripcion
          )
        `);

      if (!error && usuarios && usuarios.length > 0) {
        const encontrado = usuarios.find((u) => {
          const correo = (u.correo || "").toLowerCase();
          const prefix = correo.split("@")[0];
          const coincideUser =
            correo === input ||
            prefix === input ||
            correo.startsWith(`${input}@`);
          return coincideUser && String(u.password).trim() === pass;
        });

        if (encontrado) {
          const rolKey = (encontrado.rol?.nombre || "").toLowerCase();
          const rolValido = rolKey in PERMISOS_POR_ROL ? rolKey : "analista";
          const usuarioData = {
            id: encontrado.id,
            nombre: encontrado.nombre_completo,
            nombre_completo: encontrado.nombre_completo,
            correo: encontrado.correo,
            rol: rolValido,
            rolId: encontrado.rol_id
          };

          localStorage.setItem(STORAGE_KEY, rolValido);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuarioData));
          setRol(rolValido);
          setUsuarioActual(usuarioData);
          return { ok: true, usuario: usuarioData };
        }
      }
    } catch (err) {
      console.warn("No se pudo conectar a Supabase para login, intentando fallback:", err);
    }

    // 2. Fallback de seguridad en caso de fallo de red
    const encontradoLocal = USUARIOS.find((u) => {
      const match =
        u.usuario.toLowerCase() === input ||
        `${u.usuario.toLowerCase()}@aquachile.cl` === input;
      return match && u.clave === pass;
    });

    if (encontradoLocal) {
      const usuarioData = {
        nombre: encontradoLocal.nombre,
        nombre_completo: encontradoLocal.nombre,
        correo: `${encontradoLocal.usuario}@aquachile.cl`,
        rol: encontradoLocal.rol
      };
      localStorage.setItem(STORAGE_KEY, encontradoLocal.rol);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuarioData));
      setRol(encontradoLocal.rol);
      setUsuarioActual(usuarioData);
      return { ok: true, usuario: usuarioData };
    }

    return {
      ok: false,
      error: "Credenciales incorrectas. Verifica tu usuario o correo y contraseña."
    };
  }, []);

  const salir = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setRol(null);
    setUsuarioActual(null);
  }, []);

  const puede = useCallback(
    (permiso) => (rol && PERMISOS_POR_ROL[rol] ? PERMISOS_POR_ROL[rol].includes(permiso) : false),
    [rol]
  );

  const value = useMemo(
    () => ({
      rol,
      listo,
      nombreRol: ROLES.find((r) => r.id === rol)?.nombre ?? (usuarioActual?.nombre ? rol : ""),
      usuarioActual,
      ingresar,
      salir,
      puede
    }),
    [rol, listo, usuarioActual, ingresar, salir, puede]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

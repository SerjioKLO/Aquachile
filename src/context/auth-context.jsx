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

  /**
   * Inicio de sesión únicamente mediante correo electrónico,
   * comprobando que el correo exista en la tabla public.usuario de Supabase.
   */
  const ingresar = useCallback(async (correoIngresado) => {
    const input = (correoIngresado || "").trim().toLowerCase();

    if (!input) {
      return { ok: false, error: "Por favor ingresa tu correo electrónico." };
    }

    // Normalizar si ingresó un alias directo como "analista" -> "analista@aquachile.cl"
    const emailNormalizado = input.includes("@") ? input : `${input}@aquachile.cl`;

    // 1. Comprobar que el correo se encuentre registrado en la tabla public.usuario de Supabase
    try {
      const { data: usuario, error } = await supabase
        .from("usuario")
        .select(`
          id,
          nombre_completo,
          correo,
          rol_id,
          rol:rol_id (
            id,
            nombre,
            descripcion
          )
        `)
        .ilike("correo", emailNormalizado)
        .maybeSingle();

      if (!error && usuario) {
        const rolKey = (usuario.rol?.nombre || "").toLowerCase();
        const rolValido = rolKey in PERMISOS_POR_ROL ? rolKey : "analista";
        const usuarioData = {
          id: usuario.id,
          nombre: usuario.nombre_completo,
          nombre_completo: usuario.nombre_completo,
          correo: usuario.correo,
          rol: rolValido,
          rolId: usuario.rol_id,
          rolDescripcion: usuario.rol?.descripcion || ""
        };

        localStorage.setItem(STORAGE_KEY, rolValido);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuarioData));
        setRol(rolValido);
        setUsuarioActual(usuarioData);
        return { ok: true, usuario: usuarioData };
      }
    } catch (err) {
      console.warn("No se pudo conectar a Supabase para verificar el correo:", err);
    }

    // 2. Fallback de contingencia (en caso de pérdida temporal de conexión a Supabase)
    const encontradoLocal = USUARIOS.find((u) => {
      const uCorreo = `${u.usuario.toLowerCase()}@aquachile.cl`;
      return (
        uCorreo === emailNormalizado ||
        u.usuario.toLowerCase() === input
      );
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
      error: "El correo ingresado no se encuentra registrado en la base de datos."
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
export default AuthContext;

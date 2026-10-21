import { supabase } from "@/lib/supabase";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  CANDIDATOS_INICIALES,
  SOLICITUDES_INICIALES,
  CARGOS_INICIALES,
  PSICOLOGOS,
  evaluacionVacia
} from "@/lib/domain";
import { api, toFrontendCandidato, toFrontendSolicitud } from "@/services/api";
import { toast } from "sonner";
const DataContext = createContext(null);
const STORAGE_CANDIDATOS = "aquachile_candidatos_v3";
const STORAGE_SOLICITUDES = "aquachile_solicitudes_v3";
const STORAGE_CARGOS = "aquachile_cargos_v3";
const STORAGE_PSICOLOGOS = "aquachile_psicologos_v3";

if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("aquachile_candidatos_v2");
    localStorage.removeItem("aquachile_solicitudes_v2");
    localStorage.removeItem("aquachile_candidatos");
    localStorage.removeItem("aquachile_solicitudes");
  } catch {}
}
const hoyISO = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function leerStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function guardarStorage(key, data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
  }
}
export function DataProvider({ children }) {
  const [candidatos, setCandidatos] = useState(
    () => leerStorage(STORAGE_CANDIDATOS, CANDIDATOS_INICIALES)
  );
  const [solicitudes, setSolicitudes] = useState(
    () => leerStorage(STORAGE_SOLICITUDES, SOLICITUDES_INICIALES)
  );
  const [cargos, setCargos] = useState(
    () => leerStorage(STORAGE_CARGOS, CARGOS_INICIALES)
  );
  const [psicologos, setPsicologos] = useState(
    () => leerStorage(STORAGE_PSICOLOGOS, PSICOLOGOS)
  );
  const [cargando, setCargando] = useState(false);
  const [backendConectado, setBackendConectado] = useState(null);
  const [supabaseConectado, setSupabaseConectado] = useState(false);
  const recargarDesdeBackend = useCallback(async () => {
    setCargando(true);
    try {
      const estaConectado = await api.verificarConexion();
      setBackendConectado(estaConectado);
      if (estaConectado) {
        const [candsDTO, solsDTO, catsDTO] = await Promise.all([
          api.candidatos.listar().catch(() => null),
          api.solicitudes.listar().catch(() => null),
          api.catalogos.obtener().catch(() => null)
        ]);
        if (candsDTO && candsDTO.length > 0) {
          const candsMapeados = candsDTO.map(toFrontendCandidato);
          setCandidatos(candsMapeados);
          guardarStorage(STORAGE_CANDIDATOS, candsMapeados);
        }
        if (solsDTO && solsDTO.length > 0) {
          const solsMapeadas = solsDTO.map(toFrontendSolicitud);
          setSolicitudes(solsMapeadas);
          guardarStorage(STORAGE_SOLICITUDES, solsMapeadas);
        }
        if (catsDTO && catsDTO.cargos?.length > 0) {
          const cargosMapeados = catsDTO.cargos.map((cg) => ({
            id: `cg${cg.id}`,
            nombre: cg.nombre,
            familia: cg.familiaNombre || "Operaciones / Producción",
            descripcion: cg.descripcion || "",
            activo: true
          }));
          setCargos(cargosMapeados);
          guardarStorage(STORAGE_CARGOS, cargosMapeados);
        }
        if (catsDTO && catsDTO.evaluadores?.length > 0) {
          const evals = catsDTO.evaluadores.map((e) => e.nombreCompleto);
          setPsicologos(evals);
          guardarStorage(STORAGE_PSICOLOGOS, evals);
        }
      } else {
        // Cargar candidatos desde Supabase cuando el backend Spring Boot no está activo
        try {
          const { data: supaCands, error: supaErr } = await supabase
            .from("candidato")
            .select("*")
            .order("id", { ascending: false });

          if (!supaErr) {
            setSupabaseConectado(true);
            const candsMapeados = (supaCands || []).map((c) => ({
              id: `c${c.id}`,
              rut: c.rut,
              nombre: c.nombre_completo,
              correo: c.correo,
              telefono: c.telefono,
              cargo: c.cargo || "Sin cargo",
              familia: c.familia || "Operaciones / Producción",
              activo: true,
              creado: c.creado_en ? c.creado_en.slice(0, 10) : hoyISO()
            }));

            setCandidatos(candsMapeados);
            guardarStorage(STORAGE_CANDIDATOS, candsMapeados);
          } else {
            console.warn("No se pudo conectar a Supabase:", supaErr);
            setSupabaseConectado(false);
          }
        } catch (supaEx) {
          console.warn("No se pudo cargar desde Supabase:", supaEx);
          setSupabaseConectado(false);
        }
      }
    } catch {
      setBackendConectado(false);
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => {
    recargarDesdeBackend();
  }, [recargarDesdeBackend]);
  const guardarCandidato = useCallback(
    async (datos) => {
      let nuevoCandidato;
      if (datos.id && !datos.yaEnSupabase) {
        setCandidatos((prev) => {
          const existe = prev.some((c) => c.id === datos.id);
          const actualizados = existe
            ? prev.map((c) => (c.id === datos.id ? { ...c, ...datos, id: c.id } : c))
            : [{ ...datos, activo: true, creado: hoyISO() }, ...prev];
          guardarStorage(STORAGE_CANDIDATOS, actualizados);
          return actualizados;
        });
        if (backendConectado) {
          try {
            await api.candidatos.actualizar(datos.id, {
              rut: datos.rut,
              nombre: datos.nombre,
              correo: datos.correo,
              telefono: datos.telefono,
              cargoNombre: datos.cargo,
              familiaNombre: datos.familia
            });
          } catch (err) {
            console.warn("No se pudo sincronizar edición con backend:", err);
          }
        } else {
          try {
            const numericId = Number(String(datos.id).replace(/\D/g, ""));
            if (numericId) {
              await supabase
                .from("candidato")
                .update({
                  rut: datos.rut,
                  nombre_completo: datos.nombre,
                  correo: datos.correo,
                  telefono: datos.telefono,
                  cargo: datos.cargo,
                  familia: datos.familia
                })
                .eq("id", numericId);
            }
          } catch (err) {
            console.warn("No se pudo actualizar en Supabase:", err);
          }
        }
      } else if (datos.yaEnSupabase) {
        nuevoCandidato = {
          ...datos,
          id: datos.id,
          activo: true,
          creado: hoyISO()
        };
        setCandidatos((prev) => {
          const actualizados = [nuevoCandidato, ...prev.filter((c) => c.rut !== datos.rut)];
          guardarStorage(STORAGE_CANDIDATOS, actualizados);
          return actualizados;
        });
      } else {
        const idGenerado = `c${Date.now()}`;
        nuevoCandidato = {
          ...datos,
          id: idGenerado,
          activo: true,
          creado: hoyISO()
        };
        setCandidatos((prev) => {
          const actualizados = [nuevoCandidato, ...prev];
          guardarStorage(STORAGE_CANDIDATOS, actualizados);
          return actualizados;
        });
        if (backendConectado) {
          try {
            await api.candidatos.crear({
              rut: datos.rut,
              nombre: datos.nombre,
              correo: datos.correo,
              telefono: datos.telefono,
              cargoNombre: datos.cargo,
              familiaNombre: datos.familia
            });
          } catch (err) {
            console.warn("No se pudo sincronizar creación con backend:", err);
          }
        } else {
          try {
            const { data: ins } = await supabase
              .from("candidato")
              .insert([
                {
                  rut: datos.rut,
                  nombre_completo: datos.nombre,
                  correo: datos.correo,
                  telefono: datos.telefono,
                  cargo: datos.cargo,
                  familia: datos.familia
                }
              ])
              .select()
              .single();

            if (ins?.id) {
              setCandidatos((prev) => {
                const act = prev.map((c) => (c.id === idGenerado ? { ...c, id: `c${ins.id}` } : c));
                guardarStorage(STORAGE_CANDIDATOS, act);
                return act;
              });
            }
          } catch (err) {
            console.warn("No se pudo sincronizar creación con Supabase:", err);
          }
        }
      }
    },
    [backendConectado]
  );
  const eliminarCandidato = useCallback(
    async (id) => {
      setCandidatos((prev) => {
        const actualizados = prev.filter((c) => c.id !== id);
        guardarStorage(STORAGE_CANDIDATOS, actualizados);
        return actualizados;
      });
      setSolicitudes((prev) => {
        const actualizados = prev.filter((s) => s.candidatoId !== id);
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });
      if (backendConectado) {
        try {
          await api.candidatos.eliminar(id);
        } catch (err) {
          console.warn("No se pudo sincronizar eliminación con backend:", err);
        }
      } else {
        try {
          const numericId = Number(String(id).replace(/\D/g, ""));
          if (numericId) {
            await supabase.from("candidato").delete().eq("id", numericId);
          }
        } catch (err) {
          console.warn("No se pudo eliminar en Supabase:", err);
        }
      }
    },
    [backendConectado]
  );
  const crearSolicitud = useCallback(
    async (datos) => {
      const nueva = {
        ...datos,
        id: `s${Date.now()}`,
        codigo: `SOL-${1001 + solicitudes.length + 10}`,
        estado: "Pendiente",
        actualizada: hoyISO(),
        evaluacion: evaluacionVacia()
      };
      setSolicitudes((prev) => {
        const actualizados = [nueva, ...prev];
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });
      if (backendConectado) {
        try {
          const numericCandId = Number(datos.candidatoId.replace(/\D/g, "")) || 1;
          await api.solicitudes.crear({
            candidatoId: numericCandId,
            cargoNombre: datos.cargo,
            psicologoNombre: datos.psicologo,
            prioridad: datos.prioridad,
            fechaSolicitud: datos.fechaSolicitud
          });
        } catch (err) {
          console.warn("No se pudo sincronizar solicitud con backend:", err);
        }
      }
    },
    [solicitudes.length, backendConectado]
  );
  const cambiarEstado = useCallback(
    async (id, estado) => {
      setSolicitudes((prev) => {
        const actualizados = prev.map(
          (s) => s.id === id ? { ...s, estado, actualizada: hoyISO() } : s
        );
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });
      if (backendConectado) {
        try {
          await api.solicitudes.cambiarEstado(id, estado);
        } catch (err) {
          console.warn("No se pudo sincronizar cambio de estado con backend:", err);
        }
      }
    },
    [backendConectado]
  );
  const guardarEvaluacion = useCallback(
    async (id, evaluacion) => {
      setSolicitudes((prev) => {
        const actualizados = prev.map(
          (s) => s.id === id ? { ...s, evaluacion, actualizada: hoyISO() } : s
        );
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });
      if (backendConectado) {
        try {
          await api.solicitudes.guardarEvaluacion(id, evaluacion);
        } catch (err) {
          console.warn("No se pudo sincronizar evaluaci\xF3n con backend:", err);
        }
      }
    },
    [backendConectado]
  );
  const restablecerDatosPrueba = useCallback(() => {
    setCandidatos([]);
    setSolicitudes([]);
    setCargos(CARGOS_INICIALES);
    setPsicologos(PSICOLOGOS);
    guardarStorage(STORAGE_CANDIDATOS, []);
    guardarStorage(STORAGE_SOLICITUDES, []);
    guardarStorage(STORAGE_CARGOS, CARGOS_INICIALES);
    guardarStorage(STORAGE_PSICOLOGOS, PSICOLOGOS);
    toast.success("Registros restablecidos al estado inicial.");
  }, []);
  const agregarCargo = useCallback((nuevo) => {
    const item = {
      ...nuevo,
      id: `cg${Date.now()}`,
      activo: true
    };
    setCargos((prev) => {
      const actualizados = [...prev, item];
      guardarStorage(STORAGE_CARGOS, actualizados);
      return actualizados;
    });
    toast.success(`Cargo "${item.nombre}" agregado al cat\xE1logo.`);
  }, []);
  const agregarPsicologo = useCallback((nombre) => {
    if (!nombre.trim()) return;
    setPsicologos((prev) => {
      if (prev.includes(nombre.trim())) return prev;
      const actualizados = [...prev, nombre.trim()];
      guardarStorage(STORAGE_PSICOLOGOS, actualizados);
      return actualizados;
    });
    toast.success(`Evaluador "${nombre}" agregado a la lista.`);
  }, []);
  const value = useMemo(
    () => ({
      candidatos,
      solicitudes,
      cargos,
      psicologos,
      cargando,
      backendConectado,
      supabaseConectado,
      guardarCandidato,
      eliminarCandidato,
      crearSolicitud,
      cambiarEstado,
      guardarEvaluacion,
      nombreCandidato: (id) => candidatos.find((c) => c.id === id)?.nombre ?? "Candidato eliminado",
      restablecerDatosPrueba,
      agregarCargo,
      agregarPsicologo,
      recargarDesdeBackend
    }),
    [
      candidatos,
      solicitudes,
      cargos,
      psicologos,
      cargando,
      backendConectado,
      supabaseConectado,
      guardarCandidato,
      eliminarCandidato,
      crearSolicitud,
      cambiarEstado,
      guardarEvaluacion,
      restablecerDatosPrueba,
      agregarCargo,
      agregarPsicologo,
      recargarDesdeBackend
    ]
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
export function useDatos() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDatos debe usarse dentro de DataProvider");
  return ctx;
}

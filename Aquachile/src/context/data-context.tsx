import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CANDIDATOS_INICIALES,
  SOLICITUDES_INICIALES,
  CARGOS_INICIALES,
  PSICOLOGOS,
  evaluacionVacia,
  type Candidato,
  type Evaluacion,
  type EstadoSolicitud,
  type Solicitud,
  type CargoItem,
  type FamiliaCargo,
} from "@/lib/domain";
import { api, toFrontendCandidato, toFrontendSolicitud } from "@/services/api";
import { toast } from "sonner";

interface DataValue {
  candidatos: Candidato[];
  solicitudes: Solicitud[];
  cargos: CargoItem[];
  psicologos: string[];
  cargando: boolean;
  backendConectado: boolean | null;
  guardarCandidato: (
    c: Omit<Candidato, "id" | "creado" | "activo"> & { id?: string },
  ) => Promise<void>;
  eliminarCandidato: (id: string) => Promise<void>;
  crearSolicitud: (
    s: Omit<Solicitud, "id" | "codigo" | "estado" | "actualizada" | "evaluacion">,
  ) => Promise<void>;
  cambiarEstado: (id: string, estado: EstadoSolicitud) => Promise<void>;
  guardarEvaluacion: (id: string, evaluacion: Evaluacion) => Promise<void>;
  nombreCandidato: (id: string) => string;
  restablecerDatosPrueba: () => void;
  agregarCargo: (cargo: Omit<CargoItem, "id" | "activo">) => void;
  agregarPsicologo: (nombre: string) => void;
  recargarDesdeBackend: () => Promise<void>;
}

const DataContext = createContext<DataValue | null>(null);

const STORAGE_CANDIDATOS = "aquachile_candidatos_v2";
const STORAGE_SOLICITUDES = "aquachile_solicitudes_v2";
const STORAGE_CARGOS = "aquachile_cargos_v2";
const STORAGE_PSICOLOGOS = "aquachile_psicologos_v2";

const hoyISO = () => new Date().toISOString().slice(0, 10);

function leerStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function guardarStorage<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignorar error de cuota
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [candidatos, setCandidatos] = useState<Candidato[]>(() =>
    leerStorage(STORAGE_CANDIDATOS, CANDIDATOS_INICIALES),
  );
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(() =>
    leerStorage(STORAGE_SOLICITUDES, SOLICITUDES_INICIALES),
  );
  const [cargos, setCargos] = useState<CargoItem[]>(() =>
    leerStorage(STORAGE_CARGOS, CARGOS_INICIALES),
  );
  const [psicologos, setPsicologos] = useState<string[]>(() =>
    leerStorage(STORAGE_PSICOLOGOS, PSICOLOGOS),
  );
  const [cargando, setCargando] = useState(false);
  const [backendConectado, setBackendConectado] = useState<boolean | null>(null);

  // Intentar sincronizar con el backend Spring Boot al montar
  const recargarDesdeBackend = useCallback(async () => {
    setCargando(true);
    try {
      const estaConectado = await api.verificarConexion();
      setBackendConectado(estaConectado);

      if (estaConectado) {
        const [candsDTO, solsDTO, catsDTO] = await Promise.all([
          api.candidatos.listar().catch(() => null),
          api.solicitudes.listar().catch(() => null),
          api.catalogos.obtener().catch(() => null),
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
          const cargosMapeados: CargoItem[] = catsDTO.cargos.map((cg) => ({
            id: `cg${cg.id}`,
            nombre: cg.nombre,
            familia: (cg.familiaNombre as FamiliaCargo) || "Operaciones / Producción",
            descripcion: cg.descripcion || "",
            activo: true,
          }));
          setCargos(cargosMapeados);
          guardarStorage(STORAGE_CARGOS, cargosMapeados);
        }

        if (catsDTO && catsDTO.evaluadores?.length > 0) {
          const evals = catsDTO.evaluadores.map((e) => e.nombreCompleto);
          setPsicologos(evals);
          guardarStorage(STORAGE_PSICOLOGOS, evals);
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

  // Persistir cambios locales ante cualquier mutación
  const guardarCandidato = useCallback<DataValue["guardarCandidato"]>(
    async (datos) => {
      let nuevoCandidato: Candidato;

      if (datos.id) {
        setCandidatos((prev) => {
          const actualizados = prev.map((c) =>
            c.id === datos.id ? { ...c, ...datos, id: c.id } : c,
          );
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
              familiaNombre: datos.familia,
            });
          } catch (err) {
            console.warn("No se pudo sincronizar edición con backend:", err);
          }
        }
      } else {
        const idGenerado = `c${Date.now()}`;
        nuevoCandidato = {
          ...datos,
          id: idGenerado,
          activo: true,
          creado: hoyISO(),
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
              familiaNombre: datos.familia,
            });
          } catch (err) {
            console.warn("No se pudo sincronizar creación con backend:", err);
          }
        }
      }
    },
    [backendConectado],
  );

  const eliminarCandidato = useCallback(
    async (id: string) => {
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
      }
    },
    [backendConectado],
  );

  const crearSolicitud = useCallback<DataValue["crearSolicitud"]>(
    async (datos) => {
      const nueva: Solicitud = {
        ...datos,
        id: `s${Date.now()}`,
        codigo: `SOL-${1001 + solicitudes.length + 10}`,
        estado: "Pendiente",
        actualizada: hoyISO(),
        evaluacion: evaluacionVacia(),
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
            fechaSolicitud: datos.fechaSolicitud,
          });
        } catch (err) {
          console.warn("No se pudo sincronizar solicitud con backend:", err);
        }
      }
    },
    [solicitudes.length, backendConectado],
  );

  const cambiarEstado = useCallback(
    async (id: string, estado: EstadoSolicitud) => {
      setSolicitudes((prev) => {
        const actualizados = prev.map((s) =>
          s.id === id ? { ...s, estado, actualizada: hoyISO() } : s,
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
    [backendConectado],
  );

  const guardarEvaluacion = useCallback(
    async (id: string, evaluacion: Evaluacion) => {
      setSolicitudes((prev) => {
        const actualizados = prev.map((s) =>
          s.id === id ? { ...s, evaluacion, actualizada: hoyISO() } : s,
        );
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });

      if (backendConectado) {
        try {
          await api.solicitudes.guardarEvaluacion(id, evaluacion);
        } catch (err) {
          console.warn("No se pudo sincronizar evaluación con backend:", err);
        }
      }
    },
    [backendConectado],
  );

  // Función para Administrador Académico: Restablecer base a los 12 candidatos y 10 solicitudes iniciales
  const restablecerDatosPrueba = useCallback(() => {
    setCandidatos(CANDIDATOS_INICIALES);
    setSolicitudes(SOLICITUDES_INICIALES);
    setCargos(CARGOS_INICIALES);
    setPsicologos(PSICOLOGOS);

    guardarStorage(STORAGE_CANDIDATOS, CANDIDATOS_INICIALES);
    guardarStorage(STORAGE_SOLICITUDES, SOLICITUDES_INICIALES);
    guardarStorage(STORAGE_CARGOS, CARGOS_INICIALES);
    guardarStorage(STORAGE_PSICOLOGOS, PSICOLOGOS);

    toast.success("Datos de prueba restablecidos al estado inicial del caso AquaChile.");
  }, []);

  const agregarCargo = useCallback((nuevo: Omit<CargoItem, "id" | "activo">) => {
    const item: CargoItem = {
      ...nuevo,
      id: `cg${Date.now()}`,
      activo: true,
    };
    setCargos((prev) => {
      const actualizados = [...prev, item];
      guardarStorage(STORAGE_CARGOS, actualizados);
      return actualizados;
    });
    toast.success(`Cargo "${item.nombre}" agregado al catálogo.`);
  }, []);

  const agregarPsicologo = useCallback((nombre: string) => {
    if (!nombre.trim()) return;
    setPsicologos((prev) => {
      if (prev.includes(nombre.trim())) return prev;
      const actualizados = [...prev, nombre.trim()];
      guardarStorage(STORAGE_PSICOLOGOS, actualizados);
      return actualizados;
    });
    toast.success(`Evaluador "${nombre}" agregado a la lista.`);
  }, []);

  const value = useMemo<DataValue>(
    () => ({
      candidatos,
      solicitudes,
      cargos,
      psicologos,
      cargando,
      backendConectado,
      guardarCandidato,
      eliminarCandidato,
      crearSolicitud,
      cambiarEstado,
      guardarEvaluacion,
      nombreCandidato: (id) => candidatos.find((c) => c.id === id)?.nombre ?? "Candidato eliminado",
      restablecerDatosPrueba,
      agregarCargo,
      agregarPsicologo,
      recargarDesdeBackend,
    }),
    [
      candidatos,
      solicitudes,
      cargos,
      psicologos,
      cargando,
      backendConectado,
      guardarCandidato,
      eliminarCandidato,
      crearSolicitud,
      cambiarEstado,
      guardarEvaluacion,
      restablecerDatosPrueba,
      agregarCargo,
      agregarPsicologo,
      recargarDesdeBackend,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDatos() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDatos debe usarse dentro de DataProvider");
  return ctx;
}

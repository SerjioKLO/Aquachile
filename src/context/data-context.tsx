import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  CANDIDATOS_INICIALES,
  SOLICITUDES_INICIALES,
  evaluacionVacia,
  type Candidato,
  type Evaluacion,
  type EstadoSolicitud,
  type Solicitud,
} from "@/lib/domain";

interface DataValue {
  candidatos: Candidato[];
  solicitudes: Solicitud[];
  guardarCandidato: (c: Omit<Candidato, "id" | "creado" | "activo"> & { id?: string }) => void;
  eliminarCandidato: (id: string) => void;
  crearSolicitud: (
    s: Omit<Solicitud, "id" | "codigo" | "estado" | "actualizada" | "evaluacion">,
  ) => void;
  cambiarEstado: (id: string, estado: EstadoSolicitud) => void;
  guardarEvaluacion: (id: string, evaluacion: Evaluacion) => void;
  nombreCandidato: (id: string) => string;
}

const DataContext = createContext<DataValue | null>(null);
const hoyISO = () => new Date().toISOString().slice(0, 10);

export function DataProvider({ children }: { children: ReactNode }) {
  const [candidatos, setCandidatos] = useState<Candidato[]>(CANDIDATOS_INICIALES);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(SOLICITUDES_INICIALES);

  const guardarCandidato = useCallback<DataValue["guardarCandidato"]>((datos) => {
    setCandidatos((prev) => {
      if (datos.id) {
        return prev.map((c) => (c.id === datos.id ? { ...c, ...datos, id: c.id } : c));
      }
      const nuevo: Candidato = {
        ...datos,
        id: `c${Date.now()}`,
        activo: true,
        creado: hoyISO(),
      };
      return [nuevo, ...prev];
    });
  }, []);

  const eliminarCandidato = useCallback((id: string) => {
    setCandidatos((prev) => prev.filter((c) => c.id !== id));
    setSolicitudes((prev) => prev.filter((s) => s.candidatoId !== id));
  }, []);

  const crearSolicitud = useCallback<DataValue["crearSolicitud"]>((datos) => {
    setSolicitudes((prev) => [
      {
        ...datos,
        id: `s${Date.now()}`,
        codigo: `SOL-${1001 + prev.length + 10}`,
        estado: "Pendiente",
        actualizada: hoyISO(),
        evaluacion: evaluacionVacia(),
      },
      ...prev,
    ]);
  }, []);

  const cambiarEstado = useCallback((id: string, estado: EstadoSolicitud) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado, actualizada: hoyISO() } : s)),
    );
  }, []);

  const guardarEvaluacion = useCallback((id: string, evaluacion: Evaluacion) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, evaluacion, actualizada: hoyISO() } : s)),
    );
  }, []);

  const value = useMemo<DataValue>(
    () => ({
      candidatos,
      solicitudes,
      guardarCandidato,
      eliminarCandidato,
      crearSolicitud,
      cambiarEstado,
      guardarEvaluacion,
      nombreCandidato: (id) => candidatos.find((c) => c.id === id)?.nombre ?? "Candidato eliminado",
    }),
    [
      candidatos,
      solicitudes,
      guardarCandidato,
      eliminarCandidato,
      crearSolicitud,
      cambiarEstado,
      guardarEvaluacion,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDatos() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDatos debe usarse dentro de DataProvider");
  return ctx;
}

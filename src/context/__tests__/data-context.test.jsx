import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { DataProvider, useDatos } from "../data-context";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: () => ({
        order: vi.fn().mockResolvedValue({ data: null, error: new Error("offline") }),
        ilike: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({ data: { id: 101 }, error: null }),
        }),
      }),
      update: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      upsert: () => vi.fn().mockResolvedValue({ error: null }),
      delete: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

vi.mock("@/lib/supabase-db", () => ({
  cargarCatalogoSupabase: vi.fn().mockResolvedValue({
    cargos: [],
    familias: ["Operaciones / Producción"],
    cargosPorFamilia: {},
  }),
  cargarEvaluadoresSupabase: vi.fn().mockResolvedValue([]),
  resolverCargoParaCandidato: vi.fn().mockResolvedValue({
    familia_id: 1,
    cargo_id: null,
    cargo_personalizado: "Operador Logístico",
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    verificarConexion: vi.fn().mockResolvedValue(false),
    candidatos: {
      listar: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
    },
    solicitudes: {
      listar: vi.fn(),
      crear: vi.fn(),
      cambiarEstado: vi.fn(),
      guardarEvaluacion: vi.fn(),
    },
    catalogos: {
      obtener: vi.fn(),
    },
  },
  toFrontendCandidato: vi.fn(),
  toFrontendSolicitud: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("data-context.jsx - DataProvider y useDatos", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("debe inicializarse con arrays vacíos para candidatos y solicitudes si no hay storage", () => {
    const { result } = renderHook(() => useDatos(), { wrapper: DataProvider });
    expect(result.current.candidatos).toEqual([]);
    expect(result.current.solicitudes).toEqual([]);
    expect(result.current.cargos.length).toBeGreaterThan(0);
    expect(result.current.familias.length).toBeGreaterThan(0);
  });

  it("guardarCandidato() debe agregar un nuevo candidato a la lista y persistir en localStorage", async () => {
    const { result } = renderHook(() => useDatos(), { wrapper: DataProvider });

    const nuevo = {
      nombre: "Carlos Alvarado",
      rut: "15.432.123-4",
      correo: "carlos@aquachile.cl",
      telefono: "+56 9 1234 5678",
      cargo: "Operador Logístico",
      familia: "Operaciones / Producción",
    };

    await act(async () => {
      await result.current.guardarCandidato(nuevo);
    });

    expect(result.current.candidatos.length).toBe(1);
    expect(result.current.candidatos[0].nombre).toBe("Carlos Alvarado");
    expect(result.current.candidatos[0].rut).toBe("15.432.123-4");

    const guardadoStorage = JSON.parse(localStorage.getItem("aquachile_candidatos_v4"));
    expect(guardadoStorage.length).toBe(1);
    expect(guardadoStorage[0].nombre).toBe("Carlos Alvarado");
  });

  it("eliminarCandidato() debe remover el candidato de la lista", async () => {
    localStorage.setItem(
      "aquachile_candidatos_v4",
      JSON.stringify([{ id: "c1", nombre: "Juan", rut: "11.111.111-1" }])
    );

    const { result } = renderHook(() => useDatos(), { wrapper: DataProvider });
    expect(result.current.candidatos.length).toBe(1);

    await act(async () => {
      await result.current.eliminarCandidato("c1");
    });

    expect(result.current.candidatos.length).toBe(0);
  });

  it("crearSolicitud() debe generar una nueva solicitud con estado 'Pendiente'", async () => {
    const { result } = renderHook(() => useDatos(), { wrapper: DataProvider });

    await act(async () => {
      await result.current.crearSolicitud({
        candidatoId: "c1",
        cargo: "Supervisor",
        familia: "Operaciones / Producción",
        psicologo: "Ps. Andrés Miranda",
        prioridad: "Alta",
        fechaSolicitud: "2026-11-02",
      });
    });

    expect(result.current.solicitudes.length).toBe(1);
    expect(result.current.solicitudes[0].prioridad).toBe("Alta");
    expect(result.current.solicitudes[0].estado).toBe("Pendiente");
  });

  it("cambiarEstado() debe actualizar el estado de la solicitud", async () => {
    localStorage.setItem(
      "aquachile_solicitudes_v4",
      JSON.stringify([{ id: "s1", estado: "Pendiente" }])
    );

    const { result } = renderHook(() => useDatos(), { wrapper: DataProvider });
    expect(result.current.solicitudes[0].estado).toBe("Pendiente");

    await act(async () => {
      await result.current.cambiarEstado("s1", "En proceso");
    });

    expect(result.current.solicitudes[0].estado).toBe("En proceso");
  });

  it("restablecerDatosPrueba() debe reiniciar el estado a valores por defecto", () => {
    localStorage.setItem(
      "aquachile_candidatos_v4",
      JSON.stringify([{ id: "c1", nombre: "Candidato Temp" }])
    );

    const { result } = renderHook(() => useDatos(), { wrapper: DataProvider });
    expect(result.current.candidatos.length).toBe(1);

    act(() => {
      result.current.restablecerDatosPrueba();
    });

    expect(result.current.candidatos).toEqual([]);
    expect(result.current.solicitudes).toEqual([]);
  });
});

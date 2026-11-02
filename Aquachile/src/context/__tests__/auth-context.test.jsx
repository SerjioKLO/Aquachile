import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../auth-context";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("auth-context.jsx - AuthProvider y useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("debe inicializarse sin sesión por defecto", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.rol).toBeNull();
    expect(result.current.usuarioActual).toBeNull();
    expect(result.current.listo).toBe(true);
    expect(result.current.puede("ver_panel")).toBe(false);
  });

  it("debe rechazar correo vacío al intentar ingresar", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    let res;
    await act(async () => {
      res = await result.current.ingresar("");
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Por favor ingresa tu correo electrónico");
  });

  it("debe autenticar con Supabase si el correo está registrado", async () => {
    supabase.from.mockReturnValueOnce({
      select: () => ({
        ilike: () => ({
          maybeSingle: async () => ({
            data: {
              id: 10,
              nombre_completo: "Ps. Camila Rojas",
              correo: "analista@aquachile.cl",
              rol_id: 1,
              rol: { id: 1, nombre: "analista", descripcion: "Analista de Reclutamiento" },
            },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    let res;
    await act(async () => {
      res = await result.current.ingresar("analista@aquachile.cl");
    });

    expect(res.ok).toBe(true);
    expect(result.current.rol).toBe("analista");
    expect(result.current.usuarioActual.nombre).toBe("Ps. Camila Rojas");
    expect(result.current.puede("crear_solicitudes")).toBe(true);
    expect(result.current.puede("evaluar")).toBe(false); // analista no puede evaluar
    expect(localStorage.getItem("psi-rol")).toBe("analista");
  });

  it("debe hacer fallback a usuario local si falla Supabase", async () => {
    // Simular error de Supabase
    supabase.from.mockReturnValueOnce({
      select: () => ({
        ilike: () => ({
          maybeSingle: async () => ({ data: null, error: new Error("DB Offline") }),
        }),
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    let res;
    await act(async () => {
      // Alias corto "evaluador" normalizado a evaluador@aquachile.cl
      res = await result.current.ingresar("evaluador");
    });

    expect(res.ok).toBe(true);
    expect(result.current.rol).toBe("evaluador");
    expect(result.current.puede("evaluar")).toBe(true);
    expect(result.current.puede("administrar")).toBe(false);
  });

  it("debe limpiar sesión al invocar salir()", async () => {
    supabase.from.mockReturnValueOnce({
      select: () => ({
        ilike: () => ({
          maybeSingle: async () => ({
            data: {
              id: 1,
              nombre_completo: "Admin",
              correo: "admin@aquachile.cl",
              rol: { nombre: "admin" },
            },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.ingresar("admin@aquachile.cl");
    });
    expect(result.current.rol).toBe("admin");

    act(() => {
      result.current.salir();
    });

    expect(result.current.rol).toBeNull();
    expect(result.current.usuarioActual).toBeNull();
    expect(localStorage.getItem("psi-rol")).toBeNull();
  });
});


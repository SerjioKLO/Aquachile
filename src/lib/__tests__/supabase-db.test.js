import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cargarCatalogoSupabase,
  resolverCargoParaCandidato,
  cargarEvaluadoresSupabase,
} from "../supabase-db";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("supabase-db.js - Integración con Supabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolverCargoParaCandidato", () => {
    it("debe arrojar error si familia o cargo no son entregados", async () => {
      await expect(resolverCargoParaCandidato("", "Supervisor")).rejects.toThrow(
        "Debe indicar la familia y el cargo."
      );
      await expect(resolverCargoParaCandidato("Ventas", "")).rejects.toThrow(
        "Debe indicar la familia y el cargo."
      );
    });

    it("debe arrojar error si la familia no existe en la BD", async () => {
      supabase.from.mockReturnValueOnce({
        select: () => ({
          ilike: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      });

      await expect(
        resolverCargoParaCandidato("Familia Inexistente", "Cargo X")
      ).rejects.toThrow('La familia de cargo "Familia Inexistente" no existe en la base de datos.');
    });

    it("debe resolver cargo_id si el cargo coincide en el catálogo de esa familia", async () => {
      supabase.from.mockImplementation((table) => {
        if (table === "familia_cargo") {
          return {
            select: () => ({
              ilike: () => ({
                maybeSingle: async () => ({ data: { id: 1, nombre: "Tecnología / IT" }, error: null }),
              }),
            }),
          };
        }
        if (table === "cargo") {
          return {
            select: () => ({
              eq: () => ({
                ilike: () => ({
                  maybeSingle: async () => ({ data: { id: 8, nombre: "Desarrollador Backend" }, error: null }),
                }),
              }),
            }),
          };
        }
      });

      const res = await resolverCargoParaCandidato("Tecnología / IT", "Desarrollador Backend");
      expect(res).toEqual({
        familia_id: 1,
        cargo_id: 8,
        cargo_personalizado: null,
      });
    });

    it("debe resolver cargo_personalizado si el cargo no existe en el catálogo", async () => {
      supabase.from.mockImplementation((table) => {
        if (table === "familia_cargo") {
          return {
            select: () => ({
              ilike: () => ({
                maybeSingle: async () => ({ data: { id: 2, nombre: "Ventas / Comercial" }, error: null }),
              }),
            }),
          };
        }
        if (table === "cargo") {
          return {
            select: () => ({
              eq: () => ({
                ilike: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
      });

      const res = await resolverCargoParaCandidato("Ventas / Comercial", "Especialista en Salmones Gourmet");
      expect(res).toEqual({
        familia_id: 2,
        cargo_id: null,
        cargo_personalizado: "Especialista en Salmones Gourmet",
      });
    });
  });

  describe("cargarEvaluadoresSupabase", () => {
    it("debe filtrar solo aquellos usuarios con rol 'evaluador'", async () => {
      const usuariosMock = [
        { id: 1, nombre_completo: "Ps. Juan", correo: "juan@aquachile.cl", rol: { id: 2, nombre: "evaluador" } },
        { id: 2, nombre_completo: "Admin", correo: "admin@aquachile.cl", rol: { id: 1, nombre: "admin" } },
        { id: 3, nombre_completo: "Ps. Luisa", correo: "luisa@aquachile.cl", rol: { id: 2, nombre: "Evaluador" } },
      ];

      supabase.from.mockReturnValueOnce({
        select: () => ({
          order: async () => ({ data: usuariosMock, error: null }),
        }),
      });

      const evaluadores = await cargarEvaluadoresSupabase();
      expect(evaluadores).toHaveLength(2);
      expect(evaluadores[0].nombre).toBe("Ps. Juan");
      expect(evaluadores[1].nombre).toBe("Ps. Luisa");
    });

    it("debe retornar un array vacío en caso de error", async () => {
      supabase.from.mockReturnValueOnce({
        select: () => ({
          order: async () => ({ data: null, error: new Error("BD inaccesible") }),
        }),
      });

      const evaluadores = await cargarEvaluadoresSupabase();
      expect(evaluadores).toEqual([]);
    });
  });
});


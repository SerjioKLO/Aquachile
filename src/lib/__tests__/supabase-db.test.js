import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cargarCatalogoSupabase,
  resolverCargoParaCandidato,
  cargarEvaluadoresSupabase,
  subirCurriculum,
  obtenerUrlCurriculum,
  crearSolicitudEvaluacion,
} from "../supabase-db";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
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

  describe("subirCurriculum", () => {
    it("debe lanzar error si no se pasa un archivo", async () => {
      await expect(subirCurriculum(null, "12.345.678-9")).rejects.toThrow(
        "Debe proporcionar un archivo de currículum."
      );
    });

    it("debe sanitizar el RUT y subir el archivo al bucket 'curriculums'", async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: "123456789/123456_cv.pdf" },
        error: null,
      });

      supabase.storage.from.mockReturnValue({
        upload: mockUpload,
      });

      const mockFile = { name: "mi_cv.pdf", size: 1024, type: "application/pdf" };
      const resultado = await subirCurriculum(mockFile, "12.345.678-9");

      expect(supabase.storage.from).toHaveBeenCalledWith("curriculums");
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^123456789\/\d+_cv\.pdf$/),
        mockFile,
        expect.objectContaining({ upsert: false })
      );
      expect(resultado).toEqual({
        path: "123456789/123456_cv.pdf",
        nombreOriginal: "mi_cv.pdf",
      });
    });

    it("debe lanzar error si la subida a Storage falla", async () => {
      supabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Storage bucket limit reached"),
        }),
      });

      const mockFile = { name: "curriculum.docx", size: 2048, type: "application/msword" };
      await expect(subirCurriculum(mockFile, "11.222.333-4")).rejects.toThrow(
        "Storage bucket limit reached"
      );
    });
  });

  describe("obtenerUrlCurriculum", () => {
    it("debe lanzar error si no se proporciona curriculumPath", async () => {
      await expect(obtenerUrlCurriculum("")).rejects.toThrow(
        "Ruta de currículum no especificada."
      );
    });

    it("debe generar URL firmada con 600 segundos de expiración", async () => {
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: "https://supabase.co/storage/v1/signed/curriculums/cv.pdf?token=abc" },
        error: null,
      });

      supabase.storage.from.mockReturnValue({
        createSignedUrl: mockCreateSignedUrl,
      });

      const url = await obtenerUrlCurriculum("123456789/123_cv.pdf");

      expect(supabase.storage.from).toHaveBeenCalledWith("curriculums");
      expect(mockCreateSignedUrl).toHaveBeenCalledWith("123456789/123_cv.pdf", 600);
      expect(url).toBe("https://supabase.co/storage/v1/signed/curriculums/cv.pdf?token=abc");
    });

    it("debe lanzar error si createSignedUrl falla", async () => {
      supabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Permiso denegado"),
        }),
      });

      await expect(obtenerUrlCurriculum("ruta/invalida.pdf")).rejects.toThrow(
        "Permiso denegado"
      );
    });
  });

  describe("crearSolicitudEvaluacion", () => {
    it("debe insertar una solicitud con curriculum_path y curriculum_nombre", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: () => ({
          single: async () => ({
            data: {
              id: 99,
              candidato_id: 5,
              curriculum_path: "123456789/123_cv.pdf",
              curriculum_nombre: "mi_cv.pdf",
            },
            error: null,
          }),
        }),
      });

      supabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const res = await crearSolicitudEvaluacion({
        candidato_id: 5,
        curriculum_path: "123456789/123_cv.pdf",
        curriculum_nombre: "mi_cv.pdf",
      });

      expect(supabase.from).toHaveBeenCalledWith("solicitud_evaluacion");
      expect(mockInsert).toHaveBeenCalledWith([
        {
          candidato_id: 5,
          prioridad: "Media",
          estado: "Pendiente",
          curriculum_path: "123456789/123_cv.pdf",
          curriculum_nombre: "mi_cv.pdf",
        },
      ]);
      expect(res.id).toBe(99);
    });
  });
});


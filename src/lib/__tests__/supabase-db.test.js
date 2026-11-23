import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cargarCatalogoSupabase,
  resolverCargoParaCandidato,
  cargarEvaluadoresSupabase,
  subirCurriculum,
  obtenerUrlCurriculum,
  eliminarArchivosCurriculum,
  crearSolicitudEvaluacion,
  analizarCurriculumConIA,
} from "../supabase-db";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
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

  describe("eliminarArchivosCurriculum", () => {
    it("debe retornar ok: true si no se entregan paths", async () => {
      const res1 = await eliminarArchivosCurriculum(null);
      const res2 = await eliminarArchivosCurriculum([]);
      expect(res1.ok).toBe(true);
      expect(res2.ok).toBe(true);
      expect(supabase.storage.from).not.toHaveBeenCalled();
    });

    it("debe invocar supabase.storage.from('curriculums').remove con las rutas sanitizadas", async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        data: [{ name: "123_cv.pdf" }],
        error: null,
      });

      supabase.storage.from.mockReturnValue({
        remove: mockRemove,
      });

      const res = await eliminarArchivosCurriculum([" 123456789/123_cv.pdf ", "otro/cv.docx"]);

      expect(supabase.storage.from).toHaveBeenCalledWith("curriculums");
      expect(mockRemove).toHaveBeenCalledWith(["123456789/123_cv.pdf", "otro/cv.docx"]);
      expect(res.ok).toBe(true);
    });

    it("debe manejar errores de Storage sin lanzar excepción, retornando ok: false y registrando warning", async () => {
      supabase.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Fallo de red al eliminar"),
        }),
      });

      const res = await eliminarArchivosCurriculum("123456789/123_cv.pdf");
      expect(res.ok).toBe(false);
      expect(res.error).toBeDefined();
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

  describe("analizarCurriculumConIA", () => {
    it("debe lanzar error si no se proporciona solicitudId", async () => {
      await expect(analizarCurriculumConIA(null)).rejects.toThrow(
        "Se requiere el identificador de la solicitud para el análisis con IA."
      );
    });

    it("debe invocar la Edge Function 'analizar-cv' y retornar el análisis con fecha", async () => {
      const mockAnalisis = {
        puntaje_afinidad: 88,
        nivel_ajuste: "Alto",
        resumen_ejecutivo: ["Candidato con perfil sólido"],
        fortalezas_cargo: ["Experiencia comprobada"],
        brechas_detectadas: [],
        alertas_tempranas: [],
        preguntas_sugeridas: ["¿Cuál es su experiencia en salmones?"],
      };

      supabase.functions.invoke.mockResolvedValueOnce({
        data: {
          ok: true,
          analisis: mockAnalisis,
          fecha: "2026-11-23T01:00:00.000Z",
        },
        error: null,
      });

      const resultado = await analizarCurriculumConIA("s10");

      expect(supabase.functions.invoke).toHaveBeenCalledWith("analizar-cv", {
        body: { solicitudId: 10 },
      });
      expect(resultado).toEqual({
        analisis: mockAnalisis,
        fecha: "2026-11-23T01:00:00.000Z",
      });
    });

    it("debe lanzar error descriptivo si invoke reporta un fallo", async () => {
      supabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error("Fallo en Edge Function"),
      });

      await expect(analizarCurriculumConIA(10)).rejects.toThrow("Fallo en Edge Function");
    });

    it("debe propagar el mensaje de error si el cuerpo de respuesta contiene data.error", async () => {
      supabase.functions.invoke.mockResolvedValueOnce({
        data: {
          error: "El archivo no contiene texto legible (posiblemente sea una imagen escaneada sin OCR).",
        },
        error: null,
      });

      await expect(analizarCurriculumConIA(10)).rejects.toThrow(
        "El archivo no contiene texto legible"
      );
    });
  });
});


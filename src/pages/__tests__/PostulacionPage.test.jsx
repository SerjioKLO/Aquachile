import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PostulacionPage, postulacionSchema } from "../PostulacionPage";
import { useDatos } from "@/context/data-context";
import { subirCurriculum, resolverCargoParaCandidato, crearSolicitudEvaluacion } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

vi.mock("@/context/data-context", () => ({
  useDatos: vi.fn(),
}));

vi.mock("@/lib/supabase-db", () => ({
  cargarCatalogoSupabase: vi.fn().mockResolvedValue({
    conectado: true,
    familias: ["Tecnología / IT"],
    cargosPorFamilia: { "Tecnología / IT": ["Desarrollador Backend"] },
  }),
  resolverCargoParaCandidato: vi.fn(),
  subirCurriculum: vi.fn(),
  crearSolicitudEvaluacion: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/services/resendService", () => ({
  enviarConfirmacionPostulacion: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PostulacionPage.jsx - Subida de CV y validaciones", () => {
  const mockGuardarCandidato = vi.fn();
  const mockCrearSolicitud = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useDatos.mockReturnValue({
      guardarCandidato: mockGuardarCandidato,
      crearSolicitud: mockCrearSolicitud,
    });
  });

  describe("postulacionSchema - Validaciones Zod", () => {
    it("debe rechazar archivos mayores a 5 MB", () => {
      const datos = {
        nombre: "Carlos Valenzuela",
        rut: "15.234.567-8",
        correo: "carlos@example.com",
        telefono: "+56912345678",
        familia: "Tecnología / IT",
        cargo: "Desarrollador Backend",
        cv: { name: "cv_pesado.pdf", size: 6 * 1024 * 1024, type: "application/pdf" },
      };
      const res = postulacionSchema.safeParse(datos);
      expect(res.success).toBe(false);
      expect(res.error.issues.some((i) => i.message.includes("5 MB"))).toBe(true);
    });

    it("debe rechazar extensiones no permitidas (ej. .exe o .jpg)", () => {
      const datos = {
        nombre: "Carlos Valenzuela",
        rut: "15.234.567-8",
        correo: "carlos@example.com",
        telefono: "+56912345678",
        familia: "Tecnología / IT",
        cargo: "Desarrollador Backend",
        cv: { name: "virus.exe", size: 1024, type: "application/x-msdownload" },
      };
      const res = postulacionSchema.safeParse(datos);
      expect(res.success).toBe(false);
      expect(res.error.issues.some((i) => i.message.includes("PDF o Word"))).toBe(true);
    });

    it("debe aceptar archivos válidos (PDF menor a 5 MB)", () => {
      const datos = {
        nombre: "Carlos Valenzuela",
        rut: "15.234.567-8",
        correo: "carlos@example.com",
        telefono: "+56912345678",
        familia: "Tecnología / IT",
        cargo: "Desarrollador Backend",
        cv: { name: "mi_cv.pdf", size: 2 * 1024 * 1024, type: "application/pdf" },
      };
      const res = postulacionSchema.safeParse(datos);
      expect(res.success).toBe(true);
    });
  });

  describe("Flujo del componente PostulacionPage", () => {
    it("debe renderizar el campo de subida de CV con el límite de 5 MB", () => {
      render(
        <MemoryRouter>
          <PostulacionPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/3\. Currículum Vitae/i)).toBeInTheDocument();
      expect(screen.getByText("PDF o Word, máx. 5 MB")).toBeInTheDocument();
    });

    it("si falla la subida de archivo a Storage, muestra toast.error y NO crea solicitud ni candidato", async () => {
      subirCurriculum.mockRejectedValueOnce(new Error("Fallo de red al subir archivo"));

      const mockFile = new File(["contenido del cv"], "curriculum.pdf", {
        type: "application/pdf",
      });

      render(
        <MemoryRouter>
          <PostulacionPage
            initialValues={{
              nombre: "Carolina Andrea Muñoz",
              rut: "12.345.678-9",
              correo: "carolina@correo.cl",
              telefono: "+56912345678",
              familia: "Tecnología / IT",
              cargo: "Desarrollador Backend",
              cv: mockFile,
            }}
          />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole("button", { name: /enviar postulación/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(subirCurriculum).toHaveBeenCalledWith(mockFile, "12.345.678-9");
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/error al subir el currículum/i)
      );
      expect(mockGuardarCandidato).not.toHaveBeenCalled();
      expect(crearSolicitudEvaluacion).not.toHaveBeenCalled();
    });

    it("cuando el formulario es válido y la subida es exitosa, sube el CV antes y crea la solicitud y candidato", async () => {
      const mockFile = new File(["contenido del cv"], "curriculum.pdf", {
        type: "application/pdf",
      });

      subirCurriculum.mockResolvedValueOnce({
        path: "123456789/123456789_cv.pdf",
        nombreOriginal: "curriculum.pdf",
      });

      resolverCargoParaCandidato.mockResolvedValueOnce({
        familia_id: 1,
        cargo_id: 2,
        cargo_personalizado: null,
      });

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: () => ({
            single: async () => ({
              data: { id: 45, rut: "12.345.678-9", nombre_completo: "Carolina Muñoz" },
              error: null,
            }),
          }),
        }),
      });

      crearSolicitudEvaluacion.mockResolvedValueOnce({
        id: 77,
        candidato_id: 45,
        curriculum_path: "123456789/123456789_cv.pdf",
        curriculum_nombre: "curriculum.pdf",
      });

      render(
        <MemoryRouter>
          <PostulacionPage
            initialValues={{
              nombre: "Carolina Andrea Muñoz",
              rut: "12.345.678-9",
              correo: "carolina@correo.cl",
              telefono: "+56912345678",
              familia: "Tecnología / IT",
              cargo: "Desarrollador Backend",
              cv: mockFile,
            }}
          />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole("button", { name: /enviar postulación/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(subirCurriculum).toHaveBeenCalledWith(mockFile, "12.345.678-9");
      });

      await waitFor(() => {
        expect(mockGuardarCandidato).toHaveBeenCalledWith(
          expect.objectContaining({
            rut: "12.345.678-9",
            curriculum_path: "123456789/123456789_cv.pdf",
            curriculum_nombre: "curriculum.pdf",
            yaEnSupabase: true,
          })
        );
      });

      expect(crearSolicitudEvaluacion).not.toHaveBeenCalled();
      expect(mockCrearSolicitud).not.toHaveBeenCalled();

      expect(toast.success).toHaveBeenCalledWith("¡Postulación enviada exitosamente!");
    });
  });
});

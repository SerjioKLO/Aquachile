import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DetalleSolicitudPage } from "../DetalleSolicitudPage";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { obtenerUrlCurriculum } from "@/lib/supabase-db";
import { toast } from "sonner";

vi.mock("@/lib/supabase-db", () => ({
  obtenerUrlCurriculum: vi.fn(),
}));

vi.mock("@/context/data-context", () => ({
  useDatos: vi.fn(),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DetalleSolicitudPage.jsx - Evaluación y Reglas de Negocio", () => {
  const mockCambiarEstado = vi.fn();
  const mockGuardarEvaluacion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      puede: (permiso) => permiso === "evaluar",
    });

    useDatos.mockReturnValue({
      solicitudes: [
        {
          id: "s10",
          codigo: "SOL-010",
          candidatoId: "c1",
          cargo: "Desarrollador Backend",
          familia: "Tecnología / IT",
          psicologo: "Ps. Andrés Miranda",
          estado: "En proceso",
          actualizada: "2026-11-01",
          evaluacion: {
            fechaEntrevista: "2026-11-01",
            conclusiones: "",
            dictamen: "",
            preguntasUsadas: {},
            notasPregunta: {},
          },
        },
      ],
      candidatos: [
        { id: "c1", nombre: "Ignacio Soto", rut: "17.654.321-0", correo: "ignacio@aquachile.cl" },
      ],
      cambiarEstado: mockCambiarEstado,
      guardarEvaluacion: mockGuardarEvaluacion,
    });
  });

  it("debe renderizar el detalle del candidato y la solicitud", () => {
    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/SOL-010/i)).toBeInTheDocument();
    expect(screen.getByText("Ignacio Soto")).toBeInTheDocument();
    expect(screen.getByText("Desarrollador Backend")).toBeInTheDocument();
    expect(screen.getByText(/Batería para la familia Tecnología \/ IT/i)).toBeInTheDocument();
  });

  it("debe impedir avanzar a 'Finalizada' si no se han completado conclusiones y dictamen", () => {
    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    const botonFinalizada = screen.getByRole("button", { name: /^finalizada$/i });
    fireEvent.click(botonFinalizada);

    expect(toast.error).toHaveBeenCalledWith("Complete conclusiones y dictamen antes de finalizar.");
    expect(mockCambiarEstado).not.toHaveBeenCalled();
  });

  it("si el usuario no tiene permiso de evaluar, debe mostrar advertencia de solo lectura", () => {
    useAuth.mockReturnValue({
      puede: () => false, // rol jefatura o analista
    });

    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Su rol solo permite consultar esta evaluación.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /guardar evaluación/i })).not.toBeInTheDocument();
  });

  it("debe mostrar el currículum si la solicitud tiene curriculum_path y abrirlo al hacer clic", async () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => {});
    obtenerUrlCurriculum.mockResolvedValue("https://signed-url.com/cv.pdf");

    useDatos.mockReturnValue({
      solicitudes: [
        {
          id: "s10",
          codigo: "SOL-010",
          candidatoId: "c1",
          cargo: "Desarrollador Backend",
          familia: "Tecnología / IT",
          psicologo: "Ps. Andrés Miranda",
          estado: "En proceso",
          actualizada: "2026-11-01",
          curriculum_path: "176543210/123456_cv.pdf",
          curriculum_nombre: "CV_Ignacio_Soto.pdf",
          evaluacion: {
            fechaEntrevista: "2026-11-01",
            conclusiones: "",
            dictamen: "",
            preguntasUsadas: {},
            notasPregunta: {},
          },
        },
      ],
      candidatos: [
        { id: "c1", nombre: "Ignacio Soto", rut: "17.654.321-0", correo: "ignacio@aquachile.cl" },
      ],
      cambiarEstado: mockCambiarEstado,
      guardarEvaluacion: mockGuardarEvaluacion,
    });

    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Currículum Vitae adjunto/i)).toBeInTheDocument();
    expect(screen.getByText("CV_Ignacio_Soto.pdf")).toBeInTheDocument();

    const botonCv = screen.getByRole("button", { name: /ver cv_ignacio_soto\.pdf/i });
    expect(botonCv).toBeInTheDocument();

    fireEvent.click(botonCv);

    expect(obtenerUrlCurriculum).toHaveBeenCalledWith("176543210/123456_cv.pdf");

    await vi.waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalledWith("https://signed-url.com/cv.pdf", "_blank");
    });

    windowOpenSpy.mockRestore();
  });
});

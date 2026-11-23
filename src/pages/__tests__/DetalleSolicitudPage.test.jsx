import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DetalleSolicitudPage } from "../DetalleSolicitudPage";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { obtenerUrlCurriculum, analizarCurriculumConIA } from "@/lib/supabase-db";
import { toast } from "sonner";

vi.mock("@/lib/supabase-db", () => ({
  obtenerUrlCurriculum: vi.fn(),
  analizarCurriculumConIA: vi.fn(),
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

  it("debe mostrar botón 'Analizar CV con IA' cuando tiene CV sin análisis y ejecutar la llamada", async () => {
    const mockGuardarAnalisis = vi.fn();
    analizarCurriculumConIA.mockResolvedValueOnce({
      analisis: {
        puntaje_afinidad: 82,
        nivel_ajuste: "Alto",
        resumen_ejecutivo: ["Perfil con alta afinidad técnica"],
        fortalezas_cargo: ["Conocimiento de salmones"],
        brechas_detectadas: ["Sin certificación en calderas"],
        alertas_tempranas: [],
        preguntas_sugeridas: ["¿Cómo aborda los turnos en planta?"],
      },
      fecha: "2026-11-23T01:10:00.000Z",
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
          curriculum_path: "176543210/123456_cv.pdf",
          curriculum_nombre: "CV_Ignacio_Soto.pdf",
          analisis_ia: null,
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
      guardarAnalisisIA: mockGuardarAnalisis,
    });

    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    const botonAnalizar = screen.getByRole("button", { name: /analizar cv con ia/i });
    expect(botonAnalizar).toBeInTheDocument();

    fireEvent.click(botonAnalizar);

    await vi.waitFor(() => {
      expect(analizarCurriculumConIA).toHaveBeenCalledWith("s10");
      expect(mockGuardarAnalisis).toHaveBeenCalledWith(
        "s10",
        expect.objectContaining({ puntaje_afinidad: 82 }),
        "2026-11-23T01:10:00.000Z"
      );
      expect(toast.success).toHaveBeenCalledWith("Pre-análisis con IA completado exitosamente");
    });
  });

  it("debe renderizar el análisis completo cuando ya está guardado en la solicitud", () => {
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
          analisis_ia: {
            puntaje_afinidad: 91,
            nivel_ajuste: "Alto",
            resumen_ejecutivo: [
              "Ingeniero senior con 8 años de experiencia en arquitecturas distribuidas.",
              "Dominio comprobado de bases de datos PostgreSQL y despliegues en la nube.",
              "Trayectoria con estabilidad laboral sobresaliente.",
              "Excelente fit para liderar proyectos tecnológicos en AquaChile."
            ],
            fortalezas_cargo: ["Gran dominio de microservicios", "Liderazgo técnico comprobado"],
            brechas_detectadas: ["Requiere familiarización con ERP interno"],
            alertas_tempranas: ["Período de transición de 6 meses no detallado en 2021"],
            preguntas_sugeridas: ["¿Qué proyectos de optimización de bases de datos lideró recientemente?"],
          },
          analisis_ia_fecha: "2026-11-23",
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

    // Métrica y Nivel
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByText("Ajuste Alto")).toBeInTheDocument();

    // Resumen Ejecutivo
    expect(screen.getByText(/Ingeniero senior con 8 años de experiencia/i)).toBeInTheDocument();

    // Fortalezas vs Brechas
    expect(screen.getByText("Gran dominio de microservicios")).toBeInTheDocument();
    expect(screen.getByText("Requiere familiarización con ERP interno")).toBeInTheDocument();

    // Alertas tempranas
    expect(screen.getByText(/Período de transición de 6 meses/i)).toBeInTheDocument();

    // Preguntas sugeridas
    expect(screen.getByText(/¿Qué proyectos de optimización de bases de datos lideró recientemente\?/i)).toBeInTheDocument();

    // Botón regenerar
    expect(screen.getByRole("button", { name: /regenerar análisis/i })).toBeInTheDocument();
  });

  it("debe mostrar toast.error si el análisis de IA falla porque el PDF no tiene texto legible", async () => {
    analizarCurriculumConIA.mockRejectedValueOnce(
      new Error("El archivo no contiene texto legible (posiblemente sea una imagen escaneada sin OCR).")
    );

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
          analisis_ia: null,
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
      guardarAnalisisIA: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    const botonAnalizar = screen.getByRole("button", { name: /analizar cv con ia/i });
    fireEvent.click(botonAnalizar);

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/no contiene texto legible/i)
      );
    });
  });
});

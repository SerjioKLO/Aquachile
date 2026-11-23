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
      rol: "analista",
      puede: (permiso) =>
        permiso === "evaluar" ||
        permiso === "crear_solicitudes" ||
        permiso === "ver_analisis_ia",
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

  it("debe impedir avanzar a 'Completada' si no se han completado conclusiones y dictamen", () => {
    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    const botonCompletada = screen.getByRole("button", { name: /^completada$/i });
    fireEvent.click(botonCompletada);

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

    // Preguntas sugeridas (aparece en tarjeta IA y en la lista de preguntas sugeridas de la entrevista)
    expect(
      screen.getAllByText(/¿Qué proyectos de optimización de bases de datos lideró recientemente\?/i).length
    ).toBeGreaterThan(0);

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

  it("con rol 'evaluador' NO debe mostrar la tarjeta de IA ni botones de análisis, pero sí el CV y los campos de evaluación", () => {
    useAuth.mockReturnValue({
      rol: "evaluador",
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
          curriculum_path: "176543210/123456_cv.pdf",
          curriculum_nombre: "CV_Ignacio_Soto.pdf",
          analisis_ia: {
            puntaje_afinidad: 91,
            nivel_ajuste: "Alto",
            resumen_ejecutivo: ["Perfil con alta afinidad técnica"],
            fortalezas_cargo: ["Conocimiento de salmones"],
            brechas_detectadas: [],
            alertas_tempranas: [],
            preguntas_sugeridas: [],
          },
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

    // Debe ver datos y CV
    expect(screen.getByText("CV_Ignacio_Soto.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ver cv_ignacio_soto\.pdf/i })).toBeInTheDocument();

    // NO debe ver la tarjeta de IA ni el puntaje ni botones de IA
    expect(screen.queryByText(/Pre-análisis IA del Currículum/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Analizar CV con IA/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/91%/)).not.toBeInTheDocument();

    // Sí puede ver y modificar los campos clínicos de evaluación y los 4 estados
    expect(screen.getByLabelText(/Fecha de entrevista/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Conclusiones/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dictamen/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^pendiente$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^en proceso$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^completada$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^cancelada$/i })).toBeInTheDocument();
  });

  it("el botón de estado 'Cancelada' tiene clases de estilo rojo (red / destructive)", () => {
    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    const botonCancelada = screen.getByRole("button", { name: /^cancelada$/i });
    expect(botonCancelada).toHaveClass("text-red-600");

    // Cuando la solicitud está Cancelada, el botón activo es fondo rojo
    useDatos.mockReturnValue({
      solicitudes: [
        {
          id: "s10",
          codigo: "SOL-010",
          candidatoId: "c1",
          cargo: "Desarrollador Backend",
          familia: "Tecnología / IT",
          psicologo: "Ps. Andrés Miranda",
          estado: "Cancelada",
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

    render(
      <MemoryRouter initialEntries={["/solicitudes/s10"]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<DetalleSolicitudPage />} />
        </Routes>
      </MemoryRouter>
    );

    const botonesCancelada = screen.getAllByRole("button", { name: /^cancelada$/i });
    const botonActivo = botonesCancelada[botonesCancelada.length - 1];
    expect(botonActivo).toHaveClass("bg-red-600");
  });

  it("reemplaza preguntas base por preguntas_sugeridas de la IA cuando existen en el candidato para el Evaluador", () => {
    useAuth.mockReturnValue({
      rol: "evaluador",
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
        {
          id: "c1",
          nombre: "Ignacio Soto",
          rut: "17.654.321-0",
          cargo: "Desarrollador Backend",
          familia: "Tecnología / IT",
          analisis_ia: {
            puntaje_afinidad: 88,
            nivel_ajuste: "Alto",
            resumen_ejecutivo: ["Perfil senior con sólidos conocimientos"],
            preguntas_sugeridas: [
              "¿Cómo implementas la resiliencia en arquitecturas distribuidas?",
              "¿Cuál es tu enfoque para mitigar riesgos en despliegues críticos?",
            ],
          },
        },
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

    // Debe mostrar las preguntas sugeridas por la IA
    expect(
      screen.getByText("¿Cómo implementas la resiliencia en arquitecturas distribuidas?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("¿Cuál es tu enfoque para mitigar riesgos en despliegues críticos?")
    ).toBeInTheDocument();

    // Las preguntas genéricas de la familia NO deben mostrarse
    expect(
      screen.queryByText("¿Cómo aborda un incidente en producción?")
    ).not.toBeInTheDocument();

    // NO debe mostrar la tarjeta de IA ni puntaje ni resumen al Evaluador
    expect(screen.queryByText(/Pre-análisis IA del Currículum/i)).not.toBeInTheDocument();
    expect(screen.queryByText("88%")).not.toBeInTheDocument();
    expect(screen.queryByText("Perfil senior con sólidos conocimientos")).not.toBeInTheDocument();
  });

  it("muestra preguntas genéricas por defecto cuando el candidato no cuenta con análisis de IA", () => {
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
        {
          id: "c1",
          nombre: "Ignacio Soto",
          rut: "17.654.321-0",
          cargo: "Desarrollador Backend",
          familia: "Tecnología / IT",
          analisis_ia: null,
        },
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

    // Muestra las preguntas estándar de Tecnología / IT
    expect(
      screen.getByText("¿Cómo aborda un incidente en producción?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("¿Cómo mantiene actualizado su conocimiento técnico?")
    ).toBeInTheDocument();
  });
});

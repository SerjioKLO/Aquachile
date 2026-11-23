import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DetalleCandidatoPage } from "../DetalleCandidatoPage";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { obtenerUrlCurriculum, analizarCurriculumConIA } from "@/lib/supabase-db";

vi.mock("@/lib/supabase-db", () => ({
  obtenerUrlCurriculum: vi.fn(),
  analizarCurriculumConIA: vi.fn(),
}));

vi.mock("@/context/data-context", () => ({
  useDatos: vi.fn(),
  generarAnalisisIaMock: vi.fn(() => ({
    puntaje_afinidad: 85,
    nivel_ajuste: "Alto",
    resumen_ejecutivo: ["Perfil sólido en desarrollo"],
    fortalezas_cargo: ["Experiencia técnica comprobada"],
    brechas_detectadas: ["Requiere inducción en normativa interna"],
    alertas_tempranas: [],
    preguntas_sugeridas: ["¿Cuál ha sido tu mayor desafío técnico?"]
  }))
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

describe("DetalleCandidatoPage.jsx - Ficha del Candidato y Pre-análisis IA", () => {
  const mockGuardarAnalisisIA = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      puede: (permiso) => permiso === "crear_solicitudes" || permiso === "evaluar",
    });
  });

  it("debe renderizar la información personal del candidato", () => {
    useDatos.mockReturnValue({
      candidatos: [
        {
          id: "c1",
          numericId: 1,
          nombre: "Francisca Silva",
          rut: "18.234.567-8",
          correo: "francisca@aquachile.cl",
          telefono: "+56 9 8765 4321",
          cargo: "Desarrollador Full Stack",
          familia: "Tecnología / IT",
          curriculum_path: "cvs/francisca.pdf",
          curriculum_nombre: "CV_Francisca_Silva.pdf",
        },
      ],
      solicitudes: [],
      guardarAnalisisIA: mockGuardarAnalisisIA,
      psicologos: ["Ps. Andrés Miranda"],
      crearSolicitud: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/candidatos/c1"]}>
        <Routes>
          <Route path="/candidatos/:id" element={<DetalleCandidatoPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Francisca Silva")).toBeInTheDocument();
    expect(screen.getByText(/18\.234\.567-8/)).toBeInTheDocument();
    expect(screen.getByText(/francisca@aquachile\.cl/)).toBeInTheDocument();
    expect(screen.getByText(/\+56 9 8765 4321/)).toBeInTheDocument();
    expect(screen.getAllByText("Desarrollador Full Stack").length).toBeGreaterThan(0);
    expect(screen.getByText("Tecnología / IT")).toBeInTheDocument();
    expect(screen.getByText("Sin solicitud asignada")).toBeInTheDocument();
    expect(screen.getByText("Crear solicitud de evaluación")).toBeInTheDocument();
    expect(screen.getByText("CV_Francisca_Silva.pdf")).toBeInTheDocument();
  });

  it("debe mostrar botón a la solicitud si ya existe una solicitud creada", () => {
    useDatos.mockReturnValue({
      candidatos: [
        {
          id: "c1",
          numericId: 1,
          nombre: "Francisca Silva",
          rut: "18.234.567-8",
          correo: "francisca@aquachile.cl",
          telefono: "+56 9 8765 4321",
          cargo: "Desarrollador Full Stack",
          familia: "Tecnología / IT",
          curriculum_path: "cvs/francisca.pdf",
          curriculum_nombre: "CV_Francisca_Silva.pdf",
        },
      ],
      solicitudes: [
        {
          id: "s10",
          codigo: "SOL-10",
          candidatoId: "c1",
          estado: "En proceso",
        },
      ],
      guardarAnalisisIA: mockGuardarAnalisisIA,
      psicologos: ["Ps. Andrés Miranda"],
    });

    render(
      <MemoryRouter initialEntries={["/candidatos/c1"]}>
        <Routes>
          <Route path="/candidatos/:id" element={<DetalleCandidatoPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Ver solicitud (SOL-10)")).toBeInTheDocument();
  });

  it("permite abrir el CV mediante URL firmada", async () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => {});
    obtenerUrlCurriculum.mockResolvedValue("https://storage.supabase.com/cvs/temp-url");

    useDatos.mockReturnValue({
      candidatos: [
        {
          id: "c1",
          numericId: 1,
          nombre: "Francisca Silva",
          rut: "18.234.567-8",
          cargo: "Desarrollador Full Stack",
          curriculum_path: "cvs/francisca.pdf",
          curriculum_nombre: "CV_Francisca_Silva.pdf",
        },
      ],
      solicitudes: [],
      guardarAnalisisIA: mockGuardarAnalisisIA,
      psicologos: [],
    });

    render(
      <MemoryRouter initialEntries={["/candidatos/c1"]}>
        <Routes>
          <Route path="/candidatos/:id" element={<DetalleCandidatoPage />} />
        </Routes>
      </MemoryRouter>
    );

    const btnVerCv = screen.getByRole("button", { name: /Ver CV_Francisca_Silva.pdf/i });
    fireEvent.click(btnVerCv);

    await waitFor(() => {
      expect(obtenerUrlCurriculum).toHaveBeenCalledWith("cvs/francisca.pdf");
      expect(windowOpenSpy).toHaveBeenCalledWith("https://storage.supabase.com/cvs/temp-url", "_blank");
    });

    windowOpenSpy.mockRestore();
  });

  it("permite ejecutar el análisis de CV con IA y guardarlo", async () => {
    analizarCurriculumConIA.mockResolvedValue({
      analisis: {
        puntaje_afinidad: 88,
        nivel_ajuste: "Alto",
        resumen_ejecutivo: ["Candidato ideal para la posición"],
        fortalezas_cargo: ["Excelente dominio de React y Node"],
        brechas_detectadas: ["Ninguna relevante"],
        alertas_tempranas: [],
        preguntas_sugeridas: ["¿Cómo estructuras tus APIs?"]
      },
      fecha: "2026-11-23T02:00:00Z"
    });

    useDatos.mockReturnValue({
      candidatos: [
        {
          id: "c1",
          numericId: 1,
          nombre: "Francisca Silva",
          cargo: "Desarrollador Full Stack",
          curriculum_path: "cvs/francisca.pdf",
          curriculum_nombre: "CV_Francisca_Silva.pdf",
          analisis_ia: null,
        },
      ],
      solicitudes: [],
      guardarAnalisisIA: mockGuardarAnalisisIA,
      psicologos: [],
    });

    render(
      <MemoryRouter initialEntries={["/candidatos/c1"]}>
        <Routes>
          <Route path="/candidatos/:id" element={<DetalleCandidatoPage />} />
        </Routes>
      </MemoryRouter>
    );

    const btnAnalizar = screen.getByRole("button", { name: /Analizar CV con IA/i });
    fireEvent.click(btnAnalizar);

    await waitFor(() => {
      expect(analizarCurriculumConIA).toHaveBeenCalledWith("c1");
      expect(mockGuardarAnalisisIA).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({ puntaje_afinidad: 88 }),
        "2026-11-23T02:00:00Z"
      );
    });
  });

  it("muestra la información del pre-análisis IA cuando ya está presente", () => {
    useDatos.mockReturnValue({
      candidatos: [
        {
          id: "c1",
          numericId: 1,
          nombre: "Francisca Silva",
          cargo: "Desarrollador Full Stack",
          curriculum_path: "cvs/francisca.pdf",
          curriculum_nombre: "CV_Francisca_Silva.pdf",
          analisis_ia: {
            puntaje_afinidad: 92,
            nivel_ajuste: "Alto",
            resumen_ejecutivo: ["Experiencia destacada en acuicultura"],
            fortalezas_cargo: ["Liderazgo técnico comprobado"],
            brechas_detectadas: ["Poco tiempo en la última empresa"],
            alertas_tempranas: ["Vacío laboral en 2024"],
            preguntas_sugeridas: ["Explique el vacío de 2024"]
          },
          analisis_ia_fecha: "2026-11-20T10:00:00Z"
        },
      ],
      solicitudes: [],
      guardarAnalisisIA: mockGuardarAnalisisIA,
      psicologos: [],
    });

    render(
      <MemoryRouter initialEntries={["/candidatos/c1"]}>
        <Routes>
          <Route path="/candidatos/:id" element={<DetalleCandidatoPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText(/Ajuste Alto/i)).toBeInTheDocument();
    expect(screen.getByText("Experiencia destacada en acuicultura")).toBeInTheDocument();
    expect(screen.getByText("Liderazgo técnico comprobado")).toBeInTheDocument();
    expect(screen.getByText("Vacío laboral en 2024")).toBeInTheDocument();
    expect(screen.getByText("Explique el vacío de 2024")).toBeInTheDocument();
  });

  it("muestra mensaje de no encontrado si el candidato no existe", () => {
    useDatos.mockReturnValue({
      candidatos: [],
      solicitudes: [],
      guardarAnalisisIA: mockGuardarAnalisisIA,
      psicologos: [],
    });

    render(
      <MemoryRouter initialEntries={["/candidatos/c999"]}>
        <Routes>
          <Route path="/candidatos/:id" element={<DetalleCandidatoPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/El candidato no existe o fue eliminado/i)).toBeInTheDocument();
  });

  it("abre modal de confirmación y elimina al candidato sin usar window.confirm", async () => {
    const mockEliminarCandidato = vi.fn().mockResolvedValue(true);
    const windowConfirmSpy = vi.spyOn(window, "confirm");
    const { toast } = await import("sonner");

    useAuth.mockReturnValue({
      puede: (permiso) => permiso === "editar_candidatos",
    });

    useDatos.mockReturnValue({
      candidatos: [
        {
          id: "c1",
          numericId: 1,
          nombre: "Francisca Silva",
          rut: "18.234.567-8",
          cargo: "Desarrollador Full Stack",
          curriculum_path: "cvs/francisca.pdf",
          curriculum_nombre: "CV_Francisca_Silva.pdf",
        },
      ],
      solicitudes: [],
      guardarAnalisisIA: mockGuardarAnalisisIA,
      eliminarCandidato: mockEliminarCandidato,
      psicologos: [],
    });

    render(
      <MemoryRouter initialEntries={["/candidatos/c1"]}>
        <Routes>
          <Route path="/candidatos/:id" element={<DetalleCandidatoPage />} />
          <Route path="/candidatos" element={<div>Página de Candidatos</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Botón eliminar en cabecera
    const btnEliminar = screen.getByRole("button", { name: /Eliminar candidato/i });
    fireEvent.click(btnEliminar);

    // Debe abrir el modal interno AlertDialog, NO window.confirm
    expect(windowConfirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "¿Eliminar candidato?" })).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Francisca Silva");
    expect(screen.getByRole("alertdialog")).toHaveTextContent("18.234.567-8");

    // Confirmar en el modal
    const btnConfirmar = screen.getByRole("button", { name: /Sí, eliminar candidato/i });
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(mockEliminarCandidato).toHaveBeenCalledWith("c1");
      expect(toast.success).toHaveBeenCalledWith("Candidato y currículum eliminados");
      expect(screen.getByText("Página de Candidatos")).toBeInTheDocument();
    });

    windowConfirmSpy.mockRestore();
  });
});

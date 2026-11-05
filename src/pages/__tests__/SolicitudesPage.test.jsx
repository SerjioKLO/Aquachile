import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SolicitudesPage } from "../SolicitudesPage";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";

vi.mock("@/context/data-context", () => ({
  useDatos: vi.fn(),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}));

describe("SolicitudesPage.jsx - Motor de Búsqueda y Filtros Multifacéticos (RF07)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      puede: (permiso) => permiso === "crear_solicitudes",
    });

    useDatos.mockReturnValue({
      candidatos: [
        { id: "c1", nombre: "Camila Rojas", rut: "12.345.678-9", cargo: "Supervisor", familia: "Operaciones / Producción" },
        { id: "c2", nombre: "Andrés Miranda", rut: "18.765.432-1", cargo: "Analista Contable", familia: "Finanzas y Administración" },
      ],
      solicitudes: [
        {
          id: "s1",
          codigo: "SOL-101",
          candidatoId: "c1",
          cargo: "Supervisor de Planta",
          familia: "Operaciones / Producción",
          psicologo: "Ps. Andrés",
          prioridad: "Alta",
          fechaSolicitud: "2026-10-15",
          estado: "Pendiente",
          actualizada: "2026-10-15",
          evaluacion: { dictamen: "" },
        },
        {
          id: "s2",
          codigo: "SOL-102",
          candidatoId: "c2",
          cargo: "Analista Contable",
          familia: "Finanzas y Administración",
          psicologo: "Ps. Camila",
          prioridad: "Media",
          fechaSolicitud: "2026-11-01",
          estado: "Finalizada",
          actualizada: "2026-11-01",
          evaluacion: { dictamen: "Recomendado" },
        },
      ],
      nombreCandidato: (id) => (id === "c1" ? "Camila Rojas" : "Andrés Miranda"),
    });
  });

  it("debe mostrar todas las solicitudes inicialmente", () => {
    render(
      <MemoryRouter>
        <SolicitudesPage />
      </MemoryRouter>
    );

    expect(screen.getByText("SOL-101")).toBeInTheDocument();
    expect(screen.getByText("SOL-102")).toBeInTheDocument();
  });

  it("debe filtrar por nombre o RUT del candidato", () => {
    render(
      <MemoryRouter>
        <SolicitudesPage />
      </MemoryRouter>
    );

    const inputCandidato = screen.getByPlaceholderText(/María Aguilar/i);
    fireEvent.change(inputCandidato, { target: { value: "Camila" } });

    expect(screen.getByText("SOL-101")).toBeInTheDocument();
    expect(screen.queryByText("SOL-102")).not.toBeInTheDocument();
  });

  it("debe filtrar por cargo específico", () => {
    render(
      <MemoryRouter>
        <SolicitudesPage />
      </MemoryRouter>
    );

    const inputCargo = screen.getByPlaceholderText(/Supervisor, Backend/i);
    fireEvent.change(inputCargo, { target: { value: "Analista" } });

    expect(screen.getByText("SOL-102")).toBeInTheDocument();
    expect(screen.queryByText("SOL-101")).not.toBeInTheDocument();
  });

  it("el botón 'Limpiar filtros' debe restablecer la visualización completa", () => {
    render(
      <MemoryRouter>
        <SolicitudesPage />
      </MemoryRouter>
    );

    const inputCargo = screen.getByPlaceholderText(/Supervisor, Backend/i);
    fireEvent.change(inputCargo, { target: { value: "Supervisor" } });

    expect(screen.queryByText("SOL-102")).not.toBeInTheDocument();

    const botonLimpiar = screen.getByRole("button", { name: /limpiar filtros/i });
    fireEvent.click(botonLimpiar);

    expect(screen.getByText("SOL-101")).toBeInTheDocument();
    expect(screen.getByText("SOL-102")).toBeInTheDocument();
  });
});

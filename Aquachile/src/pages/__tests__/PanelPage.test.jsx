import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PanelPage } from "../PanelPage";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";

vi.mock("@/context/data-context", () => ({
  useDatos: vi.fn(),
}));

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}));

describe("PanelPage.jsx - Dashboard y Cálculo de Métricas KPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      puede: (permiso) => permiso === "crear_solicitudes" || permiso === "editar_candidatos",
    });

    useDatos.mockReturnValue({
      candidatos: [
        { id: "c1", nombre: "Candidato Uno" },
        { id: "c2", nombre: "Candidato Dos" },
        { id: "c3", nombre: "Candidato Tres" },
      ],
      solicitudes: [
        { id: "s1", codigo: "SOL-001", candidatoId: "c1", cargo: "Supervisor", psicologo: "Ps. Camila", estado: "Pendiente", actualizada: "2026-11-01" },
        { id: "s2", codigo: "SOL-002", candidatoId: "c2", cargo: "Analista", psicologo: "Ps. Andrés", estado: "En proceso", actualizada: "2026-11-02" },
        { id: "s3", codigo: "SOL-003", candidatoId: "c3", cargo: "Enfermera", psicologo: "Ps. Camila", estado: "Finalizada", actualizada: "2026-11-03" },
      ],
      nombreCandidato: (id) => (id === "c1" ? "Candidato Uno" : id === "c2" ? "Candidato Dos" : "Candidato Tres"),
    });
  });

  it("debe calcular y mostrar correctamente los KPIs de resumen", () => {
    render(
      <MemoryRouter>
        <PanelPage />
      </MemoryRouter>
    );

    // Total candidatos: 3
    expect(screen.getByText("Total candidatos")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Estados
    expect(screen.getAllByText("Pendientes")[0]).toBeInTheDocument();
    expect(screen.getAllByText("En proceso")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Finalizadas")[0]).toBeInTheDocument();
  });

  it("debe filtrar la tabla de solicitudes recientes al escribir en el buscador", () => {
    render(
      <MemoryRouter>
        <PanelPage />
      </MemoryRouter>
    );

    const inputBusqueda = screen.getByPlaceholderText(/buscar candidato, código o cargo/i);
    fireEvent.change(inputBusqueda, { target: { value: "SOL-001" } });

    expect(screen.getByText("SOL-001")).toBeInTheDocument();
    expect(screen.queryByText("SOL-002")).not.toBeInTheDocument();
  });

  it("debe mostrar los botones de acción si el usuario posee los permisos", () => {
    render(
      <MemoryRouter>
        <PanelPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /registrar candidato/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nueva solicitud/i })).toBeInTheDocument();
  });
});

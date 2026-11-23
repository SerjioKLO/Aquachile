import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CandidatosPage } from "../CandidatosPage";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

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

describe("CandidatosPage.jsx - Eliminación unificada con modal interno", () => {
  const mockEliminarCandidato = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      puede: (permiso) => permiso === "editar_candidatos",
    });
  });

  it("abre modal interno de confirmación al hacer clic en eliminar y ejecuta eliminación", async () => {
    const windowConfirmSpy = vi.spyOn(window, "confirm");
    mockEliminarCandidato.mockResolvedValue(true);

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
          curriculum_path: "182345678/cv.pdf",
          curriculum_nombre: "cv.pdf",
        },
      ],
      solicitudes: [],
      eliminarCandidato: mockEliminarCandidato,
    });

    render(
      <MemoryRouter>
        <CandidatosPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Francisca Silva")).toBeInTheDocument();

    // Clic en botón Eliminar de la fila
    const btnEliminar = screen.getByRole("button", { name: "Eliminar" });
    fireEvent.click(btnEliminar);

    // NO debe dispararse window.confirm
    expect(windowConfirmSpy).not.toHaveBeenCalled();

    // Debe abrirse el AlertDialog interno con título y datos del candidato
    expect(screen.getByRole("heading", { name: "¿Eliminar candidato?" })).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Francisca Silva");
    expect(screen.getByRole("alertdialog")).toHaveTextContent("18.234.567-8");

    // Confirmar en el modal
    const btnConfirmar = screen.getByRole("button", { name: /Sí, eliminar candidato/i });
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(mockEliminarCandidato).toHaveBeenCalledWith("c1");
      expect(toast.success).toHaveBeenCalledWith("Candidato y currículum eliminados");
    });

    windowConfirmSpy.mockRestore();
  });

  it("permite cancelar el modal sin llamar a eliminarCandidato", async () => {
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
        },
      ],
      solicitudes: [],
      eliminarCandidato: mockEliminarCandidato,
    });

    render(
      <MemoryRouter>
        <CandidatosPage />
      </MemoryRouter>
    );

    const btnEliminar = screen.getByRole("button", { name: "Eliminar" });
    fireEvent.click(btnEliminar);

    expect(screen.getByRole("heading", { name: "¿Eliminar candidato?" })).toBeInTheDocument();

    const btnCancelar = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(btnCancelar);

    expect(mockEliminarCandidato).not.toHaveBeenCalled();
  });
});

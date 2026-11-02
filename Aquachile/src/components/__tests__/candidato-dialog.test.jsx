import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CandidatoDialog } from "../candidato-dialog";
import { useDatos } from "@/context/data-context";

vi.mock("@/context/data-context", () => ({
  useDatos: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("candidato-dialog.jsx - Diálogo y Validaciones de Candidato", () => {
  const mockGuardarCandidato = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useDatos.mockReturnValue({
      guardarCandidato: mockGuardarCandidato,
      candidatos: [
        { id: "c1", rut: "11.111.111-1", nombre: "Pedro Pascal" },
      ],
      cargos: [],
    });
  });

  it("no debe renderizarse en pantalla si open es false", () => {
    render(<CandidatoDialog open={false} onOpenChange={mockOnOpenChange} />);
    expect(screen.queryByText("Registrar candidato")).not.toBeInTheDocument();
  });

  it("debe mostrar errores de validación si se envía el formulario vacío", () => {
    render(<CandidatoDialog open={true} onOpenChange={mockOnOpenChange} />);

    const botonRegistrar = screen.getByRole("button", { name: /^registrar$/i });
    fireEvent.click(botonRegistrar);

    expect(screen.getByText(/Ingrese nombre y apellido \(mín\. 5 caracteres\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Formato de RUT inválido/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingrese un correo electrónico válido/i)).toBeInTheDocument();
    expect(screen.getByText(/El teléfono debe tener entre 8 y 11 dígitos/i)).toBeInTheDocument();
    expect(mockGuardarCandidato).not.toHaveBeenCalled();
  });

  it("debe detectar y alertar si el RUT ya pertenece a otro candidato", () => {
    render(<CandidatoDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Llenar datos con el RUT repetido
    const inputRut = screen.getByPlaceholderText(/12\.345\.678-9/i);
    fireEvent.change(inputRut, { target: { value: "11.111.111-1" } });

    const botonRegistrar = screen.getByRole("button", { name: /^registrar$/i });
    fireEvent.click(botonRegistrar);

    expect(screen.getByText("Ya existe un candidato con este RUT.")).toBeInTheDocument();
    expect(mockGuardarCandidato).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SolicitudDialog } from "../solicitud-dialog";
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

describe("solicitud-dialog.jsx - Diálogo de Solicitud de Evaluación", () => {
  const mockCrearSolicitud = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useDatos.mockReturnValue({
      crearSolicitud: mockCrearSolicitud,
      candidatos: [
        { id: "c1", nombre: "Valentina Soto", cargo: "Analista Contable", familia: "Finanzas y Administración" },
      ],
      psicologos: ["Ps. Camila Rojas", "Ps. Andrés Miranda"],
    });
  });

  it("no se renderiza en pantalla cuando open es false", () => {
    render(<SolicitudDialog open={false} onOpenChange={mockOnOpenChange} />);
    expect(screen.queryByText("Nueva solicitud de evaluación")).not.toBeInTheDocument();
  });

  it("muestra error si se intenta enviar sin seleccionar un candidato", () => {
    render(<SolicitudDialog open={true} onOpenChange={mockOnOpenChange} />);

    const botonCrear = screen.getByRole("button", { name: /crear solicitud/i });
    fireEvent.click(botonCrear);

    expect(screen.getByText("Seleccione un candidato.")).toBeInTheDocument();
    expect(mockCrearSolicitud).not.toHaveBeenCalled();
  });

  it("permite cancelar y cerrar el modal", () => {
    render(<SolicitudDialog open={true} onOpenChange={mockOnOpenChange} />);

    const botonCancelar = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(botonCancelar);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});


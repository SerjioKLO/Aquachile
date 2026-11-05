import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../LoginPage";
import { useAuth } from "@/context/auth-context";

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginPage.jsx - Pantalla de Inicio de Sesión", () => {
  const mockIngresar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      ingresar: mockIngresar,
      rol: null,
    });
  });

  it("debe renderizar el formulario y los botones de cuentas sugeridas", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("AquaChile")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar al sistema/i })).toBeInTheDocument();
    expect(screen.getByText("analista@aquachile.cl")).toBeInTheDocument();
    expect(screen.getByText("evaluador@aquachile.cl")).toBeInTheDocument();
    expect(screen.getByText("admin@aquachile.cl")).toBeInTheDocument();
  });

  it("al hacer click en una cuenta sugerida debe rellenar el input de correo", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const botonSugerido = screen.getByText("analista@aquachile.cl");
    fireEvent.click(botonSugerido);

    const input = screen.getByPlaceholderText(/analista@aquachile\.cl/i);
    expect(input.value).toBe("analista@aquachile.cl");
  });

  it("debe mostrar mensaje de error si el correo no está registrado", async () => {
    mockIngresar.mockResolvedValueOnce({
      ok: false,
      error: "El correo no se encuentra registrado en la base de datos.",
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/analista@aquachile\.cl/i);
    fireEvent.change(input, { target: { value: "desconocido@aquachile.cl" } });

    const botonSubmit = screen.getByRole("button", { name: /ingresar al sistema/i });
    fireEvent.click(botonSubmit);

    await waitFor(() => {
      expect(
        screen.getByText("El correo no se encuentra registrado en la base de datos.")
      ).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("debe navegar a /panel cuando el login es exitoso", async () => {
    mockIngresar.mockResolvedValueOnce({
      ok: true,
      usuario: { nombre: "Ps. Camila Rojas", rol: "analista" },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/analista@aquachile\.cl/i);
    fireEvent.change(input, { target: { value: "analista@aquachile.cl" } });

    const botonSubmit = screen.getByRole("button", { name: /ingresar al sistema/i });
    fireEvent.click(botonSubmit);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/panel", { replace: true });
    });
  });
});

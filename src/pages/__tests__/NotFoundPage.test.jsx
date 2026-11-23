import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { NotFoundPage } from "../NotFoundPage";
import { useAuth } from "@/context/auth-context";

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}));

describe("NotFoundPage.jsx - Página de Error 404", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza la página 404 personalizada cuando se navega a /ruta-inexistente-test", () => {
    useAuth.mockReturnValue({ rol: null });

    render(
      <MemoryRouter initialEntries={["/ruta-inexistente-test"]}>
        <Routes>
          <Route path="/" element={<div>Inicio</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByText("Página no encontrada")).toBeInTheDocument();
    expect(
      screen.getByText(/el enlace al que intentas acceder no existe/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /volver a la página de inicio/i })
    ).toBeInTheDocument();
  });

  it("renderiza la página 404 en subrutas inexistentes de varios niveles (ej. /ruta/falsa/123)", () => {
    useAuth.mockReturnValue({ rol: null });

    render(
      <MemoryRouter initialEntries={["/ruta/falsa/123"]}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByText("Página no encontrada")).toBeInTheDocument();
    const img = screen.getByAltText("Página no encontrada");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/404_icon.svg");
  });

  it("muestra botón 'Ir al Dashboard' cuando el usuario está autenticado", () => {
    useAuth.mockReturnValue({ rol: "analista" });

    render(
      <MemoryRouter initialEntries={["/seccion-invalida"]}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ir al dashboard/i })).toBeInTheDocument();
    expect(screen.queryByText(/volver a la página de inicio/i)).not.toBeInTheDocument();
  });
});

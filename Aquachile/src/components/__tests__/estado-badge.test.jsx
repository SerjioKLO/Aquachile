import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EstadoBadge, DictamenBadge } from "../estado-badge";

describe("estado-badge.jsx - Badges de Estado y Dictamen", () => {
  describe("EstadoBadge", () => {
    it("debe renderizar el estado 'Pendiente' con estilo ámbar", () => {
      render(<EstadoBadge estado="Pendiente" />);
      const badge = screen.getByText("Pendiente");
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass("bg-amber-50");
    });

    it("debe renderizar 'En proceso' con estilo sky", () => {
      render(<EstadoBadge estado="En proceso" />);
      const badge = screen.getByText("En proceso");
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass("bg-sky-50");
    });

    it("debe renderizar 'Finalizada' con estilo emerald", () => {
      render(<EstadoBadge estado="Finalizada" />);
      const badge = screen.getByText("Finalizada");
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass("bg-emerald-50");
    });
  });

  describe("DictamenBadge", () => {
    it("debe renderizar 'Pendiente' cuando no hay dictamen emitido", () => {
      render(<DictamenBadge dictamen="" />);
      expect(screen.getByText("Pendiente")).toBeInTheDocument();
    });

    it("debe renderizar 'Recomendado' con estilo emerald", () => {
      render(<DictamenBadge dictamen="Recomendado" />);
      const badge = screen.getByText("Recomendado");
      expect(badge).toHaveClass("bg-emerald-50");
      expect(badge).toHaveClass("text-emerald-800");
    });

    it("debe renderizar 'No recomendado' con estilo rose", () => {
      render(<DictamenBadge dictamen="No recomendado" />);
      const badge = screen.getByText("No recomendado");
      expect(badge).toHaveClass("bg-rose-50");
      expect(badge).toHaveClass("text-rose-800");
    });
  });
});


import { describe, it, expect } from "vitest";
import {
  PAISES,
  validarTelefonoCompleto,
  PhoneInput,
} from "../phone-input";
import { render, screen, fireEvent } from "@testing-library/react";

describe("phone-input.jsx - Validación y Componente de Teléfono", () => {
  describe("PAISES", () => {
    it("debe contener a Chile como primer país por defecto con código +56", () => {
      expect(PAISES[0].iso).toBe("CL");
      expect(PAISES[0].codigo).toBe("+56");
      expect(PAISES[0].maxDigits).toBe(9);
    });

    it("debe contener países de la región y España", () => {
      const isos = PAISES.map((p) => p.iso);
      expect(isos).toContain("AR");
      expect(isos).toContain("PE");
      expect(isos).toContain("ES");
    });
  });

  describe("validarTelefonoCompleto", () => {
    it("debe retornar error si el teléfono está vacío", () => {
      expect(validarTelefonoCompleto("")).toBe("Debe ingresar un número telefónico de contacto.");
      expect(validarTelefonoCompleto("   ")).toBe("Debe ingresar un número telefónico de contacto.");
    });

    it("debe validar correctamente un número móvil chileno de 9 dígitos (+56 9 XXXX XXXX)", () => {
      expect(validarTelefonoCompleto("+56 9 1234 5678")).toBeNull();
      expect(validarTelefonoCompleto("+56 9 8765 4321")).toBeNull();
    });

    it("debe rechazar números chilenos con cantidad de dígitos incorrecta", () => {
      // 8 dígitos en vez de 9
      const error = validarTelefonoCompleto("+56 9 1234 567");
      expect(error).toContain("debe tener exactamente 9 dígitos");
    });

    it("debe validar números internacionales dentro del rango de 10 a 15 dígitos", () => {
      // Argentina +54 9 11 1234 5678 (54 + 11 = 13 dígitos)
      expect(validarTelefonoCompleto("+54 9 11 1234 5678")).toBeNull();
    });
  });

  describe("Renderizado de PhoneInput", () => {
    it("debe renderizar el input con el placeholder correspondiente a Chile", () => {
      render(<PhoneInput value="" onChange={() => {}} />);
      const input = screen.getByPlaceholderText("9 1234 5678");
      expect(input).toBeInTheDocument();
    });

    it("debe permitir ingresar texto y formatear con prefijo +56", () => {
      let valorEmitido = "";
      render(<PhoneInput value="" onChange={(val) => { valorEmitido = val; }} />);
      const input = screen.getByPlaceholderText("9 1234 5678");

      fireEvent.change(input, { target: { value: "912345678" } });
      expect(valorEmitido).toBe("+56 9 1234 5678");
    });
  });
});

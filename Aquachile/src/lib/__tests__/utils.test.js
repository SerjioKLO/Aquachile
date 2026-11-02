import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("utils.js - cn() helper", () => {
  it("debe concatenar clases simples", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("debe resolver colisiones de Tailwind preservando la última clase", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("debe filtrar valores falsy, null, undefined y booleanos", () => {
    expect(cn("btn", false && "btn-active", null, undefined, "btn-primary")).toBe(
      "btn btn-primary"
    );
  });

  it("debe soportar arrays y objetos de clases condicionales", () => {
    expect(cn(["flex", "items-center"], { "opacity-50": false, "rounded-md": true })).toBe(
      "flex items-center rounded-md"
    );
  });
});


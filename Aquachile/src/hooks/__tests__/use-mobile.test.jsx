import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

describe("use-mobile.jsx - Hook useIsMobile", () => {
  let listeners = [];

  beforeEach(() => {
    listeners = [];
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, cb) => {
        if (event === "change") listeners.push(cb);
      }),
      removeEventListener: vi.fn((event, cb) => {
        if (event === "change") {
          listeners = listeners.filter((l) => l !== cb);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  it("debe retornar false en viewport de escritorio (>= 768px)", () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("debe retornar true en viewport móvil (< 768px)", () => {
    window.innerWidth = 480;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("debe actualizarse cuando la media query emite un evento de cambio", () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simular resize a móvil
    act(() => {
      window.innerWidth = 500;
      listeners.forEach((cb) => cb());
    });

    expect(result.current).toBe(true);
  });
});


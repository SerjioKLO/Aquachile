import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toFrontendCandidato, toFrontendSolicitud, api } from "../api";

describe("api.js - Mappers DTO y Cliente API", () => {
  describe("toFrontendCandidato", () => {
    it("debe transformar un DTO del backend a la estructura esperada por el frontend", () => {
      const dto = {
        id: 45,
        rut: "12.345.678-9",
        nombre: "María González",
        correo: "maria@aquachile.cl",
        telefono: "+56 9 1234 5678",
        cargoNombre: "Jefe de Sucursal",
        familiaNombre: "Ventas / Comercial",
        activo: true,
        creadoEn: "2026-11-01T15:00:00",
      };

      const res = toFrontendCandidato(dto);
      expect(res.id).toBe("c45");
      expect(res.rut).toBe("12.345.678-9");
      expect(res.nombre).toBe("María González");
      expect(res.cargo).toBe("Jefe de Sucursal");
      expect(res.familia).toBe("Ventas / Comercial");
      expect(res.activo).toBe(true);
      expect(res.creado).toBe("2026-11-01");
    });

    it("debe asignar valores predeterminados seguros cuando faltan propiedades", () => {
      const dtoIncompleto = {
        rut: "11.111.111-1",
        nombre: "Test",
      };

      const res = toFrontendCandidato(dtoIncompleto);
      expect(res.id).toMatch(/^c\d+/);
      expect(res.cargo).toBe("Sin cargo");
      expect(res.familia).toBe("Operaciones / Producción");
      expect(res.activo).toBe(true);
      expect(res.creado).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("toFrontendSolicitud", () => {
    it("debe deserializar las respuestas de entrevista desde JSON string", () => {
      const dto = {
        id: 12,
        codigo: "SOL-012",
        candidatoId: 45,
        cargoNombre: "Supervisor de Planta",
        familiaNombre: "Operaciones / Producción",
        responsableNombre: "Ps. Andrés Miranda",
        prioridad: "Alta",
        fechaSolicitud: "2026-10-30",
        estado: "En proceso",
        actualizada: "2026-10-31T10:00:00",
        evaluacion: {
          fechaEntrevista: "2026-10-31",
          conclusiones: "Buen perfil técnico",
          dictamen: "Recomendado",
          preguntasRespondidas: JSON.stringify({
            preguntasUsadas: { "¿Cómo reacciona ante fallas?": true },
            notasPregunta: { "¿Cómo reacciona ante fallas?": "Respuesta adecuada" },
          }),
        },
      };

      const res = toFrontendSolicitud(dto);
      expect(res.id).toBe("s12");
      expect(res.candidatoId).toBe("c45");
      expect(res.psicologo).toBe("Ps. Andrés Miranda");
      expect(res.prioridad).toBe("Alta");
      expect(res.evaluacion.dictamen).toBe("Recomendado");
      expect(res.evaluacion.preguntasUsadas["¿Cómo reacciona ante fallas?"]).toBe(true);
    });

    it("debe ser tolerante a fallos si preguntasRespondidas no es un JSON válido", () => {
      const dtoConJsonCorrupto = {
        id: 1,
        evaluacion: {
          preguntasRespondidas: "malformed-json-text",
        },
      };

      const res = toFrontendSolicitud(dtoConJsonCorrupto);
      expect(res.evaluacion.preguntasUsadas).toEqual({});
      expect(res.evaluacion.notasPregunta).toEqual({});
    });
  });

  describe("Cliente HTTP api", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("verificarConexion() retorna true si el endpoint de catálogos responde ok", async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });
      const conectado = await api.verificarConexion();
      expect(conectado).toBe(true);
    });

    it("verificarConexion() retorna false si hay error de red o timeout", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network Error"));
      const conectado = await api.verificarConexion();
      expect(conectado).toBe(false);
    });

    it("candidatos.crear() envía POST con el DTO en el body", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 99, nombre: "Nuevo Candidato" }),
      });

      const nuevo = { nombre: "Nuevo Candidato", rut: "12.345.678-9" };
      const creado = await api.candidatos.crear(nuevo);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/candidatos"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(nuevo),
        })
      );
      expect(creado.id).toBe(99);
    });

    it("solicitudes.cambiarEstado() envía PATCH con el nuevo estado", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 5, estado: "Finalizada" }),
      });

      await api.solicitudes.cambiarEstado("s5", "Finalizada");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/solicitudes/5/estado"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ estado: "Finalizada" }),
        })
      );
    });
  });
});


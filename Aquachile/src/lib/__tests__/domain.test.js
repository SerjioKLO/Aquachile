import { describe, it, expect } from "vitest";
import {
  formatearFecha,
  evaluacionVacia,
  PERMISOS_POR_ROL,
  ROLES,
  USUARIOS,
  FAMILIAS,
  PREGUNTAS_POR_FAMILIA,
  ESTADOS,
  DICTAMENES,
  CARGOS_INICIALES,
} from "../domain";

describe("domain.js - Modelo de Dominio y Constantes", () => {
  describe("formatearFecha", () => {
    it("debe formatear fechas ISO (YYYY-MM-DD) al formato chileno DD-MM-YYYY", () => {
      expect(formatearFecha("2026-11-02")).toBe("02-11-2026");
      expect(formatearFecha("2025-01-15")).toBe("15-01-2025");
    });

    it("debe manejar fechas ISO con timestamp completo", () => {
      expect(formatearFecha("2026-05-20T14:35:00.000Z")).toBe("20-05-2026");
    });

    it("debe retornar '—' ante valores vacíos, nulos o no definidos", () => {
      expect(formatearFecha("")).toBe("—");
      expect(formatearFecha(null)).toBe("—");
      expect(formatearFecha(undefined)).toBe("—");
    });
  });

  describe("evaluacionVacia", () => {
    it("debe retornar el esquema inicial con los campos en blanco y mapas vacíos", () => {
      const inicial = evaluacionVacia();
      expect(inicial).toEqual({
        fechaEntrevista: "",
        conclusiones: "",
        dictamen: "",
        preguntasUsadas: {},
        notasPregunta: {},
      });
    });
  });

  describe("Matriz de Permisos RBAC y Roles", () => {
    it("todos los roles definidos deben existir en PERMISOS_POR_ROL", () => {
      ROLES.forEach((rol) => {
        expect(PERMISOS_POR_ROL[rol.id]).toBeDefined();
        expect(Array.isArray(PERMISOS_POR_ROL[rol.id])).toBe(true);
      });
    });

    it("el rol 'admin' debe contar con todos los permisos clave", () => {
      const permisosAdmin = PERMISOS_POR_ROL.admin;
      expect(permisosAdmin).toContain("ver_panel");
      expect(permisosAdmin).toContain("ver_candidatos");
      expect(permisosAdmin).toContain("editar_candidatos");
      expect(permisosAdmin).toContain("ver_solicitudes");
      expect(permisosAdmin).toContain("crear_solicitudes");
      expect(permisosAdmin).toContain("evaluar");
      expect(permisosAdmin).toContain("administrar");
    });

    it("el rol 'evaluador' debe tener permiso para evaluar pero no administrar ni editar candidatos", () => {
      const permisosEval = PERMISOS_POR_ROL.evaluador;
      expect(permisosEval).toContain("evaluar");
      expect(permisosEval).not.toContain("administrar");
      expect(permisosEval).not.toContain("editar_candidatos");
    });

    it("el rol 'jefatura' debe ser solo de visualización", () => {
      const permisosJefatura = PERMISOS_POR_ROL.jefatura;
      expect(permisosJefatura).toContain("ver_panel");
      expect(permisosJefatura).not.toContain("evaluar");
      expect(permisosJefatura).not.toContain("administrar");
      expect(permisosJefatura).not.toContain("crear_solicitudes");
    });

    it("todos los usuarios predefinidos deben tener un rol válido", () => {
      USUARIOS.forEach((u) => {
        expect(PERMISOS_POR_ROL[u.rol]).toBeDefined();
      });
    });
  });

  describe("Catálogo de Familias, Cargos y Preguntas Psicométricas", () => {
    it("todas las familias deben tener su banco de preguntas asociado", () => {
      FAMILIAS.forEach((fam) => {
        expect(PREGUNTAS_POR_FAMILIA[fam]).toBeDefined();
        expect(PREGUNTAS_POR_FAMILIA[fam].length).toBeGreaterThan(0);
      });
    });

    it("los estados y dictámenes deben tener los valores esperados", () => {
      expect(ESTADOS).toEqual(["Pendiente", "En proceso", "Finalizada"]);
      expect(DICTAMENES).toEqual(["Recomendado", "Con observaciones", "No recomendado"]);
    });

    it("los cargos iniciales deben pertenecer a familias existentes", () => {
      CARGOS_INICIALES.forEach((cargo) => {
        expect(FAMILIAS).toContain(cargo.familia);
        expect(cargo.id).toBeDefined();
        expect(cargo.nombre).toBeDefined();
      });
    });
  });
});


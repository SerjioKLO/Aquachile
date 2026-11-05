const API_BASE = import.meta.env["VITE_API_URL"] || "http://localhost:8080/api";
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8e3);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers || {}
      }
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Error HTTP ${res.status}: ${errorText || res.statusText}`);
    }
    if (res.status === 204) {
      return null;
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
export function toFrontendCandidato(dto) {
  return {
    id: dto.id ? `c${dto.id}` : `c${Date.now()}`,
    rut: dto.rut,
    nombre: dto.nombre,
    correo: dto.correo,
    telefono: dto.telefono,
    cargo: dto.cargoNombre || "Sin cargo",
    familia: dto.familiaNombre || "Operaciones / Producci\xF3n",
    activo: dto.activo ?? true,
    creado: dto.creadoEn ? dto.creadoEn.slice(0, 10) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
  };
}
export function toFrontendSolicitud(dto) {
  let preguntasUsadas = {};
  let notasPregunta = {};
  if (dto.evaluacion?.preguntasRespondidas) {
    try {
      const parsed = JSON.parse(dto.evaluacion.preguntasRespondidas);
      preguntasUsadas = parsed.preguntasUsadas || {};
      notasPregunta = parsed.notasPregunta || {};
    } catch {
    }
  }
  const evaluacion = {
    fechaEntrevista: dto.evaluacion?.fechaEntrevista || "",
    conclusiones: dto.evaluacion?.conclusiones || "",
    dictamen: dto.evaluacion?.dictamen || "",
    preguntasUsadas,
    notasPregunta
  };
  return {
    id: dto.id ? `s${dto.id}` : `s${Date.now()}`,
    codigo: dto.codigo || "SOL-000",
    candidatoId: dto.candidatoId ? `c${dto.candidatoId}` : "",
    cargo: dto.cargoNombre || "",
    familia: dto.familiaNombre || "Operaciones / Producci\xF3n",
    psicologo: dto.responsableNombre || "Ps. Camila Rojas",
    prioridad: dto.prioridad || "Media",
    fechaSolicitud: dto.fechaSolicitud || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    estado: dto.estado || "Pendiente",
    actualizada: dto.actualizada ? dto.actualizada.slice(0, 10) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    evaluacion
  };
}
export const api = {
  // Comprobación de salud / disponibilidad del backend
  async verificarConexion() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2e3);
      const res = await fetch(`${API_BASE}/catalogos`, {
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },
  // Autenticación
  auth: {
    async login(username, password) {
      return request(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ username, password })
        }
      );
    }
  },
  // Candidatos
  candidatos: {
    async listar(params) {
      const q = new URLSearchParams();
      if (params?.busqueda) q.set("busqueda", params.busqueda);
      if (params?.familiaId) q.set("familiaId", String(params.familiaId));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return request(`/candidatos${qs}`);
    },
    async obtener(id) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request(`/candidatos/${numericId}`);
    },
    async crear(dto) {
      return request("/candidatos", {
        method: "POST",
        body: JSON.stringify(dto)
      });
    },
    async actualizar(id, dto) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request(`/candidatos/${numericId}`, {
        method: "PUT",
        body: JSON.stringify(dto)
      });
    },
    async eliminar(id) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request(`/candidatos/${numericId}`, {
        method: "DELETE"
      });
    }
  },
  // Solicitudes
  solicitudes: {
    async listar(params) {
      const q = new URLSearchParams();
      if (params?.estado && params.estado !== "todos") q.set("estado", params.estado);
      if (params?.familiaId) q.set("familiaId", String(params.familiaId));
      if (params?.desde) q.set("desde", params.desde);
      if (params?.hasta) q.set("hasta", params.hasta);
      if (params?.candidato) q.set("candidato", params.candidato);
      if (params?.cargo) q.set("cargo", params.cargo);
      const qs = q.toString() ? `?${q.toString()}` : "";
      return request(`/solicitudes${qs}`);
    },
    async obtener(id) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request(`/solicitudes/${numericId}`);
    },
    async crear(dto) {
      return request("/solicitudes", {
        method: "POST",
        body: JSON.stringify(dto)
      });
    },
    async cambiarEstado(id, estado) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request(`/solicitudes/${numericId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado })
      });
    },
    async guardarEvaluacion(id, evaluacion) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      const payload = {
        fechaEntrevista: evaluacion.fechaEntrevista,
        conclusiones: evaluacion.conclusiones,
        dictamen: evaluacion.dictamen,
        preguntasRespondidas: JSON.stringify({
          preguntasUsadas: evaluacion.preguntasUsadas,
          notasPregunta: evaluacion.notasPregunta
        })
      };
      return request(`/solicitudes/${numericId}/evaluacion`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    }
  },
  // Dashboard
  dashboard: {
    async obtenerStats() {
      return request("/dashboard/stats");
    }
  },
  // Catálogos
  catalogos: {
    async obtener() {
      return request("/catalogos");
    }
  }
};

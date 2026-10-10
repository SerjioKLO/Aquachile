import type {
  Candidato,
  Solicitud,
  Evaluacion,
  EstadoSolicitud,
  FamiliaCargo,
  Prioridad,
  Dictamen,
} from "@/lib/domain";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080/api";

// DTO interfaces matching backend Spring Boot
export interface BackendCandidatoDTO {
  id?: number;
  cargoId?: number;
  cargoNombre?: string;
  familiaNombre?: string;
  rut: string;
  nombre: string;
  correo: string;
  telefono: string;
  activo?: boolean;
  creadoEn?: string;
}

export interface BackendEvaluacionDTO {
  id?: number;
  fechaEntrevista?: string;
  conclusiones?: string;
  dictamen?: string;
  preguntasRespondidas?: string; // JSON string
}

export interface BackendSolicitudDTO {
  id?: number;
  codigo?: string;
  candidatoId?: number;
  candidatoNombre?: string;
  candidatoRut?: string;
  cargoId?: number;
  cargoNombre?: string;
  familiaNombre?: string;
  responsableId?: number;
  responsableNombre?: string;
  prioridad?: string;
  estado?: string;
  fechaSolicitud?: string;
  actualizada?: string;
  evaluacion?: BackendEvaluacionDTO;
}

export interface BackendSolicitudCreateDTO {
  candidatoId: number;
  cargoId?: number;
  cargoNombre?: string;
  responsableId?: number;
  psicologoNombre?: string;
  prioridad?: string;
  fechaSolicitud?: string;
}

export interface BackendDashboardKpiDTO {
  totalCandidatos: number;
  pendientes: number;
  enProceso: number;
  finalizadas: number;
  recientes: BackendSolicitudDTO[];
}

export interface BackendCatalogoDTO {
  familias: Array<{ id: number; nombre: string; descripcion: string }>;
  cargos: Array<{
    id: number;
    familiaId: number;
    familiaNombre: string;
    nombre: string;
    descripcion: string;
  }>;
  evaluadores: Array<{ id: number; nombreCompleto: string; username: string }>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Error HTTP ${res.status}: ${errorText || res.statusText}`);
    }

    if (res.status === 204) {
      return null as T;
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Convert backend DTOs to frontend domain objects
export function toFrontendCandidato(dto: BackendCandidatoDTO): Candidato {
  return {
    id: dto.id ? `c${dto.id}` : `c${Date.now()}`,
    rut: dto.rut,
    nombre: dto.nombre,
    correo: dto.correo,
    telefono: dto.telefono,
    cargo: dto.cargoNombre || "Sin cargo",
    familia: (dto.familiaNombre as FamiliaCargo) || "Operaciones / Producción",
    activo: dto.activo ?? true,
    creado: dto.creadoEn ? dto.creadoEn.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export function toFrontendSolicitud(dto: BackendSolicitudDTO): Solicitud {
  let preguntasUsadas: Record<string, boolean> = {};
  let notasPregunta: Record<string, string> = {};

  if (dto.evaluacion?.preguntasRespondidas) {
    try {
      const parsed = JSON.parse(dto.evaluacion.preguntasRespondidas);
      preguntasUsadas = parsed.preguntasUsadas || {};
      notasPregunta = parsed.notasPregunta || {};
    } catch {
      // Ignorar error al parsear JSON
    }
  }

  const evaluacion: Evaluacion = {
    fechaEntrevista: dto.evaluacion?.fechaEntrevista || "",
    conclusiones: dto.evaluacion?.conclusiones || "",
    dictamen: (dto.evaluacion?.dictamen as Dictamen) || "",
    preguntasUsadas,
    notasPregunta,
  };

  return {
    id: dto.id ? `s${dto.id}` : `s${Date.now()}`,
    codigo: dto.codigo || "SOL-000",
    candidatoId: dto.candidatoId ? `c${dto.candidatoId}` : "",
    cargo: dto.cargoNombre || "",
    familia: (dto.familiaNombre as FamiliaCargo) || "Operaciones / Producción",
    psicologo: dto.responsableNombre || "Ps. Camila Rojas",
    prioridad: (dto.prioridad as Prioridad) || "Media",
    fechaSolicitud: dto.fechaSolicitud || new Date().toISOString().slice(0, 10),
    estado: (dto.estado as EstadoSolicitud) || "Pendiente",
    actualizada: dto.actualizada
      ? dto.actualizada.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    evaluacion,
  };
}

export const api = {
  // Comprobación de salud / disponibilidad del backend
  async verificarConexion(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/catalogos`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Autenticación
  auth: {
    async login(username: string, password: string) {
      return request<{ id: number; rol: string; username: string; nombreCompleto: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ username, password }),
        },
      );
    },
  },

  // Candidatos
  candidatos: {
    async listar(params?: { busqueda?: string; familiaId?: number }) {
      const q = new URLSearchParams();
      if (params?.busqueda) q.set("busqueda", params.busqueda);
      if (params?.familiaId) q.set("familiaId", String(params.familiaId));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return request<BackendCandidatoDTO[]>(`/candidatos${qs}`);
    },

    async obtener(id: number | string) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request<BackendCandidatoDTO>(`/candidatos/${numericId}`);
    },

    async crear(dto: BackendCandidatoDTO) {
      return request<BackendCandidatoDTO>("/candidatos", {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },

    async actualizar(id: number | string, dto: BackendCandidatoDTO) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request<BackendCandidatoDTO>(`/candidatos/${numericId}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      });
    },

    async eliminar(id: number | string) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request<void>(`/candidatos/${numericId}`, {
        method: "DELETE",
      });
    },
  },

  // Solicitudes
  solicitudes: {
    async listar(params?: {
      estado?: string;
      familiaId?: number;
      desde?: string;
      hasta?: string;
      candidato?: string;
      cargo?: string;
    }) {
      const q = new URLSearchParams();
      if (params?.estado && params.estado !== "todos") q.set("estado", params.estado);
      if (params?.familiaId) q.set("familiaId", String(params.familiaId));
      if (params?.desde) q.set("desde", params.desde);
      if (params?.hasta) q.set("hasta", params.hasta);
      if (params?.candidato) q.set("candidato", params.candidato);
      if (params?.cargo) q.set("cargo", params.cargo);
      const qs = q.toString() ? `?${q.toString()}` : "";
      return request<BackendSolicitudDTO[]>(`/solicitudes${qs}`);
    },

    async obtener(id: number | string) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request<BackendSolicitudDTO>(`/solicitudes/${numericId}`);
    },

    async crear(dto: BackendSolicitudCreateDTO) {
      return request<BackendSolicitudDTO>("/solicitudes", {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },

    async cambiarEstado(id: number | string, estado: EstadoSolicitud) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      return request<BackendSolicitudDTO>(`/solicitudes/${numericId}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
    },

    async guardarEvaluacion(id: number | string, evaluacion: Evaluacion) {
      const numericId = typeof id === "string" ? id.replace(/\D/g, "") : id;
      const payload: BackendEvaluacionDTO = {
        fechaEntrevista: evaluacion.fechaEntrevista,
        conclusiones: evaluacion.conclusiones,
        dictamen: evaluacion.dictamen,
        preguntasRespondidas: JSON.stringify({
          preguntasUsadas: evaluacion.preguntasUsadas,
          notasPregunta: evaluacion.notasPregunta,
        }),
      };
      return request<BackendEvaluacionDTO>(`/solicitudes/${numericId}/evaluacion`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  },

  // Dashboard
  dashboard: {
    async obtenerStats() {
      return request<BackendDashboardKpiDTO>("/dashboard/stats");
    },
  },

  // Catálogos
  catalogos: {
    async obtener() {
      return request<BackendCatalogoDTO>("/catalogos");
    },
  },
};

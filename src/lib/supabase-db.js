import { supabase } from "@/lib/supabase";
import { CARGOS_POR_FAMILIA, FAMILIAS as FAMILIAS_FALLBACK } from "@/data/cargos";

/**
 * Carga el catálogo completo de familias y cargos desde Supabase.
 * En caso de fallo de red o BD vacía, entrega el catálogo local de fallback.
 */
export async function cargarCatalogoSupabase() {
  try {
    const [familiasRes, cargosRes] = await Promise.all([
      supabase.from("familia_cargo").select("id, nombre").order("nombre"),
      supabase
        .from("cargo")
        .select(`
          id,
          nombre,
          familia_id,
          activo,
          familia_cargo:familia_id ( id, nombre )
        `)
        .order("nombre")
    ]);

    if (familiasRes.error) throw familiasRes.error;
    if (cargosRes.error) throw cargosRes.error;

    const familiasData = familiasRes.data || [];
    const cargosData = cargosRes.data || [];

    if (familiasData.length === 0) {
      return {
        conectado: true,
        familias: FAMILIAS_FALLBACK,
        familiasRaw: [],
        cargos: [],
        cargosPorFamilia: CARGOS_POR_FAMILIA
      };
    }

    const familias = familiasData.map((f) => f.nombre);
    const cargosPorFamilia = {};
    familias.forEach((fam) => {
      cargosPorFamilia[fam] = [];
    });

    const cargosMapeados = cargosData.map((c) => {
      const famNombre = c.familia_cargo?.nombre || "";
      if (famNombre && cargosPorFamilia[famNombre]) {
        if (c.activo) {
          cargosPorFamilia[famNombre].push(c.nombre);
        }
      }
      return {
        id: `cg${c.id}`,
        numericId: c.id,
        nombre: c.nombre,
        familia: famNombre,
        familia_id: c.familia_id,
        activo: c.activo
      };
    });

    return {
      conectado: true,
      familias,
      familiasRaw: familiasData,
      cargos: cargosMapeados,
      cargosPorFamilia
    };
  } catch (error) {
    console.warn("No se pudo cargar catálogo desde Supabase, usando fallback:", error);
    return {
      conectado: false,
      familias: FAMILIAS_FALLBACK,
      familiasRaw: [],
      cargos: [],
      cargosPorFamilia: CARGOS_POR_FAMILIA
    };
  }
}

/**
 * Resuelve las llaves foráneas y el check constraint para insertar o actualizar
 * un registro en la tabla public.candidato.
 *
 * Cumple con el constraint:
 * check_candidato_cargo: (cargo_id IS NOT NULL AND cargo_personalizado IS NULL) OR
 *                        (cargo_id IS NULL AND cargo_personalizado IS NOT NULL)
 */
export async function resolverCargoParaCandidato(familiaNombre, cargoTexto) {
  if (!familiaNombre || !cargoTexto) {
    throw new Error("Debe indicar la familia y el cargo.");
  }

  // 1. Obtener familia_id
  const { data: fam, error: famErr } = await supabase
    .from("familia_cargo")
    .select("id, nombre")
    .ilike("nombre", familiaNombre.trim())
    .maybeSingle();

  if (famErr) throw famErr;
  if (!fam?.id) {
    throw new Error(`La familia de cargo "${familiaNombre}" no existe en la base de datos.`);
  }

  // 2. Buscar si el cargo existe en el catálogo para esa familia
  const { data: cg, error: cgErr } = await supabase
    .from("cargo")
    .select("id, nombre")
    .eq("familia_id", fam.id)
    .ilike("nombre", cargoTexto.trim())
    .maybeSingle();

  if (cgErr) throw cgErr;

  if (cg?.id) {
    // Es un cargo de catálogo predefinido
    return {
      familia_id: fam.id,
      cargo_id: cg.id,
      cargo_personalizado: null
    };
  } else {
    // Es un cargo personalizado escrito libremente
    return {
      familia_id: fam.id,
      cargo_id: null,
      cargo_personalizado: cargoTexto.trim()
    };
  }
}

/**
 * Carga usuarios evaluadores (psicólogos) desde la tabla public.usuario y public.rol
 */
export async function cargarEvaluadoresSupabase() {
  try {
    const { data, error } = await supabase
      .from("usuario")
      .select(`
        id,
        nombre_completo,
        correo,
        rol:rol_id ( id, nombre )
      `)
      .order("nombre_completo");

    if (error) throw error;
    const evaluadores = (data || []).filter(
      (u) => (u.rol?.nombre || "").toLowerCase() === "evaluador"
    );

    return evaluadores.map((e) => ({
      id: e.id,
      nombre: e.nombre_completo,
      correo: e.correo
    }));
  } catch (err) {
    console.warn("No se pudo cargar evaluadores desde Supabase:", err);
    return [];
  }
}

/**
 * Sube un archivo de currículum al bucket 'curriculums' en Supabase Storage.
 * Ruta: ${rutLimpio}/${Date.now()}_cv.${extension}
 * Sanea el RUT quitando puntos, guiones y espacios.
 *
 * @param {File} file - Objeto File a subir
 * @param {string} rutCandidato - RUT del candidato
 * @returns {Promise<{ path: string, nombreOriginal: string }>}
 */
export async function subirCurriculum(file, rutCandidato) {
  if (!file) {
    throw new Error("Debe proporcionar un archivo de currículum.");
  }
  const rutLimpio = String(rutCandidato || "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (!rutLimpio) {
    throw new Error("Debe proporcionar un RUT válido para asociar el currículum.");
  }

  const extension = file.name ? file.name.split(".").pop()?.toLowerCase() : "pdf";
  const path = `${rutLimpio}/${Date.now()}_cv.${extension}`;

  const { data, error } = await supabase.storage
    .from("curriculums")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw error;
  }

  return {
    path: data?.path || path,
    nombreOriginal: file.name
  };
}

/**
 * Genera una URL firmada temporal con expiración de 600 segundos (10 minutos)
 * para previsualizar o descargar el currículum desde el bucket privado 'curriculums'.
 * La URL firmada siempre se calcula bajo demanda y nunca se almacena permanentemente.
 *
 * @param {string} curriculumPath - Ruta del archivo en el bucket
 * @returns {Promise<string>} URL firmada
 */
export async function obtenerUrlCurriculum(curriculumPath) {
  if (!curriculumPath || typeof curriculumPath !== "string" || !curriculumPath.trim()) {
    throw new Error("Ruta de currículum no especificada.");
  }

  const pathLimpio = curriculumPath.trim();
  const { data, error } = await supabase.storage
    .from("curriculums")
    .createSignedUrl(pathLimpio, 600);

  if (error) {
    throw new Error(error.message || "Error al generar enlace del currículum en Supabase Storage.");
  }

  if (!data?.signedUrl) {
    throw new Error("Supabase Storage no retornó una URL firmada válida.");
  }

  return data.signedUrl;
}

/**
 * Elimina uno o más archivos de currículum físicos del bucket privado 'curriculums'.
 *
 * @param {string|string[]} paths - Ruta o arreglo de rutas relativas en el bucket
 * @returns {Promise<{ ok: boolean, data?: any, error?: any }>}
 */
export async function eliminarArchivosCurriculum(paths) {
  if (!paths) return { ok: true, data: [] };
  const pathsArr = (Array.isArray(paths) ? paths : [paths])
    .filter((p) => typeof p === "string" && p.trim().length > 0)
    .map((p) => p.trim());

  if (pathsArr.length === 0) return { ok: true, data: [] };

  const { data, error } = await supabase.storage
    .from("curriculums")
    .remove(pathsArr);

  if (error) {
    console.warn("Advertencia al eliminar archivos de Storage:", error);
    return { ok: false, error };
  }

  return { ok: true, data };
}

/**
 * Inserta un registro en la tabla public.solicitud_evaluacion con soporte para
 * curriculum_path y curriculum_nombre.
 *
 * @param {Object} params
 * @returns {Promise<Object>} Registro insertado
 */
export async function crearSolicitudEvaluacion({
  candidato_id,
  evaluador_id = null,
  prioridad = "Media",
  estado = "Pendiente",
  curriculum_path = null,
  curriculum_nombre = null,
  fecha_solicitud
}) {
  if (!candidato_id) {
    throw new Error("candidato_id es requerido para crear una solicitud de evaluación.");
  }

  const payload = {
    candidato_id,
    prioridad: prioridad || "Media",
    estado: estado || "Pendiente",
    curriculum_path: curriculum_path || null,
    curriculum_nombre: curriculum_nombre || null
  };

  if (evaluador_id) {
    payload.evaluador_id = evaluador_id;
  }
  if (fecha_solicitud) {
    payload.fecha_solicitud = fecha_solicitud;
  }

  const { data, error } = await supabase
    .from("solicitud_evaluacion")
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Invoca la Edge Function 'analizar-cv' para realizar el match y pre-análisis de currículum con IA (GroqCloud).
 * Soporta identificador de candidato ({ candidatoId } / 'c10') o de solicitud ({ solicitudId } / 's10').
 *
 * @param {string|number|Object} identificador - ID de candidato o solicitud, u objeto con { candidatoId, solicitudId }
 * @returns {Promise<{ analisis: Object, fecha: string }>}
 */
export async function analizarCurriculumConIA(identificador) {
  if (!identificador) {
    throw new Error("Se requiere el identificador de la solicitud para el análisis con IA.");
  }

  let body = {};
  if (typeof identificador === "object" && identificador !== null) {
    const candId = identificador.candidatoId
      ? typeof identificador.candidatoId === "string"
        ? parseInt(identificador.candidatoId.replace(/\D/g, ""), 10)
        : Number(identificador.candidatoId)
      : null;
    const solId = identificador.solicitudId
      ? typeof identificador.solicitudId === "string"
        ? parseInt(identificador.solicitudId.replace(/\D/g, ""), 10)
        : Number(identificador.solicitudId)
      : null;

    if (candId) body.candidatoId = candId;
    if (solId) body.solicitudId = solId;
  } else if (typeof identificador === "string") {
    const num = parseInt(identificador.replace(/\D/g, ""), 10);
    if (identificador.startsWith("c")) {
      body.candidatoId = num;
    } else {
      body.solicitudId = num;
    }
  } else {
    body.solicitudId = Number(identificador);
  }

  const { data, error } = await supabase.functions.invoke("analizar-cv", {
    body
  });

  if (error) {
    throw new Error(error.message || "Error al invocar la función de análisis de CV con IA.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.analisis) {
    throw new Error("La función de IA no devolvió un análisis válido.");
  }

  return {
    analisis: data.analisis,
    fecha: data.fecha || new Date().toISOString()
  };
}




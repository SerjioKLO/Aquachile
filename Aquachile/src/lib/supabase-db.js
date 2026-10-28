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


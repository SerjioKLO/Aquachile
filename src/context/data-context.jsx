import { supabase } from "@/lib/supabase";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  CANDIDATOS_INICIALES,
  SOLICITUDES_INICIALES,
  CARGOS_INICIALES,
  PSICOLOGOS,
  FAMILIAS as FAMILIAS_INICIALES,
  evaluacionVacia
} from "@/lib/domain";
import {
  cargarCatalogoSupabase,
  resolverCargoParaCandidato,
  cargarEvaluadoresSupabase
} from "@/lib/supabase-db";
import { api, toFrontendCandidato, toFrontendSolicitud } from "@/services/api";
import { toast } from "sonner";

const DataContext = createContext(null);
const STORAGE_CANDIDATOS = "aquachile_candidatos_v4";
const STORAGE_SOLICITUDES = "aquachile_solicitudes_v4";
const STORAGE_CARGOS = "aquachile_cargos_v4";
const STORAGE_PSICOLOGOS = "aquachile_psicologos_v4";
const STORAGE_FAMILIAS = "aquachile_familias_v4";

const hoyISO = () => new Date().toISOString().slice(0, 10);

function leerStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function guardarStorage(key, data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function DataProvider({ children }) {
  const [candidatos, setCandidatos] = useState(
    () => leerStorage(STORAGE_CANDIDATOS, CANDIDATOS_INICIALES)
  );
  const [solicitudes, setSolicitudes] = useState(
    () => leerStorage(STORAGE_SOLICITUDES, SOLICITUDES_INICIALES)
  );
  const [cargos, setCargos] = useState(
    () => leerStorage(STORAGE_CARGOS, CARGOS_INICIALES)
  );
  const [familias, setFamilias] = useState(
    () => leerStorage(STORAGE_FAMILIAS, FAMILIAS_INICIALES)
  );
  const [psicologos, setPsicologos] = useState(
    () => leerStorage(STORAGE_PSICOLOGOS, PSICOLOGOS)
  );
  const [cargando, setCargando] = useState(false);
  const [backendConectado, setBackendConectado] = useState(null);
  const [supabaseConectado, setSupabaseConectado] = useState(false);

  const recargarDesdeBackend = useCallback(async () => {
    setCargando(true);
    try {
      const estaConectado = await api.verificarConexion();
      setBackendConectado(estaConectado);

      if (estaConectado) {
        // Backend Spring Boot disponible
        const [candsDTO, solsDTO, catsDTO] = await Promise.all([
          api.candidatos.listar().catch(() => null),
          api.solicitudes.listar().catch(() => null),
          api.catalogos.obtener().catch(() => null)
        ]);
        if (candsDTO && candsDTO.length > 0) {
          const candsMapeados = candsDTO.map(toFrontendCandidato);
          setCandidatos(candsMapeados);
          guardarStorage(STORAGE_CANDIDATOS, candsMapeados);
        }
        if (solsDTO && solsDTO.length > 0) {
          const solsMapeadas = solsDTO.map(toFrontendSolicitud);
          setSolicitudes(solsMapeadas);
          guardarStorage(STORAGE_SOLICITUDES, solsMapeadas);
        }
        if (catsDTO && catsDTO.cargos?.length > 0) {
          const cargosMapeados = catsDTO.cargos.map((cg) => ({
            id: `cg${cg.id}`,
            nombre: cg.nombre,
            familia: cg.familiaNombre || "Operaciones / Producción",
            descripcion: cg.descripcion || "",
            activo: true
          }));
          setCargos(cargosMapeados);
          guardarStorage(STORAGE_CARGOS, cargosMapeados);
        }
        if (catsDTO && catsDTO.evaluadores?.length > 0) {
          const evals = catsDTO.evaluadores.map((e) => e.nombreCompleto);
          setPsicologos(evals);
          guardarStorage(STORAGE_PSICOLOGOS, evals);
        }
      } else {
        // Modo Supabase Cloud (PostgreSQL normalizado)
        try {
          // 1. Cargar Familias y Cargos desde la BD
          const cat = await cargarCatalogoSupabase();
          if (cat.cargos?.length > 0) {
            setCargos(cat.cargos);
            guardarStorage(STORAGE_CARGOS, cat.cargos);
          }
          if (cat.familias?.length > 0) {
            setFamilias(cat.familias);
            guardarStorage(STORAGE_FAMILIAS, cat.familias);
          }

          // 2. Cargar Evaluadores desde la tabla public.usuario
          const evals = await cargarEvaluadoresSupabase();
          if (evals?.length > 0) {
            const evalsNombres = evals.map((e) => e.nombre);
            setPsicologos(evalsNombres);
            guardarStorage(STORAGE_PSICOLOGOS, evalsNombres);
          }

          // 3. Cargar Candidatos con relaciones a familia_cargo y cargo
          const { data: supaCands, error: supaErr } = await supabase
            .from("candidato")
            .select(`
              id,
              rut,
              nombre_completo,
              correo,
              telefono,
              familia_id,
              cargo_id,
              cargo_personalizado,
              creado_en,
              familia_cargo:familia_id ( id, nombre ),
              cargo:cargo_id ( id, nombre )
            `)
            .order("id", { ascending: false });

          if (!supaErr && supaCands) {
            setSupabaseConectado(true);
            const candsMapeados = supaCands.map((c) => ({
              id: `c${c.id}`,
              numericId: c.id,
              rut: c.rut,
              nombre: c.nombre_completo,
              correo: c.correo,
              telefono: c.telefono,
              cargo: c.cargo?.nombre || c.cargo_personalizado || "Sin cargo",
              cargo_id: c.cargo_id,
              cargo_personalizado: c.cargo_personalizado,
              familia: c.familia_cargo?.nombre || "Sin familia",
              familia_id: c.familia_id,
              activo: true,
              creado: c.creado_en ? c.creado_en.slice(0, 10) : hoyISO()
            }));

            setCandidatos(candsMapeados);
            guardarStorage(STORAGE_CANDIDATOS, candsMapeados);
          } else {
            console.warn("Consulta a tabla candidato en Supabase:", supaErr);
          }

          // 4. Cargar Solicitudes y Resultados de Evaluación
          const { data: supaSols, error: solErr } = await supabase
            .from("solicitud_evaluacion")
            .select(`
              id,
              candidato_id,
              evaluador_id,
              prioridad,
              estado,
              fecha_solicitud,
              candidato:candidato_id (
                id,
                nombre_completo,
                rut,
                cargo:cargo_id ( id, nombre ),
                cargo_personalizado,
                familia_cargo:familia_id ( id, nombre )
              ),
              evaluador:evaluador_id (
                id,
                nombre_completo
              ),
              resultado_evaluacion (
                id,
                fecha_entrevista,
                notas_clinicas,
                dictamen
              )
            `)
            .order("id", { ascending: false });

          if (!solErr && supaSols) {
            const solsMapeadas = supaSols.map((s) => {
              const res = Array.isArray(s.resultado_evaluacion)
                ? s.resultado_evaluacion[0]
                : s.resultado_evaluacion;

              return {
                id: `s${s.id}`,
                numericId: s.id,
                codigo: `SOL-${s.id}`,
                candidatoId: `c${s.candidato_id}`,
                cargo:
                  s.candidato?.cargo?.nombre ||
                  s.candidato?.cargo_personalizado ||
                  "Sin cargo",
                familia: s.candidato?.familia_cargo?.nombre || "Sin familia",
                psicologo: s.evaluador?.nombre_completo || "Sin evaluador",
                psicologoId: s.evaluador_id,
                prioridad: s.prioridad || "Media",
                estado: s.estado || "Pendiente",
                fechaSolicitud: s.fecha_solicitud
                  ? s.fecha_solicitud.slice(0, 10)
                  : hoyISO(),
                actualizada: s.fecha_solicitud
                  ? s.fecha_solicitud.slice(0, 10)
                  : hoyISO(),
                evaluacion: res
                  ? {
                      fechaEntrevista: res.fecha_entrevista || "",
                      conclusiones: res.notas_clinicas || "",
                      dictamen: res.dictamen || "Pendiente",
                      preguntasUsadas: {},
                      notasPregunta: {}
                    }
                  : evaluacionVacia()
              };
            });

            setSolicitudes(solsMapeadas);
            guardarStorage(STORAGE_SOLICITUDES, solsMapeadas);
          }
        } catch (supaEx) {
          console.warn("No se pudo cargar desde Supabase:", supaEx);
          setSupabaseConectado(false);
        }
      }
    } catch {
      setBackendConectado(false);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargarDesdeBackend();
  }, [recargarDesdeBackend]);

  const guardarCandidato = useCallback(
    async (datos) => {
      let nuevoCandidato;

      if (datos.id && !datos.yaEnSupabase) {
        // Actualización de candidato existente
        setCandidatos((prev) => {
          const existe = prev.some((c) => c.id === datos.id);
          const actualizados = existe
            ? prev.map((c) =>
                c.id === datos.id ? { ...c, ...datos, id: c.id } : c
              )
            : [{ ...datos, activo: true, creado: hoyISO() }, ...prev];
          guardarStorage(STORAGE_CANDIDATOS, actualizados);
          return actualizados;
        });

        if (backendConectado) {
          try {
            await api.candidatos.actualizar(datos.id, {
              rut: datos.rut,
              nombre: datos.nombre,
              correo: datos.correo,
              telefono: datos.telefono,
              cargoNombre: datos.cargo,
              familiaNombre: datos.familia
            });
          } catch (err) {
            console.warn("No se pudo sincronizar edición con backend:", err);
          }
        } else {
          try {
            const numericId = Number(String(datos.id).replace(/\D/g, ""));
            if (numericId) {
              const resuelto = await resolverCargoParaCandidato(
                datos.familia,
                datos.cargo
              );
              await supabase
                .from("candidato")
                .update({
                  rut: datos.rut,
                  nombre_completo: datos.nombre,
                  correo: datos.correo,
                  telefono: datos.telefono,
                  familia_id: resuelto.familia_id,
                  cargo_id: resuelto.cargo_id,
                  cargo_personalizado: resuelto.cargo_personalizado
                })
                .eq("id", numericId);
            }
          } catch (err) {
            console.warn("No se pudo actualizar en Supabase:", err);
          }
        }
      } else if (datos.yaEnSupabase) {
        nuevoCandidato = {
          ...datos,
          id: datos.id,
          activo: true,
          creado: hoyISO()
        };
        setCandidatos((prev) => {
          const actualizados = [
            nuevoCandidato,
            ...prev.filter((c) => c.rut !== datos.rut)
          ];
          guardarStorage(STORAGE_CANDIDATOS, actualizados);
          return actualizados;
        });
      } else {
        // Creación de nuevo candidato
        const idGenerado = `c${Date.now()}`;
        nuevoCandidato = {
          ...datos,
          id: idGenerado,
          activo: true,
          creado: hoyISO()
        };
        setCandidatos((prev) => {
          const actualizados = [nuevoCandidato, ...prev];
          guardarStorage(STORAGE_CANDIDATOS, actualizados);
          return actualizados;
        });

        if (backendConectado) {
          try {
            await api.candidatos.crear({
              rut: datos.rut,
              nombre: datos.nombre,
              correo: datos.correo,
              telefono: datos.telefono,
              cargoNombre: datos.cargo,
              familiaNombre: datos.familia
            });
          } catch (err) {
            console.warn("No se pudo sincronizar creación con backend:", err);
          }
        } else {
          try {
            const resuelto = await resolverCargoParaCandidato(
              datos.familia,
              datos.cargo
            );
            const { data: ins } = await supabase
              .from("candidato")
              .insert([
                {
                  rut: datos.rut,
                  nombre_completo: datos.nombre,
                  correo: datos.correo,
                  telefono: datos.telefono,
                  familia_id: resuelto.familia_id,
                  cargo_id: resuelto.cargo_id,
                  cargo_personalizado: resuelto.cargo_personalizado
                }
              ])
              .select()
              .single();

            if (ins?.id) {
              setCandidatos((prev) => {
                const act = prev.map((c) =>
                  c.id === idGenerado
                    ? {
                        ...c,
                        id: `c${ins.id}`,
                        numericId: ins.id,
                        cargo_id: ins.cargo_id,
                        cargo_personalizado: ins.cargo_personalizado,
                        familia_id: ins.familia_id
                      }
                    : c
                );
                guardarStorage(STORAGE_CANDIDATOS, act);
                return act;
              });
            }
          } catch (err) {
            console.warn("No se pudo sincronizar creación con Supabase:", err);
          }
        }
      }
    },
    [backendConectado]
  );

  const eliminarCandidato = useCallback(
    async (id) => {
      setCandidatos((prev) => {
        const actualizados = prev.filter((c) => c.id !== id);
        guardarStorage(STORAGE_CANDIDATOS, actualizados);
        return actualizados;
      });
      setSolicitudes((prev) => {
        const actualizados = prev.filter((s) => s.candidatoId !== id);
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });
      if (backendConectado) {
        try {
          await api.candidatos.eliminar(id);
        } catch (err) {
          console.warn("No se pudo sincronizar eliminación con backend:", err);
        }
      } else {
        try {
          const numericId = Number(String(id).replace(/\D/g, ""));
          if (numericId) {
            await supabase.from("candidato").delete().eq("id", numericId);
          }
        } catch (err) {
          console.warn("No se pudo eliminar en Supabase:", err);
        }
      }
    },
    [backendConectado]
  );

  const crearSolicitud = useCallback(
    async (datos) => {
      const idTemp = `s${Date.now()}`;
      const nueva = {
        ...datos,
        id: idTemp,
        codigo: `SOL-${1001 + solicitudes.length + 10}`,
        estado: "Pendiente",
        actualizada: hoyISO(),
        evaluacion: evaluacionVacia()
      };
      setSolicitudes((prev) => {
        const actualizados = [nueva, ...prev];
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });

      if (backendConectado) {
        try {
          const numericCandId =
            Number(datos.candidatoId.replace(/\D/g, "")) || 1;
          await api.solicitudes.crear({
            candidatoId: numericCandId,
            cargoNombre: datos.cargo,
            psicologoNombre: datos.psicologo,
            prioridad: datos.prioridad,
            fechaSolicitud: datos.fechaSolicitud
          });
        } catch (err) {
          console.warn("No se pudo sincronizar solicitud con backend:", err);
        }
      } else {
        try {
          const numericCandId = Number(
            String(datos.candidatoId).replace(/\D/g, "")
          );

          // Buscar evaluador_id en la tabla public.usuario
          let evaluadorId = 2; // fallback evaluador
          const { data: usuarioData } = await supabase
            .from("usuario")
            .select("id")
            .ilike("nombre_completo", datos.psicologo?.trim() || "")
            .maybeSingle();

          if (usuarioData?.id) {
            evaluadorId = usuarioData.id;
          }

          if (numericCandId) {
            const { data: insSol } = await supabase
              .from("solicitud_evaluacion")
              .insert([
                {
                  candidato_id: numericCandId,
                  evaluador_id: evaluadorId,
                  prioridad: datos.prioridad || "Media",
                  estado: "Pendiente"
                }
              ])
              .select()
              .single();

            if (insSol?.id) {
              setSolicitudes((prev) => {
                const act = prev.map((s) =>
                  s.id === idTemp
                    ? {
                        ...s,
                        id: `s${insSol.id}`,
                        numericId: insSol.id,
                        codigo: `SOL-${insSol.id}`
                      }
                    : s
                );
                guardarStorage(STORAGE_SOLICITUDES, act);
                return act;
              });
            }
          }
        } catch (err) {
          console.warn("No se pudo registrar solicitud en Supabase:", err);
        }
      }
    },
    [solicitudes.length, backendConectado]
  );

  const cambiarEstado = useCallback(
    async (id, estado) => {
      setSolicitudes((prev) => {
        const actualizados = prev.map((s) =>
          s.id === id ? { ...s, estado, actualizada: hoyISO() } : s
        );
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });

      if (backendConectado) {
        try {
          await api.solicitudes.cambiarEstado(id, estado);
        } catch (err) {
          console.warn("No se pudo sincronizar cambio de estado con backend:", err);
        }
      } else {
        try {
          const numericId = Number(String(id).replace(/\D/g, ""));
          if (numericId) {
            await supabase
              .from("solicitud_evaluacion")
              .update({ estado })
              .eq("id", numericId);
          }
        } catch (err) {
          console.warn("No se pudo actualizar estado en Supabase:", err);
        }
      }
    },
    [backendConectado]
  );

  const guardarEvaluacion = useCallback(
    async (id, evaluacion) => {
      setSolicitudes((prev) => {
        const actualizados = prev.map((s) =>
          s.id === id ? { ...s, evaluacion, actualizada: hoyISO() } : s
        );
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });

      if (backendConectado) {
        try {
          await api.solicitudes.guardarEvaluacion(id, evaluacion);
        } catch (err) {
          console.warn("No se pudo sincronizar evaluación con backend:", err);
        }
      } else {
        try {
          const numericSolId = Number(String(id).replace(/\D/g, ""));
          if (numericSolId) {
            await supabase.from("resultado_evaluacion").upsert(
              {
                solicitud_id: numericSolId,
                fecha_entrevista: evaluacion.fechaEntrevista || hoyISO(),
                notas_clinicas:
                  evaluacion.conclusiones || evaluacion.notasClinicas || "",
                dictamen: evaluacion.dictamen || "Pendiente"
              },
              { onConflict: "solicitud_id" }
            );
          }
        } catch (err) {
          console.warn("No se pudo guardar resultado de evaluación en Supabase:", err);
        }
      }
    },
    [backendConectado]
  );

  const restablecerDatosPrueba = useCallback(() => {
    setCandidatos([]);
    setSolicitudes([]);
    setCargos(CARGOS_INICIALES);
    setPsicologos(PSICOLOGOS);
    guardarStorage(STORAGE_CANDIDATOS, []);
    guardarStorage(STORAGE_SOLICITUDES, []);
    guardarStorage(STORAGE_CARGOS, CARGOS_INICIALES);
    guardarStorage(STORAGE_PSICOLOGOS, PSICOLOGOS);
    toast.success("Registros restablecidos al estado inicial.");
  }, []);

  const agregarCargo = useCallback(async (nuevo) => {
    const item = {
      ...nuevo,
      id: `cg${Date.now()}`,
      activo: true
    };
    setCargos((prev) => {
      const actualizados = [...prev, item];
      guardarStorage(STORAGE_CARGOS, actualizados);
      return actualizados;
    });

    try {
      const { data: fam } = await supabase
        .from("familia_cargo")
        .select("id")
        .ilike("nombre", nuevo.familia?.trim() || "")
        .maybeSingle();

      if (fam?.id) {
        await supabase.from("cargo").insert([
          {
            nombre: nuevo.nombre.trim(),
            familia_id: fam.id,
            activo: true
          }
        ]);
      }
    } catch (err) {
      console.warn("No se pudo agregar cargo en Supabase:", err);
    }

    toast.success(`Cargo "${item.nombre}" agregado al catálogo.`);
  }, []);

  const agregarPsicologo = useCallback((nombre) => {
    if (!nombre.trim()) return;
    setPsicologos((prev) => {
      if (prev.includes(nombre.trim())) return prev;
      const actualizados = [...prev, nombre.trim()];
      guardarStorage(STORAGE_PSICOLOGOS, actualizados);
      return actualizados;
    });
    toast.success(`Evaluador "${nombre}" agregado a la lista.`);
  }, []);

  const value = useMemo(
    () => ({
      candidatos,
      solicitudes,
      cargos,
      familias,
      psicologos,
      cargando,
      backendConectado,
      supabaseConectado,
      guardarCandidato,
      eliminarCandidato,
      crearSolicitud,
      cambiarEstado,
      guardarEvaluacion,
      nombreCandidato: (id) =>
        candidatos.find((c) => c.id === id)?.nombre ?? "Candidato eliminado",
      restablecerDatosPrueba,
      agregarCargo,
      agregarPsicologo,
      recargarDesdeBackend
    }),
    [
      candidatos,
      solicitudes,
      cargos,
      familias,
      psicologos,
      cargando,
      backendConectado,
      supabaseConectado,
      guardarCandidato,
      eliminarCandidato,
      crearSolicitud,
      cambiarEstado,
      guardarEvaluacion,
      restablecerDatosPrueba,
      agregarCargo,
      agregarPsicologo,
      recargarDesdeBackend
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDatos() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDatos debe usarse dentro de DataProvider");
  return ctx;
}
export default DataContext;

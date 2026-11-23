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
  cargarEvaluadoresSupabase,
  eliminarArchivosCurriculum
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
              curriculum_path,
              curriculum_nombre,
              analisis_ia,
              analisis_ia_fecha,
              creado_en,
              familia_cargo:familia_id ( id, nombre ),
              cargo:cargo_id ( id, nombre )
            `)
            .order("id", { ascending: false });

          if (!supaErr && supaCands) {
            setSupabaseConectado(true);
            const candsPrevios = leerStorage(STORAGE_CANDIDATOS, []);
            const candsMapeados = supaCands.map((c) => {
              const previo = candsPrevios.find(
                (p) => p.rut === c.rut || p.id === `c${c.id}` || p.numericId === c.id
              );
              const curriculum_path =
                c.curriculum_path ||
                previo?.curriculum_path ||
                previo?.curriculumPath ||
                null;
              const curriculum_nombre =
                c.curriculum_nombre ||
                previo?.curriculum_nombre ||
                previo?.curriculumNombre ||
                null;
              const analisis_ia =
                c.analisis_ia ||
                previo?.analisis_ia ||
                previo?.analisisIa ||
                null;
              const analisis_ia_fecha =
                c.analisis_ia_fecha ||
                previo?.analisis_ia_fecha ||
                previo?.analisisIaFecha ||
                null;

              return {
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
                curriculum_path,
                curriculum_nombre,
                curriculumPath: curriculum_path,
                curriculumNombre: curriculum_nombre,
                analisis_ia,
                analisisIa: analisis_ia,
                analisis_ia_fecha,
                analisisIaFecha: analisis_ia_fecha,
                activo: true,
                creado: c.creado_en ? c.creado_en.slice(0, 10) : hoyISO()
              };
            });

            if (candsMapeados.length > 0) {
              setCandidatos(candsMapeados);
              guardarStorage(STORAGE_CANDIDATOS, candsMapeados);
            } else if (candsPrevios.length > 0) {
              setCandidatos(candsPrevios);
            } else {
              setCandidatos([]);
              guardarStorage(STORAGE_CANDIDATOS, []);
            }
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
              curriculum_path,
              curriculum_nombre,
              analisis_ia,
              analisis_ia_fecha,
              candidato:candidato_id (
                id,
                nombre_completo,
                rut,
                curriculum_path,
                curriculum_nombre,
                analisis_ia,
                analisis_ia_fecha,
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
            const solsPrevias = leerStorage(STORAGE_SOLICITUDES, []);
            const solsMapeadas = supaSols.map((s) => {
              const res = Array.isArray(s.resultado_evaluacion)
                ? s.resultado_evaluacion[0]
                : s.resultado_evaluacion;

              const previa = solsPrevias.find(
                (p) => p.id === `s${s.id}` || p.numericId === s.id
              );
              const curriculum_path =
                s.candidato?.curriculum_path ||
                s.curriculum_path ||
                previa?.curriculum_path ||
                previa?.curriculumPath ||
                null;
              const curriculum_nombre =
                s.candidato?.curriculum_nombre ||
                s.curriculum_nombre ||
                previa?.curriculum_nombre ||
                previa?.curriculumNombre ||
                null;
              const analisis_ia =
                s.candidato?.analisis_ia ||
                s.analisis_ia ||
                previa?.analisis_ia ||
                previa?.analisisIa ||
                null;
              const analisis_ia_fecha =
                s.candidato?.analisis_ia_fecha ||
                s.analisis_ia_fecha ||
                previa?.analisis_ia_fecha ||
                previa?.analisisIaFecha ||
                null;

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
                curriculum_path,
                curriculum_nombre,
                curriculumPath: curriculum_path,
                curriculumNombre: curriculum_nombre,
                analisis_ia,
                analisisIa: analisis_ia,
                analisis_ia_fecha,
                analisisIaFecha: analisis_ia_fecha,
                evaluacion: res
                  ? {
                      fechaEntrevista: res.fecha_entrevista || "",
                      conclusiones: res.notas_clinicas || "",
                      dictamen: res.dictamen || "Pendiente",
                      preguntasUsadas: {},
                      notasPregunta: {}
                    }
                  : previa?.evaluacion || evaluacionVacia()
              };
            });

            if (solsMapeadas.length > 0) {
              setSolicitudes(solsMapeadas);
              guardarStorage(STORAGE_SOLICITUDES, solsMapeadas);
            } else if (solsPrevias.length > 0) {
              setSolicitudes(solsPrevias);
            } else {
              setSolicitudes([]);
              guardarStorage(STORAGE_SOLICITUDES, []);
            }
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
                c.id === datos.id
                  ? {
                      ...c,
                      ...datos,
                      curriculum_path: datos.curriculum_path ?? datos.curriculumPath ?? c.curriculum_path,
                      curriculum_nombre: datos.curriculum_nombre ?? datos.curriculumNombre ?? c.curriculum_nombre,
                      analisis_ia: datos.analisis_ia ?? datos.analisisIa ?? c.analisis_ia,
                      analisis_ia_fecha: datos.analisis_ia_fecha ?? datos.analisisIaFecha ?? c.analisis_ia_fecha,
                      id: c.id
                    }
                  : c
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
              const payloadUpdate = {
                rut: datos.rut,
                nombre_completo: datos.nombre,
                correo: datos.correo,
                telefono: datos.telefono,
                familia_id: resuelto.familia_id,
                cargo_id: resuelto.cargo_id,
                cargo_personalizado: resuelto.cargo_personalizado
              };
              if (datos.curriculum_path !== undefined || datos.curriculumPath !== undefined) {
                payloadUpdate.curriculum_path = datos.curriculum_path || datos.curriculumPath || null;
              }
              if (datos.curriculum_nombre !== undefined || datos.curriculumNombre !== undefined) {
                payloadUpdate.curriculum_nombre = datos.curriculum_nombre || datos.curriculumNombre || null;
              }
              if (datos.analisis_ia !== undefined || datos.analisisIa !== undefined) {
                payloadUpdate.analisis_ia = datos.analisis_ia || datos.analisisIa || null;
              }
              if (datos.analisis_ia_fecha !== undefined || datos.analisisIaFecha !== undefined) {
                payloadUpdate.analisis_ia_fecha = datos.analisis_ia_fecha || datos.analisisIaFecha || null;
              }

              await supabase
                .from("candidato")
                .update(payloadUpdate)
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
          curriculum_path: datos.curriculum_path || datos.curriculumPath || null,
          curriculum_nombre: datos.curriculum_nombre || datos.curriculumNombre || null,
          curriculumPath: datos.curriculum_path || datos.curriculumPath || null,
          curriculumNombre: datos.curriculum_nombre || datos.curriculumNombre || null,
          analisis_ia: datos.analisis_ia || datos.analisisIa || null,
          analisisIa: datos.analisis_ia || datos.analisisIa || null,
          analisis_ia_fecha: datos.analisis_ia_fecha || datos.analisisIaFecha || null,
          analisisIaFecha: datos.analisis_ia_fecha || datos.analisisIaFecha || null,
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
          curriculum_path: datos.curriculum_path || datos.curriculumPath || null,
          curriculum_nombre: datos.curriculum_nombre || datos.curriculumNombre || null,
          curriculumPath: datos.curriculum_path || datos.curriculumPath || null,
          curriculumNombre: datos.curriculum_nombre || datos.curriculumNombre || null,
          analisis_ia: datos.analisis_ia || datos.analisisIa || null,
          analisisIa: datos.analisis_ia || datos.analisisIa || null,
          analisis_ia_fecha: datos.analisis_ia_fecha || datos.analisisIaFecha || null,
          analisisIaFecha: datos.analisis_ia_fecha || datos.analisisIaFecha || null,
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
            const payloadInsert = {
              rut: datos.rut,
              nombre_completo: datos.nombre,
              correo: datos.correo,
              telefono: datos.telefono,
              familia_id: resuelto.familia_id,
              cargo_id: resuelto.cargo_id,
              cargo_personalizado: resuelto.cargo_personalizado,
              curriculum_path: datos.curriculum_path || datos.curriculumPath || null,
              curriculum_nombre: datos.curriculum_nombre || datos.curriculumNombre || null,
              analisis_ia: datos.analisis_ia || datos.analisisIa || null,
              analisis_ia_fecha: datos.analisis_ia_fecha || datos.analisisIaFecha || null
            };
            const { data: ins } = await supabase
              .from("candidato")
              .insert([payloadInsert])
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
      // 1. Recolectar curriculum_path del candidato y de sus solicitudes asociadas
      const cand = candidatos.find((c) => c.id === id);
      const solsAsociadas = solicitudes.filter((s) => s.candidatoId === id);

      const pathsAEliminar = new Set();
      if (cand?.curriculum_path) pathsAEliminar.add(cand.curriculum_path);
      if (cand?.curriculumPath) pathsAEliminar.add(cand.curriculumPath);

      solsAsociadas.forEach((s) => {
        if (s.curriculum_path) pathsAEliminar.add(s.curriculum_path);
        if (s.curriculumPath) pathsAEliminar.add(s.curriculumPath);
      });

      const paths = Array.from(pathsAEliminar).filter(
        (p) => typeof p === "string" && p.trim().length > 0
      );

      // 2. Eliminar archivos físicos del bucket de Storage (no bloqueante ante errores)
      if (paths.length > 0) {
        try {
          await eliminarArchivosCurriculum(paths);
        } catch (storageEx) {
          console.warn("Advertencia al eliminar archivos de currículum en Storage:", storageEx);
        }
      }

      // 3. Remover del estado local y storage
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

      // 4. Remover registro en Backend o Supabase
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
    [candidatos, solicitudes, backendConectado]
  );

  const crearSolicitud = useCallback(
    async (datos) => {
      const idTemp = datos.id || `s${Date.now()}`;
      const candAsociado = candidatos.find((c) => c.id === datos.candidatoId);
      const curriculum_path =
        datos.curriculum_path ||
        datos.curriculumPath ||
        candAsociado?.curriculum_path ||
        candAsociado?.curriculumPath ||
        null;
      const curriculum_nombre =
        datos.curriculum_nombre ||
        datos.curriculumNombre ||
        candAsociado?.curriculum_nombre ||
        candAsociado?.curriculumNombre ||
        null;
      const analisis_ia =
        datos.analisis_ia ||
        datos.analisisIa ||
        candAsociado?.analisis_ia ||
        candAsociado?.analisisIa ||
        null;
      const analisis_ia_fecha =
        datos.analisis_ia_fecha ||
        datos.analisisIaFecha ||
        candAsociado?.analisis_ia_fecha ||
        candAsociado?.analisisIaFecha ||
        null;

      const nueva = {
        ...datos,
        id: idTemp,
        codigo: datos.codigo || `SOL-${1001 + solicitudes.length + 10}`,
        estado: datos.estado || "Pendiente",
        actualizada: hoyISO(),
        evaluacion: datos.evaluacion || evaluacionVacia(),
        curriculum_path,
        curriculum_nombre,
        curriculumPath: curriculum_path,
        curriculumNombre: curriculum_nombre,
        analisis_ia,
        analisisIa: analisis_ia,
        analisis_ia_fecha,
        analisisIaFecha: analisis_ia_fecha
      };

      setSolicitudes((prev) => {
        const actualizados = [nueva, ...prev];
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });

      if (datos.yaEnSupabase) {
        return nueva;
      }

      if (backendConectado) {
        try {
          const numericCandId =
            Number(String(datos.candidatoId).replace(/\D/g, "")) || 1;
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
          if (datos.psicologo) {
            const { data: usuarioData } = await supabase
              .from("usuario")
              .select("id")
              .ilike("nombre_completo", datos.psicologo?.trim() || "")
              .maybeSingle();

            if (usuarioData?.id) {
              evaluadorId = usuarioData.id;
            }
          }

          if (numericCandId) {
            const payload = {
              candidato_id: numericCandId,
              prioridad: datos.prioridad || "Media",
              estado: datos.estado || "Pendiente",
              curriculum_path,
              curriculum_nombre,
              analisis_ia,
              analisis_ia_fecha
            };
            if (evaluadorId) {
              payload.evaluador_id = evaluadorId;
            }

            const { data: insSol } = await supabase
              .from("solicitud_evaluacion")
              .insert([payload])
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
                        codigo: `SOL-${insSol.id}`,
                        curriculum_path: insSol.curriculum_path || s.curriculum_path,
                        curriculum_nombre: insSol.curriculum_nombre || s.curriculum_nombre,
                        curriculumPath: insSol.curriculum_path || s.curriculumPath,
                        curriculumNombre: insSol.curriculum_nombre || s.curriculumNombre
                      }
                    : s
                );
                guardarStorage(STORAGE_SOLICITUDES, act);
                return act;
              });
              return insSol;
            }
          }
        } catch (err) {
          console.warn("No se pudo registrar solicitud en Supabase:", err);
        }
      }
      return nueva;
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

  const guardarAnalisisIA = useCallback(
    async (id, analisis, fecha) => {
      const fechaFinal = fecha || hoyISO();
      const idStr = String(id || "");
      const isCand = idStr.startsWith("c");

      // Actualizar en el estado de solicitudes
      setSolicitudes((prev) => {
        const actualizados = prev.map((s) => {
          if (s.id === id || (isCand && s.candidatoId === id)) {
            return {
              ...s,
              analisis_ia: analisis,
              analisisIa: analisis,
              analisis_ia_fecha: fechaFinal,
              analisisIaFecha: fechaFinal,
              actualizada: hoyISO()
            };
          }
          return s;
        });
        guardarStorage(STORAGE_SOLICITUDES, actualizados);
        return actualizados;
      });

      // Actualizar en el estado de candidatos
      setCandidatos((prev) => {
        const actualizados = prev.map((c) => {
          if (c.id === id || (!isCand && solicitudes.find((s) => s.id === id)?.candidatoId === c.id)) {
            return {
              ...c,
              analisis_ia: analisis,
              analisisIa: analisis,
              analisis_ia_fecha: fechaFinal,
              analisisIaFecha: fechaFinal
            };
          }
          return c;
        });
        guardarStorage(STORAGE_CANDIDATOS, actualizados);
        return actualizados;
      });

      if (!backendConectado) {
        try {
          const numericId = Number(idStr.replace(/\D/g, ""));
          if (numericId) {
            if (isCand) {
              await supabase
                .from("candidato")
                .update({
                  analisis_ia: analisis,
                  analisis_ia_fecha: fechaFinal
                })
                .eq("id", numericId);
            } else {
              await supabase
                .from("solicitud_evaluacion")
                .update({
                  analisis_ia: analisis,
                  analisis_ia_fecha: fechaFinal
                })
                .eq("id", numericId);

              const sol = solicitudes.find((s) => s.id === id);
              if (sol?.candidatoId) {
                const candNum = Number(String(sol.candidatoId).replace(/\D/g, ""));
                if (candNum) {
                  await supabase
                    .from("candidato")
                    .update({
                      analisis_ia: analisis,
                      analisis_ia_fecha: fechaFinal
                    })
                    .eq("id", candNum);
                }
              }
            }
          }
        } catch (err) {
          console.warn("No se pudo actualizar analisis_ia en Supabase:", err);
        }
      }
    },
    [backendConectado, solicitudes]
  );

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
      guardarAnalisisIA,
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
      guardarAnalisisIA,
      restablecerDatosPrueba,
      agregarCargo,
      agregarPsicologo,
      recargarDesdeBackend
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function generarAnalisisIaMock(cargo = "Cargo", familia = "Operaciones") {
  return {
    puntaje_afinidad: 85,
    nivel_ajuste: "Alto",
    resumen_ejecutivo: [
      `Perfil profesional con sólida pertinencia para el área de ${familia}.`,
      `Experiencia comprobable en funciones y responsabilidades asociadas al cargo de ${cargo}.`,
      "Competencias técnicas y operativas alineadas con las normativas de la industria acuícola.",
      "Trayectoria estable con disposición a desempeñarse en los centros operativos de AquaChile."
    ],
    fortalezas_cargo: [
      "Experiencia directa y conocimientos específicos en el área de postulación",
      "Orientación a la excelencia operativa, seguridad ocupacional y calidad",
      "Buenas referencias de desempeño en entornos productivos de ritmo dinámico"
    ],
    brechas_detectadas: [
      "Familiarización inicial con los sistemas ERP y protocolos de reportería interna de AquaChile",
      "Capacitación en normativas específicas de bioseguridad marítima y ambiental"
    ],
    alertas_tempranas: [],
    preguntas_sugeridas: [
      `¿Cuál ha sido el principal desafío operativo que ha enfrentado desempeñándose en ${cargo}?`,
      "Describa una situación en la que debió solucionar un imprevisto bajo presión de plazos.",
      "¿Qué aspectos de la cultura laboral de AquaChile motivan su postulación a esta vacante?"
    ]
  };
}

export function useDatos() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDatos debe usarse dentro de DataProvider");
  return ctx;
}
export default DataContext;

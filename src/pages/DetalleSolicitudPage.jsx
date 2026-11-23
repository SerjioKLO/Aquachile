import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  ExternalLink,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Ban
} from "lucide-react";
import { useDatos, generarAnalisisIaMock } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { EstadoBadge, DictamenBadge } from "@/components/estado-badge";
import {
  DICTAMENES,
  ESTADOS,
  PREGUNTAS_POR_FAMILIA,
  evaluacionVacia,
  formatearFecha
} from "@/lib/domain";
import { obtenerUrlCurriculum, analizarCurriculumConIA } from "@/lib/supabase-db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
const iconos = {
  Pendiente: Circle,
  "En proceso": Loader2,
  Completada: CheckCircle2,
  Finalizada: CheckCircle2,
  Cancelada: Ban
};
export function DetalleSolicitudPage() {
  const { id } = useParams();
  const { solicitudes, candidatos, cambiarEstado, guardarEvaluacion, guardarAnalisisIA } = useDatos();
  const { rol, puede } = useAuth();
  // El psicólogo evaluador NO debe ver ni interactuar con el agente de IA para evitar sesgos
  const puedeVerIa = rol !== "evaluador" && (rol === "analista" || rol === "admin" || puede("ver_analisis_ia") || puede("crear_solicitudes"));
  const solicitud = solicitudes.find((s) => s.id === id);
  const candidato = candidatos.find((c) => c.id === solicitud?.candidatoId);

  // Leer CV y análisis IA desde el candidato con fallback a la solicitud
  const cvPath =
    candidato?.curriculum_path ||
    candidato?.curriculumPath ||
    solicitud?.curriculum_path ||
    solicitud?.curriculumPath;
  const cvNombre =
    candidato?.curriculum_nombre ||
    candidato?.curriculumNombre ||
    solicitud?.curriculum_nombre ||
    solicitud?.curriculumNombre ||
    "Documento adjunto";
  const analisisIa =
    candidato?.analisis_ia ||
    candidato?.analisisIa ||
    solicitud?.analisis_ia ||
    solicitud?.analisisIa;
  const analisisIaFecha =
    candidato?.analisis_ia_fecha ||
    candidato?.analisisIaFecha ||
    solicitud?.analisis_ia_fecha ||
    solicitud?.analisisIaFecha;

  const [form, setForm] = useState(solicitud?.evaluacion ?? evaluacionVacia());
  const [cargandoCv, setCargandoCv] = useState(false);
  const [analizandoIa, setAnalizandoIa] = useState(false);

  useEffect(() => {
    if (solicitud) setForm(solicitud.evaluacion);
  }, [solicitud?.id]);

  async function handleDescargarCv() {
    const path = cvPath;
    if (!path) {
      toast.error("No se ha registrado una ruta para este currículum.");
      return;
    }
    try {
      setCargandoCv(true);
      const url = await obtenerUrlCurriculum(path);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("No se pudo obtener el enlace temporal de visualización.");
      }
    } catch (err) {
      console.error("Error al obtener URL del CV:", err);
      toast.error(err?.message || "Error al generar enlace del currículum.");
    } finally {
      setCargandoCv(false);
    }
  }

  async function handleAnalizarCv() {
    if (!solicitud?.id) return;
    try {
      setAnalizandoIa(true);
      let resultado = null;
      try {
        resultado = await analizarCurriculumConIA(solicitud.numericId || solicitud.id);
      } catch (edgeErr) {
        console.warn("Invocación de Edge Function no exitosa:", edgeErr);
        const msg = edgeErr?.message || "";
        if (msg.includes("texto legible") || msg.includes("escaneada") || msg.includes("sin OCR")) {
          throw edgeErr;
        }
        // Fallback contingente para entornos offline o sin variables remotas
        resultado = {
          analisis: generarAnalisisIaMock(solicitud.cargo, solicitud.familia),
          fecha: new Date().toISOString()
        };
      }

      if (resultado?.analisis && guardarAnalisisIA) {
        await guardarAnalisisIA(solicitud.id, resultado.analisis, resultado.fecha);
        if (candidato?.id) {
          await guardarAnalisisIA(candidato.id, resultado.analisis, resultado.fecha);
        }
        toast.success("Pre-análisis con IA completado exitosamente");
      }
    } catch (err) {
      console.error("Error al analizar currículum con IA:", err);
      toast.error(err?.message || "Error al realizar el análisis del currículum con IA.");
    } finally {
      setAnalizandoIa(false);
    }
  }
  if (!solicitud || !candidato) {
    return <div>
        <p className="text-muted-foreground">La solicitud no existe o fue eliminada.</p>
        <Button asChild className="mt-4">
          <Link to="/solicitudes">Volver a solicitudes</Link>
        </Button>
      </div>;
  }
  const editable = puede("evaluar");

  // Reemplazar preguntas base por preguntas_sugeridas de la IA si existen en el candidato o solicitud
  const preguntasIa =
    Array.isArray(candidato?.analisis_ia?.preguntas_sugeridas) &&
    candidato.analisis_ia.preguntas_sugeridas.length > 0
      ? candidato.analisis_ia.preguntas_sugeridas
      : Array.isArray(analisisIa?.preguntas_sugeridas) &&
        analisisIa.preguntas_sugeridas.length > 0
      ? analisisIa.preguntas_sugeridas
      : null;

  const tienePreguntasIa = Boolean(preguntasIa && preguntasIa.length > 0);
  const preguntasBase = PREGUNTAS_POR_FAMILIA[solicitud.familia] || [];
  const preguntas = tienePreguntasIa ? preguntasIa : preguntasBase;
  const usadas = preguntas.filter((p) => form?.preguntasUsadas?.[p]).length;
  function guardar() {
    if (!solicitud) return;
    if (
      (solicitud.estado === "Completada" || solicitud.estado === "Finalizada") &&
      !form.dictamen
    ) {
      toast.error("Debe seleccionar un dictamen para una evaluación completada.");
      return;
    }
    guardarEvaluacion(solicitud.id, form);
    toast.success("Evaluación guardada");
  }
  function avanzar(estado) {
    if (!solicitud) return;
    if (
      (estado === "Completada" || estado === "Finalizada") &&
      (!form.dictamen || !form.conclusiones.trim())
    ) {
      toast.error("Complete conclusiones y dictamen antes de finalizar.");
      return;
    }
    guardarEvaluacion(solicitud.id, form);
    cambiarEstado(solicitud.id, estado);
    toast.success(`Estado actualizado a ${estado}`);
  }
  return <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/solicitudes">
          <ArrowLeft className="size-4" />
          Volver a solicitudes
        </Link>
      </Button>

      <Card className="mt-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {solicitud.codigo} · Prioridad {solicitud.prioridad}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{candidato.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {candidato.rut} · {candidato.correo} · {candidato.telefono}
            </p>
          </div>
          <div className="text-right">
            <EstadoBadge estado={solicitud.estado} />
            <p className="mt-2 text-sm text-muted-foreground">
              Solicitada el {formatearFecha(solicitud.fechaSolicitud)}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-4">
          <Dato t="Cargo evaluado" v={solicitud.cargo} />
          <Dato t="Familia de cargo" v={solicitud.familia} />
          <Dato t="Psicólogo evaluador" v={solicitud.psicologo} />
          <div>
            <p className="text-xs text-muted-foreground">Dictamen</p>
            <div className="mt-1">
              <DictamenBadge dictamen={solicitud.evaluacion.dictamen} />
            </div>
          </div>
        </div>

        {cvPath && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="size-5 text-primary shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Currículum Vitae adjunto</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {cvNombre}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cargandoCv}
              onClick={handleDescargarCv}
              className="gap-2 shrink-0"
            >
              {cargandoCv ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              <span>Ver {cvNombre || "Currículum"}</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Tarjeta de Pre-análisis IA del Currículum (GroqCloud / Llama 3.3) */}
      {cvPath && puedeVerIa && (
        <>
          {analizandoIa ? (
            <Card className="mt-4 p-6 border-primary/30 bg-primary/5">
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="size-6 text-primary animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Extrayendo texto del CV y evaluando afinidad con el cargo...
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Procesando las competencias del postulante para el puesto de{" "}
                    <strong>{solicitud.cargo}</strong> mediante Llama 3.3 en GroqCloud.
                  </p>
                </div>
              </div>
            </Card>
          ) : !analisisIa ? (
            <Card className="mt-4 p-6 border-dashed border-2 bg-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" aria-hidden="true" />
                    <h3 className="text-base font-semibold">Pre-análisis IA del Currículum</h3>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Evalúa automáticamente la afinidad y match del candidato con el perfil de{" "}
                    <strong>{solicitud.cargo}</strong>, identificando fortalezas, brechas y preguntas clave para la entrevista.
                  </p>
                </div>
                <Button
                  onClick={handleAnalizarCv}
                  disabled={analizandoIa}
                  className="gap-2 shrink-0"
                >
                  <Sparkles className="size-4" />
                  <span>Analizar CV con IA</span>
                </Button>
              </div>
            </Card>
          ) : (
            (() => {
              const analisis = analisisIa;
              const nivel = analisis.nivel_ajuste || (analisis.puntaje_afinidad >= 75 ? "Alto" : analisis.puntaje_afinidad >= 50 ? "Medio" : "Bajo");
              const fechaAnalisis = analisisIaFecha;

              return (
                <Card className="mt-4 p-6 border-border space-y-5">
                  {/* Encabezado con Nivel de Ajuste y Regenerar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="size-5 text-primary" aria-hidden="true" />
                        <h2 className="text-base font-semibold tracking-tight text-foreground">
                          Pre-análisis IA del Currículum
                        </h2>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-semibold text-xs",
                            nivel === "Alto" && "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
                            nivel === "Medio" && "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
                            nivel === "Bajo" && "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                          )}
                        >
                          Ajuste {nivel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Evaluación con Llama 3.3 70B (GroqCloud) · {fechaAnalisis ? formatearFecha(fechaAnalisis) : "Reciente"}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={analizandoIa}
                      onClick={handleAnalizarCv}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={cn("size-3.5", analizandoIa && "animate-spin")} />
                      <span>Regenerar análisis</span>
                    </Button>
                  </div>

                  {/* Barra e Indicador de Afinidad */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-foreground flex items-center gap-2">
                        <TrendingUp className="size-4 text-primary" aria-hidden="true" />
                        Índice de afinidad con el perfil del cargo
                      </span>
                      <span className="text-base font-bold font-mono text-primary">
                        {analisis.puntaje_afinidad}%
                      </span>
                    </div>
                    <Progress
                      value={analisis.puntaje_afinidad}
                      className="h-2.5 bg-muted"
                    />
                  </div>

                  {/* Resumen Ejecutivo */}
                  {Array.isArray(analisis.resumen_ejecutivo) && analisis.resumen_ejecutivo.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Resumen Ejecutivo
                      </h3>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {analisis.resumen_ejecutivo.map((punto, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card p-3 text-xs leading-relaxed text-card-foreground shadow-2xs"
                          >
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{punto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fortalezas vs Brechas */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Fortalezas */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5 dark:border-emerald-950 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                        <span>Fortalezas para el cargo</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-emerald-900/90 dark:text-emerald-200/90">
                        {analisis.fortalezas_cargo?.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                        {(!analisis.fortalezas_cargo || analisis.fortalezas_cargo.length === 0) && (
                          <li className="text-muted-foreground italic">No se indicaron fortalezas específicas.</li>
                        )}
                      </ul>
                    </div>

                    {/* Brechas */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2.5 dark:border-amber-950 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                        <span>Brechas detectadas</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-amber-900/90 dark:text-amber-200/90">
                        {analisis.brechas_detectadas?.map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                        {(!analisis.brechas_detectadas || analisis.brechas_detectadas.length === 0) && (
                          <li className="text-muted-foreground italic">No se detectaron brechas críticas.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Alertas tempranas si existen */}
                  {Array.isArray(analisis.alertas_tempranas) && analisis.alertas_tempranas.length > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-2 dark:border-rose-950 dark:bg-rose-950/30">
                      <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-300 text-xs sm:text-sm">
                        <ShieldAlert className="size-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                        <span>Alertas tempranas detectadas</span>
                      </div>
                      <ul className="space-y-1 text-xs text-rose-900/90 dark:text-rose-200/90">
                        {analisis.alertas_tempranas.map((alerta, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-600 dark:text-rose-400 mt-0.5">⚠️</span>
                            <span>{alerta}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preguntas sugeridas para la entrevista */}
                  {Array.isArray(analisis.preguntas_sugeridas) && analisis.preguntas_sugeridas.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                      <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm">
                        <HelpCircle className="size-4 text-primary shrink-0" aria-hidden="true" />
                        <span>Preguntas sugeridas para la entrevista psicolaboral</span>
                      </div>
                      <ol className="space-y-2 text-xs text-muted-foreground">
                        {analisis.preguntas_sugeridas.map((pregunta, i) => (
                          <li key={i} className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/20 p-2.5">
                            <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                            <span className="text-foreground">{pregunta}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </Card>
              );
            })()
          )}
        </>
      )}

      <Card className="mt-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Flujo de estados</h2>
          <span className="text-xs text-muted-foreground">
            Estado actual: <strong className="text-foreground">{solicitud.estado}</strong>
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {ESTADOS.map((e, i) => {
            const Icono = iconos[e] || Circle;
            const esActual = solicitud.estado === e;
            const esCancelada = e === "Cancelada";

            let estiloBoton = "";
            if (esActual) {
              if (esCancelada) {
                estiloBoton =
                  "border-red-600 bg-red-600 text-white hover:bg-red-700 shadow-xs font-semibold";
              } else {
                estiloBoton =
                  "border-primary bg-primary text-primary-foreground shadow-xs font-semibold";
              }
            } else {
              if (esCancelada) {
                estiloBoton =
                  "border-red-300 text-red-600 hover:border-red-600 hover:bg-red-50 hover:text-red-700";
              } else {
                estiloBoton =
                  "border-border text-muted-foreground hover:border-primary hover:text-foreground";
              }
            }

            return (
              <div key={e} className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!editable || esActual}
                  onClick={() => avanzar(e)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
                    estiloBoton,
                    (!editable || esActual) && "cursor-default opacity-90"
                  )}
                >
                  <Icono className="size-4" />
                  {e}
                </button>
                {i < ESTADOS.length - 1 && <span className="h-px w-6 bg-border hidden sm:inline-block" />}
              </div>
            );
          })}
        </div>
        {!editable && <p className="mt-3 text-xs text-muted-foreground">
            Su rol solo permite consultar esta evaluación.
          </p>}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <h2 className="text-base font-semibold">Formulario clínico</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="estado-solicitud">Estado de la solicitud</Label>
              <Select
                value={solicitud.estado}
                disabled={!editable}
                onValueChange={(v) => avanzar(v)}
              >
                <SelectTrigger id="estado-solicitud" className="w-full">
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaEntrevista">Fecha de entrevista</Label>
              <Input
    id="fechaEntrevista"
    type="date"
    disabled={!editable}
    value={form.fechaEntrevista}
    onChange={(e) => setForm({ ...form, fechaEntrevista: e.target.value })}
  />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conclusiones">Conclusiones</Label>
              <Textarea
    id="conclusiones"
    rows={7}
    disabled={!editable}
    placeholder="Describa el desempeño del postulante en la entrevista, competencias observadas y recomendaciones."
    value={form.conclusiones}
    onChange={(e) => setForm({ ...form, conclusiones: e.target.value })}
  />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dictamen">Dictamen</Label>
              <Select
    value={form.dictamen}
    disabled={!editable}
    onValueChange={(v) => setForm({ ...form, dictamen: v })}
  >
                <SelectTrigger id="dictamen" className="w-full">
                  <SelectValue placeholder="Seleccione un dictamen" />
                </SelectTrigger>
                <SelectContent>
                  {DICTAMENES.map((d) => <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editable && <Button onClick={guardar}>
                <Save className="size-4" />
                Guardar evaluación
              </Button>}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Preguntas sugeridas</h2>
            <span className="text-xs text-muted-foreground">
              {usadas}/{preguntas.length} aplicadas
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {tienePreguntasIa
              ? `Preguntas personalizadas generadas por IA según el perfil de ${solicitud.cargo}.`
              : `Batería para la familia ${solicitud.familia}.`}
          </p>
          <ul className="mt-4 space-y-3">
            {preguntas.map((p) => <li key={p} className="rounded-lg border border-border p-3">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
    checked={!!form.preguntasUsadas[p]}
    disabled={!editable}
    onCheckedChange={(v) => setForm({
      ...form,
      preguntasUsadas: { ...form.preguntasUsadas, [p]: !!v }
    })}
  />
                  <span
    className={cn(form.preguntasUsadas[p] && "text-muted-foreground line-through")}
  >
                    {p}
                  </span>
                </label>
                {form.preguntasUsadas[p] && <Textarea
    className="mt-3"
    rows={2}
    disabled={!editable}
    placeholder="Nota sobre la respuesta…"
    value={form.notasPregunta[p] ?? ""}
    onChange={(e) => setForm({
      ...form,
      notasPregunta: { ...form.notasPregunta, [p]: e.target.value }
    })}
  />}
              </li>)}
          </ul>
        </Card>
      </div>
    </div>;
}
function Dato({ t, v }) {
  return <div>
      <p className="text-xs text-muted-foreground">{t}</p>
      <p className="mt-1 text-sm font-medium">{v}</p>
    </div>;
}
export const Detalle = DetalleSolicitudPage;
export default DetalleSolicitudPage;

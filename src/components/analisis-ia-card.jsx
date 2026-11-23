import { Sparkles, RefreshCw, TrendingUp, ShieldAlert, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatearFecha } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function AnalisisIaCard({
  cvPath,
  cvNombre,
  analisis,
  fechaAnalisis,
  cargo = "el cargo",
  analizando = false,
  onAnalizar
}) {
  if (!cvPath) {
    return null;
  }

  if (analizando) {
    return (
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
              <strong>{cargo}</strong> mediante Llama 3.3 en GroqCloud.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!analisis) {
    return (
      <Card className="mt-4 p-6 border-dashed border-2 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
              <h3 className="text-base font-semibold">Pre-análisis IA del Currículum</h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Evalúa automáticamente la afinidad y match del candidato con el perfil de{" "}
              <strong>{cargo}</strong>, identificando fortalezas, brechas y preguntas clave para la entrevista.
            </p>
          </div>
          <Button
            onClick={onAnalizar}
            disabled={analizando}
            className="gap-2 shrink-0"
          >
            <Sparkles className="size-4" />
            <span>Analizar CV con IA</span>
          </Button>
        </div>
      </Card>
    );
  }

  const nivel =
    analisis.nivel_ajuste ||
    (analisis.puntaje_afinidad >= 75
      ? "Alto"
      : analisis.puntaje_afinidad >= 50
      ? "Medio"
      : "Bajo");

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
                nivel === "Alto" &&
                  "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
                nivel === "Medio" &&
                  "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
                nivel === "Bajo" &&
                  "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
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
          disabled={analizando}
          onClick={onAnalizar}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("size-3.5", analizando && "animate-spin")} />
          <span>Regenerar análisis</span>
        </Button>
      </div>

      {/* Métrica de Afinidad y Barra de Progreso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <TrendingUp className="size-4 text-primary" aria-hidden="true" />
            Puntaje de afinidad con el perfil
          </span>
          <span className="font-bold text-lg text-primary tabular-nums">
            {analisis.puntaje_afinidad ?? 0}%
          </span>
        </div>
        <Progress
          value={analisis.puntaje_afinidad ?? 0}
          className="h-2.5 bg-muted"
        />
      </div>

      {/* Resumen Ejecutivo */}
      {Array.isArray(analisis.resumen_ejecutivo) && analisis.resumen_ejecutivo.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen Ejecutivo
          </h4>
          <ul className="space-y-1.5 text-sm text-foreground">
            {analisis.resumen_ejecutivo.map((punto, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary font-bold leading-5">•</span>
                <span className="leading-relaxed">{punto}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fortalezas vs Brechas */}
      <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
        {/* Fortalezas */}
        <div className="space-y-2 p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            ✓ Fortalezas para el cargo
          </h4>
          <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-100">
            {Array.isArray(analisis.fortalezas_cargo) && analisis.fortalezas_cargo.length > 0 ? (
              analisis.fortalezas_cargo.map((f, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span>{f}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground italic">No se especificaron fortalezas directas.</li>
            )}
          </ul>
        </div>

        {/* Brechas */}
        <div className="space-y-2 p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            ⚠ Brechas detectadas / Aspectos a profundizar
          </h4>
          <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-100">
            {Array.isArray(analisis.brechas_detectadas) && analisis.brechas_detectadas.length > 0 ? (
              analisis.brechas_detectadas.map((b, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                  <span>{b}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground italic">No se observan brechas críticas detectadas.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Alertas Tempranas (si existen) */}
      {Array.isArray(analisis.alertas_tempranas) && analisis.alertas_tempranas.length > 0 && (
        <div className="space-y-2 p-3.5 rounded-lg bg-rose-50/60 border border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-900/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <ShieldAlert className="size-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            Alertas tempranas y vacíos laborales
          </h4>
          <ul className="space-y-1.5 text-xs text-rose-950 dark:text-rose-100">
            {analisis.alertas_tempranas.map((alerta, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-rose-600 dark:text-rose-400 font-bold">•</span>
                <span>{alerta}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preguntas Sugeridas para la Entrevista */}
      {Array.isArray(analisis.preguntas_sugeridas) && analisis.preguntas_sugeridas.length > 0 && (
        <div className="space-y-2.5 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <HelpCircle className="size-4 text-primary" aria-hidden="true" />
            Preguntas sugeridas para la entrevista
          </h4>
          <ol className="space-y-2 text-xs text-foreground list-decimal list-inside leading-relaxed bg-muted/40 p-3.5 rounded-lg border border-border">
            {analisis.preguntas_sugeridas.map((preg, idx) => (
              <li key={idx} className="font-medium">
                <span className="font-normal ml-1">{preg}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}

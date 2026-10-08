import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoBadge, DictamenBadge } from "@/components/estado-badge";
import {
  DICTAMENES,
  ESTADOS,
  PREGUNTAS_POR_FAMILIA,
  evaluacionVacia,
  formatearFecha,
  type Dictamen,
  type Evaluacion,
  type EstadoSolicitud,
} from "@/lib/domain";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const iconos = { Pendiente: Circle, "En proceso": Loader2, Finalizada: CheckCircle2 };

export interface DetalleSolicitudPageProps {
  id: string;
}

export function DetalleSolicitudPage({ id }: DetalleSolicitudPageProps) {
  const { solicitudes, candidatos, cambiarEstado, guardarEvaluacion } = useDatos();
  const { puede } = useAuth();
  const solicitud = solicitudes.find((s) => s.id === id);
  const candidato = candidatos.find((c) => c.id === solicitud?.candidatoId);
  const [form, setForm] = useState<Evaluacion>(solicitud?.evaluacion ?? evaluacionVacia());

  useEffect(() => {
    if (solicitud) setForm(solicitud.evaluacion);
  }, [solicitud?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!solicitud || !candidato) {
    return (
      <AppShell>
        <p className="text-muted-foreground">La solicitud no existe o fue eliminada.</p>
        <Button asChild className="mt-4">
          <Link to="/solicitudes">Volver a solicitudes</Link>
        </Button>
      </AppShell>
    );
  }

  const editable = puede("evaluar");
  const preguntas = PREGUNTAS_POR_FAMILIA[solicitud.familia];
  const usadas = preguntas.filter((p) => form.preguntasUsadas[p]).length;

  function guardar() {
    if (!solicitud) return;
    if (solicitud.estado === "Finalizada" && !form.dictamen) {
      toast.error("Debe seleccionar un dictamen para una evaluación finalizada.");
      return;
    }
    guardarEvaluacion(solicitud.id, form);
    toast.success("Evaluación guardada");
  }

  function avanzar(estado: EstadoSolicitud) {
    if (!solicitud) return;
    if (estado === "Finalizada" && (!form.dictamen || !form.conclusiones.trim())) {
      toast.error("Complete conclusiones y dictamen antes de finalizar.");
      return;
    }
    guardarEvaluacion(solicitud.id, form);
    cambiarEstado(solicitud.id, estado);
    toast.success(`Estado actualizado a ${estado}`);
  }

  return (
    <AppShell>
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
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="text-base font-semibold">Flujo de estados</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {ESTADOS.map((e, i) => {
            const Icono = iconos[e];
            const actual = ESTADOS.indexOf(solicitud.estado);
            const alcanzado = i <= actual;
            return (
              <div key={e} className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!editable || i === actual}
                  onClick={() => avanzar(e)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    alcanzado
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
                    (!editable || i === actual) && "cursor-default opacity-90",
                  )}
                >
                  <Icono className="size-4" />
                  {e}
                </button>
                {i < ESTADOS.length - 1 && <span className="h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>
        {!editable && (
          <p className="mt-3 text-xs text-muted-foreground">
            Su rol solo permite consultar esta evaluación.
          </p>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <h2 className="text-base font-semibold">Formulario clínico</h2>
          <div className="mt-4 space-y-4">
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
                onValueChange={(v) => setForm({ ...form, dictamen: v as Dictamen })}
              >
                <SelectTrigger id="dictamen" className="w-full">
                  <SelectValue placeholder="Seleccione un dictamen" />
                </SelectTrigger>
                <SelectContent>
                  {DICTAMENES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editable && (
              <Button onClick={guardar}>
                <Save className="size-4" />
                Guardar evaluación
              </Button>
            )}
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
            Batería para la familia {solicitud.familia}.
          </p>
          <ul className="mt-4 space-y-3">
            {preguntas.map((p) => (
              <li key={p} className="rounded-lg border border-border p-3">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={!!form.preguntasUsadas[p]}
                    disabled={!editable}
                    onCheckedChange={(v) =>
                      setForm({
                        ...form,
                        preguntasUsadas: { ...form.preguntasUsadas, [p]: !!v },
                      })
                    }
                  />
                  <span
                    className={cn(form.preguntasUsadas[p] && "text-muted-foreground line-through")}
                  >
                    {p}
                  </span>
                </label>
                {form.preguntasUsadas[p] && (
                  <Textarea
                    className="mt-3"
                    rows={2}
                    disabled={!editable}
                    placeholder="Nota sobre la respuesta…"
                    value={form.notasPregunta[p] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notasPregunta: { ...form.notasPregunta, [p]: e.target.value },
                      })
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{t}</p>
      <p className="mt-1 text-sm font-medium">{v}</p>
    </div>
  );
}

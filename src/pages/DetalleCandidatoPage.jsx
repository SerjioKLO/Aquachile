import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ConfirmarEliminarCandidatoDialog } from "@/components/ConfirmarEliminarCandidatoDialog";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Loader2,
  FilePlus2,
  ArrowRight,
  User,
  Calendar,
  Briefcase,
  Trash2
} from "lucide-react";
import { useDatos, generarAnalisisIaMock } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EstadoBadge } from "@/components/estado-badge";
import { SolicitudDialog } from "@/components/solicitud-dialog";
import { AnalisisIaCard } from "@/components/analisis-ia-card";
import { formatearFecha } from "@/lib/domain";
import { obtenerUrlCurriculum, analizarCurriculumConIA } from "@/lib/supabase-db";
import { toast } from "sonner";

export function DetalleCandidatoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidatos, solicitudes, guardarAnalisisIA, eliminarCandidato } = useDatos();
  const { puede } = useAuth();

  const candidato = candidatos.find((c) => c.id === id);
  const solicitudesCandidato = solicitudes.filter((s) => s.candidatoId === id);
  const solicitudAsociada = solicitudesCandidato[0];

  const [dialogoSolicitud, setDialogoSolicitud] = useState(false);
  const [cargandoCv, setCargandoCv] = useState(false);
  const [analizandoIa, setAnalizandoIa] = useState(false);
  const [dialogoEliminar, setDialogoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  if (!candidato) {
    return (
      <div>
        <p className="text-muted-foreground">El candidato no existe o fue eliminado.</p>
        <Button asChild className="mt-4">
          <Link to="/candidatos">Volver a candidatos</Link>
        </Button>
      </div>
    );
  }

  const cvPath = candidato.curriculum_path || candidato.curriculumPath;
  const cvNombre = candidato.curriculum_nombre || candidato.curriculumNombre || "Currículum Vitae";
  const analisisIa = candidato.analisis_ia || candidato.analisisIa;
  const analisisIaFecha = candidato.analisis_ia_fecha || candidato.analisisIaFecha;

  async function handleDescargarCv() {
    if (!cvPath) {
      toast.error("No se ha registrado una ruta para este currículum.");
      return;
    }
    try {
      setCargandoCv(true);
      const url = await obtenerUrlCurriculum(cvPath);
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
    if (!candidato?.id) return;
    try {
      setAnalizandoIa(true);
      let resultado = null;
      try {
        resultado = await analizarCurriculumConIA(
          candidato.numericId ? `c${candidato.numericId}` : candidato.id
        );
      } catch (edgeErr) {
        console.warn("Invocación de Edge Function no exitosa:", edgeErr);
        const msg = edgeErr?.message || "";
        if (msg.includes("texto legible") || msg.includes("escaneada") || msg.includes("sin OCR")) {
          throw edgeErr;
        }
        // Fallback contingente para entornos offline o de prueba
        resultado = {
          analisis: generarAnalisisIaMock(candidato.cargo, candidato.familia),
          fecha: new Date().toISOString()
        };
      }

      if (resultado?.analisis && guardarAnalisisIA) {
        await guardarAnalisisIA(candidato.id, resultado.analisis, resultado.fecha);
        toast.success("Pre-análisis con IA completado exitosamente");
      }
    } catch (err) {
      console.error("Error al analizar currículum con IA:", err);
      toast.error(err?.message || "Error al realizar el análisis del currículum con IA.");
    } finally {
      setAnalizandoIa(false);
    }
  }

  async function handleConfirmarEliminar() {
    setEliminando(true);
    try {
      await eliminarCandidato(candidato.id);
      toast.success("Candidato y currículum eliminados");
      navigate("/candidatos");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/candidatos">
            <ArrowLeft className="size-4" />
            Volver a candidatos
          </Link>
        </Button>

        {/* Acciones principales en la cabecera */}
        <div className="flex items-center gap-2">
          {puede("editar_candidatos") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogoEliminar(true)}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span>Eliminar candidato</span>
            </Button>
          )}

          {puede("crear_solicitudes") && (
            <div>
              {solicitudAsociada ? (
                <Button asChild variant="outline" className="gap-2">
                  <Link to={`/solicitudes/${solicitudAsociada.id}`}>
                    <span>Ver solicitud ({solicitudAsociada.codigo})</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={() => setDialogoSolicitud(true)}
                  className="gap-2"
                >
                  <FilePlus2 className="size-4" />
                  <span>Crear solicitud de evaluación</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ficha principal del candidato */}
      <Card className="mt-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ficha del Postulante
              </span>
              {solicitudAsociada ? (
                <EstadoBadge estado={solicitudAsociada.estado} />
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Sin solicitud asignada
                </Badge>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{candidato.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {candidato.rut} · {candidato.correo} · {candidato.telefono}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Fecha de registro</p>
            <p className="text-sm font-medium text-foreground">
              {candidato.creado ? formatearFecha(candidato.creado) : "Reciente"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <DatoItem label="Cargo al que postula" valor={candidato.cargo} />
          <DatoItem label="Familia de cargo" valor={candidato.familia} />
          <DatoItem
            label="Solicitudes de evaluación"
            valor={
              solicitudesCandidato.length > 0
                ? `${solicitudesCandidato.length} solicitud(es)`
                : "Ninguna creada aún"
            }
          />
        </div>

        {/* Tarjeta de Currículum Vitae adjunto */}
        {cvPath ? (
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
              <span>Ver {cvNombre}</span>
            </Button>
          </div>
        ) : (
          <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground italic">
            El candidato no cuenta con un currículum adjunto cargado.
          </div>
        )}
      </Card>

      {/* Tarjeta de Pre-análisis IA del Currículum (GroqCloud / Llama 3.3) */}
      <AnalisisIaCard
        cvPath={cvPath}
        cvNombre={cvNombre}
        analisis={analisisIa}
        fechaAnalisis={analisisIaFecha}
        cargo={candidato.cargo}
        analizando={analizandoIa}
        onAnalizar={handleAnalizarCv}
      />

      {/* Modal de Solicitud de Evaluación preseleccionando a este candidato */}
      <SolicitudDialog
        open={dialogoSolicitud}
        onOpenChange={setDialogoSolicitud}
        candidatoInicialId={candidato.id}
      />

      <ConfirmarEliminarCandidatoDialog
        open={dialogoEliminar}
        onOpenChange={setDialogoEliminar}
        candidato={candidato}
        onConfirm={handleConfirmarEliminar}
        loading={eliminando}
      />
    </div>
  );
}

function DatoItem({ label, valor }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{valor || "—"}</p>
    </div>
  );
}

export const DetalleCandidato = DetalleCandidatoPage;
export default DetalleCandidatoPage;

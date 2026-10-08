import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PSICOLOGOS, type Prioridad } from "@/lib/domain";
import { useDatos } from "@/context/data-context";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SolicitudDialog({ open, onOpenChange }: Props) {
  const { candidatos, crearSolicitud } = useDatos();
  const [candidatoId, setCandidatoId] = useState("");
  const [cargo, setCargo] = useState("");
  const [psicologo, setPsicologo] = useState<string>(PSICOLOGOS[0]!);
  const [prioridad, setPrioridad] = useState<Prioridad>("Media");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setCandidatoId("");
    setCargo("");
    setPsicologo(PSICOLOGOS[0]!);
    setPrioridad("Media");
    setFecha(new Date().toISOString().slice(0, 10));
    setErrores({});
  }, [open]);

  const candidato = candidatos.find((c) => c.id === candidatoId);

  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!candidatoId) e["candidato"] = "Seleccione un candidato.";
    if (!fecha) e["fecha"] = "Indique la fecha de solicitud.";
    setErrores(e);
    if (Object.keys(e).length || !candidato) return;

    crearSolicitud({
      candidatoId,
      cargo: cargo.trim() || candidato.cargo,
      familia: candidato.familia,
      psicologo,
      prioridad,
      fechaSolicitud: fecha,
    });
    toast.success("Solicitud de evaluación creada");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva solicitud de evaluación</DialogTitle>
          <DialogDescription>
            Asigne un psicólogo evaluador al candidato seleccionado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="candidato">Candidato</Label>
            <Select value={candidatoId} onValueChange={setCandidatoId}>
              <SelectTrigger id="candidato" className="w-full">
                <SelectValue placeholder="Seleccione un candidato" />
              </SelectTrigger>
              <SelectContent>
                {candidatos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre} — {c.familia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errores["candidato"] && (
              <p className="text-xs text-destructive">{errores["candidato"]}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cargo">Cargo evaluado</Label>
              <Input
                id="cargo"
                value={cargo}
                placeholder={candidato?.cargo ?? "Cargo"}
                onChange={(e) => setCargo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Familia de cargo</Label>
              <Input value={candidato?.familia ?? ""} readOnly placeholder="Automática" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="psicologo">Psicólogo evaluador</Label>
              <Select value={psicologo} onValueChange={setPsicologo}>
                <SelectTrigger id="psicologo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PSICOLOGOS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select value={prioridad} onValueChange={(v) => setPrioridad(v as Prioridad)}>
                <SelectTrigger id="prioridad" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Alta", "Media", "Baja"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha de solicitud</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            {errores["fecha"] && <p className="text-xs text-destructive">{errores["fecha"]}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear solicitud</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

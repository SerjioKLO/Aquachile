import { cn } from "@/lib/utils";
import type { Dictamen, EstadoSolicitud } from "@/lib/domain";

const estilos: Record<EstadoSolicitud, string> = {
  Pendiente: "bg-pendiente text-pendiente-foreground",
  "En proceso": "bg-proceso text-proceso-foreground",
  Finalizada: "bg-final text-final-foreground",
};

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        estilos[estado],
      )}
    >
      {estado}
    </span>
  );
}

const dictamenEstilos: Record<Dictamen, string> = {
  Recomendado: "bg-final text-final-foreground",
  "Con observaciones": "bg-pendiente text-pendiente-foreground",
  "No recomendado": "bg-destructive/15 text-destructive",
};

export function DictamenBadge({ dictamen }: { dictamen: Dictamen | "" }) {
  if (!dictamen) return <span className="text-xs text-muted-foreground">Sin dictamen</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        dictamenEstilos[dictamen],
      )}
    >
      {dictamen}
    </span>
  );
}

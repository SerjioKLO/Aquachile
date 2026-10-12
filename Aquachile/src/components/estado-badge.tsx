import { cn } from "@/lib/utils";
import type { Dictamen, EstadoSolicitud } from "@/lib/domain";

const estadosConfig: Record<
  EstadoSolicitud,
  { bg: string; text: string; border: string; dot: string }
> = {
  Pendiente: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  "En proceso": {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  Finalizada: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
  },
};

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const conf = estadosConfig[estado] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight",
        conf.bg,
        conf.text,
        conf.border,
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", conf.dot)} aria-hidden="true" />
      <span>{estado}</span>
    </span>
  );
}

const dictamenConfig: Record<
  Dictamen,
  { bg: string; text: string; border: string }
> = {
  Recomendado: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  "Con observaciones": {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  "No recomendado": {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
  },
};

export function DictamenBadge({ dictamen }: { dictamen: Dictamen | "" }) {
  if (!dictamen) {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
        Pendiente
      </span>
    );
  }

  const conf = dictamenConfig[dictamen] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        conf.bg,
        conf.text,
        conf.border,
      )}
    >
      {dictamen}
    </span>
  );
}

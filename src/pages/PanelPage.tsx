import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Clock, Activity, CheckCircle2, UserPlus, FilePlus2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstadoBadge } from "@/components/estado-badge";
import { CandidatoDialog } from "@/components/candidato-dialog";
import { SolicitudDialog } from "@/components/solicitud-dialog";
import { formatearFecha } from "@/lib/domain";

export function PanelPage() {
  const { candidatos, solicitudes, nombreCandidato } = useDatos();
  const { puede } = useAuth();
  const [abrirCandidato, setAbrirCandidato] = useState(false);
  const [abrirSolicitud, setAbrirSolicitud] = useState(false);

  const kpis = useMemo(
    () => [
      { label: "Total Candidatos", valor: candidatos.length, icon: Users },
      {
        label: "Pendientes",
        valor: solicitudes.filter((s) => s.estado === "Pendiente").length,
        icon: Clock,
      },
      {
        label: "En proceso",
        valor: solicitudes.filter((s) => s.estado === "En proceso").length,
        icon: Activity,
      },
      {
        label: "Finalizadas",
        valor: solicitudes.filter((s) => s.estado === "Finalizada").length,
        icon: CheckCircle2,
      },
    ],
    [candidatos, solicitudes],
  );

  const recientes = useMemo(
    () => [...solicitudes].sort((a, b) => b.actualizada.localeCompare(a.actualizada)).slice(0, 6),
    [solicitudes],
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel principal</h1>
          <p className="text-sm text-muted-foreground">
            Estado general del proceso de selección y evaluación psicológica.
          </p>
        </div>
        <div className="flex gap-2">
          {puede("editar_candidatos") && (
            <Button variant="outline" onClick={() => setAbrirCandidato(true)}>
              <UserPlus className="size-4" />
              Registrar candidato
            </Button>
          )}
          {puede("crear_solicitudes") && (
            <Button onClick={() => setAbrirSolicitud(true)}>
              <FilePlus2 className="size-4" />
              Nueva solicitud
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <k.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{k.valor}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Actividad reciente</h2>
          <Link to="/solicitudes" className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Candidato</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Evaluador</TableHead>
              <TableHead>Actualización</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recientes.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <Link
                    to="/solicitudes/$id"
                    params={{ id: s.id }}
                    className="text-primary hover:underline"
                  >
                    {s.codigo}
                  </Link>
                </TableCell>
                <TableCell>{nombreCandidato(s.candidatoId)}</TableCell>
                <TableCell className="text-muted-foreground">{s.cargo}</TableCell>
                <TableCell className="text-muted-foreground">{s.psicologo}</TableCell>
                <TableCell className="tabular-nums">{formatearFecha(s.actualizada)}</TableCell>
                <TableCell>
                  <EstadoBadge estado={s.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CandidatoDialog open={abrirCandidato} onOpenChange={setAbrirCandidato} />
      <SolicitudDialog open={abrirSolicitud} onOpenChange={setAbrirSolicitud} />
    </AppShell>
  );
}

import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FilePlus2, ArrowRight, FilterX } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstadoBadge, DictamenBadge } from "@/components/estado-badge";
import { SolicitudDialog } from "@/components/solicitud-dialog";
import { ESTADOS, FAMILIAS, formatearFecha } from "@/lib/domain";

export function SolicitudesPage() {
  const { solicitudes, nombreCandidato } = useDatos();
  const { puede } = useAuth();
  const [estado, setEstado] = useState("todos");
  const [familia, setFamilia] = useState("todas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [abrir, setAbrir] = useState(false);

  const filtradas = useMemo(
    () =>
      solicitudes
        .filter(
          (s) =>
            (estado === "todos" || s.estado === estado) &&
            (familia === "todas" || s.familia === familia) &&
            (!desde || s.fechaSolicitud >= desde) &&
            (!hasta || s.fechaSolicitud <= hasta),
        )
        .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud)),
    [solicitudes, estado, familia, desde, hasta],
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Solicitudes de evaluación</h1>
          <p className="text-sm text-muted-foreground">
            {filtradas.length} de {solicitudes.length} solicitudes visibles.
          </p>
        </div>
        {puede("crear_solicitudes") && (
          <Button onClick={() => setAbrir(true)}>
            <FilePlus2 className="size-4" />
            Nueva solicitud
          </Button>
        )}
      </div>

      <Card className="mt-6 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Familia de cargo</Label>
            <Select value={familia} onValueChange={setFamilia}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {FAMILIAS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desde">Desde</Label>
            <Input
              id="desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hasta">Hasta</Label>
            <Input
              id="hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEstado("todos");
                setFamilia("todas");
                setDesde("");
                setHasta("");
              }}
            >
              <FilterX className="size-4" />
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Candidato</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Familia</TableHead>
              <TableHead>Evaluador</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Dictamen</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.codigo}</TableCell>
                <TableCell>{nombreCandidato(s.candidatoId)}</TableCell>
                <TableCell className="text-muted-foreground">{s.cargo}</TableCell>
                <TableCell className="text-muted-foreground">{s.familia}</TableCell>
                <TableCell className="text-muted-foreground">{s.psicologo}</TableCell>
                <TableCell className="tabular-nums">{formatearFecha(s.fechaSolicitud)}</TableCell>
                <TableCell>
                  <EstadoBadge estado={s.estado} />
                </TableCell>
                <TableCell>
                  <DictamenBadge dictamen={s.evaluacion.dictamen} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/solicitudes/$id" params={{ id: s.id }}>
                      Abrir
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No hay solicitudes que cumplan los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <SolicitudDialog open={abrir} onOpenChange={setAbrir} />
    </AppShell>
  );
}

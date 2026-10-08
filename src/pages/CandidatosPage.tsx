import { useMemo, useState } from "react";
import { Search, UserPlus, Pencil, Trash2, Eye } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CandidatoDialog } from "@/components/candidato-dialog";
import { FAMILIAS, formatearFecha, type Candidato } from "@/lib/domain";
import { toast } from "sonner";

export function CandidatosPage() {
  const { candidatos, solicitudes, eliminarCandidato } = useDatos();
  const { puede } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [familia, setFamilia] = useState("todas");
  const [editar, setEditar] = useState<Candidato | null>(null);
  const [abrir, setAbrir] = useState(false);
  const [detalle, setDetalle] = useState<Candidato | null>(null);

  const filtrados = useMemo(
    () =>
      candidatos.filter(
        (c) =>
          (familia === "todas" || c.familia === familia) &&
          (c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.rut.toLowerCase().includes(busqueda.toLowerCase())),
      ),
    [candidatos, busqueda, familia],
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de candidatos</h1>
          <p className="text-sm text-muted-foreground">
            {filtrados.length} de {candidatos.length} candidatos visibles.
          </p>
        </div>
        {puede("editar_candidatos") && (
          <Button
            onClick={() => {
              setEditar(null);
              setAbrir(true);
            }}
          >
            <UserPlus className="size-4" />
            Registrar candidato
          </Button>
        )}
      </div>

      <Card className="mt-6 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o RUT…"
              className="pl-9"
            />
          </div>
          <Select value={familia} onValueChange={setFamilia}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las familias de cargo</SelectItem>
              {FAMILIAS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="mt-4 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Familia</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="tabular-nums">{c.rut}</TableCell>
                <TableCell className="font-medium">{c.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{c.correo}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{c.telefono}</TableCell>
                <TableCell>{c.cargo}</TableCell>
                <TableCell className="text-muted-foreground">{c.familia}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ver"
                      onClick={() => setDetalle(c)}
                    >
                      <Eye className="size-4" />
                    </Button>
                    {puede("editar_candidatos") && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar"
                          onClick={() => {
                            setEditar(c);
                            setAbrir(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar"
                          onClick={() => {
                            eliminarCandidato(c.id);
                            toast.success("Candidato eliminado");
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No se encontraron candidatos con los criterios de búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <CandidatoDialog open={abrir} onOpenChange={setAbrir} candidato={editar} />

      <Dialog open={!!detalle} onOpenChange={(v) => !v && setDetalle(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{detalle?.nombre}</DialogTitle>
            <DialogDescription>Ficha resumida del candidato.</DialogDescription>
          </DialogHeader>
          {detalle && (
            <dl className="space-y-2 text-sm">
              <Fila t="RUT" v={detalle.rut} />
              <Fila t="Correo" v={detalle.correo} />
              <Fila t="Teléfono" v={detalle.telefono} />
              <Fila t="Cargo" v={detalle.cargo} />
              <Fila t="Familia de cargo" v={detalle.familia} />
              <Fila t="Fecha de registro" v={formatearFecha(detalle.creado)} />
              <Fila
                t="Solicitudes asociadas"
                v={String(solicitudes.filter((s) => s.candidatoId === detalle.id).length)}
              />
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Fila({ t, v }: { t: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{t}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

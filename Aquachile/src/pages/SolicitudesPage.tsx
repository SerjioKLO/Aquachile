import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { FilePlus2, ArrowRight, FilterX, Search, Briefcase } from "lucide-react";
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
  const { solicitudes, candidatos, nombreCandidato } = useDatos();
  const { puede } = useAuth();
  const [busquedaCandidato, setBusquedaCandidato] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [estado, setEstado] = useState("todos");
  const [familia, setFamilia] = useState("todas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [abrir, setAbrir] = useState(false);

  const filtradas = useMemo(
    () =>
      solicitudes
        .filter((s) => {
          const cand = candidatos.find((c) => c.id === s.candidatoId);
          const candNombre = cand?.nombre?.toLowerCase() || "";
          const candRut = cand?.rut?.toLowerCase() || "";
          const busquedaLimpia = busquedaCandidato.trim().toLowerCase();

          const coincideCandidato =
            !busquedaLimpia ||
            candNombre.includes(busquedaLimpia) ||
            candRut.includes(busquedaLimpia) ||
            s.codigo.toLowerCase().includes(busquedaLimpia);

          const cargoLimpio = filtroCargo.trim().toLowerCase();
          const coincideCargo = !cargoLimpio || s.cargo.toLowerCase().includes(cargoLimpio);

          const coincideEstado = estado === "todos" || s.estado === estado;
          const coincideFamilia = familia === "todas" || s.familia === familia;
          const coincideDesde = !desde || s.fechaSolicitud >= desde;
          const coincideHasta = !hasta || s.fechaSolicitud <= hasta;

          return (
            coincideCandidato &&
            coincideCargo &&
            coincideEstado &&
            coincideFamilia &&
            coincideDesde &&
            coincideHasta
          );
        })
        .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud)),
    [solicitudes, candidatos, busquedaCandidato, filtroCargo, estado, familia, desde, hasta],
  );

  function limpiarFiltros() {
    setBusquedaCandidato("");
    setFiltroCargo("");
    setEstado("todos");
    setFamilia("todas");
    setDesde("");
    setHasta("");
  }

  const tieneFiltrosActivos =
    Boolean(busquedaCandidato) ||
    Boolean(filtroCargo) ||
    estado !== "todos" ||
    familia !== "todas" ||
    Boolean(desde) ||
    Boolean(hasta);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Solicitudes de evaluación</h1>
          <p className="text-sm text-muted-foreground">
            {filtradas.length} de {solicitudes.length} solicitudes visibles según los criterios de
            búsqueda.
          </p>
        </div>
        {puede("crear_solicitudes") && (
          <Button onClick={() => setAbrir(true)}>
            <FilePlus2 className="size-4" />
            Nueva solicitud
          </Button>
        )}
      </div>

      {/* Panel de Búsqueda y Filtros Multifacéticos (RF07) */}
      <Card className="mt-6 p-4">
        <div className="space-y-4">
          {/* Fila 1: Búsqueda textual de Candidato y Cargo específico */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="busqueda-candidato">
                Buscar por Candidato (Nombre, RUT o Código)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="busqueda-candidato"
                  placeholder="Ej: María Aguilar, 12.345, SOL-1001..."
                  value={busquedaCandidato}
                  onChange={(e) => setBusquedaCandidato(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filtro-cargo">Filtrar por Cargo Específico</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filtro-cargo"
                  placeholder="Ej: Supervisor, Backend, Analista..."
                  value={filtroCargo}
                  onChange={(e) => setFiltroCargo(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Filtros de Estado, Familia de Cargo y Rango de Fechas */}
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
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
                  <SelectItem value="todas">Todas las familias</SelectItem>
                  {FAMILIAS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desde">Fecha Desde</Label>
              <Input
                id="desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hasta">Fecha Hasta</Label>
              <Input
                id="hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant={tieneFiltrosActivos ? "secondary" : "outline"}
                className="w-full gap-2"
                onClick={limpiarFiltros}
              >
                <FilterX className="size-4" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla de Resultados */}
      <Card className="mt-4 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Candidato</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Familia</TableHead>
              <TableHead>Evaluador Asignado</TableHead>
              <TableHead>Fecha Solicitud</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Dictamen</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium font-mono text-xs">{s.codigo}</TableCell>
                <TableCell className="font-medium">{nombreCandidato(s.candidatoId)}</TableCell>
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
                    <Link to={`/solicitudes/${s.id}`}>
                      Abrir
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  <p className="font-medium">
                    No se encontraron solicitudes con los filtros aplicados.
                  </p>
                  <p className="mt-1 text-xs">
                    Pruebe cambiando o limpiando los criterios de búsqueda (candidato, cargo,
                    estado, familia o fechas).
                  </p>
                  {tieneFiltrosActivos && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                      onClick={limpiarFiltros}
                    >
                      <FilterX className="size-4" />
                      Restablecer todos los filtros
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <SolicitudDialog open={abrir} onOpenChange={setAbrir} />
    </div>
  );
}

export const Solicitudes = SolicitudesPage;
export default SolicitudesPage;

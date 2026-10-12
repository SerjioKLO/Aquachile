import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  Clock,
  Activity,
  CheckCircle2,
  UserPlus,
  FilePlus2,
  Search,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useDatos } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstadoBadge, DictamenBadge } from "@/components/estado-badge";
import { CandidatoDialog } from "@/components/candidato-dialog";
import { SolicitudDialog } from "@/components/solicitud-dialog";
import { formatearFecha } from "@/lib/domain";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Dashboard de Evaluaciones | AquaChile" },
      {
        name: "description",
        content:
          "Panel de control para seguimiento de candidatos y estado de evaluaciones psicolaborales en AquaChile.",
      },
    ],
  }),
  component: Panel,
});

export function Panel() {
  const { candidatos, solicitudes, nombreCandidato } = useDatos();
  const { puede } = useAuth();
  const [abrirCandidato, setAbrirCandidato] = useState(false);
  const [abrirSolicitud, setAbrirSolicitud] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  const totalCandidatos = candidatos.length;
  const pendientes = solicitudes.filter((s) => s.estado === "Pendiente").length;
  const enProceso = solicitudes.filter((s) => s.estado === "En proceso").length;
  const finalizadas = solicitudes.filter((s) => s.estado === "Finalizada").length;
  const totalSolicitudes = solicitudes.length || 1;

  const pctPendientes = Math.round((pendientes / totalSolicitudes) * 100);
  const pctProceso = Math.round((enProceso / totalSolicitudes) * 100);
  const pctFinalizadas = Math.round((finalizadas / totalSolicitudes) * 100);

  const kpis = useMemo(
    () => [
      {
        label: "Total candidatos",
        valor: totalCandidatos,
        icon: Users,
        descripcion: "Postulantes en registro",
      },
      {
        label: "Pendientes",
        valor: pendientes,
        icon: Clock,
        descripcion: "En espera de revisión",
      },
      {
        label: "En proceso",
        valor: enProceso,
        icon: Activity,
        descripcion: "Entrevista o pruebas activas",
      },
      {
        label: "Finalizadas",
        valor: finalizadas,
        icon: CheckCircle2,
        descripcion: "Con dictamen emitido",
      },
    ],
    [totalCandidatos, pendientes, enProceso, finalizadas],
  );

  const recientes = useMemo(() => {
    return [...solicitudes]
      .filter((s) => {
        const nombre = nombreCandidato(s.candidatoId).toLowerCase();
        const texto = busqueda.toLowerCase().trim();
        const coincideBusqueda =
          !texto ||
          nombre.includes(texto) ||
          s.codigo.toLowerCase().includes(texto) ||
          s.cargo.toLowerCase().includes(texto) ||
          s.psicologo.toLowerCase().includes(texto);

        const coincideEstado = filtroEstado === "todos" || s.estado === filtroEstado;
        return coincideBusqueda && coincideEstado;
      })
      .sort((a, b) => b.actualizada.localeCompare(a.actualizada))
      .slice(0, 8);
  }, [solicitudes, busqueda, filtroEstado, nombreCandidato]);

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Cabecera del panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              Evaluaciones psicolaborales
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Estado general de las solicitudes de selección y entrevistas en curso.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {puede("editar_candidatos") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAbrirCandidato(true)}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg h-9 px-3 text-xs font-medium"
              >
                <UserPlus className="size-3.5 mr-1.5 text-slate-500" aria-hidden="true" />
                <span>Registrar candidato</span>
              </Button>
            )}
            {puede("crear_solicitudes") && (
              <Button
                size="sm"
                onClick={() => setAbrirSolicitud(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-9 px-3 text-xs font-medium"
              >
                <FilePlus2 className="size-3.5 mr-1.5" aria-hidden="true" />
                <span>Nueva solicitud</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tarjetas de Indicadores (KPIs) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {k.label}
                </span>
                <k.icon className="size-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 tabular-nums">
                {k.valor}
              </p>
              <p className="text-[11px] text-slate-500">{k.descripcion}</p>
            </div>
          ))}
        </div>

        {/* Barra de progreso de estados */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              Distribución del flujo ({solicitudes.length} solicitudes registradas)
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex">
            <div
              style={{ width: `${pctPendientes}%` }}
              className="bg-amber-400 transition-[width] duration-300"
              title={`Pendientes: ${pendientes} (${pctPendientes}%)`}
            />
            <div
              style={{ width: `${pctProceso}%` }}
              className="bg-sky-500 transition-[width] duration-300"
              title={`En proceso: ${enProceso} (${pctProceso}%)`}
            />
            <div
              style={{ width: `${pctFinalizadas}%` }}
              className="bg-emerald-500 transition-[width] duration-300"
              title={`Finalizadas: ${finalizadas} (${pctFinalizadas}%)`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400" aria-hidden="true" />
              <span>Pendientes: <strong className="text-slate-900 font-medium tabular-nums">{pendientes}</strong> ({pctPendientes}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-500" aria-hidden="true" />
              <span>En proceso: <strong className="text-slate-900 font-medium tabular-nums">{enProceso}</strong> ({pctProceso}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>Finalizadas: <strong className="text-slate-900 font-medium tabular-nums">{finalizadas}</strong> ({pctFinalizadas}%)</span>
            </div>
          </div>
        </div>

        {/* Tabla de Actividad Reciente */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
          
          <div className="border-b border-slate-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Actividad reciente
                </h2>
                <p className="text-xs text-slate-500">
                  Últimas solicitudes actualizadas en la plataforma.
                </p>
              </div>

              <Link
                to="/solicitudes"
                className="text-xs font-medium text-slate-700 hover:text-slate-950 hover:underline flex items-center gap-1"
              >
                <span>Ver todas las solicitudes</span>
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" aria-hidden="true" />
                <Input
                  placeholder="Buscar candidato, código o cargo…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="bg-white border-slate-300 text-xs h-8 pl-8 rounded-md focus-visible:ring-slate-950 focus-visible:border-slate-950"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {[
                  { id: "todos", label: "Todas" },
                  { id: "Pendiente", label: "Pendientes" },
                  { id: "En proceso", label: "En proceso" },
                  { id: "Finalizada", label: "Finalizadas" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroEstado(f.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      filtroEstado === f.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de datos */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200 hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-slate-600 h-9">Código</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 h-9">Candidato</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 h-9">Cargo</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 h-9">Evaluador</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 h-9">Actualizado</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 h-9">Estado</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 h-9">Dictamen</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 h-9 text-right">Ficha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recientes.length > 0 ? (
                  recientes.map((s) => {
                    const nombreCand = nombreCandidato(s.candidatoId);

                    return (
                      <TableRow
                        key={s.id}
                        className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                      >
                        <TableCell className="font-mono text-xs font-medium">
                          <Link
                            to="/solicitudes/$id"
                            params={{ id: s.id }}
                            className="text-slate-900 hover:underline"
                          >
                            {s.codigo}
                          </Link>
                        </TableCell>

                        <TableCell>
                          <span className="font-medium text-slate-900 text-xs block">
                            {nombreCand}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-slate-800 block">
                            {s.cargo}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {s.familia}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs text-slate-600">
                          {s.psicologo}
                        </TableCell>

                        <TableCell className="text-xs text-slate-500 tabular-nums">
                          {formatearFecha(s.actualizada)}
                        </TableCell>

                        <TableCell>
                          <EstadoBadge estado={s.estado} />
                        </TableCell>

                        <TableCell>
                          <DictamenBadge dictamen={s.evaluacion?.dictamen || ""} />
                        </TableCell>

                        <TableCell className="text-right">
                          <Link
                            to="/solicitudes/$id"
                            params={{ id: s.id }}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                          >
                            <span>Ver</span>
                            <ArrowRight className="size-2.5 text-slate-400" aria-hidden="true" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-500">
                      No hay solicitudes que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-slate-100 p-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Mostrando {recientes.length} de {solicitudes.length} registros</span>
            <Link to="/solicitudes" className="font-medium text-slate-700 hover:underline">
              Ir a la lista completa →
            </Link>
          </div>

        </div>

      </div>

      <CandidatoDialog open={abrirCandidato} onOpenChange={setAbrirCandidato} />
      <SolicitudDialog open={abrirSolicitud} onOpenChange={setAbrirSolicitud} />
    </AppShell>
  );
}

import { Link } from "react-router-dom";
import { useState } from "react";
import { ShieldAlert, RotateCcw, Plus, Server, Layers, Database, UserCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useDatos } from "@/context/data-context";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FAMILIAS, ROLES, USUARIOS, type FamiliaCargo } from "@/lib/domain";

export function AdministracionPage() {
  const { puede, rol } = useAuth();
  const {
    cargos,
    psicologos,
    candidatos,
    solicitudes,
    backendConectado,
    restablecerDatosPrueba,
    agregarCargo,
    agregarPsicologo,
    recargarDesdeBackend,
  } = useDatos();

  const [dialogoReset, setDialogoReset] = useState(false);
  const [dialogoCargo, setDialogoCargo] = useState(false);
  const [dialogoEvaluador, setDialogoEvaluador] = useState(false);

  // Form nuevo cargo
  const [nuevoCargoNombre, setNuevoCargoNombre] = useState("");
  const [nuevoCargoFamilia, setNuevoCargoFamilia] = useState<FamiliaCargo>(
    "Operaciones / Producción",
  );
  const [nuevoCargoDesc, setNuevoCargoDesc] = useState("");

  // Form nuevo evaluador
  const [nuevoEvaluadorNombre, setNuevoEvaluadorNombre] = useState("");

  if (!puede("administrar")) {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto my-12">
        <ShieldAlert className="size-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-semibold">Acceso Restringido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El módulo de administración académica está reservado exclusivamente para usuarios con el
          rol <strong>Administrador Académico</strong>. Su rol actual es{" "}
          <strong>{rol || "no identificado"}</strong>.
        </p>
        <Button asChild className="mt-6">
          <Link to="/panel">Volver al panel principal</Link>
        </Button>
      </Card>
    );
  }

  function handleCrearCargo(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoCargoNombre.trim()) return;
    agregarCargo({
      nombre: nuevoCargoNombre.trim(),
      familia: nuevoCargoFamilia,
      descripcion: nuevoCargoDesc.trim() || `Cargo para la familia ${nuevoCargoFamilia}`,
    });
    setNuevoCargoNombre("");
    setNuevoCargoDesc("");
    setDialogoCargo(false);
  }

  function handleCrearEvaluador(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoEvaluadorNombre.trim()) return;
    agregarPsicologo(nuevoEvaluadorNombre.trim());
    setNuevoEvaluadorNombre("");
    setDialogoEvaluador(false);
  }

  function confirmarReset() {
    restablecerDatosPrueba();
    setDialogoReset(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Módulo Académico
            </span>
            <span className="text-xs text-muted-foreground">DSY1104 Full Stack II</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Administración del Sistema</h1>
          <p className="text-sm text-muted-foreground">
            Gestione usuarios ficticios, catálogos institucionales y restablezca los datos del caso
            de prueba AquaChile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => recargarDesdeBackend()}
            className="gap-2"
          >
            <Database className="size-4" />
            Sincronizar API
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDialogoReset(true)}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Restablecer datos de prueba
          </Button>
        </div>
      </div>

      {/* Tarjeta de Estado del Sistema */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Persistencia & Conexión</p>
            <p className="text-base font-semibold mt-1">
              {backendConectado ? "API Spring Boot (MySQL)" : "Local Storage Persistente"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {backendConectado ? "Sincronizado con puerto 8080" : "Persistente ante F5 y recargas"}
            </p>
          </div>
          <div
            className={`flex size-10 items-center justify-center rounded-full ${
              backendConectado ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            <Server className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Registros en Memoria / DB</p>
            <p className="text-base font-semibold mt-1">
              {candidatos.length} Candidatos · {solicitudes.length} Solicitudes
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Semilla base: 12 candidatos y 10 solicitudes
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Database className="size-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Catálogo Activo</p>
            <p className="text-base font-semibold mt-1">
              {FAMILIAS.length} Familias · {cargos.length} Cargos
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {psicologos.length} Psicólogos evaluadores
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Layers className="size-5" />
          </div>
        </Card>
      </div>

      {/* 1. SECCIÓN: Usuarios y Roles Simulados */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              1. Usuarios Ficticios y Roles Simulados
            </h2>
            <p className="text-xs text-muted-foreground">
              Perfiles preconfigurados según la Sección 3.1 y 4.3 del caso de estudio de vinculación
              con AquaChile.
            </p>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario Demo</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Rol Asignado</TableHead>
                <TableHead>Contraseña</TableHead>
                <TableHead>Alcance / Permisos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USUARIOS.map((u) => {
                const rolInfo = ROLES.find((r) => r.id === u.rol);
                return (
                  <TableRow key={u.usuario}>
                    <TableCell className="font-mono font-medium">{u.usuario}</TableCell>
                    <TableCell className="font-medium">{u.nombre}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {rolInfo?.nombre}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">1234</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs">
                      {rolInfo?.descripcion}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* 2. SECCIÓN: Catálogo de Familias y Cargos */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              2. Catálogo de Cargos y Familias
            </h2>
            <p className="text-xs text-muted-foreground">
              Cargos disponibles para postulación y asignación en procesos de selección.
            </p>
          </div>
          <Button size="sm" onClick={() => setDialogoCargo(true)} className="gap-2">
            <Plus className="size-4" />
            Nuevo cargo
          </Button>
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Cargo</TableHead>
                <TableHead>Familia de Cargo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargos.map((cg) => (
                <TableRow key={cg.id}>
                  <TableCell className="font-medium">{cg.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{cg.familia}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{cg.descripcion}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Activo
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* 3. SECCIÓN: Evaluadores Asignables */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              3. Psicólogos Evaluadores Asignables
            </h2>
            <p className="text-xs text-muted-foreground">
              Profesionales disponibles para asignación en el flujo de entrevistas y dictamen.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogoEvaluador(true)}
            className="gap-2"
          >
            <Plus className="size-4" />
            Agregar evaluador
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {psicologos.map((p) => (
            <Card key={p} className="p-4 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium">{p}</p>
                <p className="text-xs text-muted-foreground">Área Reclutamiento</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* DIÁLOGO: Nuevo Cargo */}
      <Dialog open={dialogoCargo} onOpenChange={setDialogoCargo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Cargo</DialogTitle>
            <DialogDescription>
              Añada un cargo al catálogo institucional de selección.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCrearCargo} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre-cargo">Nombre del cargo</Label>
              <Input
                id="nombre-cargo"
                placeholder="Ej: Jefe de Turno Planta"
                value={nuevoCargoNombre}
                onChange={(e) => setNuevoCargoNombre(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="familia-cargo">Familia de cargo</Label>
              <Select
                value={nuevoCargoFamilia}
                onValueChange={(v) => setNuevoCargoFamilia(v as FamiliaCargo)}
              >
                <SelectTrigger id="familia-cargo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAMILIAS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc-cargo">Descripción breve</Label>
              <Input
                id="desc-cargo"
                placeholder="Responsabilidades y perfil básico"
                value={nuevoCargoDesc}
                onChange={(e) => setNuevoCargoDesc(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogoCargo(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar cargo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: Nuevo Evaluador */}
      <Dialog open={dialogoEvaluador} onOpenChange={setDialogoEvaluador}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Psicólogo Evaluador</DialogTitle>
            <DialogDescription>
              Incorpore un evaluador para asignación de entrevistas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCrearEvaluador} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre-evaluador">Nombre completo</Label>
              <Input
                id="nombre-evaluador"
                placeholder="Ej: Ps. Valentina Morales"
                value={nuevoEvaluadorNombre}
                onChange={(e) => setNuevoEvaluadorNombre(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogoEvaluador(false)}>
                Cancelar
              </Button>
              <Button type="submit">Agregar evaluador</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: Confirmación Reset Demostración */}
      <Dialog open={dialogoReset} onOpenChange={setDialogoReset}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Restablecer datos de prueba iniciales?</DialogTitle>
            <DialogDescription>
              Esta acción reiniciará los candidatos y solicitudes al estado semilla del caso
              académico (12 candidatos y 10 solicitudes de prueba), permitiendo una demostración
              limpia ante evaluadores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogoReset(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarReset}>
              Sí, restablecer datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Administracion = AdministracionPage;
export default AdministracionPage;

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, FileText, LogIn, RotateCcw, Upload } from "lucide-react";
import fondoImg from "@/assets/fondo.jpg";
import { FAMILIAS, type FamiliaCargo } from "@/lib/domain";
import { useDatos } from "@/context/data-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const vacio = {
  nombre: "",
  correo: "",
  telefono: "",
  familia: "" as FamiliaCargo | "",
  cargo: "",
};

export function PostulacionPage() {
  const { guardarCandidato } = useDatos();
  const [form, setForm] = useState(vacio);
  const [cvNombre, setCvNombre] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviado, setEnviado] = useState<{ nombre: string; cargo: string } | null>(null);

  const set = (k: keyof typeof vacio, v: string) => setForm((f) => ({ ...f, [k]: v as never }));

  function validar() {
    const e: Record<string, string> = {};
    if (form.nombre.trim().length < 5)
      e["nombre"] = "Ingrese nombre y apellido (mín. 5 caracteres).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.correo.trim()))
      e["correo"] = "Ingrese un correo electrónico válido.";
    if (!/^\d{8,12}$/.test(form.telefono.replace(/\D/g, "")))
      e["telefono"] = "El teléfono debe tener entre 8 y 12 dígitos. Ej: +56 9 1234 5678";
    if (!form.familia) e["familia"] = "Seleccione una familia del cargo.";
    if (form.cargo.trim().length < 3) e["cargo"] = "Indique el cargo al que postula.";
    if (!cvNombre) e["cv"] = "Adjunte su currículum en PDF o Word.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validar()) return;
    guardarCandidato({
      rut: "",
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      cargo: form.cargo.trim(),
      familia: form.familia as FamiliaCargo,
    });
    setEnviado({ nombre: form.nombre.trim(), cargo: form.cargo.trim() });
  }

  function reiniciar() {
    setForm(vacio);
    setCvNombre("");
    setErrores({});
    setEnviado(null);
  }

  return (
    <div className="relative min-h-screen w-full">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${fondoImg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background/80 backdrop-blur-[2px]" />

      <div className="absolute top-4 right-4 z-20">
        <Link
          to="/login"
          className="flex items-center gap-2 rounded-full border border-border bg-foreground/70 px-4 py-2 text-sm font-medium text-background shadow-lg backdrop-blur transition-all hover:scale-105 hover:bg-foreground/80"
        >
          <LogIn className="size-4" />
          <span>Acceso Evaluadores</span>
        </Link>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 py-16 sm:p-6">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border-t-8 border-primary bg-card shadow-2xl">
          {!enviado ? (
            <form onSubmit={enviar} noValidate className="space-y-5 p-6 sm:p-10">
              <div className="border-b border-border pb-5">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Postulación de Empleo
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Completa tus datos para postular a AquaChile. Los campos con{" "}
                  <span className="font-semibold text-destructive">*</span> son obligatorios.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nombre">
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Juan Pérez"
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  aria-invalid={!!errores["nombre"]}
                />
                {errores["nombre"] && (
                  <p className="text-xs text-destructive">{errores["nombre"]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="correo">
                  Correo electrónico <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={form.correo}
                  onChange={(e) => set("correo", e.target.value)}
                  aria-invalid={!!errores["correo"]}
                />
                {errores["correo"] && (
                  <p className="text-xs text-destructive">{errores["correo"]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono">
                  Teléfono de contacto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  aria-invalid={!!errores["telefono"]}
                />
                {errores["telefono"] && (
                  <p className="text-xs text-destructive">{errores["telefono"]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="familia">
                  Familia del cargo <span className="text-destructive">*</span>
                </Label>
                <Select value={form.familia} onValueChange={(v) => set("familia", v)}>
                  <SelectTrigger
                    id="familia"
                    className="w-full"
                    aria-invalid={!!errores["familia"]}
                  >
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAMILIAS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errores["familia"] && (
                  <p className="text-xs text-destructive">{errores["familia"]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cargo">
                  Cargo al que postula <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cargo"
                  placeholder="Ej: Analista de Sistemas"
                  value={form.cargo}
                  onChange={(e) => set("cargo", e.target.value)}
                  aria-invalid={!!errores["cargo"]}
                />
                {errores["cargo"] && <p className="text-xs text-destructive">{errores["cargo"]}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cv">
                  Adjuntar Curriculum Vitae (PDF o Word) <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="cv"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
                  >
                    <Upload className="size-4 text-muted-foreground" />
                    <span>Añadir archivo</span>
                    <input
                      id="cv"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setCvNombre(e.target.files?.[0]?.name ?? "")}
                    />
                  </label>
                  <span className="flex max-w-xs items-center gap-1 truncate text-xs text-muted-foreground">
                    {cvNombre && <FileText className="size-3.5 shrink-0 text-primary" />}
                    {cvNombre || "Ningún archivo seleccionado"}
                  </span>
                </div>
                {errores["cv"] && <p className="text-xs text-destructive">{errores["cv"]}</p>}
              </div>

              <Button type="submit" className="w-full">
                Enviar postulación
              </Button>
            </form>
          ) : (
            <div className="space-y-5 p-10 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-final text-final-foreground">
                <CheckCircle2 className="size-10" />
              </div>
              <h2 className="text-2xl font-bold">¡Se ha registrado tu respuesta!</h2>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Gracias por postular, <strong className="text-foreground">{enviado.nombre}</strong>.
                Hemos recibido tus antecedentes para la vacante de{" "}
                <strong className="text-foreground">{enviado.cargo}</strong>.
              </p>
              <Button variant="link" onClick={reiniciar} className="gap-2">
                <RotateCcw className="size-4" />
                Enviar otra postulación
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

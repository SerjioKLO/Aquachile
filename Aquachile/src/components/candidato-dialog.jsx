import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { FAMILIAS } from "@/lib/domain";
import { useDatos } from "@/context/data-context";
import { toast } from "sonner";
const vacio = {
  nombre: "",
  rut: "",
  correo: "",
  telefono: "",
  cargo: "",
  familia: "Ventas / Comercial"
};
export function CandidatoDialog({ open, onOpenChange, candidato }) {
  const { guardarCandidato, candidatos } = useDatos();
  const [form, setForm] = useState(vacio);
  const [errores, setErrores] = useState({});
  useEffect(() => {
    if (!open) return;
    setErrores({});
    setForm(
      candidato ? {
        nombre: candidato.nombre,
        rut: candidato.rut,
        correo: candidato.correo,
        telefono: candidato.telefono,
        cargo: candidato.cargo,
        familia: candidato.familia
      } : vacio
    );
  }, [open, candidato]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function validar() {
    const e = {};
    if (form.nombre.trim().length < 5)
      e["nombre"] = "Ingrese nombre y apellido (m\xEDn. 5 caracteres).";
    if (!/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(form.rut.trim()))
      e["rut"] = "Formato de RUT inv\xE1lido. Ejemplo: 12.345.678-9";
    else if (candidatos.some(
      (c) => c.rut.toLowerCase() === form.rut.trim().toLowerCase() && c.id !== candidato?.id
    ))
      e["rut"] = "Ya existe un candidato con este RUT.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.correo.trim()))
      e["correo"] = "Ingrese un correo electr\xF3nico v\xE1lido.";
    if (!/^\d{8,11}$/.test(form.telefono.trim()))
      e["telefono"] = "El tel\xE9fono debe tener entre 8 y 11 d\xEDgitos.";
    if (form.cargo.trim().length < 3) e["cargo"] = "Indique el cargo al que postula.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }
  function enviar(ev) {
    ev.preventDefault();
    if (!validar()) return;
    guardarCandidato({
      ...candidato ? { id: candidato.id } : {},
      nombre: form.nombre.trim(),
      rut: form.rut.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      cargo: form.cargo.trim(),
      familia: form.familia
    });
    toast.success(candidato ? "Candidato actualizado" : "Candidato registrado");
    onOpenChange(false);
  }
  const campo = (id, label, placeholder, type = "text") => <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
    id={id}
    type={type}
    value={form[id]}
    placeholder={placeholder}
    onChange={(e) => set(id, e.target.value)}
    aria-invalid={!!errores[id]}
  />
      {errores[id] && <p className="text-xs text-destructive">{errores[id]}</p>}
    </div>;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{candidato ? "Editar candidato" : "Registrar candidato"}</DialogTitle>
          <DialogDescription>
            Complete los datos del postulante. Todos los campos son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={enviar} className="space-y-4">
          {campo("nombre", "Nombre completo", "Ej: Camila Torres R\xEDos")}
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("rut", "RUT", "12.345.678-9")}
            {campo("telefono", "Tel\xE9fono", "912345678")}
          </div>
          {campo("correo", "Correo electr\xF3nico", "nombre@correo.cl", "email")}
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("cargo", "Cargo al que postula", "Ej: Analista Contable")}
            <div className="space-y-1.5">
              <Label htmlFor="familia">Familia de cargo</Label>
              <Select value={form.familia} onValueChange={(v) => set("familia", v)}>
                <SelectTrigger id="familia" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAMILIAS.map((f) => <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{candidato ? "Guardar cambios" : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
}

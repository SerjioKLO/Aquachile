import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { useState, type DragEvent } from "react";
import {
  CheckCircle2,
  FileText,
  LogIn,
  RotateCcw,
  Upload,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  X,
  ArrowRight,
} from "lucide-react";
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

const formVacio = {
  nombre: "",
  rut: "",
  correo: "",
  telefono: "",
  familia: "" as FamiliaCargo | "",
  cargo: "",
};

function formatearRut(valor: string): string {
  const limpio = valor
    .replace(/[^0-9kK]/g, "")
    .toUpperCase()
    .slice(0, 9);
  if (limpio.length <= 1) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv}`;
}

interface FormErrores {
  nombre?: string;
  rut?: string;
  correo?: string;
  telefono?: string;
  familia?: string;
  cargo?: string;
  cv?: string;
}

export function PostulacionPage() {
  const { guardarCandidato } = useDatos();
  const [form, setForm] = useState(formVacio);
  const [cvArchivo, setCvArchivo] = useState<{ nombre: string; tamano: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errores, setErrores] = useState<FormErrores>({});
  const [enviado, setEnviado] = useState<{
    nombre: string;
    cargo: string;
    rut: string;
    fecha: string;
  } | null>(null);

  const [cargando, setCargando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const setCampo = (k: keyof typeof formVacio, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v as never }));

  function procesarArchivo(archivo?: File) {
    if (!archivo) return;
    const extension = archivo.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(extension || "")) {
      setErrores((prev) => ({
        ...prev,
        cv: "El formato debe ser PDF o Word (.docx, .doc).",
      }));
      return;
    }

    const tamanoMB = (archivo.size / (1024 * 1024)).toFixed(1);
    setCvArchivo({ nombre: archivo.name, tamano: `${tamanoMB} MB` });
    setErrores((prev) => {
      const nuevo = { ...prev };
      delete nuevo.cv;
      return nuevo;
    });
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const archivo = e.dataTransfer.files?.[0];
    procesarArchivo(archivo);
  }

  function validar(): boolean {
    const e: FormErrores = {};
    if (form.nombre.trim().length < 5) {
      e.nombre = "Ingrese nombre y apellido completo (mínimo 5 caracteres).";
    }
    if (!/^\d{1,2}\.\d{3}\.\d{3}-[\dK]$/.test(form.rut)) {
      e.rut = "Ingrese un RUT válido. Ejemplo: 12.345.678-9";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.correo.trim())) {
      e.correo = "Ingrese una dirección de correo electrónico válida.";
    }
    if (!/^\d{8,12}$/.test(form.telefono.replace(/\D/g, ""))) {
      e.telefono = "Ingrese un teléfono de contacto válido (ej: +56 9 1234 5678).";
    }
    if (!form.familia) {
      e.familia = "Seleccione el área del cargo.";
    }
    if (form.cargo.trim().length < 3) {
      e.cargo = "Especifique el cargo al que postula.";
    }
    if (!cvArchivo) {
      e.cv = "Debe adjuntar su currículum vitae en formato PDF o Word.";
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validar()) return;

    setCargando(true);
    setErrorEnvio(null);

    try {
      // Inserción en la tabla Candidato de Supabase mapeando exactamente las columnas
      let { error } = await supabase.from("Candidato").insert([
        {
          Rut: form.rut,
          Nombre_Completo: form.nombre.trim(),
          Correo: form.correo.trim(),
          Telefono: form.telefono.trim(),
          Cargo: form.cargo.trim(),
          Familia: form.familia,
        },
      ]);

      // Si la base de datos PostgreSQL/Supabase creó la tabla o columnas en minúsculas (sin comillas en DDL),
      // PostgREST devuelve PGRST205 o PGRST204. Se provee fallback automático a minúsculas:
      if (
        error &&
        (error.code === "PGRST205" ||
          error.code === "PGRST204" ||
          error.message?.includes("schema cache") ||
          error.message?.includes("candidato"))
      ) {
        const fallbackRes = await supabase.from("candidato").insert([
          {
            rut: form.rut,
            nombre_completo: form.nombre.trim(),
            correo: form.correo.trim(),
            telefono: form.telefono.trim(),
            cargo: form.cargo.trim(),
            familia: form.familia,
          },
        ]);
        error = fallbackRes.error;
      }

      if (error) {
        console.error("Error al registrar en Supabase:", error.message);
        setErrorEnvio("Hubo un problema al registrar tu postulación. Inténtalo de nuevo.");
        return;
      }

      // Sincronización con el contexto local
      guardarCandidato({
        rut: form.rut,
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        cargo: form.cargo.trim(),
        familia: form.familia as FamiliaCargo,
      });

      setEnviado({
        nombre: form.nombre.trim(),
        cargo: form.cargo.trim(),
        rut: form.rut,
        fecha: new Date().toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      });
    } catch (err) {
      console.error("Error de conexión:", err);
      setErrorEnvio("Error de conexión con el servidor. Verifica tu conexión a internet.");
    } finally {
      setCargando(false);
    }
  }

  function handleReset() {
    setForm(formVacio);
    setCvArchivo(null);
    setErrores({});
    setEnviado(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Header institucional limpio */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-950">
                AquaChile
              </span>
              <span className="text-xs font-medium text-slate-500 border-l border-slate-300 pl-2">
                Trabaja con nosotros
              </span>
            </Link>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogIn className="size-3.5 text-slate-500" aria-hidden="true" />
            <span>Acceso evaluadores</span>
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!enviado ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            {/* Columna informativa izquierda */}
            <div className="space-y-6 lg:col-span-5">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl text-balance">
                  Postulación a vacantes laborales
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Completa este formulario para postular a las oportunidades de trabajo de AquaChile
                  en las regiones de Los Lagos, Aysén y Magallanes.
                </p>
              </div>

              {/* Fotografía de contexto real */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs">
                <img
                  src={fondoImg}
                  alt="Instalaciones marítimas y paisajes del sur de Chile"
                  className="h-44 w-full object-cover"
                  loading="lazy"
                  width={600}
                  height={176}
                />
                <div className="p-3.5 bg-white border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <MapPin className="size-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                    <span>Operaciones en el sur austral de Chile</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Centros de cultivo, plantas de proceso y oficinas en Puerto Montt, Chiloé, Aysén
                    y Punta Arenas.
                  </p>
                </div>
              </div>

              {/* Información sobre el proceso */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sobre el proceso de selección
                </h2>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Building2
                      className="size-4 text-slate-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>
                      Revisión de antecedentes por parte del equipo de selección de personas.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="size-4 text-slate-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Contacto telefónico o por correo si tu perfil califica para entrevista.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck
                      className="size-4 text-slate-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>Evaluación psicolaboral con psicólogos evaluadores acreditados.</span>
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Tus datos personales y currículum son tratados de forma confidencial conforme a la
                legislación chilena de protección de datos personales.
              </p>
            </div>

            {/* Columna derecha: Formulario */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Sección 1: Datos Personales */}
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <h2 className="text-sm font-semibold text-slate-900">
                        1. Identificación personal
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="nombre" className="text-xs font-medium text-slate-700">
                          Nombre completo <span className="text-rose-600">*</span>
                        </Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          autoComplete="name"
                          placeholder="Ej: Carolina Andrea Muñoz Silva"
                          value={form.nombre}
                          onChange={(e) => setCampo("nombre", e.target.value)}
                          aria-invalid={!!errores.nombre}
                          className="bg-white border-slate-300 text-slate-900 text-sm h-10 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errores.nombre && (
                          <p className="text-xs text-rose-600">{errores.nombre}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="rut" className="text-xs font-medium text-slate-700">
                          RUT <span className="text-rose-600">*</span>
                        </Label>
                        <Input
                          id="rut"
                          name="rut"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder="12.345.678-9"
                          value={form.rut}
                          onChange={(e) => setCampo("rut", formatearRut(e.target.value))}
                          aria-invalid={!!errores.rut}
                          className="bg-white border-slate-300 text-slate-900 text-sm h-10 font-mono focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errores.rut && <p className="text-xs text-rose-600">{errores.rut}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="telefono" className="text-xs font-medium text-slate-700">
                          Teléfono de contacto <span className="text-rose-600">*</span>
                        </Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+56 9 1234 5678"
                          value={form.telefono}
                          onChange={(e) => setCampo("telefono", e.target.value)}
                          aria-invalid={!!errores.telefono}
                          className="bg-white border-slate-300 text-slate-900 text-sm h-10 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errores.telefono && (
                          <p className="text-xs text-rose-600">{errores.telefono}</p>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="correo" className="text-xs font-medium text-slate-700">
                          Correo electrónico <span className="text-rose-600">*</span>
                        </Label>
                        <Input
                          id="correo"
                          name="correo"
                          type="email"
                          autoComplete="email"
                          spellCheck={false}
                          placeholder="ejemplo@correo.cl"
                          value={form.correo}
                          onChange={(e) => setCampo("correo", e.target.value)}
                          aria-invalid={!!errores.correo}
                          className="bg-white border-slate-300 text-slate-900 text-sm h-10 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errores.correo && (
                          <p className="text-xs text-rose-600">{errores.correo}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Cargo y Área */}
                  <div className="space-y-4 pt-2">
                    <div className="border-b border-slate-100 pb-2">
                      <h2 className="text-sm font-semibold text-slate-900">
                        2. Cargo y área de postulación
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="familia" className="text-xs font-medium text-slate-700">
                          Familia del cargo <span className="text-rose-600">*</span>
                        </Label>
                        <Select
                          value={form.familia}
                          onValueChange={(val) => setCampo("familia", val)}
                        >
                          <SelectTrigger
                            id="familia"
                            className="bg-white border-slate-300 text-slate-900 text-sm h-10 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                            aria-invalid={!!errores.familia}
                          >
                            <SelectValue placeholder="Selecciona un área" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200">
                            {FAMILIAS.map((fam) => (
                              <SelectItem key={fam} value={fam} className="text-slate-800">
                                {fam}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errores.familia && (
                          <p className="text-xs text-rose-600">{errores.familia}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="cargo" className="text-xs font-medium text-slate-700">
                          Cargo específico <span className="text-rose-600">*</span>
                        </Label>
                        <Input
                          id="cargo"
                          name="cargo"
                          autoComplete="off"
                          placeholder="Ej: Asistente de Operaciones"
                          value={form.cargo}
                          onChange={(e) => setCampo("cargo", e.target.value)}
                          aria-invalid={!!errores.cargo}
                          className="bg-white border-slate-300 text-slate-900 text-sm h-10 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errores.cargo && <p className="text-xs text-rose-600">{errores.cargo}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Sección 3: CV Dropzone accesible */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <Label htmlFor="cv-input" className="text-sm font-semibold text-slate-900">
                        3. Currículum Vitae <span className="text-rose-600">*</span>
                      </Label>
                      <span className="text-[11px] text-slate-500">PDF o Word, máx. 15 MB</span>
                    </div>

                    {!cvArchivo ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                          isDragging
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"
                        }`}
                      >
                        <input
                          id="cv-input"
                          name="cv"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="sr-only"
                          onChange={(e) => procesarArchivo(e.target.files?.[0])}
                        />
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="size-6 text-slate-400" aria-hidden="true" />
                          <div className="text-xs text-slate-600">
                            <label
                              htmlFor="cv-input"
                              className="font-semibold text-slate-900 underline underline-offset-2 cursor-pointer hover:text-slate-700"
                            >
                              Selecciona un archivo
                            </label>{" "}
                            o arrástralo hasta aquí
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Formatos admitidos: .pdf, .docx, .doc
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="size-5 text-slate-600 shrink-0" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">
                              {cvArchivo.nombre}
                            </p>
                            <p className="text-[11px] text-slate-500">{cvArchivo.tamano}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCvArchivo(null)}
                          className="rounded p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-200 transition-colors"
                          aria-label="Quitar archivo adjunto"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    {errores.cv && <p className="text-xs text-rose-600">{errores.cv}</p>}
                  </div>

                  {/* Mensaje visual de error si falla la inserción en Supabase */}
                  {errorEnvio && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      {errorEnvio}
                    </div>
                  )}

                  {/* Botón de envío con estado deshabilitado/cargando */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={cargando}
                      className="w-full h-11 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      <span>{cargando ? "Guardando postulación..." : "Enviar postulación"}</span>
                      {!cargando && <ArrowRight className="size-4 ml-1.5" aria-hidden="true" />}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Confirmación de éxito */
          <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-5">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-950">
                Postulación registrada correctamente
              </h1>
              <p className="text-xs text-slate-600">
                Hemos recibido los antecedentes de <strong>{enviado.nombre}</strong> para la vacante
                de <strong>{enviado.cargo}</strong>.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">RUT registrado:</span>
                <span className="font-mono font-medium text-slate-900">{enviado.rut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de envío:</span>
                <span className="text-slate-900">{enviado.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado inicial:</span>
                <span className="font-medium text-amber-700">En revisión inicial</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              El equipo de selección revisará tu currículum. Si tu perfil califica, serás contactado
              para coordinar la evaluación psicolaboral.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs"
              >
                <RotateCcw className="size-3.5 mr-1.5" aria-hidden="true" />
                <span>Enviar otra postulación</span>
              </Button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-medium text-slate-800 transition-colors"
              >
                <span>Acceso para evaluadores</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer sobrio */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} AquaChile S.A. Puerto Montt, Chile.</p>
          <p>Dirección de Personas y Desarrollo Organizacional</p>
        </div>
      </footer>
    </div>
  );
}

export const Postulacion = PostulacionPage;
export default PostulacionPage;

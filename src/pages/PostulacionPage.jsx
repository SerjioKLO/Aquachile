import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
  ArrowRight
} from "lucide-react";
import fondoImg from "@/assets/fondo.jpg";
import { FAMILIAS } from "@/lib/domain";
import { CargoCombobox } from "@/components/cargo-combobox";
import { enviarConfirmacionPostulacion } from "@/services/resendService";
import {
  cargarCatalogoSupabase,
  resolverCargoParaCandidato,
  subirCurriculum
} from "@/lib/supabase-db";
import { useDatos } from "@/context/data-context";
import { Input } from "@/components/ui/input";
import { PhoneInput, validarTelefonoCompleto } from "@/components/phone-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export const ACCEPTED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
export const MAX_CV_SIZE = 5 * 1024 * 1024; // 5 MB

export const postulacionSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(5, "Ingrese nombre y apellido completo (mínimo 5 caracteres)."),
  rut: z
    .string()
    .trim()
    .regex(/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/, "Ingrese un RUT válido. Ejemplo: 12.345.678-9"),
  correo: z
    .string()
    .trim()
    .email("Ingrese una dirección de correo electrónico válida."),
  telefono: z
    .string()
    .trim()
    .refine((val) => !validarTelefonoCompleto(val), {
      message: "Ingrese un número de teléfono válido."
    }),
  familia: z
    .string()
    .min(1, "Seleccione el área del cargo."),
  cargo: z
    .string()
    .trim()
    .min(3, "Especifique el cargo al que postula."),
  cv: z
    .custom(
      (val) => {
        if (!val) return false;
        if (typeof window !== "undefined" && val instanceof File) return true;
        if (typeof val === "object" && typeof val.name === "string" && typeof val.size === "number") return true;
        return false;
      },
      { message: "Debe adjuntar su currículum vitae en formato PDF o Word." }
    )
    .refine((file) => file && file.size <= MAX_CV_SIZE, {
      message: "El archivo no debe superar los 5 MB."
    })
    .refine(
      (file) => {
        if (!file) return false;
        const ext = file.name ? file.name.split(".").pop()?.toLowerCase() : "";
        const validExt = ["pdf", "doc", "docx"].includes(ext);
        const validType = ACCEPTED_CV_TYPES.includes(file.type);
        return validType || validExt;
      },
      { message: "El formato debe ser PDF o Word (.docx, .doc)." }
    )
});

function formatearRut(valor) {
  const limpio = valor.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  if (limpio.length <= 1) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv}`;
}

export function PostulacionPage({ initialValues } = {}) {
  const { guardarCandidato } = useDatos();
  const [catalogo, setCatalogo] = useState({
    familias: FAMILIAS,
    cargosPorFamilia: {}
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(postulacionSchema),
    defaultValues: {
      nombre: "",
      rut: "",
      correo: "",
      telefono: "",
      familia: "",
      cargo: "",
      cv: null,
      ...initialValues
    }
  });

  const formValues = watch();
  const cvArchivo = watch("cv");
  const [isDragging, setIsDragging] = useState(false);
  const [enviado, setEnviado] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState(null);

  useEffect(() => {
    cargarCatalogoSupabase().then((res) => {
      if (res && res.familias?.length > 0) {
        setCatalogo({
          familias: res.familias,
          cargosPorFamilia: res.cargosPorFamilia
        });
      }
    });
  }, []);

  function procesarArchivo(archivo) {
    if (!archivo) return;
    setValue("cv", archivo, { shouldValidate: true });
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const archivo = e.dataTransfer.files?.[0];
    procesarArchivo(archivo);
  }

  async function onSubmit(data) {
    setErrorEnvio(null);

    // 1. Subir currículum a Supabase Storage ANTES de crear el candidato y la solicitud
    let cvSubido = null;
    try {
      cvSubido = await subirCurriculum(data.cv, data.rut);
    } catch (uploadErr) {
      console.error("Error al subir currículum a Supabase Storage:", uploadErr);
      toast.error("Error al subir el currículum. Por favor intenta de nuevo.");
      setErrorEnvio(
        uploadErr?.message || "No se pudo subir el archivo de currículum. Inténtalo de nuevo."
      );
      return; // Evita crear solicitud huérfana
    }

    let insertado = null;
    let guardadoEnNube = false;

    try {
      // 2. Resolver claves foráneas
      const cargoResuelto = await resolverCargoParaCandidato(data.familia, data.cargo);

      // 3. Insertar en tabla public.candidato con el CV adjunto
      const { data: candInsertado, error: candErr } = await supabase
        .from("candidato")
        .insert([
          {
            rut: data.rut,
            nombre_completo: data.nombre.trim(),
            correo: data.correo.trim(),
            telefono: data.telefono.trim(),
            familia_id: cargoResuelto.familia_id,
            cargo_id: cargoResuelto.cargo_id,
            cargo_personalizado: cargoResuelto.cargo_personalizado,
            curriculum_path: cvSubido.path,
            curriculum_nombre: cvSubido.nombreOriginal
          }
        ])
        .select()
        .single();

      if (candErr) {
        if (candErr.code === "23505") {
          // El RUT ya existe en el sistema: actualizar con el nuevo CV y datos
          const { data: candExistente } = await supabase
            .from("candidato")
            .select("id")
            .ilike("rut", data.rut)
            .maybeSingle();

          if (candExistente?.id) {
            insertado = candExistente;
            await supabase
              .from("candidato")
              .update({
                nombre_completo: data.nombre.trim(),
                correo: data.correo.trim(),
                telefono: data.telefono.trim(),
                familia_id: cargoResuelto.familia_id,
                cargo_id: cargoResuelto.cargo_id,
                cargo_personalizado: cargoResuelto.cargo_personalizado,
                curriculum_path: cvSubido.path,
                curriculum_nombre: cvSubido.nombreOriginal
              })
              .eq("id", candExistente.id);
          } else {
            setErrorEnvio("Ya existe una postulación registrada con ese RUT en el sistema.");
            toast.error("Ya existe una postulación con ese RUT.");
            return;
          }
        } else if (candErr.code === "42501") {
          console.warn("RLS bloqueó la inserción en Supabase:", candErr);
          setErrorEnvio(
            "Permiso denegado por Row Level Security (RLS) en Supabase. Asegúrate de ejecutar el script 'supabase_poblacion.sql' en el SQL Editor de Supabase para activar las políticas de acceso."
          );
          toast.error("Error de permisos en el servidor.");
          return;
        } else {
          throw candErr;
        }
      } else {
        insertado = candInsertado;
      }

      guardadoEnNube = true;
    } catch (err) {
      console.warn("Fallo al guardar en Supabase Cloud:", err);
      const msg = err?.message || "";

      if (msg.includes("no existe en la base de datos") || msg.includes("familia")) {
        setErrorEnvio(
          "Las tablas de Supabase aún no han sido pobladas. Por favor ejecuta el script 'supabase_poblacion.sql' en el SQL Editor de tu proyecto de Supabase para cargar el catálogo de familias/cargos y habilitar los permisos."
        );
        toast.error("Error en catálogo de la base de datos.");
        return;
      } else {
        setErrorEnvio(
          err?.message || "Hubo un problema al registrar tu postulación en la base de datos. Inténtalo de nuevo."
        );
        toast.error("Error al registrar postulación.");
        return;
      }
    }

    // 4. Enviar confirmación por correo
    const fechaFormateada = new Date().toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    enviarConfirmacionPostulacion({
      nombre: data.nombre.trim(),
      rut: data.rut,
      cargo: data.cargo.trim(),
      familia: data.familia,
      correo: data.correo.trim(),
      fecha: fechaFormateada
    });

    // 5. Registrar en el contexto (fallback / sincronización local)
    const candIdCtx = insertado?.id ? `c${insertado.id}` : `c${Date.now()}`;
    guardarCandidato({
      id: candIdCtx,
      numericId: insertado?.id,
      yaEnSupabase: guardadoEnNube,
      rut: data.rut,
      nombre: data.nombre.trim(),
      correo: data.correo.trim(),
      telefono: data.telefono.trim(),
      cargo: data.cargo.trim(),
      familia: data.familia,
      curriculum_path: cvSubido.path,
      curriculum_nombre: cvSubido.nombreOriginal
    });

    toast.success("¡Postulación enviada exitosamente!");

    setEnviado({
      nombre: data.nombre.trim(),
      cargo: data.cargo.trim(),
      rut: data.rut,
      fecha: fechaFormateada
    });
  }

  function handleReset() {
    reset({
      nombre: "",
      rut: "",
      correo: "",
      telefono: "",
      familia: "",
      cargo: "",
      cv: null
    });
    setErrorEnvio(null);
    setEnviado(null);
  }
  return <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {
    /* Header institucional limpio */
  }
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

      {
    /* Contenido principal */
  }
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!enviado ? <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
            {
    /* Columna informativa izquierda */
  }
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

              {
    /* Fotografía de contexto real */
  }
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

              {
    /* Información sobre el proceso */
  }
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

            {
    /* Columna derecha: Formulario */
  }
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                  {
    /* Sección 1: Datos Personales */
  }
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
                          autoComplete="name"
                          placeholder="Ej: Carolina Andrea Muñoz Silva"
                          {...register("nombre")}
                          aria-invalid={!!errors.nombre}
                          className="bg-white border-slate-300 text-slate-900 text-sm h-10 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errors.nombre && <p className="text-xs text-rose-600">{errors.nombre.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="rut" className="text-xs font-medium text-slate-700">
                          RUT <span className="text-rose-600">*</span>
                        </Label>
                        <Input
                          id="rut"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder="12.345.678-9"
                          value={formValues.rut || ""}
                          onChange={(e) => setValue("rut", formatearRut(e.target.value), { shouldValidate: true })}
                          aria-invalid={!!errors.rut}
                          className="bg-white border-slate-300 text-slate-900 text-sm h-10 font-mono focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errors.rut && <p className="text-xs text-rose-600">{errors.rut.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="telefono" className="text-xs font-medium text-slate-700">
                          Teléfono de contacto <span className="text-rose-600">*</span>
                        </Label>
                        <PhoneInput
                          id="telefono"
                          name="telefono"
                          value={formValues.telefono || ""}
                          onChange={(val) => setValue("telefono", val, { shouldValidate: true })}
                          disabled={false}
                          error={!!errors.telefono}
                          className="bg-white border-slate-300 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errors.telefono && <p className="text-xs text-rose-600">{errors.telefono.message}</p>}
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="correo" className="text-xs font-medium text-slate-700">
                          Correo electrónico <span className="text-rose-600">*</span>
                        </Label>
                        <Input
                          id="correo"
                          type="email"
                          autoComplete="email"
                          spellCheck={false}
                          placeholder="ejemplo@correo.cl"
                          {...register("correo")}
                          aria-invalid={!!errors.correo}
                          className="bg-white border-slate-300 text-slate-900 text-sm h-10 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                        />
                        {errors.correo && <p className="text-xs text-rose-600">{errors.correo.message}</p>}
                      </div>
                    </div>
                  </div>

                  {
    /* Sección 2: Cargo y Área */
  }
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
                          value={formValues.familia || ""}
                          onValueChange={(val) => {
                            setValue("familia", val, { shouldValidate: true });
                            setValue("cargo", "", { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger
                            id="familia"
                            className="bg-white border-slate-300 text-slate-900 text-sm h-10 focus-visible:ring-slate-950 focus-visible:border-slate-950"
                            aria-invalid={!!errors.familia}
                          >
                            <SelectValue placeholder="Selecciona un área" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200">
                            {(catalogo.familias || FAMILIAS).map((fam) => (
                              <SelectItem key={fam} value={fam} className="text-slate-800">
                                {fam}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.familia && <p className="text-xs text-rose-600">{errors.familia.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="cargo" className="text-xs font-medium text-slate-700">
                          Cargo específico <span className="text-rose-600">*</span>
                        </Label>
                        <CargoCombobox
                          id="cargo"
                          name="cargo"
                          familia={formValues.familia}
                          value={formValues.cargo || ""}
                          onChange={(val) => {
                            setValue("cargo", val, { shouldValidate: true });
                          }}
                          error={errors.cargo?.message}
                        />
                        {errors.cargo && <p className="text-xs text-rose-600">{errors.cargo.message}</p>}
                      </div>
                    </div>
                  </div>

                  {
    /* Sección 3: CV Dropzone accesible */
  }
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <Label htmlFor="cv-input" className="text-sm font-semibold text-slate-900">
                        3. Currículum Vitae <span className="text-rose-600">*</span>
                      </Label>
                      <span className="text-[11px] text-slate-500">PDF o Word, máx. 5 MB</span>
                    </div>

                    {!cvArchivo ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragging ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"}`}
                      >
                        <input
                          id="cv-input"
                          name="cv"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                            Formatos admitidos: .pdf, .docx, .doc (máx. 5 MB)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="size-5 text-slate-600 shrink-0" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">
                              {cvArchivo.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {(cvArchivo.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("cv", null, { shouldValidate: true })}
                          className="rounded p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-200 transition-colors"
                          aria-label="Quitar archivo adjunto"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    {errors.cv && <p className="text-xs text-rose-600">{errors.cv.message}</p>}
                  </div>

                  {
    /* Mensaje visual de error si falla la inserción en Supabase */
  }
                  {errorEnvio && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      {errorEnvio}
                    </div>
                  )}

                  {
    /* Botón de envío con estado deshabilitado/cargando */
  }
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      <span>{isSubmitting ? "Guardando postulación..." : "Enviar postulación"}</span>
                      {!isSubmitting && <ArrowRight className="size-4 ml-1.5" aria-hidden="true" />}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div> : (
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

      {
    /* Footer sobrio */
  }
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {(/* @__PURE__ */ new Date()).getFullYear()} AquaChile S.A. Puerto Montt, Chile.</p>
          <p>Dirección de Personas y Desarrollo Organizacional</p>
        </div>
      </footer>
    </div>;
}
export const Postulacion = PostulacionPage;
export default PostulacionPage;

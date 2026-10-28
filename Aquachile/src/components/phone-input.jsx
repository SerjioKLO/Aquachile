import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PAISES = [
  { iso: "CL", nombre: "Chile", codigo: "+56", bandera: "🇨🇱", mask: "9 XXXX XXXX", placeholder: "9 1234 5678", maxDigits: 9 },
  { iso: "AR", nombre: "Argentina", codigo: "+54", bandera: "🇦🇷", mask: "9 11 XXXX XXXX", placeholder: "9 11 1234 5678", maxDigits: 11 },
  { iso: "PE", nombre: "Perú", codigo: "+51", bandera: "🇵🇪", mask: "9XX XXX XXX", placeholder: "912 345 678", maxDigits: 9 },
  { iso: "CO", nombre: "Colombia", codigo: "+57", bandera: "🇨🇴", mask: "3XX XXX XXXX", placeholder: "312 345 6789", maxDigits: 10 },
  { iso: "BO", nombre: "Bolivia", codigo: "+591", bandera: "🇧🇴", mask: "7XXX XXXX", placeholder: "7123 4567", maxDigits: 8 },
  { iso: "EC", nombre: "Ecuador", codigo: "+593", bandera: "🇪🇨", mask: "9X XXX XXXX", placeholder: "99 123 4567", maxDigits: 9 },
  { iso: "BR", nombre: "Brasil", codigo: "+55", bandera: "🇧🇷", mask: "XX XXXXX XXXX", placeholder: "11 91234 5678", maxDigits: 11 },
  { iso: "MX", nombre: "México", codigo: "+52", bandera: "🇲🇽", mask: "XX XXXX XXXX", placeholder: "55 1234 5678", maxDigits: 10 },
  { iso: "US", nombre: "Estados Unidos / Canadá", codigo: "+1", bandera: "🇺🇸", mask: "XXX XXX XXXX", placeholder: "202 555 0123", maxDigits: 10 },
  { iso: "ES", nombre: "España", codigo: "+34", bandera: "🇪🇸", mask: "XXX XX XX XX", placeholder: "612 34 56 78", maxDigits: 9 }
];

/**
 * Formatea los dígitos locales según el país (con especial énfasis en Chile +56 9 XXXX XXXX)
 */
function formatearNumeroLocal(digitos = "", iso = "CL") {
  if (!digitos) return "";

  if (iso === "CL") {
    // Para Chile: estándar móvil 9 1234 5678
    const lim = digitos.slice(0, 9);
    if (lim.length <= 1) return lim;
    if (lim.length <= 5) return `${lim.slice(0, 1)} ${lim.slice(1)}`;
    return `${lim.slice(0, 1)} ${lim.slice(1, 5)} ${lim.slice(5)}`;
  }

  if (iso === "AR" || iso === "BR") {
    const lim = digitos.slice(0, 11);
    if (lim.length <= 2) return lim;
    if (lim.length <= 7) return `${lim.slice(0, 2)} ${lim.slice(2)}`;
    return `${lim.slice(0, 2)} ${lim.slice(2, 7)} ${lim.slice(7)}`;
  }

  if (iso === "PE" || iso === "ES") {
    const lim = digitos.slice(0, 9);
    if (lim.length <= 3) return lim;
    if (lim.length <= 6) return `${lim.slice(0, 3)} ${lim.slice(3)}`;
    return `${lim.slice(0, 3)} ${lim.slice(3, 6)} ${lim.slice(6)}`;
  }

  // Genérico: bloques de 3 o 4
  const lim = digitos.slice(0, 11);
  if (lim.length <= 3) return lim;
  if (lim.length <= 6) return `${lim.slice(0, 3)} ${lim.slice(3)}`;
  return `${lim.slice(0, 3)} ${lim.slice(3, 6)} ${lim.slice(6)}`;
}

/**
 * Descompone un string que puede venir como "+56 9 1234 5678" o "912345678"
 * en el país correspondiente y el número nacional.
 */
function descomponerTelefono(valor = "") {
  const str = String(valor || "").trim();
  if (!str) return { pais: PAISES[0], digitos: "" };

  // Buscar si coincide con algún código de país conocido
  for (const p of PAISES) {
    if (str.startsWith(p.codigo)) {
      const resto = str.slice(p.codigo.length).replace(/\D/g, "");
      return { pais: p, digitos: resto };
    }
  }

  // Si no empieza con +, pero tiene dígitos
  const soloNum = str.replace(/\D/g, "");
  // Si empieza con 56 (código de Chile sin +)
  if (soloNum.startsWith("56") && soloNum.length > 9) {
    return { pais: PAISES[0], digitos: soloNum.slice(2, 11) };
  }

  // Default: Chile
  return { pais: PAISES[0], digitos: soloNum.slice(0, 9) };
}

/**
 * Componente PhoneInput con Asignador e Identificador de Código Telefónico.
 * Garantiza que siempre se entregue y almacene el número completo con su prefijo internacional (ej: "+56 9 1234 5678").
 */
export function PhoneInput({
  value = "",
  onChange,
  id = "telefono",
  name = "telefono",
  disabled = false,
  error = false,
  className,
  inputClassName
}) {
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const [openDropdown, setOpenDropdown] = useState(false);
  const [pais, setPais] = useState(() => descomponerTelefono(value).pais);
  const [numeroLocal, setNumeroLocal] = useState(() => {
    const { pais: p, digitos } = descomponerTelefono(value);
    return formatearNumeroLocal(digitos, p.iso);
  });

  // Sincronizar si cambia el valor externo
  useEffect(() => {
    const { pais: p, digitos } = descomponerTelefono(value);
    setPais(p);
    setNumeroLocal(formatearNumeroLocal(digitos, p.iso));
  }, [value]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function emitirCambio(nuevoPais, digitosLimpios) {
    if (!digitosLimpios) {
      if (onChange) onChange("");
      return;
    }
    const formato = formatearNumeroLocal(digitosLimpios, nuevoPais.iso);
    const resultado = `${nuevoPais.codigo} ${formato}`.trim();
    if (onChange) onChange(resultado);
  }

  function handleInputChange(e) {
    let raw = e.target.value;

    // Si el usuario pega un número con código (ej: +56 9 1234 5678 o 56912345678)
    if (raw.includes("+") || (raw.startsWith("56") && raw.length > 9)) {
      const desc = descomponerTelefono(raw);
      setPais(desc.pais);
      const formateado = formatearNumeroLocal(desc.digitos, desc.pais.iso);
      setNumeroLocal(formateado);
      emitirCambio(desc.pais, desc.digitos);
      return;
    }

    // Extraer solo dígitos y limitar a la cantidad del país
    let digitos = raw.replace(/\D/g, "").slice(0, pais.maxDigits);
    const formateado = formatearNumeroLocal(digitos, pais.iso);
    setNumeroLocal(formateado);
    emitirCambio(pais, digitos);
  }

  function handleSelectPais(nuevoPais) {
    setPais(nuevoPais);
    setOpenDropdown(false);

    // Re-formatear dígitos existentes con el nuevo país
    const digitos = numeroLocal.replace(/\D/g, "").slice(0, nuevoPais.maxDigits);
    const formateado = formatearNumeroLocal(digitos, nuevoPais.iso);
    setNumeroLocal(formateado);
    emitirCambio(nuevoPais, digitos);

    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full">
      {/* Contenedor principal — misma forma visual que el input de RUT */}
      <div
        className={cn(
          "flex h-10 w-full items-stretch rounded-md border bg-white text-sm ring-offset-white",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-slate-950 focus-within:ring-offset-0",
          error
            ? "border-rose-500 focus-within:ring-rose-500"
            : "border-slate-300",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
      >
        {/* Botón selector de país */}
        <div ref={dropdownRef} className="relative flex items-center self-stretch">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpenDropdown((prev) => !prev)}
            aria-label={`Código de país: ${pais.nombre} (${pais.codigo})`}
            className={cn(
              "flex h-10 w-[60px] items-center justify-center gap-1 border-r border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium rounded-l-md transition-colors hover:bg-slate-100 select-none",
              disabled && "pointer-events-none"
            )}
          >
            <span className="text-xs font-bold tracking-wide text-slate-700">
              {pais.iso}
            </span>
            <ChevronDown
              className={cn(
                "size-3 text-slate-400 transition-transform duration-200",
                openDropdown && "rotate-180"
              )}
            />
          </button>

          {/* Menú desplegable de países */}
          {openDropdown && !disabled && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-slate-900 shadow-xl ring-1 ring-black/5">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Selecciona tu país
              </div>
              <div className="py-1">
                {PAISES.map((p) => {
                  const isSelected = p.iso === pais.iso;
                  return (
                    <button
                      key={p.iso}
                      type="button"
                      onClick={() => handleSelectPais(p)}
                      className={cn(
                        "flex w-full items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                        isSelected
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">{p.bandera}</span>
                        <span className="truncate">{p.nombre}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="font-mono text-xs text-slate-500">{p.codigo}</span>
                        {isSelected && <Check className="size-3.5 text-slate-900" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Input numérico */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          spellCheck={false}
          disabled={disabled}
          placeholder={pais.placeholder}
          value={numeroLocal}
          onChange={handleInputChange}
          className={cn(
            "flex-1 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none font-mono rounded-r-md",
            inputClassName
          )}
        />
      </div>
    </div>
  );
}

/**
 * Validador estricto de número telefónico completo para evitar desfases en la BD.
 * Retorna null si es válido o un string con el mensaje de error.
 */
export function validarTelefonoCompleto(telefono = "") {
  if (!telefono || !telefono.trim()) {
    return "Debe ingresar un número telefónico de contacto.";
  }

  const str = telefono.trim();
  if (!str.startsWith("+")) {
    return "El número debe incluir el código internacional (ej: +56 9 1234 5678).";
  }

  const digitos = str.replace(/\D/g, "");

  // Si es de Chile (+56): prefijo 56 + 9 dígitos móviles = 11 dígitos en total
  if (str.startsWith("+56")) {
    if (digitos.length !== 11) {
      return "El número chileno debe tener exactamente 9 dígitos (ej: +56 9 1234 5678).";
    }
    // Opcionalmente verificar que empiece con 9 (móvil)
    const numeroNacional = digitos.slice(2);
    if (!numeroNacional.startsWith("9") && !numeroNacional.startsWith("2")) {
      return "El número de contacto en Chile debe comenzar con 9 (móvil).";
    }
  } else if (digitos.length < 10 || digitos.length > 15) {
    return "El número internacional debe tener entre 10 y 15 dígitos en total.";
  }

  return null;
}

export default PhoneInput;

import React, { useState, useRef, useEffect, useId } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARGOS_POR_FAMILIA } from "@/data/cargos";

/**
 * Normaliza cadenas para búsqueda insensible a mayúsculas y acentos/tildes
 */
function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Componente híbrido Combobox / Select con búsqueda y texto libre para "Cargo específico".
 *
 * @param {Object} props
 * @param {string} props.value - Valor actual del cargo seleccionado o escrito.
 * @param {function} props.onChange - Callback al cambiar el valor.
 * @param {string} props.familia - Familia de cargo seleccionada actualmente.
 * @param {Array<string>} [props.cargos] - Lista opcional de cargos predefinidos. Si se omite, usa CARGOS_POR_FAMILIA.
 * @param {boolean} [props.disabled] - Si el combobox está deshabilitado.
 * @param {string} [props.id] - ID para el elemento input y accesibilidad.
 * @param {string} [props.name] - Nombre del campo de formulario.
 * @param {string} [props.placeholder] - Placeholder personalizado.
 * @param {boolean|string} [props.error] - Indicador de error para aria-invalid y borde rojo.
 * @param {string} [props.className] - Clases adicionales de contenedor o input.
 */
export function CargoCombobox({
  value = "",
  onChange,
  familia = "",
  cargos,
  disabled: disabledProp,
  id = "cargo",
  name = "cargo",
  placeholder,
  error,
  className
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  const listboxId = useId();

  // El campo se deshabilita si no hay familia seleccionada o si disabledProp es true
  const isDisabled = disabledProp !== undefined ? disabledProp : !familia;

  // Lista de cargos predefinidos para la familia
  const listaPredefinida = React.useMemo(() => {
    if (!familia) return [];
    if (cargos && Array.isArray(cargos) && cargos.length > 0) return cargos;
    return CARGOS_POR_FAMILIA[familia] || [];
  }, [familia, cargos]);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Filtrado insensible a tildes y mayúsculas
  const filtrados = React.useMemo(() => {
    if (!value || !value.trim()) return listaPredefinida;
    const query = normalizarTexto(value);
    return listaPredefinida.filter((c) => normalizarTexto(c).includes(query));
  }, [listaPredefinida, value]);

  // Determinar si el valor escrito coincide exactamente con algún cargo predefinido
  const coincideExacto = React.useMemo(() => {
    const valNorm = normalizarTexto(value);
    return listaPredefinida.some((c) => normalizarTexto(c) === valNorm);
  }, [listaPredefinida, value]);

  // Si el usuario escribió un texto que no coincide exactamente con ninguna opción predefinida,
  // ofrecemos la opción de "Usar texto personalizado"
  const mostrarOpcionCustom = value.trim().length > 0 && !coincideExacto;

  // Cantidad total de elementos navegables en la lista
  const totalItems = filtrados.length + (mostrarOpcionCustom ? 1 : 0);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Asegurar que el elemento destacado esté a la vista al usar flechas del teclado
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Manejar selección de opción
  function handleSelect(opcion) {
    if (onChange) onChange(opcion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  // Manejo de eventos del teclado en el input
  function handleKeyDown(e) {
    if (isDisabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(totalItems - 1);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      }
    } else if (e.key === "Enter") {
      if (isOpen) {
        e.preventDefault(); // Evita que se envíe el formulario si el menú desplegable está abierto
        if (highlightedIndex >= 0 && highlightedIndex < filtrados.length) {
          handleSelect(filtrados[highlightedIndex]);
        } else if (mostrarOpcionCustom && highlightedIndex === filtrados.length) {
          handleSelect(value.trim());
        } else if (value.trim()) {
          handleSelect(value.trim());
        }
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === "Tab") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  // Limpiar valor
  function handleClear(e) {
    e.stopPropagation();
    if (onChange) onChange("");
    inputRef.current?.focus();
    if (!isOpen) setIsOpen(true);
  }

  const placeholderTexto = isDisabled
    ? "Primero selecciona una familia del cargo"
    : placeholder || "Escribe o selecciona un cargo...";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Contenedor del Input */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0
              ? `${listboxId}-opt-${highlightedIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-invalid={!!error}
          disabled={isDisabled}
          placeholder={placeholderTexto}
          value={value}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (!isDisabled) {
              setIsOpen(true);
            }
          }}
          onClick={() => {
            if (!isDisabled && !isOpen) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "w-full h-10 rounded-md border bg-white px-3 py-2 pr-16 text-sm text-slate-900 transition-colors shadow-xs outline-none",
            "placeholder:text-slate-400 focus:border-slate-950 focus:ring-1 focus:ring-slate-950",
            error
              ? "border-rose-500 focus:border-rose-600 focus:ring-rose-600"
              : "border-slate-300",
            isDisabled &&
              "bg-slate-100 text-slate-400 placeholder:text-slate-400 cursor-not-allowed border-slate-200 select-none shadow-none",
            className
          )}
        />

        {/* Botones de acción derecha (Limpiar y Toggle) */}
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {/* Botón limpiar cuando hay valor y no está deshabilitado */}
          {!isDisabled && value && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              aria-label="Limpiar cargo"
              className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}

          {/* Botón chevron para alternar desplegable */}
          <button
            type="button"
            tabIndex={-1}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              if (isOpen) {
                setIsOpen(false);
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
            aria-label={isOpen ? "Cerrar opciones" : "Ver cargos sugeridos"}
            className={cn(
              "p-1.5 rounded-sm text-slate-400 transition-colors",
              !isDisabled && "hover:text-slate-700 hover:bg-slate-100 cursor-pointer",
              isDisabled && "cursor-not-allowed opacity-50"
            )}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* Menú desplegable flotante */}
      {isOpen && !isDisabled && (
        <div
          id={listboxId}
          role="listbox"
          ref={listboxRef}
          aria-label="Sugerencias de cargo específico"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-slate-900 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* Encabezado informativo de la lista */}
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 flex items-center justify-between">
            <span>Cargos sugeridos ({familia})</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {filtrados.length} disponibles
            </span>
          </div>

          {/* Lista de cargos filtrados */}
          {filtrados.length > 0 ? (
            <div className="py-1">
              {filtrados.map((item, index) => {
                const isSelected = item.toLowerCase() === value.trim().toLowerCase();
                const isHighlighted = highlightedIndex === index;

                return (
                  <div
                    key={item}
                    id={`${listboxId}-opt-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(e) => {
                      // Evita pérdida de foco antes del click
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors",
                      isHighlighted
                        ? "bg-slate-100 text-slate-900 font-medium"
                        : "text-slate-700 hover:bg-slate-50",
                      isSelected && "text-slate-900 font-semibold bg-slate-50"
                    )}
                  >
                    <span className="truncate">{item}</span>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-slate-900 ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-500">
              No hay cargos predefinidos que coincidan con &ldquo;
              <span className="font-medium text-slate-700">{value}</span>
              &rdquo;.
            </div>
          )}

          {/* Opción Híbrida: Utilizar el texto personalizado escrito por el usuario */}
          {mostrarOpcionCustom && (
            <div className="border-t border-slate-100 pt-1">
              <div
                id={`${listboxId}-opt-${filtrados.length}`}
                data-index={filtrados.length}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setHighlightedIndex(filtrados.length)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(value.trim());
                }}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-900 transition-colors",
                  highlightedIndex === filtrados.length
                    ? "bg-blue-50 text-blue-900 font-medium"
                    : "hover:bg-slate-50"
                )}
              >
                <div className="flex-1 truncate">
                  <span>Usar: </span>
                  <span className="font-semibold text-slate-900">
                    &ldquo;{value.trim()}&rdquo;
                  </span>
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wide bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  Personalizado
                </span>
              </div>
            </div>
          )}

          {/* Ayuda visual de teclado en el footer */}
          <div className="border-t border-slate-100 px-2.5 py-1 text-[10px] text-slate-500 flex items-center justify-between bg-slate-50/50 rounded-b-md">
            <span>Usa ↑↓ para navegar</span>
            <span>Enter para seleccionar</span>
          </div>
        </div>
      )}
    </div>
  );
}
export default CargoCombobox;


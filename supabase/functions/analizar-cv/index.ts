// Supabase Edge Function — analizar-cv
// Pre-análisis y Match Automático de Currículum con IA (GroqCloud / Llama 3.3)
// Extracción ligera nativa (PDF / DOCX) sin dependencias pesadas de Node

import { createClient } from "npm:@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

declare const Deno: any;

// Headers CORS para solicitudes desde el cliente frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Secuencias de bytes para delimitar streams en archivos PDF
const STREAM_BYTES = [115, 116, 114, 101, 97, 109]; // "stream"
const ENDSTREAM_BYTES = [101, 110, 100, 115, 116, 114, 101, 97, 109]; // "endstream"

/**
 * Busca una subsecuencia de bytes dentro de un Uint8Array.
 */
function findSequence(buffer: Uint8Array, seq: number[], start = 0): number {
  const seqLen = seq.length;
  const max = buffer.length - seqLen;
  for (let i = start; i <= max; i++) {
    let match = true;
    for (let j = 0; j < seqLen; j++) {
      if (buffer[i + j] !== seq[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

/**
 * Descomprime un flujo de bytes usando DecompressionStream nativo del entorno Web/Deno.
 * Prueba primero 'deflate' (ZLIB / FlateDecode RFC 1950) y luego 'deflate-raw' (RFC 1951).
 */
async function descomprimirFlate(data: Uint8Array): Promise<Uint8Array | null> {
  for (const formato of ["deflate", "deflate-raw"] as const) {
    try {
      const stream = new Response(data).body?.pipeThrough(new DecompressionStream(formato));
      if (stream) {
        const ab = await new Response(stream).arrayBuffer();
        return new Uint8Array(ab);
      }
    } catch {
      // Continuar con el siguiente formato
    }
  }
  return null;
}

/**
 * Decodifica secuencias de escape estándar en cadenas literales de PDF (...).
 */
function decodificarStringPdf(str: string): string {
  const decodificado = str.replace(/\\([0-7]{1,3}|[nrtbf()\\])/g, (_, esc) => {
    if (esc === "n") return "\n";
    if (esc === "r") return "\r";
    if (esc === "t") return "\t";
    if (esc === "b") return "\b";
    if (esc === "f") return "\f";
    if (esc === "(") return "(";
    if (esc === ")") return ")";
    if (esc === "\\") return "\\";
    const code = parseInt(esc, 8);
    return isNaN(code) ? "" : String.fromCharCode(code);
  });

  // Manejo de codificación UTF-16BE (BOM 0xFE 0xFF)
  if (
    decodificado.length >= 2 &&
    decodificado.charCodeAt(0) === 0xfe &&
    decodificado.charCodeAt(1) === 0xff
  ) {
    let u16 = "";
    for (let i = 2; i < decodificado.length; i += 2) {
      if (i + 1 < decodificado.length) {
        const code = (decodificado.charCodeAt(i) << 8) | decodificado.charCodeAt(i + 1);
        u16 += String.fromCharCode(code);
      }
    }
    return u16;
  }

  return decodificado;
}

/**
 * Decodifica cadenas hexadecimales de PDF <48656C6C6F>.
 */
function decodificarHexPdf(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  let res = "";
  for (let i = 0; i < clean.length; i += 2) {
    const byte = clean.substring(i, i + 2);
    if (byte.length === 2) {
      const code = parseInt(byte, 16);
      if (!isNaN(code) && code >= 32 && code <= 255) {
        res += String.fromCharCode(code);
      }
    }
  }
  return res;
}

/**
 * Extrae texto de un flujo de contenido de PDF decodificado analizando operadores Tj y TJ.
 */
function extraerTextoDeContenido(contenido: string, salida: string[]): void {
  // 1. Operadores de texto directo: (texto) Tj, (texto) ', (texto) "
  const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(contenido)) !== null) {
    const txt = decodificarStringPdf(match[1]);
    if (txt.trim()) salida.push(txt.trim());
  }

  // 2. Operador de array de texto: [(texto 1) 20 (texto 2)] TJ
  const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(contenido)) !== null) {
    const interior = match[1];
    let linea = "";

    // Cadenas entre paréntesis dentro de TJ
    const strRegex = /\(((?:[^()\\]|\\.)*)\)/g;
    let strM: RegExpExecArray | null;
    while ((strM = strRegex.exec(interior)) !== null) {
      linea += decodificarStringPdf(strM[1]);
    }

    // Cadenas hexadecimales dentro de TJ si no se encontraron paréntesis
    if (!linea.trim()) {
      const hexRegex = /<([0-9a-fA-F\s]+)>/g;
      let hexM: RegExpExecArray | null;
      while ((hexM = hexRegex.exec(interior)) !== null) {
        linea += decodificarHexPdf(hexM[1]);
      }
    }

    if (linea.trim()) salida.push(linea.trim());
  }

  // 3. Cadenas hexadecimales directas: <41717561> Tj
  const hexTjRegex = /<([0-9a-fA-F\s]+)>\s*(?:Tj|'|")/g;
  while ((match = hexTjRegex.exec(contenido)) !== null) {
    const txt = decodificarHexPdf(match[1]);
    if (txt.trim()) salida.push(txt.trim());
  }
}

/**
 * Extrae texto plano de un documento PDF buscando bloques stream...endstream,
 * descomprimiendo los FlateDecode y parseando operadores de texto.
 */
async function extraerTextoPdf(buffer: Uint8Array): Promise<string> {
  const textos: string[] = [];
  let pos = 0;

  while (pos < buffer.length) {
    const streamIdx = findSequence(buffer, STREAM_BYTES, pos);
    if (streamIdx === -1) break;

    // Verificar delimitador antes de 'stream'
    const prevByte = streamIdx > 0 ? buffer[streamIdx - 1] : 32;
    const esDelimPrev = prevByte === 10 || prevByte === 13 || prevByte === 32 || prevByte === 62;

    if (!esDelimPrev) {
      pos = streamIdx + 6;
      continue;
    }

    // Inicio de los datos después de 'stream' y sus saltos de línea (\r\n o \n o \r)
    let dataStart = streamIdx + 6;
    if (dataStart < buffer.length && buffer[dataStart] === 13) dataStart++;
    if (dataStart < buffer.length && buffer[dataStart] === 10) dataStart++;

    // Buscar 'endstream'
    const endstreamIdx = findSequence(buffer, ENDSTREAM_BYTES, dataStart);
    if (endstreamIdx === -1) break;

    // Ajustar fin excluyendo posibles saltos de línea antes de 'endstream'
    let dataEnd = endstreamIdx;
    if (dataEnd > dataStart && buffer[dataEnd - 1] === 10) dataEnd--;
    if (dataEnd > dataStart && buffer[dataEnd - 1] === 13) dataEnd--;

    if (dataEnd > dataStart) {
      const streamSlice = buffer.subarray(dataStart, dataEnd);

      // Revisar diccionario previo para saber si usa /FlateDecode
      const dictStart = Math.max(0, streamIdx - 500);
      const dictHeader = new TextDecoder("latin1").decode(buffer.subarray(dictStart, streamIdx));
      const esFlate = dictHeader.includes("/FlateDecode") || dictHeader.includes("/Fl");

      let streamContenido = "";

      if (esFlate) {
        const decompressed = await descomprimirFlate(streamSlice);
        if (decompressed) {
          streamContenido = new TextDecoder("latin1").decode(decompressed);
        } else {
          streamContenido = new TextDecoder("latin1").decode(streamSlice);
        }
      } else {
        const rawText = new TextDecoder("latin1").decode(streamSlice);
        if (rawText.includes("Tj") || rawText.includes("TJ") || rawText.includes("BT")) {
          streamContenido = rawText;
        } else {
          const decompressed = await descomprimirFlate(streamSlice);
          if (decompressed) {
            streamContenido = new TextDecoder("latin1").decode(decompressed);
          }
        }
      }

      if (streamContenido) {
        extraerTextoDeContenido(streamContenido, textos);
      }
    }

    pos = endstreamIdx + 9;
  }

  // Fallback si no se encontró texto en los streams: buscar en todo el archivo decodificado
  if (textos.length === 0) {
    const fullText = new TextDecoder("latin1").decode(buffer);
    extraerTextoDeContenido(fullText, textos);
  }

  return textos.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Limpia entidades XML estándar.
 */
function limpiarEntidadesXml(texto: string): string {
  return texto
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrae texto de un archivo DOCX leyendo el contenido XML word/document.xml.
 * Utiliza https://esm.sh/jszip@3.10.1 para descomprimir el buffer en memoria.
 */
async function extraerTextoDocx(buffer: Uint8Array): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) return "";

    // Extrae el texto dentro de las etiquetas <w:t> o <w:t ...>...</w:t>
    const partes: string[] = [];
    const regexWt = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/gi;
    let match: RegExpExecArray | null;
    while ((match = regexWt.exec(docXml)) !== null) {
      if (match[1]) {
        partes.push(match[1]);
      }
    }

    let texto = partes.join(" ");
    if (!texto.trim()) {
      // Fallback si la estructura usa otra combinación de etiquetas de párrafo
      texto = docXml.replace(/<\/w:p>/gi, "\n").replace(/<[^>]+>/g, " ");
    }

    return limpiarEntidadesXml(texto);
  } catch (err) {
    console.warn("Fallo al extraer texto de DOCX con JSZip:", err);
    return "";
  }
}

/**
 * Extrae texto según la extensión del archivo y limpia caracteres de control.
 */
async function extraerTextoCV(buffer: Uint8Array, extension: string): Promise<string> {
  const ext = extension.toLowerCase();
  let texto = "";

  if (ext === "pdf") {
    texto = await extraerTextoPdf(buffer);
  } else if (ext === "docx" || ext === "doc") {
    texto = await extraerTextoDocx(buffer);
    if (!texto) {
      // Intento de decodificación de texto plano
      const raw = new TextDecoder("utf-8").decode(buffer);
      if (/[\w\s]{40,}/.test(raw)) {
        texto = raw.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
      }
    }
  } else {
    texto = new TextDecoder("utf-8").decode(buffer);
  }

  // Normalizar espacios y saltos de línea continuos
  return texto.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

Deno.serve(async (req: Request) => {
  // 1. Manejo de CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido. Utilice POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      candidatoId,
      solicitudId,
      curriculumPath: pathInput,
      cargoNombre: cargoInput,
      familiaCargo: familiaInput,
      datosCandidato
    } = body;

    if (!candidatoId && !solicitudId && !pathInput) {
      return new Response(
        JSON.stringify({ error: "Debe proporcionar candidatoId, solicitudId o curriculumPath." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Inicializar cliente Supabase con Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuración de Supabase incompleta en Edge Functions." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let numericCandId: number | null = null;
    let numericSolId: number | null = null;
    let path = pathInput;
    let cargo = cargoInput;
    let familia = familiaInput;
    let candidato = datosCandidato?.nombre || "";
    let rut = datosCandidato?.rut || "";

    // 3. Consultar candidato o solicitud en BD
    if (candidatoId) {
      numericCandId = typeof candidatoId === "string" ? parseInt(candidatoId.replace(/\D/g, ""), 10) : Number(candidatoId);
      if (numericCandId) {
        const { data: candData, error: candErr } = await supabase
          .from("candidato")
          .select(`
            id,
            nombre_completo,
            rut,
            curriculum_path,
            curriculum_nombre,
            cargo:cargo_id ( id, nombre ),
            cargo_personalizado,
            familia_cargo:familia_id ( id, nombre )
          `)
          .eq("id", numericCandId)
          .single();

        if (candErr) {
          console.warn("No se encontró candidato en BD:", candErr);
        } else if (candData) {
          path = path || candData.curriculum_path;
          cargo = cargo || candData.cargo?.nombre || candData.cargo_personalizado || "Cargo no especificado";
          familia = familia || candData.familia_cargo?.nombre || "Sin familia";
          candidato = candidato || candData.nombre_completo || "Candidato";
          rut = rut || candData.rut || "";
        }
      }
    }

    if (solicitudId) {
      numericSolId = typeof solicitudId === "string" ? parseInt(solicitudId.replace(/\D/g, ""), 10) : Number(solicitudId);
      if (numericSolId) {
        const { data: solData, error: solErr } = await supabase
          .from("solicitud_evaluacion")
          .select(`
            id,
            candidato_id,
            curriculum_path,
            curriculum_nombre,
            candidato:candidato_id (
              id,
              nombre_completo,
              rut,
              curriculum_path,
              curriculum_nombre,
              cargo:cargo_id ( id, nombre ),
              cargo_personalizado,
              familia_cargo:familia_id ( id, nombre )
            )
          `)
          .eq("id", numericSolId)
          .single();

        if (solErr) {
          console.warn("No se encontró solicitud en BD:", solErr);
        } else if (solData) {
          if (!numericCandId && solData.candidato_id) {
            numericCandId = solData.candidato_id;
          }
          const c = solData.candidato;
          path = path || solData.curriculum_path || c?.curriculum_path;
          cargo = cargo || c?.cargo?.nombre || c?.cargo_personalizado || "Cargo no especificado";
          familia = familia || c?.familia_cargo?.nombre || "Sin familia";
          candidato = candidato || c?.nombre_completo || "Candidato";
          rut = rut || c?.rut || "";
        }
      }
    }

    if (!path) {
      return new Response(
        JSON.stringify({ error: "El registro no cuenta con un currículum adjunto para analizar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Descargar el archivo desde el bucket privado 'curriculums'
    const { data: fileBlob, error: downloadErr } = await supabase.storage
      .from("curriculums")
      .download(path);

    if (downloadErr || !fileBlob) {
      return new Response(
        JSON.stringify({
          error: `No se pudo descargar el archivo de currículum desde Supabase Storage: ${downloadErr?.message || "Archivo no encontrado."}`
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Extraer texto del documento
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const extension = path.split(".").pop()?.toLowerCase() || "pdf";

    const textoExtraido = await extraerTextoCV(buffer, extension);

    // Validación de texto legible (máx 12.000 caracteres, mínimo 40)
    if (!textoExtraido || textoExtraido.length < 40) {
      return new Response(
        JSON.stringify({
          error: "El archivo no contiene texto legible (posiblemente sea una imagen escaneada sin OCR). Se requiere un documento PDF o Word con texto seleccionable para el pre-análisis con IA."
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textoCV = textoExtraido.slice(0, 12000).trim();

    // 6. Consumir GroqCloud API
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({
          error: "La clave de API de GroqCloud (GROQ_API_KEY) no está configurada en los secretos de Supabase Edge Functions."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const promptSistema = `Eres un Psicólogo Laboral Senior y Evaluador de Selección de AquaChile, empresa líder de la industria acuícola y salmonera en Chile.
Tu misión es realizar un exhaustivo pre-análisis y match de afinidad del currículum vitae de un postulante frente al perfil del cargo al que postula.

Debes responder ÚNICAMENTE con un objeto JSON válido respetando estrictamente esta estructura:
{
  "puntaje_afinidad": <número entero entre 0 y 100 indicando el porcentaje de afinidad técnica y laboral>,
  "nivel_ajuste": "<Alto | Medio | Bajo>",
  "resumen_ejecutivo": [
    "<síntesis ejecutiva punto 1 sobre trayectoria y perfil>",
    "<síntesis ejecutiva punto 2 sobre áreas de especialidad>",
    "<síntesis ejecutiva punto 3 sobre match con la industria o rubro>",
    "<síntesis ejecutiva punto 4 sobre estabilidad y potencial>"
  ],
  "fortalezas_cargo": [
    "<fortaleza clave 1 demostrable en el CV para el cargo>",
    "<fortaleza clave 2>"
  ],
  "brechas_detectadas": [
    "<brecha o conocimiento faltante a profundizar 1>",
    "<brecha o aspecto a verificar 2>"
  ],
  "alertas_tempranas": [
    "<alerta sobre inconsistencias de fechas, vacíos laborales prolongados, o array vacío si no hay alertas>"
  ],
  "preguntas_sugeridas": [
    "<pregunta técnica o conductual 1 recomendada para la entrevista psicológica>",
    "<pregunta 2>",
    "<pregunta 3>"
  ]
}

Criterios de evaluación para AquaChile:
- Evalúa coherencia entre experiencia previa y las exigencias de la familia "${familia || "General"}" y el cargo "${cargo || "General"}".
- Prioriza estabilidad laboral, competencias operativas/técnicas, conocimiento en normativas de seguridad, inocuidad o excelencia operacional si aplica.
- Si detectas vacíos laborales notorios o rotación constante, indícalo con profesionalismo en "alertas_tempranas".
- Redacta en español formal y profesional. No incluyas explicaciones fuera del bloque JSON.`;

    const promptUsuario = `Información del postulante:
- Nombre: ${candidato || "No especificado"}
- RUT: ${rut || "No especificado"}
- Cargo al que postula: ${cargo || "No especificado"}
- Familia de cargo: ${familia || "No especificado"}

Contenido extraído del Currículum Vitae:
"""
${textoCV}
"""

Genera el pre-análisis de afinidad en formato JSON.`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: promptSistema },
          { role: "user", content: promptUsuario }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2048
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Error en respuesta de Groq API:", groqResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `Error al consultar GroqCloud API (${groqResponse.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqData = await groqResponse.json();
    const contenido = groqData.choices?.[0]?.message?.content;

    if (!contenido) {
      return new Response(
        JSON.stringify({ error: "GroqCloud no retornó contenido en la respuesta." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let analisisJson;
    try {
      analisisJson = JSON.parse(contenido);
    } catch (parseErr) {
      console.error("Error al parsear JSON devuelto por Groq:", contenido, parseErr);
      return new Response(
        JSON.stringify({ error: "La respuesta del modelo de IA no tiene un formato JSON válido." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Persistir en Supabase
    const fechaActual = new Date().toISOString();

    // Persistir en candidato si tenemos numericCandId
    if (numericCandId) {
      const { error: updateCandErr } = await supabase
        .from("candidato")
        .update({
          analisis_ia: analisisJson,
          analisis_ia_fecha: fechaActual
        })
        .eq("id", numericCandId);

      if (updateCandErr) {
        console.warn("Advertencia al guardar analisis_ia en public.candidato:", updateCandErr);
      }
    }

    // Persistir también en solicitud si tenemos numericSolId
    if (numericSolId) {
      const { error: updateSolErr } = await supabase
        .from("solicitud_evaluacion")
        .update({
          analisis_ia: analisisJson,
          analisis_ia_fecha: fechaActual
        })
        .eq("id", numericSolId);

      if (updateSolErr) {
        console.warn("Advertencia al guardar analisis_ia en public.solicitud_evaluacion:", updateSolErr);
      }
    }

    // 8. Respuesta al frontend
    return new Response(
      JSON.stringify({
        analisis: analisisJson,
        fecha: fechaActual,
        candidatoId: numericCandId,
        solicitudId: numericSolId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error no controlado en Edge Function analizar-cv:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Ocurrió un error inesperado al procesar el análisis de CV." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

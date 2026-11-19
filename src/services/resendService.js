import { supabase } from "@/lib/supabase";

/**
 * Servicio encargado de invocar el envío de correos mediante Resend
 * a través de la Edge Function de Supabase.
 *
 * @param {Object} datos
 * @param {string} datos.nombre - Nombre del candidato
 * @param {string} datos.rut - RUT del candidato
 * @param {string} datos.cargo - Cargo postulado
 * @param {string} datos.familia - Familia del cargo
 * @param {string} datos.correo - Correo electrónico
 * @param {string} datos.fecha - Fecha legible
 * @returns {Promise<{ ok: boolean, data?: any, error?: any }>}
 */
export async function enviarConfirmacionPostulacion(datos) {
  try {
    const { data, error } = await supabase.functions.invoke("enviar-confirmacion", {
      body: datos,
    });

    if (error) {
      console.warn("Aviso al enviar confirmación con Resend:", error);
      return { ok: false, error };
    }

    return { ok: true, data };
  } catch (err) {
    console.warn("Excepción al contactar el servicio de correo:", err);
    return { ok: false, error: err };
  }
}

/**
 * Servicio encargado de invocar el envío de citación a entrevista por correo
 * @param {Object} datos
 * @param {string} datos.nombre - Nombre del candidato
 * @param {string} datos.rut - RUT del candidato
 * @param {string} datos.cargo - Cargo postulado
 * @param {string} datos.familia - Familia del cargo
 * @param {string} datos.correo - Correo electrónico
 * @param {string} datos.fechaEntrevista - Fecha de la entrevista indicada por el analista
 * @param {string} [datos.psicologo] - Evaluador asignado
 * @returns {Promise<{ ok: boolean, data?: any, error?: any }>}
 */
export async function enviarCitacionEntrevista(datos) {
  try {
    const { data, error } = await supabase.functions.invoke("enviar-confirmacion", {
      body: {
        tipo: "citacion",
        ...datos,
      },
    });

    if (error) {
      console.warn("Aviso al enviar citación de entrevista con Resend:", error);
      return { ok: false, error };
    }

    return { ok: true, data };
  } catch (err) {
    console.warn("Excepción al contactar el servicio de citación:", err);
    return { ok: false, error: err };
  }
}

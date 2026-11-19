import { Resend } from "npm:resend@6";
import { getTemplateConfirmacion, getTemplateCitacionEntrevista } from "../templates/index.js";

// Inicializar cliente Resend con la variable de entorno RESEND_API_KEY
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);

// Remitente (usando onboarding@resend.dev para entorno de desarrollo/pruebas sin configuración previa de DNS)
const REMITENTE = "AquaChile <onboarding@resend.dev>";

/**
 * Servicio encargado de enviar el correo de confirmación de postulación mediante Resend.
 * @param {Object} datos
 * @param {string} datos.nombre
 * @param {string} datos.rut
 * @param {string} datos.cargo
 * @param {string} datos.familia
 * @param {string} datos.correo
 * @param {string} datos.fecha
 * @returns {Promise<{ ok: boolean, data?: any, error?: string }>}
 */
export async function enviarEmailConfirmacion({ nombre, rut, cargo, familia, correo, fecha }) {
  if (!resendApiKey) {
    throw new Error("No se encuentra configurada la variable de entorno RESEND_API_KEY");
  }

  const html = getTemplateConfirmacion({
    nombre,
    rut,
    cargo,
    familia,
    correo,
    fecha,
  });

  const { data, error } = await resend.emails.send({
    from: REMITENTE,
    to: [correo],
    subject: `Confirmación de postulación — AquaChile`,
    html,
  });

  if (error) {
    console.error("Error al enviar correo con Resend:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

/**
 * Servicio encargado de enviar el correo de citación a entrevista mediante Resend.
 * @param {Object} datos
 * @param {string} datos.nombre
 * @param {string} datos.rut
 * @param {string} datos.cargo
 * @param {string} datos.familia
 * @param {string} datos.correo
 * @param {string} datos.fechaEntrevista
 * @param {string} [datos.psicologo]
 * @returns {Promise<{ ok: boolean, data?: any, error?: string }>}
 */
export async function enviarEmailCitacion({
  nombre,
  rut,
  cargo,
  familia,
  correo,
  fechaEntrevista,
  psicologo,
}) {
  if (!resendApiKey) {
    throw new Error("No se encuentra configurada la variable de entorno RESEND_API_KEY");
  }

  const html = getTemplateCitacionEntrevista({
    nombre,
    rut,
    cargo,
    familia,
    fechaEntrevista,
    psicologo,
  });

  const { data, error } = await resend.emails.send({
    from: REMITENTE,
    to: [correo],
    subject: `Citación a entrevista psicolaboral — AquaChile`,
    html,
  });

  if (error) {
    console.error("Error al enviar citación con Resend:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

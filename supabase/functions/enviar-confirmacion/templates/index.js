/**
 * Plantilla de correo electrónico de confirmación de postulación - AquaChile
 * @param {Object} datos
 * @param {string} datos.nombre - Nombre completo del postulante
 * @param {string} datos.rut - RUT del postulante
 * @param {string} datos.cargo - Cargo al que postula
 * @param {string} datos.familia - Familia / Área del cargo
 * @param {string} datos.correo - Correo electrónico del candidato
 * @param {string} datos.fecha - Fecha de la postulación
 * @returns {string} HTML formateado para el correo
 */
export function getTemplateConfirmacion({ nombre, rut, cargo, familia, correo, fecha }) {
  const anioActual = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Confirmación de postulación — AquaChile</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header institucional -->
              <tr>
                <td style="background:#0f172a;padding:28px 40px;">
                  <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                    AquaChile
                  </p>
                  <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">
                    Dirección de Personas y Desarrollo Organizacional
                  </p>
                </td>
              </tr>

              <!-- Cuerpo del mensaje -->
              <tr>
                <td style="padding:40px;">

                  <!-- Icono de confirmación -->
                  <div style="text-align:center;margin-bottom:28px;">
                    <div style="display:inline-flex;align-items:center;justify-content:center;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:50%;width:56px;height:56px;text-align:center;">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>

                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;text-align:center;color:#0f172a;">
                    Postulación registrada correctamente
                  </h1>
                  <p style="margin:0 0 32px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
                    Hola <strong>${nombre}</strong>, hemos recibido tus antecedentes satisfactoriamente.
                  </p>

                  <!-- Resumen de postulación -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          RUT
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f172a;font-family:monospace;">
                          ${rut}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          Cargo al que postula
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f172a;">
                          ${cargo}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          Área / Familia
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;color:#1e293b;">
                          ${familia || "Área General"}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          Fecha de registro
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;color:#1e293b;">
                          ${fecha}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Estado inicial -->
                  <div style="text-align:center;margin-bottom:28px;">
                    <span style="display:inline-block;background:#fef9c3;color:#854d0e;border:1px solid #fde68a;border-radius:999px;padding:5px 16px;font-size:12px;font-weight:600;">
                      Estado: En revisión inicial
                    </span>
                  </div>

                  <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 24px;">
                    El equipo de selección revisará tu currículum en los próximos días hábiles.
                    Si tu perfil califica para la siguiente etapa, serás contactado al correo
                    <strong>${correo}</strong> o al teléfono que registraste.
                  </p>

                  <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0;">
                    Tus datos personales son tratados de forma confidencial conforme a la
                    legislación chilena de protección de datos personales (Ley 19.628).
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f1f5f9;padding:20px 40px;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                    © ${anioActual} AquaChile S.A. — Puerto Montt, Chile.<br/>
                    Este es un correo automático, por favor no respondas a este mensaje.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Plantilla de correo electrónico de citación a entrevista psicolaboral - AquaChile
 * @param {Object} datos
 * @param {string} datos.nombre - Nombre del candidato
 * @param {string} datos.rut - RUT del candidato
 * @param {string} datos.cargo - Cargo postulado
 * @param {string} datos.familia - Familia / Área del cargo
 * @param {string} [datos.fechaEntrevista] - Fecha de la entrevista (ej: "2026-11-25")
 * @param {string} [datos.psicologo] - Psicólogo/a evaluador asignado
 * @returns {string} HTML formateado para el correo
 */
export function getTemplateCitacionEntrevista({
  nombre,
  rut,
  cargo,
  familia,
  fechaEntrevista,
  psicologo
}) {
  const anioActual = new Date().getFullYear();

  let fechaTexto = fechaEntrevista || "A coordinar";
  if (fechaEntrevista && fechaEntrevista.includes("-")) {
    const partes = fechaEntrevista.split("-");
    if (partes.length === 3) {
      const d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
      if (!isNaN(d.getTime())) {
        fechaTexto = d.toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        });
      }
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Citación a entrevista psicolaboral — AquaChile</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header institucional -->
              <tr>
                <td style="background:#0f172a;padding:28px 40px;">
                  <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                    AquaChile
                  </p>
                  <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">
                    Dirección de Personas y Desarrollo Organizacional
                  </p>
                </td>
              </tr>

              <!-- Cuerpo del mensaje -->
              <tr>
                <td style="padding:40px;">

                  <!-- Icono de calendario / citación -->
                  <div style="text-align:center;margin-bottom:28px;">
                    <div style="display:inline-flex;align-items:center;justify-content:center;background:#f0f9ff;border:2px solid #bae6fd;border-radius:50%;width:56px;height:56px;text-align:center;">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                  </div>

                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;text-align:center;color:#0f172a;">
                    Citación a entrevista psicolaboral
                  </h1>
                  <p style="margin:0 0 32px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
                    Estimado/a <strong>${nombre}</strong>, nos complace informarle que su postulación ha avanzado en el proceso de selección y ha sido citado/a a su entrevista psicolaboral.
                  </p>

                  <!-- Resumen de la citación -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          Candidato / RUT
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f172a;font-family:monospace;">
                          ${rut}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          Cargo al que postula
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f172a;">
                          ${cargo}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          Fecha fijada para la entrevista
                        </p>
                        <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#0369a1;">
                          ${fechaTexto}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          Evaluador/a asignado/a
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;color:#1e293b;font-weight:600;">
                          ${psicologo || "Psicólogo/a del equipo de selección"}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">
                          Área / Familia
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;color:#1e293b;">
                          ${familia || "Área General"}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Estado inicial -->
                  <div style="text-align:center;margin-bottom:28px;">
                    <span style="display:inline-block;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:999px;padding:5px 16px;font-size:12px;font-weight:600;">
                      Estado: Citación de entrevista generada
                    </span>
                  </div>

                  <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 16px;">
                    Le solicitamos estar atento/a a su teléfono o correo electrónico, donde el/la profesional evaluador/a le compartirá el enlace de conexión telemática o la ubicación de las dependencias de AquaChile según corresponda.
                  </p>

                  <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 24px;">
                    En caso de requerir coordinar un ajuste de horario o ante cualquier consulta previa, por favor responda al profesional o contáctese oportunamente con el área de selección.
                  </p>

                  <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0;">
                    Tus datos personales y antecedentes de postulación son tratados de forma confidencial conforme a la legislación chilena (Ley 19.628).
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f1f5f9;padding:20px 40px;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                    © ${anioActual} AquaChile S.A. — Puerto Montt, Chile.<br/>
                    Dirección de Personas y Desarrollo Organizacional
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

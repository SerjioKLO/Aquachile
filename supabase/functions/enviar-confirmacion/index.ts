// Supabase Edge Function — enviar-confirmacion
// Entrypoint principal de la función HTTP

import { enviarEmailConfirmacion, enviarEmailCitacion } from "./services/resendService.js";

Deno.serve(async (req: Request) => {
  // Manejo de CORS para llamadas desde el frontend
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    const { tipo = "confirmacion", nombre, rut, cargo, familia, correo, fecha, fechaEntrevista, psicologo } = payload;

    if (!correo || !nombre || !rut) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios: correo, nombre, rut" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const resultado = tipo === "citacion"
      ? await enviarEmailCitacion({
          nombre,
          rut,
          cargo,
          familia,
          correo,
          fechaEntrevista: fechaEntrevista || fecha,
          psicologo,
        })
      : await enviarEmailConfirmacion({
          nombre,
          rut,
          cargo,
          familia,
          correo,
          fecha,
        });

    if (!resultado.ok) {
      return new Response(
        JSON.stringify({ error: resultado.error }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: resultado.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Error inesperado en edge function:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor al procesar la solicitud" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

import { createClient } from "@supabase/supabase-js";

// Obtención segura de variables de entorno para Vite / TypeScript
const rawUrl = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined)?.trim();

// Sanitización defensiva: remueve trailing slashes o sufijos /rest/v1 accidentales
const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase en el archivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

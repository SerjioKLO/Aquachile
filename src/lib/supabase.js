import { createClient } from "@supabase/supabase-js";
const rawUrl = import.meta.env["VITE_SUPABASE_URL"]?.trim();
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"]?.trim();
const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan las variables de entorno de Supabase en el archivo .env");
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

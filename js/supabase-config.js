// ===========================================================
// CONEXÃO COM O SUPABASE
// Esse arquivo cria o "cliente" que o resto do site usa pra
// ler e escrever dados no banco. A chave abaixo é pública
// por natureza (feita pra ficar exposta no site) — quem
// protege os dados de verdade são as regras (RLS) lá no
// Supabase, não o segredo dessa chave.
// ===========================================================

const SUPABASE_URL = "https://xoixyfvwyetuxuopjaag.supabase.co";
const SUPABASE_KEY = "sb_publishable_O4ZtfG8kU-5Au9C7Sj56cw_LvuSfrxd";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

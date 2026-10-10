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

// ===========================================================
// NOTIFICAÇÕES TELEGRAM
// ===========================================================
const TELEGRAM_TOKEN = "8575308692:AAE-UEjzKCazl_KRpur8lBe4aQdR1pdzyro";
const TELEGRAM_CHAT_ID = "SEU_CHAT_ID_AQUI"; // Substitua por aquele número longo

async function notificarTelegram(mensagem) {
  if (TELEGRAM_CHAT_ID === "SEU_CHAT_ID_AQUI") return; // Evita erros se esquecer de mudar o ID
  
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: "HTML" // Permite usar negrito no texto
      })
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem para o Telegram:", error);
  }
}
// ===========================================================
// LÓGICA DA PÁGINA HOME
// Depende de: js/supabase-config.js
// ===========================================================

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

async function carregarEventos() {
  const container = document.querySelector(".events-section");
  if (!container) return;

  // Busca compromissos com data
  const { data: compromissos, error: errComp } = await supabaseClient
    .from("compromissos")
    .select("*")
    .eq("tem_data", true);

  // Busca viagens com data
  const { data: viagens, error: errViag } = await supabaseClient
    .from("viagens")
    .select("*")
    .eq("tem_data", true);

  if (errComp || errViag) {
    console.error("Erro ao puxar eventos:", errComp || errViag);
    container.innerHTML = "<h2>Eventos marcados</h2><p>Erro ao carregar a agenda.</p>";
    return;
  }

  // Pegar a data de hoje (zerando as horas para comparar corretamente)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let todosEventos = [];

  // Formatar compromissos
  (compromissos || []).forEach(c => {
    if (!c.data_hora) return;
    const d = new Date(c.data_hora);
    if (d >= hoje) {
      todosEventos.push({
        tipo: "Compromisso",
        titulo: c.titulo,
        dataObj: d,
        corSoft: "var(--c-encontros-soft)",
        corForte: "var(--c-encontros)"
      });
    }
  });

  // Formatar viagens
  (viagens || []).forEach(v => {
    if (!v.data_ida) return;
    // Força o horário do meio-dia para evitar bug de fuso-horário que atrasa o dia
    const d = new Date(v.data_ida + "T12:00:00"); 
    if (d >= hoje) {
      todosEventos.push({
        tipo: "Viagem",
        titulo: v.destino,
        dataObj: d,
        corSoft: "var(--c-viagens-soft)",
        corForte: "var(--c-viagens)"
      });
    }
  });

  // Ordenar do mais próximo para o mais distante
  todosEventos.sort((a, b) => a.dataObj - b.dataObj);

  // Montar o HTML para a tela
  let html = "<h2>Eventos marcados</h2>";

  if (todosEventos.length === 0) {
    html += `
      <div class="empty-state" style="margin-top:20px;">
        <h3>Nada marcado ainda</h3>
        <p>Assim que vocês marcarem uma data em Viagens ou Compromissos, ela aparece aqui.</p>
      </div>
    `;
  } else {
    todosEventos.forEach(ev => {
      const dia = String(ev.dataObj.getDate()).padStart(2, "0");
      const mes = MESES[ev.dataObj.getMonth()];
      
      html += `
        <div class="event-card">
          <div class="event-date"><strong>${dia}</strong>${mes}</div>
          <div>
            <span class="tag" style="background:${ev.corSoft}; color:${ev.corForte};">${ev.tipo}</span>
            <div><strong>${escapeHTML(ev.titulo)}</strong></div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
  carregarEventos();
});
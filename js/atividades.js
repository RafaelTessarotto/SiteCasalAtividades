// ===========================================================
// LÓGICA DA PÁGINA DE ATIVIDADES
// Depende de: js/supabase-config.js (supabaseClient) e
// js/auth.js (função usuarioAtual())
// ===========================================================

const URGENCIA_INFO = {
  mes: { label: "Esse mês", bg: "var(--c-fazer-soft)", color: "var(--c-fazer)" },
  semana: { label: "Essa semana", bg: "#fbe9c9", color: "#8a5c14" },
  urgente: { label: "Urgente", bg: "#f2e0e0", color: "#9c3b3b" },
};

const RESPOSTA_INFO = {
  bora: { label: "Bora!", bg: "#dcefe1", color: "#2f7a4d" },
  nao_sei: { label: "Não sei", bg: "#f0ece0", color: "#8a6d1c" },
  nao_quero: { label: "Não quero", bg: "#f2e0e0", color: "#9c3b3b" },
};

const NOMES = { rafael: "Rafael", gabriela: "Gabriela" };

let atividadesCache = [];

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

async function carregarAtividades() {
  const gridPendentes = document.getElementById("atividades-grid-pendentes");
  if (gridPendentes) gridPendentes.innerHTML = '<p class="meta">Carregando...</p>';

  const { data, error } = await supabaseClient
    .from("atividades")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    if (gridPendentes) {
      gridPendentes.innerHTML = '<p class="meta">Erro ao carregar: ' + escapeHTML(error.message) + "</p>";
    }
    console.error(error);
    return;
  }

  atividadesCache = data || [];
  renderizarAtividades();
}

function renderizarAtividades() {
  const gridPendentes = document.getElementById("atividades-grid-pendentes");
  const gridRespondidas = document.getElementById("atividades-grid-respondidas");
  const tituloPendentes = document.getElementById("titulo-pendentes");
  const tituloRespondidas = document.getElementById("titulo-respondidas");
  const empty = document.getElementById("atividades-empty");
  const eu = usuarioAtual();

  if (!atividadesCache.length) {
    gridPendentes.innerHTML = "";
    gridRespondidas.innerHTML = "";
    tituloPendentes.style.display = "none";
    tituloRespondidas.style.display = "none";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const pendentes = atividadesCache.filter((a) => !a.resposta);
  const respondidas = atividadesCache.filter((a) => a.resposta);

  tituloPendentes.style.display = pendentes.length ? "block" : "none";
  tituloRespondidas.style.display = respondidas.length ? "block" : "none";

  gridPendentes.innerHTML = pendentes.map((a) => cardHTML(a, eu)).join("");
  gridRespondidas.innerHTML = respondidas.map((a) => cardHTML(a, eu)).join("");

  // antes de responder: o card inteiro é clicável
  pendentes.forEach((a) => {
    if (a.sugerido_por !== eu) {
      const card = document.getElementById("atividade-" + a.id);
      if (card) card.addEventListener("click", () => abrirOpcoesResposta(a.id));
    }
  });

  // depois de já ter resposta: só o balão é clicável, pra trocar
  document.querySelectorAll(".clicavel-pill").forEach((pill) => {
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirOpcoesResposta(pill.dataset.id);
    });
  });

  // liga os botões de excluir
  document.querySelectorAll(".excluir-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      excluirAtividade(btn.dataset.id);
    });
  });

  // liga os botões de editar
  document.querySelectorAll(".editar-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirModalEdicao(btn.dataset.id);
    });
  });
}

function cardHTML(a, eu) {
  const urg = URGENCIA_INFO[a.urgencia] || { label: a.urgencia, bg: "#eee", color: "#333" };
  const souAutor = a.sugerido_por === eu;
  const sugeridoTexto = souAutor ? "você" : NOMES[a.sugerido_por] || a.sugerido_por;
  const podeResponder = !souAutor;
  const aindaSemResposta = !a.resposta;
  const cardClicavel = podeResponder && aindaSemResposta; 

  let respostaHTML;
  if (a.resposta) {
    const r = RESPOSTA_INFO[a.resposta] || { label: a.resposta, bg: "#eee", color: "#333" };
    const classePill = podeResponder ? "resposta-pill clicavel-pill" : "resposta-pill";
    const dataId = podeResponder ? `data-id="${a.id}"` : "";
    respostaHTML = `<span class="${classePill}" ${dataId} style="background:${r.bg}; color:${r.color};">${r.label}</span>`;
  } else if (souAutor) {
    respostaHTML = `<span class="meta" style="display:block; margin-top:10px;">Aguardando resposta...</span>`;
  } else {
    respostaHTML = `<span class="toque-responder" style="color:var(--c-fazer);">Toque pra responder</span>`;
  }

  const iconeLapis = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  `;

  const iconeLixeira = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>
  `;

  const acoesAutor = souAutor
    ? `<button type="button" class="editar-btn" data-id="${a.id}" title="Editar" aria-label="Editar">${iconeLapis}</button>
       <button type="button" class="excluir-btn" data-id="${a.id}" title="Excluir" aria-label="Excluir">${iconeLixeira}</button>`
    : "";

  return `
    <div class="card vontade-card${cardClicavel ? " clicavel" : ""}" id="atividade-${a.id}">
      <span class="status-pill" style="background:${urg.bg}; color:${urg.color};">${urg.label}</span>
      <h3>${escapeHTML(a.titulo)}</h3>
      <p class="meta">Sugerido por ${sugeridoTexto}${a.onde ? " · " + escapeHTML(a.onde) : ""}</p>
      ${a.descricao ? `<p>${escapeHTML(a.descricao)}</p>` : ""}
      <div class="card-footer-left">${respostaHTML}</div>
      ${acoesAutor ? `<div class="card-footer-right">${acoesAutor}</div>` : ""}
    </div>
  `;
}

function abrirOpcoesResposta(id) {
  const card = document.getElementById("atividade-" + id);
  if (!card) return;

  const existente = card.querySelector(".resposta-opcoes");
  if (existente) {
    existente.remove();
    return;
  }

  const item = atividadesCache.find((a) => a.id === id);
  const atual = item ? item.resposta : null;

  const opcoes = document.createElement("div");
  opcoes.className = "resposta-opcoes";
  opcoes.innerHTML = `
    <button type="button" data-resp="bora" class="${atual === "bora" ? "selecionado" : ""}">Bora</button>
    <button type="button" data-resp="nao_sei" class="${atual === "nao_sei" ? "selecionado" : ""}">Não sei</button>
    <button type="button" data-resp="nao_quero" class="${atual === "nao_quero" ? "selecionado" : ""}">Não quero</button>
  `;
  card.appendChild(opcoes);

  opcoes.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      responderAtividade(id, btn.dataset.resp);
    });
  });
}

async function responderAtividade(id, resposta) {
  const { error } = await supabaseClient
    .from("atividades")
    .update({ resposta })
    .eq("id", id);

  if (error) {
    alert("Não foi possível salvar a resposta: " + error.message);
    console.error(error);
    return;
  }

  const item = atividadesCache.find((a) => a.id === id);
  if (item) item.resposta = resposta;
  renderizarAtividades();
}

async function excluirAtividade(id) {
  if (!confirm("Tem certeza que quer excluir essa atividade?")) return;

  const { error } = await supabaseClient.from("atividades").delete().eq("id", id);

  if (error) {
    alert("Não foi possível excluir: " + error.message);
    console.error(error);
    return;
  }

  atividadesCache = atividadesCache.filter((a) => a.id !== id);
  renderizarAtividades();
}

document.addEventListener("DOMContentLoaded", () => {
  carregarAtividades();

  const addBtn = document.getElementById("add-atividade");
  const overlay = document.getElementById("atividade-modal-overlay");
  const closeBtn = document.getElementById("fechar-modal-atividade");
  const form = document.getElementById("form-atividade");
  const modalTitulo = document.getElementById("modal-titulo");
  const btnSalvar = document.getElementById("btn-salvar-atividade");

  let editandoId = null;

  function abrirModal() {
    if (overlay) overlay.style.display = "flex";
  }

  function fecharModal() {
    if (overlay) overlay.style.display = "none";
    editandoId = null;
  }

  function abrirModalNovo() {
    editandoId = null;
    if (form) form.reset();
    if (modalTitulo) modalTitulo.textContent = "Nova atividade";
    if (btnSalvar) btnSalvar.textContent = "Salvar atividade";
    abrirModal();
  }

  window.abrirModalEdicao = function (id) {
    const item = atividadesCache.find((a) => a.id === id);
    if (!item) return;
    editandoId = id;
    document.getElementById("input-titulo").value = item.titulo || "";
    document.getElementById("input-onde").value = item.onde || "";
    document.getElementById("input-descricao").value = item.descricao || "";
    document.getElementById("input-urgencia").value = item.urgencia || "mes";
    if (modalTitulo) modalTitulo.textContent = "Editar atividade";
    if (btnSalvar) btnSalvar.textContent = "Salvar alterações";
    abrirModal();
  };

  if (addBtn) addBtn.addEventListener("click", abrirModalNovo);
  if (closeBtn) closeBtn.addEventListener("click", fecharModal);

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) fecharModal();
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const eu = usuarioAtual();
      if (!eu) {
        alert("Não identificamos quem está logado. Recarregue a página e entre de novo.");
        return;
      }

      const titulo = document.getElementById("input-titulo").value.trim();
      const onde = document.getElementById("input-onde").value.trim();
      const descricao = document.getElementById("input-descricao").value.trim();
      const urgencia = document.getElementById("input-urgencia").value;

      if (!titulo) {
        alert("Escreve pelo menos o título :)");
        return;
      }

      let error;
      if (editandoId) {
        ({ error } = await supabaseClient
          .from("atividades")
          .update({ titulo, onde: onde || null, descricao: descricao || null, urgencia })
          .eq("id", editandoId));
      } else {
        ({ error } = await supabaseClient.from("atividades").insert({
          titulo,
          onde: onde || null,
          descricao: descricao || null,
          urgencia,
          sugerido_por: eu,
        }));
      }

      if (error) {
        alert("Não foi possível salvar: " + error.message);
        console.error(error);
        return;
      }


      // DISPARO DO TELEGRAM
      if (!editandoId) { 
        await supabaseClient.rpc('notificar_telegram', { 
          texto: `<b>Nova Atividade!</b>\nO ${eu} adicionou: <b>${titulo}</b>` 
        });
      }

      form.reset();
      fecharModal();
      carregarAtividades();
    });
  }
});
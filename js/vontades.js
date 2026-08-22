// ===========================================================
// LÓGICA DA PÁGINA DE VONTADES
// Depende de: js/supabase-config.js (supabaseClient) e
// js/auth.js (função usuarioAtual())
// ===========================================================

const URGENCIA_INFO = {
  mes: { label: "Esse mês", bg: "var(--c-comida-soft)", color: "var(--c-comida)" },
  semana: { label: "Essa semana", bg: "#fbe9c9", color: "#8a5c14" },
  urgente: { label: "Urgente", bg: "#f2e0e0", color: "#9c3b3b" },
};

const RESPOSTA_INFO = {
  bora: { label: "Bora!", bg: "#dcefe1", color: "#2f7a4d" },
  nao_sei: { label: "Não sei", bg: "#f0ece0", color: "#8a6d1c" },
  nao_quero: { label: "Não quero", bg: "#f2e0e0", color: "#9c3b3b" },
};

const NOMES = { rafael: "Rafael", gabriela: "Gabriela" };

let vontadesCache = [];

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

async function carregarVontades() {
  const grid = document.getElementById("vontades-grid");
  if (!grid) return;
  grid.innerHTML = '<p class="meta">Carregando...</p>';

  const { data, error } = await supabaseClient
    .from("vontades")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    grid.innerHTML = '<p class="meta">Erro ao carregar: ' + escapeHTML(error.message) + "</p>";
    console.error(error);
    return;
  }

  vontadesCache = data || [];
  renderizarVontades();
}

function renderizarVontades() {
  const grid = document.getElementById("vontades-grid");
  const empty = document.getElementById("vontades-empty");
  const eu = usuarioAtual();

  if (!vontadesCache.length) {
    grid.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  grid.innerHTML = vontadesCache.map((v) => cardHTML(v, eu)).join("");

  // antes de responder: o card inteiro é clicável
  vontadesCache.forEach((v) => {
    if (v.sugerido_por !== eu && !v.resposta) {
      const card = document.getElementById("vontade-" + v.id);
      if (card) {
        card.addEventListener("click", () => abrirOpcoesResposta(v.id));
      }
    }
  });

  // depois de já ter resposta: só o balão é clicável, pra trocar
  grid.querySelectorAll(".clicavel-pill").forEach((pill) => {
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirOpcoesResposta(pill.dataset.id);
    });
  });

  // liga os botões de excluir
  grid.querySelectorAll(".excluir-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      excluirVontade(btn.dataset.id);
    });
  });

  // liga os botões de editar
  grid.querySelectorAll(".editar-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirModalEdicao(btn.dataset.id);
    });
  });
}

function cardHTML(v, eu) {
  const urg = URGENCIA_INFO[v.urgencia] || { label: v.urgencia, bg: "#eee", color: "#333" };
  const souAutor = v.sugerido_por === eu;
  const sugeridoTexto = souAutor ? "você" : NOMES[v.sugerido_por] || v.sugerido_por;
  const podeResponder = !souAutor;
  const aindaSemResposta = !v.resposta;
  const cardClicavel = podeResponder && aindaSemResposta; // card inteiro clicável só antes da 1ª resposta

  let respostaHTML;
  if (v.resposta) {
    const r = RESPOSTA_INFO[v.resposta] || { label: v.resposta, bg: "#eee", color: "#333" };
    const classePill = podeResponder ? "resposta-pill clicavel-pill" : "resposta-pill";
    const dataId = podeResponder ? `data-id="${v.id}"` : "";
    respostaHTML = `<span class="${classePill}" ${dataId} style="background:${r.bg}; color:${r.color};">${r.label}</span>`;
  } else if (souAutor) {
    respostaHTML = `<span class="meta" style="display:block; margin-top:10px;">Aguardando resposta...</span>`;
  } else {
    respostaHTML = `<span class="toque-responder">Toque pra responder</span>`;
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
    ? `<button type="button" class="editar-btn" data-id="${v.id}" title="Editar" aria-label="Editar">${iconeLapis}</button>
       <button type="button" class="excluir-btn" data-id="${v.id}" title="Excluir" aria-label="Excluir">${iconeLixeira}</button>`
    : "";

  return `
    <div class="card vontade-card${cardClicavel ? " clicavel" : ""}" id="vontade-${v.id}">
      <span class="status-pill" style="background:${urg.bg}; color:${urg.color};">${urg.label}</span>
      <h3>${escapeHTML(v.titulo)}</h3>
      <p class="meta">Sugerido por ${sugeridoTexto}${v.onde ? " · " + escapeHTML(v.onde) : ""}</p>
      ${v.descricao ? `<p>${escapeHTML(v.descricao)}</p>` : ""}
      <div class="card-footer-left">${respostaHTML}</div>
      ${acoesAutor ? `<div class="card-footer-right">${acoesAutor}</div>` : ""}
    </div>
  `;
}

function abrirOpcoesResposta(id) {
  const card = document.getElementById("vontade-" + id);
  if (!card) return;

  // se já está aberto, clicar de novo fecha (em vez de travar)
  const existente = card.querySelector(".resposta-opcoes");
  if (existente) {
    existente.remove();
    return;
  }

  const item = vontadesCache.find((v) => v.id === id);
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
      responderVontade(id, btn.dataset.resp);
    });
  });
}

async function responderVontade(id, resposta) {
  const { error } = await supabaseClient
    .from("vontades")
    .update({ resposta })
    .eq("id", id);

  if (error) {
    alert("Não foi possível salvar a resposta: " + error.message);
    console.error(error);
    return;
  }

  const item = vontadesCache.find((v) => v.id === id);
  if (item) item.resposta = resposta;
  renderizarVontades();
}

async function excluirVontade(id) {
  if (!confirm("Tem certeza que quer excluir essa vontade?")) return;

  const { error } = await supabaseClient.from("vontades").delete().eq("id", id);

  if (error) {
    alert("Não foi possível excluir: " + error.message);
    console.error(error);
    return;
  }

  vontadesCache = vontadesCache.filter((v) => v.id !== id);
  renderizarVontades();
}

document.addEventListener("DOMContentLoaded", () => {
  carregarVontades();

  const addBtn = document.getElementById("add-vontade");
  const overlay = document.getElementById("vontade-modal-overlay");
  const closeBtn = document.getElementById("fechar-modal-vontade");
  const form = document.getElementById("form-vontade");
  const modalTitulo = document.getElementById("modal-titulo");
  const btnSalvar = document.getElementById("btn-salvar-vontade");

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
    if (modalTitulo) modalTitulo.textContent = "Nova vontade";
    if (btnSalvar) btnSalvar.textContent = "Salvar vontade";
    abrirModal();
  }

  window.abrirModalEdicao = function (id) {
    const item = vontadesCache.find((v) => v.id === id);
    if (!item) return;
    editandoId = id;
    document.getElementById("input-titulo").value = item.titulo || "";
    document.getElementById("input-onde").value = item.onde || "";
    document.getElementById("input-descricao").value = item.descricao || "";
    document.getElementById("input-urgencia").value = item.urgencia || "mes";
    if (modalTitulo) modalTitulo.textContent = "Editar vontade";
    if (btnSalvar) btnSalvar.textContent = "Salvar alterações";
    abrirModal();
  };

  if (addBtn) addBtn.addEventListener("click", abrirModalNovo);
  if (closeBtn) closeBtn.addEventListener("click", fecharModal);

  // fecha clicando fora da caixinha (no fundo escurecido)
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
        // edição: atualiza o item existente, sem mexer em sugerido_por/resposta
        ({ error } = await supabaseClient
          .from("vontades")
          .update({ titulo, onde: onde || null, descricao: descricao || null, urgencia })
          .eq("id", editandoId));
      } else {
        // criação: item novo, sugerido_por vem de quem está logado
        ({ error } = await supabaseClient.from("vontades").insert({
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

      form.reset();
      fecharModal();
      carregarVontades();
    });
  }
});
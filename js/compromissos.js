// ===========================================================
// LÓGICA DA PÁGINA DE COMPROMISSOS
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

const PESSOAS_LABEL = { casal: "Só nós dois", grupo: "Em grupo" };
const NOMES = { rafael: "Rafael", gabriela: "Gabriela" };

let compromissosCache = [];

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function formatarDataHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const dataStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const horaStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dataStr} às ${horaStr}`;
}

async function carregarCompromissos() {
  const gridPendentes = document.getElementById("compromissos-grid-pendentes");
  if (gridPendentes) gridPendentes.innerHTML = '<p class="meta">Carregando...</p>';

  const { data, error } = await supabaseClient
    .from("compromissos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    if (gridPendentes) {
      gridPendentes.innerHTML = '<p class="meta">Erro ao carregar: ' + escapeHTML(error.message) + "</p>";
    }
    console.error(error);
    return;
  }

  compromissosCache = data || [];
  renderizarCompromissos();
}

function renderizarCompromissos() {
  const gridPendentes = document.getElementById("compromissos-grid-pendentes");
  const gridRespondidas = document.getElementById("compromissos-grid-respondidas");
  const tituloPendentes = document.getElementById("titulo-pendentes");
  const tituloRespondidas = document.getElementById("titulo-respondidas");
  const empty = document.getElementById("compromissos-empty");
  const eu = usuarioAtual();

  if (!compromissosCache.length) {
    gridPendentes.innerHTML = "";
    gridRespondidas.innerHTML = "";
    tituloPendentes.style.display = "none";
    tituloRespondidas.style.display = "none";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const pendentes = compromissosCache.filter((c) => !c.resposta);
  const respondidas = compromissosCache.filter((c) => c.resposta);

  tituloPendentes.style.display = pendentes.length ? "block" : "none";
  tituloRespondidas.style.display = respondidas.length ? "block" : "none";

  gridPendentes.innerHTML = pendentes.map((c) => cardHTML(c, eu)).join("");
  gridRespondidas.innerHTML = respondidas.map((c) => cardHTML(c, eu)).join("");

  pendentes.forEach((c) => {
    if (c.sugerido_por !== eu) {
      const card = document.getElementById("compromisso-" + c.id);
      if (card) card.addEventListener("click", () => abrirOpcoesResposta(c.id));
    }
  });

  document.querySelectorAll(".clicavel-pill").forEach((pill) => {
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirOpcoesResposta(pill.dataset.id);
    });
  });

  document.querySelectorAll(".excluir-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      excluirCompromisso(btn.dataset.id);
    });
  });

  document.querySelectorAll(".editar-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirModalEdicao(btn.dataset.id);
    });
  });
}

function cardHTML(c, eu) {
  const urg = URGENCIA_INFO[c.urgencia] || { label: c.urgencia, bg: "#eee", color: "#333" };
  const souAutor = c.sugerido_por === eu;
  const sugeridoTexto = souAutor ? "você" : NOMES[c.sugerido_por] || c.sugerido_por;
  const podeResponder = !souAutor;
  const aindaSemResposta = !c.resposta;
  const cardClicavel = podeResponder && aindaSemResposta;

  let respostaHTML;
  if (c.resposta) {
    const r = RESPOSTA_INFO[c.resposta] || { label: c.resposta, bg: "#eee", color: "#333" };
    const classePill = podeResponder ? "resposta-pill clicavel-pill" : "resposta-pill";
    const dataId = podeResponder ? `data-id="${c.id}"` : "";
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
    ? `<button type="button" class="editar-btn" data-id="${c.id}" title="Editar" aria-label="Editar">${iconeLapis}</button>
       <button type="button" class="excluir-btn" data-id="${c.id}" title="Excluir" aria-label="Excluir">${iconeLixeira}</button>`
    : "";

  const linhaData = c.tem_data && c.data_hora
    ? `<p class="meta">${formatarDataHora(c.data_hora)}</p>`
    : "";

  return `
    <div class="card compromisso-card${cardClicavel ? " clicavel" : ""}" id="compromisso-${c.id}">
      <span class="pessoas-pill">${PESSOAS_LABEL[c.pessoas] || c.pessoas}</span>
      <span class="status-pill" style="background:${urg.bg}; color:${urg.color};">${urg.label}</span>
      <h3>${escapeHTML(c.titulo)}</h3>
      <p class="meta">Sugerido por ${sugeridoTexto}${c.onde ? " · " + escapeHTML(c.onde) : ""}</p>
      ${linhaData}
      ${c.descricao ? `<p>${escapeHTML(c.descricao)}</p>` : ""}
      <div class="card-footer-left">${respostaHTML}</div>
      ${acoesAutor ? `<div class="card-footer-right">${acoesAutor}</div>` : ""}
    </div>
  `;
}

function abrirOpcoesResposta(id) {
  const card = document.getElementById("compromisso-" + id);
  if (!card) return;

  const existente = card.querySelector(".resposta-opcoes");
  if (existente) {
    existente.remove();
    return;
  }

  const item = compromissosCache.find((c) => c.id === id);
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
      responderCompromisso(id, btn.dataset.resp);
    });
  });
}

async function responderCompromisso(id, resposta) {
  const { error } = await supabaseClient
    .from("compromissos")
    .update({ resposta })
    .eq("id", id);

  if (error) {
    alert("Não foi possível salvar a resposta: " + error.message);
    console.error(error);
    return;
  }

  const item = compromissosCache.find((c) => c.id === id);
  if (item) item.resposta = resposta;
  renderizarCompromissos();
}

async function excluirCompromisso(id) {
  if (!confirm("Tem certeza que quer excluir esse compromisso?")) return;

  const { error } = await supabaseClient.from("compromissos").delete().eq("id", id);

  if (error) {
    alert("Não foi possível excluir: " + error.message);
    console.error(error);
    return;
  }

  compromissosCache = compromissosCache.filter((c) => c.id !== id);
  renderizarCompromissos();
}

document.addEventListener("DOMContentLoaded", () => {
  carregarCompromissos();

  const addBtn = document.getElementById("add-compromisso");
  const overlay = document.getElementById("compromisso-modal-overlay");
  const closeBtn = document.getElementById("fechar-modal-compromisso");
  const form = document.getElementById("form-compromisso");
  const modalTitulo = document.getElementById("modal-titulo");
  const btnSalvar = document.getElementById("btn-salvar-compromisso");
  const temDataCheckbox = document.getElementById("input-tem-data");
  const campoDataHora = document.getElementById("campo-data-hora");

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
    if (campoDataHora) campoDataHora.style.display = "none";
    if (modalTitulo) modalTitulo.textContent = "Novo compromisso";
    if (btnSalvar) btnSalvar.textContent = "Salvar compromisso";
    abrirModal();
  }

  window.abrirModalEdicao = function (id) {
    const item = compromissosCache.find((c) => c.id === id);
    if (!item) return;
    editandoId = id;
    document.getElementById("input-titulo").value = item.titulo || "";
    document.getElementById("input-onde").value = item.onde || "";
    document.getElementById("input-descricao").value = item.descricao || "";
    document.getElementById("input-urgencia").value = item.urgencia || "mes";
    document.getElementById("input-pessoas").value = item.pessoas || "casal";
    if (temDataCheckbox) temDataCheckbox.checked = !!item.tem_data;
    if (campoDataHora) campoDataHora.style.display = item.tem_data ? "block" : "none";
    if (item.tem_data && item.data_hora) {
      // formato esperado pelo input datetime-local: YYYY-MM-DDTHH:mm
      const d = new Date(item.data_hora);
      const pad = (n) => String(n).padStart(2, "0");
      const valorLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      document.getElementById("input-data-hora").value = valorLocal;
    }
    if (modalTitulo) modalTitulo.textContent = "Editar compromisso";
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

  if (temDataCheckbox && campoDataHora) {
    temDataCheckbox.addEventListener("change", () => {
      campoDataHora.style.display = temDataCheckbox.checked ? "block" : "none";
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
      const pessoas = document.getElementById("input-pessoas").value;
      const temData = temDataCheckbox ? temDataCheckbox.checked : false;
      const dataHoraValor = document.getElementById("input-data-hora").value;

      if (!titulo) {
        alert("Escreve pelo menos o título :)");
        return;
      }

      if (temData && !dataHoraValor) {
        alert("Marca a data e hora, ou desmarca a caixinha de 'já tem data'.");
        return;
      }

      const payload = {
        titulo,
        onde: onde || null,
        descricao: descricao || null,
        urgencia,
        pessoas,
        tem_data: temData,
        data_hora: temData ? new Date(dataHoraValor).toISOString() : null,
      };

      let error;
      if (editandoId) {
        ({ error } = await supabaseClient.from("compromissos").update(payload).eq("id", editandoId));
      } else {
        payload.sugerido_por = eu;
        ({ error } = await supabaseClient.from("compromissos").insert(payload));
      }

      if (error) {
        alert("Não foi possível salvar: " + error.message);
        console.error(error);
        return;
      }

      form.reset();
      if (campoDataHora) campoDataHora.style.display = "none";
      fecharModal();
      carregarCompromissos();
    });
  }
});
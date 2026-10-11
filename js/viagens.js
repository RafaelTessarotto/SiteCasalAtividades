// ===========================================================
// LÓGICA DA PÁGINA DE VIAGENS
// ===========================================================

const STATUS_INFO = {
  quero_ir: { label: "Quero ir", bg: "var(--c-viagens-soft)", color: "var(--c-viagens)" },
  planejando: { label: "Planejando", bg: "#fbe9c9", color: "#8a5c14" },
  marcada: { label: "Marcada!", bg: "#dcefe1", color: "#2f7a4d" },
  visitado: { label: "Visitado", bg: "#f0ece0", color: "#8a6d1c" },
};

const PESSOAS_LABEL = { casal: "Só nós dois", grupo: "Em grupo" };
const NOMES = { rafael: "Rafael", gabriela: "Gabriela" };

let viagensCache = [];
let mostrandoVisitados = false;

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function formatarPeriodo(ida, volta) {
  if (!ida) return "";
  const dIda = new Date(ida + "T12:00:00"); 
  const txtIda = dIda.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (!volta) return txtIda;
  
  const dVolta = new Date(volta + "T12:00:00");
  const txtVolta = dVolta.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${txtIda} a ${txtVolta}`;
}

async function carregarViagens() {
  const gridAtivas = document.getElementById("viagens-grid-ativas");
  if (gridAtivas) gridAtivas.innerHTML = '<p class="meta">Carregando...</p>';

  const { data, error } = await supabaseClient
    .from("viagens")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    if (gridAtivas) gridAtivas.innerHTML = '<p class="meta">Erro ao carregar.</p>';
    console.error(error);
    return;
  }

  viagensCache = data || [];
  renderizarViagens();
}

function renderizarViagens() {
  const gridAtivas = document.getElementById("viagens-grid-ativas");
  const gridVisitados = document.getElementById("viagens-grid-visitados");
  const tituloAtivas = document.getElementById("titulo-ativas");
  const tituloVisitados = document.getElementById("titulo-visitados");
  const empty = document.getElementById("viagens-empty");
  const eu = usuarioAtual();

  if (!viagensCache.length) {
    gridAtivas.innerHTML = "";
    gridVisitados.innerHTML = "";
    tituloAtivas.style.display = "none";
    tituloVisitados.style.display = "none";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const ativas = viagensCache.filter(v => v.status !== "visitado");
  const visitados = viagensCache.filter(v => v.status === "visitado");

  tituloAtivas.style.display = ativas.length ? "block" : "none";
  gridAtivas.innerHTML = ativas.map(v => cardHTML(v, eu)).join("");
  
  gridVisitados.innerHTML = visitados.map(v => cardHTML(v, eu)).join("");
  
  document.querySelectorAll(".mudar-status-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      abrirOpcoesStatus(btn.dataset.id);
    });
  });

  document.querySelectorAll(".excluir-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      excluirViagem(btn.dataset.id);
    });
  });

  document.querySelectorAll(".editar-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      abrirModalEdicao(btn.dataset.id);
    });
  });
}

function cardHTML(v, eu) {
  const st = STATUS_INFO[v.status] || { label: v.status, bg: "#eee", color: "#333" };
  const souAutor = v.sugerido_por === eu;
  const sugeridoTexto = souAutor ? "você" : NOMES[v.sugerido_por] || v.sugerido_por;
  
  const linhaDatas = v.tem_data && v.data_ida
    ? `<p class="meta" style="color:var(--ink); font-weight:600; margin-top:8px;"> ${formatarPeriodo(v.data_ida, v.data_volta)}</p>`
    : "";

  const btnMudarStatus = `<span class="resposta-pill clicavel-pill mudar-status-btn" data-id="${v.id}" style="border: 1px dashed var(--ink-soft); background:transparent; color:var(--ink-soft);">Atualizar fase</span>`;

  const iconeLapis = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
  const iconeLixeira = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;

  const acoesAutor = souAutor
    ? `<button type="button" class="editar-btn" data-id="${v.id}" title="Editar">${iconeLapis}</button>
       <button type="button" class="excluir-btn" data-id="${v.id}" title="Excluir">${iconeLixeira}</button>`
    : "";

  return `
    <div class="card vontade-card" id="viagem-${v.id}">
      <span class="pessoas-pill">${PESSOAS_LABEL[v.pessoas] || v.pessoas}</span>
      <span class="status-pill" style="background:${st.bg}; color:${st.color};">${st.label}</span>
      <h3 style="margin-top:14px;">${escapeHTML(v.destino)}</h3>
      <p class="meta">Adicionado por ${sugeridoTexto}</p>
      ${linhaDatas}
      ${v.descricao ? `<p style="margin-top:10px;">${escapeHTML(v.descricao)}</p>` : ""}
      <div class="card-footer-left">${btnMudarStatus}</div>
      ${acoesAutor ? `<div class="card-footer-right">${acoesAutor}</div>` : ""}
    </div>
  `;
}

function abrirOpcoesStatus(id) {
  const card = document.getElementById("viagem-" + id);
  if (!card) return;

  const existente = card.querySelector(".resposta-opcoes");
  if (existente) {
    existente.remove();
    return;
  }

  const item = viagensCache.find(v => v.id === id);
  const atual = item ? item.status : "quero_ir";

  const opcoes = document.createElement("div");
  opcoes.className = "resposta-opcoes";
  opcoes.innerHTML = `
    <button type="button" data-st="quero_ir" class="${atual === "quero_ir" ? "selecionado" : ""}">Quero ir</button>
    <button type="button" data-st="planejando" class="${atual === "planejando" ? "selecionado" : ""}">Planejando</button>
    <button type="button" data-st="marcada" class="${atual === "marcada" ? "selecionado" : ""}">Marcada</button>
    <button type="button" data-st="visitado" class="${atual === "visitado" ? "selecionado" : ""}">Visitado</button>
  `;
  card.appendChild(opcoes);

  opcoes.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      salvarStatusViagem(id, btn.dataset.st);
    });
  });
}

async function salvarStatusViagem(id, status) {
  const { error } = await supabaseClient.from("viagens").update({ status }).eq("id", id);
  if (error) {
    alert("Erro ao salvar status: " + error.message);
    return;
  }
  const item = viagensCache.find(v => v.id === id);
  if (item) item.status = status;
  renderizarViagens();
}

async function excluirViagem(id) {
  if (!confirm("Tem certeza que quer excluir esse destino?")) return;
  const { error } = await supabaseClient.from("viagens").delete().eq("id", id);
  if (error) {
    alert("Não foi possível excluir: " + error.message);
    return;
  }
  viagensCache = viagensCache.filter(v => v.id !== id);
  renderizarViagens();
}

document.addEventListener("DOMContentLoaded", () => {
  carregarViagens();

  const addBtn = document.getElementById("add-destino");
  const overlay = document.getElementById("viagem-modal-overlay");
  const closeBtn = document.getElementById("fechar-modal-viagem");
  const form = document.getElementById("form-viagem");
  const modalTitulo = document.getElementById("modal-titulo");
  const btnSalvar = document.getElementById("btn-salvar-viagem");
  
  const temDataCheckbox = document.getElementById("input-tem-data");
  const campoDatas = document.getElementById("campo-datas");
  const btnToggleFeitos = document.getElementById("toggle-feitos");
  
  if (btnToggleFeitos) {
    btnToggleFeitos.addEventListener("click", () => {
      mostrandoVisitados = !mostrandoVisitados;
      const grid = document.getElementById("viagens-grid-visitados");
      const tit = document.getElementById("titulo-visitados");
      if (grid) grid.style.display = mostrandoVisitados ? "grid" : "none";
      if (tit) tit.style.display = mostrandoVisitados ? "block" : "none";
      btnToggleFeitos.textContent = mostrandoVisitados ? "Ocultar já visitados" : "Ver já visitados";
    });
  }

  let editandoId = null;

  function abrirModal() { if (overlay) overlay.style.display = "flex"; }
  function fecharModal() { if (overlay) overlay.style.display = "none"; editandoId = null; }

  function abrirModalNovo() {
    editandoId = null;
    if (form) form.reset();
    if (campoDatas) campoDatas.style.display = "none";
    if (modalTitulo) modalTitulo.textContent = "Novo destino";
    if (btnSalvar) btnSalvar.textContent = "Salvar destino";
    abrirModal();
  }

  window.abrirModalEdicao = function (id) {
    const item = viagensCache.find(v => v.id === id);
    if (!item) return;
    editandoId = id;
    
    document.getElementById("input-destino").value = item.destino || "";
    document.getElementById("input-status").value = item.status || "quero_ir";
    document.getElementById("input-pessoas").value = item.pessoas || "casal";
    document.getElementById("input-descricao").value = item.descricao || "";
    
    if (temDataCheckbox) temDataCheckbox.checked = !!item.tem_data;
    if (campoDatas) campoDatas.style.display = item.tem_data ? "flex" : "none";
    
    document.getElementById("input-data-ida").value = item.data_ida || "";
    document.getElementById("input-data-volta").value = item.data_volta || "";
    
    if (modalTitulo) modalTitulo.textContent = "Editar destino";
    if (btnSalvar) btnSalvar.textContent = "Salvar alterações";
    abrirModal();
  };

  if (addBtn) addBtn.addEventListener("click", abrirModalNovo);
  if (closeBtn) closeBtn.addEventListener("click", fecharModal);

  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) fecharModal();
    });
  }

  if (temDataCheckbox && campoDatas) {
    temDataCheckbox.addEventListener("change", () => {
      campoDatas.style.display = temDataCheckbox.checked ? "flex" : "none";
    });
  }

  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();

      const eu = usuarioAtual();
      if (!eu) return alert("Logue novamente para salvar.");

      const destino = document.getElementById("input-destino").value.trim();
      const status = document.getElementById("input-status").value;
      const pessoas = document.getElementById("input-pessoas").value;
      const descricao = document.getElementById("input-descricao").value.trim();
      const temData = temDataCheckbox ? temDataCheckbox.checked : false;
      const dataIda = document.getElementById("input-data-ida").value;
      const dataVolta = document.getElementById("input-data-volta").value;

      if (!destino) return alert("Escreva o destino!");
      if (temData && !dataIda) return alert("Preencha a data de ida ou desmarque a caixinha.");

      const payload = {
        destino,
        status,
        pessoas,
        descricao: descricao || null,
        tem_data: temData,
        data_ida: temData ? dataIda : null,
        data_volta: temData && dataVolta ? dataVolta : null,
      };

      let error;
      if (editandoId) {
        ({ error } = await supabaseClient.from("viagens").update(payload).eq("id", editandoId));
      } else {
        payload.sugerido_por = eu;
        ({ error } = await supabaseClient.from("viagens").insert(payload));
      }

      if (error) {
        alert("Erro ao salvar: " + error.message);
        return;
      }

      // DISPARO DO TELEGRAM
      if (!editandoId) { 
        await supabaseClient.rpc('notificar_telegram', { 
          texto: `<b>Nova Viagem!</b>\nO ${eu} adicionou: <b>${destino}</b>` 
        });
      }

      form.reset();
      fecharModal();
      carregarViagens();
    });
  }
});
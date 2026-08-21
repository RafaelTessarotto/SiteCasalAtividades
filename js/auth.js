// ===========================================================
// AUTENTICAÇÃO SIMPLES POR PIN — só pra identificar quem está
// navegando (Rafael ou Gabriela). NÃO é segurança de verdade:
// como o código do site é público, qualquer pessoa que abrir
// o "ver código-fonte" consegue ver esses PINs. Serve pra
// afastar curiosos e organizar quem-é-quem entre vocês dois.
// ===========================================================

// Troque os PINs abaixo pelos que vocês quiserem usar
const PESSOAS = {
  rafael: { nome: "Rafael", pin: "1234" },
  gabriela: { nome: "Gabriela", pin: "5678" },
};

function usuarioAtual() {
  return localStorage.getItem("usuario_atual");
}

function nomeUsuarioAtual() {
  const chave = usuarioAtual();
  return chave && PESSOAS[chave] ? PESSOAS[chave].nome : null;
}

function trocarUsuario() {
  localStorage.removeItem("usuario_atual");
  mostrarOverlayAuth();
}

function mostrarOverlayAuth() {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.style.display = "flex";
}

function esconderOverlayAuth() {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.style.display = "none";
}

function atualizarBadgeUsuario() {
  const badge = document.getElementById("usuario-badge");
  if (badge) {
    const nome = nomeUsuarioAtual();
    badge.textContent = nome ? nome : "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // se já tem alguém logado nesse navegador, não pede de novo
  if (usuarioAtual() && PESSOAS[usuarioAtual()]) {
    esconderOverlayAuth();
    atualizarBadgeUsuario();
  } else {
    mostrarOverlayAuth();
  }

  let pessoaSelecionada = null;
  const pinStep = document.getElementById("auth-pin-step");
  const pinInput = document.getElementById("auth-pin-input");
  const pinErro = document.getElementById("auth-error");
  const pinSubmit = document.getElementById("auth-pin-submit");

  document.querySelectorAll(".auth-person").forEach((btn) => {
    btn.addEventListener("click", () => {
      pessoaSelecionada = btn.dataset.person;
      document
        .querySelectorAll(".auth-person")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      if (pinStep) pinStep.style.display = "block";
      if (pinInput) {
        pinInput.value = "";
        pinInput.focus();
      }
      if (pinErro) pinErro.textContent = "";
    });
  });

  function tentarEntrar() {
    if (!pessoaSelecionada || !pinInput) return;
    const pessoa = PESSOAS[pessoaSelecionada];
    if (pessoa && pinInput.value === pessoa.pin) {
      localStorage.setItem("usuario_atual", pessoaSelecionada);
      esconderOverlayAuth();
      atualizarBadgeUsuario();
    } else if (pinErro) {
      pinErro.textContent = "PIN incorreto, tenta de novo.";
    }
  }

  if (pinSubmit) pinSubmit.addEventListener("click", tentarEntrar);
  if (pinInput) {
    pinInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tentarEntrar();
    });
  }

  const trocarBtn = document.getElementById("trocar-usuario");
  if (trocarBtn) {
    trocarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      trocarUsuario();
    });
  }
});

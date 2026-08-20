// Ajuste a data abaixo para o dia em que vocês começaram a namorar
const DATA_INICIO = new Date("2024-03-30T00:00:00");

function pad(num) {
  return String(num).padStart(2, "0");
}

function atualizarContagem() {
  const agora = new Date();
  const diffMs = agora - DATA_INICIO;

  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diffMs / (1000 * 60)) % 60);
  const segundos = Math.floor((diffMs / 1000) % 60);

  const elDias = document.getElementById("cd-dias");
  const elHoras = document.getElementById("cd-horas");
  const elMinutos = document.getElementById("cd-minutos");
  const elSegundos = document.getElementById("cd-segundos");

  if (elDias) elDias.textContent = dias.toLocaleString("pt-BR");
  if (elHoras) elHoras.textContent = pad(horas);
  if (elMinutos) elMinutos.textContent = pad(minutos);
  if (elSegundos) elSegundos.textContent = pad(segundos);
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarContagem();
  setInterval(atualizarContagem, 1000);
});

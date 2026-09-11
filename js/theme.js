const HTML = document.documentElement;
const CHAVE_TEMA = "estudos-enem-tema";

function aplicarTema(tema) {
  HTML.setAttribute("data-tema", tema);
  localStorage.setItem(CHAVE_TEMA, tema);
}

function iniciarTema() {
  const salvo = localStorage.getItem(CHAVE_TEMA);
  aplicarTema(salvo || "escuro");

  document.getElementById("toggle-tema").addEventListener("click", () => {
    const atual = HTML.getAttribute("data-tema");
    aplicarTema(atual === "escuro" ? "claro" : "escuro");
  });
}

document.addEventListener("DOMContentLoaded", iniciarTema);
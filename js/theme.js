const HTML = document.documentElement;
const CHAVE_TEMA = "estudos-enem-tema";

function atualizarBotoesTema(tema) {
  document.querySelectorAll("[data-acao='tema']").forEach((botao) => {
    botao.innerHTML = tema === "escuro"
      ? `<span aria-hidden="true">☀️</span><span>Tema claro</span>`
      : `<span aria-hidden="true">🌙</span><span>Tema escuro</span>`;

    botao.setAttribute(
      "aria-label",
      tema === "escuro" ? "Mudar para tema claro" : "Mudar para tema escuro"
    );
  });
}

function aplicarTema(tema, salvar = true) {
  const temaValido = tema === "escuro" ? "escuro" : "claro";

  HTML.setAttribute("data-tema", temaValido);

  if (salvar) {
    localStorage.setItem(CHAVE_TEMA, temaValido);
  }

  atualizarBotoesTema(temaValido);
}

function iniciarTema() {
  const salvo = localStorage.getItem(CHAVE_TEMA);
  aplicarTema(salvo || "claro", false);

  document.querySelectorAll("[data-acao='tema']").forEach((botao) => {
    botao.addEventListener("click", () => {
      const atual = HTML.getAttribute("data-tema");
      aplicarTema(atual === "escuro" ? "claro" : "escuro");
    });
  });
}

document.addEventListener("DOMContentLoaded", iniciarTema);
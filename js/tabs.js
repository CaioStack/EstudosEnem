function iniciarAbas() {
  const botoes = Array.from(document.querySelectorAll(".menu-item"));
  const painelMateria = document.getElementById("painel-materia");
  const painelSimulados = document.getElementById("painel-simulados");
  const sidebar = document.getElementById("sidebar");

  const idsValidos = botoes.map((botao) => botao.dataset.materia);

  function ativarMateria(materia, atualizarHash = true) {
    if (!idsValidos.includes(materia)) return;

    botoes.forEach((botao) => {
      const ativa = botao.dataset.materia === materia;
      botao.classList.toggle("ativa", ativa);
      botao.setAttribute("aria-current", ativa ? "page" : "false");
    });

    sidebar.classList.remove("aberta");

    if (materia === "simulados") {
      painelMateria.hidden = true;
      painelSimulados.hidden = false;
      renderizarListaSimulados();
    } else {
      painelSimulados.hidden = true;
      painelMateria.hidden = false;
      renderizarTopicos(materia);
    }

    if (atualizarHash && location.hash !== `#${materia}`) {
      history.pushState(null, "", `#${materia}`);
    }
  }

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      ativarMateria(botao.dataset.materia);
    });
  });

  window.addEventListener("hashchange", () => {
    ativarMateria(location.hash.replace("#", ""), false);
  });

  document.getElementById("abrir-menu")?.addEventListener("click", () => {
    sidebar.classList.toggle("aberta");
  });

  document.addEventListener("click", (evento) => {
    if (
      sidebar.classList.contains("aberta") &&
      !sidebar.contains(evento.target) &&
      !evento.target.closest("#abrir-menu")
    ) {
      sidebar.classList.remove("aberta");
    }
  });

  const inicial = idsValidos.includes(location.hash.replace("#", ""))
    ? location.hash.replace("#", "")
    : "linguagens";

  ativarMateria(inicial, false);
}

document.addEventListener("DOMContentLoaded", iniciarAbas);
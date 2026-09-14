function iniciarAbas() {
  const botoes = document.querySelectorAll(".menu-item");
  const painelMateria = document.getElementById("painel-materia");
  const painelSimulados = document.getElementById("painel-simulados");
  const sidebar = document.getElementById("sidebar");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      botoes.forEach((b) => b.classList.remove("ativa"));
      botao.classList.add("ativa");
      sidebar.classList.remove("aberta");

      const materia = botao.dataset.materia;

      if (materia === "simulados") {
        painelMateria.hidden = true;
        painelSimulados.hidden = false;
        renderizarListaSimulados();
      } else {
        painelSimulados.hidden = true;
        painelMateria.hidden = false;
        renderizarTopicos(materia);
      }
    });
  });

  document.getElementById("abrir-menu")?.addEventListener("click", () => {
    sidebar.classList.toggle("aberta");
  });
}

document.addEventListener("DOMContentLoaded", iniciarAbas);
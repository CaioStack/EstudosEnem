function iniciarAbas() {
  const botoes = document.querySelectorAll(".aba-btn");
  const painelMateria = document.getElementById("painel-materia");
  const painelSimulados = document.getElementById("painel-simulados");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      botoes.forEach((b) => b.classList.remove("ativa"));
      botao.classList.add("ativa");

      const materia = botao.dataset.materia;

      if (materia === "simulados") {
        painelMateria.hidden = true;
        painelSimulados.hidden = false;
      } else {
        painelSimulados.hidden = true;
        painelMateria.hidden = false;
        // a partir da v0.5, aqui chamamos renderizarTopicos(materia)
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", iniciarAbas);
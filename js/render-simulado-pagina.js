async function iniciarPaginaSimulado() {
  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get("id");

  try {
    const indice = await (await fetch("../data/simulados/simulados.json")).json();
    const simulado = indice.find((s) => s.id === id);

    if (!simulado) {
      throw new Error(`Simulado "${id}" não encontrado no índice.`);
    }

    document.getElementById("titulo-simulado").textContent = simulado.titulo;

    const todasQuestoes = await buscarProvaCompleta(simulado.ano);

    const dia1 = todasQuestoes.filter((q) => ["linguagens", "ciencias-humanas"].includes(q.discipline));
    const dia2 = todasQuestoes.filter((q) => ["ciencias-natureza", "matematica"].includes(q.discipline));

    document.getElementById("questoes-dia-1").innerHTML = dia1.map(criarCardQuestao).join("");
    document.getElementById("questoes-dia-2").innerHTML = dia2.map(criarCardQuestao).join("");
    ligarBotoesDeResposta(document.getElementById("questoes-dia-1"));
    ligarBotoesDeResposta(document.getElementById("questoes-dia-2"));

    const areaRedacao = document.getElementById("area-redacao");
    if (simulado.redacao && simulado.redacao.tema) {
      areaRedacao.innerHTML = `
        <p><strong>Tema:</strong> ${simulado.redacao.tema}</p>
        ${(simulado.redacao.textosMotivadores || []).join("")}
        <textarea class="textarea-redacao" placeholder="Escreva sua redação aqui..." rows="15"></textarea>
      `;
    } else {
      areaRedacao.innerHTML = `<p class="erro">Tema de redação ainda não cadastrado para este simulado.</p>`;
    }

    const botaoGabarito = document.getElementById("mostrar-gabarito-btn");
    const painelGabarito = document.getElementById("gabarito-geral");

    botaoGabarito.addEventListener("click", () => {
      const todas = [...dia1, ...dia2].sort((a, b) => a.index - b.index);
      painelGabarito.innerHTML = `
        <ul class="lista-gabarito">
          ${todas.map((q) => `<li>${q.index}. ${q.correctAlternative}</li>`).join("")}
        </ul>
      `;
      painelGabarito.hidden = false;
      botaoGabarito.disabled = true;
      botaoGabarito.textContent = "Gabarito revelado";
    });
  } catch (erro) {
    document.querySelector("main").innerHTML =
      `<p class="erro">Não foi possível montar este simulado agora. Tente novamente em instantes.</p>`;
    console.error(erro);
  }
}

document.addEventListener("DOMContentLoaded", iniciarPaginaSimulado);
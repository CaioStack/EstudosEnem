function renderizarQuestoes(questoes, idContainer) {
  const container = document.getElementById(idContainer);

  container.innerHTML = questoes.map((questao) => `
    <div class="questao" id="questao-${questao.id}">
      <p class="questao-cabecalho">ENEM ${questao.ano}</p>
      <p class="questao-enunciado">${questao.enunciado}</p>
      <ul class="questao-alternativas">
        ${questao.alternativas.map((alt) => `
          <li><strong>${alt.letra})</strong> ${alt.texto}</li>
        `).join("")}
      </ul>
      <button class="ver-resposta-btn" data-questao="${questao.id}" data-correta="${questao.correta}">
        Ver resposta
      </button>
      <p class="questao-resposta" hidden></p>
    </div>
  `).join("");

  container.querySelectorAll(".ver-resposta-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const respostaEl = botao.nextElementSibling;
      respostaEl.textContent = `Resposta correta: ${botao.dataset.correta}`;
      respostaEl.hidden = false;
      botao.disabled = true;
    });
  });
}
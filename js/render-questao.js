async function renderizarQuestoes(referencias, idContainer) {
  const container = document.getElementById(idContainer);
  container.innerHTML = `<p class="carregando">Carregando questões...</p>`;

  try {
    const questoes = await Promise.all(
      referencias.map((ref) => buscarQuestao(ref.ano, ref.indice))
    );
    container.innerHTML = questoes.map(criarCardQuestao).join("");
    ligarBotoesDeResposta(container);
  } catch (erro) {
    container.innerHTML = `<p class="erro">Não foi possível carregar as questões agora. Tente novamente em instantes.</p>`;
    console.error(erro);
  }
}

function criarCardQuestao(q) {
  const contextoHtml = q.context ? marked.parse(q.context) : "";
  const imagensQuestao = (q.files || [])
    .map((url) => `<img class="questao-imagem" src="${url}" alt="Imagem de apoio da questão ${q.index}">`)
    .join("");

  const alternativasHtml = q.alternatives.map((alt) => `
    <li class="alternativa">
      <span class="alternativa-letra">${alt.letter}</span>
      <span class="alternativa-conteudo">
        ${alt.text ? alt.text : ""}
        ${alt.file ? `<img class="alternativa-imagem" src="${alt.file}" alt="Alternativa ${alt.letter}">` : ""}
      </span>
    </li>
  `).join("");

  return `
    <div class="questao-card">
      <div class="questao-topo">
        <span class="questao-tag">ENEM ${q.year}</span>
        <span class="questao-tag questao-tag--sutil">${rotuloDisciplina(q.discipline)}</span>
      </div>
      <div class="questao-contexto">${contextoHtml}</div>
      ${imagensQuestao}
      <p class="questao-introducao">${q.alternativesIntroduction || ""}</p>
      <ul class="questao-alternativas">${alternativasHtml}</ul>
      <button class="ver-resposta-btn" data-correta="${q.correctAlternative}">Ver resposta</button>
      <p class="questao-resposta" hidden>Resposta correta: alternativa ${q.correctAlternative}</p>
    </div>
  `;
}

function ligarBotoesDeResposta(container) {
  container.querySelectorAll(".ver-resposta-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const respostaEl = botao.nextElementSibling;
      respostaEl.hidden = false;
      botao.disabled = true;
      botao.textContent = "Resposta revelada";
    });
  });
}

function rotuloDisciplina(disciplina) {
  const rotulos = {
    linguagens: "Linguagens",
    "ciencias-humanas": "Ciências Humanas",
    "ciencias-natureza": "Ciências da Natureza",
    matematica: "Matemática",
  };
  return rotulos[disciplina] || disciplina || "";
}
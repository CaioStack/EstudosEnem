async function renderizarTopicos(materiaId) {
  const painel = document.getElementById("painel-materia");
  painel.innerHTML = "<p>Carregando...</p>";

  const dados = await carregarConteudo(materiaId);

  painel.innerHTML = `
    <ul class="lista-topicos">
      ${dados.topicos.map((topico) => `
        <li>
          <button class="topico-btn" data-topico="${topico.id}">
            <strong>${topico.titulo}</strong>
            <span>${topico.resumo}</span>
          </button>
        </li>
      `).join("")}
    </ul>
    <div id="artigo-topico"></div>
  `;

  painel.querySelectorAll(".topico-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const topico = dados.topicos.find((t) => t.id === botao.dataset.topico);
      renderizarArtigo(topico);
    });
  });
}

function renderizarArtigo(topico) {
  const artigo = document.getElementById("artigo-topico");
  artigo.innerHTML = `
    <article class="artigo">
      <h2>${topico.titulo}</h2>
      <div class="texto-artigo">${topico.texto}</div>
      <h3>Questões do ENEM sobre este conteúdo</h3>
      <div id="lista-questoes-topico"></div>
    </article>
  `;
  renderizarQuestoes(topico.questoes, "lista-questoes-topico");
  // renderizarQuestoes é definida na v0.6
}
function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function renderizarTopicos(materiaId) {
  const painel = document.getElementById("painel-materia");

  painel.innerHTML = `
    <div class="estado-carregamento">
      <span class="spinner"></span>
      Carregando conteúdo...
    </div>
  `;

  try {
    const dados = await carregarConteudo(materiaId);
    const topicos = Array.isArray(dados.topicos) ? dados.topicos : [];

    document.title = `${dados.nome} — Estudos ENEM`;

    painel.innerHTML = `
      <section class="hero-materia" style="--cor-materia: ${dados.cor}">
        <div class="materia-simbolo">${dados.icone}</div>
        <div>
          <p class="eyebrow">Área do conhecimento</p>
          <h1>${escaparHtml(dados.nome)}</h1>
          <p>${escaparHtml(dados.descricao)}</p>
        </div>
      </section>

      <section class="ferramentas-materia">
        <label class="campo-busca">
          <span>Buscar assunto</span>
          <input
            id="busca-topicos"
            type="search"
            placeholder="Ex.: função, ecologia, interpretação..."
            autocomplete="off"
          >
        </label>

        <span class="total-topicos">
          ${topicos.length} assunto(s)
        </span>
      </section>

      <section id="grid-topicos" class="grid-topicos">
        ${topicos.map((topico, indice) => `
          <button
            type="button"
            class="topico-card"
            data-topico="${escaparHtml(topico.id)}"
            style="--cor-materia: ${dados.cor}"
          >
            <span class="topico-numero">${String(indice + 1).padStart(2, "0")}</span>
            <strong>${escaparHtml(topico.titulo)}</strong>
            <span class="topico-resumo">${escaparHtml(topico.resumo)}</span>
            <span class="topico-nivel">${escaparHtml(topico.nivel || "Estudo")}</span>
          </button>
        `).join("")}
      </section>

      <div id="sem-resultados" class="aviso-vazio" hidden>
        Nenhum assunto encontrado para essa busca.
      </div>

      <section id="artigo-topico"></section>
    `;

    const campoBusca = document.getElementById("busca-topicos");
    const grid = document.getElementById("grid-topicos");
    const semResultados = document.getElementById("sem-resultados");

    campoBusca.addEventListener("input", () => {
      const termo = normalizarTexto(campoBusca.value.trim());
      let visiveis = 0;

      grid.querySelectorAll(".topico-card").forEach((card) => {
        const conteudo = normalizarTexto(card.textContent);
        const mostrar = !termo || conteudo.includes(termo);

        card.hidden = !mostrar;
        if (mostrar) visiveis++;
      });

      semResultados.hidden = visiveis > 0;
    });

    grid.querySelectorAll(".topico-card").forEach((card) => {
      card.addEventListener("click", () => {
        const topico = topicos.find(
          (item) => item.id === card.dataset.topico
        );

        grid.querySelectorAll(".topico-card").forEach((item) => {
          item.classList.remove("selecionado");
        });

        card.classList.add("selecionado");
        renderizarArtigo(topico, dados);
      });
    });
  } catch (erro) {
    painel.innerHTML = `
      <div class="aviso-vazio">
        Não foi possível carregar esta matéria agora.
      </div>
    `;
    console.error(erro);
  }
}

function renderizarArtigo(topico, dados) {
  const artigo = document.getElementById("artigo-topico");
  const questoes = Array.isArray(topico.questoesRelacionadas)
    ? topico.questoesRelacionadas
    : [];

  artigo.innerHTML = `
    <article class="artigo-topico" style="--cor-materia: ${dados.cor}">
      <div class="artigo-cabecalho">
        <p class="eyebrow">${escaparHtml(dados.nome)}</p>
        <h2>${escaparHtml(topico.titulo)}</h2>
        <div class="artigo-meta">
          <span>${escaparHtml(topico.nivel || "Estudo")}</span>
          <span>Questões reais do ENEM</span>
        </div>
      </div>

      <div class="texto-artigo">
        ${textoParaHtml(topico.texto)}
      </div>

      ${
        topico.dica
          ? `
            <aside class="caixa-dica">
              <strong>Como cai no ENEM</strong>
              <p>${escaparHtml(topico.dica)}</p>
            </aside>
          `
          : ""
      }

      <section class="area-questoes">
        <div class="area-questoes-cabecalho">
          <h3>Questões para prática</h3>
          <p>Gabarito oficial carregado pela API do ENEM.</p>
        </div>
        <div id="lista-questoes-topico"></div>
      </section>
    </article>
  `;

  renderizarQuestoes(questoes, "lista-questoes-topico");

  requestAnimationFrame(() => {
    artigo.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}
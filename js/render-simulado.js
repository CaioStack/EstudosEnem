async function renderizarListaSimulados() {
  const painel = document.getElementById("painel-simulados");

  painel.innerHTML = `
    <div class="estado-carregamento">
      <span class="spinner"></span>
      Carregando simulados...
    </div>
  `;

  try {
    const prefixo = location.pathname.includes("/pages/") ? "../" : "";

    const resposta = await fetch(
      `${prefixo}data/simulados/simulados.json`
    );

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar o índice de simulados.");
    }

    const simulados = await resposta.json();

    simulados.sort((a, b) => b.ano - a.ano);

    painel.innerHTML = `
      <section class="hero-simulados">
        <p class="eyebrow">Provas completas</p>
        <h1>Simulados ENEM</h1>
        <p>
          Questões objetivas carregadas diretamente da API oficial da comunidade
          enem.dev, com redação e gabarito.
        </p>
      </section>

      <section class="grid-simulados">
        ${simulados.map((simulado) => `
          <a
            class="card-simulado"
            href="pages/simulado.html?id=${encodeURIComponent(simulado.id)}"
          >
            <span class="simulado-ano">${escaparHtml(simulado.ano)}</span>
            <strong>${escaparHtml(simulado.titulo)}</strong>
            <span class="simulado-info">
              Questões objetivas + redação
            </span>
            <span class="simulado-tema">
              ${escaparHtml(simulado.redacao?.tema || "Tema disponível na prova")}
            </span>
            <span class="simulado-acao">
              Iniciar simulado
              <span aria-hidden="true">→</span>
            </span>
          </a>
        `).join("")}
      </section>
    `;
  } catch (erro) {
    painel.innerHTML = `
      <div class="aviso-vazio">
        Não foi possível carregar a lista de simulados.
      </div>
    `;
    console.error(erro);
  }
}
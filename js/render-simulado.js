async function renderizarListaSimulados() {
  const painel = document.getElementById("painel-simulados");
  painel.innerHTML = `<p class="carregando">Carregando simulados...</p>`;

  try {
    const resposta = await fetch("data/simulados/simulados.json");
    const simulados = await resposta.json();

    painel.innerHTML = `
      <div class="grid-simulados">
        ${simulados.map((s) => `
          <a class="card-simulado" href="pages/simulado.html?id=${s.id}">
            <strong>${s.titulo}</strong>
            <span>90 + 90 questões · Redação</span>
          </a>
        `).join("")}
      </div>
    `;
  } catch (erro) {
    painel.innerHTML = `<p class="erro">Não foi possível carregar a lista de simulados.</p>`;
    console.error(erro);
  }
}
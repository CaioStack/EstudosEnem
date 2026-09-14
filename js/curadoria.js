document.getElementById("buscar-curadoria-btn").addEventListener("click", async () => {
  const ano = document.getElementById("filtro-ano").value;
  const disciplina = document.getElementById("filtro-disciplina").value;
  const resultado = document.getElementById("resultado-curadoria");
  resultado.innerHTML = "<p>Carregando...</p>";

  const questoes = await buscarProvaCompleta(ano);
  const filtradas = questoes.filter((q) => q.discipline === disciplina);

  resultado.innerHTML = filtradas.map((q) => `
    <div class="questao-card">
      <p><strong>Questão ${q.index}</strong> — ${q.title}</p>
      <p>${(q.context || "").slice(0, 140)}...</p>
      <button class="copiar-ref-btn" data-ano="${q.year}" data-indice="${q.index}">
        Copiar referência
      </button>
    </div>
  `).join("");

  resultado.querySelectorAll(".copiar-ref-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const referencia = JSON.stringify({ ano: Number(botao.dataset.ano), indice: Number(botao.dataset.indice) });
      navigator.clipboard.writeText(referencia);
      botao.textContent = "Copiado!";
      setTimeout(() => (botao.textContent = "Copiar referência"), 1500);
    });
  });
});
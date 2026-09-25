function escaparHtml(valor = "") {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function textoParaHtml(texto = "") {
  const bruto = String(texto || "").trim();

  if (!bruto) return "";

  // Conteúdo local já pode vir formatado em HTML.
  if (bruto.startsWith("<")) return bruto;

  let html = escaparHtml(bruto);

  html = html
    .replace(/\*\*(.*?)\*\*/gs, "<strong>$1</strong>")
    .replace(/__(.*?)__/gs, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gs, "<em>$1</em>");

  return html
    .split(/\n{2,}/)
    .map((bloco) => {
      const limpo = bloco.trim();

      if (!limpo) return "";

      if (limpo.startsWith("### ")) {
        return `<h3>${limpo.slice(4)}</h3>`;
      }

      if (limpo.startsWith("## ")) {
        return `<h2>${limpo.slice(3)}</h2>`;
      }

      return `<p>${limpo.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

async function renderizarQuestoes(referencias, idContainer) {
  const container = document.getElementById(idContainer);

  if (!container) return;

  referencias = Array.isArray(referencias) ? referencias : [];

  if (referencias.length === 0) {
    container.innerHTML = `
      <div class="aviso-vazio">
        Questões em curadoria para este assunto.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="carregando-questoes">
      <span class="spinner"></span>
      Carregando questões reais do ENEM...
    </div>
  `;

  try {
    const resultados = await Promise.allSettled(
      referencias.map((referencia) => {
        if (referencia && Array.isArray(referencia.alternatives)) {
          return Promise.resolve(referencia);
        }

        return buscarQuestao(referencia.ano, referencia.indice);
      })
    );

    const questoes = resultados
      .filter((resultado) => resultado.status === "fulfilled")
      .map((resultado) => resultado.value);

    const falhas = resultados.length - questoes.length;

    if (questoes.length === 0) {
      throw new Error("Nenhuma questão pôde ser carregada.");
    }

    container.innerHTML = `
      ${falhas > 0 ? `
        <div class="aviso-compacto">
          ${falhas} questão(ões) não pôde(puderam) ser carregada(s).
        </div>
      ` : ""}
      ${questoes.map(criarCardQuestao).join("")}
    `;

    ligarBotoesDeResposta(container);
  } catch (erro) {
    container.innerHTML = `
      <div class="aviso-vazio">
        Não foi possível carregar as questões agora.
        Verifique sua conexão e tente novamente.
      </div>
    `;
    console.error(erro);
  }
}

function criarCardQuestao(questao) {
  const contextoHtml = textoParaHtml(questao.context || "");
  const introducaoHtml = textoParaHtml(questao.alternativesIntroduction || "");

  const imagensHtml = (questao.files || [])
    .map((url) => `
      <img
        class="questao-imagem"
        src="${escaparHtml(url)}"
        alt="Imagem de apoio da questão ${escaparHtml(questao.index || "")}"
        loading="lazy"
      >
    `)
    .join("");

  const alternativasHtml = (questao.alternatives || [])
    .map((alternativa) => `
      <button
        type="button"
        class="alternativa"
        data-letra="${escaparHtml(alternativa.letter || "")}"
      >
        <span class="alternativa-letra">
          ${escaparHtml(alternativa.letter || "")}
        </span>
        <span class="alternativa-conteudo">
          ${textoParaHtml(alternativa.text || "")}
          ${
            alternativa.file
              ? `
                <img
                  class="alternativa-imagem"
                  src="${escaparHtml(alternativa.file)}"
                  alt="Alternativa ${escaparHtml(alternativa.letter || "")}"
                  loading="lazy"
                >
              `
              : ""
          }
        </span>
      </button>
    `)
    .join("");

  return `
    <article class="questao-card">
      <div class="questao-topo">
        <span class="questao-tag">ENEM ${escaparHtml(questao.year || "")}</span>
        <span class="questao-tag questao-tag--sutil">
          ${escaparHtml(rotuloDisciplina(questao.discipline))}
        </span>
      </div>

      <h3 class="questao-titulo">
        ${escaparHtml(questao.title || `Questão ${questao.index || ""}`)}
      </h3>

      ${contextoHtml ? `<div class="questao-contexto">${contextoHtml}</div>` : ""}
      ${imagensHtml}
      ${introducaoHtml ? `<div class="questao-introducao">${introducaoHtml}</div>` : ""}

      <div class="questao-alternativas">
        ${alternativasHtml}
      </div>

      <button
        type="button"
        class="ver-resposta-btn"
        data-correta="${escaparHtml(questao.correctAlternative || "")}"
      >
        Ver resposta
      </button>

      <div class="questao-resposta" hidden></div>
    </article>
  `;
}

function ligarBotoesDeResposta(container) {
  container.querySelectorAll(".ver-resposta-btn").forEach((botao) => {
    botao.addEventListener("click", () => {
      const card = botao.closest(".questao-card");
      const resposta = card.querySelector(".questao-resposta");
      const correta = botao.dataset.correta;

      card.querySelectorAll(".alternativa").forEach((alternativa) => {
        alternativa.disabled = true;

        if (correta && alternativa.dataset.letra === correta) {
          alternativa.classList.add("correta");
        } else {
          alternativa.classList.add("incorreta");
        }
      });

      resposta.innerHTML = correta
        ? `Resposta correta: <strong>alternativa ${escaparHtml(correta)}</strong>`
        : "Gabarito não informado pela API.";

      resposta.hidden = false;
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
    matematica: "Matemática"
  };

  return rotulos[disciplina] || disciplina || "";
}
const QUESTOES_POR_CARREGAMENTO = 10;

function configurarDia(containerId, totalId, questoes) {
  const container = document.getElementById(containerId);
  const total = document.getElementById(totalId);

  if (!container) return;

  if (total) {
    total.textContent = `${questoes.length} questões`;
  }

  if (!questoes.length) {
    container.innerHTML = `
      <div class="aviso-vazio">
        Nenhuma questão foi encontrada para este dia.
      </div>
    `;
    return;
  }

  let exibidas = 0;

  function atualizarControle() {
    const secao = container.closest(".bloco-dia");

    secao
      .querySelectorAll(".controle-lista")
      .forEach((elemento) => elemento.remove());

    if (exibidas >= questoes.length) {
      const controle = document.createElement("div");
      controle.className = "controle-lista";
      controle.innerHTML = `
        <span class="fim-lista">
          Todas as questões deste dia foram carregadas.
        </span>
      `;
      secao.appendChild(controle);
      return;
    }

    const controle = document.createElement("div");
    controle.className = "controle-lista";

    const restantes = questoes.length - exibidas;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "carregar-mais";
    botao.textContent = `Carregar mais ${Math.min(
      QUESTOES_POR_CARREGAMENTO,
      restantes
    )} questões`;

    botao.addEventListener("click", mostrarProximas);

    controle.appendChild(botao);
    secao.appendChild(controle);
  }

  function mostrarProximas() {
    const inicio = exibidas;
    const fim = Math.min(
      exibidas + QUESTOES_POR_CARREGAMENTO,
      questoes.length
    );

    const bloco = questoes.slice(inicio, fim);

    if (inicio === 0) {
      container.innerHTML = "";
    }

    container.insertAdjacentHTML(
      "beforeend",
      bloco.map(criarCardQuestao).join("")
    );

    ligarBotoesDeResposta(container);

    exibidas = fim;
    atualizarControle();
  }

  mostrarProximas();
}

async function iniciarPaginaSimulado() {
  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get("id");
  const status = document.getElementById("status-carregamento");

  status.className = "status-api";
  status.innerHTML = `
    <span class="spinner"></span>
    Preparando simulado...
  `;

  try {
    const indice = await (
      await fetch("../data/simulados/simulados.json")
    ).json();

    const simulado = indice.find((item) => item.id === id);

    if (!simulado) {
      throw new Error(`Simulado "${id}" não encontrado.`);
    }

    document.title = `${simulado.titulo} — Estudos ENEM`;
    document.getElementById("titulo-simulado").textContent = simulado.titulo;
    document.getElementById("simulado-ano").textContent = simulado.ano;
    document.getElementById("total-redacao").textContent =
      simulado.redacao?.tema ? "1 tema" : "—";

    const botaoGabarito = document.getElementById("mostrar-gabarito-btn");
    const painelGabarito = document.getElementById("gabarito-geral");

    botaoGabarito.disabled = false;
    botaoGabarito.textContent = "Mostrar gabarito geral";
    painelGabarito.hidden = true;
    painelGabarito.innerHTML = "";

    const todasQuestoes = await buscarProvaCompleta(
      simulado.ano,
      (carregadas, total) => {
        status.innerHTML = `
          <span class="spinner"></span>
          Baixando questões da API:
          <strong>${carregadas}</strong>
          ${total ? ` de ${total}` : ""}
        `;
      }
    );

    const dia1 = todasQuestoes
      .filter((questao) =>
        ["linguagens", "ciencias-humanas"].includes(questao.discipline)
      )
      .sort((a, b) => a.index - b.index);

    const dia2 = todasQuestoes
      .filter((questao) =>
        ["ciencias-natureza", "matematica"].includes(questao.discipline)
      )
      .sort((a, b) => a.index - b.index);

    document.getElementById("total-questoes").textContent =
      todasQuestoes.length;

    configurarDia("questoes-dia-1", "total-dia-1", dia1);
    configurarDia("questoes-dia-2", "total-dia-2", dia2);

    const areaRedacao = document.getElementById("area-redacao");
    const redacao = simulado.redacao || {};

    if (redacao.tema) {
      const textoApoio =
        redacao.textoApoio ||
        (Array.isArray(redacao.textosMotivadores)
          ? redacao.textosMotivadores.join("\n\n")
          : "");

      areaRedacao.innerHTML = `
        <div class="redacao-tema">
          <span>Tema proposto</span>
          <h3>${escaparHtml(redacao.tema)}</h3>
        </div>

        ${
          textoApoio
            ? `<div class="redacao-apoio">${textoParaHtml(textoApoio)}</div>`
            : ""
        }

        <label class="campo-redacao">
          <span>Escreva sua redação</span>
          <textarea
            id="texto-redacao"
            rows="16"
            placeholder="Desenvolva sua dissertação argumentativa..."
          ></textarea>
        </label>

        <div class="rodape-redacao">
          <span id="caracteres-redacao">0 caracteres</span>
          <span>Salvamento automático neste navegador</span>
        </div>
      `;

      const textarea = document.getElementById("texto-redacao");
      const contador = document.getElementById("caracteres-redacao");
      const chaveRedacao = `estudos-enem-redacao-${simulado.id}`;

      textarea.value = localStorage.getItem(chaveRedacao) || "";

      function atualizarContagem() {
        contador.textContent = `${textarea.value.length} caracteres`;
      }

      textarea.addEventListener("input", () => {
        localStorage.setItem(chaveRedacao, textarea.value);
        atualizarContagem();
      });

      atualizarContagem();
    } else {
      areaRedacao.innerHTML = `
        <div class="aviso-vazio">
          Tema de redação não cadastrado para este simulado.
        </div>
      `;
    }

    const todasOrdenadas = [...dia1, ...dia2].sort(
      (a, b) => a.index - b.index
    );

    botaoGabarito.addEventListener("click", () => {
      painelGabarito.innerHTML = `
        <div class="gabarito-grade">
          ${todasOrdenadas.map((questao) => `
            <span>
              <strong>${String(questao.index).padStart(3, "0")}</strong>
              ${escaparHtml(questao.correctAlternative || "—")}
            </span>
          `).join("")}
        </div>
      `;

      painelGabarito.hidden = false;
      botaoGabarito.disabled = true;
      botaoGabarito.textContent = "Gabarito revelado";
    });

    status.className = "status-api status-sucesso";
    status.innerHTML = `
      <strong>Simulado carregado.</strong>
      <span>
        Use os botões de cada dia para carregar mais questões sem travar a página.
      </span>
    `;
  } catch (erro) {
    console.error(erro);

    status.className = "status-api status-erro";
    status.innerHTML = `
      <div>
        <strong>Não foi possível carregar este simulado.</strong>
        <span>
          A API pode estar fora do ar, limitada ou sua conexão pode ter falhado.
        </span>
      </div>
      <button type="button" id="tentar-novamente">Tentar novamente</button>
    `;

    document
      .getElementById("tentar-novamente")
      .addEventListener("click", iniciarPaginaSimulado);
  }
}

document.addEventListener("DOMContentLoaded", iniciarPaginaSimulado);
const ENEM_API_BASE = "https://api.enem.dev/v1";
const LIMITE_PAGINA = 10;

const cacheQuestoes = new Map();
const cacheProvas = new Map();

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiEnem(caminho) {
  const resposta = await fetch(`${ENEM_API_BASE}${caminho}`);

  if (!resposta.ok) {
    const erro = new Error(
      `Falha na API ENEM: ${resposta.status} ${resposta.statusText}`
    );
    erro.status = resposta.status;
    throw erro;
  }

  return resposta.json();
}

async function apiEnemComRetry(caminho, tentativas = 3) {
  let ultimoErro;

  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    try {
      return await apiEnem(caminho);
    } catch (erro) {
      ultimoErro = erro;

      const podeTentarNovamente =
        tentativa < tentativas - 1 &&
        [429, 500, 502, 503, 504].includes(erro.status);

      if (!podeTentarNovamente) throw erro;

      await aguardar(450 * (tentativa + 1));
    }
  }

  throw ultimoErro;
}

async function buscarQuestao(ano, indice) {
  ano = Number(ano);
  indice = Number(indice);

  const chave = `${ano}-${indice}`;

  if (cacheQuestoes.has(chave)) {
    return cacheQuestoes.get(chave);
  }

  const questao = await apiEnemComRetry(
    `/exams/${ano}/questions/${indice}`
  );

  cacheQuestoes.set(chave, questao);
  return questao;
}

async function buscarProvaCompleta(ano, aoAtualizarProgresso = null) {
  ano = Number(ano);

  if (cacheProvas.has(ano)) {
    return cacheProvas.get(ano);
  }

  const questoes = [];
  let offset = 0;
  let metadata = {};

  do {
    const dados = await apiEnemComRetry(
      `/exams/${ano}/questions?limit=${LIMITE_PAGINA}&offset=${offset}`
    );

    const bloco = Array.isArray(dados.questions) ? dados.questions : [];

    questoes.push(...bloco);
    metadata = dados.metadata || {};

    if (typeof aoAtualizarProgresso === "function") {
      aoAtualizarProgresso(questoes.length, metadata.total || null);
    }

    offset += LIMITE_PAGINA;

    if (!metadata.hasMore) break;
    if (metadata.total && questoes.length >= metadata.total) break;
    if (bloco.length === 0) break;
  } while (true);

  cacheProvas.set(ano, questoes);
  return questoes;
}

async function listarAnosDisponiveis() {
  const dados = await apiEnemComRetry("/exams");

  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados.exams)) return dados.exams;

  return [];
}
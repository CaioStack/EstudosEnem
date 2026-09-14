const ENEM_API_BASE = "https://api.enem.dev/v1";

const cacheQuestoes = new Map();
const cacheProvas = new Map();

async function buscarQuestao(ano, indice) {
  const chave = `${ano}-${indice}`;
  if (cacheQuestoes.has(chave)) return cacheQuestoes.get(chave);

  const resposta = await fetch(`${ENEM_API_BASE}/exams/${ano}/questions/${indice}`);
  if (!resposta.ok) {
    throw new Error(`Falha ao carregar a questão ${indice} do ENEM ${ano} (status ${resposta.status})`);
  }
  const questao = await resposta.json();
  cacheQuestoes.set(chave, questao);
  return questao;
}

async function buscarProvaCompleta(ano) {
  if (cacheProvas.has(ano)) return cacheProvas.get(ano);

  const resposta = await fetch(`${ENEM_API_BASE}/exams/${ano}/questions?limit=180&offset=0`);
  if (!resposta.ok) {
    throw new Error(`Falha ao carregar a prova do ENEM ${ano} (status ${resposta.status})`);
  }
  const dados = await resposta.json();
  cacheProvas.set(ano, dados.questions);
  return dados.questions;
}

async function listarAnosDisponiveis() {
  const resposta = await fetch(`${ENEM_API_BASE}/exams`);
  if (!resposta.ok) throw new Error("Falha ao listar as provas disponíveis");
  return resposta.json();
}
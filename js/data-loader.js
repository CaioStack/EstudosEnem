const cacheDeConteudos = {};

async function carregarConteudo(materiaId) {
  if (cacheDeConteudos[materiaId]) return cacheDeConteudos[materiaId];

  const resposta = await fetch(`data/conteudos/${materiaId}.json`);
  const dados = await resposta.json();
  cacheDeConteudos[materiaId] = dados;
  return dados;
}
const cacheDeConteudos = {};

async function carregarConteudo(materiaId) {
  if (cacheDeConteudos[materiaId]) {
    return cacheDeConteudos[materiaId];
  }

  // Novo banco de conteúdo embutido.
  if (window.CONTEUDOS && window.CONTEUDOS[materiaId]) {
    cacheDeConteudos[materiaId] = window.CONTEUDOS[materiaId];
    return cacheDeConteudos[materiaId];
  }

  // Compatibilidade com os arquivos antigos.
  const prefixo = location.pathname.includes("/pages/") ? "../" : "";

  const resposta = await fetch(
    `${prefixo}data/conteudos/${encodeURIComponent(materiaId)}.json`
  );

  if (!resposta.ok) {
    throw new Error(`Conteúdo não encontrado: ${materiaId}`);
  }

  const dados = await resposta.json();
  cacheDeConteudos[materiaId] = dados;

  return dados;
}
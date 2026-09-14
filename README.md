# 🎓 Estudos ENEM

> Plataforma web para preparação para o ENEM, reunindo conteúdos, questões e simulados em um só lugar.

---

## 🚀 Sobre

O **Estudos ENEM** organiza os conteúdos por área, permitindo estudar os assuntos, praticar com questões e realizar simulados completos.

### 📖 Áreas

* 🗣️ Linguagens
* 🌎 Ciências Humanas
* 🔬 Ciências da Natureza
* 📐 Matemática
* ✍️ Redação

---

## 🛠️ Tecnologias

`HTML5` · `CSS3` · `JavaScript` · `JSON`

**Hospedagem:** GitHub Pages

---

## 📁 Estrutura

```text
estudos-enem/
│
├── 📄 index.html
├── 📄 README.md
│
├── 🎨 css/
│   ├── variables.css
│   ├── base.css
│   ├── components.css
│   └── layout.css
│
├── ⚡ js/
│   ├── theme.js
│   ├── router.js
│   ├── tabs.js
│   ├── data-loader.js
│   ├── render-materia.js
│   ├── render-questao.js
│   ├── render-simulado.js
│   └── render-simulado-pagina.js
│
├── 📄 pages/
│   ├── materia.html
│   └── simulado.html
│
└── 🗂️ data/
    ├── materias.json
    │
    ├── conteudos/
    │   ├── matematica.json
    │   ├── linguagens.json
    │   ├── humanas.json
    │   ├── natureza.json
    │   └── redacao.json
    │
    └── simulados/
        ├── simulado-01.json
        ├── simulado-02.json
        ├── ...
        └── simulado-20.json
```

---

## ✨ Recursos

* 📚 Conteúdos organizados por matéria
* ❓ Questões com gabarito
* 📝 20 simulados
* ✍️ Área para redação
* 🌓 Tema claro e escuro
* 📱 Interface responsiva
* 💾 Conteúdos carregados através de JSON

---

## 👨‍💻 Desenvolvedor

**Caio Salgado Marques**

---

## Versão Atual - v0.6

# v0.6 — Motor de questões via API do ENEM + visual profissional

**Objetivo:** parar de digitar questão por questão e passar a consumir a api.enem.dev; primeiro polimento visual (tipografia, cantos arredondados, sombras).

## O que mudou
- `js/enem-api.js` (novo): cliente da API com cache em memória.
- `js/render-questao.js`: reescrito para buscar questões reais (enunciado, alternativas, imagens, gabarito) a partir de `{ano, indice}`.
- `data/conteudos/*.json`: tópicos agora guardam `questoesRelacionadas` (referências leves) em vez do texto completo da questão.
- `pages/curadoria.html` + `js/curadoria.js` (novo, uso interno): ferramenta para achar e copiar referências de questões por ano/disciplina.
- `css/variables.css`, `css/base.css`, `css/components.css`: fonte Inter, `--raio`, `--sombra`, cards de questão redesenhados.

## Como testar
Abra um tópico com `questoesRelacionadas` preenchido e confira se a questão carrega da API (enunciado, imagem quando houver, alternativas e botão "Ver resposta"). Pode ser que dê erro de CORS.

## Próxima versão
v0.7 — navegação lateral (sidebar) no lugar das abas no topo.
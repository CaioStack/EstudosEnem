(() => {
  const data = window.ENEM_DATA;
  if (!data) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "estudosEnem.v1";
  const state = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  })();
  state.completed = state.completed || [];
  state.essay = state.essay || [];
  state.plan = state.plan || {};
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

  function renderSubjects() {
    const grid = $("#subjectGrid");
    if (!grid) return;
    const featured = data.subjects.filter(s => ["matematica","fisica","quimica","biologia","portugues"].includes(s.id));
    grid.innerHTML = featured.map(s => `<button class="subject-card" type="button" data-jump="${s.id}"><span class="subject-icon">${s.icon}</span><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description)}</p><span class="subject-bottom"><span>${s.topics.length} tópicos de estudo</span><span>→</span></span></button>`).join("");
    grid.querySelectorAll("[data-jump]").forEach(btn => btn.addEventListener("click", () => {
      const target = document.querySelector(`[data-group="${btn.dataset.jump}"]`);
      if (target) { target.open = true; target.scrollIntoView({behavior:"smooth",block:"center"}); }
      else document.querySelector("#lista-materias")?.scrollIntoView({behavior:"smooth"});
    }));
  }

  function renderTopics(filter = "") {
    const root = $("#topicGroups");
    if (!root) return;
    const query = filter.trim().toLocaleLowerCase("pt-BR");
    const filtered = data.subjects.map(subject => ({
      ...subject,
      topics: subject.topics.map((topic, index) => ({topic,index})).filter(item =>
        !query || subject.name.toLocaleLowerCase("pt-BR").includes(query) || item.topic.toLocaleLowerCase("pt-BR").includes(query))
    })).filter(subject => subject.topics.length);
    if (!filtered.length) {
      root.innerHTML = `<div class="topic-empty">Nenhum conteúdo encontrado. Tente outra palavra-chave.</div>`;
      return;
    }
    root.innerHTML = filtered.map(subject => `<details class="topic-group" data-group="${subject.id}" ${query ? "open" : ""}>
      <summary><span class="group-icon">${subject.icon}</span><span>${escapeHtml(subject.name)}</span><span class="group-count">${subject.topics.length} tópicos</span></summary>
      <div class="topic-list">${subject.topics.map(({topic,index}) => {
        const id = `${subject.id}-${index}`, checked = state.completed.includes(id);
        return `<label class="topic-item ${checked ? "done" : ""}"><input type="checkbox" data-topic="${id}" ${checked ? "checked" : ""}><span>${escapeHtml(topic)}</span></label>`;
      }).join("")}</div></details>`).join("");
    root.querySelectorAll("[data-topic]").forEach(input => input.addEventListener("change", () => {
      const id = input.dataset.topic;
      state.completed = input.checked ? [...new Set([...state.completed,id])] : state.completed.filter(item => item !== id);
      input.closest(".topic-item").classList.toggle("done", input.checked);
      saveState(); updateProgress();
    }));
  }

  function updateProgress() {
    const total = data.subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
    const count = state.completed.length;
    const percent = total ? Math.round(count / total * 100) : 0;
    if ($("#heroProgress")) $("#heroProgress").textContent = `${percent}%`;
    if ($("#heroProgressBar")) $("#heroProgressBar").style.width = `${percent}%`;
    if ($("#heroTopics")) $("#heroTopics").textContent = count;
  }

  function setupEssayChecklist() {
    const checks = $$("[data-essay]");
    checks.forEach(input => {
      input.checked = state.essay.includes(Number(input.dataset.essay));
      input.closest("label").classList.toggle("checked", input.checked);
      input.addEventListener("change", () => {
        const id = Number(input.dataset.essay);
        state.essay = input.checked ? [...new Set([...state.essay,id])] : state.essay.filter(item => item !== id);
        input.closest("label").classList.toggle("checked", input.checked);
        saveState(); updateEssayProgress();
      });
    });
    updateEssayProgress();
  }
  function updateEssayProgress() {
    const count = state.essay.length, percent = count / 5 * 100;
    if ($("#essayProgressText")) $("#essayProgressText").textContent = `${count} de 5 itens concluídos`;
    if ($("#essayProgressBar")) $("#essayProgressBar").style.width = `${percent}%`;
  }

  function setupPlan() {
    const root = $("#planDays");
    if (!root) return;
    const days = [["SEG","Segunda"],["TER","Terça"],["QUA","Quarta"],["QUI","Quinta"],["SEX","Sexta"],["SÁB","Sábado"],["DOM","Domingo"]];
    const options = ["Descanso","Matemática","Linguagens","Ciências da Natureza","Ciências Humanas","Redação","Simulado","Revisão"];
    root.innerHTML = days.map(([short, full]) => `<label class="plan-day"><span>${short}</span><select aria-label="Foco de ${full}" data-day="${short}">${options.map(option => `<option ${state.plan[short] === option ? "selected" : ""}>${option}</option>`).join("")}</select></label>`).join("");
    root.querySelectorAll("select").forEach(select => select.addEventListener("change", () => { state.plan[select.dataset.day] = select.value; saveState(); }));
  }

  let quizIndex = 0, score = 0, selected = null, answered = false;
  function renderQuiz() {
    const panel = $("#quizPanel");
    if (!panel) return;
    const q = data.questions[quizIndex];
    if (!q) {
      const total = data.questions.length;
      panel.innerHTML = `<div class="quiz-result"><div class="empty-icon">✦</div><span class="eyebrow">SIMULADO CONCLUÍDO</span><div class="result-score">${score}/${total}</div><h3>${score === total ? "Excelente resultado!" : score >= 3 ? "Bom trabalho!" : "Continue praticando!"}</h3><p>Você acertou ${score} de ${total} questões. ${score === total ? "Aproveite o embalo e escolha outro conteúdo para revisar." : "Revise os comentários das questões e tente novamente para consolidar o aprendizado."}</p><div class="result-actions"><button class="button button-primary" id="retryQuiz">Tentar novamente ↻</button><button class="button quiz-secondary" id="backToSubjects">Ver matérias →</button></div></div>`;
      $("#retryQuiz").addEventListener("click", startQuiz);
      $("#backToSubjects").addEventListener("click", () => $("#materias")?.scrollIntoView({behavior:"smooth"}));
      return;
    }
    panel.innerHTML = `<div class="quiz-topline"><span>QUESTÃO ${quizIndex+1} DE ${data.questions.length}</span><span>${escapeHtml(q.subject)}</span></div><div class="quiz-progress"><span style="width:${(quizIndex+1)/data.questions.length*100}%"></span></div><h3 class="quiz-question">${escapeHtml(q.question)}</h3><div class="quiz-options">${q.options.map((option,index) => `<button type="button" class="quiz-option ${selected === index ? "selected" : ""}" data-option="${index}" ${answered ? "disabled" : ""}><span class="option-letter">${String.fromCharCode(65+index)}</span><span>${escapeHtml(option)}</span></button>`).join("")}</div>${answered ? `<div class="quiz-feedback ${selected === q.answer ? "" : "incorrect"}">${selected === q.answer ? "<strong>Correto!</strong> " : "<strong>Vamos revisar.</strong> "}${escapeHtml(q.explanation)}</div>` : ""}<div class="quiz-actions"><button class="button quiz-secondary" id="resetQuiz">Reiniciar</button><button class="button button-primary" id="quizNext" ${selected === null ? "disabled" : ""}>${answered ? (quizIndex === data.questions.length-1 ? "Ver resultado" : "Próxima questão") : "Conferir resposta"} <span>→</span></button></div>`;
    panel.querySelectorAll("[data-option]").forEach(btn => btn.addEventListener("click", () => {
      if (answered) return;
      selected = Number(btn.dataset.option);
      panel.querySelectorAll("[data-option]").forEach(option => option.classList.toggle("selected", Number(option.dataset.option) === selected));
      $("#quizNext").disabled = false;
    }));
    $("#resetQuiz").addEventListener("click", startQuiz);
    $("#quizNext").addEventListener("click", () => {
      if (selected === null) return;
      if (!answered) {
        answered = true;
        if (selected === q.answer) score++;
        renderQuiz();
        panel.querySelectorAll("[data-option]").forEach(btn => {
          const value = Number(btn.dataset.option);
          if (value === q.answer) btn.classList.add("correct");
          else if (value === selected) btn.classList.add("wrong");
        });
      } else { quizIndex++; selected = null; answered = false; renderQuiz(); }
    });
  }
  function startQuiz() { quizIndex = 0; score = 0; selected = null; answered = false; renderQuiz(); }
  $("#startQuiz")?.addEventListener("click", () => { startQuiz(); $("#quizPanel")?.scrollIntoView({behavior:"smooth",block:"center"}); });

  $("#topicSearch")?.addEventListener("input", event => renderTopics(event.target.value));
  $("#menuToggle")?.addEventListener("click", () => {
    const nav = $("#mainNav"), button = $("#menuToggle");
    const open = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    button.textContent = open ? "×" : "☰";
  });
  $$("#mainNav a").forEach(link => link.addEventListener("click", () => {
    $("#mainNav").classList.remove("open");
    $("#menuToggle")?.setAttribute("aria-expanded","false");
    if ($("#menuToggle")) { $("#menuToggle").textContent = "☰"; $("#menuToggle").setAttribute("aria-label","Abrir menu"); }
  }));
  if ($("#currentYear")) $("#currentYear").textContent = new Date().getFullYear();
  renderSubjects(); renderTopics(); updateProgress(); setupEssayChecklist(); setupPlan();
})();
(() => {
  const data = window.ENEM_DATA;
  if (!data || !data.subjects || !Array.isArray(data.subjects)) {
    console.warn("ENEM data not loaded or invalid");
    return;
  }
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
        return `<label class="topic-item ${checked ? "done" : ""}"><input type="checkbox" data-topic="${id}" ${checked ? "checked" : ""}><span>${escapeHtml(topic)}</span><button type="button" class="view-questions-btn" data-topic-id="${id}">Ver questões</button></label>`;
      }).join("")}</div></details>`).join("");
    root.querySelectorAll("[data-topic]").forEach(input => input.addEventListener("change", () => {
      const id = input.dataset.topic;
      state.completed = input.checked ? [...new Set([...state.completed,id])] : state.completed.filter(item => item !== id);
      input.closest(".topic-item").classList.toggle("done", input.checked);
      saveState(); updateProgress();
    }));

    // Add event listeners for view questions buttons
    root.querySelectorAll(".view-questions-btn").forEach(button => {
      button.addEventListener("click", () => {
        const topicId = button.dataset.topicId;
        showQuestionsForTopic(topicId);
      });
    });
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

  function showQuestionsForTopic(topicId) {
    // Create modal if it doesn't exist
    let modal = $("#questionsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "questionsModal";
      modal.className = "questions-modal";
      modal.innerHTML = `
        <div class="questions-modal-content">
          <div class="questions-modal-header">
            <h3 id="questionsModalTitle">Questões do Tópico</h3>
            <button id="questionsModalCloseBtn" aria-label="Fechar">×</button>
          </div>
          <div id="questionsModalBody"></div>
        </div>
      `;
      document.body.appendChild(modal);

      function closeModal() {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
      }

      // Add close event listener
      $("#questionsModalCloseBtn")?.addEventListener("click", closeModal);

      // Close when clicking outside content
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Fechar com a tecla Esc
      modal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeModal();
          const btn = document.querySelector(`[data-topic-id="${topicId}"]`);
          btn?.focus();
        }
      });
    }

    // Get questions for this topic
    const questions = data.questionsByTopic?.[topicId] || [];

    // Update modal title based on topic
    const [subjectId, topicIndex] = topicId.split("-");
    const subject = data.subjects.find(s => s.id === subjectId);
    const topicName = subject ? subject.topics[parseInt(topicIndex)] : "";
    const $modalTitle = $("#questionsModalTitle");
    if ($modalTitle) $modalTitle.textContent = `Questões: ${topicName}`;

    // Display questions
    const questionsBody = $("#questionsModalBody");
    if (questions.length === 0) {
      questionsBody.innerHTML = "<p>Nenhuma questão disponível para este tópico.</p>";
    } else {
      questionsBody.innerHTML = questions.map((q, index) => {
        return `
          <div class="question-card">
            <div class="question-header">
              <span class="question-number">Questão ${index + 1}</span>
            </div>
            <div class="question-text">${escapeHtml(q.question)}</div>
            <div class="question-options">
              ${q.options.map((opt, optIndex) => {
                return `<label class="question-option">
                  <input type="radio" name="question-${index}" value="${optIndex}">
                  <span>${String.fromCharCode(65 + optIndex)}) ${escapeHtml(opt)}</span>
                </label>`;
              }).join("")}
            </div>
            ${q.explanation ? `<div class="question-explanation"><strong>Explicação:</strong> ${escapeHtml(q.explanation)}</div>` : ""}
          </div>
        `;
      }).join("");
    }

    // Show modal
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    $("#questionsModalCloseBtn")?.focus();
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

  // Busca com debounce e esqueleto de carregamento enquanto os resultados são renderizados
  let searchTimer = null;
  function renderTopicSkeletons() {
    const root = $("#topicGroups");
    if (!root) return;
    root.innerHTML = Array.from({ length: 3 }).map(() =>
      `<div class="topic-group skeleton-topic-group">
        <div class="skeleton-avatar"></div>
        <div><div class="skeleton-line w60"></div><div class="skeleton-line w85" style="margin-top:8px"></div></div>
      </div>`
    ).join("");
  }
  $("#topicSearch")?.addEventListener("input", event => {
    const value = event.target.value;
    clearTimeout(searchTimer);
    renderTopicSkeletons();
    searchTimer = setTimeout(() => renderTopics(value), 150);
  });
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

  function setupAIHelper() {
    const btn = $("#aiHelperBtn");
    const chat = $("#aiHelperChat");
    const closeBtn = $("#aiHelperCloseBtn");
    const messagesDiv = $("#aiHelperMessages");
    const input = $("#aiHelperInput");
    const sendBtn = $("#aiHelperSendBtn");

    if (!btn || !chat || !closeBtn || !messagesDiv || !input || !sendBtn) return;

    // O assistente só funciona quando a chave de API é fornecida pelo ambiente
    // de execução (window.ENEM_AI_CONFIG). Uma chave nunca fica hardcoded aqui.
    const aiConfigured = !!(window.ENEM_AI_CONFIG && window.ENEM_AI_CONFIG.apiKey);
    if (!aiConfigured) {
      input.disabled = true;
      sendBtn.disabled = true;
      messagesDiv.appendChild(
        Object.assign(document.createElement("div"), {
          className: "notice",
          textContent: "Assistente de IA indisponível neste ambiente (chave de API não configurada).",
        })
      );
      return;
    }

    // Toggle chat visibility
    btn.addEventListener("click", () => {
      const isHidden = chat.getAttribute("aria-hidden") === "true";
      chat.setAttribute("aria-hidden", String(!isHidden));
      if (!isHidden) {
        input.focus();
      }
    });

    // Close chat
    closeBtn.addEventListener("click", () => {
      chat.setAttribute("aria-hidden", "true");
    });

    // Send message function
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      // Add user message
      const userMsg = document.createElement("div");
      userMsg.className = "user-message";
      userMsg.textContent = text;
      messagesDiv.appendChild(userMsg);
      input.value = "";
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      // Indicador de carregamento (spinner) enquanto a resposta é obtida
      const loadingMsg = document.createElement("div");
      loadingMsg.className = "ai-message ai-loading";
      loadingMsg.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><div class="spinner" style="width:24px;height:24px;border-width:2px" aria-hidden="true"></div><span style="font-size:13px;color:var(--text-muted)">Assistente digitando…</span></div>`;
      messagesDiv.appendChild(loadingMsg);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${window.ENEM_AI_CONFIG.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mistralai/mistral-7b-instruct:free",
            messages: [
              {
                role: "system",
                content: "Você é um assistente de estudos para o ENEM. Ajude os alunos a entenderem explicações de questões, conceitos e tópicos de estudo. Seja claro, conciso e encorajador."
              },
              {
                role: "user",
                content: text
              }
            ],
            max_tokens: 500
          })
        });

        if (!response.ok) {
          // Try to get more detailed error info
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error("Invalid response format from API");
        }
        const aiResponse = data.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

        // Remove loading message
        loadingMsg.remove();

        // Add AI message
        const aiMsg = document.createElement("div");
        aiMsg.className = "ai-message";
        aiMsg.textContent = aiResponse;
        messagesDiv.appendChild(aiMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } catch (error) {
        console.error("Erro ao chamar a API de IA:", error);
        // Remove loading message
        loadingMsg.remove();

        // Add detailed error message for debugging
        const errorMsg = document.createElement("div");
        errorMsg.className = "ai-message";
        errorMsg.textContent = `Desculpe, ocorreu um erro: ${error.message}`;
        messagesDiv.appendChild(errorMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    }

    // Send button click
    sendBtn.addEventListener("click", sendMessage);

    // Enter key in input
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }
  renderSubjects(); renderTopics(); updateProgress(); setupEssayChecklist(); setupPlan(); setupAIHelper();

  // Remove o loader inicial após a hidratação dos dados
  // (mínimo de 700 ms para evitar piscar de conteúdo e saltos de layout)
  setTimeout(() => {
    const loader = $('#pageLoader');
    if (loader) {
      loader.classList.add('loaded');
      setTimeout(() => loader.remove(), 500);
    }
  }, 700);

  // Alternância de tema claro/escuro: localStorage + prefers-color-scheme
  const darkModeToggle = $('#darkModeToggle');
  const themeLabel = $('#themeLabel');
  if (darkModeToggle && window.__enemTheme) {
    function updateToggleUI() {
      const isDark = window.__enemTheme.isDark();
      const sun = darkModeToggle.querySelector('.toggle-icon-sun');
      const moon = darkModeToggle.querySelector('.toggle-icon-moon');
      if (sun) sun.style.display = isDark ? '' : 'none';
      if (moon) moon.style.display = isDark ? 'none' : '';
      if (themeLabel) {
        themeLabel.textContent = isDark ? 'Modo claro' : 'Modo escuro';
      }
      darkModeToggle.setAttribute('aria-label', isDark ? 'Alternar para o modo claro' : 'Alternar para o modo escuro');
    }

    darkModeToggle.addEventListener('click', () => {
      const next = window.__enemTheme.isDark() ? 'light' : 'dark';
      window.__enemTheme.apply(next, true);
      updateToggleUI();
    });

    window.addEventListener('enem:themechange', updateToggleUI);
    updateToggleUI();
  }
})();
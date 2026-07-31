/* ============================================================
   Hari Ini — Life Dashboard
   Vanilla JS · Local Storage only
   ============================================================ */
(function () {
  "use strict";

  /* ---------- storage keys ---------- */
  const KEYS = {
    THEME: "hariini_theme",
    NAME: "hariini_name",
    TASKS: "hariini_tasks",
    LINKS: "hariini_links",
    POMODORO_LEN: "hariini_pomodoro_len",
  };

  const DEFAULT_LINKS = [
    { name: "Gmail", url: "https://mail.google.com" },
    { name: "Calendar", url: "https://calendar.google.com" },
    { name: "Drive", url: "https://drive.google.com" },
    { name: "YouTube", url: "https://youtube.com" },
  ];

  const TILE_COLORS = ["#FF9FB8", "#59C9A5", "#A98EF0", "#FFB877", "#5AB7E8", "#E88CC7"];

  const $ = (id) => document.getElementById(id);

  /* ============================================================
     Clock + Greeting
     ============================================================ */
  const clockEl = $("clock");
  const dateLabelEl = $("dateLabel");
  const greetingWordEl = $("greetingWord");
  const nameBtn = $("nameBtn");

  function pad(n) { return n.toString().padStart(2, "0"); }

  function updateClock() {
    const now = new Date();
    clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    dateLabelEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const h = now.getHours();
    let word = "Good evening";
    if (h < 5) word = "Still up";
    else if (h < 12) word = "Good morning";
    else if (h < 15) word = "Good afternoon";
    else if (h < 18) word = "Good evening";
    else word = "Good night";
    greetingWordEl.textContent = word;
  }
  updateClock();
  setInterval(updateClock, 1000 * 30);

  /* ---------- custom name ---------- */
  const nameModal = $("nameModalOverlay");
  const nameInput = $("nameInput");

  function getName() {
    return localStorage.getItem(KEYS.NAME) || "";
  }
  function renderName() {
    const name = getName();
    nameBtn.textContent = name ? `${name} ✎` : "friend ✎";
  }
  nameBtn.addEventListener("click", () => {
    nameInput.value = getName();
    nameModal.classList.add("open");
    nameInput.focus();
  });
  $("nameCancelBtn").addEventListener("click", () => nameModal.classList.remove("open"));
  $("nameSaveBtn").addEventListener("click", () => {
    const val = nameInput.value.trim();
    if (val) localStorage.setItem(KEYS.NAME, val);
    else localStorage.removeItem(KEYS.NAME);
    renderName();
    nameModal.classList.remove("open");
  });
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("nameSaveBtn").click();
  });
  renderName();

  /* ============================================================
     Theme (light / dark)
     ============================================================ */
  const themeToggle = $("themeToggle");
  const themeIcon = $("themeIcon");

  function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  function initTheme() {
    let theme = localStorage.getItem(KEYS.THEME);
    if (!theme) {
      theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark" : "light";
    }
    applyTheme(theme);
  }
  themeToggle.addEventListener("click", () => {
    const next = document.body.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(KEYS.THEME, next);
  });
  initTheme();

  /* ============================================================
     Focus Timer
     ============================================================ */
  const ringProgress = $("ringProgress");
  const timerDisplay = $("timerDisplay");
  const startBtn = $("startBtn");
  const stopBtn = $("stopBtn");
  const resetBtn = $("resetBtn");
  const lengthSlider = $("pomodoroLength");
  const lengthLabel = $("pomodoroLengthLabel");

  const CIRC = 2 * Math.PI * 70; // ~440
  ringProgress.style.strokeDasharray = CIRC;

  let sessionMinutes = parseInt(localStorage.getItem(KEYS.POMODORO_LEN), 10) || 25;
  let totalSeconds = sessionMinutes * 60;
  let remaining = totalSeconds;
  let timerId = null;
  let running = false;

  lengthSlider.value = sessionMinutes;
  lengthLabel.textContent = `${sessionMinutes} min`;

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${pad(m)}:${pad(s)}`;
  }

  function renderTimer() {
    timerDisplay.textContent = formatTime(remaining);
    const fraction = remaining / totalSeconds;
    ringProgress.style.strokeDashoffset = CIRC * (1 - fraction);
  }

  function tick() {
    remaining -= 1;
    if (remaining <= 0) {
      remaining = 0;
      renderTimer();
      pauseTimer();
      ringProgress.style.stroke = "var(--mint)";
      if (window.Notification && Notification.permission === "granted") {
        new Notification("Focus session complete! 🎉");
      }
      return;
    }
    renderTimer();
  }

  function startTimer() {
    if (running) return;
    running = true;
    ringProgress.style.stroke = "var(--pink)";
    startBtn.disabled = true;
    timerId = setInterval(tick, 1000);
  }
  function pauseTimer() {
    running = false;
    startBtn.disabled = false;
    clearInterval(timerId);
  }
  function resetTimer() {
    pauseTimer();
    totalSeconds = sessionMinutes * 60;
    remaining = totalSeconds;
    ringProgress.style.stroke = "var(--pink)";
    renderTimer();
  }

  startBtn.addEventListener("click", startTimer);
  stopBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);

  lengthSlider.addEventListener("input", () => {
    sessionMinutes = parseInt(lengthSlider.value, 10);
    lengthLabel.textContent = `${sessionMinutes} min`;
    localStorage.setItem(KEYS.POMODORO_LEN, sessionMinutes);
    if (!running) resetTimer();
  });

  renderTimer();

  /* ============================================================
     Quick Links
     ============================================================ */
  const linksGrid = $("linksGrid");
  const linkModal = $("linkModalOverlay");
  const linkNameInput = $("linkNameInput");
  const linkUrlInput = $("linkUrlInput");

  function getLinks() {
    const raw = localStorage.getItem(KEYS.LINKS);
    if (!raw) return DEFAULT_LINKS.slice();
    try { return JSON.parse(raw); } catch (e) { return DEFAULT_LINKS.slice(); }
  }
  function saveLinks(links) {
    localStorage.setItem(KEYS.LINKS, JSON.stringify(links));
  }
  function normalizeUrl(url) {
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return url;
  }
  function renderLinks() {
    const links = getLinks();
    linksGrid.innerHTML = "";
    links.forEach((link, i) => {
      const tile = document.createElement("a");
      tile.href = link.url;
      tile.target = "_blank";
      tile.rel = "noopener noreferrer";
      tile.className = "link-tile";
      tile.style.setProperty("--tilt", `${(i % 2 === 0 ? -1 : 1) * (2 + (i % 3))}deg`);

      const icon = document.createElement("div");
      icon.className = "link-favicon";
      icon.style.background = TILE_COLORS[i % TILE_COLORS.length];
      icon.textContent = (link.name || "?").trim().charAt(0).toUpperCase();

      const label = document.createElement("div");
      label.className = "link-label";
      label.textContent = link.name;

      const removeBtn = document.createElement("button");
      removeBtn.className = "link-remove";
      removeBtn.title = "Remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = getLinks().filter((_, idx) => idx !== i);
        saveLinks(updated);
        renderLinks();
      });

      tile.appendChild(icon);
      tile.appendChild(label);
      tile.appendChild(removeBtn);
      linksGrid.appendChild(tile);
    });
  }

  $("addLinkBtn").addEventListener("click", () => {
    linkNameInput.value = "";
    linkUrlInput.value = "";
    linkModal.classList.add("open");
    linkNameInput.focus();
  });
  $("linkCancelBtn").addEventListener("click", () => linkModal.classList.remove("open"));
  $("linkSaveBtn").addEventListener("click", () => {
    const name = linkNameInput.value.trim();
    const url = linkUrlInput.value.trim();
    if (!name || !url) return;
    const links = getLinks();
    links.push({ name, url: normalizeUrl(url) });
    saveLinks(links);
    renderLinks();
    linkModal.classList.remove("open");
  });

  renderLinks();

  /* ============================================================
     To-Do List
     ============================================================ */
  const todoForm = $("todoForm");
  const todoInput = $("todoInput");
  const todoListEl = $("todoList");
  const todoMeta = $("todoMeta");
  const emptyState = $("emptyState");
  const filterGroup = $("filterGroup");
  const sortSelect = $("sortSelect");

  let currentFilter = "all";

  function getTasks() {
    const raw = localStorage.getItem(KEYS.TASKS);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }
  function saveTasks(tasks) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function visibleTasks() {
    let tasks = getTasks();

    if (currentFilter === "active") tasks = tasks.filter((t) => !t.done);
    if (currentFilter === "done") tasks = tasks.filter((t) => t.done);

    const sortMode = sortSelect.value;
    tasks = tasks.slice();
    if (sortMode === "alpha") {
      tasks.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortMode === "done") {
      tasks.sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
    } else {
      tasks.sort((a, b) => b.createdAt - a.createdAt);
    }
    return tasks;
  }

  function renderTasks() {
    const all = getTasks();
    const list = visibleTasks();
    todoListEl.innerHTML = "";

    list.forEach((task) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (task.done ? " done" : "");
      li.dataset.id = task.id;

      const check = document.createElement("button");
      check.className = "todo-check";
      check.title = task.done ? "Mark as active" : "Mark as done";
      check.textContent = task.done ? "✓" : "";
      check.addEventListener("click", () => toggleDone(task.id));

      const text = document.createElement("input");
      text.className = "todo-text";
      text.type = "text";
      text.value = task.text;
      text.maxLength = 120;
      text.addEventListener("change", () => editTask(task.id, text.value));
      text.addEventListener("keydown", (e) => {
        if (e.key === "Enter") text.blur();
      });

      const actions = document.createElement("div");
      actions.className = "todo-actions";

      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn";
      delBtn.title = "Delete task";
      delBtn.textContent = "🗑";
      delBtn.addEventListener("click", () => deleteTask(task.id));

      actions.appendChild(delBtn);
      li.appendChild(check);
      li.appendChild(text);
      li.appendChild(actions);
      todoListEl.appendChild(li);
    });

    const doneCount = all.filter((t) => t.done).length;
    todoMeta.textContent = `${all.length} task${all.length === 1 ? "" : "s"} · ${doneCount} done`;
    emptyState.style.display = list.length === 0 ? "block" : "none";
  }

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tasks = getTasks();
    tasks.push({ id: uid(), text: trimmed, done: false, createdAt: Date.now() });
    saveTasks(tasks);
    renderTasks();
  }
  function editTask(id, newText) {
    const trimmed = newText.trim();
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (!trimmed) {
      deleteTask(id);
      return;
    }
    task.text = trimmed;
    saveTasks(tasks);
    renderTasks();
  }
  function toggleDone(id) {
    const tasks = getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = !task.done;
    saveTasks(tasks);
    renderTasks();
  }
  function deleteTask(id) {
    const tasks = getTasks().filter((t) => t.id !== id);
    saveTasks(tasks);
    renderTasks();
  }

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask(todoInput.value);
    todoInput.value = "";
    todoInput.focus();
  });

  filterGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    [...filterGroup.children].forEach((c) => c.classList.toggle("active", c === btn));
    renderTasks();
  });

  sortSelect.addEventListener("change", renderTasks);

  renderTasks();

  /* ---------- close modals on overlay click ---------- */
  [nameModal, linkModal].forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });

})();

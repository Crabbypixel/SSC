// SSC CGL 2027 Tracker — app logic (vanilla JS, localStorage only)

const STORAGE_KEY = "ssc-cgl-tracker-v1";
const TOTAL_REASONING_WEIGHT = REASONING_TOPICS.reduce((s, r) => s + r.w, 0);

function defaultState() {
  return {
    progress: { grammar: 0, vocabulary: 0, math: 0, reasoning: 0, gs: 0 },
    phase2Unlocked: false,
    history: [], // array of "YYYY-MM-DD" strings, days marked as studied
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed, progress: { ...defaultState().progress, ...(parsed.progress || {}) } };
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let activeTab = "today";
const openSubjects = new Set(); // subjects currently expanded on the Subjects tab

// ---------- date helpers ----------
function pad(n) { return String(n).padStart(2, "0"); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function startOfDay(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }
function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

function planWeekNumber(today) {
  const diff = Math.floor((startOfDay(today) - startOfDay(START_DATE)) / 86400000);
  if (diff < 0) return 0;
  return Math.floor(diff / 7) + 1;
}

function computeStreak(historyArr, today) {
  const set = new Set(historyArr);
  let cursor = startOfDay(today);
  let streak = 0;
  if (set.has(dateKey(cursor))) { streak = 1; cursor = addDays(cursor, -1); }
  else { cursor = addDays(cursor, -1); }
  while (set.has(dateKey(cursor))) { streak++; cursor = addDays(cursor, -1); }
  return streak;
}

function computeBestStreak(historyArr) {
  const sorted = [...new Set(historyArr)].sort();
  let best = 0, run = 0, prev = null;
  for (const key of sorted) {
    if (prev) {
      const prevDate = new Date(prev + "T00:00:00");
      const expected = dateKey(addDays(prevDate, 1));
      run = expected === key ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

// ---------- subject registry ----------
function getItems(key) {
  switch (key) {
    case "grammar": return GRAMMAR_TOPICS.map((title) => ({ title }));
    case "vocabulary": return VOCAB_TOPICS.map((title) => ({ title }));
    case "math": return MATH_TOPICS.map((title) => ({ title }));
    case "reasoning": return REASONING_TOPICS.map((r) => ({ title: r.t }));
    case "gs": return state.phase2Unlocked ? GS_PHASE1_TOPICS.concat(GS_PHASE2_TOPICS) : GS_PHASE1_TOPICS;
    default: return [];
  }
}
const REPEATING = { math: true };

function subjectProgress(key) {
  const items = getItems(key);
  const total = items.length;
  const raw = state.progress[key] || 0;
  if (REPEATING[key]) {
    const passes = Math.floor(raw / total);
    const inPass = raw % total;
    return { items, total, completed: inPass, passes, raw };
  }
  const completed = Math.min(raw, total);
  return { items, total, completed, passes: 0, raw, capped: raw > total };
}

function toggleTopic(key, index, checked) {
  const { items, total, passes } = subjectProgress(key);
  const base = REPEATING[key] ? passes * total : 0;
  const curInPass = REPEATING[key] ? state.progress[key] % total : Math.min(state.progress[key], total);
  const newInPass = checked ? Math.max(curInPass, index + 1) : Math.min(curInPass, index);
  state.progress[key] = base + newInPass;
  saveState();
  render();
}

function weeklyPaceTarget(key) {
  if (key === "reasoning") {
    const perWeekWeight = Math.ceil(TOTAL_REASONING_WEIGHT / CORE_WEEKS);
    const avgWeight = TOTAL_REASONING_WEIGHT / REASONING_TOPICS.length;
    return Math.max(1, Math.round(perWeekWeight / avgWeight));
  }
  const total = getItems(key).length;
  return Math.max(1, Math.ceil(total / CORE_WEEKS));
}

// ---------- rendering ----------
function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function renderStreakPill() {
  document.getElementById("streakCount").textContent = computeStreak(state.history, new Date());
}

function renderToday() {
  const today = new Date();
  const dow = today.getDay();
  const dayInfo = WEEKDAY_SUBJECTS[dow];
  const week = planWeekNumber(today);
  const marked = state.history.includes(dateKey(today));
  const dateLabel = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const weekLabel = week <= 0
    ? `Plan starts ${START_DATE.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
    : `Week ${week} of your plan`;

  let body = "";

  if (dayInfo.subjects.length === 0) {
    body = `
      <div class="revision-note">
        Self-revision day. No new topics — skim back over what you checked off this week
        in Grammar, Vocabulary, Reasoning and GS. Light is enough; consistency is the point.
      </div>`;
  } else {
    body = dayInfo.subjects.map((key) => renderTodaySubjectBlock(key)).join("");
  }

  const container = document.getElementById("app");
  container.innerHTML = "";
  const card = el(`
    <div class="card">
      <div class="day-header">
        <h2>${dateLabel}</h2>
        <span class="week-label">${weekLabel} · ${dayInfo.label}</span>
      </div>
      <button class="mark-today-btn" id="markTodayBtn">
        ${marked ? "Studied today — nice work" : "Mark today as studied"}
      </button>
      <div id="todaySubjects">${body}</div>
    </div>
  `);
  container.appendChild(card);

  document.getElementById("markTodayBtn").addEventListener("click", () => {
    const key = dateKey(new Date());
    const idx = state.history.indexOf(key);
    if (idx === -1) state.history.push(key); else state.history.splice(idx, 1);
    saveState();
    render();
  });

  container.querySelectorAll("[data-quick-check]").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const key = e.target.getAttribute("data-quick-check");
      const idx = Number(e.target.getAttribute("data-index"));
      toggleTopic(key, idx, e.target.checked);
    });
  });
}

function renderTodaySubjectBlock(key) {
  const meta = SUBJECT_META[key];
  const { items, total, completed, passes } = subjectProgress(key);
  const locked = key === "gs" && !state.phase2Unlocked && completed >= GS_PHASE1_TOPICS.length;
  const finished = !REPEATING[key] && completed >= total && !locked;

  let inner;
  if (locked) {
    inner = `<div class="revision-note">Core GS topics done. Head to the Subjects tab to unlock Phase 2 (science) when you're ready.</div>`;
  } else if (finished) {
    inner = `<div class="revision-note">All ${meta.label} topics complete. Loop back and revise anytime from the Subjects tab.</div>`;
  } else {
    const next = items[completed];
    const then = items[completed + 1];
    const passNote = REPEATING[key] && passes > 0 ? ` (revision pass ${passes + 1})` : "";
    inner = `
      <div class="next-topic">
        <input type="checkbox" data-quick-check="${key}" data-index="${completed}" id="qc-${key}" />
        <label for="qc-${key}">${next.title}${next.section ? ` <span style="color:var(--text-dim)">— ${next.section}</span>` : ""}${passNote}</label>
      </div>
      ${then ? `<div class="then-label">then: ${then.title}</div>` : ""}
    `;
  }

  return `
    <div class="subject-block">
      <div class="subject-block-head">
        <span class="subject-name"><span class="dot ${meta.color}"></span>${meta.label}</span>
      </div>
      ${inner}
    </div>
  `;
}

function renderSubjects() {
  const container = document.getElementById("app");
  container.innerHTML = "";
  ["grammar", "vocabulary", "math", "reasoning", "gs"].forEach((key) => {
    container.appendChild(renderSubjectCard(key));
  });
}

function renderSubjectCard(key) {
  const meta = SUBJECT_META[key];
  const { items, total, completed, passes } = subjectProgress(key);
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const isOpen = openSubjects.has(key);

  const rows = items.map((item, i) => `
    <div class="topic-row ${i < completed ? "done" : ""}">
      <input type="checkbox" data-topic="${key}" data-index="${i}" ${i < completed ? "checked" : ""} id="t-${key}-${i}" />
      <label for="t-${key}-${i}">${item.title}</label>
      ${item.section ? `<span class="section-tag">${item.section}</span>` : ""}
    </div>
  `).join("");

  const passLabel = REPEATING[key] ? ` · pass ${passes + 1}` : "";

  const card = el(`
    <div class="card">
      <div class="subject-card-header" data-toggle="${key}">
        <div>
          <h2><span class="dot ${meta.color}" style="margin-right:8px;display:inline-block;"></span>${meta.label}</h2>
          <div class="progress-bar-track" style="width:220px;"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          <div class="progress-pct">${completed}/${total} topics${passLabel}</div>
        </div>
        <svg class="chevron ${isOpen ? "open" : ""}" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="topic-list ${isOpen ? "open" : ""}" id="list-${key}">${rows}</div>
      ${key === "gs" ? `
        <div class="phase2-toggle">
          <p>${state.phase2Unlocked
            ? "Phase 2 unlocked — Physics, Chemistry, Biology, Environment and Static GK are in the queue."
            : "Physics, Chemistry, Biology, Environment and Static GK stay hidden until you unlock Phase 2."}</p>
          <button class="${state.phase2Unlocked ? "unlocked" : ""}" data-phase2-toggle>
            ${state.phase2Unlocked ? "Unlocked" : "Unlock Phase 2"}
          </button>
        </div>
      ` : ""}
    </div>
  `);

  card.querySelector(`[data-toggle="${key}"]`).addEventListener("click", () => {
    if (openSubjects.has(key)) openSubjects.delete(key); else openSubjects.add(key);
    renderSubjects();
  });

  card.querySelectorAll("[data-topic]").forEach((cb) => {
    cb.addEventListener("click", (e) => e.stopPropagation());
    cb.addEventListener("change", (e) => {
      const k = e.target.getAttribute("data-topic");
      const idx = Number(e.target.getAttribute("data-index"));
      toggleTopic(k, idx, e.target.checked);
    });
  });

  const phase2Btn = card.querySelector("[data-phase2-toggle]");
  if (phase2Btn) {
    phase2Btn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.phase2Unlocked = !state.phase2Unlocked;
      saveState();
      renderSubjects();
    });
  }

  return card;
}

function renderProgress() {
  const container = document.getElementById("app");
  container.innerHTML = "";
  const today = new Date();
  const streak = computeStreak(state.history, today);
  const best = Math.max(computeBestStreak(state.history), streak);
  const totalDone = ["grammar", "vocabulary", "math", "reasoning", "gs"]
    .reduce((s, k) => s + (state.progress[k] || 0), 0);

  const statsCard = el(`
    <div class="card">
      <h2>Your progress</h2>
      <p class="hint">Week ${Math.max(0, planWeekNumber(today))} · started ${START_DATE.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
      <div class="stat-grid">
        <div class="stat-tile"><div class="stat-value">${streak}</div><div class="stat-label">Current streak</div></div>
        <div class="stat-tile"><div class="stat-value">${best}</div><div class="stat-label">Best streak</div></div>
        <div class="stat-tile"><div class="stat-value">${totalDone}</div><div class="stat-label">Topics checked off</div></div>
        <div class="stat-tile"><div class="stat-value">${state.history.length}</div><div class="stat-label">Days studied</div></div>
      </div>
    </div>
  `);
  container.appendChild(statsCard);

  const barsCard = el(`<div class="card"><h2>Subject completion</h2></div>`);
  ["grammar", "vocabulary", "math", "reasoning", "gs"].forEach((key) => {
    const meta = SUBJECT_META[key];
    const { total, completed, passes } = subjectProgress(key);
    const pct = total ? Math.round((completed / total) * 100) : 0;
    const passLabel = REPEATING[key] && passes > 0 ? ` (pass ${passes + 1})` : "";
    barsCard.appendChild(el(`
      <div>
        <div class="subject-name" style="margin-bottom:2px;"><span class="dot ${meta.color}"></span>${meta.label}${passLabel}</div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="progress-pct" style="margin-bottom:10px;">${completed}/${total} · ${pct}%</div>
      </div>
    `));
  });
  container.appendChild(barsCard);

  const paceCard = el(`<div class="card"><h2>Suggested weekly pace</h2><p class="hint">Soft targets, not deadlines — spread over the ~${CORE_WEEKS}-week core window.</p></div>`);
  ["grammar", "vocabulary", "math", "reasoning", "gs"].forEach((key) => {
    const meta = SUBJECT_META[key];
    paceCard.appendChild(el(`
      <div class="pace-row">
        <span><span class="dot ${meta.color}" style="margin-right:8px;"></span>${meta.label}</span>
        <span class="pace-target">~${weeklyPaceTarget(key)} topics/week</span>
      </div>
    `));
  });
  container.appendChild(paceCard);

  const heatCard = el(`<div class="card"><h2>Last 12 weeks</h2></div>`);
  const grid = el(`<div class="heatmap"></div>`);
  const set = new Set(state.history);
  for (let i = 83; i >= 0; i--) {
    const d = addDays(today, -i);
    const filled = set.has(dateKey(d));
    grid.appendChild(el(`<div class="cell ${filled ? "filled" : ""}" title="${dateKey(d)}"></div>`));
  }
  heatCard.appendChild(grid);
  container.appendChild(heatCard);
}

function render() {
  renderStreakPill();
  if (activeTab === "today") renderToday();
  else if (activeTab === "subjects") renderSubjects();
  else renderProgress();
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    activeTab = btn.getAttribute("data-tab");
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

render();

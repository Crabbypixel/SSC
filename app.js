// SSC CGL 2027 Tracker — app logic (vanilla JS, localStorage only)

const STORAGE_KEY = "ssc-cgl-tracker-v2";
const LEGACY_KEY = "ssc-cgl-tracker-v1";
const TOTAL_REASONING_WEIGHT = REASONING_TOPICS.reduce((s, r) => s + r.w, 0);

function defaultState() {
  return {
    done: { grammar: [], vocabulary: [], math: [], reasoning: [], gs: [], science: [] },
    subDone: {},        // "subject::Topic Title" -> array of completed subtopic indices
    scienceUnlocked: false,
    history: [],        // "YYYY-MM-DD" days marked as studied
  };
}

// v1 stored a single integer pointer per subject; convert it to the first N topic titles.
function migrateLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw);
    const next = defaultState();
    next.history = Array.isArray(old.history) ? old.history : [];
    next.scienceUnlocked = !!old.phase2Unlocked;
    const lists = { grammar: GRAMMAR_TOPICS, vocabulary: VOCAB_TOPICS, math: MATH_TOPICS, reasoning: REASONING_TOPICS, gs: GS_TOPICS };
    for (const [key, list] of Object.entries(lists)) {
      const count = Math.min((old.progress && old.progress[key]) || 0, list.length);
      next.done[key] = list.slice(0, count).map((item) => item.t);
    }
    return next;
  } catch (e) {
    return null;
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = defaultState();
      return { ...base, ...parsed, done: { ...base.done, ...(parsed.done || {}) }, subDone: parsed.subDone || {} };
    }
    const migrated = migrateLegacy();
    if (migrated) return migrated;
  } catch (e) { /* fall through to a clean slate */ }
  return defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();
let activeTab = "today";
const openSubjects = new Set();

// ---------- date helpers ----------
// Dev-only date override. Everything that asks "what day is it?" goes through now(),
// so simulating a date exercises the real code paths. Stored apart from study data.
const DEV_KEY = "ssc-cgl-tracker-dev";
let dev = (() => {
  try { return JSON.parse(localStorage.getItem(DEV_KEY)) || { on: false, date: null }; }
  catch (e) { return { on: false, date: null }; }
})();
if (location.search.includes("dev")) dev.on = true;

function saveDev() { localStorage.setItem(DEV_KEY, JSON.stringify(dev)); }
// Midday avoids any DST edge; the override only applies while the dev bar is visible.
function now() { return dev.on && dev.date ? new Date(dev.date + "T12:00:00") : new Date(); }

function pad(n) { return String(n).padStart(2, "0"); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function startOfDay(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }
function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function parseKey(k) { return new Date(k + "T00:00:00"); }

const WEEK_MS = 7 * 86400000;
// The plan starts mid-week, so week 1 is a short Wed–Sun stub and every later week runs Mon–Sun.
const FIRST_MONDAY = (() => {
  const d = startOfDay(START_DATE);
  return addDays(d, (8 - d.getDay()) % 7);
})();
const PARTIAL_FIRST_WEEK = FIRST_MONDAY.getTime() !== startOfDay(START_DATE).getTime();

function planWeekNumber(today) {
  const t = startOfDay(today).getTime();
  if (t < startOfDay(START_DATE).getTime()) return 0;
  if (!PARTIAL_FIRST_WEEK) return 1 + Math.floor((t - FIRST_MONDAY.getTime()) / WEEK_MS);
  if (t < FIRST_MONDAY.getTime()) return 1;
  return 2 + Math.floor((t - FIRST_MONDAY.getTime()) / WEEK_MS);
}

function weekRange(n) {
  if (PARTIAL_FIRST_WEEK && n === 1) return { start: startOfDay(START_DATE), end: addDays(FIRST_MONDAY, -1) };
  const start = addDays(FIRST_MONDAY, (PARTIAL_FIRST_WEEK ? n - 2 : n - 1) * 7);
  return { start, end: addDays(start, 6) };
}

function formatRange(n) {
  const { start, end } = weekRange(n);
  const opts = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-IN", opts)} – ${end.toLocaleDateString("en-IN", opts)}`;
}

function computeStreak(historyArr, today) {
  const set = new Set(historyArr);
  let cursor = startOfDay(today);
  let streak = 0;
  if (set.has(dateKey(cursor))) streak = 1;
  cursor = addDays(cursor, -1);
  while (set.has(dateKey(cursor))) { streak++; cursor = addDays(cursor, -1); }
  return streak;
}

function computeBestStreak(historyArr) {
  const sorted = [...new Set(historyArr)].sort();
  let best = 0, run = 0, prev = null;
  for (const key of sorted) {
    run = prev && dateKey(addDays(parseKey(prev), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

// ---------- subjects ----------
function getItems(subject) {
  const map = {
    grammar: GRAMMAR_TOPICS,
    vocabulary: VOCAB_TOPICS,
    math: MATH_TOPICS,
    reasoning: REASONING_TOPICS,
    gs: GS_TOPICS,
    science: SCIENCE_TOPICS,
  };
  return (map[subject] || []).map((item) => ({ title: item.t, subtopics: item.s || [], section: item.section }));
}

function doneSet(subject) { return new Set(state.done[subject] || []); }
function isDone(subject, title) { return doneSet(subject).has(title); }
function subKey(subject, title) { return `${subject}::${title}`; }
function subDoneSet(subject, title) { return new Set(state.subDone[subKey(subject, title)] || []); }

function setTopicDone(subject, title, done, subtotal) {
  const set = doneSet(subject);
  if (done) set.add(title); else set.delete(title);
  state.done[subject] = [...set];
  // keep the subtopic checkboxes consistent with the topic checkbox
  const key = subKey(subject, title);
  if (done) state.subDone[key] = Array.from({ length: subtotal }, (_, i) => i);
  else delete state.subDone[key];
  saveState();
  render();
}

function toggleSubtopic(subject, title, index, checked, subtotal) {
  const key = subKey(subject, title);
  const set = subDoneSet(subject, title);
  if (checked) set.add(index); else set.delete(index);
  state.subDone[key] = [...set].sort((a, b) => a - b);
  // finishing every subtopic completes the topic; unticking one reopens it
  const topics = doneSet(subject);
  if (set.size >= subtotal && subtotal > 0) topics.add(title); else topics.delete(title);
  state.done[subject] = [...topics];
  saveState();
  render();
}

function subjectStats(subject) {
  const items = getItems(subject);
  const done = doneSet(subject);
  const completed = items.filter((i) => done.has(i.title)).length;
  return { items, total: items.length, completed, pct: items.length ? Math.round((completed / items.length) * 100) : 0 };
}

function activeSubjectsFor(dow) {
  const base = [...WEEKDAY_SUBJECTS[dow].subjects];
  if (state.scienceUnlocked && SCIENCE_DAYS.includes(dow)) base.push("science");
  return base;
}

function dayLabelFor(dow) {
  const base = WEEKDAY_SUBJECTS[dow].label;
  return state.scienceUnlocked && SCIENCE_DAYS.includes(dow) ? `${base} + Science` : base;
}

// ---------- rendering ----------
function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderStreakPill() {
  document.getElementById("streakCount").textContent = computeStreak(state.history, now());
}

function renderToday() {
  const today = now();
  const dow = today.getDay();
  const subjects = activeSubjectsFor(dow);
  const week = planWeekNumber(today);
  const marked = state.history.includes(dateKey(today));
  const dateLabel = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const weekLabel = week === 0
    ? `Plan starts ${START_DATE.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
    : `Week ${week} of your plan`;

  const container = document.getElementById("app");
  container.innerHTML = "";

  const head = el(`
    <div class="card">
      <div class="day-header">
        <h2>${dateLabel}</h2>
        <span class="week-label">${weekLabel} · ${dayLabelFor(dow)}</span>
      </div>
      <button class="mark-today-btn" id="markTodayBtn">
        ${marked ? "Studied today — nice work" : "Mark today as studied"}
      </button>
    </div>
  `);
  container.appendChild(head);

  if (subjects.length === 0) {
    container.appendChild(el(`
      <div class="card">
        <div class="revision-note">
          Self-revision day — no topics scheduled. Go back over whatever you covered this week,
          however you like.
        </div>
      </div>
    `));
  } else {
    subjects.forEach((subject) => container.appendChild(renderTodayCard(subject)));
  }

  document.getElementById("markTodayBtn").addEventListener("click", () => {
    const key = dateKey(now());
    const idx = state.history.indexOf(key);
    if (idx === -1) state.history.push(key); else state.history.splice(idx, 1);
    saveState();
    render();
  });
}

function renderTodayCard(subject) {
  const meta = SUBJECT_META[subject];
  const pending = pendingFor(subject);
  const scheduledAtAll = plannerFor(subject).flat().length > 0;

  if (!pending.length) {
    const message = scheduledThroughWeek(subject, currentPlanWeek()).length === 0
      ? `Nothing scheduled for ${meta.label} yet — it starts in week ${SCIENCE_START_WEEK}.`
      : `${meta.label} is up to date with the plan.`;
    return el(`
      <div class="card">
        <div class="subject-name" style="margin-bottom:10px;"><span class="dot ${meta.color}"></span>${meta.label}</div>
        <div class="plan-empty">${scheduledAtAll ? message : "No topics scheduled."}</div>
      </div>
    `);
  }

  const [current, ...rest] = pending;
  const subs = subDoneSet(subject, current.title);
  const subRows = current.subtopics.map((sub, i) => `
    <div class="subtopic-row ${subs.has(i) ? "done" : ""}">
      <input type="checkbox" data-sub="${i}" ${subs.has(i) ? "checked" : ""} id="s-${subject}-${i}" />
      <label for="s-${subject}-${i}">${esc(sub)}</label>
    </div>
  `).join("");

  const restRows = rest.map((t, i) => `
    <div class="topic-row" data-rest="${i}">
      <input type="checkbox" />
      <label>${esc(t.title)}</label>
      ${t.section ? `<span class="section-tag">${esc(t.section)}</span>` : ""}
    </div>
  `).join("");

  const card = el(`
    <div class="card today-card">
      <div class="subject-name" style="margin-bottom:12px;">
        <span class="dot ${meta.color}"></span>${meta.label}
        ${current.section ? `<span class="section-tag">${esc(current.section)}</span>` : ""}
      </div>
      <div class="topic-headline">
        <input type="checkbox" data-topic-done id="td-${subject}" />
        <label for="td-${subject}">${esc(current.title)}</label>
      </div>
      <div class="subtopics">${subRows}</div>
      ${rest.length ? `<div class="also-label">Also open this week</div><div class="also-list">${restRows}</div>` : ""}
    </div>
  `);

  card.querySelector("[data-topic-done]").addEventListener("change", (e) => {
    setTopicDone(subject, current.title, e.target.checked, current.subtopics.length);
  });
  card.querySelectorAll("[data-sub]").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      toggleSubtopic(subject, current.title, Number(e.target.getAttribute("data-sub")), e.target.checked, current.subtopics.length);
    });
  });
  card.querySelectorAll("[data-rest]").forEach((row) => {
    row.querySelector("input").addEventListener("change", (e) => {
      const topic = rest[Number(row.getAttribute("data-rest"))];
      setTopicDone(subject, topic.title, e.target.checked, topic.subtopics.length);
    });
  });
  return card;
}

function renderSubjects() {
  const container = document.getElementById("app");
  container.innerHTML = "";
  SUBJECT_ORDER.forEach((subject) => {
    if (subject === "science" && !state.scienceUnlocked) {
      container.appendChild(renderLockedScienceCard());
      return;
    }
    container.appendChild(renderSubjectCard(subject));
  });
}

function renderLockedScienceCard() {
  const card = el(`
    <div class="card locked-card">
      <div class="subject-card-header" style="cursor:default;">
        <div>
          <h2><span class="dot amber" style="margin-right:8px;display:inline-block;"></span>Science</h2>
          <p class="hint" style="margin:6px 0 0;">Physics, Chemistry and Biology — locked for now. Unlock this once Math, English and Polity feel comfortable.</p>
        </div>
      </div>
      <div class="phase2-toggle">
        <p>${SCIENCE_TOPICS.length} topics across Physics, Chemistry and Biology. Once unlocked, Science joins your Tue / Thu / Sat slot.</p>
        <button data-science-toggle>Unlock Science</button>
      </div>
    </div>
  `);
  card.querySelector("[data-science-toggle]").addEventListener("click", () => {
    state.scienceUnlocked = true;
    saveState();
    renderSubjects();
  });
  return card;
}

function renderSubjectCard(subject) {
  const meta = SUBJECT_META[subject];
  const { items, total, completed, pct } = subjectStats(subject);
  const isOpen = openSubjects.has(subject);
  const done = doneSet(subject);

  const rows = items.map((item, i) => `
    <div class="topic-row has-subs ${done.has(item.title) ? "done" : ""}">
      <input type="checkbox" data-index="${i}" ${done.has(item.title) ? "checked" : ""} id="t-${subject}-${i}" />
      <div class="topic-text">
        <label for="t-${subject}-${i}">${esc(item.title)}</label>
        <div class="topic-subs">${esc(item.subtopics.join(" · "))}</div>
      </div>
      ${item.section ? `<span class="section-tag">${esc(item.section)}</span>` : ""}
    </div>
  `).join("");

  const card = el(`
    <div class="card">
      <div class="subject-card-header" data-toggle>
        <div>
          <h2><span class="dot ${meta.color}" style="margin-right:8px;display:inline-block;"></span>${meta.label}</h2>
          <div class="progress-bar-track" style="max-width:220px;"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          <div class="progress-pct">${completed}/${total} topics</div>
        </div>
        <svg class="chevron ${isOpen ? "open" : ""}" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="topic-list ${isOpen ? "open" : ""}">${rows}</div>
      ${subject === "science" ? `
        <div class="phase2-toggle">
          <p>Science is in your Tue / Thu / Sat rotation.</p>
          <button class="unlocked" data-science-toggle>Unlocked</button>
        </div>` : ""}
    </div>
  `);

  card.querySelector("[data-toggle]").addEventListener("click", () => {
    if (openSubjects.has(subject)) openSubjects.delete(subject); else openSubjects.add(subject);
    renderSubjects();
  });

  card.querySelectorAll("[data-index]").forEach((cb) => {
    cb.addEventListener("click", (e) => e.stopPropagation());
    cb.addEventListener("change", (e) => {
      const item = items[Number(e.target.getAttribute("data-index"))];
      setTopicDone(subject, item.title, e.target.checked, item.subtopics.length);
    });
  });

  const sciBtn = card.querySelector("[data-science-toggle]");
  if (sciBtn) {
    sciBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.scienceUnlocked = false;
      saveState();
      renderSubjects();
    });
  }

  return card;
}

// ---------- planner ----------
// Spreads each subject's topics across the core window while keeping the syllabus order
// intact. Reasoning uses the PDF's day estimates as weights, so heavier topics claim more
// of a week; every other subject is spread evenly by topic count.
const plannerCache = {};

// Pull a topic back into any week that came out empty, so a running subject never
// leaves a hole in the middle of the plan. Order is preserved.
function closeGaps(buckets, firstWeek, span) {
  for (let w = firstWeek; w < firstWeek + span; w++) {
    if (buckets[w].length) continue;
    for (let d = w + 1; d < firstWeek + span; d++) {
      if (buckets[d].length > 1) { buckets[w].push(buckets[d].shift()); break; }
    }
  }
}

function plannerFor(subject) {
  if (plannerCache[subject]) return plannerCache[subject];
  const items = getItems(subject);
  const firstWeek = subject === "science" ? SCIENCE_START_WEEK : 1;
  const span = CORE_WEEKS - firstWeek + 1;
  const buckets = Array.from({ length: CORE_WEEKS + 1 }, () => []);

  if (items.length <= span) {
    // Fewer topics than weeks: one a week until the subject is finished, then nothing.
    items.forEach((item, i) => buckets[firstWeek + i].push(item));
  } else if (subject === "reasoning") {
    // Reasoning uses the PDF's day estimates, so heavy topics claim more of a week.
    const weights = items.map((_, i) => REASONING_TOPICS[i].w);
    const perWeek = weights.reduce((a, b) => a + b, 0) / span;
    let cumulative = 0;
    items.forEach((item, i) => {
      const offset = Math.min(span - 1, Math.floor((cumulative + weights[i] / 2) / perWeek));
      buckets[firstWeek + offset].push(item);
      cumulative += weights[i];
    });
    closeGaps(buckets, firstWeek, span);
  } else {
    items.forEach((item, i) => {
      buckets[firstWeek + Math.min(span - 1, Math.floor((i * span) / items.length))].push(item);
    });
  }

  plannerCache[subject] = buckets;
  return buckets;
}

// Everything the plan has asked for up to and including `week` — this is what the
// Today tab works from, so the tracker and the timetable can never disagree.
function scheduledThroughWeek(subject, week) {
  const buckets = plannerFor(subject);
  const out = [];
  for (let w = 1; w <= Math.min(week, CORE_WEEKS); w++) out.push(...buckets[w]);
  return out;
}

function currentPlanWeek() {
  return Math.min(Math.max(planWeekNumber(now()), 1), CORE_WEEKS);
}

function pendingFor(subject) {
  const done = doneSet(subject);
  return scheduledThroughWeek(subject, currentPlanWeek()).filter((t) => !done.has(t.title));
}

// Group a cell's topics under their section heading (GS and Science only).
function groupBySection(topics) {
  const groups = [];
  topics.forEach((topic) => {
    const last = groups[groups.length - 1];
    if (last && last.section === topic.section) last.topics.push(topic);
    else groups.push({ section: topic.section, topics: [topic] });
  });
  return groups;
}

function plannerCellHtml(subject, topics) {
  if (!topics.length) return "";
  const done = doneSet(subject);
  const line = (t) => `<div class="plan-topic ${done.has(t.title) ? "done" : ""}">${esc(t.title)}</div>`;
  if (subject === "gs" || subject === "science") {
    return groupBySection(topics).map((g) =>
      `<div class="plan-sec">${esc(g.section)}</div>${g.topics.map(line).join("")}`).join("");
  }
  return topics.map(line).join("");
}

function renderPlanner() {
  const container = document.getElementById("app");
  container.innerHTML = "";
  const today = now();
  const rawWeek = planWeekNumber(today);
  const currentWeek = Math.min(Math.max(rawWeek, 1), CORE_WEEKS);
  const subjects = SUBJECT_ORDER;

  // --- this week's targets ---
  const weekCard = el(`
    <div class="card">
      <div class="day-header">
        <h2>Week ${currentWeek}</h2>
        <span class="week-label">${formatRange(currentWeek)}${rawWeek === 0 ? " · starts soon" : ""}${rawWeek > CORE_WEEKS ? " · core plan finished" : ""}</span>
      </div>
      <p class="hint">What to finish this week. Tick items off here or from the Today tab.</p>
    </div>
  `);
  subjects.forEach((subject) => {
    if (subject === "science" && !state.scienceUnlocked) return;
    const topics = plannerFor(subject)[currentWeek] || [];
    const meta = SUBJECT_META[subject];
    const block = el(`
      <div class="subject-block">
        <div class="subject-block-head">
          <span class="subject-name"><span class="dot ${meta.color}"></span>${meta.label}</span>
          <span class="progress-pct">${topics.length ? `${topics.length} topic${topics.length > 1 ? "s" : ""}` : "—"}</span>
        </div>
      </div>
    `);
    if (!topics.length) {
      block.appendChild(el(`<div class="plan-empty">No new topics this week.</div>`));
    } else {
      const done = doneSet(subject);
      topics.forEach((topic) => {
        const row = el(`
          <div class="topic-row ${done.has(topic.title) ? "done" : ""}">
            <input type="checkbox" ${done.has(topic.title) ? "checked" : ""} />
            <label>${esc(topic.title)}</label>
            ${topic.section ? `<span class="section-tag">${esc(topic.section)}</span>` : ""}
          </div>
        `);
        row.querySelector("input").addEventListener("change", (e) => {
          setTopicDone(subject, topic.title, e.target.checked, topic.subtopics.length);
        });
        block.appendChild(row);
      });
    }
    weekCard.appendChild(block);
  });
  container.appendChild(weekCard);

  // --- full course table ---
  const header = subjects.map((s) => `<th>${SUBJECT_META[s].label}</th>`).join("");
  const rows = [];
  for (let w = 1; w <= CORE_WEEKS; w++) {
    const cells = subjects.map((s) => `<td>${plannerCellHtml(s, plannerFor(s)[w] || [])}</td>`).join("");
    rows.push(`
      <tr class="${w === currentWeek && rawWeek > 0 ? "current-week" : ""}">
        <th scope="row"><div class="wk-num">Week ${w}</div><div class="wk-range">${formatRange(w)}</div></th>
        ${cells}
      </tr>
    `);
  }

  container.appendChild(el(`
    <div class="card">
      <h2>Full ${CORE_WEEKS}-week plan</h2>
      <p class="hint">
        The whole syllabus laid out week by week, in the order your books cover it.
        Science starts in week ${SCIENCE_START_WEEK}${state.scienceUnlocked ? "" : " (unlock it from the Subjects tab)"}.
        Sundays stay free for your own revision, and a blank cell just means that subject has
        nothing new that week.
      </p>
      <div class="planner-scroll">
        <table class="planner">
          <thead><tr><th>Week</th>${header}</tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      </div>
    </div>
  `));
}

// Heatmap starts at the beginning of the plan (or your first studied day, whichever is
// earlier) and reads left to right, Monday first — rolling forward once you pass 12 weeks.
function heatmapStart(today) {
  const stamps = [startOfDay(START_DATE).getTime(), startOfDay(today).getTime()];
  if (state.history.length) stamps.push(startOfDay(parseKey([...state.history].sort()[0])).getTime());
  const earliest = new Date(Math.min(...stamps));
  const offsetToMonday = (earliest.getDay() + 6) % 7;
  let start = addDays(earliest, -offsetToMonday);
  const weeksElapsed = Math.floor((startOfDay(today) - start) / (7 * 86400000));
  if (weeksElapsed > 11) start = addDays(start, (weeksElapsed - 11) * 7);
  return start;
}

function renderProgress() {
  const container = document.getElementById("app");
  container.innerHTML = "";
  const today = now();
  const streak = computeStreak(state.history, today);
  const best = Math.max(computeBestStreak(state.history), streak);
  const visibleSubjects = SUBJECT_ORDER.filter((s) => s !== "science" || state.scienceUnlocked);
  const totalDone = visibleSubjects.reduce((sum, s) => sum + subjectStats(s).completed, 0);

  container.appendChild(el(`
    <div class="card">
      <h2>Your progress</h2>
      <p class="hint">Week ${planWeekNumber(today)} · plan starts ${START_DATE.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
      <div class="stat-grid">
        <div class="stat-tile"><div class="stat-value">${streak}</div><div class="stat-label">Current streak</div></div>
        <div class="stat-tile"><div class="stat-value">${best}</div><div class="stat-label">Best streak</div></div>
        <div class="stat-tile"><div class="stat-value">${totalDone}</div><div class="stat-label">Topics checked off</div></div>
        <div class="stat-tile"><div class="stat-value">${state.history.length}</div><div class="stat-label">Days studied</div></div>
      </div>
    </div>
  `));

  const barsCard = el(`<div class="card"><h2>Subject completion</h2></div>`);
  visibleSubjects.forEach((subject) => {
    const meta = SUBJECT_META[subject];
    const { total, completed, pct } = subjectStats(subject);
    barsCard.appendChild(el(`
      <div>
        <div class="subject-name" style="margin-bottom:2px;"><span class="dot ${meta.color}"></span>${meta.label}</div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="progress-pct" style="margin-bottom:10px;">${completed}/${total} · ${pct}%</div>
      </div>
    `));
  });
  container.appendChild(barsCard);

  const week = currentPlanWeek();
  const paceCard = el(`
    <div class="card">
      <h2>Against the plan</h2>
      <p class="hint">Where you stand versus the week ${week} timetable. Nothing here is a deadline.</p>
    </div>
  `);
  visibleSubjects.forEach((subject) => {
    const meta = SUBJECT_META[subject];
    const scheduled = scheduledThroughWeek(subject, week).length;
    const open = pendingFor(subject).length;
    const status = scheduled === 0 ? "not started yet" : open === 0 ? "up to date" : `${open} to catch up`;
    paceCard.appendChild(el(`
      <div class="pace-row">
        <span><span class="dot ${meta.color}" style="margin-right:8px;"></span>${meta.label}</span>
        <span class="pace-target ${open === 0 && scheduled > 0 ? "ok" : ""}">${status}</span>
      </div>
    `));
  });
  container.appendChild(paceCard);

  const start = heatmapStart(today);
  const heatCard = el(`
    <div class="card">
      <h2>Study days</h2>
      <p class="hint">12 weeks from ${start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Filled squares are days you marked as studied.</p>
    </div>
  `);

  const cal = el(`<div class="calendar"></div>`);
  cal.appendChild(el(`<div class="cal-corner"></div>`));
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => cal.appendChild(el(`<div class="cal-head">${d}</div>`)));

  const set = new Set(state.history);
  const todayKey = dateKey(today);
  for (let w = 0; w < 12; w++) {
    const rowStart = addDays(start, w * 7);
    cal.appendChild(el(`<div class="cal-week">${rowStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>`));
    for (let d = 0; d < 7; d++) {
      const day = addDays(rowStart, d);
      const key = dateKey(day);
      const cls = [
        set.has(key) ? "filled" : "",
        key === todayKey ? "today" : "",
        startOfDay(day) > startOfDay(today) ? "future" : "",
      ].filter(Boolean).join(" ");
      cal.appendChild(el(`<div class="cal-cell ${cls}" title="${key}">${day.getDate()}</div>`));
    }
  }
  heatCard.appendChild(cal);
  container.appendChild(heatCard);
}

// ---------- dev tools ----------
// Pretend it is another day, to check the weekday rotation, plan weeks and streaks.
// Toggle with Ctrl+Shift+D or by loading the page with ?dev — never on by default.
function renderDevBar() {
  let bar = document.getElementById("devBar");
  if (!dev.on) {
    if (bar) bar.remove();
    document.body.classList.remove("dev-on");
    return;
  }
  if (!bar) {
    bar = el(`<div id="devBar" class="dev-bar"></div>`);
    document.body.appendChild(bar);
  }
  document.body.classList.add("dev-on");

  const d = now();
  const week = planWeekNumber(d);
  const dayName = d.toLocaleDateString("en-IN", { weekday: "long" });
  const subjects = activeSubjectsFor(d.getDay()).map((s) => SUBJECT_META[s].label).join(", ") || "none (self-revision)";
  const marked = state.history.includes(dateKey(d));

  bar.innerHTML = `
    <div class="dev-row">
      <span class="dev-tag ${dev.date ? "sim" : ""}">${dev.date ? "SIMULATED DATE" : "DEV"}</span>
      <input type="date" id="devDate" value="${dateKey(d)}" />
      <button data-shift="-7">−1w</button>
      <button data-shift="-1">−1d</button>
      <button data-shift="1">+1d</button>
      <button data-shift="7">+1w</button>
      <button data-reset ${dev.date ? "" : "disabled"}>Real date</button>
      <button data-close title="Ctrl+Shift+D">×</button>
    </div>
    <div class="dev-row dev-info">
      <span>${dayName}</span>
      <span>Plan week ${week === 0 ? "— (before start)" : week}${week > CORE_WEEKS ? " (past core plan)" : ""}</span>
      <span>Subjects: ${subjects}</span>
      <span>Streak ${computeStreak(state.history, d)}${marked ? " · marked studied" : ""}</span>
    </div>
  `;

  bar.querySelector("#devDate").addEventListener("change", (e) => {
    dev.date = e.target.value || null;
    saveDev();
    render();
  });
  bar.querySelectorAll("[data-shift]").forEach((btn) => {
    btn.addEventListener("click", () => {
      dev.date = dateKey(addDays(now(), Number(btn.getAttribute("data-shift"))));
      saveDev();
      render();
    });
  });
  bar.querySelector("[data-reset]").addEventListener("click", () => {
    dev.date = null;
    saveDev();
    render();
  });
  bar.querySelector("[data-close]").addEventListener("click", () => {
    dev.on = false;
    dev.date = null;
    saveDev();
    render();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
    e.preventDefault();
    dev.on = !dev.on;
    if (!dev.on) dev.date = null;
    saveDev();
    render();
  }
});

function render() {
  renderDevBar();
  renderStreakPill();
  if (activeTab === "today") renderToday();
  else if (activeTab === "planner") renderPlanner();
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

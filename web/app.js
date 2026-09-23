// Portugués Rápido — video con capítulos, tarjetas con repetición espaciada, quiz, sonidos y guía.
"use strict";

const $ = (s) => document.querySelector(s);
const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 16, 35]; // días por caja (sistema Leitner)
const NEW_PER_SESSION = 20;

// ---------- almacenamiento seguro ----------
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let progress = store.get("pr.cards", {});      // { es: {box, due} }
let chaptersDone = store.get("pr.chapters", []);
let streak = store.get("pr.streak", { last: null, days: 0 });

function touchStreak() {
  const today = new Date().toDateString();
  if (streak.last === today) return;
  const yesterday = new Date(Date.now() - DAY).toDateString();
  streak = { last: today, days: streak.last === yesterday ? streak.days + 1 : 1 };
  store.set("pr.streak", streak);
  renderStats();
}

// ---------- utilidades ----------
const normalize = (s) => s.toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[¿?¡!.,…]/g, "").replace(/\s+/g, " ").trim();
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (t) => `${String(t / 60 | 0).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
// "dois / duas" → ["dois", "duas"]; se acepta cualquiera de las variantes
const variants = (s) => [s, ...s.split(/\s*\/\s*/)].map(normalize);

// ---------- voz (texto a voz y reconocimiento) ----------
let ptVoice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  ptVoice = vs.find((v) => v.lang === "pt-BR") || vs.find((v) => v.lang.startsWith("pt")) || null;
}
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\//g, ","));
  u.lang = "pt-BR"; u.rate = 0.85;
  if (ptVoice) u.voice = ptVoice;
  speechSynthesis.speak(u);
}
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// ---------- pestañas ----------
document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
function showTab(id) {
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === id));
  store.set("pr.tab", id);
  if (id !== "video" && player?.pauseVideo) player.pauseVideo();
}

// ---------- estadísticas ----------
function renderStats() {
  const learned = Object.values(progress).filter((p) => p.box >= 2).length;
  $("#stats").innerHTML = `
    <span class="stat">🔥 <b>${streak.days}</b> día${streak.days === 1 ? "" : "s"}</span>
    <span class="stat">🃏 <b>${learned}</b>/${CARDS.length || "…"} aprendidas</span>
    <span class="stat">🎬 <b>${chaptersDone.length}</b>/${CHAPTERS.length} capítulos</span>`;
}

// ---------- video y capítulos ----------
let player = null;
window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("player", {
    videoId: VIDEO_ID,
    playerVars: { rel: 0, modestbranding: 1, cc_load_policy: 0 },
    events: { onStateChange: () => highlightChapter() },
  });
  setInterval(highlightChapter, 2000);
};
function seek(t) {
  showTab("video");
  if (player?.seekTo) { player.seekTo(t, true); player.playVideo(); }
  else window.open(`https://youtu.be/${VIDEO_ID}?t=${t}`, "_blank");
}
function renderChapters() {
  $("#chapterList").innerHTML = CHAPTERS.map((c, i) => `
    <li data-i="${i}" class="${chaptersDone.includes(i) ? "done" : ""}">
      <input type="checkbox" aria-label="Terminado" ${chaptersDone.includes(i) ? "checked" : ""}>
      <button class="go"><span class="time">${fmt(c.t)}</span>${c.title}</button>
    </li>`).join("");
}
$("#chapterList").addEventListener("click", (e) => {
  const li = e.target.closest("li"); if (!li) return;
  const i = +li.dataset.i;
  if (e.target.matches("input")) {
    chaptersDone = e.target.checked ? [...new Set([...chaptersDone, i])] : chaptersDone.filter((x) => x !== i);
    store.set("pr.chapters", chaptersDone);
    li.classList.toggle("done", e.target.checked);
    renderStats(); touchStreak();
  } else if (e.target.closest(".go")) seek(CHAPTERS[i].t);
});
function highlightChapter() {
  if (!player?.getCurrentTime) return;
  const now = player.getCurrentTime();
  let cur = -1;
  CHAPTERS.forEach((c, i) => { if (now >= c.t) cur = i; });
  document.querySelectorAll("#chapterList li").forEach((li) => li.classList.toggle("current", +li.dataset.i === cur));
}

// ---------- tarjetas (Leitner) ----------
let CARDS = [];
let queue = [];
let current = null;
let direction = store.get("pr.direction", "es-pt");
$("#direction").value = direction;
$("#direction").addEventListener("change", (e) => { direction = e.target.value; store.set("pr.direction", direction); showCard(); });

function buildQueue() {
  const now = Date.now();
  const due = CARDS.filter((c) => progress[c.es] && progress[c.es].due <= now);
  const fresh = CARDS.filter((c) => !progress[c.es]).slice(0, NEW_PER_SESSION);
  queue = shuffle(due).concat(fresh);
}
function showCard() {
  current = queue[0] || null;
  $("#micResult").textContent = "";
  $("#cardBack").classList.add("hidden");
  $("#gradeActions").classList.add("hidden");
  $("#flipActions").classList.remove("hidden");
  const upcoming = CARDS.filter((c) => progress[c.es]).map((c) => progress[c.es].due).sort((a, b) => a - b)[0];
  if (!current) {
    $("#cardFront").innerHTML = `🎉 ¡Terminaste por hoy!<span class="lang">${upcoming ? "Próximo repaso: " + new Date(upcoming).toLocaleDateString("es") : ""}</span>`;
    $("#flipActions").classList.add("hidden");
    $("#queueInfo").textContent = "";
    return;
  }
  const [front, fl] = direction === "es-pt" ? [current.es, "español"] : [current.pt, "português"];
  $("#cardFront").innerHTML = `<span class="lang">${fl}</span>${front}`;
  $("#queueInfo").textContent = `${queue.length} pendiente${queue.length === 1 ? "" : "s"} en esta sesión`;
  if (direction === "pt-es") speak(current.pt);
}
function flip() {
  if (!current) return;
  const [back, bl] = direction === "es-pt" ? [current.pt, "português"] : [current.es, "español"];
  $("#cardBack").innerHTML = `<span class="lang">${bl}</span>${back}`;
  $("#cardBack").classList.remove("hidden");
  $("#flipActions").classList.add("hidden");
  $("#gradeActions").classList.remove("hidden");
  if (direction === "es-pt") speak(current.pt);
}
function grade(knew) {
  if (!current) return;
  const p = progress[current.es] || { box: 0 };
  p.box = knew ? Math.min(p.box + 1, INTERVALS.length - 1) : 0;
  p.due = Date.now() + INTERVALS[p.box] * DAY;
  progress[current.es] = p;
  store.set("pr.cards", progress);
  queue.shift();
  if (!knew) queue.splice(Math.min(3, queue.length), 0, current); // vuelve a salir en breve
  touchStreak(); renderStats(); showCard();
}
$("#flipBtn").addEventListener("click", flip);
$("#card").addEventListener("click", () => { if ($("#cardBack").classList.contains("hidden")) flip(); });
$("#goodBtn").addEventListener("click", () => grade(true));
$("#againBtn").addEventListener("click", () => grade(false));
$("#speakBtn").addEventListener("click", () => current && speak(current.pt));
document.addEventListener("keydown", (e) => {
  if (!$("#cards").classList.contains("active") || e.target.matches("input, select")) return;
  if (e.code === "Space") { e.preventDefault(); flip(); }
  else if (e.key === "1" && !$("#gradeActions").classList.contains("hidden")) grade(false);
  else if (e.key === "2" && !$("#gradeActions").classList.contains("hidden")) grade(true);
});

// Pronunciar y comparar con el reconocimiento de voz del navegador (Chrome/Edge)
if (!Recognition) $("#micBtn").classList.add("hidden");
$("#micBtn").addEventListener("click", () => {
  if (!current || !Recognition) return;
  const rec = new Recognition();
  rec.lang = "pt-BR"; rec.maxAlternatives = 5;
  const out = $("#micResult");
  out.className = "mic-result"; out.textContent = "🎙️ Escuchando…";
  rec.onresult = (e) => {
    const heard = [...e.results[0]].map((a) => a.transcript);
    const targets = variants(current.pt);
    const ok = heard.some((h) => targets.some((t) => normalize(h).includes(t) || t.includes(normalize(h))));
    out.className = "mic-result " + (ok ? "ok" : "no");
    out.textContent = ok ? `✅ ¡Bien dicho! (“${heard[0]}”)` : `🔁 Entendí “${heard[0]}”. Escucha 🔊 y prueba de nuevo.`;
  };
  rec.onerror = () => { out.className = "mic-result no"; out.textContent = "No pude escucharte (revisa el permiso del micrófono)."; };
  rec.start();
});

// ---------- quiz ----------
let quiz = null;
$("#newQuiz").addEventListener("click", startQuiz);
$("#quizMode").addEventListener("change", startQuiz);
function startQuiz() {
  if (!CARDS.length) return;
  quiz = { items: shuffle([...CARDS]).slice(0, 10), i: 0, score: 0, mode: $("#quizMode").value };
  renderQuestion();
}
function renderQuestion() {
  const box = $("#quizBox");
  $("#quizScore").textContent = quiz ? `Aciertos: ${quiz.score}` : "";
  if (quiz.i >= quiz.items.length) {
    const pct = Math.round(quiz.score / quiz.items.length * 100);
    box.innerHTML = `<p class="q-prompt">${pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"} ${quiz.score}/${quiz.items.length} correctas</p>
      <p class="hint">Las que fallaste bajan a la caja 0 y volverán a salir en Tarjetas.</p>
      <button class="primary" id="again">Otro quiz</button>`;
    $("#again").addEventListener("click", startQuiz);
    touchStreak();
    return;
  }
  const item = quiz.items[quiz.i];
  const head = `<p class="q-progress">Pregunta ${quiz.i + 1} de ${quiz.items.length}</p>
    <p class="q-prompt">¿Cómo se dice <em>“${item.es}”</em>?</p>`;
  if (quiz.mode === "choice") {
    const opts = shuffle([item, ...shuffle(CARDS.filter((c) => c !== item)).slice(0, 3)]);
    box.innerHTML = head + `<div class="options">${opts.map((o, k) => `<button data-k="${k}">${o.pt}</button>`).join("")}</div><p class="feedback"></p>`;
    box.querySelectorAll(".options button").forEach((b) => b.addEventListener("click", () => {
      const right = opts[+b.dataset.k] === item;
      box.querySelectorAll(".options button").forEach((x) => { x.disabled = true; if (opts[+x.dataset.k] === item) x.classList.add("right"); });
      if (!right) b.classList.add("wrong");
      answer(item, right);
    }));
  } else {
    box.innerHTML = head + `<form class="q-input"><input autocomplete="off" autocapitalize="off" placeholder="Escribe en portugués…"><button class="primary">Comprobar</button></form><p class="feedback"></p>`;
    const input = box.querySelector("input"); input.focus();
    box.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (input.disabled) return;
      input.disabled = true;
      const v = normalize(input.value);
      answer(item, v.length > 0 && variants(item.pt).includes(v));
    });
  }
}
function answer(item, right) {
  quiz.score += right ? 1 : 0;
  const fb = $("#quizBox .feedback");
  fb.className = "feedback " + (right ? "ok" : "no");
  fb.innerHTML = (right ? "✅ ¡Correcto! " : "❌ Era: ") + `<b>${item.pt}</b>`;
  speak(item.pt);
  if (!right) { progress[item.es] = { box: 0, due: Date.now() }; store.set("pr.cards", progress); renderStats(); }
  setTimeout(() => { quiz.i++; renderQuestion(); }, right ? 1100 : 2200);
}

// ---------- sonidos ----------
function renderSounds() {
  $("#soundGrid").innerHTML = SOUNDS.map((g) => `
    <div class="sound-group">
      <header><h3>${g.group}</h3><button data-t="${g.t}" title="Ver en el video">▶ ${fmt(g.t)}</button></header>
      ${g.items.map(([l, s, ex]) => `
        <div class="sound-row"><span class="letter">${l}</span><span>${s} · <span class="ex">${ex}</span></span>
        <button data-say="${ex}" title="Escuchar">🔊</button></div>`).join("")}
    </div>`).join("");
}
$("#soundGrid").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.say) speak(b.dataset.say); else seek(+b.dataset.t);
});

// ---------- todo: diapositivas + apuntes en un solo scroll ----------
const toSec = (mmss) => { const [m, s] = mmss.split(":").map(Number); return m * 60 + s; };
const INTRO_END = 16; // antes de este segundo solo hay portada y "suscríbete"
let slideList = [];

async function loadSlides() {
  // Las diapositivas son locales (slides/, fuera de git); http.server devuelve un listado HTML.
  try {
    const html = await (await fetch("slides/")).text();
    return [...html.matchAll(/href="(\d\dm\d\ds)\.jpg"/g)]
      .map(([, n]) => ({ src: `slides/${n}.jpg`, t: +n.slice(0, 2) * 60 + +n.slice(3, 5) }))
      .filter((s) => s.t >= INTRO_END)
      .sort((a, b) => a.t - b.t)
      .filter((s, i, all) => !(all[i + 1] && all[i + 1].t - s.t <= 8)); // captura a mitad de transición
  } catch { return []; }
}

function renderAll(md, slides) {
  const [part1, part2 = ""] = md.split(/^## Parte 2.*$/m);
  // Cada "### MM:SS · Tema" del resumen se vuelve una sección con las diapositivas de su rango
  const sections = part1.split(/^### /m).slice(1).map((chunk) => {
    const nl = chunk.indexOf("\n");
    const heading = chunk.slice(0, nl).trim();
    const start = toSec(heading.match(/^(\d\d:\d\d)/)[1]);
    return { heading, title: heading.split("·").slice(1).join("·").trim(), start, body: chunk.slice(nl + 1) };
  });
  sections.forEach((s, i) => {
    const end = sections[i + 1]?.start ?? Infinity;
    s.slides = slides.filter((sl) => sl.t >= s.start && sl.t < end);
  });
  slideList = sections.flatMap((s) => s.slides.map((sl) => ({ ...sl, title: s.title })));

  $("#allToc").innerHTML = sections.map((s, i) => `<a href="#topic-${i}">${s.title.replace(/\s*\(.*\)$/, "")}</a>`).join("")
    + `<a href="#topic-extra">➕ Material extra</a>`;

  const noSlides = slides.length ? "" :
    `<p class="no-slides">No hay diapositivas locales en <code>slides/</code> (se generan con <code>slides.py</code>; ver README).</p>`;
  $("#allBody").innerHTML = noSlides + sections.map((s, i) => `
    <section class="topic" id="topic-${i}">
      <div class="topic-head">
        <h2><span class="time">${s.heading.split("·")[0].trim()}</span>${s.title}</h2>
        <button data-t="${s.start}">▶ Ver en el video</button>
      </div>
      ${s.slides.length ? `<div class="slides">${s.slides.map((sl) => `
        <figure data-src="${sl.src}"><img src="${sl.src}" loading="lazy" alt="Diapositiva ${fmt(sl.t)} · ${s.title}">
        <figcaption>${fmt(sl.t)}</figcaption></figure>`).join("")}</div>` : ""}
      <div class="notes">${marked.parse(s.body)}</div>
    </section>`).join("")
    + `<section class="topic" id="topic-extra"><div class="topic-head"><h2>➕ Material extra</h2></div>
       <div class="notes">${marked.parse(part2)}</div></section>`;
}
$("#allBody").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-t]");
  if (b) return seek(+b.dataset.t);
  const fig = e.target.closest("figure[data-src]");
  if (fig) openLightbox(slideList.findIndex((s) => s.src === fig.dataset.src));
});
$("#allToc").addEventListener("click", (e) => {
  const a = e.target.closest("a"); if (!a) return;
  e.preventDefault();
  document.querySelector(a.getAttribute("href"))?.scrollIntoView({ behavior: "smooth" });
});

let lbIndex = -1;
function openLightbox(i) {
  if (i < 0 || i >= slideList.length) return;
  lbIndex = i;
  const s = slideList[i];
  $("#lbImg").src = s.src;
  $("#lbCap").textContent = `${fmt(s.t)} · ${s.title} — ${i + 1}/${slideList.length}  (← → para navegar, Esc para cerrar)`;
  $("#lightbox").classList.remove("hidden");
}
const closeLightbox = () => { $("#lightbox").classList.add("hidden"); lbIndex = -1; };
$("#lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lbPrev") openLightbox(lbIndex - 1);
  else if (e.target.id === "lbNext") openLightbox(lbIndex + 1);
  else if (e.target.id !== "lbImg") closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (lbIndex < 0) return;
  if (e.key === "Escape") closeLightbox();
  else if (e.key === "ArrowLeft") openLightbox(lbIndex - 1);
  else if (e.key === "ArrowRight") openLightbox(lbIndex + 1);
});

// ---------- carga de datos ----------
async function load() {
  renderChapters(); renderSounds(); renderStats();
  showTab(store.get("pr.tab", "video"));
  try {
    const [csv, md, slides] = await Promise.all([
      fetch("anki.csv").then((r) => r.text()),
      fetch("guia-portugues.md").then((r) => r.text()),
      loadSlides(),
    ]);
    CARDS = csv.split("\n").filter(Boolean).map((l) => { const [es, pt] = l.split("\t"); return { es, pt }; }).filter((c) => c.pt);
    $("#guideBody").innerHTML = window.marked ? marked.parse(md) : `<pre>${md.replace(/</g, "&lt;")}</pre>`;
    if (window.marked) renderAll(md, slides);
  } catch {
    const msg = `<p>No se pudieron cargar los datos. Abre la página con un servidor local:<br><code>python3 -m http.server</code> y visita <code>http://localhost:8000</code>.</p>`;
    $("#cardFront").innerHTML = msg; $("#quizBox").innerHTML = msg; $("#guideBody").innerHTML = msg; $("#allBody").innerHTML = msg;
    return;
  }
  renderStats(); buildQueue(); showCard(); startQuiz();
}
load();

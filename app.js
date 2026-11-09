import { PROJECT_STEPS, MACHINES, LESSONS } from "./wissen.js";
import { buildCutList, compareMaterials } from "./kalkulation.js";
import {
  loadState,
  saveState,
  exportBackup,
  importBackup,
  photoFromFile,
} from "./speicher.js";
import { mountScene } from "./szene.js";
import { answerQuestion } from "./mentor.js";

const $ = (id) => document.getElementById(id);
const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const uid = () =>
  crypto.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const fmt = (v, d = 0) =>
  new Intl.NumberFormat("de-DE", { maximumFractionDigits: d }).format(v);
const money = (v) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    v,
  );
const paths = {
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  wood: '<path d="m3 8 8-5 10 5v9l-8 4-10-5Z M3 8l10 5 8-5M13 13v8M6 11v4m3-2v3"/>',
  book: '<path d="M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1Zm0 0v14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  question:
    '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
};
const icon = (n) =>
  `<svg class="line-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[n] || paths.compass}</svg>`;
const btn = (action, text, cls = "secondary", attr = "") =>
  `<button type="button" class="button ${cls}" data-action="${action}" ${attr}>${text}</button>`;
const routeBtn = (route, text, cls = "secondary") =>
  btn("route", text, cls, `data-target="${route}"`);
const loaded = loadState();
let state = loaded.state;
let scene = null,
  token = 0,
  materialTab = "cutlist",
  wisdomTab = "journal",
  hotspotId = "",
  helpMode = "",
  search = "",
  exploded = false,
  saveTimer,
  coachAnswer = null,
  coachQuery = "";
const step = () =>
  PROJECT_STEPS.find((s) => s.id === state.stepId) || PROJECT_STEPS[0];
const next = () =>
  PROJECT_STEPS.find((s) => !state.completed.includes(s.id)) ||
  PROJECT_STEPS.at(-1);
const announce = (m) => {
  $("app-status").textContent = m;
};
function persist(message = "") {
  const r = saveState(state);
  if (!r.ok)
    announce(
      r.error ||
        "Speichern ist gerade nicht möglich. Exportiere deinen Stand als Sicherung.",
    );
  else if (message) announce(message);
  return r.ok;
}
const viewKey = () =>
  state.route === "machines" ? state.selectedMachine : "project";
function storeView() {
  const view = scene?.capture?.();
  if (view) state.modelViews[viewKey()] = view;
}
function navigate(route, id) {
  storeView();
  state.route = route;
  if (id) state.stepId = id;
  search = "";
  persist();
  render();
  $("view").focus();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function stage(
  kind = "project",
  caption = "Projektidee · frei drehbares Formmodell",
) {
  return `<div class="scene-host" id="model-stage" data-kind="${kind}"></div><div class="scene-toolbar"><span class="small muted">${caption}</span><div class="actions">${kind === "project" ? btn("explode", exploded ? "Zusammenbauen" : "Bauteile ansehen", "ghost compact") : ""}${btn("reset-view", "Ansicht zurücksetzen", "ghost compact")}</div></div>`;
}
function rose() {
  return `<svg class="compass-rose" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width=".7"/><circle cx="100" cy="100" r="59" fill="none" stroke="currentColor" stroke-width=".7"/><path d="M100 10v25m0 130v25M10 100h25m130 0h25M36 36l17 17m94 94 17 17m-128 0 17-17m94-94 17-17" stroke="currentColor"/><path d="m122 70-11 41-41 19 19-41Z" fill="currentColor"/><path d="m122 70-22 30-30 30 19-41Z" fill="#163d32"/></svg>`;
}

function compass() {
  const n = next(),
    done = state.completed.length,
    finished = done === PROJECT_STEPS.length,
    p = state.paused;
  return `${p ? `<div class="callout resume-callout">${icon("pause")}<div><strong>Dein Faden wartet hier auf dich.</strong><p>${esc(p.note || PROJECT_STEPS.find((s) => s.id === p.stepId)?.title)}</p></div>${btn("resume", "Hier weitermachen", "primary")}</div>` : ""}
 <div class="grid-dashboard"><section class="hero-card">${rose()}<div class="hero-content"><span class="tag light">${icon("compass")} Dein nächster klarer Schritt</span><h2>${finished ? "Aus Erfahrung wird Können." : esc(n.title)}</h2><p>${finished ? "Dein Projektweg ist dokumentiert. Was möchtest du beim nächsten Werkstück wieder nutzen?" : esc(n.task)}</p><div class="actions">${btn(finished ? "new-insight" : "start-next", finished ? "Erkenntnis festhalten" : `Gemeinsam angehen ${icon("arrow")}`, "primary hero-action")}${btn("help", "Ich hänge gerade fest", "ghost")}</div><div class="hero-foot"><span class="hero-dot"></span>Du bestimmst das Tempo.</div></div></section>
 <section class="card project-preview"><div class="card-header"><div><span class="eyebrow">Dein aktuelles Werkstück</span><h2 class="card-title">Fünf Haken. Dein Handwerk.</h2></div><span class="tag">Massivholz</span></div>${stage()}<div class="stat-row"><div class="stat"><strong>${done}<small> / ${PROJECT_STEPS.length}</small></strong><span>Schritte geklärt</span></div><div class="stat"><strong>${state.journal.length}</strong><span>eigene Einträge</span></div><div class="stat"><strong>${state.bookmarks.length}</strong><span>Merksätze</span></div></div></section></div>
 <div class="journey-strip"><div><span class="eyebrow">Dein Weg zum Können</span><strong>Kleidungshalter mit 5 Holzhaken</strong></div><div class="progress-track" role="progressbar" aria-label="Geklärte Projektschritte" aria-valuemin="0" aria-valuemax="9" aria-valuenow="${done}"><div class="progress-fill" style="width:${(done / PROJECT_STEPS.length) * 100}%"></div></div><span class="small muted">${done} von ${PROJECT_STEPS.length}</span>${routeBtn("project", "Projekt öffnen", "ghost compact")}</div>
 <div class="grid-dashboard lower-grid"><section class="card"><div class="card-header"><div><span class="eyebrow">Ein guter Meister erklärt das Warum</span><h2 class="card-title">Was brauchst du gerade?</h2></div>${icon("spark")}</div><form id="coach-form" class="coach-form"><label for="coach-query" class="small muted">Frag in deinen eigenen Worten.</label><div class="coach-input"><input id="coach-query" name="query" type="text" maxlength="500" required placeholder="Was ist beim Dickenhobeln anders?" value="${esc(coachQuery)}"><button type="submit" class="button primary compact">Wissen finden</button></div></form><div id="coach-answer" aria-live="polite">${coachAnswer ? renderCoach() : ""}</div><div class="mentor-options">${[
   ["plan", "Den Plan verstehen", "Aus Linien werden Bauteile."],
   [
     "machine",
     "Eine Maschine verstehen",
     "Bauteile sehen. Den Zweck begreifen.",
   ],
   ["focus", "Wieder reinkommen", "Den nächsten Handgriff finden."],
 ]
   .map(
     ([id, t, sub]) =>
       `<button class="mentor-option" data-action="help-choice" data-value="${id}"><span class="mentor-option-icon">${icon(id === "machine" ? "wood" : id === "focus" ? "compass" : "book")}</span><span><strong>${t}</strong><small>${sub}</small></span>${icon("arrow")}</button>`,
   )
   .join("")}</div>${helpMode ? mentor(helpMode) : ""}</section>
 <section class="card insight"><span class="eyebrow">Hikmah · Wissen, das bleibt</span><blockquote>„Ein guter nächster Schritt beginnt mit einer guten Frage.“</blockquote><p class="muted">Was hat dich heute weitergebracht? Halte einen Gedanken fest, bevor der Werkstattalltag ihn überholt.</p>${btn("new-insight", `${icon("plus")} Eigene Erkenntnis festhalten`)}<div class="insight-footer">${state.journal.length ? "Zuletzt: " + esc(state.journal.at(-1).title) : "Dein persönliches Erfahrungsbuch beginnt hier."}</div></section></div>`;
}
function renderCoach() {
  const a = coachAnswer;
  let primary;
  if (!a.lessonIds.length) primary = btn('save-question', esc(a.actionLabel), 'secondary compact');
  else if (a.machineId) primary = btn('open-machine', esc(a.actionLabel), 'secondary compact', `data-id="${a.machineId}"`);
  else if (a.route === 'project' && a.lessonIds.includes('unterbrechung')) primary = state.paused ? btn('resume', esc(a.actionLabel), 'secondary compact') : routeBtn('project', esc(a.actionLabel), 'secondary compact');
  else if (a.route === 'project') primary = btn('start-next', esc(a.actionLabel), 'secondary compact');
  else primary = routeBtn(a.route, esc(a.actionLabel), 'secondary compact');
  return `<div class="callout coach-answer"><div><span class="eyebrow">Dein Wissenskompass</span><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p>${a.questions.length ? `<details><summary>Diese Fragen helfen dir weiter</summary><ul>${a.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></details>` : ""}<div class="actions">${primary}${a.lessonIds.length ? btn("open-lesson", "Den Zusammenhang lesen", "ghost compact", `data-id="${a.lessonIds[0]}"`) : ''}</div></div></div>`;
}
function mentor(mode) {
  const answers = {
    plan: [
      "Beginne mit einem einzigen Bauteil.",
      "Zeige auf ein Teil im Plan. Wie heißt es? Welche Maße stehen wirklich dort? Was möchtest du beim Ausbilder klären?",
      "project",
      "Den Auftrag gemeinsam klären",
    ],
    machine: [
      "Erst den Zweck verstehen.",
      "Wähle eine Maschine und tippe einen markierten Punkt an. Deine eigene Maschine kannst du mit Foto und Merkhilfe festhalten.",
      "machines",
      "Maschinen entdecken",
    ],
    focus: [
      "Ein nächster Handgriff reicht.",
      state.paused?.note ||
        `Dein erster offener Schritt heißt „${next().title}“. Öffne ihn und nimm dir einen einzigen Prüfpunkt vor.`,
      "project",
      "Einen Schritt öffnen",
    ],
  };
  const [t, b, r, a] = answers[mode];
  return `<div class="callout mentor-answer"><div><strong>${t}</strong><p>${esc(b)}</p>${routeBtn(r, a, "ghost compact")}</div></div>`;
}
function project() {
  const s = step(),
    count = s.checks.filter((_, i) => state.checks[`${s.id}:${i}`]).length,
    valid =
      count === s.checks.length &&
      (s.id !== "stueckliste" || buildCutList(state.plan).valid);
  return `<div class="project-intro"><span class="tag orange">Dein Lernprojekt</span><p>Aus dem Chefplan wird ein nachvollziehbarer Weg. Jeder Schritt hat einen Zweck und ein erkennbares Ergebnis.</p>${btn("capture-project", `${icon("plus")} Foto oder Notiz zum Projekt`, "secondary compact")}</div><div class="split-view project-layout"><aside class="card"><span class="eyebrow">Dein Arbeitsweg</span><ol class="step-list">${PROJECT_STEPS.map((p, i) => `<li><button class="step-item ${p.id === s.id ? "active" : ""} ${state.completed.includes(p.id) ? "done" : ""}" data-action="select-step" data-id="${p.id}" aria-current="${p.id === s.id ? "step" : "false"}"><span class="step-number">${state.completed.includes(p.id) ? icon("check") : String(i + 1).padStart(2, "0")}</span><span><strong>${esc(p.title)}</strong><small>${esc(p.short)}</small></span></button></li>`).join("")}</ol><p class="small muted">Entwurfsweg: Die konkrete Arbeitsfolge am Plan und mit deinem Ausbilder prüfen.</p></aside>
 <section class="card step-work"><div class="card-header"><span class="eyebrow">Jetzt nur dieser Schritt</span><span class="tag">${count} / ${s.checks.length} geklärt</span></div><h2>${esc(s.title)}</h2><p class="step-goal">${esc(s.goal)}</p><div class="callout">${icon("compass")}<div><strong>Dein nächster Handgriff</strong><p>${esc(s.task)}</p></div></div><details class="why-block"><summary>Warum kommt dieser Schritt hier?</summary><p>${esc(s.why)}</p></details><h3>Woran erkennst du, dass du bereit bist?</h3><div class="check-list">${s.checks.map((t, i) => `<label class="check-row"><input type="checkbox" data-check="${s.id}:${i}" ${state.checks[`${s.id}:${i}`] ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}</div>
 ${s.id === "stueckliste" ? `<div class="callout"><div><strong>${buildCutList(state.plan).valid ? "Deine Stückliste ist berechnet." : "Deine Planmaße fehlen noch."}</strong><p>Rohmaße entstehen aus deinen Fertigmaßen und deinen gesamten Maßzugaben.</p>${routeBtn("material", "Stückliste öffnen", "ghost compact")}</div></div>` : ""}<div class="actions">${s.machineId ? btn("open-machine", `${icon("wood")} Passendes Maschinenwissen`, "secondary", `data-id="${s.machineId}"`) : routeBtn(s.id === "material" ? "material" : "wisdom", "Passendes Wissen öffnen")}${btn("open-lesson", "Kurz erklärt", "ghost", `data-id="${s.lessonId}"`)}</div><div class="step-finish">${state.completed.includes(s.id) ? `<span class="tag">${icon("check")} Als geklärt festgehalten</span>${btn("reopen-step", "Erneut anschauen", "ghost compact")}` : btn("complete-step", `Schritt geklärt ${icon("check")}`, "primary", valid ? "" : "disabled")}<span class="small muted">${valid ? "Deine Bestätigung hält den Lernstand fest." : "Kläre die offenen Punkte. „Noch nicht“ ist völlig in Ordnung."}</span></div></section></div>`;
}
function drawing(id) {
  const d = {
    saw: '<path d="M20 63h100v10H20Zm48-8 8-32 20 2-7 30"/><circle cx="80" cy="43" r="20"/><path d="M34 73v18m73-18v18M23 57h36"/>',
    jointer:
      '<path d="M17 40h106v12H17Zm12 12v39h82V52M64 40V23h48v17M24 65h32M71 52v39"/>',
    thickness:
      '<path d="M30 25h80v65H30Zm10 10h60v42H40ZM18 66h104v9H18"/><circle cx="70" cy="47" r="8"/>',
    drill:
      '<path d="M25 30h62l18 9v22H65l-6 32H39l5-32H25Z M105 39h17v17h-17M25 35H14v20h11M65 61h16v14H63"/>',
  };
  return `<svg class="machine-illustration" viewBox="0 0 140 110" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d[id]}</svg>`;
}
function machines() {
  const m = MACHINES.find((m) => m.id === state.selectedMachine) || MACHINES[0];
  state.selectedMachine = m.id;
  const h = m.hotspots.find((h) => h.id === hotspotId) || m.hotspots[0];
  hotspotId = h.id;
  return `<div class="machine-grid">${MACHINES.map((p) => `<button class="machine-card ${p.id === m.id ? "active" : ""}" data-action="machine-select" data-id="${p.id}" aria-pressed="${p.id === m.id}"><div class="machine-icon">${drawing(p.id)}</div><strong>${esc(p.name)}</strong><span>${esc(p.short)}</span></button>`).join("")}</div><div class="split-view machine-detail"><section class="card machine-stage"><div class="card-header"><div><span class="eyebrow">Verstehen durch Entdecken</span><h2 class="card-title">${esc(m.name)}</h2></div><span class="tag">3D-Lernmodell</span></div>${stage(m.id, "Drehen · Zoomen · Markierte Punkte antippen")}<div class="hotspot-tabs">${m.hotspots.map((p, i) => btn("hotspot", `${i + 1}. ${esc(p.label)}`, `secondary compact ${p.id === h.id ? "selected" : ""}`, `data-id="${p.id}" aria-pressed="${p.id === h.id}"`)).join("")}</div><p class="small muted">Allgemeines Lernmodell. Form und Bedienelemente deiner Maschine können abweichen.</p></section><section class="card"><span class="eyebrow">Der markierte Punkt</span><h2 id="hotspot-title">${esc(h.label)}</h2><p id="hotspot-description">${esc(h.description)}</p><div class="callout">${icon("question")}<div><strong>Darauf kommt es an</strong><p id="hotspot-safety">${esc(h.safety)}</p></div></div><details open><summary>Wofür brauche ich diese Maschine?</summary><p>${esc(m.purpose)}</p><p class="muted">${esc(m.principle)}</p></details><details><summary>Vor dem Arbeitsgang klären</summary><ul>${m.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></details><div class="actions">${btn("machine-note", `${icon("plus")} Meine Maschine festhalten`)}${btn("machine-question", "Frage für meinen Ausbilder", "ghost")}</div><a class="source-link" href="${esc(m.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.sourceLabel)} ↗</a></section></div>`;
}
const dimensions = [
  ["length", "Träger · Länge"],
  ["width", "Träger · Breite"],
  ["thickness", "Träger · Dicke"],
  ["hookLength", "Haken · Länge"],
  ["hookWidth", "Haken · Breite"],
  ["hookThickness", "Haken · Dicke"],
];
function planForm() {
  return `<form id="plan-form"><div class="card-header"><div><span class="eyebrow">Aus deinem Plan</span><h2 class="card-title">Fertigmaße festhalten</h2></div><span class="tag">Millimeter</span></div><p class="muted">Übernimm die Maße aus deinem Plan. Die Formansicht ist eine Projektidee und ersetzt keine bemaßte Zeichnung.</p><div class="form-grid">${dimensions.map(([k, l]) => `<label class="field"><span>${l} <small>mm</small></span><input name="${k}" type="text" inputmode="decimal" required placeholder="Aus deinem Plan" value="${esc(state.plan[k])}"></label>`).join("")}<label class="field"><span>Anzahl der Haken</span><input name="hookCount" type="number" min="1" max="100" required value="${esc(state.plan.hookCount)}"></label></div><hr><h3>Deine Rohmaßzugaben</h3><p class="small muted">Gesamte Zugabe je Maß, einmal addiert. Material- und arbeitsgangabhängig mit deinem Ausbilder festlegen; 0 ist möglich.</p><div class="form-grid">${[
    ["allowLength", "Längenzugabe"],
    ["allowWidth", "Breitenzugabe"],
    ["allowThickness", "Dickenzugabe"],
  ]
    .map(
      ([k, l]) =>
        `<label class="field"><span>${l} <small>mm</small></span><input name="${k}" type="text" inputmode="decimal" required placeholder="Noch klären" value="${esc(state.plan[k])}"></label>`,
    )
    .join(
      "",
    )}</div><button class="button primary" type="submit">Stückliste berechnen ${icon("arrow")}</button><p id="calculation-feedback" role="status" class="small muted"></p></form>`;
}
function cutlist() {
  const c = buildCutList(state.plan);
  if (!c.valid)
    return `<div class="empty-state">${icon("wood")}<h3>Jedes Maß bekommt einen Grund.</h3><p>Trage Fertigmaße und geklärte Zugaben ein. Daraus entsteht deine prüfbare Stückliste.</p><span class="small muted">Fertigmaß + gesamte Zugabe = Rohmaß</span></div>`;
  const best = compareMaterials(state.materials, c).find((m) => m.eligible);
  return `<div class="card-header"><div><span class="eyebrow">Nachvollziehbar berechnet</span><h2 class="card-title">Deine Stückliste</h2></div>${btn("csv", "CSV exportieren", "ghost compact")}</div><div class="table-wrap"><table><caption class="visually-hidden">Stückliste in Millimetern</caption><thead><tr><th>Bauteil</th><th>Anzahl</th><th>Fertigmaß L × B × D</th><th>Rohmaß L × B × D</th></tr></thead><tbody>${c.rows.map((r) => `<tr><th>${esc(r.name)}</th><td>${r.quantity}</td><td>${["length", "width", "thickness"].map((k) => fmt(r.finished[k], 1)).join(" × ")}</td><td><strong>${["length", "width", "thickness"].map((k) => fmt(r.raw[k], 1)).join(" × ")}</strong></td></tr>`).join("")}</tbody></table></div><div class="stat-row"><div class="stat"><strong>${fmt(c.totalVolumeM3 * 1000, 2)} <small>Liter</small></strong><span>Rohholzvolumen</span></div><div class="stat"><strong>${c.rows.reduce((a, r) => a + r.quantity, 0)}</strong><span>Holzteile im Projekt</span></div></div><div class="callout"><div><strong>So rechnet dein Kompass</strong><p>${fmt(c.rows[0].finished.length, 1)} mm Fertiglänge + ${fmt(c.rows[0].raw.length - c.rows[0].finished.length, 1)} mm Zugabe = ${fmt(c.rows[0].raw.length, 1)} mm Rohlänge. Breite und Dicke folgen demselben Prinzip.</p></div></div><h3>Was passt aus deinem Lager?</h3>${best ? `<div class="material-recommendation"><strong>${esc(best.name)} · ${money(best.price)}</strong><p>${esc(best.reason)}</p><span class="tag">Günstigster geeigneter Eintrag im einfachen Vergleich</span></div>` : `<p class="muted">${state.materials.length ? "Im einfachen Längsvergleich passt bisher kein vollständig als geeignet erfasstes Brett. Andere Aufteilungen können möglich sein." : "Dein Holzlager ist noch leer. Erfasse vorhandenes Holz für den Vergleich."}</p>`}${btn("material-tab", "Holzlager öffnen", "secondary", 'data-value="inventory"')}<p class="small muted">Einfacher Längsstreifen-Vergleich mit 3 mm angenommener Schnittfuge. Faserrichtung, Fehlerstellen und tatsächliche Schnittfuge zusätzlich prüfen.</p>`;
}
function inventory() {
  return `<div class="split-view"><section class="card"><span class="eyebrow">Vorhandenes Holz nutzen</span><h2 class="card-title">Ein Brett ins Lager aufnehmen</h2><p class="muted">Ein Eintrag steht für ein Brett. Holzart und Zustand dürfen noch offen sein.</p><form id="material-form"><label class="field"><span>Bezeichnung</span><input name="name" required maxlength="100" placeholder="Zum Beispiel: Restbrett aus dem Lager"></label><div class="form-grid"><label class="field"><span>Holzart</span><select name="species"><option>Unbekannt</option><option>Kiefer</option><option>Fichte</option><option>Buche</option><option>Eiche</option><option>Andere</option></select></label><label class="field"><span>Zustand / Eignung</span><select name="condition"><option value="prüfen">Noch prüfen</option><option value="geeignet">Für den Auftrag geprüft</option><option value="ungeeignet">Ungeeignet</option></select></label>${[
    ["length", "Länge · mm"],
    ["width", "Breite · mm"],
    ["thickness", "Dicke · mm"],
    ["price", "Preis für das ganze Brett · €"],
  ]
    .map(
      ([k, l]) =>
        `<label class="field"><span>${l}</span><input name="${k}" type="number" min="${k === "price" ? 0 : 0.1}" max="100000" step="any" required placeholder="${k === "price" ? "0 bei kostenlosem Restholz" : "Noch messen"}"></label>`,
    )
    .join(
      "",
    )}</div><button class="button primary" type="submit">${icon("plus")} Brett aufnehmen</button></form><div class="callout"><div><strong>Günstig und geeignet gehören zusammen.</strong><p>Holzart und Eignung werden von dir bestätigt. Dein Foto kann als Merkhilfe ins Hikmah-Buch; eine sichere Foto-Holzbestimmung wird daraus nicht abgeleitet.</p></div></div></section><section><div class="card-header"><h2 class="card-title">Dein Holzlager</h2><span class="tag">${state.materials.length} Bretter</span></div><div class="material-grid">${state.materials.length ? state.materials.map((m) => `<article class="card material-card"><span class="tag ${m.condition === "geeignet" ? "" : "orange"}">${esc(m.condition)}</span><h3>${esc(m.name)}</h3><p>${esc(m.species)} · ${fmt(m.length)} × ${fmt(m.width)} × ${fmt(m.thickness)} mm</p><strong class="metric">${money(m.price)}</strong><span class="small muted">für dieses Brett</span><div class="actions">${btn("material-remove", "Entfernen", "ghost compact", `data-id="${esc(m.id)}"`)}</div></article>`).join("") : `<div class="card empty-state">${icon("wood")}<h3>Auch ein Rest ist ein Anfang.</h3><p>Erfasse dein erstes Brett. Dein Kompass vergleicht es mit deiner Stückliste.</p></div>`}</div></section></div>`;
}
function material() {
  return `<div class="tabs" role="tablist" aria-label="Materialbereich">${[
    ["cutlist", "Stückliste & Rohmaße"],
    ["inventory", "Mein Holzlager"],
  ]
    .map(([id, t]) =>
      btn(
        "material-tab",
        t,
        `tab ${materialTab === id ? "active" : ""}`,
        `data-value="${id}" role="tab" aria-selected="${materialTab === id}"`,
      ),
    )
    .join(
      "",
    )}</div>${materialTab === "inventory" ? inventory() : `<div class="split-view"><section class="card">${planForm()}</section><section class="card" id="cutlist-result">${cutlist()}</section></div>`}`;
}

function lessonCard(l) {
  return `<article class="card knowledge-card" id="lesson-${l.id}"><div class="card-header"><span class="tag">${esc(l.category)}</span>${btn("bookmark", state.bookmarks.includes(l.id) ? "✓ Gemerkt" : "Merken", "ghost compact", `data-id="${l.id}" aria-pressed="${state.bookmarks.includes(l.id)}"`)}</div><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p><details><summary>Den Zusammenhang verstehen</summary><p>${esc(l.explanation)}</p><div class="callout"><div><strong>Prüfe dein Verständnis</strong><p>${esc(l.question)}</p><details><summary>Antwort ansehen</summary><p>${esc(l.answer)}</p></details></div></div></details>${l.relatedMachine ? btn("open-machine", "An der Maschine ansehen", "secondary compact", `data-id="${l.relatedMachine}"`) : ""}<span class="small muted">Grundwissen · konkrete Anwendung mit deiner Unterweisung abgleichen</span></article>`;
}
function wisdomResults() {
  const query = search.toLocaleLowerCase("de");
  if (wisdomTab !== "journal") {
    const lessons = LESSONS.filter(
      (l) =>
        `${l.title} ${l.summary} ${l.category}`
          .toLocaleLowerCase("de")
          .includes(query) &&
        (wisdomTab !== "saved" || state.bookmarks.includes(l.id)),
    );
    return `<div class="knowledge-list">${lessons.length ? lessons.map(lessonCard).join("") : `<div class="card empty-state"><h3>${search ? "Kein passender Begriff gefunden." : "Deine Merksätze warten auf dich."}</h3><p>Öffne das Grundwissen und merke dir, was du wiederfinden möchtest.</p>${btn("wisdom-tab", "Grundwissen öffnen", "secondary", 'data-value="library"')}</div>`}</div>`;
  }
  const entries = state.journal.filter((j) =>
    `${j.title} ${j.body} ${j.kind}`.toLocaleLowerCase("de").includes(query),
  );
  return `<div class="knowledge-list">${
    entries.length
      ? entries
          .slice()
          .reverse()
          .map(
            (e) =>
              `<article class="card knowledge-card"><div class="card-header"><span class="tag">${esc(e.kind)}</span><time class="small muted">${new Date(e.createdAt).toLocaleDateString("de-DE")}</time></div><h3>${esc(e.title)}</h3><p class="journal-body">${esc(e.body)}</p>${e.photo ? `<img class="photo-preview" src="${esc(e.photo)}" alt="Eigenes Dokumentationsfoto zu ${esc(e.title)}" loading="lazy">` : ""}<div class="actions"><span class="small muted">${esc(PROJECT_STEPS.find((s) => s.id === e.stepId)?.title || "Dein Erfahrungswissen")}</span>${btn("journal-remove", "Entfernen", "ghost compact", `data-id="${esc(e.id)}"`)}</div></article>`,
          )
          .join("")
      : `<div class="card empty-state">${icon("book")}<h2>Hier wird aus Erleben dein Wissen.</h2><p>${search ? "Kein Eintrag passt zu deiner Suche." : "Eine Erkenntnis, eine offene Frage oder ein Foto: Halte fest, was du später wieder brauchen wirst."}</p>${btn("new-insight", "Ersten Gedanken festhalten", "primary")}</div>`
  }</div>`;
}
function wisdom() {
  return `<div class="card-header"><div class="tabs" role="tablist" aria-label="Wissensbereich">${[
    ["journal", "Mein Erfahrungsbuch"],
    ["library", "Grundwissen"],
    ["saved", "Gemerkt"],
  ]
    .map(([id, t]) =>
      btn(
        "wisdom-tab",
        t,
        `tab ${wisdomTab === id ? "active" : ""}`,
        `data-value="${id}" role="tab" aria-selected="${wisdomTab === id}"`,
      ),
    )
    .join(
      "",
    )}</div>${btn("new-insight", `${icon("plus")} Festhalten`, "primary compact")}</div><label class="search-box"><span class="visually-hidden">Wissen durchsuchen</span><input id="knowledge-search" type="search" placeholder="Einen Gedanken oder Begriff wiederfinden …" value="${esc(search)}"></label><div id="knowledge-results">${wisdomResults()}</div><div class="card backup-card"><div><h3>Dein Wissen gehört dir.</h3><p class="small muted">Einträge, Fotos und Projektstand bleiben in diesem Browser. Exportiere regelmäßig eine Sicherung für später oder ein anderes Gerät.</p></div><div class="actions">${btn("backup", "Sicherung exportieren")}${btn("import", "Sicherung einlesen", "ghost")}</div></div>`;
}

const meta = {
  compass: [
    "Dein persönlicher Werkstattkompass",
    "Ein klarer Schritt reicht.",
    "Orientierung für dein Handwerk. Platz für dein Wissen.",
  ],
  project: [
    "Dein Werkstück",
    "Vom Plan zum Verstehen.",
    "Kleidungshalter mit 5 selbst gefertigten Holzhaken",
  ],
  machines: [
    "Deine Werkstatt",
    "Begreifen, was vor dir steht.",
    "Bauteile entdecken. Zusammenhänge verstehen. Wissen wiederfinden.",
  ],
  material: [
    "Material & Maße",
    "Aus Resten werden Möglichkeiten.",
    "Deine Planmaße. Dein Material. Eine nachvollziehbare Entscheidung.",
  ],
  wisdom: [
    "Dein Hikmah",
    "Erfahrung, die bei dir bleibt.",
    "Eigene Erkenntnisse und Grundlagen für deinen Weg zum Meister.",
  ],
};
async function render() {
  const currentToken = ++token;
  if (scene) {
    scene.dispose();
    scene = null;
  }
  if (!meta[state.route]) state.route = "compass";
  const [e, t, s] = meta[state.route];
  $("page-eyebrow").textContent = e;
  $("page-title").textContent = t;
  $("page-subtitle").textContent = s;
  document.querySelectorAll("[data-route]").forEach((el) => {
    const active = el.dataset.route === state.route;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  $("resume-work").hidden = !state.paused;
  document.body.classList.toggle(
    "focus-mode",
    state.focus && state.route === "project",
  );
  $("view").innerHTML = { compass, project, machines, material, wisdom }[
    state.route
  ]();
  if (state.route === "project")
    document
      .querySelector(".project-intro")
      .insertAdjacentHTML(
        "beforeend",
        btn(
          "focus",
          state.focus ? "Übersicht zeigen" : "Nur diesen Schritt zeigen",
          "ghost compact",
        ),
      );
  const host = $("model-stage");
  if (host) {
    const kind = host.dataset.kind;
    const mounted = await mountScene(host, {
      kind,
      exploded,
      savedView: state.modelViews[kind],
      onHotspot: (id) => {
        hotspotId = id;
        updateHotspot();
      },
    });
    if (currentToken !== token) {
      mounted?.dispose();
      return;
    }
    scene = mounted;
    scene?.pause?.(Boolean(state.paused));
  }
}
function updateHotspot() {
  const h = MACHINES.find((m) => m.id === state.selectedMachine)?.hotspots.find(
    (h) => h.id === hotspotId,
  );
  if (!h || !$("hotspot-title")) return;
  $("hotspot-title").textContent = h.label;
  $("hotspot-description").textContent = h.description;
  $("hotspot-safety").textContent = h.safety;
  document.querySelectorAll('[data-action="hotspot"]').forEach((el) => {
    el.classList.toggle("selected", el.dataset.id === h.id);
    el.setAttribute("aria-pressed", String(el.dataset.id === h.id));
  });
}
function capture({ title = "", body = "", kind = "Erkenntnis" } = {}) {
  const f = $("capture-form");
  f.reset();
  f.elements.title.value = title;
  f.elements.body.value = body;
  f.elements.kind.value = kind;
  $("capture-error").textContent = "";
  $("capture-dialog").showModal();
}
function openPause() {
  storeView();
  const note = state.paused?.note || "";
  state.paused = {
    at: new Date().toISOString(),
    stepId: state.stepId,
    route: state.route,
    note,
    view: state.modelViews[viewKey()] || null,
    machineId: state.selectedMachine,
  };
  const ok = persist();
  scene?.pause?.(true);
  $("resume-work").hidden = false;
  $("pause-context").textContent = `${step().title} · ${meta[state.route][0]}`;
  $("pause-note").value = note;
  $("pause-dialog").showModal();
  announce(
    ok
      ? "Dein Stand ist bereits gesichert. Die Rückkehrnotiz ist freiwillig."
      : "Stand nur in dieser Sitzung verfügbar. Bitte exportiere eine Sicherung.",
  );
}
function resume() {
  const p = state.paused;
  if (!p) return;
  state.paused = null;
  state.stepId = p.stepId;
  state.route = p.route;
  if (p.machineId) state.selectedMachine = p.machineId;
  if (p.view)
    state.modelViews[
      p.route === "machines" ? state.selectedMachine : "project"
    ] = p.view;
  persist();
  render();
  announce(
    p.note
      ? `Dein nächster Handgriff: ${p.note}`
      : "Dein gespeicherter Schritt ist wieder da.",
  );
}
function invalidateFrom(id, clearCurrent = false) {
  const index = PROJECT_STEPS.findIndex((s) => s.id === id);
  const affected = PROJECT_STEPS.slice(index).map((s) => s.id);
  state.completed = state.completed.filter((id) => !affected.includes(id));
  for (const key of Object.keys(state.checks)) {
    const stepId = key.split(":")[0];
    if (affected.includes(stepId) && (clearCurrent || stepId !== id))
      delete state.checks[key];
  }
}
function validPlanDraft(key, value) {
  if (value.trim() === "") return true;
  if (!/^\d+(?:[.,]\d*)?$/.test(value.trim())) return false;
  const number = Number(value.replace(",", "."));
  if (!Number.isFinite(number) || number < 0 || number > 100000) return false;
  return (
    key !== "hookCount" ||
    (Number.isInteger(number) && number >= 1 && number <= 100)
  );
}
function csv() {
  const c = buildCutList(state.plan);
  if (!c.valid) return;
  const rows = [
    [
      "Bauteil",
      "Anzahl",
      "Fertiglaenge_mm",
      "Fertigbreite_mm",
      "Fertigdicke_mm",
      "Rohlaenge_mm",
      "Rohbreite_mm",
      "Rohdicke_mm",
    ],
    ...c.rows.map((r) => [
      r.name,
      r.quantity,
      ...["length", "width", "thickness"].map((k) => r.finished[k]),
      ...["length", "width", "thickness"].map((k) => r.raw[k]),
    ]),
  ];
  const blob = new Blob(
    ["\uFEFF" + rows.map((r) => r.join(";")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "HIKMAH-Stueckliste.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-route]");
  if (nav) {
    navigate(nav.dataset.route);
    return;
  }
  const close = event.target.closest("[data-close-dialog]");
  if (close) {
    close.closest("dialog").close();
    return;
  }
  const el = event.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const a = el.dataset.action;
  if (a === "route") navigate(el.dataset.target);
  if (a === "start-next") navigate("project", next().id);
  if (a === "save-question")
    capture({
      title: coachQuery.slice(0, 100),
      body: coachQuery,
      kind: "Frage",
    });
  if (a === "focus") {
    state.focus = !state.focus;
    persist();
    render();
  }
  if (a === "select-step") navigate("project", el.dataset.id);
  if (a === "complete-step") {
    const s = step();
    if (
      !s.checks.every((_, i) => state.checks[`${s.id}:${i}`]) ||
      (s.id === "stueckliste" && !buildCutList(state.plan).valid)
    )
      return;
    if (!state.completed.includes(s.id)) state.completed.push(s.id);
    const i = PROJECT_STEPS.findIndex((p) => p.id === s.id);
    state.stepId = PROJECT_STEPS[i + 1]?.id || s.id;
    persist("Schritt festgehalten. Dein nächster Schritt ist bereit.");
    render();
  }
  if (a === "reopen-step") {
    state.completed = state.completed.filter((id) => id !== state.stepId);
    persist();
    render();
  }
  if (a === "help") {
    helpMode = helpMode ? "" : "focus";
    render();
  }
  if (a === "help-choice") {
    helpMode = el.dataset.value;
    render();
    document
      .querySelector(".mentor-answer")
      ?.scrollIntoView({ block: "nearest" });
  }
  if (a === "open-machine") {
    state.selectedMachine = el.dataset.id;
    hotspotId = "";
    navigate("machines");
  }
  if (a === "machine-select") {
    storeView();
    state.selectedMachine = el.dataset.id;
    hotspotId = "";
    persist();
    render();
  }
  if (a === "hotspot") {
    hotspotId = el.dataset.id;
    updateHotspot();
  }
  if (a === "explode") {
    exploded = !exploded;
    scene?.setExploded(exploded);
    el.textContent = exploded ? "Zusammenbauen" : "Bauteile ansehen";
  }
  if (a === "reset-view") scene?.reset();
  if (a === "material-tab") {
    materialTab = el.dataset.value;
    render();
  }
  if (
    a === "material-remove" &&
    confirm("Dieses Brett aus dem Lager entfernen?")
  ) {
    state.materials = state.materials.filter((m) => m.id !== el.dataset.id);
    persist();
    render();
  }
  if (a === "wisdom-tab") {
    wisdomTab = el.dataset.value;
    search = "";
    render();
  }
  if (a === "bookmark") {
    state.bookmarks = state.bookmarks.includes(el.dataset.id)
      ? state.bookmarks.filter((id) => id !== el.dataset.id)
      : [...state.bookmarks, el.dataset.id];
    persist();
    render();
  }
  if (a === "new-insight") capture();
  if (a === "capture-project")
    capture({
      title: `${step().title}: meine Dokumentation`,
      kind: "Dokumentation",
    });
  if (a === "machine-note") {
    const m = MACHINES.find((m) => m.id === state.selectedMachine);
    capture({
      title: `Meine Maschine: ${m.name}`,
      body: "Hersteller / Modell:\nDas möchte ich mir merken:\n",
      kind: "Merksatz",
    });
  }
  if (a === "machine-question") {
    const m = MACHINES.find((m) => m.id === state.selectedMachine);
    capture({
      title: `Frage zur ${m.name}`,
      body: m.questions[0],
      kind: "Frage",
    });
  }
  if (a === "open-lesson") {
    wisdomTab = "library";
    navigate("wisdom");
    requestAnimationFrame(() => {
      const target = $(`lesson-${el.dataset.id}`);
      target?.scrollIntoView({ block: "center" });
      target?.querySelector("details")?.setAttribute("open", "");
    });
  }
  if (a === "journal-remove" && confirm("Diesen Eintrag mit Foto entfernen?")) {
    state.journal = state.journal.filter((j) => j.id !== el.dataset.id);
    persist();
    render();
  }
  if (a === "csv") csv();
  if (a === "resume") resume();
  if (a === "backup") {
    try {
      exportBackup(state);
    } catch (error) {
      announce(error.message);
    }
  }
  if (a === "import") $("import-backup").click();
});
document.addEventListener("change", (e) => {
  if (e.target.matches("[data-check]")) {
    state.checks[e.target.dataset.check] = e.target.checked;
    if (!e.target.checked) invalidateFrom(e.target.dataset.check.split(":")[0]);
    persist();
    render();
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "knowledge-search") {
    search = e.target.value;
    $("knowledge-results").innerHTML = wisdomResults();
  }
  if (e.target.closest("#plan-form")) {
    if (validPlanDraft(e.target.name, e.target.value)) {
      if (state.plan[e.target.name] !== e.target.value)
        invalidateFrom("stueckliste", true);
      state.plan[e.target.name] = e.target.value;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => persist(), 350);
    }
  }
});
document.addEventListener("submit", async (e) => {
  if (e.target.id === "coach-form") {
    e.preventDefault();
    coachQuery = new FormData(e.target).get("query").trim();
    coachAnswer = answerQuestion(coachQuery, state);
    $("coach-answer").innerHTML = renderCoach();
    return;
  }
  if (e.target.id === "plan-form") {
    e.preventDefault();
    const draft = Object.fromEntries(new FormData(e.target));
    const c = buildCutList(draft);
    if (c.valid) {
      state.plan = Object.fromEntries(
        Object.entries(draft).map(([key, value]) => [
          key,
          String(Number(value.trim().replace(",", "."))),
        ]),
      );
      persist();
      $("cutlist-result").innerHTML = cutlist();
    } else {
      $("cutlist-result").innerHTML =
        '<div class="empty-state"><h3>Diese Maße brauchen noch einen Blick.</h3><p>Prüfe die markierten Angaben und berechne die Stückliste erneut.</p></div>';
    }
    $("calculation-feedback").textContent = c.valid
      ? "Deine Stückliste ist berechnet und gespeichert."
      : c.errors.join(" ");
  }
  if (e.target.id === "material-form") {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target)),
      keys = ["length", "width", "thickness", "price"];
    if (
      keys.some(
        (k) =>
          !Number.isFinite(Number(d[k])) ||
          Number(d[k]) < (k === "price" ? 0 : 0.1),
      )
    ) {
      announce("Bitte prüfe Maße und Preis.");
      return;
    }
    state.materials.push({
      id: uid(),
      ...d,
      ...Object.fromEntries(keys.map((k) => [k, Number(d[k])])),
    });
    persist("Brett im Holzlager aufgenommen.");
    render();
  }
  if (e.target.id === "capture-form") {
    e.preventDefault();
    const f = e.target,
      b = f.querySelector('[type="submit"]');
    b.disabled = true;
    try {
      const file = f.elements.photo.files[0],
        photo = file ? await photoFromFile(file) : null;
      state.journal.push({
        id: uid(),
        title: f.elements.title.value.trim(),
        body: f.elements.body.value.trim(),
        kind: f.elements.kind.value,
        photo,
        createdAt: new Date().toISOString(),
        stepId: state.stepId,
      });
      const saved = persist("Deine Erkenntnis ist festgehalten.");
      $("capture-dialog").close();
      if (state.route === "wisdom" || state.route === "compass") render();
      if (!saved)
        announce(
          "Der Eintrag ist in dieser Sitzung vorhanden. Exportiere jetzt eine Sicherung, damit er erhalten bleibt.",
        );
    } catch (error) {
      $("capture-error").textContent = error.message;
      announce(error.message);
    } finally {
      b.disabled = false;
    }
  }
});
$("pause-button").addEventListener("click", openPause);
$("quick-capture").addEventListener("click", () => capture());
$("resume-work").addEventListener("click", resume);
$("save-pause").addEventListener("click", () => {
  state.paused = { ...state.paused, note: $("pause-note").value.trim() };
  const ok = persist();
  $("pause-dialog").close();
  render();
  announce(
    ok
      ? "Dein Faden ist gesichert. Dein nächster Handgriff wartet auf dich."
      : "Pause aktiv. Bitte exportiere deinen Stand, da der Browser gerade nicht speichern kann.",
  );
});
$("import-backup").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = await importBackup(file);
    if (
      confirm(
        "Diese Sicherung als aktuellen Stand übernehmen? Exportiere deinen bisherigen Stand zuerst, falls du ihn behalten möchtest.",
      )
    ) {
      state = imported;
      persist("Sicherung eingelesen.");
      render();
    }
  } catch (error) {
    announce(error.message);
  } finally {
    e.target.value = "";
  }
});
window.addEventListener("pagehide", () => {
  storeView();
  persist();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    storeView();
    persist();
  }
});
render();
if (loaded.warning) announce(loaded.warning);
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    /* Online app and local storage remain usable. */
  });
}

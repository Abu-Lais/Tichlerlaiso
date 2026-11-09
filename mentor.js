import { LESSONS, MACHINES, PROJECT_STEPS } from "./wissen.js";
import { buildCutList, compareMaterials } from "./kalkulation.js";

// Local, inspectable knowledge routing. Answers cite existing lesson content
// or current project data; there is no generative model or external request.
const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        row[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
    previous = row;
  }
  return previous[b.length];
}
const synonyms = {
  "plan-lesen": [
    "plan",
    "zeichnung",
    "papierplan",
    "bauteil",
    "lesen",
    "symbol",
    "beschriftung",
  ],
  "roh-fertig": [
    "rohmass",
    "fertigmass",
    "rohmasse",
    "fertigmasse",
    "zugabe",
    "hobelzugabe",
    "roh",
    "fertig",
  ],
  "stueckliste-lesen": [
    "stueckliste",
    "stuecklist",
    "bauteilliste",
    "materialliste",
    "anzahl",
  ],
  faserrichtung: [
    "faser",
    "fasern",
    "faserrichtung",
    "maserung",
    "laengs",
    "quer",
  ],
  "abrichten-dicke": [
    "abrichten",
    "abrichte",
    "abrichthobel",
    "dickenhobel",
    "dickenhobeln",
    "hobeln",
    "hobel",
    "bezugsflaeche",
  ],
  "bezug-anschlag": ["anschlag", "bezug", "bezugskante", "bezugspunkt", "rand"],
  "messen-pruefen": [
    "messen",
    "pruefen",
    "messung",
    "messmittel",
    "winkel",
    "rechtwinklig",
    "genauigkeit",
  ],
  "einstellen-kalibrieren": [
    "kalibrieren",
    "kalibrierung",
    "einstellen",
    "einstellung",
    "justieren",
    "kalibriern",
  ],
  "bohren-schrauben": [
    "bohren",
    "bohrung",
    "loch",
    "loecher",
    "schrauben",
    "bohrer",
    "akkuschrauber",
  ],
  "material-wirtschaftlich": [
    "kosten",
    "preis",
    "guenstig",
    "guenstigste",
    "billig",
    "restholz",
    "holzreste",
    "lager",
    "holzart",
    "kiefer",
    "verschnitt",
  ],
  unterbrechung: [
    "abgelenkt",
    "ablenkung",
    "fokus",
    "vergessen",
    "vergesslich",
    "unterbrochen",
    "pause",
    "adhs",
  ],
  "hikmah-reflexion": [
    "erkenntnis",
    "erfahrung",
    "hikmah",
    "lernen",
    "merksatz",
    "merken",
  ],
};
const machineWords = {
  saw: ["kappsaege", "kappsage", "gehrungskappsaege", "kappen"],
  jointer: ["abrichte", "abrichten", "abrichthobel", "abrichthobelmaschine"],
  thickness: ["dickenhobel", "dickenhobeln", "dickenhobelmaschine"],
  drill: [
    "akkuschrauber",
    "bohrschrauber",
    "bohren",
    "bohrung",
    "bohrer",
    "schrauben",
  ],
};
const base = (title, text, extra = {}) => ({
  title,
  text,
  lessonIds: [],
  machineId: null,
  route: "wisdom",
  actionLabel: "Wissen öffnen",
  questions: [],
  ...extra,
});
const euro = (value) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    value,
  );

export function answerQuestion(query, state = {}) {
  const q = normalize(String(query ?? "").slice(0, 1500));
  const words = q.split(" ").filter(Boolean);
  const match = (term) =>
    words.some(
      (word) =>
        word === term ||
        (term.length >= 5 &&
          word.length >= 5 &&
          distance(word, term) <= (term.length >= 9 ? 2 : 1)),
    );
  const any = (terms) => terms.some(match);
  const lessons = LESSONS.map((lesson) => {
    const title = normalize(lesson.title).split(" ");
    const explanation = normalize(lesson.explanation).split(" ");
    const keywords = synonyms[lesson.id] || [];
    const meaningful = words.filter(
      (w) =>
        w.length >= 4 &&
        ![
          "eine",
          "einen",
          "einem",
          "einer",
          "mein",
          "meine",
          "kann",
          "muss",
          "soll",
          "wird",
          "nicht",
          "welche",
          "warum",
          "jetzt",
        ].includes(w),
    );
    const score =
      keywords.reduce((sum, term) => sum + (match(term) ? 6 : 0), 0) +
      meaningful.reduce(
        (sum, word) =>
          sum +
          (title.includes(word) ? 3 : 0) +
          (explanation.includes(word) ? 1 : 0),
        0,
      );
    return { lesson, score };
  }).sort((a, b) => b.score - a.score);
  const best = lessons[0];
  if (any(synonyms.unterbrechung)) {
    const lesson = LESSONS.find((l) => l.id === "unterbrechung");
    const step =
      PROJECT_STEPS.find(
        (s) => s.id === (state.paused?.stepId || state.stepId),
      ) || PROJECT_STEPS[0];
    const note =
      typeof state.paused?.note === "string" ? state.paused.note.trim() : "";
    return base(
      "Deinen Faden wiederfinden",
      note
        ? `Dein gemerkter nächster Handgriff: ${note} Dein gespeicherter Schritt ist „${step.title}“.`
        : `${lesson.summary} Bei deinem aktuellen Schritt „${step.title}“ ist der Einstieg: ${step.task}`,
      {
        lessonIds: ["unterbrechung"],
        route: "project",
        actionLabel: "An meinen Schritt anknüpfen",
        questions: [
          "Was ist bereits erledigt?",
          "Welche Frage ist offen?",
          "Was ist der nächste kleine Handgriff?",
        ],
      },
    );
  }
  const isNext =
    ["naechster", "naechste", "weiter", "anfangen", "jetzt"].some(term => words.includes(term)) ||
    q.includes("was tun");
  if (isNext && (!best || best.score < 6)) {
    const completed = Array.isArray(state.completed) ? state.completed : [];
    const step = PROJECT_STEPS.find((s) => !completed.includes(s.id));
    if (!step)
      return base(
        "Deine Erfahrung mitnehmen",
        "Alle Projektschritte sind als geklärt festgehalten. Halte jetzt eine Erkenntnis und eine offene Frage für das nächste Werkstück fest.",
        {
          lessonIds: ["hikmah-reflexion"],
          actionLabel: "Erkenntnis festhalten",
        },
      );
    return base(step.title, `${step.task} Warum: ${step.why}`, {
      lessonIds: [step.lessonId],
      machineId: step.machineId,
      route: "project",
      actionLabel: "Nächsten Schritt öffnen",
      questions: step.checks,
    });
  }
  if (any(synonyms["material-wirtschaftlich"])) {
    const cutList = buildCutList(state.plan);
    const materials = Array.isArray(state.materials) ? state.materials : [];
    const winner = cutList.valid
      ? compareMaterials(materials, cutList).find((m) => m.eligible)
      : null;
    let text;
    if (!cutList.valid)
      text =
        "Für einen nachvollziehbaren Materialvergleich fehlen noch vollständige Fertigmaße oder abgestimmte Rohmaßzugaben. Danach lassen sich die Maße und Gesamtpreise deiner vorhandenen Bretter vergleichen.";
    else if (!materials.length)
      text =
        "Deine Stückliste ist berechnet. Dein Holzlager enthält noch keine Bretter. Erfasse nutzbare Maße, Zustand und den Gesamtpreis pro Brett für einen Vergleich.";
    else if (winner)
      text = `Unter deinen erfassten, als geeignet markierten Brettern ist „${winner.name}“ mit ${euro(winner.estimatedCost)} der günstigste passende Eintrag im einfachen Längsstreifenvergleich. Das ist keine Zuschnittoptimierung; Faserrichtung, Fehlerstellen und den tatsächlichen Zuschnitt zusätzlich prüfen.`;
    else
      text =
        "Bisher reicht kein als geeignet markierter Lagereintrag für den gesamten Bedarf im einfachen Längsstreifenvergleich. Eine andere Aufteilung kann möglich sein; Zustand, Maße und Zuschnitt müssen geklärt werden.";
    return base("Geeignetes Material wirtschaftlich wählen", text, {
      lessonIds: ["material-wirtschaftlich", "faserrichtung"],
      route: "material",
      actionLabel: "Material & Maße öffnen",
      questions: [
        "Ist die Holzart bekannt oder noch ungeklärt?",
        "Welche Maße sind tatsächlich nutzbar?",
        "Ist der Preis für das ganze Brett angegeben?",
      ],
    });
  }
  const matchedMachines = MACHINES.filter((m) => any(machineWords[m.id]));
  const settingQuestion = any(synonyms["einstellen-kalibrieren"]);
  if (
    matchedMachines.length === 1 &&
    (settingQuestion ||
      best?.lesson.relatedMachine === matchedMachines[0].id ||
      best?.lesson.id === "abrichten-dicke")
  ) {
    const machine = matchedMachines[0];
    const related = settingQuestion
      ? "einstellen-kalibrieren"
      : machine.id === "drill"
        ? "bohren-schrauben"
        : machine.id === "saw"
          ? "bezug-anschlag"
          : "abrichten-dicke";
    return base(
      settingQuestion
        ? `${machine.name}: das Arbeitsziel klären`
        : machine.name,
      `${machine.purpose} ${machine.principle}${settingQuestion ? " Konkrete Einstellwerte lassen sich aus dem allgemeinen Lernmodell nicht ableiten. Dafür brauchst du Zielmaß, Werkstück und die Unterweisung zur vorhandenen Maschine." : ""}`,
      {
        lessonIds: [related],
        machineId: machine.id,
        route: "machines",
        actionLabel: "Maschine bildlich verstehen",
        questions: machine.questions,
      },
    );
  }
  if (best?.score >= 6) {
    const lesson = best.lesson;
    return base(lesson.title, `${lesson.summary} ${lesson.explanation}`, {
      lessonIds: [lesson.id],
      machineId: matchedMachines.length === 1 ? matchedMachines[0].id : null,
      route: ["roh-fertig", "stueckliste-lesen"].includes(lesson.id)
        ? "material"
        : "wisdom",
      actionLabel: ["roh-fertig", "stueckliste-lesen"].includes(lesson.id)
        ? "Mit meinen Maßen arbeiten"
        : "Wissenskarte öffnen",
      questions: [lesson.question],
    });
  }
  return base(
    "Dazu fehlt mir hier noch belastbares Wissen",
    "Für diese Frage gibt es in deinem lokalen Wissensbestand noch keine passende Erklärung. Halte sie als Frage fest und ergänze die Antwort mit deinem Ausbilder oder einer passenden Unterlage.",
    {
      actionLabel: "Frage im Wissensbuch festhalten",
      questions: [
        "Um welches Bauteil, Werkzeug oder Ergebnis geht es?",
        "Welche konkrete Angabe fehlt dir?",
      ],
    },
  );
}

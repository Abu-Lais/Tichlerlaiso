import test from "node:test";
import assert from "node:assert/strict";
import { buildCutList, compareMaterials, nextAction } from "../kalkulation.js";
import {
  defaultState,
  loadState,
  saveState,
  exportBackup,
  importBackup,
} from "../speicher.js";
import { PROJECT_STEPS, MACHINES, LESSONS } from "../wissen.js";

const STORE = "hikmah:werkstatt:v2";
const LEGACY = "meisterbegleiter:kleidungshalter:v1";
const fixture = () => ({
  length: "600",
  width: "140",
  thickness: "18",
  hookLength: "80",
  hookWidth: "20",
  hookThickness: "18",
  hookCount: "5",
  allowLength: "20",
  allowWidth: "10",
  allowThickness: "4",
});
const board = (id, patch = {}) => ({
  id,
  name: "Brett",
  species: "Kiefer",
  length: 1135,
  width: 150,
  thickness: 22,
  price: 10,
  condition: "geeignet",
  ...patch,
});
const file = (value) => {
  const content = typeof value === "string" ? value : JSON.stringify(value);
  return { size: Buffer.byteLength(content), text: async () => content };
};
function memoryStorage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  globalThis.localStorage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
  };
  return entries;
}

test("Rohmaße addieren gesamte Zugabe einmal; Volumen enthält fünf Haken", () => {
  const list = buildCutList(fixture());
  assert.equal(list.valid, true);
  assert.deepEqual(list.rows[0].raw, {
    length: 620,
    width: 150,
    thickness: 22,
  });
  assert.deepEqual(list.rows[1].raw, { length: 100, width: 30, thickness: 22 });
  assert.equal(list.rows[1].quantity, 5);
  assert.ok(Math.abs(list.totalVolumeM3 - 0.002376) < 1e-12);
});

test("Dezimalkomma und Nullzugaben sind zulässig, Standardanzahl ist fünf", () => {
  const plan = {
    ...fixture(),
    length: "600,5",
    allowLength: "0",
    allowWidth: 0,
    allowThickness: "0",
  };
  delete plan.hookCount;
  const list = buildCutList(plan);
  assert.equal(list.valid, true);
  assert.equal(list.rows[0].raw.length, 600.5);
  assert.equal(list.rows[1].quantity, 5);
});

test("Unvollständige, nichtnumerische und physikalisch ungültige Pläne liefern keine Stückliste", () => {
  for (const patch of [
    { length: "" },
    { width: 0 },
    { thickness: -1 },
    { length: "1e3" },
    { length: Infinity },
    { hookCount: "2.5" },
    { hookCount: 101 },
    { allowWidth: -1 },
    { allowThickness: 1001 },
    { width: true },
    { hookWidth: 100001 },
  ]) {
    const list = buildCutList({ ...fixture(), ...patch });
    assert.equal(list.valid, false, JSON.stringify(patch));
    assert.ok(list.errors.length);
    assert.deepEqual(list.rows, []);
    assert.equal(list.totalVolumeM3, 0);
  }
  assert.equal(buildCutList().valid, false);
});

test("Materialvergleich berücksichtigt alle Teile plus fünf 3-mm-Schnittfugen", () => {
  const rows = compareMaterials(
    [
      board("exact"),
      board("short", { length: 1134 }),
      board("narrow", { width: 149 }),
      board("thin", { thickness: 21 }),
    ],
    buildCutList(fixture()),
  );
  assert.equal(rows.find((r) => r.id === "exact").eligible, true);
  assert.equal(rows.find((r) => r.id === "exact").capacity, 1);
  for (const id of ["short", "narrow", "thin"])
    assert.equal(rows.find((r) => r.id === id).eligible, false);
  assert.match(rows.find((r) => r.id === "short").reason, /1135/);
});

test("Günstigstes geeignetes Brett gewinnt vor billigem ungeeignetem, ungeklärtem oder zu kurzem Material", () => {
  const rows = compareMaterials(
    [
      board("expensive", { price: 20 }),
      board("damaged", { price: 0, condition: "ungeeignet" }),
      board("unknown", { price: 1, condition: "prüfen" }),
      board("small", { price: 2, length: 300 }),
      board("cheap", { price: 5 }),
      board("missing-price", { price: "" }),
    ],
    buildCutList(fixture()),
  );
  assert.deepEqual(
    rows.filter((r) => r.eligible).map((r) => r.id),
    ["cheap", "expensive"],
  );
  assert.equal(rows[0].id, "cheap");
  assert.equal(rows.find((r) => r.id === "missing-price").eligible, false);
  assert.equal(
    compareMaterials([board("a")], buildCutList()).every((r) => !r.eligible),
    true,
  );
});

test("Nächster Schritt berücksichtigt bereits geklärte Schritte und endet bei Reflexion", () => {
  assert.equal(nextAction().stepId, "verstehen");
  const pending = nextAction({
    completed: ["verstehen", "material"],
    plan: {},
  });
  assert.equal(pending.stepId, "stueckliste");
  assert.match(pending.reason, /fehlen/);
  assert.equal(
    nextAction({ completed: PROJECT_STEPS.map((s) => s.id) }).route,
    "wisdom",
  );
});

test("Projektverweise und Maschinenwissen besitzen eindeutige, auflösbare Kennungen", () => {
  for (const list of [PROJECT_STEPS, MACHINES, LESSONS])
    assert.equal(new Set(list.map((x) => x.id)).size, list.length);
  for (const step of PROJECT_STEPS) {
    assert.ok(
      LESSONS.some((l) => l.id === step.lessonId),
      step.lessonId,
    );
    assert.ok(
      step.machineId === null || MACHINES.some((m) => m.id === step.machineId),
    );
    assert.ok(step.checks.length > 0);
  }
  for (const machine of MACHINES) {
    assert.equal(
      new Set(machine.hotspots.map((h) => h.id)).size,
      machine.hotspots.length,
    );
    assert.ok(machine.hotspots.every((h) => h.description && h.safety));
    assert.equal(new URL(machine.sourceUrl).protocol, "https:");
  }
});

test("Leerer Speicher liefert unabhängige Default-Zustände", () => {
  memoryStorage();
  const loaded = loadState();
  assert.deepEqual(loaded.state, defaultState());
  assert.equal(loaded.warning, "");
  const another = defaultState();
  another.completed.push("verstehen");
  assert.deepEqual(loaded.state.completed, []);
});

test("Speichern und Laden erhalten Pause, Maschine, Kamera, Notizen und Foto", () => {
  memoryStorage();
  const state = defaultState();
  state.plan = fixture();
  state.route = "machines";
  state.stepId = "abrichten";
  state.selectedMachine = "jointer";
  state.materials = [board("board1")];
  state.modelViews.jointer = { position: [4, 3, 5], target: [0, 0.5, 0] };
  state.paused = {
    at: "2026-11-09T09:00:00.000Z",
    stepId: "abrichten",
    route: "machines",
    note: "Bezugsfläche klären",
    machineId: "jointer",
    view: state.modelViews.jointer,
  };
  state.journal = [
    {
      id: "j1",
      title: "Bezug",
      body: "Eine Frage",
      kind: "Frage",
      photo: "data:image/png;base64,YWJj",
      createdAt: "2026-11-09T09:00:00.000Z",
      stepId: "abrichten",
    },
  ];
  assert.equal(saveState(state).ok, true);
  assert.deepEqual(loadState().state, state);
});

test("Echter Export-Blob lässt sich vollständig inklusive Pausenmaschine wieder importieren", async () => {
  const state = defaultState();
  state.paused = {
    at: "2026-11-09T09:00:00.000Z",
    stepId: "bohren",
    route: "machines",
    note: "Bohrungszweck",
    machineId: "drill",
    view: { position: [3, 4, 5], target: [0, 0, 0] },
  };
  let blob,
    download,
    clicked = false;
  const previousDocument = globalThis.document;
  const originalCreate = URL.createObjectURL,
    originalRevoke = URL.revokeObjectURL;
  globalThis.document = {
    body: { append() {} },
    createElement: () => ({
      set href(value) {},
      set download(value) {
        download = value;
      },
      click() {
        clicked = true;
      },
      remove() {},
    }),
  };
  URL.createObjectURL = (value) => {
    blob = value;
    return "blob:test";
  };
  URL.revokeObjectURL = () => {};
  try {
    exportBackup(state);
    assert.ok(clicked);
    assert.match(download, /^HIKMAH-werkstatt-.*\.json$/);
    assert.equal(blob.type, "application/json");
    assert.deepEqual(await importBackup(blob), state);
  } finally {
    globalThis.document = previousDocument;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

test("Import weist kaputte Versionen, unsichere Fotodaten und ungültige Pausenmaschinen zurück", async () => {
  await assert.rejects(importBackup(file("{broken")), /JSON/);
  await assert.rejects(
    importBackup({ size: 33 * 1024 * 1024, text: async () => "" }),
    /32 MB/,
  );
  for (const change of [
    (s) => (s.version = 3),
    (s) => (s.route = "secret"),
    (s) => (s.plan.hookCount = "2.5"),
    (s) => (s.modelViews.saw = { position: [NaN, 0, 0], target: [0, 0, 0] }),
    (s) =>
      (s.paused = {
        at: "2026-11-09T09:00:00Z",
        stepId: "bohren",
        route: "machines",
        note: "",
        view: null,
        machineId: "unknown",
      }),
    (s) =>
      (s.journal = [
        {
          id: "x",
          title: "x",
          body: "",
          kind: "Frage",
          createdAt: "2026-11-09T09:00:00Z",
          stepId: null,
          photo: "data:image/svg+xml;base64,YWJj",
        },
      ]),
  ]) {
    const state = defaultState();
    change(state);
    await assert.rejects(importBackup(file(state)), /ungültige Angaben/);
  }
});

test("Beschädigter lokaler Zustand bleibt unangetastet und erzeugt eine Warnung", () => {
  for (const raw of ["{broken", JSON.stringify({ version: 2 })]) {
    const entries = memoryStorage({ [STORE]: raw });
    const loaded = loadState();
    assert.deepEqual(loaded.state, defaultState());
    assert.match(loaded.warning, /nicht gelesen/);
    assert.equal(entries.get(STORE), raw);
  }
});

test("Migration übernimmt bekannte alte Merkhilfen, Schritt und Kamera, behält Legacy-Daten", () => {
  const old = {
    schemaVersion: 1,
    projectId: "kleidungshalter-5-haken",
    stepId: "maschinen",
    savedAt: "2026-11-08T20:00:00Z",
    notes: {
      holzauswahl: "Kiefer prüfen",
      maschinen: "Bezug finden",
      foreign: "nicht zuordnen",
    },
    view: { position: [4, 3, 5], target: [0, 0.35, 0] },
  };
  const raw = JSON.stringify(old),
    entries = memoryStorage({ [LEGACY]: raw });
  const loaded = loadState();
  assert.equal(loaded.state.stepId, "ablaengen");
  assert.deepEqual(
    loaded.state.journal.map((j) => j.stepId),
    ["material", "ablaengen"],
  );
  assert.deepEqual(loaded.state.paused.view, old.view);
  assert.match(loaded.warning, /übernommen/);
  assert.equal(entries.get(LEGACY), raw);
  assert.ok(entries.has(STORE));
  assert.deepEqual(loadState().state, loaded.state);
});

test("Defekte Legacy-Kamera blockiert gültige Merkhilfe nicht; fremdes Legacy-Projekt wird abgelehnt", () => {
  memoryStorage({
    [LEGACY]: JSON.stringify({
      schemaVersion: 1,
      projectId: "kleidungshalter-5-haken",
      stepId: "holzauswahl",
      notes: { holzauswahl: "Prüfen" },
      view: { position: ["oops"], target: [] },
    }),
  });
  let loaded = loadState();
  assert.equal(loaded.state.stepId, "material");
  assert.equal(loaded.state.paused.view, null);
  assert.equal(loaded.state.journal.length, 1);
  const entries = memoryStorage({
    [LEGACY]: JSON.stringify({ schemaVersion: 1, projectId: "other" }),
  });
  loaded = loadState();
  assert.deepEqual(loaded.state, defaultState());
  assert.ok(loaded.warning);
  assert.equal(entries.has(STORE), false);
});

test("Speicherfehler liefert verständliches Ergebnis statt Exception oder Erfolgsbehauptung", () => {
  globalThis.localStorage = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("quota");
    },
  };
  assert.ok(loadState().warning);
  const result = saveState(defaultState());
  assert.equal(result.ok, false);
  assert.match(result.error, /Sicherung exportieren/);
});

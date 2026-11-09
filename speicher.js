// Persönliche Daten bleiben auf diesem Gerät. Sicherungen enthalten auch Fotos.
const STORAGE_KEY = "hikmah:werkstatt:v2";
const LEGACY_KEY = "meisterbegleiter:kleidungshalter:v1";
const MAX_BACKUP_BYTES = 32 * 1024 * 1024;
const ROUTES = ["compass", "project", "machines", "material", "wisdom"];
const STEPS = [
  "verstehen",
  "material",
  "stueckliste",
  "ablaengen",
  "abrichten",
  "dickenhobeln",
  "formatieren",
  "bohren",
  "pruefen",
];
const MACHINES = ["saw", "jointer", "thickness", "drill"];
const MODEL_KEYS = ["project", ...MACHINES];
const KINDS = ["Erkenntnis", "Frage", "Merksatz", "Dokumentation", "Plan"];
const PLAN_KEYS = [
  "length",
  "width",
  "thickness",
  "hookLength",
  "hookWidth",
  "hookThickness",
  "hookCount",
  "allowLength",
  "allowWidth",
  "allowThickness",
];

export function defaultState() {
  return {
    version: 2,
    route: "compass",
    stepId: "verstehen",
    completed: [],
    checks: {},
    plan: {
      length: "",
      width: "",
      thickness: "",
      hookLength: "",
      hookWidth: "",
      hookThickness: "",
      hookCount: "5",
      allowLength: "",
      allowWidth: "",
      allowThickness: "",
    },
    materials: [],
    journal: [],
    bookmarks: [],
    paused: null,
    modelViews: {},
    selectedMachine: "jointer",
    focus: false,
  };
}

function ensure(condition, label) {
  if (!condition)
    throw new Error(`Die Sicherung enthält ungültige Angaben: ${label}.`);
}
function object(value, label) {
  ensure(value && typeof value === "object" && !Array.isArray(value), label);
  return value;
}
function text(value, label, max = 1000, optional = false) {
  if (optional && (value === undefined || value === null)) return "";
  ensure(typeof value === "string" && value.length <= max, label);
  return value;
}
function choice(value, options, label) {
  ensure(options.includes(value), label);
  return value;
}
function number(value, label, min = 0, max = 100000) {
  ensure(
    typeof value === "number" &&
      Number.isFinite(value) &&
      value >= min &&
      value <= max,
    label,
  );
  return value;
}
function date(value, label) {
  ensure(
    typeof value === "string" &&
      value.length < 60 &&
      Number.isFinite(Date.parse(value)),
    label,
  );
  return new Date(value).toISOString();
}
function array(value, label, max) {
  ensure(Array.isArray(value) && value.length <= max, label);
  return value;
}
function view(value) {
  if (value === null || value === undefined) return null;
  object(value, "3D-Ansicht");
  const result = {};
  for (const key of ["position", "target"]) {
    ensure(Array.isArray(value[key]) && value[key].length === 3, "3D-Ansicht");
    result[key] = value[key].map((part) =>
      number(part, "3D-Koordinaten", -10000, 10000),
    );
  }
  return result;
}
function photo(value) {
  if (value === null || value === undefined || value === "") return null;
  ensure(
    typeof value === "string" &&
      value.length <= 2 * 1024 * 1024 &&
      /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=\r\n]+$/.test(value),
    "Foto",
  );
  return value;
}

function validateState(input) {
  object(input, "Dateiformat");
  ensure(input.version === 2, "Version");
  const result = defaultState();
  result.route = choice(input.route, ROUTES, "Ansicht");
  result.stepId = choice(input.stepId, STEPS, "Arbeitsschritt");
  result.selectedMachine = choice(input.selectedMachine, MACHINES, "Maschine");
  ensure(typeof input.focus === "boolean", "Fokusmodus");
  result.focus = input.focus;
  result.completed = [
    ...new Set(
      array(input.completed, "Erledigte Schritte", 100).map((id) =>
        choice(id, STEPS, "Erledigter Schritt"),
      ),
    ),
  ];
  const checks = object(input.checks, "Prüfpunkte");
  ensure(Object.keys(checks).length <= 300, "Anzahl der Prüfpunkte");
  for (const [key, value] of Object.entries(checks)) {
    ensure(
      STEPS.some((id) => new RegExp(`^${id}:\\d{1,3}$`).test(key)) &&
        typeof value === "boolean",
      "Prüfpunkt",
    );
    result.checks[key] = value;
  }
  const plan = object(input.plan, "Projektmaße");
  for (const key of PLAN_KEYS) {
    const value = text(plan[key], "Projektmaß", 32).trim();
    if (value) {
      ensure(/^\d+(?:[.,]\d*)?$/.test(value), "Projektmaß");
      const numeric = Number(value.replace(",", "."));
      ensure(
        Number.isFinite(numeric) && numeric >= 0 && numeric <= 100000,
        "Projektmaß",
      );
      if (key === "hookCount")
        ensure(
          Number.isInteger(numeric) && numeric >= 1 && numeric <= 100,
          "Hakenanzahl",
        );
    }
    result.plan[key] = value;
  }
  result.materials = array(input.materials, "Materiallager", 500).map(
    (item) => {
      object(item, "Material");
      return {
        id: text(item.id, "Materialkennung", 100),
        name: text(item.name, "Materialname", 120),
        species: text(item.species, "Holzart", 100),
        length: number(item.length, "Materiallänge", 0.01),
        width: number(item.width, "Materialbreite", 0.01),
        thickness: number(item.thickness, "Materialdicke", 0.01),
        price: number(item.price, "Materialpreis", 0, 1000000),
        condition: choice(
          item.condition,
          ["geeignet", "prüfen", "ungeeignet"],
          "Materialzustand",
        ),
      };
    },
  );
  ensure(
    new Set(result.materials.map((item) => item.id)).size ===
      result.materials.length,
    "Doppelte Materialkennung",
  );
  result.journal = array(input.journal, "Hikmah-Einträge", 1000).map(
    (entry) => {
      object(entry, "Hikmah-Eintrag");
      return {
        id: text(entry.id, "Eintragskennung", 100),
        title: text(entry.title, "Eintragstitel", 200),
        body: text(entry.body, "Eintragstext", 10000),
        kind: choice(entry.kind, KINDS, "Eintragsart"),
        photo: photo(entry.photo),
        createdAt: date(entry.createdAt, "Eintragsdatum"),
        stepId: entry.stepId
          ? choice(entry.stepId, STEPS, "Eintragszuordnung")
          : null,
      };
    },
  );
  ensure(
    new Set(result.journal.map((entry) => entry.id)).size ===
      result.journal.length,
    "Doppelte Eintragskennung",
  );
  result.bookmarks = [
    ...new Set(
      array(input.bookmarks, "Merkliste", 500).map((id) =>
        text(id, "Merkkarte", 100),
      ),
    ),
  ];
  object(input.modelViews, "Gespeicherte Ansichten");
  for (const key of MODEL_KEYS) {
    if (input.modelViews[key] !== undefined && input.modelViews[key] !== null)
      result.modelViews[key] = view(input.modelViews[key]);
  }
  if (input.paused !== null) {
    const pause = object(input.paused, "Unterbrechung");
    result.paused = {
      at: date(pause.at, "Pausenzeit"),
      stepId: choice(pause.stepId, STEPS, "Pausenschritt"),
      route: choice(pause.route, ROUTES, "Pausenansicht"),
      note: text(pause.note, "Pausennotiz", 2000),
      view: view(pause.view),
    };
    if (pause.machineId !== undefined)
      result.paused.machineId = choice(
        pause.machineId,
        MACHINES,
        "Pausenmaschine",
      );
  }
  return result;
}

function migrateLegacy(raw) {
  const old = JSON.parse(raw);
  ensure(
    old &&
      old.schemaVersion === 1 &&
      old.projectId === "kleidungshalter-5-haken",
    "Bisheriger Projektstand",
  );
  const state = defaultState();
  const mapping = {
    holzauswahl: "material",
    stueckliste: "stueckliste",
    maschinen: "ablaengen",
  };
  const when =
    typeof old.savedAt === "string" && Number.isFinite(Date.parse(old.savedAt))
      ? new Date(old.savedAt).toISOString()
      : new Date().toISOString();
  state.stepId = mapping[old.stepId] || "verstehen";
  if (old.notes && typeof old.notes === "object") {
    for (const [id, body] of Object.entries(old.notes)) {
      if (mapping[id] && typeof body === "string" && body.trim()) {
        state.journal.push({
          id: `bisher-${id}`,
          title: "Meine bisherige Merkhilfe",
          body: body.slice(0, 10000),
          kind: "Merksatz",
          photo: null,
          createdAt: when,
          stepId: mapping[id],
        });
      }
    }
  }
  let previousView = null;
  try {
    previousView = view(old.view);
  } catch {
    /* Alte Ansichten sind optional. */
  }
  state.paused = {
    at: when,
    stepId: state.stepId,
    route: "project",
    note: "Dein bisheriger Projektstand wurde übernommen.",
    view: previousView,
  };
  return state;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      ensure(raw.length <= MAX_BACKUP_BYTES, "Dateigröße");
      return { state: validateState(JSON.parse(raw)), warning: "" };
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const state = migrateLegacy(legacy);
      const saved = saveState(state);
      return {
        state,
        warning: saved.ok
          ? "Deine bisherigen Merkhilfen wurden übernommen."
          : saved.error,
      };
    }
    return { state: defaultState(), warning: "" };
  } catch {
    return {
      state: defaultState(),
      warning:
        "Der lokale Stand konnte nicht gelesen werden. Eine vorhandene Sicherung kannst du im Hikmah-Bereich importieren. Die bisherigen Browserdaten wurden nicht gelöscht.",
    };
  }
}

export function saveState(state) {
  try {
    const value = JSON.stringify(validateState(state));
    if (value.length > MAX_BACKUP_BYTES) throw new Error("too large");
    localStorage.setItem(STORAGE_KEY, value);
    return { ok: true, error: "" };
  } catch (error) {
    const invalid =
      error instanceof Error && error.message.startsWith("Die Sicherung");
    return {
      ok: false,
      error: invalid
        ? error.message
        : "Dein Browser konnte den Stand nicht speichern. Sichere deine Einträge über „Sicherung exportieren“ im Hikmah-Bereich; viele Fotos können den Gerätespeicher füllen.",
    };
  }
}

export function exportBackup(state) {
  const clean = validateState(state);
  const blob = new Blob([JSON.stringify(clean, null, 2)], {
    type: "application/json",
  });
  if (blob.size > MAX_BACKUP_BYTES)
    throw new Error(
      "Deine Sicherung ist größer als 32 MB. Sichere ältere Fotos zusätzlich außerhalb der App und reduziere anschließend die Fotoanzahl, damit diese Sicherung später wieder eingelesen werden kann.",
    );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `HIKMAH-werkstatt-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importBackup(file) {
  if (!file || typeof file.text !== "function" || file.size > MAX_BACKUP_BYTES)
    throw new Error("Bitte wähle eine HIKMAH-Sicherung mit höchstens 32 MB.");
  let input;
  try {
    input = JSON.parse(await file.text());
  } catch {
    throw new Error("Diese Datei ist keine lesbare JSON-Sicherung.");
  }
  return validateState(input);
}

export async function photoFromFile(file) {
  if (!file || !/^image\//i.test(file.type))
    throw new Error("Bitte wähle ein Foto aus.");
  if (file.size > 15 * 1024 * 1024)
    throw new Error(
      "Das Foto ist größer als 15 MB. Bitte wähle eine kleinere Datei.",
    );
  let image;
  let objectUrl;
  try {
    if (typeof createImageBitmap === "function")
      image = await createImageBitmap(file);
    else {
      objectUrl = URL.createObjectURL(file);
      image = await new Promise((resolve, reject) => {
        const value = new Image();
        value.onload = () => resolve(value);
        value.onerror = reject;
        value.src = objectUrl;
      });
    }
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    if (!width || !height) throw new Error("missing dimensions");
    const scale = Math.min(1, 1024 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("missing canvas");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return photo(canvas.toDataURL("image/jpeg", 0.7));
  } catch {
    throw new Error(
      "Dieses Foto konnte nicht geöffnet werden. Bitte verwende ein JPG-, PNG- oder WebP-Bild.",
    );
  } finally {
    if (image && typeof image.close === "function") image.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

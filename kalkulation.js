import { PROJECT_STEPS } from "./wissen.js";

// All dimensions are millimetres. Each allowance is added ONCE to the total
// dimension of a part, not once per end. Row volume includes its quantity.
function numberFrom(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value !== "string" || !value.trim()) return NaN;
  const normalized = value.trim().replace(",", ".");
  return /^\+?\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

export function buildCutList(plan = {}) {
  const errors = [];
  const values = {};
  const dimensions = {
    length: "Länge des Trägerbretts",
    width: "Breite des Trägerbretts",
    thickness: "Dicke des Trägerbretts",
    hookLength: "Länge der Holzhaken",
    hookWidth: "Breite der Holzhaken",
    hookThickness: "Dicke der Holzhaken",
  };
  for (const [key, label] of Object.entries(dimensions)) {
    values[key] = numberFrom(plan[key]);
    if (!(values[key] > 0 && values[key] <= 100000))
      errors.push(
        `${label}: bitte ein Maß größer als 0 und höchstens 100.000 mm eintragen.`,
      );
  }
  for (const [key, label] of Object.entries({
    allowLength: "Längenzugabe",
    allowWidth: "Breitenzugabe",
    allowThickness: "Dickenzugabe",
  })) {
    values[key] = numberFrom(plan[key]);
    if (!(values[key] >= 0 && values[key] <= 1000))
      errors.push(
        `${label}: bitte eine gesamte Zugabe von 0 bis 1.000 mm eintragen.`,
      );
  }
  const count = plan.hookCount === undefined ? 5 : numberFrom(plan.hookCount);
  if (!Number.isInteger(count) || count < 1 || count > 100)
    errors.push("Hakenanzahl: bitte eine ganze Zahl von 1 bis 100 eintragen.");
  if (errors.length)
    return { valid: false, errors, rows: [], totalVolumeM3: 0 };
  const makeRow = (name, quantity, length, width, thickness) => {
    const finished = { length, width, thickness };
    const raw = {
      length: length + values.allowLength,
      width: width + values.allowWidth,
      thickness: thickness + values.allowThickness,
    };
    return {
      name,
      quantity,
      finished,
      raw,
      volumeM3: (quantity * raw.length * raw.width * raw.thickness) / 1e9,
    };
  };
  const rows = [
    makeRow("Trägerbrett", 1, values.length, values.width, values.thickness),
    makeRow(
      "Holzhaken",
      count,
      values.hookLength,
      values.hookWidth,
      values.hookThickness,
    ),
  ];
  return {
    valid: true,
    errors: [],
    rows,
    totalVolumeM3: rows.reduce((sum, row) => sum + row.volumeM3, 0),
  };
}

// A deliberately conservative, reproducible test for ONE board per inventory
// entry: all parts are arranged one after another along the board's length.
// No turning, parallel lanes, defect mapping, nesting or grain analysis.
// Assumed kerf is 3 mm at each separation between individual parts.
export function compareMaterials(materials = [], cutList) {
  if (!Array.isArray(materials)) return [];
  const validList =
    cutList?.valid === true &&
    Array.isArray(cutList.rows) &&
    cutList.rows.length > 0;
  const rows = validList ? cutList.rows : [];
  const totalParts = rows.reduce((sum, row) => sum + row.quantity, 0);
  const netLength = rows.reduce(
    (sum, row) => sum + row.raw.length * row.quantity,
    0,
  );
  const neededLength = netLength + Math.max(0, totalParts - 1) * 3;
  const neededWidth = Math.max(0, ...rows.map((row) => row.raw.width));
  const neededThickness = Math.max(0, ...rows.map((row) => row.raw.thickness));
  return materials
    .map((item) => {
      const length = numberFrom(item.length),
        width = numberFrom(item.width),
        thickness = numberFrom(item.thickness);
      const price = numberFrom(item.price);
      const dimensionsValid = [length, width, thickness].every(
        (n) => n > 0 && n <= 100000,
      );
      const priceValid = Number.isFinite(price) && price >= 0 && price <= 1e9;
      const base = {
        ...item,
        eligible: false,
        reason: "",
        estimatedCost: priceValid ? price : 0,
        utilization: 0,
        capacity: 0,
      };
      if (!validList)
        return { ...base, reason: "Zuerst die Stückliste vervollständigen." };
      if (!dimensionsValid || !priceValid)
        return {
          ...base,
          reason: "Maße und Gesamtpreis dieses Bretts vervollständigen.",
        };
      const boardVolume = (length * width * thickness) / 1e9;
      const utilization = Math.min(
        1,
        Math.max(0, cutList.totalVolumeM3 / boardVolume),
      );
      let capacity = 0;
      if (width >= neededWidth && thickness >= neededThickness) {
        capacity = Math.floor((length + 3) / (netLength + totalParts * 3));
      }
      const result = { ...base, utilization, capacity };
      if (item.condition === "ungeeignet")
        return {
          ...result,
          reason: "Als ungeeignet markiert; nicht für den Vergleich empfohlen.",
        };
      if (item.condition !== "geeignet")
        return { ...result, reason: "Zustand und Eignung zuerst klären." };
      if (width < neededWidth)
        return {
          ...result,
          reason: `Für den einfachen Längsvergleich sind mindestens ${neededWidth} mm nutzbare Breite nötig.`,
        };
      if (thickness < neededThickness)
        return {
          ...result,
          reason: `Die Rohdicke benötigt mindestens ${neededThickness} mm.`,
        };
      if (length < neededLength)
        return {
          ...result,
          reason: `Der einfache Längsstreifen benötigt ${neededLength} mm einschließlich angenommener 3-mm-Schnittfugen. Andere Aufteilungen sind nicht geprüft.`,
        };
      return {
        ...result,
        eligible: true,
        reason:
          "Maße reichen im einfachen Längsstreifen-Vergleich mit 3-mm-Schnittfuge. Faserrichtung, Fehlerstellen und tatsächlichen Zuschnitt vor Ort prüfen.",
      };
    })
    .sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) ||
        a.estimatedCost - b.estimatedCost,
    );
}

export function nextAction(state = {}) {
  const completed = Array.isArray(state.completed) ? state.completed : [];
  const step = PROJECT_STEPS.find(
    (candidate) => !completed.includes(candidate.id),
  );
  if (!step)
    return {
      stepId: "pruefen",
      title: "Deine Erfahrung mitnehmen",
      reason:
        "Der Projektweg ist dokumentiert. Halte eine Erkenntnis und eine noch offene Frage fest.",
      route: "wisdom",
    };
  const route = ["material", "stueckliste"].includes(step.id)
    ? "material"
    : "project";
  const planMissing = !buildCutList(state.plan).valid;
  const reason =
    step.id === "stueckliste" && planMissing
      ? "Für nachvollziehbare Rohmaße fehlen noch vollständige Planmaße oder abgestimmte Zugaben."
      : step.why;
  return { stepId: step.id, title: step.title, reason, route };
}

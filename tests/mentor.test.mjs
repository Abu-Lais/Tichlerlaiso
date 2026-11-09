import test from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../mentor.js";
import { defaultState } from "../speicher.js";
test("Wissenskompass erklärt Abrichten und Dickenhobeln mit vorhandener Lektion", () => {
  const result = answerQuestion(
    "Was ist beim Dickenhobeln anders als Abrichten?",
    defaultState(),
  );
  assert(result.lessonIds.includes("abrichten-dicke"));
  assert.match(result.text, /Bezug|Dicke|Abricht/);
});
test("Wiedereinstieg verwendet die eigene Rückkehrnotiz statt erfundener Aufgaben", () => {
  const state = defaultState();
  state.paused = {
    note: "Trägerbrett im Plan nachmessen",
    stepId: "verstehen",
  };
  const result = answerQuestion(
    "Ich bin abgelenkt und habe alles vergessen",
    state,
  );
  assert.match(result.text, /Trägerbrett im Plan nachmessen/);
});
test("Einstellfrage erfindet keinen Maschinenwert", () => {
  const result = answerQuestion(
    "Dickenhobel auf 18 mm einstellen wie?",
    defaultState(),
  );
  assert.equal(result.machineId, "thickness");
  assert.match(result.text, /Unterweisung/);
  assert(!result.text.includes("18 mm"));
});
test("Fachfremde Fragen bleiben als Wissenslücke erkennbar", () => {
  const result = answerQuestion(
    "Wie ist das Wetter auf dem Jupiter?",
    defaultState(),
  );
  assert.equal(result.lessonIds.length, 0);
  assert.match(result.title, /fehlt/);
});

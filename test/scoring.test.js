"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const scoring = require("../js/scoring.js");

const choices = (n) => Array.from({ length: n }, (_, i) => ({ id: "c" + (i + 1), text: "Antwort " + (i + 1) }));

const single = { response: { type: "single_choice", choices: choices(4) }, solution: { choice_ids: ["c2"] }, error_paths: [{ id: "f", choice_ids: ["c3"], text: "x" }] };
const multi = {
  response: { type: "multiple_choice", required_answers: 2, choices: choices(6) },
  solution: { choice_ids: ["c2", "c4"] },
  error_paths: [
    { id: "a", choice_ids: ["c1"], text: "x" },
    { id: "b", choice_ids: ["c5", "c6"], text: "y" }
  ]
};
const matching = {
  response: { type: "matching", reuse_choices: false, targets: choices(3).map((c) => ({ id: "t" + c.id, text: c.text })), choices: choices(5) },
  solution: {
    matches: [
      { target_id: "tc1", choice_id: "c5" },
      { target_id: "tc2", choice_id: "c1" },
      { target_id: "tc3", choice_id: "c2" }
    ]
  },
  error_paths: [{ id: "z", matches: [{ target_id: "tc1", choice_id: "c4" }], text: "x" }]
};
const ordering = { response: { type: "ordering", entries: choices(4) }, solution: { ordered_entry_ids: ["c3", "c1", "c4", "c2"] } };

test("Einfachauswahl: richtig, falsch, unvollständig", () => {
  assert.deepEqual(scoring.evaluate(single, { choice_ids: ["c2"] }).score, 1);
  const wrong = scoring.evaluate(single, { choice_ids: ["c3"] });
  assert.equal(wrong.score, 0);
  assert.equal(wrong.status, "wrong");
  assert.equal(scoring.isComplete(single, null), false);
  assert.equal(scoring.isComplete(single, { choice_ids: ["unbekannt"] }), false);
  assert.equal(scoring.isComplete(single, { choice_ids: ["c1"] }), true);
});

test("Mehrfachauswahl berücksichtigt richtige und falsche Markierungen", () => {
  assert.equal(scoring.evaluate(multi, { choice_ids: ["c4", "c2"] }).status, "correct");
  const half = scoring.evaluate(multi, { choice_ids: ["c2"] });
  assert.equal(half.score, 0.5);
  assert.equal(half.status, "partial");
  assert.equal(half.complete, false);
  const mixed = scoring.evaluate(multi, { choice_ids: ["c2", "c5"] });
  assert.equal(mixed.score, 0, "eine falsche Markierung hebt eine richtige auf");
  assert.deepEqual(mixed.wrong, ["c5"]);
  assert.deepEqual(mixed.missed, ["c4"]);
  assert.equal(scoring.evaluate(multi, { choice_ids: ["c1", "c3"] }).score, 0);
});

test("Mehrfachauswahl: mehr Markierungen als verlangt werden gekürzt", () => {
  assert.deepEqual(scoring.normalizeAnswer(multi, { choice_ids: ["c1", "c2", "c3"] }), { choice_ids: ["c1", "c2"] });
  assert.deepEqual(scoring.normalizeAnswer(multi, { choice_ids: ["c2", "c2", "x"] }), { choice_ids: ["c2"] });
});

test("Zuordnung wird anteilig ohne Abrundung bewertet", () => {
  const two = scoring.evaluate(matching, {
    matches: [
      { target_id: "tc1", choice_id: "c5" },
      { target_id: "tc2", choice_id: "c1" },
      { target_id: "tc3", choice_id: "c4" }
    ]
  });
  assert.equal(two.score, 2 / 3);
  assert.equal(two.status, "partial");
  assert.equal(two.complete, true);
  // Ohne Mehrfachverwendung fällt eine zweite Zuordnung derselben Antwort weg.
  const reused = scoring.normalizeAnswer(matching, {
    matches: [
      { target_id: "tc1", choice_id: "c5" },
      { target_id: "tc2", choice_id: "c5" }
    ]
  });
  assert.deepEqual(reused, { matches: [{ target_id: "tc1", choice_id: "c5" }] });
});

test("Reihenfolge: nur die vollständig richtige Folge zählt, Stellen werden ausgewiesen", () => {
  assert.equal(scoring.evaluate(ordering, { ordered_entry_ids: ["c3", "c1", "c4", "c2"] }).score, 1);
  const r = scoring.evaluate(ordering, { ordered_entry_ids: ["c3", "c1", "c2", "c4"] });
  assert.equal(r.score, 0);
  assert.deepEqual(
    r.positions.map((p) => p.correct),
    [true, true, false, false]
  );
  assert.equal(scoring.isComplete(ordering, { ordered_entry_ids: ["c3", "c1"] }), false);
});

test("Fehlwege nur für tatsächlich gewählte falsche Antworten", () => {
  assert.deepEqual(
    scoring.matchErrorPaths(single, { choice_ids: ["c3"] }).map((p) => p.id),
    ["f"]
  );
  assert.deepEqual(scoring.matchErrorPaths(single, { choice_ids: ["c4"] }), []);
  assert.deepEqual(scoring.matchErrorPaths(single, { choice_ids: ["c2"] }), []);
  assert.deepEqual(
    scoring.matchErrorPaths(multi, { choice_ids: ["c2", "c6"] }).map((p) => p.id),
    ["b"]
  );
  assert.deepEqual(
    scoring.matchErrorPaths(matching, { matches: [{ target_id: "tc1", choice_id: "c4" }] }).map((p) => p.id),
    ["z"]
  );
});

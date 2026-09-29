"use strict";
/*
 * Ausbau aus dem ScanReha-Pool (26.09.2026): 76 weitere geschlossene Aufgaben
 * in Warenwirtschaft und Verkauf. WiSo bleibt unverändert. Sichtung und
 * Begründungen: docs/POOLSICHTUNG.md.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const build = require("../tools/build-data.js");
const c = require("../tools/lib/common.js");
const scanreha = require("../tools/scanreha-auszug.js");
const rounds = require("../js/rounds.js");
const storage = require("../js/storage.js");

const ROOT = path.resolve(__dirname, "..");
const result = build.build();
const data = result.data;
const byId = Object.fromEntries(data.tasks.map((t) => [t.id, t]));
const selection = c.readJson(path.join(ROOT, "content/scanreha/auswahl.json")).entries;
const ETAPPE6 = fs.readFileSync(path.join(__dirname, "etappe6-aufgaben.txt"), "utf8").split(/\s+/).filter(Boolean);
const neu = selection.filter((e) => !ETAPPE6.includes(e.web_id));

test("Poolausbau: 148 Aufgaben, davon 76 neue Übernahmen in Warenwirtschaft und Verkauf", () => {
  assert.deepEqual(result.errors, []);
  assert.equal(data.tasks.length, 148);
  assert.equal(neu.length, 76);
  const count = (area) => data.tasks.filter((t) => t.area === area).length;
  assert.equal(count("wiso"), 24);
  assert.equal(count("wwk"), 81);
  assert.equal(count("verkauf"), 43);
  assert.equal(neu.filter((e) => e.area === "wwk").length, 57);
  assert.equal(neu.filter((e) => e.area === "verkauf").length, 19);
  assert.equal(data.units.length, 30);
  assert.equal(data.materials.length, 23);
});

test("Poolausbau: WiSo bleibt unverändert", () => {
  const wiso = data.tasks.filter((t) => t.area === "wiso").map((t) => t.id).sort();
  assert.deepEqual(wiso, ETAPPE6.filter((id) => id.startsWith("wiso-")).sort());
  assert.equal(neu.filter((e) => e.area === "wiso").length, 0);
  const area = data.areas.find((a) => a.id === "wiso");
  assert.deepEqual(area.subtopics.map((s) => s.id), ["ausbildung", "arbeit", "schutz", "inst", "sozial", "politik", "wirtschaft"]);
  assert.deepEqual(
    data.units.filter((u) => u.area === "wiso").map((u) => u.title),
    ["Wirtschaftsbereiche", "Arbeitsschutz und Statistik", "Haushalt und Prozentrechnung", "Erlöse, Kosten und Ergebnis", "Angebot, Nachfrage und Preise", "Wirtschaftlich handeln", "Unternehmensziele", "Ressourcen und Verpackungen"]
  );
});

test("Poolausbau: neue Aufgaben sind unveränderte Übernahmen mit Lösung aus dem Pool", () => {
  for (const e of neu) {
    const t = byId[e.web_id];
    assert.ok(t, e.web_id);
    assert.equal(t.origin.kind, "adopted", e.web_id);
    assert.equal(t.origin.source.project, "scanreha", e.web_id);
    assert.equal(t.origin.source.id, e.source_id, e.web_id);
    assert.ok(!t.legal, e.web_id + ": rechtsbezogene Aufgaben sind zurückgestellt");
    const edit = c.readJson(path.join(ROOT, "content/aufgaben", e.web_id + ".json"));
    assert.equal(edit.overrides, undefined, e.web_id + ": keine Umformung");
    const ex = c.readJson(path.join(ROOT, "content/scanreha/auszuege", e.web_id + ".json"));
    const sol = ex.solutions.find((s) => s.id === ex.answer_solution_id);
    assert.ok(sol && sol.answer, e.web_id);
    const key = sol.answer.choice_ids || sol.answer.matches || sol.answer.ordered_entry_ids;
    const own = t.solution.choice_ids || t.solution.matches || t.solution.ordered_entry_ids;
    assert.deepEqual(own, key, e.web_id);
  }
});

test("Poolausbau: jeder neue Lernkern bildet eine Dreier-Runde", () => {
  for (const id of ["wwk.beschaffung", "wwk.wws", "wwk.artikeldaten", "wwk.lagerung", "wwk.kosten", "verkauf.service"]) {
    const unit = data.units.find((u) => u.id === id);
    const r = rounds.createRound(data, storage.emptyState(), { kind: "theme", area: unit.area, unit: id });
    assert.equal(r.slots.length, 3, id);
    assert.ok(r.slots.every((s) => byId[s.task_id].variant_group === id), id);
  }
});

test("Werkzeug: Markdown aus Materialien wird in das Textformat überführt", () => {
  assert.equal(c.markdownToText("### Kopf\n*Hinweis* und **fett**\n* Punkt"), "**Kopf**\nHinweis und **fett**\n- Punkt");
  const md = "Einleitung\n\n| Feld | Angabe |\n|---|---|\n| **Lieferzeit:** | 5 Tage |\n| Bestand | 9 |\n\n| Datum | Zugang | Bestand |\n|---|---:|---:|\n| 01.03. |  | 190 |\n| 09.03. | 140 | 330 |";
  const t = c.parseMaterialTables(md);
  assert.equal(t.before, "Einleitung\n\nLieferzeit: 5 Tage\nBestand: 9");
  assert.deepEqual(t.columns.map((col) => col.label), ["Datum", "Zugang", "Bestand"]);
  assert.deepEqual(t.rows[1].cells, ["09.03.", "140", "330"]);
  assert.equal(t.after, "");
});

test("Werkzeug: Formulare, Abbildungstexte und Bilder ohne Textfassung", () => {
  const errors = [];
  const form = build.baseMaterial({ title: "Aushang", kind: "form", content_md: "### Notruf\nWo geschah es?" }, "x", errors);
  assert.deepEqual([form.kind, form.text], ["text", "**Notruf**\nWo geschah es?"]);
  const figur = build.baseMaterial({ title: "Etikett", kind: "figure", content_md: "Preis: **2,99**" }, "x", errors);
  assert.deepEqual([figur.kind, figur.text], ["text", "Preis: **2,99**"]);
  assert.deepEqual(errors, []);
  build.baseMaterial({ title: "Bild", kind: "figure", content_md: "" }, "x", errors);
  assert.match(errors.join(), /ohne Textfassung/);
});

test("Werkzeug: hilfreiche Rahmenmaterialien nur bei Bedarf im Auszug", () => {
  const entry = { web_id: "a", source_id: "item", source_revision: 1 };
  const pool = {
    manifest: { pool_id: "test", revision: 1 },
    documents: [],
    relations: [],
    materials: [{ id: "m", revision: 1, kind: "scenario", title: "Rahmen", content_md: "Text", requires: [] }],
    items: [{ id: "item", revision: 1, materials: [{ material_id: "m", necessity: "supporting", order: 1 }], sources: [] }],
    solutions: [{ id: "s", item_id: "item", item_revision: 1, link_state: "linked", answer: { choice_ids: ["choice-1"] } }]
  };
  const mit = scanreha.buildExcerpt(pool, entry, { entries: [entry] });
  assert.deepEqual(mit.errors, []);
  assert.deepEqual(mit.excerpt.supporting_materials.map((m) => m.id), ["m"]);
  pool.items[0].materials = [];
  assert.equal(scanreha.buildExcerpt(pool, entry, { entries: [entry] }).excerpt.supporting_materials, undefined);
});

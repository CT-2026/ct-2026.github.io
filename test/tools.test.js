"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const c = require("../tools/lib/common.js");
const scanreha = require("../tools/scanreha-auszug.js");
const build = require("../tools/build-data.js");

const ROOT = path.resolve(__dirname, "..");

function tmpdir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), "areha-" + name + "-"));
}

test("Markdown-Tabelle: Ausrichtung, Hervorhebung, Text davor und danach", () => {
  const t = c.parseMarkdownTable("Einleitung:\n\n| Art | Wert |\n|---|---:|\n| A | 1.000 |\n| **Summe** | **2.000** |\n| x<br>y | &nbsp;3 |\n\nQuelle: Beispiel");
  assert.equal(t.before, "Einleitung:");
  assert.deepEqual(t.columns, [
    { label: "Art", align: "left" },
    { label: "Wert", align: "right" }
  ]);
  assert.deepEqual(t.rows[1], { cells: ["Summe", "2.000"], emphasis: true });
  assert.deepEqual(t.rows[2].cells, ["x\ny", "3"]);
  assert.equal(t.after, "Quelle: Beispiel");
});

function fixturePool(mutate) {
  const dir = tmpdir("pool");
  const items = [
    {
      id: "itm-a",
      revision: 2,
      title: "A",
      stem_md: "Frage?",
      response: { type: "single_choice", choices: [{ id: "choice-1", text_md: "Eins" }, { id: "choice-2", text_md: "Zwei" }] },
      materials: [
        { material_id: "mat-1", necessity: "required", placement: "before_stem", order: 1 },
        { material_id: "mat-3", necessity: "supporting", placement: "before_stem", order: 2, reason: "Kontext" }
      ],
      classification: { methods: [] },
      sources: [{ document_id: "DOC" }],
      source_key: "DOC:1"
    },
    { id: "itm-b", revision: 1, title: "B", stem_md: "?", response: { type: "single_choice", choices: [] }, materials: [], sources: [], source_key: "DOC:2" }
  ];
  const materials = [
    { id: "mat-1", revision: 1, title: "M1", kind: "text", content_md: "x", requires: ["mat-2"] },
    { id: "mat-2", revision: 1, title: "M2", kind: "text", content_md: "y", requires: [] },
    { id: "mat-3", revision: 1, title: "M3", kind: "text", content_md: "z", requires: [] }
  ];
  const solutions = [
    { id: "sol-1", revision: 1, item_id: "itm-a", item_revision: 2, link_state: "linked", answer: { choice_ids: ["choice-2"] }, previous_versions: [{}] },
    { id: "sol-alt", revision: 1, item_id: "itm-a", item_revision: 1, link_state: "linked", answer: { choice_ids: ["choice-1"] } }
  ];
  const relations = [];
  const documents = [{ id: "DOC", title: "Dokument" }];
  const pool = { items, materials, solutions, relations, documents };
  if (mutate) mutate(pool);
  const entities = {};
  Object.keys(pool).forEach((k) => {
    fs.writeFileSync(path.join(dir, k + ".jsonl"), pool[k].map((x) => JSON.stringify(x)).join("\r\n") + "\r\n");
    entities[k] = { files: [k + ".jsonl"] };
  });
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ pool_id: "test", revision: 5, entities }));
  return dir;
}

const selection = { entries: [{ web_id: "web-a", source_id: "itm-a", source_revision: 2, area: "wiso", subtopic: "x", variant_group: "g" }] };

test("Auszug: gebundene Lösung, erforderliche Materialien samt Abhängigkeiten, übrige nur als Verweis", () => {
  const pool = scanreha.loadPool(fixturePool());
  const r = scanreha.buildExcerpt(pool, selection.entries[0], selection);
  assert.deepEqual(r.errors, []);
  assert.equal(r.excerpt.answer_solution_id, "sol-1", "nur Lösung zur verwendeten Revision");
  assert.deepEqual(
    r.excerpt.solutions.map((s) => s.id),
    ["sol-1"]
  );
  assert.equal(r.excerpt.solutions[0].previous_versions, undefined);
  assert.deepEqual(
    r.excerpt.materials.map((m) => m.id),
    ["mat-1", "mat-2"]
  );
  assert.deepEqual(
    r.excerpt.other_materials.map((m) => m.material_id + ":" + m.necessity),
    ["mat-3:supporting"]
  );
  assert.equal(r.excerpt.pool.revision, 5);
});

test("Auszug: widersprüchliche Lösungen werden nicht automatisch reduziert", () => {
  const pool = scanreha.loadPool(
    fixturePool((p) => p.solutions.push({ id: "sol-2", revision: 1, item_id: "itm-a", item_revision: 2, link_state: "linked", answer: { choice_ids: ["choice-1"] } }))
  );
  assert.match(scanreha.buildExcerpt(pool, selection.entries[0], selection).errors.join(), /widersprüchliche Lösungen/);
});

test("Auszug: fehlende Lösung, geänderte Revision, nicht ausgewählte Voraussetzung", () => {
  const noSol = scanreha.loadPool(fixturePool((p) => (p.solutions = [])));
  assert.match(scanreha.buildExcerpt(noSol, selection.entries[0], selection).errors.join(), /keine an diese Aufgabenrevision gebundene Lösung/);
  const newer = scanreha.loadPool(fixturePool((p) => (p.items[0].revision = 3)));
  assert.match(scanreha.buildExcerpt(newer, selection.entries[0], selection).errors.join(), /Revision 2, der Pool hat Revision 3/);
  const dep = scanreha.loadPool(fixturePool((p) => p.relations.push({ id: "rel-1", type: "requires_result", from_item_id: "itm-a", to_item_id: "itm-b" })));
  assert.match(scanreha.buildExcerpt(dep, selection.entries[0], selection).errors.join(), /muss ebenfalls ausgewählt werden/);
});

function copyRoot(mutate) {
  const dir = tmpdir("root");
  fs.cpSync(path.join(ROOT, "content"), path.join(dir, "content"), { recursive: true });
  if (mutate) mutate(dir);
  return dir;
}
function editJson(file, fn) {
  const v = JSON.parse(fs.readFileSync(file, "utf8"));
  fn(v);
  fs.writeFileSync(file, JSON.stringify(v, null, 2));
}

test("Build: Übernahme darf Aufgabentext nicht überschreiben", () => {
  const root = copyRoot((dir) =>
    editJson(path.join(dir, "content/aufgaben/wwk-warenannahme-fahrer.json"), (t) => (t.overrides = { stem: "Anders formuliert." }))
  );
  assert.match(build.build({ root, previous: null }).errors.join(), /Übernahme \(adopted\) darf/);
});

test("Build: erforderliches Quellmaterial muss mitkommen", () => {
  const root = copyRoot((dir) => editJson(path.join(dir, "content/aufgaben/wiso-unfallstatistik-auswerten.json"), (t) => (t.materials = [])));
  const errors = build.build({ root, previous: null }).errors.join("\n");
  assert.match(errors, /erforderliches Quellmaterial mat-8ce5e08b/);
});

test("Build: jede Auswahl braucht eine Web-Bearbeitung", () => {
  const root = copyRoot((dir) => fs.unlinkSync(path.join(dir, "content/aufgaben/verkauf-sandwich-methode.json")));
  assert.match(build.build({ root, previous: null }).errors.join(), /verkauf-sandwich-methode hat keine Web-Bearbeitung/);
});

test("Build: geänderter Inhalt verlangt eine höhere Revision", () => {
  const current = build.build({ previous: null }).data;
  const changed = JSON.parse(JSON.stringify(current));
  changed.tasks[0].help = "Neue Hilfe.";
  const errors = [];
  build.checkRevisions(current, changed, errors);
  assert.match(errors.join(), /Inhalt geändert, Revision 1 aber nicht erhöht/);
  changed.tasks[0].revision = 2;
  const ok = [];
  build.checkRevisions(current, changed, ok);
  assert.deepEqual(ok, []);
  // Metadaten wie Prüfvermerke verlangen keine neue Inhaltsrevision.
  const meta = JSON.parse(JSON.stringify(current));
  meta.tasks[0].checks = [{ kind: "content", date: "2026-09-26", text: "Nochmals geprüft." }];
  const none = [];
  build.checkRevisions(current, meta, none);
  assert.deepEqual(none, []);
  // Neue Materialrevision verlangt auch eine neue Aufgabenrevision.
  const matChanged = JSON.parse(JSON.stringify(current));
  const m = matChanged.materials.find((x) => x.id === "mat-angebote-sweatshirts");
  m.revision = 2;
  m.title = "Angebote";
  const merr = [];
  build.checkRevisions(current, matChanged, merr);
  assert.match(merr.join(), /verwendetes Material mat-angebote-sweatshirts/);
});

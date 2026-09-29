#!/usr/bin/env node
"use strict";
/*
 * Übernahmeweg Schritt 1 und 2 für ScanReha:
 * Liest die ausdrücklich ausgewählten Aufgaben aus content/scanreha/auswahl.json
 * und schreibt je Aufgabe einen unveränderten Quellauszug nach
 * content/scanreha/auszuege/<web_id>.json (Aufgabenrevision, gebundene
 * Lösungen, erforderliche Materialien samt Materialabhängigkeiten,
 * Ergebnisabhängigkeiten). Der ScanReha-Pool wird nur gelesen.
 *
 *   node tools/scanreha-auszug.js --pool <Pfad zum Ordner aufgabenpool> [--check]
 *
 * Ohne --pool werden ../scanreha/Prüfungen -strukturiert/aufgabenpool und
 * ../scanreha/aufgabenpool versucht. --check schreibt nichts und meldet
 * Abweichungen der vorhandenen Auszüge (Exitcode 1).
 */
const fs = require("fs");
const path = require("path");
const c = require("./lib/common");

const SELECTION_FILE = path.join(c.ROOT, "content", "scanreha", "auswahl.json");
const OUT_DIR = path.join(c.ROOT, "content", "scanreha", "auszuege");
const DEFAULT_POOLS = [
  path.join(c.ROOT, "..", "scanreha", "Prüfungen -strukturiert", "aufgabenpool"),
  path.join(c.ROOT, "..", "scanreha", "aufgabenpool")
];

function withoutHistory(obj) {
  const o = Object.assign({}, obj);
  delete o.previous_versions;
  return o;
}

function canonical(v) {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}

function loadPool(dir) {
  const manifestFile = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestFile)) throw new c.ToolError("ScanReha-Manifest nicht gefunden: " + manifestFile);
  const manifest = c.readJson(manifestFile);
  const read = (entity) => ((manifest.entities && manifest.entities[entity] && manifest.entities[entity].files) || []).flatMap((f) => c.readJsonl(path.join(dir, f)));
  return {
    manifest,
    documents: read("documents"),
    items: read("items"),
    materials: read("materials"),
    solutions: read("solutions"),
    relations: read("relations")
  };
}

function loadSelection(file) {
  const sel = c.readJson(file);
  const errors = [];
  const seenWeb = {};
  const seenSource = {};
  (sel.entries || []).forEach((e, i) => {
    const w = "Auswahl[" + i + "]";
    if (!e.web_id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.web_id)) errors.push(w + ": web_id ungültig.");
    if (!e.source_id) errors.push(w + ": source_id fehlt.");
    if (!Number.isInteger(e.source_revision)) errors.push(w + ": source_revision (ganze Zahl) fehlt.");
    ["area", "subtopic", "variant_group"].forEach((k) => {
      if (!e[k]) errors.push(w + ": " + k + " fehlt.");
    });
    if (seenWeb[e.web_id]) errors.push(w + ": web_id " + e.web_id + " doppelt.");
    if (seenSource[e.source_id]) errors.push(w + ": Quellaufgabe " + e.source_id + " doppelt ausgewählt.");
    seenWeb[e.web_id] = seenSource[e.source_id] = true;
  });
  if (errors.length) throw new c.ToolError(errors.join("\n"));
  return sel;
}

// Erstellt den Auszug für einen Auswahleintrag. Fehler verhindern das Schreiben.
function buildExcerpt(pool, entry, selection) {
  const errors = [];
  const where = entry.web_id + " (" + entry.source_id + ")";
  const item = pool.items.find((i) => i.id === entry.source_id);
  if (!item) return { errors: [where + ": Aufgabe nicht im Pool."] };
  if (item.revision !== entry.source_revision)
    errors.push(where + ": Auswahl nennt Revision " + entry.source_revision + ", der Pool hat Revision " + item.revision + ". Web-Bearbeitung prüfen und Auswahl anpassen.");

  const solutions = pool.solutions
    .filter((s) => s.item_id === item.id && s.link_state === "linked" && s.item_revision === item.revision)
    .map(withoutHistory)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  const withAnswer = solutions.filter((s) => s.answer);
  const editorialSolution = entry.editorial_solution_id && solutions.find((s) => s.id === entry.editorial_solution_id && s.content_md);
  if (entry.editorial_solution_id && !editorialSolution) errors.push(where + ": benannte redaktionelle Lösungsgrundlage passt nicht zur Aufgabenrevision.");
  if (!withAnswer.length && !editorialSolution) errors.push(where + ": keine an diese Aufgabenrevision gebundene Lösung mit Antwortvorgabe oder ausdrücklich benannter Textlösung.");
  const answers = [...new Set(withAnswer.map((s) => canonical(s.answer)))];
  if (answers.length > 1)
    errors.push(where + ": widersprüchliche Lösungen (" + withAnswer.map((s) => s.id).join(", ") + "); sie werden nicht automatisch auf eine reduziert.");

  const byMat = {};
  pool.materials.forEach((m) => (byMat[m.id] = m));
  const required = [];
  const visit = (id, trail) => {
    if (required.some((m) => m.id === id)) return;
    const m = byMat[id];
    if (!m) {
      errors.push(where + ": Material " + id + " fehlt im Pool" + (trail ? " (benötigt von " + trail + ")" : "") + ".");
      return;
    }
    required.push(withoutHistory(m));
    (m.requires || []).forEach((r) => visit(r, id));
  };
  item.materials
    .filter((m) => m.necessity === "required")
    .sort((a, b) => a.order - b.order)
    .forEach((m) => visit(m.material_id, null));
  const other = item.materials
    .filter((m) => m.necessity !== "required")
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      material_id: m.material_id,
      title: byMat[m.material_id] ? byMat[m.material_id].title : null,
      necessity: m.necessity,
      placement: m.placement,
      reason: m.reason
    }));
  // Hilfreiche Rahmenmaterialien vollständig mitführen, damit eine Web-Bearbeitung
  // sie als Kontext übernehmen kann; sie bleiben keine Pflichtmaterialien.
  const supporting = item.materials
    .filter((m) => m.necessity === "supporting" && byMat[m.material_id] && required.every((r) => r.id !== m.material_id))
    .sort((a, b) => a.order - b.order)
    .map((m) => withoutHistory(byMat[m.material_id]));

  const selectedIds = (selection.entries || []).map((e) => e.source_id);
  const prerequisites = pool.relations
    .filter((r) => r.type === "requires_result" && r.from_item_id === item.id)
    .map((r) => ({ relation_id: r.id, item_id: r.to_item_id }));
  prerequisites.forEach((p) => {
    if (selectedIds.indexOf(p.item_id) === -1)
      errors.push(where + ": benötigt das Ergebnis von " + p.item_id + "; diese Aufgabe muss ebenfalls ausgewählt werden.");
  });

  const docId = item.sources && item.sources[0] ? item.sources[0].document_id : null;
  const doc = pool.documents.find((d) => d.id === docId);
  const excerpt = {
    excerpt_version: 1,
    project: "scanreha",
    note: "Erzeugt durch tools/scanreha-auszug.js. Unveränderte Auszüge aus dem ScanReha-Pool; frühere Fassungen (previous_versions) sind weggelassen. Nicht von Hand bearbeiten.",
    pool: {
      pool_id: pool.manifest.pool_id,
      revision: pool.manifest.revision,
      updated_on: pool.manifest.updated_on || null
    },
    web_id: entry.web_id,
    item: withoutHistory(item),
    document: doc ? withoutHistory(doc) : null,
    solutions,
    answer_solution_id: withAnswer.length ? withAnswer[0].id : editorialSolution ? editorialSolution.id : null,
    materials: required,
    other_materials: other,
    prerequisites
  };
  if (supporting.length) excerpt.supporting_materials = supporting;
  return { errors, excerpt };
}

function resolvePool(arg) {
  if (arg) return path.resolve(arg);
  if (process.env.AREHA_SCANREHA_POOL) return path.resolve(process.env.AREHA_SCANREHA_POOL);
  const found = DEFAULT_POOLS.find((p) => fs.existsSync(path.join(p, "manifest.json")));
  if (!found) throw new c.ToolError("ScanReha-Pool nicht gefunden. Pfad mit --pool angeben (Ordner mit manifest.json).");
  return found;
}

function run(argv, io) {
  const args = c.parseArgs(argv);
  const selectionFile = args.auswahl ? path.resolve(args.auswahl) : SELECTION_FILE;
  const outDir = args.ziel ? path.resolve(args.ziel) : OUT_DIR;
  const pool = loadPool(resolvePool(args.pool));
  const selection = loadSelection(selectionFile);
  const errors = [];
  const results = [];
  selection.entries.forEach((entry) => {
    const r = buildExcerpt(pool, entry, selection);
    errors.push(...r.errors);
    if (r.excerpt) results.push(r.excerpt);
  });
  if (errors.length) throw new c.ToolError(errors.join("\n"));

  let differences = 0;
  results.forEach((ex) => {
    const file = path.join(outDir, ex.web_id + ".json");
    const text = c.stableJson(ex);
    if (args.check) {
      const old = fs.existsSync(file) ? c.readJson(file) : null;
      if (!old) {
        io.log("fehlt: " + c.rel(file));
        differences++;
        return;
      }
      const strip = (x) => Object.assign({}, x, { pool: null });
      if (canonical(strip(old)) !== canonical(strip(ex))) {
        io.log("abweichend: " + c.rel(file));
        differences++;
      } else if (canonical(old.pool) !== canonical(ex.pool)) {
        io.log("unverändert (nur Poolrevision " + old.pool.revision + " → " + ex.pool.revision + "): " + c.rel(file));
      } else io.log("aktuell: " + c.rel(file));
    } else {
      io.log((c.writeIfChanged(file, text) ? "geschrieben: " : "unverändert: ") + c.rel(file));
    }
  });
  const expected = new Set(results.map((ex) => ex.web_id + ".json"));
  if (fs.existsSync(outDir))
    fs.readdirSync(outDir)
      .filter((f) => f.endsWith(".json") && !expected.has(f))
      .forEach((f) => io.log("Hinweis: Auszug ohne Auswahleintrag: " + f));
  return differences;
}

module.exports = { loadPool, loadSelection, buildExcerpt, run, canonical };

if (require.main === module) {
  try {
    const diff = run(process.argv.slice(2), console);
    process.exitCode = diff ? 1 : 0;
  } catch (e) {
    console.error(e instanceof c.ToolError ? e.message : e.stack);
    process.exitCode = 2;
  }
}

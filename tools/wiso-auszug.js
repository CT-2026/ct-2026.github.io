#!/usr/bin/env node
"use strict";
/*
 * Übernahmeweg Schritt 1 und 2 für den bisherigen Web-Bestand (wiso.html):
 * Liest die ausgewählten Aufgaben aus content/wiso/auswahl.json und schreibt
 * je Aufgabe einen Quellauszug nach content/wiso/auszuege/<web_id>.json.
 *
 * Die bisherige App führt keine Aufgabenrevisionen. Als Quellrevision dient
 * deshalb eine Prüfsumme des ausgelesenen Aufgabeninhalts (sha256:...).
 *
 *   node tools/wiso-auszug.js [--check]
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const c = require("./lib/common");

const SELECTION_FILE = path.join(c.ROOT, "content", "wiso", "auswahl.json");
const OUT_DIR = path.join(c.ROOT, "content", "wiso", "auszuege");

// Liest Datenobjekte und Aufgabenmarkup der bisherigen App. Das Skript läuft
// dafür in einer abgeschotteten vm-Umgebung ohne DOM; die App startet nicht.
function loadWiso(file) {
  const html = c.readText(file);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!scripts.length) throw new c.ToolError(c.rel(file) + ": kein Skriptblock gefunden.");
  const context = vm.createContext({ document: { addEventListener() {} }, window: {}, console: { log() {}, error() {} } });
  const expose = "\n;JSON.stringify({COR, MMAX, TT: [...TT], NT: [...NT], LT: [...LT], BT: [...BT], TOPICS, CONTENT, TASK_TAGS, STORE})";
  let data;
  try {
    data = JSON.parse(vm.runInContext(scripts[scripts.length - 1] + expose, context, { timeout: 5000 }));
  } catch (e) {
    throw new c.ToolError(c.rel(file) + ": Datenobjekte nicht lesbar (" + e.message + ")");
  }

  const mainStart = html.indexOf('<main id="main"');
  const mainEnd = html.indexOf("</main>", mainStart);
  const main = html.slice(mainStart, mainEnd);
  const starts = [...main.matchAll(/<div class="ts[^"]*" data-task="(\d+)">/g)];
  const markup = {};
  starts.forEach((m, i) => {
    const block = main.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : main.length);
    const tag = (block.match(/class="ttag">([\s\S]*?)<\/span>/) || [])[1];
    const stem = (block.match(/class="tstem">([\s\S]*?)<\/div>/) || [])[1];
    const choices = [...block.matchAll(/onclick="m?sel\(\d+,'([A-Z])'[^"]*"[^>]*>[\s\S]*?class="ct">([\s\S]*?)<\/div>/g)].map((cm) => ({
      id: cm[1],
      text: c.toPlainText(cm[2])
    }));
    markup[m[1]] = { tag: tag ? c.toPlainText(tag) : "", stem: stem ? c.toPlainText(stem) : "", choices };
  });
  return { data, markup };
}

function taskType(data, id) {
  if (data.TT.indexOf(id) > -1) return "time";
  if (data.NT.indexOf(id) > -1) return "number";
  if (data.BT.indexOf(id) > -1) return "amount";
  if (data.LT.indexOf(id) > -1) return "law_matching";
  if (data.MMAX[id]) return "multiple_choice";
  return "single_choice";
}

function extractTask(wiso, id) {
  const m = wiso.markup[id];
  const cor = wiso.data.COR[id];
  if (!m || cor === undefined || !wiso.data.CONTENT[id]) throw new c.ToolError("Aufgabe " + id + " ist im Web-Bestand nicht vollständig vorhanden.");
  const type = taskType(wiso.data, id);
  const task = { id: String(id), tag: m.tag, stem: m.stem, type, choices: m.choices };
  if (type === "single_choice") task.correct = [cor];
  else if (type === "multiple_choice") {
    task.required_answers = wiso.data.MMAX[id];
    task.correct = cor;
  } else task.correct = cor;
  task.topic = wiso.data.TOPICS[id] || null;
  task.content = wiso.data.CONTENT[id];
  task.tags = wiso.data.TASK_TAGS[id] || [];
  return task;
}

function revisionOf(task) {
  return "sha256:" + c.sha256(JSON.stringify(task)).slice(0, 16);
}

function run(argv, io) {
  const args = c.parseArgs(argv);
  const selection = c.readJson(args.auswahl ? path.resolve(args.auswahl) : SELECTION_FILE);
  const outDir = args.ziel ? path.resolve(args.ziel) : OUT_DIR;
  const sourceFile = path.join(c.ROOT, selection.source_file || "wiso.html");
  const wiso = loadWiso(sourceFile);
  if (wiso.data.STORE !== selection.legacy_store)
    throw new c.ToolError("Speicherstand der bisherigen App ist " + wiso.data.STORE + ", die Auswahl nennt " + selection.legacy_store + ".");
  const errors = [];
  const excerpts = [];
  (selection.entries || []).forEach((e, i) => {
    const w = "Auswahl[" + i + "] " + (e.web_id || "?");
    ["web_id", "source_id", "source_revision", "area", "subtopic", "variant_group"].forEach((k) => {
      if (!e[k]) errors.push(w + ": " + k + " fehlt.");
    });
    let task;
    try {
      task = extractTask(wiso, String(e.source_id));
    } catch (err) {
      errors.push(w + ": " + err.message);
      return;
    }
    const revision = revisionOf(task);
    if (e.source_revision !== revision)
      errors.push(w + ": Quellrevision im Web-Bestand ist " + revision + ", die Auswahl nennt " + e.source_revision + ". Inhalt prüfen und Auswahl anpassen.");
    excerpts.push({
      excerpt_version: 1,
      project: "wiso-web",
      note: "Erzeugt durch tools/wiso-auszug.js aus dem bisherigen Web-Bestand. Nicht von Hand bearbeiten.",
      source_file: selection.source_file,
      legacy_store: selection.legacy_store,
      web_id: e.web_id,
      revision,
      task
    });
  });
  if (errors.length) throw new c.ToolError(errors.join("\n"));

  let differences = 0;
  excerpts.forEach((ex) => {
    const file = path.join(outDir, ex.web_id + ".json");
    const text = c.stableJson(ex);
    if (args.check) {
      const old = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
      const same = old === text;
      if (!same) differences++;
      io.log((same ? "aktuell: " : old === null ? "fehlt: " : "abweichend: ") + c.rel(file));
    } else io.log((c.writeIfChanged(file, text) ? "geschrieben: " : "unverändert: ") + c.rel(file));
  });
  return differences;
}

module.exports = { loadWiso, extractTask, revisionOf, run };

if (require.main === module) {
  try {
    process.exitCode = run(process.argv.slice(2), console) ? 1 : 0;
  } catch (e) {
    console.error(e instanceof c.ToolError ? e.message : e.stack);
    process.exitCode = 2;
  }
}

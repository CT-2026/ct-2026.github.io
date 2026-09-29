#!/usr/bin/env node
"use strict";
/*
 * Übernahmeweg Schritt 3 und 4: erzeugt den veröffentlichten Aufgabenbestand
 * data/aufgaben.js aus der redaktionellen Quelle unter content/.
 *
 *   Auswahl (content/<quelle>/auswahl.json)
 *   + Quellauszug (content/<quelle>/auszuege/<id>.json)
 *   + Web-Bearbeitung (content/aufgaben/<id>.json, content/materialien/<id>.json)
 *   = Web-Aufgabe im gemeinsamen Format (js/format.js)
 *
 *   node tools/build-data.js           schreibt data/aufgaben.js
 *   node tools/build-data.js --check   prüft nur, ob data/aufgaben.js aktuell ist
 */
const fs = require("fs");
const path = require("path");
const c = require("./lib/common");
const format = require("../js/format.js");

const HEADER = "/* Erzeugt durch tools/build-data.js aus content/. Nicht von Hand bearbeiten. */\n";
const PREFIX = "window.AREHA_DATA = ";

const TASK_FIELDS = ["id", "revision", "title", "materials", "help", "short_explanation", "detailed_explanation", "error_paths", "origin", "legal", "checks"];
const EDIT_FIELDS = TASK_FIELDS.concat(["source", "overrides", "reuse_choices"]);
const AUTHORED_FIELDS = TASK_FIELDS.concat(["source", "area", "subtopic", "method_ids", "variant_group", "stem", "response", "solution", "requires"]);
const OVERRIDE_FIELDS = ["stem", "response", "solution"];
const MATERIAL_OVERRIDES = ["title", "intro", "text", "table", "note", "source_note"];
// Felder, deren Änderung eine neue Inhaltsrevision verlangt.
const TASK_CONTENT = ["title", "stem", "response", "solution", "materials", "requires", "help", "short_explanation", "detailed_explanation", "error_paths"];
const MATERIAL_CONTENT = ["title", "kind", "intro", "text", "table", "image", "note", "source_note"];

function paths(root) {
  const content = path.join(root, "content");
  return {
    areas: path.join(content, "fachbereiche.json"),
    catalog: path.join(content, "katalog.json"),
    tasks: path.join(content, "aufgaben"),
    materials: path.join(content, "materialien"),
    selection: { scanreha: path.join(content, "scanreha", "auswahl.json"), "wiso-web": path.join(content, "wiso", "auswahl.json") },
    excerpts: { scanreha: path.join(content, "scanreha", "auszuege"), "wiso-web": path.join(content, "wiso", "auszuege") },
    output: path.join(root, "data", "aufgaben.js")
  };
}

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

function unknownFields(obj, allowed, where, errors) {
  Object.keys(obj).forEach((k) => {
    if (allowed.indexOf(k) === -1) errors.push(where + ": unbekanntes Feld " + k + ".");
  });
}

function loadSelections(p) {
  const out = {};
  Object.keys(p.selection).forEach((project) => {
    const file = p.selection[project];
    const sel = fs.existsSync(file) ? c.readJson(file) : { entries: [] };
    out[project] = {};
    (sel.entries || []).forEach((e) => (out[project][e.web_id] = e));
  });
  return out;
}

function loadExcerpt(p, project, webId) {
  const file = path.join(p.excerpts[project], webId + ".json");
  if (!fs.existsSync(file)) return null;
  return c.readJson(file);
}

// Grundlage aus einem ScanReha-Auszug: Aufgabentext, Antwortform, Lösung.
function baseFromScanreha(ex, entry, selections, errors, where) {
  const item = ex.item;
  const r = item.response;
  const text = (s) => c.toPlainText(s);
  let response = null;
  if (r.type === "single_choice" || r.type === "multiple_choice") {
    response = { type: r.type, choices: r.choices.map((ch) => ({ id: ch.id, text: text(ch.text_md) })) };
    if (r.type === "multiple_choice") response.required_answers = r.required_answers;
  } else if (r.type === "matching") {
    // Mehrfachverwendung ist in ScanReha nicht festgelegt; die Web-Bearbeitung muss sie bestimmen.
    response = {
      type: "matching",
      targets: (r.targets || []).map((t) => ({ id: t.id, text: text(t.text_md) })),
      choices: r.choices.map((ch) => ({ id: ch.id, text: text(ch.text_md) })),
      reuse_choices: null
    };
  } else if (r.type === "ordering") {
    response = { type: "ordering", entries: r.entries.map((e) => ({ id: e.id, text: text(e.text_md) })) };
  }
  const sol = (ex.solutions || []).find((s) => s.id === ex.answer_solution_id);
  let solution = null;
  if (sol && sol.answer) {
    if (sol.answer.choice_ids) solution = { choice_ids: sol.answer.choice_ids.slice() };
    else if (sol.answer.matches) solution = { matches: sol.answer.matches.map((m) => ({ target_id: m.target_id, choice_id: m.choice_id })) };
    else if (sol.answer.ordered_entry_ids) solution = { ordered_entry_ids: sol.answer.ordered_entry_ids.slice() };
  }
  const bySource = {};
  Object.keys(selections.scanreha).forEach((id) => (bySource[selections.scanreha[id].source_id] = id));
  const requires = (ex.prerequisites || []).map((pre) => {
    if (!bySource[pre.item_id]) errors.push(where + ": Voraussetzung " + pre.item_id + " ist nicht ausgewählt.");
    return bySource[pre.item_id];
  });
  return {
    stem: text(item.stem_md),
    response,
    solution,
    requires: requires.filter(Boolean),
    method_ids: ((item.classification && item.classification.methods) || []).filter((m) => m.role === "target").map((m) => m.term_id),
    requiredMaterialIds: (ex.materials || []).map((m) => m.id),
    source: {
      project: "scanreha",
      id: item.id,
      revision: item.revision,
      key: item.source_key,
      document: ex.document ? ex.document.title : null,
      solution_id: sol ? sol.id : null,
      solution_revision: sol ? sol.revision : null
    }
  };
}

function baseFromWiso(ex) {
  const t = ex.task;
  let response = null;
  let solution = null;
  if (t.type === "single_choice" || t.type === "multiple_choice") {
    response = { type: t.type, choices: t.choices.map((ch) => ({ id: ch.id, text: ch.text })) };
    if (t.type === "multiple_choice") response.required_answers = t.required_answers;
    solution = { choice_ids: t.correct.slice() };
  }
  return {
    stem: t.stem,
    response,
    solution,
    requires: [],
    method_ids: [],
    requiredMaterialIds: [],
    legacy_ids: [ex.legacy_store + ":" + t.id],
    source: {
      project: "wiso-web",
      id: t.id,
      revision: ex.revision,
      key: ex.source_file + "#" + t.id,
      document: "Bisherige WiSo-App (" + ex.source_file + "), Aufgabe " + t.id
    }
  };
}

// Bei Zuordnungen legt die Web-Bearbeitung fest, ob Antworten mehrfach verwendbar sind.
function withReuse(response, reuse) {
  if (!response || response.type !== "matching" || reuse === undefined) return response;
  return Object.assign({}, response, { reuse_choices: reuse });
}

function composeTask(edit, file, ctx) {
  const errors = ctx.errors;
  const where = c.rel(file);
  if (edit.id !== path.basename(file, ".json")) errors.push(where + ": Dateiname und id stimmen nicht überein.");
  if (!edit.source) {
    unknownFields(edit, AUTHORED_FIELDS, where, errors);
    const task = pick(edit, ["id", "revision", "area", "subtopic", "method_ids", "variant_group", "title", "stem", "response", "solution", "materials", "requires", "help", "short_explanation", "detailed_explanation", "error_paths", "origin", "legal", "checks"]);
    return task;
  }
  unknownFields(edit, EDIT_FIELDS, where, errors);
  const project = edit.source;
  if (!ctx.selections[project]) {
    errors.push(where + ": unbekannte Quelle " + JSON.stringify(project) + ".");
    return null;
  }
  const entry = ctx.selections[project][edit.id];
  if (!entry) {
    errors.push(where + ": kein Eintrag in der Auswahl für " + project + ".");
    return null;
  }
  const ex = loadExcerpt(ctx.paths, project, edit.id);
  if (!ex) {
    errors.push(where + ": Quellauszug fehlt; Auszugswerkzeug für " + project + " ausführen.");
    return null;
  }
  const exRevision = project === "scanreha" ? ex.item.revision : ex.revision;
  const exId = project === "scanreha" ? ex.item.id : ex.task.id;
  if (ex.web_id !== edit.id || String(exId) !== String(entry.source_id) || exRevision !== entry.source_revision)
    errors.push(where + ": Quellauszug passt nicht zur Auswahl (ID oder Revision); Auszug neu erzeugen.");
  const base = project === "scanreha" ? baseFromScanreha(ex, entry, ctx.selections, errors, where) : baseFromWiso(ex);

  const overrides = edit.overrides || {};
  unknownFields(overrides, OVERRIDE_FIELDS, where + " overrides", errors);
  const kind = edit.origin && edit.origin.kind;
  const hasOverrides = Object.keys(overrides).length > 0;
  if (kind === "adopted" && hasOverrides) errors.push(where + ": Übernahme (adopted) darf Aufgabentext, Antwortform und Lösung nicht überschreiben.");
  if (kind === "adapted" && !hasOverrides) errors.push(where + ": Umgestaltung (adapted) ohne overrides; sonst adopted verwenden.");
  if (!overrides.response && !base.response) errors.push(where + ": Antwortform der Quelle ist nicht geschlossen; overrides.response und overrides.solution nötig.");
  if (overrides.response && !overrides.solution) errors.push(where + ": neue Antwortform braucht overrides.solution.");
  if (!overrides.solution && !base.solution) errors.push(where + ": Quelle ohne verwendbare Lösung; overrides.solution nötig.");

  // Erforderliche Materialien der Quelle müssen als Web-Material mitkommen.
  const webMaterialSources = (edit.materials || []).map((m) => ctx.materialSources[m.id]).filter(Boolean);
  base.requiredMaterialIds.forEach((id) => {
    if (webMaterialSources.indexOf(id) === -1) errors.push(where + ": erforderliches Quellmaterial " + id + " fehlt in materials.");
  });

  const task = {
    id: edit.id,
    revision: edit.revision,
    area: entry.area,
    subtopic: entry.subtopic,
    method_ids: base.method_ids,
    variant_group: entry.variant_group,
    title: edit.title,
    stem: overrides.stem !== undefined ? overrides.stem : base.stem,
    response: withReuse(overrides.response || base.response, edit.reuse_choices),
    solution: overrides.solution || base.solution,
    materials: edit.materials,
    requires: base.requires,
    help: edit.help,
    short_explanation: edit.short_explanation,
    detailed_explanation: edit.detailed_explanation,
    error_paths: edit.error_paths,
    legacy_ids: base.legacy_ids,
    origin: Object.assign({}, edit.origin, { source: base.source }),
    legal: edit.legal,
    checks: edit.checks
  };
  if (!task.method_ids.length) delete task.method_ids;
  Object.keys(task).forEach((k) => task[k] === undefined && delete task[k]);
  return task;
}

function baseMaterial(src, where, errors) {
  const out = { title: c.toPlainText(src.title) };
  const textKinds = ["scenario", "text", "document_excerpt", "legal_excerpt", "form"];
  const hasTable = c.markdownTableCount(src.content_md) > 0;
  // Enthält ein Text- oder Formularmaterial eine Tabelle, wird es wie eine Datentabelle dargestellt.
  if (src.kind === "data_table" || (textKinds.indexOf(src.kind) > -1 && hasTable)) {
    const t = c.parseMaterialTables(src.content_md);
    if (!t) {
      errors.push(where + ": Tabelle im Quellmaterial nicht lesbar.");
      return out;
    }
    out.kind = "table";
    if (t.before) out.intro = t.before;
    out.table = { columns: t.columns, rows: t.rows };
    if (t.after) out[/^Quelle\b/.test(t.after) ? "source_note" : "note"] = t.after;
  } else if (textKinds.indexOf(src.kind) > -1) {
    out.kind = "text";
    out.text = c.markdownToText(src.content_md);
  } else if (src.kind === "figure" && src.content_md && src.content_md.trim()) {
    // Abbildung mit vollständiger Textfassung; ein Bild wird nicht übernommen.
    out.kind = "text";
    out.text = c.markdownToText(src.content_md);
  } else errors.push(where + ": Materialart " + src.kind + (src.kind === "figure" ? " ohne Textfassung" : "") + " wird noch nicht unterstützt.");
  return out;
}

function composeMaterial(edit, file, ctx) {
  const errors = ctx.errors;
  const where = c.rel(file);
  if (edit.id !== path.basename(file, ".json")) errors.push(where + ": Dateiname und id stimmen nicht überein.");
  if (!edit.source) return edit;
  const s = edit.source;
  unknownFields(edit, ["id", "revision", "source", "overrides", "origin"], where, errors);
  if (s.project !== "scanreha" || !s.id || !s.excerpt) {
    errors.push(where + ": source braucht project scanreha, id und excerpt.");
    return null;
  }
  const ex = loadExcerpt(ctx.paths, "scanreha", s.excerpt);
  const src = ex && (ex.materials || []).concat(ex.supporting_materials || []).find((m) => m.id === s.id);
  if (!src) {
    errors.push(where + ": Quellmaterial " + s.id + " nicht im Auszug " + s.excerpt + ".");
    return null;
  }
  const overrides = edit.overrides || {};
  unknownFields(overrides, MATERIAL_OVERRIDES, where + " overrides", errors);
  const kind = edit.origin && edit.origin.kind;
  if (kind === "adopted" && Object.keys(overrides).length) errors.push(where + ": Übernahme (adopted) ohne overrides.");
  if (kind === "adapted" && !Object.keys(overrides).length) errors.push(where + ": Umgestaltung (adapted) ohne overrides.");
  const base = baseMaterial(src, where, errors);
  const mat = Object.assign({ id: edit.id, revision: edit.revision }, base, overrides);
  mat.origin = Object.assign({}, edit.origin, { source: { project: "scanreha", id: src.id, revision: src.revision } });
  const ordered = pick(mat, ["id", "revision", "title", "kind", "intro", "text", "table", "note", "source_note", "origin"]);
  return ordered;
}

function contentOf(obj, fields) {
  return JSON.stringify(pick(obj, fields));
}

// Gleicher Inhalt bei gleicher Revision; geänderter Inhalt braucht eine höhere Revision.
function checkRevisions(previous, data, errors) {
  if (!previous) return;
  [
    ["tasks", TASK_CONTENT, "Aufgabe"],
    ["materials", MATERIAL_CONTENT, "Material"]
  ].forEach(([key, fields, label]) => {
    const old = {};
    (previous[key] || []).forEach((x) => (old[x.id] = x));
    (data[key] || []).forEach((x) => {
      const o = old[x.id];
      if (!o) return;
      if (x.revision < o.revision) errors.push(label + " " + x.id + ": Revision " + x.revision + " ist kleiner als veröffentlicht (" + o.revision + ").");
      else if (x.revision === o.revision && contentOf(x, fields) !== contentOf(o, fields))
        errors.push(label + " " + x.id + ": Inhalt geändert, Revision " + x.revision + " aber nicht erhöht.");
    });
  });
  // Materialänderungen betreffen auch die verwendenden Aufgaben.
  const oldMat = {};
  (previous.materials || []).forEach((m) => (oldMat[m.id] = m));
  const newMat = {};
  (data.materials || []).forEach((m) => (newMat[m.id] = m));
  const oldTask = {};
  (previous.tasks || []).forEach((t) => (oldTask[t.id] = t));
  (data.tasks || []).forEach((t) => {
    const o = oldTask[t.id];
    if (!o || o.revision !== t.revision) return;
    (t.materials || []).forEach((m) => {
      const a = oldMat[m.id];
      const b = newMat[m.id];
      if (a && b && a.revision !== b.revision)
        errors.push("Aufgabe " + t.id + ": verwendetes Material " + m.id + " hat eine neue Revision; Aufgabenrevision erhöhen.");
    });
  });
}

function readPublished(file) {
  if (!fs.existsSync(file)) return null;
  const text = c.readText(file);
  const start = text.indexOf(PREFIX);
  if (start === -1) return null;
  return JSON.parse(text.slice(start + PREFIX.length).replace(/;\s*$/, ""));
}

function build(options) {
  const root = (options && options.root) || c.ROOT;
  const p = paths(root);
  const errors = [];
  const areasFile = c.readJson(p.areas);
  const catalog = fs.existsSync(p.catalog) ? c.readJson(p.catalog) : { units: [], cases: [] };
  const ctx = { paths: p, errors, selections: loadSelections(p), materialSources: {} };

  const materialFiles = c.listJson(p.materials);
  const materialEdits = materialFiles.map((f) => [c.readJson(f), f]);
  materialEdits.forEach(([m]) => {
    if (m.source && m.source.id) ctx.materialSources[m.id] = m.source.id;
  });
  const materials = materialEdits.map(([m, f]) => composeMaterial(m, f, ctx)).filter(Boolean);

  const tasks = c
    .listJson(p.tasks)
    .map((f) => composeTask(c.readJson(f), f, ctx))
    .filter(Boolean);

  // Jede Auswahl braucht eine Web-Bearbeitung, sonst bliebe sie stillschweigend unveröffentlicht.
  Object.keys(ctx.selections).forEach((project) => {
    Object.keys(ctx.selections[project]).forEach((id) => {
      if (!tasks.some((t) => t.id === id)) errors.push("Auswahl " + project + ": " + id + " hat keine Web-Bearbeitung unter content/aufgaben.");
    });
  });

  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const payload = {
    format_version: format.FORMAT_VERSION,
    areas: areasFile.areas,
    units: catalog.units,
    cases: catalog.cases,
    materials: materials.sort(byId),
    tasks: tasks.sort(byId),
    legacy_tasks: Object.keys(ctx.selections["wiso-web"]).map((id) => {
      const ex = loadExcerpt(p, "wiso-web", id);
      const base = baseFromWiso(ex);
      return { legacy_id: ex.legacy_store + ":" + ex.task.id, task_id: id, response: base.response, solution: base.solution };
    })
  };
  const data = Object.assign({ format_version: payload.format_version, data_revision: c.sha256(JSON.stringify(payload)).slice(0, 16) }, payload);
  errors.push(...format.validateData(data));
  checkRevisions(options && options.previous !== undefined ? options.previous : readPublished(p.output), data, errors);
  const text = HEADER + PREFIX + JSON.stringify(data, null, 2) + ";\n";
  return { data, errors, text, output: p.output };
}

function summary(data) {
  const lines = [];
  data.areas.forEach((a) => {
    const list = data.tasks.filter((t) => t.area === a.id);
    const types = {};
    list.forEach((t) => (types[t.response.type] = (types[t.response.type] || 0) + 1));
    lines.push(a.title + ": " + list.length + " Aufgaben " + JSON.stringify(types));
  });
  lines.push("Materialien: " + data.materials.length + ", Datenrevision " + data.data_revision);
  return lines.join("\n");
}

module.exports = { build, baseMaterial, readPublished, checkRevisions, HEADER, PREFIX };

if (require.main === module) {
  const args = c.parseArgs(process.argv.slice(2));
  try {
    const result = build();
    if (result.errors.length) {
      console.error(result.errors.join("\n"));
      process.exitCode = 2;
    } else if (args.check) {
      const current = fs.existsSync(result.output) ? fs.readFileSync(result.output, "utf8") : null;
      if (current === result.text) console.log("data/aufgaben.js ist aktuell.\n" + summary(result.data));
      else {
        console.error("data/aufgaben.js ist nicht aktuell; npm run build ausführen.");
        process.exitCode = 1;
      }
    } else {
      const written = c.writeIfChanged(result.output, result.text);
      console.log((written ? "geschrieben: " : "unverändert: ") + c.rel(result.output) + "\n" + summary(result.data));
    }
  } catch (e) {
    console.error(e instanceof c.ToolError ? e.message : e.stack);
    process.exitCode = 2;
  }
}

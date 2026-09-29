/*
 * Gemeinsames Aufgabenformat (Formatversion 1).
 *
 * Prüft Aufgaben, Materialien und Fachbereiche. Wird im Browser als
 * klassisches Skript (Areha.format) und in Node über require() genutzt,
 * damit Build, Tests und App dieselben Regeln anwenden.
 * Feldbeschreibung: docs/AUFGABENFORMAT.md
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.Areha = root.Areha || {}).format = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FORMAT_VERSION = 1;
  var RESPONSE_TYPES = ["single_choice", "multiple_choice", "matching", "ordering"];
  var ORIGIN_KINDS = ["adopted", "adapted", "authored"];
  var SOURCE_PROJECTS = ["scanreha", "wiso-web", "incoming"];
  var PLACEMENTS = ["before_stem", "after_stem"];
  var MATERIAL_KINDS = ["table", "text", "image"];
  var CHECK_KINDS = ["legal", "legal_waiver", "arithmetic", "content"];

  var ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var ANSWER_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
  var GROUP_RE = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var LEGACY_RE = /^[a-z0-9]+:[A-Za-z0-9_-]+$/;

  function isObj(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }
  function isText(v) {
    return typeof v === "string" && v.trim().length > 0;
  }
  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  // Texte verwenden nur **fett**, Zeilenumbrüche, Leerzeilen und Listen mit "- ".
  // HTML ist nicht erlaubt, damit die Darstellung ohne innerHTML auskommt.
  function checkText(errors, where, v, required) {
    if (v === undefined || v === null) {
      if (required) errors.push(where + ": Text fehlt.");
      return;
    }
    if (!isText(v)) {
      errors.push(where + ": muss ein nicht leerer Text sein.");
      return;
    }
    if (/<[a-zA-Z/!]/.test(v)) errors.push(where + ": enthält HTML; erlaubt sind nur **fett**, Zeilenumbrüche und Listen.");
    if ((v.match(/\*\*/g) || []).length % 2 !== 0) errors.push(where + ": unvollständige **-Markierung.");
  }

  function checkIdList(errors, where, list, re) {
    if (!Array.isArray(list)) {
      errors.push(where + ": muss eine Liste sein.");
      return [];
    }
    var seen = {};
    list.forEach(function (item, i) {
      if (!isObj(item)) {
        errors.push(where + "[" + i + "]: muss ein Objekt sein.");
        return;
      }
      if (typeof item.id !== "string" || !re.test(item.id)) errors.push(where + "[" + i + "]: ungültige ID " + JSON.stringify(item.id) + ".");
      else if (seen[item.id]) errors.push(where + ": doppelte ID " + item.id + ".");
      else seen[item.id] = true;
      checkText(errors, where + "[" + i + "].text", item.text, true);
    });
    return list
      .map(function (item) {
        return isObj(item) ? item.id : null;
      })
      .filter(Boolean);
  }

  function uniq(list) {
    var out = [];
    list.forEach(function (v) {
      if (out.indexOf(v) === -1) out.push(v);
    });
    return out;
  }

  // Liefert die IDs der Antwortalternativen, die ein Fehlweg benennen darf.
  function validateResponse(errors, where, response) {
    if (!isObj(response)) {
      errors.push(where + ": fehlt.");
      return null;
    }
    if (RESPONSE_TYPES.indexOf(response.type) === -1) {
      errors.push(where + ".type: unbekannte Antwortform " + JSON.stringify(response.type) + ".");
      return null;
    }
    if (has(response, "shuffle") && typeof response.shuffle !== "boolean") errors.push(where + ".shuffle: muss true oder false sein.");
    var info = { type: response.type };
    if (response.type === "single_choice" || response.type === "multiple_choice") {
      info.choiceIds = checkIdList(errors, where + ".choices", response.choices, ANSWER_ID_RE);
      if (info.choiceIds.length < 2) errors.push(where + ".choices: mindestens zwei Antwortalternativen nötig.");
      if (response.type === "multiple_choice") {
        var n = response.required_answers;
        if (!Number.isInteger(n) || n < 2 || n >= info.choiceIds.length)
          errors.push(where + ".required_answers: ganze Zahl ab 2 und kleiner als die Zahl der Alternativen nötig.");
      } else if (has(response, "required_answers") && response.required_answers !== 1) {
        errors.push(where + ".required_answers: bei Einfachauswahl nur 1 zulässig.");
      }
    } else if (response.type === "matching") {
      info.targetIds = checkIdList(errors, where + ".targets", response.targets, ANSWER_ID_RE);
      info.choiceIds = checkIdList(errors, where + ".choices", response.choices, ANSWER_ID_RE);
      if (!info.targetIds.length) errors.push(where + ".targets: mindestens ein Zuordnungsziel nötig.");
      if (typeof response.reuse_choices !== "boolean")
        errors.push(where + ".reuse_choices: muss festlegen, ob Antworten mehrfach verwendet werden dürfen (true/false).");
      else if (!response.reuse_choices && info.choiceIds.length < info.targetIds.length)
        errors.push(where + ".choices: zu wenige Antworten für eindeutige Zuordnung.");
    } else if (response.type === "ordering") {
      info.entryIds = checkIdList(errors, where + ".entries", response.entries, ANSWER_ID_RE);
      if (info.entryIds.length < 2) errors.push(where + ".entries: mindestens zwei Einträge nötig.");
    }
    return info;
  }

  function validateSolution(errors, where, solution, info, response) {
    if (!isObj(solution)) {
      errors.push(where + ": fehlt.");
      return;
    }
    if (!info) return;
    if (info.type === "single_choice" || info.type === "multiple_choice") {
      var ids = solution.choice_ids;
      if (!Array.isArray(ids)) {
        errors.push(where + ".choice_ids: muss eine Liste sein.");
        return;
      }
      if (uniq(ids).length !== ids.length) errors.push(where + ".choice_ids: doppelte IDs.");
      ids.forEach(function (id) {
        if (info.choiceIds.indexOf(id) === -1) errors.push(where + ".choice_ids: " + id + " ist keine Antwortalternative.");
      });
      var expected = info.type === "single_choice" ? 1 : response.required_answers;
      if (ids.length !== expected) errors.push(where + ".choice_ids: genau " + expected + " richtige Antwort(en) erwartet.");
    } else if (info.type === "matching") {
      if (!Array.isArray(solution.matches)) {
        errors.push(where + ".matches: muss eine Liste sein.");
        return;
      }
      var targets = {};
      var used = {};
      solution.matches.forEach(function (p, i) {
        if (!isObj(p)) {
          errors.push(where + ".matches[" + i + "]: muss ein Objekt sein.");
          return;
        }
        if (info.targetIds.indexOf(p.target_id) === -1) errors.push(where + ".matches[" + i + "]: unbekanntes Ziel " + p.target_id + ".");
        if (info.choiceIds.indexOf(p.choice_id) === -1) errors.push(where + ".matches[" + i + "]: unbekannte Antwort " + p.choice_id + ".");
        if (targets[p.target_id]) errors.push(where + ".matches: Ziel " + p.target_id + " mehrfach belegt.");
        targets[p.target_id] = true;
        if (!response.reuse_choices && used[p.choice_id]) errors.push(where + ".matches: Antwort " + p.choice_id + " darf nur einmal verwendet werden.");
        used[p.choice_id] = true;
      });
      info.targetIds.forEach(function (t) {
        if (!targets[t]) errors.push(where + ".matches: Ziel " + t + " ohne Lösung.");
      });
    } else if (info.type === "ordering") {
      var seq = solution.ordered_entry_ids;
      if (!Array.isArray(seq)) {
        errors.push(where + ".ordered_entry_ids: muss eine Liste sein.");
        return;
      }
      var ok = seq.length === info.entryIds.length && uniq(seq).length === seq.length && seq.every(function (id) {
        return info.entryIds.indexOf(id) > -1;
      });
      if (!ok) errors.push(where + ".ordered_entry_ids: muss jeden Eintrag genau einmal enthalten.");
    }
  }

  function correctChoiceIds(task) {
    return isObj(task.solution) && Array.isArray(task.solution.choice_ids) ? task.solution.choice_ids : [];
  }

  function validateErrorPaths(errors, where, paths, task, info) {
    if (paths === undefined) return;
    if (!Array.isArray(paths)) {
      errors.push(where + ": muss eine Liste sein.");
      return;
    }
    if (!info) return;
    var seen = {};
    var covered = {};
    paths.forEach(function (p, i) {
      var w = where + "[" + i + "]";
      if (!isObj(p)) {
        errors.push(w + ": muss ein Objekt sein.");
        return;
      }
      if (typeof p.id !== "string" || !ID_RE.test(p.id)) errors.push(w + ".id: ungültig.");
      else if (seen[p.id]) errors.push(where + ": doppelte ID " + p.id + ".");
      seen[p.id] = true;
      checkText(errors, w + ".text", p.text, true);
      if (info.type === "single_choice" || info.type === "multiple_choice") {
        if (!Array.isArray(p.choice_ids) || !p.choice_ids.length) {
          errors.push(w + ".choice_ids: mindestens eine falsche Antwortalternative nennen.");
          return;
        }
        p.choice_ids.forEach(function (id) {
          if (info.choiceIds.indexOf(id) === -1) errors.push(w + ".choice_ids: " + id + " ist keine Antwortalternative.");
          else if (correctChoiceIds(task).indexOf(id) > -1) errors.push(w + ".choice_ids: " + id + " ist richtig und kein Fehlweg.");
          if (covered[id]) errors.push(w + ".choice_ids: " + id + " ist bereits einem anderen Fehlweg zugeordnet.");
          covered[id] = true;
        });
      } else if (info.type === "matching") {
        if (!Array.isArray(p.matches) || !p.matches.length) {
          errors.push(w + ".matches: mindestens eine falsche Zuordnung nennen.");
          return;
        }
        var sol = (task.solution && task.solution.matches) || [];
        p.matches.forEach(function (pair) {
          if (!isObj(pair) || info.targetIds.indexOf(pair.target_id) === -1 || info.choiceIds.indexOf(pair.choice_id) === -1) {
            errors.push(w + ".matches: unbekanntes Ziel oder unbekannte Antwort.");
            return;
          }
          var right = sol.some(function (s) {
            return s.target_id === pair.target_id && s.choice_id === pair.choice_id;
          });
          if (right) errors.push(w + ".matches: " + pair.target_id + "/" + pair.choice_id + " ist richtig und kein Fehlweg.");
        });
      } else {
        errors.push(w + ": Fehlwege sind für Reihenfolgen noch nicht definiert; abweichende Stellen werden allgemein erklärt.");
      }
    });
  }

  function validateOrigin(errors, where, origin, ownerKind) {
    if (!isObj(origin)) {
      errors.push(where + ": fehlt.");
      return;
    }
    if (ORIGIN_KINDS.indexOf(origin.kind) === -1) errors.push(where + ".kind: adopted, adapted oder authored erwartet.");
    if (origin.kind === "adopted" || origin.kind === "adapted") {
      var s = origin.source;
      if (!isObj(s)) errors.push(where + ".source: bei Übernahme oder Umgestaltung erforderlich.");
      else {
        if (SOURCE_PROJECTS.indexOf(s.project) === -1) errors.push(where + ".source.project: unbekanntes Quellprojekt " + JSON.stringify(s.project) + ".");
        if (!isText(s.id)) errors.push(where + ".source.id: fehlt.");
        if (!(Number.isInteger(s.revision) && s.revision > 0) && !(typeof s.revision === "string" && /^sha256:[0-9a-f]{16,64}$/.test(s.revision)))
          errors.push(where + ".source.revision: ganze Zahl oder sha256:-Kennung erwartet.");
        if (ownerKind === "task" && s.project === "scanreha") {
          if (!isText(s.solution_id)) errors.push(where + ".source.solution_id: verwendete ScanReha-Lösung fehlt.");
          if (!(Number.isInteger(s.solution_revision) && s.solution_revision > 0)) errors.push(where + ".source.solution_revision: fehlt.");
        }
      }
    } else if (origin.kind === "authored" && has(origin, "source")) {
      errors.push(where + ".source: eigene Aufgaben haben keine Quelle; sonst adopted oder adapted verwenden.");
    }
    if (!Array.isArray(origin.changes)) errors.push(where + ".changes: Liste erwartet (bei Übernahme leer).");
    else {
      origin.changes.forEach(function (c, i) {
        checkText(errors, where + ".changes[" + i + "]", c, true);
      });
      if (origin.kind === "adapted" && !origin.changes.length) errors.push(where + ".changes: redaktionelle Umgestaltung muss beschrieben werden.");
      if (origin.kind === "adopted" && origin.changes.length) errors.push(where + ".changes: Übernahmen sind unverändert; Änderungen erfordern kind adapted.");
    }
    if (has(origin, "notes")) {
      if (!Array.isArray(origin.notes)) errors.push(where + ".notes: Liste erwartet.");
      else
        origin.notes.forEach(function (n, i) {
          checkText(errors, where + ".notes[" + i + "]", n, true);
        });
    }
  }

  function validateChecks(errors, where, checks) {
    if (checks === undefined) return [];
    if (!Array.isArray(checks)) {
      errors.push(where + ": Liste erwartet.");
      return [];
    }
    checks.forEach(function (c, i) {
      var w = where + "[" + i + "]";
      if (!isObj(c)) {
        errors.push(w + ": muss ein Objekt sein.");
        return;
      }
      if (CHECK_KINDS.indexOf(c.kind) === -1) errors.push(w + ".kind: legal, arithmetic oder content erwartet.");
      if (typeof c.date !== "string" || !DATE_RE.test(c.date)) errors.push(w + ".date: Datum JJJJ-MM-TT erwartet.");
      checkText(errors, w + ".text", c.text, true);
      if (c.kind === "legal" && (!Array.isArray(c.sources) || !c.sources.length)) errors.push(w + ".sources: Rechtsprüfung braucht Quellenangaben.");
      (Array.isArray(c.sources) ? c.sources : []).forEach(function (s, j) {
        if (!isObj(s) || !isText(s.title) || typeof s.url !== "string" || !/^https:\/\//.test(s.url))
          errors.push(w + ".sources[" + j + "]: title und https-URL erwartet.");
      });
    });
    return checks;
  }

  function validateTask(task, ctx) {
    var errors = [];
    var where = "Aufgabe " + (task && task.id ? task.id : "?");
    if (!isObj(task)) return [where + ": muss ein Objekt sein."];
    if (typeof task.id !== "string" || !ID_RE.test(task.id)) errors.push(where + ".id: nur Kleinbuchstaben, Ziffern und Bindestriche.");
    if (!Number.isInteger(task.revision) || task.revision < 1) errors.push(where + ".revision: ganze Zahl ab 1.");
    var area = ctx && ctx.areas ? ctx.areas[task.area] : null;
    if (!area) errors.push(where + ".area: unbekannter Fachbereich " + JSON.stringify(task.area) + ".");
    else if (!area.subtopics[task.subtopic]) errors.push(where + ".subtopic: " + JSON.stringify(task.subtopic) + " gehört nicht zu " + task.area + ".");
    if (has(task, "method_ids") && (!Array.isArray(task.method_ids) || !task.method_ids.every(isText))) errors.push(where + ".method_ids: Liste von Texten.");
    if (typeof task.variant_group !== "string" || !GROUP_RE.test(task.variant_group)) errors.push(where + ".variant_group: fehlt oder ungültig.");
    checkText(errors, where + ".title", task.title, true);
    checkText(errors, where + ".stem", task.stem, true);
    var info = validateResponse(errors, where + ".response", task.response);
    validateSolution(errors, where + ".solution", task.solution, info, task.response || {});
    if (!Array.isArray(task.materials)) errors.push(where + ".materials: Liste erwartet (auch leer).");
    else
      task.materials.forEach(function (m, i) {
        if (!isObj(m) || !isText(m.id)) {
          errors.push(where + ".materials[" + i + "]: id fehlt.");
          return;
        }
        if (ctx && ctx.materials && !ctx.materials[m.id]) errors.push(where + ".materials[" + i + "]: Material " + m.id + " existiert nicht.");
        if (PLACEMENTS.indexOf(m.placement) === -1) errors.push(where + ".materials[" + i + "].placement: before_stem oder after_stem.");
      });
    if (!Array.isArray(task.requires)) errors.push(where + ".requires: Liste erwartet (auch leer).");
    else
      task.requires.forEach(function (id) {
        if (id === task.id) errors.push(where + ".requires: verweist auf sich selbst.");
        else if (ctx && ctx.taskIds && !ctx.taskIds[id]) errors.push(where + ".requires: Aufgabe " + id + " existiert nicht.");
      });
    checkText(errors, where + ".short_explanation", task.short_explanation, true);
    checkText(errors, where + ".help", task.help, false);
    checkText(errors, where + ".detailed_explanation", task.detailed_explanation, false);
    validateErrorPaths(errors, where + ".error_paths", task.error_paths, task, info);
    if (has(task, "legacy_ids")) {
      if (!Array.isArray(task.legacy_ids) || !task.legacy_ids.every(function (v) {
        return typeof v === "string" && LEGACY_RE.test(v);
      }))
        errors.push(where + ".legacy_ids: Einträge der Form speicherstand:id erwartet.");
    }
    validateOrigin(errors, where + ".origin", task.origin, "task");
    if (task.origin && task.origin.source && task.origin.source.project === "wiso-web") {
      var legacy = "wiso40v2:" + task.origin.source.id;
      if (!Array.isArray(task.legacy_ids) || task.legacy_ids.indexOf(legacy) === -1)
        errors.push(where + ".legacy_ids: Übernahme aus dem Web-Bestand braucht die ausdrückliche Zuordnung " + legacy + ".");
    }
    if (has(task, "legal") && typeof task.legal !== "boolean") errors.push(where + ".legal: true oder false.");
    var checks = validateChecks(errors, where + ".checks", task.checks);
    if (task.legal === true && !checks.some(function (c) {
      return isObj(c) && (c.kind === "legal" || (c.kind === "legal_waiver" && task.origin && task.origin.source && task.origin.source.project === "incoming"));
    }))
      errors.push(where + ".checks: rechtsbezogene Aufgabe ohne dokumentierte Prüfung anhand aktueller Quellen.");
    var known = [
      "id", "revision", "area", "subtopic", "method_ids", "variant_group", "title", "stem", "response", "solution",
      "materials", "requires", "short_explanation", "help", "detailed_explanation", "error_paths", "legacy_ids",
      "origin", "legal", "checks"
    ];
    Object.keys(task).forEach(function (k) {
      if (known.indexOf(k) === -1) errors.push(where + ": unbekanntes Feld " + k + ".");
    });
    return errors;
  }

  function validateMaterial(mat) {
    var errors = [];
    var where = "Material " + (mat && mat.id ? mat.id : "?");
    if (!isObj(mat)) return [where + ": muss ein Objekt sein."];
    if (typeof mat.id !== "string" || !/^mat-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(mat.id)) errors.push(where + ".id: Form mat-name erwartet.");
    if (!Number.isInteger(mat.revision) || mat.revision < 1) errors.push(where + ".revision: ganze Zahl ab 1.");
    checkText(errors, where + ".title", mat.title, true);
    if (MATERIAL_KINDS.indexOf(mat.kind) === -1) errors.push(where + ".kind: table, text oder image.");
    checkText(errors, where + ".intro", mat.intro, false);
    checkText(errors, where + ".note", mat.note, false);
    checkText(errors, where + ".source_note", mat.source_note, false);
    if (mat.kind === "text") checkText(errors, where + ".text", mat.text, true);
    if (mat.kind === "image") {
      if (!isObj(mat.image)) errors.push(where + ".image: src, alt und description erwartet.");
      else {
        if (typeof mat.image.src !== "string" || !/^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:svg|png|jpe?g|webp)$/.test(mat.image.src))
          errors.push(where + ".image.src: lokaler Bildpfad unter assets/ erwartet.");
        checkText(errors, where + ".image.alt", mat.image.alt, true);
        checkText(errors, where + ".image.description", mat.image.description, true);
      }
    }
    if (mat.kind === "table") {
      var t = mat.table;
      if (!isObj(t) || !Array.isArray(t.columns) || !Array.isArray(t.rows)) errors.push(where + ".table: columns und rows erwartet.");
      else {
        t.columns.forEach(function (c, i) {
          if (!isObj(c) || typeof c.label !== "string") errors.push(where + ".table.columns[" + i + "]: label erwartet (auch leer).");
          else if (c.label) checkText(errors, where + ".table.columns[" + i + "].label", c.label, true);
          if (isObj(c) && ["left", "right"].indexOf(c.align) === -1) errors.push(where + ".table.columns[" + i + "].align: left oder right.");
        });
        if (!t.rows.length) errors.push(where + ".table.rows: mindestens eine Zeile.");
        t.rows.forEach(function (r, i) {
          if (!isObj(r) || !Array.isArray(r.cells) || r.cells.length !== t.columns.length) {
            errors.push(where + ".table.rows[" + i + "]: cells mit " + t.columns.length + " Zellen erwartet.");
            return;
          }
          r.cells.forEach(function (c, j) {
            if (typeof c !== "string") errors.push(where + ".table.rows[" + i + "].cells[" + j + "]: Text erwartet.");
            else if (c) checkText(errors, where + ".table.rows[" + i + "].cells[" + j + "]", c, true);
          });
          if (has(r, "emphasis") && typeof r.emphasis !== "boolean") errors.push(where + ".table.rows[" + i + "].emphasis: true oder false.");
        });
      }
    }
    validateOrigin(errors, where + ".origin", mat.origin, "material");
    return errors;
  }

  function areaIndex(areas) {
    var out = {};
    (Array.isArray(areas) ? areas : []).forEach(function (a) {
      if (!isObj(a)) return;
      var subs = {};
      (Array.isArray(a.subtopics) ? a.subtopics : []).forEach(function (s) {
        if (isObj(s)) subs[s.id] = s;
      });
      out[a.id] = { area: a, subtopics: subs };
    });
    return out;
  }

  function validateAreas(areas) {
    var errors = [];
    if (!Array.isArray(areas) || !areas.length) return ["Fachbereiche: Liste erwartet."];
    var seen = {};
    areas.forEach(function (a, i) {
      var w = "Fachbereich[" + i + "]";
      if (!isObj(a) || typeof a.id !== "string" || !ID_RE.test(a.id)) {
        errors.push(w + ": ungültige ID.");
        return;
      }
      if (seen[a.id]) errors.push(w + ": doppelte ID " + a.id + ".");
      seen[a.id] = true;
      checkText(errors, w + ".title", a.title, true);
      checkText(errors, w + ".short_title", a.short_title, true);
      var subs = {};
      (Array.isArray(a.subtopics) ? a.subtopics : []).forEach(function (s, j) {
        if (!isObj(s) || typeof s.id !== "string" || !ID_RE.test(s.id)) errors.push(w + ".subtopics[" + j + "]: ungültige ID.");
        else if (subs[s.id]) errors.push(w + ".subtopics: doppelte ID " + s.id + ".");
        else subs[s.id] = true;
        if (isObj(s)) checkText(errors, w + ".subtopics[" + j + "].title", s.title, true);
      });
      if (!Object.keys(subs).length) errors.push(w + ": mindestens ein Unterthema.");
    });
    return errors;
  }

  function findCycles(tasks) {
    var byId = {};
    tasks.forEach(function (t) {
      byId[t.id] = t;
    });
    var state = {};
    var errors = [];
    function visit(id, path) {
      if (state[id] === 2) return;
      if (state[id] === 1) {
        errors.push("Voraussetzungen bilden einen Kreis: " + path.concat(id).join(" → ") + ".");
        return;
      }
      state[id] = 1;
      ((byId[id] && byId[id].requires) || []).forEach(function (r) {
        if (byId[r]) visit(r, path.concat(id));
      });
      state[id] = 2;
    }
    tasks.forEach(function (t) {
      visit(t.id, []);
    });
    return errors;
  }

  // Prüft einen vollständigen Datenstand (Fachbereiche, Materialien, Aufgaben).
  function validateData(data) {
    var errors = [];
    if (!isObj(data)) return ["Datenstand: Objekt erwartet."];
    if (data.format_version !== FORMAT_VERSION) errors.push("format_version: " + FORMAT_VERSION + " erwartet.");
    errors = errors.concat(validateAreas(data.areas));
    var materials = {};
    (Array.isArray(data.materials) ? data.materials : []).forEach(function (m) {
      errors = errors.concat(validateMaterial(m));
      if (isObj(m) && m.id) {
        if (materials[m.id]) errors.push("Material " + m.id + ": doppelte ID.");
        materials[m.id] = m;
      }
    });
    var tasks = Array.isArray(data.tasks) ? data.tasks : [];
    var taskIds = {};
    tasks.forEach(function (t) {
      if (isObj(t) && t.id) {
        if (taskIds[t.id]) errors.push("Aufgabe " + t.id + ": doppelte ID.");
        taskIds[t.id] = true;
      }
    });
    var ctx = { areas: areaIndex(data.areas), materials: materials, taskIds: taskIds };
    tasks.forEach(function (t) {
      errors = errors.concat(validateTask(t, ctx));
    });
    errors = errors.concat(findCycles(tasks.filter(isObj)));
    var units = {}, cases = {}, byId = {};
    tasks.filter(isObj).forEach(function (t) { byId[t.id] = t; });
    if (data.units !== undefined && !Array.isArray(data.units)) errors.push("units: Liste erwartet.");
    (Array.isArray(data.units) ? data.units : []).forEach(function (u) {
      if (!isObj(u) || !GROUP_RE.test(u.id || "") || !isText(u.title) || !ctx.areas[u.area]) {
        errors.push("Lernkern: gültige ID, Titel und Fachbereich erforderlich."); return;
      }
      if (units[u.id]) errors.push("Lernkern " + u.id + ": doppelte ID.");
      units[u.id] = u;
    });
    if (Object.keys(units).length) tasks.filter(isObj).forEach(function (t) {
      if (!units[t.variant_group] || units[t.variant_group].area !== t.area) errors.push("Aufgabe " + t.id + ": Lernkern fehlt oder Fachbereich passt nicht.");
    });
    if (data.cases !== undefined && !Array.isArray(data.cases)) errors.push("cases: Liste erwartet.");
    (Array.isArray(data.cases) ? data.cases : []).forEach(function (c) {
      if (!isObj(c) || !isText(c.id) || !isText(c.title) || !isText(c.description) || !Array.isArray(c.task_ids)) {
        errors.push("Fall: ID, Titel, Beschreibung und Aufgabenliste erforderlich."); return;
      }
      if (cases[c.id]) errors.push("Fall " + c.id + ": doppelte ID.");
      cases[c.id] = true;
      if (c.task_ids.length < 2 || c.task_ids.length > 6 || uniq(c.task_ids).length !== c.task_ids.length) errors.push("Fall " + c.id + ": zwei bis sechs verschiedene Aufgaben erforderlich.");
      c.task_ids.forEach(function (id, i) {
        if (!byId[id]) errors.push("Fall " + c.id + ": unbekannte Aufgabe " + id + ".");
        else (byId[id].requires || []).forEach(function (pre) {
          if (c.task_ids.slice(0, i).indexOf(pre) < 0) errors.push("Fall " + c.id + ": Voraussetzung muss vor der Aufgabe stehen.");
        });
      });
    });
    var used = {};
    tasks.forEach(function (t) {
      ((isObj(t) && t.materials) || []).forEach(function (m) {
        if (isObj(m)) used[m.id] = true;
      });
    });
    Object.keys(materials).forEach(function (id) {
      if (!used[id]) errors.push("Material " + id + ": wird von keiner Aufgabe verwendet.");
    });
    return errors;
  }

  return {
    FORMAT_VERSION: FORMAT_VERSION,
    RESPONSE_TYPES: RESPONSE_TYPES.slice(),
    validateTask: validateTask,
    validateMaterial: validateMaterial,
    validateAreas: validateAreas,
    validateData: validateData,
    areaIndex: areaIndex
  };
});

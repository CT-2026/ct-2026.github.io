/*
 * Übungsbewertung: Ergebnis zwischen 0 und 1 je Aufgabe.
 * Kein offizieller Prüfungsschlüssel. Regeln: docs/AUFGABENFORMAT.md
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.Areha = root.Areha || {}).scoring = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isObj(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }
  function ids(list) {
    return (Array.isArray(list) ? list : []).map(function (x) {
      return x.id;
    });
  }
  function uniqStrings(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (v) {
      if (typeof v === "string" && out.indexOf(v) === -1) out.push(v);
    });
    return out;
  }

  function expectedCount(task) {
    return task.response.type === "multiple_choice" ? task.response.required_answers : 1;
  }

  // Bereinigt eine Antwort auf die Struktur der Aufgabe. Unbekannte IDs fallen weg.
  function normalizeAnswer(task, answer) {
    if (!isObj(answer)) return null;
    var r = task.response;
    if (r.type === "single_choice" || r.type === "multiple_choice") {
      var allowed = ids(r.choices);
      var chosen = uniqStrings(answer.choice_ids).filter(function (id) {
        return allowed.indexOf(id) > -1;
      });
      chosen = chosen.slice(0, expectedCount(task));
      return chosen.length ? { choice_ids: chosen } : null;
    }
    if (r.type === "matching") {
      var targets = ids(r.targets);
      var choices = ids(r.choices);
      var seenTarget = {};
      var usedChoice = {};
      var pairs = [];
      (Array.isArray(answer.matches) ? answer.matches : []).forEach(function (p) {
        if (!isObj(p) || targets.indexOf(p.target_id) === -1 || choices.indexOf(p.choice_id) === -1) return;
        if (seenTarget[p.target_id]) return;
        if (!r.reuse_choices && usedChoice[p.choice_id]) return;
        seenTarget[p.target_id] = true;
        usedChoice[p.choice_id] = true;
        pairs.push({ target_id: p.target_id, choice_id: p.choice_id });
      });
      return pairs.length ? { matches: pairs } : null;
    }
    if (r.type === "ordering") {
      var entries = ids(r.entries);
      var seq = uniqStrings(answer.ordered_entry_ids);
      var full = seq.length === entries.length && seq.every(function (id) {
        return entries.indexOf(id) > -1;
      });
      return full ? { ordered_entry_ids: seq } : null;
    }
    return null;
  }

  function isComplete(task, answer) {
    var a = normalizeAnswer(task, answer);
    if (!a) return false;
    var r = task.response;
    if (r.type === "single_choice" || r.type === "multiple_choice") return a.choice_ids.length === expectedCount(task);
    if (r.type === "matching") return a.matches.length === r.targets.length;
    return r.type === "ordering";
  }

  function statusFor(score) {
    if (score >= 1) return "correct";
    return score > 0 ? "partial" : "wrong";
  }

  // Liefert score (0..1), status und Einzelheiten für Rückmeldung und Darstellung.
  function evaluate(task, answer) {
    var a = normalizeAnswer(task, answer);
    var r = task.response;
    var sol = task.solution;
    var complete = isComplete(task, a);
    if (r.type === "single_choice" || r.type === "multiple_choice") {
      var chosen = a ? a.choice_ids : [];
      var right = sol.choice_ids;
      var hits = chosen.filter(function (id) {
        return right.indexOf(id) > -1;
      });
      var wrong = chosen.filter(function (id) {
        return right.indexOf(id) === -1;
      });
      var missed = right.filter(function (id) {
        return chosen.indexOf(id) === -1;
      });
      // Mehrfachauswahl: richtige Markierungen zählen, falsche ziehen ab; nie unter 0.
      var score = Math.max(0, hits.length - wrong.length) / right.length;
      return { complete: complete, score: score, status: statusFor(score), hits: hits, wrong: wrong, missed: missed };
    }
    if (r.type === "matching") {
      var given = {};
      (a ? a.matches : []).forEach(function (p) {
        given[p.target_id] = p.choice_id;
      });
      var correctTargets = [];
      var wrongPairs = [];
      var openTargets = [];
      sol.matches.forEach(function (p) {
        if (!given[p.target_id]) openTargets.push(p.target_id);
        else if (given[p.target_id] === p.choice_id) correctTargets.push(p.target_id);
        else wrongPairs.push({ target_id: p.target_id, choice_id: given[p.target_id], expected_choice_id: p.choice_id });
      });
      // Anteilige Bewertung ohne Abrundung auf ganze Punkte.
      var s = correctTargets.length / sol.matches.length;
      return { complete: complete, score: s, status: statusFor(s), correct_targets: correctTargets, wrong_matches: wrongPairs, open_targets: openTargets };
    }
    if (r.type === "ordering") {
      var seq = a ? a.ordered_entry_ids : [];
      var expected = sol.ordered_entry_ids;
      var positions = expected.map(function (id, i) {
        return { position: i + 1, expected_entry_id: id, entry_id: seq[i] || null, correct: seq[i] === id };
      });
      // Zunächst gilt nur die vollständig richtige Folge als richtig.
      var exact = complete && positions.every(function (p) {
        return p.correct;
      });
      return { complete: complete, score: exact ? 1 : 0, status: exact ? "correct" : "wrong", positions: positions };
    }
    throw new Error("Unbekannte Antwortform " + r.type);
  }

  // Fehlwege, die zur gegebenen Antwort passen. Nur definierte Fehlwege werden erklärt.
  function matchErrorPaths(task, answer) {
    var paths = Array.isArray(task.error_paths) ? task.error_paths : [];
    var a = normalizeAnswer(task, answer);
    if (!a || !paths.length) return [];
    var r = task.response;
    if (r.type === "single_choice" || r.type === "multiple_choice") {
      return paths.filter(function (p) {
        return p.choice_ids.some(function (id) {
          return a.choice_ids.indexOf(id) > -1;
        });
      });
    }
    if (r.type === "matching") {
      return paths.filter(function (p) {
        return p.matches.some(function (pp) {
          return a.matches.some(function (ap) {
            return ap.target_id === pp.target_id && ap.choice_id === pp.choice_id;
          });
        });
      });
    }
    return [];
  }

  return {
    normalizeAnswer: normalizeAnswer,
    isComplete: isComplete,
    evaluate: evaluate,
    matchErrorPaths: matchErrorPaths
  };
});

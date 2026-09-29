/*
 * Runden: Aufgabenauswahl, Bearbeitungszustände und Abschluss.
 *
 * Jede Runde führt eigene Antworten, verwendete Aufgabenrevisionen, Hilfen,
 * Bearbeitungszustände und Ergebnisse. Andere Runden werden nie verändert.
 * Die Funktionen arbeiten ohne DOM; Zeit und Zufall werden übergeben.
 */
(function (root, factory) {
  var scoring = typeof module === "object" && module.exports ? require("./scoring.js") : root.Areha.scoring;
  var api = factory(scoring);
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.Areha = root.Areha || {}).rounds = api;
})(typeof self !== "undefined" ? self : this, function (scoring) {
  "use strict";

  var SHORT_SIZE = 3;

  function nowIso(opts) {
    return (opts && opts.now) || new Date().toISOString();
  }
  function rnd(opts) {
    return (opts && opts.random) || Math.random;
  }

  function taskIndex(data) {
    var out = {};
    (data.tasks || []).forEach(function (t) {
      out[t.id] = t;
    });
    return out;
  }

  function shuffle(list, random) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function sameList(a, b) {
    return a.length === b.length && a.every(function (v, i) {
      return v === b[i];
    });
  }

  // IDs, deren Reihenfolge je Runde festgehalten wird.
  function orderSource(task) {
    var r = task.response;
    if (r.type === "ordering") return r.entries;
    return r.choices || [];
  }

  function initialOrder(task, random) {
    var base = orderSource(task).map(function (x) {
      return x.id;
    });
    if (task.response.shuffle === false) return base;
    var order = shuffle(base, random);
    if (task.response.type === "ordering") {
      // Die Ausgangsreihenfolge soll nicht schon die Lösung sein.
      for (var i = 0; i < 10 && sameList(order, task.solution.ordered_entry_ids); i++) order = shuffle(base, random);
    }
    return order;
  }

  function orderValid(task, order) {
    var base = orderSource(task).map(function (x) {
      return x.id;
    });
    return Array.isArray(order) && order.length === base.length && base.every(function (id) {
      return order.indexOf(id) > -1;
    });
  }

  // Antwortalternativen (bzw. Einträge) in der Reihenfolge dieser Runde.
  function orderedItems(task, slot) {
    var items = orderSource(task);
    if (!orderValid(task, slot.order)) return items.slice();
    var byId = {};
    items.forEach(function (x) {
      byId[x.id] = x;
    });
    return slot.order.map(function (id) {
      return byId[id];
    });
  }

  // Nutzungsdaten aus allen bisherigen Runden (nur lesend).
  function usage(rounds) {
    var lastUsed = {};
    var attempts = {};
    var lastRoundTaskIds = [];
    (rounds || []).forEach(function (r) {
      r.slots.forEach(function (s) {
        if (!lastUsed[s.task_id] || r.created_at > lastUsed[s.task_id]) lastUsed[s.task_id] = r.created_at;
        if (s.outcome === "checked" || s.outcome === "dont_know") attempts[s.task_id] = (attempts[s.task_id] || 0) + 1;
      });
    });
    if (rounds && rounds.length)
      lastRoundTaskIds = rounds[rounds.length - 1].slots.map(function (s) {
        return s.task_id;
      });
    return { lastUsed: lastUsed, attempts: attempts, lastRoundTaskIds: lastRoundTaskIds };
  }

  /*
   * Auswahl für eine Runde:
   * - je Fachbereich zunächst eine Aufgabe (ausgewogene Mischung);
   * - Aufgaben der unmittelbar vorherigen Runde nur, wenn nichts anderes bleibt;
   * - sonst zuerst nie oder am längsten nicht genutzte Aufgaben;
   * - höchstens eine Aufgabe je Variantengruppe, solange Alternativen bestehen;
   * - Voraussetzungen belegen eigene Plätze; passt ein Fall nicht in die
   *   Runde, wird er übergangen.
   */
  function selectTasks(data, rounds, opts) {
    opts = opts || {};
    var size = opts.size || SHORT_SIZE;
    var random = rnd(opts);
    var types = opts.types || scoringTypes();
    var byId = taskIndex(data);
    if (opts.caseId) {
      var chosenCase = (data.cases || []).filter(function (c) { return c.id === opts.caseId; })[0];
      if (!chosenCase || !chosenCase.task_ids.every(function (id) { return byId[id] && types.indexOf(byId[id].response.type) > -1; })) return [];
      return chosenCase.task_ids.slice();
    }
    var pool = (data.tasks || []).filter(function (t) {
      return types.indexOf(t.response.type) > -1 && (!opts.area || t.area === opts.area) &&
        (!opts.unit || t.variant_group === opts.unit) &&
        (!opts.taskIds || opts.taskIds.indexOf(t.id) > -1);
    });
    var u = usage(rounds);
    var tiebreak = {};
    pool.forEach(function (t) {
      tiebreak[t.id] = random();
    });

    function rank(list) {
      return list.slice().sort(function (a, b) {
        var pa = u.lastRoundTaskIds.indexOf(a.id) > -1 ? 1 : 0;
        var pb = u.lastRoundTaskIds.indexOf(b.id) > -1 ? 1 : 0;
        if (pa !== pb) return pa - pb;
        var la = u.lastUsed[a.id] || "";
        var lb = u.lastUsed[b.id] || "";
        if (la !== lb) return la < lb ? -1 : 1;
        return tiebreak[a.id] - tiebreak[b.id];
      });
    }

    // Fehlerwiederholung fügt keine bereits richtigen Voraussetzungsschritte hinzu.
    if (opts.kind === "repeat") return rank(pool).slice(0, size).map(function (t) { return t.id; });

    function withPrerequisites(task, trail) {
      trail = trail || [];
      if (trail.indexOf(task.id) > -1) return null;
      var out = [];
      for (var i = 0; i < (task.requires || []).length; i++) {
        var pre = byId[task.requires[i]];
        if (!pre || types.indexOf(pre.response.type) === -1) return null;
        var sub = withPrerequisites(pre, trail.concat(task.id));
        if (!sub) return null;
        sub.forEach(function (id) {
          if (out.indexOf(id) === -1) out.push(id);
        });
      }
      out.push(task.id);
      return out;
    }

    var chosen = [];
    var blocks = [];
    var groups = {};

    function tryAdd(task, allowSameGroup) {
      if (chosen.indexOf(task.id) > -1) return false;
      var ids = withPrerequisites(task);
      if (!ids) return false;
      var fresh = ids.filter(function (id) {
        return chosen.indexOf(id) === -1;
      });
      if (chosen.length + fresh.length > size) return false;
      if (!allowSameGroup && fresh.some(function (id) {
        return groups[byId[id].variant_group];
      }))
        return false;
      fresh.forEach(function (id) {
        chosen.push(id);
        groups[byId[id].variant_group] = true;
      });
      blocks.push(fresh);
      return true;
    }

    (data.areas || []).forEach(function (area) {
      if (chosen.length >= size) return;
      rank(pool.filter(function (t) {
        return t.area === area.id;
      })).some(function (t) {
        return tryAdd(t, false);
      });
    });
    [false, true].forEach(function (allowSameGroup) {
      var progress = true;
      while (chosen.length < size && progress) {
        progress = rank(pool).some(function (t) {
          return tryAdd(t, allowSameGroup);
        });
      }
    });

    // Reihenfolge mischen, Voraussetzungen aber stets vor der abhängigen Aufgabe.
    var flat = [];
    shuffle(blocks, random).forEach(function (b) {
      flat = flat.concat(b);
    });
    var ordered = [];
    while (flat.length) {
      var next = -1;
      for (var i = 0; i < flat.length && next === -1; i++) {
        var reqs = (byId[flat[i]].requires || []).filter(function (id) {
          return chosen.indexOf(id) > -1;
        });
        if (reqs.every(function (id) {
          return ordered.indexOf(id) > -1;
        }))
          next = i;
      }
      // Kreise schließt die Validierung aus; zur Sicherheit endet die Schleife trotzdem.
      ordered.push(flat.splice(next === -1 ? 0 : next, 1)[0]);
    }
    return ordered;
  }

  function scoringTypes() {
    return ["single_choice", "multiple_choice", "matching", "ordering"];
  }

  function newRoundId(state, created, random) {
    var base = "r-" + created.replace(/[^0-9]/g, "").slice(0, 14);
    var id;
    do {
      id = base + "-" + Math.floor(random() * 46656).toString(36);
    } while ((state.rounds || []).some(function (r) {
      return r.id === id;
    }));
    return id;
  }

  // Erstellt eine neue kurze Runde; gibt null zurück, wenn keine Aufgabe passt.
  function createRound(data, state, opts) {
    opts = opts || {};
    var created = nowIso(opts);
    var random = rnd(opts);
    var ids = selectTasks(data, state.rounds, opts);
    if (!ids.length) return null;
    var byId = taskIndex(data);
    var u = usage(state.rounds);
    var round = {
      id: newRoundId(state, created, random),
      kind: opts.kind || "short",
      status: "active",
      created_at: created,
      updated_at: created,
      data_revision: data.data_revision || "",
      cursor: 0,
      slots: ids.map(function (id) {
        var task = byId[id];
        return {
          task_id: id,
          task_revision: task.revision,
          attempt: (u.attempts[id] || 0) + 1,
          order: initialOrder(task, random),
          answer: null,
          help_used: false,
          outcome: null,
          result: null,
          events: []
        };
      })
    };
    if (opts.caseId) round.case_id = opts.caseId;
    return round;
  }

  function findRound(state, id) {
    return (state.rounds || []).filter(function (r) {
      return r.id === id;
    })[0] || null;
  }

  function activeRound(state) {
    var r = state.active_round_id ? findRound(state, state.active_round_id) : null;
    return r && r.status === "active" ? r : null;
  }

  function abandonActive(state, opts) {
    var r = activeRound(state);
    if (!r) return false;
    var t = nowIso(opts);
    r.status = "abandoned";
    r.abandoned_at = t;
    r.updated_at = t;
    state.active_round_id = null;
    return true;
  }

  // Übernimmt eine neue Runde; eine offene Runde wird als abgebrochen festgehalten.
  function startRound(state, round, opts) {
    abandonActive(state, opts);
    state.rounds.push(round);
    state.active_round_id = round.id;
    return round;
  }

  function touch(round, opts) {
    round.updated_at = nowIso(opts);
  }

  function slotAt(round, i) {
    return round && round.slots[i] ? round.slots[i] : null;
  }

  function isEditable(round, i) {
    var s = slotAt(round, i);
    return !!s && round.status === "active" && s.stale !== "missing" && s.stale !== "revision_changed" && (s.outcome === null || s.outcome === "skipped");
  }

  function setCursor(round, i) {
    if (!slotAt(round, i)) return false;
    round.cursor = i;
    return true;
  }

  function setAnswer(round, i, answer, data, opts) {
    if (!isEditable(round, i)) return false;
    var task = taskIndex(data)[round.slots[i].task_id];
    if (!task) return false;
    round.slots[i].answer = scoring.normalizeAnswer(task, answer);
    touch(round, opts);
    return true;
  }

  // „Kleine Hilfe“: wird einmal je Aufgabe festgehalten.
  function useHelp(round, i, data, opts) {
    if (round.kind === "exam") return false;
    if (!isEditable(round, i)) return false;
    var task = taskIndex(data)[round.slots[i].task_id];
    if (!task || !task.help) return false;
    var s = round.slots[i];
    if (!s.help_used) {
      s.help_used = true;
      s.events.push({ type: "help", at: nowIso(opts) });
      touch(round, opts);
    }
    return true;
  }

  // „Prüfen“: bewertet eine vollständige Antwort und schließt die Aufgabe ab.
  function checkSlot(round, i, data, opts) {
    if (round.kind === "exam") return null;
    if (!isEditable(round, i)) return null;
    var s = round.slots[i];
    var task = taskIndex(data)[s.task_id];
    if (!task || !scoring.isComplete(task, s.answer)) return null;
    var ev = scoring.evaluate(task, s.answer);
    s.outcome = "checked";
    s.result = { score: ev.score, status: ev.status };
    s.events.push({ type: "check", at: nowIso(opts) });
    touch(round, opts);
    return ev;
  }

  // „Lösung anzeigen“: Lösung und Erklärung werden gezeigt, ohne Bewertung.
  function dontKnow(round, i, opts) {
    if (round.kind === "exam") return false;
    if (!isEditable(round, i)) return false;
    var s = round.slots[i];
    s.outcome = "dont_know";
    s.answer = null;
    s.result = null;
    s.events.push({ type: "dont_know", at: nowIso(opts) });
    touch(round, opts);
    return true;
  }

  // „Überspringen“: Aufgabe bleibt bis zum Rundenabschluss bearbeitbar.
  function skipSlot(round, i, opts) {
    if (!isEditable(round, i)) return false;
    var s = round.slots[i];
    if (s.outcome !== "skipped") {
      s.outcome = "skipped";
      s.events.push({ type: "skip", at: nowIso(opts) });
      touch(round, opts);
    }
    return true;
  }

  // Nächste noch nicht begonnene Aufgabe nach Position `from` (ringförmig).
  function nextOpenIndex(round, from) {
    var n = round.slots.length;
    for (var k = 1; k <= n; k++) {
      var i = (from + k) % n;
      var s = round.slots[i];
      if (s.outcome === null && s.stale !== "missing" && s.stale !== "revision_changed") return i;
    }
    return null;
  }

  function isDone(slot) {
    return slot.outcome !== null || slot.stale === "missing" || slot.stale === "revision_changed";
  }

  function canComplete(round) {
    return !!round && round.kind !== "exam" && round.status === "active" && round.slots.every(isDone);
  }

  // Erst die gemeinsame Abgabe wertet den Versuch aus; auch unvollständige Antworten sind zulässig.
  function submitExam(state, round, data, opts) {
    if (!round || round.kind !== "exam" || round.status !== "active") return false;
    var byId = taskIndex(data);
    round.slots.forEach(function (s) {
      var task = byId[s.task_id];
      if (!task || task.revision !== s.task_revision) { s.stale = task ? "revision_changed" : "missing"; return; }
      var ev = scoring.evaluate(task, s.answer);
      s.outcome = ev.complete ? "checked" : "unanswered";
      s.result = { score: ev.score, status: ev.status };
      s.events.push({ type: "submit", at: nowIso(opts) });
    });
    round.status = "completed";
    round.completed_at = nowIso(opts);
    round.updated_at = round.completed_at;
    if (state.active_round_id === round.id) state.active_round_id = null;
    return true;
  }

  function completeRound(state, round, opts) {
    if (!canComplete(round)) return false;
    var t = nowIso(opts);
    round.status = "completed";
    round.completed_at = t;
    round.updated_at = t;
    if (state.active_round_id === round.id) state.active_round_id = null;
    return true;
  }

  // Einordnung einer Aufgabe für Abschluss und Rückblick.
  function slotCategory(slot) {
    if (slot.stale === "missing") return "missing";
    if (slot.outcome === "unanswered") return "unanswered";
    if (slot.outcome === "checked") {
      if (slot.result.status === "correct") return slot.help_used ? "correct_help" : "correct_alone";
      return slot.result.status === "partial" ? "partial" : "wrong";
    }
    if (slot.outcome === "dont_know") return "dont_know";
    if (slot.outcome === "skipped") return "skipped";
    return "open";
  }

  function summarize(round) {
    var counts = { correct_alone: 0, correct_help: 0, partial: 0, wrong: 0, dont_know: 0, skipped: 0, unanswered: 0, open: 0, missing: 0 };
    var items = round.slots.map(function (s, i) {
      var cat = slotCategory(s);
      counts[cat]++;
      return {
        index: i,
        task_id: s.task_id,
        category: cat,
        score: s.result ? s.result.score : null,
        help_used: s.help_used,
        // Ein selbstständig gelöster Erstversuch: erste Bearbeitung, ohne Hilfe, richtig.
        first_attempt_alone: cat === "correct_alone" && s.attempt === 1
      };
    });
    return { total: round.slots.length, counts: counts, items: items };
  }

  /*
   * Gleicht die aktive Runde mit dem aktuellen Aufgabenbestand ab.
   * Offene Aufgaben mit neuer Revision beginnen neu (Antwort verworfen);
   * abgeschlossene behalten ihr Ergebnis als historische Angabe.
   */
  function reconcileRound(round, data, opts) {
    var byId = taskIndex(data);
    var changed = false;
    var random = rnd(opts);
    round.slots.forEach(function (s) {
      var task = byId[s.task_id];
      if (!task) {
        if (s.stale !== "missing") {
          s.stale = "missing";
          changed = true;
        }
        return;
      }
      if (task.revision !== s.task_revision) {
        if (s.outcome === "checked" || s.outcome === "dont_know") {
          if (s.stale !== "revision_changed") {
            s.stale = "revision_changed";
            changed = true;
          }
          return;
        }
        s.events.push({ type: "revision_update", at: nowIso(opts), from: s.task_revision, to: task.revision });
        s.task_revision = task.revision;
        s.answer = null;
        s.order = initialOrder(task, random);
        delete s.stale;
        changed = true;
        return;
      }
      if (s.stale) {
        delete s.stale;
        changed = true;
      }
      if (!orderValid(task, s.order)) {
        s.order = initialOrder(task, random);
        changed = true;
      }
      var clean = scoring.normalizeAnswer(task, s.answer);
      if (JSON.stringify(clean) !== JSON.stringify(s.answer)) {
        s.answer = clean;
        changed = true;
      }
    });
    if (changed) touch(round, opts);
    return changed;
  }

  return {
    SHORT_SIZE: SHORT_SIZE,
    selectTasks: selectTasks,
    createRound: createRound,
    startRound: startRound,
    activeRound: activeRound,
    findRound: findRound,
    abandonActive: abandonActive,
    isEditable: isEditable,
    setCursor: setCursor,
    setAnswer: setAnswer,
    useHelp: useHelp,
    checkSlot: checkSlot,
    dontKnow: dontKnow,
    skipSlot: skipSlot,
    nextOpenIndex: nextOpenIndex,
    canComplete: canComplete,
    completeRound: completeRound,
    submitExam: submitExam,
    slotCategory: slotCategory,
    summarize: summarize,
    reconcileRound: reconcileRound,
    orderedItems: orderedItems,
    taskIndex: taskIndex
  };
});

/*
 * Speicherung der Runden im Browser (localStorage).
 *
 * Eigener Schlüssel "areha.v1"; der Speicherstand der bisherigen App
 * ("wiso40v2") wird nur bei ausdrücklicher Übernahme in der App gelesen
 * und nie verändert. Beim Laden wird nur die Struktur geprüft;
 * den Abgleich mit dem aktuellen Aufgabenbestand
 * übernimmt rounds.reconcileRound().
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.Areha = root.Areha || {}).storage = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var KEY = "areha.v1";
  var BACKUP_KEY = "areha.v1.defekt";
  var STATE_VERSION = 1;
  var MAX_ROUNDS = 200;
  var ROUND_STATUS = ["active", "completed", "abandoned"];
  var OUTCOMES = ["checked", "dont_know", "skipped", "unanswered"];
  var EVENT_TYPES = ["help", "check", "dont_know", "skip", "revision_update", "submit"];

  function isObj(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }
  function isTime(v) {
    return typeof v === "string" && !isNaN(Date.parse(v));
  }
  function strList(v) {
    return Array.isArray(v) && v.every(function (x) {
      return typeof x === "string";
    });
  }

  function emptyState() {
    return { version: STATE_VERSION, introduction_seen: false, active_round_id: null, rounds: [], results: [], bookmarks: [], legacy: null };
  }

  function cleanAnswer(a) {
    if (!isObj(a)) return null;
    var out = {};
    if (strList(a.choice_ids)) out.choice_ids = a.choice_ids.slice();
    if (strList(a.ordered_entry_ids)) out.ordered_entry_ids = a.ordered_entry_ids.slice();
    if (Array.isArray(a.matches))
      out.matches = a.matches
        .filter(function (p) {
          return isObj(p) && typeof p.target_id === "string" && typeof p.choice_id === "string";
        })
        .map(function (p) {
          return { target_id: p.target_id, choice_id: p.choice_id };
        });
    return Object.keys(out).length ? out : null;
  }

  function cleanSlot(s) {
    if (!isObj(s) || typeof s.task_id !== "string" || !s.task_id) return null;
    if (!Number.isInteger(s.task_revision) || s.task_revision < 1) return null;
    var slot = {
      task_id: s.task_id,
      task_revision: s.task_revision,
      attempt: Number.isInteger(s.attempt) && s.attempt > 0 ? s.attempt : 1,
      order: strList(s.order) ? s.order.slice() : [],
      answer: cleanAnswer(s.answer),
      help_used: s.help_used === true,
      outcome: OUTCOMES.indexOf(s.outcome) > -1 ? s.outcome : null,
      result: null,
      events: []
    };
    if (slot.outcome === "checked" || slot.outcome === "unanswered") {
      if (!isObj(s.result) || !Number.isFinite(s.result.score) || s.result.score < 0 || s.result.score > 1) return null;
      slot.result = { score: s.result.score, status: s.result.score === 1 ? "correct" : s.result.score > 0 ? "partial" : "wrong" };
    }
    if (Array.isArray(s.events))
      slot.events = s.events
        .filter(function (e) {
          return isObj(e) && EVENT_TYPES.indexOf(e.type) > -1 && isTime(e.at);
        })
        .map(function (e) {
          var ev = { type: e.type, at: e.at };
          if (Number.isInteger(e.from)) ev.from = e.from;
          if (Number.isInteger(e.to)) ev.to = e.to;
          return ev;
        });
    if (s.stale === "missing" || s.stale === "revision_changed") slot.stale = s.stale;
    return slot;
  }

  function cleanRound(r) {
    if (!isObj(r) || typeof r.id !== "string" || !r.id) return null;
    if (ROUND_STATUS.indexOf(r.status) === -1 || !isTime(r.created_at) || !Array.isArray(r.slots)) return null;
    var slots = r.slots.map(cleanSlot);
    if (!slots.length || slots.some(function (s) {
      return !s;
    }))
      return null;
    var round = {
      id: r.id,
      kind: typeof r.kind === "string" && r.kind ? r.kind : "short",
      status: r.status,
      created_at: r.created_at,
      updated_at: isTime(r.updated_at) ? r.updated_at : r.created_at,
      data_revision: typeof r.data_revision === "string" ? r.data_revision : "",
      cursor: Number.isInteger(r.cursor) ? Math.min(Math.max(r.cursor, 0), slots.length - 1) : 0,
      slots: slots
    };
    if (isTime(r.completed_at)) round.completed_at = r.completed_at;
    if (typeof r.case_id === "string") round.case_id = r.case_id;
    if (isTime(r.abandoned_at)) round.abandoned_at = r.abandoned_at;
    return round;
  }

  // Bringt einen geladenen Stand in eine gültige Form; Ungültiges fällt weg.
  function sanitizeState(raw) {
    var state = emptyState();
    if (!isObj(raw) || raw.version !== STATE_VERSION) return state;
    state.introduction_seen = raw.introduction_seen === true;
    state.results = (Array.isArray(raw.results) ? raw.results : []).map(cleanSlot).filter(function (slot) { return slot && slot.outcome === "checked" && !slot.stale; });
    state.bookmarks = strList(raw.bookmarks) ? raw.bookmarks.filter(function (id, i, ids) { return ids.indexOf(id) === i; }) : [];
    if (isObj(raw.legacy) && isTime(raw.legacy.imported_at) && Array.isArray(raw.legacy.entries)) {
      state.legacy = { imported_at: raw.legacy.imported_at, entries: raw.legacy.entries.filter(function (e) {
        return isObj(e) && typeof e.legacy_id === "string" && typeof e.round_id === "string";
      }).map(function (e) {
        return { legacy_id: e.legacy_id, round_id: e.round_id, answer: e.answer, checked: e.checked === true, marked: e.marked === true,
          task_id: typeof e.task_id === "string" ? e.task_id : null,
          task_revision: Number.isInteger(e.task_revision) ? e.task_revision : null,
          compatible: e.compatible === true, result: isObj(e.result) ? e.result : null };
      }) };
    }
    var seen = {};
    (Array.isArray(raw.rounds) ? raw.rounds : []).forEach(function (r) {
      var round = cleanRound(r);
      if (round && !seen[round.id]) {
        seen[round.id] = true;
        state.rounds.push(round);
      }
    });
    var active = state.rounds.filter(function (r) {
      return r.status === "active";
    });
    // Höchstens eine aktive Runde; bei widersprüchlichem Stand gilt der Zeiger.
    var activeId = typeof raw.active_round_id === "string" ? raw.active_round_id : null;
    var keep = active.filter(function (r) {
      return r.id === activeId;
    })[0] || null;
    active.forEach(function (r) {
      if (r !== keep) {
        r.status = "abandoned";
        r.abandoned_at = r.abandoned_at || r.updated_at;
      }
    });
    state.active_round_id = keep ? keep.id : null;
    return trimHistory(state);
  }

  function trimHistory(state) {
    var extra = state.rounds.length - MAX_ROUNDS;
    if (extra > 0) {
      var results = Object.create(null);
      (state.results || []).forEach(function (slot) { results[slot.task_id] = slot; });
      state.rounds = state.rounds.filter(function (r) {
        if (extra > 0 && r.id !== state.active_round_id) {
          extra--;
          if (r.kind !== "exam" || r.status === "completed") r.slots.forEach(function (slot) {
            if (slot.outcome === "checked" && slot.result && !slot.stale) results[slot.task_id] = cleanSlot(slot);
          });
          return false;
        }
        return true;
      });
      state.results = Object.keys(results).map(function (id) { return results[id]; }).filter(Boolean);
    }
    return state;
  }

  // backend: Objekt mit getItem/setItem/removeItem (z. B. localStorage) oder null.
  function createStore(backend) {
    function load() {
      if (!backend) return { state: emptyState(), problem: "unavailable" };
      var raw;
      try {
        raw = backend.getItem(KEY);
      } catch (e) {
        return { state: emptyState(), problem: "unavailable" };
      }
      if (raw === null || raw === undefined) return { state: emptyState(), problem: null };
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        try {
          backend.setItem(BACKUP_KEY, raw);
        } catch (e2) {
          /* Sicherung ist nicht möglich; der neue Stand beginnt trotzdem leer. */
        }
        return { state: emptyState(), problem: "corrupt" };
      }
      if (!isObj(parsed) || parsed.version !== STATE_VERSION || !Array.isArray(parsed.rounds)) {
        try {
          backend.setItem(BACKUP_KEY, raw);
        } catch (e3) {
          /* siehe oben */
        }
        return { state: emptyState(), problem: "corrupt" };
      }
      return { state: sanitizeState(parsed), problem: null };
    }

    function save(state) {
      if (!backend) return { ok: false, reason: "unavailable" };
      try {
        backend.setItem(KEY, JSON.stringify(trimHistory(state)));
        return { ok: true };
      } catch (e) {
        var quota = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
        return { ok: false, reason: quota ? "quota" : "error" };
      }
    }

    function reset() {
      if (!backend) return { ok: false, reason: "unavailable" };
      try {
        backend.removeItem(BACKUP_KEY);
        backend.removeItem(KEY + ".probe");
        backend.removeItem(KEY);
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: "error" };
      }
    }

    return { load: load, save: save, reset: reset };
  }

  // Zugriff auf localStorage kann in manchen Browsern selbst einen Fehler auslösen.
  function browserBackend(win) {
    try {
      var ls = win.localStorage;
      ls.getItem(KEY);
      return ls;
    } catch (e) {
      return null;
    }
  }

  return {
    KEY: KEY,
    BACKUP_KEY: BACKUP_KEY,
    STATE_VERSION: STATE_VERSION,
    MAX_ROUNDS: MAX_ROUNDS,
    emptyState: emptyState,
    sanitizeState: sanitizeState,
    createStore: createStore,
    browserBackend: browserBackend
  };
});

/* Wiederholung, sachlicher Fortschritt und historische Übernahme ohne Kompetenzmodell. */
(function (root, factory) {
  var api = factory(typeof module === "object" && module.exports ? require("./scoring.js") : root.Areha.scoring);
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.Areha = root.Areha || {}).learning = api;
})(typeof self !== "undefined" ? self : this, function (scoring) {
  "use strict";
  function latest(state, data) {
    var tasks = {}, out = {};
    data.tasks.forEach(function (t) { tasks[t.id] = t; });
    (state.results || []).forEach(function (s) {
      var task = tasks[s.task_id];
      if (task && s.task_revision === task.revision && s.outcome === "checked" && s.result && !s.stale) out[s.task_id] = s;
    });
    state.rounds.forEach(function (round) {
      if (round.kind === "exam" && round.status !== "completed") return;
      round.slots.forEach(function (s) {
        var task = tasks[s.task_id];
        if (!task || s.task_revision !== task.revision || s.outcome !== "checked" || !s.result || s.stale) return;
        out[s.task_id] = s;
      });
    });
    return out;
  }
  function repeatIds(state, data) {
    var recent = latest(state, data), old = {};
    ((state.legacy && state.legacy.entries) || []).forEach(function (e) {
      if (e.compatible && e.checked && e.result) old[e.task_id] = e;
    });
    return data.tasks.filter(function (t) {
      var s = recent[t.id];
      if (s) return s.result.score < 1;
      return old[t.id] && old[t.id].task_revision === t.revision && old[t.id].result.score < 1;
    }).map(function (t) { return t.id; });
  }
  function progress(state, data) {
    var recent = latest(state, data);
    return data.areas.map(function (area) {
      var tasks = data.tasks.filter(function (t) { return t.area === area.id; });
      var row = { id: area.id, title: area.title, total: tasks.length, done: 0, alone: 0, helped: 0, repeat: 0 };
      tasks.forEach(function (t) {
        var s = recent[t.id];
        if (!s) return;
        row.done++;
        if (s.result && s.result.score === 1) row[s.help_used ? "helped" : "alone"]++;
        else row.repeat++;
      });
      return row;
    });
  }
  function sameResponse(task, old) {
    if (!old || !old.response || !old.solution) return false;
    // IDs allein reichen nicht: auch Wortlaut, Antwortform und Lösung müssen passen.
    function shape(r) { return { type: r.type, choices: r.choices, targets: r.targets, entries: r.entries, required_answers: r.required_answers, reuse_choices: r.reuse_choices }; }
    return JSON.stringify(shape(task.response)) === JSON.stringify(shape(old.response)) && JSON.stringify(task.solution) === JSON.stringify(old.solution);
  }
  function importLegacy(state, raw, data, when) {
    if (state.legacy) return { ok: false, reason: "already" };
    if (!raw || typeof raw !== "object" || !raw.rounds || typeof raw.rounds !== "object") return { ok: false, reason: "invalid" };
    var maps = {}, entries = [], tasks = {};
    data.tasks.forEach(function (t) { tasks[t.id] = t; });
    (data.legacy_tasks || []).forEach(function (m) { maps[m.legacy_id] = m; });
    Object.keys(raw.rounds).forEach(function (key) {
      var r = raw.rounds[key];
      if (!r || typeof r !== "object") return;
      var answers = r.answers && typeof r.answers === "object" ? r.answers : {};
      var ids = Object.keys(answers);
      Object.keys(raw.marks || {}).forEach(function (id) { if (raw.marks[id] && ids.indexOf(id) < 0 && key === "main") ids.push(id); });
      ids.forEach(function (id) {
        var legacyId = "wiso40v2:" + id, m = maps[legacyId], t = m && tasks[m.task_id];
        var compatible = !!t && (t.legacy_ids || []).indexOf(legacyId) > -1 && sameResponse(t, m);
        var value = answers[id], answer = null;
        if (compatible && (t.response.type === "single_choice" || t.response.type === "multiple_choice"))
          answer = scoring.normalizeAnswer(t, { choice_ids: Array.isArray(value) ? value : typeof value === "string" ? [value] : [] });
        var checked = !!(r.submitted || (r.checked && r.checked[id]));
        var e = { legacy_id: legacyId, round_id: key, answer: value === undefined ? null : value,
          checked: checked, marked: !!(raw.marks && raw.marks[id]), task_id: t ? t.id : null, task_revision: t ? t.revision : null,
          compatible: compatible, result: compatible && checked && scoring.isComplete(t, answer) ? scoring.evaluate(t, answer) : null };
        entries.push(e);
        if (compatible && e.marked && state.bookmarks.indexOf(t.id) < 0) state.bookmarks.push(t.id);
      });
    });
    state.legacy = { imported_at: when || new Date().toISOString(), entries: entries };
    return { ok: true, total: entries.length, mapped: entries.filter(function (e) { return e.compatible; }).length };
  }
  // Ein bereits importierter Rohstand bleibt nutzbar, wenn später weitere
  // ausdrücklich zugeordnete Aufgaben veröffentlicht werden. Kein erneutes
  // Lesen des Altspeichers und kein Wiederherstellen entfernter Merkungen.
  function refreshLegacy(state, data) {
    if (!state.legacy) return false;
    var changed = false;
    state.legacy.entries.forEach(function (e) {
      if (e.task_id) return;
      var m = (data.legacy_tasks || []).filter(function (x) { return x.legacy_id === e.legacy_id; })[0];
      var t = m && data.tasks.filter(function (x) { return x.id === m.task_id && (x.legacy_ids || []).indexOf(e.legacy_id) > -1; })[0];
      if (!t) return;
      e.task_id = t.id;
      e.task_revision = t.revision;
      e.compatible = sameResponse(t, m);
      if (e.compatible) {
        var answer = scoring.normalizeAnswer(t, { choice_ids: Array.isArray(e.answer) ? e.answer : typeof e.answer === "string" ? [e.answer] : [] });
        e.result = e.checked && scoring.isComplete(t, answer) ? scoring.evaluate(t, answer) : null;
        if (e.marked && state.bookmarks.indexOf(t.id) < 0) state.bookmarks.push(t.id);
      }
      changed = true;
    });
    return changed;
  }
  return { latest: latest, repeatIds: repeatIds, progress: progress, importLegacy: importLegacy, refreshLegacy: refreshLegacy };
});

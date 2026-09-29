/*
 * Ansichtssteuerung: Startseite, kurze Runde, Abschluss und Rückblick.
 * Zustandsänderungen laufen über Areha.rounds und werden sofort gespeichert,
 * damit eine Runde nach Unterbrechung oder Neuladen fortgesetzt werden kann.
 */
(function (win, doc) {
  "use strict";
  var A = win.Areha;
  var R = A.rounds;
  var data = win.AREHA_DATA || null;
  var APP_TITLE = "Areha · Wissen & Training";
  var VIEWS = { einfuehrung: "ansicht-einfuehrung", start: "ansicht-start", wissen: "ansicht-wissen", runde: "ansicht-runde", abschluss: "ansicht-abschluss", fortschritt: "ansicht-fortschritt" };

  var dataOk = false;
  var byId = {};
  var areaById = {};
  var materialById = {};
  var types = [];
  var store = null;
  var state = null;
  var storageProblem = null;
  var ui = { review: null, summaryId: null, startMessage: "", firstRender: true };
  var current = null;

  function $(id) {
    return doc.getElementById(id);
  }
  function el(tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function now() {
    return new Date().toISOString();
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  // ---------- Daten und Speicherung ----------

  function initData() {
    if (!data) return false;
    var errors = A.format.validateData(data);
    if (errors.length) {
      if (win.console) win.console.error("[Prüfungstrainer] Ungültiger Aufgabenbestand", errors);
      return false;
    }
    data.tasks.forEach(function (t) {
      byId[t.id] = t;
    });
    data.areas.forEach(function (a) {
      areaById[a.id] = a;
    });
    data.materials.forEach(function (m) {
      materialById[m.id] = m;
    });
    types = Object.keys(A.renderers || {});
    return true;
  }

  function persist() {
    var res = store.save(state);
    if (!res.ok) storageProblem = res.reason;
    else if (storageProblem !== "corrupt") storageProblem = null;
    updateStorageNotice();
    return res.ok;
  }

  function storageText() {
    switch (storageProblem) {
      case "unavailable":
        return "Speichern ist in diesem Browser gesperrt.";
      case "quota":
        return "Speicher voll. Lernstand nicht gespeichert.";
      case "error":
        return "Der Übungsstand konnte nicht gespeichert werden.";
      case "corrupt":
        return "Der gespeicherte Lernstand ist beschädigt. Über „Fortschritt → Lernstand zurücksetzen“ neu beginnen.";
      default:
        return "";
    }
  }

  // Speicherfehler erscheinen in jeder Ansicht, der Hinweis auf einen
  // beschädigten früheren Stand nur auf der Startseite.
  function updateStorageNotice() {
    var text = storageText();
    var saveFailed = !!text && storageProblem !== "corrupt";
    setNotice("speicher-hinweis", text);
    setNotice("speicher-hinweis-runde", saveFailed ? text : "");
    $("aktionen").classList.toggle("has-storage-error", saveFailed);
    setNotice("speicher-hinweis-abschluss", saveFailed ? text : "");
    setNotice("speicher-hinweis-fortschritt", saveFailed ? text : "");
    setNotice("speicher-hinweis-wissen", saveFailed ? text : "");
    setNotice("speicher-hinweis-einfuehrung", saveFailed ? text : "");
  }

  // Eine unveränderte Meldung bleibt stehen, damit sie nicht bei jedem Speicherversuch erneut angesagt wird.
  function setNotice(id, text) {
    var n = $(id);
    if (n.textContent !== text) n.textContent = text;
    n.hidden = !text;
  }

  function lastCompleted() {
    for (var i = state.rounds.length - 1; i >= 0; i--) if (state.rounds[i].status === "completed") return state.rounds[i];
    return null;
  }

  // ---------- Navigation ----------

  function go(hash) {
    if (win.location.hash === hash) route();
    else win.location.hash = hash;
  }

  function route() {
    var h = (win.location.hash || "").replace(/^#/, "");
    if (h && h !== "start" && h !== "training") { ui.pendingStart = null; setConfirm(false); }
    if (h !== "fortschritt") {
      $("reset-bestaetigen").hidden = true;
      $("btn-reset").setAttribute("aria-expanded", "false");
      message("reset-meldung", "");
    }
    if (!state.introduction_seen || h === "einfuehrung") return showIntroduction();
    var parts = h.split("/");
    if (dataOk && (parts[0] === "abschluss" || parts[0] === "rueckblick") && parts.length > 1) {
      var roundId = "";
      try { roundId = decodeURIComponent(parts[1]); } catch (e) { /* Ungültiger Link. */ }
      var linkedRound = R.findRound(state, roundId);
      if (linkedRound && linkedRound.status === "completed") {
        if (ui.summaryId !== linkedRound.id) ui.summaryReturn = "#fortschritt";
        ui.summaryId = linkedRound.id;
        var index = /^\d+$/.test(parts[2] || "") ? Number(parts[2]) : -1;
        if (parts[0] === "rueckblick" && index >= 0 && index < linkedRound.slots.length) return showRound(linkedRound, index, "review", { focus: "title" });
        return showSummary(linkedRound);
      }
      ui.startMessage = "Diese Runde ist nicht mehr verfügbar.";
      return showStart();
    }
    if (dataOk && (h === "wissen" || h.indexOf("wissen/") === 0)) return showKnowledge(h);
    if (dataOk && h === "fortschritt") return showProgress();
    if (dataOk && h === "runde") {
      var active = R.activeRound(state);
      if (active) return showRound(active, active.cursor, "active", { focus: "title" });
    }
    if (dataOk && h === "rueckblick" && ui.review) {
      var reviewed = R.findRound(state, ui.review.roundId);
      if (reviewed) return showRound(reviewed, ui.review.index, "review", { focus: "title" });
    }
    if (dataOk && (h === "abschluss" || h === "rueckblick")) {
      var summary = (ui.summaryId && R.findRound(state, ui.summaryId)) || lastCompleted();
      if (summary && summary.status === "completed") return showSummary(summary);
    }
    showStart();
    if (h === "training") {
      $("training").scrollIntoView({ block: "start" });
      $("training").focus({ preventScroll: true });
    }
  }

  function showView(name, focusTarget, title) {
    Object.keys(VIEWS).forEach(function (k) {
      $(VIEWS[k]).hidden = k !== name;
    });
    doc.body.dataset.view = name;
    doc.querySelector(".main-nav").hidden = name === "einfuehrung";
    doc.querySelectorAll("[data-nav]").forEach(function (item) {
      if (item.dataset.nav === name) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    doc.title = title ? title + " – " + APP_TITLE : APP_TITLE;
    if (!ui.firstRender && focusTarget) {
      win.scrollTo(0, 0);
      focusTarget.focus();
    }
    ui.firstRender = false;
  }

  function message(id, text) {
    $(id).textContent = text || "";
  }

  // ---------- Einführung und Startseite ----------

  function showIntroduction() {
    $("btn-einfuehrung-weiter").textContent = state.introduction_seen ? "Zurück zum Fortschritt" : "Los geht’s";
    message("einfuehrung-meldung", ui.startMessage);
    ui.startMessage = "";
    showView("einfuehrung", $("einfuehrung-titel"), "Einführung");
  }

  function showStart() {
    var active = dataOk ? R.activeRound(state) : null;
    $("daten-fehler").hidden = dataOk;
    $("btn-kurz-ueben").disabled = !dataOk;
    $("weitere-runden").hidden = !dataOk;
    var repeats = dataOk ? A.learning.repeatIds(state, data).length : 0;
    var repeatActive = !!active && active.kind === "repeat";
    var ready = !!active && R.canComplete(active) && !active.slots.some(function (slot, index) { return R.isEditable(active, index); });
    $("btn-kurz-ueben").textContent = active && !repeatActive ? "Üben fortsetzen" : "Üben";
    $("btn-wiederholen").textContent = repeatActive ? "Wiederholung fortsetzen" : "Falsch beantwortete Aufgaben wiederholen";
    if (ready) $(repeatActive ? "btn-wiederholen" : "btn-kurz-ueben").textContent = "Ergebnis ansehen";
    $("btn-wiederholen").disabled = !repeats && !repeatActive;
    $("ueben-info").hidden = !active || repeatActive;
    $("ueben-info").textContent = "";
    $("wiederholung-info").textContent = repeats ? repeats + (repeats === 1 ? " falsch oder teilweise falsch beantwortete Aufgabe." : " falsch oder teilweise falsch beantwortete Aufgaben.") : "";
    if (active) {
      var done = active.slots.filter(function (s) {
        return s.outcome === "checked" || s.outcome === "dont_know";
      }).length;
      $(repeatActive ? "wiederholung-info" : "ueben-info").textContent =
        ready ? "Alle Aufgaben dieser Runde sind bearbeitet." : done + " von " + active.slots.length + " Aufgaben erledigt · weiter mit Aufgabe " + (resumeIndex(active) + 1);
    }
    setConfirm(!!ui.pendingStart);
    if (ui.pendingStart) {
      $("neu-bestaetigen-text").textContent = ui.pendingStart.kind === "repeat"
        ? "Offene Übungsrunde beenden und falsch beantwortete Aufgaben wiederholen?"
        : "Offene Wiederholung beenden und eine neue Übungsrunde starten?";
      $("btn-neu-ja").textContent = ui.pendingStart.kind === "repeat" ? "Zur Wiederholung wechseln" : "Zum Üben wechseln";
    }
    message("start-meldung", ui.startMessage);
    ui.startMessage = "";
    showView("start", $("start-titel"));
    if (ui.pendingStart) $("btn-neu-ja").focus();
  }

  // ---------- Wissen ohne Übungszwang ----------

  function showKnowledge(hash) {
    var box = clear($("wissen-inhalt"));
    var title = $("wissen-titel");
    var active = R.activeRound(state);
    title.textContent = "Wissensatlas";
    var parts = hash.split("/");
    var id = "";
    try { id = decodeURIComponent(parts.slice(2).join("/")); } catch (e) { id = ""; }
    var unit = parts[1] === "thema" && (data.units || []).filter(function (u) { return u.id === id; })[0];
    var savedTask = parts[1] === "aufgabe" && byId[id];
    if (unit || savedTask) {
      title.textContent = savedTask ? savedTask.title : unit.title;
      if (savedTask) A.knowledge.task(box, data, savedTask);
      else A.knowledge.unit(box, data, unit);
      // Nachschlagen in einer laufenden Übung gilt für passende offene Aufgaben
      // als Unterstützung. Bloßes Suchen und Lesen außerhalb einer Runde nicht.
      var supported = false;
      if (active) active.slots.forEach(function (slot, index) {
        var task = byId[slot.task_id];
        if (task && (savedTask ? task.id === savedTask.id : task.variant_group === unit.id) && !slot.help_used && R.useHelp(active, index, data, { now: now() })) supported = true;
      });
      if (supported) {
        persist();
      }
    } else {
      var area = parts[1] === "bereich" && areaById[id] ? id : "";
      A.knowledge.catalog(box, data, area);
      if (parts.length > 1 && !area) box.prepend(el("p", "notice", "Thema nicht verfügbar."));
    }
    if (active) {
      var resume = el("a", "knowledge-resume text-link", "Zur offenen Übungsrunde zurück");
      resume.href = "#runde";
      box.prepend(resume);
    }
    showView("wissen", title, title.textContent);
    A.material.markScrollable(box);
  }

  // Fortsetzen: bei der zuletzt gezeigten Aufgabe, falls sie noch offen ist,
  // sonst bei der nächsten offenen oder übersprungenen Aufgabe.
  function resumeIndex(round) {
    if (R.isEditable(round, round.cursor)) return round.cursor;
    var next = R.nextOpenIndex(round, round.cursor);
    if (next !== null) return next;
    for (var i = 0; i < round.slots.length; i++) if (R.isEditable(round, i)) return i;
    return round.cursor;
  }

  function setConfirm(open) {
    $("neu-bestaetigen").hidden = !open;
    $("btn-kurz-ueben").setAttribute("aria-expanded", open && ui.pendingStart.kind !== "repeat" ? "true" : "false");
    $("btn-wiederholen").setAttribute("aria-expanded", open && ui.pendingStart.kind === "repeat" ? "true" : "false");
  }

  function startNewRound(settings) {
    settings = settings && typeof settings.kind === "string" ? settings : {};
    var opts = { types: types, now: now(), kind: settings.kind === "repeat" ? "repeat" : "short", size: 3 };
    if (opts.kind === "repeat") opts.taskIds = A.learning.repeatIds(state, data);
    var round = R.createRound(data, state, opts);
    if (!round) {
      ui.pendingStart = null;
      ui.startMessage = "Zurzeit gibt es keine passenden Aufgaben.";
      return go("#start");
    }
    R.startRound(state, round, { now: now() });
    ui.pendingStart = null;
    persist();
    go("#runde");
  }

  function requestRound(settings) {
    var active = R.activeRound(state);
    if (!active) return startNewRound(settings);
    if (active.kind === settings.kind) {
      ui.pendingStart = null;
      setConfirm(false);
      if (R.canComplete(active) && !active.slots.some(function (slot, index) { return R.isEditable(active, index); })) return finishRound(active);
      if (R.setCursor(active, resumeIndex(active))) persist();
      return go("#runde");
    }
    ui.pendingStart = settings;
    go("#start");
  }

  function roundTitle(round) {
    return round.kind === "repeat" ? "Wiederholung" : "Üben";
  }

  // ---------- Runde ----------

  var CATEGORY_LABEL = {
    correct_alone: "Selbstständig richtig",
    correct_help: "Mit Hilfe richtig",
    partial: "Teilweise richtig",
    wrong: "Nicht richtig",
    dont_know: "Lösung angesehen",
    skipped: "Übersprungen",
    unanswered: "Nicht vollständig beantwortet",
    open: "Noch offen",
    missing: "Nicht mehr verfügbar"
  };
  var STEP_CLASS = {
    correct_alone: "ok",
    correct_help: "ok",
    partial: "partial",
    wrong: "wrong",
    dont_know: "seen",
    skipped: "skipped",
    unanswered: "open",
    open: "open",
    missing: "missing"
  };

  function staleState(slot, task) {
    if (!task) return "missing";
    if (slot.stale) return slot.stale;
    return task.revision !== slot.task_revision ? "revision_changed" : null;
  }

  function renderSteps(round, index, mode) {
    var ol = clear($("schritte"));
    round.slots.forEach(function (s, i) {
      var cat = R.slotCategory(s);
      var li = el("li");
      var b = el("button", "step step-" + STEP_CLASS[cat], String(i + 1));
      b.type = "button";
      b.setAttribute("aria-label", "Aufgabe " + (i + 1) + ": " + CATEGORY_LABEL[cat]);
      if (i === index) b.setAttribute("aria-current", "step");
      b.addEventListener("click", function () {
        if (i === index) return;
        if (mode === "review") go("#rueckblick/" + encodeURIComponent(round.id) + "/" + i);
        else showRound(round, i, mode, { focus: "title" });
      });
      li.appendChild(b);
      ol.appendChild(li);
    });
  }

  function renderMaterials(task) {
    var before = clear($("material-vor"));
    var after = clear($("material-nach"));
    task.materials.forEach(function (ref) {
      var m = materialById[ref.id];
      if (!m) return;
      var material = A.material.render(m);
      if (m.kind !== "text" || task.materials.length > 1 || (m.text || "").length > 350) {
        var fold = el("details", "material-fold");
        fold.open = !win.matchMedia("(max-width: 640px)").matches;
        var summary = el("summary");
        A.text.renderInline(summary, m.title);
        fold.appendChild(summary);
        fold.appendChild(material);
        fold.addEventListener("toggle", function () { if (fold.open) A.material.markScrollable(fold); });
        after.appendChild(fold);
      } else after.appendChild(material);
    });
  }

  function subtopicTitle(task) {
    var area = areaById[task.area];
    var sub = area.subtopics.filter(function (s) {
      return s.id === task.subtopic;
    })[0];
    return sub ? sub.title : area.title;
  }

  function renderFeedback(task, slot, currentVersion) {
    var box = clear($("rueckmeldung"));
    var ev = !currentVersion && (slot.outcome === "checked" || slot.outcome === "unanswered") ? A.scoring.evaluate(task, slot.answer) : null;
    var status = slot.outcome === "unanswered" ? "unanswered" : ev ? ev.status : slot.outcome === "skipped" ? "skipped" : "seen";
    var labels = { unanswered: "Nicht vollständig beantwortet", seen: "Lösung angesehen", skipped: "Übersprungen", correct: "Richtig", partial: "Teilweise richtig", wrong: "Nicht richtig" };
    box.className = "feedback is-" + (currentVersion ? "seen" : status);
    var head = el("p", "feedback-status", currentVersion ? "Lösung der aktuellen Fassung" : labels[status]);
    head.id = "rueckmeldung-status";
    box.appendChild(head);

    if (ev && ev.status !== "correct" && task.response.type === "multiple_choice") {
      var n = task.solution.choice_ids.length;
      var count = ev.hits.length + " von " + n + " richtig";
      if (ev.wrong.length) count += " · " + ev.wrong.length + " falsch gewählt";
      box.appendChild(el("p", "feedback-count", count));
    }
    if (ev && task.response.type === "matching") {
      box.appendChild(el("p", "feedback-count", "Richtig zugeordnet: " + ev.correct_targets.length + " von " + task.response.targets.length + "."));
    }
    if (task.response.type === "ordering" && (!ev || ev.status !== "correct")) {
      var sol = el("div", "feedback-solution");
      var type = task.response.type;
      sol.appendChild(el("p", "feedback-label", type === "ordering" ? "Richtige Reihenfolge" : task.solution.choice_ids.length > 1 ? "Richtige Antworten" : "Richtige Antwort"));
      var right;
      if (type === "ordering") {
        right = task.solution.ordered_entry_ids.map(function (id) { return task.response.entries.filter(function (e) { return e.id === id; })[0]; });
      } else right = task.response.choices.filter(function (c) { return task.solution.choice_ids.indexOf(c.id) > -1; });
      var list = el(type === "ordering" ? "ol" : right.length > 1 ? "ul" : "div", "feedback-solution-list");
      right.forEach(function (c) {
        A.text.renderInline(list.appendChild(el(right.length > 1 ? "li" : "p")), c.text);
      });
      sol.appendChild(list);
      box.appendChild(sol);
    }
    var paths = ev ? A.scoring.matchErrorPaths(task, slot.answer) : [];
    if (paths.length) {
      var p = el("div", "feedback-path");
      paths.forEach(function (path) {
        A.text.renderBlocks(p, path.text);
      });
      box.appendChild(p);
    } else A.text.renderBlocks(box.appendChild(el("div", "feedback-reason")), task.short_explanation);
    var more = box.appendChild(el("details", "feedback-more"));
    more.appendChild(el("summary", "", "Mehr dazu"));
    var moreBody = more.appendChild(el("div", "feedback-more-body"));
    if (paths.length) A.text.renderBlocks(moreBody, task.short_explanation);
    if (task.detailed_explanation) A.text.renderBlocks(moreBody, task.detailed_explanation);
    A.knowledge.feedback(moreBody, data, task);
    box.hidden = false;
  }

  function renderHelp(task, slot, visible) {
    var box = $("hilfe");
    var text = clear($("hilfe-text"));
    // Beim erneuten Darstellen derselben Aufgabe die Benutzerwahl erhalten.
    var keepOpen = ui.helpSlot === slot && !box.hidden;
    ui.helpSlot = slot;
    box.hidden = !(visible && task && task.help && slot.help_used);
    if (!box.hidden) {
      if (!keepOpen) box.open = true;
      A.text.renderBlocks(text, task.help);
    }
  }

  function renderActions(round, index, mode) {
    var slot = round.slots[index];
    var task = byId[slot.task_id];
    var editable = mode === "active" && !!task && !staleState(slot, task) && R.isEditable(round, index);
    $("aktionen-neben").hidden = !task;
    $("btn-weiss-nicht").hidden = !editable;
    $("btn-ueberspringen").hidden = !editable;
    $("btn-hilfe").hidden = !editable || !task.help || slot.help_used;
    var action;
    var label;
    if (mode === "review") {
      action = "back";
      label = "Zurück zur Übersicht";
    } else if (editable) {
      if (task.response.type === "ordering" || A.scoring.isComplete(task, slot.answer)) {
        action = "check";
        label = "Prüfen";
      } else if (R.canComplete(round)) {
        action = "complete";
        label = "Runde abschließen";
      } else {
        action = "check-blocked";
        label = "Prüfen";
      }
    } else if (R.nextOpenIndex(round, index) !== null) {
      action = "next";
      label = "Weiter";
    } else {
      action = "complete";
      label = "Runde abschließen";
    }
    var main = $("btn-haupt");
    main.hidden = false;
    main.textContent = label;
    main.setAttribute("aria-disabled", action === "check-blocked" ? "true" : "false");
    // Übersprungene Aufgabe mit vollständiger Markierung: „Prüfen“ bleibt
    // Hauptaktion, abschließen lässt sich die Runde trotzdem.
    $("btn-abschliessen").hidden = !(action === "check" && R.canComplete(round));
    current = { roundId: round.id, index: index, mode: mode, action: action };
  }

  function showRound(round, index, mode, opts) {
    opts = opts || {};
    index = Math.min(Math.max(index || 0, 0), round.slots.length - 1);
    if (mode === "active") {
      if (round.cursor !== index) {
        R.setCursor(round, index);
        persist();
      }
    } else ui.review = { roundId: round.id, index: index };
    var slot = round.slots[index];
    var task = byId[slot.task_id];
    var stale = staleState(slot, task);
    message("runde-meldung", opts.message || "");

    $("runde-art").textContent = mode === "review" ? "Rückblick" : roundTitle(round);
    $("runde-position").textContent = "Aufgabe " + (index + 1) + " von " + round.slots.length;
    $("btn-unterbrechen").textContent = mode === "review" ? "Zurück zur Übersicht" : "Unterbrechen";
    renderSteps(round, index, mode);

    var notice = $("aufgabe-hinweis");
    notice.hidden = true;
    clear($("material-vor"));
    clear($("material-nach"));
    clear($("aufgabe-text"));
    clear($("antwort"));
    $("rueckmeldung").hidden = true;
    $("aufgabe-aktionen").open = false;
    $("btn-merken").hidden = !task;
    $("btn-merken").setAttribute("aria-pressed", (state.bookmarks || []).indexOf(slot.task_id) > -1 ? "true" : "false");
    $("btn-merken").textContent = (state.bookmarks || []).indexOf(slot.task_id) > -1 ? "Aus Merkliste entfernen" : "Aufgabe merken";

    if (!task) {
      $("aufgabe-bereich").textContent = "";
      $("aufgabe-titel").textContent = "Aufgabe nicht mehr verfügbar";
      notice.textContent = "Aufgabe nicht mehr verfügbar.";
      notice.hidden = false;
      renderHelp(null, slot, false);
    } else {
      $("aufgabe-bereich").textContent = subtopicTitle(task);
      A.text.renderInline(clear($("aufgabe-titel")), task.title);
      if (stale === "revision_changed") {
        notice.textContent = "Aufgabe überarbeitet. Früheres Ergebnis: " + CATEGORY_LABEL[R.slotCategory(slot)] + ". Angezeigt wird die aktuelle Lösung.";
        notice.hidden = false;
      } else if (slot.outcome === "skipped" && mode === "active") {
        notice.textContent = "Übersprungen.";
        notice.hidden = false;
      }
      renderMaterials(task);
      A.text.renderBlocks($("aufgabe-text"), task.stem);

      // Rückblicke lösen übersprungene und überarbeitete Aufgaben auf.
      var skippedReview = mode === "review" && slot.outcome === "skipped";
      var revisedResult = stale === "revision_changed";
      var settled = !stale && (slot.outcome === "checked" || slot.outcome === "unanswered" || slot.outcome === "dont_know" || skippedReview);
      var editable = mode === "active" && !stale && R.isEditable(round, index);
      var renderer = A.renderers[task.response.type];
      $("antwort").appendChild(
        renderer.render({
          task: task,
          items: R.orderedItems(task, revisedResult ? { order: [] } : slot),
          answer: stale || skippedReview || slot.outcome === "dont_know" ? null : slot.answer,
          editable: editable,
          reveal: revisedResult ? { chosenIds: [] } : settled ? { chosenIds: (slot.outcome === "checked" || slot.outcome === "unanswered") && slot.answer ? slot.answer.choice_ids : [] } : null,
          name: "antwort-" + round.id + "-" + index,
          describedBy: "aufgabe-text",
          onChange: function (answer) {
            R.setAnswer(round, index, answer, data, { now: now() });
            persist();
            message("runde-meldung", "");
            renderActions(round, index, mode);
          },
          onLimit: function (text) {
            message("runde-meldung", text);
          }
        })
      );
      renderHelp(task, slot, !stale);
      if (settled || revisedResult) renderFeedback(task, slot, revisedResult);
    }
    renderActions(round, index, mode);

    var title = (mode === "review" ? "Rückblick" : roundTitle(round)) + ", Aufgabe " + (index + 1) + " von " + round.slots.length;
    var target = $("aufgabe-titel");
    if (opts.focus === "feedback" && !$("rueckmeldung").hidden) target = $("rueckmeldung");
    showView("runde", target, title);
    // Erst nach dem Einblenden lässt sich die tatsächliche Tabellenbreite messen.
    A.material.markScrollable($("aufgabe"));
  }

  function currentRound() {
    return current ? R.findRound(state, current.roundId) : null;
  }

  function onMain() {
    var round = currentRound();
    if (!round) return route();
    var i = current.index;
    var slot = round.slots[i];
    var task = byId[slot.task_id];
    switch (current.action) {
      case "check-blocked":
        message(
          "runde-meldung",
          (task.response.type === "matching" ? "Zuerst jedem Eintrag eine Antwort zuordnen." : "Zuerst " + (task.response.type === "multiple_choice" ? "genau " + task.response.required_answers + " Antworten" : "eine Antwort") + " wählen.") +
            " Alternativ sind „Lösung anzeigen“ oder „Überspringen“ möglich."
        );
        break;
      case "check":
        if (task.response.type === "ordering" && !A.scoring.isComplete(task, slot.answer)) {
          R.setAnswer(round, i, { ordered_entry_ids: R.orderedItems(task, slot).map(function (item) { return item.id; }) }, data, { now: now() });
        }
        R.checkSlot(round, i, data, { now: now() });
        persist();
        showRound(round, i, "active", { focus: "feedback" });
        break;
      case "next":
        showRound(round, R.nextOpenIndex(round, i), "active", { focus: "title" });
        break;
      case "complete":
        finishRound(round);
        break;
      case "back":
        ui.summaryId = round.id;
        go("#abschluss/" + encodeURIComponent(ui.summaryId));
        break;
    }
  }

  function finishRound(round) {
    if (!R.completeRound(state, round, { now: now() })) return;
    persist();
    ui.summaryId = round.id;
    ui.summaryReturn = "#start";
    ui.review = null;
    go("#abschluss/" + encodeURIComponent(ui.summaryId));
  }

  function onComplete() {
    var round = currentRound();
    if (!round) return route();
    finishRound(round);
  }

  function onHelp() {
    var round = currentRound();
    if (!round || !R.useHelp(round, current.index, data, { now: now() })) return;
    persist();
    var slot = round.slots[current.index];
    renderHelp(byId[slot.task_id], slot, true);
    renderActions(round, current.index, current.mode);
    var box = $("hilfe");
    box.tabIndex = -1;
    box.focus();
  }

  function onDontKnow() {
    var round = currentRound();
    if (!round || !R.dontKnow(round, current.index, { now: now() })) return;
    persist();
    showRound(round, current.index, "active", { focus: "feedback" });
  }

  function onSkip() {
    var round = currentRound();
    var i = current.index;
    if (!round || !R.skipSlot(round, i, { now: now() })) return;
    persist();
    var next = R.nextOpenIndex(round, i);
    if (next !== null) showRound(round, next, "active", { focus: "title", message: "Aufgabe " + (i + 1) + " übersprungen." });
    else finishRound(round);
  }

  function onInterrupt() {
    if (current && current.mode === "review") {
      ui.summaryId = current.roundId;
      return go("#abschluss/" + encodeURIComponent(ui.summaryId));
    }
    // Die Meldung beruht auf einem erneuten Speicherversuch, nicht auf früheren Ergebnissen.
    ui.startMessage = persist()
      ? "Runde gespeichert."
      : "Runde konnte nicht gespeichert werden.";
    go("#start");
  }

  // ---------- Abschluss ----------

  function showSummary(round) {
    $("btn-zur-startseite").textContent = ui.summaryReturn === "#start" ? "Zur Startseite" : "Zurück zum Fortschritt";
    var repeatRemaining = round.kind === "repeat" && A.learning.repeatIds(state, data).length > 0;
    $("btn-neue-runde").textContent = repeatRemaining ? "Wiederholung fortsetzen" : "Neue Übungsrunde";
    $("abschluss-art").textContent = roundTitle(round);
    var sum = R.summarize(round);
    var c = sum.counts;
    var right = c.correct_alone + c.correct_help;
    var text = right + " von " + sum.total + (sum.total === 1 ? " Aufgabe richtig gelöst" : " Aufgaben richtig gelöst");
    if (c.correct_help) text += ", davon " + c.correct_help + " mit Hilfe";
    if (c.unanswered) text += "; " + c.unanswered + " nicht vollständig beantwortet";
    if (c.skipped) text += "; " + c.skipped + " übersprungen";
    if (c.dont_know) text += "; bei " + c.dont_know + " die Lösung angesehen";
    if (round.kind === "repeat" && !repeatRemaining) text += ". Keine falsch beantworteten Aufgaben mehr offen";
    $("abschluss-zusammenfassung").textContent = text + ".";
    var list = clear($("abschluss-liste"));
    var focusBack = null;
    sum.items.forEach(function (item) {
      var task = byId[item.task_id];
      var li = el("li");
      var b = el("button", "result-item");
      b.type = "button";
      b.appendChild(el("span", "result-num", String(item.index + 1)));
      var body = el("span", "result-body");
      body.appendChild(el("span", "result-area", task ? areaById[task.area].title : ""));
      A.text.renderInline(body.appendChild(el("span", "result-title")), task ? task.title : "Aufgabe nicht mehr verfügbar");
      b.appendChild(body);
      b.appendChild(el("span", "badge badge-" + STEP_CLASS[item.category], CATEGORY_LABEL[item.category]));
      b.addEventListener("click", function () {
        ui.review = { roundId: round.id, index: item.index };
        go("#rueckblick/" + encodeURIComponent(round.id) + "/" + item.index);
      });
      li.appendChild(b);
      list.appendChild(li);
      if (ui.review && ui.review.roundId === round.id && ui.review.index === item.index) focusBack = b;
    });
    ui.summaryId = round.id;
    showView("abschluss", focusBack || $("abschluss-titel"), "Runde abgeschlossen");
  }

  // ---------- Start ----------

  function showProgress() {
    var box = clear($("fortschritt-bereiche"));
    A.learning.progress(state, data).forEach(function (p) {
      var card = el("div", "progress-card");
      card.appendChild(el("h2", "", p.title));
      card.appendChild(el("p", "", p.done + " von " + p.total + " Aufgaben beantwortet"));
      var meter = card.appendChild(el("progress", "progress-meter"));
      meter.max = p.total || 1;
      meter.value = p.done;
      meter.setAttribute("aria-label", p.title + ": " + p.done + " von " + p.total + " bearbeitet");
      card.appendChild(el("p", "", "Richtig: " + (p.alone + p.helped) + " · Zu wiederholen: " + p.repeat));
      box.appendChild(card);
    });
    var marks = clear($("merkliste"));
    (state.bookmarks || []).forEach(function (id) {
      if (!byId[id]) return;
      var li = el("li", "progress-card");
      var open = el("a", "text-link");
      open.href = "#wissen/aufgabe/" + encodeURIComponent(id);
      A.text.renderInline(open, byId[id].title);
      li.appendChild(open);
      li.appendChild(doc.createTextNode(" "));
      var remove = el("button", "btn btn-link btn-small", "Entfernen");
      remove.setAttribute("aria-label", "Aus Merkliste entfernen: " + A.text.plain(byId[id].title));
      remove.type = "button";
      remove.addEventListener("click", function () { state.bookmarks = state.bookmarks.filter(function (x) { return x !== id; }); persist(); showProgress(); });
      li.appendChild(remove);
      marks.appendChild(li);
    });
    if (!marks.childNodes.length) marks.appendChild(el("li", "", "Noch keine Aufgaben gemerkt."));
    var history = clear($("runden-verlauf"));
    state.rounds.slice().reverse().filter(function (r) { return r.status === "completed"; }).forEach(function (r) {
      var b = el("button", "result-item", roundTitle(r) + " · " + new Date(r.completed_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " · " + r.slots.length + (r.slots.length === 1 ? " Aufgabe" : " Aufgaben"));
      b.type = "button";
      b.addEventListener("click", function () { ui.summaryId = r.id; ui.summaryReturn = "#fortschritt"; ui.review = null; go("#abschluss/" + encodeURIComponent(ui.summaryId)); });
      history.appendChild(el("li")).appendChild(b);
    });
    if (!history.childNodes.length) history.appendChild(el("li", "", "Noch keine Runde abgeschlossen."));
    showView("fortschritt", $("fortschritt-titel"), "Fortschritt");
  }

  function confirmReset(open) {
    $("reset-bestaetigen").hidden = !open;
    $("btn-reset").setAttribute("aria-expanded", open ? "true" : "false");
    if (open) message("reset-meldung", "");
    (open ? $("btn-reset-nein") : $("btn-reset")).focus();
  }

  function resetLearning() {
    var result = store.reset();
    if (!result.ok) {
      message("reset-meldung", "Zurücksetzen fehlgeschlagen. Der Browser lässt das Löschen des Lernstands nicht zu.");
      return;
    }
    state = A.storage.emptyState();
    storageProblem = null;
    current = null;
    ui = { review: null, summaryId: null, pendingStart: null, startMessage: "Lernstand zurückgesetzt.", firstRender: false };
    confirmReset(false);
    message("reset-meldung", "");
    updateStorageNotice();
    go("#einfuehrung");
  }

  function bind() {
    if (dataOk) A.knowledge.home($("start-wissensgebiete"), data);
    $("btn-einfuehrung").addEventListener("click", function () { go("#einfuehrung"); });
    $("btn-einfuehrung-weiter").addEventListener("click", function () {
      var seen = state.introduction_seen;
      if (!seen) {
        state.introduction_seen = true;
        persist();
      }
      go(seen ? "#fortschritt" : "#start");
    });
    $("btn-wiederholen").addEventListener("click", function () { requestRound({ kind: "repeat" }); });
    $("btn-fortschritt-zurueck").addEventListener("click", function () { go("#start"); });
    $("btn-reset").addEventListener("click", function () { confirmReset(true); });
    $("btn-reset-nein").addEventListener("click", function () { confirmReset(false); });
    $("btn-reset-ja").addEventListener("click", resetLearning);
    $("btn-merken").addEventListener("click", function () {
      var r = currentRound();
      if (!r) return;
      var id = r.slots[current.index].task_id;
      var at = state.bookmarks.indexOf(id);
      if (at < 0) state.bookmarks.push(id); else state.bookmarks.splice(at, 1);
      persist();
      $("btn-merken").setAttribute("aria-pressed", at < 0 ? "true" : "false");
      $("btn-merken").textContent = at < 0 ? "Aus Merkliste entfernen" : "Aufgabe merken";
    });
    win.addEventListener("resize", function () {
      A.material.markScrollable(doc.querySelector(".view:not([hidden])"));
    });
    $("btn-kurz-ueben").addEventListener("click", function () { requestRound({ kind: "short" }); });
    $("btn-neu-nein").addEventListener("click", function () {
      var trigger = ui.pendingStart && ui.pendingStart.kind === "repeat" ? "btn-wiederholen" : "btn-kurz-ueben";
      ui.pendingStart = null;
      setConfirm(false);
      $(trigger).focus();
    });
    $("btn-neu-ja").addEventListener("click", function () { startNewRound(ui.pendingStart || {}); });
    $("btn-haupt").addEventListener("click", onMain);
    $("btn-abschliessen").addEventListener("click", onComplete);
    $("btn-hilfe").addEventListener("click", onHelp);
    $("btn-weiss-nicht").addEventListener("click", onDontKnow);
    $("btn-ueberspringen").addEventListener("click", onSkip);
    $("btn-unterbrechen").addEventListener("click", onInterrupt);
    $("btn-neue-runde").addEventListener("click", function () {
      var summary = R.findRound(state, ui.summaryId);
      var repeat = summary && summary.kind === "repeat" && A.learning.repeatIds(state, data).length > 0;
      requestRound({ kind: repeat ? "repeat" : "short" });
    });
    $("btn-zur-startseite").addEventListener("click", function () {
      go(ui.summaryReturn || "#fortschritt");
    });
    win.addEventListener("hashchange", route);
    // Änderungen aus einem anderen Tab übernehmen, damit keine Runde überschrieben wird.
    win.addEventListener("storage", function (e) {
      if (e.key !== A.storage.KEY && e.key !== null) return;
      var loaded = store.load();
      state = loaded.state;
      storageProblem = loaded.problem;
      current = null;
      ui.review = null;
      ui.summaryId = null;
      ui.pendingStart = null;
      $("reset-bestaetigen").hidden = true;
      $("btn-reset").setAttribute("aria-expanded", "false");
      updateStorageNotice();
      route();
    });
  }

  function init() {
    dataOk = initData();
    store = A.storage.createStore(A.storage.browserBackend(win));
    var loaded = store.load();
    state = loaded.state;
    storageProblem = loaded.problem;
    updateStorageNotice();
    var active = R.activeRound(state);
    if (active && dataOk && R.reconcileRound(active, data, { now: now() })) persist();
    bind();
    route();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);

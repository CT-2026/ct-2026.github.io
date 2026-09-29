/* Wissensatlas: vorhandene Erklärungen und separat redigierte Vertiefungen.
 * Keine Netzabfragen, keine eingebetteten Medien, keine HTML-Injektion.
 */
(function (root) {
  "use strict";
  var A = root.Areha = root.Areha || {};
  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function link(text, href, cls) {
    var a = node("a", cls || "text-link", text);
    a.href = href;
    return a;
  }
  function list(value) { return Array.isArray(value) ? value : []; }
  function content() { return root.AREHA_KNOWLEDGE || {}; }
  function tasksFor(data, unit) {
    return data.tasks.filter(function (t) { return t.variant_group === unit.id; });
  }
  function articlesFor(unit) {
    return list(content().articles).filter(function (a) {
      return a && a.status === "published" && a.unit_id === unit.id && typeof a.title === "string" && list(a.sections).length;
    });
  }
  function safeUrl(value) {
    if (typeof value !== "string") return "";
    try {
      var url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch (e) { return ""; }
  }
  function reviewedDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + "T00:00:00Z");
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getTime() <= Date.now();
  }
  function resourcesFor(unit, taskId) {
    return list(content().resources).filter(function (r) {
      return r && r.status === "reviewed" && ["article", "video", "reference"].indexOf(r.kind) !== -1 &&
        typeof r.title === "string" && r.title.trim() && typeof r.publisher === "string" && r.publisher.trim() &&
        reviewedDate(r.checked_at) && safeUrl(r.url) && list(r.unit_ids).indexOf(unit.id) !== -1 &&
        (!taskId || !list(r.task_ids).length || r.task_ids.indexOf(taskId) !== -1);
    });
  }
  function resourceHeading(resources) {
    var labels = [];
    if (resources.some(function (r) { return r.kind === "article"; })) labels.push("Artikel");
    if (resources.some(function (r) { return r.kind === "video"; })) labels.push("Videos");
    if (resources.some(function (r) { return r.kind === "reference"; })) labels.push("Quellen");
    return labels.length > 1 ? labels.slice(0, -1).join(", ") + " und " + labels[labels.length - 1] : labels[0] || "Weiterlesen";
  }
  function resourceCounts(resources) {
    return ["article", "video", "reference"].map(function (kind) {
      var count = resources.filter(function (r) { return r.kind === kind; }).length;
      var label = { article: ["Artikel", "Artikel"], video: ["Video", "Videos"], reference: ["Quelle", "Quellen"] }[kind];
      return count ? count + " " + label[count === 1 ? 0 : 1] : "";
    }).filter(Boolean).join(" · ");
  }
  function resourceList(parent, resources) {
    var ul = parent.appendChild(node("ul", "resource-list"));
    resources.forEach(function (r) {
      var li = ul.appendChild(node("li", "resource-card"));
      var a = link(r.title + " ↗", safeUrl(r.url));
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.appendChild(node("span", "sr-only", " (externe Seite, neuer Tab)"));
      li.appendChild(a);
      if (r.description) li.appendChild(node("p", "", r.description));
      li.appendChild(node("p", "resource-meta", r.publisher + " · " + new URL(r.url).hostname + " · geprüft am " + r.checked_at.split("-").reverse().join(".")));
      if (r.duration_minutes > 0) li.appendChild(node("p", "resource-meta", "Etwa " + r.duration_minutes + " Minuten"));
    });
  }

  function home(parent, data) {
    parent.replaceChildren();
    data.areas.forEach(function (area) {
      var a = link("", "#wissen/bereich/" + encodeURIComponent(area.id), "area-card area-" + area.id);
      a.appendChild(node("h3", "", area.title));
      var count = list(data.units).filter(function (u) { return u.area === area.id; }).length;
      a.appendChild(node("span", "area-card-footer", count + " Themen"));
      parent.appendChild(a);
    });
  }

  // Lerntexte durchsuchen, keine IDs oder Herkunftsmetadaten.
  function searchText(data, unit) {
    var area = data.areas.filter(function (a) { return a.id === unit.area; })[0];
    var text = [unit.title, area ? area.title : ""];
    tasksFor(data, unit).forEach(function (task) {
      text.push(task.title, task.stem, task.help, task.short_explanation, task.detailed_explanation);
      [task.response.choices, task.response.targets, task.response.entries].forEach(function (items) {
        list(items).forEach(function (item) { text.push(item.text); });
      });
      task.materials.forEach(function (ref) {
        var material = data.materials.filter(function (m) { return m.id === ref.id; })[0];
        if (!material) return;
        text.push(material.title, material.intro, material.text, material.note);
        if (material.image) text.push(material.image.alt, material.image.description);
        if (material.table) {
          material.table.columns.forEach(function (column) { text.push(column.label); });
          material.table.rows.forEach(function (row) { text.push(row.cells.join(" ")); });
        }
      });
    });
    articlesFor(unit).forEach(function (article) {
      text.push(article.title, article.intro, article.takeaway);
      list(article.sections).forEach(function (section) { if (section) text.push(section.title, section.text); });
    });
    return A.text.plain(text.filter(Boolean).join(" ")).toLocaleLowerCase("de");
  }

  var catalogQuery = "";
  var catalogArea = "";

  function catalog(parent, data, selectedArea) {
    catalogArea = selectedArea || "";
    parent.replaceChildren();
    var filters = parent.appendChild(node("div", "knowledge-filters"));
    var field = filters.appendChild(node("div", "search-field"));
    var label = field.appendChild(node("label", "sr-only", "Themen und Inhalte suchen"));
    label.htmlFor = "wissen-suche";
    var search = field.appendChild(node("input", "knowledge-search"));
    search.id = "wissen-suche";
    search.type = "search";
    search.value = catalogQuery;
    search.placeholder = "Thema suchen";
    var areaField = filters.appendChild(node("div", "search-field"));
    var areaLabel = areaField.appendChild(node("label", "sr-only", "Fachbereich"));
    areaLabel.htmlFor = "wissen-bereich";
    var areaSelect = areaField.appendChild(node("select", "knowledge-search knowledge-area"));
    areaSelect.id = "wissen-bereich";
    [{ id: "", title: "Alle Themen" }].concat(data.areas).forEach(function (a) {
      var item = areaSelect.appendChild(node("option", "", a.title));
      item.value = a.id;
      item.selected = a.id === (selectedArea || "");
    });
    areaSelect.addEventListener("change", function () {
      root.location.hash = areaSelect.value ? "#wissen/bereich/" + encodeURIComponent(areaSelect.value) : "#wissen";
    });
    var count = parent.appendChild(node("p", "catalog-count"));
    count.setAttribute("role", "status");
    var grid = parent.appendChild(node("div", "unit-grid"));
    var searchIndex = {};
    list(data.units).forEach(function (u) { searchIndex[u.id] = searchText(data, u); });
    function draw() {
      grid.replaceChildren();
      var words = search.value.trim().toLocaleLowerCase("de").split(/\s+/).filter(Boolean);
      var units = list(data.units).filter(function (u) {
        return (!selectedArea || u.area === selectedArea) &&
          words.every(function (word) { return searchIndex[u.id].indexOf(word) !== -1; });
      });
      count.textContent = units.length + (units.length === 1 ? " Thema" : " Themen");
      units.forEach(function (u) {
        var a = link("", "#wissen/thema/" + encodeURIComponent(u.id), "unit-card area-" + u.area);
        var area = data.areas.filter(function (item) { return item.id === u.area; })[0];
        if (!selectedArea) a.appendChild(node("span", "eyebrow", area ? area.title : u.area));
        a.appendChild(node("h2", "", u.title));
        grid.appendChild(a);
      });
      if (!units.length) grid.appendChild(node("p", "empty-state", "Keine passenden Themen gefunden."));
    }
    search.addEventListener("input", function () { catalogQuery = search.value; draw(); });
    draw();
  }

  function unit(parent, data, selected) {
    parent.replaceChildren();
    parent.appendChild(link("Zur Themenübersicht", catalogArea ? "#wissen/bereich/" + encodeURIComponent(catalogArea) : "#wissen"));
    var layout = parent.appendChild(node("div", "knowledge-layout"));
    var main = layout.appendChild(node("div", "knowledge-reading"));
    var articles = articlesFor(selected);
    articles.forEach(function (article) {
      var section = main.appendChild(node("article", "learning-article"));
      if (article.takeaway) A.text.renderBlocks(section.appendChild(node("div", "article-keypoint")), article.takeaway);
      var detail = section.appendChild(node("details", "article-detail"));
      detail.appendChild(node("summary", "", article.title));
      var detailBody = detail.appendChild(node("div", "article-detail-body"));
      if (article.intro) A.text.renderBlocks(detailBody, article.intro);
      list(article.sections).forEach(function (block) {
        if (!block || !block.text) return;
        var part = detailBody.appendChild(node("section", "learning-block"));
        if (block.title) part.appendChild(node("h3", "", block.title));
        A.text.renderBlocks(part, block.text);
      });
    });
    main.appendChild(node("h2", "", "Aufgabenbeispiele"));
    tasksFor(data, selected).forEach(function (task) {
      var details = main.appendChild(node("details", "learning-example"));
      details.appendChild(node("summary", "", task.title));
      var body = details.appendChild(node("div", "example-body"));
      renderExample(body, data, task);
      details.addEventListener("toggle", function () { if (details.open) A.material.markScrollable(body); });
    });
    var resources = resourcesFor(selected);
    if (resources.length) {
      var more = main.appendChild(node("details", "further-reading"));
      more.appendChild(node("summary", "", resourceHeading(resources)));
      resourceList(more, resources);
    }
    layout.classList.add("knowledge-layout-single");
  }

  function renderExample(body, data, task) {
    function materials(after) {
      task.materials.filter(function (ref) { return (ref.placement === "after_stem") === after; }).forEach(function (ref) {
        var material = data.materials.filter(function (m) { return m.id === ref.id; })[0];
        if (material) body.appendChild(A.material.render(material));
      });
    }
    materials(false);
    A.text.renderBlocks(body, task.stem);
    materials(true);
    if (task.response.choices && task.solution.choice_ids) {
      body.appendChild(node("h3", "", "Antworten"));
      var choices = body.appendChild(node("ul", "example-choices"));
      task.response.choices.forEach(function (choice) {
        var item = choices.appendChild(node("li"));
        A.text.renderInline(item, choice.text);
        if (task.solution.choice_ids.indexOf(choice.id) !== -1) {
          item.appendChild(node("span", "example-correct", "Richtig"));
        }
      });
    }
    if (!task.solution.choice_ids) body.appendChild(node("h3", "", "Lösung"));
    if (task.solution.choice_ids) {
      // Die Lösung steht direkt an der zugehörigen Antwort.
    } else if (task.solution.matches) {
      var pairs = body.appendChild(node("dl"));
      task.response.targets.forEach(function (target) {
        var pair = task.solution.matches.filter(function (p) { return p.target_id === target.id; })[0];
        var choice = task.response.choices.filter(function (c) { return c.id === pair.choice_id; })[0];
        A.text.renderInline(pairs.appendChild(node("dt")), target.text);
        A.text.renderInline(pairs.appendChild(node("dd")), choice.text);
      });
    } else if (task.solution.ordered_entry_ids) {
      var ordered = body.appendChild(node("ol"));
      task.solution.ordered_entry_ids.forEach(function (id) {
        var entry = task.response.entries.filter(function (e) { return e.id === id; })[0];
        A.text.renderInline(ordered.appendChild(node("li")), entry.text);
      });
    }
    var explanation = body.appendChild(node("details", "example-explanation"));
    explanation.appendChild(node("summary", "", "Erklärung"));
    A.text.renderBlocks(explanation, task.short_explanation);
    if (task.detailed_explanation) {
      A.text.renderBlocks(explanation, task.detailed_explanation);
    }
  }

  function savedTask(parent, data, task) {
    parent.replaceChildren();
    parent.appendChild(link("Zur Merkliste", "#fortschritt"));
    var body = parent.appendChild(node("article", "learning-article"));
    renderExample(body, data, task);
    parent.appendChild(link("Zum Thema", "#wissen/thema/" + encodeURIComponent(task.variant_group)));
  }

  function feedback(parent, data, task) {
    var selected = list(data.units).filter(function (u) { return u.id === task.variant_group; })[0];
    if (!selected) return;
    var box = parent.appendChild(node("div", "feedback-knowledge"));
    box.appendChild(link("Thema im Wissensatlas", "#wissen/thema/" + encodeURIComponent(selected.id)));
    var resources = resourcesFor(selected, task.id);
    if (resources.length) {
      var details = box.appendChild(node("details", ""));
      details.appendChild(node("summary", "", resourceHeading(resources)));
      resourceList(details, resources);
    }
  }
  A.knowledge = { home: home, catalog: catalog, unit: unit, task: savedTask, feedback: feedback };
})(typeof self !== "undefined" ? self : this);

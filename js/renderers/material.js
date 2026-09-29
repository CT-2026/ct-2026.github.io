/*
 * Darstellung von Materialien (Tabelle, Text) zusammen mit der Aufgabe.
 */
(function (root) {
  "use strict";
  var Areha = (root.Areha = root.Areha || {});

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function isShortValue(text) {
    return /^[−+\-–]?\s?[\d.,]*\s?(€|%|\?)?$/.test(String(text).trim()) && String(text).length <= 14;
  }

  // Nach dem Einfügen: Hinweise für seitlich verschiebbare Tabellen und Bilder.
  function markScrollable(root) {
    (root || document).querySelectorAll(".table-scroll, .image-scroll").forEach(function (wrap) {
      var image = wrap.classList.contains("image-scroll");
      var hintClass = image ? "image-hint" : "table-hint";
      var hint = wrap.nextElementSibling && wrap.nextElementSibling.classList.contains(hintClass) ? wrap.nextElementSibling : null;
      var scrollable = wrap.scrollWidth > wrap.clientWidth + 1;
      wrap.classList.toggle("is-scrollable", scrollable);
      var zoom = !image && wrap.closest(".material").querySelector(".material-zoom");
      if (zoom) zoom.hidden = !scrollable || window.matchMedia("(max-width: 640px)").matches;
      if (scrollable && !hint) {
        hint = el("p", hintClass, image ? "Bild seitlich verschieben, um den ganzen Beleg zu sehen." : "Tabelle seitlich verschieben, um alle Spalten zu sehen.");
        wrap.parentNode.insertBefore(hint, wrap.nextSibling);
      } else if (!scrollable && hint) hint.parentNode.removeChild(hint);
    });
  }

  function renderTable(material) {
    var t = material.table;
    var wrap = el("div", "table-scroll");
    // Breite Tabellen scrollen waagerecht; der Bereich ist per Tastatur erreichbar.
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Tabelle: " + Areha.text.plain(material.title));
    wrap.tabIndex = 0;
    var table = el("table", "material-table");
    table.style.minWidth = t.columns.length <= 2 ? "100%" : Math.max(20, t.columns.length * 8) + "rem";
    if (t.columns.length <= 2) table.classList.add("material-table-pairs");
    var hasHeader = t.columns.some(function (c) {
      return c.label;
    });
    if (hasHeader) {
      var thead = el("thead");
      var hr = el("tr");
      t.columns.forEach(function (c) {
        var th = el("th", c.align === "right" ? "num" : "");
        th.scope = "col";
        Areha.text.renderInline(th, c.label);
        hr.appendChild(th);
      });
      thead.appendChild(hr);
      table.appendChild(thead);
    }
    var tbody = el("tbody");
    t.rows.forEach(function (r) {
      var tr = el("tr", r.emphasis ? "is-emphasis" : "");
      r.cells.forEach(function (cell, i) {
        var col = t.columns[i];
        var cls = col.align === "right" ? "num" : "";
        // Kurze Werte wie „1.178.432“ oder „15,95 €“ nicht umbrechen, längere Texte schon.
        if (isShortValue(cell)) cls += " nowrap";
        var cellEl = i === 0 ? el("th", cls) : el("td", cls);
        if (i === 0) cellEl.scope = "row";
        Areha.text.renderInline(cellEl, cell);
        tr.appendChild(cellEl);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    if (t.columns.length <= 2) return wrap;
    var layouts = el("div", "material-table-layouts");
    layouts.appendChild(wrap);
    var mobile = el("div", "material-rows");
    t.rows.forEach(function (row) {
      var card = el("div", "material-data-row" + (row.emphasis ? " is-emphasis" : ""));
      var values = el("dl");
      row.cells.forEach(function (cell, i) {
        if (i === 0 && cell) {
          Areha.text.renderInline(card.appendChild(el("p", "material-row-title")), cell);
        } else if (cell) {
          var pair = el("div", "material-value-pair");
          if (t.columns[i].label) Areha.text.renderInline(pair.appendChild(el("dt")), t.columns[i].label);
          Areha.text.renderInline(pair.appendChild(el("dd")), cell);
          values.appendChild(pair);
        }
      });
      card.appendChild(values);
      mobile.appendChild(card);
    });
    layouts.appendChild(mobile);
    return layouts;
  }

  var activeDialog = null;
  function enlarge(material, opener) {
    if (activeDialog) activeDialog.close();
    var dialog = el("dialog", "material-dialog");
    dialog.setAttribute("aria-label", Areha.text.plain(material.title));
    var close = el("button", "btn btn-secondary", "Schließen");
    close.type = "button";
    close.autofocus = true;
    close.addEventListener("click", function () { dialog.close(); });
    dialog.appendChild(close);
    dialog.appendChild(render(material, true));
    function routeChanged() { dialog.close(); }
    function resized() { markScrollable(dialog); }
    dialog.addEventListener("close", function () {
      root.removeEventListener("hashchange", routeChanged);
      root.removeEventListener("resize", resized);
      dialog.remove();
      if (activeDialog === dialog) activeDialog = null;
      if (opener.isConnected) opener.focus({ preventScroll: true });
    });
    root.addEventListener("hashchange", routeChanged);
    root.addEventListener("resize", resized);
    document.body.appendChild(dialog);
    activeDialog = dialog;
    dialog.showModal();
    markScrollable(dialog);
  }

  function render(material, enlarged) {
    var fig = el("figure", "material");
    var cap = el("figcaption", "material-title");
    Areha.text.renderInline(cap, material.title);
    fig.appendChild(cap);
    if (material.intro) Areha.text.renderBlocks(fig.appendChild(el("div", "material-intro")), material.intro);
    if (material.kind === "table") fig.appendChild(renderTable(material));
    if (material.kind === "text") Areha.text.renderBlocks(fig.appendChild(el("div", "material-text")), material.text);
    if (material.kind === "image") {
      var img = el("img", "material-image");
      img.src = material.image.src;
      img.alt = Areha.text.plain(material.image.alt);
      if (enlarged) {
        var wrap = el("div", "image-scroll");
        wrap.setAttribute("role", "region");
        wrap.setAttribute("aria-label", "Bild: " + Areha.text.plain(material.title));
        wrap.tabIndex = 0;
        wrap.appendChild(img);
        fig.appendChild(wrap);
        img.addEventListener("load", function () { if (fig.isConnected) markScrollable(fig); });
      } else fig.appendChild(img);
      var description = el("details", "material-description");
      description.open = false;
      description.appendChild(el("summary", "", "Bildinhalt als Text"));
      Areha.text.renderBlocks(description.appendChild(el("div")), material.image.description);
      fig.appendChild(description);
    }
    if (material.note) Areha.text.renderBlocks(fig.appendChild(el("div", "material-note")), material.note);
    if (material.source_note) Areha.text.renderBlocks(fig.appendChild(el("div", "material-source")), material.source_note);
    if (!enlarged && material.kind !== "text") {
      var label = material.kind === "image" ? "Bild vergrößern" : "Tabelle größer anzeigen";
      var zoom = el("button", "btn btn-secondary material-zoom", label);
      zoom.hidden = material.kind === "table";
      zoom.type = "button";
      zoom.setAttribute("aria-label", label + ": " + Areha.text.plain(material.title));
      zoom.addEventListener("click", function () { enlarge(material, zoom); });
      fig.appendChild(zoom);
    }
    return fig;
  }

  Areha.material = { render: render, markScrollable: markScrollable };
})(typeof self !== "undefined" ? self : this);

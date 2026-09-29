/* Reihenfolge ohne Ziehzwang; „Prüfen“ wertet die sichtbare Reihenfolge aus. */
(function (root) {
  "use strict";
  var A = root.Areha;
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function instruction() { return "Reihenfolge"; }
  function render(opts) {
    var box = el("fieldset", "options ordering");
    box.appendChild(el("legend", "options-legend", opts.editable ? instruction() : "Reihenfolge"));
    if (opts.describedBy) box.setAttribute("aria-describedby", opts.describedBy);
    var given = opts.answer && opts.answer.ordered_entry_ids;
    var sequence = (given || opts.items.map(function (x) { return x.id; })).slice();
    var entries = {};
    opts.items.forEach(function (x) { entries[x.id] = x; });
    var list = el("ol", "order-list");
    box.appendChild(list);
    var status = el("p", "sr-only");
    status.setAttribute("aria-live", "polite");
    box.appendChild(status);
    function submit() { opts.onChange({ ordered_entry_ids: sequence.slice() }); }
    function draw(focusId, direction) {
      while (list.firstChild) list.removeChild(list.firstChild);
      sequence.forEach(function (id, index) {
        var row = el("li", "order-row");
        var text = el("div", "order-text");
        A.text.renderInline(text, entries[id].text);
        row.appendChild(text);
        if (opts.reveal && given) {
          var right = opts.task.solution.ordered_entry_ids[index] === id;
          row.classList.add(right ? "is-right" : "is-wrong");
          row.appendChild(el("p", "order-result", right ? "Richtige Stelle" : "Gehört an Stelle " + (opts.task.solution.ordered_entry_ids.indexOf(id) + 1)));
        }
        if (opts.editable) {
          var buttons = el("div", "order-buttons");
          [-1, 1].forEach(function (delta) {
            var button = el("button", "btn btn-secondary", delta < 0 ? "↑" : "↓");
            button.type = "button";
            button.dataset.entryId = id;
            button.dataset.direction = String(delta);
            var blocked = index + delta < 0 || index + delta >= sequence.length;
            // Erreichbar lassen, damit der Fokus nach dem Verschieben am Rand erhalten bleibt.
            button.setAttribute("aria-disabled", blocked ? "true" : "false");
            button.setAttribute("aria-label", (delta < 0 ? "Nach oben: " : "Nach unten: ") + A.text.plain(entries[id].text));
            button.addEventListener("click", function () {
              if (blocked) return;
              sequence.splice(index, 1);
              sequence.splice(index + delta, 0, id);
              submit();
              draw(id, delta);
              status.textContent = A.text.plain(entries[id].text) + " – jetzt an Stelle " + (index + delta + 1) + ".";
            });
            buttons.appendChild(button);
          });
          row.appendChild(buttons);
        }
        list.appendChild(row);
      });
      if (focusId) Array.prototype.some.call(list.querySelectorAll("button"), function (b) {
        if (b.dataset.entryId === focusId && b.dataset.direction === String(direction)) { b.focus(); return true; }
        return false;
      });
    }
    // Bei ungelesener Lösung oder übersprungener Aufgabe keine unbewertete Folge als Antwort darstellen.
    if (opts.reveal && !given) sequence = opts.task.solution.ordered_entry_ids.slice();
    draw();
    return box;
  }
  A.renderers.ordering = { render: render, instruction: instruction };
})(typeof self !== "undefined" ? self : this);

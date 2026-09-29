/* Zuordnung mit nativen Auswahlfeldern; jede Änderung bleibt eine eigene Antwort. */
(function (root) {
  "use strict";
  var A = root.Areha;
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function instruction(task) {
    return task.response.reuse_choices ? "Mehrfachzuordnung möglich." : "Jede Antwort einmal.";
  }
  function render(opts) {
    var box = el("fieldset", "options matching");
    box.appendChild(el("legend", "options-legend", opts.editable ? instruction(opts.task) : "Zuordnungen"));
    if (opts.describedBy) box.setAttribute("aria-describedby", opts.describedBy);
    var given = {}, expected = {}, controls = [];
    ((opts.answer && opts.answer.matches) || []).forEach(function (p) { given[p.target_id] = p.choice_id; });
    opts.task.solution.matches.forEach(function (p) { expected[p.target_id] = p.choice_id; });
    opts.task.response.targets.forEach(function (target, i) {
      var row = el("div", "match-row");
      var label = el("label", "match-label");
      var select = el("select", "match-select");
      select.id = opts.name + "-" + i;
      select.dataset.targetId = target.id;
      label.htmlFor = select.id;
      A.text.renderInline(label, target.text);
      select.appendChild(new Option("Bitte wählen …", ""));
      opts.items.forEach(function (choice) { select.appendChild(new Option(A.text.plain(choice.text), choice.id)); });
      select.value = given[target.id] || "";
      select.disabled = !opts.editable;
      row.appendChild(label);
      var control = el("div", "match-control");
      var display = el("span", "match-value");
      display.setAttribute("aria-hidden", "true");
      control.appendChild(display);
      control.appendChild(select);
      row.appendChild(control);
      if (opts.reveal && given[target.id] === expected[target.id]) control.hidden = true;
      if (opts.reveal) {
        var correct = opts.items.filter(function (c) { return c.id === expected[target.id]; })[0];
        var mark = el("p", "match-result");
        var prefix = given[target.id] ? (given[target.id] === correct.id ? "Richtig" : "Richtige Zuordnung") : "Lösung";
        row.classList.add(given[target.id] ? (given[target.id] === correct.id ? "is-right" : "is-wrong") : "is-solution");
        mark.appendChild(el("strong", "match-result-label", prefix));
        A.text.renderInline(mark.appendChild(el("span", "match-result-answer")), correct.text);
        row.appendChild(mark);
      }
      select.addEventListener("change", function () {
        if (!opts.editable) return;
        // Nicht stillschweigend eine andere Zuordnung löschen oder verdrängen.
        if (!opts.task.response.reuse_choices && select.value && controls.some(function (c) { return c !== select && c.value === select.value; })) {
          select.value = given[target.id] || "";
          opts.onLimit("Diese Antwort ist bereits zugeordnet. Zuerst die andere Zuordnung lösen.");
          return;
        }
        given[target.id] = select.value;
        refresh();
        var matches = controls.filter(function (c) { return c.value; }).map(function (c) { return { target_id: c.dataset.targetId, choice_id: c.value }; });
        opts.onChange(matches.length ? { matches: matches } : null);
      });
      controls.push(select);
      box.appendChild(row);
    });
    function refresh() {
      controls.forEach(function (select) {
        select.previousElementSibling.textContent = select.options[select.selectedIndex].textContent;
      });
      if (opts.task.response.reuse_choices) return;
      controls.forEach(function (select) {
        Array.prototype.forEach.call(select.options, function (option) {
          option.disabled = !!option.value && controls.some(function (other) { return other !== select && other.value === option.value; });
        });
      });
    }
    refresh();
    return box;
  }
  A.renderers.matching = { render: render, instruction: instruction };
})(typeof self !== "undefined" ? self : this);

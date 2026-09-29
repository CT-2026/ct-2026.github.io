/*
 * Einfach- und Mehrfachauswahl. Native Radio- und Checkbox-Felder sorgen für
 * Tastaturbedienung und Screenreader-Ansagen; die Karten sind nur Gestaltung.
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

  function required(task) {
    return task.response.type === "multiple_choice" ? task.response.required_answers : 1;
  }

  function instruction(task) {
    var n = required(task);
    return n === 1 ? "Eine Antwort wählen." : "Genau " + n + " Antworten wählen.";
  }

  function counterText(task, answer) {
    var n = required(task);
    var k = answer && answer.choice_ids ? answer.choice_ids.length : 0;
    return "Gewählt: " + k + " von " + n;
  }

  /*
   * opts: task, items (Antwortalternativen in Rundenreihenfolge), answer,
   * editable, reveal (null oder { chosenIds }), name, describedBy,
   * onChange(answer), onLimit(meldung)
   */
  function render(opts) {
    var task = opts.task;
    var multi = task.response.type === "multiple_choice";
    var n = required(task);
    var fieldset = el("fieldset", "options");
    if (opts.describedBy) fieldset.setAttribute("aria-describedby", opts.describedBy);
    fieldset.appendChild(el("legend", "sr-only", opts.editable ? instruction(task) : "Antwortmöglichkeiten"));
    var chosen = (opts.answer && opts.answer.choice_ids) || [];
    var correct = task.solution.choice_ids;

    var counter = null;
    if (multi && opts.editable) {
      counter = el("p", "options-counter", counterText(task, opts.answer));
      counter.setAttribute("aria-live", "polite");
      fieldset.appendChild(counter);
    }

    opts.items.forEach(function (choice, i) {
      var label = el("label", "option");
      var input = document.createElement("input");
      input.type = multi ? "checkbox" : "radio";
      input.name = opts.name;
      input.value = choice.id;
      input.className = "option-input";
      input.checked = chosen.indexOf(choice.id) > -1;
      input.disabled = !opts.editable;
      var body = el("span", "option-body");
      var letter = el("span", "option-letter", String.fromCharCode(65 + i));
      letter.setAttribute("aria-hidden", "true");
      var text = el("span", "option-text");
      Areha.text.renderInline(text, choice.text);
      body.appendChild(letter);
      body.appendChild(text);
      if (opts.reveal) {
        var isChosen = opts.reveal.chosenIds.indexOf(choice.id) > -1;
        var isCorrect = correct.indexOf(choice.id) > -1;
        var state = isChosen && isCorrect ? "is-right" : isChosen ? "is-wrong" : isCorrect ? "is-solution" : "";
        var spoken = isChosen && isCorrect ? "gewählte Antwort, richtig" : isChosen ? "gewählte Antwort, nicht richtig" : isCorrect ? "richtige Antwort" : "";
        if (state) {
          label.classList.add(state);
          var mark = el("span", "option-mark", isChosen && !isCorrect ? "✗" : "✓");
          mark.setAttribute("aria-hidden", "true");
          body.appendChild(mark);
          text.appendChild(el("span", "sr-only", " (" + spoken + ")"));
        }
      }
      label.appendChild(input);
      label.appendChild(body);
      fieldset.appendChild(label);
    });

    if (opts.editable) {
      fieldset.addEventListener("change", function (e) {
        var ids = [];
        fieldset.querySelectorAll("input").forEach(function (inp) {
          if (inp.checked) ids.push(inp.value);
        });
        if (multi && ids.length > n) {
          e.target.checked = false;
          if (opts.onLimit) opts.onLimit("Höchstens " + n + " Antworten sind möglich. Zuerst eine Auswahl entfernen.");
          return;
        }
        var answer = ids.length ? { choice_ids: ids } : null;
        if (counter) counter.textContent = counterText(task, answer);
        opts.onChange(answer);
      });
    }
    return fieldset;
  }

  var renderer = { render: render, instruction: instruction };
  Areha.renderers = Areha.renderers || {};
  Areha.renderers.single_choice = renderer;
  Areha.renderers.multiple_choice = renderer;
})(typeof self !== "undefined" ? self : this);

/*
 * Darstellung des einfachen Textformats: **fett**, Zeilenumbrüche,
 * Absätze (Leerzeile) und Listen ("- "). Erzeugt DOM-Knoten ohne innerHTML.
 */
(function (root) {
  "use strict";
  var Areha = (root.Areha = root.Areha || {});

  // Beträge im sichtbaren Text erkennen, auch über **fett**-Grenzen hinweg.
  // Formatierung und Quelldaten bleiben erhalten; HTML wird nie interpretiert.
  function appendInline(parent, line) {
    var offset = 0;
    var parts = String(line).split(/\*\*/).map(function (text, i) {
      var part = { text: text, bold: i % 2 === 1, start: offset, end: offset + text.length };
      offset = part.end;
      return part;
    });
    var text = parts.map(function (part) { return part.text; }).join("");

    function appendRange(target, start, end, protectSpaces) {
      parts.forEach(function (part) {
        var from = Math.max(start, part.start), to = Math.min(end, part.end);
        if (from >= to) return;
        var value = part.text.slice(from - part.start, to - part.start);
        if (protectSpaces) value = value.replace(/[ \u00a0]/g, "\u00a0");
        var node = document.createTextNode(value);
        if (part.bold) {
          var strong = document.createElement("strong");
          strong.appendChild(node);
          target.appendChild(strong);
        } else target.appendChild(node);
      });
    }

    var pattern = /[+\-−]?\d[\d.,]*[ \u00a0]+(?:EUR\b|€|%)/g;
    var last = 0, match;
    while ((match = pattern.exec(text))) {
      appendRange(parent, last, match.index, false);
      var quantity = document.createElement("span");
      quantity.className = "text-quantity";
      var wholeBold = parts.some(function (part) {
        return part.bold && part.start <= match.index && part.end >= pattern.lastIndex;
      });
      if (wholeBold) {
        // Bei vollständig fetten Beträgen bleibt strong das äußere Element.
        var strong = document.createElement("strong");
        quantity.textContent = match[0].replace(/[ \u00a0]/g, "\u00a0");
        strong.appendChild(quantity);
        parent.appendChild(strong);
      } else {
        appendRange(quantity, match.index, pattern.lastIndex, true);
        parent.appendChild(quantity);
      }
      last = pattern.lastIndex;
    }
    appendRange(parent, last, text.length, false);
  }

  // Hängt Absätze und Listen an container an.
  function renderBlocks(container, text) {
    String(text || "")
      .replace(/\r\n?/g, "\n")
      .split(/\n{2,}/)
      .forEach(function (block) {
        var lines = block.split("\n").filter(function (l) {
          return l.trim();
        });
        var para = null;
        var list = null;
        lines.forEach(function (line) {
          if (/^\s*- /.test(line)) {
            para = null;
            if (!list) {
              list = document.createElement("ul");
              container.appendChild(list);
            }
            var li = document.createElement("li");
            appendInline(li, line.replace(/^\s*- /, ""));
            list.appendChild(li);
          } else {
            list = null;
            if (para) para.appendChild(document.createElement("br"));
            else {
              para = document.createElement("p");
              container.appendChild(para);
            }
            appendInline(para, line);
          }
        });
      });
    return container;
  }

  // Text innerhalb einer Zeile, z. B. in Antwortalternativen und Tabellenzellen.
  function renderInline(container, text) {
    String(text || "")
      .split("\n")
      .forEach(function (line, i) {
        if (i) container.appendChild(document.createElement("br"));
        appendInline(container, line);
      });
    return container;
  }

  function plain(text) {
    return String(text || "")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .replace(/(\d) +(?=EUR\b|€|%)/g, "$1\u00a0")
      .trim();
  }

  Areha.text = { renderBlocks: renderBlocks, renderInline: renderInline, plain: plain };
})(typeof self !== "undefined" ? self : this);

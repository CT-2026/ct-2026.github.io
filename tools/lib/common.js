"use strict";
/*
 * Gemeinsame Hilfsfunktionen der Werkzeuge (nur Node-Standardbibliothek).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..", "..");

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function readText(file) {
  return fs.readFileSync(file, "utf8").replace(/^﻿/, "");
}

function readJson(file) {
  try {
    return JSON.parse(readText(file));
  } catch (e) {
    throw new Error(rel(file) + ": kein gültiges JSON (" + e.message + ")");
  }
}

// JSONL mit LF oder CRLF; Zeilennummern sind 1-basiert wie in ScanReha.
function readJsonl(file) {
  const out = [];
  readText(file)
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (!line.trim()) return;
      try {
        out.push(JSON.parse(line));
      } catch (e) {
        throw new Error(file + ":" + (i + 1) + ": kein gültiges JSON (" + e.message + ")");
      }
    });
  return out;
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function writeIfChanged(file, text) {
  const old = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (old === text) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
  return true;
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function listJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(dir, f));
}

// Einfache Argumente: --name wert und --schalter.
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", euro: "€" };

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, code) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return String.fromCodePoint(n);
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, code) ? ENTITIES[code] : m;
  });
}

// Wandelt Quelltext (Markdown aus ScanReha, HTML-Schnipsel aus dem Web-Bestand)
// in das Textformat der Web-Aufgaben: **fett**, Zeilenumbrüche, Leerzeilen, Listen.
function toPlainText(s) {
  let t = String(s).replace(/\r\n?/g, "\n");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/?(strong|b)>/gi, "**");
  t = t.replace(/<[^>]+>/g, "");
  t = decodeEntities(t).replace(/ /g, " ");
  t = t
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

// Liest eine Markdown-Tabelle mit Text davor und danach.
function parseMarkdownTable(md) {
  const lines = String(md).replace(/\r\n?/g, "\n").split("\n");
  const start = lines.findIndex((l, i) => l.trim().startsWith("|") && lines[i + 1] && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1]));
  if (start === -1) return null;
  let end = start;
  while (end < lines.length && lines[end].trim().startsWith("|")) end++;
  const header = splitRow(lines[start]);
  const aligns = splitRow(lines[start + 1]).map((c) => (/-:\s*$/.test(c) ? "right" : "left"));
  const rows = lines.slice(start + 2, end).map((l) => {
    const raw = splitRow(l);
    const nonEmpty = raw.filter((c) => c);
    const emphasis = nonEmpty.length > 0 && nonEmpty.every((c) => /^\*\*[\s\S]*\*\*$/.test(c));
    const cells = raw.map((c) => {
      const inner = emphasis && /^\*\*[\s\S]*\*\*$/.test(c) ? c.slice(2, -2) : c;
      return toPlainText(inner);
    });
    const row = { cells };
    if (emphasis) row.emphasis = true;
    return row;
  });
  return {
    before: toPlainText(lines.slice(0, start).join("\n")),
    columns: header.map((h, i) => ({ label: toPlainText(h), align: aligns[i] || "left" })),
    rows,
    after: toPlainText(lines.slice(end).join("\n"))
  };
}

function isTableStart(lines, i) {
  return lines[i].trim().startsWith("|") && lines[i + 1] !== undefined && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1]);
}

// Tabellenblöcke eines Markdown-Textes mit Kopfzeile, Ausrichtung und Zeilen.
function tableBlocks(md) {
  const lines = String(md).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isTableStart(lines, i)) continue;
    let end = i;
    while (end < lines.length && lines[end].trim().startsWith("|")) end++;
    blocks.push({
      start: i,
      end,
      header: splitRow(lines[i]),
      aligns: splitRow(lines[i + 1]).map((cell) => (/-:\s*$/.test(cell) ? "right" : "left")),
      rows: lines.slice(i + 2, end).map(splitRow)
    });
    i = end - 1;
  }
  return { lines, blocks };
}

function markdownTableCount(md) {
  return tableBlocks(md).blocks.length;
}

// Eine Nebentabelle als Textzeilen: zweispaltig als „Bezeichnung: Wert“.
function tableAsLines(block) {
  const clean = (cells) => cells.map((cell) => toPlainText(cell.replace(/^\*\*([\s\S]*)\*\*$/, "$1")));
  if (block.header.length === 2)
    return block.rows
      .map(clean)
      .map(([a, b]) => (a && b ? a + (/:$/.test(a) ? " " : ": ") + b : a || b))
      .filter(Boolean)
      .join("\n");
  const head = clean(block.header).filter(Boolean).join(" · ");
  const rows = block.rows.map((r) => clean(r).filter(Boolean).join(" · ")).filter(Boolean);
  return (head ? ["**" + head + "**"] : []).concat(rows).join("\n");
}

// Wandelt Markdown aus ScanReha-Materialien in das Textformat der Web-Aufgaben:
// Überschriften werden fett, Kursivschrift entfällt, Tabellen werden zu Zeilen.
function markdownToText(md) {
  const { lines, blocks } = tableBlocks(md);
  const parts = [];
  let pos = 0;
  blocks.forEach((b) => {
    parts.push(lines.slice(pos, b.start).join("\n"), tableAsLines(b));
    pos = b.end;
  });
  parts.push(lines.slice(pos).join("\n"));
  const text = parts
    .join("\n")
    .replace(/^#{1,6}\s+(.+?)\s*#*\s*$/gm, (m, h) => "**" + h.replace(/\*\*/g, "") + "**")
    .replace(/^(\s*)\*\s+/gm, "$1- ")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2");
  return toPlainText(text);
}

// Material mit mehreren Tabellen: Die erste Tabelle mit mehr als zwei Spalten
// (sonst die erste Tabelle) wird zur Materialtabelle, die übrigen zu Textzeilen.
function parseMaterialTables(md) {
  const { lines, blocks } = tableBlocks(md);
  if (!blocks.length) return null;
  const main = blocks.find((b) => b.header.length > 2) || blocks[0];
  const textOf = (from, to) => {
    const seg = [];
    let pos = from;
    blocks.forEach((b) => {
      if (b === main || b.start < from || b.end > to) return;
      seg.push(lines.slice(pos, b.start).join("\n"), tableAsLines(b));
      pos = b.end;
    });
    seg.push(lines.slice(pos, to).join("\n"));
    return markdownToText(seg.join("\n"));
  };
  const rows = main.rows.map((raw) => {
    const nonEmpty = raw.filter((cell) => cell);
    const emphasis = nonEmpty.length > 0 && nonEmpty.every((cell) => /^\*\*[\s\S]*\*\*$/.test(cell));
    const row = { cells: raw.map((cell) => toPlainText(emphasis && /^\*\*[\s\S]*\*\*$/.test(cell) ? cell.slice(2, -2) : cell)) };
    if (emphasis) row.emphasis = true;
    return row;
  });
  return {
    before: textOf(0, main.start),
    columns: main.header.map((h, i) => ({ label: toPlainText(h), align: main.aligns[i] || "left" })),
    rows,
    after: textOf(main.end, lines.length)
  };
}

class ToolError extends Error {}

module.exports = {
  ROOT,
  rel,
  readText,
  readJson,
  readJsonl,
  stableJson,
  writeIfChanged,
  sha256,
  listJson,
  parseArgs,
  decodeEntities,
  toPlainText,
  parseMarkdownTable,
  markdownTableCount,
  markdownToText,
  parseMaterialTables,
  ToolError
};

#!/usr/bin/env node
"use strict";
/*
 * Browserprüfung der kurzen Runde (optional, nicht Teil von npm test).
 * Benötigt Playwright mit Chromium; Playwright ist keine Projektabhängigkeit.
 *
 *   node tools/browserpruefung.js [--chromium <Pfad zur Chromium-Datei>]
 *
 * Playwright wird über require("playwright") gesucht, sonst über
 * PLAYWRIGHT_MODULE (Pfad zum Modul). Die Seiten werden über einen lokalen
 * Server und einmal direkt als Datei (file://) geöffnet.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const c = require("./lib/common");

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_MODULE, "playwright"].filter(Boolean);
  for (const m of candidates) {
    try {
      return require(m);
    } catch (e) {
      /* nächster Versuch */
    }
  }
  throw new c.ToolError("Playwright nicht gefunden. Installieren oder PLAYWRIGHT_MODULE setzen.");
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".ttf": "font/ttf", ".json": "application/json", ".md": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    const file = path.join(c.ROOT, url === "/" ? "index.html" : url);
    if (!file.startsWith(c.ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log((ok ? "ok   " : "FEHL ") + name + (detail && !ok ? " – " + detail : ""));
}

// Ansichten wechseln über hashchange, das der Browser asynchron auslöst.
async function view(page, name) {
  await page.waitForSelector("#ansicht-" + name + ":not([hidden])", { timeout: 5000 });
}

async function state(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("areha.v1") || "null"));
}

// Liefert die richtige oder eine falsche Antwort-ID der aktuell angezeigten Aufgabe.
async function answerIds(page) {
  return page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem("areha.v1"));
    const r = st.rounds.find((x) => x.id === st.active_round_id);
    const slot = r.slots[r.cursor];
    const task = window.AREHA_DATA.tasks.find((t) => t.id === slot.task_id);
    const wrongWithPath = (task.error_paths || []).map((p) => p.choice_ids[0]);
    return { taskId: task.id, type: task.response.type, right: task.solution.choice_ids, wrong: wrongWithPath };
  });
}

async function choose(page, ids) {
  for (const id of ids) await page.click(`#antwort label:has(input[value="${id}"])`);
}

// Rückblick einer übersprungenen Aufgabe der zuletzt abgeschlossenen Runde:
// gespeichertes Ergebnis, Rückmeldung, Lösungsmarkierung und Erklärung.
async function skippedReview(page, index) {
  return page.evaluate((i) => {
    const st = JSON.parse(localStorage.getItem("areha.v1"));
    const r = st.rounds[st.rounds.length - 1];
    const slot = r.slots[i];
    const task = window.AREHA_DATA.tasks.find((t) => t.id === slot.task_id);
    const fb = document.getElementById("rueckmeldung");
    const marked = [...document.querySelectorAll("#antwort .option.is-solution input")].map((x) => x.value).sort();
    return {
      stored: r.status === "completed" && slot.outcome === "skipped" && slot.result === null,
      status: fb.hidden ? "" : document.getElementById("rueckmeldung-status").textContent,
      solution: JSON.stringify(marked) === JSON.stringify(task.solution.choice_ids.slice().sort()),
      explanation: !fb.hidden && document.querySelector("#rueckmeldung .feedback-reason").textContent.trim().length > 0,
      noAnswer: document.querySelectorAll("#antwort input:checked, #antwort .option.is-right, #antwort .option.is-wrong").length === 0,
      readOnly: [...document.querySelectorAll("#antwort input")].every((x) => x.disabled)
    };
  }, index);
}

function reviewOk(rv) {
  return rv.stored && rv.status === "Übersprungen" && rv.solution && rv.explanation && rv.noAnswer && rv.readOnly;
}

// Die 50 bestehenden Regressionsfälle behalten ihren ursprünglichen Sechserbestand.
// Etappe 3 wird weiter unten separat mit jeder veröffentlichten Aufgabe geprüft.
async function firstPackage(context) {
  const ids = ["wiso-wegeunfall-heilkosten", "wiso-unfallstatistik-auswerten", "wwk-warenannahme-fahrer", "wwk-bezugspreis-rabatt-skonto", "verkauf-kaufentscheidung", "verkauf-sandwich-methode"];
  await context.route("**/data/aufgaben.js", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()) + "\nwindow.AREHA_DATA.tasks = window.AREHA_DATA.tasks.filter(t => " + JSON.stringify(ids) + ".includes(t.id)); window.AREHA_DATA.materials = window.AREHA_DATA.materials.filter(m => window.AREHA_DATA.tasks.some(t => t.materials.some(r => r.id === m.id))); window.AREHA_DATA.cases = [];" });
  });
}

async function openTask(page, base, taskId, kind) {
  await page.goto(base + "index.html");
  await page.evaluate(({id, kind}) => {
    const d = window.AREHA_DATA, A = window.Areha;
    const s = A.storage.emptyState();
    const r = A.rounds.createRound({ ...d, tasks: d.tasks.filter(t => t.id === id) }, s, { size: 1, kind: kind || 'short' });
    A.rounds.startRound(s, r);
    localStorage.setItem("areha.v1", JSON.stringify(s));
  }, {id:taskId, kind});
  await page.goto(base + "index.html#runde");
  await page.reload();
  await view(page, "runde");
}

async function solveTask(page, task) {
  if (task.solution.choice_ids) return choose(page, task.solution.choice_ids);
  if (task.solution.matches) {
    for (const pair of task.solution.matches) await page.selectOption('select[data-target-id="' + pair.target_id + '"]', pair.choice_id);
    return;
  }
  for (let target = 0; target < task.solution.ordered_entry_ids.length; target++) {
    const id = task.solution.ordered_entry_ids[target];
    let current = await page.$$eval('.order-list .order-row', (rows, id) => rows.findIndex(row => row.querySelector('button').dataset.entryId === id), id);
    while (current-- > target) await page.click('button[data-entry-id="' + id + '"][data-direction="-1"]');
  }
}

async function thirdPackage(browser, base) {
  const context = await browser.newContext({ viewport: { width: 320, height: 740 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + 'index.html');
  const tasks = await page.evaluate(() => window.AREHA_DATA.tasks);
  for (const task of tasks) {
    await openTask(page, base, task.id);
    check(task.id + ': noch keine Lösung sichtbar', !(await page.isVisible('#rueckmeldung')));
    const zooms = await page.$$('.material-zoom');
    for (const zoom of zooms) {
      await zoom.click();
      check(task.id + ': Material geöffnet', await page.isVisible('dialog[open]'));
      await page.keyboard.press('Escape');
      check(task.id + ': Rückkehr zur Materialschaltfläche', !(await page.isVisible('dialog[open]')) && await zoom.evaluate(e => e === document.activeElement));
    }
    await solveTask(page, task);
    await page.reload();
    await view(page, 'runde');
    check(task.id + ': Antwort nach Neuladen prüfbar', await page.getAttribute('#btn-haupt', 'aria-disabled') === 'false');
    await page.click('#btn-haupt');
    check(task.id + ': vollständig richtige Lösung', await page.textContent('#rueckmeldung-status') === 'Richtig');
    check(task.id + ': kein Seitenüberstand bei 320 px', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    await page.click('#btn-haupt');
    await view(page, 'abschluss');
    if (['matching', 'ordering'].includes(task.response.type)) {
      await openTask(page, base, task.id);
      await solveTask(page, task);
      await page.click('#btn-ueberspringen');
      await page.click('#btn-abschliessen');
      await view(page, 'abschluss');
      await page.click('#abschluss-liste button');
      await view(page, 'runde');
      check(task.id + ': übersprungen bleibt unbewertet mit Lösung',
        await page.textContent('#rueckmeldung-status') === 'Übersprungen' &&
        (task.response.type === 'matching' ? await page.locator('#antwort .match-result-answer').count() === task.response.targets.length : await page.isVisible('.feedback-solution')) &&
        await page.$$eval('#antwort select', xs => xs.every(x => x.disabled && !x.value)) &&
        await page.locator('#antwort .order-buttons').count() === 0);
      await openTask(page, base, task.id);
      await page.click('#btn-weiss-nicht');
      check(task.id + ': Lösung anzeigen zeigt Lösung', await page.textContent('#rueckmeldung-status') === 'Lösung angesehen' && (task.response.type === 'matching' ? await page.locator('#antwort .match-result-answer').count() === task.response.targets.length : await page.isVisible('.feedback-solution')));
    }
  }
  check('Etappe 3 ohne Laufzeitfehler', errors.length === 0, errors.join(' | '));
  await context.close();
}

async function fifthPackage(browser, base) {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 740 }, locale: 'de-DE' });
  const page = await ctx.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html');
  check('Etappe 5: neue Einstiege erreichbar', await page.isVisible('#btn-ohne-hilfe') && await page.isVisible('#btn-fortschritt') && await page.isVisible('#btn-lang-ueben'));
  check('leere Wiederholung verständlich deaktiviert', await page.isDisabled('#btn-wiederholen') && /Noch keine/.test(await page.textContent('#wiederholung-info')));
  await page.click('#btn-kurz-ueben'); await view(page,'runde');
  const marked=(await state(page)).rounds[0].slots[0].task_id;
  await page.click('#btn-merken');
  for(let i=0;i<3;i++) { await page.click('#btn-weiss-nicht'); await page.click('#btn-haupt'); }
  await view(page,'abschluss');
  const previous=JSON.stringify((await state(page)).rounds[0]);
  await page.click('#btn-zur-startseite');await view(page,'start');
  await page.click('#btn-wiederholen');await view(page,'runde');
  let s=await state(page);
  check('Wiederholung bildet eigenen Versuch aus erklärten/gemerkten Aufgaben', s.rounds[1].kind==='repeat' && s.rounds[1].slots.length===3 && s.rounds[1].slots.every(x=>s.rounds[0].slots.some(y=>y.task_id===x.task_id)) && s.bookmarks.includes(marked));
  await page.click('#btn-weiss-nicht');
  check('Wiederholung verändert den ursprünglichen Versuch nicht',JSON.stringify((await state(page)).rounds[0])===previous);
  await page.click('#btn-unterbrechen');await view(page,'start');
  await page.click('#btn-fortschritt');await view(page,'fortschritt');
  check('Fortschritt zeigt Bearbeitung und Merkliste',/Aufgaben bearbeitet/.test(await page.textContent('#fortschritt-bereiche')) && await page.locator('#merkliste button').count()===1);
  await page.click('#merkliste button');
  check('Merkung kann entfernt werden',!(await state(page)).bookmarks.includes(marked));

  // Eigener leerer Stand für Prüfungstraining, damit die Bearbeitung nachvollziehbar bleibt.
  await page.evaluate(()=>localStorage.clear());await page.goto(base+'index.html');
  await page.click('#btn-ohne-hilfe');await view(page,'runde');
  s=await state(page);let r=s.rounds[0];
  check('Prüfungstraining startet sechs Aufgaben mit neutraler Navigation',r.kind==='exam' && r.slots.length===6 && await page.locator('#schritte button').count()===6 && await page.locator('#schritte .step-ok, #schritte .step-wrong').count()===0);
  check('Prüfungstraining zeigt keine Hilfe, Lösung oder Sofortprüfung',!(await page.isVisible('#aktionen-neben')) && !(await page.isVisible('#rueckmeldung')) && !(await page.isVisible('#hilfe')) && await page.textContent('#btn-haupt')==='Weiter');
  const first=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('areha.v1'));const r=s.rounds[0];return window.AREHA_DATA.tasks.find(t=>t.id===r.slots[0].task_id);});
  await solveTask(page,first);
  const savedExamAnswer=JSON.stringify((await state(page)).rounds[0].slots[0].answer);
  check('Gewählte Prüfungsantwort bleibt unbewertet', (await state(page)).rounds[0].slots[0].result===null && !(await page.isVisible('#rueckmeldung')));
  await page.click('#btn-unterbrechen');await view(page,'start');await page.reload();await page.click('#btn-fortsetzen');await view(page,'runde');
  check('Prüfungstraining übersteht Unterbrechung und Neuladen ohne Lösung',JSON.stringify((await state(page)).rounds[0].slots[0].answer)===savedExamAnswer && !(await page.isVisible('#rueckmeldung')));
  await page.click(await page.isVisible('#btn-abgeben') ? '#btn-abgeben' : '#btn-haupt');
  check('Abgabe weist auf offene Antworten hin',/5 von 6/.test(await page.textContent('#abgabe-info')));
  await page.click('#btn-abgabe-nein');
  check('Abgabe abbrechen lässt Antworten bearbeitbar', (await state(page)).rounds[0].status==='active' && !(await page.isVisible('#abgabe-bestaetigen')));
  for (let i=1;i<=6;i++) {
    await page.click('#schritte li:nth-child('+i+') button');
    check('Prüfungsnavigation '+i+' ohne Seitenüberstand',await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  }
  await page.click(await page.isVisible('#btn-abgeben') ? '#btn-abgeben' : '#btn-haupt');await page.click('#btn-abgabe-ja');await view(page,'abschluss');
  check('Abgabe bewertet gemeinsam und weist fünf offene Antworten aus', /1 von 6 Aufgaben richtig gelöst; 5 nicht vollständig beantwortet/.test(await page.textContent('#abschluss-zusammenfassung')) && /Übungsbewertung: 1 von 6/.test(await page.textContent('#abschluss-zusammenfassung')));
  await page.click('#abschluss-liste li:nth-child(2) button');await view(page,'runde');
  check('Rückblick löst eine offene Prüfungsaufgabe erst nach Abgabe auf',await page.textContent('#rueckmeldung-status')==='Nicht vollständig beantwortet' && await page.isVisible('.feedback-solution') && !(await page.isVisible('#btn-abgeben')));
  await page.click('#btn-haupt');await view(page,'abschluss');await page.click('#btn-zur-startseite');await view(page,'start');
  await page.click('#btn-fortschritt');await view(page,'fortschritt');
  check('Selbstcheck erscheint im Verlauf',/Selbstcheck/.test(await page.textContent('#runden-verlauf')));

  const legacy={marks:{46:1},rounds:{main:{answers:{46:'A',99:'D'},checked:{46:1,99:1}}}};
  await page.evaluate(x=>localStorage.setItem('wiso40v2',JSON.stringify(x)),legacy);
  const original=await page.evaluate(()=>localStorage.getItem('wiso40v2'));
  await page.click('#btn-altbestand');
  check('Altdaten werden explizit übernommen und getrennt angezeigt',/2 frühere Einträge/.test(await page.textContent('#altbestand-meldung')) && /historische Fassung/.test(await page.textContent('#altbestand-liste')) && /Hilfen unbekannt/.test(await page.textContent('#altbestand-liste')));
  check('Altspeicher unverändert und erneuter Import gesperrt',original===await page.evaluate(()=>localStorage.getItem('wiso40v2')) && await page.isDisabled('#btn-altbestand'));
  await page.reload();await view(page,'fortschritt');
  check('Übernahme und Merkliste bleiben nach Neuladen erhalten',(await state(page)).legacy.entries.length===2 && (await state(page)).bookmarks.includes('wiso-wegeunfall-heilkosten'));
  await page.click('#btn-fortschritt-zurueck');await view(page,'start');
  await page.click('#themenwahl summary');await page.selectOption('#thema-bereich','wwk');await page.click('#btn-thema-start');await view(page,'runde');
  const theme=await state(page);
  check('Themenrunde begrenzt sich auf gewählten Fachbereich',theme.rounds[theme.rounds.length-1].slots.every(x=>x.task_id.startsWith('wwk-')));
  await page.evaluate(()=>localStorage.removeItem('areha.v1'));await page.goto(base+'index.html');
  await page.click('#btn-lang-ueben');await view(page,'runde');
  check('Längere Übungsrunde hat sechs Aufgaben mit Soforthilfe',(await state(page)).rounds[0].slots.length===6 && await page.isVisible('#btn-hilfe'));
  await page.click('#btn-unterbrechen');await view(page,'start');
  const beforeChange=JSON.stringify((await state(page)).rounds[0]);
  await page.click('#btn-ohne-hilfe');
  check('Moduswechsel aus offener Runde verlangt bewussten Abschluss',await page.isVisible('#neu-bestaetigen') && JSON.stringify((await state(page)).rounds[0])===beforeChange);
  await page.click('#btn-neu-nein');
  check('Abgebrochener Moduswechsel erhält die Runde',JSON.stringify((await state(page)).rounds[0])===beforeChange);
  await page.click('#btn-ohne-hilfe');await page.click('#btn-neu-ja');await view(page,'runde');
  const changedState=await state(page);
  check('Bestätigter Moduswechsel startet den gewählten Modus',changedState.rounds[0].status==='abandoned' && changedState.rounds[1].kind==='exam');

  const allTasks=await page.evaluate(()=>window.AREHA_DATA.tasks);
  for(const type of ['single_choice','multiple_choice','matching','ordering']) {
    const task=allTasks.find(t=>t.response.type===type);
    await openTask(page,base,task.id,'exam');
    await solveTask(page,task);
    const originalAnswer=JSON.stringify((await state(page)).rounds[0].slots[0].answer);
    if(type==='single_choice') await choose(page,[task.response.choices.find(c=>!task.solution.choice_ids.includes(c.id)).id]);
    if(type==='multiple_choice') await page.click('#antwort label:has(input[value="'+task.solution.choice_ids[0]+'"])');
    if(type==='matching') await page.locator('#antwort select').first().selectOption('');
    if(type==='ordering') await page.locator('.order-row').first().locator('button[data-direction="1"]').click();
    await page.reload();await view(page,'runde');
    check(type+': Prüfungsantwort vor Abgabe änderbar und gespeichert',JSON.stringify((await state(page)).rounds[0].slots[0].answer)!==originalAnswer && !(await page.isVisible('#rueckmeldung')));
    await page.click(await page.isVisible('#btn-abgeben') ? '#btn-abgeben' : '#btn-haupt');await page.click('#btn-abgabe-ja');await view(page,'abschluss');
    check(type+': geänderte Antwort erst bei Abgabe bewertet',(await state(page)).rounds[0].slots[0].result.score<1);
  }
  check('Etappe 5 ohne Laufzeitfehler',errors.length===0,errors.join(' | '));
  await ctx.close();
}


async function sixthPackage(browser, base) {
  const ctx=await browser.newContext({viewport:{width:320,height:740},locale:'de-DE'});
  const page=await ctx.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html');
  const data=await page.evaluate(()=>window.AREHA_DATA);
  check('Etappe 6: vollständiger Aufgabenbestand und alle Lernkerne geladen',data.tasks.length>=72 && data.units.length>=24 && !(await page.isVisible('#daten-fehler')));
  for(const unit of data.units){
    await page.evaluate(()=>localStorage.clear());await page.goto(base+'index.html');
    await page.locator('#themenwahl summary').click();
    await page.selectOption('#thema-bereich',unit.area);
    await page.selectOption('#thema-lernkern',unit.id);
    await page.click('#btn-thema-start');await view(page,'runde');
    const s=await state(page),r=s.rounds[0];
    check(unit.id+': über Themenwahl genau drei passende Aufgaben',r.slots.length===3 && r.slots.every(x=>data.tasks.find(t=>t.id===x.task_id).variant_group===unit.id));
  }
  for(const c of data.cases){
    await page.evaluate(()=>localStorage.clear());await page.goto(base+'index.html');
    await page.locator('#fallwahl summary').click();
    check(c.id+': Umfang vor Start sichtbar',(await page.textContent('[data-case-id="'+c.id+'"]')).includes('3 Aufgaben'));
    await page.click('[data-case-id="'+c.id+'"]');await view(page,'runde');
    let r=(await state(page)).rounds[0];
    check(c.id+': vorgegebene Reihenfolge und Falltitel',JSON.stringify(r.slots.map(s=>s.task_id))===JSON.stringify(c.task_ids) && (await page.textContent('#runde-art')).includes(c.title));
    for(let i=0;i<c.task_ids.length;i++){
      await solveTask(page,data.tasks.find(t=>t.id===c.task_ids[i]));
      if(i===1){
        await page.reload();await view(page,'runde');
        check(c.id+': Fall und Position nach Neuladen erhalten',(await state(page)).rounds[0].case_id===c.id && (await state(page)).rounds[0].cursor===1 && (await page.textContent('#runde-art')).includes(c.title));
      }
      await page.click('#btn-haupt');
      check(c.id+': Schritt '+(i+1)+' richtig und mobil lesbar',await page.textContent('#rueckmeldung-status')==='Richtig' && await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
      await page.click('#btn-haupt');
    }
    await view(page,'abschluss');
    check(c.id+': eigener Abschluss nach drei Aufgaben',(await page.textContent('#abschluss-zusammenfassung')).includes('3 von 3') && (await page.textContent('#abschluss-art')).includes(c.title));
  }
  await page.evaluate(()=>{
    const s=window.Areha.storage.emptyState();
    s.legacy={imported_at:'2026-09-20T10:00:00.000Z',entries:[{legacy_id:'wiso40v2:33',round_id:'main',answer:'C',checked:true,marked:true,task_id:null,task_revision:null,compatible:false,result:null},{legacy_id:'wiso40v2:106',round_id:'main',answer:'178,56',checked:true,marked:false,task_id:null,task_revision:null,compatible:false,result:null}]};
    localStorage.setItem('areha.v1',JSON.stringify(s));
    localStorage.setItem('wiso40v2','unveraenderter-alter-speicher');
  });
  await page.goto(base+'index.html#fortschritt');await page.reload();await view(page,'fortschritt');
  check('Früher importierte kompatible Antwort wird nach Inhaltsausbau zugeordnet',/Sparanteil.*richtig.*zugeordnet/.test(await page.textContent('#altbestand-liste')) && (await state(page)).bookmarks.includes('wiso-haushalt-sparanteil'));
  check('Umgestaltete Betragseingabe bleibt historisch und Altspeicher unverändert',/Abzug.*historische Fassung/.test(await page.textContent('#altbestand-liste')) && await page.evaluate(()=>localStorage.getItem('wiso40v2')==='unveraenderter-alter-speicher'));
  check('Etappe 6 ohne Laufzeitfehler',errors.length===0,errors.join(' | '));
  await ctx.close();
}

async function run(args) {
  const { chromium } = loadPlaywright();
  const server = await serve();
  const base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch(args.chromium ? { executablePath: args.chromium } : {});
  try {
    if (args.etappe6) {
      await thirdPackage(browser, base);
      await sixthPackage(browser, base);
      const failed=results.filter(r=>!r.ok).length;
      console.log('\n'+(results.length-failed)+' von '+results.length+' Prüfungen bestanden.');
      return failed;
    }
    if (args.etappe5) {
      await fifthPackage(browser, base);
      return results.filter(r=>!r.ok).length;
    }
    // ---------- A: vollständige Runde mit Unterbrechung durch Neuladen ----------
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, locale: "de-DE" });
    await firstPackage(ctx);
    const page = await ctx.newPage();
    const problems = [];
    page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(e.message));
    await page.goto(base + "index.html");
    check("Startseite zeigt „Kurz üben“ als Hauptaktion", await page.isVisible("#btn-kurz-ueben"));
    await page.click("#btn-kurz-ueben");
    await view(page, "runde");
    const areas = [];
    for (let i = 1; i <= 3; i++) {
      await page.click(`#schritte li:nth-child(${i}) button`);
      areas.push(await page.textContent("#aufgabe-bereich"));
    }
    check(
      "Runde hat drei Aufgaben aus drei Fachbereichen",
      ["Wirtschafts- und Sozialkunde", "Warenwirtschaft und Kalkulation", "Verkauf und Werbemaßnahmen"].every((a) => areas.some((x) => x.startsWith(a))),
      areas.join(" | ")
    );
    await page.click("#schritte li:nth-child(1) button");
    const blocked = await page.getAttribute("#btn-haupt", "aria-disabled");
    // aria-disabled sperrt nur scheinbar; der Klick liefert einen Hinweis (Playwright braucht force).
    await page.click("#btn-haupt", { force: true });
    check("„Prüfen“ ohne Antwort ist gesperrt und erklärt sich", blocked === "true" && /Wähle zuerst/.test(await page.textContent("#runde-meldung")));

    // Aufgabe 1: Hilfe, richtige Antwort
    await page.click("#btn-hilfe");
    check("Hilfe erscheint und erhält den Fokus", (await page.isVisible("#hilfe")) && (await page.evaluate(() => document.activeElement.id === "hilfe")));
    let a = await answerIds(page);
    await choose(page, a.right);
    await page.click("#btn-haupt");
    check("Rückmeldung „Richtig“ mit Hinweis auf Hilfe", /Richtig/.test(await page.textContent("#rueckmeldung-status")) && /Mit Unterstützung bearbeitet\./.test(await page.textContent("#rueckmeldung")));
    check("Rückmeldung erhält den Fokus", await page.evaluate(() => document.activeElement.id === "rueckmeldung"));
    check("ausführliche Erklärung ist zunächst zugeklappt", await page.evaluate(() => !document.querySelector(".feedback-more").open));

    // Aufgabe 2: Lösung anzeigen
    await page.click("#btn-haupt");
    await page.click("#btn-weiss-nicht");
    check("„Lösung anzeigen“ zeigt die Lösung", /Lösung angesehen/.test(await page.textContent("#rueckmeldung-status")) && (await page.$$("#antwort .option.is-solution")).length > 0);

    // Aufgabe 3: falsche Antwort wählen, dann Seite neu laden (Unterbrechung)
    await page.click("#btn-haupt");
    a = await answerIds(page);
    const wrongPick = a.type === "multiple_choice" ? [a.right[0], a.wrong[0]] : [a.wrong[0]];
    await choose(page, wrongPick);
    await page.goto(base + "index.html");
    await page.waitForSelector("#ansicht-start:not([hidden])");
    const resumeText = await page.textContent("#offene-runde-text");
    check("nach erneutem Öffnen: offene Runde mit Stand", (await page.isVisible("#btn-fortsetzen")) && /^2 von 3 Aufgaben erledigt · weiter mit Aufgabe 3$/.test(resumeText), resumeText);
    await page.click("#btn-fortsetzen");
    await view(page, "runde");
    const kept = await page.evaluate(() => [...document.querySelectorAll("#antwort input:checked")].map((i) => i.value));
    check("gewählte Antwort ist nach dem Neuladen erhalten", JSON.stringify(kept.sort()) === JSON.stringify(wrongPick.slice().sort()), kept.join());
    await page.click("#btn-haupt");
    const fb = await page.textContent("#rueckmeldung");
    check("Fehlweg-Erklärung „Zur gewählten Antwort“ erscheint", /Nicht richtig|Teilweise richtig/.test(fb) && /Zur gewählten Antwort/.test(fb));
    check("Hauptaktion ist jetzt „Runde abschließen“", (await page.textContent("#btn-haupt")) === "Runde abschließen");
    await page.click("#btn-haupt");
    await view(page, "abschluss");
    const summary = await page.textContent("#abschluss-zusammenfassung");
    const badges = await page.$$eval("#abschluss-liste .badge", (els) => els.map((e) => e.textContent));
    check("Abschluss: Zusammenfassung und Einordnung je Aufgabe", summary === "1 von 3 Aufgaben richtig gelöst, davon 1 mit Hilfe." && badges[0] === "Mit Hilfe richtig" && badges[1] === "Lösung angesehen" && badges[2] === "Nicht richtig", summary + " / " + badges.join(", "));

    await page.click("#abschluss-liste li:nth-child(3) button");
    await view(page, "runde");
    check("Rückblick zeigt die Aufgabe nur lesend", (await page.textContent("#runde-art")) === "Rückblick" && (await page.$$eval("#antwort input", (els) => els.every((e) => e.disabled))));
    await page.click("#btn-haupt");
    await view(page, "abschluss");
    check("Rückblick führt zur Übersicht zurück", await page.isVisible("#ansicht-abschluss") && (await page.evaluate(() => document.activeElement.closest("#abschluss-liste li:nth-child(3)") !== null)));

    const st1 = await state(page);
    check("Runde gespeichert: abgeschlossen, keine aktive Runde", st1.rounds.length === 1 && st1.rounds[0].status === "completed" && st1.active_round_id === null);
    check(
      "Vorgänge getrennt gespeichert",
      JSON.stringify(st1.rounds[0].slots.map((s) => s.events.map((e) => e.type))) === JSON.stringify([["help", "check"], ["dont_know"], ["check"]])
    );
    check("Speicherstand der bisherigen App wird nicht angelegt", (await page.evaluate(() => localStorage.getItem("wiso40v2"))) === null);

    await page.click("#btn-neue-runde");
    await view(page, "runde");
    const st2 = await state(page);
    const first = st2.rounds[0].slots.map((s) => s.task_id);
    const second = st2.rounds[1].slots.map((s) => s.task_id);
    check("neue Runde wiederholt keine Aufgabe der Vorrunde", second.every((id) => first.indexOf(id) === -1), second.join());

    // ---------- B: Unterbrechen per Schaltfläche, Browser-Zurück ----------
    // Aufgabe 1 der neuen Runde erledigen, dann unterbrechen: Fortsetzen führt zu Aufgabe 2.
    await page.click("#btn-weiss-nicht");
    await page.click("#btn-unterbrechen");
    await view(page, "start");
    check(
      "„Unterbrechen“ führt zur Startseite mit Hinweis und Stand",
      (await page.isVisible("#offene-runde")) && /Runde ist gespeichert/.test(await page.textContent("#start-meldung")) && (await page.textContent("#offene-runde-text")) === "1 von 3 Aufgaben erledigt · weiter mit Aufgabe 2"
    );
    await page.click("#btn-fortsetzen");
    await view(page, "runde");
    check("Fortsetzen öffnet die nächste offene Aufgabe", /Aufgabe 2 von 3/.test(await page.textContent("#runde-position")));
    await page.click("#btn-unterbrechen");
    await view(page, "start");
    await page.click("#btn-fortsetzen");
    await view(page, "runde");
    await page.goBack();
    await view(page, "start");
    check("Browser-Zurück führt aus der Runde zur Startseite", await page.isVisible("#ansicht-start"));

    // ---------- C: Überspringen und Abschluss mit übersprungener Aufgabe ----------
    await page.click("#btn-neu-statt");
    await page.click("#btn-neu-ja");
    await view(page, "runde");
    const st3 = await state(page);
    check("neue Runde beendet die offene als abgebrochen", st3.rounds[1].status === "abandoned" && st3.rounds[2].status === "active");
    await page.click("#btn-ueberspringen");
    check("Überspringen geht zur nächsten offenen Aufgabe", /Aufgabe 2 von 3/.test(await page.textContent("#runde-position")) && /übersprungen/.test(await page.textContent("#runde-meldung")));
    await page.click("#btn-weiss-nicht");
    await page.click("#btn-haupt");
    await page.click("#btn-weiss-nicht");
    check("übersprungene Aufgabe blockiert den Abschluss nicht", (await page.textContent("#btn-haupt")) === "Runde abschließen");
    await page.click("#schritte li:nth-child(1) button");
    check("übersprungene Aufgabe bleibt bearbeitbar", (await page.isVisible("#aufgabe-hinweis")) && !(await page.$eval("#antwort input", (e) => e.disabled)));
    await page.click("#btn-haupt");
    await view(page, "abschluss");
    const badges2 = await page.$$eval("#abschluss-liste .badge", (els) => els.map((e) => e.textContent));
    check("Abschluss weist die übersprungene Aufgabe aus", badges2[0] === "Übersprungen", badges2.join());
    await page.click("#abschluss-liste li:nth-child(1) button");
    await view(page, "runde");
    const rv1 = await skippedReview(page, 0);
    check("Rückblick zeigt bei übersprungener Aufgabe Lösung und Erklärung", reviewOk(rv1), JSON.stringify(rv1));
    await page.click("#btn-haupt");
    await view(page, "abschluss");

    // ---------- C2: alle Aufgaben vollständig markiert, dann übersprungen ----------
    await page.click("#btn-neue-runde");
    await view(page, "runde");
    for (let i = 0; i < 3; i++) {
      a = await answerIds(page);
      await choose(page, a.right);
      await page.click("#btn-ueberspringen");
    }
    const offers = [];
    for (let i = 1; i <= 3; i++) {
      await page.click(`#schritte li:nth-child(${i}) button`);
      offers.push((await page.textContent("#btn-haupt")) + ((await page.isVisible("#btn-abschliessen")) ? " + Runde abschließen" : ""));
    }
    check("markiert und übersprungen: „Prüfen“ und „Runde abschließen“ erreichbar", offers.every((o) => o === "Prüfen + Runde abschließen"), offers.join(" | "));
    await page.click("#btn-abschliessen");
    await view(page, "abschluss");
    const badges3 = await page.$$eval("#abschluss-liste .badge", (els) => els.map((e) => e.textContent));
    check("Runde mit ausschließlich übersprungenen Aufgaben abgeschlossen", badges3.length === 3 && badges3.every((b) => b === "Übersprungen"), badges3.join());
    await page.click("#abschluss-liste li:nth-child(2) button");
    await view(page, "runde");
    const rv2 = await skippedReview(page, 1);
    check("Rückblick zeigt die Lösung, nicht die ungeprüfte Markierung", reviewOk(rv2), JSON.stringify(rv2));
    await page.click("#btn-haupt");
    await view(page, "abschluss");

    // ---------- D: Mehrfachauswahl-Grenze ----------
    await page.evaluate(() => {
      const d = window.AREHA_DATA;
      const st = JSON.parse(localStorage.getItem("areha.v1"));
      const t = d.tasks.find((x) => x.response.type === "multiple_choice");
      st.rounds.push({ id: "r-test-multi", kind: "short", status: "active", created_at: new Date().toISOString(), cursor: 0, slots: [{ task_id: t.id, task_revision: t.revision, attempt: 1, order: t.response.choices.map((c) => c.id), answer: null, help_used: false, outcome: null, result: null, events: [] }] });
      st.active_round_id = "r-test-multi";
      localStorage.setItem("areha.v1", JSON.stringify(st));
    });
    await page.goto(base + "index.html#runde");
    await page.reload();
    await view(page, "runde");
    const opts = await page.$$eval("#antwort input", (els) => els.map((e) => e.value));
    await choose(page, opts.slice(0, 3));
    const checkedCount = await page.$$eval("#antwort input:checked", (els) => els.length);
    check("Mehrfachauswahl: höchstens zwei Markierungen, mit Hinweis", checkedCount === 2 && /höchstens 2/.test(await page.textContent("#runde-meldung")));
    check("Zähler zeigt „Gewählt: 2 von 2“", (await page.textContent(".options-counter")) === "Gewählt: 2 von 2");

    // ---------- E: Layout schmaler Bildschirm ----------
    for (const w of [320, 360]) {
      await page.setViewportSize({ width: w, height: 640 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check("kein waagerechtes Scrollen der Seite bei " + w + " px", overflow <= 0, "Überstand " + overflow + " px");
    }
    check("keine Konsolenfehler", problems.length === 0, problems.join(" | "));
    await ctx.close();

    // ---------- F: Tastaturbedienung ----------
    const kctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    await firstPackage(kctx);
    const kp = await kctx.newPage();
    await kp.goto(base + "index.html");
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      await kp.keyboard.press("Tab");
      found = await kp.evaluate(() => document.activeElement.id === "btn-kurz-ueben");
    }
    check("„Kurz üben“ per Tab erreichbar", found);
    await kp.keyboard.press("Enter");
    await view(kp, "runde");
    check("Aufgabentitel erhält beim Start den Fokus", await kp.evaluate(() => document.activeElement.id === "aufgabe-titel"));
    let onOption = false;
    for (let i = 0; i < 20 && !onOption; i++) {
      await kp.keyboard.press("Tab");
      onOption = await kp.evaluate(() => document.activeElement.classList.contains("option-input"));
    }
    await kp.keyboard.press("Space");
    // Mehrfachauswahl: jede Checkbox ist ein eigener Tab-Halt; weitere Antworten markieren.
    const need = await kp.evaluate(() => {
      const st = JSON.parse(localStorage.getItem("areha.v1"));
      const r = st.rounds.find((x) => x.id === st.active_round_id);
      const t = window.AREHA_DATA.tasks.find((x) => x.id === r.slots[r.cursor].task_id);
      return t.response.required_answers || 1;
    });
    for (let k = 1; k < need; k++) {
      await kp.keyboard.press("Tab");
      await kp.keyboard.press("Space");
    }
    let onMain = false;
    for (let i = 0; i < 20 && !onMain; i++) {
      await kp.keyboard.press("Tab");
      onMain = await kp.evaluate(() => document.activeElement.id === "btn-haupt");
    }
    await kp.keyboard.press("Enter");
    check("Antwort per Tastatur wählen und prüfen", onOption && onMain && (await kp.isVisible("#rueckmeldung")) && (await kp.evaluate(() => document.activeElement.id === "rueckmeldung")));
    await kctx.close();

    // ---------- G: bisherige App ----------
    const wctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const wp = await wctx.newPage();
    const wproblems = [];
    wp.on("pageerror", (e) => wproblems.push(e.message));
    wp.on("requestfailed", (r) => wproblems.push("Anfrage fehlgeschlagen: " + r.url()));
    await wp.goto(base + "wiso.html");
    await wp.waitForTimeout(300);
    const fontsOk = await wp.evaluate(async () => {
      await document.fonts.ready;
      return ["Bricolage", "Instrument", "DMMono"].every((f) => document.fonts.check("16px " + f));
    });
    check("bisherige App lädt ihre ausgelagerten Schriften", fontsOk);
    await wp.click('.ts.active .cc >> nth=1');
    const legacy = await wp.evaluate(() => JSON.parse(localStorage.getItem("wiso40v2") || "null"));
    check("bisherige App speichert weiter in wiso40v2", legacy && legacy.rounds && legacy.rounds.main && legacy.rounds.main.answers["1"] === "B");
    check("bisherige App ohne Laufzeitfehler", wproblems.length === 0, wproblems.join(" | "));
    await wctx.close();

    // ---------- H: direkt als Datei geöffnet ----------
    const fctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const fp = await fctx.newPage();
    const fproblems = [];
    fp.on("pageerror", (e) => fproblems.push(e.message));
    await fp.goto("file://" + path.join(c.ROOT, "index.html"));
    await fp.click("#btn-kurz-ueben");
    await view(fp, "runde").catch(() => {});
    check("als Datei (file://) geöffnet: Runde startet", (await fp.isVisible("#ansicht-runde")) && fproblems.length === 0, fproblems.join(" | "));
    await fctx.close();

    // ---------- I: Speicher voll während der Runde ----------
    const qctx = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const qp = await qctx.newPage();
    const qproblems = [];
    qp.on("pageerror", (e) => qproblems.push(e.message));
    await qp.goto(base + "index.html");
    await qp.click("#btn-kurz-ueben");
    await view(qp, "runde");
    // Ab hier schlägt das Schreiben des Übungsstands fehl, solange __speicherVoll gesetzt ist.
    await qp.evaluate(() => {
      const setItem = Storage.prototype.setItem;
      window.__speicherVoll = true;
      Storage.prototype.setItem = function (k, v) {
        if (window.__speicherVoll && k === "areha.v1") throw new DOMException("Speicher voll", "QuotaExceededError");
        return setItem.call(this, k, v);
      };
    });
    await qp.click("#btn-weiss-nicht");
    const qNotice = await qp.evaluate(() => {
      const n = document.getElementById("speicher-hinweis-runde");
      const b = n.getBoundingClientRect();
      return { text: n.textContent, inView: !n.hidden && b.height > 0 && b.top >= 0 && b.bottom <= window.innerHeight };
    });
    check("Speicherfehler erscheint in der Runde im sichtbaren Bereich", qNotice.inView && /voll/.test(qNotice.text), JSON.stringify(qNotice));
    const qOverflow = await qp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("kein waagerechtes Scrollen mit Speicherhinweis bei 320 px", qOverflow <= 0, "Überstand " + qOverflow + " px");
    await qp.click("#btn-unterbrechen");
    await view(qp, "start");
    const qMsg = await qp.textContent("#start-meldung");
    check("Unterbrechen meldet bei Speicherfehler keinen Erfolg", /nicht gespeichert/.test(qMsg) && !/Runde ist gespeichert/.test(qMsg) && (await qp.isVisible("#speicher-hinweis")), qMsg);
    // Speicher wieder frei: Fortsetzen speichert nach, der Hinweis verschwindet, Unterbrechen meldet Erfolg.
    await qp.evaluate(() => (window.__speicherVoll = false));
    await qp.click("#btn-fortsetzen");
    await view(qp, "runde");
    const qCleared = !(await qp.isVisible("#speicher-hinweis-runde"));
    await qp.click("#btn-unterbrechen");
    await view(qp, "start");
    const qSaved = await state(qp);
    check(
      "nach behobenem Fehler: Stand nachgespeichert, Erfolg gemeldet",
      qCleared && /Runde ist gespeichert/.test(await qp.textContent("#start-meldung")) && !(await qp.isVisible("#speicher-hinweis")) && qSaved.rounds[0].slots.some((s) => s.outcome === "dont_know")
    );
    await qp.click("#btn-fortsetzen");
    await view(qp, "runde");
    await qp.evaluate(() => (window.__speicherVoll = true));
    await qp.click("#btn-weiss-nicht");
    await qp.click("#btn-haupt");
    await qp.click("#btn-weiss-nicht");
    await qp.click("#btn-haupt");
    await view(qp, "abschluss");
    check("Speicherfehler erscheint auf der Abschlussseite", (await qp.isVisible("#speicher-hinweis-abschluss")) && /voll/.test(await qp.textContent("#speicher-hinweis-abschluss")));
    check("Speicherfehler ohne Laufzeitfehler", qproblems.length === 0, qproblems.join(" | "));
    await qctx.close();

    // ---------- J: Speichern im Browser gesperrt ----------
    const lctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
    await lctx.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("gesperrt", "SecurityError");
        }
      });
    });
    const lp = await lctx.newPage();
    await lp.goto(base + "index.html");
    const lStart = await lp.isVisible("#speicher-hinweis");
    await lp.click("#btn-kurz-ueben");
    await view(lp, "runde");
    const lRound = (await lp.isVisible("#speicher-hinweis-runde")) && /erlaubt kein Speichern/.test(await lp.textContent("#speicher-hinweis-runde"));
    await lp.click("#btn-unterbrechen");
    await view(lp, "start");
    check(
      "gesperrter Speicher: Hinweis auf Start und in der Runde, keine Erfolgsmeldung",
      lStart && lRound && /nicht gespeichert/.test(await lp.textContent("#start-meldung")) && (await lp.isVisible("#btn-fortsetzen"))
    );
    await lctx.close();
    await thirdPackage(browser, base);
    await fifthPackage(browser, base);
    await sixthPackage(browser, base);
  } finally {
    await browser.close();
    server.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log("\n" + (results.length - failed.length) + " von " + results.length + " Prüfungen bestanden.");
  return failed.length;
}

if (require.main === module) {
  run(c.parseArgs(process.argv.slice(2)))
    .then((failed) => (process.exitCode = failed ? 1 : 0))
    .catch((e) => {
      console.error(e instanceof c.ToolError ? e.message : e.stack);
      process.exitCode = 2;
    });
}

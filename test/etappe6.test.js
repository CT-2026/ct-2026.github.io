"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const build=require("../tools/build-data"),F=require("../js/format"),R=require("../js/rounds"),S=require("../js/storage"),L=require("../js/learning"),score=require("../js/scoring");
const result=build.build(),data=result.data,byId=Object.fromEntries(data.tasks.map(t=>[t.id,t]));
function correct(id){const t=byId[id];return t.response.choices.find(c=>t.solution.choice_ids.includes(c.id)).text;}
function value(id){return Number(correct(id).match(/[\d.]+(?:,\d+)?/)[0].replaceAll(".","").replace(",","."));}
// Die 72 Aufgaben aus Etappe 6; spätere Ausbauten ergänzen den Bestand, ohne ihn zu ersetzen.
const ETAPPE6=require("fs").readFileSync(__dirname+"/etappe6-aufgaben.txt","utf8").split(/\s+/).filter(Boolean);
test("Etappe 6: 72 Aufgaben und 24 Lernkerne bleiben erhalten, jeder Lernkern hat mindestens drei Aufgaben",()=>{
 assert.deepEqual(result.errors,[]);assert.equal(ETAPPE6.length,72);
 for(const id of ETAPPE6)assert.ok(byId[id],id);
 const etappeUnits=new Set(ETAPPE6.map(id=>byId[id].variant_group));assert.equal(etappeUnits.size,24);
 for(const u of etappeUnits)assert.ok(data.units.some(x=>x.id===u),u);
 for(const area of data.areas)assert.equal(ETAPPE6.filter(id=>byId[id].area===area.id).length,24);
 for(const u of data.units)assert.ok(data.tasks.filter(t=>t.variant_group===u.id&&t.area===u.area).length>=3,u.id);
 assert.equal(data.cases.length,3);assert.equal(data.legacy_tasks.length,11);
});
test("Etappe 6: jeder Lernkern ist als eigene Dreier-Runde erreichbar",()=>{
 for(const unit of data.units){
  const r=R.createRound(data,S.emptyState(),{kind:"theme",area:unit.area,unit:unit.id});
  assert.equal(r.slots.length,3,unit.id);assert.ok(r.slots.every(s=>byId[s.task_id].variant_group===unit.id));
 }
 assert.equal(R.createRound(data,S.emptyState(),{unit:"unbekannt"}),null);
 assert.equal(R.createRound(data,S.emptyState(),{area:"wiso",unit:"wwk.kasse"}),null);
});
test("Etappe 6: Fälle behalten Reihenfolge, Platzanzahl und Identität beim Fortsetzen",()=>{
 for(const c of data.cases){
  let s=S.emptyState();const r=R.createRound(data,s,{kind:"case",caseId:c.id,size:1});
  R.startRound(s,r);assert.deepEqual(r.slots.map(x=>x.task_id),c.task_ids);
  R.setAnswer(r,0,byId[c.task_ids[0]].solution,data);R.checkSlot(r,0,data);
  const other=JSON.stringify(r.slots[0]);r.cursor=1;
  s=S.sanitizeState(JSON.parse(JSON.stringify(s)));const restored=R.activeRound(s);
  assert.equal(restored.case_id,c.id);assert.equal(restored.cursor,1);assert.equal(JSON.stringify(restored.slots[0]),other);
  for(let i=1;i<restored.slots.length;i++){R.setAnswer(restored,i,byId[restored.slots[i].task_id].solution,data);R.checkSlot(restored,i,data);}
  assert.equal(R.completeRound(s,restored),true);assert.ok(restored.slots.every(x=>x.result.score===1));
 }
 assert.deepEqual(R.selectTasks(data,[],{caseId:"fehlt"}),[]);
 assert.deepEqual(R.selectTasks(data,[],{caseId:data.cases[0].id,types:["ordering"]}),[]);
 assert.equal(R.createRound(data,S.emptyState()).slots.length,3);
});
test("Etappe 6: ungültige Fallverweise und Voraussetzungen werden abgewiesen",()=>{
 const d=structuredClone(data);d.cases[0].task_ids[1]="fehlt";
 assert.match(F.validateData(d).join(),/unbekannte Aufgabe/);
 d.cases[0].task_ids=[d.cases[0].task_ids[0],d.cases[0].task_ids[0]];
 assert.match(F.validateData(d).join(),/verschiedene Aufgaben/);
 const e=structuredClone(data);const ids=e.cases[0].task_ids;e.tasks.find(t=>t.id===ids[0]).requires=[ids[1]];
 assert.match(F.validateData(e).join(),/Voraussetzung muss vor/);
 const f=structuredClone(data);f.units[0].area="falsch";assert.match(F.validateData(f).join(),/Fachbereich/);
});
test("Etappe 6: neue Rechenaufgaben stimmen mit unabhängigen Rechnungen überein",()=>{
 const expected={
 "wiso-haushalt-sparanteil":(2000-1700)/2000*100,
 "wiso-haushalt-beitrag":1920*93/1000,
 "wiso-haushalt-budget":1850-1050-520-180,
 "wiso-ergebnis-gewinn":180860+125030-266800,
 "wiso-ergebnis-verlust":51500-48000,
 "wiso-ergebnis-kosten":30000-(26000-1200),
 "wiso-preisbildung-ueberhang":120-80,
 "wwk-bestellen-meldebestand":6*4+8,
 "wwk-bestellen-menge":80-32,
 "wwk-bestellen-kartons":(80-32)/12,
 "wwk-bestand-buchung":120+48-95,
 "wwk-bestand-differenz":73-70,
 "wwk-lagerkennzahlen-durchschnitt":(200+100)/2,
 "wwk-lagerkennzahlen-umschlag":900/150,
 "wwk-lagerkennzahlen-dauer":360/(900/150),
 "wwk-verkaufspreis-brutto":40*1.19,
 "wwk-verkaufspreis-handelsspanne":(50-35)/50*100,
 "wwk-verkaufspreis-rabatt":80*(1-0.15),
 "wwk-vergleich-stueck":68/8,
 "wwk-vergleich-gesamt":24/8*68+12,
 "wwk-vergleich-entscheidung":(24/6*54+6)-(24/8*68+12),
 "wwk-kasse-rechnung":6*4.99,
 "wwk-kasse-wechselgeld":50-29.94,
 "wwk-kasse-sollbestand":150+420-35,
 "verkauf-aktion-quote":60/240*100,
 "verkauf-aktion-bon":1080/60
 };
 for(const [id,n]of Object.entries(expected))assert.equal(Math.round(value(id)*100),Math.round(n*100),id);
 const t=byId["verkauf-aktion-aussage"];assert.deepEqual(t.solution.choice_ids,["choice-1","choice-3"]);
 assert.equal(1080-800,280);assert.match(t.detailed_explanation,/Warenkosten/);
});
test("Etappe 6: neue Altzuordnungen und umgearbeitete Zahlenantworten bleiben getrennt",()=>{
 const raw={marks:{33:true,106:true},rounds:{main:{answers:{33:"C",106:"178,56",60:"B",39:"D"},checked:{33:true,106:true,60:true,39:true}}}};
 const source=JSON.stringify(raw),s=S.emptyState();
 assert.equal(L.importLegacy(s,raw,data).ok,true);
 const entries=Object.fromEntries(s.legacy.entries.map(e=>[e.legacy_id,e]));
 assert.equal(entries["wiso40v2:33"].compatible,true);assert.equal(entries["wiso40v2:33"].result.score,1);
 for(const id of [106,60,39]){assert.equal(entries["wiso40v2:"+id].compatible,false);assert.equal(entries["wiso40v2:"+id].result,null);}
 assert.equal(entries["wiso40v2:106"].answer,"178,56");assert.deepEqual(s.bookmarks,["wiso-haushalt-sparanteil"]);
 assert.equal(JSON.stringify(raw),source);assert.ok(L.progress(s,data).every(p=>p.done===0));
});
test("Etappe 6: vor dem Ausbau importierte Rohantworten erhalten neue explizite Zuordnungen",()=>{
 const old={...data,tasks:data.tasks.filter(t=>t.id==="wiso-wegeunfall-heilkosten"),legacy_tasks:data.legacy_tasks.filter(t=>t.legacy_id==="wiso40v2:46")};
 const s=S.emptyState();L.importLegacy(s,{marks:{33:true},rounds:{main:{answers:{33:"C",106:"178,56"},checked:{33:true,106:true}}}},old);
 assert.ok(s.legacy.entries.every(e=>!e.task_id));const date=s.legacy.imported_at;
 assert.equal(L.refreshLegacy(s,data),true);assert.equal(s.legacy.imported_at,date);
 assert.equal(s.legacy.entries.find(e=>e.legacy_id==="wiso40v2:33").result.score,1);
 assert.equal(s.legacy.entries.find(e=>e.legacy_id==="wiso40v2:106").compatible,false);
 s.bookmarks=[];assert.equal(L.refreshLegacy(s,data),false);assert.deepEqual(s.bookmarks,[]);
});


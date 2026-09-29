"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rounds.js');
const S = require('../js/storage.js');
const L = require('../js/learning.js');
const data = require('../tools/build-data.js').build().data;
const task = data.tasks.find(t => t.id === 'wiso-wegeunfall-heilkosten');
function start(state, opts) { const r=R.createRound(data,state,opts);R.startRound(state,r);return r; }
function answer(r, i) { return data.tasks.find(t=>t.id===r.slots[i].task_id).solution; }

test('Prüfungstraining: sechs gemischte Aufgaben, vor Abgabe keine Einzelwertung oder Hilfe', () => {
  const s=S.emptyState(),r=start(s,{kind:'exam',size:6});
  assert.equal(r.slots.length,6);
  assert.equal(new Set(r.slots.map(x=>data.tasks.find(t=>t.id===x.task_id).area)).size,3);
  R.setAnswer(r,0,answer(r,0),data);
  assert.equal(R.checkSlot(r,0,data),null);
  assert.equal(R.useHelp(r,0,data),false);
  assert.equal(R.dontKnow(r,0),false);
  assert.equal(R.completeRound(s,r),false);
  assert.equal(r.slots[0].result,null);
  R.setAnswer(r,0,null,data);
  assert.equal(r.slots[0].answer,null);
  assert.equal(L.progress(s,data).reduce((n,x)=>n+x.done,0),0);
});

test('Abgabe mit offenen Antworten wertet erst am Ende aus und lässt andere Versuche unverändert', () => {
  const s=S.emptyState(),old=start(s,{size:3});
  old.slots.forEach((_,i)=>R.dontKnow(old,i));R.completeRound(s,old);
  const before=JSON.stringify(old),r=start(s,{kind:'exam',size:6});
  R.setAnswer(r,0,answer(r,0),data);
  assert.equal(R.submitExam(s,r,data),true);
  assert.equal(r.slots[0].result.score,1);
  assert.equal(R.summarize(r).counts.unanswered,5);
  assert.equal(R.setAnswer(r,0,null,data),false);
  assert.equal(R.submitExam(s,r,data),false);
  assert.equal(JSON.stringify(old),before);
  assert.equal(s.active_round_id,null);
});

test('Teilweise ausgefüllte Zuordnung wird als offen mit anteiliger Übungswertung ausgewiesen', () => {
  const t=data.tasks.find(x=>x.response.type==='matching'),s=S.emptyState();
  const r=start(s,{kind:'exam',taskIds:[t.id],size:1});
  R.setAnswer(r,0,{matches:[t.solution.matches[0]]},data);
  R.submitExam(s,r,data);
  assert.equal(r.slots[0].outcome,'unanswered');
  assert.equal(r.slots[0].result.score,1/t.solution.matches.length);
});

test('Überspringen, Lösungsansicht und Merken erzeugen keine Fehlerwiederholung', () => {
  const s=S.emptyState(),r=start(s,{size:3});
  R.skipSlot(r,0);R.dontKnow(r,1);R.setAnswer(r,2,answer(r,2),data);R.checkSlot(r,2,data);R.completeRound(s,r);
  s.bookmarks.push(r.slots[0].task_id);
  assert.deepEqual(L.repeatIds(s,data),[]);
  assert.equal(R.createRound(data,s,{kind:'repeat',taskIds:[],size:3}),null);
});

test('Wiederholung endet bei neuer richtiger Lösung, Merken bleibt unabhängig bestehen', () => {
  const s=S.emptyState(),r=start(s,{taskIds:[task.id],size:1});
  R.setAnswer(r,0,{choice_ids:['A']},data);R.checkSlot(r,0,data);R.completeRound(s,r);
  assert.deepEqual(L.repeatIds(s,data),[task.id]);
  const next=start(s,{taskIds:[task.id],size:1});R.setAnswer(next,0,task.solution,data);R.checkSlot(next,0,data);R.completeRound(s,next);
  assert.deepEqual(L.repeatIds(s,data),[]);
  s.bookmarks.push(task.id);assert.deepEqual(L.repeatIds(s,data),[]);
  const p=L.progress(s,data).find(x=>x.id===task.area);assert.equal(p.alone,1);assert.equal(p.done,1);
});

test('Speicher erhält Prüfungstraining, unvollständige Ergebnisse und Merkliste; alte v1-Stände bleiben lesbar', () => {
  const s=S.emptyState(),r=start(s,{kind:'exam',size:6});s.bookmarks.push(task.id);
  R.setAnswer(r,0,answer(r,0),data);
  const loaded=S.sanitizeState(JSON.parse(JSON.stringify(s)));
  assert.equal(loaded.rounds[0].kind,'exam');assert.deepEqual(loaded.rounds[0].slots[0].answer,r.slots[0].answer);
  R.submitExam(loaded,loaded.rounds[0],data);
  const done=S.sanitizeState(loaded);assert.equal(R.summarize(done.rounds[0]).counts.unanswered,5);assert.deepEqual(done.bookmarks,[task.id]);
  assert.deepEqual(S.sanitizeState({version:1,rounds:[],active_round_id:null}).bookmarks,[]);
});

test('Altdaten: nur explizite Zuordnung, andere Ergebnisse historisch, keine Aussage zu Selbstständigkeit', () => {
  const raw={marks:{46:1},rounds:{main:{answers:{46:'C',99:'A'},checked:{46:1,99:1}}}};
  const before=JSON.stringify(raw),s=S.emptyState(),result=L.importLegacy(s,raw,data);
  assert.equal(result.mapped,1);assert.equal(result.total,2);
  assert.equal(s.legacy.entries.find(x=>x.legacy_id==='wiso40v2:46').result.score,1);
  assert.equal(s.legacy.entries.find(x=>x.legacy_id==='wiso40v2:99').task_id,null);
  assert.deepEqual(s.bookmarks,[task.id]);
  assert.equal(L.progress(s,data).reduce((n,x)=>n+x.alone,0),0);
  assert.equal(JSON.stringify(raw),before);
  assert.equal(L.importLegacy(s,raw,data).reason,'already');
  assert.equal(S.sanitizeState(s).legacy.entries.length,2);
});

test('Alte falsche Antwort kann wiederholt werden; geänderte Antwortstruktur bleibt historische Angabe', () => {
  const raw={rounds:{main:{answers:{46:'A'},checked:{46:1}}}},s=S.emptyState();
  L.importLegacy(s,raw,data);assert.deepEqual(L.repeatIds(s,data),[task.id]);
  const changed=JSON.parse(JSON.stringify(data));changed.tasks.find(t=>t.id===task.id).response.choices[0].text='Neu';
  const other=S.emptyState();L.importLegacy(other,raw,changed);
  assert.equal(other.legacy.entries[0].compatible,false);assert.equal(other.legacy.entries[0].result,null);
  assert.deepEqual(L.repeatIds(other,changed),[]);
});

test('Ein Fehler bleibt bis zur nächsten richtigen Antwort in der Wiederholung', () => {
  const s=S.emptyState(),r=start(s,{taskIds:[task.id],size:1});
  R.setAnswer(r,0,{choice_ids:['A']},data);R.checkSlot(r,0,data);R.completeRound(s,r);
  for(const action of [R.skipSlot,R.dontKnow]) {
    const next=start(s,{taskIds:[task.id],size:1});action(next,0);R.completeRound(s,next);
    assert.deepEqual(L.repeatIds(s,data),[task.id]);
  }
  const next=start(s,{taskIds:[task.id],size:1});R.setAnswer(next,0,task.solution,data);R.checkSlot(next,0,data);R.completeRound(s,next);
  assert.deepEqual(L.repeatIds(s,data),[]);
});
test('Teilweise falsche Antworten werden gezielt wiederholt', () => {
  const item=data.tasks.find(x=>x.response.type==='matching'),s=S.emptyState();
  const r=start(s,{taskIds:[item.id],size:1}),matches=structuredClone(item.solution.matches);
  const tmp=matches[0].choice_id;matches[0].choice_id=matches[1].choice_id;matches[1].choice_id=tmp;
  R.setAnswer(r,0,{matches},data);R.checkSlot(r,0,data);R.completeRound(s,r);
  assert.ok(r.slots[0].result.score<1);assert.deepEqual(L.repeatIds(s,data),[item.id]);
});
test('Wiederholung fügt keine anderen Voraussetzungsschritte hinzu', () => {
  const sample=structuredClone(data),item=sample.tasks[1];item.requires=[sample.tasks[0].id];
  const r=R.createRound(sample,S.emptyState(),{kind:'repeat',taskIds:[item.id],size:3});
  assert.deepEqual(r.slots.map(x=>x.task_id),[item.id]);
});

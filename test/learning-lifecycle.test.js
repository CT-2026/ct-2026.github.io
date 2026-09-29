
"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),path=require("node:path");
const S=require("../js/storage"),R=require("../js/rounds"),L=require("../js/learning"),C=require("../js/scoring");
const data=require("../tools/build-data").readPublished(path.join(__dirname,"../data/aufgaben.js"));
function memory(initial) {
  const map=new Map(Object.entries(initial||{}));
  return {map,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
}
function wrong(t) {
  const sol=structuredClone(t.solution),response=t.response;
  if(response.type==="single_choice"||response.type==="multiple_choice"){
    sol.choice_ids[0]=response.choices.find(c=>!t.solution.choice_ids.includes(c.id)).id;
  }else if(response.type==="ordering"){
    [sol.ordered_entry_ids[0],sol.ordered_entry_ids[1]]=[sol.ordered_entry_ids[1],sol.ordered_entry_ids[0]];
  }else{
    const first=sol.matches[0],other=sol.matches.find(p=>p.choice_id!==first.choice_id);
    if(other)[first.choice_id,other.choice_id]=[other.choice_id,first.choice_id];
    else first.choice_id=response.choices.find(c=>c.id!==first.choice_id).id;
  }
  assert.ok(C.isComplete(t,sol),t.id+" vollständige falsche Antwort");
  assert.ok(C.evaluate(t,sol).score<1,t.id+" falsche Antwort");
  return sol;
}
function begin(s,t,kind="short") {
  const r=R.createRound(data,s,{kind,taskIds:[t.id],size:1});assert.ok(r);R.startRound(s,r);return r;
}
function checked(s,t,answer,kind="short",help=false) {
  const r=begin(s,t,kind);if(help)R.useHelp(r,0,data);
  R.setAnswer(r,0,answer,data);assert.ok(R.checkSlot(r,0,data));return r;
}
function finish(s,r,store){assert.equal(R.completeRound(s,r),true);if(store)assert.equal(store.save(s).ok,true);}
const first=data.tasks.find(t=>t.response.type==="single_choice");
const other=data.tasks.find(t=>t.response.type==="single_choice"&&t.id!==first.id);

test("Alle Aufgaben: falsch → richtig mit Hilfe → erneut falsch, sofort und nach Neuladen",()=>{
  for(const t of data.tasks){
    let s=S.emptyState();const store=S.createStore(memory());
    const r=checked(s,t,wrong(t));assert.deepEqual(L.repeatIds(s,data),[t.id],t.id);
    finish(s,r,store);s=store.load().state;
    const corrected=checked(s,t,t.solution,"repeat",true);
    assert.deepEqual(L.repeatIds(s,data),[],t.id+" sofort entfernt");
    finish(s,corrected,store);s=store.load().state;
    assert.deepEqual(L.repeatIds(s,data),[],t.id+" nach Laden entfernt");
    s.bookmarks.push(t.id);assert.deepEqual(L.repeatIds(s,data),[]);
    const again=checked(s,t,wrong(t));assert.deepEqual(L.repeatIds(s,data),[t.id]);finish(s,again,store);
  }
});

test("Ungeprüfte Antworten, Überspringen und Lösungsansicht verändern ein richtiges Ergebnis nicht",()=>{
  const s=S.emptyState();finish(s,checked(s,first,first.solution));
  for(const action of ["unanswered","skip","seen"]){
    const r=begin(s,first);R.setAnswer(r,0,wrong(first),data);
    if(action==="skip")R.skipSlot(r,0);
    if(action==="seen")R.dontKnow(r,0);
    assert.deepEqual(L.repeatIds(s,data),[]);
    const p=L.progress(s,data).find(p=>p.id===first.area);assert.equal(p.alone,1);assert.equal(p.repeat,0);
  }
});

test("Geprüfte Antworten zählen auch bei Unterbrechung oder Abbruch; unvollständige nicht",()=>{
  const s=S.emptyState(),r=checked(s,first,wrong(first));
  R.abandonActive(s);assert.deepEqual(L.repeatIds(s,data),[first.id]);
  const next=begin(s,first);R.setAnswer(next,0,null,data);
  assert.equal(R.checkSlot(next,0,data),null);assert.deepEqual(L.repeatIds(s,data),[first.id]);
  R.setAnswer(next,0,first.solution,data);R.checkSlot(next,0,data);R.abandonActive(s);
  assert.deepEqual(L.repeatIds(s,data),[]);
});

test("Ungeloester Fehler und Korrektur bleiben nach jeweils mehr als 200 Runden erhalten",()=>{
  let s=S.emptyState();const backend=memory(),store=S.createStore(backend);
  finish(s,checked(s,first,wrong(first)),store);
  for(let i=0;i<S.MAX_ROUNDS+2;i++)finish(s,checked(s,other,other.solution),store);
  s=store.load().state;assert.equal(s.rounds.length,S.MAX_ROUNDS);
  assert.deepEqual(L.repeatIds(s,data),[first.id]);
  assert.equal(L.progress(s,data).find(p=>p.id===first.area).repeat,1);
  finish(s,checked(s,first,first.solution,"repeat"),store);
  // Ein früherer importierter Fehler darf eine spätere Korrektur nicht wieder verdrängen.
  s.legacy={imported_at:new Date().toISOString(),entries:[{legacy_id:"alt",round_id:"alt",task_id:first.id,task_revision:first.revision,compatible:true,checked:true,result:{score:0,status:"wrong"}}]};
  for(let i=0;i<S.MAX_ROUNDS+2;i++)finish(s,checked(s,other,other.solution),store);
  s=store.load().state;assert.deepEqual(L.repeatIds(s,data),[]);
  assert.equal(L.latest(s,data)[first.id].result.score,1);
  const changed=structuredClone(data);changed.tasks.find(t=>t.id===first.id).revision++;
  assert.equal(L.latest(s,changed)[first.id],undefined);
  assert.deepEqual(L.repeatIds(s,changed),[]);
});

test("Reset löscht Lernstand, Defektsicherung und Probe; fremde Daten bleiben erhalten",()=>{
  const backend=memory({[S.KEY]:"kaputt",[S.BACKUP_KEY]:"Sicherung",[S.KEY+".probe"]:"1",fremd:"behalten"});
  const store=S.createStore(backend);assert.equal(store.load().problem,"corrupt");
  assert.deepEqual(store.reset(),{ok:true});assert.deepEqual([...backend.map],[["fremd","behalten"]]);
  assert.deepEqual(store.load(),{state:S.emptyState(),problem:null});
  assert.deepEqual(store.reset(),{ok:true});
});

test("Reset funktioniert auch bei vollem Speicher ohne Schreibzugriff",()=>{
  const backend=memory({[S.KEY]:"defekt"});
  backend.setItem=()=>{const e=new Error("voll");e.name="QuotaExceededError";throw e;};
  assert.equal(S.browserBackend({localStorage:backend}),backend);
  const store=S.createStore(backend);
  assert.equal(store.save(S.emptyState()).reason,"quota");
  assert.deepEqual(store.reset(),{ok:true});assert.equal(backend.getItem(S.KEY),null);
});

test("Fehlgeschlagener Reset meldet keinen Erfolg und bewahrt den Zustand",()=>{
  const backend=memory({[S.KEY]:"vorhanden"});backend.removeItem=()=>{throw new Error("gesperrt");};
  assert.deepEqual(S.createStore(backend).reset(),{ok:false,reason:"error"});
  assert.equal(backend.getItem(S.KEY),"vorhanden");
  assert.deepEqual(S.createStore(null).reset(),{ok:false,reason:"unavailable"});
});

test("Defekte Struktur, ungültige Ergebnisse und widersprüchliche Statuswerte",()=>{
  for(const value of ["{kaputt","null",'{"version":1,"rounds":{}}']){
    const store=S.createStore(memory({[S.KEY]:value}));assert.equal(store.load().problem,"corrupt");
    assert.equal(store.reset().ok,true);assert.deepEqual(store.load().state,S.emptyState());
  }
  const s=S.emptyState(),r=checked(s,first,wrong(first));r.slots[0].result={score:0,status:"correct"};
  assert.equal(S.sanitizeState(s).rounds[0].slots[0].result.status,"wrong");
  r.slots[0].result.score=NaN;assert.equal(S.sanitizeState(s).rounds.length,0);
  r.slots[0].result.score=Infinity;assert.equal(S.sanitizeState(s).rounds.length,0);
});

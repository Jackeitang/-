import assert from 'node:assert/strict';
import {getPetProgress,practiceCompleted} from '../public/pet-progress.js';
const date='2026-11-07';
const records=['口语','听力','写作','阅读'].map((type,i)=>({type,xp:i===2?25:20,id:'activity-'+i,date}));
let p=getPetProgress([],date);
assert.equal(p.level,1);assert.equal(p.toNext,100);assert.equal(p.done.size,0);
p=getPetProgress(records.slice(0,3),date);
assert.equal(p.totalXP,65);assert.equal(p.fullDays,0);assert.equal(p.done.size,3);
p=getPetProgress(records,date);
assert.equal(p.totalXP,100);assert.equal(p.level,2);assert.equal(p.intoLevel,0);assert.equal(p.fullDays,1);
// Daily bonus is once per date, even with more speaking practice or duplicate records.
assert.equal(getPetProgress([...records,...records],date).totalXP,100);
assert.equal(getPetProgress([...records,{type:'口语',xp:20,id:'new-session',date}],date).totalXP,120);
// Existing learning history migrates automatically; tomorrow resets tasks, not XP.
p=getPetProgress(records,'2026-11-08');assert.equal(p.done.size,0);assert.equal(p.totalXP,100);
const tomorrow=records.map(r=>({...r,date:'2026-11-08'}));
p=getPetProgress([...records,...tomorrow],'2026-11-08');assert.equal(p.totalXP,200);assert.equal(p.fullDays,2);
assert.equal(practiceCompleted(records,'activity-1',date),true);
assert.equal(practiceCompleted(records,'activity-1','2026-11-08'),false);
// Stable tier boundaries and defensive handling of malformed stored records.
assert.equal(getPetProgress([{type:'口语',id:'old',date,xp:399}],date).stage,'幼芽伙伴');
assert.equal(getPetProgress([{type:'口语',id:'old',date,xp:400}],date).stage,'森林学徒');
assert.equal(getPetProgress([{type:'口语',id:'old',date,xp:900}],date).stage,'星光伙伴');
assert.equal(getPetProgress([null,{type:'未知',date,xp:999},{type:'口语',date,xp:NaN}],date).totalXP,0);
console.log('PASS pet: history migration, four activities, daily bonus deduplication, daily reset, repeat next day, level and visual tiers');

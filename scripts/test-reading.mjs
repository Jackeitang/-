import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const source=await fs.readFile('dist/server/index.js','utf8');const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));const data=new Map();const env={BUCKET:{get:async key=>data.has(key)?{json:async()=>JSON.parse(data.get(key))}:null,put:async(key,value)=>data.set(key,value)}};const root='https://reading.test';
const get=()=>worker.fetch(new Request(root+'/api/reading'),env);let res=await get();assert.equal(res.status,200);const seed=(await res.json()).article;
seed.date=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});seed.updatedAt=new Date().toISOString();
const put=(article,origin)=>worker.fetch(new Request(root+'/api/reading',{method:'PUT',headers:{'Content-Type':'application/json','X-LingoLoop-Update':'reading-v1',...(origin?{Origin:origin}:{})},body:JSON.stringify(article)}),env);
assert.equal((await put(seed,'https://hostile.test')).status,403);assert.equal((await put({id:'bad'})).status,400);assert.equal((await put(seed)).status,200);assert.deepEqual((await (await get()).json()).article,seed);assert.equal(data.size,2);assert.equal((await worker.fetch(new Request(root+'/api/reading',{method:'DELETE'}),env)).status,405);
for(const path of ['/','/app.js','/style.css'])assert.equal((await worker.fetch(new Request(root+path),env)).status,200);
console.log('PASS: current edition, schema validation, cross-origin protection, persisted readback, archive, methods, application assets');

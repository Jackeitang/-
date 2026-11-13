import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const files=await Promise.all(['worker/models.js','worker/runtime.js'].map(f=>fs.readFile(f,'utf8')));
const records=new Map();const calls=[];
const env={LINGOLOOP_OWNER_EMAIL:'owner@test.example',LINGOLOOP_KEY_ENCRYPTION:Buffer.alloc(32,7).toString('base64'),BUCKET:{get:async k=>records.has(k)?{json:async()=>JSON.parse(records.get(k))}:null,put:async(k,v)=>records.set(k,v),delete:async k=>records.delete(k)}};
const fakeFetch=async(url,options)=>{calls.push(options);return new Response(JSON.stringify({choices:[{message:{content:'OK'},finish_reason:'stop'}]}))};
const worker=new Function('crypto','fetch','SEED','LISTENING_SEED','ASSETS','DICTIONARY',files[0]+'\n'+files[1].replace('export default','return'))(webcrypto,fakeFetch,{id:'reading'},{id:'listening'},{'/index.html':{body:'page',type:'text/html'}},{entries:{},aliases:{}});
function request(path,method='GET',body,user){return worker.fetch(new Request('https://public.test'+path,{method,headers:{'Content-Type':'application/json','X-LingoLoop-Model':'model-v1',...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@test.example'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env)}
for(const path of ['/','/api/reading','/api/listening','/api/dictionary?word=hello'])assert.equal((await request(path)).status,200);
const cfg=await (await request('/api/models/config')).json();assert.equal(cfg.loginRequired,true);assert.equal(cfg.configured,false);
for(const user of [undefined,'visitor'])for(const path of ['/api/reading','/api/listening'])assert.equal((await request(path,'PUT',{},user)).status,403);
for(const path of ['/api/models/config','/api/models/chat','/api/models/reading-draft'])assert.equal((await request(path,'POST',{})).status,401);
assert.equal((await request('/api/models/config','DELETE')).status,401);
for(const user of ['owner','visitor'])assert.equal((await request('/api/models/config','POST',{provider:'deepseek',model:'fixture-model',key:user+'-fixture-key'},user)).status,200);
assert(records.has('private/model-connection-v1.json'),'owner retains original config location');assert.equal(records.size,2);
assert(![...records.values()].join('').includes('fixture-key'),'keys encrypted');
for(const user of ['owner','visitor']){assert.equal((await request('/api/models/chat','POST',{messages:[{role:'user',content:'Hi'}]},user)).status,200);assert.equal(calls.at(-1).headers.Authorization,'Bearer '+user+'-fixture-key');}
assert.equal((await request('/api/models/reading-draft','POST',{},'visitor')).status,403);
assert.equal((await (await request('/api/models/config','GET',undefined,'third')).json()).configured,false);
assert.equal((await request('/api/models/config','DELETE',undefined,'visitor')).status,200);
assert.equal((await (await request('/api/models/config','GET',undefined,'owner')).json()).configured,true);
assert.equal((await (await request('/api/models/config','GET',undefined,'visitor')).json()).configured,false);
const callsBefore=calls.length;assert.equal((await request('/api/models/chat','POST',{messages:[]},'third')).status,409);assert.equal(calls.length,callsBefore);
console.log('PASS public access: anonymous reads, owner-only writes, private credentials, per-user billing, isolated deletion, anonymous AI denial.');

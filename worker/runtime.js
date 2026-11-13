const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function validArticle(a){
 const str=(s,max=15000)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
 const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s));
 return a&&str(a.id,100)&&/^[a-zA-Z0-9-]+$/.test(a.id)&&date(a.date)&&date(a.eventDate)&&str(a.title,200)&&str(a.titleZh,200)&&str(a.level,30)&&str(a.selectionReason,2000)&&str(a.statusNote,2000)&&str(a.updatedAt,50)&&!isNaN(Date.parse(a.updatedAt))&&Array.isArray(a.paragraphs)&&a.paragraphs.length>=2&&a.paragraphs.length<=12&&a.paragraphs.every(p=>str(p.en,5000)&&str(p.zh,5000))&&Array.isArray(a.vocabulary)&&a.vocabulary.length<=15&&a.vocabulary.every(v=>str(v.word,100)&&str(v.meaning,300))&&Array.isArray(a.sources)&&a.sources.length>=1&&a.sources.length<=8&&a.sources.every(s=>{try{return str(s.name,200)&&date(s.published)&&new URL(s.url).protocol==='https:'}catch{return false}})&&Array.isArray(a.questions)&&a.questions.length>=1&&a.questions.length<=5&&a.questions.every(q=>str(q.question,500)&&Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=5&&q.options.every(o=>str(o,500))&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length&&str(q.explanation,1000));
}
function validListening(a){
 const str=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
 const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v));
 try{return a&&str(a.id,100)&&/^[a-zA-Z0-9-]+$/.test(a.id)&&date(a.date)&&str(a.publishedAt,50)&&Number.isFinite(Date.parse(a.publishedAt))&&str(a.updatedAt,50)&&Number.isFinite(Date.parse(a.updatedAt))&&str(a.title,300)&&str(a.contextZh,2000)&&new URL(a.sourceUrl).origin==='https://www.cbsnews.com'&&new URL(a.sourceUrl).pathname.includes('/video/')&&new URL(a.mediaUrl).origin==='https://prod.vodvideo.cbsnews.com'&&new URL(a.mediaUrl).pathname.endsWith('.m3u8')&&Number.isFinite(a.start)&&a.start>=0&&Number.isFinite(a.end)&&a.end>a.start&&a.end-a.start<=180&&Array.isArray(a.questions)&&a.questions.length===2&&a.questions.every(q=>str(q,500))}catch{return false}
}
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path.startsWith('/api/models/'))return modelsApi(request,env);
 if(path==='/api/listening'){
  if(request.method==='GET'){
   try{const obj=env.BUCKET?await env.BUCKET.get('listening/latest.json'):null;return json({episode:obj?await obj.json():LISTENING_SEED})}catch{return json({error:'Listening storage unavailable'},503)}
  }
  if(request.method!=='PUT')return json({error:'Method not allowed'},405);
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Cross-origin write denied'},403);
  if(request.headers.get('X-LingoLoop-Update')!=='listening-v1'||!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'Expected listening update request'},400);
  if(!env.BUCKET)return json({error:'Storage unavailable'},503);
  const body=await request.text();if(body.length>20000)return json({error:'Too large'},413);
  let episode;try{episode=JSON.parse(body)}catch{return json({error:'Invalid JSON'},400)}
  if(!validListening(episode))return json({error:'Invalid listening schema'},400);
  const now=new Date();if(episode.date>now.toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'})||Date.parse(episode.publishedAt)>now.getTime()||Date.parse(episode.updatedAt)>now.getTime()+60000)return json({error:'Future date denied'},400);
  const old=await env.BUCKET.get('listening/latest.json');if(old&&(await old.json()).date>episode.date)return json({error:'Newer edition exists'},409);
  const content=JSON.stringify(episode);await env.BUCKET.put('listening/editions/'+episode.date+'.json',content);await env.BUCKET.put('listening/latest.json',content);
  return json({ok:true,id:episode.id,date:episode.date});
 }
 if(path==='/api/dictionary'){
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  const word=(url.searchParams.get('word')||'').toLowerCase().replace(/’/g,"'");
  if(!/^[a-z]+(?:['-][a-z]+)*$/.test(word)||word.length>60)return json({error:'Invalid word'},400);
  const has=(key)=>Object.prototype.hasOwnProperty.call(DICTIONARY.entries,key);
  const lemma=has(word)?word:DICTIONARY.aliases[word];const entry=lemma&&has(lemma)?DICTIONARY.entries[lemma]:null;
  return json({query:word,entry:entry?{...entry,lemma,inflected:lemma!==word}:null,source:'ECDICT'});
 }
 if(path==='/api/pronunciation'){
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  const word=(url.searchParams.get('word')||'').toLowerCase().replace(/’/g,"'");
  if(!/^[a-z]+(?:['-][a-z]+)*$/.test(word)||word.length>60)return json({error:'Invalid word'},400);
  try{
   const response=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word),{signal:AbortSignal.timeout(6500)});
   if(!response.ok)return json({audio:null,phonetic:null});
   const entries=await response.json();if(!Array.isArray(entries))return json({audio:null,phonetic:null});
   const phonetics=entries.flatMap(e=>Array.isArray(e.phonetics)?e.phonetics:[]);
   const available=phonetics.find(p=>{try{const u=new URL(p.audio);return u.protocol==='https:'&&['api.dictionaryapi.dev','ssl.gstatic.com','upload.wikimedia.org'].includes(u.hostname)}catch{return false}});
   return json({audio:available?.audio||null,phonetic:available?.text||phonetics.find(p=>p.text)?.text||entries[0]?.phonetic||null,source:'Free Dictionary API',license:available?.license||entries[0]?.license||null});
  }catch{return json({audio:null,phonetic:null,unavailable:true})}
 }
 if(path==='/api/reading'){
  if(request.method==='GET'){
   try{const obj=env.BUCKET?await env.BUCKET.get('reading/latest.json'):null;return json({article:obj?await obj.json():SEED});}catch{return json({error:'Reading storage unavailable'},503)}
  }
  if(request.method==='PUT'){
   // Private Site dispatch authenticates visitors/service callers before this Worker.
   // Also block browser cross-origin requests; no CORS access is granted.
   if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Cross-origin write denied'},403);
   if(request.headers.get('X-LingoLoop-Update')!=='reading-v1'||!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'Expected reading update request'},400);
   if(!env.BUCKET)return json({error:'Storage is not configured'},503);
   if(Number(request.headers.get('Content-Length'))>100000)return json({error:'Too large'},413);
   const body=await request.text();if(body.length>100000)return json({error:'Too large'},413);
   let article;try{article=JSON.parse(body)}catch{return json({error:'Invalid JSON'},400)}
   if(!validArticle(article))return json({error:'Invalid reading schema'},400);
   const currentDate=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'});
   if(article.date>currentDate)return json({error:'Future edition not allowed'},400);
   const existing=await env.BUCKET.get('reading/latest.json');const previous=existing?await existing.json():null;
   if(previous&&previous.date>article.date)return json({error:'An edition with a later date already exists'},409);
   const content=JSON.stringify(article);
   await env.BUCKET.put('reading/editions/'+article.date+'.json',content,{httpMetadata:{contentType:'application/json'}});
   await env.BUCKET.put('reading/latest.json',content,{httpMetadata:{contentType:'application/json'}});
   return json({ok:true,id:article.id,date:article.date});
  }
  return json({error:'Method not allowed'},405);
 }
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
 const asset=ASSETS[path==='/'?'/index.html':path];if(!asset)return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
}};

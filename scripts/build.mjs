import fs from 'node:fs/promises';
const assets={};for(const [file,type] of [['index.html','text/html'],['app.js','text/javascript'],['listening-player.js','text/javascript'],['style.css','text/css'],['pet.css','text/css'],['pet-progress.js','text/javascript'],['pet-view.js','text/javascript'],['pet-scene.js','text/javascript'],['three.module.min.js','text/javascript'],['three-license.txt','text/plain'],['dictionary-license.txt','text/plain'],['hls.min.js','text/javascript']])assets['/'+file]={body:await fs.readFile('public/'+file,'utf8'),type:type+'; charset=utf-8'};
const seed=JSON.parse(await fs.readFile('public/reading-seed.json','utf8'));
const listening=JSON.parse(await fs.readFile('public/listening-seed.json','utf8'));
const dictionary=JSON.parse(await fs.readFile('data/dictionary.json','utf8'));
const runtime=(await fs.readFile('worker/models.js','utf8'))+'\n'+(await fs.readFile('worker/runtime.js','utf8'));
await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await fs.writeFile('dist/server/index.js','const LISTENING_SEED='+JSON.stringify(listening)+';\nconst DICTIONARY='+JSON.stringify(dictionary)+';\nconst ASSETS='+JSON.stringify(assets)+';\nconst SEED='+JSON.stringify(seed)+';\n'+runtime);await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built Worker with embedded app and reading API');

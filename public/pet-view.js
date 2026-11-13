import {getPetProgress, petActivities, dailyBonus} from './pet-progress.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountPetPanel(host,{history,date,name='小芽',saveName,navigate}) {
  const p=getPetProgress(history,date);
  host.innerHTML=`<section class="pet-card" aria-labelledby="pet-title">
    <div class="pet-habitat">
      <div class="pet-scene-top"><span class="pet-live"><i></i> 你的学习伙伴</span><span class="pet-level">Lv. ${p.level}</span></div>
      <div class="pet-stage" id="pet-stage"><div class="pet-placeholder" id="pet-fallback"><span>🦉</span><p>小伙伴正在醒来…</p></div></div>
      <p class="pet-whisper" id="pet-message" role="status">${p.complete?'今天的四份成长，我都收到啦！':'你学一点，我就长大一点。'}</p>
      <div class="pet-controls"><button class="pet-turn" id="pet-left" aria-label="向左转动宠物" disabled>↶</button><button class="secondary" id="pet-touch">♡ 摸摸小伙伴</button><button class="pet-turn" id="pet-right" aria-label="向右转动宠物" disabled>↷</button></div>
      <p class="pet-caption" id="pet-caption">正在准备 3D 小伙伴…</p>
    </div>
    <div class="pet-details">
      <div class="eyebrow">GROW TOGETHER</div><div class="pet-title-row"><h2 id="pet-title">${escape(name)}</h2><span class="pet-stage-label">${p.stage}</span><button class="link-button" id="pet-rename" aria-expanded="false" aria-controls="pet-name-form">改名字</button></div>
      <form id="pet-name-form" class="pet-name-form" hidden><label for="pet-name">给小伙伴起个名字</label><div class="row"><input id="pet-name" maxlength="12" value="${escape(name)}" required><button class="secondary" type="submit">保存</button><button class="link-button" type="button" id="pet-name-cancel">取消</button></div></form>
      <p class="pet-intro">每一份认真练习，都让我们一起成长。</p>
      <div class="pet-xp-label"><b>Lv. ${p.level} <span>→ Lv. ${p.level+1}</span></b><span>${p.intoLevel} / 100 XP</span></div>
      <div class="pet-xp-track" role="progressbar" aria-label="宠物升级经验" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.intoLevel}"><span style="width:${p.intoLevel}%"></span></div>
      <div class="pet-xp-note"><span>再积累 <b>${p.toNext} XP</b> 就升级</span><span>累计 ${p.totalXP} XP</span></div>
      <div class="pet-tasks-title"><h3>今天，陪它一起成长</h3><span>${p.done.size} / 4 已完成</span></div>
      <div class="pet-tasks">${petActivities.map(a=>`<button class="pet-task ${p.done.has(a.type)?'is-done':''}" data-pet-go="${a.page}" aria-label="${a.type}，${p.done.has(a.type)?'今日已完成':'完成获得 '+a.xp+' XP'}"><span class="pet-task-icon">${a.icon}</span><span><b>${a.type}</b><small>${p.done.has(a.type)?'今日已完成 ✓':a.label}</small></span><span class="pet-task-xp">${p.done.has(a.type)?'✓':'+'+a.xp}</span></button>`).join('')}</div>
      <div class="pet-bonus ${p.complete?'is-done':''}"><span>✦</span><div><b>${p.complete?'今日全勤奖励已到账':'四项都完成，额外 +'+dailyBonus+' XP'}</b><small>${p.complete?'+'+dailyBonus+' XP · 明天也一起加油':'口语、听力、写作、阅读，每天都照顾到'}</small></div></div>
    </div>
  </section><p class="pet-storage-note">经验来自已完成并记录的练习，历史记录也计入成长。每 100 XP 升一级；Lv.5 长出新叶，Lv.10 获得星光徽章。宠物与进度保存在当前浏览器。</p>`;
  let disposed=false, scene=null, touches=0;
  const find=s=>host.querySelector(s), stage=find('#pet-stage'), fallback=find('#pet-fallback');
  const message=find('#pet-message');
  function touch(){const lines=['好开心！继续一起学英语吧。','今天也有认真成长，抱抱你！','慢慢来，我会一直陪着你。'];message.textContent=lines[touches++%lines.length];}
  find('#pet-touch').onclick=()=>scene?scene.react():touch();
  find('#pet-left').onclick=()=>scene?.turn(-1);find('#pet-right').onclick=()=>scene?.turn(1);
  host.querySelectorAll('[data-pet-go]').forEach(button=>button.onclick=()=>navigate(button.dataset.petGo));
  const form=find('#pet-name-form'), rename=find('#pet-rename');
  rename.onclick=()=>{form.hidden=!form.hidden;rename.setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden)find('#pet-name').focus();};
  find('#pet-name-cancel').onclick=()=>{form.hidden=true;rename.setAttribute('aria-expanded','false');rename.focus();};
  form.onsubmit=e=>{e.preventDefault();const value=find('#pet-name').value.trim().slice(0,12);if(!value){find('#pet-name').setCustomValidity('请输入小伙伴的名字');find('#pet-name').reportValidity();return;}saveName(value);find('#pet-title').textContent=value;form.hidden=true;rename.setAttribute('aria-expanded','false');message.textContent='好喜欢这个名字！以后就叫我'+value+'吧。';};
  find('#pet-name').oninput=e=>e.target.setCustomValidity('');
  function unavailable(){fallback.hidden=false;fallback.querySelector('p').textContent='小伙伴一直在这里';find('#pet-caption').textContent='此设备暂时无法显示 3D，成长与经验照常记录。';find('#pet-left').disabled=true;find('#pet-right').disabled=true;scene?.destroy();scene=null;}
  stage.addEventListener('pet-render-error',unavailable);
  import('./pet-scene.js').then(({mountPetScene})=>{
    if(disposed)return;
    scene=mountPetScene(stage,{level:p.level,onTouch:touch});fallback.hidden=true;
    find('#pet-caption').textContent='左右拖动转身 · 轻点或摸摸它';find('#pet-left').disabled=false;find('#pet-right').disabled=false;
  }).catch(()=>{if(!disposed)unavailable();});
  return ()=>{disposed=true;stage.removeEventListener('pet-render-error',unavailable);scene?.destroy();};
}

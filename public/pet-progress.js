export const petActivities = [
  {type:'口语', page:'speak', xp:20, icon:'◉', label:'开口聊一聊'},
  {type:'听力', page:'listen', xp:20, icon:'♫', label:'听懂每一句'},
  {type:'写作', page:'write', xp:25, icon:'✎', label:'写下你的想法'},
  {type:'阅读', page:'reading', xp:20, icon:'▤', label:'读一篇新知识'},
];
export const dailyBonus = 15;
export function practiceCompleted(history, id, date) {
  return history.some(item => item?.id === id && item.date === date);
}
export function getPetProgress(history, date) {
  const days = new Map(); let practiceXP = 0;
  const seen = new Set(), valid = new Set(petActivities.map(a=>a.type));
  for (const item of history) {
    if (!item || !valid.has(item.type) || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) continue;
    const key = item.id ? item.date+'|'+item.id : null;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    practiceXP += Number.isFinite(item.xp) ? Math.max(0, item.xp) : 0;
    if (!days.has(item.date)) days.set(item.date, new Set());
    days.get(item.date).add(item.type);
  }
  const fullDays = [...days.values()].filter(day=>day.size===4).length;
  const done = days.get(date) || new Set();
  const totalXP = practiceXP + fullDays * dailyBonus;
  const level = Math.floor(totalXP / 100) + 1;
  return {totalXP, practiceXP, fullDays, level, intoLevel:totalXP%100, toNext:100-totalXP%100,
    done, complete:done.size===4, stage:level>=10?'星光伙伴':level>=5?'森林学徒':'幼芽伙伴'};
}

// ====== Family Chore Tracker (PWA) ======
// chores
choresEditor.innerHTML = state.chores.map((c, idx) => {
return `<div class="editor-row ${c.hidden? 'hidden':''}">
<input type="text" value="${c.name}" data-idx="${idx}" class="chore-name" />
<input type="number" value="${c.points}" min="0" data-idx="${idx}" class="chore-points" />
<label style="display:flex; gap:6px; align-items:center; color:var(--muted);">
<input type="checkbox" ${c.hidden? 'checked':''} data-idx="${idx}" class="chore-hidden"/> hide
</label>
<button class="remove" data-idx="${idx}" data-type="chore">✕</button>
</div>`;
}).join('');


// listeners
$$('.kid-name').forEach(inp => inp.addEventListener('input', (e)=>{
state.kids[+e.target.dataset.idx] = e.target.value.trim() || 'Kid';
saveState(); renderKidsSelect(); renderDashboard();
}));
$$('.chore-name').forEach(inp => inp.addEventListener('input', (e)=>{
state.chores[+e.target.dataset.idx].name = e.target.value.trim() || 'Chore';
saveState(); renderChoreList(); renderDashboard();
}));
$$('.chore-points').forEach(inp => inp.addEventListener('input', (e)=>{
state.chores[+e.target.dataset.idx].points = Math.max(0, +e.target.value || 0);
saveState(); renderChoreList(); renderDashboard();
}));
$$('.chore-hidden').forEach(inp => inp.addEventListener('change', (e)=>{
state.chores[+e.target.dataset.idx].hidden = e.target.checked;
saveState(); renderChoreList();
}));
$$('.remove').forEach(btn => btn.addEventListener('click', (e)=>{
const idx = +e.target.dataset.idx; const type = e.target.dataset.type;
if (type === 'kid') state.kids.splice(idx,1);
if (type === 'chore') state.chores.splice(idx,1);
saveState(); renderEditors(); renderKidsSelect(); renderChoreList(); renderDashboard();
}));
}


// Buttons
submitBtn.addEventListener('click', submitToday);
addKidBtn.addEventListener('click', ()=>{ state.kids.push('New Kid'); saveState(); renderEditors(); renderKidsSelect(); });
addChoreBtn.addEventListener('click', ()=>{ state.chores.push({ id: `c-${Date.now()}`, name:'New Chore', points:1, hidden:false }); saveState(); renderEditors(); renderChoreList(); });
resetWeekBtn.addEventListener('click', ()=>{
const { start, end } = weekRange();
state.log = state.log.filter(e => !(new Date(e.ts) >= start && new Date(e.ts) < end));
saveState(); renderDashboard();
});
backupBtn.addEventListener('click', ()=>{
const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href = url; a.download = `chore-backup-${todayISO()}.json`; a.click();
URL.revokeObjectURL(url);
});
restoreBtn.addEventListener('click', ()=> restoreInput.click());
restoreInput.addEventListener('change', (e)=>{
const file = e.target.files?.[0]; if (!file) return;
const fr = new FileReader();
fr.onload = () => { try { state = JSON.parse(String(fr.result)); saveState(); renderKidsSelect(); renderChoreList(); renderDashboard(); renderEditors(); } catch { alert('Invalid backup file.'); } };
fr.readAsText(file);
});


// Initial paint
initTabs();
renderKidsSelect();
renderChoreList();
renderDashboard();


// PWA: register service worker
if ('serviceWorker' in navigator) {
window.addEventListener('load', () => {
navigator.serviceWorker.register('./service-worker.js');
});
}

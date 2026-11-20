// Render the selected workspace's saved activity without inventing demo events.
const rmapActivityWorkspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';
const rmapActivitySearch = document.getElementById('activity-search');
const rmapActivityType = document.getElementById('activity-type');
const rmapActivityPeriod = document.getElementById('activity-period');
const rmapActivityLimit = 25; let rmapActivityShown = rmapActivityLimit;
document.getElementById('activity-workspace-label').textContent = `Changes for ${rmapActivityWorkspace}`;
function rmapActivityDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function rmapActivityIsToday(value) { const date = rmapActivityDate(value); return date && date.toDateString() === new Date().toDateString(); }
function rmapActivityFiltered() {
  const search = rmapActivitySearch.value.trim().toLocaleLowerCase(); const type = rmapActivityType.value; const days = rmapActivityPeriod.value;
  return window.RMAPActivity.read(rmapActivityWorkspace).filter((entry) => {
    if (type !== 'all' && entry.entity !== type) return false;
    const date = rmapActivityDate(entry.timestamp); if (days !== 'all' && (!date || Date.now() - date.getTime() > Number(days) * 86400000)) return false;
    return !search || `${entry.action} ${entry.entity} ${entry.name} ${entry.description} ${entry.actor}`.toLocaleLowerCase().includes(search);
  }).sort((a,b) => (rmapActivityDate(b.timestamp)?.getTime() || 0) - (rmapActivityDate(a.timestamp)?.getTime() || 0));
}
function rmapActivityRender() {
  const all = window.RMAPActivity.read(rmapActivityWorkspace); const rows = rmapActivityFiltered();
  document.getElementById('activity-total').textContent = all.length;
  document.getElementById('activity-today').textContent = all.filter((entry) => rmapActivityIsToday(entry.timestamp)).length;
  document.getElementById('activity-contributors').textContent = new Set(all.map((entry) => entry.actor).filter(Boolean)).size;
  const shown = rows.slice(0,rmapActivityShown); const timeline = document.getElementById('activity-timeline'); timeline.replaceChildren();
  shown.forEach((entry) => {
    const item = document.createElement('article'); item.className = `activity-entry activity-entry-${entry.entity.toLowerCase()}`; item.setAttribute('aria-label',`${entry.action} ${entry.entity}: ${entry.name}`);
    const icon = document.createElement('span'); icon.className = 'activity-entry-icon'; icon.setAttribute('aria-hidden','true'); icon.textContent = ({Job:'▣',Candidate:'♙',Application:'⇥',Interview:'◷'})[entry.entity] || '•';
    const content = document.createElement('div'); content.className = 'activity-entry-content';
    const headline = document.createElement('p'); headline.className = 'activity-entry-headline'; const action = document.createElement('strong'); action.textContent = entry.action; const entity = document.createElement('span'); entity.textContent = entry.entity.toLowerCase(); const name = document.createElement('b'); name.textContent = entry.name; headline.append(action,document.createTextNode(' '),entity,document.createTextNode(' '),name);
    const detail = document.createElement('p'); detail.className = 'activity-entry-detail'; detail.textContent = entry.description || `${entry.entity} record updated.`;
    const meta = document.createElement('div'); meta.className = 'activity-entry-meta'; const actor = document.createElement('span'); actor.textContent = entry.actor || 'RMAP user'; const time = document.createElement('time'); const date = rmapActivityDate(entry.timestamp); time.dateTime = date ? date.toISOString() : ''; time.textContent = date ? date.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : 'Date unavailable'; meta.append(actor,time); content.append(headline,detail,meta); item.append(icon,content); timeline.append(item);
  });
  const empty = rows.length === 0; document.getElementById('activity-empty').hidden = !empty; timeline.hidden = empty;
  document.getElementById('activity-empty-title').textContent = all.length ? 'No matching activity' : 'No activity recorded yet';
  document.getElementById('activity-empty-copy').textContent = all.length ? 'Try another search term, activity type, or date range.' : 'Create or update a job, candidate, application, or interview to see it here.';
  document.getElementById('activity-result-count').textContent = `Showing ${shown.length} of ${rows.length} event${rows.length === 1 ? '' : 's'}`;
  document.getElementById('activity-more').hidden = rows.length <= shown.length;
}
[rmapActivitySearch,rmapActivityType,rmapActivityPeriod].forEach((control) => control.addEventListener(control === rmapActivitySearch ? 'input' : 'change', () => { rmapActivityShown = rmapActivityLimit; rmapActivityRender(); }));
document.getElementById('activity-more').addEventListener('click',() => { rmapActivityShown += rmapActivityLimit; rmapActivityRender(); });
document.getElementById('activity-export').addEventListener('click',() => {
  const rows = rmapActivityFiltered(); if (!rows.length) { showWorkflowToast('There are no activity records to export.'); return; }
  const data = [['Timestamp','Actor','Action','Type','Name','Details'],...rows.map((entry) => [entry.timestamp,entry.actor,entry.action,entry.entity,entry.name,entry.description])];
  const csv = data.map((row) => row.map((value) => `"${String(value || '').replaceAll('"','""')}"`).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const link = document.createElement('a'); link.href = url; link.download = 'rmap-activity-log.csv'; link.click(); URL.revokeObjectURL(url); showWorkflowToast('Activity log exported.');
});
window.addEventListener('rmap:activity',rmapActivityRender); window.addEventListener('storage',(event) => { if (event.key === `rmapActivityV1:${rmapActivityWorkspace}`) rmapActivityRender(); });
rmapActivityRender();
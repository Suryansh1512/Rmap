// Workspace-scoped browser activity store. Events describe successful saved actions only.
(() => {
  const key = (workspace) => `rmapActivityV1:${workspace || 'Acme Talent Group'}`;
  function read(workspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group') {
    try { const rows = JSON.parse(localStorage.getItem(key(workspace)) || '[]'); return Array.isArray(rows) ? rows : []; } catch { return []; }
  }
  function log({action, entity, name, description = ''} = {}) {
    if (!action || !entity || !name) return false;
    const workspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';
    let actor = 'RMAP user'; try { actor = JSON.parse(sessionStorage.getItem('rmapUser') || 'null')?.name || actor; } catch {}
    const rows = read(workspace); const entry = {id:`ACT-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,workspace,action,entity,name,description,actor,timestamp:new Date().toISOString()};
    rows.unshift(entry);
    try { localStorage.setItem(key(workspace),JSON.stringify(rows.slice(0,500))); window.dispatchEvent(new CustomEvent('rmap:activity',{detail:entry})); return true; } catch { return false; }
  }
  window.RMAPActivity = {read,log};
})();
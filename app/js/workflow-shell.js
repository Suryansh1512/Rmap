// Shared shell behavior for the Applications and Interviews pages.
let rmapWorkflowUser;
try { rmapWorkflowUser = JSON.parse(sessionStorage.getItem('rmapUser') || 'null'); } catch { rmapWorkflowUser = null; }
if (!rmapWorkflowUser?.name || !rmapWorkflowUser?.email) window.location.replace('../index.html');
else {
  const rmapWorkflowInitials = rmapWorkflowUser.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
  document.querySelectorAll('.sidebar-user .avatar,.profile-trigger .avatar,.profile-menu-header .avatar').forEach((avatar) => { avatar.textContent = rmapWorkflowInitials; });
  document.querySelector('.sidebar-user .user-copy strong').textContent = rmapWorkflowUser.name;
  document.querySelector('.profile-name').textContent = rmapWorkflowUser.name;
  document.querySelector('.profile-menu-header strong').textContent = rmapWorkflowUser.name;
  document.querySelector('.profile-menu-header small').textContent = rmapWorkflowUser.email;
  document.querySelector('.sidebar-user .user-copy small').textContent = rmapWorkflowUser.role || 'Recruiter';
  document.querySelector('[data-admin-only]').hidden = rmapWorkflowUser.role !== 'Administrator';
}
const rmapWorkflowToast = document.getElementById('toast');
let rmapWorkflowToastTimer;
function showWorkflowToast(message) { rmapWorkflowToast.textContent = message; rmapWorkflowToast.classList.add('show'); clearTimeout(rmapWorkflowToastTimer); rmapWorkflowToastTimer = setTimeout(() => rmapWorkflowToast.classList.remove('show'), 3000); }
const rmapWorkflowAppearanceButtons = [...document.querySelectorAll('[data-appearance-mode]')];
const rmapWorkflowScheme = window.matchMedia('(prefers-color-scheme: dark)');
let rmapWorkflowAppearance = localStorage.getItem('rmapAppearance') || 'system';
function applyWorkflowAppearance(mode) { rmapWorkflowAppearance = mode; document.documentElement.dataset.theme = mode === 'system' ? (rmapWorkflowScheme.matches ? 'dark' : 'light') : mode; rmapWorkflowAppearanceButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.appearanceMode === mode))); }
rmapWorkflowAppearanceButtons.forEach((button) => button.addEventListener('click', () => { localStorage.setItem('rmapAppearance', button.dataset.appearanceMode); applyWorkflowAppearance(button.dataset.appearanceMode); showWorkflowToast(`${button.textContent} appearance selected.`); }));
if (rmapWorkflowScheme.addEventListener) rmapWorkflowScheme.addEventListener('change', () => { if (rmapWorkflowAppearance === 'system') applyWorkflowAppearance('system'); });
else rmapWorkflowScheme.addListener(() => { if (rmapWorkflowAppearance === 'system') applyWorkflowAppearance('system'); });
applyWorkflowAppearance(rmapWorkflowAppearance);
const rmapWorkflowShell = document.querySelector('.app-shell');
function setWorkflowSidebarOpen(open) { rmapWorkflowShell.classList.toggle('sidebar-open', open); document.getElementById('menu-toggle').setAttribute('aria-expanded', String(open)); }
document.getElementById('menu-toggle').addEventListener('click', () => setWorkflowSidebarOpen(true));
document.getElementById('sidebar-close').addEventListener('click', () => setWorkflowSidebarOpen(false));
document.getElementById('sidebar-backdrop').addEventListener('click', () => setWorkflowSidebarOpen(false));
document.getElementById('collapse-sidebar').addEventListener('click', (event) => { const collapsed = rmapWorkflowShell.classList.toggle('sidebar-collapsed'); event.currentTarget.setAttribute('aria-expanded', String(!collapsed)); event.currentTarget.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar'; });
const rmapWorkflowWorkspaceToggle = document.getElementById('workspace-toggle');
const rmapWorkflowWorkspaceMenu = document.getElementById('workspace-menu');
const rmapWorkflowWorkspaceOptions = [...document.querySelectorAll('.workspace-option')];
const rmapWorkflowDropdowns = [{ button: document.getElementById('notification-toggle'), menu: document.getElementById('notification-menu') }, { button: document.getElementById('profile-toggle'), menu: document.getElementById('profile-menu') }];
function closeWorkflowMenus(except = null) { rmapWorkflowDropdowns.forEach(({button, menu}) => { if (menu !== except) { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); } }); if (rmapWorkflowWorkspaceMenu !== except) { rmapWorkflowWorkspaceMenu.hidden = true; rmapWorkflowWorkspaceToggle.setAttribute('aria-expanded', 'false'); } }
rmapWorkflowDropdowns.forEach(({button, menu}) => { button.addEventListener('click', (event) => { event.stopPropagation(); const open = menu.hidden; closeWorkflowMenus(menu); menu.hidden = !open; button.setAttribute('aria-expanded', String(open)); }); menu.addEventListener('click', (event) => event.stopPropagation()); });
function selectWorkflowWorkspace(option) { document.querySelector('.workspace-copy strong').textContent = option.dataset.workspace; document.querySelector('.workspace-mark').textContent = option.dataset.initial; rmapWorkflowWorkspaceOptions.forEach((item) => { const selected = item === option; item.classList.toggle('selected', selected); item.setAttribute('aria-checked', String(selected)); item.querySelector('.workspace-option-copy small').textContent = selected ? 'Current workspace' : 'Demo workspace'; }); sessionStorage.setItem('rmapWorkspace', option.dataset.workspace); }
const rmapWorkflowSavedWorkspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';
const rmapWorkflowSavedOption = rmapWorkflowWorkspaceOptions.find((option) => option.dataset.workspace === rmapWorkflowSavedWorkspace);
if (rmapWorkflowSavedOption) selectWorkflowWorkspace(rmapWorkflowSavedOption);
rmapWorkflowWorkspaceToggle.addEventListener('click', (event) => { event.stopPropagation(); const open = rmapWorkflowWorkspaceMenu.hidden; closeWorkflowMenus(); rmapWorkflowWorkspaceMenu.hidden = !open; rmapWorkflowWorkspaceToggle.setAttribute('aria-expanded', String(open)); });
rmapWorkflowWorkspaceMenu.addEventListener('click', (event) => event.stopPropagation());
rmapWorkflowWorkspaceOptions.forEach((option) => option.addEventListener('click', () => { const oldWorkspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group'; selectWorkflowWorkspace(option); rmapWorkflowWorkspaceMenu.hidden = true; rmapWorkflowWorkspaceToggle.setAttribute('aria-expanded', 'false'); if (oldWorkspace !== option.dataset.workspace) window.location.reload(); }));
document.addEventListener('click', () => closeWorkflowMenus());
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeWorkflowMenus(); setWorkflowSidebarOpen(false); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('global-search').focus(); } });
document.querySelector('.logout-link').addEventListener('click', () => sessionStorage.removeItem('rmapUser'));
document.getElementById('mark-read').addEventListener('click', () => { document.querySelectorAll('.notification-item.unread').forEach((item) => item.classList.remove('unread')); document.querySelector('.notification-dot').hidden = true; showWorkflowToast('Notifications marked as read.'); });
document.querySelectorAll('.nav-link[href^="#"],.profile-menu a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); setWorkflowSidebarOpen(false); showWorkflowToast(`${link.textContent.trim()} page is ready to be connected.`); }));
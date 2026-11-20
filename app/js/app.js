// Shared references for the app shell and its interactive controls.
const appShell = document.querySelector('.app-shell');
const sidebar = document.getElementById('sidebar');
const toast = document.getElementById('toast');
let toastTimer;

// The dashboard needs the demo sign-in session created by login.html.
let signedInUser;
try {
  signedInUser = JSON.parse(sessionStorage.getItem('rmapUser') || 'null');
} catch {
  signedInUser = null;
}

if (!signedInUser?.name || !signedInUser?.email) {
  window.location.replace('../index.html');
} else {
  // Replace the sample profile with the details entered on the login screen.
  const initials = signedInUser.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  document.querySelectorAll('.sidebar-user .avatar, .profile-trigger .avatar, .profile-menu-header .avatar')
    .forEach((avatar) => { avatar.textContent = initials; });
  document.querySelector('.sidebar-user .user-copy strong').textContent = signedInUser.name;
  document.querySelector('.profile-name').textContent = signedInUser.name;
  document.querySelector('.profile-menu-header strong').textContent = signedInUser.name;
  document.querySelector('.profile-menu-header small').textContent = signedInUser.email;
  document.querySelector('.sidebar-user .user-copy small').textContent = signedInUser.role || 'Recruiter';
  document.querySelector('[data-admin-only]').hidden = signedInUser.role !== 'Administrator';

  const firstName = signedInUser.name.split(/\s+/)[0];
  const heading = document.querySelector('.page-heading h1');
  heading.firstChild.textContent = `Good morning, ${firstName} `;
}

// Display a short, accessible status message for prototype actions.
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// Open and close the mobile navigation drawer.
function setMobileSidebar(isOpen) {
  appShell.classList.toggle('sidebar-open', isOpen);
  document.getElementById('menu-toggle').setAttribute('aria-expanded', String(isOpen));
  if (isOpen) document.getElementById('sidebar-close').focus();
}

document.getElementById('menu-toggle').addEventListener('click', () => setMobileSidebar(true));
document.getElementById('sidebar-close').addEventListener('click', () => setMobileSidebar(false));
document.getElementById('sidebar-backdrop').addEventListener('click', () => setMobileSidebar(false));

// Collapse the desktop sidebar to an icon rail.
document.getElementById('collapse-sidebar').addEventListener('click', () => {
  const collapsed = appShell.classList.toggle('sidebar-collapsed');
  const control = document.getElementById('collapse-sidebar');
  control.setAttribute('aria-expanded', String(!collapsed));
  control.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  control.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
});

// Keep one dropdown open at a time and update its accessibility state.
const dropdowns = [
  { button: document.getElementById('notification-toggle'), menu: document.getElementById('notification-menu') },
  { button: document.getElementById('profile-toggle'), menu: document.getElementById('profile-menu') },
];

function closeDropdowns(except = null) {
  dropdowns.forEach(({ button, menu }) => {
    if (menu !== except) {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    }
  });
  if (typeof workspaceMenu !== 'undefined' && workspaceMenu !== except) {
    workspaceMenu.hidden = true;
    workspaceToggle.setAttribute('aria-expanded', 'false');
  }
}

dropdowns.forEach(({ button, menu }) => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const shouldOpen = menu.hidden;
    closeDropdowns(menu);
    menu.hidden = !shouldOpen;
    button.setAttribute('aria-expanded', String(shouldOpen));
  });
  menu.addEventListener('click', (event) => event.stopPropagation());
});

document.addEventListener('click', () => {
  closeDropdowns();
  workspaceMenu.hidden = true;
  workspaceToggle.setAttribute('aria-expanded', 'false');
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDropdowns();
    workspaceMenu.hidden = true;
    workspaceToggle.setAttribute('aria-expanded', 'false');
    setMobileSidebar(false);
  }
});

// Apply the saved appearance preference or follow the operating system setting.
const appearanceButtons = [...document.querySelectorAll('[data-appearance-mode]')];
const systemColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
let appearancePreference = localStorage.getItem('rmapAppearance') || 'system';

function applyAppearance(preference) {
  appearancePreference = preference;
  const resolvedTheme = preference === 'system'
    ? (systemColorScheme.matches ? 'dark' : 'light')
    : preference;
  document.documentElement.dataset.theme = resolvedTheme;
  appearanceButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.appearanceMode === preference));
  });
}

appearanceButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const preference = button.dataset.appearanceMode;
    localStorage.setItem('rmapAppearance', preference);
    applyAppearance(preference);
    showToast(`${preference === 'system' ? 'System' : preference[0].toUpperCase() + preference.slice(1)} appearance selected.`);
  });
});

systemColorScheme.addEventListener?.('change', () => {
  if (appearancePreference === 'system') applyAppearance('system');
});
if (!systemColorScheme.addEventListener) {
  systemColorScheme.addListener(() => {
    if (appearancePreference === 'system') applyAppearance('system');
  });
}
applyAppearance(appearancePreference);
// Mark visible notifications as read and clear the indicator dot.
document.getElementById('mark-read').addEventListener('click', () => {
  document.querySelectorAll('.notification-item.unread').forEach((item) => item.classList.remove('unread'));
  document.querySelector('.notification-dot').hidden = true;
  showToast('Notifications marked as read.');
});

// Filter the recent applications table as a first step toward global search.
const searchInput = document.getElementById('global-search');
const candidateRows = [...document.querySelectorAll('.applications-panel tbody tr')];
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visibleCount = 0;
  candidateRows.forEach((row) => {
    const matches = row.textContent.toLocaleLowerCase().includes(query);
    row.hidden = !matches;
    if (matches) visibleCount += 1;
  });

  const summary = document.querySelector('.table-footer > span');
  summary.innerHTML = query
    ? `Showing <strong>${visibleCount}</strong> matching ${visibleCount === 1 ? 'candidate' : 'candidates'}`
    : 'Showing <strong>4</strong> of <strong>1284</strong> candidates';
});

// Keyboard shortcut focuses the global search field.
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
});

// These entry points show clear feedback until their product flows are connected.
document.getElementById('create-job').addEventListener('click', () => showToast('The create-job form will open here when job management is connected.'));
// Workspace selection persists for this signed-in browser session.
const workspaceToggle = document.getElementById('workspace-toggle');
const workspaceMenu = document.getElementById('workspace-menu');
const workspaceOptions = [...document.querySelectorAll('.workspace-option')];
const selectedWorkspaceName = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';

function selectWorkspace(option, announce = false) {
  const name = option.dataset.workspace;
  document.querySelector('.workspace-copy strong').textContent = name;
  document.querySelector('.workspace-mark').textContent = option.dataset.initial;
  workspaceOptions.forEach((item) => {
    const selected = item === option;
    item.classList.toggle('selected', selected);
    item.setAttribute('aria-checked', String(selected));
    item.querySelector('.workspace-option-copy small').textContent = selected ? 'Current workspace' : 'Demo workspace';
  });
  sessionStorage.setItem('rmapWorkspace', name);
  if (announce) showToast(`Switched to ${name}.`);
}

const savedWorkspace = workspaceOptions.find((option) => option.dataset.workspace === selectedWorkspaceName);
if (savedWorkspace) selectWorkspace(savedWorkspace);

workspaceToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = workspaceMenu.hidden;
  closeDropdowns();
  workspaceMenu.hidden = !open;
  workspaceToggle.setAttribute('aria-expanded', String(open));
});
workspaceMenu.addEventListener('click', (event) => event.stopPropagation());
workspaceOptions.forEach((option) => {
  option.addEventListener('click', () => {
    selectWorkspace(option, true);
    workspaceMenu.hidden = true;
    workspaceToggle.setAttribute('aria-expanded', 'false');
  });
});
document.querySelector('.logout-link').addEventListener('click', () => sessionStorage.removeItem('rmapUser'));
document.querySelectorAll('.nav-link[href^="#"], .profile-menu a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setMobileSidebar(false);
    showToast(`${link.textContent.trim()} page is ready to be connected.`);
  });
});
document.querySelectorAll('.period-select, .more-button, .row-more, .pagination button:not(:disabled)').forEach((button) => {
  button.addEventListener('click', () => showToast('This control is ready to connect to the application data.'));
});

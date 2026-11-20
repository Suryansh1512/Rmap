// Require the demo sign-in session and personalize the shared app shell.
let signedInUser;
try { signedInUser = JSON.parse(sessionStorage.getItem('rmapUser') || 'null'); } catch { signedInUser = null; }
if (!signedInUser?.name || !signedInUser?.email) window.location.replace('../index.html');
else {
  const initials = signedInUser.name.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0].toUpperCase()).join('');
  document.querySelectorAll('.sidebar-user .avatar,.profile-trigger .avatar,.profile-menu-header .avatar').forEach((avatar) => { avatar.textContent = initials; });
  document.querySelector('.sidebar-user .user-copy strong').textContent = signedInUser.name;
  document.querySelector('.profile-name').textContent = signedInUser.name;
  document.querySelector('.profile-menu-header strong').textContent = signedInUser.name;
  document.querySelector('.profile-menu-header small').textContent = signedInUser.email;
  document.querySelector('.sidebar-user .user-copy small').textContent = signedInUser.role || 'Recruiter';
  document.querySelector('[data-admin-only]').hidden = signedInUser.role !== 'Administrator';
}

// Shared status toast for page actions.
const toast = document.getElementById('toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// Apply and remember light, dark, or system appearance.
const appearanceButtons = [...document.querySelectorAll('[data-appearance-mode]')];
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
let appearance = localStorage.getItem('rmapAppearance') || 'system';
function applyAppearance(mode) {
  appearance = mode;
  document.documentElement.dataset.theme = mode === 'system' ? (colorScheme.matches ? 'dark' : 'light') : mode;
  appearanceButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.appearanceMode === mode)));
}
appearanceButtons.forEach((button) => button.addEventListener('click', () => {
  localStorage.setItem('rmapAppearance', button.dataset.appearanceMode);
  applyAppearance(button.dataset.appearanceMode);
  showToast(`${button.textContent} appearance selected.`);
}));
if (colorScheme.addEventListener) colorScheme.addEventListener('change', () => { if (appearance === 'system') applyAppearance('system'); });
else colorScheme.addListener(() => { if (appearance === 'system') applyAppearance('system'); });
applyAppearance(appearance);

// Sidebar drawer and desktop collapse controls.
const appShell = document.querySelector('.app-shell');
function setSidebarOpen(open) {
  appShell.classList.toggle('sidebar-open', open);
  document.getElementById('menu-toggle').setAttribute('aria-expanded', String(open));
}
document.getElementById('menu-toggle').addEventListener('click', () => setSidebarOpen(true));
document.getElementById('sidebar-close').addEventListener('click', () => setSidebarOpen(false));
document.getElementById('sidebar-backdrop').addEventListener('click', () => setSidebarOpen(false));
document.getElementById('collapse-sidebar').addEventListener('click', () => {
  const collapsed = appShell.classList.toggle('sidebar-collapsed');
  const button = document.getElementById('collapse-sidebar');
  button.setAttribute('aria-expanded', String(!collapsed));
  button.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
});

// Coordinate the workspace, notification, and profile menus.
const workspaceToggle = document.getElementById('workspace-toggle');
const workspaceMenu = document.getElementById('workspace-menu');
const workspaceOptions = [...document.querySelectorAll('.workspace-option')];
const dropdowns = [
  { button: document.getElementById('notification-toggle'), menu: document.getElementById('notification-menu') },
  { button: document.getElementById('profile-toggle'), menu: document.getElementById('profile-menu') },
];
function closeMenus(except = null) {
  dropdowns.forEach(({button,menu}) => { if (menu !== except) { menu.hidden = true; button.setAttribute('aria-expanded','false'); } });
  if (workspaceMenu !== except) { workspaceMenu.hidden = true; workspaceToggle.setAttribute('aria-expanded','false'); }
  closeJobActionMenus();
}
dropdowns.forEach(({button,menu}) => {
  button.addEventListener('click', (event) => { event.stopPropagation(); const open=menu.hidden; closeMenus(menu); menu.hidden=!open; button.setAttribute('aria-expanded',String(open)); });
  menu.addEventListener('click',(event)=>event.stopPropagation());
});
const savedWorkspace=sessionStorage.getItem('rmapWorkspace')||'Acme Talent Group';
function selectWorkspace(option,announce=false) {
  document.querySelector('.workspace-copy strong').textContent=option.dataset.workspace;
  document.querySelector('.workspace-mark').textContent=option.dataset.initial;
  workspaceOptions.forEach((item)=>{const selected=item===option;item.classList.toggle('selected',selected);item.setAttribute('aria-checked',String(selected));item.querySelector('.workspace-option-copy small').textContent=selected?'Current workspace':'Demo workspace';});
  sessionStorage.setItem('rmapWorkspace',option.dataset.workspace);
  if(announce) showToast(`Switched to ${option.dataset.workspace}.`);
}
const savedOption=workspaceOptions.find((option)=>option.dataset.workspace===savedWorkspace);
if(savedOption) selectWorkspace(savedOption);
workspaceToggle.addEventListener('click',(event)=>{event.stopPropagation();const open=workspaceMenu.hidden;closeMenus();workspaceMenu.hidden=!open;workspaceToggle.setAttribute('aria-expanded',String(open));});
workspaceMenu.addEventListener('click',(event)=>event.stopPropagation());
workspaceOptions.forEach((option)=>option.addEventListener('click',()=>{const previous=sessionStorage.getItem('rmapWorkspace')||'Acme Talent Group';selectWorkspace(option,true);workspaceMenu.hidden=true;workspaceToggle.setAttribute('aria-expanded','false');if(previous!==option.dataset.workspace)window.location.reload();}));
document.addEventListener('click',()=>{closeMenus();closeJobActionMenus();});
document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){closeMenus();setSidebarOpen(false);closeJobModal();}});
document.querySelector('.logout-link').addEventListener('click',()=>sessionStorage.removeItem('rmapUser'));
document.getElementById('mark-read').addEventListener('click',()=>{document.querySelectorAll('.notification-item.unread').forEach((item)=>item.classList.remove('unread'));document.querySelector('.notification-dot').hidden=true;showToast('Notifications marked as read.');});

// Search and filter the jobs table by status, department, and text.
const tableBody=document.getElementById('jobs-table-body');
let jobRows=[...tableBody.querySelectorAll('.job-row')];
let statusFilter='all';
const jobsSearch=document.getElementById('jobs-search');
const globalSearch=document.getElementById('global-search');
const departmentFilter=document.getElementById('department-filter');
function updateJobCounts() {
  const counts={all:jobRows.length,active:0,draft:0,closed:0}; let applicants=0;
  jobRows.forEach((row)=>{counts[row.dataset.status]++;applicants+=Number(row.dataset.applicants||0);});
  document.querySelector('[data-tab-count="all"]').textContent=counts.all;
  document.querySelector('[data-tab-count="active"]').textContent=counts.active;
  document.querySelector('[data-tab-count="draft"]').textContent=counts.draft;
  document.querySelector('[data-tab-count="closed"]').textContent=counts.closed;
  document.getElementById('total-jobs').textContent=counts.all;
  document.querySelector('.sidebar .nav-count').textContent=counts.all;
  document.getElementById('active-jobs').textContent=counts.active;
  document.getElementById('draft-jobs').textContent=counts.draft;
  document.getElementById('applicant-total').textContent=applicants;
}
function filterJobs() {
  const query=jobsSearch.value.trim().toLocaleLowerCase();
  const department=departmentFilter.value;
  let shown=0;
  jobRows.forEach((row)=>{
    const matchesStatus=statusFilter==='all'||row.dataset.status===statusFilter;
    const matchesDepartment=department==='all'||row.dataset.department===department;
    const matchesText=!query||row.textContent.toLocaleLowerCase().includes(query);
    row.hidden=!(matchesStatus&&matchesDepartment&&matchesText);
    if(!row.hidden)shown++;
  });
  document.getElementById('jobs-empty').hidden=shown>0;
  document.getElementById('jobs-result-count').innerHTML=query||department!=='all'||statusFilter!=='all'
    ? `Showing <strong>${shown}</strong> of <strong>${jobRows.length}</strong> jobs`
    : `Showing <strong>${jobRows.length}</strong> jobs`;
}
function syncSearch(source,target){target.value=source.value;filterJobs();}
jobsSearch.addEventListener('input',()=>syncSearch(jobsSearch,globalSearch));
globalSearch.addEventListener('input',()=>syncSearch(globalSearch,jobsSearch));
departmentFilter.addEventListener('change',filterJobs);
document.querySelectorAll('[data-status-filter]').forEach((button)=>button.addEventListener('click',()=>{
  statusFilter=button.dataset.statusFilter;
  document.querySelectorAll('[data-status-filter]').forEach((tab)=>{const selected=tab===button;tab.classList.toggle('selected',selected);tab.setAttribute('aria-pressed',String(selected));});
  filterJobs();
}));

document.addEventListener('keydown',(event)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();globalSearch.focus();}});

// Persist job records locally until the app has a jobs API.
const jobsStorageKey='rmapJobsV1:'+(sessionStorage.getItem('rmapWorkspace')||'Acme Talent Group');
const jobModal=document.getElementById('job-modal');
document.body.append(jobModal);
const jobForm=document.getElementById('job-form');
let editingRow=null;
function statusLabel(status){return status==='active'?'Active':status==='draft'?'Draft':'Closed';}
function createJobRow(record) {
  const row=document.createElement('tr');row.className='job-row';row.dataset.jobId=record.id;row.dataset.status=record.status;row.dataset.department=record.department;row.dataset.applicants=String(record.applicants||0);
  const titleCell=document.createElement('td');const titleWrap=document.createElement('div');titleWrap.className='job-title-cell';
  const avatar=document.createElement('span');const allowedAvatar=['job-avatar-blue','job-avatar-violet','job-avatar-orange','job-avatar-green','job-avatar-pink'];avatar.className=`job-avatar ${allowedAvatar.includes(record.avatarClass)?record.avatarClass:'job-avatar-blue'}`;avatar.textContent=record.initials||record.department.split(/\s+/).map((word)=>word[0]).join('').slice(0,2).toUpperCase();
  const titleInfo=document.createElement('span');const title=document.createElement('strong');title.textContent=record.title;const code=document.createElement('small');code.textContent=`${record.id} · ${record.type||'Full time'}`;titleInfo.append(title,code);titleWrap.append(avatar,titleInfo);titleCell.append(titleWrap);
  const department=document.createElement('td');department.textContent=record.department;
  const applicantsCell=document.createElement('td');if(Number(record.applicants)>0){const applicants=document.createElement('a');applicants.className='applicant-link';applicants.href='job-applicants.html?job='+encodeURIComponent(record.id);applicants.textContent=String(record.applicants);const label=document.createElement('span');label.textContent=' applicants';applicants.append(label);applicantsCell.append(applicants);}else{const none=document.createElement('span');none.className='no-applicants';none.textContent='—';applicantsCell.append(none);}
  const location=document.createElement('td');location.textContent=record.location;
  const statusCell=document.createElement('td');const status=document.createElement('span');status.className=`job-status status-${record.status}`;status.textContent=statusLabel(record.status);statusCell.append(status);
  const posted=document.createElement('td');posted.textContent=record.posted||'Not posted';
  const actionsCell=document.createElement('td');const actions=document.createElement('button');actions.type='button';actions.className='job-actions';actions.setAttribute('aria-label',`Actions for ${record.title}`);actions.setAttribute('aria-expanded','false');actions.textContent='···';actionsCell.append(actions);
  row.append(titleCell,department,applicantsCell,location,statusCell,posted,actionsCell);return row;
}
function recordFromRow(row) {
  const subtitle=row.cells[0].querySelector('small').textContent;
  const id=subtitle.match(/RMAP-\d+/)?.[0]||row.dataset.jobId||`RMAP-${1050+jobRows.indexOf(row)}`;
  row.dataset.jobId=id;
  const applicantLink=row.cells[2].querySelector('.applicant-link');if(applicantLink)applicantLink.href='job-applicants.html?job='+encodeURIComponent(id);
  return {id,title:row.cells[0].querySelector('strong').textContent,department:row.cells[1].textContent.trim(),applicants:Number(row.dataset.applicants||0),type:subtitle.replace(/^RMAP-\d+\s*[·•-]?\s*/, '').trim()||'Full time',location:row.cells[3].textContent.trim(),status:row.dataset.status,posted:row.cells[5].textContent.trim(),initials:row.cells[0].querySelector('.job-avatar').textContent,avatarClass:[...row.cells[0].querySelector('.job-avatar').classList].find((name)=>name.startsWith('job-avatar-')&&name!=='job-avatar')||'job-avatar-blue'};
}
function persistJobs(){try{localStorage.setItem(jobsStorageKey,JSON.stringify(jobRows.map(recordFromRow)));return true;}catch{showToast('Changes are active for this page but could not be saved in this browser.');return false;}}
function reloadJobRows(){jobRows=[...tableBody.querySelectorAll('.job-row')];updateJobCounts();filterJobs();}
function nextJobCode(){const numbers=jobRows.map((row)=>Number(recordFromRow(row).id.match(/\d+/)?.[0]||0));return `RMAP-${Math.max(1049,...numbers)+1}`;}
function loadSavedJobs(){
  let saved=null;try{saved=JSON.parse(localStorage.getItem(jobsStorageKey)||'null');}catch{saved=null;}
  if(Array.isArray(saved)){
    const valid=saved.filter((record)=>record&&typeof record.title==='string'&&typeof record.department==='string'&&typeof record.location==='string'&&['active','draft','closed'].includes(record.status));
    if(valid.length||saved.length===0){tableBody.replaceChildren(...valid.map(createJobRow));}
  }
  jobRows=[...tableBody.querySelectorAll('.job-row')];
  jobRows.forEach(recordFromRow);
  if(saved===null)persistJobs();
}
function openJobModal(row=null){
  editingRow=row;
  jobForm.reset();
  document.getElementById('job-modal-title').textContent=row?'Edit job':'Create a job';
  document.getElementById('job-submit-label').textContent=row?'Save changes':'Create job';
  if(row){const record=recordFromRow(row);jobForm.elements.title.value=record.title;jobForm.elements.department.value=record.department;jobForm.elements.type.value=record.type;jobForm.elements.location.value=record.location;jobForm.elements.status.value=record.status==='closed'?'active':record.status;}
  jobModal.hidden=false;jobForm.elements.title.focus();
}
function closeJobModal(){jobModal.hidden=true;editingRow=null;jobForm.reset();}
document.getElementById('create-job').addEventListener('click',()=>openJobModal());
document.querySelectorAll('[data-close-job-modal]').forEach((button)=>button.addEventListener('click',closeJobModal));
jobModal.addEventListener('click',(event)=>{if(event.target===jobModal)closeJobModal();});
function addJobRecord(record){const row=createJobRow(record);tableBody.prepend(row);reloadJobRows();return persistJobs();}
function toggleJobStatus(row){const record=recordFromRow(row);record.status=record.status==='active'?'closed':'active';record.posted=record.status==='active'?'Today':record.posted;row.replaceWith(createJobRow(record));reloadJobRows();if(persistJobs())window.RMAPActivity?.log({action:record.status==='closed'?'Closed':'Reopened',entity:'Job',name:record.title,description:`Status changed to ${statusLabel(record.status)}.`});showToast(`${record.title} is now ${statusLabel(record.status).toLowerCase()}.`);}
function closeJobActionMenus(){document.querySelectorAll('.job-action-menu').forEach((menu)=>{menu.parentElement.querySelector('.job-actions')?.setAttribute('aria-expanded','false');menu.remove();});}
function showJobMenu(button,row){
  closeJobActionMenus();
  const record=recordFromRow(row);const menu=document.createElement('div');menu.className='job-action-menu';menu.setAttribute('role','menu');
  const addAction=(label,action,kind='')=>{const item=document.createElement('button');item.type='button';item.setAttribute('role','menuitem');item.dataset.jobAction=action;item.className=kind;item.textContent=label;menu.append(item);};
  addAction('Edit job','edit');addAction('Duplicate job','duplicate');addAction(record.status==='active'?'Close job':record.status==='draft'?'Publish job':'Reopen job','status');
  const applicants=document.createElement('a');applicants.href='job-applicants.html?job='+encodeURIComponent(record.id);applicants.setAttribute('role','menuitem');applicants.textContent='View applicants';menu.append(applicants);
  addAction('Delete job','delete','danger-action');
  const rect=button.getBoundingClientRect();const menuHeight=190;menu.style.left=Math.max(8,Math.min(rect.right-170,window.innerWidth-174))+'px';menu.style.top=(rect.bottom+menuHeight>window.innerHeight?Math.max(8,rect.top-menuHeight-4):rect.bottom+4)+'px';button.closest('td').append(menu);button.setAttribute('aria-expanded','true');
}
tableBody.addEventListener('click',(event)=>{
  const actionButton=event.target.closest('.job-actions');
  if(actionButton){event.stopPropagation();const existing=actionButton.closest('td').querySelector('.job-action-menu');if(existing){existing.remove();actionButton.setAttribute('aria-expanded','false');}else showJobMenu(actionButton,actionButton.closest('tr'));return;}
  const menuItem=event.target.closest('[data-job-action]');
  if(menuItem){event.stopPropagation();const row=menuItem.closest('tr');const action=menuItem.dataset.jobAction;menuItem.closest('.job-action-menu').remove();row.querySelector('.job-actions').setAttribute('aria-expanded','false');
    if(action==='edit'){openJobModal(row);return;}
    if(action==='duplicate'){const copy=recordFromRow(row);copy.id=nextJobCode();copy.title=`${copy.title} (Copy)`;copy.status='draft';copy.posted='Not posted';copy.applicants=0;if(addJobRecord(copy))window.RMAPActivity?.log({action:'Duplicated',entity:'Job',name:copy.title,description:`Draft copied from ${row.cells[0].querySelector('strong').textContent}.`});showToast(`${copy.title} added as a draft.`);return;}
    if(action==='status'){toggleJobStatus(row);return;}
    if(action==='delete'){const title=row.cells[0].querySelector('strong').textContent;if(window.confirm(`Delete "${title}"? This cannot be undone.`)){row.remove();reloadJobRows();if(persistJobs())window.RMAPActivity?.log({action:'Deleted',entity:'Job',name:title});showToast(`${title} deleted.`);}return;}
  }
  if(event.target.closest('.job-action-menu'))event.stopPropagation();
});
jobForm.addEventListener('submit',(event)=>{
  event.preventDefault();
  const values={title:jobForm.elements.title.value.trim(),department:jobForm.elements.department.value,type:jobForm.elements.type.value,location:jobForm.elements.location.value.trim(),status:jobForm.elements.status.value};
  if(editingRow){const previous=recordFromRow(editingRow);const updated={...previous,...values,initials:values.department.split(/\s+/).map((word)=>word[0]).join('').slice(0,2).toUpperCase(),posted:values.status===previous.status?previous.posted:values.status==='active'?'Today':'Not posted'};editingRow.replaceWith(createJobRow(updated));reloadJobRows();if(persistJobs())window.RMAPActivity?.log({action:'Updated',entity:'Job',name:values.title,description:`Job details saved (${values.status}).`});closeJobModal();showToast(`${values.title} updated.`);}
  else{values.id=nextJobCode();values.applicants=0;values.posted=values.status==='active'?'Today':'Not posted';values.initials=values.department.split(/\s+/).map((word)=>word[0]).join('').slice(0,2).toUpperCase();values.avatarClass='job-avatar-blue';if(addJobRecord(values))window.RMAPActivity?.log({action:'Created',entity:'Job',name:values.title,description:`${values.department} · ${statusLabel(values.status)}.`});statusFilter='all';document.querySelector('[data-status-filter="all"]').click();departmentFilter.value='all';jobsSearch.value='';globalSearch.value='';filterJobs();closeJobModal();showToast(`${values.title} added to the jobs list.`);}
});
loadSavedJobs();
// Export the currently visible job rows as CSV.
document.getElementById('export-jobs').addEventListener('click',()=>{
  const rows=[['Job title','Department','Applicants','Workplace','Status','Posted']];
  jobRows.filter((row)=>!row.hidden).forEach((row)=>rows.push([...row.cells].slice(0,6).map((cell)=>`"${cell.innerText.replaceAll('"','""').trim()}"`)));
  const csv=rows.map((row)=>row.join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='rmap-jobs.csv';link.click();URL.revokeObjectURL(url);
  showToast('Visible jobs exported as CSV.');
});

document.querySelectorAll('.jobs-pagination button:not(:disabled)').forEach((button)=>button.addEventListener('click',()=>showToast('All sample jobs are shown on this page.')));
document.querySelectorAll('.nav-link[href^="#"],.profile-menu a[href^="#"]').forEach((link)=>link.addEventListener('click',(event)=>{event.preventDefault();setSidebarOpen(false);showToast(`${link.textContent.trim()} page is ready to be connected.`);}));
updateJobCounts();filterJobs();
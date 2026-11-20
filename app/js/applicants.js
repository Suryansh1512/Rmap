// Verify the demo sign-in session and personalize the shared application shell.
let signedInUser;
try { signedInUser=JSON.parse(sessionStorage.getItem('rmapUser')||'null'); } catch { signedInUser=null; }
if(!signedInUser?.name||!signedInUser?.email)window.location.replace('../index.html');
else{
  const initials=signedInUser.name.split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0].toUpperCase()).join('');
  document.querySelectorAll('.sidebar-user .avatar,.profile-trigger .avatar,.profile-menu-header .avatar').forEach((avatar)=>{avatar.textContent=initials;});
  document.querySelector('.sidebar-user .user-copy strong').textContent=signedInUser.name;document.querySelector('.profile-name').textContent=signedInUser.name;document.querySelector('.profile-menu-header strong').textContent=signedInUser.name;document.querySelector('.profile-menu-header small').textContent=signedInUser.email;document.querySelector('.sidebar-user .user-copy small').textContent=signedInUser.role||'Recruiter';document.querySelector('[data-admin-only]').hidden=signedInUser.role!=='Administrator';
}

// Provide status feedback for page controls.
const toast=document.getElementById('toast');let toastTimer;
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3000);}

// Keep the selected appearance consistent across all application pages.
const appearanceButtons=[...document.querySelectorAll('[data-appearance-mode]')];const colorScheme=window.matchMedia('(prefers-color-scheme: dark)');let appearance=localStorage.getItem('rmapAppearance')||'system';
function applyAppearance(mode){appearance=mode;document.documentElement.dataset.theme=mode==='system'?(colorScheme.matches?'dark':'light'):mode;appearanceButtons.forEach((button)=>button.setAttribute('aria-pressed',String(button.dataset.appearanceMode===mode)));}
appearanceButtons.forEach((button)=>button.addEventListener('click',()=>{localStorage.setItem('rmapAppearance',button.dataset.appearanceMode);applyAppearance(button.dataset.appearanceMode);showToast(`${button.textContent} appearance selected.`);}));
if(colorScheme.addEventListener)colorScheme.addEventListener('change',()=>{if(appearance==='system')applyAppearance('system');});else colorScheme.addListener(()=>{if(appearance==='system')applyAppearance('system');});applyAppearance(appearance);

// Mobile navigation and desktop sidebar collapse.
const appShell=document.querySelector('.app-shell');
function setSidebarOpen(open){appShell.classList.toggle('sidebar-open',open);document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));}
document.getElementById('menu-toggle').addEventListener('click',()=>setSidebarOpen(true));document.getElementById('sidebar-close').addEventListener('click',()=>setSidebarOpen(false));document.getElementById('sidebar-backdrop').addEventListener('click',()=>setSidebarOpen(false));
document.getElementById('collapse-sidebar').addEventListener('click',()=>{const collapsed=appShell.classList.toggle('sidebar-collapsed');const button=document.getElementById('collapse-sidebar');button.setAttribute('aria-expanded',String(!collapsed));button.title=collapsed?'Expand sidebar':'Collapse sidebar';});

// Workspace, notifications, and profile dropdown controls.
const workspaceToggle=document.getElementById('workspace-toggle');const workspaceMenu=document.getElementById('workspace-menu');const workspaceOptions=[...document.querySelectorAll('.workspace-option')];
const dropdowns=[{button:document.getElementById('notification-toggle'),menu:document.getElementById('notification-menu')},{button:document.getElementById('profile-toggle'),menu:document.getElementById('profile-menu')}];
function closeMenus(except=null){dropdowns.forEach(({button,menu})=>{if(menu!==except){menu.hidden=true;button.setAttribute('aria-expanded','false');}});if(workspaceMenu!==except){workspaceMenu.hidden=true;workspaceToggle.setAttribute('aria-expanded','false');}}
dropdowns.forEach(({button,menu})=>{button.addEventListener('click',(event)=>{event.stopPropagation();const open=menu.hidden;closeMenus(menu);menu.hidden=!open;button.setAttribute('aria-expanded',String(open));});menu.addEventListener('click',(event)=>event.stopPropagation());});
const savedWorkspace=sessionStorage.getItem('rmapWorkspace')||'Acme Talent Group';
function selectWorkspace(option,announce=false){document.querySelector('.workspace-copy strong').textContent=option.dataset.workspace;document.querySelector('.workspace-mark').textContent=option.dataset.initial;workspaceOptions.forEach((item)=>{const selected=item===option;item.classList.toggle('selected',selected);item.setAttribute('aria-checked',String(selected));item.querySelector('.workspace-option-copy small').textContent=selected?'Current workspace':'Demo workspace';});sessionStorage.setItem('rmapWorkspace',option.dataset.workspace);if(announce)showToast(`Switched to ${option.dataset.workspace}.`);}
const savedWorkspaceOption=workspaceOptions.find((option)=>option.dataset.workspace===savedWorkspace);if(savedWorkspaceOption)selectWorkspace(savedWorkspaceOption);
workspaceToggle.addEventListener('click',(event)=>{event.stopPropagation();const open=workspaceMenu.hidden;closeMenus();workspaceMenu.hidden=!open;workspaceToggle.setAttribute('aria-expanded',String(open));});workspaceMenu.addEventListener('click',(event)=>event.stopPropagation());
workspaceOptions.forEach((option)=>option.addEventListener('click',()=>{const previous=sessionStorage.getItem('rmapWorkspace')||'Acme Talent Group';selectWorkspace(option,true);workspaceMenu.hidden=true;workspaceToggle.setAttribute('aria-expanded','false');if(previous!==option.dataset.workspace)window.location.reload();}));
document.addEventListener('click',()=>closeMenus());document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){closeMenus();setSidebarOpen(false);}});
document.querySelector('.logout-link').addEventListener('click',()=>sessionStorage.removeItem('rmapUser'));
document.getElementById('mark-read').addEventListener('click',()=>{document.querySelectorAll('.notification-item.unread').forEach((item)=>item.classList.remove('unread'));document.querySelector('.notification-dot').hidden=true;showToast('Notifications marked as read.');});

// Load the selected job from the workspace-specific local demo store.
const jobId=new URLSearchParams(window.location.search).get('job');const workspaceName=sessionStorage.getItem('rmapWorkspace')||'Acme Talent Group';const candidateDirectory=window.RMAPCandidateStore.load(workspaceName);let storedJobs=[];try{storedJobs=JSON.parse(localStorage.getItem(`rmapJobsV1:${workspaceName}`)||'[]');}catch{storedJobs=[];}
const jobInfo={
  'RMAP-1042':{department:'Product Design',location:'San Francisco · Hybrid'},
  'RMAP-1041':{department:'Engineering',location:'Remote · US'},
  'RMAP-1039':{department:'Marketing',location:'New York · Hybrid'},
  'RMAP-1036':{department:'Engineering',location:'Remote · US'},
  'RMAP-1032':{department:'Product Design',location:'San Francisco · Hybrid'}
};
const matchedApplications=candidateDirectory.filter((candidate)=>!candidate.archived).flatMap((candidate)=>(candidate.applications||[]).filter((application)=>application.jobId===jobId).map((application)=>({candidate,application})));
let job=storedJobs.find((record)=>record.id===jobId)||null;
if(!job&&matchedApplications.length){const application=matchedApplications[0].application;job={id:jobId,title:application.title,department:jobInfo[jobId]?.department||'Recruitment',location:jobInfo[jobId]?.location||'See job listing',status:'active',applicants:matchedApplications.length,initials:(jobInfo[jobId]?.department||'R').split(/\s+/).map((word)=>word[0]).join('').slice(0,2).toUpperCase(),avatarClass:'job-avatar-blue'};}
const candidateExamples=matchedApplications.map(({candidate,application})=>({name:candidate.name,email:candidate.email,initials:candidate.name.split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0].toUpperCase()).join(''),avatar:(candidate.avatar||'avatar-indigo').replace('avatar-','candidate-'),applied:application.applied,stage:application.stage,source:candidate.source,match:candidate.match||80}));
const applicantBody=document.getElementById('applicant-table-body');let visibleCandidates=[];let selectedStage='all';
function setEmpty(title,description){document.getElementById('empty-title').textContent=title;document.getElementById('empty-description').textContent=description;document.getElementById('applicant-empty').hidden=false;}
function candidateRow(candidate){
  const row=document.createElement('tr');row.className='applicant-row';row.dataset.stage=candidate.stage;
  const personCell=document.createElement('td');const person=document.createElement('div');person.className='candidate-cell';const avatar=document.createElement('span');avatar.className=`candidate-initials ${candidate.avatar}`;avatar.textContent=candidate.initials;const identity=document.createElement('span');const name=document.createElement('strong');name.textContent=candidate.name;const email=document.createElement('small');email.textContent=candidate.email;identity.append(name,email);person.append(avatar,identity);personCell.append(person);
  const applied=document.createElement('td');applied.textContent=candidate.applied;const stageCell=document.createElement('td');const stage=document.createElement('span');stage.className=`stage-badge stage-${candidate.stage.toLowerCase()}`;stage.textContent=candidate.stage;stageCell.append(stage);const source=document.createElement('td');source.textContent=candidate.source;
  const matchCell=document.createElement('td');const score=document.createElement('div');score.className='match-score';const scoreText=document.createElement('span');scoreText.textContent=`${candidate.match}%`;const track=document.createElement('span');track.className='match-track';const fill=document.createElement('i');fill.style.width=`${candidate.match}%`;track.append(fill);score.append(scoreText,track);matchCell.append(score);
  const actionCell=document.createElement('td');const action=document.createElement('button');action.type='button';action.className='job-actions candidate-action';action.setAttribute('aria-label',`More actions for ${candidate.name}`);action.textContent='···';action.addEventListener('click',()=>showToast('Candidate profile actions will be connected with candidate management.'));actionCell.append(action);row.append(personCell,applied,stageCell,source,matchCell,actionCell);return row;
}
function applyCandidateFilters(){const query=document.getElementById('applicant-search').value.trim().toLowerCase();let count=0;visibleCandidates.forEach((candidate,index)=>{const row=applicantBody.children[index];const matchesStage=selectedStage==='all'||candidate.stage===selectedStage;const matchesQuery=!query||`${candidate.name} ${candidate.email} ${candidate.source} ${candidate.stage}`.toLowerCase().includes(query);row.hidden=!(matchesStage&&matchesQuery);if(!row.hidden)count++;});document.getElementById('applicant-empty').hidden=count>0;if(!count&&job&&Number(job.applicants)>0)setEmpty(visibleCandidates.length?'No matching applicants':'No preview records available',visibleCandidates.length?'Try a different stage filter or search term.':'Connect applicant records to see candidates for this job.');document.getElementById('applicant-result-count').textContent=job&&Number(job.applicants)>0?`Showing ${count} preview records of ${job.applicants} applicants`:'No applicants to show';}
function setJobStatus(status){const badge=document.getElementById('job-status');badge.className=`job-status status-${status}`;badge.textContent=status==='active'?'Active':status==='draft'?'Draft':'Closed';}
if(job){
  document.title=`Applicants for ${job.title} | RMAP`;document.getElementById('job-title').textContent=job.title;document.getElementById('job-code').textContent=job.id;document.getElementById('job-department').textContent=job.department;document.getElementById('job-workplace').textContent=job.location;document.getElementById('job-avatar').textContent=job.initials||job.department.split(/\s+/).map((word)=>word[0]).join('').slice(0,2).toUpperCase();document.getElementById('job-avatar').className=`job-avatar ${job.avatarClass||'job-avatar-blue'}`;document.getElementById('job-applicant-total').textContent=job.applicants;document.getElementById('total-applicants').textContent=job.applicants;setJobStatus(job.status);
  visibleCandidates=candidateExamples.slice(0,5);
  visibleCandidates.forEach((candidate)=>applicantBody.append(candidateRow(candidate)));
  const counts={New:0,Screening:0,Interview:0,Offer:0,Rejected:0};visibleCandidates.forEach((candidate)=>counts[candidate.stage]++);
  document.getElementById('new-applicants').textContent=counts.New;document.getElementById('review-applicants').textContent=counts.Screening+counts.Interview;document.getElementById('offer-applicants').textContent=counts.Offer;
  document.getElementById('stage-count-all').textContent=visibleCandidates.length;document.getElementById('stage-count-new').textContent=counts.New;document.getElementById('stage-count-screening').textContent=counts.Screening;document.getElementById('stage-count-interview').textContent=counts.Interview;document.getElementById('stage-count-offer').textContent=counts.Offer;document.getElementById('stage-count-rejected').textContent=counts.Rejected;
  document.getElementById('applicant-preview-note').hidden=visibleCandidates.length===0;
  if(Number(job.applicants)===0)setEmpty('No applicants yet','New applications for this role will appear here.');
}else{
  document.title='Job applicants | RMAP';document.getElementById('job-title').textContent=jobId?'Job not found':'Select a job to view applicants';document.getElementById('applicant-list-subtitle').textContent='This job is not available in the selected workspace.';document.getElementById('applicant-preview-note').hidden=true;setEmpty('Applicants are unavailable','Return to Jobs and open the applicant count for a listed role.');
}

// Filter sample applicant rows by their stage and profile text.
const applicantSearch=document.getElementById('applicant-search');const globalSearch=document.getElementById('global-search');
function syncCandidateSearch(from,to){to.value=from.value;applyCandidateFilters();}
applicantSearch.addEventListener('input',()=>syncCandidateSearch(applicantSearch,globalSearch));globalSearch.addEventListener('input',()=>syncCandidateSearch(globalSearch,applicantSearch));
document.querySelectorAll('[data-stage-filter]').forEach((button)=>button.addEventListener('click',()=>{selectedStage=button.dataset.stageFilter;document.querySelectorAll('[data-stage-filter]').forEach((tab)=>{const active=tab===button;tab.classList.toggle('selected',active);tab.setAttribute('aria-pressed',String(active));});applyCandidateFilters();}));
document.addEventListener('keydown',(event)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();globalSearch.focus();}});

// Export the currently visible preview records to CSV.
document.getElementById('export-applicants').addEventListener('click',()=>{if(!visibleCandidates.length){showToast('There are no applicant records to export.');return;}const rows=[['Name','Email','Applied','Stage','Source','Match']];visibleCandidates.forEach((candidate,index)=>{if(!applicantBody.children[index].hidden)rows.push([candidate.name,candidate.email,candidate.applied,candidate.stage,candidate.source,`${candidate.match}%`]);});const csv=rows.map((row)=>row.map((cell)=>`"${String(cell).replaceAll('"','""')}"`).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`${job?.id||'job'}-applicants.csv`;link.click();URL.revokeObjectURL(url);showToast('Visible applicant preview records exported.');});
document.getElementById('applicant-more').addEventListener('click',()=>showToast('Applicant filters are available above the list.'));
document.querySelectorAll('.nav-link[href^="#"],.profile-menu a[href^="#"]').forEach((link)=>link.addEventListener('click',(event)=>{event.preventDefault();setSidebarOpen(false);showToast(`${link.textContent.trim()} page is ready to be connected.`);}));
applyCandidateFilters();
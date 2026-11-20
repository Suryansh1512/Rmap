// Applications are flattened from the shared candidate directory, one row per job application.
const rmapApplicationsWorkspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';
let rmapApplicationsCandidates = window.RMAPCandidateStore.load(rmapApplicationsWorkspace);
const rmapApplicationsKey = `rmapCandidatesV1:${rmapApplicationsWorkspace}`;
const rmapApplicationsBody = document.getElementById('applications-table-body');
const rmapApplicationsSearch = document.getElementById('application-search');
const rmapApplicationsGlobalSearch = document.getElementById('global-search');
const rmapApplicationsJobFilter = document.getElementById('application-job-filter');
const rmapApplicationsStageFilter = document.getElementById('application-stage-filter');
let rmapApplicationsRecords = [];
let rmapApplicationsJobTitles = new Map();
function rmapApplicationsSave() { const saved = window.RMAPCandidateStore.save(rmapApplicationsWorkspace, rmapApplicationsCandidates); if (!saved) showWorkflowToast('Changes could not be saved in this browser.'); return saved; }
function rmapApplicationsBuildRecords() { rmapApplicationsRecords = rmapApplicationsCandidates.filter((candidate) => !candidate.archived).flatMap((candidate) => (candidate.applications || []).map((application, index) => ({ candidate, application, key: `${candidate.id}|${application.jobId || index}` }))); }
function rmapApplicationsBuildJobFilter() {
  const current = rmapApplicationsJobFilter.value || 'all';
  rmapApplicationsJobTitles = new Map();
  rmapApplicationsRecords.forEach(({application}) => { if (application.jobId) rmapApplicationsJobTitles.set(application.jobId, application.title || application.jobId); });
  try { JSON.parse(localStorage.getItem(`rmapJobsV1:${rmapApplicationsWorkspace}`) || '[]').forEach((job) => rmapApplicationsJobTitles.set(job.id, job.title)); } catch {}
  rmapApplicationsJobFilter.replaceChildren(new Option('All jobs', 'all'));
  [...rmapApplicationsJobTitles.entries()].sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, title]) => rmapApplicationsJobFilter.add(new Option(title, id)));
  if ([...rmapApplicationsJobFilter.options].some((option) => option.value === current)) rmapApplicationsJobFilter.value = current;
}
function rmapApplicationsInitials(name) { return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join(''); }
function rmapApplicationsStageClass(stage) { return `stage-${String(stage || 'New').toLowerCase().replace(/\s+/g, '-')}`; }
function rmapApplicationsMatches(record) {
  if (rmapApplicationsJobFilter.value !== 'all' && record.application.jobId !== rmapApplicationsJobFilter.value) return false;
  if (rmapApplicationsStageFilter.value !== 'all' && (record.application.stage || record.candidate.stage) !== rmapApplicationsStageFilter.value) return false;
  const query = rmapApplicationsSearch.value.trim().toLowerCase();
  return !query || `${record.candidate.name} ${record.candidate.email} ${rmapApplicationsJobTitles.get(record.application.jobId) || record.application.title} ${record.application.jobId} ${record.candidate.source} ${record.application.stage}`.toLowerCase().includes(query);
}
function rmapApplicationsRow(record) {
  const {candidate, application} = record;
  const row = document.createElement('tr');
  row.dataset.applicationKey = record.key;
  const personCell = document.createElement('td');
  const person = document.createElement('div'); person.className = 'application-candidate';
  const avatar = document.createElement('span'); avatar.className = `application-avatar ${candidate.avatar || 'avatar-indigo'}`; avatar.textContent = rmapApplicationsInitials(candidate.name);
  const personCopy = document.createElement('span'); personCopy.className = 'application-person';
  const candidateLink = document.createElement('a'); candidateLink.href = `candidates.html?candidate=${encodeURIComponent(candidate.id)}`; candidateLink.textContent = candidate.name;
  const email = document.createElement('small'); email.textContent = candidate.email;
  personCopy.append(candidateLink, email); person.append(avatar, personCopy); personCell.append(person);
  const jobCell = document.createElement('td');
  const jobLink = document.createElement('a'); jobLink.className = 'application-job-link'; jobLink.href = `job-applicants.html?job=${encodeURIComponent(application.jobId || '')}`; jobLink.textContent = rmapApplicationsJobTitles.get(application.jobId) || application.title || application.jobId || 'Unassigned application'; jobCell.append(jobLink);
  const dateCell = document.createElement('td'); dateCell.textContent = application.applied || candidate.added || '—';
  const stageCell = document.createElement('td');
  const stageSelect = document.createElement('select'); stageSelect.className = `application-stage-select ${rmapApplicationsStageClass(application.stage || candidate.stage)}`; stageSelect.setAttribute('aria-label', `Update ${candidate.name}'s application stage`);
  ['Prospect', 'New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].forEach((stage) => stageSelect.add(new Option(stage, stage)));
  stageSelect.value = application.stage || candidate.stage || 'New';
  stageSelect.addEventListener('change', () => {
    application.stage = stageSelect.value;
    application.updated = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    if ((candidate.applications || []).length === 1) candidate.stage = stageSelect.value;
    if (rmapApplicationsSave()) window.RMAPActivity?.log({action:'Stage changed',entity:'Application',name:`${candidate.name} · ${application.title || application.jobId}`,description:`Moved to ${stageSelect.value}.`});
    rmapApplicationsRender();
    showWorkflowToast(`${candidate.name}'s application moved to ${stageSelect.value}.`);
  });
  stageCell.append(stageSelect);
  const sourceCell = document.createElement('td'); sourceCell.textContent = candidate.source || 'Not recorded';
  const nextCell = document.createElement('td');
  const nextLink = document.createElement('a'); nextLink.className = 'application-next-step';
  const schedule = (application.stage || candidate.stage) === 'Interview';
  nextLink.href = `interviews.html?candidate=${encodeURIComponent(candidate.id)}&job=${encodeURIComponent(application.jobId || '')}${schedule ? '' : '&schedule=1'}`;
  nextLink.textContent = schedule ? 'View interviews' : 'Schedule interview';
  nextCell.append(nextLink);
  row.append(personCell, jobCell, dateCell, stageCell, sourceCell, nextCell);
  return row;
}
function rmapApplicationsRender() {
  const filtered = rmapApplicationsRecords.filter(rmapApplicationsMatches).sort((a, b) => new Date(b.application.applied || b.candidate.added || 0) - new Date(a.application.applied || a.candidate.added || 0));
  rmapApplicationsBody.replaceChildren(...filtered.map(rmapApplicationsRow));
  document.getElementById('applications-empty').hidden = filtered.length > 0;
  document.getElementById('application-result-count').textContent = `Showing ${filtered.length} of ${rmapApplicationsRecords.length} applications`;
  document.getElementById('application-total').textContent = rmapApplicationsRecords.length;
  document.getElementById('application-new').textContent = rmapApplicationsRecords.filter(({application, candidate}) => (application.stage || candidate.stage) === 'New').length;
  document.getElementById('application-interviews').textContent = rmapApplicationsRecords.filter(({application, candidate}) => (application.stage || candidate.stage) === 'Interview').length;
  document.getElementById('application-offers').textContent = rmapApplicationsRecords.filter(({application, candidate}) => (application.stage || candidate.stage) === 'Offer').length;
}
function rmapApplicationsSyncSearch(from, to) { to.value = from.value; rmapApplicationsRender(); }
rmapApplicationsSearch.addEventListener('input', () => rmapApplicationsSyncSearch(rmapApplicationsSearch, rmapApplicationsGlobalSearch));
rmapApplicationsGlobalSearch.addEventListener('input', () => rmapApplicationsSyncSearch(rmapApplicationsGlobalSearch, rmapApplicationsSearch));
rmapApplicationsJobFilter.addEventListener('change', rmapApplicationsRender);
rmapApplicationsStageFilter.addEventListener('change', rmapApplicationsRender);
document.getElementById('export-applications').addEventListener('click', () => {
  const visible = rmapApplicationsRecords.filter(rmapApplicationsMatches);
  if (!visible.length) { showWorkflowToast('There are no application records to export.'); return; }
  const rows = [['Candidate', 'Email', 'Job', 'Job ID', 'Applied', 'Stage', 'Source']];
  visible.forEach(({candidate, application}) => rows.push([candidate.name, candidate.email, rmapApplicationsJobTitles.get(application.jobId) || application.title, application.jobId, application.applied, application.stage || candidate.stage, candidate.source]));
  const csv = rows.map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'rmap-applications.csv'; link.click(); URL.revokeObjectURL(url); showWorkflowToast('Filtered applications exported.');
});
rmapApplicationsBuildRecords();
rmapApplicationsBuildJobFilter();
const rmapApplicationsParams = new URLSearchParams(location.search);
if (rmapApplicationsParams.has('job')) rmapApplicationsJobFilter.value = rmapApplicationsParams.get('job');
if (rmapApplicationsParams.has('candidate')) rmapApplicationsSearch.value = rmapApplicationsCandidates.find((candidate) => candidate.id === rmapApplicationsParams.get('candidate'))?.name || '';
rmapApplicationsRender();
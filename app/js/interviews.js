// Interview records stay linked to candidate applications and are isolated per workspace.
const rmapInterviewsWorkspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';
let rmapInterviewsCandidates = window.RMAPCandidateStore.load(rmapInterviewsWorkspace);
const rmapInterviewsStorageKey = `rmapInterviewsV1:${rmapInterviewsWorkspace}`;
const rmapInterviewsBody = document.getElementById('interviews-table-body');
const rmapInterviewsSearch = document.getElementById('interview-search');
const rmapInterviewsGlobalSearch = document.getElementById('global-search');
const rmapInterviewsStatusFilter = document.getElementById('interview-status-filter');
const rmapInterviewsDateFilter = document.getElementById('interview-date-filter');
const rmapInterviewsModal = document.getElementById('interview-modal');
const rmapInterviewsForm = document.getElementById('interview-form');
const rmapInterviewsApplicationSelect = document.getElementById('interview-application');
let rmapInterviewsRecords = [];
function rmapInterviewsLocalIso(date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }
function rmapInterviewsDateIn(days) { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days); return rmapInterviewsLocalIso(date); }
function rmapInterviewsSave() { try { localStorage.setItem(rmapInterviewsStorageKey, JSON.stringify(rmapInterviewsRecords)); return true; } catch { showWorkflowToast('Interview changes could not be saved in this browser.'); return false; } }
function rmapInterviewsLoad() {
  try {
    const stored = localStorage.getItem(rmapInterviewsStorageKey);
    if (stored !== null) { const parsed = JSON.parse(stored); if (Array.isArray(parsed)) { rmapInterviewsRecords = parsed; return; } }
  } catch {}
  const interviewApplications = rmapInterviewsCandidates.filter((candidate) => !candidate.archived).flatMap((candidate) => (candidate.applications || []).filter((application) => application.stage === 'Interview').map((application) => ({ candidate, application })));
  rmapInterviewsRecords = interviewApplications.slice(0, 4).map(({candidate, application}, index) => ({
    id: `INT-DEMO-${index + 1}`, candidateId: candidate.id, jobId: application.jobId, date: rmapInterviewsDate(index + 1), time: index === 0 ? '10:30' : '14:00',
    type: candidate.id === 'CAN-1003' ? 'Portfolio review' : 'Hiring manager interview', interviewer: index === 0 ? 'Alex Morgan' : 'Sarah Chen',
    location: 'Video call', notes: candidate.note || '', status: 'Scheduled'
  }));
  rmapInterviewsSave();
}
function rmapInterviewsCandidate(record) { return rmapInterviewsCandidates.find((candidate) => candidate.id === record.candidateId); }
function rmapInterviewsApplication(record) { return rmapInterviewsCandidate(record)?.applications?.find((application) => application.jobId === record.jobId); }
function rmapInterviewsDateLabel(iso) { if (!iso) return 'Date not set'; const date = new Date(`${iso}T12:00:00`); return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function rmapInterviewsTimeLabel(time) { if (!time) return 'Time not set'; const [hour, minute] = time.split(':').map(Number); const date = new Date(); date.setHours(hour || 0, minute || 0, 0, 0); return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
function rmapInterviewsInitials(name) { return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join(''); }
function rmapInterviewsFillApplications(selected = '') {
  rmapInterviewsApplicationSelect.replaceChildren(new Option('Select an application', ''));
  rmapInterviewsCandidates.filter((candidate) => !candidate.archived).forEach((candidate) => (candidate.applications || []).forEach((application) => {
    if (!application.jobId) return;
    const value = `${candidate.id}|${application.jobId}`;
    rmapInterviewsApplicationSelect.add(new Option(`${candidate.name} — ${application.title || application.jobId}`, value));
  }));
  if (selected) rmapInterviewsApplicationSelect.value = selected;
}
function rmapInterviewsMatches(record) {
  if (rmapInterviewsStatusFilter.value !== 'all' && record.status !== rmapInterviewsStatusFilter.value) return false;
  if (rmapInterviewsDateFilter.value && record.date !== rmapInterviewsDateFilter.value) return false;
  const candidate = rmapInterviewsCandidate(record); const application = rmapInterviewsApplication(record);
  const query = rmapInterviewsSearch.value.trim().toLowerCase();
  return !query || `${candidate?.name || ''} ${candidate?.email || ''} ${application?.title || record.jobId || ''} ${record.type} ${record.interviewer} ${record.location} ${record.status}`.toLowerCase().includes(query);
}
function rmapInterviewsRow(record) {
  const candidate = rmapInterviewsCandidate(record); const application = rmapInterviewsApplication(record);
  const row = document.createElement('tr');
  const dateCell = document.createElement('td'); const dateWrap = document.createElement('span'); dateWrap.className = 'interview-date-cell';
  const dateText = document.createElement('span'); dateText.textContent = rmapInterviewsDateLabel(record.date); const dayText = document.createElement('small'); dayText.textContent = record.status === 'Scheduled' ? 'Scheduled' : record.status; dateWrap.append(dateText, dayText); dateCell.append(dateWrap);
  const timeCell = document.createElement('td'); timeCell.textContent = rmapInterviewsTimeLabel(record.time);
  const candidateCell = document.createElement('td'); const person = document.createElement('div'); person.className = 'interview-person';
  const avatar = document.createElement('span'); avatar.className = `application-avatar ${candidate?.avatar || 'avatar-indigo'}`; avatar.textContent = rmapInterviewsInitials(candidate?.name || 'Candidate');
  const candidateLink = document.createElement('a'); candidateLink.href = candidate ? `candidates.html?candidate=${encodeURIComponent(candidate.id)}` : 'candidates.html'; candidateLink.textContent = candidate?.name || 'Candidate unavailable'; person.append(avatar, candidateLink); candidateCell.append(person);
  const jobCell = document.createElement('td'); const jobLink = document.createElement('a'); jobLink.className = 'interview-job-link'; jobLink.href = record.jobId ? `job-applicants.html?job=${encodeURIComponent(record.jobId)}` : 'jobs.html'; jobLink.textContent = application?.title || record.jobId || 'Job unavailable'; jobCell.append(jobLink);
  const typeCell = document.createElement('td'); typeCell.textContent = record.type || 'Interview'; const interviewerCell = document.createElement('td'); interviewerCell.textContent = record.interviewer || 'Not assigned';
  const statusCell = document.createElement('td'); const statusSelect = document.createElement('select'); statusSelect.className = 'interview-status-select'; statusSelect.setAttribute('aria-label', `Update ${candidate?.name || 'candidate'} interview status`); ['Scheduled', 'Completed', 'Cancelled'].forEach((status) => statusSelect.add(new Option(status, status))); statusSelect.value = record.status || 'Scheduled'; statusSelect.addEventListener('change', () => { record.status = statusSelect.value; if (rmapInterviewsSave()) window.RMAPActivity?.log({action:`Marked ${record.status.toLowerCase()}`,entity:'Interview',name:`${candidate?.name || 'Candidate'} · ${application?.title || record.jobId}`,description:`${record.type || 'Interview'} with ${record.interviewer || 'unassigned interviewer'}.`}); rmapInterviewsRender(); showWorkflowToast(`Interview marked ${record.status.toLowerCase()}.`); }); statusCell.append(statusSelect);
  const openCell = document.createElement('td'); const openLink = document.createElement('a'); openLink.className = 'interview-open-link'; openLink.href = `applications.html?candidate=${encodeURIComponent(record.candidateId)}&job=${encodeURIComponent(record.jobId || '')}`; openLink.textContent = 'Open application'; openCell.append(openLink);
  row.append(dateCell, timeCell, candidateCell, jobCell, typeCell, interviewerCell, statusCell, openCell); return row;
}
function rmapInterviewsRender() {
  const filtered = rmapInterviewsRecords.filter(rmapInterviewsMatches).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  rmapInterviewsBody.replaceChildren(...filtered.map(rmapInterviewsRow));
  document.getElementById('interviews-empty').hidden = filtered.length > 0;
  document.getElementById('interview-result-count').textContent = `Showing ${filtered.length} of ${rmapInterviewsRecords.length} interviews`;
  const today = rmapInterviewsLocalIso(new Date());
  document.getElementById('interview-scheduled-count').textContent = rmapInterviewsRecords.filter((record) => record.status === 'Scheduled').length;
  document.getElementById('interview-today-count').textContent = rmapInterviewsRecords.filter((record) => record.status === 'Scheduled' && record.date === today).length;
  document.getElementById('interview-completed-count').textContent = rmapInterviewsRecords.filter((record) => record.status === 'Completed').length;
  document.getElementById('interview-cancelled-count').textContent = rmapInterviewsRecords.filter((record) => record.status === 'Cancelled').length;
  window.RMAPInterviewCount?.refresh();
}
function rmapInterviewsOpenModal(selected = '') { rmapInterviewsForm.reset(); rmapInterviewsFillApplications(selected); document.getElementById('interview-date').value = rmapInterviewsDateIn(1); document.getElementById('interview-time').value = '10:30'; const signedUser = (() => { try { return JSON.parse(sessionStorage.getItem('rmapUser') || 'null'); } catch { return null; } })(); rmapInterviewsForm.elements.interviewer.value = signedUser?.name || ''; rmapInterviewsModal.hidden = false; rmapInterviewsApplicationSelect.focus(); }
function rmapInterviewsCloseModal() { rmapInterviewsModal.hidden = true; }
document.getElementById('schedule-interview').addEventListener('click', () => rmapInterviewsOpenModal());
document.querySelectorAll('[data-close-interview]').forEach((button) => button.addEventListener('click', rmapInterviewsCloseModal));
rmapInterviewsModal.addEventListener('click', (event) => { if (event.target === rmapInterviewsModal) rmapInterviewsCloseModal(); });
rmapInterviewsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const [candidateId, jobId] = rmapInterviewsApplicationSelect.value.split('|');
  const candidate = rmapInterviewsCandidates.find((item) => item.id === candidateId && !item.archived);
  const application = candidate?.applications?.find((item) => item.jobId === jobId);
  if (!candidate || !application) { showWorkflowToast('Select a valid candidate application first.'); return; }
  const record = { id: `INT-${Date.now()}`, candidateId, jobId, date: rmapInterviewsForm.elements.date.value, time: rmapInterviewsForm.elements.time.value, type: rmapInterviewsForm.elements.type.value, interviewer: rmapInterviewsForm.elements.interviewer.value.trim(), location: rmapInterviewsForm.elements.location.value.trim(), notes: rmapInterviewsForm.elements.notes.value.trim(), status: 'Scheduled' };
  application.stage = 'Interview'; if ((candidate.applications || []).length === 1) candidate.stage = 'Interview';
  rmapInterviewsRecords.push(record);
  window.RMAPCandidateStore.save(rmapInterviewsWorkspace, rmapInterviewsCandidates);
  if (rmapInterviewsSave()) window.RMAPActivity?.log({action:'Scheduled',entity:'Interview',name:`${candidate.name} · ${application.title || jobId}`,description:`${record.type} with ${record.interviewer || 'unassigned interviewer'} on ${record.date} at ${record.time}.`}); rmapInterviewsCloseModal(); rmapInterviewsRender(); showWorkflowToast(`Interview scheduled with ${candidate.name}.`);
});
function rmapInterviewsSyncSearch(from, to) { to.value = from.value; rmapInterviewsRender(); }
rmapInterviewsSearch.addEventListener('input', () => rmapInterviewsSyncSearch(rmapInterviewsSearch, rmapInterviewsGlobalSearch));
rmapInterviewsGlobalSearch.addEventListener('input', () => rmapInterviewsSyncSearch(rmapInterviewsGlobalSearch, rmapInterviewsSearch));
rmapInterviewsStatusFilter.addEventListener('change', rmapInterviewsRender); rmapInterviewsDateFilter.addEventListener('change', rmapInterviewsRender);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') rmapInterviewsCloseModal(); });
rmapInterviewsLoad(); rmapInterviewsFillApplications();
const rmapInterviewsParams = new URLSearchParams(location.search);
if (rmapInterviewsParams.get('schedule') === '1') { const selected = `${rmapInterviewsParams.get('candidate') || ''}|${rmapInterviewsParams.get('job') || ''}`; rmapInterviewsOpenModal(selected); }
rmapInterviewsRender();
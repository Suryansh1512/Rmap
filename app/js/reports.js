// Build reports from the selected workspace's saved recruitment records.
const rmapReportsWorkspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';
const rmapReportsCandidates = window.RMAPCandidateStore.load(rmapReportsWorkspace).filter((candidate) => !candidate.archived);
let rmapReportsJobs = []; let rmapReportsInterviews = [];
try { const value = JSON.parse(localStorage.getItem(`rmapJobsV1:${rmapReportsWorkspace}`) || '[]'); if (Array.isArray(value)) rmapReportsJobs = value; } catch {}
try { const value = JSON.parse(localStorage.getItem(`rmapInterviewsV1:${rmapReportsWorkspace}`) || '[]'); if (Array.isArray(value)) rmapReportsInterviews = value; } catch {}
const rmapReportsApplications = rmapReportsCandidates.flatMap((candidate) => (candidate.applications || []).map((application) => ({candidate, application})));
const rmapReportsJobMap = new Map(rmapReportsJobs.map((job) => [job.id, job]));
const rmapReportsType = document.getElementById('report-type'); const rmapReportsPeriod = document.getElementById('report-period');
const rmapReportsDefinitions = {
  pipeline: {title:'Hiring pipeline report', description:'Applications grouped by their current stage.', category:'Stage'},
  source: {title:'Source effectiveness report', description:'Candidate applications grouped by their recorded source.', category:'Candidate source'},
  jobs: {title:'Job performance report', description:'Candidate activity grouped by job.', category:'Job'},
  interviews: {title:'Interview outcomes report', description:'Interview records grouped by their current status.', category:'Interview status'}
};
function rmapReportsDate(value) { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function rmapReportsInPeriod(value) { if (rmapReportsPeriod.value === 'all') return true; const date = rmapReportsDate(value); return !!date && Date.now() - date.getTime() <= Number(rmapReportsPeriod.value) * 86400000; }
function rmapReportsCurrentApplications() { return rmapReportsApplications.filter(({candidate, application}) => rmapReportsInPeriod(application.applied || candidate.added)); }
function rmapReportsCurrentInterviews() { return rmapReportsInterviews.filter((interview) => rmapReportsInPeriod(interview.date)); }
function rmapReportsTitle(application) { return rmapReportsJobMap.get(application.jobId)?.title || application.title || application.jobId || 'Unassigned role'; }
function rmapReportsCurrentStage(candidate, application) { return application.stage || candidate.stage || 'New'; }
function rmapReportsRows(applications, interviews) {
  const groups = new Map(); const ensure = (name) => { if (!groups.has(name)) groups.set(name, {name, applications:0, interviews:0, hires:0, applicationKeys:new Set(), hireKeys:new Set()}); return groups.get(name); };
  const type = rmapReportsType.value;
  if (type !== 'interviews') applications.forEach(({candidate, application}) => {
    const stage = rmapReportsCurrentStage(candidate, application); const name = type === 'pipeline' ? stage : type === 'source' ? (candidate.source || 'Not recorded') : rmapReportsTitle(application);
    const row = ensure(name); row.applications += 1; if (stage === 'Hired') row.hires += 1;
  });
  interviews.forEach((interview) => {
    const candidate = rmapReportsCandidates.find((item) => item.id === interview.candidateId);
    const application = candidate?.applications?.find((item) => item.jobId === interview.jobId);
    const name = type === 'interviews' ? (interview.status || 'Unknown') : type === 'pipeline' ? (application ? rmapReportsCurrentStage(candidate, application) : 'Interview') : type === 'source' ? (candidate?.source || 'Not recorded') : rmapReportsTitle(application || {jobId:interview.jobId});
    const row = ensure(name); row.interviews += 1;
    if (type === 'interviews' && application) { const key = `${candidate.id}|${application.jobId}`; row.applicationKeys.add(key); if (rmapReportsCurrentStage(candidate, application) === 'Hired') row.hireKeys.add(key); }
  });
  return [...groups.values()].map((row) => ({name:row.name, applications:type === 'interviews' ? row.applicationKeys.size : row.applications, interviews:row.interviews, hires:type === 'interviews' ? row.hireKeys.size : row.hires})).sort((a,b) => b.applications - a.applications || a.name.localeCompare(b.name));
}function rmapReportsRender() {
  const applications = rmapReportsCurrentApplications(); const interviews = rmapReportsCurrentInterviews(); const rows = rmapReportsRows(applications, interviews); const type = rmapReportsType.value; const definition = rmapReportsDefinitions[type];
  document.getElementById('report-table-title').textContent = definition.title; document.getElementById('report-description').textContent = definition.description; document.getElementById('report-category-heading').textContent = definition.category;
  document.getElementById('report-applications').textContent = applications.length; document.getElementById('report-jobs').textContent = new Set(applications.map(({application}) => application.jobId).filter(Boolean)).size; document.getElementById('report-interviews').textContent = interviews.length; document.getElementById('report-hires').textContent = applications.filter(({candidate, application}) => rmapReportsCurrentStage(candidate, application) === 'Hired').length;
  const body = document.getElementById('report-table-body'); body.replaceChildren();
  rows.forEach((item) => { const row = document.createElement('tr'); const values = [item.name, item.applications, item.interviews, item.hires, `${item.applications ? Math.round(item.hires / item.applications * 100) : 0}%`]; values.forEach((value) => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }); body.append(row); });
  document.getElementById('report-empty').hidden = rows.length > 0; document.getElementById('report-result-count').textContent = `${rows.length} report row${rows.length === 1 ? '' : 's'}`;
}
rmapReportsType.addEventListener('change', rmapReportsRender); rmapReportsPeriod.addEventListener('change', rmapReportsRender);
document.getElementById('export-report').addEventListener('click', () => {
  const applications = rmapReportsCurrentApplications(); const interviews = rmapReportsCurrentInterviews(); const rows = rmapReportsRows(applications, interviews);
  if (!rows.length) { showWorkflowToast('There are no records in this report to export.'); return; }
  const output = [[rmapReportsDefinitions[rmapReportsType.value].category, 'Applications', 'Interviews', 'Hires', 'Hire rate'], ...rows.map((item) => [item.name, item.applications, item.interviews, item.hires, `${item.applications ? Math.round(item.hires / item.applications * 100) : 0}%`])];
  const csv = output.map((row) => row.map((value) => `"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'})); const link = document.createElement('a'); link.href = url; link.download = `rmap-${rmapReportsType.value}-report.csv`; link.click(); URL.revokeObjectURL(url); showWorkflowToast('Report exported as CSV.');
});
rmapReportsRender();
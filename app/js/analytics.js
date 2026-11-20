// Analytics derives each result from the selected workspace's candidate, job, and interview records.
const rmapAnalyticsWorkspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';
const rmapAnalyticsCandidates = window.RMAPCandidateStore.load(rmapAnalyticsWorkspace);
let rmapAnalyticsJobs = [];
let rmapAnalyticsInterviews = [];
try { rmapAnalyticsJobs = JSON.parse(localStorage.getItem(`rmapJobsV1:${rmapAnalyticsWorkspace}`) || '[]'); if (!Array.isArray(rmapAnalyticsJobs)) rmapAnalyticsJobs = []; } catch { rmapAnalyticsJobs = []; }
try { rmapAnalyticsInterviews = JSON.parse(localStorage.getItem(`rmapInterviewsV1:${rmapAnalyticsWorkspace}`) || '[]'); if (!Array.isArray(rmapAnalyticsInterviews)) rmapAnalyticsInterviews = []; } catch { rmapAnalyticsInterviews = []; }
const rmapAnalyticsJobMap = new Map(rmapAnalyticsJobs.map((job) => [job.id, job]));
const rmapAnalyticsApplications = rmapAnalyticsCandidates.filter((candidate) => !candidate.archived).flatMap((candidate) => (candidate.applications || []).map((application) => ({ candidate, application })));
const rmapAnalyticsPeriod = document.getElementById('analytics-period');
const rmapAnalyticsColors = ['#5e78e8', '#8d72df', '#36b58c', '#e5ad48', '#e47882', '#58aac6', '#93a1b8'];
const rmapAnalyticsStages = ['Prospect', 'New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
function rmapAnalyticsDate(value) { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function rmapAnalyticsJobTitle(application) { return rmapAnalyticsJobMap.get(application.jobId)?.title || application.title || application.jobId || 'Unassigned role'; }
function rmapAnalyticsDays() { return rmapAnalyticsPeriod.value === 'all' ? Infinity : Number(rmapAnalyticsPeriod.value); }
function rmapAnalyticsSince(dateValue) { const date = rmapAnalyticsDate(dateValue); if (!date) return rmapAnalyticsPeriod.value === 'all'; return Date.now() - date.getTime() <= rmapAnalyticsDays() * 86400000; }
function rmapAnalyticsFilteredApplications() { return rmapAnalyticsApplications.filter(({application, candidate}) => rmapAnalyticsSince(application.applied || candidate.added)); }
function rmapAnalyticsFilteredInterviews() { return rmapAnalyticsInterviews.filter((interview) => rmapAnalyticsSince(interview.date)); }
function rmapAnalyticsSetText(id, value) { document.getElementById(id).textContent = String(value); }
function rmapAnalyticsRenderPipeline(applications) {
  const host = document.getElementById('pipeline-chart'); host.replaceChildren();
  const counts = new Map(rmapAnalyticsStages.map((stage) => [stage, 0]));
  applications.forEach(({candidate, application}) => { const stage = application.stage || candidate.stage || 'New'; counts.set(stage, (counts.get(stage) || 0) + 1); });
  const maximum = Math.max(1, ...counts.values());
  rmapAnalyticsStages.forEach((stage, index) => {
    const row = document.createElement('div'); row.className = 'pipeline-row';
    const label = document.createElement('span'); label.className = 'pipeline-label'; label.textContent = stage;
    const track = document.createElement('span'); track.className = 'pipeline-track';
    const fill = document.createElement('span'); fill.className = 'pipeline-fill'; fill.style.width = `${counts.get(stage) / maximum * 100}%`; fill.style.background = rmapAnalyticsColors[index % rmapAnalyticsColors.length]; track.append(fill);
    const count = document.createElement('strong'); count.className = 'pipeline-count'; count.textContent = counts.get(stage);
    row.append(label, track, count); host.append(row);
  });
  host.setAttribute('aria-label', rmapAnalyticsStages.map((stage) => `${stage}: ${counts.get(stage)}`).join(', '));
}
function rmapAnalyticsRenderSources(applications) {
  const host = document.getElementById('source-legend'); host.replaceChildren();
  const counts = new Map(); applications.forEach(({candidate}) => { const source = candidate.source || 'Not recorded'; counts.set(source, (counts.get(source) || 0) + 1); });
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]); const total = applications.length;
  rmapAnalyticsSetText('source-total', total);
  if (!total) { document.getElementById('source-donut').style.background = '#e8ecf3'; const empty = document.createElement('span'); empty.className = 'analytics-chart-empty'; empty.textContent = 'No source data yet'; host.append(empty); return; }
  let offset = 0; const segments = entries.map(([, count], index) => { const start = offset; offset += count / total * 360; return `${rmapAnalyticsColors[index % rmapAnalyticsColors.length]} ${start}deg ${offset}deg`; });
  document.getElementById('source-donut').style.background = `conic-gradient(${segments.join(',')})`;
  entries.forEach(([source, count], index) => {
    const item = document.createElement('div'); item.className = 'source-legend-item';
    const swatch = document.createElement('span'); swatch.className = 'source-swatch'; swatch.style.background = rmapAnalyticsColors[index % rmapAnalyticsColors.length];
    const name = document.createElement('span'); name.textContent = source;
    const value = document.createElement('strong'); value.textContent = `${count} · ${Math.round(count / total * 100)}%`;
    item.append(swatch, name, value); host.append(item);
  });
  if (!entries.length) { const empty = document.createElement('span'); empty.className = 'analytics-chart-empty'; empty.textContent = 'No source data yet'; host.append(empty); }
}
function rmapAnalyticsRenderActivity() {
  const host = document.getElementById('activity-chart'); host.replaceChildren();
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - offset); days.push(date); }
  const counts = days.map((date) => { const day = date.toDateString(); return rmapAnalyticsApplications.filter(({application, candidate}) => rmapAnalyticsDate(application.applied || candidate.added)?.toDateString() === day).length; });
  const maximum = Math.max(1, ...counts);
  days.forEach((date, index) => {
    const column = document.createElement('div'); column.className = 'activity-column';
    const value = document.createElement('span'); value.className = 'activity-value'; value.textContent = counts[index];
    const wrap = document.createElement('span'); wrap.className = 'activity-bar-wrap';
    const bar = document.createElement('span'); bar.className = 'activity-bar'; bar.style.height = `${counts[index] ? Math.max(5, counts[index] / maximum * 100) : 2}%`; bar.title = `${counts[index]} application${counts[index] === 1 ? '' : 's'}`; wrap.append(bar);
    const label = document.createElement('span'); label.className = 'activity-day'; label.textContent = date.toLocaleDateString('en-US', { weekday: 'short' });
    column.append(value, wrap, label); host.append(column);
  });
}
function rmapAnalyticsRenderJobs(applications) {
  const host = document.getElementById('top-jobs-list'); host.replaceChildren();
  const counts = new Map(); applications.forEach(({application}) => { const title = rmapAnalyticsJobTitle(application); counts.set(title, (counts.get(title) || 0) + 1); });
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5); const maximum = Math.max(1, ...entries.map(([, count]) => count));
  entries.forEach(([title, count]) => {
    const row = document.createElement('div'); row.className = 'top-job-row'; const name = document.createElement('span'); name.className = 'top-job-name'; name.textContent = title; name.title = title;
    const track = document.createElement('span'); track.className = 'top-job-track'; const fill = document.createElement('span'); fill.className = 'top-job-fill'; fill.style.width = `${count / maximum * 100}%`; track.append(fill);
    const total = document.createElement('strong'); total.className = 'top-job-count'; total.textContent = count; row.append(name, track, total); host.append(row);
  });
  if (!entries.length) { const empty = document.createElement('span'); empty.className = 'analytics-chart-empty'; empty.textContent = 'No applications in this period'; host.append(empty); }
}
function rmapAnalyticsRenderHighlights(applications, interviews) {
  const host = document.getElementById('analytics-highlights'); host.replaceChildren();
  const sources = new Map(); const stages = new Map(); applications.forEach(({candidate, application}) => { const source = candidate.source || 'Not recorded'; const stage = application.stage || candidate.stage || 'New'; sources.set(source, (sources.get(source) || 0) + 1); stages.set(stage, (stages.get(stage) || 0) + 1); });
  const topSource = [...sources.entries()].sort((a, b) => b[1] - a[1])[0]; const topStage = [...stages.entries()].sort((a, b) => b[1] - a[1])[0];
  const highlights = [
    ['Leading source', topSource ? `${topSource[0]} accounts for ${topSource[1]} application${topSource[1] === 1 ? '' : 's'} in this period.` : 'No applications are recorded in this period.'],
    ['Most common stage', topStage ? `${topStage[0]} is the most common stage, with ${topStage[1]} application${topStage[1] === 1 ? '' : 's'}.` : 'Stage insights will appear when applications are added.'],
    ['Interview activity', `${interviews.filter((interview) => interview.status === 'Scheduled').length} scheduled, ${interviews.filter((interview) => interview.status === 'Completed').length} completed in this period.`]
  ];
  highlights.forEach(([title, copy]) => { const card = document.createElement('article'); card.className = 'analytics-highlight'; const heading = document.createElement('strong'); heading.textContent = title; const description = document.createElement('span'); description.textContent = copy; card.append(heading, description); host.append(card); });
}
function rmapAnalyticsRender() {
  const applications = rmapAnalyticsFilteredApplications(); const interviews = rmapAnalyticsFilteredInterviews();
  const jobsWithApplications = new Set(applications.map(({application}) => application.jobId).filter(Boolean));
  const hired = applications.filter(({candidate, application}) => (application.stage || candidate.stage) === 'Hired').length;
  rmapAnalyticsSetText('analytics-applications', applications.length); rmapAnalyticsSetText('analytics-open-jobs', jobsWithApplications.size);
  rmapAnalyticsSetText('analytics-scheduled', interviews.filter((interview) => interview.status === 'Scheduled').length);
  rmapAnalyticsSetText('analytics-hired', hired);
  rmapAnalyticsSetText('analytics-applications-note', `${rmapAnalyticsPeriod.value === 'all' ? 'All time' : `Last ${rmapAnalyticsPeriod.value} days`}`);
  rmapAnalyticsSetText('analytics-scheduled-note', 'Saved interviews in selected period');
  rmapAnalyticsSetText('analytics-hired-note', `${applications.length ? Math.round(hired / applications.length * 100) : 0}% of applications`);
  rmapAnalyticsRenderPipeline(applications); rmapAnalyticsRenderSources(applications); rmapAnalyticsRenderActivity(); rmapAnalyticsRenderJobs(applications); rmapAnalyticsRenderHighlights(applications, interviews);
}
rmapAnalyticsPeriod.addEventListener('change', rmapAnalyticsRender);
document.getElementById('export-analytics').addEventListener('click', () => {
  const applications = rmapAnalyticsFilteredApplications();
  if (!applications.length) { showWorkflowToast('There are no analytics records to export.'); return; }
  const rows = [['Candidate', 'Email', 'Job', 'Stage', 'Source', 'Applied']];
  applications.forEach(({candidate, application}) => rows.push([candidate.name, candidate.email, rmapAnalyticsJobTitle(application), application.stage || candidate.stage, candidate.source, application.applied || candidate.added]));
  const csv = rows.map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'rmap-analytics.csv'; link.click(); URL.revokeObjectURL(url); showWorkflowToast('Analytics data exported.');
});
rmapAnalyticsRender();
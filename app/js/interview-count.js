// Keep the sidebar interview badge in sync with scheduled workspace records.
(() => {
  const rmapInterviewCountWorkspace = sessionStorage.getItem('rmapWorkspace') || 'Acme Talent Group';
  const rmapInterviewCountBadge = document.querySelector('.nav-link[href="interviews.html"] .nav-count');
  if (!rmapInterviewCountBadge) return;
  const rmapInterviewCountRefresh = () => {
    let rmapInterviewCount = 0;
    try {
      const rmapStoredInterviews = localStorage.getItem(`rmapInterviewsV1:${rmapInterviewCountWorkspace}`);
      if (rmapStoredInterviews !== null) {
        const rmapParsedInterviews = JSON.parse(rmapStoredInterviews);
        if (Array.isArray(rmapParsedInterviews)) rmapInterviewCount = rmapParsedInterviews.filter((record) => record.status === 'Scheduled').length;
      } else {
        const rmapStoredCandidates = JSON.parse(localStorage.getItem(`rmapCandidatesV1:${rmapInterviewCountWorkspace}`) || '[]');
        if (Array.isArray(rmapStoredCandidates)) rmapInterviewCount = rmapStoredCandidates.filter((candidate) => !candidate.archived).reduce((total, candidate) => total + (candidate.applications || []).filter((application) => application.stage === 'Interview').length, 0);
      }
    } catch {}
    rmapInterviewCountBadge.textContent = String(rmapInterviewCount);
    rmapInterviewCountBadge.hidden = rmapInterviewCount === 0;
  };
  window.RMAPInterviewCount = { refresh: rmapInterviewCountRefresh };
  rmapInterviewCountRefresh();
})();
// Minimal theme-aware decoration for the isolated RMAP page background.
(() => {
  const rmapBgBody = document.body;
  const rmapBgRoot = document.documentElement;
  rmapBgRoot.classList.add('rmap-bg-root');
  const rmapBgScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const rmapBgMode = () => {
    let rmapBgPreference = 'system';
    try { rmapBgPreference = localStorage.getItem('rmapAppearance') || 'system'; } catch {}
    const rmapBgDark = rmapBgPreference === 'dark' || (rmapBgPreference === 'system' && rmapBgScheme.matches);
    rmapBgBody.classList.toggle('rmap-bg-dark', rmapBgDark);
    rmapBgRoot.classList.toggle('rmap-bg-root-dark', rmapBgDark);
  };
  rmapBgMode();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const rmapBgCount = window.innerWidth < 700 ? 10 : 18;
    const rmapBgFragment = document.createDocumentFragment();
    for (let rmapBgIndex = 0; rmapBgIndex < rmapBgCount; rmapBgIndex += 1) {
      const rmapBgParticle = document.createElement('span');
      rmapBgParticle.className = 'rmap-bg-particle';
      rmapBgParticle.setAttribute('aria-hidden', 'true');
      rmapBgParticle.style.setProperty('--rmap-bg-x', `${(rmapBgIndex * 47 + 9) % 100}%`);
      rmapBgParticle.style.setProperty('--rmap-bg-y', `${(rmapBgIndex * 61 + 13) % 100}%`);
      rmapBgParticle.style.setProperty('--rmap-bg-size', `${2 + (rmapBgIndex % 3)}px`);
      rmapBgParticle.style.setProperty('--rmap-bg-duration', `${12 + (rmapBgIndex % 8)}s`);
      rmapBgParticle.style.setProperty('--rmap-bg-delay', `${-(rmapBgIndex % 11)}s`);
      rmapBgFragment.append(rmapBgParticle);
    }
    rmapBgBody.append(rmapBgFragment);
  }
  rmapBgScheme.addEventListener?.('change', () => {
    let rmapBgPreference = 'system';
    try { rmapBgPreference = localStorage.getItem('rmapAppearance') || 'system'; } catch {}
    if (rmapBgPreference === 'system') rmapBgMode();
  });
  window.addEventListener('storage', (rmapBgEvent) => {
    if (rmapBgEvent.key === 'rmapAppearance') rmapBgMode();
  });
  new MutationObserver(rmapBgMode).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
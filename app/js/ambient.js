// Pointer responsive ambient motion shared by the application pages.
(() => {
  const surface = document.querySelector('.workspace');
  if (!surface || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let frame = 0;
  surface.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = surface.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / Math.max(bounds.height, window.innerHeight)) * 100;
      surface.style.setProperty('--pointer-x', `${Math.max(0, Math.min(100, x))}%`);
      surface.style.setProperty('--pointer-y', `${Math.max(0, Math.min(100, y))}%`);
      surface.style.setProperty('--pointer-shift-x', `${(x - 50) * 0.16}px`);
      surface.style.setProperty('--pointer-shift-y', `${(y - 50) * 0.08}px`);
      surface.classList.add('pointer-active');
    });
  }, { passive: true });
  surface.addEventListener('pointerleave', () => surface.classList.remove('pointer-active'), { passive: true });
})();
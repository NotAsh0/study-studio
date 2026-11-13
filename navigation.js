(() => {
  const bar = document.querySelector('#topbar');
  const groups = [...document.querySelectorAll('.nav-group')];
  const closeMenus = () => groups.forEach(group => { group.open = false; });

  groups.forEach(group => group.addEventListener('toggle', () => {
    if (group.open) groups.forEach(other => { if (other !== group) other.open = false; });
  }));
  bar.addEventListener('click', event => {
    if (event.target.closest('.nav')) closeMenus();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-group')) closeMenus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const open = groups.find(group => group.open);
      if (open) { closeMenus(); open.querySelector('summary').focus(); }
    }
  });

  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 6) return;
    const interacting = groups.some(group => group.open) ||
      (bar.contains(document.activeElement) && document.activeElement.matches(':focus-visible'));
    bar.classList.toggle('is-hidden', !interacting && y > 120 && y > lastY);
    lastY = y;
  }, { passive: true });
  bar.addEventListener('focusin', () => bar.classList.remove('is-hidden'));
})();

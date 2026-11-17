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

  const mobileNav = document.querySelector('.mobile-nav');
  const mobileMore = document.querySelector('.mobile-more');
  mobileNav.addEventListener('click', event => {
    const button = event.target.closest('[data-mobile-page]');
    if (!button) return;
    mobileMore.open = false;
    document.querySelector('.topnav .nav[data-page="' + button.dataset.mobilePage + '"]').click();
    window.scrollTo({top: 0, behavior: 'instant'});
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.mobile-more')) mobileMore.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileMore.open) {
      mobileMore.open = false;
      mobileMore.querySelector('summary').focus();
    }
  });

  const book = document.querySelector('#bookLogo');
  book.addEventListener('click', () => {
    book.classList.remove('book-startled');
    void book.offsetWidth;
    book.classList.add('book-startled');
  });
  book.addEventListener('animationend', () => book.classList.remove('book-startled'));

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

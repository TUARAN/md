// Generated from lib/content/syncblogDocs.mjs; edit that source and regenerate.
(() => {
  const links = [...document.querySelectorAll('[data-section]')];
  const sections = [...document.querySelectorAll('main > details')];
  function reveal() {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!(target instanceof HTMLDetailsElement)) return;
    target.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  let frame;
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      let active = sections[0];
      for (const section of sections) if (section.getBoundingClientRect().top <= 100) active = section;
      for (const link of links) {
        if (link.dataset.section === active?.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    });
  }
  for (const link of links) link.addEventListener('click', () => {
    const target = document.getElementById(link.dataset.section);
    if (target) target.open = true;
  });
  window.addEventListener('hashchange', reveal);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('toggle', schedule, true);
  reveal(); schedule();
})();
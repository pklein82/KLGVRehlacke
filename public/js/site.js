'use strict';

/* ---------- Design umschalten ---------- */

(function themeToggle() {
  const button = document.getElementById('theme-toggle');
  if (!button) return;

  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const current = () => root.getAttribute('data-theme')
    || (prefersDark.matches ? 'dark' : 'light');

  button.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('rehlacke-theme', next); } catch (e) { /* ignorieren */ }
  });
})();

/* ---------- Mobiles Menü ---------- */

(function mobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    if (!open) nav.querySelectorAll('.nav-group[open]').forEach((g) => { g.open = false; });
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
})();

/* ---------- Navigationsgruppen ---------- */

(function navGroups() {
  const groups = [...document.querySelectorAll('.nav-group')];
  if (!groups.length) return;

  const closeAll = (except) => {
    groups.forEach((group) => { if (group !== except) group.open = false; });
  };

  groups.forEach((group) => {
    group.addEventListener('toggle', () => { if (group.open) closeAll(group); });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-group')) closeAll();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = groups.find((group) => group.open);
    if (open) {
      open.open = false;
      open.querySelector('summary')?.focus();
    }
  });
})();

/* ---------- Schatten am Kopfbereich beim Scrollen ---------- */

(function stickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  header.parentNode.insertBefore(sentinel, header);

  new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-stuck', !entry.isIntersecting),
    { rootMargin: '0px' },
  ).observe(sentinel);
})();

/* ---------- Inhalte sanft einblenden ---------- */

(function reveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
    // Früh auslösen (200px vor dem Sichtbereich), damit beim schnellen
    // Scrollen keine leeren Flächen entstehen.
  }, { threshold: 0, rootMargin: '200px 0px 200px 0px' });

  targets.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
    observer.observe(el);
  });

  // Sicherheitsnetz: Inhalte dürfen nie dauerhaft unsichtbar bleiben,
  // auch wenn der Observer aus irgendeinem Grund nicht auslöst.
  setTimeout(() => {
    targets.forEach((el) => el.classList.add('is-visible'));
    observer.disconnect();
  }, 1200);
})();

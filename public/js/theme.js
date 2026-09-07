/* Wird im <head> synchron geladen, damit das Design beim Laden nicht kurz umspringt. */
(function () {
  // Markiert, dass JavaScript läuft. Ohne diese Klasse bleiben Inhalte, die
  // beim Scrollen eingeblendet werden, von Anfang an sichtbar.
  document.documentElement.classList.add('js');

  try {
    var stored = localStorage.getItem('rehlacke-theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) { /* z. B. blockierte Cookies – dann gilt die Systemeinstellung */ }
})();

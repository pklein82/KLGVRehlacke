'use strict';

/*
 * Wird nur im statischen Export eingebunden. Ohne Server können Formulare
 * nichts absenden und Dateien nicht ausgeliefert werden - beides wird hier
 * sichtbar abgeschaltet, statt es ins Leere laufen zu lassen.
 */

/* Der Redaktionsbereich ist im Export nicht enthalten – der Link würde ins Leere führen. */
(function dropAdminLink() {
  document.querySelectorAll('a[href$="/admin"]').forEach((a) => a.remove());
})();

(function staticNotice() {
  document.querySelectorAll('form[method="post"]').forEach((form) => {
    form.addEventListener('submit', (event) => event.preventDefault());
    form.querySelectorAll('input, textarea, select, button').forEach((el) => {
      el.disabled = true;
    });
    form.classList.add('is-inert');

    const note = document.createElement('p');
    note.className = 'static-note';
    note.innerHTML = '<strong>Nur Ansicht.</strong> Diese Seite ist ein statischer '
      + 'Abzug. Das Absenden braucht die laufende Anwendung – dort landet die '
      + 'Nachricht im Redaktionsbereich.';
    form.parentNode.insertBefore(note, form);
  });
})();

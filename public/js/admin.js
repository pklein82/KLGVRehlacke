'use strict';

/* ---------- Löschen bestätigen ---------- */

document.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-confirm]');
  if (form && !window.confirm(form.dataset.confirm)) event.preventDefault();
});

/* ---------- Markdown-Editor: Werkzeugleiste und Vorschau ---------- */

const MARKUP = {
  h2: { before: '## ', after: '', placeholder: 'Überschrift' },
  bold: { before: '**', after: '**', placeholder: 'fetter Text' },
  italic: { before: '*', after: '*', placeholder: 'kursiver Text' },
  ul: { before: '- ', after: '', placeholder: 'Listenpunkt' },
  quote: { before: '> ', after: '', placeholder: 'Zitat' },
  link: { before: '[', after: '](https://)', placeholder: 'Linktext' },
};

document.querySelectorAll('[data-editor]').forEach((editor) => {
  const input = editor.querySelector('[data-editor-input]');
  const preview = editor.querySelector('[data-editor-preview]');
  const csrf = document.querySelector('input[name="_csrf"]')?.value || '';

  editor.querySelectorAll('[data-md]').forEach((button) => {
    button.addEventListener('click', () => {
      const rule = MARKUP[button.dataset.md];
      if (!rule) return;

      const { selectionStart: start, selectionEnd: end, value } = input;
      const selected = value.slice(start, end) || rule.placeholder;
      const replacement = rule.before + selected + rule.after;

      input.setRangeText(replacement, start, end, 'end');
      input.focus();
      if (!value.slice(start, end)) {
        input.setSelectionRange(start + rule.before.length, start + rule.before.length + selected.length);
      }
    });
  });

  const viewButtons = editor.querySelectorAll('[data-view]');
  const showPreview = async (on) => {
    viewButtons.forEach((b) => b.classList.toggle('is-active', (b.dataset.view === 'preview') === on));
    input.hidden = on;
    preview.hidden = !on;
    if (!on) return;

    preview.innerHTML = '<p class="text-muted">Vorschau wird geladen …</p>';
    try {
      const body = new URLSearchParams({ text: input.value, _csrf: csrf });
      const response = await fetch('/admin/vorschau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      preview.innerHTML = response.ok
        ? (await response.text()) || '<p class="text-muted">(noch kein Text)</p>'
        : '<p class="text-muted">Vorschau nicht verfügbar.</p>';
    } catch (error) {
      preview.innerHTML = '<p class="text-muted">Vorschau nicht verfügbar.</p>';
    }
  };

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => showPreview(button.dataset.view === 'preview'));
  });
});

/* ---------- Pfad aus der Mediathek kopieren ---------- */

document.querySelectorAll('[data-copy]').forEach((field) => {
  field.addEventListener('click', () => {
    field.select();
    try {
      navigator.clipboard?.writeText(field.value);
    } catch (error) { /* dann bleibt der Text markiert */ }
  });
});

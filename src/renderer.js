const formEl = document.querySelector('#add-form');
const inputEl = document.querySelector('#note-text');

formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = inputEl?.value ?? '';

  try {
    setStatus('Saving…');
    await window.db.addNote(text);
    if (inputEl) inputEl.value = '';
    await refresh();
    setStatus('');
  } catch (err) {
    setStatus(err?.message ?? String(err));
  }
});
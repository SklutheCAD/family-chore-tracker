// app.js
// Minimal working wiring for button clicks + simple localStorage

(function () {
  // Ensure DOM exists before querying
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Chore Tracker loaded');

    const kidListEl = document.getElementById('kid-list');
    const choreBoardEl = document.getElementById('chore-board');

    // Local state
    let kids = load('kids', []);
    let chores = load('chores', []);

    renderKids();
    renderChores();

    // Event delegation for all buttons with data-action
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      e.preventDefault(); // stops accidental form submits
      const action = btn.getAttribute('data-action');
      console.log('Button clicked:', action);

      switch (action) {
        case 'add-kid':
          addKid();
          break;
        case 'remove-kid':
          removeKid();
          break;
        case 'save-kids':
          save('kids', kids);
          alert('Kids saved ✅');
          break;
        case 'add-chore':
          addChore();
          break;
        case 'assign-random':
          assignRandom();
          break;
        case 'clear-all':
          kids = [];
          chores = [];
          save('kids', kids);
          save('chores', chores);
          renderKids();
          renderChores();
          break;
        default:
          console.warn('Unknown action:', action);
      }
    });

    // --- Helpers ---
    function addKid() {
      const name = prompt('Kid name?');
      if (!name) return;
      kids.push(name.trim());
      renderKids();
    }

    function removeKid() {
      if (!kids.length) return alert('No kids to remove');
      const name = prompt(`Remove which kid?\n${kids.join(', ')}`);
      if (!name) return;
      kids = kids.filter(k => k.toLowerCase() !== name.trim().toLowerCase());
      renderKids();
    }

    function addChore() {
      const text = prompt('Chore description?');
      if (!text) return;
      chores.push({ text: text.trim(), assignedTo: null });
      save('chores', chores);
      renderChores();
    }

    function assignRandom() {
      if (!kids.length || !chores.length) return alert('Need kids and chores first');
      chores = chores.map(c => ({ ...c, assignedTo: kids[Math.floor(Math.random() * kids.length)] }));
      save('chores', chores);
      renderChores();
    }

    function renderKids() {
      save('kids', kids); // persist as you go
      kidListEl.innerHTML = kids.map(k => `<li>${escapeHtml(k)}</li>`).join('') || '<li><em>No kids added yet</em></li>';
    }

    function renderChores() {
      choreBoardEl.innerHTML = chores.length
        ? chores.map(c => `
          <div class="chore-card">
            <div class="chore-text">${escapeHtml(c.text)}</div>
            <div class="chore-assigned">${c.assignedTo ? 'Assigned to: ' + escapeHtml(c.assignedTo) : '<em>Unassigned</em>'}</div>
          </div>
        `).join('')
        : '<p><em>No chores yet</em></p>';
    }

    function save(key, value) {
      localStorage.setItem(`choretracker:${key}`, JSON.stringify(value));
    }

    function load(key, fallback) {
      try {
        const raw = localStorage.getItem(`choretracker:${key}`);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    }

    function escapeHtml(str) {
      return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }
  });
})();

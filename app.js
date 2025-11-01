// Family Chore Tracker – Eva, Henry, Eli with custom chore list
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const KIDS = ['Eva', 'Henry', 'Eli'];

    // === YOUR CUSTOM CHORE LIST ===
    const DEFAULT_CHORES = [
      { id: 'hygiene-brush-teeth',        type: 'Hygiene',     name: 'Brush Teeth',            points: 1 },

      { id: 'pets-feed-or-water-sully',   type: 'Pets',        name: 'Feed or Water Sully',    points: 1 },
      { id: 'pets-water-big-chickens',    type: 'Pets',        name: 'Water Big Chickens',     points: 3 },
      { id: 'pets-feed-big-chickens',     type: 'Pets',        name: 'Feed Big Chickens',      points: 3 },
      { id: 'pets-water-little-chickens', type: 'Pets',        name: 'Water little Chickens',  points: 3 },
      { id: 'pets-feed-little-chickens',  type: 'Pets',        name: 'Feed Little Chickens',   points: 3 },
      { id: 'pets-feed-ducks-geese',      type: 'Pets',        name: 'Feed Ducks/Geese',       points: 3 },
      { id: 'pets-water-ducks-geese',     type: 'Pets',        name: 'Water Ducks/Geese',      points: 3 },
      { id: 'pets-clean-chicken-coop',    type: 'Pets',        name: 'Clean Chicken Coop',     points: 10 },
      { id: 'pets-gather-eggs',           type: 'Pets',        name: 'Gather the Eggs',        points: 1 },
      { id: 'pets-feed-outdoor-cats',     type: 'Pets',        name: 'Feed Outdoor Cats',      points: 1 },
      { id: 'pets-feed-indoor-cats',      type: 'Pets',        name: 'Feed Indoor Cats',       points: 1 },

      { id: 'house-put-away-laundry',     type: 'Household',   name: 'Put Away Laundry',       points: 2 },
      { id: 'school-do-homework',         type: 'School/Sport',name: 'Do Homework',            points: 2 },
      { id: 'house-clean-room',           type: 'Household',   name: 'Clean Room',             points: 3 },
      { id: 'house-clean-theater-room',   type: 'Household',   name: 'Clean Theater Room',     points: 2 },
      { id: 'house-clean-basement',       type: 'Household',   name: 'Clean Basement',         points: 2 },
      { id: 'house-tidy-front-entrance',  type: 'Household',   name: 'Tidy Front Entrance',    points: 2 },
      { id: 'house-empty-dishwasher',     type: 'Household',   name: 'Empty Dishwasher',       points: 2 },
      { id: 'house-gather-dishes',        type: 'Household',   name: 'Gather Dishes',          points: 1 },

      { id: 'sport-do-hockey-shots',      type: 'School/Sport',name: 'Do Hockey Shots',        points: 2 },
    ];

    // ----- Persistence -----
    function save(key, value) {
      localStorage.setItem('choretracker:' + key, JSON.stringify(value));
    }
    function load(key, fallback) {
      try {
        const raw = localStorage.getItem('choretracker:' + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    }

    // State
    let totals = load('totals', { Eva: 0, Henry: 0, Eli: 0 });
    let chores = load('chores', seedChores(DEFAULT_CHORES));
    let history = load('history', []);

    function seedChores(list) {
      return list.map(c => ({ ...c, done: false, who: null }));
    }

    // Elements
    const tbody = document.getElementById('chore-body');
    const resetBtn = document.getElementById('reset-day');
    const undoBtn = document.getElementById('undo-last');

    // Render
    renderScoreboard();
    renderChores();

    // ---- Event Handlers ----
    resetBtn.addEventListener('click', () => {
      if (!confirm('Reset day: clear all DONE statuses and totals?')) return;
      totals = { Eva: 0, Henry: 0, Eli: 0 };
      chores = seedChores(DEFAULT_CHORES);
      history = [];
      persist();
      renderScoreboard();
      renderChores();
    });

    undoBtn.addEventListener('click', () => {
      if (!history.length) return alert('Nothing to undo.');
      const last = history.pop(); // { choreId, name, points }
      totals[last.name] = Math.max(0, (totals[last.name] || 0) - last.points);
      const idx = chores.findIndex(c => c.id === last.choreId);
      if (idx >= 0) {
        chores[idx].done = false;
        chores[idx].who = null;
      }
      persist();
      renderScoreboard();
      renderChores();
    });

    // Click handler for DONE buttons
    tbody.addEventListener('click', (e) => {
      const doneBtn = e.target.closest('button[data-action="done"]');
      if (!doneBtn) return;
      const row = doneBtn.closest('tr');
      const choreId = row.dataset.id;
      const select = row.querySelector('select');
      const selected = select.value;

      const chore = chores.find(c => c.id === choreId);
      if (!chore) return;

      if (!selected) {
        alert('Select a name first.');
        return;
      }
      if (chore.done) return; // already done

      // Award points
      totals[selected] = (totals[selected] || 0) + chore.points;
      chore.done = true;
      chore.who = selected;
      history.push({ choreId: chore.id, name: selected, points: chore.points, ts: Date.now() });

      persist();
      renderScoreboard();
      renderChoreRow(row, chore); // re-render this row
    });

    // ----- Rendering -----
    function renderScoreboard() {
      KIDS.forEach(kid => {
        const el = document.getElementById('points-' + kid);
        if (el) el.textContent = (totals[kid] || 0);
      });
    }

    function renderChores() {
      tbody.innerHTML = '';
      chores.forEach(chore => {
        const tr = document.createElement('tr');
        tr.dataset.id = chore.id;
        tr.innerHTML = rowBodyCells(chore);
        tbody.appendChild(tr);
      });
    }

    function renderChoreRow(rowEl, chore) {
      rowEl.innerHTML = rowBodyCells(chore);
    }

    function rowBodyCells(chore) {
      const select = selectHtml(KIDS, chore.who);
      const buttonHtml = `<button class="small" data-action="done"${chore.done ? ' disabled' : ''}>DONE</button>`;
      const status = chore.done
        ? `<span class="status-chip done">Done by ${escapeHtml(chore.who)}</span>`
        : `<span class="status-chip">Not done</span>`;

      return `
        <td>${escapeHtml(chore.type)}</td>
        <td>${escapeHtml(chore.name)}</td>
        <td>${chore.points}</td>
        <td>${select}</td>
        <td>${buttonHtml}</td>
        <td>${status}</td>
      `;
    }

    function selectHtml(options, selectedValue) {
      const opts = ['<option value="">— Select —</option>']
        .concat(
          options.map(k =>
            `<option value="${escapeAttr(k)}"${selectedValue === k ? ' selected' : ''}>${escapeHtml(k)}</option>`
          )
        )
        .join('');
      return `<select data-role="picker">${opts}</select>`;
    }

    // ----- Utils -----
    function persist() {
      save('totals', totals);
      save('chores', chores);
      save('history', history);
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    function escapeAttr(str) {
      return escapeHtml(str).replace(/"/g, '&quot;');
    }
  });
})();

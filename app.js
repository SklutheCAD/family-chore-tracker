// Family Chore Tracker – single page, fixed kids, points on DONE
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const KIDS = ['Eva', 'Henry', 'Eli'];

    // Default chores (edit freely)
    const DEFAULT_CHORES = [
      { id: 'make-bed', name: 'Make Bed', points: 5 },
      { id: 'brush-teeth-am', name: 'Brush Teeth (AM)', points: 2 },
      { id: 'feed-pets', name: 'Feed Pets', points: 6 },
      { id: 'water-animals', name: 'Water Animals', points: 6 },
      { id: 'dishes', name: 'Do Dishes', points: 10 },
      { id: 'clean-room', name: 'Clean Room', points: 8 },
      { id: 'trash', name: 'Take Out Trash', points: 6 },
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

    // State shape
    // totals: { Eva: 0, Henry: 0, Eli: 0 }
    // chores: [{ id, name, points, done:false, who:null }]
    // history: [{ choreId, name, points, ts }]
    let totals = load('totals', { Eva: 0, Henry: 0, Eli: 0 });
    let chores = load('chores', seedChores(DEFAULT_CHORES));
    let history = load('history', []);

    function seedChores(list) {
      return list.map(c => ({ ...c, done: false, who: null }));
    }

    // UI refs
    const tbody = document.getElementById('chore-body');
    const resetBtn = document.getElementById('reset-day');
    const undoBtn = document.getElementById('undo-last');

    // Render everything
    renderScoreboard();
    renderChores();

    // Handlers
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

    // Event delegation for DONE buttons and selects
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
      renderChoreRow(row, chore); // re-render this one row
    });

    tbody.addEventListener('change', (e) => {
      const sel = e.target.closest('select[data-role="picker"]');
      if (!sel) return;
      // No side-effect here; we read the value when DONE is pressed.
    });

    // ----- Renderers -----
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
        tr.innerHTML = rowTemplate(chore);
        tbody.appendChild(tr);
      });
    }

    function renderChoreRow(rowEl, chore) {
      rowEl.innerHTML = rowBodyCells(chore);
      // keep row’s data-id
    }

    function rowTemplate(chore) {
      return rowBodyCells(chore);
    }

    function rowBodyCells(chore) {
      const select = selectHtml(KIDS, chore.who);
      const buttonHtml = `<button class="small" data-action="done"${chore.done ? ' disabled' : ''}>DONE</button>`;
      const status = chore.done
        ? `<span class="status-chip done">Done by ${escapeHtml(chore.who)}</span>`
        : `<span class="status-chip">Not done</span>`;

      return `
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

// Family Chore Tracker – grouped by Type; multiple claims per day; running totals kept
// + Rewards Shop with PIN approval
// + Claims tracker with fulfilled/unfulfilled, CSV export
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const KIDS = ['Eva', 'Henry', 'Eli'];
    const PARENT_PIN = '1234'; // <-- change this to your parent PIN

    // === YOUR CUSTOM CHORE LIST ===
    const DEFAULT_CHORES = [
      { id: 'hygiene-brush-teeth',        type: 'Hygiene',     name: 'Brush Teeth',            points: 1 },
      { id: 'hygiene-brush-teeth',        type: 'Hygiene',     name: 'Shower',                 points: 1 },
      { id: 'discipline-fighting',        type: 'Discipline',  name: 'Fighting',               points: -5 },
      { id: 'discipline-Bedtime Delay',   type: 'Discipline',  name: 'Bedtime Delay',          points: -5 },

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
      { id: 'pets-clean-litterbox',       type: 'Pets',        name: 'Clean litterbox',        points: 3 },

      { id: 'house-put-away-laundry',     type: 'Household',   name: 'Put Away Laundry',       points: 2 },
      { id: 'house-take-out-garbage',     type: 'Household',   name: 'Take Out Garbage',       points: 2 },
      { id: 'school-do-homework',         type: 'School/Sport',name: 'Do Homework',            points: 2 },
      { id: 'house-clean-room',           type: 'Household',   name: 'Clean Room',             points: 3 },
      { id: 'house-clean-theater-room',   type: 'Household',   name: 'Clean Theater Room',     points: 2 },
      { id: 'house-clean-basement',       type: 'Household',   name: 'Clean Basement',         points: 2 },
      { id: 'house-tidy-front-entrance',  type: 'Household',   name: 'Tidy Front Entrance',    points: 2 },
      { id: 'house-empty-dishwasher',     type: 'Household',   name: 'Empty Dishwasher',       points: 2 },
      { id: 'house-gather-dishes',        type: 'Household',   name: 'Gather Dishes',          points: 1 },

      { id: 'sport-do-hockey-shots',      type: 'School/Sport',name: 'Do Hockey Shots',        points: 2 },
    ];

    // ----- Persistence helpers -----
    function save(key, value) { localStorage.setItem('choretracker:' + key, JSON.stringify(value)); }
    function load(key, fallback) {
      try { const raw = localStorage.getItem('choretracker:' + key); return raw ? JSON.parse(raw) : fallback; }
      catch { return fallback; }
    }

    // ----- State -----
    // Running totals (lifetime). Feel free to change initial values to {Eva:0, Henry:0, Eli:0}.
    let totals = load('totals', { Eva: 14, Henry: 29, Eli: 13 });

    // Per-day counters for each chore (resets on Reset Day)
    let dailyCounts = load('dailyCounts', {});          // { [choreId]: number }
    let dailyLastWho = load('dailyLastWho', {});        // { [choreId]: "Eva" }

    // History for undo (chore actions only)
    let history = load('history', []);                  // [{ choreId, name, points, ts }]

    // Reward claims log (track fulfilled/unfulfilled)
    let claims = load('claims', []);
    // normalize old entries to ensure id & fulfilled exist
    claims = claims.map(c => ({
      id: c.id || (c.ts ? String(c.ts) : Math.random().toString(36).slice(2)),
      rewardId: c.rewardId,
      rewardName: c.rewardName || c.rewardId,
      name: c.name,
      cost: c.cost,
      ts: c.ts || Date.now(),
      fulfilled: typeof c.fulfilled === 'boolean' ? c.fulfilled : false
    }));
    save('claims', claims);

    // ----- Elements -----
    const tbody = document.getElementById('chore-body');
    const resetBtn = document.getElementById('reset-day');
    const undoBtn = document.getElementById('undo-last');

    // Rewards DOM
    const rewardShopEl   = document.getElementById('reward-shop');
    const balanceEl      = document.getElementById('balance-points');
    const tierBtns       = Array.from(document.querySelectorAll('#reward-filters .tier-btn'));
    const rewardKidSel   = document.getElementById('reward-kid-select');

    // Claim Modal DOM
    const modal          = document.getElementById('claim-modal');
    const claimTitleEl   = document.getElementById('claim-title');
    const claimDescEl    = document.getElementById('claim-desc');
    const pinInput       = document.getElementById('parent-pin-input');
    const claimConfirm   = document.getElementById('claim-confirm');
    const claimCancel    = document.getElementById('claim-cancel');

    // Claims table DOM
    const claimsBody = document.getElementById('claims-body');
    const claimsFilter = document.getElementById('claims-filter');
    const claimsExportBtn = document.getElementById('claims-export');
    const claimsClearFulfilledBtn = document.getElementById('claims-clear-fulfilled');

    // ----- Rewards context -----
    window.currentKidId = (rewardKidSel && rewardKidSel.value) || 'Eva';
    let currentTier = 'All';
    let pendingReward = null;

    // ----- Initial render -----
    renderScoreboard();
    renderChores();
    initRewards();   // safe even if Rewards DOM is missing
    renderClaims();  // safe even if Claims DOM is missing

    // ----- Events -----
    resetBtn.addEventListener('click', () => {
      if (!confirm('Start a new day? (Keeps totals; clears today’s claims)')) return;
      dailyCounts = {};
      dailyLastWho = {};
      history = [];
      persist();
      renderChores();
      // no change to totals or claims
    });

    undoBtn.addEventListener('click', () => {
      if (!history.length) return alert('Nothing to undo.');
      const last = history.pop(); // { choreId, name, points }
      // Refund the points
      totals[last.name] = Math.max(0, (totals[last.name] || 0) - last.points);
      // Decrement daily count
      const prev = dailyCounts[last.choreId] || 0;
      dailyCounts[last.choreId] = Math.max(0, prev - 1);
      // Clear lastWho if none left
      if (dailyCounts[last.choreId] === 0) delete dailyLastWho[last.choreId];

      persist();
      renderScoreboard();
      renderChores();
      renderBalance(); // refresh rewards balance if visible
    });

    // DONE buttons (multiple claims allowed)
    tbody.addEventListener('click', (e) => {
      const doneBtn = e.target.closest('button[data-action="done"]');
      if (!doneBtn) return;
      const row = doneBtn.closest('tr');
      const choreId = row.dataset.id;
      const select = row.querySelector('select');
      const selected = select.value;

      const chore = DEFAULT_CHORES.find(c => c.id === choreId);
      if (!chore) return;

      if (!selected) { alert('Select a name first.'); return; }

      // Award points + record claim
      totals[selected] = (totals[selected] || 0) + chore.points;
      dailyCounts[choreId] = (dailyCounts[choreId] || 0) + 1;
      dailyLastWho[choreId] = selected;
      history.push({ choreId, name: selected, points: chore.points, ts: Date.now() });

      persist();
      renderScoreboard();
      renderChoreRow(row, chore);
      renderBalance(); // keep rewards balance live
    });

    // ===== Rendering =====
    function renderScoreboard() {
      KIDS.forEach(kid => {
        const el = document.getElementById('points-' + kid);
        if (el) el.textContent = (totals[kid] || 0);
      });
    }

    function renderChores() {
      tbody.innerHTML = '';

      // Group chores by type in original order
      const order = [];
      const groups = {};
      DEFAULT_CHORES.forEach(c => {
        if (!groups[c.type]) { groups[c.type] = []; order.push(c.type); }
        groups[c.type].push(c);
      });

      order.forEach(type => {
        // Group header row spanning existing table columns (Type, Chore, Points, Who, Action, Status) = 6
        const header = document.createElement('tr');
        header.className = 'group-row';
        header.innerHTML = `<td colspan="6"><strong>${escapeHtml(type)}</strong></td>`;
        tbody.appendChild(header);

        // Rows for this type
        groups[type].forEach(chore => {
          const tr = document.createElement('tr');
          tr.dataset.id = chore.id;
          tr.innerHTML = rowBodyCells(chore);
          tbody.appendChild(tr);
        });
      });
    }

    function renderChoreRow(rowEl, chore) {
      rowEl.innerHTML = rowBodyCells(chore);
    }

    function rowBodyCells(chore) {
      const count = dailyCounts[chore.id] || 0;
      const last = dailyLastWho[chore.id];
      const select = selectHtml(KIDS, ''); // blank default; choose each time
      const buttonHtml = `<button class="small" data-action="done">DONE</button>`;
      const status =
        count > 0
          ? `<span class="status-chip done">${count} claimed today${last ? ' • last: ' + escapeHtml(last) : ''}</span>`
          : `<span class="status-chip">Not claimed</span>`;

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

    // ===== Rewards =====
    function initRewards() {
      if (!rewardShopEl) return; // in case old index without rewards

      // Filters
      tierBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tierBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentTier = btn.dataset.tier || 'All';
          renderRewardShop();
        });
      });

      // Kid selection for claiming context
      if (rewardKidSel) {
        rewardKidSel.addEventListener('change', () => {
          window.currentKidId = rewardKidSel.value;
          renderBalance();
        });
      }

      // Modal handlers
      if (claimCancel) claimCancel.addEventListener('click', closeClaimModal);
      if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeClaimModal(); });
      if (claimConfirm) claimConfirm.addEventListener('click', confirmClaim);

      renderRewardShop();
      renderBalance();
    }

    function renderRewardShop() {
      rewardShopEl.innerHTML = '';
      const rewards = (window.REWARDS || []);
      rewards
        .filter(r => currentTier === 'All' || r.tier === currentTier)
        .forEach(r => {
          const card = document.createElement('div');

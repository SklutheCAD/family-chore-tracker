// app.js v22
// Family Chore Tracker with Rewards + Claims Tracker

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const KIDS = ['Eva', 'Henry', 'Eli'];
    const PARENT_PIN = '1234'; // Change this to your parent PIN

    // ===== CHORES =====
    const DEFAULT_CHORES = [
      { id: 'hygiene-brush-teeth',        type: 'Hygiene',     name: 'Brush Teeth',            points: 1 },
      { id: 'hygiene-shower',             type: 'Hygiene',     name: 'Shower',                 points: 1 },
      { id: 'discipline-fighting',        type: 'Discipline',  name: 'Fighting',               points: -5 },
      { id: 'discipline-bedtime-delay',   type: 'Discipline',  name: 'Bedtime Delay',          points: -5 },

      { id: 'pets-feed-sully',            type: 'Pets',        name: 'Feed or Water Sully',    points: 1 },
      { id: 'pets-water-big-chickens',    type: 'Pets',        name: 'Water Big Chickens',     points: 3 },
      { id: 'pets-feed-big-chickens',     type: 'Pets',        name: 'Feed Big Chickens',      points: 3 },
      { id: 'pets-water-little-chickens', type: 'Pets',        name: 'Water Little Chickens',  points: 3 },
      { id: 'pets-feed-little-chickens',  type: 'Pets',        name: 'Feed Little Chickens',   points: 3 },
      { id: 'pets-feed-ducks-geese',      type: 'Pets',        name: 'Feed Ducks/Geese',       points: 3 },
      { id: 'pets-water-ducks-geese',     type: 'Pets',        name: 'Water Ducks/Geese',      points: 3 },
      { id: 'pets-clean-coop',            type: 'Pets',        name: 'Clean Chicken Coop',     points: 10 },
      { id: 'pets-gather-eggs',           type: 'Pets',        name: 'Gather the Eggs',        points: 1 },
      { id: 'pets-feed-outdoor-cats',     type: 'Pets',        name: 'Feed Outdoor Cats',      points: 1 },
      { id: 'pets-feed-indoor-cats',      type: 'Pets',        name: 'Feed Indoor Cats',       points: 1 },
      { id: 'pets-clean-litterbox',       type: 'Pets',        name: 'Clean Litterbox',        points: 3 },

      { id: 'house-put-away-laundry',     type: 'Household',   name: 'Put Away Laundry',       points: 2 },
      { id: 'house-take-out-garbage',     type: 'Household',   name: 'Take Out Garbage',       points: 2 },
      { id: 'house-clean-room',           type: 'Household',   name: 'Clean Room',             points: 3 },
      { id: 'house-clean-theater-room',   type: 'Household',   name: 'Clean Theater Room',     points: 2 },
      { id: 'house-clean-basement',       type: 'Household',   name: 'Clean Basement',         points: 2 },
      { id: 'house-tidy-entrance',        type: 'Household',   name: 'Tidy Front Entrance',    points: 2 },
      { id: 'house-empty-dishwasher',     type: 'Household',   name: 'Empty Dishwasher',       points: 2 },
      { id: 'house-gather-dishes',        type: 'Household',   name: 'Gather Dishes',          points: 1 },

      { id: 'school-do-homework',         type: 'School/Sport',name: 'Do Homework',            points: 2 },
      { id: 'sport-do-hockey-shots',      type: 'School/Sport',name: 'Do Hockey Shots',        points: 2 },
    ];

    // ===== LOCAL STORAGE HELPERS =====
    const save = (k, v) => localStorage.setItem('choretracker:' + k, JSON.stringify(v));
    const load = (k, f) => {
      try {
        const r = localStorage.getItem('choretracker:' + k);
        return r ? JSON.parse(r) : f;
      } catch { return f; }
    };

    // ===== STATE =====
    let totals = load('totals', { Eva: 0, Henry: 0, Eli: 0 });
    let dailyCounts = load('dailyCounts', {});
    let dailyLastWho = load('dailyLastWho', {});
    let history = load('history', []);
    let claims = load('claims', []);

    claims = claims.map(c => ({
      id: c.id || Math.random().toString(36).slice(2),
      rewardId: c.rewardId,
      rewardName: c.rewardName || c.rewardId,
      name: c.name,
      cost: c.cost,
      ts: c.ts || Date.now(),
      fulfilled: typeof c.fulfilled === 'boolean' ? c.fulfilled : false
    }));
    save('claims', claims);

    // ===== DOM ELEMENTS =====
    const tbody = document.getElementById('chore-body');
    const resetBtn = document.getElementById('reset-day');
    const undoBtn = document.getElementById('undo-last');
    const rewardShopEl = document.getElementById('reward-shop');
    const balanceEl = document.getElementById('balance-points');
    const tierBtns = Array.from(document.querySelectorAll('#reward-filters .tier-btn'));
    const rewardKidSel = document.getElementById('reward-kid-select');
    const modal = document.getElementById('claim-modal');
    const pinInput = document.getElementById('parent-pin-input');
    const claimConfirm = document.getElementById('claim-confirm');
    const claimCancel = document.getElementById('claim-cancel');
    const claimsBody = document.getElementById('claims-body');
    const claimsFilter = document.getElementById('claims-filter');
    const claimsExportBtn = document.getElementById('claims-export');
    const claimsClearBtn = document.getElementById('claims-clear-fulfilled');

    // ===== INITIALIZE =====
    window.currentKidId = (rewardKidSel && rewardKidSel.value) || 'Eva';
    let currentTier = 'All';
    let pendingReward = null;

    renderScoreboard();
    renderChores();
    initRewards();
    renderClaims();

    // ===== CHORE EVENTS =====
    resetBtn.addEventListener('click', () => {
      if (!confirm('Start a new day? (Keeps totals; clears today’s claims)')) return;
      dailyCounts = {};
      dailyLastWho = {};
      history = [];
      persist();
      renderChores();
    });

    undoBtn.addEventListener('click', () => {
      if (!history.length) return alert('Nothing to undo.');
      const last = history.pop();
      totals[last.name] = Math.max(0, (totals[last.name] || 0) - last.points);
      dailyCounts[last.choreId] = Math.max(0, (dailyCounts[last.choreId] || 0) - 1);
      if (dailyCounts[last.choreId] === 0) delete dailyLastWho[last.choreId];
      persist();
      renderScoreboard();
      renderChores();
      renderBalance();
    });

    tbody.addEventListener('click', e => {
      const done = e.target.closest('button[data-action="done"]');
      if (!done) return;
      const tr = done.closest('tr');
      const id = tr.dataset.id;
      const sel = tr.querySelector('select');
      const who = sel.value;
      if (!who) return alert('Select a name first.');

      const chore = DEFAULT_CHORES.find(c => c.id === id);
      totals[who] = (totals[who] || 0) + chore.points;
      dailyCounts[id] = (dailyCounts[id] || 0) + 1;
      dailyLastWho[id] = who;
      history.push({ choreId: id, name: who, points: chore.points, ts: Date.now() });
      persist();
      renderScoreboard();
      renderChoreRow(tr, chore);
      renderBalance();
    });

    // ===== RENDERING =====
    function renderScoreboard() {
      KIDS.forEach(k => {
        const el = document.getElementById('points-' + k);
        if (el) el.textContent = totals[k] || 0;
      });
    }

    function renderChores() {
      tbody.innerHTML = '';
      const order = [];
      const groups = {};
      DEFAULT_CHORES.forEach(c => {
        if (!groups[c.type]) { groups[c.type] = []; order.push(c.type); }
        groups[c.type].push(c);
      });
      order.forEach(type => {
        const h = document.createElement('tr');
        h.className = 'group-row';
        h.innerHTML = `<td colspan="6"><strong>${type}</strong></td>`;
        tbody.appendChild(h);
        groups[type].forEach(ch => {
          const tr = document.createElement('tr');
          tr.dataset.id = ch.id;
          tr.innerHTML = rowCells(ch);
          tbody.appendChild(tr);
        });
      });
    }

    const rowCells = c => {
      const count = dailyCounts[c.id] || 0;
      const last = dailyLastWho[c.id];
      const sel = selectHtml(KIDS, '');
      const status = count > 0
        ? `<span class="status-chip done">${count} today${last ? ' • ' + last : ''}</span>`
        : `<span class="status-chip">Not claimed</span>`;
      return `
        <td>${c.type}</td>
        <td>${c.name}</td>
        <td>${c.points}</td>
        <td>${sel}</td>
        <td><button class="small" data-action="done">DONE</button></td>
        <td>${status}</td>`;
    };

    const selectHtml = (opts, sel) =>
      `<select>${['<option value="">— Select —</option>']
        .concat(opts.map(o => `<option value="${o}"${o===sel?' selected':''}>${o}</option>`))
        .join('')}</select>`;

    function persist() {
      save('totals', totals);
      save('dailyCounts', dailyCounts);
      save('dailyLastWho', dailyLastWho);
      save('history', history);
      save('claims', claims);
    }

    // ===== REWARDS =====
    function initRewards() {
      if (!rewardShopEl) return;
      tierBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tierBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentTier = btn.dataset.tier || 'All';
          renderRewardShop();
        });
      });
      if (rewardKidSel) rewardKidSel.addEventListener('change', () => {
        window.currentKidId = rewardKidSel.value;
        renderBalance();
      });
      if (claimCancel) claimCancel.addEventListener('click', closeClaimModal);
      if (claimConfirm) claimConfirm.addEventListener('click', confirmClaim);
      renderRewardShop();
      renderBalance();
    }

    function renderRewardShop() {
      rewardShopEl.innerHTML = '';
      const rewards = window.REWARDS || [];
      if (!Array.isArray(rewards) || !rewards.length) {
        rewardShopEl.innerHTML = '<p class="hint">⚠️ No rewards loaded. Check rewards.js.</p>';
        return;
      }
      rewards.filter(r => currentTier === 'All' || r.tier === currentTier)
        .forEach(r => {
          const div = document.createElement('div');
          div.className = 'reward-item';
          div.innerHTML = `
            <h4>${r.name}</h4>
            <div>Tier: ${r.tier}</div>
            <div>Cost: <strong>${r.cost}</strong></div>
            <button data-id="${r.id}">Claim</button>`;
          div.querySelector('button').addEventListener('click', () => openClaimModal(r));
          rewardShopEl.appendChild(div);
        });
    }

    function renderBalance() {
      const kid = window.currentKidId || 'Eva';
      balanceEl.textContent = totals[kid] || 0;
    }

    function openClaimModal(reward) {
      pendingReward = reward;
      modal.classList.remove('hidden');
      pinInput.value = '';
      pinInput.focus();
    }

    function closeClaimModal() {
      modal.classList.add('hidden');
      pendingReward = null;
    }

    function confirmClaim() {
      if (!pendingReward) return;
      const kid = window.currentKidId || 'Eva';
      if (pinInput.value !== PARENT_PIN) return alert('Incorrect PIN');
      if ((totals[kid] || 0) < pendingReward.cost)
        return alert('Not enough points.');
      totals[kid] -= pendingReward.cost;
      const newClaim = {
        id: Math.random().toString(36).slice(2, 8).toUpperCase(),
        rewardId: pendingReward.id,
        rewardName: pendingReward.name,
        name: kid,
        cost: pendingReward.cost,
        ts: Date.now(),
        fulfilled: false
      };
      claims.push(newClaim);
      persist();
      renderScoreboard();
      renderBalance();
      renderClaims();
      alert(`${kid} claimed: ${pendingReward.name}`);
      closeClaimModal();
    }

    // ===== CLAIMS =====
    function renderClaims() {
      if (!claimsBody) return;
      const filter = claimsFilter ? claimsFilter.value : 'unfulfilled';
      const visible = claims
        .slice()
        .sort((a,b) => b.ts - a.ts)
        .filter(c => filter === 'all' ? true : !c.fulfilled);
      claimsBody.innerHTML = visible.map(c => `
        <tr>
          <td>${new Date(c.ts).toLocaleString()}</td>
          <td>${c.name}</td>
          <td>${c.rewardName}</td>
          <td>${c.cost}</td>
          <td><span class="status-chip ${c.fulfilled?'done':''}">
              ${c.fulfilled?'Fulfilled':'Unfulfilled'}</span></td>
          <td><input type="checkbox" data-id="${c.id}" ${c.fulfilled?'checked':''}></td>
        </tr>`).join('');
    }

    if (claimsFilter) claimsFilter.addEventListener('change', renderClaims);

    if (claimsBody) claimsBody.addEventListener('change', e => {
      const cb = e.target.closest('input[type="checkbox"][data-id]');
      if (!cb) return;
      const id = cb.dataset.id;
      const claim = claims.find(c => c.id === id);
      if (!claim) return;
      claim.fulfilled = cb.checked;
      save('claims', claims);
      renderClaims();
    });

    if (claimsExportBtn)
      claimsExportBtn.addEventListener('click', () => {
        const rows = [
          ['id','date','kid','reward','cost','fulfilled'],
          ...claims.map(c => [
            c.id, new Date(c.ts).toISOString(), c.name, c.rewardName, c.cost, c.fulfilled?'yes':'no'
          ])
        ];
        const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'claims.csv';
        a.click();
        URL.revokeObjectURL(url);
      });

    if (claimsClearBtn)
      claimsClearBtn.addEventListener('click', () => {
        if (!confirm('Clear all fulfilled claims?')) return;
        claims = claims.filter(c => !c.fulfilled);
        save('claims', claims);
        renderClaims();
      });
  });
})();

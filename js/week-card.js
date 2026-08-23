/* House week card — read-only on existing tables. No schema. */
(function (global) {
  const SB_URL = 'https://sqvybphogacjcqesktos.supabase.co/rest/v1/';
  const SB_KEY = 'sb_publishable_goW4R2ia5-t_gdngFx8tsw_ixrgHuih';
  const HDR = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };
  const TZ = 'Australia/Brisbane';
  const HOUSE_TARGET = 8;
  const PERSON_CAP = 4;

  function ymdInTz(d) {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
    return fmt.format(d);
  }
  function parseYmd(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function addDays(ymd, n) {
    const x = parseYmd(ymd);
    x.setDate(x.getDate() + n);
    return ymdInTz(x);
  }
  function mondayOf(ymd) {
    const [y, m, d] = ymd.split('-').map(Number);
    const utc = new Date(Date.UTC(y, m - 1, d));
    const dow = (utc.getUTCDay() + 6) % 7;
    utc.setUTCDate(utc.getUTCDate() - dow);
    return utc.toISOString().slice(0, 10);
  }
  function daysLeft(today, monday) {
    const sun = addDays(monday, 6);
    const left = Math.round((parseYmd(sun) - parseYmd(today)) / 86400000);
    return Math.max(0, left);
  }
  function isSessionEntry(e) {
    if (e.ex === 'Bodyweight') return false;
    if (e.kind === 'mobility') return false;
    return true;
  }
  function sessionsByUser(entries, from, to) {
    const map = {};
    entries.filter(isSessionEntry).forEach(function (e) {
      if (e.date < from || e.date > to) return;
      const k = e.user_idx;
      if (!map[k]) map[k] = new Set();
      map[k].add(e.date);
    });
    const out = {};
    Object.keys(map).forEach(function (k) { out[k] = map[k].size; });
    return out;
  }
  function pickPartner(rows, viewerIdx) {
    const others = (rows || []).filter(function (r) { return r.user.idx !== viewerIdx; });
    const tarah = others.find(function (r) { return /tarah/i.test(r.user.name || ''); });
    return tarah || others[0] || null;
  }
  function lastSession(entries, userIdx) {
    const mine = entries.filter(function (e) { return e.user_idx === userIdx && isSessionEntry(e); })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    if (!mine.length) return null;
    const d = mine[0].date;
    const day = mine.filter(function (e) { return e.date === d; });
    const lifts = day.filter(function (e) { return e.kind !== 'cardio'; });
    const cardio = day.filter(function (e) { return e.kind === 'cardio'; });
    let fact = '';
    if (lifts.length) {
      const by = {};
      lifts.forEach(function (e) { by[e.ex] = (by[e.ex] || 0) + (e.sets || 1); });
      const top = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; })[0];
      fact = top + ' · ' + by[top] + ' set' + (by[top] === 1 ? '' : 's');
    } else if (cardio.length) {
      const mins = cardio.reduce(function (a, e) { return a + (e.mins || 0); }, 0);
      fact = cardio[0].ex + (mins ? ' · ' + mins + ' min' : '');
    }
    return { date: d, fact: fact, n: day.length };
  }
  function ownBaseline(entries, userIdx, monday, weeks) {
    const counts = [];
    for (let i = 1; i <= weeks; i++) {
      const start = addDays(monday, -7 * i);
      const end = addDays(start, 6);
      const s = sessionsByUser(entries.filter(function (e) { return e.user_idx === userIdx; }), start, end);
      counts.push(s[userIdx] || 0);
    }
    const nonzero = counts.filter(function (n) { return n > 0; });
    if (!nonzero.length) return 2;
    return Math.max(1, Math.round(nonzero.reduce(function (a, b) { return a + b; }, 0) / nonzero.length));
  }
  function houseStreak(entries, users, monday) {
    let streak = 0;
    for (let i = 1; i <= 26; i++) {
      const start = addDays(monday, -7 * i);
      const end = addDays(start, 6);
      const s = sessionsByUser(entries, start, end);
      let house = 0;
      users.forEach(function (u) { house += Math.min(PERSON_CAP, s[u.idx] || 0); });
      if (house >= HOUSE_TARGET) streak++;
      else break;
    }
    return streak;
  }
  async function sbGet(p) {
    const r = await fetch(SB_URL + p, { headers: HDR });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }

  async function loadHouse(hh) {
    const q = encodeURIComponent(hh);
    const [profs, ents] = await Promise.all([
      sbGet('profiles?household=eq.' + q + '&order=idx'),
      sbGet('entries?household=eq.' + q + '&select=id,user_idx,ex,wt,reps,sets,date,kind,mins,dist')
    ]);
    return { profiles: profs, entries: ents };
  }

  function model(hh, profiles, entries, viewerIdx) {
    const today = ymdInTz(new Date());
    const monday = mondayOf(today);
    const sunday = addDays(monday, 6);
    const users = (profiles || []).map(function (p) { return { idx: p.idx, name: p.name, color: p.color }; });
    const week = sessionsByUser(entries, monday, sunday);
    const rows = users.map(function (u) {
      const raw = week[u.idx] || 0;
      const capped = Math.min(PERSON_CAP, raw);
      const base = ownBaseline(entries, u.idx, monday, 4);
      const pct = Math.min(100, Math.round((raw / base) * 100));
      return { user: u, raw: raw, capped: capped, base: base, pct: pct, last: lastSession(entries, u.idx) };
    });
    const house = rows.reduce(function (a, r) { return a + r.capped; }, 0);
    const viewer = rows.find(function (r) { return r.user.idx === viewerIdx; }) || rows[0];
    const partner = pickPartner(rows, viewer && viewer.user.idx);
    return {
      hh: hh, today: today, monday: monday, sunday: sunday,
      daysLeft: daysLeft(today, monday),
      rows: rows, house: house, target: HOUSE_TARGET,
      streak: houseStreak(entries, users, monday),
      viewer: viewer, partner: partner,
      entryCount: entries.length
    };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]);
    });
  }
  function whenCopy(last, today) {
    if (!last) return 'no session yet';
    if (last.date === today) return 'trained today';
    const d = Math.round((parseYmd(today) - parseYmd(last.date)) / 86400000);
    if (d === 1) return 'yesterday';
    if (d <= 5) return d + ' days ago';
    return last.date;
  }

  function render(el, m) {
    const partner = m.partner;
    const quiet = partner && partner.last ? Math.round((parseYmd(m.today) - parseYmd(partner.last.date)) / 86400000) : 99;
    let pulse;
    if (!partner) {
      pulse = '<div class="muted">One adult so far. Invite the other — same garage, same week, same bill.</div>';
    } else if (quiet > 5) {
      pulse = '<div class="pulse-name">' + esc(partner.user.name) + '</div>' +
        '<div class="muted">Quiet this week — house week still counts both of you.</div>';
    } else {
      pulse = '<div class="pulse-name">' + esc(partner.user.name) + ' · ' + esc(whenCopy(partner.last, m.today)) + '</div>' +
        (partner.last && partner.last.fact ? '<div class="pulse-fact">' + esc(partner.last.fact) + '</div>' : '') +
        '<div class="muted">This week: ' + partner.raw + ' session' + (partner.raw === 1 ? '' : 's') +
        (m.viewer ? ' · you: ' + m.viewer.raw : '') + '</div>';
    }
    const bars = m.rows.map(function (r) {
      const w = Math.round((r.capped / PERSON_CAP) * 100);
      return '<div class="barrow"><span class="nm">' + esc(r.user.name) + '</span>' +
        '<span class="track"><i style="width:' + w + '%;background:' + esc(r.user.color || '#ff5029') + '"></i></span>' +
        '<span class="n">' + r.raw + (r.raw !== r.capped ? ' → ' + r.capped : '') + '</span></div>';
    }).join('');
    const left = m.daysLeft === 0 ? 'resets tonight' : m.daysLeft + 'd left';
    const fair = m.rows.length === 2 ? ('<div class="fair">Fair 1v1 (optional, % of own last 4 weeks, capped): ' +
      m.rows.map(function (r) { return esc(r.user.name) + ' ' + r.pct + '%'; }).join(' · ') + '</div>') : '';
    el.innerHTML =
      '<div class="card house week-extra">' +
        '<div class="kicker">This week · ' + left + ' · Mon reset</div>' +
        '<div class="pulse">' + pulse + '</div>' +
        '<div class="house-score">House <b>' + m.house + ' / ' + m.target + '</b> sessions <span class="muted">(max ' + PERSON_CAP + ' each)</span></div>' +
        bars +
        '<div class="streak muted">House weeks hit · ' + m.streak + '</div>' +
        fair +
        '<div class="hw-actions">' +
          '<button type="button" class="ghost mini invite" data-invite="1">Invite · copy house code</button>' +
        '</div>' +
      '</div>';
    const inv = el.querySelector('[data-invite]');
    if (inv) inv.onclick = function () {
      const code = m.hh || 'GYM-EHDT2C';
      function done() {
        inv.textContent = 'Code copied · they join as themselves';
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(function () { prompt('House code (not a password)', code); });
      } else {
        prompt('House code (not a password)', code);
      }
    };
  }

  global.GarageWeek = { loadHouse: loadHouse, model: model, render: render, mondayOf: mondayOf, ymdInTz: ymdInTz, pickPartner: pickPartner };
})(window);

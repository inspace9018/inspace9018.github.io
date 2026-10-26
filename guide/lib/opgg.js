'use strict';
// Dashboard pages laid out after op.gg: the live game as two team tables (ours blue, theirs red)
// and a hero tier table that opens a hero page with its build, ability order, abilities and matchups.
(() => {
  const esc = v =>
    String(v ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const pct = v => (Number.isFinite(v) ? (v * 100).toFixed(1) + '%' : '—');
  const types = () => window.HERO_TYPES || [];
  const type = id => types().find(t => t.id === id) || null;
  const items = () => new Map((window.ITEM_CATALOG || []).map(i => [i.id, i]));
  const itemKo = () => new Map((window.ITEM_KO || []).map(k => [k.id, k.ko]));
  const CURVE = { early: '초반형', even: '균형형', late: '후반형' };
  const FIGHT = { gun: '무기', spirit: '마법', hybrid: '혼합' };
  const ROLE = { marksman: '사수', brawler: '근접 싸움꾼', assassin: '암살자', mystic: '마법사' };
  // Tier from the 30-day win rate, like op.gg's 1-5 tiers.
  function tier(id) {
    const w = type(id)?.winRate?.overall;
    if (!Number.isFinite(w)) return 5;
    return w >= 0.53 ? 1 : w >= 0.51 ? 2 : w >= 0.485 ? 3 : w >= 0.465 ? 4 : 5;
  }
  function pickRate(id) {
    const all = types().reduce((n, t) => n + (t.winRate?.matches || 0), 0);
    const m = type(id)?.winRate?.matches;
    return all && m ? (m * 12) / all : null;
  }
  const portrait = (id, size = 'sm') => `<img class="op-portrait ${size}" src="assets/portraits/${id}-small.png" alt="">`;
  const tierBadge = id => `<span class="op-tier t${tier(id)}">${tier(id)}티어</span>`;
  const itemIcon = (id, label = true) => {
    const it = items().get(id);
    if (!it) return '';
    const ko = itemKo().get(id) || it.name;
    return `<span class="op-item" title="${esc(ko)}"><img src="${esc(it.file)}" alt="">${label ? `<small>${esc(ko)}</small>` : ''}</span>`;
  };

  // ---------- Live game ----------
  function teamRow(id, side, s) {
    const g = window.IntelUI.guide(id),
      t = type(id),
      lane = (s.intel?.lane?.opponents || []).includes(id) || s.intel?.lane?.partner === id,
      seen = (side === 'enemy' ? s.live?.enemyItems : s.live?.allyItems)?.[id] || [],
      keys = side === 'enemy' ? window.IntelUI.keyItems(seen).slice(0, 3) : [],
      late = window.HERO_BUILDS?.[id]?.late || [],
      me = s.live?.local?.heroId === id;
    return `<tr class="${me ? 'me' : ''}"><td class="op-hero">${portrait(id)}<div><b>${esc(g?.ko || '')}${me ? ' <i>나</i>' : ''}${lane ? ' <i class="lane">전선</i>' : ''}</b><small>${esc(
      [CURVE[t?.curve], FIGHT[t?.fight], (g?.tags || []).slice(0, 2).join('·')].filter(Boolean).join(' · ')
    )}</small></div></td><td>${tierBadge(id)}</td><td class="num">${pct(t?.winRate?.overall)}</td><td class="op-items">${
      keys.length
        ? keys.map(k => `<em class="${k.urgent ? 'urgent' : ''}">${esc(k.ko)}</em>`).join('')
        : late
            .slice(0, 3)
            .map(x => itemIcon(x.id, false))
            .join('')
    }</td></tr>`;
  }
  function teamTable(title, side, ids, s) {
    return `<section class="op-box op-team ${side}"><div class="op-team-head"><b>${title}</b><span>${ids.length}/6</span></div><table><thead><tr><th>영웅</th><th>티어</th><th>승률</th><th>${
      side === 'enemy' ? '핵심 아이템' : '후반 인기'
    }</th></tr></thead><tbody>${
      ids.length ? ids.map(id => teamRow(id, side, s)).join('') : '<tr><td colspan="4" class="op-empty">상단 바에서 영웅을 읽는 중</td></tr>'
    }</tbody></table></section>`;
  }
  // ---------- After the wave: camps, crates and golden statues near my lane ----------
  const KIND = { weak: '소형 캠프', medium: '중형 캠프', strong: '대형 캠프', vault: '금고' };
  const ICON = { weak: 'neutral_small', medium: 'neutral_medium', strong: 'neutral_large', vault: 'neutral_vault' };
  const campName = c => String(window.jungleUI ? window.jungleUI.name(c) : c.id).trim();
  // The map with the route on it.
  // Our base is always at the bottom: team 1 sees the map turned around, as on their minimap.
  const TOP = 'assets/map.png';
  function routeMap(r) {
    const flip = r.team === 1,
      d = p => (flip ? { x: 1 - p.x, y: 1 - p.y } : p),
      pts = [...r.path, ...(r.enemy?.path || [])].map(d),
      xs = pts.map(p => p.x),
      ys = pts.map(p => p.y),
      w = Math.min(1, Math.max(0.12, Math.max(...xs) - Math.min(...xs) + 0.06, Math.max(...ys) - Math.min(...ys) + 0.06)),
      x0 = Math.min(Math.max(0, (Math.max(...xs) + Math.min(...xs)) / 2 - w / 2), 1 - w),
      y0 = Math.min(Math.max(0, (Math.max(...ys) + Math.min(...ys)) / 2 - w / 2), 1 - w),
      f = v => v.toFixed(4),
      u = w / 100,
      line = (path, cls) => `<polyline class="${cls}" points="${path.map(d).map(p => `${f(p.x)},${f(p.y)}`).join(' ')}" />`,
      // An arrow halfway along each leg, pointing the way to go.
      arrows = (path, cls) =>
        path
          .slice(1)
          .map((b, i) => {
            const a = d(path[i]),
              e = d(b),
              len = Math.hypot(e.x - a.x, e.y - a.y);
            if (len < u * 6) return '';
            const deg = (Math.atan2(e.y - a.y, e.x - a.x) * 180) / Math.PI;
            return `<path class="${cls}" d="M${f(u * 1.6)},0 L${f(-u * 1.2)},${f(u * 1.3)} L${f(-u * 1.2)},${f(-u * 1.3)} Z" transform="translate(${f((a.x + e.x) / 2)} ${f((a.y + e.y) / 2)}) rotate(${deg.toFixed(1)})" />`;
          })
          .join(''),
      dot = (p, cls, size) => `<circle class="${cls}" cx="${f(d(p).x)}" cy="${f(d(p).y)}" r="${f(u * size)}" />`,
      label = (p, text, cls, dx = 0, dy = 0, anchor = 'middle') =>
        `<text class="${cls}" x="${f(d(p).x + u * dx)}" y="${f(d(p).y + u * dy)}" font-size="${f(u * 3.6)}" text-anchor="${anchor}">${esc(text)}</text>`,
      pin = (c, n) => {
        const p = d(c),
          s = u * 7;
        return `<g class="r-pin ${c.kind}"><image href="assets/camps/${ICON[c.kind]}_psd.png" x="${f(p.x - s / 2)}" y="${f(p.y - s / 2)}" width="${f(s)}" height="${f(s)}" />${
          n ? `<circle class="r-num" cx="${f(p.x + s * 0.42)}" cy="${f(p.y - s * 0.42)}" r="${f(u * 2.2)}" /><text class="r-num-t" x="${f(p.x + s * 0.42)}" y="${f(p.y - s * 0.42 + u * 0.15)}" font-size="${f(u * 2.8)}">${n}</text>` : ''
        }</g>`;
      };
    const side = (c, i) => (d(c).x > d(r.start).x ? 4.6 : -4.6);
    const main = `<svg class="op-route-map" viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(w)}" role="img" aria-label="웨이브 정리 후 동선 지도"><image href="${TOP}" x="0" y="0" width="1" height="1" preserveAspectRatio="none"${
      flip ? ' transform="rotate(180 0.5 0.5)"' : ''
    } />${r.enemy ? line(r.enemy.path, 'r-enemy') + arrows(r.enemy.path, 'r-enemy-a') : ''}${line(r.path, 'r-path-halo')}${line(r.path, 'r-path')}${arrows(
      r.path,
      'r-path-a'
    )}${r.crates.map(p => dot(p, 'r-crate', 0.9)).join('')}${r.tough.map(p => dot(p, 'r-tough', 1.2)).join('')}${r.statues
      .map(p => dot(p, 'r-statue', 1.3))
      .join('')}${(r.enemy?.stops || []).map(c => pin(c, 0)).join('')}${r.stops.map((c, i) => pin(c, i + 1)).join('')}${r.stops
      .map((c, i) => label(c, campName(c), 'r-name', side(c, i), 0.4, side(c, i) > 0 ? 'start' : 'end'))
      .join('')}${dot(r.start, 'r-lane', 2.2)}${label(r.start, '전선', 'r-lane-t', 0, -4.4)}</svg>`;
    // Where this is on the whole map.
    const locator = `<svg class="op-route-where" viewBox="0 0 1 1" aria-hidden="true"><image href="${TOP}" x="0" y="0" width="1" height="1" preserveAspectRatio="none"${
      flip ? ' transform="rotate(180 0.5 0.5)"' : ''
    } /><rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(w)}" /></svg>`;
    return `<figure class="op-route-fig">${main}${locator}<figcaption>아래쪽이 우리 기지</figcaption></figure>`;
  }
  function routeBox(s) {
    const j = s.jungle,
      lane = s.intel?.lane?.lane,
      r =
        j &&
        window.LaneRoute?.plan({
          camps: j.camps,
          points: window.MAP_POINTS,
          team: j.rotation === 180 ? 1 : 0,
          band: lane?.band,
          color: lane?.color,
          seconds: Number.isFinite(s.live?.seconds) ? s.live.seconds : j.seconds
        });
    const head = `<div class="op-box-head"><h3>웨이브 정리 후 동선</h3><span class="op-tag ${lane?.color ? 'lane-' + lane.color : ''}">${lane ? esc(lane.name) : '전선 확인 중'}</span></div>`;
    if (!r || r.missing)
      return `<section class="op-box op-route">${head}<p class="op-empty">${
        r?.missing === 'clock'
          ? '경기 시계를 읽으면 동선을 계산합니다.'
          : '내 전선과 팀(미니맵 방향)을 확인하면, 웨이브를 정리한 뒤 들를 캠프·상자·황금 조각상을 보여줍니다.'
      }</p></section>`;
    const clock = window.IntelUI.clock;
    // Seconds after leaving the lane when each step starts.
    let t = 0;
    const row = (time, cls, title, detail) => `<li class="${cls}"><time>${time === null ? '' : clock(time)}</time><div><b>${title}</b>${detail ? `<small>${detail}</small>` : ''}</div></li>`;
    const steps = [row(0, 'rs-lane', '웨이브 정리', '밀어 두고 출발')];
    r.stops.forEach((c, i) => {
      t += c.walk + c.wait;
      steps.push(
        row(t, `rs-stop ${c.kind}`, `<i>${i + 1}</i>${esc(campName(c))}`, `${KIND[c.kind]} · ${esc(c.floor)}${c.wait ? ` · ${c.wait}초 기다림` : ''} · 잡는 데 약 ${c.clear}초`)
      );
      t += c.clear;
    });
    if (r.crateRun) steps.push(row(null, 'rs-crate', `근처 상자 ${r.path.length - 2}개`, '들를 캠프가 없을 때. 상자는 60% 확률로 영혼이 나옵니다'));
    if (r.stops.length || r.crateRun) steps.push(row(r.total, 'rs-back', '전선 복귀', `다음 웨이브는 ${r.wave}초마다 옵니다`));
    else
      steps.push(
        row(
          null,
          'rs-wait',
          '지금은 전선 유지',
          `${r.next ? `다음은 ${esc(campName(r.next))}(${KIND[r.next.kind]}), ${clock(r.next.in)} 뒤` : '가까운 캠프가 아직 없습니다'}${r.cratesUp ? '' : '. 상자는 3:00부터'}`
        )
      );
    const onWay = [
      r.cratesUp && r.crates.length ? `<span><i class="k-crate"></i>상자 ${r.crates.length}</span>` : '',
      r.cratesUp && r.tough.length ? `<span><i class="k-tough"></i>튼튼한 상자 ${r.tough.length} (강한 근거리 공격으로)</span>` : '',
      r.statues.length ? `<span><i class="k-statue"></i>황금 조각상 자리 ${r.statues.length} (50% 확률)</span>` : ''
    ].join('');
    const alt = r.enemy
      ? `<div class="op-route-alt"><b>상대 정글은 안전할 때만</b><p>${r.enemy.stops
          .map(c => esc(campName(c)))
          .join(' → ')}, 다녀오는 데 약 ${r.enemy.total}초. 상대 전선 영웅이 귀환했거나 죽었을 때만 가세요. 지도에 빨간 점선으로 표시했습니다.</p></div>`
      : '';
    return `<section class="op-box op-route">${head}<div class="op-route-body">${routeMap(r)}<div class="op-route-side"><ol class="op-steps">${steps.join('')}</ol>${
      onWay ? `<p class="op-onway"><small>가는 길에</small>${onWay}</p>` : ''
    }${alt}<p class="note">전선이 먼저, 그다음 캠프, 상자는 마지막. 웨이브가 오면 캠프는 두고 돌아가세요.</p></div></div></section>`;
  }
  function match(s, view, actions) {
    const live = s.live || {},
      ours = [live.local?.heroId, ...(live.allies || []).map(a => a.heroId)].filter(Number.isInteger),
      theirs = (live.opponents || []).map(o => o.heroId).filter(Number.isInteger),
      ok = s.connection?.code === 'receiving' && !live.stale;
    // Most urgent first: what to do now and the objective timers, then the lane, then who is in the
    // match, then where to go after the wave.
    const now = window.IntelUI.now(s, 4) || '<p class="op-empty">경기 화면이 읽히면 지금 할 일이 여기 뜹니다.</p>';
    return `<div class="op-strip"><div><span class="op-live ${ok ? 'on' : ''}">${ok ? 'LIVE' : '대기'}</span><b>${
      Number.isFinite(live.seconds) ? window.IntelUI.clock(live.seconds) : '--:--'
    }</b><span>${esc(s.connection?.message || '')}</span></div><div class="op-actions">${actions}</div></div><div class="op-grid3 op-now"><section class="op-box op-todo"><h3>지금 할 일</h3>${now}</section><section class="op-box"><h3>오브젝트</h3>${window.IntelUI.timers(
      s
    )}</section><section class="op-box"><h3>라인전</h3>${window.IntelUI.lane(s, '', { ...view, detail: true })}</section></div><div class="op-teams">${teamTable(
      '우리 팀',
      'ally',
      ours,
      s
    )}${teamTable('적 팀', 'enemy', theirs, s)}</div>${routeBox(s)}`;
  }

  // ---------- Heroes ----------
  const sorts = {
    tier: (a, b) => tier(a.id) - tier(b.id) || (type(b.id)?.winRate?.overall || 0) - (type(a.id)?.winRate?.overall || 0),
    win: (a, b) => (type(b.id)?.winRate?.overall || 0) - (type(a.id)?.winRate?.overall || 0),
    pick: (a, b) => (pickRate(b.id) || 0) - (pickRate(a.id) || 0),
    name: (a, b) => a.ko.localeCompare(b.ko, 'ko')
  };
  function heroTable(selected, query, sort) {
    const q = query.trim().toLowerCase(),
      list = (window.HERO_GUIDE || [])
        .filter(h => !q || h.ko.toLowerCase().includes(q) || h.en.toLowerCase().includes(q))
        .sort(sorts[sort] || sorts.tier);
    const th = (k, label) => `<th><button data-hero-sort="${k}" class="${sort === k ? 'on' : ''}">${label}</button></th>`;
    return `<section class="op-box op-list"><input type="search" id="guide-q" placeholder="영웅 검색" value="${esc(query)}" aria-label="영웅 검색"><table><thead><tr><th>#</th>${th('name', '영웅')}${th('tier', '티어')}${th('win', '승률')}${th('pick', '픽률')}</tr></thead><tbody>${list
      .map(
        (h, i) =>
          `<tr data-guide-id="${h.id}" class="${h.id === selected ? 'on' : ''}"><td class="rank">${i + 1}</td><td class="op-hero">${portrait(h.id)}<b>${esc(h.ko)}</b></td><td>${tierBadge(h.id)}</td><td class="num">${pct(type(h.id)?.winRate?.overall)}</td><td class="num">${pct(pickRate(h.id))}</td></tr>`
      )
      .join('')}</tbody></table></section>`;
  }
  // ---------- Item builds (hero-item-builds.js): builds chosen from 30-day stats ----------
  const SLOT_CLS = { weapon: 'w', vitality: 'v', spirit: 's' };
  const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(1);
  const num = v => Number(v || 0).toLocaleString('ko-KR');
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const IB_KIND = { core: '핵심', situ: '상황별', counter: '상황 대비', skip: '비추천' };
  // A tile: icon, name, the price-band number and, under it, the item's job in this build (why[0]; for
  // 상황 대비 the reason it answers that threat). Hovering shows what the item does and, for actives,
  // when to use it.
  function ibTile(x, kind, key, sel, n) {
    const it = items().get(x.id);
    if (!it) return '';
    const ko = itemKo().get(x.id) || it.name,
      info = window.HERO_ITEM_BUILDS.items[x.id] || {},
      active = (info.tt || []).find(t => t.k === 'active'),
      use = active && window.ITEM_USE?.[x.id],
      adj = x.s ? `<em class="${x.s.rel >= 1 ? 'up' : x.s.rel <= -1 ? 'down' : ''}">${signed(x.s.rel)}%p</em>` : '<em>—</em>';
    const effects = (info.tt || [])
      .filter(t => t.k !== 'base' && t.text)
      .map(t => `<p><b>${t.k === 'active' ? `사용${t.cd ? ` · ${esc(t.cd)}` : ''}` : '지속'}</b>${esc(t.text)}</p>`)
      .join('');
    const tip = `<span class="ib-tip" role="tooltip"><b>${esc(ko)}</b><small>${esc(window.ITEM_BRIEF?.[x.id] || info.head || '')} · ${num(it.cost)} 영혼</small>${effects}${
      use ? `<p class="use"><b>사용법</b>${esc(use)}</p>` : ''
    }</span>`;
    return `<button type="button" class="ib-item ${SLOT_CLS[it.slot] || ''}${sel === key ? ' on' : ''}" data-ib-item="${esc(key)}"><span class="ib-ico"><img src="${esc(it.file)}" alt="">${
      n ? `<i>${n}</i>` : ''
    }${active ? '<u>사용</u>' : ''}</span><small>${esc(ko)}</small>${kind === 'skip' ? '' : adj}${x.why[0] ? `<span class="ib-role">${esc(x.why[0])}</span>` : ''}${tip}</button>`;
  }
  function ibDetail(x, kind, b, heroKo) {
    const it = items().get(x.id),
      info = window.HERO_ITEM_BUILDS.items[x.id] || {},
      ko = itemKo().get(x.id) || it?.name || '',
      s = x.s;
    const tt = (info.tt || [])
      .map(t => {
        const stats = t.stats
          .map(([l, v, sc]) => `<span>${esc(l)} <b>${esc(v)}</b>${sc ? ` <i>(${esc(sc)})</i>` : ''}</span>`)
          .join('');
        return t.k === 'base'
          ? `<div class="ib-tt base"><h5>기본 능력치</h5><p class="ib-stats">${stats}</p></div>`
          : `<div class="ib-tt ${t.k}"><h5>${t.k === 'active' ? '사용 효과' : '지속 효과'}${t.cd ? `<span>쿨다운 ${esc(t.cd)}</span>` : ''}</h5>${
              t.text ? `<p>${esc(t.text)}</p>` : ''
            }${stats ? `<p class="ib-stats">${stats}</p>` : ''}</div>`;
      })
      .join('');
    const rows = s
      ? [
          ['이 빌드에서 구매', `${Math.min(100, s.pick).toFixed(1)}% <small>(${num(s.n)}판)</small>`],
          ['구매한 판 승률', `${s.win.toFixed(1)}%`],
          ['같은 길이 경기 대비', `${signed(s.adj)}%p`],
          ['같은 가격대 아이템 대비', `<b class="${s.rel >= 1 ? 'up' : s.rel <= -1 ? 'down' : ''}">${signed(s.rel)}%p</b>`],
          ['평균 구매 시각', mmss(s.t)],
          s.en >= 300 && s.ew !== null ? ['10분 전 구매', `${num(s.en)}판 · 승률 ${s.ew.toFixed(1)}%`] : null
        ]
          .filter(Boolean)
          .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
          .join('')
      : '';
    return `<div class="ib-detail"><div class="ib-detail-head"><span class="ib-ico big ${SLOT_CLS[it?.slot] || ''}"><img src="${esc(it?.file || '')}" alt=""></span><div><h4>${esc(ko)} <span class="ib-kind ${kind}">${IB_KIND[kind]}</span></h4><p>${esc(
      info.head || ''
    )} · <span class="soul">${num(it?.cost)} 영혼</span></p></div></div>${x.if ? `<p class="ib-if"><b>언제</b>${esc(x.if)}</p>` : ''}${
      window.ITEM_USE?.[x.id] && (info.tt || []).some(t => t.k === 'active') ? `<p class="ib-if use"><b>사용법</b>${esc(window.ITEM_USE[x.id])}</p>` : ''
    }<div class="ib-detail-body"><div class="ib-tts">${tt}</div><div class="ib-why">${
      x.why.length ? `<h5>${kind === 'skip' ? '빼는 이유' : '이유'}</h5><ul>${x.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''
    }${rows ? `<h5>${esc(b.name)} 빌드 통계</h5><dl class="ib-nums">${rows}</dl>` : ''}</div></div></div>`;
  }
  // Ability point order for the build: one column per step (4 unlocks + 3 upgrades each), the level is the
  // earliest one that step is possible at, and the bottom row is how many players at that point chose it.
  function ibOrder(id, b) {
    const steps = b.order || [];
    if (!steps.length) return '';
    const abil = window.IntelUI.guide(id)?.abilities || [],
      name = slot => `${slot}. ${abil[slot - 1]?.ko || ''}`;
    const maxed = steps.filter(s => s.tier === 3).map(s => name(s.slot));
    const rows = [1, 2, 3, 4]
      .map(
        slot =>
          `<tr><th><img src="assets/abilities/${id}-${slot}.png" alt=""><span>${esc(name(slot))}</span></th>${steps
            .map(s => (s.slot === slot ? `<td class="on t${s.tier}">${s.tier ? s.tier : '해금'}</td>` : '<td></td>'))
            .join('')}</tr>`
      )
      .join('');
    const splits = steps
      .map((s, i) => (s.alt ? `${i + 1}번째(레벨 ${s.level}): ${esc(name(s.slot))} ${s.share.toFixed(1)}% · ${esc(name(s.alt.slot))} ${s.alt.share.toFixed(1)}%` : ''))
      .filter(Boolean);
    return `<div class="ib-order"><h4 class="ib-sub">능력 찍는 순서 <small>이 빌드에서 가장 많이 고른 순서 · 숫자는 강화 단계</small></h4>${
      maxed.length ? `<p class="ib-order-max">마스터 순서 ${maxed.map(n => `<b>${esc(n)}</b>`).join(' → ')}</p>` : ''
    }<div class="ib-order-scroll"><table class="ib-order-grid"><thead><tr><th>레벨</th>${steps
      .map(s => `<th title="평균 ${mmss(s.t)}">${s.level}</th>`)
      .join('')}</tr></thead><tbody>${rows}<tr class="ib-order-share"><th>선택률</th>${steps
      .map(s => `<td class="${s.alt ? 'split' : ''}" title="${num(s.n)}판">${Math.round(s.share)}%</td>`)
      .join('')}</tr></tbody></table></div><p class="ib-order-note">레벨: 그 단계를 찍을 수 있는 가장 빠른 레벨 (해금 1·3·5·8레벨, 강화 1·2·5포인트). 선택률: 앞 단계까지 같은 순서로 찍은 판 중 이 능력을 고른 비율.${
      steps.length < 16 ? ` ${steps.length + 1}번째부터는 표본이 100판 미만이라 뺐습니다.` : ''
    }</p>${splits.length ? `<p class="ib-order-note">갈리는 곳: ${splits.join(' / ')}</p>` : ''}</div>`;
  }
  // The build laid out like the game's 빌드 편집 screen, top to bottom, so it can be typed in by hand: name,
  // description and tags, then one card per 카테고리 (name, 설명, 선택 사항, items in order with 보강 대상 and a
  // short 메모), then the 능력 포인트 순서 clicks. Copy buttons put a field's text on the clipboard.
  function ibSheet(id, b, heroKo) {
    const abil = window.IntelUI.guide(id)?.abilities || [],
      aname = slot => `${slot}. ${abil[slot - 1]?.ko || ''}`,
      D = window.HERO_ITEM_BUILDS;
    const copy = text => `<button type="button" class="ib-copy" data-copy="${esc(text)}">복사</button>`;
    const field = (label, text, multi) =>
      `<div class="ib-sh-field"><div class="ib-sh-label"><b>${label}</b>${copy(text)}</div><${multi ? 'pre' : 'p'} class="ib-sh-val">${esc(text)}</${multi ? 'pre' : 'p'}></div>`;
    const name = `${heroKo} ${b.name}`;
    const desc = [
      b.line,
      ...b.points.map(([k, v]) => `${k}: ${v}`),
      b.skip.length ? `비추천: ${b.skip.map(x => itemKo().get(x.id) || items().get(x.id)?.name).join(', ')}` : '',
      `통계: 최근 ${D.days}일 ${num(b.n)}판 · 승률 ${b.win.toFixed(1)}% · 같은 길이 경기 대비 ${signed(b.adj)}%p (deadlock-api, ${D.updated})`
    ]
      .filter(Boolean)
      .join('\n');
    const cats = [];
    b.phases.forEach(p => {
      if (p.core.length) cats.push({ name: `${p.label} 핵심`, desc: `${p.when}${p.ordered ? ' · 왼쪽부터 순서대로' : ''}`, items: p.core.map(x => [x, '']) });
      if (p.situ.length) cats.push({ name: `${p.label} 상황별`, desc: '필요할 때만', opt: true, items: p.situ.map(x => [x, x.if || '']) });
    });
    if (b.counters.length) cats.push({ name: '상황 대비', desc: '상대 조합을 보고 필요할 때만', opt: true, items: b.counters.flatMap(g => g.items.map(x => [x, g.if])) });
    const imbue = x => {
      const m = x.imb;
      if (!m) return '';
      const [a, c] = m.pick;
      return `<span class="ib-sh-imb">보강 <img src="assets/abilities/${id}-${a.slot}.png" alt=""><b>${esc(aname(a.slot))}</b> <small>인기 빌드 ${m.of}개 중 ${a.n}개${
        c ? ` · ${esc(aname(c.slot))} ${c.n}개` : ''
      }${m.scope === 'hero' ? ' · 이 영웅 전체 빌드 기준' : ''}</small></span>`;
    };
    const catCards = cats
      .map(
        (c, i) =>
          `<div class="ib-sh-cat"><div class="ib-sh-cat-head"><b>${i + 1}. ${esc(c.name)}</b>${copy(c.name)}<span class="ib-sh-opt ${c.opt ? 'on' : ''}">선택 사항 ${
            c.opt ? '체크' : '해제'
          }</span></div><p class="ib-sh-cat-desc">설명: ${esc(c.desc)} ${copy(c.desc)}</p><ol>${c.items
            .map(([x, memo]) => {
              const it = items().get(x.id);
              if (!it) return '';
              return `<li><img src="${esc(it.file)}" alt="" class="${SLOT_CLS[it.slot] || ''}"><span class="ib-sh-name">${esc(itemKo().get(x.id) || it.name)}</span>${imbue(x)}${
                memo ? `<span class="ib-sh-memo">메모: ${esc(memo)} ${copy(memo)}</span>` : ''
              }</li>`;
            })
            .join('')}</ol></div>`
      )
      .join('');
    const steps = b.order || [];
    const clicks = steps
      .map((s, i) => `<li title="레벨 ${s.level} · ${s.tier ? s.tier + '단계 강화' : '해금'}"><img src="assets/abilities/${id}-${s.slot}.png" alt=""><b>${s.slot}</b><small>${i + 1}</small></li>`)
      .join('');
    return `<div class="ib-sheet"><p class="ib-sh-intro">게임의 빌드 편집 화면에 위에서부터 그대로 옮기면 됩니다. 복사를 누르면 그 칸에 붙여 넣을 글이 복사됩니다. 아이템은 상점에서 카테고리로 끌어다 놓고, 보강 아이템은 표시된 능력을 고릅니다.</p><div class="ib-sh-cols"><div class="ib-sh-left">${field(
      '빌드 이름',
      name
    )}${field('빌드 설명', desc, true)}<div class="ib-sh-field"><div class="ib-sh-label"><b>태그 지정</b></div><p class="ib-sh-tags">${(b.tags || [])
      .map(t => `<span>${esc(t)}</span>`)
      .join('')}</p></div><div class="ib-sh-field"><div class="ib-sh-label"><b>능력 포인트 순서</b></div><p class="ib-sh-hint">편집을 누르고 아래 번호 순서대로 능력을 클릭 (${steps.length}번)</p><ol class="ib-sh-clicks">${clicks}</ol></div></div><div class="ib-sh-right"><p class="ib-sh-hint">카테고리 추가 → 이름·설명 입력 → 아이템 넣기를 ${cats.length}번 반복</p>${catCards}</div></div></div>`;
  }
  function itemBuilds(id, view = {}) {
    const H = window.HERO_ITEM_BUILDS?.heroes?.[id];
    if (!H) return '';
    const b = H.builds.find(x => x.id === view.build) || H.builds[0],
      heroKo = window.IntelUI.guide(id)?.ko || '';
    // Every tile has a key (kind:phase:index) so the same item can sit in two places.
    const all = new Map();
    const add = (key, x, kind) => (all.set(key, [x, kind]), key);
    b.phases.forEach(p => {
      p.core.forEach((x, i) => add(`core:${p.key}:${i}`, x, 'core'));
      p.situ.forEach((x, i) => add(`situ:${p.key}:${i}`, x, 'situ'));
    });
    b.counters.forEach((g, j) => g.items.forEach((x, i) => add(`counter:${j}:${i}`, x, 'counter')));
    b.skip.forEach((x, i) => add(`skip:0:${i}`, x, 'skip'));
    const sel = all.has(view.item) ? view.item : all.keys().next().value,
      [selX, selKind] = all.get(sel);
    const tabs =
      H.builds.length > 1
        ? `<div class="ib-tabs" role="tablist" aria-label="빌드 선택">${H.builds
            .map(
              x =>
                `<button type="button" role="tab" aria-selected="${x === b}" class="${x === b ? 'on' : ''}" data-hero-build="${esc(x.id)}"><b>${esc(x.name)}</b><small>승률 ${x.win.toFixed(1)}% · ${num(x.n)}판</small></button>`
            )
            .join('')}</div>`
        : '';
    const phases = b.phases
      .map(
        p =>
          `<div class="ib-phase"><div class="ib-ph-label"><b>${p.label}</b><small>${p.when}</small></div><div class="ib-ph-items"><div class="ib-ph-core"><p class="ib-label">핵심${
            p.ordered ? ' · 순서대로' : ''
          }</p><div class="ib-row">${p.core.map((x, i) => ibTile(x, 'core', `core:${p.key}:${i}`, sel, p.ordered ? i + 1 : 0)).join('')}</div></div>${
            p.situ.length
              ? `<div class="ib-ph-situ"><p class="ib-label opt">상황별</p><div class="ib-row">${p.situ.map((x, i) => ibTile(x, 'situ', `situ:${p.key}:${i}`, sel)).join('')}</div></div>`
              : ''
          }</div>${p.note ? `<p class="ib-note">${esc(p.note)}</p>` : ''}</div>`
      )
      .join('');
    const counters = b.counters
      .map(
        (g, j) =>
          `<div class="ib-threat"><span>${esc(g.if)}</span><div class="ib-row">${g.items.map((x, i) => ibTile(x, 'counter', `counter:${j}:${i}`, sel)).join('')}</div></div>`
      )
      .join('');
    const skip = b.skip.map((x, i) => ibTile(x, 'skip', `skip:0:${i}`, sel)).join('');
    const statsView = () =>
      `${ibOrder(id, b)}<div class="ib-body"><div class="ib-main"><div class="ib-phases">${phases}</div>${
      counters ? `<h4 class="ib-sub">상황 대비 <small>상대 조합을 보고 필요할 때만</small></h4><div class="ib-threats">${counters}</div>` : ''
    }${skip ? `<h4 class="ib-sub">비추천 <small>많이 사지만 이 빌드엔 덜 맞는 아이템</small></h4><div class="ib-row">${skip}</div>` : ''}</div><aside class="ib-side">${ibDetail(
      selX,
      selKind,
      b,
      heroKo
    )}</aside></div><p class="ib-foot">아이콘 아래 숫자: 같은 가격대 아이템 대비 승률 차이. 이 빌드에서 그 아이템을 산 판을 같은 길이(5분 단위) 경기와 비교한 뒤, 같은 가격 아이템들의 평균을 뺀 값입니다. 비싼 아이템은 영혼이 넉넉한(이기는) 판에서 많이 사기 때문에 가격대끼리만 비교합니다. 아이템을 누르면 효과와 전체 통계가 나옵니다.</p>`;
    return `<section class="op-box op-ib"><div class="op-box-head"><h3>아이템 빌드 <small>최근 ${window.HERO_ITEM_BUILDS.days}일 ${esc(heroKo)} ${num(
      H.n
    )}판 · 평균 승률 ${H.win.toFixed(1)}%</small></h3><button type="button" class="ib-sheet-btn${view.sheet ? ' on' : ''}" data-ib-sheet="${
      view.sheet ? 'off' : 'on'
    }">${view.sheet ? '통계 보기' : '게임에 올리기'}</button></div>${tabs}<div class="ib-concept"><p>${esc(b.line)}</p><dl>${b.points
      .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join('')}</dl><p class="ib-build-nums"><span>이 빌드 <b>${num(b.n)}판</b> (${esc(heroKo)} 경기의 ${b.share.toFixed(1)}%)</span><span>승률 <b>${b.win.toFixed(
      1
    )}%</b></span><span>같은 길이 경기 대비 <b class="${b.adj >= 1 ? 'up' : b.adj <= -1 ? 'down' : ''}">${signed(b.adj)}%p</b></span></p></div>${view.sheet ? ibSheet(id, b, heroKo) : statsView()}</section>`;
  }
  function heroPage(id, view) {
    const g = window.IntelUI.guide(id),
      t = type(id),
      build = window.HERO_BUILDS?.[id],
      ranges = window.HERO_RANGES?.[id],
      gun = ranges?.gun;
    if (!g) return '';
    const ib = itemBuilds(id, view);
    const abilities = (g.abilities || []).slice(0, 4);
    const order = (build?.maxFirst || [])
      .map(
        m =>
          `<div class="op-order"><img src="assets/abilities/${id}-${m.slot}.png" alt=""><span>${m.slot}. ${esc(abilities[m.slot - 1]?.ko || '')}</span><i style="width:${m.share}%"></i><b>${m.share}%</b></div>`
      )
      .join('');
    const phase = (k, label) =>
      `<div class="op-phase"><span>${label}</span><div>${(build?.[k] || [])
        .map(x => `<div class="op-build-item">${itemIcon(x.id)}<em>${x.win}%</em></div>`)
        .join('')}</div></div>`;
    const counters = (g.counterItems || [])
      .map(n => (window.ITEM_CATALOG || []).find(i => i.name === n))
      .filter(Boolean)
      .map(i => itemIcon(i.id))
      .join('');
    const gunLine = gun
      ? `${gun.bullets > 1 ? `산탄 ${gun.bullets}발` : gun.burst ? `${gun.burst}연발` : '단발'} · 탄창 ${gun.clip} · 초당 ${gun.rate}발 · DPS ${gun.dps} · ${gun.falloffStart}m까지 최대 피해, ${gun.falloffEnd}m부터 최소`
      : '';
    return `<section class="op-box op-hero-head">${portrait(id, 'lg')}<div><h2>${esc(g.ko)} <small>${esc(g.en)}</small></h2><p>${tierBadge(id)} <span>${esc(ROLE[g.role] || '')}</span> · <span>${esc(
      [CURVE[t?.curve], FIGHT[t?.fight] && FIGHT[t?.fight] + ' 중심'].filter(Boolean).join(' · ')
    )}</span></p><p class="op-concept">${esc(g.style || '')}</p><div class="op-stats"><div><small>승률</small><b>${pct(t?.winRate?.overall)}</b></div><div><small>픽률</small><b>${pct(pickRate(id))}</b></div><div><small>28분 전</small><b>${pct(
      t?.winRate?.short
    )}</b></div><div><small>40분 후</small><b>${pct(t?.winRate?.long)}</b></div></div></div><div class="op-skill-icons">${abilities
      .map(a => `<span><img src="assets/abilities/${id}-${a.slot}.png" alt=""><small>${a.slot}</small></span>`)
      .join('')}</div></section>${ib}${window.StrategyUI?.buildStyles(id) || ''}<div class="op-cols"><section class="op-box"><h3>능력 마스터 순서 <small>먼저 마스터하는 능력 · 최근 30일</small></h3>${order || '<p class="op-empty">—</p>'}${ib ? '' : `<h3>인기 빌드 <small>시간대별 가장 많이 사는 아이템 · 승률</small></h3>${phase('early', '초반')}${phase('mid', '중반')}${phase('late', '후반')}`}</section><section class="op-box"><h3>능력</h3>${abilities
      .map((a, n) => {
        const k = ranges?.skills?.[n],
          dist = k?.m ? (k.kind === '반경' ? '반경 ' : '') + (k.m >= 100 ? '매우 멂' : k.m + 'm') : '';
        return `<div class="op-ability"><img src="assets/abilities/${id}-${a.slot}.png" alt=""><div><b>${a.slot}. ${esc(a.ko)}${dist ? ` <small>${esc(dist)}</small>` : ''}</b><p>${esc(a.desc)}</p>${a.tip ? `<p class="tip">상대할 때: ${esc(a.tip)}</p>` : ''}</div></div>`;
      })
      .join('')}${gunLine ? `<div class="op-ability gun"><span>총</span><div><b>${esc(g.ko)}의 총</b><p>${esc(gunLine)}</p></div></div>` : ''}</section></div><div class="op-cols"><section class="op-box"><h3>상대법</h3><ul class="op-list-tips">${(g.vsTips || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${
      counters ? `<h4>대응 아이템</h4><div class="op-items-row">${counters}</div>` : ''
    }<div class="op-pros"><div><h4 class="good">강점</h4><ul>${(g.strengths || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h4 class="bad">약점</h4><ul>${(g.weaknesses || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div></section><section class="op-box"><h3>운영</h3>${
      g.plan
        ? ['early', 'mid', 'late'].map((k, i) => `<div class="op-plan"><span>${['라인전', '중반', '후반'][i]}</span><p>${esc(g.plan[k])}</p></div>`).join('')
        : ''
    }${g.spikes ? `<h4>파워 스파이크</h4><p>${esc(g.spikes)}</p>` : ''}<h4>같은 팀일 때</h4><ul class="op-list-tips">${(g.withTips || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></section></div>`;
  }
  function heroes(selected, query, sort, view) {
    return `<div class="op-heroes">${heroTable(selected, query, sort)}<div class="op-detail">${heroPage(selected, view)}</div></div>`;
  }
  window.OpggUI = { match, heroes, tier };
})();

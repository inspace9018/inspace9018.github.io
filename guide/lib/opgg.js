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
  const CURVE_KO = { early: '초반형', even: '균형형', late: '후반형' };
  const FIGHT_KO = { gun: '무기', spirit: '마법', hybrid: '혼합' };
  const ROLE_KO = { marksman: '사수', brawler: '근접 싸움꾼', assassin: '암살자', mystic: '마법사' };
  const CURVE_EN = { early: 'Early game', even: 'Balanced', late: 'Late game' };
  const FIGHT_EN = { gun: 'Weapon', spirit: 'Spirit', hybrid: 'Mixed' };
  const ROLE_EN = { marksman: 'Marksman', brawler: 'Brawler', assassin: 'Assassin', mystic: 'Mystic' };
  // Looked up at render time so a language switch shows on the next render.
  const lookup = (ko, en) => new Proxy({}, { get: (_, k) => L(ko[k], en[k]) });
  const CURVE = lookup(CURVE_KO, CURVE_EN),
    FIGHT = lookup(FIGHT_KO, FIGHT_EN),
    ROLE = lookup(ROLE_KO, ROLE_EN);
  // Hero guide prose: the Korean field, or in English its *En field (hidden when there is none).
  const tx = (o, k) => (I18N.foreign ? I18N.tr(o?.[k + 'En']) : o?.[k]);
  const heroName = g => I18N.name(g);
  const itemName = id => I18N.item(id, window.ITEM_CATALOG, window.ITEM_KO);
  // Item build names come from the build export in Korean ("능력 · 신비의 숨결": a style, then its key
  // items joined by ·). In other languages the style is translated and each item gets its own name.
  const BUILD_STYLE_EN = {
    능력: 'Spirit',
    '총·능력': 'Gun + Spirit',
    화상: 'Burn',
    궁극기: 'Ultimate',
    정석: 'Standard',
    '능력 섞기': 'Mixed abilities',
    생존: 'Survival',
    무기: 'Weapon',
    혼합: 'Hybrid',
    '한타 유지': 'Teamfight sustain',
    '저체력 교전': 'Low-HP fights',
    사격: 'Shooting',
    견제: 'Poke',
    '근접 결투': 'Melee duel',
    연사: 'Rapid fire',
    추천: 'Recommended',
    화염: 'Fire'
  };
  let itemByKo = null;
  const buildName = b => {
    if (I18N.lang === 'ko') return b.name;
    itemByKo ||= new Map((window.ITEM_KO || []).map(x => [x.ko, x.id]));
    return b.name
      .split(' · ')
      .map((p, i) => (i ? p.split('·').map(q => (itemByKo.has(q) ? itemName(itemByKo.get(q)) : q)).join(' + ') : I18N.tr(BUILD_STYLE_EN[p] || p)))
      .join(' · ');
  };
  // The build export's sentences (line, points, reasons) are Korean only: left out in other languages.
  const koOnly = s => (/[가-힣]/.test(s || '') ? I18N.only(s) : s);
  const PHASE_EN = { early: 'Early', mid: 'Mid', late: 'Late' };
  const phaseLabel = p => L(p.label, PHASE_EN[p.key] || p.label);
  const phaseWhen = p => L(p.when, String(p.when || '').replace(/분/g, ' min'));
  // Camp floors (jungle-data.js) stay Korean in the data.
  const FLOOR_EN = { 지하: 'Basement', 지상: 'Ground', 상층: 'Upper', 고지대: 'High ground', 옥상: 'Roof', '2층': '2F', '3층': '3F', '4층': '4F' };
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
  const tierBadge = id => `<span class="op-tier t${tier(id)}">${L(`${tier(id)}티어`, `Tier ${tier(id)}`)}</span>`;
  const itemIcon = (id, label = true) => {
    const it = items().get(id);
    if (!it) return '';
    const ko = itemName(id);
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
    return `<tr class="${me ? 'me' : ''}"><td class="op-hero">${portrait(id)}<div><b>${esc(g ? heroName(g) : '')}${me ? L(' <i>나</i>', ' <i>Me</i>') : ''}${lane ? L(' <i class="lane">전선</i>', ' <i class="lane">Lane</i>') : ''}</b><small>${esc(
      [CURVE[t?.curve], FIGHT[t?.fight], (tx(g, 'tags') || []).slice(0, 2).join('·')].filter(Boolean).join(' · ')
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
    return `<section class="op-box op-team ${side}"><div class="op-team-head"><b>${title}</b><span>${ids.length}/6</span></div><table><thead><tr><th>${L('영웅', 'Hero')}</th><th>${L('티어', 'Tier')}</th><th>${L('승률', 'Win rate')}</th><th>${
      side === 'enemy' ? L('핵심 아이템', 'Key items') : L('후반 인기', 'Popular late')
    }</th></tr></thead><tbody>${
      ids.length ? ids.map(id => teamRow(id, side, s)).join('') : `<tr><td colspan="4" class="op-empty">${L('상단 바에서 영웅을 읽는 중', 'Reading heroes from the top bar')}</td></tr>`
    }</tbody></table></section>`;
  }
  // ---------- After the wave: camps, crates and golden statues near my lane ----------
  const KIND = lookup(
    { weak: '소형 캠프', medium: '중형 캠프', strong: '대형 캠프', vault: '금고' },
    { weak: 'Small camp', medium: 'Medium camp', strong: 'Large camp', vault: "Sinner's Sacrifice" }
  );
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
    const main = `<svg class="op-route-map" viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(w)}" role="img" aria-label="${L('웨이브 정리 후 동선 지도', 'Map of the route after clearing the wave')}"><image href="${TOP}" x="0" y="0" width="1" height="1" preserveAspectRatio="none"${
      flip ? ' transform="rotate(180 0.5 0.5)"' : ''
    } />${r.enemy ? line(r.enemy.path, 'r-enemy') + arrows(r.enemy.path, 'r-enemy-a') : ''}${line(r.path, 'r-path-halo')}${line(r.path, 'r-path')}${arrows(
      r.path,
      'r-path-a'
    )}${r.crates.map(p => dot(p, 'r-crate', 0.9)).join('')}${r.tough.map(p => dot(p, 'r-tough', 1.2)).join('')}${r.statues
      .map(p => dot(p, 'r-statue', 1.3))
      .join('')}${(r.enemy?.stops || []).map(c => pin(c, 0)).join('')}${r.stops.map((c, i) => pin(c, i + 1)).join('')}${r.stops
      .map((c, i) => label(c, campName(c), 'r-name', side(c, i), 0.4, side(c, i) > 0 ? 'start' : 'end'))
      .join('')}${dot(r.start, 'r-lane', 2.2)}${label(r.start, L('전선', 'Lane'), 'r-lane-t', 0, -4.4)}</svg>`;
    // Where this is on the whole map.
    const locator = `<svg class="op-route-where" viewBox="0 0 1 1" aria-hidden="true"><image href="${TOP}" x="0" y="0" width="1" height="1" preserveAspectRatio="none"${
      flip ? ' transform="rotate(180 0.5 0.5)"' : ''
    } /><rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(w)}" /></svg>`;
    return `<figure class="op-route-fig">${main}${locator}<figcaption>${L('아래쪽이 우리 기지', 'Our base is at the bottom')}</figcaption></figure>`;
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
    const head = `<div class="op-box-head"><h3>${L('웨이브 정리 후 동선', 'After clearing the wave')}</h3><span class="op-tag ${lane?.color ? 'lane-' + lane.color : ''}">${lane ? esc(lane.name) : L('전선 확인 중', 'Finding your lane')}</span></div>`;
    if (!r || r.missing)
      return `<section class="op-box op-route">${head}<p class="op-empty">${
        r?.missing === 'clock'
          ? L('경기 시계를 읽으면 동선을 계산합니다.', 'The route is worked out once the match clock is read.')
          : L(
              '내 전선과 팀(미니맵 방향)을 확인하면, 웨이브를 정리한 뒤 들를 캠프·상자·황금 조각상을 보여줍니다.',
              'Once your lane and team (minimap direction) are known, this shows the camps, crates and Golden Statues to visit after clearing the wave.'
            )
      }</p></section>`;
    const clock = window.IntelUI.clock;
    // Seconds after leaving the lane when each step starts.
    let t = 0;
    const row = (time, cls, title, detail) => `<li class="${cls}"><time>${time === null ? '' : clock(time)}</time><div><b>${title}</b>${detail ? `<small>${detail}</small>` : ''}</div></li>`;
    const steps = [row(0, 'rs-lane', L('웨이브 정리', 'Clear the wave'), L('밀어 두고 출발', 'Push it, then go'))];
    r.stops.forEach((c, i) => {
      t += c.walk + c.wait;
      steps.push(
        row(
          t,
          `rs-stop ${c.kind}`,
          `<i>${i + 1}</i>${esc(campName(c))}`,
          L(
            `${KIND[c.kind]} · ${esc(c.floor)}${c.wait ? ` · ${c.wait}초 기다림` : ''} · 잡는 데 약 ${c.clear}초`,
            `${KIND[c.kind]} · ${esc(FLOOR_EN[c.floor] || c.floor)}${c.wait ? ` · wait ${c.wait} sec` : ''} · about ${c.clear} sec to clear`
          )
        )
      );
      t += c.clear;
    });
    if (r.crateRun)
      steps.push(
        row(
          null,
          'rs-crate',
          L(`근처 상자 ${r.path.length - 2}개`, `${r.path.length - 2} crates nearby`),
          L('들를 캠프가 없을 때. 상자는 60% 확률로 영혼이 나옵니다', 'When there is no camp to visit. Crates drop Souls 60% of the time')
        )
      );
    if (r.stops.length || r.crateRun)
      steps.push(row(r.total, 'rs-back', L('전선 복귀', 'Back to lane'), L(`다음 웨이브는 ${r.wave}초마다 옵니다`, `A wave comes every ${r.wave} sec`)));
    else
      steps.push(
        row(
          null,
          'rs-wait',
          L('지금은 전선 유지', 'Hold the lane for now'),
          L(
            `${r.next ? `다음은 ${esc(campName(r.next))}(${KIND[r.next.kind]}), ${clock(r.next.in)} 뒤` : '가까운 캠프가 아직 없습니다'}${r.cratesUp ? '' : '. 상자는 3:00부터'}`,
            `${r.next ? `Next: ${esc(campName(r.next))} (${KIND[r.next.kind]}) in ${clock(r.next.in)}` : 'No camp nearby yet'}${r.cratesUp ? '' : '. Crates from 3:00'}`
          )
        )
      );
    const onWay = [
      r.cratesUp && r.crates.length ? `<span><i class="k-crate"></i>${L(`상자 ${r.crates.length}`, `Crates ${r.crates.length}`)}</span>` : '',
      r.cratesUp && r.tough.length
        ? `<span><i class="k-tough"></i>${L(`튼튼한 상자 ${r.tough.length} (강한 근거리 공격으로)`, `Tough crates ${r.tough.length} (heavy melee)`)}</span>`
        : '',
      r.statues.length
        ? `<span><i class="k-statue"></i>${L(`황금 조각상 자리 ${r.statues.length} (50% 확률)`, `Golden Statue spots ${r.statues.length} (50% chance)`)}</span>`
        : ''
    ].join('');
    const alt = r.enemy
      ? `<div class="op-route-alt"><b>${L('상대 정글은 안전할 때만', 'Enemy jungle only when safe')}</b><p>${r.enemy.stops
          .map(c => esc(campName(c)))
          .join(' → ')}${L(
          `, 다녀오는 데 약 ${r.enemy.total}초. 상대 전선 영웅이 귀환했거나 죽었을 때만 가세요. 지도에 빨간 점선으로 표시했습니다.`,
          `, about ${r.enemy.total} sec there and back. Go only when your lane opponents have gone back to base or died. Shown as a red dashed line on the map.`
        )}</p></div>`
      : '';
    return `<section class="op-box op-route">${head}<div class="op-route-body">${routeMap(r)}<div class="op-route-side"><ol class="op-steps">${steps.join('')}</ol>${
      onWay ? `<p class="op-onway"><small>${L('가는 길에', 'On the way')}</small>${onWay}</p>` : ''
    }${alt}<p class="note">${L(
      '전선이 먼저, 그다음 캠프, 상자는 마지막. 웨이브가 오면 캠프는 두고 돌아가세요.',
      'Lane first, then camps, crates last. When a wave comes, leave the camp and go back.'
    )}</p></div></div></section>`;
  }
  function nextObjective(s) {
    const o=s.intel?.objectives;
    if(!o?.known)return L('<p class="op-empty">경기 시계 확인 후 다음 목표물을 표시합니다.</p>','<p class="op-empty">The next objective shows once the match clock is read.</p>');
    const targets=[
      {name:L('영혼 단지','Soul Urn'),remaining:o.urn.remaining,detail:o.urn.laneName||''},
      {name:L('균열 생성','Rift spawn'),remaining:o.rift.state==='window'?0:o.rift.remaining,detail:window.IntelUI.clock(o.rift.from)+'~'+window.IntelUI.clock(o.rift.to)+L(' 생성 밴드',' spawn window')},
      ...(o.midboss.state==='respawn'?[{name:L('중앙 보스','Mid-Boss'),remaining:o.midboss.remaining,detail:L('재생성','Respawn')}]:[])
    ].filter(t=>Number.isFinite(t.remaining)&&t.remaining>=0).sort((a,b)=>a.remaining-b.remaining);
    const t=targets[0];
    return t?'<div class="op-next"><b>'+esc(t.name)+'</b><strong>'+ (t.remaining===0?L('지금 확인','Check now'):window.IntelUI.clock(t.remaining))+'</strong><small>'+esc(t.detail)+'</small></div>':L('<p>목표물 시각 확인 중</p>','<p>Finding objective times</p>');
  }
  function laneSummary(s) {
    const lane=s.intel?.lane||{},us=[s.live?.local?.heroId,lane.partner].filter(Number.isInteger),them=lane.opponents||[];
    const names=ids=>ids.map(id=>{const g=window.IntelUI.guide(id);return '<span>'+portrait(id)+'<b>'+esc((g&&heroName(g))||L('식별 대기','Not identified'))+'</b></span>';}).join('');
    return '<div class="op-lane-summary"><div>'+names(us)+'</div><small>'+L('우리 전선','Our lane')+'</small><b class="op-versus">VS</b><div>'+names(them)+'</div><small>'+L('상대 전선','Their lane')+(!them.length?L(' · 배정·관측 대기',' · waiting to be seen'):'')+'</small></div>';
  }
  function match(s, view, actions) {
    const live = s.live || {},
      ours = [live.local?.heroId, ...(live.allies || []).map(a => a.heroId)].filter(Number.isInteger),
      theirs = (live.opponents || []).map(o => o.heroId).filter(Number.isInteger),
      ok = s.connection?.code === 'receiving' && !live.stale;
    // Most urgent first: what to do now and the objective timers, then the lane, then who is in the
    // match, then where to go after the wave.
    const primary = (s.coach||[]).find(c=>!['plan','comp','items','team','clock-wait'].includes(c.id));
    const sentence = primary?.body?.split(/(?<=[.!?])\s+/)[0] || '';
    const now = primary ? '<div class="iu-card top"><b>'+esc(primary.title)+'</b><p>'+esc(sentence)+'</p></div>' : L('<p class="op-empty">경기 화면이 읽히면 지금 할 일이 여기 뜹니다.</p>', '<p class="op-empty">What to do now shows here once the game screen is read.</p>');
    return `<div class="op-strip"><div><span class="op-live ${ok ? 'on' : ''}">${ok ? 'LIVE' : L('대기', 'Waiting')}</span><b>${
      Number.isFinite(live.seconds) ? window.IntelUI.clock(live.seconds) : '--:--'
    }</b><span>${esc(s.connection?.message || '')}</span></div><div class="op-actions">${actions}</div></div><section class="op-box status-summary" data-reading-status>${window.ReadingStatus?.html(s)||''}</section><div class="op-grid3 op-now"><section class="op-box op-todo"><h3>${L('지금 할 행동', 'Do now')}</h3>${now}<small class="op-phase">${esc(window.MatchPhase?.of(live.seconds).label||L('시간 확인 중', 'Reading the clock'))}</small></section><section class="op-box"><h3>${L('다음 목표물', 'Next objective')}</h3>${nextObjective(s)}</section><section class="op-box"><h3>${L('내 전선 · 상대', 'My lane · opponents')}</h3>${laneSummary(s)}</section></div><details class="op-box op-more"><summary>${L('능력·빌드·운영과 전체 목표물 자세히', 'Abilities, builds, game plan and all objectives')}</summary><div class="op-grid3"><section><h3>${L('추가 안내·운영', 'More tips · game plan')}</h3>${window.IntelUI.now(s,4)}</section><section><h3>${L('전체 목표물', 'All objectives')}</h3>${window.IntelUI.timers(s)}</section><section><h3>${L('전선 상대 상세', 'Lane opponents in detail')}</h3>${window.IntelUI.lane(s,'',{...view,detail:true})}</section></div></details><div class="op-teams">${teamTable(
      L('우리 팀', 'Our team'),
      'ally',
      ours,
      s
    )}${teamTable(L('적 팀', 'Enemy team'), 'enemy', theirs, s)}</div>${routeBox(s)}`;
  }

  // ---------- Heroes ----------
  const sorts = {
    tier: (a, b) => tier(a.id) - tier(b.id) || (type(b.id)?.winRate?.overall || 0) - (type(a.id)?.winRate?.overall || 0),
    win: (a, b) => (type(b.id)?.winRate?.overall || 0) - (type(a.id)?.winRate?.overall || 0),
    pick: (a, b) => (pickRate(b.id) || 0) - (pickRate(a.id) || 0),
    name: (a, b) =>
      I18N.lang === 'ko'
        ? a.ko.localeCompare(b.ko, 'ko')
        : I18N.lang === 'en'
          ? a.en.replace(/^The /, '').localeCompare(b.en.replace(/^The /, ''), 'en')
          : I18N.name(a).localeCompare(I18N.name(b), I18N.lang)
  };
  function heroTable(selected, query, sort) {
    const q = query.trim().toLowerCase(),
      list = (window.HERO_GUIDE || [])
        .filter(h => !q || h.ko.toLowerCase().includes(q) || h.en.toLowerCase().includes(q))
        .sort(sorts[sort] || sorts.tier);
    const th = (k, label) => `<th><button data-hero-sort="${k}" class="${sort === k ? 'on' : ''}">${label}</button></th>`;
    const search = L('영웅 검색', 'Search heroes');
    return `<section class="op-box op-list"><input type="search" id="guide-q" placeholder="${search}" value="${esc(query)}" aria-label="${search}"><table><thead><tr><th>#</th>${th('name', L('영웅', 'Hero'))}${th('tier', L('티어', 'Tier'))}${th('win', L('승률', 'Win rate'))}${th('pick', L('픽률', 'Pick rate'))}</tr></thead><tbody>${list
      .map(
        (h, i) =>
          `<tr data-guide-id="${h.id}" class="${h.id === selected ? 'on' : ''}"><td class="rank">${i + 1}</td><td class="op-hero">${portrait(h.id)}<b>${esc(heroName(h))}</b></td><td>${tierBadge(h.id)}</td><td class="num">${pct(type(h.id)?.winRate?.overall)}</td><td class="num">${pct(pickRate(h.id))}</td></tr>`
      )
      .join('')}</tbody></table></section>`;
  }
  // ---------- Item builds (hero-item-builds.js): builds chosen from 30-day stats ----------
  const SLOT_CLS = { weapon: 'w', vitality: 'v', spirit: 's' };
  const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(1);
  const num = v => Number(v || 0).toLocaleString('ko-KR');
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const IB_KIND = lookup(
    { core: '핵심', material: '조합 재료', finish: '완성안', situ: '상황별', counter: '상황 대비', skip: '비추천' },
    { core: 'Core', material: 'Component', finish: 'Final build', situ: 'Situational', counter: 'Counter', skip: 'Not recommended' }
  );
  const games = n => L(`${num(n)}판`, `${num(n)} games`);
  function ibRecipeSteps(xs) {
    const seen=new Set(),steps=[];
    const visit=id=>{
      if(seen.has(id))return;
      seen.add(id);
      const parts=window.HERO_ITEM_BUILDS.items[id]?.parts||[];
      parts.forEach(visit);
      if(parts.length)steps.push({id,parts});
    };
    xs.forEach(x=>visit(x.id));
    return steps;
  }
  function ibRecipeKey(b,id) {
    for(const p of b.phases){
      const purchase=p.purchases?.findIndex(x=>x.id===id)??-1;
      if(purchase>=0)return `buy:${p.key}:${purchase}`;
    }
    const material=b.materials?.findIndex(x=>x.id===id)??-1;
    if(material>=0)return `material:0:${material}`;
    for(const p of b.phases)for(const kind of ['core','situ']){
      const i=p[kind].findIndex(x=>x.id===id);
      if(i>=0)return `${kind}:${p.key}:${i}`;
    }
    for(let j=0;j<b.counters.length;j++){
      const i=b.counters[j].items.findIndex(x=>x.id===id);
      if(i>=0)return `counter:${j}:${i}`;
    }
    return null;
  }
  function ibRecipes(xs,b) {
    const steps=ibRecipeSteps(xs);
    if(!steps.length)return '';
    const node=id=>{
      const it=items().get(id),key=ibRecipeKey(b,id),label=itemName(id);
      return `<button type="button" class="ib-recipe-item" data-ib-item="${esc(key||'')}"><img src="${esc(it?.file||'')}" alt=""><span>${esc(label)}</span></button>`;
    };
    return `<div class="ib-recipes"><h5>${L('조합 전 아이템','Components')}</h5>${steps.map(s=>`<div class="ib-recipe-step">${s.parts.map(node).join(`<span class="ib-recipe-symbol" aria-label="${L('함께 조합','combined with')}">+</span>`)}<span class="ib-recipe-symbol" aria-label="${L('업그레이드','upgrades to')}">→</span>${node(s.id)}</div>`).join('')}<p>${L('이미 가진 재료는 다시 사지 않습니다. 슬롯이 부족하면 상위 아이템을 바로 구매하세요.',"Don't buy components you already have again. If you are short on slots, buy the upgraded item directly.")}</p></div>`;
  }
  // A tile: icon, name, the price-band number and, under it, the item's job in this build (why[0]; for
  // 상황 대비 the reason it answers that threat). Hovering shows what the item does and, for actives,
  // when to use it.
  function ibTile(x, kind, key, sel, n) {
    const it = items().get(x.id);
    if (!it) return '';
    const ko = itemName(x.id),
      info = window.HERO_ITEM_BUILDS.items[x.id] || {},
      active = (info.tt || []).find(t => t.k === 'active'),
      use = active && koOnly(window.ITEM_USE?.[x.id]),
      adj = x.s ? `<em class="${x.s.rel >= 1 ? 'up' : x.s.rel <= -1 ? 'down' : ''}">${signed(x.s.rel)}%p</em>` : '<em>—</em>';
    const effects = (info.tt || [])
      .filter(t => t.k !== 'base' && koOnly(t.text))
      .map(t => `<p><b>${t.k === 'active' ? `${L('사용', 'Active')}${t.cd ? ` · ${esc(t.cd)}` : ''}` : L('지속', 'Passive')}</b>${esc(t.text)}</p>`)
      .join('');
    const tip = `<span class="ib-tip" role="tooltip"><b>${esc(ko)}</b><small>${[esc(koOnly(window.ITEM_BRIEF?.[x.id] || info.head || '')), `${num(it.cost)} ${L('영혼', 'Souls')}`].filter(Boolean).join(' · ')}</small>${effects}${
      use ? `<p class="use"><b>${L('사용법', 'How to use')}</b>${esc(use)}</p>` : ''
    }</span>`;
    return `<button type="button" class="ib-item ${SLOT_CLS[it.slot] || ''}${sel === key ? ' on' : ''}" data-ib-item="${esc(key)}"><span class="ib-ico"><img src="${esc(it.file)}" alt="">${
      n ? `<i>${n}</i>` : ''
    }${active ? `<u>${L('사용', 'Active')}</u>` : ''}</span><small>${esc(ko)}</small>${x.materialFor ? `<span class="ib-material-for">${L('재료', 'For')} → ${esc(itemName(x.materialFor)||L('상위 아이템', 'upgrade'))}</span>` : ''}${kind === 'skip' ? '' : adj}${koOnly(x.why[0]) ? `<span class="ib-role">${esc(x.why[0])}</span>` : ''}${tip}</button>`;
  }
  function ibDetail(x, kind, b, heroKo) {
    const it = items().get(x.id),
      info = window.HERO_ITEM_BUILDS.items[x.id] || {},
      ko = itemName(x.id),
      s = x.s;
    const tt = (info.tt || [])
      .map(t => {
        const stats = t.stats
          .filter(([l]) => koOnly(l))
          .map(([l, v, sc]) => `<span>${esc(l)} <b>${esc(v)}</b>${sc ? ` <i>(${esc(sc)})</i>` : ''}</span>`)
          .join('');
        return t.k === 'base'
          ? `<div class="ib-tt base"><h5>${L('기본 능력치', 'Base stats')}</h5><p class="ib-stats">${stats}</p></div>`
          : `<div class="ib-tt ${t.k}"><h5>${t.k === 'active' ? L('사용 효과', 'Active') : L('지속 효과', 'Passive')}${t.cd ? `<span>${L('쿨다운', 'Cooldown')} ${esc(t.cd)}</span>` : ''}</h5>${
              koOnly(t.text) ? `<p>${esc(t.text)}</p>` : ''
            }${stats ? `<p class="ib-stats">${stats}</p>` : ''}</div>`;
      })
      .join('');
    const rows = s
      ? [
          [L('이 빌드에서 구매', 'Bought in this build'), `${Math.min(100, s.pick).toFixed(1)}% <small>(${games(s.n)})</small>`],
          [L('구매한 판 승률', 'Win rate when bought'), `${s.win.toFixed(1)}%`],
          [L('같은 길이 경기 대비', 'vs games of the same length'), `${signed(s.adj)}%p`],
          [L('같은 가격대 아이템 대비', 'vs items at the same price'), `<b class="${s.rel >= 1 ? 'up' : s.rel <= -1 ? 'down' : ''}">${signed(s.rel)}%p</b>`],
          [L('평균 구매 시각', 'Average buy time'), mmss(s.t)],
          s.en >= 300 && s.ew !== null
            ? [L('10분 전 구매', 'Bought before 10 min'), L(`${num(s.en)}판 · 승률 ${s.ew.toFixed(1)}%`, `${num(s.en)} games · win rate ${s.ew.toFixed(1)}%`)]
            : null
        ]
          .filter(Boolean)
          .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
          .join('')
      : '';
    return `<div class="ib-detail"><div class="ib-detail-head"><span class="ib-ico big ${SLOT_CLS[it?.slot] || ''}"><img src="${esc(it?.file || '')}" alt=""></span><div><h4>${esc(ko)} <span class="ib-kind ${kind}">${IB_KIND[kind]}</span></h4><p>${koOnly(info.head) ? `${esc(info.head)} · ` : ''}<span class="soul">${num(it?.cost)} ${L('영혼', 'Souls')}</span></p></div></div>${koOnly(x.if) ? `<p class="ib-if"><b>${L('언제', 'When')}</b>${esc(x.if)}</p>` : ''}${
      koOnly(window.ITEM_USE?.[x.id]) && (info.tt || []).some(t => t.k === 'active') ? `<p class="ib-if use"><b>${L('사용법', 'How to use')}</b>${esc(window.ITEM_USE[x.id])}</p>` : ''
    }${x.purchaseOrder?`<p class="ib-if ib-purchase-position"><b>${L('구매 순서','Buy order')}</b>${L(`${{early:'초반',mid:'중반',late:'후반'}[x.phase]} ${x.phaseOrder}번째 · 전체 ${x.purchaseOrder}번`,`${PHASE_EN[x.phase]} #${x.phaseOrder} · #${x.purchaseOrder} overall`)}</p>`:''}${kind==='skip'?'':ibRecipes([x],b)}<div class="ib-detail-body"><div class="ib-tts">${tt}</div><div class="ib-why">${
      x.why.filter(koOnly).length ? `<h5>${kind === 'skip' ? L('빼는 이유', 'Why skip it') : L('이유', 'Why')}</h5><ul>${x.why.filter(koOnly).map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''
    }${rows ? `<h5>${L(`${esc(b.name)} 빌드 통계`, `${esc(buildName(b))} build stats`)}</h5><dl class="ib-nums">${rows}</dl>` : ''}</div></div></div>`;
  }
  // Ability point order for the build: one column per step (4 unlocks + 3 upgrades each), the level is the
  // earliest one that step is possible at, and the bottom row is how many players at that point chose it.
  function ibOrder(id, b) {
    const steps = b.order || [];
    if (!steps.length) return '';
    const abil = window.IntelUI.guide(id)?.abilities || [],
      name = slot => `${slot}. ${I18N.name(abil[slot - 1])}`;
    const maxed = steps.filter(s => s.tier === 3).map(s => name(s.slot));
    const rows = [1, 2, 3, 4]
      .map(
        slot =>
          `<tr><th><img src="assets/abilities/${id}-${slot}.png" alt=""><span>${esc(name(slot))}</span></th>${steps
            .map(s => (s.slot === slot ? `<td class="on t${s.tier}">${s.tier ? s.tier : L('해금', 'Unlock')}</td>` : '<td></td>'))
            .join('')}</tr>`
      )
      .join('');
    const splits = steps
      .map((s, i) =>
        s.alt
          ? L(
              `${i + 1}번째(레벨 ${s.level}): ${esc(name(s.slot))} ${s.share.toFixed(1)}% · ${esc(name(s.alt.slot))} ${s.alt.share.toFixed(1)}%`,
              `Step ${i + 1} (level ${s.level}): ${esc(name(s.slot))} ${s.share.toFixed(1)}% · ${esc(name(s.alt.slot))} ${s.alt.share.toFixed(1)}%`
            )
          : ''
      )
      .filter(Boolean);
    return `<div class="ib-order"><h4 class="ib-sub">${L(
      '능력 찍는 순서 <small>이 빌드에서 가장 많이 고른 순서 · 숫자는 강화 단계</small>',
      'Ability Point Order <small>most common order in this build · numbers are upgrade tiers</small>'
    )}</h4>${
      maxed.length ? `<p class="ib-order-max">${L('마스터 순서', 'Max order')} ${maxed.map(n => `<b>${esc(n)}</b>`).join(' → ')}</p>` : ''
    }<div class="ib-order-scroll"><table class="ib-order-grid"><thead><tr><th>${L('레벨', 'Level')}</th>${steps
      .map(s => `<th title="${L('평균', 'Average')} ${mmss(s.t)}">${s.level}</th>`)
      .join('')}</tr></thead><tbody>${rows}<tr class="ib-order-share"><th>${L('선택률', 'Picked')}</th>${steps
      .map(s => `<td class="${s.alt ? 'split' : ''}" title="${games(s.n)}">${Math.round(s.share)}%</td>`)
      .join('')}</tr></tbody></table></div><p class="ib-order-note">${L(
      '레벨: 그 단계를 찍을 수 있는 가장 빠른 레벨 (해금 1·3·5·8레벨, 강화 1·2·5포인트). 선택률: 앞 단계까지 같은 순서로 찍은 판 중 이 능력을 고른 비율.',
      'Level: the earliest level that step can be taken (unlocks at levels 1·3·5·8, upgrades cost 1·2·5 points). Picked: of the games with the same order up to the step before, the share that took this ability.'
    )}${
      steps.length < 16
        ? L(` ${steps.length + 1}번째부터는 표본이 100판 미만이라 뺐습니다.`, ` Steps from ${steps.length + 1} on are left out: fewer than 100 games.`)
        : ''
    }</p>${splits.length ? `<p class="ib-order-note">${L('갈리는 곳', 'Where it splits')}: ${splits.join(' / ')}</p>` : ''}</div>`;
  }
  // How export_dash.py ranks a hero's builds (rank_builds): the lead over games of the same length, counted by
  // n / (n + n0) so a build with few games needs a bigger lead.
  function rankRule() {
    const n0 = window.HERO_ITEM_BUILDS.rankRule?.n0 || 30000;
    return L(
      `순위: 판수와 승률을 함께 봅니다. 같은 길이 경기 대비 승률 차에 판수 ÷ (판수 + ${num(n0)})를 곱한 값이 큰 순서라, 판수가 적은 빌드는 승률 차를 덜 인정받습니다.`,
      `Rank: games and win rate together. Builds are ordered by the lead over games of the same length times games ÷ (games + ${num(n0)}), so a build with few games gets less credit for its lead.`
    );
  }
  function ibFinish(b, sel) {
    const f = b.finish;
    if (!f) return '';
    const name = itemName;
    const sales = f.sell.map(x=>`<li><b>${esc(name(x.id))}</b><span>${esc(koOnly(x.why[0]))}${x.before ? L(' · '+esc(name(x.before))+' 구매 전', ' · before buying '+esc(name(x.before))) : ''}</span></li>`).join('');
    const upgrades = f.upgrades.map(x=>`<li>${x.from.map(id=>esc(name(id))).join(' + ')} <span aria-label="${L('업그레이드','upgrades to')}">→</span> <b>${esc(name(x.to))}</b></li>`).join('');
    return `<section class="ib-finish" aria-label="${L('최종 아이템 완성안','Final item build')}"><div class="ib-finish-head"><div><h4>${L('후반 핵심까지 구매한 완성안','Final build, late core bought')}</h4><p>${L(`기본 ${f.base}칸 + 추가 ${f.extra}칸 해금 기준 · 아이콘 숫자는 전체 구매 번호`,`${f.base} base slots + ${f.extra} unlocked slots · icon numbers are the overall buy order`)}</p></div><b class="ib-finish-count">${L(`${f.items.length} / ${f.capacity}칸`,`${f.items.length} / ${f.capacity} slots`)}</b></div><div class="ib-finish-grid">${f.items.map((x,i)=>`<div class="ib-finish-slot${i>=f.base?' extra':''}">${ibTile(x,'finish',`finish:0:${i}`,sel,x.purchaseOrder||i+1)}${i>=f.base?`<small class="ib-extra-label">${L('추가 슬롯','Extra slot')}</small>`:''}</div>`).join('')}</div><p class="ib-finish-note">${L('워커를 파괴해 추가 슬롯을 열어야 12개를 모두 보유할 수 있습니다. 상황별·상황 대비 아이템은 이 구성에서 교체하며, 13번째로 더 사지 않습니다.','Destroy Walkers to unlock the extra slots and hold all 12. Situational and counter items replace items in this set; they are not a 13th buy.')}</p>${sales?`<div class="ib-finish-sales"><h5>${L('후반에 정리할 임시 아이템','Temporary items to sell late')}</h5><ul>${sales}</ul></div>`:''}${upgrades?`<details class="ib-finish-upgrades"><summary>${L(`재료가 합쳐지는 업그레이드 ${f.upgrades.length}개`,`${f.upgrades.length} upgrades that merge components`)}</summary><ul>${upgrades}</ul></details>`:''}</section>`;
  }
  function itemBuilds(id, view = {}) {
    const H = window.HERO_ITEM_BUILDS?.heroes?.[id];
    if (!H) return '';
    // Folded until clicked: one line with the builds' names, so the hero page opens on its guide.
    if (!view.ib)
      return `<section class="op-box op-ib op-ib-folded"><button type="button" class="ib-open" data-ib-open="on"><span><b>${L('아이템 빌드', 'Item builds')}</b><small>${L(
        `빌드 ${H.builds.length}개 · 최근 ${window.HERO_ITEM_BUILDS.days}일 ${num(H.n)}판`,
        `${H.builds.length} builds · ${num(H.n)} games in the last ${window.HERO_ITEM_BUILDS.days} days`
      )}</small></span><span class="ib-open-names">${H.builds.map(x => `<em>${esc(buildName(x))}</em>`).join('')}</span><span class="ib-open-go">${L('열기', 'Open')}</span></button></section>`;
    const b = H.builds.find(x => x.id === view.build) || H.builds[0],
      heroKo = I18N.name(window.IntelUI.guide(id));
    // Every tile has a key (kind:phase:index) so the same item can sit in two places.
    const all = new Map();
    const add = (key, x, kind) => (all.set(key, [x, kind]), key);
    b.phases.forEach(p => {
      (p.purchases||p.core).forEach((x,i)=>add(`buy:${p.key}:${i}`,x,x.materialFor?'material':'core'));
      p.core.forEach((x, i) => add(`core:${p.key}:${i}`, x, 'core'));
      p.situ.forEach((x, i) => add(`situ:${p.key}:${i}`, x, 'situ'));
    });
    b.counters.forEach((g, j) => g.items.forEach((x, i) => add(`counter:${j}:${i}`, x, 'counter')));
    b.skip.forEach((x, i) => add(`skip:0:${i}`, x, 'skip'));
    b.finish?.items.forEach((x, i) => add(`finish:0:${i}`, x, 'finish'));
    b.materials?.forEach((x, i) => add(`material:0:${i}`, x, 'material'));
    const sel = all.has(view.item) ? view.item : all.keys().next().value,
      [selX, selKind] = all.get(sel);
    const tabs =
      H.builds.length > 1
        ? `<div class="ib-tabs" role="tablist" aria-label="${L('빌드 선택', 'Choose a build')}">${H.builds
            .map(
              x =>
                `<button type="button" role="tab" aria-selected="${x === b}" class="${x === b ? 'on' : ''}" data-hero-build="${esc(x.id)}"><b>${L(`${x.rank}위`, `#${x.rank}`)} ${esc(buildName(x))}</b><small>${L('승률', 'Win rate')} ${x.win.toFixed(1)}% · ${games(x.n)}</small></button>`
            )
            .join('')}</div>`
        : '';
    const phases = b.phases
      .map(
        p =>
          `<div class="ib-phase"><div class="ib-ph-label"><b>${phaseLabel(p)}</b><small>${phaseWhen(p)}</small><em class="ib-phase-order">${L(`${p.orderStart}~${p.orderEnd}번`, `#${p.orderStart}~${p.orderEnd}`)}</em></div><div class="ib-ph-items"><div class="ib-ph-core"><p class="ib-label">${L(`핵심 · ${p.orderStart}~${p.orderEnd}번 순서대로 · 재료 포함`, `Core · #${p.orderStart}~${p.orderEnd} in order · components included`)}</p><div class="ib-row">${(p.purchases||p.core).map((x, i) => ibTile(x, x.materialFor?'material':'core', `buy:${p.key}:${i}`, sel, x.purchaseOrder||i+1)).join('')}</div><p class="ib-purchase-note">${L('보유한 재료는 생략 · 슬롯이 부족하면 상위 아이템을 바로 구매', 'Skip components you have · if short on slots, buy the upgrade directly')}</p></div>${
            p.situ.length
              ? `<div class="ib-ph-situ"><p class="ib-label opt">${L('상황별', 'Situational')}</p><div class="ib-row">${p.situ.map((x, i) => ibTile(x, 'situ', `situ:${p.key}:${i}`, sel)).join('')}</div></div>`
              : ''
          }</div>${koOnly(p.note) ? `<p class="ib-note">${esc(p.note)}</p>` : ''}</div>`
      )
      .join('');
    const counters = b.counters
      .map(
        (g, j) =>
          `<div class="ib-threat">${koOnly(g.if) ? `<span>${esc(g.if)}</span>` : ''}<div class="ib-row">${g.items.map((x, i) => ibTile(x, 'counter', `counter:${j}:${i}`, sel)).join('')}</div></div>`
      )
      .join('');
    const skip = b.skip.map((x, i) => ibTile(x, 'skip', `skip:0:${i}`, sel)).join('');
    const statsView = () =>
      `${ibOrder(id, b)}<div class="ib-body"><div class="ib-main"><div class="ib-phases">${phases}</div>${ibFinish(b,sel)}${
      counters ? `<h4 class="ib-sub">${L('상황 대비 <small>필요할 때 완성안의 아이템과 교체</small>', 'Counters <small>swap into the final build when needed</small>')}</h4><div class="ib-threats">${counters}</div>` : ''
    }${skip ? `<h4 class="ib-sub">${L('비추천 <small>많이 사지만 이 빌드엔 덜 맞는 아이템</small>', 'Not recommended <small>often bought, but a poor fit for this build</small>')}</h4><div class="ib-row">${skip}</div>` : ''}</div><aside class="ib-side">${ibDetail(
      selX,
      selKind,
      b,
      heroKo
    )}</aside></div><p class="ib-foot">${esc(rankRule())} ${L(
      '아이콘 아래 숫자: 같은 가격대 아이템 대비 승률 차이. 이 빌드에서 그 아이템을 산 판을 같은 길이(5분 단위) 경기와 비교한 뒤, 같은 가격 아이템들의 평균을 뺀 값입니다. 비싼 아이템은 영혼이 넉넉한(이기는) 판에서 많이 사기 때문에 가격대끼리만 비교합니다. 아이템을 누르면 효과와 전체 통계가 나옵니다. 표시 승률은 빌드군의 통계이며, 완성안 12개를 동시에 보유한 승률은 아닙니다.',
      'Number under each icon: win rate difference against items at the same price. Games in this build where the item was bought are compared with games of the same length (5-min steps), then the average of items at the same price is taken away. Expensive items are bought more in games with Souls to spare (winning ones), so only items at the same price are compared. Click an item for its effects and full stats. Win rates shown are for the build group, not for holding all 12 items of the final build at once.'
    )}</p>`;
    return `<section class="op-box op-ib"><div class="op-box-head"><h3>${L(
      `아이템 빌드 <small>최근 ${window.HERO_ITEM_BUILDS.days}일 ${esc(heroKo)} ${num(H.n)}판 · 평균 승률 ${H.win.toFixed(1)}%</small>`,
      `Item builds <small>last ${window.HERO_ITEM_BUILDS.days} days, ${num(H.n)} ${esc(heroKo)} games · average win rate ${H.win.toFixed(1)}%</small>`
    )}</h3><button type="button" class="ib-fold" data-ib-open="off">${L('접기', 'Fold')}</button></div>${tabs}<div class="ib-concept">${koOnly(b.line) ? `<p>${esc(b.line)}</p>` : ''}<dl>${b.points
      .filter(([k, v]) => koOnly(k) && koOnly(v))
      .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join('')}</dl><p class="ib-build-nums"><span title="${esc(rankRule())}">${L(`순위 ${b.rank} / ${H.builds.length}`, `Rank ${b.rank} / ${H.builds.length}`)}</span><span>${L(
      `이 빌드 <b>${num(b.n)}판</b> (${esc(heroKo)} 경기의 ${b.share.toFixed(1)}%)`,
      `This build <b>${num(b.n)} games</b> (${b.share.toFixed(1)}% of ${esc(heroKo)} games)`
    )}</span><span>${L('승률', 'Win rate')} <b>${b.win.toFixed(
      1
    )}%</b></span><span>${L('같은 길이 경기 대비', 'vs games of the same length')} <b class="${b.adj >= 1 ? 'up' : b.adj <= -1 ? 'down' : ''}">${signed(b.adj)}%p</b></span></p></div>${statsView()}</section>`;
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
          `<div class="op-order"><img src="assets/abilities/${id}-${m.slot}.png" alt=""><span>${m.slot}. ${esc(I18N.name(abilities[m.slot - 1]))}</span><i style="width:${m.share}%"></i><b>${m.share}%</b></div>`
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
      ? L(
          `${gun.bullets > 1 ? `산탄 ${gun.bullets}발` : gun.burst ? `${gun.burst}연발` : '단발'} · 탄창 ${gun.clip} · 초당 ${gun.rate}발 · DPS ${gun.dps} · ${gun.falloffStart}m까지 최대 피해, ${gun.falloffEnd}m부터 최소`,
          `${gun.bullets > 1 ? `${gun.bullets} pellets` : gun.burst ? `${gun.burst}-round burst` : 'Single shot'} · Ammo ${gun.clip} · ${gun.rate} bullets/sec · DPS ${gun.dps} · full damage to ${gun.falloffStart}m, minimum from ${gun.falloffEnd}m`
        )
      : '';
    // English: hero guide prose from its *En fields; a block with no English is left out.
    const en = I18N.foreign,
      none = v => en && !(Array.isArray(v) ? v.length : v),
      li = xs => (xs || []).map(x => `<li>${esc(x)}</li>`).join(''),
      style = tx(g, 'style'),
      vsTips = tx(g, 'vsTips'),
      strengths = tx(g, 'strengths'),
      weaknesses = tx(g, 'weaknesses'),
      withTips = tx(g, 'withTips'),
      plan = tx(g, 'plan'),
      spikes = tx(g, 'spikes');
    const vsBox =
      none(vsTips) && !counters && none(strengths) && none(weaknesses)
        ? ''
        : `<section class="op-box"><h3>${L('상대법', 'Playing against')}</h3>${none(vsTips) ? '' : `<ul class="op-list-tips">${li(vsTips)}</ul>`}${
            counters ? `<h4>${L('대응 아이템', 'Counter items')}</h4><div class="op-items-row">${counters}</div>` : ''
          }${
            none(strengths) && none(weaknesses)
              ? ''
              : `<div class="op-pros"><div><h4 class="good">${L('강점', 'Strengths')}</h4><ul>${li(strengths)}</ul></div><div><h4 class="bad">${L('약점', 'Weaknesses')}</h4><ul>${li(weaknesses)}</ul></div></div>`
          }</section>`;
    const planBox =
      none(plan) && none(spikes) && none(withTips)
        ? ''
        : `<section class="op-box"><h3>${L('운영', 'Game plan')}</h3>${
            plan
              ? ['early', 'mid', 'late']
                  .map((k, i) => `<div class="op-plan"><span>${L(['라인전', '중반', '후반'][i], ['Laning', 'Mid game', 'Late game'][i])}</span><p>${esc(plan[k])}</p></div>`)
                  .join('')
              : ''
          }${spikes ? `<h4>${L('파워 스파이크', 'Power spikes')}</h4><p>${esc(spikes)}</p>` : ''}${
            none(withTips) ? '' : `<h4>${L('같은 팀일 때', 'With them on your team')}</h4><ul class="op-list-tips">${li(withTips)}</ul>`
          }</section>`;
    return `<section class="op-box op-hero-head">${portrait(id, 'lg')}<div><h2>${esc(I18N.name(g))}${L(` <small>${esc(g.en)}</small>`, '')}</h2><p>${tierBadge(id)} <span>${esc(ROLE[g.role] || '')}</span> · <span>${esc(
      [CURVE[t?.curve], FIGHT[t?.fight] && FIGHT[t?.fight] + L(' 중심', ' focus')].filter(Boolean).join(' · ')
    )}</span></p>${none(style) ? '' : `<p class="op-concept">${esc(style || '')}</p>`}<div class="op-stats"><div><small>${L('승률', 'Win rate')}</small><b>${pct(t?.winRate?.overall)}</b></div><div><small>${L('픽률', 'Pick rate')}</small><b>${pct(pickRate(id))}</b></div><div><small>${L('28분 전', 'Under 28 min')}</small><b>${pct(
      t?.winRate?.short
    )}</b></div><div><small>${L('40분 후', 'Over 40 min')}</small><b>${pct(t?.winRate?.long)}</b></div></div></div><div class="op-skill-icons">${abilities
      .map(a => `<span><img src="assets/abilities/${id}-${a.slot}.png" alt=""><small>${a.slot}</small></span>`)
      .join('')}</div></section>${ib}${window.StrategyUI?.buildStyles(id) || ''}<div class="op-cols"><section class="op-box"><h3>${L(
      '능력 마스터 순서 <small>먼저 마스터하는 능력 · 최근 30일</small>',
      'Ability max order <small>ability maxed first · last 30 days</small>'
    )}</h3>${order || '<p class="op-empty">—</p>'}${ib ? '' : `<h3>${L('인기 빌드 <small>시간대별 가장 많이 사는 아이템 · 승률</small>', 'Popular build <small>most bought items by phase · win rate</small>')}</h3>${phase('early', L('초반', 'Early'))}${phase('mid', L('중반', 'Mid'))}${phase('late', L('후반', 'Late'))}`}</section><section class="op-box"><h3>${L('능력', 'Abilities')}</h3>${abilities
      .map((a, n) => {
        const k = ranges?.skills?.[n],
          dist = k?.m ? (k.kind === '반경' ? L('반경 ', 'Radius ') : '') + (k.m >= 100 ? L('매우 멂', 'very far') : k.m + 'm') : '',
          desc = tx(a, 'desc'),
          tip = tx(a, 'tip');
        return `<div class="op-ability"><img src="assets/abilities/${id}-${a.slot}.png" alt=""><div><b>${a.slot}. ${esc(I18N.name(a))}${dist ? ` <small>${esc(dist)}</small>` : ''}</b>${none(desc) ? '' : `<p>${esc(desc)}</p>`}${tip ? `<p class="tip">${L('상대할 때', 'Against it')}: ${esc(tip)}</p>` : ''}</div></div>`;
      })
      .join('')}${gunLine ? `<div class="op-ability gun"><span>${L('총', 'Gun')}</span><div><b>${esc(L(`${g.ko}의 총`, `${I18N.name(g)}'s gun`))}</b><p>${esc(gunLine)}</p></div></div>` : ''}</section></div>${
      vsBox || planBox ? `<div class="op-cols">${vsBox}${planBox}</div>` : ''
    }`;
  }
  function heroes(selected, query, sort, view) {
    return `<div class="op-heroes">${heroTable(selected, query, sort)}<div class="op-detail">${heroPage(selected, view)}</div></div>`;
  }
  window.OpggUI = { match, heroes, tier };
})();

'use strict';
// 라인 동선: the farming loops per team and lane, from the map guide (route-guide-data.js and
// assets/routes, made by work/map-blender/export_app.py from the game's navigation mesh), three of
// them: small camps with crates, crates and slot machines, and 기운의 파편 with crates and slot machines. The middle
// lane has all three to either side, so its pictures hold two loops (left and right). The
// team and lane follow the match when they are known; buttons pick others.
(function () {
  const esc = v =>
    String(v ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  // Display language (ui/i18n.js); Korean when it is not loaded. Tables keep the Korean beside the
  // English and are read at render time, so a language switch shows on the next render.
  const L = (ko, en) => (window.I18N ? window.I18N.L(ko, en) : ko);
  const table = (ko, en) => k => L(ko[k], en[k]);
  const TEAM = table({ 0: '아래쪽 기지 팀', 1: '위쪽 기지 팀' }, { 0: 'Bottom base team', 1: 'Top base team' });
  const BAND = table({ left: '왼쪽', mid: '가운데', right: '오른쪽' }, { left: 'Left', mid: 'Middle', right: 'Right' });
  const SIDE = table({ left: '왼쪽', right: '오른쪽' }, { left: 'Left', right: 'Right' });
  const KIND = table(
    { weak: '소형 캠프', medium: '중형 캠프', strong: '대형 캠프', vault: '영혼 슬롯머신', buff: '기운의 파편' },
    { weak: 'Small camp', medium: 'Medium camp', strong: 'Large camp', vault: "Sinner's Sacrifice", buff: 'Power-up' }
  );
  const LANE_EN = { yellow: 'Yellow lane', green: 'Green lane', blue: 'Blue lane' };
  const laneName = r => L(r?.lane, LANE_EN[r?.colour]);
  // Stop names in route-guide-data.js (generated from the map; Korean only).
  const NAME_EN = {
    '기운의 파편': 'Power-up',
    '그리니치 클럽': 'Greenwich Club',
    '부두 관리소': 'Dock Authority',
    '호텔 01': 'Hotel 01',
    '요크 라디오': 'York Radio',
    '약국 상점': 'Drug Store',
    '북서 유틸리티 남쪽': 'NW Utility South',
    '남동 유틸리티': 'SE Utility',
    '극장 발코니': 'Theater Balcony',
    '그리니치 도서관': 'Greenwich Library',
    '광장 구덩이 1': 'Plaza Pit 1',
    '광장 구덩이 2': 'Plaza Pit 2'
  };
  const nm = n => L(n, NAME_EN[n]);
  const PLAN_KO = {
    small: {
      title: '소형 정글',
      when: '소형 캠프 2:00 · 상자 3:00부터',
      text: '웨이브를 밀고 가까운 소형 캠프를 잡은 뒤, 가는 길과 오는 길에 서로 다른 상자·황금 조각상을 챙기며 돌아옵니다.'
    },
    loot: {
      title: '박스 · 영혼 슬롯',
      when: '상자 3:00 · 슬롯머신 8:00부터',
      text: '상자와 황금 조각상을 챙기며 영혼 슬롯머신까지 갔다가 다른 길로 돌아옵니다.'
    },
    buff: {
      title: '기운의 파편 · 박스 · 영혼 슬롯',
      when: '기운의 파편 5:00 · 슬롯머신 8:00부터',
      text: '기운의 파편을 챙기고, 영혼 슬롯머신과 상자를 들르며 돌아옵니다.'
    }
  };
  const PLAN_EN = {
    small: {
      title: 'Small camps',
      when: 'Small camps 2:00 · crates from 3:00',
      text: 'Push the wave, take the nearest small camp, and grab different crates and Golden Statues on the way out and back.'
    },
    loot: {
      title: 'Crates · Sacrifice',
      when: 'Crates 3:00 · Sacrifice from 8:00',
      text: "Grab crates and Golden Statues on the way to the Sinner's Sacrifice, then come back a different way."
    },
    buff: {
      title: 'Power-up · crates · Sacrifice',
      when: 'Power-up 5:00 · Sacrifice from 8:00',
      text: "Take the Power-up, then come back by the Sinner's Sacrifice and crates."
    }
  };
  const plan = k => (window.I18N?.lang === 'en' ? PLAN_EN : PLAN_KO)[k];
  const WAVE = 30;

  // Team and band of the match: the minimap's turn and the lane my marker stays in.
  function live(data) {
    const rotation = data.jungle?.rotation,
      team = rotation === 180 ? 1 : rotation === 0 ? 0 : null,
      // The lane my marker stays in (lane-state.cjs: intel.lane.lane holds its band and colour).
      lane = data.intel?.lane?.lane || data.intel?.lane;
    const band =
      lane?.band || (team !== null && lane?.color ? window.LaneRoute?.COLOR_BAND?.[team]?.[lane.color] : null) || null;
    return { team, band };
  }

  // Crates and statues between two numbered stops; the picture rings them in the leg's colour.
  function loot(s) {
    const gold = s.statues || 0,
      wood = s.crates - gold;
    return [
      wood ? L(`상자 ${wood}개`, `${wood} crate${wood === 1 ? '' : 's'}`) : '',
      gold ? L(`황금 조각상 ${gold}개`, `${gold} Golden Statue${gold === 1 ? '' : 's'}`) : ''
    ]
      .filter(Boolean)
      .join(' · ');
  }
  function step(s, ring) {
    if (s.crates)
      return `<li class="rg-crates"><span class="rg-dot"></span>${loot(s)}<small>${L(`그림의 ${ring} 테두리`, `${ring} outline in the picture`)}</small></li>`;
    return `<li class="rg-stop ${s.kind}"><span class="rg-num">${s.n}</span><div><b>${esc(nm(s.name))}</b><small>${KIND(s.kind)}${
      s.shared ? L(' · 상대 팀 동선과 겹침', ' · overlaps the enemy route') : ''
    }</small></div></li>`;
  }

  function leg(title, cls, l, end) {
    return `<section class="rg-leg ${cls}"><h3><i></i>${title}<span>${L(`걷기 약 ${l.walk}초 · 들르는 시간 포함 ${l.time}초`, `walk ~${l.walk} sec · ${l.time} sec with stops`)}</span></h3><ol>${l.steps
      .map(s => step(s, cls === 'out' ? L('주황', 'Orange') : L('파란', 'Blue')))
      .join('')}<li class="rg-end">${end}</li></ol></section>`;
  }

  // The loop on the game's minimap (assets/map.png, route-guide-data.js `map`), always the same way
  // up (the bottom team's base at the bottom). Cut close round the loop, with the lanes for bearings.
  const OUT = '#ffaa5a',
    BACK = '#6ec8ff',
    LANE = { yellow: '#f1cc30', blue: '#29b1cc', green: '#59b247' };
  function minimap(r) {
    const at = p => [p[0] * 1000, p[1] * 1000],
      all = r.loops.flatMap(lp => [lp.map.start, lp.map.target, ...lp.map.out, ...lp.map.back]).map(at);
    if (!all.length) return '';
    const xs = all.map(p => p[0]),
      ys = all.map(p => p[1]),
      side = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 110) * 1.08 + 36,
      x0 = (Math.max(...xs) + Math.min(...xs) - side) / 2,
      y0 = (Math.max(...ys) + Math.min(...ys) - side) / 2,
      k = side / 400,
      f = v => v.toFixed(1),
      line = pts => pts.map(p => at(p).map(f).join(',')).join(' ');
    // A or B halfway along the way.
    const half = pts => {
      const q = pts.map(at),
        len = q.slice(1).map((p, i) => Math.hypot(p[0] - q[i][0], p[1] - q[i][1])),
        total = len.reduce((a, b) => a + b, 0);
      let left = total / 2;
      for (let i = 0; i < len.length; i++) {
        if (left <= len[i]) return [q[i][0] + ((q[i + 1][0] - q[i][0]) * left) / len[i], q[i][1] + ((q[i + 1][1] - q[i][1]) * left) / len[i]];
        left -= len[i];
      }
      return q[0];
    };
    // Names near the edge of the cut move in so they are not clipped (Hangul about 1 em wide).
    const label = (p, text, dy, size = 15) => {
      const w = [...text].reduce((n, c) => n + (c.charCodeAt(0) > 255 ? 1 : 0.6), 0) * size * k,
        clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi),
        x = clamp(p[0], x0 + w / 2 + 4 * k, x0 + side - w / 2 - 4 * k),
        y = clamp(p[1] + dy * k, y0 + size * k, y0 + side - 6 * k);
      return labelAt([x, y], text, size);
    };
    const labelAt = (p, text, size) =>
      `<text x="${f(p[0])}" y="${f(p[1])}" font-size="${f(size * k)}" stroke-width="${f(3.5 * k)}">${esc(text)}</text>`;
    const tag = (p, letter, colour) =>
      `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(8 * k)}" fill="${colour}" stroke="#14161a" stroke-width="${f(2 * k)}"/><text class="n" x="${f(p[0])}" y="${f(p[1] + 3.6 * k)}" font-size="${f(10 * k)}">${letter}</text>`;
    const stops = (l, colour) =>
      l.steps
        .map(s =>
          s.crates
            ? s.at
                .map(c => {
                  const p = at(c);
                  return `<rect x="${f(p[0] - 3.5 * k)}" y="${f(p[1] - 3.5 * k)}" width="${f(7 * k)}" height="${f(7 * k)}" rx="${f(1.5 * k)}" fill="${c[2] ? '#f2c14e' : '#d08a3c'}" stroke="${colour}" stroke-width="${f(1.6 * k)}"/>`;
                })
                .join('')
            : tag(at(s.at), s.n, colour)
        )
        .join('');
    const lanes = (window.ROUTE_LANES || [])
      .map(
        l =>
          `<polyline points="${line(l.points)}" stroke="${LANE[l.colour]}" stroke-width="${f((l.colour === r.colour ? 4 : 2.5) * k)}" opacity="${l.colour === r.colour ? 0.75 : 0.3}"/>`
      )
      .join('');
    const ways = r.loops
      .map(
        lp =>
          `<polyline points="${line(lp.map.out)}" stroke="${OUT}" stroke-width="${f(4 * k)}" marker-end="url(#rg-mm-out)"/><polyline points="${line(
            lp.map.back
          )}" stroke="${BACK}" stroke-width="${f(4 * k)}" marker-end="url(#rg-mm-back)"/>`
      )
      .join('');
    const marks = r.loops
      .map(lp => {
        const t = at(lp.map.target);
        return `${stops(lp.out, OUT)}${stops(lp.back, BACK)}${tag(half(lp.map.out), 'A', OUT)}${tag(half(lp.map.back), 'B', BACK)}<circle cx="${f(
          t[0]
        )}" cy="${f(t[1])}" r="${f(12 * k)}" fill="none" stroke="#fff" stroke-width="${f(2.5 * k)}"/>${label(t, nm(lp.target.name), -18)}`;
      })
      .join('');
    // Everything else on the map around the loop, under it: crates, tough crates, golden statue spots
    // and 기운의 파편 (map-points.js), then camps and slot machines (jungle-data.js) and the guardians and
    // walkers (map-objectives.js), ringed green for the team this loop is for and red for the other.
    const inView = p => p[0] > x0 && p[0] < x0 + side && p[1] > y0 && p[1] < y0 + side,
      P = window.MAP_POINTS || {},
      near = list => (list || []).map(at).filter(inView);
    const square = (p, size, fill, stroke, sw) =>
      `<rect x="${f(p[0] - (size / 2) * k)}" y="${f(p[1] - (size / 2) * k)}" width="${f(size * k)}" height="${f(size * k)}" rx="${f(1 * k)}" fill="${fill}" stroke="${stroke}" stroke-width="${f(sw * k)}"/>`;
    const loot = [
      ...near(P.crates).map(p => square(p, 4, '#b0743a', '#0e1012', 0.6)),
      ...near(P.tough).map(p => square(p, 5.5, '#7a4a22', '#d9a066', 0.9)),
      ...near(P.statues).map(p => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(2.2 * k)}" fill="#f0cf4a" fill-opacity="0.85" stroke="#0e1012" stroke-width="${f(0.6 * k)}"/>`),
      ...near(P.buffs).map(
        p => `<path d="M${f(p[0])} ${f(p[1] - 7 * k)}L${f(p[0] + 7 * k)} ${f(p[1])}L${f(p[0])} ${f(p[1] + 7 * k)}L${f(p[0] - 7 * k)} ${f(p[1])}Z" fill="#a77bf0" stroke="#fff" stroke-width="${f(1.2 * k)}"><title>${L('기운의 파편', 'Power-up')}</title></path>`
      )
    ].join('');
    const pin = (p, file, w, h, title) =>
      `<image class="pin" href="${file}" x="${f(p[0] - (w / 2) * k)}" y="${f(p[1] - (h / 2) * k)}" width="${f(w * k)}" height="${f(h * k)}"><title>${esc(title)}</title></image>`;
    // Camps as the 3D picture draws them: green rounds numbered by tier; slot machines purple.
    const TIER = { weak: [1, '#a6e39a', '#14161a'], medium: [2, '#4fb06a', '#fff'], strong: [3, '#1f6e3d', '#fff'] };
    const camps = ((window.JUNGLE_DATA || {}).camps || [])
      .filter(c => (TIER[c.kind] || c.kind === 'vault') && inView(at([c.x, c.y])))
      .map(c => {
        const p = at([c.x, c.y]);
        if (c.kind === 'vault')
          return `<g><title>${KIND('vault')}</title><rect x="${f(p[0] - 7 * k)}" y="${f(p[1] - 6 * k)}" width="${f(14 * k)}" height="${f(12 * k)}" rx="${f(2.5 * k)}" fill="#8b5cf6" stroke="#fff" stroke-width="${f(1.4 * k)}"/>${[-3.5, 0, 3.5]
            .map(dx => `<rect x="${f(p[0] + (dx - 1.1) * k)}" y="${f(p[1] - 1.1 * k)}" width="${f(2.2 * k)}" height="${f(2.2 * k)}" fill="#fff"/>`)
            .join('')}</g>`;
        const [n, fill, ink] = TIER[c.kind];
        return `<g><title>${KIND(c.kind)}</title><circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(6.5 * k)}" fill="${fill}" stroke="#0e1012" stroke-width="${f(1.2 * k)}"/><text class="n" x="${f(p[0])}" y="${f(p[1] + 3.2 * k)}" font-size="${f(9 * k)}" style="fill:${ink}">${n}</text></g>`;
      })
      .join('');
    const OBJ = {
      guardian: [['가디언', 'Guardian'], 'guardian', 16, 11],
      base_guardian: [['기지 가디언', 'Base Guardian'], 'guardian', 16, 11],
      walker: [['워커', 'Walker'], 'walker', 18, 13]
    };
    const towers = ((window.MAP_OBJECTIVES || {}).objectives || [])
      .filter(o => OBJ[o.kind] && inView(at([o.x, o.y])))
      .map(o => {
        const p = at([o.x, o.y]),
          [name, file, w, h] = OBJ[o.kind],
          ours = o.team === r.team;
        return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(11 * k)}" fill="#0e1012" fill-opacity="0.75" stroke="${ours ? '#86d494' : '#ff6b6b'}" stroke-width="${f(2 * k)}"/>${pin(
          p,
          `assets/objectives/${file}.png`,
          w,
          h,
          ours ? L(`우리 ${name[0]}`, `Our ${name[1]}`) : L(`상대 ${name[0]}`, `Enemy ${name[1]}`)
        )}`;
      })
      .join('');
    const arrow = (id, colour) =>
      `<marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0 0L10 5L0 10z" fill="${colour}"/></marker>`;
    return `<svg class="rg-mini" viewBox="${f(x0)} ${f(y0)} ${f(side)} ${f(side)}" role="img" aria-label="${L('미니맵 동선', 'Minimap route')}"><defs>${arrow('rg-mm-out', OUT)}${arrow(
      'rg-mm-back',
      BACK
    )}</defs><rect x="${f(x0)}" y="${f(y0)}" width="${f(side)}" height="${f(side)}" fill="#0e1012"/><image class="map" href="assets/map.png" x="0" y="0" width="1000" height="1000"/>${loot}<g class="rg-mm-lines" fill="none" stroke-linecap="round" stroke-linejoin="round">${lanes}${ways}</g>${camps}${towers}${marks}<circle cx="${f(at(r.loops[0].map.start)[0])}" cy="${f(at(r.loops[0].map.start)[1])}" r="${f(5 * k)}" fill="#fff"/>${label(
      at(r.loops[0].map.start),
      L('웨이브', 'Wave'),
      22
    )}</svg>`;
  }

  function page(data, pick, heading) {
    const routes = window.ROUTE_GUIDE || [];
    const now = live(data),
      team = pick.team ?? now.team ?? 0,
      band = pick.band ?? (pick.team === null || pick.team === now.team ? now.band : null) ?? 'mid',
      planKey = pick.plan ?? (Number.isFinite(data.live?.seconds) && data.live.seconds >= 480 ? 'loot' : 'small'),
      r = routes.find(x => x.team === team && x.band === band && x.plan === planKey);
    const following = pick.team === null && pick.band === null && now.team !== null && now.band;
    const teams = [0, 1]
      .map(t => `<button data-route-team="${t}" class="${t === team ? 'selected' : ''}">${TEAM(t)}</button>`)
      .join('');
    const lanes = ['left', 'mid', 'right']
      .map(b => {
        const x = routes.find(y => y.team === team && y.band === b && y.plan === planKey);
        return `<button data-route-band="${b}" class="rg-lane lane-${x?.colour} ${b === band ? 'selected' : ''}">${BAND(b)} · ${esc(laneName(x))}</button>`;
      })
      .join('');
    const head = heading(
      L('라인 동선', 'Lane routes'),
      L(
        '웨이브를 밀어 둔 뒤 도는 한 바퀴입니다. 소형 정글, 박스 · 영혼 슬롯, 기운의 파편 · 박스 · 영혼 슬롯 세 가지가 있습니다. 게임의 길찾기 데이터로 계산한 실제로 걷는 길입니다.',
        "A loop to run after pushing the wave. Three kinds: small camps, crates · Sacrifice, and Power-up · crates · Sacrifice. The paths are real walking paths from the game's navigation data."
      ),
      following
        ? `<span class="badge">${L('경기에서 감지한 팀·전선', 'Team and lane from the match')}</span>`
        : pick.team !== null || pick.band !== null
          ? `<button data-route-follow>${L('경기 기준으로 보기', 'Follow the match')}</button>`
          : ''
    );
    if (!r) return head + `<p class="note">${L('동선 데이터가 없습니다.', 'No route data.')}</p>`;
    const p = plan(planKey),
      two = r.loops.length > 1,
      side = lp => (two && lp.side ? SIDE(lp.side) + ' · ' : ''),
      plans = Object.keys(PLAN_KO)
        .map(k => `<button data-route-plan="${k}" class="${k === planKey ? 'selected' : ''}">${plan(k).title}</button>`)
        .join('');
    const small = planKey === 'small';
    const summary = lp => {
      const waves = Math.max(1, Math.round(lp.loop / WAVE)),
        steps = [...lp.out.steps, ...lp.back.steps],
        vaults = steps.filter(s => s.kind === 'vault').length + (lp.target.kind === 'vault' ? 1 : 0),
        crates = steps.reduce((n, s) => n + (s.crates || 0), 0);
      // The small-camp loop passes no slot machine: its card leaves that out.
      return `<section class="card rg-summary ${small ? 'three' : ''}"><div><small>${esc(side(lp) + p.title)}</small><b>${L(`약 ${lp.loop}초`, `~${lp.loop} sec`)}</b><span>${esc(
        p.when
      )}${L(` · 그동안 웨이브 약 ${waves}번`, ` · ~${waves} wave${waves === 1 ? '' : 's'} meanwhile`)}</span></div><div><small>${L('목표', 'Target')}</small><b>${esc(nm(lp.target.name))}</b><span>${
        lp.target.kind === 'buff' ? L('5:00부터', 'from 5:00') : KIND(lp.target.kind)
      }${lp.target.clear ? L(` · 정리 약 ${lp.target.clear}초`, ` · clear ~${lp.target.clear} sec`) : ''}</span></div>${
        small
          ? ''
          : `<div><small>${L('영혼 슬롯머신', "Sinner's Sacrifice")}</small><b>${L(`${vaults}곳`, `${vaults}`)}</b><span>${vaults ? L('8:00부터', 'from 8:00') : L('이 동선에는 없음', 'None on this route')}</span></div>`
      }<div><small>${L('상자·황금 조각상', 'Crates · Golden Statues')}</small><b>${L(`${crates}개`, `${crates}`)}</b><span>${crates ? L('3:00부터 · A·B가 서로 다른 곳', 'from 3:00 · A and B take different ones') : L('이 동선에는 없음', 'None on this route')}</span></div></section>`;
    };
    const route = lp => {
      const n = `<b>${esc(nm(lp.target.name))}</b>`,
        target =
          lp.target.kind === 'buff'
            ? L(`${n} 획득`, `Take ${n}`)
            : L(`${n} ${KIND(lp.target.kind)} 정리`, `Clear ${n} (${KIND(lp.target.kind).toLowerCase()})`);
      return `<section class="card">${two ? `<h3 class="rg-side">${L(`${SIDE(lp.side)} 동선`, `${SIDE(lp.side)} route`)} · ${esc(nm(lp.target.name))}</h3>` : ''}${leg(
        L('가는 길 (A)', 'Way out (A)'),
        'out',
        lp.out,
        target
      )}${leg(L('오는 길 (B)', 'Way back (B)'), 'back', lp.back, L('웨이브 위치로 복귀', 'Back to the wave'))}</section>`;
    };
    const waves = Math.max(1, Math.round(Math.max(...r.loops.map(lp => lp.loop)) / WAVE)),
      shared = r.loops.some(lp => [...lp.out.steps, ...lp.back.steps].some(s => s.shared));
    const tips = [
      L(
        `출발 전에 웨이브를 상대 쪽으로 밀어 둡니다. 한 바퀴 동안 웨이브가 약 ${waves}번 오니, 우리 가디언이 맞기 시작하면 오는 길(B)로 바로 돌아옵니다.`,
        `Push the wave toward the enemy before you leave. About ${waves} ${waves === 1 ? 'wave arrives' : 'waves arrive'} during a loop, so come straight back by the way back (B) once your Guardian starts taking hits.`
      ),
      two && planKey === 'small'
        ? L(
            '가운데 전선은 양쪽에 소형 캠프가 하나씩 있습니다. 웨이브를 밀 때마다 한쪽씩 번갈아 다녀오면 다시 생길 시간이 생깁니다.',
            'The middle lane has a small camp on each side. Alternate sides each time you push the wave so each camp has time to respawn.'
          )
        : two
          ? L(
              '가운데 전선은 양쪽에 기운의 파편과 영혼 슬롯머신이 있습니다. 미니맵에서 상대가 보이지 않는 쪽, 우리 팀원이 가지 않은 쪽을 고릅니다.',
              "The middle lane has a Power-up and a Sinner's Sacrifice on each side. Pick the side with no enemy on the minimap and no teammate already there."
            )
          : '',
      {
        small: L(
          '소형 캠프는 2:00에 처음 생기고, 잡은 뒤 약 1분 25초 뒤에 다시 생깁니다. 상자는 3:00부터라 2:00~3:00에는 캠프만 잡고 짧은 길로 복귀.',
          'Small camps first spawn at 2:00 and respawn about 1:25 after you clear them. Crates start at 3:00, so from 2:00 to 3:00 take only the camp and come back the short way.'
        ),
        loot: L(
          '상자는 3:00부터, 영혼 슬롯머신은 8:00부터 있습니다. 8:00 전에는 같은 길에서 상자만 챙깁니다.',
          "Crates are up from 3:00, the Sinner's Sacrifice from 8:00. Before 8:00, take only the crates on the same path."
        ),
        buff: L(
          '기운의 파편은 5:00에 생깁니다. 8:00 전에는 파편과 상자만 챙기고, 슬롯머신은 8:00부터 들릅니다.',
          'The Power-up spawns at 5:00. Before 8:00 take only the Power-up and crates; stop at the Sacrifice from 8:00.'
        )
      }[planKey],
      L(
        `가는 길(A)과 오는 길(B)을 나눈 이유: 서로 다른 거리의 상자·황금 조각상${
          small ? '' : '과 영혼 슬롯머신'
        }을 한 바퀴에 모두 챙기기 위해서. 같은 길로 돌아오면 이미 부순 상자만 지나갑니다.`,
        `Why the way out (A) and back (B) differ: to collect the crates and Golden Statues${
          small ? '' : " and the Sinner's Sacrifice"
        } on different streets in one loop. Coming back the same way only passes crates you already broke.`
      ),
      shared
        ? L(
            '‘상대 팀 동선과 겹침’ 표시된 곳은 상대도 같은 시간에 노리기 쉬운 곳입니다. 미니맵에 상대가 안 보이면 먼저 들르지 않습니다.',
            '‘Overlaps the enemy route’ marks spots the enemy is likely to go for at the same time. If the enemy is not on the minimap, do not go there first.'
          )
        : ''
    ]
      .filter(Boolean)
      .map(t => `<li>${t}</li>`)
      .join('');
    const tipsCard = `<section class="card rg-tips"><h3>${L('이렇게 쓰세요', 'How to use it')}</h3><ul class="list">${tips}</ul></section>`;
    // The picture first, right under the pickers, so it shows without scrolling in a small window.
    return `${head}<div class="guide-top rg-pick rg-plans">${plans}</div><div class="guide-top rg-pick">${teams}<span class="rg-gap"></span>${lanes}</div><figure class="card rg-figure"><div class="rg-views"><img src="${esc(r.image)}" alt="${L(
      `${esc(TEAM(team) + ' ' + r.lane + ' ' + p.title)} 동선`,
      `${esc(TEAM(team) + ' · ' + laneName(r) + ' · ' + p.title)} route`
    )}">${minimap(r)}</div><figcaption><span class="rg-key out">${L('가는 길 (A)', 'Way out (A)')}</span><span class="rg-key back">${L('오는 길 (B)', 'Way back (B)')}</span>${small ? '' : `<span class="rg-key num">${L('번호 · 들르는 순서', 'Numbers · stop order')}</span>`}<span class="rg-key ring">${L('흰 원 · 목표', 'White circle · target')}</span>${
      small
        ? ''
        : `<span class="rg-key crate">${L('주황 · 파란 테두리 상자 · 가는 길(A) · 오는 길(B)에 챙길 상자(금색은 황금 조각상)', 'Orange · blue outlined crates · crates for the way out (A) · way back (B) (gold: Golden Statue)')}</span><span class="rg-key slot">${L('보라색 모형 · 영혼 슬롯머신', "Purple model · Sinner's Sacrifice")}</span>`
    }<span class="rg-key tier">${L('초록 원 · 정글 캠프(1 소형 · 2 중형 · 3 대형)', 'Green circle · jungle camp (1 small · 2 medium · 3 large)')}</span></figcaption><p class="rg-mm-key"><b>${L('미니맵', 'Minimap')}</b><span><i class="mk-camp">1</i><i class="mk-camp m">2</i><i class="mk-camp s">3</i>${L('정글 캠프 <small>소형 · 중형 · 대형</small>', 'Jungle camps <small>small · medium · large</small>')}</span><span><i class="mk-slot"></i>${L('영혼 슬롯머신', "Sinner's Sacrifice")}</span><span><img src="assets/objectives/guardian.png" alt="">${L('가디언·워커 <small>초록 테두리 우리 · 빨강 상대</small>', 'Guardian·Walker <small>green ring ours · red enemy</small>')}</span><span><i class="mk-crate"></i>${L('상자', 'Crate')}</span><span><i class="mk-tough"></i>${L('튼튼한 상자', 'Tough crate')}</span><span><i class="mk-statue"></i>${L('황금 조각상 자리 <small>50% 확률</small>', 'Golden Statue spot <small>50% chance</small>')}</span><span><i class="mk-buff"></i>${L('기운의 파편', 'Power-up')}</span></p><p class="note">${esc(
      p.text
    )}${
      two ? L(' 가운데 전선은 왼쪽과 오른쪽 동선을 함께 그렸습니다.', ' The middle lane shows the left and right loops together.') : ''
    }${L(
      ' 우리 기지 쪽에서 비스듬히 본 그림입니다. 화살표는 웨이브 위치에서 번호 순서대로 목표까지(A), 목표에서 웨이브 위치까지(B) 어느 쪽으로 갈지 가리킵니다. 실제 걷는 길은 아래 순서대로 들르면 됩니다. 오른쪽 미니맵은 같은 동선을 위에서 본 것으로, 팀과 상관없이 아래쪽 기지가 아래인 방향이고 굵은 색 선이 내 전선입니다. 동선이 쓰는 높이까지만 건물을 남기고 위층은 잘라냈습니다. 동선 둘레만 잘라 크게 보여 주고, 동선에서 먼 곳은 흐리게 했습니다.',
      " The picture is seen at an angle from your base's side. Arrows show which way to go from the wave to the target in numbered order (A), and from the target back to the wave (B). To walk it, visit the stops in the order below. The minimap on the right shows the same loop from above, always with the bottom base at the bottom whatever your team; the thick coloured line is your lane. Buildings are kept only up to the height the route uses. Only the area around the loop is shown, enlarged, and places far from it are dimmed."
    )}</p></figure>${r.loops
      .map(summary)
      .join('')}${
      two
        ? `<div class="rg-grid rg-two">${r.loops.map(route).join('')}</div>${tipsCard}`
        : `<div class="rg-grid">${route(r.loops[0])}${tipsCard}</div>`
    }`;
  }

  // In the game: the loop for the time (2:00 small camps; crates from 3:00; for a minute after 5:00
  // and 10:00 the 기운의 파편 loop; slot machines from 8:00 on the crates loop), for my team and lane.
  function planAt(secs) {
    if (!Number.isFinite(secs) || secs < 180) return 'small';
    return (secs >= 300 && secs < 360) || (secs >= 600 && secs < 660) ? 'buff' : 'loot';
  }
  function current(s, plan) {
    const now = live(s);
    if (now.team === null || !now.band) return null;
    const p = plan || planAt(s.live?.seconds);
    const r = (window.ROUTE_GUIDE || []).find(x => x.team === now.team && x.band === now.band && x.plan === p);
    return r ? { ...now, plan: p, r } : null;
  }
  // One way of a loop in a few words: crates between the numbered stops, then where it ends.
  const short = (l, end) =>
    [...l.steps.map(s => (s.crates ? L(`상자 ${s.crates}`, `Crates ${s.crates}`) : nm(s.name))), end].map(esc).join(' → ');
  const slotsLater = (plan, secs) => plan !== 'small' && Number.isFinite(secs) && secs < 480;
  // Holding Tab while laning (the board's left panel): the loop for now as a picture, its name and
  // time, then the two ways (or, in the middle lane, each side).
  function picture(s, base) {
    const c = current(s);
    if (!c) return '';
    const secs = s.live?.seconds,
      two = c.r.loops.length > 1;
    const way = (cls, letter, l, end) => `<p class="rl-way ${cls}"><i>${letter}</i><span>${short(l, end)}</span></p>`;
    const lines = two
      ? c.r.loops
          .map(
            lp =>
              `<p class="rl-way"><i>${SIDE(lp.side)[0]}</i><span>${esc(nm(lp.target.name))}</span><small>${L(`${lp.loop}초`, `${lp.loop}s`)}</small></p>`
          )
          .join('')
      : way('out', 'A', c.r.loops[0].out, nm(c.r.loops[0].target.name)) + way('back', 'B', c.r.loops[0].back, L('웨이브', 'Wave'));
    return `<div class="tv-route-pic" data-pv="route"><h4>${L('동선', 'Route')} · ${esc(plan(c.plan).title)}<small>${
      two ? '' : L(` 약 ${c.r.loops[0].loop}초`, ` ~${c.r.loops[0].loop}s`)
    }${slotsLater(c.plan, secs) ? L(' · 슬롯 8:00부터', ' · Sacrifice from 8:00') : ''}</small></h4><img src="${base}${esc(c.r.image)}" alt="${L(
      `${esc(c.r.lane + ' ' + plan(c.plan).title)} 동선`,
      `${esc(laneName(c.r) + ' · ' + plan(c.plan).title)} route`
    )}">${lines}</div>`;
  }
  // The Alt Q panel's tab: the picture and both ways of each loop, with the three loops to pick from.
  function panel(s, base, pick) {
    const c = current(s, pick);
    if (!c)
      return `<p class="iu-empty">${L(
        '내 팀과 전선을 확인하면 동선을 보여 줍니다(미니맵 방향 · 내 위치).',
        'Shows the route once your team and lane are known (minimap facing · your position).'
      )}</p>`;
    const secs = s.live?.seconds,
      two = c.r.loops.length > 1;
    const plans = Object.keys(PLAN_KO)
      .map(k => `<button data-route-plan="${k}" class="${k === c.plan ? 'active' : ''}">${plan(k).title}</button>`)
      .join('');
    const way = (cls, letter, l, end) =>
      `<p class="rl-way ${cls}"><i>${letter}</i><span>${short(l, end)}</span><small>${L(`${l.time}초`, `${l.time}s`)}</small></p>`;
    const loops = c.r.loops
      .map(
        lp =>
          `<div class="rl-loop">${two ? `<h4>${SIDE(lp.side)} · ${esc(nm(lp.target.name))} <small>${L(`약 ${lp.loop}초`, `~${lp.loop}s`)}</small></h4>` : ''}${way(
            'out',
            'A',
            lp.out,
            nm(lp.target.name)
          )}${way('back', 'B', lp.back, L('웨이브', 'Wave'))}</div>`
      )
      .join('');
    return `<div class="rl"><div class="rl-plans">${plans}</div><img src="${base}${esc(c.r.image)}" alt="${L(
      `${esc(c.r.lane + ' ' + plan(c.plan).title)} 동선`,
      `${esc(laneName(c.r) + ' · ' + plan(c.plan).title)} route`
    )}"><p class="rl-head"><b>${esc(plan(c.plan).title)}</b>${two ? '' : L(` 약 ${c.r.loops[0].loop}초`, ` ~${c.r.loops[0].loop}s`)} · ${esc(plan(c.plan).when)}${
      slotsLater(c.plan, secs) ? L(' · 지금은 상자만', ' · crates only for now') : ''
    }</p>${loops}</div>`;
  }

  window.RouteGuide = { page, live, planAt, current, picture, panel };
})();

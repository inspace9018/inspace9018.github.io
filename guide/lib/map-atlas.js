'use strict';
// 전체 지도: everything on the map in one zoomable picture, with a list of kinds to show or hide
// (like the Mobalytics interactive map). Places: ui/map-atlas-data.js (tools/build-map-atlas.cjs) and
// the lane and base structures in ui/map-objectives.js; pictures: the game's minimap
// (assets/atlas, work/map-blender/export_atlas.py).
//
// page() gives an empty slot; mount() puts the map in it. The map element is made once and moved into
// each new slot, so a page re-render (the app redraws on every state change) keeps the zoom, the
// shown kinds and the picked marker.
window.MapAtlas = (() => {
  const esc = s =>
    String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const num = n => Number(n).toLocaleString('ko-KR');
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const A = () => window.MAP_ATLAS || { layers: {}, ziplines: [] };
  const O = () => window.MAP_OBJECTIVES || { objectives: [], buildings: [], health: {} };
  const rule = k => window.JUNGLE_DATA?.rules?.[k];
  const campName = p => (window.jungleUI?.name ? window.jungleUI.name({ id: p.id }) : p.id);
  const TEAM = { 0: '히든 킹(아래쪽 기지)', 1: '아치마더(위쪽 기지)' };
  const TEAM_COLOR = { 0: '#f0a03c', 1: '#5b9cf0' };
  const LANE = { yellow: '노란색 전선', blue: '파란색 전선', green: '초록색 전선' };
  const LANE_COLOR = { yellow: '#f1cc30', blue: '#29b1cc', green: '#59b247' };

  // Drawn marks (24×24) for kinds the game has no minimap picture for.
  const G = {
    crate: '<rect x="5" y="7" width="14" height="11" rx="1.5"/><path d="M5 11h14M10 11v2h4v-2"/>',
    tough: '<rect x="5" y="7" width="14" height="11" rx="1.5"/><path d="M12 7v11M5 12.5h14"/>',
    snack: '<path d="M12 6v12M6 12h12" stroke-width="3"/>',
    powerup: '<path d="M12 3l5 9-5 9-5-9z" fill="currentColor"/>',
    rift: '<circle cx="12" cy="12" r="7"/><path d="M12 7a5 5 0 1 0 5 5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
    teleporter: '<path d="M5 9h13l-3-3M19 15H6l3 3"/>',
    jump: '<path d="M12 19V6M7 11l5-5 5 5M7 19h10"/>',
    rope: '<path d="M12 3v18"/><circle cx="12" cy="8" r="1.6" fill="currentColor"/><circle cx="12" cy="14" r="1.6" fill="currentColor"/>',
    vent: '<path d="M8 19c0-3 2.5-3.5 2.5-6.5S8 9 8 6M14 19c0-3 2.5-3.5 2.5-6.5S14 9 14 6"/>',
    veil: '<circle cx="12" cy="12" r="7" stroke-dasharray="3 2.5"/>',
    bell: '<path d="M7 16h10l-1.6-2.2V10a3.4 3.4 0 0 0-6.8 0v3.8zM10.5 18.5h3"/>',
    sentry: '<path d="M7 19h10v-5H7zM12 14V9h5"/>',
    shrine: '<path d="M12 3l8 9-8 9-8-9z" fill="currentColor"/>',
    patron: '<path d="M12 2l10 10-10 10L2 12z" fill="currentColor"/><path d="M12 7l5 5-5 5-5-5z" fill="#111"/>',
    line: '<path d="M3 17C8 15 9 8 21 7" stroke-width="3"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${G[k]}</svg>`;
  const img = f => `<img src="assets/${f}" alt="">`;

  const obj = kind => O().objectives.filter(o => o.kind === kind);
  const hp = kind => O().health?.[kind];
  const at = (k, p) => [`첫 생성 ${mmss(rule(k)?.first ?? 0)}`, `전부 처치 후 ${mmss(rule(k)?.respawn ?? 0)} 뒤 다시`];
  const side = p => [p.team != null ? TEAM[p.team] : '', p.lane ? LANE[p.lane] : ''].filter(Boolean).join(' · ');

  // Every kind on the map: its group in the list, name, mark, colour, whether it starts shown, its
  // places, and the lines of the card a click opens.
  const KINDS = [
    { group: '구조물', id: 'guardian', name: '가디언', mark: img('objectives/guardian.png'), color: '#3b4048', on: 1, pts: () => obj('guardian'),
      sub: side, lines: () => ['전선의 첫 방어 타워', `체력 ${num(hp('guardian'))}`, '부수면 영혼 1,375 (근처 영웅 25%, 팀 전원 75%)'] },
    { group: '구조물', id: 'walker', name: '워커', mark: img('objectives/walker.png'), color: '#3b4048', on: 1, pts: () => obj('walker'),
      sub: side, lines: () => ['전선 안쪽 2차 방어선. 걸어 다니는 큰 로봇 포탑', `체력 ${num(hp('walker'))}`, '부수면 영혼 3,675 + 팀에 플렉스 슬롯 1칸'] },
    { group: '구조물', id: 'base_guardian', name: '기지 가디언', mark: img('objectives/guardian.png'), color: '#4a3f2c', on: 1, pts: () => obj('base_guardian'),
      sub: side, lines: () => ['기지 입구를 지키는 가디언', `체력 ${num(hp('base_guardian'))}`, '부수면 영혼 1,000 · 공격 팀 집라인이 빨라짐'] },
    { group: '구조물', id: 'shrine', name: '성지', mark: svg('shrine'), color: '#c49bff', on: 1, pts: () => obj('shrine'), team: 1,
      sub: side, lines: () => ['패트런을 지키는 보호막 장치', '2개 모두 부서져야 패트런을 칠 수 있음', '부수면 영혼 2,000'] },
    { group: '구조물', id: 'patron', name: '패트런', mark: svg('patron'), color: '#ff9f5a', on: 1, pts: () => obj('patron'), team: 1, big: 1,
      sub: side, lines: () => ['최종 목표. 부수면 승리', `체력 ${num(hp('patron') || 12000)} · 레이저 초당 440 + 체력 5%`, '체력 절반부터는 구덩이 안에서만 피해가 들어감'] },
    { group: '구조물', id: 'sentry', name: '센트리 포탑', mark: svg('sentry'), color: '#5d6570', on: 0, pts: () => A().layers.sentry, team: 1,
      sub: side, lines: () => ['기지 안을 지키는 포탑'] },

    { group: '정글', id: 'camp-small', name: '소형 캠프', mark: img('atlas/camp-small.png'), color: '#2f6b55', on: 1, pts: () => A().layers['camp-small'],
      title: campName, lines: () => [...at('weak'), '3마리 합 영혼 123 + 분당 1.32'] },
    { group: '정글', id: 'camp-medium', name: '중형 캠프', mark: img('atlas/camp-medium.png'), color: '#2d5a8a', on: 1, pts: () => A().layers['camp-medium'],
      title: campName, lines: () => [...at('medium'), '1단계(41)·2단계(68) 괴이체가 섞여 나옴'] },
    { group: '정글', id: 'camp-large', name: '대형 캠프', mark: img('atlas/camp-large.png'), color: '#8a6a22', on: 1, pts: () => A().layers['camp-large'],
      title: campName, lines: () => [...at('strong'), '구성에 따라 영혼 290~543'] },
    { group: '정글', id: 'vault', name: '영혼 슬롯머신', mark: img('atlas/vault.png'), color: '#a3512b', on: 1, pts: () => A().layers.vault,
      title: campName, building: p => O().buildings.find(b => b.vaults.includes(p.id)),
      lines: () => [...at('vault'), '영혼 310 + 분당 3.35', '강한 근거리 공격 4번 또는 약한 근거리 공격 8번', '잭팟이면 영구 능력치'] },
    { group: '정글', id: 'bell', name: '종', mark: svg('bell'), color: '#8a6a22', on: 0, pts: () => A().layers.bell,
      lines: () => ['차이나타운 종탑의 종', '때리거나 주변을 부수면 종이 울려 모두에게 들림'] },

    { group: '목표', id: 'mid_boss', name: '중앙 보스', mark: img('atlas/mid-boss.png'), color: '#7a2630', on: 1, big: 1, pts: () => obj('mid_boss').map(p => ({ ...p, u: 1 })),
      lines: () => ['파란색 전선 아래 지하 하수도', '경기 시작부터 있음 · 처치 후 7분 → 6분 → 5분 뒤 부활', '영혼 3,000 + 분당 50 (팀 분배)', '소생의 보석: 최대 3명이 3분 안에 한 번, 죽은 자리에서 3초 뒤 부활'] },
    { group: '목표', id: 'urn', name: '영혼 단지', mark: img('atlas/urn.png'), color: '#1f5f6b', on: 1, pts: () => A().layers.urn,
      lines: () => ['영혼 단지가 나오는 자리', '10:00부터 5분마다 · 노란색 전선 쪽 먼저, 그다음 초록색 쪽과 번갈아', '배달하면 영혼 250 + 분당 70과 영구 능력치 4개'] },
    { group: '목표', id: 'rift', name: '불안정한 균열', mark: svg('rift'), color: '#6b3fa0', on: 1, pts: () => A().layers.rift,
      lines: () => ['첫 균열 11:20~13:20', '영혼 1,482, 13분부터 분당 +222 (팀 분배)'] },
    { group: '목표', id: 'powerup', name: '기운의 파편', mark: svg('powerup'), color: '#7b5bd6', on: 1, pts: () => A().layers.powerup,
      lines: () => ['다리 위 버프', '5:00부터 5분마다 · 강한 근거리 공격으로 획득'] },

    { group: '상점', id: 'shop', name: '상점', mark: img('atlas/shop.png'), color: '#2a6f4e', on: 1, pts: () => A().layers.shop,
      title: p => (p.kind === 'base' ? '기지 상점' : '전선 상점'), sub: side, lines: () => ['아이템 구매 · 상점 범위를 벗어나기 전이면 전액 환불'] },
    { group: '상점', id: 'secret-shop', name: '지하 상점', mark: img('atlas/shop.png'), color: '#5a3b8a', on: 1, pts: () => A().layers['secret-shop'],
      lines: () => ['지하 터널 안의 상점'] },

    { group: '이동', id: 'zipline', name: '집라인', mark: svg('line'), color: '#29b1cc', on: 1, line: 1, pts: () => [],
      lines: () => ['전선마다 기지에서 앞쪽까지 이어진 집라인'] },
    { group: '이동', id: 'teleporter', name: '텔레포터', mark: svg('teleporter'), color: '#2b6c8f', on: 1, pts: () => A().layers.teleporter,
      lines: () => ['지하 터널의 텔레포터', '반대편 텔레포터로 순간이동 (점선)'] },
    { group: '이동', id: 'jump-pad', name: '점프 패드', mark: svg('jump'), color: '#3d6b2f', on: 0, pts: () => A().layers['jump-pad'],
      lines: () => ['밟으면 화살표 끝으로 날아감'] },
    { group: '이동', id: 'rope', name: '등반 로프', mark: svg('rope'), color: '#6b5a3d', on: 0, small: 1, pts: () => A().layers.rope,
      lines: () => ['잡고 위층으로 올라가는 로프'] },

    { group: '아이템', id: 'crate', name: '상자', mark: svg('crate'), color: '#7a5532', on: 0, small: 1, pts: () => A().layers.crate,
      title: p => (p.n > 1 ? `상자 ${p.n}개` : '상자'),
      lines: () => ['3:00부터 3분마다 (터널 상자는 5분)', '부수면 60% 확률로 영혼 23 + 분당 2'] },
    { group: '아이템', id: 'tough', name: '튼튼한 상자', mark: svg('tough'), color: '#6b3a2a', on: 0, small: 1, pts: () => A().layers.tough,
      title: p => (p.n > 1 ? `튼튼한 상자 ${p.n}개` : '튼튼한 상자'),
      lines: () => ['강한 근거리 공격으로만 부서짐', '100% 영혼 46 + 분당 4'] },
    { group: '아이템', id: 'statue', name: '황금 조각상', mark: img('atlas/statue.png'), color: '#9a7a1c', on: 0, small: 1, pts: () => A().layers.statue,
      lines: () => ['황금 조각상이 생길 수 있는 자리', '3:00 첫 생성 · 부순 뒤 3:00', '부수면 50% 확률로 영구 능력치'] },
    { group: '아이템', id: 'snack', name: '치유 간식', mark: svg('snack'), color: '#2f7a3a', on: 1, small: 1, pts: () => A().layers.snack,
      lines: () => ['주우면 체력 회복'] },

    { group: '지형', id: 'vent', name: '증기 구멍', mark: svg('vent'), color: '#4f5b66', on: 0, small: 1, pts: () => A().layers.vent,
      lines: () => ['위에 서 있으면 은신, 체력이 조금 회복됨'] },
    { group: '지형', id: 'veil', name: '우주 장막', mark: svg('veil'), color: '#4a3f73', on: 0, small: 1, pts: () => A().layers.veil,
      lines: () => ['시야를 가리는 막. 그대로 지나갈 수 있음'] }
  ];
  const kind = id => KINDS.find(k => k.id === id);
  const titleOf = (k, p) => (k.title ? k.title(p) : k.name);
  const colorOf = (k, p) => (p.team != null && k.team ? TEAM_COLOR[p.team] : p.lane && !k.team && k.group === '구조물' ? LANE_COLOR[p.lane] : k.color);

  // What the viewer chose: shown kinds (kept in this browser), floor, zoom and pan, the picked marker.
  const KEY = 'lookout.atlas';
  const view = { z: 1, x: 0, y: 0, flip: false, floor: 'all', q: '', pick: null, shown: null };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.shown) view.shown = new Set(saved.shown);
    if (saved?.floor) view.floor = saved.floor;
  } catch {}
  if (!view.shown) view.shown = new Set(KINDS.filter(k => k.on).map(k => k.id));
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ shown: [...view.shown], floor: view.floor }));
    } catch {}
  };

  let root = null;
  const $ = s => root.querySelector(s);
  const $$ = s => [...root.querySelectorAll(s)];

  function markers() {
    return KINDS.filter(k => !k.line)
      .map(k =>
        (k.pts() || [])
          .map((p, i) => {
            const cls = ['ma-m', 'k-' + k.id, p.u ? 'u' : '', k.small ? 'sm' : '', k.big ? 'big' : ''].filter(Boolean).join(' ');
            return `<button class="${cls}" data-k="${k.id}" data-i="${i}" style="left:${p.x * 100}%;top:${p.y * 100}%;--c:${colorOf(k, p)}" aria-label="${esc(titleOf(k, p))}${p.u ? ' · 지하' : ''}">${k.mark}${p.n > 1 ? `<b>${p.n}</b>` : ''}</button>`;
          })
          .join('')
      )
      .join('');
  }
  // Lines under the markers, in a 1000×1000 box over the map: ziplines in lane colours, the teleporter
  // pairs and the jump pads' flights.
  function lines() {
    const P = ([x, y]) => `${(x * 1000).toFixed(1)},${(y * 1000).toFixed(1)}`;
    const zip = A()
      .ziplines.map(z => `<polyline class="ma-zip" points="${z.pts.map(P).join(' ')}" style="--c:${LANE_COLOR[z.lane] || '#888'}"/>`)
      .join('');
    const link = (id, cls) =>
      (A().layers[id] || []).map((p, i) => `<line class="${cls}" data-k="${id}" data-i="${i}" x1="${p.x * 1000}" y1="${p.y * 1000}" x2="${p.to[0] * 1000}" y2="${p.to[1] * 1000}"/>`).join('');
    return `<svg class="ma-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none"><defs><marker id="ma-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#9fd47a"/></marker></defs><g data-k="zipline">${zip}</g>${link('teleporter', 'ma-tp')}${link('jump-pad', 'ma-jp')}</svg>`;
  }
  function list() {
    const groups = [...new Set(KINDS.map(k => k.group))];
    return groups
      .map(
        g =>
          `<section><h4>${g}</h4>${KINDS.filter(k => k.group === g)
            .map(
              k =>
                `<label class="ma-row" data-row="${k.id}"><input type="checkbox" data-kind="${k.id}" ${view.shown.has(k.id) ? 'checked' : ''}><span class="ma-ico" style="--c:${k.color}">${k.mark}</span><span>${k.name}</span><small>${k.line ? A().ziplines.length : (k.pts() || []).length}</small></label>`
            )
            .join('')}</section>`
      )
      .join('');
  }
  function build() {
    root = document.createElement('div');
    root.className = 'ma';
    root.innerHTML = `<aside class="ma-side"><div class="ma-search"><input type="search" id="ma-q" placeholder="찾기: 상점, 종탑, 상자…" autocomplete="off"></div><div class="ma-all"><button data-ma="all">전체 보기</button><button data-ma="none">전체 숨기기</button></div><div class="ma-floor" role="group" aria-label="층"><button data-floor="all">전체</button><button data-floor="street">지상</button><button data-floor="under">지하</button></div><div class="ma-list">${list()}</div><p class="ma-src">위치: deadlock-api 맵 데이터(${esc(A().checked || '')}) · 지도 그림·아이콘: 게임 파일 · 수치: deadlock.wiki · 점선 테두리 = 지하</p></aside><div class="ma-view" tabindex="0" aria-label="지도. 휠로 확대, 끌어서 이동"><div class="ma-stage"><img class="ma-base street" src="assets/atlas/street.webp" alt="" draggable="false"><img class="ma-base tun" src="assets/atlas/tunnels.webp" alt="" draggable="false"><img class="ma-base rat" src="assets/atlas/rat-tunnels.webp" alt="" draggable="false">${lines()}<span class="ma-label top">아치마더 기지</span><span class="ma-label bottom">히든 킹 기지</span>${markers()}</div><div class="ma-tools"><button data-ma="in" title="확대" aria-label="확대">+</button><button data-ma="out" title="축소" aria-label="축소">−</button><button data-ma="fit" title="전체 맞춤" aria-label="전체 맞춤">⤢</button><button data-ma="flip" title="위쪽 기지 시점으로 뒤집기" aria-label="지도 뒤집기">⇅</button><button data-ma="full" title="전체 화면" aria-label="전체 화면">⛶</button></div><div class="ma-legend"><span><i style="background:${LANE_COLOR.yellow}"></i>노란색 전선</span><span><i style="background:${LANE_COLOR.blue}"></i>파란색 전선</span><span><i style="background:${LANE_COLOR.green}"></i>초록색 전선</span><span><i style="background:${TEAM_COLOR[0]}"></i>히든 킹</span><span><i style="background:${TEAM_COLOR[1]}"></i>아치마더</span></div><div class="ma-tip" hidden></div><div class="ma-card" hidden></div></div>`;
    wire();
    apply();
  }

  // --- what is shown ---
  function apply() {
    const q = view.q.trim();
    for (const k of KINDS) {
      const on = view.shown.has(k.id);
      root.classList.toggle('hide-' + k.id, !on);
      const row = $(`[data-row="${k.id}"]`),
        box = row.querySelector('input');
      box.checked = on;
      let hits = (k.pts() || []).length;
      if (q) {
        const nameHit = k.name.includes(q) || k.group.includes(q);
        hits = 0;
        $$(`.ma-m[data-k="${k.id}"]`).forEach(m => {
          const ok = nameHit || m.getAttribute('aria-label').includes(q);
          m.classList.toggle('miss', !ok);
          hits += ok;
        });
        row.hidden = k.line ? !nameHit : !(nameHit || hits);
      } else {
        row.hidden = false;
        $$(`.ma-m.miss[data-k="${k.id}"]`).forEach(m => m.classList.remove('miss'));
      }
      if (!k.line) row.querySelector('small').textContent = hits;
    }
    // Searching shows the kinds that match even if they were hidden.
    root.classList.toggle('searching', !!q);
    root.dataset.floor = view.floor;
    $$('button[data-floor]').forEach(b => b.setAttribute('aria-pressed', b.dataset.floor === view.floor));
    place();
  }
  // Zoom and pan: the stage is a square that fits the view at zoom 1; markers keep their size.
  function size() {
    const v = $('.ma-view');
    return { w: v.clientWidth, h: v.clientHeight, s: Math.min(v.clientWidth, v.clientHeight) };
  }
  function clamp() {
    const { w, h, s } = size(),
      m = s * view.z,
      edge = 0.25 * Math.min(w, h);
    view.x = Math.min(Math.max(view.x, edge - m), w - edge);
    view.y = Math.min(Math.max(view.y, edge - m), h - edge);
  }
  function fit() {
    const { w, h, s } = size();
    view.z = 1;
    view.x = (w - s) / 2;
    view.y = (h - s) / 2;
  }
  function place() {
    const st = $('.ma-stage'),
      { s } = size();
    if (!s) return;
    st.style.width = st.style.height = s + 'px';
    st.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.z})${view.flip ? ' rotate(180deg)' : ''}`;
    st.style.setProperty('--inv', 1 / view.z);
    st.style.setProperty('--rot', view.flip ? '180deg' : '0deg');
    root.classList.toggle('flipped', view.flip);
    root.classList.toggle('zoomed', view.z >= 2.2);
  }
  function zoom(f, cx, cy) {
    const { w, h } = size(),
      z = Math.min(Math.max(view.z * f, 1), 10);
    cx ??= w / 2;
    cy ??= h / 2;
    view.x = cx - ((cx - view.x) * z) / view.z;
    view.y = cy - ((cy - view.y) * z) / view.z;
    view.z = z;
    clamp();
    place();
  }

  // --- the card for a picked marker ---
  function card(el) {
    const c = $('.ma-card');
    $$('.ma-m.on').forEach(m => m.classList.remove('on'));
    $$('.ma-lines .on').forEach(m => m.classList.remove('on'));
    if (!el) {
      view.pick = null;
      c.hidden = true;
      return;
    }
    const k = kind(el.dataset.k),
      p = k.pts()[+el.dataset.i];
    view.pick = [k.id, +el.dataset.i];
    el.classList.add('on');
    $(`.ma-lines [data-k="${k.id}"][data-i="${el.dataset.i}"]`)?.classList.add('on');
    const b = k.building?.(p),
      sub = [k.group, p.u ? '지하' : '지상', k.sub?.(p)].filter(Boolean).join(' · ');
    c.innerHTML = `<button class="ma-x" data-ma="close" aria-label="닫기">×</button><div class="ma-card-head"><span class="ma-ico" style="--c:${colorOf(k, p)}">${k.mark}</span><div><b>${esc(titleOf(k, p))}</b><small>${esc(sub)}</small></div></div>${
      b ? `<img class="ma-photo" src="${esc(b.image)}" alt=""><p><b>${esc(b.name)}</b> · 영혼 슬롯머신 ${b.vaults.length}개${b.bells ? ` · 종 ${b.bells}개` : ''}. ${esc(b.note)}</p>` : ''
    }<ul>${k.lines(p).map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    c.hidden = false;
  }
  function tip(el, e) {
    const t = $('.ma-tip');
    if (!el) return (t.hidden = true);
    t.textContent = el.getAttribute('aria-label');
    t.hidden = false;
    const r = $('.ma-view').getBoundingClientRect();
    t.style.left = Math.min(e.clientX - r.left + 14, r.width - t.offsetWidth - 6) + 'px';
    t.style.top = Math.max(e.clientY - r.top - 34, 6) + 'px';
  }

  // --- input ---
  function wire() {
    const v = $('.ma-view'),
      pts = new Map();
    let drag = null,
      moved = 0;
    v.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        const r = v.getBoundingClientRect();
        zoom(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top);
      },
      { passive: false }
    );
    v.addEventListener('pointerdown', e => {
      if (e.target.closest('.ma-tools, .ma-card, .ma-legend')) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      v.setPointerCapture(e.pointerId);
      drag = { x: view.x, y: view.y, sx: e.clientX, sy: e.clientY, d: null, z: view.z };
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        drag.d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
      moved = 0;
    });
    v.addEventListener('pointermove', e => {
      if (!drag) return tip(e.target.closest('.ma-m'), e);
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2 && drag.d) {
        // Pinch: zoom around the two fingers' middle.
        const [a, b] = [...pts.values()],
          r = v.getBoundingClientRect();
        zoom((drag.z * Math.hypot(a[0] - b[0], a[1] - b[1])) / drag.d / view.z, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
        moved = 99;
        return;
      }
      moved = Math.max(moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy));
      if (moved < 4) return;
      tip(null);
      view.x = drag.x + e.clientX - drag.sx;
      view.y = drag.y + e.clientY - drag.sy;
      clamp();
      place();
      v.classList.add('grab');
    });
    const up = e => {
      pts.delete(e.pointerId);
      // One finger lifted from a pinch: keep panning from where the other finger is now.
      if (pts.size) {
        const [[x, y]] = pts.values();
        drag = { x: view.x, y: view.y, sx: x, sy: y, d: null, z: view.z };
        return;
      }
      v.classList.remove('grab');
      if (drag && moved < 4) {
        const m = document.elementFromPoint(e.clientX, e.clientY)?.closest('.ma-m');
        if (m) card(m);
        else if (!e.target.closest('.ma-card')) card(null);
      }
      drag = null;
    };
    v.addEventListener('pointerup', up);
    v.addEventListener('pointercancel', up);
    v.addEventListener('pointerleave', () => !drag && tip(null));
    v.addEventListener('dblclick', e => {
      const r = v.getBoundingClientRect();
      zoom(2, e.clientX - r.left, e.clientY - r.top);
    });
    v.addEventListener('keydown', e => {
      const step = 60,
        keys = { '+': () => zoom(1.4), '=': () => zoom(1.4), '-': () => zoom(1 / 1.4), ArrowLeft: () => (view.x += step), ArrowRight: () => (view.x -= step), ArrowUp: () => (view.y += step), ArrowDown: () => (view.y -= step), Escape: () => card(null) };
      if (!keys[e.key]) return;
      e.preventDefault();
      keys[e.key]();
      clamp();
      place();
    });
    root.addEventListener('click', e => {
      // button[data-floor]: the root itself carries data-floor for the CSS, and every click is inside it.
      const b = e.target.closest('[data-ma], button[data-floor]');
      if (!b) return;
      const a = b.dataset.ma;
      if (b.dataset.floor) {
        view.floor = b.dataset.floor;
        card(null);
      }
      else if (a === 'all') KINDS.forEach(k => view.shown.add(k.id));
      else if (a === 'none') view.shown.clear();
      else if (a === 'in') return zoom(1.5);
      else if (a === 'out') return zoom(1 / 1.5);
      else if (a === 'fit') fit();
      else if (a === 'flip') view.flip = !view.flip;
      else if (a === 'close') return card(null);
      else if (a === 'full') return document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.().catch(() => {});
      save();
      apply();
    });
    root.addEventListener('change', e => {
      const id = e.target.dataset.kind;
      if (!id) return;
      e.target.checked ? view.shown.add(id) : view.shown.delete(id);
      save();
      apply();
    });
    // Only classes change while typing, so the Korean input box is never redrawn mid-syllable.
    root.addEventListener('input', e => {
      if (e.target.id !== 'ma-q') return;
      view.q = e.target.value;
      apply();
    });
    new ResizeObserver(() => {
      if (!root.isConnected) return;
      if (!root.dataset.fitted) {
        fit();
        root.dataset.fitted = 1;
      }
      clamp();
      place();
    }).observe(v);
    document.addEventListener('fullscreenchange', () => root.classList.toggle('full', document.fullscreenElement === root));
  }

  function page() {
    return `<div class="page-heading"><div><h1>전체 지도</h1><p>정글·상자·상점·구조물·이동 경로 위치 · 휠이나 두 손가락으로 확대, 끌어서 이동, 표시를 누르면 설명</p></div></div><div id="ma-slot" class="ma-slot"></div>`;
  }
  function mount() {
    const slot = document.getElementById('ma-slot');
    if (!slot) return;
    if (!root) build();
    slot.replaceWith(root);
    place();
  }
  return { page, mount, kinds: KINDS };
})();

'use strict';
window.jungleUI = (() => {
  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const words = {
    chinatown: '차이나타운',
    dock: '부두',
    authority: '관리소',
    slums: '헌티드 로트',
    garage: '차고',
    down: '하부',
    up: '상부',
    park: '그리니치',
    chapel: '예배당',
    gate: '입구',
    theater: '극장',
    upstairs: '상층',
    club: '클럽',
    construction: '공사장',
    basketball: '농구장',
    bodega: '상점',
    stage: '무대',
    balcony: '발코니',
    hq: '본부',
    drug: '약국',
    store: '상점',
    nursery: '보육원',
    downstairs: '아래층',
    street: '거리',
    warehouse: '창고',
    hotel: '호텔',
    fish: '어시장',
    storage: '저장고',
    library: '도서관',
    roof: '옥상',
    bell: '종탑',
    mansion: '저택',
    utility: '유틸리티',
    south: '남쪽',
    north: '북쪽',
    alley: '골목',
    york: '요크',
    radio: '라디오',
    dept: '백화점',
    oracle: '오라클',
    bank: '은행',
    asylum: '요양원',
    plaza: '광장',
    rink: '스케이트장',
    corner: '모퉁이',
    lobby: '로비',
    pit: '구덩이',
    sw: '남서',
    se: '남동',
    nw: '북서',
    ne: '북동'
  };
  // Display language (ui/i18n.js); Korean when it is not loaded.
  const L = (ko, en) => (window.I18N ? window.I18N.L(ko, en) : ko),
    english = () => !!window.I18N?.foreign,
    tr = t => (window.I18N ? window.I18N.tr(t) : t);
  const WORDS_EN = {
    chinatown: 'Chinatown',
    dock: 'Dock',
    authority: 'Authority',
    slums: 'Haunted Lot',
    garage: 'Garage',
    down: 'Lower',
    up: 'Upper',
    park: 'Greenwich',
    chapel: 'Chapel',
    gate: 'Gate',
    theater: 'Theater',
    upstairs: 'Upstairs',
    club: 'Club',
    construction: 'Construction',
    basketball: 'Basketball Court',
    bodega: 'Bodega',
    stage: 'Stage',
    balcony: 'Balcony',
    hq: 'HQ',
    drug: 'Drug',
    store: 'Store',
    nursery: 'Nursery',
    downstairs: 'Downstairs',
    street: 'Street',
    warehouse: 'Warehouse',
    hotel: 'Hotel',
    fish: 'Fish Market',
    storage: 'Storage',
    library: 'Library',
    roof: 'Roof',
    bell: 'Bell Tower',
    mansion: 'Mansion',
    utility: 'Utility',
    south: 'South',
    north: 'North',
    alley: 'Alley',
    york: 'York',
    radio: 'Radio',
    dept: 'Department',
    oracle: 'Oracle',
    bank: 'Bank',
    asylum: 'Asylum',
    plaza: 'Plaza',
    rink: 'Rink',
    corner: 'Corner',
    lobby: 'Lobby',
    pit: 'Pit',
    sw: 'SW',
    se: 'SE',
    nw: 'NW',
    ne: 'NE'
  };
  // Whole ids that are a game place name in English (map_district_building_docks).
  const ID_EN = { dock: 'Docks' };
  // A camp or building id in words: 'dock_authority_camp' -> '부두 관리소' / 'Dock Authority'.
  function idName(id) {
    const en = english(),
      bare = id.replace(/_camp$|_neutrals$/g, '');
    if (en && ID_EN[bare]) return tr(ID_EN[bare]);
    return id
      .replace(/_camp$|_neutrals$/g, '')
      .split('_')
      .map(w =>
        en
          ? tr(WORDS_EN[w]) || (/^vault/.test(w) ? (tr('Vault') + ' ' + w.replace('vault', '')).trim() : w)
          : words[w] || (/^vault/.test(w) ? '금고 ' + w.replace('vault', '') : w)
      )
      .join(en && window.I18N?.lang === 'zh' ? '' : ' ');
  }
  function name(c) {
    return idName(c.id);
  }
  // Floors and their basis (jungle-data.js, jungle.cjs) stay Korean in the data; shown in English here.
  const FLOOR_EN = {
    지하: 'Basement',
    지상: 'Ground',
    상층: 'Upper',
    고지대: 'High ground',
    옥상: 'Roof',
    '2층': '2F',
    '3층': '3F',
    '4층': '4F'
  };
  const BASIS_EN = { '지형 높이': 'Terrain height', '게임 장소명': "Game's place name", '직접 확인한 층수': 'Confirmed by you' };
  const floor = f => L(f, FLOOR_EN[f]),
    basis = b => L(b, BASIS_EN[b]);
  const kinds = { weak: '소형', medium: '중형', strong: '대형', vault: '금고' },
    KINDS_EN = { weak: 'Small', medium: 'Medium', strong: 'Large', vault: "Sinner's Sacrifice" };
  // Hover cards (map-objectives.js): what a building with soul slot machines holds and looks like, and
  // the lane and base objectives. One card element on the body, so the map's re-render and its clipped
  // edges do not cut it off.
  const TEAM = { 0: '아래쪽 기지 팀', 1: '위쪽 기지 팀' },
    TEAM_EN = { 0: 'Bottom base team', 1: 'Top base team' };
  const LANE = { yellow: '노란색 전선', blue: '파란색 전선', green: '초록색 전선' },
    LANE_EN = { yellow: 'Yellow lane', blue: 'Blue lane', green: 'Green lane' };
  const num = n => n.toLocaleString('ko-KR');
  const OBJ = {
    guardian: {
      title: ['가디언', 'Guardian'],
      mark: 'icon',
      lines: o => [
        L(
          '전선의 1차 방어선입니다. 쓰러지면 이 전선의 상점이 닫힙니다.',
          "The lane's first line of defense. When it falls, this lane's shop closes."
        ),
        L(
          `체력 ${num(o.hp)} · 영웅에게 25% 더 받고 트루퍼에게 42.5% 덜 받음`,
          `${num(o.hp)} HP · takes 25% more from heroes, 42.5% less from Troopers`
        )
      ]
    },
    walker: {
      title: ['워커', 'Walker'],
      mark: 'icon',
      lines: o => [
        L(
          '전선 안쪽의 2차 방어선입니다. 발 구르기로 주변을 공격합니다.',
          'The second line of defense, deeper in the lane. Stomps to hit everything nearby.'
        ),
        L(`체력 ${num(o.hp)}`, `${num(o.hp)} HP`)
      ]
    },
    base_guardian: {
      title: ['기지 가디언', 'Base Guardian'],
      mark: 'icon',
      lines: o => [
        L('기지 입구를 지킵니다. 전선마다 2개가 나란히 있습니다.', 'Guards the base entrance. Two side by side in each lane.'),
        L(`체력 ${num(o.hp)}`, `${num(o.hp)} HP`)
      ]
    },
    shrine: {
      title: ['성지', 'Shrine'],
      mark: ['성', 'S'],
      lines: () => [
        L('기지 안에 2개 있습니다. 둘 다 부수면 패트런을 공격할 수 있습니다.', 'Two inside the base. Destroy both to attack the Patron.')
      ]
    },
    patron: {
      title: ['패트런', 'Patron'],
      mark: ['패', 'P'],
      lines: o => [
        L(
          '최종 목표입니다. 성지 2개가 모두 부서지면 공격할 수 있습니다.',
          'The final objective. It can be attacked once both Shrines are down.'
        ),
        L(`체력 ${num(o.hp)} · 2단계 ${num(o.hp)}`, `${num(o.hp)} HP · phase 2 ${num(o.hp)}`)
      ]
    },
    mid_boss: {
      title: ['중앙 보스', 'Mid-Boss'],
      mark: ['보', 'B'],
      lines: () => [
        L(
          '맵 중앙 아래 구덩이에 있습니다. 처치한 팀은 다음 사망 때 바로 부활합니다.',
          'In the pit under the map center. The team that kills it respawns instantly on their next death.'
        )
      ]
    }
  };
  const title = k => L(...k.title),
    mark = k => L(...k.mark);
  // Building notes (map-objectives.js, generated) stay Korean in the data.
  const NOTE_EN = {
    '슬롯머신은 종탑 꼭대기, 종 3개는 아래층 둘레': 'Sacrifice at the top of the tower, 3 bells around the floor below',
    '지하 구덩이에 2개가 위아래로 나란히': 'Two in the underground pit, one above the other',
    '차고 위층': 'Upper floor of the garage',
    '극장 위층 발코니': "The theater's upper balcony",
    '가게 안 1층': 'Inside the store, ground floor',
    '로비 1층': 'Lobby, ground floor',
    '건물 안 1층': 'Inside, ground floor'
  };
  const ICON = { guardian: 'guardian', base_guardian: 'guardian', walker: 'walker' };
  const objectives = () => window.MAP_OBJECTIVES || { buildings: [], objectives: [], health: {} };
  const buildingOf = id => objectives().buildings.find(b => b.vaults.includes(id));
  function buildingCard(b) {
    const o = objectives(),
      n = b.vaults.length,
      count = [
        (I18N.foreign ? I18N.count(n, '', "Sinner's Sacrifice") : `영혼 슬롯머신 ${n}개`),
        b.bells ? (I18N.foreign ? I18N.count(b.bells, '', 'bell') : `종 ${b.bells}개`) : ''
      ]
        .filter(Boolean)
        .join(' · '),
      note = english() ? tr(NOTE_EN[b.note]) || '' : b.note,
      hp = num(o.health.vault || 500),
      souls = o.vaultSouls || 155;
    return `<img src="${esc(b.image)}" alt=""><b>${esc(english() ? idName(b.id) : b.name)}</b><em>${esc(count)}</em>${
      note || !english() ? `<p>${esc(note)}</p>` : ''
    }<p>${L(
      `8:00 첫 생성 · 전부 부순 뒤 5:00 · 근접 공격으로만 피해(체력 ${hp}) · 영혼 ${souls}부터 1분마다 1.08%씩 늘어남`,
      `First spawn 8:00 · 5:00 after all are broken · melee damage only (${hp} HP) · ${souls} Souls, +1.08% each minute`
    )}</p>${
      b.bells ? `<p>${L('종을 치면 근처 적에게 들립니다.', 'Nearby enemies hear a bell when it is rung.')}</p>` : ''
    }<small>${L('위에서 비스듬히 본 모습 · 보라색 상자 = 슬롯머신', 'Seen at an angle from above · purple box = Sacrifice')}${
      b.bells ? L(' · 노란 칸 = 종', ' · yellow squares = bells') : ''
    }${b.bells ? '' : L(' · 슬롯머신 높이 위쪽 층은 잘라냄', ' · floors above the Sacrifice cut away')}</small>`;
  }
  function objectiveCard(o) {
    const k = OBJ[o.kind],
      sub = [L(TEAM[o.team], TEAM_EN[o.team]), L(LANE[o.lane], LANE_EN[o.lane])].filter(Boolean).join(' · '),
      info = { ...o, hp: objectives().health[o.kind] };
    return `${ICON[o.kind] ? `<img class="icon" src="assets/objectives/${ICON[o.kind]}.png" alt="">` : ''}<b>${title(k)}</b>${sub ? `<em>${esc(sub)}</em>` : ''}${k
      .lines(info)
      .map(x => `<p>${esc(x)}</p>`)
      .join('')}${ICON[o.kind] ? `<small>${L('그림 = 게임 미니맵에 보이는 모양', 'Picture = how it looks on the game minimap')}</small>` : ''}`;
  }
  function tip(el) {
    let card = document.getElementById('jm-tip');
    if (!el) return card && (card.hidden = true);
    if (!card) {
      card = document.createElement('div');
      card.id = 'jm-tip';
      card.className = 'jm-tip';
      document.body.append(card);
    }
    const o = objectives();
    card.innerHTML = el.dataset.jBuilding
      ? buildingCard(o.buildings.find(b => b.id === el.dataset.jBuilding))
      : objectiveCard(o.objectives[+el.dataset.jObjective]);
    card.hidden = false;
    // Beside the marker, flipped to the other side near the window's right or bottom edge; again once
    // the picture has loaded and made the card taller.
    const place = () => {
      const r = el.getBoundingClientRect(),
        w = card.offsetWidth,
        h = card.offsetHeight,
        x = r.right + 10 + w > innerWidth ? r.left - 10 - w : r.right + 10,
        y = Math.min(Math.max(8, r.top + r.height / 2 - h / 2), innerHeight - h - 8);
      card.style.left = Math.max(8, x) + 'px';
      card.style.top = Math.max(8, y) + 'px';
    };
    place();
    const img = card.querySelector('img');
    if (img && !img.complete) img.addEventListener('load', place, { once: true });
  }
  document.addEventListener('mouseover', e => {
    const el = e.target.closest?.('[data-j-building],[data-j-objective]');
    tip(el);
  });
  document.addEventListener('focusin', e => {
    const el = e.target.closest?.('[data-j-building],[data-j-objective]');
    if (el) tip(el);
  });
  function render(s) {
    const j = s.jungle;
    if (!j?.camps?.length)
      return `<h1>${L('미니맵 도우미', 'Minimap helper')}</h1><p>${L('경기 정보를 기다립니다.', 'Waiting for match info.')}</p>`;
    const selected = j.camps.find(c => c.id === j.selected) || j.camps[0];
    const point = c => (j.rotation === 180 ? { x: 1 - c.x, y: 1 - c.y } : c);
    return `<div class="page-heading"><h1>${L('미니맵 도우미', 'Minimap helper')}</h1><p>${L('게임 미니맵 위에 위치·높이·확인된 시간을 표시합니다.', 'Shows positions, heights and confirmed times on the game minimap.')}</p></div><div class="jungle-status"><b>${j.minimap ? L('미니맵 위치 확인됨', 'Minimap found') : L('게임 미니맵 탐색 중', 'Looking for the game minimap')}</b><span>${j.seconds === null ? L('경기 시계 대기', 'Waiting for match clock') : Math.floor(j.seconds / 60) + ':' + String(Math.floor(j.seconds % 60)).padStart(2, '0')}</span><button data-j-action="jungle-enable">${j.enabled ? L('미니맵 표시 끄기', 'Turn off minimap marks') : L('미니맵 표시 켜기', 'Turn on minimap marks')}</button><button data-j-action="jungle-auto">${j.autoDetect ? L('자동 감지 켜짐', 'Auto-detect on') : L('자동 감지 꺼짐', 'Auto-detect off')}</button><button data-j-action="map">${L('게임에서 펼치기 · Alt G', 'Open in game · Alt G')}</button></div><p class="note">${j.autoTracking ? L(`캠프 아이콘 ${j.visibleCamps}곳 추적 중 · 방향 자동 확인`, `Tracking ${j.visibleCamps} camp icons · facing checked automatically`) : j.autoDetect ? L('자동 감지 대기 · 경기 시계와 캠프 아이콘을 확인합니다', 'Auto-detect waiting · checking the match clock and camp icons') : L('자동 감지 꺼짐 · 수동 보정만 사용합니다', 'Auto-detect off · manual corrections only')}</p><div class="map-layout"><div class="jungle-map"><img src="assets/map.png" alt="${L('Deadlock 캠프 위치 지도', 'Deadlock camp map')}" style="transform:rotate(${j.rotation}deg)">${j.camps
      .map(c => {
        const p = point(c),
          b = c.kind === 'vault' ? buildingOf(c.id) : null;
        return `<button class="jungle-dot ${c.kind} ${c.id === selected.id ? 'selected' : ''}" data-j-camp="${esc(c.id)}"${b ? ` data-j-building="${esc(b.id)}"` : ''} style="left:${p.x * 100}%;top:${p.y * 100}%" aria-label="${esc(name(c))} · ${esc(floor(c.floor))}">${c.kind === 'vault' ? 'V' : c.kind === 'weak' ? '1' : c.kind === 'medium' ? '2' : '3'}</button>`;
      })
      .join('')}${objectives()
      .objectives.map((o, n) => {
        const p = point(o),
          k = OBJ[o.kind];
        return `<span class="jungle-obj ${o.kind} team-${o.team ?? 'n'}" tabindex="0" data-j-objective="${n}" style="left:${p.x * 100}%;top:${p.y * 100}%" aria-label="${title(k)}">${
          ICON[o.kind] ? `<img src="assets/objectives/${ICON[o.kind]}.png" alt="">` : mark(k)
        }</span>`;
      })
      .join(
        ''
      )}<div class="jungle-legend">${L('1 소형 · 2 중형 · 3 대형 · V 금고 · 주황 아래쪽 · 파랑 위쪽 기지 팀 · 마우스를 올리면 설명', "1 small · 2 medium · 3 large · V Sinner's Sacrifice · orange bottom · blue top base team · hover for details")}</div></div><section class="card"><p class="label">${L(kinds[selected.kind], KINDS_EN[selected.kind])} · ${esc(floor(selected.floor))}</p><h2>${esc(name(selected))}</h2><div class="jungle-timer">${selected.remaining === null ? '—' : (selected.remainingRange ? selected.remainingRange.join('~') : (selected.automatic ? '≈' : '') + selected.remaining) + `<small>${L('초', 's')}</small>`}</div><p class="camp-detection"><b>${esc(selected.detection?.label || L('관측 대기', 'Waiting to observe'))}</b> · ${esc(selected.detection?.message || selected.basis)}</p><p>${esc(selected.basis)}</p><div class="inline space"><button class="primary" data-j-action="jungle-clear" ${j.seconds === null ? 'disabled' : ''}>${L('처치 시점 보정', 'Mark cleared now')}</button><button data-j-action="jungle-undo" ${!selected.recorded ? 'disabled' : ''}>${L('기록 취소', 'Undo')}</button></div><p class="note">${L('보이던 캠프 아이콘이 연속해서 사라지면 타이머가 자동 시작됩니다. 내 위치 표식이 가리면 화면에 보이는 재생성 시계로 보완합니다. 위치나 시간이 불확실하면 확정을 보류합니다. 버튼은 오인식을 보정할 때만 사용하세요.', 'When a camp icon that was visible disappears several reads in a row, its timer starts on its own. If your own marker covers it, the respawn clock on screen fills in. Uncertain positions or times stay unconfirmed. Use the buttons only to correct misreads.')}</p><dl class="camp-facts"><dt>${L('최초 생성', 'First spawn')}</dt><dd>${L(`${selected.rule.first}초`, `${selected.rule.first} sec`)}</dd><dt>${L('전부 처치 후 재생성', 'Respawn after full clear')}</dt><dd>${L(`${selected.rule.respawn}초`, `${selected.rule.respawn} sec`)}</dd><dt>${L('높이 분류 근거', 'Height basis')}</dt><dd>${esc(basis(selected.floorBasis))} · z ${Math.round(selected.z)}</dd></dl><label class="floor-select">${L('현장에서 확인한 층수', 'Floor confirmed in game')}<select data-j-level>${['', '지하', '지상', '2층', '3층', '4층', '상층', '옥상'].map(level => `<option value="${level}" ${j.levels[selected.id] === level ? 'selected' : ''}>${level ? floor(level) : L('기본 높이 분류', 'Default by height')}</option>`).join('')}</select></label><p class="note">${L('서로 다른 건물의 높이 좌표를 같은 층수로 단정하지 않습니다. 확인한 2층·3층 표시는 이 PC에 저장됩니다.', 'Heights in different buildings are not assumed to be the same floor. Floors you confirm (2F, 3F) are saved on this PC.')}</p><button data-j-action="jungle-rotate">${L('지도 방향 180° 반전', 'Flip map 180°')}</button></section></div><section class="card space"><h2>${L('시간 표시 기준', 'How times are shown')}</h2><p>${L('최초 생성은 경기 시계로 계산합니다. <b>≈</b>는 아이콘 변화 또는 게임 재생성 시계로 확인한 추정 시간입니다. 관측 간격의 오차는 상세에 표시합니다. 시작부터 없던 캠프나 확인하지 못한 변화는 <b>?</b>로 남깁니다. 아이콘이 다시 확인되면 자동 기록을 해제합니다.', "First spawns are counted from the match clock. <b>≈</b> is an estimate from an icon change or the game's respawn clock; the error from the read interval is shown in the details. Camps missing from the start and changes not confirmed stay <b>?</b>. When the icon shows again, the automatic record is cleared.")}</p><p class="note">${L('2026.10.23 공개 게임 데이터 · 캠프 51곳. 평소에는 마우스 입력을 통과합니다. Alt G를 누르면 12초 동안 캠프를 선택할 수 있습니다.', 'Public game data, 2026-10-23 · 51 camps. Mouse input normally passes through. Press Alt G to pick camps for 12 sec.')}</p></section>`;
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b || (!b.dataset.jCamp && !b.dataset.jAction)) return;
    const s = await window.lane.command('state');
    if (b.dataset.jCamp) return window.lane.command('jungle-select', b.dataset.jCamp);
    const cmd = b.dataset.jAction;
    const result = await window.lane.command(
      cmd,
      cmd === 'jungle-enable' ? !s.jungle.enabled : cmd === 'jungle-auto' ? !s.jungle.autoDetect : s.jungle.selected
    );
    if (result?.error) {
      const note = document.createElement('p');
      note.className = 'error';
      note.textContent = result.error;
      b.parentElement.append(note);
    }
  });
  document.addEventListener('change', async e => {
    if (!e.target.hasAttribute('data-j-level')) return;
    const s = await window.lane.command('state');
    window.lane.command('jungle-level', { id: s.jungle.selected, level: e.target.value });
  });
  return { name, floor, render };
})();

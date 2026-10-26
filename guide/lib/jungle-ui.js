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
  function name(c) {
    return c.id
      .replace(/_camp$|_neutrals$/g, '')
      .split('_')
      .map(w => words[w] || (/^vault/.test(w) ? '금고 ' + w.replace('vault', '') : w))
      .join(' ');
  }
  const kinds = { weak: '소형', medium: '중형', strong: '대형', vault: '금고' };
  // Hover cards (map-objectives.js): what a building with soul slot machines holds and looks like, and
  // the lane and base objectives. One card element on the body, so the map's re-render and its clipped
  // edges do not cut it off.
  const TEAM = { 0: '아래쪽 기지 팀', 1: '위쪽 기지 팀' };
  const LANE = { yellow: '노란색 전선', blue: '파란색 전선', green: '초록색 전선' };
  const num = n => n.toLocaleString('ko-KR');
  const OBJ = {
    guardian: { title: '가디언', mark: 'icon', lines: o => ['전선의 1차 방어선입니다. 쓰러지면 이 전선의 상점이 닫힙니다.', `체력 ${num(o.hp)} · 영웅에게 25% 더 받고 트루퍼에게 42.5% 덜 받음`] },
    walker: { title: '워커', mark: 'icon', lines: o => ['전선 안쪽의 2차 방어선입니다. 발 구르기로 주변을 공격합니다.', `체력 ${num(o.hp)}`] },
    base_guardian: { title: '기지 가디언', mark: 'icon', lines: o => ['기지 입구를 지킵니다. 전선마다 2개가 나란히 있습니다.', `체력 ${num(o.hp)}`] },
    shrine: { title: '성지', mark: '성', lines: () => ['기지 안에 2개 있습니다. 둘 다 부수면 패트런을 공격할 수 있습니다.'] },
    patron: { title: '패트런', mark: '패', lines: o => ['최종 목표입니다. 성지 2개가 모두 부서지면 공격할 수 있습니다.', `체력 ${num(o.hp)} · 2단계 ${num(o.hp)}`] },
    mid_boss: { title: '중앙 보스', mark: '보', lines: () => ['맵 중앙 아래 구덩이에 있습니다. 처치한 팀은 다음 사망 때 바로 부활합니다.'] }
  };
  const ICON = { guardian: 'guardian', base_guardian: 'guardian', walker: 'walker' };
  const objectives = () => window.MAP_OBJECTIVES || { buildings: [], objectives: [], health: {} };
  const buildingOf = id => objectives().buildings.find(b => b.vaults.includes(id));
  function buildingCard(b) {
    const o = objectives(),
      count = [`영혼 슬롯머신 ${b.vaults.length}개`, b.bells ? `종 ${b.bells}개` : ''].filter(Boolean).join(' · ');
    return `<img src="${esc(b.image)}" alt=""><b>${esc(b.name)}</b><em>${esc(count)}</em><p>${esc(b.note)}</p><p>8:00 첫 생성 · 전부 부순 뒤 5:00 · 근접 공격으로만 피해(체력 ${num(o.health.vault || 500)}) · 영혼 ${o.vaultSouls || 155}부터 1분마다 1.08%씩 늘어남</p>${
      b.bells ? '<p>종을 치면 근처 적에게 들립니다.</p>' : ''
    }<small>위에서 비스듬히 본 모습 · 보라색 상자 = 슬롯머신${b.bells ? ' · 노란 칸 = 종' : ''}${b.bells ? '' : ' · 슬롯머신 높이 위쪽 층은 잘라냄'}</small>`;
  }
  function objectiveCard(o) {
    const k = OBJ[o.kind],
      sub = [TEAM[o.team], LANE[o.lane]].filter(Boolean).join(' · '),
      info = { ...o, hp: objectives().health[o.kind] };
    return `${ICON[o.kind] ? `<img class="icon" src="assets/objectives/${ICON[o.kind]}.png" alt="">` : ''}<b>${k.title}</b>${sub ? `<em>${esc(sub)}</em>` : ''}${k
      .lines(info)
      .map(x => `<p>${esc(x)}</p>`)
      .join('')}${ICON[o.kind] ? '<small>그림 = 게임 미니맵에 보이는 모양</small>' : ''}`;
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
    if (!j?.camps?.length) return '<h1>미니맵 도우미</h1><p>경기 정보를 기다립니다.</p>';
    const selected = j.camps.find(c => c.id === j.selected) || j.camps[0];
    const point = c => (j.rotation === 180 ? { x: 1 - c.x, y: 1 - c.y } : c);
    return `<div class="page-heading"><h1>미니맵 도우미</h1><p>게임 미니맵 위에 위치·높이·확인된 시간을 표시합니다.</p></div><div class="jungle-status"><b>${j.minimap ? '미니맵 위치 확인됨' : '게임 미니맵 탐색 중'}</b><span>${j.seconds === null ? '경기 시계 대기' : Math.floor(j.seconds / 60) + ':' + String(Math.floor(j.seconds % 60)).padStart(2, '0')}</span><button data-j-action="jungle-enable">${j.enabled ? '미니맵 표시 끄기' : '미니맵 표시 켜기'}</button><button data-j-action="jungle-auto">${j.autoDetect ? '자동 감지 켜짐' : '자동 감지 꺼짐'}</button><button data-j-action="map">게임에서 펼치기 · Alt G</button></div><p class="note">${j.autoTracking ? `캠프 아이콘 ${j.visibleCamps}곳 추적 중 · 방향 자동 확인` : j.autoDetect ? '자동 감지 대기 · 경기 시계와 캠프 아이콘을 확인합니다' : '자동 감지 꺼짐 · 수동 보정만 사용합니다'}</p><div class="map-layout"><div class="jungle-map"><img src="assets/map.png" alt="Deadlock 캠프 위치 지도" style="transform:rotate(${j.rotation}deg)">${j.camps
      .map(c => {
        const p = point(c),
          b = c.kind === 'vault' ? buildingOf(c.id) : null;
        return `<button class="jungle-dot ${c.kind} ${c.id === selected.id ? 'selected' : ''}" data-j-camp="${esc(c.id)}"${b ? ` data-j-building="${esc(b.id)}"` : ''} style="left:${p.x * 100}%;top:${p.y * 100}%" aria-label="${esc(name(c))} · ${esc(c.floor)}">${c.kind === 'vault' ? 'V' : c.kind === 'weak' ? '1' : c.kind === 'medium' ? '2' : '3'}</button>`;
      })
      .join(
        ''
      )}${objectives()
      .objectives.map((o, n) => {
        const p = point(o),
          k = OBJ[o.kind];
        return `<span class="jungle-obj ${o.kind} team-${o.team ?? 'n'}" tabindex="0" data-j-objective="${n}" style="left:${p.x * 100}%;top:${p.y * 100}%" aria-label="${k.title}">${
          ICON[o.kind] ? `<img src="assets/objectives/${ICON[o.kind]}.png" alt="">` : k.mark
        }</span>`;
      })
      .join('')}<div class="jungle-legend">1 소형 · 2 중형 · 3 대형 · V 금고 · 주황 아래쪽 · 파랑 위쪽 기지 팀 · 마우스를 올리면 설명</div></div><section class="card"><p class="label">${kinds[selected.kind]} · ${esc(selected.floor)}</p><h2>${esc(name(selected))}</h2><div class="jungle-timer">${selected.remaining === null ? '—' : (selected.automatic ? '≈' : '') + selected.remaining + '<small>초</small>'}</div><p>${esc(selected.basis)}</p><div class="inline space"><button class="primary" data-j-action="jungle-clear" ${j.seconds === null ? 'disabled' : ''}>처치 시점 보정</button><button data-j-action="jungle-undo" ${!selected.recorded ? 'disabled' : ''}>기록 취소</button></div><p class="note">보이던 캠프 아이콘이 연속해서 사라지면 타이머가 자동 시작됩니다. 내 위치 표식이 가리면 화면에 보이는 재생성 시계로 보완합니다. 위치나 시간이 불확실하면 확정을 보류합니다. 버튼은 오인식을 보정할 때만 사용하세요.</p><dl class="camp-facts"><dt>최초 생성</dt><dd>${selected.rule.first}초</dd><dt>전부 처치 후 재생성</dt><dd>${selected.rule.respawn}초</dd><dt>높이 분류 근거</dt><dd>${esc(selected.floorBasis)} · z ${Math.round(selected.z)}</dd></dl><label class="floor-select">현장에서 확인한 층수<select data-j-level>${['', '지하', '지상', '2층', '3층', '4층', '상층', '옥상'].map(level => `<option value="${level}" ${j.levels[selected.id] === level ? 'selected' : ''}>${level || '기본 높이 분류'}</option>`).join('')}</select></label><p class="note">서로 다른 건물의 높이 좌표를 같은 층수로 단정하지 않습니다. 확인한 2층·3층 표시는 이 PC에 저장됩니다.</p><button data-j-action="jungle-rotate">지도 방향 180° 반전</button></section></div><section class="card space"><h2>시간 표시 기준</h2><p>최초 생성은 경기 시계로 계산합니다. <b>≈</b>는 아이콘 변화 또는 게임 재생성 시계로 확인한 추정 시간입니다. 관측 간격의 오차는 상세에 표시합니다. 시작부터 없던 캠프나 확인하지 못한 변화는 <b>?</b>로 남깁니다. 아이콘이 다시 확인되면 자동 기록을 해제합니다.</p><p class="note">2026.10.23 공개 게임 데이터 · 캠프 51곳. 평소에는 마우스 입력을 통과합니다. Alt G를 누르면 12초 동안 캠프를 선택할 수 있습니다.</p></section>`;
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
  return { name, render };
})();

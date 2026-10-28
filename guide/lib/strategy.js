'use strict';
// Dashboard 공략 (guide) and 추천 빌드 (statistical builds) pages.
// Content data: ui/strategy-data.js; build styles: ui/hero-archetypes.js.
(() => {
  const esc = s =>
    String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const n = v => Math.round(v).toLocaleString('en-US');
  const k = v => (v >= 10000 ? (v / 1000).toFixed(0) : (v / 1000).toFixed(1)) + 'k';
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const D = () => window.STRATEGY;
  // Display language (ui/i18n.js): Korean text as written, English beside it.
  const L = (ko, en) => (window.I18N ? window.I18N.L(ko, en) : ko);
  // Source links. guidePage() turns them into numbered footnotes collected under the section (namu-wiki
  // style); `keep` leaves the label in the sentence when it is part of it ("Trooper 문서는 ...").
  // data-fn is the line shown in that list.
  const src = (url, label, fn, keep) =>
    `<a class="src${keep ? ' keep' : ''}" href="${url}" target="_blank" data-fn="${esc(fn)}">${esc(label)}</a>`;
  const wiki = (page, label = 'deadlock.wiki', keep) =>
    src(`https://deadlock.wiki/${page}`, label, `deadlock.wiki · ${decodeURIComponent(page).replace(/_/g, ' ').replace('#', ' › ')}`, keep);
  const dc = (no, label, en) =>
    src(
      `https://gall.dcinside.com/mgallery/board/view/?id=deadlock&amp;no=${no}`,
      L(label, en),
      L(`DC 데드락 갤러리 · ${label.replace(/^DC /, '')}`, `DC Deadlock gallery · ${String(en ?? label).replace(/^DC /, '')}`)
    );
  const yt = (id, at, label, en) => {
    const [m, s = 0] = String(at).split(':').map(Number),
      t = m * 60 + s,
      v = D().youtube.find(x => x.id === id);
    return src(
      `https://www.youtube.com/watch?v=${id}&amp;t=${t}s`,
      L(label, en),
      v ? L(`${v.channel} · ${v.title} · ${at}부터`, `${v.channelEn || v.channel} · ${v.titleEn || v.title} · from ${at}`) : `YouTube · ${L(label, en)}`
    );
  };
  const fig = (svg, caption) => `<figure class="sg-fig">${svg}<figcaption>${caption}</figcaption></figure>`;
  const callout = (kind, title, body) => `<div class="sg-callout ${kind}"><b>${title}</b><div>${body}</div></div>`;

  // --- Pictures: drawn here so they follow patches and stay readable in the dark theme. ---
  function orbFigure() {
    return `<svg viewBox="0 0 640 300" role="img" aria-label="${L('트루퍼가 죽으면 바닥 구슬과 공중 구슬이 반씩 나온다', 'A dead trooper drops half its souls as ground orbs and half as floating orbs')}">
  <rect x="245" y="10" width="150" height="40" rx="8" class="f-box"/><text x="320" y="35" class="f-t c">${L('트루퍼 처치 (값 100%)', 'Trooper kill (100% value)')}</text>
  <path d="M290 50 L160 92" class="f-arrow"/><path d="M350 50 L480 92" class="f-arrow"/>
  <circle cx="150" cy="110" r="20" class="f-ground"/><text x="150" y="116" class="f-t c b">50%</text>
  <circle cx="490" cy="110" r="20" class="f-float"/><text x="490" y="116" class="f-t c b">50%</text>
  <text x="150" y="152" class="f-t c b">${L('바닥 구슬', 'Ground orb')}</text>
  <text x="490" y="152" class="f-t c b">${L('공중 구슬 (빛나면 사격 가능)', 'Floating orb (shoot when it glows)')}</text>
  <text x="50" y="178" class="f-t s">${L('· 디나이 불가 (적에게는 흰색)', '· Cannot be denied (white to enemies)')}</text>
  <text x="50" y="198" class="f-t s">${L('· 가까이 가면 날아와 흡수', '· Flies to you when you get close')}</text>
  <text x="50" y="218" class="f-t s">${L('· 18초 뒤 소멸 (10분 이후 40초)', '· Gone after 18 sec (40 sec after 10 min)')}</text>
  <text x="390" y="178" class="f-t s ok">${L('· 내가 쏨 → 즉시 확정', '· You shoot it → secured at once')}</text>
  <text x="390" y="198" class="f-t s bad">${L('· 적이 쏨 → 디나이 (적이 가져감)', '· Enemy shoots it → denied (they take it)')}</text>
  <text x="390" y="218" class="f-t s">${L('· 1초 방치 → 근처 아군에게 자동', '· Left 1 sec → goes to nearby allies')}</text>
  <text x="390" y="238" class="f-t s bad">${L('· 근처에 아무도 없으면 소멸', '· Gone if nobody is nearby')}</text>
  <rect x="200" y="256" width="240" height="34" rx="8" class="f-box hl"/><text x="320" y="278" class="f-t c">${L('근거리 공격 막타: 공중 구슬 없이 즉시 내 것', 'Melee last hit: yours at once, no orb')}</text>
</svg>`;
  }
  function shareFigure() {
    const rows = D().share,
      bar = (v, max) => (v / max) * 230;
    return `<svg viewBox="0 0 640 230" role="img" aria-label="${L('근처 아군 수에 따른 1인당 영혼', 'Souls per hero by the number of nearby allies')}">
  <text x="20" y="24" class="f-t b">${L('근처 영웅 수', 'Heroes nearby')}</text><text x="120" y="24" class="f-t b">${L('1인당 받는 몫', 'Share each')}</text><text x="420" y="24" class="f-t b">${L('팀 전체 합', 'Team total')}</text>
  ${rows
    .map(
      (r, i) => `<text x="40" y="${56 + i * 30}" class="f-t">${L(`${r.n}명`, `${r.n}`)}</text>
  <rect x="120" y="${42 + i * 30}" width="${bar(r.each, 100)}" height="18" rx="3" class="f-bar ${r.n === 1 ? 'hl' : ''}"/><text x="${128 + bar(r.each, 100)}" y="${56 + i * 30}" class="f-t">${r.each}%</text>
  <rect x="420" y="${42 + i * 30}" width="${bar(r.total, 108) * 0.7}" height="18" rx="3" class="f-bar2"/><text x="${428 + bar(r.total, 108) * 0.7}" y="${56 + i * 30}" class="f-t">${r.total}%</text>`
    )
    .join('')}
</svg>`;
  }
  function timelineFigure() {
    const T = D().timeline,
      x = t => 80 + (t / 720) * 500;
    return `<svg viewBox="0 0 640 210" role="img" aria-label="${L('0분부터 12분까지 생성 시각', 'Spawn times from 0 to 12 min')}">
  <line x1="80" y1="110" x2="580" y2="110" class="f-axis"/>
  ${[0, 2, 4, 6, 8, 10, 12].map(m => `<line x1="${x(m * 60)}" y1="104" x2="${x(m * 60)}" y2="116" class="f-axis"/><text x="${x(m * 60)}" y="134" class="f-t c s">${m}:00</text>`).join('')}
  ${T.map(
    (e, i) => `<circle cx="${x(e.t)}" cy="110" r="6" class="f-dot"/>
  <text x="${x(e.t)}" y="${i % 2 ? 160 : 70}" class="f-t c b">${esc(L(e.label, e.labelEn))}</text><text x="${x(e.t)}" y="${i % 2 ? 178 : 88}" class="f-t c s">${esc(L(e.note, e.noteEn))}</text>`
  ).join('')}
  ${[90, 150, 270, 450].map(t => `<path d="M${x(t)} 96 L${x(t)} 110" class="f-warn"/>`).join('')}
  <text x="80" y="200" class="f-t s warn">${L('▲ 주황 표시: 오브젝트 30초 전, 웨이브를 먼저 밀어 둘 시각 (1:30 · 2:30 · 4:30 · 7:30)', '▲ Orange marks: 30 sec before an objective, when to push the wave first (1:30 · 2:30 · 4:30 · 7:30)')}</text>
</svg>`;
  }
  function loopFigure() {
    const steps = L(
      [
        ['0초', '웨이브 도착', '공중 구슬 쏘며 정리'],
        ['~10초', '밀어 넣기', '적 가디언 쪽으로'],
        ['~12초', '근처 캠프·상자', '가까운 1곳만'],
        ['~25초', '전선 복귀', '다음 웨이브 도착 전']
      ],
      [
        ['0 sec', 'Wave arrives', 'Clear it, shoot orbs'],
        ['~10 sec', 'Push it in', 'Toward enemy Guardian'],
        ['~12 sec', 'Camp · crates', 'Just the nearest one'],
        ['~25 sec', 'Back to lane', 'Before the next wave']
      ]
    );
    return `<svg viewBox="0 0 640 170" role="img" aria-label="${L('30초 웨이브 사이클', '30-second wave cycle')}">
  ${steps
    .map(
      ([t, a, b], i) => `<rect x="${20 + i * 156}" y="40" width="140" height="80" rx="10" class="f-box ${i === 2 ? 'hl' : ''}"/>
  <text x="${90 + i * 156}" y="62" class="f-t c s">${t}</text><text x="${90 + i * 156}" y="86" class="f-t c b">${a}</text><text x="${90 + i * 156}" y="106" class="f-t c s">${b}</text>
  ${i < 3 ? `<path d="M${162 + i * 156} 80 L${174 + i * 156} 80" class="f-arrow"/>` : ''}`
    )
    .join('')}
  <path d="M600 125 C 600 160, 90 160, 90 125" class="f-arrow dash"/><text x="345" y="166" class="f-t c s">${L('30초마다 반복 (20분부터 25초, 35분부터 20초)', 'Repeats every 30 sec (25 sec from 20 min, 20 sec from 35 min)')}</text>
  <text x="20" y="24" class="f-t b">${L('웨이브 사이의 빈 시간에 정글·상자를 끼워 넣는 루프', 'The loop: fit jungle and crates into the gap between waves')}</text>
</svg>`;
  }
  function worthFigure(mark) {
    const W = D().worth,
      x = m => 60 + (m / 30) * 540,
      y = v => 200 - (v / 34000) * 180,
      line = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(W.minutes[i]).toFixed(1)} ${y(v).toFixed(1)}`).join(' '),
      band = W.low.map((v, i) => [x(W.minutes[i]), y(v - W.lowSd[i])]),
      bandTop = W.low.map((v, i) => [x(W.minutes[i]), y(v + W.lowSd[i])]);
    return `<svg viewBox="0 0 640 240" role="img" aria-label="${L('분당 순자산 기준선', 'Net worth baseline by minute')}">
  ${[0, 10000, 20000, 30000].map(v => `<line x1="60" x2="600" y1="${y(v)}" y2="${y(v)}" class="f-grid"/><text x="52" y="${y(v) + 4}" class="f-t r s">${v / 1000}k</text>`).join('')}
  ${[0, 5, 10, 15, 20, 25, 30].map(m => `<text x="${x(m)}" y="222" class="f-t c s">${L(`${m}분`, `${m} min`)}</text>`).join('')}
  <path d="${[...band, ...bandTop.reverse()].map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')}Z" class="f-band"/>
  <path d="${line(W.low)}" class="f-line low"/><path d="${line(W.high)}" class="f-line high"/>
  ${W.minutes.map((m, i) => `<circle cx="${x(m)}" cy="${y(W.low[i])}" r="3" class="f-dot"/>`).join('')}
  ${mark ? `<circle cx="${x(mark.m)}" cy="${y(mark.v)}" r="6" class="f-me"/><text x="${x(mark.m) + 10}" y="${y(mark.v) + 4}" class="f-t b me">${L('나', 'You')} ${k(mark.v)}</text>` : ''}
  <text x="70" y="24" class="f-t s"><tspan class="leg-low">${L('━ 하위 랭크 평균', '━ Low-rank average')}</tspan>  <tspan class="leg-high">${L('━ 상위 랭크 평균', '━ High-rank average')}</tspan>  <tspan class="leg-band">${L('▇ 하위 평균 ± 표준편차', '▇ Low average ± std dev')}</tspan></text>
</svg>`;
  }
  function levelFigure() {
    const levels = window.HERO_META?.levels || [],
      x = s => 30 + (s / 6000) * 580;
    let unlocks = 0;
    return `<svg viewBox="0 0 640 140" role="img" aria-label="${L('영혼에 따른 능력 해금과 포인트', 'Ability unlocks and points by Souls')}">
  <line x1="30" y1="70" x2="610" y2="70" class="f-axis"/>
  ${levels.filter(l => l.souls <= 6000)
    .map(
      l => `<line x1="${x(l.souls)}" y1="${l.unlock ? 52 : 62}" x2="${x(l.souls)}" y2="78" class="${l.unlock ? 'f-unlock' : 'f-point'}"/>
  <text x="${x(l.souls)}" y="96" class="f-t c s">${l.souls >= 1000 ? (l.souls / 1000).toFixed(1) + 'k' : l.souls}</text>${l.unlock ? `<text x="${x(l.souls)}" y="44" class="f-t c s b">${l.souls === 3200 ? L('궁극기', 'Ult') : L(`능력${++unlocks}`, `Ability ${unlocks}`)}</text>` : ''}`
    )
    .join('')}
  <text x="30" y="126" class="f-t s">${L('긴 눈금 = 능력 해금 · 짧은 눈금 = 능력 포인트 +1 (강화 비용 1·2·5) · 모은 영혼 48,600(순자산 49,200)에 32개로 전부 마스터', 'Long tick = unlock · short = +1 point (costs 1·2·5) · all maxed: 32 points at 48,600 Souls earned (49,200 net worth)')}</text>
</svg>`;
  }
  // 전선 구조물: the game's own portraits (panorama/images/npcs, work/map-blender/export_objectives.py)
  // in the order they fall, then where each stands on the map (map-objectives.js).
  const STRUCTS = [
    { kind: 'guardian', img: 'npc-guardian', name: '가디언', where: '전선마다 1개 · 전선 가운데쯤', what: '첫 방어 타워. 가까이 온 적 영웅과 트루퍼를 공격.', souls: '1,375',
      nameEn: 'Guardian', whereEn: '1 per lane · about mid-lane', whatEn: 'The first defense tower. Attacks enemy heroes and troopers that come close.' },
    { kind: 'walker', img: 'npc-walker', name: '워커', where: '전선마다 1개 · 기지 쪽', what: '걸어 다니는 큰 로봇 포탑. 부수면 팀에 플렉스 슬롯 1칸.', souls: '3,675',
      nameEn: 'Walker', whereEn: '1 per lane · toward the base', whatEn: 'A big walking robot turret. Destroying it gives your team 1 Flex slot.' },
    { kind: 'base_guardian', img: '', name: '기지 가디언', where: '기지 입구 · 전선마다', what: '기지 안으로 들어가는 길을 막는 가디언. 부서지면 공격 팀 집라인이 빨라짐.', souls: '1,000',
      nameEn: 'Base Guardian', whereEn: 'Base entrance · each lane', whatEn: 'Guardians blocking the way into the base. Once destroyed, the attacking team gets a faster Zipline.' },
    { kind: 'shrine', img: 'npc-shrine', name: '성지', where: '기지 안 2개', what: '패트런을 지키는 보호막 장치. 2개 모두 부서져야 패트런 공격 가능.', souls: '2,000',
      nameEn: 'Shrine', whereEn: '2 inside the base', whatEn: 'Shield generators guarding the Patron. Both must fall before the Patron can be attacked.' },
    { kind: 'patron', img: 'npc-patron-hiddenking', name: '패트런', where: '기지 한가운데', what: '부수면 승리. 체력 절반부터는 구덩이 안에서만 피해.', souls: '승리',
      nameEn: 'Patron', whereEn: 'Center of the base', whatEn: 'Destroy it to win. From half health it only takes damage from inside the Pit.' }
  ];
  function structuresFigure() {
    return `<div class="sg-structs">${STRUCTS.map(
      (x, i) =>
        `<article class="${x.kind}"><div class="pic">${
          x.img ? `<img src="assets/objectives/${x.img}.png" alt="${L(x.name, x.nameEn)}">` : '<img class="icon" src="assets/objectives/guardian.png" alt="">'
        }<span class="no">${i + 1}</span></div><h5>${L(x.name, x.nameEn)}</h5><p class="where">${L(x.where, x.whereEn)}</p><p>${L(x.what, x.whatEn)}</p><p class="souls">${x.souls === '승리' ? L('부수면 <b>승리</b>', 'Destroy it to <b>win</b>') : L(`영혼 <b>${x.souls}</b>`, `Souls <b>${x.souls}</b>`)}</p></article>`
    ).join('<i class="sg-next" aria-hidden="true">→</i>')}</div>`;
  }
  function farmOrderFigure() {
    const steps = L(
      [
        ['1순위', '전선', ['트루퍼 = 가장 큰 수입', '상대를 수비로 묶음', '집라인 연장·활동 범위']],
        ['2순위', '영혼 슬롯머신', ['8:00 생성·5:00 리스폰', '잭팟 = 영구 능력치', '옆 몹까지 처치']],
        ['3순위', '정글 캠프', ['소형·중형 위주', '대형은 화력 충분할 때', '또는 희생 제물']],
        ['4순위', '상자·황금 조각상', ['지나가는 길에', '근처에 할 게 없을 때']]
      ],
      [
        ['1st', 'Lane', ['Troopers = biggest income', 'Ties the enemy to defense', 'Longer Zipline · more reach']],
        ['2nd', "Sinner's Sacrifice", ['8:00, then every 5:00', 'Jackpot = permanent stats', 'Kill the mobs beside it']],
        ['3rd', 'Jungle camps', ['Mostly small · medium', 'Large with enough damage', 'or Cultist Sacrifice']],
        ['4th', 'Crates · Statues', ['On the way past', 'When nothing else is near']]
      ]
    );
    return `<svg viewBox="0 0 640 214" role="img" aria-label="${L('캐리 중반 파밍 우선순위', 'Carry mid-game farming priority')}">
  <text x="14" y="24" class="f-t b">${L('캐리 중반(10~20분) 파밍 우선순위', 'Carry farming priority in mid-game (10~20 min)')}</text>
  ${steps
    .map(
      ([r, a, lines], i) => `<rect x="${14 + i * 154}" y="40" width="146" height="120" rx="10" class="f-box ${i < 2 ? 'hl' : ''}"/>
  <text x="${87 + i * 154}" y="62" class="f-t c s">${r}</text><text x="${87 + i * 154}" y="84" class="f-t c b">${a}</text>
  ${lines.map((t, j) => `<text x="${87 + i * 154}" y="${108 + j * 18}" class="f-t c s">${t}</text>`).join('')}
  ${i < 3 ? `<path d="M${160 + i * 154} 100 L${168 + i * 154} 100" class="f-arrow"/>` : ''}`
    )
    .join('')}
  <path d="M241 164 C 241 192, 87 192, 87 164" class="f-arrow dash"/><text x="164" y="206" class="f-t c s">${L('전선 밀기 ↔ 영혼 슬롯머신 반복', "Push lane ↔ Sinner's Sacrifice, repeat")}</text>
  <text x="470" y="190" class="f-t c s">${L('영혼 슬롯머신이 없으면 3·4순위로', "No Sacrifice up: go to 3rd · 4th")}</text>
</svg>`;
  }
  // 영혼 슬롯머신 자리만 지도에. 종탑 3대 · 안개 광장 2곳은 위키 기준.
  function invadeFigure() {
    const zone = (x, t, s, cls) => `<rect x="${x}" y="40" width="190" height="130" rx="10" class="f-box"/><text x="${x + 95}" y="60" class="f-t c b">${t}</text><text x="${x + 95}" y="78" class="f-t c s ${cls}">${s}</text>`,
      dot = (x, y, n, t, anchor) => `<circle cx="${x}" cy="${y}" r="11" class="f-dot"/><text x="${x}" y="${y + 4}" class="f-t c b" style="fill:var(--n-50)">${n}</text><text x="${x + (anchor === 'r' ? -16 : 16)}" y="${y + 4}" class="f-t s ${anchor === 'r' ? 'r' : ''}">${t}</text>`;
    return `<svg viewBox="0 0 640 222" role="img" aria-label="${L('앞설 때 정글 동선', 'Jungle route when ahead')}">
  <defs><marker id="sg-ah-inv" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" style="fill:var(--n-700)"/></marker></defs>
  <text x="20" y="24" class="f-t b">${L('앞설 때: 위험한 곳부터 먹고 안전한 쪽으로 빠지기', 'When ahead: farm the risky side first, then fall back to the safe side')}</text>
  ${zone(20, L('아군 정글', 'Your jungle'), L('안전', 'Safe'), 'ok')}${zone(225, L('전선', 'Lane'), L('웨이브', 'Wave'), '')}${zone(430, L('상대 정글', 'Enemy jungle'), L('위험', 'Risky'), 'bad')}
  <path d="M332 100 C 400 100, 470 100, 506 112" class="f-arrow" marker-end="url(#sg-ah-inv)"/>
  <path d="M506 136 C 420 150, 220 150, 128 140" class="f-arrow" marker-end="url(#sg-ah-inv)"/>
  <path d="M116 152 C 170 168, 260 168, 306 158" class="f-arrow dash" marker-end="url(#sg-ah-inv)"/>
  ${dot(320, 100, 1, L('웨이브 밀기', 'Push wave'), 'r')}${dot(518, 124, 2, L('먼저', 'First'), 'r')}${dot(116, 140, 3, L('나중에', 'Later'), 'r')}<text x="314" y="162" class="f-t s">${L('다음 웨이브', 'Next wave')}</text>
  <text x="320" y="190" class="f-t c s">${L('상대 정글 1곳 = 내 영혼 + 상대 몫 감소 → 영혼 격차가 크게 벌어짐', 'One enemy camp = Souls for you + less for them → the Soul gap grows fast')}</text>
  <text x="320" y="210" class="f-t c bad">${L('반대 순서면 파밍이 끝날 때 상대 진영 깊숙이 서 있게 됨', 'In the reverse order you end your farm deep in enemy territory')}</text>
</svg>`;
  }
  // 캐리 vs 서포터 강한 시점. 수치 없는 개념도 (네크로 0:41·8:17).
  function carryFigure() {
    const x = m => 50 + ((m - 5) / 25) * 560;
    return `<svg viewBox="0 0 640 256" role="img" aria-label="${L('캐리와 서포터의 강한 시점 개념도', 'Concept chart: when carries and supports are strong')}">
  <text x="20" y="22" class="f-t b">${L('캐리와 서포터가 강한 시점 (개념도)', 'When carries and supports are strong (concept)')}</text>
  <rect x="${x(10)}" y="34" width="${x(20) - x(10)}" height="146" style="fill:color-mix(in srgb, var(--accent) 8%, transparent)"/>
  <text x="${(x(10) + x(20)) / 2}" y="50" class="f-t c s">${L('중반 10~20분', 'Mid-game 10~20 min')}</text>
  <line x1="50" x2="610" y1="180" y2="180" class="f-axis"/>
  ${[5, 10, 15, 20, 25, 30].map(m => `<text x="${x(m)}" y="198" class="f-t c s">${L(`${m}분`, `${m} min`)}</text>`).join('')}
  <path d="M${x(5)} 120 C ${x(10)} 92, ${x(16)} 84, ${x(30)} 96" class="f-line high"/>
  <path d="M${x(5)} 168 C ${x(12)} 160, ${x(16)} 130, ${x(18)} 92 S ${x(24)} 52, ${x(30)} 46" class="f-line low"/>
  <line x1="${x(18)}" x2="${x(18)}" y1="84" y2="180" class="f-warn" stroke-dasharray="4 4"/>
  <text x="${x(18) + 6}" y="78" class="f-t r b warn">${L('캐리 전성기 → 싸움 합류', 'Carry power spike → join fights')}</text>
  <text x="56" y="222" class="f-t s">${L('전성기 전: 파밍 집중 · 약할 땐 싸우지 않기 · 상대가 선을 넘으면 받아치기', 'Before the spike: focus on farm · avoid fights while weak · punish enemies who overextend')}</text>
  <text x="56" y="246" class="f-t s"><tspan class="leg-low">${L('━ 캐리 (빅터·세븐·레이스)', '━ Carries (Victor·Seven·Wraith)')}</tspan>   <tspan class="leg-high">${L('━ 서포터·로머 (페이지·패러독스·싱클레어·칼리코)', '━ Supports·roamers (Paige·Paradox·Sinclair·Calico)')}</tspan></text>
</svg>`;
  }

  // 최상위 vs 하위 랭크 table for the 시스템 분석 section (strategy-data.js ranks).
  function rankTable() {
    const R = D().ranks,
      fmt = (v, kind) => (kind === 'time' ? mmss(Math.round(v)) : kind === 'pct' ? `${v}%` : kind === 'dec' ? v.toFixed(1) : n(v)),
      row = x => `<tr><td>${esc(L(x.name, x.nameEn))}</td><td><b>${fmt(x.top, x.kind)}</b></td><td>${fmt(x.low, x.kind)}</td></tr>`;
    return `<table class="sg-table sg-ranks"><thead><tr><th></th><th>${L('최상위 랭크', 'Top ranks')}</th><th>${L('하위 랭크', 'Low ranks')}</th></tr></thead><tbody>
<tr class="sub"><td colspan="3">${L('경기 단위 · 시각은 중앙값', 'Per match · times are medians')}</td></tr>${R.match.map(row).join('')}
<tr class="sub"><td colspan="3">${L(`플레이어 1명 평균 (최상위 ${n(R.players.top)}명 · 하위 ${n(R.players.low)}명)`, `Per player average (top ${n(R.players.top)} players · low ${n(R.players.low)} players)`)}</td></tr>${R.player.map(row).join('')}</tbody></table>`;
  }

  // --- Sections (목차 order). Each: id, title, one-line summary, body. ---
  function sections(state) {
    const W = D().worth,
      at9 = 4 * (100 + 2 * 9),
      perMin9 = at9 * 2,
      // Low-rank average at 10:00, between the 9 and 12 minute points.
      at10 = W.low[1] + ((W.low[2] - W.low[1]) * (10 - W.minutes[1])) / (W.minutes[2] - W.minutes[1]);
    const me = state?.live?.local?.souls,
      secs = state?.live?.seconds,
      mark = Number.isFinite(me) && Number.isFinite(secs) && secs > 120 ? { m: Math.min(30, secs / 60), v: me } : null;
    const all = [
      {
        id: 'about',
        key: L(
          ['승리 조건은 킬이 아니라 상대 기지의 <b>패트런</b> 파괴', '영혼 = 돈 + 경험치. 많이 번 쪽이 강함', '전선 3개(노랑·파랑·초록), 전선 사이 건물 안팎이 정글'],
          [
            'You win by destroying the <b>Patron</b> in the enemy base, not by kills',
            'Souls = money + experience. Whoever earns more is stronger',
            '3 lanes (yellow · blue · green); the jungle is in and around the buildings between them'
          ]
        ),
        title: L('데드락은 어떤 게임인가', 'What is Deadlock'),
        short: L('6대6 3인칭 슈터 + MOBA', '6v6 third-person shooter + MOBA'),
        body: L(`<p><b>데드락(Deadlock)</b>은 밸브(Valve)가 만드는 6대6 <b>3인칭 슈터와 MOBA를 섞은 게임</b>입니다. 총을 직접 조준해 쏘고, 영웅마다 능력 4개(4번째가 궁극기)를 씁니다. 리그 오브 레전드·도타처럼 전선에 트루퍼(미니언)가 계속 나오고, 그걸 잡아 얻은 영혼으로 아이템을 사서 강해집니다. 아직 정식 출시 전(초대제 테스트)이라 패치가 잦습니다. ${wiki('Deadlock', '출처')}</p>
<div class="sg-two">
<div><b>이기는 법</b><p>상대 기지 안의 <b>패트런</b>을 부수면 승리. 킬 수가 아니라 구조물로 승부가 납니다. 킬은 영혼을 벌고 상대를 잠깐 지우는 수단일 뿐입니다.</p></div>
<div><b>영혼 = 돈 + 경험치</b><p>영혼으로 상점에서 아이템을 사고, 쌓인 영혼(순자산)에 따라 능력이 해금되고 능력 포인트가 생깁니다. 그래서 "영혼을 많이 번 쪽이 강하다"가 이 게임의 기본입니다.</p></div>
<div><b>슈터로서의 차이</b><p>헤드샷·이동 기술(활주·대시·벽 점프)·엄폐가 그대로 실력입니다. 능력보다 무기 위주 빌드, 그 반대 빌드가 모두 있습니다.</p></div>
<div><b>MOBA로서의 차이</b><p>막타를 놓쳐도 근처에만 있으면 영혼을 나눠 받고, 공중에 뜬 영혼 구슬을 총으로 쏴서 확정·디나이합니다(<a href="#sg-rules">영혼 규칙</a>).</p></div>
</div>
<h4>맵: 커스드 애플(뉴욕)</h4>
<p>맨해튼을 닮은 맵 하나에서 모든 경기를 합니다. 전선(라인)은 3개: <b>노란색 전선</b>(요크)·<b>파란색 전선</b>(브로드웨이, 가운데)·<b>초록색 전선</b>(그리니치). 2025년 2월 맵 개편 전에는 전선 4개(보라색 전선 포함)였으니 오래된 영상은 감안해서 보세요. 전선마다 자기 색 집라인이 기지에서 적 기지 쪽으로 깔려 있어 빠르게 전선에 복귀할 수 있습니다. ${wiki('Map', '출처')}</p>
<p>두 팀은 히든 킹(주황, 공장 기지)과 아치마더(파랑, 박물관 기지)입니다. 전선 사이 건물 안팎이 정글(중립 캠프·상자·영혼 슬롯머신)이고, 가운데 파란색 전선 지하 하수도에 <b>중앙 보스</b>가 있습니다.</p>`, `<p><b>Deadlock</b> is a 6v6 game from Valve that <b>mixes a third-person shooter with a MOBA</b>. You aim and shoot your gun yourself, and every hero has 4 abilities (the 4th is the ultimate). As in League of Legends or Dota, Troopers (minions) keep coming down the lanes, and the Souls you get for killing them buy items that make you stronger. The game is not fully released yet (invite-only test), so patches are frequent. ${wiki('Deadlock', 'Source')}</p>
<div class="sg-two">
<div><b>How to win</b><p>Destroy the <b>Patron</b> inside the enemy base. Games are decided by structures, not by kill count. Kills are only a way to earn Souls and take enemies off the map for a while.</p></div>
<div><b>Souls = money + experience</b><p>You spend Souls on items in the shop, and the Souls you have piled up (net worth) unlock abilities and give ability points. So "the side that earns more Souls is stronger" is the basic rule of the game.</p></div>
<div><b>As a shooter</b><p>Headshots, movement (Slide, Dash, wall jump) and cover count as skill, just as in any shooter. There are gun-heavy builds and ability-heavy builds.</p></div>
<div><b>As a MOBA</b><p>Miss the last hit and you still share the Souls just by being nearby, and you shoot the soul orbs floating in the air to secure or deny them (<a href="#sg-rules">Soul rules</a>).</p></div>
</div>
<h4>Map: Cursed Apple (New York)</h4>
<p>Every game is played on one map modeled on Manhattan. There are 3 lanes: the <b>Yellow lane</b> (York) · <b>Blue lane</b> (Broadway, center) · <b>Green lane</b> (Greenwich). Before the February 2025 map rework there were 4 lanes (including a Purple lane), so keep that in mind with older videos. Each lane has a Zipline in its own color running from your base toward the enemy base, so you can get back to lane fast. ${wiki('Map', 'Source')}</p>
<p>The two teams are the Hidden King (orange, factory base) and the Archmother (blue, museum base). The jungle (neutral camps · crates · Sinner's Sacrifice) is in and around the buildings between lanes, and the <b>Mid-Boss</b> sits in the sewers under the Blue lane in the center.</p>`)
      },
      {
        id: 'macro',
        key: L(
          ['<b>0~10분</b> 라인전·파밍 → 상대 가디언 먼저', '<b>10~25분</b> 영혼 단지·균열·중앙 보스 싸움 → 워커', '<b>25분~</b> 기지 가디언 → 성지 2개 → 패트런. 한타를 이기면 바로 구조물로'],
          [
            '<b>0~10 min</b> laning · farming → enemy Guardian first',
            '<b>10~25 min</b> fights over the Soul Urn · Rift · Mid-Boss → Walker',
            '<b>25 min~</b> Base Guardians → 2 Shrines → Patron. Win a team fight, go straight to structures'
          ]
        ),
        title: L('경기 큰 흐름', 'How a match flows'),
        short: L('라인전 → 오브젝트 싸움 → 기지 공략', 'Laning → objective fights → base push'),
        body: L(`<h4>전선 구조물</h4>
<p>전선마다 아래 순서로 구조물이 서 있고, 앞의 것을 부숴야 다음 것을 칠 수 있습니다. 숫자는 부쉈을 때 팀이 받는 영혼. ${wiki('Map', 'Map')} ${wiki('Shrine', 'Shrine')} ${wiki('Patron', 'Patron')}</p>
${structuresFigure()}
<p class="note">각 구조물이 어디 서 있는지는 <button class="sg-link" data-page="atlas">전체 지도</button>에서 확대해 볼 수 있습니다.</p>
<h4>시간대별 흐름</h4>
<table class="sg-table steps"><tbody>
<tr><td>초반 0~10분</td><td><b>라인전과 파밍.</b> 웨이브를 놓치지 않고, 웨이브 사이에 가까운 정글·상자를 먹습니다. 6분 무렵 순자산 3,800에서 궁극기가 열리면서 첫 싸움들이 납니다. 목표는 상대 <b>가디언</b>을 먼저 깨는 것.</td></tr>
<tr><td>중반 10~25분</td><td><b>맵 이벤트 싸움.</b> 10분 영혼 단지, 11:20~13:20 첫 균열이 열리고, 처음부터 있던 중앙 보스(처치 후 7분 → 6분 → 5분마다 부활)를 두고 싸웁니다. 중앙 보스를 잡으면 소생의 보석: 수정을 강한 근거리 공격으로 치면 최대 3명이 3분 안에 한 번, 죽은 자리에서 3초 뒤 체력 가득 부활. 이벤트 30초 전에 전선을 밀어 두고 모이는 팀이 이깁니다. 한타를 이기면 바로 <b>워커</b>로.</td></tr>
<tr><td>후반 25분~</td><td><b>기지 공략.</b> 기지 가디언 한 쌍을 깨면 성지를 칠 수 있고, 성지 2개를 깨면 패트런을 칠 수 있습니다. 부활 시간이 길어져 한타 한 번 지면 기지까지 밀립니다. 혼자 죽지 않는 것이 가장 중요합니다.</td></tr>
</tbody></table>
<h4>패트런 2단계</h4>
<p>패트런은 체력 12,000에 레이저(초당 440 + 체력 5%)로 기지를 지킵니다. 체력 절반을 깎으면 구슬로 무너져 <b>약해진 패트런</b>이 되는데, 이때는 <b>구덩이 안에 들어가야만</b> 피해가 들어갑니다. 수비 팀이 구덩이에 2명 이상 들어가 있으면 피해가 아예 안 들어가니, 마지막은 구덩이 안 싸움입니다. ${wiki('Patron', '출처')}</p>
<h4>캐리와 서포터의 중반</h4>
${fig(carryFigure(), `개념도 · 영웅 분류와 운영 출처 ${yt('mGn4T4B4cdY', '0:41', '네크로 0:41')}`)}
<ul class="sg-list">
<li><b>캐리</b>(빅터·세븐·레이스): 아이템이 쌓일수록 강해지고 그 전엔 약함. 중반 목표는 <b>전성기를 최대한 앞당기기</b>. 동선을 줄여 파밍 효율을 끝까지 올립니다. 파밍 순서는 <a href="#sg-jungle">정글</a> 참고.</li>
<li><b>서포터·로머</b>(페이지·패러독스·싱클레어·칼리코): 중반에 강함. 싸움을 열고 돌아다니며 킬을 만듭니다. 에이브럼스처럼 중간인 영웅은 조합과 상황을 보고 역할 선택.</li>
<li>캐리가 약할 때 싸우면 이겨도 성장이 늦어지고, 지면 더 늦어집니다. 다만 상대가 선을 넘어 들어오면 받아치기. 전성기가 오면 파밍을 줄이고 싸움에 합류(${yt('mGn4T4B4cdY', '8:17', '네크로 8:17')}).</li>
</ul>
<h4>큰 그림에서 지켜야 할 것</h4>
<ul class="sg-list">
<li><b>모든 전선을 비우지 않기.</b> 싸우러 모일 때도 각 전선 웨이브는 상대 쪽으로 밀어 둡니다. 비운 전선의 구조물은 트루퍼만으로도 깎입니다.</li>
<li><b>킬보다 구조물.</b> 한타를 이겼는데 아무것도 안 부수면 상대는 부활해서 그대로입니다. 이긴 직후 가장 가까운 가디언·워커·보스로.</li>
<li><b>지고 있으면 영혼으로 버티기.</b> 지는 팀은 영혼을 최대 26% 더 받으니(<a href="#sg-rules">영혼 규칙</a> 6번), 무리한 싸움보다 파밍과 수비가 낫습니다.</li>
<li><b>Tab 점수판</b>으로 누가 가장 잘 컸는지, 적 궁극기가 열렸는지를 보고 싸울지 정합니다. Lookout Tab 패널이 순자산과 적 궁극기 해금을 보여줍니다.</li>
</ul>`, `<h4>Lane structures</h4>
<p>Each lane has structures standing in the order below, and you must destroy one before you can hit the next. The number is the Souls your team gets for destroying it. ${wiki('Map', 'Map')} ${wiki('Shrine', 'Shrine')} ${wiki('Patron', 'Patron')}</p>
${structuresFigure()}
<p class="note">Zoom in on the <button class="sg-link" data-page="atlas">Full map</button> to see where each structure stands.</p>
<h4>Flow by time</h4>
<table class="sg-table steps"><tbody>
<tr><td>Early 0~10 min</td><td><b>Laning and farming.</b> Don't miss waves, and take nearby jungle and crates between waves. Around 6 min the ultimate unlocks at 3,800 net worth and the first fights break out. The goal is to break the enemy <b>Guardian</b> first.</td></tr>
<tr><td>Mid 10~25 min</td><td><b>Fights over map events.</b> The Soul Urn arrives at 10 min and the first Rift opens at 11:20~13:20, and teams fight over the Mid-Boss, which is there from the start (respawns 7 min → 6 min → 5 min after each kill). Killing the Mid-Boss drops the Rejuvenator: hit its crystal with a heavy melee and up to 3 heroes revive once within 3 min, at full health, 3 sec after dying, where they fell. The team that pushes its lanes and gathers 30 sec before an event wins it. Win the team fight, then go straight to the <b>Walker</b>.</td></tr>
<tr><td>Late 25 min~</td><td><b>Base push.</b> Break the pair of Base Guardians to hit the Shrines, and break both Shrines to hit the Patron. Respawn timers get long, so one lost team fight can push you back to your base. Not dying alone matters most.</td></tr>
</tbody></table>
<h4>The Patron's two phases</h4>
<p>The Patron has 12,000 health and guards the base with a laser (440 per sec + 5% of health). Take half its health and it collapses into an orb, the <b>Weakened Patron</b>, which only takes damage <b>from inside the Pit</b>. With 2 or more defenders in the Pit it takes no damage at all, so the end is a fight inside the Pit. ${wiki('Patron', 'Source')}</p>
<h4>Carries and supports in mid-game</h4>
${fig(carryFigure(), `Concept chart · hero roles and strategy ${yt('mGn4T4B4cdY', '0:41', '네크로 0:41', 'Necro 0:41')}`)}
<ul class="sg-list">
<li><b>Carries</b> (Victor, Seven, Wraith): get stronger as items stack up and are weak before that. The mid-game goal is to <b>reach the power spike as early as possible</b>. Cut down travel to keep farming efficient to the end. For farming order, see <a href="#sg-jungle">Jungle</a>.</li>
<li><b>Supports · roamers</b> (Paige, Paradox, Sinclair, Calico): strong in mid-game. They start fights and roam to make kills. In-between heroes like Abrams pick a role by team comp and situation.</li>
<li>A carry who fights while weak grows slower even after a win, and slower still after a loss. Still, punish enemies who overextend. Once the spike comes, farm less and join fights (${yt('mGn4T4B4cdY', '8:17', '네크로 8:17', 'Necro 8:17')}).</li>
</ul>
<h4>The big picture</h4>
<ul class="sg-list">
<li><b>Never leave every lane empty.</b> Even when gathering for a fight, push each lane's wave toward the enemy. Structures in an empty lane get worn down by Troopers alone.</li>
<li><b>Structures over kills.</b> Win a team fight and destroy nothing, and the enemy just respawns as before. Right after a win, go to the nearest Guardian, Walker or boss.</li>
<li><b>When behind, hold on with Souls.</b> The losing team gets up to 26% more Souls (<a href="#sg-rules">Soul rules</a> no. 6), so farming and defending beat forced fights.</li>
<li>Use the <b>Tab scoreboard</b> to see who has grown most and whether enemy ultimates are up, then decide whether to fight. The Lookout Tab panel shows net worth and enemy ultimate unlocks.</li>
</ul>`)
      },
      {
        id: 'summary',
        title: L('처음이라면 이것만', 'New? Start here'),
        short: L('30초 요약 · 이것만 지켜도 영혼이 오름', '30-sec summary · these alone raise your Souls'),
        body: L(`<ol class="sg-big">
<li><b>웨이브는 30초마다 옵니다.</b> 9분 기준 한 웨이브가 ${n(at9)} 영혼, 혼자 먹으면 분당 ${n(perMin9)}. 전선을 비우면 이게 그대로 사라집니다.</li>
<li><b>공중 구슬을 쏘세요.</b> 트루퍼 값의 절반이 공중에 뜹니다. 상대가 먼저 쏘면 그 몫을 뺏깁니다. 재장전 중이면 근거리 공격으로 막타.</li>
<li><b>웨이브를 밀고 남는 15초에 캠프·상자 1곳.</b> 랭크 차이는 전선이 아니라 여기서 납니다(15분 정글 1,175 vs 1,740).</li>
<li><b>전선에 둘이 서 있으면 각자 54%.</b> 캐리는 혼자 먹을 전선으로, 셋 이상 몰려다니지 않기.</li>
<li><b>정글 영혼을 들고 죽지 마세요.</b> 정글·상자·영혼 슬롯머신 영혼은 "미확보"라 죽으면 떨어뜨립니다. 살 수 있으면 바로 사기.</li>
</ol>${callout('tip', 'Lookout으로 확인하기', '오버레이의 <b>내 성장</b> 줄이 다음 능력 포인트·궁극기까지 남은 영혼을 보여줍니다. 이 페이지의 <a href="#sg-diagnose">영혼 진단</a>은 지금 내 순자산을 랭크 평균과 비교합니다.')}`, `<ol class="sg-big">
<li><b>Waves come every 30 sec.</b> At 9 min one wave is worth ${n(at9)} Souls, ${n(perMin9)} per min if you take it alone. Leave the lane empty and all of that is lost.</li>
<li><b>Shoot the floating orbs.</b> Half of a Trooper's value floats into the air. If the enemy shoots it first, they take that share. While reloading, last hit with melee.</li>
<li><b>Push the wave, then spend the spare 15 sec on one camp or crate.</b> Ranks pull apart here, not in the lane (jungle by 15 min: 1,175 vs 1,740).</li>
<li><b>Two in one lane get 54% each.</b> Send the carry to a lane they can farm alone, and don't roam in groups of three or more.</li>
<li><b>Don't die holding jungle Souls.</b> Souls from the jungle, crates and Sinner's Sacrifice are "unsecured" and drop when you die. Spend them as soon as you can buy something.</li>
</ol>${callout('tip', 'Check it with Lookout', "The overlay's <b>My growth</b> row shows the Souls left to your next ability point and ultimate. The <a href=\"#sg-diagnose\">Soul check</a> on this page compares your current net worth with rank averages.")}`)
      },
      {
        id: 'basics',
        key: L(
          [
            '구조물 피해 저항은 시간이 갈수록 낮아짐(가디언 6분, 워커 9분에 0%) → 최상위 랭크 첫 가디언 6:22, 하위 7:52',
            '부활 시간은 5분 8초 → 30분 70초. 초반 죽음은 싸서 최상위는 15분까지 더 죽고도 순자산 1.3k 앞섬',
            '차이는 킬이 아니라 정글(+576)과 구조물·보스. 첫 중앙 보스 18분 vs 27분'
          ],
          [
            'Structure damage resistance drops over time (0% at 6 min for Guardians, 9 min for Walkers) → first Guardian at 6:22 in top ranks, 7:52 in low ranks',
            'Respawn takes 8 sec at 5 min → 70 sec at 30 min. Early deaths are cheap: top ranks die more by 15 min and are still 1.3k ahead in net worth',
            'The gap comes from the jungle (+576) and structures · bosses, not kills. First Mid-Boss at 18 vs 27 min'
          ]
        ),
        title: L('시스템 분석: 고수는 규칙을 어떻게 쓰나', 'System analysis: how top players use the rules'),
        short: L('랭크별 경기 데이터로 본 운영', 'Strategy seen through match data by rank'),
        body: L(`<p>데드락의 규칙은 시간에 따라 바뀝니다. 구조물 저항은 낮아지고, 부활 시간은 길어지고, 웨이브 주기는 짧아집니다. 고수일수록 이 변화에 맞춰 움직입니다. 아래는 최근 일반전에서 <b>최상위 랭크</b>(11단계, 랭크 경기의 약 2%)와 <b>하위 랭크</b>(1~3단계)를 비교한 결과입니다. 공개 데이터에는 대회 경기가 없어서, 프로 대부분이 섞여 있는 최상위 랭크로 대신 봤습니다.${src('https://api.deadlock-api.com/docs', 'deadlock-api', `deadlock-api.com · 일반전 경기 데이터 (${D().ranks.checked} 조회, 최상위 ${n(D().ranks.games.top)}판 · 하위 ${n(D().ranks.games.low)}판)`)}</p>
${rankTable()}
<h4>구조물은 시간이 갈수록 약해진다</h4>
<ul class="sg-list">
<li><b>규칙</b> 가디언 피해 저항은 50%에서 시작해 12분에 -50%까지 낮아짐(6분에 0%). 반경 24m 안에 적 트루퍼나 영웅이 없으면 무적.${wiki('Lane_Guardian', 'Lane Guardian')} 워커는 65%에서 18분에 -65%(9분에 0%). 웨이브가 워커에 닿기 전 영웅이 치면 피해 65% 감소 + 초당 65 회복(백도어 보호), 22m 안에 적이 없으면 무적.${wiki('Walker', 'Walker')}</li>
<li><b>최상위의 사용법</b> 저항이 0이 되는 6분 전후에 웨이브를 붙여 가디언을 칩니다. 첫 가디언 6:22(하위보다 1분 30초 빠름), 10분까지 양 팀 합쳐 3.6개(하위 2.1개). 워커는 저항이 0이 된 뒤 웨이브를 붙여서. 첫 워커 13:39(하위 15:47).</li>
<li><b>트루퍼가 구조물 피해의 약 40%</b>(가디언 기준 최상위 ${D().ranks.trooperDamage.guardian[0]}%, 하위 ${D().ranks.trooperDamage.guardian[1]}%). 웨이브 없이 영웅만 치면 그만큼 느리고, 워커는 백도어 보호까지 받습니다.</li>
</ul>
<h4>초반 죽음은 싸고 후반 죽음은 비싸다</h4>
<ul class="sg-list">
<li><b>규칙</b> 부활 시간은 5분 8초 → 20분 38초 → 30분 70초 → 40분 85초(최대 90초). 10분 이후 순자산이 15% 이상 앞선 채 죽으면 6~22초 추가.${wiki('Respawn', 'Respawn')}</li>
<li><b>최상위의 사용법</b> 15분까지 더 많이 죽고(2.7회, 하위 2.3회) 죽어서 떨어뜨린 영혼도 더 많지만(313, 하위 185), 순자산은 1,297 많습니다. 8초 부활을 내주고 가디언·캠프를 가져오는 교환이기 때문입니다.</li>
<li><b>그래서</b> 초반 1:1 교환은 그 사이 구조물·캠프를 챙기면 이득. 20분이 넘으면 한 번 죽을 때 웨이브 2~3개와 구조물이 같이 날아가니 혼자 죽지 않기가 먼저.</li>
</ul>
<h4>영혼은 근처에 있는 사람이 나눠 갖는다</h4>
<ul class="sg-list">
<li><b>규칙</b> 전선 배정은 팀당 2-2-2. 한 전선에 둘이 있으면 각자 54%. 웨이브는 20분까지 30초, 20~35분 25초, 35분부터 20초마다.${wiki('Trooper', 'Trooper')}</li>
<li><b>최상위의 사용법</b> 잡을 수 있던 트루퍼 중 72.4%를 처치(하위 66.7%)하고, 웨이브 사이에 정글 캠프로 15분까지 576을 더 법니다. 영웅 처치 영혼 차이는 161로 작습니다. 격차는 킬이 아니라 <b>웨이브 사이 30초를 어떻게 쓰느냐</b>에서 납니다.</li>
<li><b>그래서</b> 웨이브를 밀고 둘 중 하나는 정글로. 둘이 붙어 서 있는 시간이 길수록 108%를 둘이 나눠 갖는 셈입니다(<a href="#sg-rules">영혼 규칙</a>).</li>
</ul>
<h4>중앙 보스는 잡는 것보다 가져가는 것</h4>
<ul class="sg-list">
<li><b>규칙</b> 처치 후 7분 → 6분 → 5분마다 부활. 소생의 보석은 수정을 강한 근거리 공격으로 깬 팀이 가져가서, 잡은 팀과 가져간 팀이 다를 수 있습니다.</li>
<li><b>최상위의 사용법</b> 첫 보스 18:18(하위 27:18, 9분 빠름). 보석을 상대가 가로챈 비율 16.1%(하위 8.3%), 보스를 끝까지 다툽니다. 보석을 가져간 팀은 3분 안에 구조물을 하나 이상 부순 경우가 ${D().ranks.bossNext.pct[0]}%, 승률 ${D().ranks.bossNext.win[0]}%.</li>
<li><b>그래서</b> 보스 체력이 낮아지면 딜보다 수정 앞 자리싸움. 보석을 가져왔으면 바로 가장 가까운 워커·기지 가디언으로.</li>
</ul>
<h4>집라인은 밀어 둔 만큼만 탄다</h4>
<ul class="sg-list">
<li><b>규칙</b> 아군 트루퍼가 밀어 둔 지점까지만 탈 수 있음. 바깥 전선 초속 21m, 가운데 18m. 6분부터 F로 32초간 +80%(재사용 6분). 적 영웅·구조물에게 맞으면 3초간 못 타고, 탄 지 3초 안에 맞으면 떨어지면서 최대 체력 15% 피해 + 2.5초 기절. 기지 가디언을 부수면 그 전선 집라인이 영구 +80%.${wiki('Ziplines', 'Ziplines')}</li>
<li><b>그래서</b> 웨이브를 밀어 둔 상태가 곧 집라인이 길어진 상태. 고수가 한타에 제때 오는 건 무빙이 빨라서라기보다 <b>전선을 먼저 밀어 두고 출발하기</b> 때문입니다.${dc(176674, '유입들이 왜 자꾸 무빙 타령하는지')} 가속은 6분에 한 번이라 영혼 단지(5분 주기)·중앙 보스 합류용으로 아끼고, 적 근처에서는 막 올라타지 않기.</li>
</ul>
<h4>앞서면 얼마나 이기나</h4>
<p>15분에 팀 순자산이 ${D().ranks.lead.map(x => `${x.gap} 앞서면 승률 약 ${x.win}%`).join(', ')}. 랭크와 상관없이 비슷합니다. 거꾸로 8k 넘게 뒤져도 6판 중 1판은 뒤집힙니다. 지는 팀은 영혼을 최대 26% 더 받고(<a href="#sg-rules">영혼 규칙</a> 6번) 앞선 팀은 부활이 길어지니, 뒤질 땐 무리한 싸움보다 파밍·수비로 버티다 보스·워커 한 번을 노리기.</p>`, `<p>Deadlock's rules change over time. Structure resistance drops, respawn timers grow and waves come faster. The better the player, the more they move with these changes. Below, <b>top ranks</b> (rank 11, about the top 2% of ranked games) are compared with <b>low ranks</b> (ranks 1~3) in recent normal games. Public data has no tournament games, so top ranks, where most pros play, stand in for them.${src('https://api.deadlock-api.com/docs', 'deadlock-api', `deadlock-api.com · normal match data (checked ${D().ranks.checked}, top ${n(D().ranks.games.top)} games · low ${n(D().ranks.games.low)} games)`)}</p>
${rankTable()}
<h4>Structures get weaker over time</h4>
<ul class="sg-list">
<li><b>Rule</b> Guardian damage resistance starts at 50% and drops to -50% by 12 min (0% at 6 min). Invulnerable with no enemy Troopers or heroes within 24m.${wiki('Lane_Guardian', 'Lane Guardian')} Walkers go from 65% to -65% at 18 min (0% at 9 min). If heroes hit a Walker before the wave reaches it, it takes 65% less damage and regenerates 65 per sec (backdoor protection); invulnerable with no enemies within 22m.${wiki('Walker', 'Walker')}</li>
<li><b>How top players use it</b> They bring a wave to the Guardian around 6 min, when its resistance hits 0. First Guardian at 6:22 (1 min 30 sec earlier than low ranks), 3.6 down across both teams by 10 min (low ranks: 2.1). Walkers come after their resistance hits 0, with a wave. First Walker at 13:39 (low ranks: 15:47).</li>
<li><b>Troopers deal about 40% of structure damage</b> (on Guardians: top ${D().ranks.trooperDamage.guardian[0]}%, low ${D().ranks.trooperDamage.guardian[1]}%). Heroes hitting without a wave are that much slower, and Walkers also get backdoor protection.</li>
</ul>
<h4>Early deaths are cheap, late deaths are expensive</h4>
<ul class="sg-list">
<li><b>Rule</b> Respawn takes 8 sec at 5 min → 38 sec at 20 min → 70 sec at 30 min → 85 sec at 40 min (max 90 sec). After 10 min, dying while 15% or more ahead in net worth adds 6~22 sec.${wiki('Respawn', 'Respawn')}</li>
<li><b>How top players use it</b> By 15 min they die more (2.7 times, low ranks 2.3) and drop more Souls on death (313, low ranks 185), yet have 1,297 more net worth. They trade an 8-sec respawn for a Guardian or a camp.</li>
<li><b>So</b> an early 1-for-1 trade pays off if you take structures or camps meanwhile. After 20 min one death costs 2~3 waves plus structures, so not dying alone comes first.</li>
</ul>
<h4>Souls are shared by whoever is nearby</h4>
<ul class="sg-list">
<li><b>Rule</b> Lanes are split 2-2-2 per team. Two in one lane get 54% each. Waves come every 30 sec until 20 min, every 25 sec at 20~35 min and every 20 sec from 35 min.${wiki('Trooper', 'Trooper')}</li>
<li><b>How top players use it</b> They kill 72.4% of the Troopers they could have killed (low ranks 66.7%) and earn 576 more from jungle camps between waves by 15 min. The gap in hero kill Souls is small, 161. The gap comes not from kills but from <b>how the 30 sec between waves are spent</b>.</li>
<li><b>So</b> push the wave, and one of the two goes to the jungle. The longer two stand together, the more it is two players splitting 108% (<a href="#sg-rules">Soul rules</a>).</li>
</ul>
<h4>The Mid-Boss is about taking, not killing</h4>
<ul class="sg-list">
<li><b>Rule</b> Respawns 7 min → 6 min → 5 min after each kill. The Rejuvenator goes to the team that breaks its crystal with a heavy melee, so the team that killed the boss and the team that takes it can differ.</li>
<li><b>How top players use it</b> First boss at 18:18 (low ranks 27:18, 9 min earlier). The other team steals the Rejuvenator 16.1% of the time (low ranks 8.3%): they contest the boss to the end. The team that takes the Rejuvenator destroys at least one structure within 3 min in ${D().ranks.bossNext.pct[0]}% of games, with a ${D().ranks.bossNext.win[0]}% win rate.</li>
<li><b>So</b> when the boss gets low, fight for position in front of the crystal rather than for damage. Once you have the Rejuvenator, go straight to the nearest Walker or Base Guardian.</li>
</ul>
<h4>You ride the Zipline only as far as you pushed</h4>
<ul class="sg-list">
<li><b>Rule</b> You can only ride up to where your Troopers have pushed. 21m per sec on outer lanes, 18m in the center. From 6 min, F gives +80% for 32 sec (6-min cooldown). When an enemy hero or structure hits you, you can't ride for 3 sec, and if you are hit within 3 sec of getting on you fall off, taking 15% of max health and a 2.5-sec stun. Destroying a Base Guardian gives that lane's Zipline a permanent +80%.${wiki('Ziplines', 'Ziplines')}</li>
<li><b>So</b> a pushed wave is a longer Zipline. Top players reach team fights on time not because their movement is faster, but because <b>they push the lane first and then leave</b>.${dc(176674, '유입들이 왜 자꾸 무빙 타령하는지', 'Why newcomers keep blaming movement')} The boost comes once every 6 min, so save it for joining the Soul Urn (5-min cycle) or Mid-Boss, and don't hop on carelessly near enemies.</li>
</ul>
<h4>How often does a lead win</h4>
<p>At 15 min, a team net worth lead of ${D().ranks.lead.map(x => `${x.gapEn || x.gap} wins about ${x.win}%`).join(', ')}. This holds across ranks. Then again, even 8k+ behind, 1 game in 6 turns around. The losing team gets up to 26% more Souls (<a href="#sg-rules">Soul rules</a> no. 6) and the leading team respawns slower, so when behind, hold on by farming and defending, then go for one boss or Walker.</p>`)
      },
      {
        id: 'rules',
        key: L(
          ['근처(구슬 45m·처치자 30m)에만 있어도 분배. 둘이면 각자 54%', '바닥 구슬 50% + 공중 구슬 50%. 공중 구슬은 쏴서 확정·디나이', '정글·상자·영혼 슬롯머신 영혼은 미확보 → 들고 죽으면 떨어뜨림'],
          [
            'Just being nearby (45m from the orb · 30m from the killer) gets you a share. Two nearby get 54% each',
            'Ground orbs 50% + floating orbs 50%. Shoot floating orbs to secure or deny them',
            "Souls from the jungle, crates and Sinner's Sacrifice are unsecured → die holding them and you drop them"
          ]
        ),
        title: L('데드락 영혼 규칙', 'Deadlock Soul rules'),
        short: L('다른 MOBA와 다른, 게임에 정해진 규칙', 'Rules set by the game, unlike other MOBAs'),
        body: L(`<p>데드락의 트루퍼(크립) 영혼은 <b>막타를 누가 쳤는지보다 근처에 누가 있었는지</b>로 나뉩니다. 리그 오브 레전드처럼 막타를 놓쳤다고 0이 되지 않습니다.</p>
${fig(orbFigure(), `트루퍼 한 마리의 영혼이 나뉘는 방식 · 출처 ${wiki('Souls#Soul_Orbs', 'deadlock.wiki/Souls')} (2026-06-30 패치로 바닥·공중 50:50)`)}
<h4>1. 근처에만 있어도 나눠 받습니다</h4>
<p>트루퍼가 죽을 때 <b>깨진 구슬에서 45m</b> 또는 <b>처치한 영웅에게서 30m</b> 안에 있는 아군 영웅이 모두 몫을 나눕니다. 막타를 내가 쳤든, 아군 트루퍼나 타워가 쳤든 상관없이, 근처에만 있으면 들어옵니다.</p>
${fig(shareFigure(), `근처 영웅 수에 따른 1인당 몫 · 출처 ${dc(146394, 'DC 트루퍼 영혼 분배표')} / ${wiki('Souls#Local_Soul_Sharing', 'deadlock.wiki')}`)}
<p class="sg-example"><b>예시 (9분)</b> 웨이브 한 번 = ${n(at9)} 영혼. 혼자면 ${n(at9)}, 둘이면 각자 ${n(at9 * 0.54)}, 셋이면 각자 ${n(at9 * 0.36)}. 둘이 한 전선에 1분 서 있으면 각자 분당 약 ${n(perMin9 - perMin9 * 0.54)} 영혼을 덜 법니다.</p>
<h4>2. 영혼 구슬: 바닥 구슬 · 공중 구슬</h4>
<ul><li><b>바닥 구슬 (50%)</b> 디나이할 수 없고, 가까이 가면 알아서 날아옵니다. 대신 18초(10분 이후 40초) 안에 가야 합니다. 멀리서 능력으로만 전선을 밀면 이걸 놓칩니다.</li>
<li><b>공중 구슬 (50%)</b> 떠오른 구슬이 빛나면 총알 한 발로 확정됩니다(맞힌 총알은 탄창에 돌려받음). 아무도 안 쏘면 약 1초 뒤 근처 아군에게 자동으로 들어가지만, <b>근처에 아무도 없으면 사라집니다.</b></li></ul>
<h4>3. 확정(컨펌)과 디나이</h4>
<p>내 구슬은 초록, 적 구슬은 주황으로 보입니다. 적 구슬을 먼저 쏘면 그 몫을 내가 가져갑니다(디나이). 상대가 전선에 있으면 공중 구슬을 바로 쏘는 습관이 곧 영혼입니다.</p>
<h4>4. 근거리 공격 막타</h4>
<p>트루퍼를 근거리 공격으로 마무리하면 공중 구슬이 뜨지 않고 그 몫이 <b>바로 내 것</b>이 됩니다. 상대가 디나이할 수 없습니다. 재장전 중이거나 상대가 나를 안 볼 때 쓰세요.</p>
${callout('note', '위키 문서끼리 다른 부분', `${wiki('Trooper', 'Trooper 문서', true)}는 "근거리 공격 막타면 100% 즉시 지급", ${wiki('Souls#Soul_Orbs', 'Souls 문서', true)}는 "바닥 구슬은 그대로 떨어지고 나머지만 즉시 지급"이라고 씁니다. 어느 쪽이든 디나이당할 몫이 없어진다는 점은 같습니다.`)}
<h4>요약</h4>
<div class="sg-two"><div><b>상대가 전선에 없을 때</b><p>억지로 막타·구슬을 하나하나 쏘지 않아도 근처에만 있으면 다 들어옵니다. 떨어진 바닥 구슬 근처에만 머무세요.</p></div><div><b>상대가 전선에 있을 때</b><p>떠오르는 공중 구슬을 바로 쏘거나 근거리 공격 막타. 상대 구슬은 쏴서 디나이.</p></div></div>
<h4>5. 정글·상자·영혼 슬롯머신 영혼은 "미확보"</h4>
<p>이 영혼은 초당 (보유량의 0.5% + 1.6)씩 확보로 바뀝니다. 예: 10분에 1,000을 들고 있으면 초당 약 7.9씩. 죽을 때 미확보 영혼이 50 + 분당 5 이상 남아 있으면 영혼 가방으로 떨어지고(3분 유지), 누구나 강한 근거리 공격으로 주울 수 있습니다. 그보다 적으면 사라집니다. ${wiki('Unsecured', '출처')}</p>
<h4>6. 지는 팀 보정</h4>
<p>팀 순자산이 뒤지면 트루퍼·정글·영혼 슬롯머신·오브젝트 영혼을 최대 26% 더 받습니다(차이 20%에서 최대, 처음 3k 차이는 무시). 팀 평균보다 강한 적을 잡으면 처치 보상이 최대 +126.8%. ${wiki('Comeback', '출처')}</p>`, `<p>In Deadlock, Trooper (creep) Souls are split <b>by who was nearby rather than by who landed the last hit</b>. Unlike League of Legends, a missed last hit does not leave you with 0.</p>
${fig(orbFigure(), `How one Trooper's Souls are split · ${wiki('Souls#Soul_Orbs', 'deadlock.wiki/Souls')} (ground · floating 50:50 since the 2026-06-30 patch)`)}
<h4>1. Being nearby is enough to get a share</h4>
<p>When a Trooper dies, every allied hero within <b>45m of the broken orb</b> or <b>30m of the hero who killed it</b> gets a share. Whether you, an allied Trooper or a tower landed the last hit, you get Souls as long as you are nearby.</p>
${fig(shareFigure(), `Share per hero by heroes nearby · ${dc(146394, 'DC 트루퍼 영혼 분배표', 'DC Trooper Soul split table')} / ${wiki('Souls#Local_Soul_Sharing', 'deadlock.wiki')}`)}
<p class="sg-example"><b>Example (9 min)</b> One wave = ${n(at9)} Souls. Alone you get ${n(at9)}, two get ${n(at9 * 0.54)} each, three get ${n(at9 * 0.36)} each. Two sharing a lane for 1 min each earn about ${n(perMin9 - perMin9 * 0.54)} fewer Souls per min.</p>
<h4>2. Soul orbs: ground orbs · floating orbs</h4>
<ul><li><b>Ground orb (50%)</b> Cannot be denied, and flies to you on its own when you get close. But you have to reach it within 18 sec (40 sec after 10 min). Pushing the lane from afar with abilities alone misses these.</li>
<li><b>Floating orb (50%)</b> When the rising orb glows, one bullet secures it (the bullet that hits goes back into your magazine). If nobody shoots it, it goes to nearby allies after about 1 sec, but <b>if nobody is nearby, it disappears.</b></li></ul>
<h4>3. Securing and denying</h4>
<p>Your orbs look green and enemy orbs orange. Shoot an enemy orb first and you take that share (a deny). When the enemy is in lane, the habit of shooting floating orbs right away is Souls in your pocket.</p>
<h4>4. Melee last hits</h4>
<p>Finish a Trooper with a melee attack and no floating orb rises: that share is <b>yours at once</b>, and the enemy cannot deny it. Use it while reloading or when the enemy isn't watching you.</p>
${callout('note', 'Where the wiki pages disagree', `The ${wiki('Trooper', 'Trooper page', true)} says "a melee last hit pays 100% at once", while the ${wiki('Souls#Soul_Orbs', 'Souls page', true)} says "the ground orbs drop as usual and only the rest is paid at once". Either way, there is no share left for the enemy to deny.`)}
<h4>Summary</h4>
<div class="sg-two"><div><b>When the enemy is not in lane</b><p>No need to force every last hit and orb: being nearby gets you all of it. Just stay near the dropped ground orbs.</p></div><div><b>When the enemy is in lane</b><p>Shoot rising floating orbs right away or last hit with melee. Shoot enemy orbs to deny them.</p></div></div>
<h4>5. Souls from the jungle, crates and Sinner's Sacrifice are "unsecured"</h4>
<p>These Souls turn secured at (0.5% of the amount held + 1.6) per sec. Example: holding 1,000 at 10 min, about 7.9 per sec. If at death you still hold 50 + 5 per min or more unsecured Souls, they drop as a soul bag (lasts 3 min) that anyone can pick up with a heavy melee. Less than that, and they vanish. ${wiki('Unsecured', 'Source')}</p>
<h4>6. Losing-team bonus</h4>
<p>When your team is behind in net worth, you get up to 26% more Souls from Troopers, the jungle, Sinner's Sacrifice and objectives (max at a 20% gap; the first 3k of the gap is ignored). Killing an enemy stronger than their team average pays up to +126.8%. ${wiki('Comeback', 'Source')}</p>`)
      },
      {
        id: 'diagnose',
        key: L(
          ['기준선: 분당 약 1k, 20분에 18k 근처', '랭크 차이는 전선이 아니라 정글·상자에서 남', '흔한 원인: 전선 비우기 · 둘이 한 전선 · 공중 구슬 놓치기 · 웨이브 사이에 놀기'],
          [
            'Baseline: about 1k per min, near 18k at 20 min',
            'Ranks pull apart in the jungle and crates, not in the lane',
            'Common causes: empty lane · two in one lane · missed floating orbs · idle between waves'
          ]
        ),
        title: L('영혼이 안 쌓일 때', 'When your Souls fall behind'),
        short: L('내 순자산이 정상인지, 어디서 새는지', 'Is your net worth on track, and where it leaks'),
        body: L(`<p>"아무리 파밍해도 영혼이 안 쌓인다"면 먼저 숫자로 확인하세요. 아래는 최근 30일 일반전의 분당 순자산 평균입니다. 순자산은 경기 중 상단 바 초상화 아래 숫자(예: 6.2k)이고, Lookout이 자동으로 읽습니다.</p>
${fig(worthFigure(mark), `순자산 기준선 · deadlock-api.com 분석(최근 30일)${mark ? ' · 빨간 점이 지금 내 경기' : ''}`)}
<table class="sg-table"><thead><tr><th>시간</th>${W.minutes.map(m => `<th>${m}분</th>`).join('')}</tr></thead><tbody>
<tr><td>하위 랭크 평균</td>${W.low.map(v => `<td>${k(v)}</td>`).join('')}</tr>
<tr><td>상위 랭크 평균</td>${W.high.map(v => `<td>${k(v)}</td>`).join('')}</tr>
<tr class="warn"><td>이보다 낮으면 손해 중</td>${W.low.map((v, i) => `<td>${k(v - W.lowSd[i])}</td>`).join('')}</tr></tbody></table>
<p>평균은 대략 <b>분당 1k</b>, 20분에 18k 근처입니다. 랭크끼리 전선 영혼은 거의 같고, 차이는 정글과 상자에서 납니다.</p>
<table class="sg-table"><thead><tr><th>15분까지 번 영혼</th><th>하위 랭크</th><th>상위 랭크</th><th>차이</th></tr></thead><tbody>
${D()
  .sources15.map(s => `<tr><td>${s.name}</td><td>${n(s.low)}</td><td>${n(s.high)}</td><td class="${s.high - s.low > 200 ? 'hot' : ''}">+${n(s.high - s.low)}</td></tr>`)
  .join('')}</tbody></table>
<h4>원인별 체크리스트</h4>
<div class="sg-checks">
<div><b>① 전선을 비운다</b><p>웨이브 하나를 놓치면 9분 기준 ${n(at9)} 영혼. 로밍·귀환·정글 중에 웨이브가 내 가디언에서 죽으면 그 영혼은 아무도 못 먹습니다(근처에 아군이 없으면 공중 구슬은 사라짐).</p><p class="fix">해결: 웨이브 도착 시각(30초마다)에 맞춰 전선에 있기. 오버레이 미니맵의 캠프 타이머를 보고 "웨이브 → 캠프 → 웨이브" 순서로.</p></div>
<div><b>② 둘이 한 전선을 먹는다</b><p>한 전선에 둘이면 각자 54%. 캐리 입장에선 웨이브마다 거의 절반을 잃습니다.</p><p class="fix">해결: 서포트·탱커가 옆 전선이나 정글로 빠지고, 캐리가 전선을 혼자 먹기. 셋 이상 뭉쳐 다니지 않기.</p></div>
<div><b>③ 공중 구슬을 놓치거나 디나이당한다</b><p>공중 구슬이 값의 50%. 상대가 매번 디나이하면 웨이브당 절반을 뺏기고, 그만큼 상대가 법니다.</p><p class="fix">해결: 트루퍼 체력이 낮아지면 쏘던 걸 멈추고 막타 → 구슬에 한 발. 재장전 중엔 근거리 공격 막타. 막타 후 총알 1발은 남겨 두기(${yt('w79AOu3nfHk', '7:20', '네크로 7:20')}).</p></div>
<div><b>④ 웨이브 사이에 놀고 있다</b><p>웨이브를 밀고 다음 웨이브까지 15~20초가 빕니다. 상위 랭크는 이 시간에 정글·상자로 15분까지 1,000 이상을 더 법니다.</p><p class="fix">해결: 밀자마자 가장 가까운 캠프 1곳·상자 몇 개. 다음 웨이브 전에 복귀. ${yt('IDxXf-URcXU', '21:09', 'Shotty 21:09')}</p></div>
<div><b>⑤ 미확보 영혼을 들고 죽는다</b><p>정글을 돌고 바로 싸우다 죽으면 그 영혼이 떨어집니다. 레벨 진행도도 깎입니다.</p><p class="fix">해결: 정글 직후엔 교전 피하고, 살 게 있으면 바로 구매.</p></div>
<div><b>⑥ 영혼 슬롯머신을 그냥 친다</b><p>영혼 슬롯머신은 8분부터, 310 + 분당 3.35. 불빛이 모두 켜진 순간 강한 근거리 공격으로 맞히면 영구 능력치 4개.</p><p class="fix">해결: 불빛 3개 남았을 때 강한 근거리 공격 시작(빠른 빨간 타입은 4개). 한 번 칠 때마다 80 반격 피해. ${yt('7L-j1mjASk0', '10:12', 'Deathy 10:12')}</p></div>
<div><b>⑦ 죽는 횟수가 많다</b><p>죽으면 부활 시간 + 이동 시간 동안 웨이브 2~3개가 날아갑니다. 상대 팀 평균보다 순자산이 15% 이상 많으면 부활이 6초(10분)~22초(25분) 더 깁니다.</p><p class="fix">해결: 적 3명 이상이 안 보이면 중앙선을 넘지 않기. 체력이 낮으면 메딕 트루퍼(깃발 든 트루퍼) 옆에서 회복.</p></div>
</div>
<p class="sg-example"><b>예시</b> 10분에 내 순자산이 ${k(at10 - 2000)}라면 하위 평균(약 ${k(at10)})보다 2k 뒤집니다. 9~10분 웨이브 4개(${n(at9 * 4)})를 통째로 놓친 것과 같습니다. 다음 5분은 ①·④만 지켜도 따라잡습니다.</p>`, `<p>If "no matter how much I farm, my Souls don't add up", check the numbers first. Below is the average net worth by minute in normal games over the last 30 days. Net worth is the number under each portrait in the top bar during a match (e.g. 6.2k), and Lookout reads it automatically.</p>
${fig(worthFigure(mark), `Net worth baseline · deadlock-api.com analysis (last 30 days)${mark ? ' · the red dot is your current match' : ''}`)}
<table class="sg-table"><thead><tr><th>Time</th>${W.minutes.map(m => `<th>${m} min</th>`).join('')}</tr></thead><tbody>
<tr><td>Low-rank average</td>${W.low.map(v => `<td>${k(v)}</td>`).join('')}</tr>
<tr><td>High-rank average</td>${W.high.map(v => `<td>${k(v)}</td>`).join('')}</tr>
<tr class="warn"><td>Below this, you are falling behind</td>${W.low.map((v, i) => `<td>${k(v - W.lowSd[i])}</td>`).join('')}</tr></tbody></table>
<p>The average is roughly <b>1k per min</b>, near 18k at 20 min. Lane Souls are almost the same across ranks; the difference comes from the jungle and crates.</p>
<table class="sg-table"><thead><tr><th>Souls earned by 15 min</th><th>Low ranks</th><th>High ranks</th><th>Gap</th></tr></thead><tbody>
${D()
  .sources15.map(s => `<tr><td>${s.nameEn || s.name}</td><td>${n(s.low)}</td><td>${n(s.high)}</td><td class="${s.high - s.low > 200 ? 'hot' : ''}">+${n(s.high - s.low)}</td></tr>`)
  .join('')}</tbody></table>
<h4>Checklist by cause</h4>
<div class="sg-checks">
<div><b>① You leave the lane empty</b><p>Missing one wave at 9 min costs ${n(at9)} Souls. If the wave dies at your Guardian while you roam, go back to base or jungle, nobody gets those Souls (with no ally nearby, floating orbs disappear).</p><p class="fix">Fix: be in lane when the wave arrives (every 30 sec). Use the camp timers on the overlay minimap and go "wave → camp → wave".</p></div>
<div><b>② Two of you farm one lane</b><p>Two in one lane get 54% each. For a carry, that is losing almost half of every wave.</p><p class="fix">Fix: the support or tank moves to the next lane or the jungle, and the carry farms the lane alone. Don't move in groups of three or more.</p></div>
<div><b>③ You miss floating orbs or get denied</b><p>Floating orbs are 50% of the value. If the enemy denies every time, you lose half of each wave, and the enemy earns that much.</p><p class="fix">Fix: when a Trooper gets low, stop shooting it, last hit → one shot at the orb. While reloading, last hit with melee. Keep 1 bullet after the last hit (${yt('w79AOu3nfHk', '7:20', '네크로 7:20', 'Necro 7:20')}).</p></div>
<div><b>④ You idle between waves</b><p>After you push a wave, there are 15~20 empty sec before the next one. High ranks spend this time on jungle and crates and earn 1,000+ more by 15 min.</p><p class="fix">Fix: right after pushing, take the nearest camp and a few crates. Be back before the next wave. ${yt('IDxXf-URcXU', '21:09', 'Shotty 21:09')}</p></div>
<div><b>⑤ You die holding unsecured Souls</b><p>Clear the jungle and die in a fight right after, and those Souls drop. Your level progress drops too.</p><p class="fix">Fix: avoid fights right after jungling, and buy at once if there is something to buy.</p></div>
<div><b>⑥ You hit the Sinner's Sacrifice carelessly</b><p>Sinner's Sacrifice from 8 min, 310 + 3.35 per min. Land a heavy melee the moment all its lights are on for 4 permanent stats.</p><p class="fix">Fix: start the heavy melee with 3 lights left (4 for the fast red type). Every hit deals 80 damage back to you. ${yt('7L-j1mjASk0', '10:12', 'Deathy 10:12')}</p></div>
<div><b>⑦ You die too often</b><p>A death costs 2~3 waves over respawn + travel time. With 15% or more net worth than the enemy team average, respawn takes 6 sec (10 min)~22 sec (25 min) longer.</p><p class="fix">Fix: don't cross the middle line when 3 or more enemies are missing. When low, heal next to a Medic Trooper (the Trooper carrying a flag).</p></div>
</div>
<p class="sg-example"><b>Example</b> If your net worth at 10 min is ${k(at10 - 2000)}, you are 2k behind the low-rank average (about ${k(at10)}). That is like missing 4 whole waves (${n(at9 * 4)}) at 9~10 min. Keep just ① and ④ for the next 5 min and you catch up.</p>`)
      },
      {
        id: 'timeline',
        key: L(
          ['<b>2:00</b> 소형 캠프 · <b>3:00</b> 상자 · <b>5:00</b> 기운의 파편·중형 캠프', '<b>8:00</b> 대형 캠프·영혼 슬롯머신 · <b>10:00</b> 영혼 단지 · <b>11:20~</b> 균열', '생성 30초 전 웨이브를 밀어 둔 쪽이 먼저 먹음'],
          [
            '<b>2:00</b> small camps · <b>3:00</b> crates · <b>5:00</b> Power-ups · medium camps',
            "<b>8:00</b> large camps · Sinner's Sacrifice · <b>10:00</b> Soul Urn · <b>11:20~</b> Rift",
            'Whoever pushed the wave 30 sec before a spawn takes it first'
          ]
        ),
        title: L('시간대별 운영 (0~12분)', 'Timeline (0~12 min)'),
        short: L('분 단위로 무엇을 할지', 'What to do, minute by minute'),
        body: L(`${fig(timelineFigure(), '생성 시각 · 출처 deadlock.wiki Denizens·Crate·Soul Urn, Deathy·Ghoul 영상 (2026-10)')}
<table class="sg-table steps"><tbody>
<tr><td>0:00~2:00</td><td>라인전. 공중 구슬과 막타 연습 시간. 1:30 웨이브를 먼저 밀어 두면 2:00 소형 캠프를 먼저 먹습니다.</td></tr>
<tr><td>2:00</td><td>소형 캠프 등장(리스폰 1:25). 3마리 합 약 123 + 분당 1.32. 웨이브를 민 직후에만.</td></tr>
<tr><td>2:30~3:00</td><td>2:30 웨이브를 밀었으면 3:00 상자를 털기(3분마다 재생성, 60% 확률로 23 + 분당 2). 둘 중 한 명은 전선 받기.</td></tr>
<tr><td>4:30~5:00</td><td>4:30 웨이브가 5:00 기운의 파편(강한 근거리 공격으로 획득, 5분마다)을 정합니다. 중형 캠프도 5:00(리스폰 4:50).</td></tr>
<tr><td>7:30~8:00</td><td>대형 캠프·영혼 슬롯머신 8:00. 이기는 쪽은 상대 쪽 영혼 슬롯머신까지, 지는 쪽은 전선 옆 영혼 슬롯머신만.</td></tr>
<tr><td>9:00~10:00</td><td>궁극기를 아껴 두기. 10:00 영혼 단지(250 + 분당 70, 10분이면 950)와 버프 싸움.</td></tr>
<tr><td>11:20~13:20</td><td>균열 첫 열림(10~12분에 다리 위 예고 효과). 지는 팀은 저항 보너스를 받으니 뒤처질수록 싸울 가치가 큽니다.</td></tr>
</tbody></table>
${fig(loopFigure(), '웨이브 사이 루프 · 출처 Shotty·Ghoul 파밍 영상')}`, `${fig(timelineFigure(), 'Spawn times · source deadlock.wiki Denizens·Crate·Soul Urn, Deathy·Ghoul videos (2026-10)')}
<table class="sg-table steps"><tbody>
<tr><td>0:00~2:00</td><td>Laning. Time to practice floating orbs and last hits. Push the 1:30 wave first and you get the 2:00 small camp first.</td></tr>
<tr><td>2:00</td><td>Small camps appear (respawn 1:25). About 123 + 1.32 per min for all 3 units. Only right after pushing the wave.</td></tr>
<tr><td>2:30~3:00</td><td>If you pushed the 2:30 wave, break the 3:00 crates (respawn every 3 min, 60% chance of 23 + 2 per min). One of the two holds the lane.</td></tr>
<tr><td>4:30~5:00</td><td>The 4:30 wave decides the 5:00 Power-up (claimed with a heavy melee, every 5 min). Medium camps also spawn at 5:00 (respawn 4:50).</td></tr>
<tr><td>7:30~8:00</td><td>Large camps · Sinner's Sacrifice at 8:00. The winning side goes for the enemy-side Sacrifice too; the losing side takes only the one beside its lane.</td></tr>
<tr><td>9:00~10:00</td><td>Save your ultimate. Fight over the 10:00 Soul Urn (250 + 70 per min, 950 at 10 min) and the buff.</td></tr>
<tr><td>11:20~13:20</td><td>The Rift opens for the first time (a warning effect on the bridge at 10~12 min). The losing team gets a resistance bonus, so the further behind you are, the more the fight is worth.</td></tr>
</tbody></table>
${fig(loopFigure(), 'The loop between waves · source Shotty·Ghoul farming videos')}`)
      },
      {
        id: 'lane',
        key: L(
          ['트루퍼는 막타 직전에만, 평소엔 상대 영웅 견제', '<b>웨이브 → 캠프 → 웨이브</b>: 밀고 남는 15초에 가까운 곳 한 곳', '순자산 3,800(평균 6:26) 궁극기가 먼저 열린 쪽이 킬 각'],
          [
            'Shoot Troopers only right before the last hit; otherwise harass the enemy hero',
            '<b>Wave → camp → wave</b>: spend the spare 15 sec after pushing on one nearby spot',
            'Whoever unlocks the ultimate first at 3,800 net worth (6:26 on average) has the kill window'
          ]
        ),
        title: L('라인전 실전', 'Laning in practice'),
        short: L('몇 분에 무엇을 · 막타·디나이·엄폐·회복', 'What to do when · last hits · denies · cover · healing'),
        body: L(`<h4>분 단위로 보는 라인전</h4>
<table class="sg-table steps"><tbody>
<tr><td>0:00~1:00</td><td><b>상대를 알아 두는 시간.</b> 트루퍼보다 상대 영웅을 견제하고, 막타 직전에만 트루퍼를 쏩니다. 상대 능력 사거리와 쿨이 도는 걸 눈에 익히세요. 공중 구슬은 파트너와 나눠 쏩니다.</td></tr>
<tr><td>1:30</td><td>이 웨이브를 빨리 밀어 두면 2:00 소형 캠프를 상대보다 먼저 먹습니다.</td></tr>
<tr><td>2:00~4:30</td><td><b>웨이브 → 캠프 → 웨이브.</b> 웨이브를 밀고 남는 15초에 가까운 소형 캠프나 상자(3:00부터) 한 곳. 다음 웨이브 전에 전선으로 돌아옵니다. 체력이 낮으면 메딕 트루퍼 옆에서 채우고, 살 아이템이 있으면 바로 삽니다.</td></tr>
<tr><td>4:30~5:00</td><td>4:30 웨이브를 밀어 둔 쪽이 5:00 기운의 파편과 중형 캠프를 가져갑니다. 못 밀었으면 욕심내지 말고 웨이브부터.</td></tr>
<tr><td>5:30~6:30</td><td><b>궁극기가 열리는 때.</b> 순자산 3,800(모은 영혼 3,200), 평균 6분 26초. 내 쪽이 먼저 열리면 그때가 킬 각이고, 상대가 먼저면 가디언 뒤로 물러나 웨이브만 받으세요. Tab 패널에서 적 궁극기 해금을 볼 수 있습니다.</td></tr>
<tr><td>6:30~8:00</td><td><b>가디언을 노립니다.</b> 이긴 전선은 웨이브와 같이 들어가 상대 가디언(1,375 영혼)을 깎습니다. 7:30 웨이브를 밀고 8:00 대형 캠프·영혼 슬롯머신으로.</td></tr>
<tr><td>8:00~10:00</td><td>라인전 마무리. 가디언이 깨진 전선은 혼자 버티지 말고 웨이브만 밀어 둔 채 정글과 옆 전선을 돕습니다. 9:30 웨이브를 밀어 두고 10:00 영혼 단지로 모이세요. 10분부터는 바닥 구슬이 40초 남아서 잠깐 비워도 덜 손해입니다.</td></tr>
</tbody></table>
<p>시간은 웨이브(30초마다)와 정글 생성 시각 기준입니다. 경기마다 몇십 초씩 어긋나니, 실제로는 내 전선 웨이브가 어디 있는지를 먼저 보세요. 정글·오브젝트 쪽 흐름은 <a href="#sg-timeline">시간대별 운영</a>에 있습니다.</p>
<h4>라인전 요령</h4>
<ul class="sg-list">
<li><b>트루퍼를 계속 쏘지 마세요.</b> 뉴비가 가장 많이 하는 실수가 계속 쏘다가 재장전 중에 막타를 놓치는 것입니다. 체력이 낮아질 때까지 상대 영웅을 견제하고, 막타 직전에만 트루퍼로. ${dc(9244, 'DC 입문 가이드')}</li>
<li><b>엄폐물은 화면 왼쪽에 두고 오른쪽으로 나가며 싸웁니다.</b> 3인칭 카메라가 오른쪽 어깨 뒤에 있어 내 몸은 덜 보이고 시야는 넓습니다.</li>
<li><b>메딕 트루퍼(깃발 든 트루퍼) 옆에서 회복</b>, 상대 메딕을 먼저 끊으면 상대 회복이 끊깁니다.</li>
<li><b>밀렸을 때</b>는 내 트루퍼 막타와 상대 구슬 디나이에만 집중. 가디언 밑에서 체력을 지키는 게 먼저입니다(${yt('QcpZh1fQf4g', '4:00', 'Ghoul 4:00')}).</li>
<li><b>방어(패링)</b>: 상대 강한 근거리 공격 직전에 쓰면 성공하면 상대가 2.75초 기절하고 받는 피해가 25% 늘어납니다. 실패하면 4.5초 쿨이 돌아 취약해지니 확실할 때만.</li>
<li><b>활주(슬라이딩) 중 사격은 탄약이 줄지 않습니다.</b> 대시 후 활주(슬라이딩)를 습관으로.</li>
<li><b>캐리라면 전선을 혼자 먹겠다고 미리 말하세요.</b> 둘이 같이 먹으면 각자 54%라 성장이 크게 늦어집니다(${yt('xGM5mk98axI', '1:02', 'NightMare 1:02')}).</li>
</ul>`, `<h4>Laning by the minute</h4>
<table class="sg-table steps"><tbody>
<tr><td>0:00~1:00</td><td><b>Get to know your opponent.</b> Harass the enemy hero rather than Troopers, and shoot Troopers only right before the last hit. Learn the range of their abilities and when they are on cooldown. Split floating orbs with your partner.</td></tr>
<tr><td>1:30</td><td>Push this wave fast and you take the 2:00 small camp before the enemy.</td></tr>
<tr><td>2:00~4:30</td><td><b>Wave → camp → wave.</b> Spend the spare 15 sec after pushing on one nearby small camp or crates (from 3:00). Get back to lane before the next wave. When low, heal next to a Medic Trooper, and buy items as soon as you can.</td></tr>
<tr><td>4:30~5:00</td><td>Whoever pushed the 4:30 wave takes the 5:00 Power-up and medium camps. If you couldn't push, don't get greedy: wave first.</td></tr>
<tr><td>5:30~6:30</td><td><b>Ultimates unlock.</b> At 3,800 net worth (3,200 Souls earned), 6 min 26 sec on average. If yours comes first, that is your kill window; if theirs comes first, back off behind your Guardian and just take the wave. The Tab panel shows enemy ultimate unlocks.</td></tr>
<tr><td>6:30~8:00</td><td><b>Go for the Guardian.</b> A winning lane goes in with the wave and chips the enemy Guardian (1,375 Souls). Push the 7:30 wave, then head for the 8:00 large camps · Sinner's Sacrifice.</td></tr>
<tr><td>8:00~10:00</td><td>Laning wraps up. If your lane's Guardian is down, don't hold alone: push the wave and help the jungle and the next lane. Push the 9:30 wave and gather at the 10:00 Soul Urn. From 10 min ground orbs last 40 sec, so leaving the lane for a moment costs less.</td></tr>
</tbody></table>
<p>Times follow waves (every 30 sec) and jungle spawn times. Each match drifts by tens of seconds, so in practice check where your lane's wave is first. The jungle and objective side is in <a href="#sg-timeline">Timeline</a>.</p>
<h4>Laning tips</h4>
<ul class="sg-list">
<li><b>Don't keep shooting Troopers.</b> The most common new-player mistake is shooting nonstop and missing the last hit while reloading. Harass the enemy hero until Troopers get low, and switch to them only right before the last hit. ${dc(9244, 'DC 입문 가이드', 'DC beginner guide')}</li>
<li><b>Keep cover on the left of your screen and step out to the right to fight.</b> The third-person camera sits behind your right shoulder, so you show less of your body and see more.</li>
<li><b>Heal next to a Medic Trooper (the Trooper carrying a flag)</b>; kill the enemy medic first to cut off their healing.</li>
<li><b>When pushed in</b>, focus only on last hitting your Troopers and denying enemy orbs. Saving your health under the Guardian comes first (${yt('QcpZh1fQf4g', '4:00', 'Ghoul 4:00')}).</li>
<li><b>Parry</b>: use it right before the enemy's heavy melee; on success the enemy is stunned for 2.75 sec and takes 25% more damage. On a miss it goes on a 4.5-sec cooldown and leaves you exposed, so use it only when sure.</li>
<li><b>Shooting while sliding doesn't use ammo.</b> Make Slide after Dash a habit.</li>
<li><b>As a carry, say up front that you'll farm the lane alone.</b> Sharing a lane gives each 54%, which slows your growth a lot (${yt('xGM5mk98axI', '1:02', 'NightMare 1:02')}).</li>
</ul>`)
      },
      {
        id: 'jungle',
        key: L(
          ['우선순위: 전선 → 영혼 슬롯머신 → 정글 캠프 → 상자·황금 조각상', '웨이브를 민 직후 가까운 곳만, 웨이브가 오면 전선으로', '앞설 땐 상대 정글 먼저, 돌아오며 아군 정글'],
          [
            "Priority: lane → Sinner's Sacrifice → jungle camps → crates · Golden Statues",
            'Only nearby spots right after pushing the wave; back to lane when the wave comes',
            'When ahead, enemy jungle first, your own jungle on the way back'
          ]
        ),
        title: L('정글·상자·영혼 슬롯머신', "Jungle · crates · Sinner's Sacrifice"),
        short: L('파밍 순서·영혼 슬롯머신·동선', "Farming order · Sinner's Sacrifice · routes"),
        body: L(`<p>정글 캠프 51곳·상자·황금 조각상·영혼 슬롯머신 자리는 <button class="sg-link" data-page="atlas">전체 지도</button>에서 종류별로 켜고 확대해 볼 수 있습니다. 경기 중 리스폰 타이머는 Lookout 미니맵 오버레이가 띄웁니다.</p>
<table class="sg-table"><thead><tr><th>대상</th><th>첫 생성</th><th>리스폰</th><th>값</th></tr></thead><tbody>
<tr><td>소형 캠프</td><td>2:00</td><td>1:25</td><td>3마리 합 123 + 분당 1.32</td></tr>
<tr><td>중형 캠프</td><td>5:00</td><td>4:50</td><td>1단계 41 · 2단계 68 섞임 (구성 6가지)</td></tr>
<tr><td>대형 캠프</td><td>8:00</td><td>5:35</td><td>290~543 (구성에 따라)</td></tr>
<tr><td>영혼 슬롯머신</td><td>8:00</td><td>5:00</td><td>310 + 분당 3.35, 강한 근거리 공격 4번 / 약한 근거리 공격 8번</td></tr>
<tr><td>상자</td><td>3:00<sup>*</sup></td><td>3:00<sup>*</sup></td><td>60% 확률로 23 + 분당 2</td></tr>
<tr><td>튼튼한 상자</td><td>—</td><td>—</td><td>강한 근거리 공격으로만, 100% 46 + 분당 4</td></tr>
<tr><td>황금 조각상</td><td>3:00</td><td>부순 뒤 3:00</td><td>부수면 50% 확률로 영구 능력치 (9월 패치로 저항·사거리·이동 속도 추가)</td></tr>
</tbody></table>
<p class="note">* 터널 상자는 5:00부터 5분마다. 종탑·안개 광장 상자는 5:00, 타임스퀘어 아래 방은 10:00에 처음 생깁니다.</p>
${fig(farmOrderFigure(), `출처 ${yt('mGn4T4B4cdY', '2:46', '네크로 2:46')} · 9월 패치 전 영상이지만 순서는 그대로`)}
<ul class="sg-list"><li><b>우선순위는 전선 → 영혼 슬롯머신 → 정글 캠프 → 상자·황금 조각상.</b> 당겨진 웨이브는 아군 가디언이 잡아 버려 영혼이 사라지니 전선이 먼저. 영혼 슬롯머신은 근거리 공격만으로 금방 끝나고 잭팟이면 영구 능력치까지(${yt('mGn4T4B4cdY', '3:53', '네크로 3:53')}). 상자는 60%라 빈손일 수 있으니 마지막에.</li>
<li><b>상자·황금 조각상은 위치가 고정</b>이라 외워 두면 웨이브 사이 동선이 빨라집니다. 황금 조각상은 절반 확률로 영구 능력치라 보이면 부수세요. 대시보드 인게임 탭이 내 전선 기준으로 웨이브 정리 후 동선을 보여줍니다.</li>
<li>정글은 <b>웨이브를 민 직후 가까운 곳만</b>. 웨이브가 오면 캠프는 버리고 전선으로(${yt('IDxXf-URcXU', '0:11', 'Shotty')}).</li>
<li>중립 유닛 약점을 쏘면 노랗게 빛나고, 대형 몹의 근거리 공격은 방어(패링)할 수 있습니다(${yt('DCO1AQQjZG0', '2:36', 'Metro 2:36')}).</li>
<li>Hidden King 쪽 캠프가 더 촘촘합니다. 고위험 고수익 지역(종탑·안개 광장)은 캐리 전용.</li>
<li>리스폰 타이머는 게임에선 현장에서만 보입니다. Lookout 미니맵 오버레이가 처치를 감지해 남은 시간을 띄웁니다.</li></ul>
<h4>영혼 슬롯머신</h4>
<ul class="sg-list">
<li><b>위치는 외워 두기</b>(<button class="sg-link" data-page="atlas">전체 지도</button>에서 영혼 슬롯머신만 켜 보기).${wiki("Sinner%27s_Sacrifice", "deadlock.wiki")} 두 진영이 거의 대칭. 한 자리에 2~3대 모인 곳이 영혼이 가장 많습니다. 영상 속 "2층 건물 쌍 슬롯머신"은 9월 패치 전 위치.</li>
<li><b>종탑</b>(Hidden King 쪽): 3대. 때리거나 주변을 부수면 종이 울려 모든 플레이어가 듣습니다. <b>안개 광장</b>(Archmother 쪽): 2곳이 몰려 있고, 안개가 시야·소리를 가리는 대신 활력을 조금씩 깎습니다.</li>
<li><b>옆에 몹이 붙은 자리는 몹까지 다 잡아야</b> 다시 생깁니다. 영혼 슬롯머신만 치고 떠나면 그 자리는 리스폰되지 않음(${yt('mGn4T4B4cdY', '5:33', '네크로 5:33')}).</li>
<li>칠 때마다 반격 피해(1대 합 320~640). 400을 깎으면 잭팟 모드: 불이 모두 켜졌을 때 치면 잭팟. 강한 근거리 공격이면 영구 능력치 4개, 약한 근거리 공격이면 1개. 잭팟 모드 중엔 반격 없음.</li>
</ul>
<h4>앞설 때 정글 동선</h4>
${fig(invadeFigure(), `출처 ${yt('mGn4T4B4cdY', '7:44', '네크로 7:44')} · ${yt('xGM5mk98axI', '2:38', 'NightMare 2:38')}`)}
<ul class="sg-list"><li>사이드에서 이기고 있으면 <b>상대 정글 먼저, 돌아오면서 아군 정글</b>. 내 영혼이 늘고 상대 몫이 줄어 격차가 크게 벌어집니다. 반대로 하면 파밍이 끝날 때 가장 위험한 곳에 서 있게 됨.</li></ul>`, `<p>All 51 jungle camps, crates, Golden Statues and Sinner's Sacrifice spots can be shown by type and zoomed on the <button class="sg-link" data-page="atlas">Full map</button>. During a match, the Lookout minimap overlay shows respawn timers.</p>
<table class="sg-table"><thead><tr><th>Target</th><th>First spawn</th><th>Respawn</th><th>Value</th></tr></thead><tbody>
<tr><td>Small camp</td><td>2:00</td><td>1:25</td><td>123 + 1.32 per min for all 3 units</td></tr>
<tr><td>Medium camp</td><td>5:00</td><td>4:50</td><td>Tier 1 41 · tier 2 68 mixed (6 layouts)</td></tr>
<tr><td>Large camp</td><td>8:00</td><td>5:35</td><td>290~543 (by layout)</td></tr>
<tr><td>Sinner's Sacrifice</td><td>8:00</td><td>5:00</td><td>310 + 3.35 per min, 4 heavy melees / 8 light melees</td></tr>
<tr><td>Crate</td><td>3:00<sup>*</sup></td><td>3:00<sup>*</sup></td><td>60% chance of 23 + 2 per min</td></tr>
<tr><td>Tough crate</td><td>—</td><td>—</td><td>Heavy melee only, 100% 46 + 4 per min</td></tr>
<tr><td>Golden Statue</td><td>3:00</td><td>3:00 after breaking</td><td>50% chance of a permanent stat when broken (the September patch added resistance · range · move speed)</td></tr>
</tbody></table>
<p class="note">* Tunnel crates every 5 min from 5:00. Crates in the Bell Tower and the fog plaza first spawn at 5:00, and in the room under Times Square at 10:00.</p>
${fig(farmOrderFigure(), `${yt('mGn4T4B4cdY', '2:46', '네크로 2:46', 'Necro 2:46')} · Video from before the September patch, but the order still holds`)}
<ul class="sg-list"><li><b>Priority: lane → Sinner's Sacrifice → jungle camps → crates · Golden Statues.</b> A wave pulled back gets killed by your own Guardian and its Souls are lost, so the lane comes first. A Sinner's Sacrifice goes down fast with melee alone, and a jackpot adds permanent stats (${yt('mGn4T4B4cdY', '3:53', '네크로 3:53', 'Necro 3:53')}). Crates are a 60% chance and can come up empty, so they come last.</li>
<li><b>Crates and Golden Statues have fixed spots</b>, so learning them speeds up your route between waves. Golden Statues give a permanent stat half the time, so break them when you see them. The dashboard In game tab shows a route after clearing the wave, based on your lane.</li>
<li>Jungle <b>only nearby spots right after pushing the wave</b>. When the wave comes, drop the camp and go to lane (${yt('IDxXf-URcXU', '0:11', 'Shotty')}).</li>
<li>Shooting a neutral's weak spot makes it glow yellow, and large mobs' melee attacks can be parried (${yt('DCO1AQQjZG0', '2:36', 'Metro 2:36')}).</li>
<li>Camps are denser on the Hidden King side. High-risk, high-reward areas (Bell Tower · fog plaza) are for carries only.</li>
<li>In the game, respawn timers are only visible on the spot. The Lookout minimap overlay detects kills and shows the time left.</li></ul>
<h4>Sinner's Sacrifice</h4>
<ul class="sg-list">
<li><b>Learn the spots</b> (on the <button class="sg-link" data-page="atlas">Full map</button>, show only Sinner's Sacrifice).${wiki("Sinner%27s_Sacrifice", "deadlock.wiki")} The two sides are nearly symmetric. Spots with 2~3 machines together give the most Souls. The "twin machines in a two-story building" in videos are pre-September-patch spots.</li>
<li><b>Bell Tower</b> (Hidden King side): 3 machines. Hitting them or breaking things nearby rings the bell, which every player hears. <b>Fog plaza</b> (Archmother side): 2 spots close together; the fog hides sight and sound but slowly drains Stamina.</li>
<li><b>Where mobs stand beside it, kill the mobs too</b>, or it won't come back. Hit only the Sinner's Sacrifice and leave, and that spot doesn't respawn (${yt('mGn4T4B4cdY', '5:33', '네크로 5:33', 'Necro 5:33')}).</li>
<li>Each hit deals damage back (320~640 in total per machine). Take off 400 and it enters jackpot mode: hit it when all lights are on for the jackpot. A heavy melee gives 4 permanent stats, a light melee 1. No damage back during jackpot mode.</li>
</ul>
<h4>Jungle route when ahead</h4>
${fig(invadeFigure(), `${yt('mGn4T4B4cdY', '7:44', '네크로 7:44', 'Necro 7:44')} · ${yt('xGM5mk98axI', '2:38', 'NightMare 2:38')}`)}
<ul class="sg-list"><li>When you are winning your side lane, take the <b>enemy jungle first, then your own on the way back</b>. Your Souls go up and theirs go down, so the gap grows fast. Do it the other way around and you finish farming standing in the most dangerous spot.</li></ul>`)
      },
      {
        id: 'objectives',
        key: L(
          ['궁극기는 순자산 3,800(모은 영혼 3,200)에서 해금', '가디언 1,375 · 워커 3,675 · 중앙 보스 3,000 + 분당 50', '한타 승리 직후 가장 가까운 구조물·보스로'],
          [
            'The ultimate unlocks at 3,800 net worth (3,200 Souls earned)',
            'Guardian 1,375 · Walker 3,675 · Mid-Boss 3,000 + 50 per min',
            'Right after winning a team fight, go to the nearest structure or boss'
          ]
        ),
        title: L('오브젝트와 성장', 'Objectives and growth'),
        short: L('가디언·워커·보스·균열·영혼 단지, 궁극기 시점', 'Guardian · Walker · boss · Rift · Soul Urn, ultimate timing'),
        body: L(`${fig(levelFigure(), '쌓인 영혼(순자산)에 따른 능력 해금과 포인트 · deadlock-api 영웅 데이터')}
<p>궁극기는 <b>순자산 3,800</b>(시작 영혼 600 포함, 모은 영혼 3,200)에 열립니다. 평균 6분 26초 무렵입니다. Lookout 오버레이는 적 순자산으로 <b>적 궁극기 해금 수</b>를 보여줍니다. 적 대부분이 3,800을 넘기 직전이 싸움을 걸기 좋은 때입니다.</p>
<table class="sg-table"><thead><tr><th>오브젝트</th><th>영혼</th><th>메모</th></tr></thead><tbody>
<tr><td>가디언</td><td>1,375</td><td>근처 영웅 25%, 팀 전체 75%</td></tr>
<tr><td>워커</td><td>3,675</td><td>+ 플렉스 슬롯 1칸 (워커 1·2·3개째)</td></tr>
<tr><td>기지 가디언</td><td>1,000</td><td>부서지면 아군 집라인이 빨라짐</td></tr>
<tr><td>중앙 보스</td><td>3,000 + 분당 50</td><td>팀 분배 + 소생의 보석 (최대 3명, 3분)</td></tr>
<tr><td>균열</td><td>1,482 (13분부터 분당 +222)</td><td>팀 분배</td></tr>
<tr><td>영혼 단지</td><td>250 + 분당 70</td><td>10분부터 5분마다, 짝수 분 노랑·홀수 분 초록 전선</td></tr>
<tr><td>영웅 처치</td><td>200 + 분당 50 (최대 2,200)</td><td>첫 킬 +125</td></tr></tbody></table>
<ul class="sg-list"><li>한타를 이기면 바로 타워나 중앙 보스로. 핑으로 팀을 부르세요. 안 하면 게임이 늘어집니다(${dc(5570, 'DC 중반 운영')}).</li>
<li>모든 전선이 적어도 절반은 밀려 있어야 한타 이득을 굳힐 수 있습니다.</li>
<li>워커를 깼으면 그 턴은 쓴 것. 적 최강 영웅이 부활하면 빠집니다.</li>
<li><b>워커 영혼 분배</b>: 근처 영웅 몫은 7월 40% → 30%, 9월 25%로 줄었고 나머지는 팀 전원이 똑같이 받습니다(위키 워커 문서는 아직 40%). 혼자 깰 수 있으면 죽더라도 가져가는 게 이득인 경우가 많지만, 15~20분 이후엔 그 사이 중앙 보스를 내줄 수 있습니다(${yt('xGM5mk98axI', '5:04', 'NightMare 5:04')}).</li>
<li><b>영혼 단지</b>는 배달한 사람이 영혼과 영구 능력치 4개를 받습니다. 영혼은 구슬로 떨어지니 쏘거나 근거리 공격으로 바로 확보하세요. 아군이 챙기면 배달한 사람과 나눠 갖습니다.</li>
<li><b>균열</b>은 점령을 마치면 아군 전원이 영혼을 받습니다. 60초 넘게 다투면 영혼이 떠오르기 시작하고, 그때부턴 쏴서 확정·디나이하는 싸움입니다. 확보한 팀은 그 자리에서 균열 트루퍼 5명(뒤처진 팀이면 최대 14명)을 내려보냅니다. 체력·피해가 2배 이상(균열마다 커짐)이고 영혼은 주지 않습니다. 구역 안 영웅은 미니맵에 드러나고, 뒤처진 팀은 구역 안에서 저항 보너스(첫 균열 약 20% → 30분 40%)를 받습니다. 영구 능력치는 더 이상 주지 않습니다(2026.06.30~09.16 패치).</li>
<li><b>솔로킬</b>은 처치 영혼을 혼자 다 가져갑니다. 사이드 전선에서 이겼다면 그 틈에 상대 정글이나 오브젝트까지 가져가 차이를 벌리세요.</li>
<li>Tab으로 적 중 가장 잘 큰 영웅을 확인하고 경계(Lookout Tab 패널의 순자산·궁극기 표시).</li></ul>`, `${fig(levelFigure(), 'Ability unlocks and points by Souls piled up (net worth) · deadlock-api hero data')}
<p>The ultimate unlocks at <b>3,800 net worth</b> (including the 600 starting Souls; 3,200 Souls earned), around 6 min 26 sec on average. The Lookout overlay uses enemy net worth to show <b>how many enemy ultimates are unlocked</b>. Right before most enemies pass 3,800 is a good time to start a fight.</p>
<table class="sg-table"><thead><tr><th>Objective</th><th>Souls</th><th>Notes</th></tr></thead><tbody>
<tr><td>Guardian</td><td>1,375</td><td>Heroes nearby 25%, whole team 75%</td></tr>
<tr><td>Walker</td><td>3,675</td><td>+ 1 Flex slot (1st · 2nd · 3rd Walker)</td></tr>
<tr><td>Base Guardian</td><td>1,000</td><td>Once destroyed, your team's Zipline gets faster</td></tr>
<tr><td>Mid-Boss</td><td>3,000 + 50 per min</td><td>Split by team + Rejuvenator (up to 3 heroes, 3 min)</td></tr>
<tr><td>Rift</td><td>1,482 (+222 per min from 13 min)</td><td>Split by team</td></tr>
<tr><td>Soul Urn</td><td>250 + 70 per min</td><td>Every 5 min from 10 min; Yellow lane on even minutes, Green lane on odd</td></tr>
<tr><td>Hero kill</td><td>200 + 50 per min (max 2,200)</td><td>First kill +125</td></tr></tbody></table>
<ul class="sg-list"><li>Win a team fight, then go straight for a tower or the Mid-Boss. Ping to call your team. Otherwise the game drags on (${dc(5570, 'DC 중반 운영', 'DC mid-game play')}).</li>
<li>Every lane should be pushed at least halfway to lock in a team fight win.</li>
<li>Once you break a Walker, that turn is spent. Back off when the enemy's strongest hero respawns.</li>
<li><b>Walker Soul split</b>: the share for heroes nearby went from 40% to 30% in July and to 25% in September, and the rest goes equally to the whole team (the wiki Walker page still says 40%). If you can break it alone, taking it is often worth it even if you die, but after 15~20 min it may cost you the Mid-Boss meanwhile (${yt('xGM5mk98axI', '5:04', 'NightMare 5:04')}).</li>
<li>The <b>Soul Urn</b> gives whoever delivers it Souls and 4 permanent stats. The Souls drop as orbs, so shoot them or melee them to secure them at once. Allies who collect them split them with the deliverer.</li>
<li>Once the <b>Rift</b> is captured, every ally gets Souls. Contest it for over 60 sec and Souls start floating up; from then on it is a fight to shoot them to secure or deny. The team that secures it sends 5 Rift Troopers down from it (up to 14 when behind), with double or more health and damage (more each Rift) and no Souls. Heroes in the zone show on the minimap, and the team behind gets a resist bonus in the zone (about 20% at the first Rift, 40% at 30 min). It no longer gives permanent stats (patches 2026-06-30 to 09-16).</li>
<li>A <b>solo kill</b> takes all the kill Souls alone. If you won your side lane, use the gap to take the enemy jungle or an objective too and widen the lead.</li>
<li>Use Tab to find the enemy's most grown hero and watch out for them (net worth · ultimate shown on the Lookout Tab panel).</li></ul>`)
      },
      {
        id: 'items',
        key: L(
          ['카테고리별 투자 보너스, 3,200 → 4,800 구간 효율이 큼', '로딩 화면에서 적 주 피해(총/능력) 보고 초반 카운터', '초록(생명) 아이템은 약 4.8k까지만'],
          [
            'Category investment bonus: the 3,200 → 4,800 step pays off most',
            "On the loading screen, check the enemy's main damage (gun/abilities) for early counters",
            'Green (Vitality) items only up to about 4.8k'
          ]
        ),
        title: L('아이템 원칙', 'Item principles'),
        short: L('스파이크·카운터·초록 아이템', 'Spikes · counters · green items'),
        body: L(`<ul class="sg-list">
<li><b>카테고리별 투자 보너스</b>: 무기·생존·능력 각각 800 / 1,600 / 2,400 / 3,200 / 4,800 / 6,400 ... 구간마다 보너스가 붙고, 3,200 → 4,800 구간 효율이 특히 큽니다. 4.8k 직전이면 구매를 미루지 마세요(${dc(133606, 'DC 빌드 스파이크')}).</li>
<li><b>로딩 화면에서 적 조합의 주 피해</b>(총/능력)를 보고 초반 카운터(실드·전투 조끼·마법사의 문장·힐베인)를 미리 삽니다(${yt('NV8G-p3xzmI', '0:46', 'Metro 아이템 0:46')}).</li>
<li><b>초록(생명) 아이템은 첫 대형 아이템 전 약 4.8k까지만.</b> 뒤처질수록 초록을 줄이고, 죽은 원인이 위치 선정인지부터 확인.</li>
<li><b>빌드 순서는 임의로 바꾸지 않기.</b> 카운터템은 실제로 불편할 때만. 처음엔 <button class="sg-link" data-page="guide">영웅</button> 페이지의 통계 빌드를 그대로 따라 하세요.</li>
<li>잘못 산 아이템은 상점 범위를 벗어나기 전이면 전액 환불, 아니면 50%.</li></ul>`, `<ul class="sg-list">
<li><b>Category investment bonus</b>: Weapon, Vitality and Spirit each get a bonus at every step of 800 / 1,600 / 2,400 / 3,200 / 4,800 / 6,400 ..., and the 3,200 → 4,800 step is especially efficient. When you are just short of 4.8k, don't put off buying (${dc(133606, 'DC 빌드 스파이크', 'DC build spikes')}).</li>
<li>On the <b>loading screen, check the enemy comp's main damage</b> (gun/abilities) and buy early counters ahead of time (shields · Battle Vest · Enchanter's Emblem · Healbane) (${yt('NV8G-p3xzmI', '0:46', 'Metro 아이템 0:46', 'Metro items 0:46')}).</li>
<li><b>Green (Vitality) items only up to about 4.8k before your first big item.</b> The further behind you are, the less green; first check whether you died to bad positioning.</li>
<li><b>Don't change the build order on a whim.</b> Counter items only when something actually hurts you. At first, follow the stats build on the <button class="sg-link" data-page="guide">Heroes</button> page as it is.</li>
<li>An item bought by mistake is fully refunded before you leave the shop area, otherwise 50%.</li></ul>`)
      },
      {
        id: 'movement',
        title: L('이동 기술', 'Movement'),
        short: L('하루에 하나씩', 'One a day'),
        body: L(`<table class="sg-table steps"><tbody>
<tr><td>활주(슬라이딩)</td><td>빠르게 달리다 앉기. 활주(슬라이딩) 중 사격은 탄약 무한.</td></tr>
<tr><td>대시 점프</td><td>대시 직후 점프. 활력(스태미나) 바가 파래질 때 누르면 멀리 갑니다.</td></tr>
<tr><td>하강 대시</td><td>공중에서 아래로 대시(스태미나 0.5칸). 착지 후 활주(슬라이딩)로 이어가기.</td></tr>
<tr><td>벽 점프</td><td>공중 첫 벽 점프는 활력(스태미나) 0. 2층은 더블 점프 대신 벽 점프 + 오르기.</td></tr>
<tr><td>오르기 활주</td><td>난간을 넘는 중 W + 앉기.</td></tr>
<tr><td>에어 스트레이프</td><td>공중에서는 W를 떼고 A/D와 마우스로 방향 전환.</td></tr></tbody></table>
<p>최상위권이 아니면 무빙보다 에임과 능력 활용, 그리고 <a href="#sg-basics">언제 움직일지</a>가 먼저입니다. 하루에 하나씩 연습 모드에서 익히세요.${yt('E5CRaB37G5E', '0:54', 'Natan')}${yt('Ev2J92nJduY', '0:19', '장욱')}</p>`, `<table class="sg-table steps"><tbody>
<tr><td>Slide</td><td>Crouch while running fast. Shooting while sliding uses no ammo.</td></tr>
<tr><td>Dash-Jump</td><td>Jump right after a dash. Press it when the Stamina bar turns blue to go far.</td></tr>
<tr><td>Down dash</td><td>Dash downward in the air (0.5 Stamina). Carry it into a Slide on landing.</td></tr>
<tr><td>Wall jump</td><td>Your first wall jump in the air costs no Stamina. For a second floor, wall jump + mantle instead of a double jump.</td></tr>
<tr><td>Mantle slide</td><td>W + crouch while mantling over a ledge.</td></tr>
<tr><td>Air strafe</td><td>In the air, release W and turn with A/D and the mouse.</td></tr></tbody></table>
<p>Unless you are near the top, aim, ability use and <a href="#sg-basics">when to move</a> come before movement tech. Learn one a day in practice mode.${yt('E5CRaB37G5E', '0:54', 'Natan')}${yt('Ev2J92nJduY', '0:19', '장욱', 'Jang Uk')}</p>`)
      },
      {
        id: 'community',
        title: L('커뮤니티 공략 모음', 'Community guides'),
        short: L('DC 데드락 갤러리 정리', 'From the DC Deadlock gallery'),
        body: L(`<p>디시인사이드 데드락 마이너 갤러리 공략 중 지금도 쓸 만한 내용을 정리했습니다. 2024년 글은 낡은 수치를 고쳐 적었습니다.</p>
<div class="sg-cards">
<article><b>${dc(146393, '뉴비가 초대받고 읽으면 좋을 공략 모음')}</b><small>감솔 · 매니저 공지</small><p>링크 모음. 상자는 3분으로 바뀜, 일부 크립 팁 스팟은 막힘. 아래 글들의 출처.</p></article>
<article><b>${dc(176674, '유입들이 왜 자꾸 무빙 타령하는지')}</b><small>2026년 10월 · 기초 운영</small><p>FPS 출신은 운영 문제를, MOBA 출신은 에임 문제를 무빙 탓으로 착각. 합류는 전선을 먼저 정리해 두는 쪽이 빠름. <a href="#sg-basics">기초 운영</a>에 정리.</p></article>
<article><b>${dc(146394, '트루퍼 영혼 분배')}</b><small>근처 인원별 분배표</small><p>1명 100% · 2명 54% · 3명 36%. 본문의 60:40은 현재 50:50.</p></article>
<article><b>${dc(135213, '뉴비 영혼 공략')}</b><small>영혼 = 돈 + 경험치</small><p>상자는 시간이 갈수록 비싸지니 후반에도 계속 먹기. (생성 시간은 지금 3분)</p></article>
<article><b>${dc(133606, '빌드 스파이크')}</b><small>투자 구간 보너스</small><p>4,800 구간 효율이 큼. 헤이즈는 탄창 아이템 대신 마법 투자로 탄창을 늘림.</p></article>
<article><b>${dc(144464, '잘해지는 팁')}</b><small>분 단위 할 일</small><p>2분 선푸시 후 상자, 4:30 웨이브 정리 후 버프, 8분 영혼 슬롯머신, 10분 영혼 단지 쪽 전선 미리 밀기.</p></article>
<article><b>${dc(144305, '영혼 슬롯머신 막타')}</b><small>영구 버프 4개</small><p>불빛이 전부 켜진 순간 강한 근거리 공격. 핑을 생각해 2~3개 남았을 때 미리 누르기.</p></article>
<article><b>${dc(95687, '컴백 메커니즘')}</b><small>지는 팀 보정</small><p>현재 위키 기준 최대 +26%, 처음 3k 차이는 무시. 하위 2명은 8분부터 초당 영혼을 받음.</p></article>
<article><b>${dc(9244, '뉴비가 쓰는 입문 가이드')}</b><small>2024년 글 · 일반 조언만 유효</small><p>계속 쏘다 재장전 중 막타 놓치기 금지, 엄폐물은 왼쪽, 메딕 옆에서 회복, 한타 이기면 바로 오브젝트.</p></article>
<article><b>${dc(5570, '중반 운영 10계명 (번역)')}</b><small>2024년 · 원리는 유효</small><p>핵심 궁이 쿨이면 싸우지 않기, 적 최강 영웅을 Tab으로 확인, 전선은 60~80% 지점 유지.</p></article>
</div>
<p class="note">추가 자료: 영웅 난이도표 statlocker.gg · 전 영웅 메타 빌드 ${dc(150435, 'DC 150435')} · 영웅 추천 ${dc(175130, 'DC 175130')}</p>`, `<p>Guides from the DCInside Deadlock minor gallery (a Korean community) that are still useful, summarized. Posts from 2024 have their outdated numbers corrected.</p>
<div class="sg-cards">
<article><b>${dc(146393, '뉴비가 초대받고 읽으면 좋을 공략 모음', 'Guides to read once you get invited')}</b><small>Gamsol · manager notice</small><p>A link collection. Crates changed to 3 min, and some creep tip spots are blocked. Source of the posts below.</p></article>
<article><b>${dc(176674, '유입들이 왜 자꾸 무빙 타령하는지', 'Why newcomers keep blaming movement')}</b><small>October 2026 · basic strategy</small><p>Players from FPS games blame movement for strategy problems, players from MOBAs blame it for aim problems. The team that clears its lanes first joins fights faster. Summarized in <a href="#sg-basics">System analysis</a>.</p></article>
<article><b>${dc(146394, '트루퍼 영혼 분배', 'Trooper Soul split')}</b><small>Split table by heroes nearby</small><p>1 hero 100% · 2 heroes 54% · 3 heroes 36%. The 60:40 in the post is now 50:50.</p></article>
<article><b>${dc(135213, '뉴비 영혼 공략', 'Soul guide for new players')}</b><small>Souls = money + experience</small><p>Crates get more valuable over time, so keep taking them late. (They now spawn every 3 min)</p></article>
<article><b>${dc(133606, '빌드 스파이크', 'Build spikes')}</b><small>Investment step bonus</small><p>The 4,800 step is very efficient. Haze grows her magazine through Spirit investment instead of magazine items.</p></article>
<article><b>${dc(144464, '잘해지는 팁', 'Tips to get better')}</b><small>What to do by the minute</small><p>Push first at 2 min then crates, clear the 4:30 wave then the buff, Sinner's Sacrifice at 8 min, push the Soul Urn-side lane ahead of 10 min.</p></article>
<article><b>${dc(144305, '영혼 슬롯머신 막타', "Sinner's Sacrifice last hit")}</b><small>4 permanent buffs</small><p>Heavy melee the moment all lights are on. Allowing for ping, press it early with 2~3 lights left.</p></article>
<article><b>${dc(95687, '컴백 메커니즘', 'Comeback mechanics')}</b><small>Losing-team bonus</small><p>Per the current wiki, up to +26%, the first 3k of the gap ignored. The bottom 2 players get Souls per sec from 8 min.</p></article>
<article><b>${dc(9244, '뉴비가 쓰는 입문 가이드', 'A beginner guide by a beginner')}</b><small>2024 post · only the general advice holds</small><p>Don't keep shooting and miss last hits while reloading, keep cover on the left, heal next to medics, go straight for objectives after winning a team fight.</p></article>
<article><b>${dc(5570, '중반 운영 10계명 (번역)', '10 rules of mid-game play (translated)')}</b><small>2024 · principles still hold</small><p>Don't fight while key ultimates are on cooldown, check the enemy's strongest hero with Tab, hold lanes at the 60~80% point.</p></article>
</div>
<p class="note">More: hero difficulty chart statlocker.gg · meta builds for every hero ${dc(150435, 'DC 150435')} · hero picks ${dc(175130, 'DC 175130')}</p>`)
      },
      {
        id: 'youtube',
        title: L('유튜브 알짜 공략', 'Best YouTube guides'),
        short: L('시청 순서 · 목차 · 핵심 정리', 'Watch order · chapters · key points'),
        body: youtubeBlock()
      }
    ];
    // 처음 하는 사람에게 필요한 순서: 게임 소개 → 요약 → 기초 운영 → 큰 흐름 → 라인전, 그다음 세부 규칙.
    return SECTION_ORDER.map(id => all.find(s => s.id === id));
  }
  function youtubeBlock() {
    const list = D().youtube,
      cats = [...new Set(list.map(v => v.cat))];
    return `${L('<p>지금 패치(2026년 9월 "잠들지 않는 도시" 업데이트)에 맞는 영상 위주로 골랐습니다. 번호 순서대로 보면 기초 → 영혼 → 운영 → 아이템 순입니다. 챕터 시간을 누르면 그 장면부터 열립니다.</p>', '<p>Picked mostly for the current patch (the September 2026 "City Never Sleeps" update). In number order they go basics → Souls → strategy → items. Click a chapter time to open the video from that scene.</p>')}
<div class="sg-yt-toc">${cats.map(c => `<span><b>${esc(L(c, list.find(v => v.cat === c).catEn))}</b> ${list.filter(v => v.cat === c).map(v => `<a href="#yt-${v.id}">${list.indexOf(v) + 1}</a>`).join(' ')}</span>`).join('')}</div>
${list
  .map(
    (v, i) => `<article class="sg-yt" id="yt-${v.id}"><a class="thumb" href="https://www.youtube.com/watch?v=${v.id}" target="_blank"><img src="${v.thumb || `assets/yt/${v.id}.jpg`}" alt=""><span>${esc(v.length)}</span></a><div><h4><em>${i + 1}</em>${esc(L(v.title, v.titleEn))}</h4><p class="meta">${esc(L(v.channel, v.channelEn))} · ${esc(v.date)} · ${v.lang === 'ko' ? L('한국어', 'Korean') : L('영어', 'English')} · ${esc(L(v.cat, v.catEn))}${v.old ? ` · <span class="old">${L('주의: ', 'Note: ')}${esc(L(v.old, v.oldEn))}</span>` : ''}</p><p class="why">${esc(L(v.why, v.whyEn))}</p><details><summary>${L('목차', 'Chapters')}${v.chaptersMade ? L(' (자막으로 구성)', ' (built from subtitles)') : ''}</summary><ol class="chapters">${v.chapters.map(([t, label, en]) => `<li>${yt(v.id, t, t)} ${esc(L(label, en))}</li>`).join('')}</ol></details><ul class="take">${L(v.takeaways, v.takeawaysEn).map(t => `<li>${esc(t)}</li>`).join('')}</ul>${v.basis ? L(`<p class="note">핵심 정리는 ${esc(v.basis)}입니다.</p>`, `<p class="note">Key points are based on ${esc(v.basisEn || v.basis)}.</p>`) : ''}</div></article>`
  )
  .join('')}`;
  }
  // The whole guide is one page, namu-wiki style: 목차 and cross-links (#sg-<id>) scroll to a section,
  // and every source is gathered in one 출처 list at the bottom. pick() is called by the page shells
  // (desktop.js, the website) on click and returns the section to scroll to.
  const SECTION_ORDER = ['about', 'summary', 'basics', 'macro', 'lane', 'rules', 'jungle', 'objectives', 'items', 'timeline', 'diagnose', 'movement', 'community', 'youtube'];
  function guidePage(state) {
    const list = sections(state),
      notes = [];
    const body = list
      .map(
        (s, i) =>
          `<section class="card sg-sec" id="sg-${s.id}"><h2><em>${i + 1}.</em> ${esc(s.title)}</h2>${
            s.key ? `<div class="sg-key"><b>${L('핵심', 'Key points')}</b><ul>${s.key.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''
          }${footnotes(numbered(s.body, i + 1), s.id, notes)}</section>`
      )
      .join('');
    const refs = notes.length
      ? `<section class="card sg-sec sg-fns" id="sg-refs"><h2>${L('출처', 'Sources')}</h2><ol>${notes
          .map((x, j) => `<li id="fn-${j + 1}"><span>[${j + 1}]</span> <a href="${x.href}" target="_blank">${x.fn}</a></li>`)
          .join('')}</ol></section>`
      : '';
    return `<div class="page-heading"><div>${L(
      `<h1>공략</h1><p>데드락 기본 공략과 영혼 올리는 법 · ${esc(D().updated)} 기준 · 패치에 따라 수치가 바뀔 수 있음 · 용어는 게임 한국어판 표기</p>`,
      `<h1>Guide</h1><p>Deadlock basics and how to earn more Souls · as of ${esc(D().updated)} · numbers may change with patches · terms follow the game's English client</p>`
    )}</div></div>
<div class="sg-layout"><nav class="sg-toc" aria-label="${L('목차', 'Contents')}"><b>${L('목차', 'Contents')}</b><ol>${list
      .map((x, i) => `<li data-sec="${x.id}" class="${i ? '' : 'on'}"><a href="#sg-${x.id}"><span>${esc(x.title)}</span><small>${esc(x.short)}</small></a></li>`)
      .join('')}</ol></nav>
<div class="sg-body">${body}${refs}</div></div>`;
  }
  // Sub-headings get namu-wiki numbers (3.1, 3.2 ...).
  function numbered(body, no) {
    let m = 0;
    return body.replace(/<h4>/g, () => `<h4><em>${no}.${++m}.</em> `);
  }
  // Every source link becomes [n] in the text and one line in the 출처 list at the bottom of the page; the same
  // URL keeps its number. "출처 a · b" and "(a)" collapse to the marks alone. The link sections
  // (커뮤니티, 유튜브) are lists of sources themselves and stay as they are.
  function footnotes(body, id, notes) {
    if (id === 'community' || id === 'youtube') return body;
    const A = '<a class="src[^"]*" href="[^"]*" target="_blank" data-fn="[^"]*">[^<]*</a>',
      run = new RegExp(String.raw`(출처\s*)?(\()?(${A}(?:\s*(?:·|/|,)?\s*${A})*)(\))?`, 'g'),
      one = /<a class="src( keep)?" href="([^"]*)" target="_blank" data-fn="([^"]*)">([^<]*)<\/a>/g;
    const mark = (href, fn) => {
      let n = notes.findIndex(x => x.href === href) + 1;
      if (!n) n = notes.push({ href, fn });
      return `<sup class="fn"><a href="#fn-${n}" title="${fn}">[${n}]</a></sup>`;
    };
    return body.replace(run, (all, lead, open, links, close) => {
      const marks = links.replace(/\s*(?:·|\/|,)?\s*(?=<a )/g, '').replace(one, (x, keep, href, fn, label) => (keep ? `${label}${mark(href, fn)}` : mark(href, fn)));
      // A lone "(" or ")" belongs to the sentence, not to the link.
      return (open && !close ? open : '') + marks + (close && !open ? close : '');
    });
  }
  // A click on a 목차 entry, a cross-link or a footnote mark: returns the element to scroll to.
  function pick(target) {
    const el = target?.closest?.('a[href^="#sg-"], .sg-layout a[href^="#fn-"]');
    return el ? document.getElementById(el.getAttribute('href').slice(1)) : null;
  }
  // 목차 follows the scroll: the last section whose top has passed the header is marked.
  let spyFrame = 0;
  function spy() {
    spyFrame = 0;
    const secs = document.querySelectorAll('.sg-body > .sg-sec[id^="sg-"]:not(#sg-refs)');
    if (!secs.length) return;
    // A section counts once its top is within its scroll margin (under the sticky header and 목차).
    const line = parseFloat(getComputedStyle(secs[0]).scrollMarginTop) + 24;
    let cur = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top < line) cur = s;
    const id = cur.id.slice(3),
      on = document.querySelector('.sg-toc li.on');
    if (on?.dataset.sec === id) return;
    on?.classList.remove('on');
    const li = document.querySelector(`.sg-toc li[data-sec="${id}"]`);
    if (!li) return;
    li.classList.add('on');
    // On phones the 목차 is a sideways row: keep the marked chip in view.
    const toc = li.closest('.sg-toc');
    if (toc.scrollWidth > toc.clientWidth + 4) toc.scrollLeft = li.offsetLeft - (toc.clientWidth - li.offsetWidth) / 2;
  }
  document.addEventListener('scroll', () => (spyFrame ||= requestAnimationFrame(spy)), { capture: true, passive: true });

  // --- 빌드 스타일 (in the 영웅 page): per hero, the styles its games actually took (tools/build-archetypes.cjs). ---
  function buildStyles(id) {
    const A = window.HERO_ARCHETYPES,
      h = A?.heroes[id];
    if (!h) return '';
    const items = new Map((window.ITEM_KO || []).map(i => [i.id, i])),
      cat = new Map((window.ITEM_CATALOG || []).map(i => [i.id, i]));
    const en = window.I18N?.lang === 'en';
    const name = it => (en ? cat.get(it)?.name || it : items.get(it)?.ko || cat.get(it)?.name || it),
      icon = it => (cat.get(it)?.file ? `<img src="${cat.get(it).file}" alt="">` : '');
    const phase = (order, from, to) => order.filter(o => o.t >= from && o.t < to);
    const SLOT = en
      ? { weapon: ['Weapon', 'w'], spirit: ['Spirit', 's'], vitality: ['Vitality', 'v'] }
      : { weapon: ['무기', 'w'], spirit: ['능력', 's'], vitality: ['생존', 'v'] };
    // Style names come from tools/build-archetypes.cjs in Korean ("무기·마법 혼합", "능력 중심").
    const WORD = { 무기: 'Weapon', 마법: 'Spirit', 능력: 'Spirit', 생존: 'Vitality' };
    const style = s => (en ? s.replace(/무기|마법|능력|생존/g, w => WORD[w]).replace(/·(\S+) 혼합$/, ' · $1 mix').replace(/ 중심$/, '-focused') : s);
    // Where each style leans compared with the hero's other styles (e.g. Seven: gun vs ultimate builds).
    const mean = s => h.groups.reduce((a, x) => a + (x.split[s] || 0), 0) / h.groups.length;
    const lean = grp => {
      const [s, d] = Object.keys(SLOT)
        .map(s => [s, (grp.split[s] || 0) - mean(s)])
        .sort((a, b) => b[1] - a[1])[0];
      return d >= 3 ? L(`다른 스타일보다 ${SLOT[s][0]} +${Math.round(d)}%p`, `${SLOT[s][0]} +${Math.round(d)}%p vs other styles`) : '';
    };
    const card = grp => {
      const sig = grp.signature ? name(grp.signature) : '';
      return `<article class="card sg-build ${grp.recommended ? 'rec' : ''}"><div class="card-head"><div><h3>${grp.recommended ? L('<span class="sg-rec">뉴비 추천</span>', '<span class="sg-rec">New player pick</span>') : ''}${esc(style(grp.style))}${sig ? ` · ${esc(sig)}` : ''}</h3><p class="meta">${L(
        `경기 ${grp.share}% · 승률 <b class="${grp.win >= 52 ? 'up' : grp.win < 48 ? 'down' : ''}">${grp.win}%</b> · ${n(grp.games)}판`,
        `${grp.share}% of games · win rate <b class="${grp.win >= 52 ? 'up' : grp.win < 48 ? 'down' : ''}">${grp.win}%</b> · ${n(grp.games)} games`
      )}${lean(grp) ? `<span class="sg-lean">${lean(grp)}</span>` : ''}</p></div><div class="sg-split">${Object.entries(grp.split)
        .filter(([s]) => SLOT[s])
        .map(([s, v]) => `<span class="${SLOT[s][1]}" style="flex:${Math.max(v, 1)}">${SLOT[s][0]} ${v}%</span>`)
        .join('')}</div></div>${[
        [L('초반 (~10분)', 'Early (~10 min)'), 0, 600],
        [L('중반 (10~20분)', 'Mid (10~20 min)'), 600, 1200],
        [L('후반 (20분~)', 'Late (20 min~)'), 1200, 1e9]
      ]
        .map(([label, a, b]) => {
          const xs = phase(grp.order, a, b);
          return xs.length
            ? `<div class="sg-phase"><small>${label}</small><ol>${xs.map(o => `<li title="${L(`${esc(name(o.id))} · ${o.p}%가 보유 · 평균 ${mmss(o.t)} 구매`, `${esc(name(o.id))} · ${o.p}% own it · bought at ${mmss(o.t)} on average`)}">${icon(o.id)}<span>${esc(name(o.id))}</span><em>${mmss(o.t)} · ${o.p}%</em></li>`).join('')}</ol></div>`
            : '';
        })
        .join('')}</article>`;
    };
    return `<section class="op-box sg-styles"><h3>${L(
      `빌드 스타일 <small>실제 경기 ${n(h.games)}판(최근 ${A.days}일, 20분 이상 일반전)을 빌드가 흘러간 방향대로 묶은 ${h.groups.length}가지 · 묶음 기준: 20분까지 산 아이템 · 아이템 옆 숫자는 평균 구매 시각과 그 스타일에서 보유한 비율 · deadlock-api.com</small>`,
      `Build styles <small>${n(h.games)} real games (last ${A.days} days, normal games of 20+ min) grouped into ${h.groups.length} styles by where the build went · grouped by: items bought by 20 min · the numbers beside an item are its average purchase time and the share of that style owning it · deadlock-api.com</small>`
    )}</h3>
<div class="sg-builds">${h.groups.map(card).join('')}</div>
${L(
  '<p class="note">"뉴비 추천"은 경기의 15% 이상이 쓰는 스타일 중 승률이 가장 높은 것. 승률 차이에는 실력 차이도 섞여 있으니 2%p 안쪽은 비슷한 수준. 처음엔 추천 스타일을 순서대로 따라 사고, 익숙해지면 상대 조합에 맞춰 카운터 아이템 끼워 넣기.</p>',
  '<p class="note">"New player pick" is the style with the highest win rate among those used in 15% or more of games. Win rates also reflect skill gaps, so within 2%p is about even. At first, buy the picked style in order; once comfortable, fit in counter items for the enemy comp.</p>'
)}</section>`;
  }

  window.StrategyUI = { guidePage, pick, buildStyles, worthFigure, sections };
})();

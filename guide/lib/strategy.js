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
  // Source links. guidePage() turns them into numbered footnotes collected under the section (namu-wiki
  // style); `keep` leaves the label in the sentence when it is part of it ("Trooper 문서는 ...").
  // data-fn is the line shown in that list.
  const src = (url, label, fn, keep) =>
    `<a class="src${keep ? ' keep' : ''}" href="${url}" target="_blank" data-fn="${esc(fn)}">${esc(label)}</a>`;
  const wiki = (page, label = 'deadlock.wiki', keep) =>
    src(`https://deadlock.wiki/${page}`, label, `deadlock.wiki · ${decodeURIComponent(page).replace(/_/g, ' ').replace('#', ' › ')}`, keep);
  const dc = (no, label) => src(`https://gall.dcinside.com/mgallery/board/view/?id=deadlock&amp;no=${no}`, label, `DC 데드락 갤러리 · ${label.replace(/^DC /, '')}`);
  const yt = (id, at, label) => {
    const [m, s = 0] = String(at).split(':').map(Number),
      t = m * 60 + s,
      v = D().youtube.find(x => x.id === id);
    return src(`https://www.youtube.com/watch?v=${id}&amp;t=${t}s`, label, v ? `${v.channel} · ${v.title} · ${at}부터` : `YouTube · ${label}`);
  };
  const fig = (svg, caption) => `<figure class="sg-fig">${svg}<figcaption>${caption}</figcaption></figure>`;
  const callout = (kind, title, body) => `<div class="sg-callout ${kind}"><b>${title}</b><div>${body}</div></div>`;

  // --- Pictures: drawn here so they follow patches and stay readable in the dark theme. ---
  function orbFigure() {
    return `<svg viewBox="0 0 640 300" role="img" aria-label="트루퍼가 죽으면 바닥 구슬과 공중 구슬이 반씩 나온다">
  <rect x="245" y="10" width="150" height="40" rx="8" class="f-box"/><text x="320" y="35" class="f-t c">트루퍼 처치 (값 100%)</text>
  <path d="M290 50 L160 92" class="f-arrow"/><path d="M350 50 L480 92" class="f-arrow"/>
  <circle cx="150" cy="110" r="20" class="f-ground"/><text x="150" y="116" class="f-t c b">50%</text>
  <circle cx="490" cy="110" r="20" class="f-float"/><text x="490" y="116" class="f-t c b">50%</text>
  <text x="150" y="152" class="f-t c b">바닥 구슬</text>
  <text x="490" y="152" class="f-t c b">공중 구슬 (빛나면 사격 가능)</text>
  <text x="50" y="178" class="f-t s">· 디나이 불가 (적에게는 흰색)</text>
  <text x="50" y="198" class="f-t s">· 가까이 가면 날아와 흡수</text>
  <text x="50" y="218" class="f-t s">· 18초 뒤 소멸 (10분 이후 40초)</text>
  <text x="390" y="178" class="f-t s ok">· 내가 쏨 → 즉시 확정</text>
  <text x="390" y="198" class="f-t s bad">· 적이 쏨 → 디나이 (적이 가져감)</text>
  <text x="390" y="218" class="f-t s">· 1초 방치 → 근처 아군에게 자동</text>
  <text x="390" y="238" class="f-t s bad">· 근처에 아무도 없으면 소멸</text>
  <rect x="200" y="256" width="240" height="34" rx="8" class="f-box hl"/><text x="320" y="278" class="f-t c">근거리 공격 막타: 공중 구슬 없이 즉시 내 것</text>
</svg>`;
  }
  function shareFigure() {
    const rows = D().share,
      bar = (v, max) => (v / max) * 230;
    return `<svg viewBox="0 0 640 230" role="img" aria-label="근처 아군 수에 따른 1인당 영혼">
  <text x="20" y="24" class="f-t b">근처 영웅 수</text><text x="120" y="24" class="f-t b">1인당 받는 몫</text><text x="420" y="24" class="f-t b">팀 전체 합</text>
  ${rows
    .map(
      (r, i) => `<text x="40" y="${56 + i * 30}" class="f-t">${r.n}명</text>
  <rect x="120" y="${42 + i * 30}" width="${bar(r.each, 100)}" height="18" rx="3" class="f-bar ${r.n === 1 ? 'hl' : ''}"/><text x="${128 + bar(r.each, 100)}" y="${56 + i * 30}" class="f-t">${r.each}%</text>
  <rect x="420" y="${42 + i * 30}" width="${bar(r.total, 108) * 0.7}" height="18" rx="3" class="f-bar2"/><text x="${428 + bar(r.total, 108) * 0.7}" y="${56 + i * 30}" class="f-t">${r.total}%</text>`
    )
    .join('')}
</svg>`;
  }
  function timelineFigure() {
    const T = D().timeline,
      x = t => 80 + (t / 720) * 500;
    return `<svg viewBox="0 0 640 210" role="img" aria-label="0분부터 12분까지 생성 시각">
  <line x1="80" y1="110" x2="580" y2="110" class="f-axis"/>
  ${[0, 2, 4, 6, 8, 10, 12].map(m => `<line x1="${x(m * 60)}" y1="104" x2="${x(m * 60)}" y2="116" class="f-axis"/><text x="${x(m * 60)}" y="134" class="f-t c s">${m}:00</text>`).join('')}
  ${T.map(
    (e, i) => `<circle cx="${x(e.t)}" cy="110" r="6" class="f-dot"/>
  <text x="${x(e.t)}" y="${i % 2 ? 160 : 70}" class="f-t c b">${esc(e.label)}</text><text x="${x(e.t)}" y="${i % 2 ? 178 : 88}" class="f-t c s">${esc(e.note)}</text>`
  ).join('')}
  ${[90, 150, 270, 450].map(t => `<path d="M${x(t)} 96 L${x(t)} 110" class="f-warn"/>`).join('')}
  <text x="80" y="200" class="f-t s warn">▲ 주황 표시: 오브젝트 30초 전, 웨이브를 먼저 밀어 둘 시각 (1:30 · 2:30 · 4:30 · 7:30)</text>
</svg>`;
  }
  function loopFigure() {
    const steps = [
      ['0초', '웨이브 도착', '공중 구슬 쏘며 정리'],
      ['~10초', '밀어 넣기', '적 가디언 쪽으로'],
      ['~12초', '근처 캠프·상자', '가까운 1곳만'],
      ['~25초', '전선 복귀', '다음 웨이브 도착 전']
    ];
    return `<svg viewBox="0 0 640 170" role="img" aria-label="30초 웨이브 사이클">
  ${steps
    .map(
      ([t, a, b], i) => `<rect x="${20 + i * 156}" y="40" width="140" height="80" rx="10" class="f-box ${i === 2 ? 'hl' : ''}"/>
  <text x="${90 + i * 156}" y="62" class="f-t c s">${t}</text><text x="${90 + i * 156}" y="86" class="f-t c b">${a}</text><text x="${90 + i * 156}" y="106" class="f-t c s">${b}</text>
  ${i < 3 ? `<path d="M${162 + i * 156} 80 L${174 + i * 156} 80" class="f-arrow"/>` : ''}`
    )
    .join('')}
  <path d="M600 125 C 600 160, 90 160, 90 125" class="f-arrow dash"/><text x="345" y="166" class="f-t c s">30초마다 반복 (20분부터 25초, 35분부터 20초)</text>
  <text x="20" y="24" class="f-t b">웨이브 사이의 빈 시간에 정글·상자를 끼워 넣는 루프</text>
</svg>`;
  }
  function worthFigure(mark) {
    const W = D().worth,
      x = m => 60 + (m / 30) * 540,
      y = v => 200 - (v / 34000) * 180,
      line = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(W.minutes[i]).toFixed(1)} ${y(v).toFixed(1)}`).join(' '),
      band = W.low.map((v, i) => [x(W.minutes[i]), y(v - W.lowSd[i])]),
      bandTop = W.low.map((v, i) => [x(W.minutes[i]), y(v + W.lowSd[i])]);
    return `<svg viewBox="0 0 640 240" role="img" aria-label="분당 순자산 기준선">
  ${[0, 10000, 20000, 30000].map(v => `<line x1="60" x2="600" y1="${y(v)}" y2="${y(v)}" class="f-grid"/><text x="52" y="${y(v) + 4}" class="f-t r s">${v / 1000}k</text>`).join('')}
  ${[0, 5, 10, 15, 20, 25, 30].map(m => `<text x="${x(m)}" y="222" class="f-t c s">${m}분</text>`).join('')}
  <path d="${[...band, ...bandTop.reverse()].map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')}Z" class="f-band"/>
  <path d="${line(W.low)}" class="f-line low"/><path d="${line(W.high)}" class="f-line high"/>
  ${W.minutes.map((m, i) => `<circle cx="${x(m)}" cy="${y(W.low[i])}" r="3" class="f-dot"/>`).join('')}
  ${mark ? `<circle cx="${x(mark.m)}" cy="${y(mark.v)}" r="6" class="f-me"/><text x="${x(mark.m) + 10}" y="${y(mark.v) + 4}" class="f-t b me">나 ${k(mark.v)}</text>` : ''}
  <text x="70" y="24" class="f-t s"><tspan class="leg-low">━ 하위 랭크 평균</tspan>  <tspan class="leg-high">━ 상위 랭크 평균</tspan>  <tspan class="leg-band">▇ 하위 평균 ± 표준편차</tspan></text>
</svg>`;
  }
  function levelFigure() {
    const L = window.HERO_META?.levels || [],
      x = s => 30 + (s / 6000) * 580;
    let unlocks = 0;
    return `<svg viewBox="0 0 640 140" role="img" aria-label="영혼에 따른 능력 해금과 포인트">
  <line x1="30" y1="70" x2="610" y2="70" class="f-axis"/>
  ${L.filter(l => l.souls <= 6000)
    .map(
      l => `<line x1="${x(l.souls)}" y1="${l.unlock ? 52 : 62}" x2="${x(l.souls)}" y2="78" class="${l.unlock ? 'f-unlock' : 'f-point'}"/>
  <text x="${x(l.souls)}" y="96" class="f-t c s">${l.souls >= 1000 ? (l.souls / 1000).toFixed(1) + 'k' : l.souls}</text>${l.unlock ? `<text x="${x(l.souls)}" y="44" class="f-t c s b">${l.souls === 3200 ? '궁극기' : `능력${++unlocks}`}</text>` : ''}`
    )
    .join('')}
  <text x="30" y="126" class="f-t s">긴 눈금 = 능력 해금 · 짧은 눈금 = 능력 포인트 +1 (강화 비용 1·2·5) · 모은 영혼 48,600(순자산 49,200)에 32개로 전부 마스터</text>
</svg>`;
  }
  // 전선 구조물: the game's own portraits (panorama/images/npcs, work/map-blender/export_objectives.py)
  // in the order they fall, then where each stands on the map (map-objectives.js).
  const STRUCTS = [
    { kind: 'guardian', img: 'npc-guardian', name: '가디언', where: '전선마다 1개 · 전선 가운데쯤', what: '첫 방어 타워. 가까이 온 적 영웅과 트루퍼를 공격.', souls: '1,375' },
    { kind: 'walker', img: 'npc-walker', name: '워커', where: '전선마다 1개 · 기지 쪽', what: '걸어 다니는 큰 로봇 포탑. 부수면 팀에 플렉스 슬롯 1칸.', souls: '3,675' },
    { kind: 'base_guardian', img: '', name: '기지 가디언', where: '기지 입구 · 전선마다', what: '기지 안으로 들어가는 길을 막는 가디언. 부서지면 공격 팀 집라인이 빨라짐.', souls: '1,000' },
    { kind: 'shrine', img: 'npc-shrine', name: '성지', where: '기지 안 2개', what: '패트런을 지키는 보호막 장치. 2개 모두 부서져야 패트런 공격 가능.', souls: '2,000' },
    { kind: 'patron', img: 'npc-patron-hiddenking', name: '패트런', where: '기지 한가운데', what: '부수면 승리. 체력 절반부터는 구덩이 안에서만 피해.', souls: '승리' }
  ];
  function structuresFigure() {
    return `<div class="sg-structs">${STRUCTS.map(
      (x, i) =>
        `<article class="${x.kind}"><div class="pic">${
          x.img ? `<img src="assets/objectives/${x.img}.png" alt="${x.name}">` : '<img class="icon" src="assets/objectives/guardian.png" alt="">'
        }<span class="no">${i + 1}</span></div><h5>${x.name}</h5><p class="where">${x.where}</p><p>${x.what}</p><p class="souls">${x.souls === '승리' ? '부수면 <b>승리</b>' : `영혼 <b>${x.souls}</b>`}</p></article>`
    ).join('<i class="sg-next" aria-hidden="true">→</i>')}</div>`;
  }
  function farmOrderFigure() {
    const steps = [
      ['1순위', '전선', ['트루퍼 = 가장 큰 수입', '상대를 수비로 묶음', '집라인 연장·활동 범위']],
      ['2순위', '영혼 슬롯머신', ['8:00 생성·5:00 리스폰', '잭팟 = 영구 능력치', '옆 몹까지 처치']],
      ['3순위', '정글 캠프', ['소형·중형 위주', '대형은 화력 충분할 때', '또는 희생 제물']],
      ['4순위', '상자·황금 조각상', ['지나가는 길에', '근처에 할 게 없을 때']]
    ];
    return `<svg viewBox="0 0 640 214" role="img" aria-label="캐리 중반 파밍 우선순위">
  <text x="14" y="24" class="f-t b">캐리 중반(10~20분) 파밍 우선순위</text>
  ${steps
    .map(
      ([r, a, lines], i) => `<rect x="${14 + i * 154}" y="40" width="146" height="120" rx="10" class="f-box ${i < 2 ? 'hl' : ''}"/>
  <text x="${87 + i * 154}" y="62" class="f-t c s">${r}</text><text x="${87 + i * 154}" y="84" class="f-t c b">${a}</text>
  ${lines.map((t, j) => `<text x="${87 + i * 154}" y="${108 + j * 18}" class="f-t c s">${t}</text>`).join('')}
  ${i < 3 ? `<path d="M${160 + i * 154} 100 L${168 + i * 154} 100" class="f-arrow"/>` : ''}`
    )
    .join('')}
  <path d="M241 164 C 241 192, 87 192, 87 164" class="f-arrow dash"/><text x="164" y="206" class="f-t c s">전선 밀기 ↔ 영혼 슬롯머신 반복</text>
  <text x="470" y="190" class="f-t c s">영혼 슬롯머신이 없으면 3·4순위로</text>
</svg>`;
  }
  // 영혼 슬롯머신 자리만 지도에. 종탑 3대 · 안개 광장 2곳은 위키 기준.
  function invadeFigure() {
    const zone = (x, t, s, cls) => `<rect x="${x}" y="40" width="190" height="130" rx="10" class="f-box"/><text x="${x + 95}" y="60" class="f-t c b">${t}</text><text x="${x + 95}" y="78" class="f-t c s ${cls}">${s}</text>`,
      dot = (x, y, n, t, anchor) => `<circle cx="${x}" cy="${y}" r="11" class="f-dot"/><text x="${x}" y="${y + 4}" class="f-t c b" style="fill:var(--n-50)">${n}</text><text x="${x + (anchor === 'r' ? -16 : 16)}" y="${y + 4}" class="f-t s ${anchor === 'r' ? 'r' : ''}">${t}</text>`;
    return `<svg viewBox="0 0 640 222" role="img" aria-label="앞설 때 정글 동선">
  <defs><marker id="sg-ah-inv" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" style="fill:var(--n-700)"/></marker></defs>
  <text x="20" y="24" class="f-t b">앞설 때: 위험한 곳부터 먹고 안전한 쪽으로 빠지기</text>
  ${zone(20, '아군 정글', '안전', 'ok')}${zone(225, '전선', '웨이브', '')}${zone(430, '상대 정글', '위험', 'bad')}
  <path d="M332 100 C 400 100, 470 100, 506 112" class="f-arrow" marker-end="url(#sg-ah-inv)"/>
  <path d="M506 136 C 420 150, 220 150, 128 140" class="f-arrow" marker-end="url(#sg-ah-inv)"/>
  <path d="M116 152 C 170 168, 260 168, 306 158" class="f-arrow dash" marker-end="url(#sg-ah-inv)"/>
  ${dot(320, 100, 1, '웨이브 밀기', 'r')}${dot(518, 124, 2, '먼저', 'r')}${dot(116, 140, 3, '나중에', 'r')}<text x="314" y="162" class="f-t s">다음 웨이브</text>
  <text x="320" y="190" class="f-t c s">상대 정글 1곳 = 내 영혼 + 상대 몫 감소 → 영혼 격차가 크게 벌어짐</text>
  <text x="320" y="210" class="f-t c bad">반대 순서면 파밍이 끝날 때 상대 진영 깊숙이 서 있게 됨</text>
</svg>`;
  }
  // 캐리 vs 서포터 강한 시점. 수치 없는 개념도 (네크로 0:41·8:17).
  function carryFigure() {
    const x = m => 50 + ((m - 5) / 25) * 560;
    return `<svg viewBox="0 0 640 256" role="img" aria-label="캐리와 서포터의 강한 시점 개념도">
  <text x="20" y="22" class="f-t b">캐리와 서포터가 강한 시점 (개념도)</text>
  <rect x="${x(10)}" y="34" width="${x(20) - x(10)}" height="146" style="fill:color-mix(in srgb, var(--accent) 8%, transparent)"/>
  <text x="${(x(10) + x(20)) / 2}" y="50" class="f-t c s">중반 10~20분</text>
  <line x1="50" x2="610" y1="180" y2="180" class="f-axis"/>
  ${[5, 10, 15, 20, 25, 30].map(m => `<text x="${x(m)}" y="198" class="f-t c s">${m}분</text>`).join('')}
  <path d="M${x(5)} 120 C ${x(10)} 92, ${x(16)} 84, ${x(30)} 96" class="f-line high"/>
  <path d="M${x(5)} 168 C ${x(12)} 160, ${x(16)} 130, ${x(18)} 92 S ${x(24)} 52, ${x(30)} 46" class="f-line low"/>
  <line x1="${x(18)}" x2="${x(18)}" y1="84" y2="180" class="f-warn" stroke-dasharray="4 4"/>
  <text x="${x(18) + 6}" y="78" class="f-t r b warn">캐리 전성기 → 싸움 합류</text>
  <text x="56" y="222" class="f-t s">전성기 전: 파밍 집중 · 약할 땐 싸우지 않기 · 상대가 선을 넘으면 받아치기</text>
  <text x="56" y="246" class="f-t s"><tspan class="leg-low">━ 캐리 (빅터·세븐·레이스)</tspan>   <tspan class="leg-high">━ 서포터·로머 (페이지·패러독스·싱클레어·칼리코)</tspan></text>
</svg>`;
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
        key: ['승리 조건은 킬이 아니라 상대 기지의 <b>패트런</b> 파괴', '영혼 = 돈 + 경험치. 많이 번 쪽이 강함', '전선 3개(노랑·파랑·초록), 전선 사이 건물 안팎이 정글'],
        title: '데드락은 어떤 게임인가',
        short: '6대6 3인칭 슈터 + MOBA',
        body: `<p><b>데드락(Deadlock)</b>은 밸브(Valve)가 만드는 6대6 <b>3인칭 슈터와 MOBA를 섞은 게임</b>입니다. 총을 직접 조준해 쏘고, 영웅마다 능력 4개(4번째가 궁극기)를 씁니다. 리그 오브 레전드·도타처럼 전선에 트루퍼(미니언)가 계속 나오고, 그걸 잡아 얻은 영혼으로 아이템을 사서 강해집니다. 아직 정식 출시 전(초대제 테스트)이라 패치가 잦습니다. ${wiki('Deadlock', '출처')}</p>
<div class="sg-two">
<div><b>이기는 법</b><p>상대 기지 안의 <b>패트런</b>을 부수면 승리. 킬 수가 아니라 구조물로 승부가 납니다. 킬은 영혼을 벌고 상대를 잠깐 지우는 수단일 뿐입니다.</p></div>
<div><b>영혼 = 돈 + 경험치</b><p>영혼으로 상점에서 아이템을 사고, 쌓인 영혼(순자산)에 따라 능력이 해금되고 능력 포인트가 생깁니다. 그래서 "영혼을 많이 번 쪽이 강하다"가 이 게임의 기본입니다.</p></div>
<div><b>슈터로서의 차이</b><p>헤드샷·이동 기술(활주·대시·벽 점프)·엄폐가 그대로 실력입니다. 능력보다 무기 위주 빌드, 그 반대 빌드가 모두 있습니다.</p></div>
<div><b>MOBA로서의 차이</b><p>막타를 놓쳐도 근처에만 있으면 영혼을 나눠 받고, 공중에 뜬 영혼 구슬을 총으로 쏴서 확정·디나이합니다(<a href="#sg-rules">영혼 규칙</a>).</p></div>
</div>
<h4>맵: 커스드 애플(뉴욕)</h4>
<p>맨해튼을 닮은 맵 하나에서 모든 경기를 합니다. 전선(라인)은 3개: <b>노란색 전선</b>(요크)·<b>파란색 전선</b>(브로드웨이, 가운데)·<b>초록색 전선</b>(그리니치). 2025년 2월 맵 개편 전에는 전선 4개(보라색 전선 포함)였으니 오래된 영상은 감안해서 보세요. 전선마다 자기 색 집라인이 기지에서 적 기지 쪽으로 깔려 있어 빠르게 전선에 복귀할 수 있습니다. ${wiki('Map', '출처')}</p>
<p>두 팀은 히든 킹(주황, 공장 기지)과 아치마더(파랑, 박물관 기지)입니다. 전선 사이 건물 안팎이 정글(중립 캠프·상자·영혼 슬롯머신)이고, 가운데 파란색 전선 지하 하수도에 <b>중앙 보스</b>가 있습니다.</p>`
      },
      {
        id: 'macro',
        key: ['<b>0~10분</b> 라인전·파밍 → 상대 가디언 먼저', '<b>10~25분</b> 영혼 단지·균열·중앙 보스 싸움 → 워커', '<b>25분~</b> 기지 가디언 → 성지 2개 → 패트런. 한타를 이기면 바로 구조물로'],
        title: '경기 큰 흐름',
        short: '라인전 → 오브젝트 싸움 → 기지 공략',
        body: `<h4>전선 구조물</h4>
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
</ul>`
      },
      {
        id: 'summary',
        title: '처음이라면 이것만',
        short: '30초 요약 · 이것만 지켜도 영혼이 오름',
        body: `<ol class="sg-big">
<li><b>웨이브는 30초마다 옵니다.</b> 9분 기준 한 웨이브가 ${n(at9)} 영혼, 혼자 먹으면 분당 ${n(perMin9)}. 전선을 비우면 이게 그대로 사라집니다.</li>
<li><b>공중 구슬을 쏘세요.</b> 트루퍼 값의 절반이 공중에 뜹니다. 상대가 먼저 쏘면 그 몫을 뺏깁니다. 재장전 중이면 근거리 공격으로 막타.</li>
<li><b>웨이브를 밀고 남는 15초에 캠프·상자 1곳.</b> 랭크 차이는 전선이 아니라 여기서 납니다(15분 정글 1,175 vs 1,740).</li>
<li><b>전선에 둘이 서 있으면 각자 54%.</b> 캐리는 혼자 먹을 전선으로, 셋 이상 몰려다니지 않기.</li>
<li><b>정글 영혼을 들고 죽지 마세요.</b> 정글·상자·영혼 슬롯머신 영혼은 "미확보"라 죽으면 떨어뜨립니다. 살 수 있으면 바로 사기.</li>
</ol>${callout('tip', 'Lookout으로 확인하기', '오버레이의 <b>내 성장</b> 줄이 다음 능력 포인트·궁극기까지 남은 영혼을 보여줍니다. 이 페이지의 <a href="#sg-diagnose">영혼 진단</a>은 지금 내 순자산을 랭크 평균과 비교합니다.')}`
      },
      {
        id: 'basics',
        key: ['FPS 출신: 1:1은 이기는데 전선을 비워 가디언·워커를 잃음', 'MOBA 출신: 에임이 약하면 공중 구슬 확정·디나이부터 막힘', '합류가 늦는 건 무빙보다 타이밍. <b>웨이브를 먼저 밀어 두고</b> 움직이기'],
        title: '기초 운영: 무빙보다 타이밍',
        short: 'FPS 출신·MOBA 출신이 막히는 곳',
        body: `<p>데드락은 FPS의 교전 실력과 MOBA의 운영이 둘 다 필요한 게임입니다. 어느 게임을 하다 왔느냐에 따라 막히는 곳이 다르고, 둘 다 결국 "무빙이 부족해서"라고 착각하기 쉽습니다.${dc(176674, '유입들이 왜 자꾸 무빙 타령하는지')}</p>
<div class="sg-two">
<div><b>FPS·히어로 슈터 출신</b><p>오버워치·에이펙스·마블 라이벌즈에서 온 경우. 에임과 교전이 되니 초반 킬은 잘 땁니다. 막히는 곳은 영혼 수급·디나이·전선 관리·정글·오브젝트. 시간이 갈수록 아이템 차이가 벌어지고, 그제야 정글을 돌기 시작하는데 그사이 비운 전선에서 가디언·워커가 밀립니다. "1:1은 안 지는데 왜 지지?"의 답이 대부분 여기입니다.</p><p class="fix">먼저 볼 것: <a href="#sg-rules">영혼 규칙</a> · <a href="#sg-lane">라인전 실전</a> · <a href="#sg-macro">경기 큰 흐름</a></p></div>
<div><b>리그 오브 레전드·도타 출신</b><p>전선 관리·로밍·정글·오브젝트 개념은 익숙합니다. 막히는 곳은 위아래(높이)까지 쓰는 3인칭 전투와 에임. 에임이 약하면 공중 구슬 확정·디나이부터 막혀 라인전이 무너집니다. 운영 감각 덕분에 중후반에 만회하는 경우는 많습니다.</p><p class="fix">먼저 볼 것: <a href="#sg-rules">영혼 규칙</a>의 공중 구슬·디나이 · <a href="#sg-movement">이동 기술</a></p></div>
</div>
<h4>합류가 늦는 진짜 이유</h4>
<ul class="sg-list">
<li><b>빠르게 움직이는 것과 언제 어디로 움직일지 아는 것은 다른 문제.</b> 무빙이 부족해서 늦는 것과 합류할 때를 몰라서 늦는 것은 해결법이 다릅니다.</li>
<li>고수가 한타에 제때 오는 건 무빙이 빨라서만이 아니라 <b>미리 전선을 정리해 움직일 수 있는 상황을 만들어 두기</b> 때문입니다. 영상에서 화려한 무빙만 따라 하면 이 부분을 놓칩니다.</li>
<li>순서: 싸움이 날 곳(영혼 단지·균열·중앙 보스, <a href="#sg-timeline">생성 시각</a>)이 열리기 30초 전에 <b>내 전선 웨이브를 상대 쪽으로 밀어 두기 → 그다음 이동</b>. 웨이브를 못 밀었으면 늦더라도 웨이브부터.</li>
<li>정글을 돌다가도 내 전선 웨이브가 우리 가디언 쪽으로 오면 돌아가기. 비운 전선은 트루퍼만으로도 구조물이 깎입니다.</li>
</ul>`
      },
      {
        id: 'rules',
        key: ['근처(구슬 45m·처치자 30m)에만 있어도 분배. 둘이면 각자 54%', '바닥 구슬 50% + 공중 구슬 50%. 공중 구슬은 쏴서 확정·디나이', '정글·상자·영혼 슬롯머신 영혼은 미확보 → 들고 죽으면 떨어뜨림'],
        title: '데드락 영혼 규칙',
        short: '다른 MOBA와 다른, 게임에 정해진 규칙',
        body: `<p>데드락의 트루퍼(크립) 영혼은 <b>막타를 누가 쳤는지보다 근처에 누가 있었는지</b>로 나뉩니다. 리그 오브 레전드처럼 막타를 놓쳤다고 0이 되지 않습니다.</p>
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
<p>팀 순자산이 뒤지면 트루퍼·정글·영혼 슬롯머신·오브젝트 영혼을 최대 26% 더 받습니다(차이 20%에서 최대, 처음 3k 차이는 무시). 팀 평균보다 강한 적을 잡으면 처치 보상이 최대 +126.8%. ${wiki('Comeback', '출처')}</p>`
      },
      {
        id: 'diagnose',
        key: ['기준선: 분당 약 1k, 20분에 18k 근처', '랭크 차이는 전선이 아니라 정글·상자에서 남', '흔한 원인: 전선 비우기 · 둘이 한 전선 · 공중 구슬 놓치기 · 웨이브 사이에 놀기'],
        title: '영혼이 안 쌓일 때',
        short: '내 순자산이 정상인지, 어디서 새는지',
        body: `<p>"아무리 파밍해도 영혼이 안 쌓인다"면 먼저 숫자로 확인하세요. 아래는 최근 30일 일반전의 분당 순자산 평균입니다. 순자산은 경기 중 상단 바 초상화 아래 숫자(예: 6.2k)이고, Lookout이 자동으로 읽습니다.</p>
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
<p class="sg-example"><b>예시</b> 10분에 내 순자산이 ${k(at10 - 2000)}라면 하위 평균(약 ${k(at10)})보다 2k 뒤집니다. 9~10분 웨이브 4개(${n(at9 * 4)})를 통째로 놓친 것과 같습니다. 다음 5분은 ①·④만 지켜도 따라잡습니다.</p>`
      },
      {
        id: 'timeline',
        key: ['<b>2:00</b> 소형 캠프 · <b>3:00</b> 상자 · <b>5:00</b> 기운의 파편·중형 캠프', '<b>8:00</b> 대형 캠프·영혼 슬롯머신 · <b>10:00</b> 영혼 단지 · <b>11:20~</b> 균열', '생성 30초 전 웨이브를 밀어 둔 쪽이 먼저 먹음'],
        title: '시간대별 운영 (0~12분)',
        short: '분 단위로 무엇을 할지',
        body: `${fig(timelineFigure(), '생성 시각 · 출처 deadlock.wiki Denizens·Crate·Soul Urn, Deathy·Ghoul 영상 (2026-10)')}
<table class="sg-table steps"><tbody>
<tr><td>0:00~2:00</td><td>라인전. 공중 구슬과 막타 연습 시간. 1:30 웨이브를 먼저 밀어 두면 2:00 소형 캠프를 먼저 먹습니다.</td></tr>
<tr><td>2:00</td><td>소형 캠프 등장(리스폰 1:25). 3마리 합 약 123 + 분당 1.32. 웨이브를 민 직후에만.</td></tr>
<tr><td>2:30~3:00</td><td>2:30 웨이브를 밀었으면 3:00 상자를 털기(3분마다 재생성, 60% 확률로 23 + 분당 2). 둘 중 한 명은 전선 받기.</td></tr>
<tr><td>4:30~5:00</td><td>4:30 웨이브가 5:00 기운의 파편(강한 근거리 공격으로 획득, 5분마다)을 정합니다. 중형 캠프도 5:00(리스폰 4:50).</td></tr>
<tr><td>7:30~8:00</td><td>대형 캠프·영혼 슬롯머신 8:00. 이기는 쪽은 상대 쪽 영혼 슬롯머신까지, 지는 쪽은 전선 옆 영혼 슬롯머신만.</td></tr>
<tr><td>9:00~10:00</td><td>궁극기를 아껴 두기. 10:00 영혼 단지(250 + 분당 70, 10분이면 950)와 버프 싸움.</td></tr>
<tr><td>11:20~13:20</td><td>균열 첫 열림(10~12분에 다리 위 예고 효과). 지는 팀은 저항 보너스를 받으니 뒤처질수록 싸울 가치가 큽니다.</td></tr>
</tbody></table>
${fig(loopFigure(), '웨이브 사이 루프 · 출처 Shotty·Ghoul 파밍 영상')}`
      },
      {
        id: 'lane',
        key: ['트루퍼는 막타 직전에만, 평소엔 상대 영웅 견제', '<b>웨이브 → 캠프 → 웨이브</b>: 밀고 남는 15초에 가까운 곳 한 곳', '순자산 3,800(평균 6:26) 궁극기가 먼저 열린 쪽이 킬 각'],
        title: '라인전 실전',
        short: '몇 분에 무엇을 · 막타·디나이·엄폐·회복',
        body: `<h4>분 단위로 보는 라인전</h4>
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
</ul>`
      },
      {
        id: 'jungle',
        key: ['우선순위: 전선 → 영혼 슬롯머신 → 정글 캠프 → 상자·황금 조각상', '웨이브를 민 직후 가까운 곳만, 웨이브가 오면 전선으로', '앞설 땐 상대 정글 먼저, 돌아오며 아군 정글'],
        title: '정글·상자·영혼 슬롯머신',
        short: '파밍 순서·영혼 슬롯머신·동선',
        body: `<p>정글 캠프 51곳·상자·황금 조각상·영혼 슬롯머신 자리는 <button class="sg-link" data-page="atlas">전체 지도</button>에서 종류별로 켜고 확대해 볼 수 있습니다. 경기 중 리스폰 타이머는 Lookout 미니맵 오버레이가 띄웁니다.</p>
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
<ul class="sg-list"><li>사이드에서 이기고 있으면 <b>상대 정글 먼저, 돌아오면서 아군 정글</b>. 내 영혼이 늘고 상대 몫이 줄어 격차가 크게 벌어집니다. 반대로 하면 파밍이 끝날 때 가장 위험한 곳에 서 있게 됨.</li></ul>`
      },
      {
        id: 'objectives',
        key: ['궁극기는 순자산 3,800(모은 영혼 3,200)에서 해금', '가디언 1,375 · 워커 3,675 · 중앙 보스 3,000 + 분당 50', '한타 승리 직후 가장 가까운 구조물·보스로'],
        title: '오브젝트와 성장',
        short: '가디언·워커·보스·균열·영혼 단지, 궁극기 시점',
        body: `${fig(levelFigure(), '쌓인 영혼(순자산)에 따른 능력 해금과 포인트 · deadlock-api 영웅 데이터')}
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
<li><b>균열</b>은 점령을 마치면 아군 전원이 영혼을 받습니다. 60초 넘게 다투면 영혼이 떠오르기 시작하고, 그때부턴 쏴서 확정·디나이하는 싸움입니다.</li>
<li><b>솔로킬</b>은 처치 영혼을 혼자 다 가져갑니다. 사이드 전선에서 이겼다면 그 틈에 상대 정글이나 오브젝트까지 가져가 차이를 벌리세요.</li>
<li>Tab으로 적 중 가장 잘 큰 영웅을 확인하고 경계(Lookout Tab 패널의 순자산·궁극기 표시).</li></ul>`
      },
      {
        id: 'items',
        key: ['카테고리별 투자 보너스, 3,200 → 4,800 구간 효율이 큼', '로딩 화면에서 적 주 피해(총/능력) 보고 초반 카운터', '초록(생명) 아이템은 약 4.8k까지만'],
        title: '아이템 원칙',
        short: '스파이크·카운터·초록 아이템',
        body: `<ul class="sg-list">
<li><b>카테고리별 투자 보너스</b>: 무기·생존·능력 각각 800 / 1,600 / 2,400 / 3,200 / 4,800 / 6,400 ... 구간마다 보너스가 붙고, 3,200 → 4,800 구간 효율이 특히 큽니다. 4.8k 직전이면 구매를 미루지 마세요(${dc(133606, 'DC 빌드 스파이크')}).</li>
<li><b>로딩 화면에서 적 조합의 주 피해</b>(총/능력)를 보고 초반 카운터(실드·전투 조끼·마법사의 문장·힐베인)를 미리 삽니다(${yt('NV8G-p3xzmI', '0:46', 'Metro 아이템 0:46')}).</li>
<li><b>초록(생명) 아이템은 첫 대형 아이템 전 약 4.8k까지만.</b> 뒤처질수록 초록을 줄이고, 죽은 원인이 위치 선정인지부터 확인.</li>
<li><b>빌드 순서는 임의로 바꾸지 않기.</b> 카운터템은 실제로 불편할 때만. 처음엔 <button class="sg-link" data-page="guide">영웅</button> 페이지의 통계 빌드를 그대로 따라 하세요.</li>
<li>잘못 산 아이템은 상점 범위를 벗어나기 전이면 전액 환불, 아니면 50%.</li></ul>`
      },
      {
        id: 'movement',
        title: '이동 기술',
        short: '하루에 하나씩',
        body: `<table class="sg-table steps"><tbody>
<tr><td>활주(슬라이딩)</td><td>빠르게 달리다 앉기. 활주(슬라이딩) 중 사격은 탄약 무한.</td></tr>
<tr><td>대시 점프</td><td>대시 직후 점프. 활력(스태미나) 바가 파래질 때 누르면 멀리 갑니다.</td></tr>
<tr><td>하강 대시</td><td>공중에서 아래로 대시(스태미나 0.5칸). 착지 후 활주(슬라이딩)로 이어가기.</td></tr>
<tr><td>벽 점프</td><td>공중 첫 벽 점프는 활력(스태미나) 0. 2층은 더블 점프 대신 벽 점프 + 오르기.</td></tr>
<tr><td>오르기 활주</td><td>난간을 넘는 중 W + 앉기.</td></tr>
<tr><td>에어 스트레이프</td><td>공중에서는 W를 떼고 A/D와 마우스로 방향 전환.</td></tr></tbody></table>
<p>최상위권이 아니면 무빙보다 에임과 능력 활용, 그리고 <a href="#sg-basics">언제 움직일지</a>가 먼저입니다. 하루에 하나씩 연습 모드에서 익히세요.${yt('E5CRaB37G5E', '0:54', 'Natan')}${yt('Ev2J92nJduY', '0:19', '장욱')}</p>`
      },
      {
        id: 'community',
        title: '커뮤니티 공략 모음',
        short: 'DC 데드락 갤러리 정리',
        body: `<p>디시인사이드 데드락 마이너 갤러리 공략 중 지금도 쓸 만한 내용을 정리했습니다. 2024년 글은 낡은 수치를 고쳐 적었습니다.</p>
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
<p class="note">추가 자료: 영웅 난이도표 statlocker.gg · 전 영웅 메타 빌드 ${dc(150435, 'DC 150435')} · 영웅 추천 ${dc(175130, 'DC 175130')}</p>`
      },
      {
        id: 'youtube',
        title: '유튜브 알짜 공략',
        short: '시청 순서 · 목차 · 핵심 정리',
        body: youtubeBlock()
      }
    ];
    // 처음 하는 사람에게 필요한 순서: 게임 소개 → 요약 → 기초 운영 → 큰 흐름 → 라인전, 그다음 세부 규칙.
    return SECTION_ORDER.map(id => all.find(s => s.id === id));
  }
  function youtubeBlock() {
    const list = D().youtube,
      cats = [...new Set(list.map(v => v.cat))];
    return `<p>지금 패치(2026년 9월 "잠들지 않는 도시" 업데이트)에 맞는 영상 위주로 골랐습니다. 번호 순서대로 보면 기초 → 영혼 → 운영 → 아이템 순입니다. 챕터 시간을 누르면 그 장면부터 열립니다.</p>
<div class="sg-yt-toc">${cats.map(c => `<span><b>${esc(c)}</b> ${list.filter(v => v.cat === c).map(v => `<a href="#yt-${v.id}">${list.indexOf(v) + 1}</a>`).join(' ')}</span>`).join('')}</div>
${list
  .map(
    (v, i) => `<article class="sg-yt" id="yt-${v.id}"><a class="thumb" href="https://www.youtube.com/watch?v=${v.id}" target="_blank"><img src="${v.thumb || `assets/yt/${v.id}.jpg`}" alt=""><span>${esc(v.length)}</span></a><div><h4><em>${i + 1}</em>${esc(v.title)}</h4><p class="meta">${esc(v.channel)} · ${esc(v.date)} · ${v.lang === 'ko' ? '한국어' : '영어'} · ${esc(v.cat)}${v.old ? ` · <span class="old">주의: ${esc(v.old)}</span>` : ''}</p><p class="why">${esc(v.why)}</p><details><summary>목차${v.chaptersMade ? ' (자막으로 구성)' : ''}</summary><ol class="chapters">${v.chapters.map(([t, label]) => `<li>${yt(v.id, t, t)} ${esc(label)}</li>`).join('')}</ol></details><ul class="take">${v.takeaways.map(t => `<li>${esc(t)}</li>`).join('')}</ul>${v.basis ? `<p class="note">핵심 정리는 ${esc(v.basis)}입니다.</p>` : ''}</div></article>`
  )
  .join('')}`;
  }
  // One section at a time: the 목차 picks it (data-sg-sec), cross-links (#sg-<id>) and the pager at the
  // bottom move between them. pick() is called by the page shells (desktop.js, the website) on click.
  const SECTION_ORDER = ['about', 'summary', 'basics', 'macro', 'lane', 'rules', 'jungle', 'objectives', 'items', 'timeline', 'diagnose', 'movement', 'community', 'youtube'];
  let open = null;
  function guidePage(state) {
    const list = sections(state),
      i = Math.max(0, list.findIndex(s => s.id === open)),
      s = list[i],
      prev = list[i - 1],
      next = list[i + 1];
    const pager = `<nav class="sg-pager" aria-label="이전·다음">${prev ? `<button data-sg-sec="${prev.id}"><small>이전</small>${esc(prev.title)}</button>` : '<span></span>'}${
      next ? `<button class="next" data-sg-sec="${next.id}"><small>다음</small>${esc(next.title)}</button>` : ''
    }</nav>`;
    return `<div class="page-heading"><div><h1>공략</h1><p>데드락 기본 공략과 영혼 올리는 법 · ${esc(D().updated)} 기준 · 패치에 따라 수치가 바뀔 수 있음 · 용어는 게임 한국어판 표기</p></div></div>
<div class="sg-layout"><nav class="sg-toc" aria-label="목차"><b>목차</b><ol>${list
      .map(x => `<li class="${x === s ? 'on' : ''}"><button data-sg-sec="${x.id}" ${x === s ? 'aria-current="true"' : ''}><span>${esc(x.title)}</span><small>${esc(x.short)}</small></button></li>`)
      .join('')}</ol></nav>
<div class="sg-body"><section class="card sg-sec" id="sg-${s.id}"><p class="sg-step">${i + 1} / ${list.length} · ${esc(s.short)}</p><h2><em>${i + 1}.</em> ${esc(s.title)}</h2>${
      s.key ? `<div class="sg-key"><b>핵심</b><ul>${s.key.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''
    }${footnotes(numbered(s.body, i + 1), s.id)}${pager}</section></div></div>`;
  }
  // Sub-headings get namu-wiki numbers (3.1, 3.2 ...).
  function numbered(body, no) {
    let m = 0;
    return body.replace(/<h4>/g, () => `<h4><em>${no}.${++m}.</em> `);
  }
  // Every source link becomes [n] in the text and one line in the 출처 list under the section; the same
  // URL keeps its number. "출처 a · b" and "(a)" collapse to the marks alone. The link sections
  // (커뮤니티, 유튜브) are lists of sources themselves and stay as they are.
  function footnotes(body, id) {
    if (id === 'community' || id === 'youtube') return body;
    const notes = [],
      A = '<a class="src[^"]*" href="[^"]*" target="_blank" data-fn="[^"]*">[^<]*</a>',
      run = new RegExp(String.raw`(출처\s*)?(\()?(${A}(?:\s*(?:·|/|,)?\s*${A})*)(\))?`, 'g'),
      one = /<a class="src( keep)?" href="([^"]*)" target="_blank" data-fn="([^"]*)">([^<]*)<\/a>/g;
    const mark = (href, fn) => {
      let n = notes.findIndex(x => x.href === href) + 1;
      if (!n) n = notes.push({ href, fn });
      return `<sup class="fn"><a href="#fn-${id}-${n}" title="${fn}">[${n}]</a></sup>`;
    };
    const out = body.replace(run, (all, lead, open, links, close) => {
      const marks = links.replace(/\s*(?:·|\/|,)?\s*(?=<a )/g, '').replace(one, (x, keep, href, fn, label) => (keep ? `${label}${mark(href, fn)}` : mark(href, fn)));
      // A lone "(" or ")" belongs to the sentence, not to the link.
      return (open && !close ? open : '') + marks + (close && !open ? close : '');
    });
    if (!notes.length) return out;
    return `${out}<div class="sg-fns"><b>출처</b><ol>${notes
      .map((x, j) => `<li id="fn-${id}-${j + 1}"><span>[${j + 1}]</span> <a href="${x.href}" target="_blank">${x.fn}</a></li>`)
      .join('')}</ol></div>`;
  }
  // A click on a 목차 entry, the pager or a cross-link: opens that section and returns its id.
  function pick(target) {
    const el = target?.closest?.('[data-sg-sec], a[href^="#sg-"]');
    if (!el) return null;
    const id = el.dataset.sgSec || el.getAttribute('href').slice(4);
    if (!sections().some(x => x.id === id)) return null;
    open = id;
    return id;
  }

  // --- 빌드 스타일 (in the 영웅 page): per hero, the styles its games actually took (tools/build-archetypes.cjs). ---
  function buildStyles(id) {
    const A = window.HERO_ARCHETYPES,
      h = A?.heroes[id];
    if (!h) return '';
    const items = new Map((window.ITEM_KO || []).map(i => [i.id, i])),
      cat = new Map((window.ITEM_CATALOG || []).map(i => [i.id, i]));
    const name = it => items.get(it)?.ko || cat.get(it)?.name || it,
      icon = it => (cat.get(it)?.file ? `<img src="${cat.get(it).file}" alt="">` : '');
    const phase = (order, from, to) => order.filter(o => o.t >= from && o.t < to);
    const SLOT = { weapon: ['무기', 'w'], spirit: ['능력', 's'], vitality: ['생존', 'v'] };
    // Where each style leans compared with the hero's other styles (e.g. Seven: gun vs ultimate builds).
    const mean = s => h.groups.reduce((a, x) => a + (x.split[s] || 0), 0) / h.groups.length;
    const lean = grp => {
      const [s, d] = Object.keys(SLOT)
        .map(s => [s, (grp.split[s] || 0) - mean(s)])
        .sort((a, b) => b[1] - a[1])[0];
      return d >= 3 ? `다른 스타일보다 ${SLOT[s][0]} +${Math.round(d)}%p` : '';
    };
    const card = grp => {
      const sig = grp.signature ? name(grp.signature) : '';
      return `<article class="card sg-build ${grp.recommended ? 'rec' : ''}"><div class="card-head"><div><h3>${grp.recommended ? '<span class="sg-rec">뉴비 추천</span>' : ''}${esc(grp.style)}${sig ? ` · ${esc(sig)}` : ''}</h3><p class="meta">경기 ${grp.share}% · 승률 <b class="${grp.win >= 52 ? 'up' : grp.win < 48 ? 'down' : ''}">${grp.win}%</b> · ${n(grp.games)}판${lean(grp) ? `<span class="sg-lean">${lean(grp)}</span>` : ''}</p></div><div class="sg-split">${Object.entries(grp.split)
        .filter(([s]) => SLOT[s])
        .map(([s, v]) => `<span class="${SLOT[s][1]}" style="flex:${Math.max(v, 1)}">${SLOT[s][0]} ${v}%</span>`)
        .join('')}</div></div>${[
        ['초반 (~10분)', 0, 600],
        ['중반 (10~20분)', 600, 1200],
        ['후반 (20분~)', 1200, 1e9]
      ]
        .map(([label, a, b]) => {
          const xs = phase(grp.order, a, b);
          return xs.length
            ? `<div class="sg-phase"><small>${label}</small><ol>${xs.map(o => `<li title="${esc(name(o.id))} · ${o.p}%가 보유 · 평균 ${mmss(o.t)} 구매">${icon(o.id)}<span>${esc(name(o.id))}</span><em>${mmss(o.t)} · ${o.p}%</em></li>`).join('')}</ol></div>`
            : '';
        })
        .join('')}</article>`;
    };
    return `<section class="op-box sg-styles"><h3>빌드 스타일 <small>실제 경기 ${n(h.games)}판(최근 ${A.days}일, 20분 이상 일반전)을 빌드가 흘러간 방향대로 묶은 ${h.groups.length}가지 · 묶음 기준: 20분까지 산 아이템 · 아이템 옆 숫자는 평균 구매 시각과 그 스타일에서 보유한 비율 · deadlock-api.com</small></h3>
<div class="sg-builds">${h.groups.map(card).join('')}</div>
<p class="note">"뉴비 추천"은 경기의 15% 이상이 쓰는 스타일 중 승률이 가장 높은 것. 승률 차이에는 실력 차이도 섞여 있으니 2%p 안쪽은 비슷한 수준. 처음엔 추천 스타일을 순서대로 따라 사고, 익숙해지면 상대 조합에 맞춰 카운터 아이템 끼워 넣기.</p></section>`;
  }

  window.StrategyUI = { guidePage, pick, buildStyles, worthFigure, sections };
})();

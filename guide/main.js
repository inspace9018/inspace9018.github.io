'use strict';
// Website shell for the Lookout dashboard pages that don't need a running game (lib/ is copied from
// the app by lane-electron/tools/build-site-guide.cjs). Each HTML file names its page in
// <body data-page>; this draws it with the app's own page code and handles its buttons, like
// ui/desktop.js does in the app. ?hero=<id> keeps the chosen hero in the address so it can be shared.
(() => {
  const $ = s => document.querySelector(s),
    app = $('#app'),
    page = document.body.dataset.page,
    esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const DOWNLOAD = 'https://github.com/inspace9018/lookout-releases/releases/latest';
  // No game here: the pages see an empty match.
  const data = { live: { opponents: [], allies: [], laneOpponents: [] }, intel: {}, jungle: {}, settings: {}, connection: {}, inputMode: 'web' };
  // In-game buttons (lane picks, objective timers) call the app; on the web they do nothing.
  window.lane = { command: async () => null, onState() {} };
  const heading = (title, sub, action = '') => `<div class="page-heading"><div><h1>${title}</h1><p>${sub}</p></div>${action}</div>`;
  const params = new URLSearchParams(location.search),
    heroParam = +params.get('hero') || null;
  const setHero = id => {
    const u = new URL(location.href);
    u.searchParams.set('hero', id);
    history.replaceState(null, '', u);
  };

  // 영웅: hero list with tiers, and the chosen hero's abilities and item builds.
  const guideView = { focus: 0, skill: 1, build: null, item: null, sheet: false };
  let guideId = heroParam || (window.HERO_GUIDE || [])[0]?.id,
    guideQuery = '',
    heroSort = 'tier';
  // 조합 분석: kept in this browser only.
  let comp = { us: [], them: [] },
    compSide = 'us';
  try {
    const saved = JSON.parse(localStorage.getItem('lookout-comp') || 'null');
    if (saved && Array.isArray(saved.us) && Array.isArray(saved.them)) comp = saved;
  } catch {}
  const saveComp = () => {
    try {
      localStorage.setItem('lookout-comp', JSON.stringify(comp));
    } catch {}
  };
  // 라인 동선
  let routePick = { team: null, band: null, plan: null };

  function compPage() {
    const list = window.HERO_GUIDE || [],
      a = Comp.analyze(comp.us, comp.them, list, window.HERO_TYPES || []);
    const slots = side =>
      Array.from({ length: 6 }, (_, i) => {
        const id = comp[side][i],
          g = id && IntelUI.guide(id);
        return g
          ? `<button class="comp-slot filled" data-comp-remove="${side}:${id}" title="빼기"><img src="assets/portraits/${id}-small.png" alt=""><span>${esc(g.ko)}</span></button>`
          : `<button class="comp-slot" data-comp-side="${side}">+</button>`;
      }).join('');
    const teamCard = (title, t) =>
      `<section class="card"><div class="card-head"><h2>${title}</h2><span class="label">${t.ids.length ? esc(t.style) : '영웅을 고르세요'}</span></div>${
        t.ids.length
          ? `<div class="comp-traits">${Object.entries(Comp.TRAITS)
              .map(([k, v]) => `<span class="iu-chip">${v.ko} ${t.counts[k]}</span>`)
              .join('')}</div><p class="iu-line"><i>장점</i>${t.strengths.map(esc).join(' ') || '두드러진 장점 없음'}</p><p class="iu-line"><i>약점</i>${
              t.weaknesses.map(esc).join(' ') || (t.ids.length < 4 ? '4명 이상 고르면 약점을 판단합니다' : '두드러진 약점 없음')
            }</p>`
          : ''
      }</section>`;
    const taken = new Set([...comp.us, ...comp.them]);
    const strategy = a.strategy.length
      ? `<ul class="iu-tips">${a.strategy.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`
      : '<p class="iu-empty">양 팀을 한 명 이상 고르면 전략을 제안합니다.</p>';
    const picks = a.suggestions.length
      ? `<section class="card"><div class="card-head"><h2>남은 픽 추천</h2><span class="label">우리 팀 빈자리 기준</span></div>${a.suggestions
          .map(
            x =>
              `<div class="comp-suggest"><img src="assets/portraits/${x.id}-small.png" alt=""><div><b>${esc(x.ko)}</b><small>${esc(x.why.join(' · ') || '조합 균형')}</small></div><button data-comp-pick="${x.id}">추가</button></div>`
          )
          .join('')}</section>`
      : '';
    return `${heading('조합 분석', '우리 팀과 상대 팀 조합의 장단점, 전략, 남은 픽 추천', '<div class="inline"><button data-comp-clear>비우기</button></div>')}<div class="comp-teams"><div class="comp-row ${compSide === 'us' ? 'active' : ''}"><button class="comp-label" data-comp-side="us">우리 팀</button>${slots('us')}</div><div class="comp-row them ${compSide === 'them' ? 'active' : ''}"><button class="comp-label" data-comp-side="them">상대 팀</button>${slots('them')}</div></div><p class="note">${compSide === 'us' ? '우리 팀' : '상대 팀'}에 추가 중 · 아래 영웅을 누르세요. 채워진 슬롯을 누르면 뺍니다.</p><div class="guide-top heroes">${[...list]
      .sort((x, y) => x.ko.localeCompare(y.ko, 'ko'))
      .map(h => `<button data-comp-add="${h.id}" ${taken.has(h.id) ? 'disabled' : ''}>${esc(h.ko)}</button>`)
      .join('')}</div><div class="grid intel">${teamCard('우리 조합', a.us)}${teamCard('상대 조합', a.them)}<section class="card"><div class="card-head"><h2>전략 제안</h2><span class="label">상성 기준</span></div>${strategy}</section>${picks}</div><p class="note">영웅 가이드의 성향·장단점으로 계산한 참고용 분석입니다. 승률 통계가 아닙니다.</p>`;
  }

  const draw = {
    index: () => StrategyUI.guidePage(data),
    heroes: () => OpggUI.heroes(guideId, guideQuery, heroSort, guideView),
    comp: compPage,
    map: () => MapAtlas.page(),
    routes: () => RouteGuide.page(data, routePick, heading)
  };
  function render() {
    app.innerHTML = draw[page]();
    if (page === 'map') MapAtlas.mount();
    if (page === 'index') app.querySelector('.page-heading h1').textContent = '데드락 공략';
    // Buttons that open another app page become links to the matching web page, or to the download.
    for (const b of app.querySelectorAll('button[data-page]')) {
      const a = document.createElement('a'),
        web = { guide: 'heroes.html', comp: 'comp.html', atlas: 'map.html', routes: 'routes.html', strategy: './' }[b.dataset.page];
      a.href = web || DOWNLOAD;
      a.textContent = web ? b.textContent : `Lookout ${b.textContent}`;
      b.replaceWith(a);
    }
    // "경기 기준으로 보기" follows the running game, which the web page doesn't have.
    app.querySelector('[data-route-follow]')?.remove();
  }

  document.addEventListener('click', e => {
    // 공략: the 목차, cross-links and footnote marks scroll within the page (kept in the address).
    const sec = window.StrategyUI?.pick(e.target);
    if (sec) {
      e.preventDefault();
      if (sec.id.startsWith('sg-')) history.replaceState(null, '', '#' + sec.id);
      sec.scrollIntoView({ block: 'start' });
      return;
    }
    const row = e.target.closest('tr[data-guide-id]');
    if (row) {
      guideId = +row.dataset.guideId;
      guideView.build = guideView.item = null;
      setHero(guideId);
      render();
      $('.op-detail')?.scrollIntoView({ block: 'start' });
      return;
    }
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.guideId) {
      guideId = +d.guideId;
      guideView.skill = 1;
      guideView.build = guideView.item = null;
      setHero(guideId);
    } else if (d.heroBuild) {
      guideView.build = d.heroBuild;
      guideView.item = null;
    } else if (d.ibItem) guideView.item = d.ibItem;
    else if (d.ibSheet) guideView.sheet = d.ibSheet === 'on';
    else if (d.heroSort) heroSort = d.heroSort;
    else if (d.copy != null) {
      copyText(d.copy).then(ok => {
        b.textContent = ok ? '복사됨' : '복사 실패';
        setTimeout(() => (b.textContent = '복사'), 1200);
      });
      return;
    } else if (d.routeTeam !== undefined) routePick = { ...routePick, team: +d.routeTeam };
    else if (d.routeBand) routePick = { ...routePick, team: routePick.team ?? 0, band: d.routeBand };
    else if (d.routePlan) routePick = { ...routePick, plan: d.routePlan };
    else if (d.compSide) compSide = d.compSide;
    else if (d.compAdd || d.compPick) {
      const id = +(d.compAdd || d.compPick),
        side = d.compPick ? 'us' : compSide;
      if (comp[side].length < 6 && !comp.us.includes(id) && !comp.them.includes(id)) comp[side].push(id);
      saveComp();
    } else if (d.compRemove) {
      const [side, id] = d.compRemove.split(':');
      comp[side] = comp[side].filter(x => x !== +id);
      saveComp();
    } else if (b.hasAttribute('data-comp-clear')) {
      comp = { us: [], them: [] };
      saveComp();
    } else if (page === 'heroes' && d.skill !== undefined) guideView.skill = +d.skill;
    else if (!IntelUI.handle(b, data, guideView, render)) return;
    render();
  });
  document.addEventListener('input', e => {
    if (e.target.id !== 'guide-q') return;
    guideQuery = e.target.value;
    // Only the list is redrawn: a new input box would cut off Korean typing mid-syllable.
    const fresh = document.createElement('div');
    fresh.innerHTML = draw.heroes();
    const table = fresh.querySelector('.op-list table');
    if (table) $('.op-list table')?.replaceWith(table);
  });
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.append(t);
      t.select();
      const ok = document.execCommand('copy');
      t.remove();
      return ok;
    }
  }

  // Opening /guide/#sg-jungle scrolls to that section; #yt-<id> is a video in the 유튜브 section.
  render();
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) document.getElementById(hash)?.scrollIntoView();
})();

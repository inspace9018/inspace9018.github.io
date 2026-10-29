'use strict';
// Shared HTML for lane matchup, hero guides, objective timers and "now" cards.
// `base` is the path prefix to ui/ from the page that renders it ('ui/' for the overlay, '' for the dashboard).
(function () {
  const esc = v =>
    String(v ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  // A shortcut's key (ui/hotkeys.js) beside its button; nothing when that shortcut is off.
  const kbd = id => (window.Hotkeys?.key(id) ? ` <kbd>${Hotkeys.key(id)}</kbd>` : '');
  const guide = id => (window.HERO_GUIDE || []).find(g => g.id === id) || null;
  const clock = s => {
    if (!Number.isFinite(s)) return '—';
    const v = Math.max(0, Math.round(s));
    return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
  };
  // A label table in both languages (i18n.js): each read takes the current language's entry, so a
  // language switch shows on the next render. Works for objects and arrays alike.
  const tr = (ko, en) => new Proxy(ko, { get: (o, k) => (I18N.foreign && k in en ? same(o[k], en[k]) : o[k]) });
  // English of a table entry in the display language, except what the Korean table has too in the same
  // place: keys and class names (['early', '초반'] / ['early', 'Early'], ['Strong lane', 'strong']).
  const same = (ko, en) =>
    typeof en === 'string'
      ? en === ko
        ? en
        : I18N.tr(en)
      : Array.isArray(en)
        ? en.map((x, i) => same(ko?.[i], x))
        : en && typeof en === 'object'
          ? Object.fromEntries(Object.entries(en).map(([k, x]) => [k, same(ko?.[k], x)]))
          : en;
  // Display names: heroes and abilities from their { en, ko } records, items by id.
  const heroName = (id, fallback = '') => I18N.name(guide(id), fallback);
  const itemName = id => I18N.item(id, window.ITEM_CATALOG, window.ITEM_KO);
  // Hero guide text in the display language: the Korean field or its English twin (style / styleEn,
  // tags / tagsEn, tip / tipEn), and nothing where no English was written (i18n.js pick).
  const gt = (x, k) => I18N.pick(x?.[k], x?.[k + 'En']);
  const tagSep = () => L('·', ' · ');
  // The shop's English item description (ITEM_CATALOG) on one line, a space after each full stop.
  const itemDescEn = it =>
    String(it?.description || '')
      .replace(/\s+/g, ' ')
      .replace(/(?<=[a-z])\.(?=[A-Z0-9])/g, '. ')
      .trim();
  const STRENGTH = tr(
    { strong: ['전선 강함', 'strong'], even: ['전선 보통', 'even'], weak: ['전선 약함', 'weak'] },
    { strong: ['Strong lane', 'strong'], even: ['Even lane', 'even'], weak: ['Weak lane', 'weak'] }
  );
  const ROLE = tr(
    { marksman: '사격', brawler: '근접', assassin: '암살', mystic: '능력' },
    { marksman: 'Marksman', brawler: 'Brawler', assassin: 'Assassin', mystic: 'Mystic' }
  );

  const heroType = id => (window.HERO_TYPES || []).find(t => t.id === id) || null;
  const CURVE = tr(
    {
      early: ['스노우볼형', '초반에 강하고 길어질수록 승률이 떨어집니다'],
      late: ['후반형', '시간이 지날수록 강해집니다'],
      even: ['균형형', '경기 시간에 따른 차이가 작습니다']
    },
    {
      early: ['Snowball', 'Strong early; win rate drops in long games'],
      late: ['Late game', 'Gets stronger over time'],
      even: ['Balanced', 'Little change with game length']
    }
  );
  const FIGHT = tr(
    { gun: '무기 중심', spirit: '능력 중심', hybrid: '무기·마법 혼합' },
    { gun: 'Weapon focus', spirit: 'Spirit focus', hybrid: 'Weapon · Spirit mix' }
  );
  const PATTERN = tr({ farm: '파밍형', fight: '교전형', balanced: '' }, { farm: 'Farmer', fight: 'Fighter', balanced: '' });
  const pct = v => (v === null || v === undefined ? '—' : Math.round(v * 1000) / 10 + '%');
  // Type chips: power curve, fight style, play pattern (public match statistics).
  function typeChips(id, { detail = false } = {}) {
    const t = heroType(id);
    if (!t) return '';
    const c = CURVE[t.curve];
    const chips = [
      c ? `<span class="iu-chip curve ${t.curve}" title="${esc(c[1])}">${c[0]}</span>` : '',
      `<span class="iu-chip">${FIGHT[t.fight]}</span>`,
      ...t.pattern.filter(p => PATTERN[p]).map(p => `<span class="iu-chip">${PATTERN[p]}</span>`)
    ].join('');
    const note =
      detail && t.winRate?.short !== null
        ? `<p class="iu-note">${L(
            `28분 이전 승률 ${pct(t.winRate.short)} → 40분 이후 ${pct(t.winRate.long)} · 아이템 ${t.share.weapon}% 무기 / ${t.share.spirit}% 능력 / ${t.share.vitality}% 생존${t.winRate.matches < 30000 ? ' · 표본 적음' : ''}`,
            `Win rate before 28 min ${pct(t.winRate.short)} → after 40 min ${pct(t.winRate.long)} · items ${t.share.weapon}% Weapon / ${t.share.spirit}% Spirit / ${t.share.vitality}% Vitality${t.winRate.matches < 30000 ? ' · small sample' : ''}`
          )}</p>`
        : '';
    return `<div class="iu-types">${chips}</div>${note}`;
  }
  const itemKo = id => (window.ITEM_KO || []).find(i => i.id === id);
  // Seen items when available, otherwise the hero's usual core items; plus how to answer them.
  function buildBlock(id, seen, { detail = false } = {}) {
    if (!window.ItemIntel) return '';
    const catalog = window.ITEM_CATALOG || [],
      ko = window.ITEM_KO || [];
    const b = seen?.length
      ? window.ItemIntel.inferBuild(seen, catalog, ko)
      : window.ItemIntel.expectedBuild(id, window.HERO_TYPES, catalog, ko);
    if (!b) return '';
    const items = b.key
      .slice(0, detail ? 4 : 3)
      .map(
        k => `<li><b>${esc(itemName(k.id))}</b>${detail && k.desc ? ' · ' + esc(k.desc) : ''}</li>`
      )
      .join('');
    return `<div class="iu-build"><p class="iu-line"><i>${b.expected ? L('예상 빌드', 'Expected build') : L('보유 아이템', 'Items held')}</i>${esc(b.label)}</p>${items ? `<ul class="iu-tips">${items}</ul>` : ''}${b.threats.length ? `<p class="iu-line"><i>${L('주의', 'Watch')}</i>${b.threats.map(t => esc(t.ko)).join(' · ')}</p>` : ''}${detail ? b.threats.map(t => `<p class="iu-note">${esc(t.ko)}: ${esc(t.tip)}</p>`).join('') : ''}${b.counters.length ? `<p class="iu-line"><i>${L('대응', 'Counter')}</i>${b.counters.map(c => esc(c.ko)).join(', ')}</p>` : ''}</div>`;
  }
  // Growth from the souls under a hero's top-bar portrait: is the ultimate in, and how far to it.
  const kSouls = v => (v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : String(v));
  function growth(id, souls) {
    const p = window.SoulLevels?.progress(souls);
    if (!p) return null;
    const ult = window.SoulLevels.ultOf(id),
      approx = p.approx ? '≈' : '';
    return p.ult.unlocked
      ? {
          cls: 'ok',
          text: L('궁 해금', 'Ult ready'),
          title: L(
            `${ult?.name || '궁극기'} · 포인트 ${p.points}개 · 영혼 ${approx}${kSouls(souls)}`,
            `${guide(id)?.abilities?.find(a => a.slot === 4)?.en || 'Ultimate'} · ${p.points} points · ${approx}${kSouls(souls)} souls`
          )
        }
      : {
          cls: p.ult.need <= 600 ? 'soon' : '',
          text: L(
            `궁까지 ${approx}${p.ult.need.toLocaleString('en-US')}`,
            `Ult in ${approx}${p.ult.need.toLocaleString('en-US')}`
          ),
          title: L(
            `영혼 ${approx}${kSouls(souls)} · 3,200에 궁극기`,
            `${approx}${kSouls(souls)} souls · ultimate at 3,200`
          )
        };
  }
  // Ultimates matter until every hero in a group has one; three minutes of game time after that the
  // ultimate rows and tags go. `key` names the group (the lane, the whole board), `ids` its heroes.
  const ultAllAt = new Map(),
    ULT_KEEP = 180;
  function ultShown(key, ids, soulsOf, secs) {
    if (!Number.isFinite(secs)) return true;
    const all = ids.length > 0 && ids.every(id => window.SoulLevels?.progress(soulsOf(id))?.ult.unlocked),
      at = ultAllAt.get(key);
    if (!all || (at !== undefined && at > secs)) {
      ultAllAt.delete(key);
      return true;
    }
    if (at === undefined) ultAllAt.set(key, secs);
    return secs - (at ?? secs) < ULT_KEEP;
  }
  // Every hero's souls from the top bar: mine, my team's and theirs.
  const soulsMap = s =>
    new Map(
      [...(s.live?.opponents || []), ...(s.live?.allies || []), s.live?.local]
        .filter(Boolean)
        .map(h => [h.heroId, h.souls])
    );
  const growthTag = (id, souls, cls) => {
    const g = growth(id, souls);
    return g ? `<small class="${cls} ${g.cls}" title="${esc(g.title)}">${esc(g.text)}</small>` : '';
  };
  // One line per hero for the overlay (no scrolling): portrait, name, type, and for an enemy its key
  // items read from the scoreboard or the threat its usual build brings.
  function heroRow(id, base, s, as) {
    const g = guide(id),
      t = heroType(id);
    if (!g) return '';
    const seen = s.live?.enemyItems?.[id],
      keys = as === 'enemy' ? keyItems(seen).slice(0, 2) : [],
      watch =
        as === 'enemy' && !keys.length
          ? window.ItemIntel?.expectedBuild(id, window.HERO_TYPES, window.ITEM_CATALOG || [], window.ITEM_KO || [])
              ?.threats?.[0]?.ko
          : '',
      lane = (s.intel?.lane?.opponents || []).includes(id);
    const all = soulsMap(s),
      souls = as === 'enemy' && ultShown('all', [...all.keys()], h => all.get(h), s.live?.seconds) ? all.get(id) : null;
    return `<div class="ov-row ${as}">${portrait(id, base)}<div><b>${esc(I18N.name(g))}${lane ? ` <i>${L('전선', 'Lane')}</i>` : ''}${growthTag(id, souls, 'ov-ult')}</b><small>${esc(
      [CURVE_SHORT[t?.curve], FIGHT_SHORT[t?.fight], (gt(g, 'tags') || []).slice(0, 2).join(tagSep())]
        .filter(Boolean)
        .join(' · ')
    )}</small></div><span class="ov-k">${
      keys.length
        ? `<i>${L('보유', 'Has')}</i>${keys.map(k => `<em class="${k.urgent ? 'urgent' : ''}">${esc(k.ko)}</em>`).join('')}`
        : watch
          ? `<i>${L('예상 위협', 'Likely threat')}</i><em class="warn">${esc(watch)}</em>`
          : ''
    }</span></div>`;
  }
  function enemyBuilds(s, base, { compact = false } = {}) {
    if (compact) {
      const enemies = s.live?.opponents || [],
        lane = new Set(s.intel?.lane?.opponents || []);
      if (!enemies.length) return `<p class="iu-empty">${L('적 팀 확인 전', 'Waiting for enemy team')}</p>`;
      return [...enemies]
        .sort((a, b) => lane.has(b.heroId) - lane.has(a.heroId))
        .map(e => heroRow(e.heroId, base, s, 'enemy'))
        .join('');
    }
    const enemies = s.live?.opponents || [];
    if (!enemies.length) return `<p class="iu-empty">${L('적 팀 확인 전', 'Waiting for enemy team')}</p>`;
    const seen = s.live?.enemyItems || {},
      lane = new Set(s.intel?.lane?.opponents || []);
    const ordered = [...enemies].sort((a, b) => lane.has(b.heroId) - lane.has(a.heroId));
    return `${ordered
      .map(
        e =>
          `<article class="iu-hero enemy"><div class="iu-hero-head">${portrait(e.heroId, base)}<div><b>${esc(heroName(e.heroId, e.heroName))}</b>${lane.has(e.heroId) ? `<span class="iu-badge strong">${L('전선 상대', 'Lane opponent')}</span>` : ''}${typeChips(e.heroId)}</div></div>${buildBlock(e.heroId, seen[e.heroId])}</article>`
      )
      .join('')}`;
  }
  // Hero select helper: every hero with its type at a glance; recognised heroes first.
  function heroPicker(s, base) {
    const list = window.HERO_GUIDE || [],
      seen = new Set(
        [
          s.live?.hover?.heroId,
          s.live?.local?.heroId,
          ...(s.live?.allies || []).map(a => a.heroId),
          ...(s.live?.opponents || []).map(o => o.heroId)
        ].filter(Boolean)
      );
    const order = { early: 0, even: 1, late: 2 };
    const rows = [...list].sort(
      (a, b) =>
        (b.id === s.live?.hover?.heroId) - (a.id === s.live?.hover?.heroId) ||
        seen.has(b.id) - seen.has(a.id) ||
        (order[heroType(a.id)?.curve] ?? 1) - (order[heroType(b.id)?.curve] ?? 1)
    );
    return `${rows
      .map(
        g =>
          `<div class="iu-pick-row">${portrait(g.id, base)}<div><b>${esc(I18N.name(g))}</b> <small>${esc(ROLE[g.role] || '')}</small>${typeChips(g.id)}${I18N.lang === 'en' && !g.styleEn ? '' : `<p class="iu-note">${esc(gt(g, 'style') || '')}${gt(g, 'strengths')?.[0] ? L(' · 장점: ', ' · Strength: ') + esc(gt(g, 'strengths')[0]) : ''}${gt(g, 'weaknesses')?.[0] ? L(' · 약점: ', ' · Weakness: ') + esc(gt(g, 'weaknesses')[0]) : ''}</p>`}</div></div>`
      )
      .join('')}`;
  }
  function portrait(id, base) {
    return `<img class="iu-portrait" src="${base}assets/portraits/${id}-small.png" alt="">`;
  }
  function badge(g) {
    const s = STRENGTH[g?.laneStrength];
    return s ? `<span class="iu-badge ${s[1]}">${s[0]}</span>` : '';
  }
  // One hero, summarised for the role it plays this match: opponent or partner.
  function heroCard(id, base, { as = 'enemy', detail = false } = {}) {
    const g = guide(id);
    if (!g) return '';
    const tips = gt(g, as === 'enemy' ? 'vsTips' : 'withTips');
    // Strengths, weaknesses, tips and spikes: hero guide text in the display language.
    return `<article class="iu-hero ${as}"><div class="iu-hero-head">${portrait(id, base)}<div><b>${esc(I18N.name(g))}</b>${badge(g)}<small>${esc(ROLE[g.role] || '')}${gt(g, 'style') ? ' · ' + esc(gt(g, 'style')) : ''}</small>${typeChips(id, { detail })}</div></div>${
      I18N.lang === 'en' && !g.weaknessesEn?.length
        ? ''
        : detail
          ? `<div class="iu-pros"><p><i>${L('장점', 'Strengths')}</i>${gt(g, 'strengths').map(esc).join(' · ')}</p><p><i>${L('약점', 'Weaknesses')}</i>${gt(g, 'weaknesses').map(esc).join(' · ')}</p></div>`
          : `<p class="iu-line"><i>${L('약점', 'Weakness')}</i>${esc(gt(g, 'weaknesses')[0] || '')}</p>`
    }${
      tips?.length
        ? `<ul class="iu-tips">${tips
            .slice(0, detail ? 3 : 1)
            .map(t => `<li>${esc(t)}</li>`)
            .join('')}</ul>`
        : ''
    }${
      detail && gt(g, 'spikes') ? `<p class="iu-note">${L('파워 스파이크', 'Power spike')} · ${esc(gt(g, 'spikes'))}</p>` : ''
    }${detail && as === 'enemy' ? buildBlock(id, null, { detail: true }) : ''}</article>`;
  }
  function skills(id, base, selected = 1) {
    const g = guide(id);
    if (!g) return '';
    const a = g.abilities[selected] || g.abilities[0];
    return `<div class="iu-skills">${g.abilities
      .map(
        (x, i) =>
          `<button data-skill="${i}" class="${i === selected ? 'active' : ''}" aria-label="${L(`${x.slot}번 ${esc(I18N.name(x))}`, `Ability ${x.slot}: ${esc(I18N.name(x))}`)}" aria-pressed="${i === selected}"><img src="${base}assets/abilities/${id}-${x.slot}.png" alt=""><span>${x.slot}</span></button>`
      )
      .join(
        ''
      )}</div><p class="iu-skill"><b>${esc(I18N.name(a))}</b>${I18N.only(a.ko && a.en ? ` <small>${esc(a.en)}</small>` : '')}<br>${esc(
      L(a.desc || '', a.descEn || '')
    )}${gt(a, 'tip') ? `<br><i>${L('대응', 'Counter')}</i> ${esc(gt(a, 'tip'))}` : ''}</p>`;
  }
  // Lane matchup: the two lane opponents, the lane partner and pick chips when unknown.
  // `all` (the preparation panel) shows every lane opponent at once, without the tabs and the picker.
  function lane(s, base, { focus = 0, skill = 1, detail = false, compact = false, all = false } = {}) {
    const info = s.intel?.lane || {},
      opp = info.opponents || [],
      enemies = (s.live?.opponents || []).map(o => o.heroId),
      allies = (s.live?.allies || []).map(o => o.heroId);
    const where = info.lane ? `<span class="iu-chip lane">${esc(info.lane.name)}</span>` : '';
    const basis =
      L(
        {
          manual: '직접 고름',
          hud: '게임 HUD 전선 배정',
          pregame: '준비 시간 전선 배정',
          'seen-on-screen': '라인전 중 화면에 보인 이름'
        },
        {
          manual: 'Picked by hand',
          hud: 'Lane from the game HUD',
          pregame: 'Lane from preparation',
          'seen-on-screen': 'Names seen while laning'
        }
      )[info.opponentsBasis] || '';
    const pick = enemies.length
      ? `<div class="iu-pick"><small>${L('전선 상대 고르기 (최대 2)', 'Pick lane opponents (up to 2)')}</small>${enemies
          .map(
            id =>
              `<button data-lane-opp="${id}" class="${opp.includes(id) ? 'selected' : ''}">${esc(heroName(id, id))}</button>`
          )
          .join(
            ''
          )}${allies.length ? `<small>${L('아군 전선 파트너', 'Lane partner')}</small>${allies.map(id => `<button data-lane-partner="${id}" class="${info.partner === id ? 'selected' : ''}">${esc(heroName(id, id))}</button>`).join('')}` : ''}</div>`
      : `<p class="iu-empty">${L('적 팀 확인 전', 'Waiting for enemy team')}</p>`;
    if (!opp.length)
      return `<div class="iu-lane-head">${where}<b>${L('전선 상대 확인 중', 'Reading lane opponents')}</b></div>${all ? '' : pick}`;
    const shown = opp[Math.min(focus, opp.length - 1)];
    const st = s.intel?.online?.lane;
    const stat = st
      ? `<p class="iu-note">${L(
          `2:2 통계 · 우리 조합 승률 ${Math.round(st.winRate * 100)}% (${st.matches}판) · 15분 영혼 ${st.soulsAt15 >= 0 ? '+' : ''}${st.soulsAt15}`,
          `2v2 stats · our pair wins ${Math.round(st.winRate * 100)}% (${st.matches} matches) · souls at 15 min ${st.soulsAt15 >= 0 ? '+' : ''}${st.soulsAt15}`
        )}</p>`
      : '';
    const partner = info.partner
      ? compact
        ? `<p class="iu-line"><i>${L('파트너', 'Partner')}</i>${esc(heroName(info.partner))}${I18N.lang === 'en' && !guide(info.partner)?.withTipsEn?.[0] ? '' : ` · ${esc(gt(guide(info.partner), 'withTips')?.[0] || '')}`}</p>`
        : heroCard(info.partner, base, { as: 'ally' })
      : '';
    if (all) return lanePrep(s, base, { where, basis, opp, st });
    return `<div class="iu-lane-head">${where}<b>${L('전선 상대', 'Lane opponents')}</b><small>${esc(basis)}</small></div>${compact ? '' : stat}<div class="iu-tabs small">${opp
      .map(
        (id, i) =>
          `<button data-lane-focus="${i}" class="${id === shown ? 'active' : ''}">${esc(heroName(id, id))}</button>`
      )
      .join(
        ''
      )}</div>${heroCard(shown, base, { as: 'enemy', detail })}${skills(shown, base, skill)}${partner}${detail ? pick : `<details class="iu-more"><summary>${L('전선 상대 바꾸기', 'Change lane opponents')}</summary>${pick}</details>`}`;
  }
  // The preparation panel's lane strip: how to play the lane (the matchup, my hero's early plan, my
  // partner). The lane opponents themselves are the first cards of the enemy column.
  function lanePrep(s, base, { where, basis, st }) {
    const card = (s.coach || []).find(c => c.id === 'lane'),
      mine = guide(s.live?.local?.heroId),
      partner = guide(s.intel?.lane?.partner);
    const plan = [
      card?.plan || '',
      gt(mine, 'plan')?.early ? `${I18N.name(mine)}: ${gt(mine, 'plan').early}` : '',
      gt(partner, 'withTips')?.[0] ? `${L('파트너', 'Partner')}: ${gt(partner, 'withTips')[0]}` : '',
      st
        ? L(
            `이 2:2 조합 승률 ${Math.round(st.winRate * 100)}% (${st.matches}판)`,
            `This 2v2 pair wins ${Math.round(st.winRate * 100)}% (${st.matches} matches)`
          )
        : ''
    ].filter(Boolean);
    return `<div class="lp-plan">${where}${card ? `<b>${esc(card.title)}</b>` : `<b>${L('라인전', 'Laning')}</b>`}<small>${esc(basis)}</small>${
      plan.length ? `<ul>${plan.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''
    }</div>`;
  }
  const STATE_KO = tr(
    { visible: '보임', dead: '사망', missing: '미싱', unknown: '—' },
    { visible: 'Seen', dead: 'Dead', missing: 'Missing', unknown: '—' }
  );
  function mia(s) {
    const enemies = s.intel?.mia?.enemies || [];
    if (!enemies.length) return '';
    return `<div class="iu-mia">${enemies
      .map(
        e =>
          `<span class="iu-chip ${e.state}">${esc(e.heroId ? heroName(e.heroId, e.heroId) : L('적 ', 'Enemy ') + (e.slot + 1))} ${STATE_KO[e.state]}${e.missingFor ? L(' ' + e.missingFor + '초', ` ${e.missingFor}s`) : ''}</span>`
      )
      .join('')}</div>`;
  }
  function timers(s, { buttons = true } = {}) {
    const o = s.intel?.objectives;
    if (!o?.known) return `<p class="iu-empty">${L('경기 시계 확인 전', 'Waiting for match clock')}</p>`;
    const m = o.midboss,
      r = o.rift,
      u = o.urn;
    const row = (name, value, sub, actions = '') =>
      `<div class="iu-timer"><div><b>${name}</b><small>${esc(sub)}</small></div><strong>${value}</strong>${actions}</div>`;
    const mb =
      m.state === 'respawn'
        ? row(
            L('중앙 보스', 'Mid-Boss'),
            clock(m.remaining),
            L(
              `재생성 ${clock(m.respawnAt)} · ${m.deaths}회 처치`,
              `Respawns ${clock(m.respawnAt)} · killed ${m.deaths}×`
            )
          )
        : row(
            L('중앙 보스', 'Mid-Boss'),
            L('생존', 'Alive'),
            m.deaths
              ? L(`${clock(m.respawnAt)}에 재생성됨 (추정)`, `Respawned at ${clock(m.respawnAt)} (est.)`)
              : window.Hotkeys?.key('midboss')
                ? L(`처치되면 ${Hotkeys.key('midboss')}`, `${Hotkeys.key('midboss')} when killed`)
                : L('처치되면 기록', 'Log it when killed')
          );
    const rift = row(
      L('불안정한 균열', 'Unstable Rift'),
      riftBand(r),
      `${L('경기 시계 기준 생성 범위', 'Spawn window by match clock')} · ${r.basis}`
    );
    const urn = row(
      L('영혼 단지', 'Soul Urn'),
      clock(u.remaining),
      `${clock(u.at)} · ${u.laneName} · ${L('들고 있는 동안은 다음 단지 늦어짐', 'next urn waits while carried')}`
    );
    const rejuv = m.rejuvRemaining
      ? row(
          L('소생의 보석', 'Rejuvenator'),
          clock(m.rejuvRemaining),
          L('크리스탈 획득 팀 3분간 1회 부활', 'Crystal team revives once within 3 min')
        )
      : '';
    const actions = buttons
      ? `<div class="iu-actions"><button data-objective="midboss">${L('보스 처치 기록', 'Log Mid-Boss kill')}${kbd('midboss')}</button><button data-objective="rift">${L('균열 기록', 'Log rift')}${kbd('rift')}</button><button data-objective-undo="midboss" class="ghost">${L('보스 기록 취소', 'Undo Mid-Boss')}</button><button data-objective-undo="rift" class="ghost">${L('균열 기록 취소', 'Undo rift')}</button></div>`
      : '';
    return `${mb}${rejuv}${rift}${urn}${actions}`;
  }
  function now(s, limit = 3, { compact = false } = {}) {
    // Status notes ("enemy team read", "reading the clock") are not things to do.
    const cards = (s.coach || [])
        .filter(c => !['plan', 'comp', 'items', 'team', 'clock-wait'].includes(c.id))
        .slice(0, limit),
      plan = compact ? null : (s.coach || []).find(c => c.id === 'plan'),
      comp = compact ? null : (s.coach || []).find(c => c.id === 'comp'),
      shop = compact ? null : (s.coach || []).find(c => c.id === 'items');
    return `${cards
      .map(
        (c, i) =>
          `<div class="iu-card ${i === 0 ? 'top' : ''} ${['mia', 'mia-team', 'low', 'status'].includes(c.id) ? 'alert' : ''}"><b>${esc(c.title)}</b><p>${esc(c.body)}</p></div>`
      )
      .join(
        ''
      )}${plan ? `<div class="iu-card plan"><b>${esc(plan.title)}</b><p>${esc(plan.body)}</p></div>` : ''}${comp ? `<div class="iu-card plan"><b>${esc(comp.title)}</b><p>${esc(comp.body)}</p></div>` : ''}${shop ? `<div class="iu-card plan"><b>${L('추천 아이템', 'Recommended items')}</b><ul class="iu-tips">${shop.items.map(i => `<li><b>${esc(i.name)}</b> · ${esc(i.why)}</li>`).join('')}</ul></div>` : ''}`;
  }
  // The most urgent timer for the one-line chip.
  function urgent(s) {
    const o = s.intel?.objectives;
    if (!o?.known) return null;
    const list = [];
    if (o.rift.state === 'window' && o.rift.remaining > 0) list.push([L('균열', 'Rift'), o.rift.remaining]);
    if (o.midboss.state === 'respawn') list.push([L('보스', 'Boss'), o.midboss.remaining]);
    list.push([L('영혼 단지', 'Urn'), o.urn.remaining]);
    const [name, t] = list.filter(([, v]) => v <= 120).sort((a, b) => a[1] - b[1])[0] || [];
    return name ? `${name} ${clock(t)}` : null;
  }
  // Shop strip: each recommended item, who it answers, and how it works against them (the item's own
  // summary where there is no such line). Answers to items the enemies were seen holding come first,
  // then the hero-guide / match-stat answers to the enemy team.
  function shopList(s, base) {
    const catalog = window.ITEM_CATALOG || [],
      intel = window.ItemIntel,
      byName = new Map(catalog.map(i => [i.name, i])),
      byId = new Map(catalog.map(i => [i.id, i])),
      koById = new Map((window.ITEM_KO || []).map(k => [k.id, k])),
      brief = window.ITEM_BRIEF || {},
      owned = new Set(s.live?.context?.items || []),
      koName = it => itemName(it.id);
    // ITEM_BRIEF is in the display language; otherwise the ITEM_KO description, or the shop's English.
    const what = it => {
      if (brief[it.id]) return brief[it.id];
      const ko = koById.get(it.id)?.desc || '',
        d = I18N.pick(ko, ko ? itemDescEn(it) : '').split('.')[0],
        max = I18N.lang === 'en' || I18N.lang === 'ru' ? 48 : 30;
      return d.length > max ? d.slice(0, max - 1) + '…' : d;
    };
    const row = (it, why, how) =>
      `<div class="sh-item"><img src="${base}${esc(it.file)}" alt=""><b>${esc(koName(it))}</b>${why ? `<small class="sh-why">${esc(why)}</small>` : ''}${how || what(it) ? `<small class="sh-how">${esc(how || what(it))}</small>` : ''}</div>`;
    const picks = new Map(),
      add = (it, why, weight, threat) => {
        if (!it || owned.has(it.id)) return;
        const p = picks.get(it.id) || { it, weight: 0, why: [], how: '' };
        p.weight += weight;
        if (why && !p.why.includes(why)) p.why.push(why);
        p.how ||= intel?.HOW_VS?.[threat]?.[it.name] || intel?.HOW?.[it.name] || '';
        picks.set(it.id, p);
      };
    // Items read from the scoreboard: an immunity, control or heal item calls for its answer.
    for (const [hid, ids] of Object.entries(s.live?.enemyItems || {}))
      for (const [key, t] of Object.entries(intel?.THREATS || {})) {
        const hit = ids.map(id => byId.get(id)).find(it => it && t.items.includes(it.name));
        if (hit)
          for (const c of t.counters)
            add(
              byName.get(c),
              L(
                `${heroName(+hid, '적')}의 ${koName(hit)}(${t.ko}) 대응`,
                `vs ${heroName(+hid, 'enemy')}'s ${koName(hit)} (${t.ko})`
              ),
              3,
              key
            );
      }
    ((s.coach || []).find(c => c.id === 'items')?.items || []).forEach((i, n) =>
      add(
        byName.get(i.name),
        i.source === 'online'
          ? String(i.why || '')
              .replace('이 상대들과의 경기 승률', '이 적 조합 상대 승률')
              .replace('평균 대비 ', '')
          : String(i.why || '')
              .replace(/^(대응|Counters): /, '')
              .split(', ')
              .map(x => (/조합$/.test(x) ? x : L(x + ' 상대', 'vs ' + x)))
              .join(' · '),
        2 - n * 0.1
      )
    );
    // The strip holds answers to the enemy only; the build sits on the other side of the screen.
    const counters = [...picks.values()].sort((a, b) => b.weight - a.weight).slice(0, 5);
    return `<h4>${L('상대 대응', 'Counters')}</h4>${
      counters.length
        ? counters.map(x => row(x.it, x.why.slice(0, 2).join(' · '), x.how)).join('')
        : `<p class="sh-empty">${L('적 팀 확인 전', 'Waiting for enemy team')}</p>`
    }`;
  }
  // Shop name (in the display language) of an item given by its English one.
  function itemByName(name) {
    const it = (window.ITEM_CATALOG || []).find(i => i.name === name);
    return it ? itemName(it.id) : '';
  }
  // Items that change how a fight goes (immunity, control, sustain, burst...), most urgent first.
  const KEY_ORDER = ['immune', 'control', 'heal', 'spiritBurst', 'gunBurst', 'dive', 'spiritDefense', 'gunDefense'];
  function keyItems(itemIds) {
    const intel = window.ItemIntel,
      catalog = window.ITEM_CATALOG || [];
    if (!intel || !itemIds?.length) return [];
    const byId = new Map(catalog.map(i => [i.id, i])),
      out = [];
    for (const key of KEY_ORDER)
      for (const id of itemIds) {
        const it = byId.get(id);
        if (it && intel.THREATS[key]?.items.includes(it.name) && !out.some(o => o.id === id))
          out.push({
            id,
            // The display name (Korean client name or English shop name); the field keeps its old name.
            ko: itemName(id),
            key,
            group: intel.THREATS[key].ko,
            urgent: key === 'immune' || key === 'control'
          });
      }
    return out;
  }
  // Holding Tab: the game's scoreboard and HUD stay clear. Under each scoreboard column, as wide as
  // it, that hero's description (heroTag): what the scoreboard does not say (it already shows souls,
  // K/D/A and item icons), its concept, core play and abilities, my lane tinted. Each team has one
  // plain plate behind its columns. What only matters summed over a team is one line along the
  // plate's bottom, in two labelled parts: the team (damage kinds, late-game heroes, a
  // threat two or more of them bring), and for the enemy 우리 대응: the defence to buy first and the
  // item that answers that threat. Everything else is one panel on the free left edge: what to do
  // now, my plan, the route picture while laning, the team matchup and the objectives. The folded
  // list hides while Tab is held.
  function board(s, base) {
    const enemies = s.live?.opponents || [],
      enemyIds = new Set(enemies.map(e => e.heroId)),
      soulsOf = new Map(
        [...enemies, ...(s.live?.allies || []), s.live?.local].filter(Boolean).map(h => [h.heroId, h.souls])
      ),
      lane = s.intel?.lane,
      laneOpp = new Set(lane?.opponents || []),
      seen = s.live?.enemyItems || {},
      local = s.live?.local,
      secs = s.live?.seconds;
    const expected = id =>
      window.ItemIntel?.expectedBuild(id, window.HERO_TYPES, window.ITEM_CATALOG || [], window.ITEM_KO || []);
    const occupied = new Set(),
      scale = Math.max(0.5, Math.min(1.5, (s.settings?.hudScale || 100) / 100)),
      slots = (s.live?.slots || [])
        .filter(x => {
          const key = `${x.side}:${x.index}`;
          if (
            !Number.isInteger(x.heroId) ||
            !['left', 'right'].includes(x.side) ||
            !Number.isInteger(x.index) ||
            x.index < 0 ||
            x.index > 5 ||
            occupied.has(key)
          )
            return false;
          occupied.add(key);
          return true;
        })
        .map(x => ({
          ...x,
          // HUD identities have a native slot index but no pixel coordinate. The game anchors
          // both rows around the clock, with spacing proportional to HUD-scaled window height.
          cx:
            Number.isFinite(x.cx) && x.cx > 0 && x.cx < 1
              ? x.cx
              : 0.5 + ((x.side === 'left' ? -1 : 1) * (0.1352 + 0.0815 * x.index) * innerHeight * scale) / innerWidth
        }));
    // The ultimate in a column's width: unlocked, or the souls still missing.
    const ult = id => {
      const gr = growth(id, soulsOf.get(id));
      return gr
        ? `<small class="tv-ult ${gr.cls}" title="${esc(gr.title)}">${esc(gr.cls === 'ok' ? L('궁 해금', 'Ult ready') : gr.text)}</small>`
        : '';
    };
    // Each enemy's build: the items seen on the scoreboard, or the hero's usual one.
    const builds = new Map(
      [...enemyIds].map(id => [
        id,
        seen[id]?.length && window.ItemIntel
          ? window.ItemIntel.inferBuild(seen[id], window.ITEM_CATALOG || [], window.ITEM_KO || [])
          : expected(id)
      ])
    );
    // Damage kind per hero: the seen build's direction, else the hero's usual one.
    const kind = id => {
      const b = enemyIds.has(id) && seen[id]?.length ? builds.get(id)?.build : null;
      return b ? (b.startsWith('spirit') ? 'spirit' : b.startsWith('weapon') ? 'gun' : 'hybrid') : heroType(id)?.fight;
    };
    // The ultimate matters until everyone has it, and for three minutes after; then the row goes.
    const early = ultShown(
      'board',
      slots.map(x => x.heroId),
      id => soulsOf.get(id),
      secs
    );
    // My lane: me and my partner, and the two opponents.
    const near = id => (enemyIds.has(id) ? laneOpp.has(id) : id === local?.heroId || id === lane?.partner);
    // One hero's description under its own scoreboard column, as wide as the column. Every column has
    // the same rows, lined up across the board after rendering (overlay-live.js):
    //   my lane mark · ultimate · for an enemy the key items seen (or the threat its usual build
    //   brings) and our answer under a grey 대응, so it never reads as the enemy's · concept (tags) ·
    //   core play (its first line) · the four abilities, each in a few words (ability-short.json)
    // My lane's columns are tinted.
    const heroTag = x => {
      const id = x.heroId,
        g = guide(id),
        enemy = enemyIds.has(id),
        keys = enemy ? keyItems(seen[id]) : [],
        build = enemy ? builds.get(id) : null,
        threat = keys.length ? keys[0].key : build?.threats?.[0]?.key,
        watch = enemy && !keys.length ? build?.threats?.[0]?.ko : null,
        answer = enemy && threat ? itemByName(window.ItemIntel?.THREATS[threat]?.counters[0]) : null,
        mark = enemy
          ? laneOpp.has(id)
            ? L('내 전선', 'My lane')
            : ''
          : id === local?.heroId
            ? L('나', 'Me')
            : id === lane?.partner
              ? L('파트너', 'Partner')
              : '',
        items = keys.length
          ? keys
              .slice(0, 2)
              .map(k => `<em class="${k.urgent ? 'urgent' : ''}">${esc(k.ko)}</em>`)
              .join('')
          : watch
            ? `<small class="tv-watch">${L(`${esc(watch)} 예상`, `${esc(watch)} likely`)}</small>`
            : '';
      const row = (cls, html) => `<div class="tv-r" data-row="${cls}">${html}</div>`;
      const skills = (g?.abilities || [])
        .slice(0, 4)
        .map((a, i) =>
          row(
            'sk' + i,
            `<p class="tv-skill${a.slot === 4 ? ' ult' : ''}"><img src="${base}assets/abilities/${id}-${a.slot}.png" alt=""><b>${esc(
              I18N.name(a)
            )}</b><span>${esc(gt(a, 'short') || gt(a, 'brief') || '')}</span></p>`
          )
        )
        .join('');
      return `<div class="tv-tag ${enemy ? 'enemy' : 'ally'}${near(id) ? ' near' : ''}" data-pv="boardTags" style="left:${(x.cx * 100).toFixed(2)}%">${row(
        'mark',
        mark ? `<i class="tv-mark">${mark}</i>` : ''
      )}${early ? row('ult', ult(id)) : ''}${
        // (Ours keep the two rows empty, so every row stays level across the board.)
        row('items', items) +
        row('answer', answer ? `<small class="tv-answer"><i>${L('대응', 'Counter')}</i>${esc(answer)}</small>` : '')
      }${row('concept', I18N.lang === 'en' && !g?.tagsEn?.length ? '' : `<p class="tv-concept">${esc((gt(g, 'tags') || []).slice(0, 2).join(tagSep()))}</p>`)}${row(
        'core',
        gt(g, 'core')?.[0] ? `<p class="tv-core">${esc(gt(g, 'core')[0])}</p>` : ''
      )}${skills}</div>`;
    };
    // One plain plate per team behind its columns (placed to fit them after rendering), with the
    // team's summary line along its bottom.
    const strips = ['ally', 'enemy']
      .map(team => {
        const ids = slots.filter(x => enemyIds.has(x.heroId) === (team === 'enemy')).map(x => x.heroId),
          cx = slots.filter(x => enemyIds.has(x.heroId) === (team === 'enemy')).map(x => x.cx);
        if (!cx.length) return '';
        const a = Math.min(...cx),
          b = Math.max(...cx);
        const mix = { spirit: 0, hybrid: 0, gun: 0 };
        for (const id of ids) if (kind(id) in mix) mix[kind(id)]++;
        const damage = [
          ['spirit', L('마법딜', 'Spirit')],
          ['gun', L('무기딜', 'Weapon')],
          ['hybrid', L('혼합', 'Mixed')]
        ]
          .filter(([k]) => mix[k])
          .map(([k, ko]) => `<span class="tv-d ${k}">${ko} ${mix[k]}</span>`);
        const types = ids.map(heroType),
          late = types.filter(t => t?.curve === 'late').length,
          soon = types.filter(t => t?.curve === 'early').length,
          curve = [late ? L(`후반형 ${late}명`, `${late} late`) : '', soon ? L(`초반형 ${soon}명`, `${soon} early`) : '']
            .filter(Boolean)
            .join(', ');
        const facts = [...damage, curve ? `<span>${esc(curve)}</span>` : ''];
        let call = '';
        if (team === 'enemy') {
          // What to buy against this team: the defence its damage calls for, and the threat that
          // two or more of them bring with the item that answers it.
          const sp = mix.spirit + mix.hybrid / 2,
            gn = mix.gun + mix.hybrid / 2,
            defence =
              sp - gn >= 1.5
                ? L('마법 저항부터', 'Spirit armor first')
                : gn - sp >= 1.5
                  ? L('총탄 방어부터', 'Bullet armor first')
                  : L('마법·총탄 방어 반반', 'Spirit and bullet armor evenly');
          const votes = new Map();
          for (const id of ids)
            for (const t of builds.get(id)?.threats || []) {
              const v = votes.get(t.key) || { ko: t.ko, n: 0, counter: t.counters[0] };
              v.n++;
              votes.set(t.key, v);
            }
          const top = [...votes.values()].filter(v => v.n >= 2).sort((x, y) => y.n - x.n)[0];
          const answer = top && itemByName(top.counter);
          if (top) facts.push(`<span>${L(`${esc(top.ko)} ${top.n}명`, `${esc(top.ko)} ×${top.n}`)}</span>`);
          call = `<span class="tv-sk ok">${L('우리 대응', 'Our answer')}</span><b>${defence}</b>${answer ? `<b>${esc(answer)}</b>` : ''}`;
        }
        const label =
          team === 'enemy'
            ? `<span class="tv-sk enemy">${L('적 팀', 'Enemy team')}</span>`
            : `<span class="tv-sk ally">${L('우리 팀', 'Our team')}</span>`;
        const sum = shown(s, 'boardTeams')
          ? `<p class="tv-sum" data-pv="boardTeams"><span class="tv-sg">${label}${facts.filter(Boolean).join('')}</span>${
              call ? `<span class="tv-sg">${call}</span>` : ''
            }</p>`
          : '';
        return `<div class="tv-team ${team}" style="left:calc(${(a * 100).toFixed(2)}% - 4.1vh);width:calc(${((b - a) * 100).toFixed(2)}% + 8.2vh)">${sum}</div>`;
      })
      .join('');
    const tags = shown(s, 'boardTags') ? slots.map(heroTag).join('') : '';
    // The left panel.
    const g = local ? guide(local.heroId) : null,
      phase = window.MatchPhase?.of(secs).key || 'unknown';
    const mine =
      phase === 'unknown'
        ? `<h4>${L('경기 시간 확인 중', 'Reading match time')}</h4>`
        : phase === 'early'
          ? `<h4>${L('라인전', 'Laning')}${lane?.lane?.name ? ' · ' + esc(lane.lane.name) : ''}</h4>${gt(g, 'plan')?.early ? `<p class="tv-p">${esc(gt(g, 'plan').early)}</p>` : ''}`
          : `<h4>${L(`운영 · ${phase === 'mid' ? '중반' : '후반'}`, phase === 'mid' ? 'Mid game' : 'Late game')}</h4>${gt(g, 'plan')?.[phase] ? `<p class="tv-p">${esc(gt(g, 'plan')[phase])}</p>` : ''}`;
    // What to do now, in full (the advice, why, what it is based on).
    const now = (s.coach || [])
      .filter(
        c =>
          !['plan', 'comp', 'items', 'mia', 'mia-team', 'rift', 'midboss', 'urn', 'team', 'clock-wait'].includes(c.id)
      )
      .slice(0, 1)
      .map(
        c =>
          `<div class="bd-now-card ${['low', 'status'].includes(c.id) ? 'alert' : ''}"><b>${esc(c.title)}</b>${c.body ? `<p>${esc(c.body)}</p>` : ''}${
            c.basis ? `<small>${L('근거', 'Based on')} · ${esc(c.basis)}</small>` : ''
          }</div>`
      )
      .join('');
    // Team against team, once two or more of each side are known.
    const tm = teamMatch(
        slots.filter(x => !enemyIds.has(x.heroId)).map(x => x.heroId),
        slots.filter(x => enemyIds.has(x.heroId)).map(x => x.heroId)
      ),
      edge = tm?.edge,
      verdict = !Number.isFinite(edge) ? '' : edge >= 0.01 ? 'good' : edge <= -0.01 ? 'bad' : 'even',
      versus = tm
        ? `<h4>${L('팀 상성', 'Team matchup')}</h4><p class="tv-vs"><span class="ally">${L('우리', 'Us')} ${esc(tm.us)}</span><i>vs</i><span class="enemy">${L('상대', 'Them')} ${esc(tm.them)}</span></p>${
            verdict
              ? `<p class="tv-vs-edge ${verdict}"><b>${L({ good: '우리 유리', bad: '우리 불리', even: '비슷' }, { good: 'Favoured', bad: 'Unfavoured', even: 'Even' })[verdict]}</b>${L('승률 상성', 'Win-rate edge')} ${edge >= 0 ? '+' : '−'}${Math.abs(edge * 100).toFixed(1)}${L('%p', ' pp')}<small>${L(`최근 30일 · 영웅 ${tm.pairs}쌍`, `Last 30 days · ${tm.pairs} hero pairs`)}</small></p>`
              : ''
          }${tm.tips.map(t => `<p class="tv-p tv-vs-tip">${esc(t)}</p>`).join('')}`
        : '';
    const left = `<aside class="bd-panel tv-left figma-board-left ${phase === 'early' ? 'laning' : 'post'}" data-pv="boardPanel">${phase === 'early' ? now + mine : ''}${versus}${spawnBands(s)}${soulsBox(s)}</aside>`;
    // The comeback summary: a panel of its own at the top centre, in the gap between the two teams'
    // columns under the kill count (the left panel has no room above the game's stat block).
    const comeback = comebackBox(s),
      top = comeback ? `<aside class="bd-panel figma-board-top" data-pv="topBar">${comeback}</aside>` : '';
    // With the panel kept open on the left (preparation, Alt Q), the board's own panel would cover it.
    // After the laning phase the Tab board keeps the farming box where the game view has it (Figma 10:4708).
    const farming = phase === 'early' ? '' : farmingBox(s);
    return `<div class="tv-tags">${strips}${tags}</div>${
      s.compactAt?.kind === 'detail' || !shown(s, 'boardPanel') ? '' : left
    }${s.compactAt?.kind === 'detail' ? '' : top}${farming ? `<div class="figma-game post">${farming}</div>` : ''}`;
  }
  // Hero select: what the hovered hero is, in a few short rows (the strip under the hero grid).
  // Gun range class from the weapon's damage falloff (deadlock-api weapon data); snipers by hand.
  const LONG = [3, 17];
  const RANGE_KO = { close: '근거리', closeMid: '근·중거리', mid: '중거리', long: '원거리' };
  // Gun range as a type: close and close-mid fight up close, mid is balanced, long pokes from afar.
  const RANGE_TYPE = tr(
    {
      close: ['근접', 'close'],
      closeMid: ['근접', 'close'],
      mid: ['밸런스', 'mid'],
      long: ['원거리', 'long']
    },
    {
      close: ['Close', 'close'],
      closeMid: ['Close', 'close'],
      mid: ['Mid', 'mid'],
      long: ['Long', 'long']
    }
  );
  function gunRange(id) {
    const g = window.HERO_RANGES?.[id]?.gun;
    if (LONG.includes(id)) return 'long';
    if (!g) return 'mid';
    return g.falloffEnd <= 35 || g.bullets >= 4
      ? 'close'
      : g.falloffEnd <= 48
        ? 'closeMid'
        : g.falloffEnd <= 58
          ? 'mid'
          : 'long';
  }
  // The game's own hero complexity (heroes.json `complexity`, 1-4).
  const LEVEL = tr(['', '쉬움', '보통', '어려움', '매우 어려움'], ['', 'Easy', 'Medium', 'Hard', 'Very hard']);
  const LEVEL_SHORT = tr(['', '쉬움', '보통', '어려움', '최상'], ['', 'Easy', 'Med', 'Hard', 'Max']);
  const levelOf = (id, g) => window.SoulLevels?.complexity(id) ?? g?.complexity;
  const ROLE_FULL = tr(
    { marksman: '사수', brawler: '근접 싸움꾼', assassin: '암살자', mystic: '마법사' },
    { marksman: 'Marksman', brawler: 'Brawler', assassin: 'Assassin', mystic: 'Mystic' }
  );
  const PHASE_KO = tr(
    [
      ['early', '초반'],
      ['mid', '중반'],
      ['late', '후반']
    ],
    [
      ['early', 'Early'],
      ['mid', 'Mid'],
      ['late', 'Late']
    ]
  );
  // Hero select: a wide, low card in the free strip under the hero grid, four columns:
  // who it is and its gun / its four abilities / strengths and weaknesses / what the popular build
  // focuses on (ability maxed first, item mix) and the popular items by phase.
  // What a skill does, in up to ~140 characters: whole sentences, skipping a lead-in that only sets
  // the mood ("야마토의 그림자 영혼이 스며듭니다") and says nothing about the effect.
  const EFFECT =
    /피해|효과|증가|감소|기절|둔화|회복|치유|이동|면역|저항|속도|쿨다운|처치|소환|표식|무적|침묵|밀쳐|끌어|보호막|투사체|탄|시야|은신|도약|돌진|날아|던져|설치|충전|발사|공격/;
  function skillSummary(t) {
    const parts = String(t || '')
      .replace(/\.(?=[^\s\d])/g, '. ')
      .split(/(?<=[.다])\s+/)
      .map(x => x.trim())
      .filter(Boolean);
    // (The lead-in test reads Korean; the game's English descriptions are kept whole.)
    if (parts.length > 1 && I18N.lang === 'ko' && !EFFECT.test(parts[0])) parts.shift();
    let out = '';
    for (const p of parts) {
      if (out && (out + ' ' + p).length > 140) break;
      out = out ? out + ' ' + p : p;
    }
    return out.replace(/\.$/, '');
  }
  function gunText(gun) {
    if (!gun) return '';
    const kind = gunKind(gun);
    return L(
      `${kind} · 탄창 ${gun.clip} · 초당 ${gun.rate}발 · DPS ${gun.dps}`,
      `${kind} · clip ${gun.clip} · ${gun.rate}/sec · DPS ${gun.dps}`
    );
  }
  function gunKind(gun) {
    return gun.bullets > 1
      ? L(`산탄 ${gun.bullets}발`, `${gun.bullets} pellets`)
      : gun.burst
        ? L(`${gun.burst}연발`, `${gun.burst}-round burst`)
        : L('단발', 'Single shot');
  }
  // The same facts as chips: a dim label and a bold value, each kept on one line.
  const stat = (label, value, unit = '') =>
    `<span class="hv-stat">${label ? `<i>${esc(label)}</i>` : ''}<b>${esc(value)}</b>${unit ? `<u>${esc(unit)}</u>` : ''}</span>`;
  function popularBuild(id, base) {
    const build = window.HERO_BUILDS?.[id],
      catalog = new Map((window.ITEM_CATALOG || []).map(i => [i.id, i]));
    if (!build) return '';
    return PHASE_KO.map(
      ([k, ko]) =>
        `<div class="hv-phase"><i>${ko}</i>${(build[k] || [])
          .slice(0, 4)
          .map(x => catalog.get(x.id))
          .filter(Boolean)
          .map(
            it =>
              `<span><img src="${base}${esc(it.file)}" alt=""><small>${esc(itemName(it.id))}</small></span>`
          )
          .join('')}</div>`
    ).join('');
  }
  function hoverCard(s, base = 'ui/') {
    const id = s.live?.hover?.heroId,
      g = guide(id),
      t = heroType(id);
    if (!g) return '';
    const r = window.HERO_RANGES?.[id],
      gun = r?.gun,
      build = window.HERO_BUILDS?.[id],
      first = build?.maxFirst?.[0];
    const list = xs => (xs || []).map(x => `<li>${esc(x)}</li>`).join('');
    const flow = [
      CURVE[t?.curve]?.[0],
      PATTERN[t?.pattern?.[0]],
      STRENGTH[g.laneStrength]?.[0],
      LEVEL[levelOf(g.id, g)] ? L('난이도 ', 'Difficulty ') + LEVEL[levelOf(g.id, g)] : ''
    ]
      .filter(Boolean)
      .join(' · ');
    const skills = (g.abilities || [])
      .slice(0, 4)
      .map((a, n) => {
        const k = r?.skills?.[n],
          // ('반경' is the data's own kind key.)
          dist = k?.m
            ? (k.kind === '반경' ? L('반경 ', 'Radius ') : '') + (k.m >= 100 ? L('매우 멂', 'Very far') : k.m + 'm')
            : '',
          focus = first?.slot === a.slot;
        return `<div class="hv-skill ${focus ? 'focus' : ''}"><b><em>${focus ? `<img class="master-skill" src="${base}assets/figma/master-skill.svg" alt="">` : ''}<span>${a.slot}</span></em>${esc(I18N.name(a))}${dist ? `<small>${esc(dist)}</small>` : ''}${focus ? `<u>${L('먼저 마스터', 'Max first')}</u>` : ''}</b><p>${esc(skillSummary(L(a.desc, a.descEn || '')))}</p></div>`;
      })
      .join('');
    const focusText = first
      ? L(
          `${first.slot}번 ${esc(g.abilities?.[first.slot - 1]?.ko || '')} 먼저 마스터 <small>${first.share}%</small>`,
          `Max ${first.slot} ${esc(g.abilities?.[first.slot - 1]?.en || '')} first <small>${first.share}%</small>`
        )
      : '';
    const mix = t?.share
      ? `${L('아이템', 'Items')} ${[
          ['spirit', L('마법', 'Spirit')],
          ['weapon', L('무기', 'Weapon')],
          ['vitality', L('생명', 'Vitality')]
        ]
          .sort((a, b) => t.share[b[0]] - t.share[a[0]])
          .map(([k, ko]) => `${ko} ${t.share[k]}%`)
          .join(' · ')}`
      : '';
    const range = RANGE_TYPE[gunRange(id)];
    // How the hero is played: its core moves (data/hero-core-play.json), then phase by phase.
    // (Guide text in the display language; with no English, the section goes.)
    const gp = gt(g, 'plan'),
      core = (gt(g, 'core') || []).map(x => `<p class="core">${esc(x)}</p>`).join(''),
      phases = gp
        ? [
            ['early', L('라인전', 'Laning')],
            ['mid', L('중반', 'Mid')],
            ['late', L('후반', 'Late')]
          ]
            .filter(([k]) => gp[k])
            .map(([k, ko]) => `<p><i>${ko}</i>${esc(gp[k])}</p>`)
            .join('')
        : '';
    const plan = core || phases ? `<section class="hv-plan"><h4>${L('핵심 운용', 'Core play')}</h4>${core}${phases}</section>` : '';
    // Tier, win and pick rate here too, so they show even when the portrait grid is not read.
    const w = t?.winRate?.overall,
      rank =
        [...(window.HERO_TYPES || [])]
          .sort((a, b) => (b.winRate?.overall || 0) - (a.winRate?.overall || 0))
          .findIndex(x => x.id === id) + 1,
      tierRow = Number.isFinite(w)
        ? `<p class="hv-row hv-tier"><i>${L('티어', 'Tier')}</i><span><em><span class="sel-rank t${tierOf(w)}"><b>${tierOf(w)}</b></span><span class="hv-tier-name">${L(`${tierOf(w)}티어`, `Tier ${tierOf(w)}`)}${rank ? `<small>${L(`승률 ${rank}위 / ${(window.HERO_TYPES || []).length}`, `#${rank} win rate of ${(window.HERO_TYPES || []).length}`)}</small>` : ''}</span></em><em>${L('승률', 'Win')} ${pct1(w)}%</em><em>${L('픽률', 'Pick')} ${pct1(pickRates().get(id))}%</em></span></p>`
        : '';
    // The same for Street Brawl (online stats since the last patch), under it: which mode is about to
    // be played is not known here.
    const bh = s.brawl?.stats?.heroes?.[id],
      brawlRow = bh
        ? `<p class="hv-row hv-tier hv-brawl"><i>${L('난투', 'Brawl')}</i><span><em><span class="sel-rank t${bh.tier}"><b>${bh.tier}</b></span><span class="hv-tier-name">${L(`${bh.tier}티어`, `Tier ${bh.tier}`)}<small>${L(`${bh.rank}위 / ${s.brawl.stats.count}`, `#${bh.rank} of ${s.brawl.stats.count}`)}</small></span></em><em>${L('승률', 'Win')} ${pct1(bh.winRate)}%</em><em>${L('픽률', 'Pick')} ${pct1(bh.pickRate)}%</em></span></p>`
        : '';
    // Under the name: tier, how the hero plays (curve, difficulty, lane, gun or spirit) and its gun.
    const lv = levelOf(g.id, g),
      plays = [
        CURVE[t?.curve]?.[0],
        PATTERN[t?.pattern?.[0]],
        LEVEL[lv] ? `${L('난이도', 'Difficulty')} <b class="lv d${lv}">${LEVEL[lv]}</b>` : '',
        STRENGTH[g.laneStrength]?.[0],
        FIGHT[t?.fight]
      ].filter(Boolean),
      playRow = plays.length
        ? `<p class="hv-row hv-plays"><i>${L('운영', 'Play')}</i><span>${plays.map(x => `<em>${x}</em>`).join('')}</span></p>`
        : '',
      gunRow = `<p class="hv-row hv-gun"><i>${L('평타', 'Gun')}</i><span><em><b class="hv-range ${range[1]}">${esc(range[0])}</b>${
        gun ? `<b class="hv-kind">${gunKind(gun)}</b>` : ''
      }</em>${
        gun
          ? `<em>${stat('DPS', gun.dps)}${stat(L('탄창', 'Clip'), gun.clip)}${stat(L('초당', 'Rate'), gun.rate, L('발', '/s'))}</em><em>${stat(L('최대 피해', 'Max dmg'), gun.falloffStart, 'm')}<u>~</u>${stat('', gun.falloffEnd, 'm')}<i>${L('최소 피해', 'min dmg')}</i></em>`
          : ''
      }</span></p>`;
    const name =
      '<h3>' +
      esc(I18N.name(g)) +
      ' <small>' +
      esc(ROLE_FULL[g.role] || '') +
      '</small></h3>' +
      (I18N.lang === 'en' && !g.styleEn ? '' : '<p class="hv-concept">' + esc(gt(g, 'style') || '') + '</p>');
    if (s.settings?.selectDetail === false)
      return (
        '<div class="hv hv-summary"><section class="hv-id">' +
        name +
        '</section>' +
        (I18N.lang === 'en' && !core ? '' : '<section class="hv-summary-core"><h4>' + L('핵심 운용', 'Core play') + '</h4>' + core + '</section>') +
        '<section class="hv-summary-meta"><h4>' +
        L('난이도 · 역할', 'Difficulty · role') +
        '</h4><p>' +
        esc(flow) +
        '</p></section><section class="hv-summary-skills"><h4>' +
        L('능력', 'Abilities') +
        '</h4>' +
        g.abilities.map(a => '<p><b>' + a.slot + ' ' + esc(I18N.name(a)) + '</b></p>').join('') +
        '</section><p class="hv-summary-help">' +
        L(
          '오버레이 설정의 ‘영웅 선택 상세 카드’를 켜면 능력 설명·빌드·통계를 표시합니다.',
          'Turn on the detailed hero select card in the overlay settings for ability text, builds and stats.'
        ) +
        '</p></div>'
      );
    return (
      '<div class="hv hv-full"><section class="hv-id">' +
      name +
      tierRow +
      brawlRow +
      playRow +
      gunRow +
      '</section><section class="hv-skills"><h4>' +
      L('능력', 'Abilities') +
      '</h4>' +
      skills +
      '</section>' +
      (I18N.lang === 'en' && !g.strengthsEn?.length
        ? ''
        : '<section class="hv-pros"><h4 class="good">' +
          L('강점', 'Strengths') +
          '</h4><ul>' +
          list(gt(g, 'strengths')) +
          '</ul></section><section class="hv-cons"><h4 class="bad">' +
          L('약점', 'Weaknesses') +
          '</h4><ul>' +
          list(gt(g, 'weaknesses')) +
          '</ul></section>') +
      '<section class="hv-build"><h4>' +
      L('빌드 중점 · 인기 빌드', 'Build focus · popular build') +
      '</h4>' +
      (focusText ? '<p class="hv-focus">' + focusText + '</p>' : '') +
      (mix ? '<p class="hv-mix">' + esc(mix) + '</p>' : '') +
      (popularBuild(id, base) || '<p>—</p>') +
      '</section>' +
      plan +
      '</div>'
    );
  }
  // Hero select grid: the game lists heroes alphabetically by English name ('The' ignored), nine per
  // row. Each portrait gets its rank by 30-day win rate (just the number, so the game's NEW tag stays
  // visible), coloured by tier. The cells the reader recognised place the badges: a hero Lookout does
  // not know yet shifts every later cell by one, so each hero takes the shift of the recognised
  // heroes around it, and where those disagree (the unknown one sits between) only recognised
  // cells get a badge.
  const tierOf = w => (!Number.isFinite(w) ? 5 : w >= 0.53 ? 1 : w >= 0.51 ? 2 : w >= 0.485 ? 3 : w >= 0.465 ? 4 : 5);
  // A portrait in the select grid, in window heights: the first one's top left, size and step.
  const CARD = { x: 0.0685, y: 0.139, w: 0.0694, h: 0.1157, dx: 0.0771, dy: 0.1234 };
  // Tier by 30-day win rate. Each tier has its own colour and its own shape around the rank, so it
  // reads without colour too.
  const TIERS = tr(
    [
      [1, '53% 이상'],
      [2, '51~53%'],
      [3, '48.5~51%'],
      [4, '46.5~48.5%'],
      [5, '46.5% 미만']
    ],
    [
      [1, '53%+'],
      [2, '51~53%'],
      [3, '48.5~51%'],
      [4, '46.5~48.5%'],
      [5, 'under 46.5%']
    ]
  );
  // What each hero is for, in a word or two (from its guide: role, tags, concept), on its portrait.
  const HERO_LABELS = {
    1: ['지속딜', '광역 CC'],
    2: ['능력 누커', '전선 푸셔'],
    3: ['저격수', '마무리'],
    4: ['능력 누커', '흡혈'],
    6: ['탱커', '돌진'],
    7: ['무기 캐리', '순간이동'],
    8: ['지역 장악', '포탑'],
    10: ['CC', '폭딜'],
    11: ['서포터', '광역 CC'],
    12: ['서포터', '기동'],
    13: ['무기 캐리', '은신'],
    14: ['견제', '헤드샷'],
    15: ['갈고리', '폭딜'],
    16: ['암살자', '기습'],
    17: ['저격수', '견제'],
    18: ['탱커', '기습'],
    19: ['근접 전사', '마무리'],
    20: ['서포터', '아군 강화'],
    25: ['근접 전사', '버티기'],
    27: ['암살자', '근접'],
    31: ['암살자', '광역 CC'],
    35: ['서포터', 'CC'],
    50: ['능력 누커', '도주기'],
    52: ['무기 캐리', '글로벌'],
    58: ['암살자', '처형'],
    60: ['견제', 'CC'],
    63: ['마법 사수', '침묵'],
    64: ['암살자', '고립'],
    65: ['CC', '처형'],
    66: ['탱커', '지속딜'],
    67: ['서포터', '글로벌 궁'],
    69: ['CC', '이동 지원'],
    72: ['근접 전사', '광역 CC'],
    76: ['소환사', '약화'],
    77: ['결투가', '근접'],
    78: ['공중 사수', '기동'],
    79: ['힐러', 'CC'],
    80: ['근접 전사', 'CC'],
    81: ['능력 누커', '침묵'],
    84: ['탱커', '아군 강화'],
    85: ['지역 장악', '보호'],
    86: ['성장형', 'CC'],
    87: ['힐러', '지속딜'],
    88: ['견제', '침묵']
  };
  // The same labels in English, word by word.
  const LABEL_EN = {
    지속딜: 'DPS',
    '광역 CC': 'AoE CC',
    '능력 누커': 'Spirit nuker',
    '전선 푸셔': 'Lane pusher',
    저격수: 'Sniper',
    마무리: 'Finisher',
    흡혈: 'Lifesteal',
    탱커: 'Tank',
    돌진: 'Charge',
    '무기 캐리': 'Gun carry',
    순간이동: 'Teleport',
    '지역 장악': 'Zone control',
    포탑: 'Turrets',
    CC: 'CC',
    폭딜: 'Burst',
    서포터: 'Support',
    기동: 'Mobile',
    은신: 'Stealth',
    견제: 'Poke',
    헤드샷: 'Headshots',
    갈고리: 'Hook',
    암살자: 'Assassin',
    기습: 'Ambush',
    '근접 전사': 'Melee fighter',
    '아군 강화': 'Ally buffs',
    버티기: 'Durable',
    근접: 'Melee',
    도주기: 'Escape',
    글로벌: 'Global',
    처형: 'Execute',
    '마법 사수': 'Spirit gunner',
    침묵: 'Silence',
    고립: 'Isolate',
    '글로벌 궁': 'Global ult',
    '이동 지원': 'Ally mobility',
    소환사: 'Summoner',
    약화: 'Debuffs',
    결투가: 'Duelist',
    '공중 사수': 'Air gunner',
    힐러: 'Healer',
    보호: 'Protect',
    성장형: 'Scaling'
  };
  // Pick rate: share of matches the hero is in (12 heroes a match).
  function pickRates() {
    const types = window.HERO_TYPES || [],
      total = types.reduce((n, t) => n + (t.winRate?.matches || 0), 0) / 12;
    return new Map(types.map(t => [t.id, total ? (t.winRate?.matches || 0) / total : null]));
  }
  const pct1 = (x, d = 1) => (Number.isFinite(x) ? (x * 100).toFixed(d) : '—');
  // The game lists heroes by name in the client's language: 가나다 in the Korean client, A–Z in English.
  // Both are tried (the game client's language need not be the overlay's); the overlay's own goes
  // first, so it wins a tie.
  const GRID_KO = (a, b) => a.ko.localeCompare(b.ko, 'ko'),
    GRID_EN = (a, b) =>
      a.en.replace(/^The /, '').toLowerCase().localeCompare(b.en.replace(/^The /, '').toLowerCase());
  const GRID_HERE = (a, b) => I18N.name(a).localeCompare(I18N.name(b), I18N.lang);
  const gridOrders = () => (I18N.lang === 'ko' ? [GRID_KO, GRID_EN] : I18N.lang === 'en' ? [GRID_EN, GRID_KO] : [GRID_HERE, GRID_EN]);
  function gridPairs(heroes, cells) {
    const order = new Map(heroes.map((h, k) => [h.id, k])),
      sure = cells
        .filter(c => order.has(c.id) && c.score >= 0.75 && c.margin >= 0.15)
        .map(c => ({ k: order.get(c.id), n: c.row * 9 + c.col }))
        .sort((a, b) => a.k - b.k);
    // Unknown heroes only push later ones on: the shift (cell - place in our list) never shrinks
    // along the list. Reads that break that are dropped; too many dropped and the badges stay off.
    const pairs = [];
    for (const p of sure) {
      const shift = p.n - p.k;
      if (shift >= 0 && shift <= 6 && (!pairs.length || shift >= pairs.at(-1).n - pairs.at(-1).k)) pairs.push(p);
    }
    return pairs.length < 5 || pairs.length < sure.length * 0.8 ? [] : pairs;
  }
  function selectBadges(s) {
    const cells = s.live?.selectGrid?.cells || [];
    let heroes = [],
      pairs = [];
    for (const cmp of gridOrders()) {
      const list = [...(window.HERO_GUIDE || [])].sort(cmp),
        found = gridPairs(list, cells);
      if (found.length > pairs.length) [heroes, pairs] = [list, found];
    }
    if (!pairs.length) return '';
    const cellOf = k => {
      const own = pairs.find(p => p.k === k);
      if (own) return own.n;
      const below = pairs.filter(p => p.k < k).at(-1),
        above = pairs.find(p => p.k > k),
        shifts = [below, above].filter(Boolean).map(p => p.n - p.k);
      return shifts.length && shifts.every(x => x === shifts[0]) ? k + shifts[0] : null;
    };
    const ranked = [...(window.HERO_TYPES || [])].sort((a, b) => (b.winRate?.overall || 0) - (a.winRate?.overall || 0)),
      rankOf = id => ranked.findIndex(t => t.id === id) + 1,
      H = innerHeight,
      hover = s.live?.hover?.heroId,
      picks = pickRates();
    // Each chip sits flush in a corner of its portrait: rank in its tier shape top left, what the hero
    // is for top right, win and pick rate bottom left, difficulty bottom right. Portraits measured on
    // the 1080p select screen: 75×125 from (74, 150), 83.3 apart across and 133.3 down.
    let last = 0;
    const badges = heroes
      .map((h, k) => {
        const n = cellOf(k);
        if (n === null) return '';
        last = Math.max(last, n);
        const row = Math.floor(n / 9),
          col = n % 9,
          w = heroType(h.id)?.winRate?.overall,
          x = ((CARD.x + col * CARD.dx) * H + 2).toFixed(1),
          y = ((CARD.y + row * CARD.dy) * H + 2).toFixed(1);
        return `<div class="sel-cell" data-hero="${h.id}" style="left:${x}px;top:${y}px;width:${(CARD.w * H - 4).toFixed(1)}px;height:${(CARD.h * H - 4).toFixed(1)}px;--sel-scale:${(H / 1080).toFixed(4)}"><div class="sel-rank t${tierOf(w)} ${h.id === hover ? 'on' : ''}"><b>${rankOf(h.id) || '?'}</b></div><div class="sel-role">${(
          HERO_LABELS[h.id] || []
        )
          .map(x => `<span>${esc(L(x, LABEL_EN[x] || x))}</span>`)
          .join(
            ''
          )}</div>${LEVEL_SHORT[levelOf(h.id, h)] ? `<div class="sel-diff d${levelOf(h.id, h)}">${LEVEL_SHORT[levelOf(h.id, h)]}</div>` : ''}<div class="sel-rate ${h.id === hover ? 'on' : ''}"><span><i>${L('승', 'W')}</i>${pct1(w)}</span><span><i>${L('픽', 'P')}</i>${pct1(picks.get(h.id))}</span></div></div>`;
      })
      .join('');
    const top = (CARD.y + (Math.floor(last / 9) + 1) * CARD.dy) * H;
    return `${badges}<div class="sel-legend" style="left:${(0.0694 * H).toFixed(1)}px;top:${top.toFixed(1)}px"><b>${L('티어', 'Tier')}</b>${TIERS.map(
      ([t, range]) => `<span><em class="sel-rank t${t}"><b>${t}</b></em>${range}</span>`
    ).join(
      ''
    )}<b class="sel-legend-gap">${L('난이도', 'Difficulty')}</b>${[1, 2, 3, 4].map(d => `<span><em class="sel-diff d${d}">${LEVEL_SHORT[d]}</em></span>`).join('')}<small>${L(
      '숫자 = 승률 순위 · 승 = 승률% · 픽 = 픽률%(경기 중 등장 비율) · 최근 30일 · 난이도 = 게임 공식 영웅 복잡도',
      "Number = win-rate rank · W = win % · P = pick % (share of matches) · last 30 days · difficulty = the game's hero complexity"
    )}</small></div>`;
  }
  // Collapsed overlay: an urgent alert, the sound just heard, the jungles while laning, then objective
  // timers, one short row each.
  // Urns alternate yellow and green lanes: show where this one lands and where the next will.
  const URN_LANE = tr({ yellow: '노랑', green: '초록' }, { yellow: 'Yellow', green: 'Green' });
  const urnText = u =>
    `${clock(u.remaining)} ${URN_LANE[u.lane] || ''}→${URN_LANE[u.lane === 'yellow' ? 'green' : 'yellow']}`;
  // Rifts have a spawn window; its earliest bound must not look like a guaranteed countdown.
  // ≈ once a rift was missed: the window is then counted from an unseen one.
  const riftBand = r => `${r.missed ? '≈' : ''}${clock(r.from)}~${clock(r.to)}`;
  const campClockText = c =>
    c.remainingRange ? c.remainingRange.map(clock).join('~') : (c.automatic ? '≈' : '') + clock(c.remaining);
  const CURVE_SHORT = tr(
    { early: '초반형', late: '후반형', even: '균형형' },
    { early: 'Early', late: 'Late', even: 'Balanced' }
  );
  const FIGHT_SHORT = tr({ gun: '무기', spirit: '마법', hybrid: '혼합' }, { gun: 'Weapon', spirit: 'Spirit', hybrid: 'Mixed' });
  const rosters = s => ({
    ours: [s.live?.local?.heroId, ...(s.live?.allies || []).map(a => a.heroId)].filter(Number.isInteger),
    theirs: (s.live?.opponents || []).map(o => o.heroId).filter(Number.isInteger)
  });
  // Preparation: the match HUD is up and the clock has not passed 0:15. The app decides it (sticky
  // over recognition flicker); views without that flag fall back to the clock. Hero select (no HUD)
  // keeps the hero picker.
  function pregame(s) {
    if (typeof s.prep === 'boolean') return s.prep;
    const t = s.live?.seconds;
    return !!(s.live?.hudDetected || s.live?.playing || s.live?.held) && Number.isFinite(t) && t < 15;
  }
  const heroShort = id => {
    const t = heroType(id);
    return [CURVE_SHORT[t?.curve], FIGHT_SHORT[t?.fight]].filter(Boolean).join(' · ');
  };
  function analysis(s) {
    const { ours, theirs } = rosters(s);
    return window.Comp && ours.length && theirs.length
      ? window.Comp.analyze(ours, theirs, window.HERO_GUIDE || [], window.HERO_TYPES || [])
      : null;
  }
  const curveText = t =>
    [
      t.curve.late && L(`후반 ${t.curve.late}`, `${t.curve.late} late`),
      t.curve.early && L(`초반 ${t.curve.early}`, `${t.curve.early} early`)
    ].filter(Boolean);
  const topTraits = t =>
    Object.entries(t.counts)
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => window.Comp.TRAITS[k].ko);
  function pregameRows(s, row) {
    const { ours, theirs } = rosters(s),
      a = analysis(s),
      laneOpp = s.intel?.lane?.opponents || [];
    if (!ours.length && !theirs.length) {
      row(L('양 팀', 'Teams'), L('영웅 인식 중', 'Reading heroes'));
      return;
    }
    if (laneOpp.length)
      row(L('전선 상대', 'Lane opp.'), laneOpp.map(id => heroName(id, '?')).join(' · '), 'enemy');
    if (a) row(L('적 조합', 'Enemy comp'), [a.them.style, ...curveText(a.them)].join(' · '), 'enemy');
    for (const id of theirs) row(heroName(id, L('적', 'Enemy')), heroShort(id), 'enemy sub');
    if (!theirs.length) row(L('적 팀', 'Enemy team'), L('확인 중', 'Reading'), 'enemy');
    if (a && topTraits(a.them).length) row(L('적 강점', 'Enemy strengths'), topTraits(a.them).join(' · '), 'enemy');
    if (a) row(L('아군 조합', 'Our comp'), [a.us.style, ...curveText(a.us)].join(' · '), 'ally');
    else if (ours.length) row(L('아군', 'Allies'), L(`${ours.length}명 확인`, `${ours.length} read`), 'ally');
    const shop = (s.coach || []).find(c => c.id === 'items');
    // The card's title is "추천 아이템 · <first item>" (coach.cjs); the row shows the item alone.
    if (shop) row(L('준비 아이템', 'Items to buy'), shop.title.replace(/^(추천 아이템|[^·]*items?) · /i, ''));
  }
  // Tab panel during preparation: both teams at a glance, then every hero's card.
  function teams(s, base, { compact = false } = {}) {
    const { ours, theirs } = rosters(s),
      a = analysis(s);
    if (!ours.length && !theirs.length)
      return `<p class="iu-empty">${L('영웅 목록 확인 전', 'Waiting for hero list')}</p>`;
    if (compact)
      return `${a ? `<div class="iu-card top"><b>${L(`상대 ${esc(a.them.style)} · 우리 ${esc(a.us.style)}`, `Them: ${esc(a.them.style)} · Us: ${esc(a.us.style)}`)}</b><p>${esc(a.strategy[0] || '')}</p></div>` : ''}${
        theirs.length
          ? `<p class="iu-line"><i>${L('적 팀', 'Enemy team')}</i></p>${theirs.map(id => heroRow(id, base, s, 'enemy')).join('')}`
          : ''
      }${ours.length ? `<p class="iu-line"><i>${L('우리 팀', 'Our team')}</i></p>${ours.map(id => heroRow(id, base, s, 'ally')).join('')}` : ''}`;
    const summary = (label, t) =>
      `<div class="iu-card"><b>${label} · ${esc(t.style)}</b><p>${esc(
        [...curveText(t), ...topTraits(t)].join(' · ') || L('뚜렷한 성향 없음', 'No clear lean')
      )}${t.strengths[0] ? '<br>' + esc(t.strengths[0]) : ''}${t.weaknesses[0] ? `<br>${L('약점', 'Weakness')} · ` + esc(t.weaknesses[0]) : ''}</p></div>`;
    return `${a ? summary(L('상대', 'Them'), a.them) + summary(L('우리', 'Us'), a.us) + `<div class="iu-card top"><b>${L('운영', 'Plan')}</b><p>${a.strategy.slice(0, 3).map(esc).join('<br>')}</p></div>` : ''}${theirs.length ? `<p class="iu-line"><i>${L('적 영웅', 'Enemy heroes')}</i>${L(`${theirs.length}명`, `${theirs.length}`)}</p>${theirs.map(id => heroCard(id, base, { as: 'enemy' })).join('')}` : ''}${ours.length ? `<p class="iu-line"><i>${L('아군', 'Allies')}</i>${L(`${ours.length}명`, `${ours.length}`)}</p>${ours.map(id => heroCard(id, base, { as: 'ally' })).join('')}` : ''}`;
  }
  // The preparation panel's team column, one team. Before the first wave nobody has items or an
  // ultimate, so it is about the make-up: a few plain lines (style and traits, damage mix and the
  // defence it calls for, when the team is strong, the team's own plan), then every hero's card
  // (heroMini) in two groups, my lane first and larger. An enemy card also says what its usual build
  // threatens and the item that answers it; a lane opponent what to watch out for and the answer to
  // each ability.
  function teamPrep(s, base, side, { columns = false } = {}) {
    const enemy = side === 'enemy',
      { ours, theirs } = rosters(s),
      ids = enemy ? theirs : ours,
      a = analysis(s),
      t = a && (enemy ? a.them : a.us);
    if (!ids.length)
      return `<p class="iu-empty">${enemy ? L('적 팀 확인 전', 'Waiting for enemy team') : L('우리 팀 확인 전', 'Waiting for our team')}</p>`;
    const info = s.intel?.lane || {},
      me = s.live?.local?.heroId,
      near = new Set(enemy ? info.opponents || [] : [me, info.partner]);
    // Damage mix: hybrid counts half to each side for the defence call.
    const mix = { spirit: 0, hybrid: 0, gun: 0 };
    for (const id of ids) {
      const f = heroType(id)?.fight;
      if (f in mix) mix[f]++;
    }
    const sp = mix.spirit + mix.hybrid / 2,
      gn = mix.gun + mix.hybrid / 2;
    const defence =
      sp - gn >= 1.5
        ? L('마법 저항부터 챙기세요.', 'Buy spirit armor first.')
        : gn - sp >= 1.5
          ? L('총탄 방어부터 챙기세요.', 'Buy bullet armor first.')
          : L('마법 저항과 총탄 방어를 고르게 챙기세요.', 'Buy spirit and bullet armor evenly.');
    const curve = t?.curve || { early: 0, late: 0 },
      when =
        curve.late - curve.early >= 2
          ? L(
              `후반형이 ${curve.late}명이라 오래 갈수록 세집니다.`,
              `${curve.late} late-game heroes: stronger the longer it goes.`
            )
          : curve.early - curve.late >= 2
            ? L(`초반형이 ${curve.early}명이라 초반에 몰아붙입니다.`, `${curve.early} early heroes: strongest early.`)
            : L('시간대를 크게 타지 않습니다.', 'No strong timing.');
    // The plan sentences that are about this team (the ones about us start with 우리, or We / Our).
    const plan = (a?.strategy || []).filter(x => /^(우리|We |Our )/.test(x) !== enemy).slice(0, 2);
    const traits = t ? topTraits(t) : [];
    const head = `<div class="pt-head">${
      t
        ? `<p class="pt-style"><b>${esc(t.style)}</b>${traits.length ? ` ${esc(traits.join(', '))}` : ''}${columns ? ` ${when}` : ''}</p>`
        : ''
    }<p class="pt-mix">${L(
      `마법 ${mix.spirit} · 혼합 ${mix.hybrid} · 무기 ${mix.gun}`,
      `Spirit ${mix.spirit} · Mixed ${mix.hybrid} · Weapon ${mix.gun}`
    )}</p>${enemy ? `<p>${defence}</p>` : ''}${columns ? '' : `<p>${when}</p>`}${
      !enemy && t?.weaknesses?.[0] ? `<p>${esc(t.weaknesses[0])}</p>` : ''
    }${!columns && plan.length ? `<ul class="pt-plan">${plan.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`;
    const row = id => {
      const g = guide(id),
        h = heroType(id);
      if (!g) return '';
      const kind = [ROLE[g.role], CURVE_SHORT[h?.curve], FIGHT_SHORT[h?.fight]].filter(Boolean).join(' · ');
      const mark = enemy
        ? near.has(id)
          ? L('내 전선', 'My lane')
          : ''
        : id === me
          ? L('나', 'Me')
          : id === info.partner
            ? L('파트너', 'Partner')
            : '';
      let k = '';
      if (enemy) {
        const seen = s.live?.enemyItems?.[id],
          b = window.ItemIntel
            ? seen?.length
              ? window.ItemIntel.inferBuild(seen, window.ITEM_CATALOG || [], window.ITEM_KO || [])
              : window.ItemIntel.expectedBuild(id, window.HERO_TYPES, window.ITEM_CATALOG || [], window.ITEM_KO || [])
            : null;
        // Their threat in the enemy's colour; under it, after a grey 대응, the item that answers it.
        const threat = b?.threats?.[0],
          answer = threat && itemByName(window.ItemIntel.THREATS[threat.key]?.counters[0]);
        k = threat
          ? `<span class="pt-k"><em>${esc(threat.ko)}</em>${answer ? `<small class="pt-answer"><i>${L('대응', 'Counter')}</i> ${esc(answer)}</small>` : ''}</span>`
          : '';
      }
      // A lane opponent also says what to watch out for against it (hero guide text).
      const warn =
        enemy && near.has(id) && gt(g, 'vsTips')?.[0]
          ? `<p class="hm-line warn"><i>${L('주의', 'Watch')}</i>${esc(gt(g, 'vsTips')[0])}</p>`
          : '';
      return heroMini(id, base, {
        side,
        near: near.has(id),
        mark,
        kind,
        aside: k,
        after: warn,
        tips: enemy && near.has(id),
        column: columns
      });
    };
    // Both columns keep the same rows (prepLayout), so my lane and its opponents sit side by side:
    // a team with fewer heroes in a group gets empty places.
    const first = ids.filter(id => near.has(id)),
      rest = ids.filter(id => !near.has(id)),
      size = prepLayout(s),
      gaps = (n, cls) => `<div class="hm-gap ${cls}"></div>`.repeat(Math.max(0, n));
    if (columns) {
      if (!enemy) first.sort((a, b) => (a === me ? -1 : b === me ? 1 : 0));
      return `<div class="pp-groups">${first.length ? `<span style="grid-column:span ${first.length}">${enemy ? L('내 전선 상대', 'My lane opponents') : L('내 전선', 'My lane')}</span>` : ''}${rest.length ? `<span style="grid-column:span ${rest.length}">${L('다른 전선', 'Other lanes')}</span>` : ''}</div><div class="pp-heroes">${[...first, ...rest].map(row).join('')}</div>${head}`;
    }
    return `${head}<h4 class="pt-group">${enemy ? L('내 전선 상대', 'My lane opponents') : L('내 전선', 'My lane')}</h4>${first.map(row).join('')}${gaps(
      size.near - first.length,
      'near'
    )}<h4 class="pt-group">${L('다른 전선', 'Other lanes')}</h4>${rest.map(row).join('')}${gaps(size.rest * 2 - rest.length, '')}`;
  }
  // The preparation panel's shared rows: the most lane heroes either team has (me and my partner, or
  // the two opponents), and the rows of two the other heroes take. The panel lays both team columns
  // on these rows (overlay-live.js prepPanel).
  function prepLayout(s) {
    const { ours, theirs } = rosters(s),
      info = s.intel?.lane || {},
      mine = new Set([s.live?.local?.heroId, info.partner].filter(Number.isInteger)),
      opp = new Set(info.opponents || []),
      nearUs = ours.filter(id => mine.has(id)).length,
      nearThem = theirs.filter(id => opp.has(id)).length;
    const near = Math.max(nearUs, nearThem),
      rest = Math.ceil(Math.max(ours.length - nearUs, theirs.length - nearThem) / 2);
    // Rows: title, team head, group label, lane cards, group label, the others.
    return { near, rest, rows: 4 + near + rest };
  }
  // One hero in a few lines for the preparation panel, which shows every hero at once: its concept,
  // how it is played (every core line for my lane, the first for the others) and its four abilities
  // in a few words each (data/ability-short.json), with how to answer each when `tips`. `aside`
  // sits right of the name, `after` at the bottom.
  function heroMini(
    id,
    base,
    { side, near = false, mark = '', kind = '', aside = '', after = '', tips = false, column = false } = {}
  ) {
    const g = guide(id);
    if (!g) return '';
    // Concept, core play, ability blurbs and tips: hero guide text in the display language.
    const idea = gt(g, 'style') || (gt(g, 'tags') || []).join(tagSep()),
      core = (gt(g, 'core') || []).slice(0, near ? 3 : 1),
      blurb = a => gt(a, 'short') || gt(a, 'brief') || '';
    const skills = (g.abilities || [])
      .slice(0, 4)
      .map(
        a =>
          `<li class="${a.slot === 4 ? 'ult' : ''}"><img src="${base}assets/abilities/${id}-${a.slot}.png" alt=""><p><b>${esc(
            I18N.name(a)
          )}</b> ${column ? `<small class="hm-effect">${esc(blurb(a))}</small>` : esc(blurb(a))}${!column && tips && gt(a, 'tip') ? `<span><i>${L('대응', 'Counter')}</i> ${esc(gt(a, 'tip'))}</span>` : ''}</p></li>`
      )
      .join('');
    if (column)
      return `<article class="hm ${side}${near ? ' near' : ''}" data-hero="${id}"><header>${portrait(id, base)}<div class="hm-who"><b>${esc(I18N.name(g))}</b>${kind ? `<small>${esc(kind)}</small>` : ''}</div></header><ol class="hm-sk">${skills}</ol>${idea ? `<p class="hm-idea">${esc(idea)}</p>` : ''}${aside ? `<div class="hm-threat">${aside}</div>` : ''}${core.length ? `<ul class="hm-core">${core.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}${after}</article>`;
    return `<article class="hm ${side}${near ? ' near' : ''}"><header>${portrait(id, base)}<div class="hm-who"><b>${esc(I18N.name(g))}${
      mark ? ` <i>${mark}</i>` : ''
    }</b>${kind ? `<small>${esc(kind)}</small>` : ''}</div>${aside}</header>${idea ? `<p class="hm-idea">${esc(idea)}</p>` : ''}${
      core.length ? `<ul class="hm-core">${core.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''
    }<ol class="hm-sk">${skills}</ol>${after}</article>`;
  }
  // Tips that hold for every hero: Deadlock-only mechanics players often miss (deadlock.wiki
  // Mechanics, Movement, Souls, Unsecured, Trooper and Sinner's Sacrifice pages, 2026-10), in the
  // game's own Korean terms (data/ko-terms.json), shown between the hero's own. The 투자 tips: every
  // hero's cost_bonuses (deadlock-api heroes, 2026-10) and a DC 데드락 갤 guide (no=133606). The 불안정한
  // 균열 tips: patch notes 2026-06-30, 07-09 and 09-16 (site/patch-notes/ko.json).
  const GAME_TIPS = [
    '활주(슬라이딩)하는 동안은 탄약이 줄지 않습니다. 미끄러지면서 쏘면 재장전 없이 계속 사격합니다.',
    '방어(패링, F)에 성공하면 상대가 기절하고 2.75초간 모든 피해를 25% 더 받습니다.',
    '방어(패링) 쿨다운은 영웅의 근거리 공격을 막았을 때만 돌려받습니다. 트루퍼·가디언에겐 아끼세요.',
    '대시 직후 활력(스태미나) 칸이 파랗게 변할 때 점프하면 멀리 뛰는 대시 점프가 나갑니다.',
    '공중에서 웅크리기를 두 번 누르면 하강 대시가 나갑니다(활력 0.5칸).',
    '점프 한 번에 첫 벽 점프는 활력(스태미나)을 쓰지 않습니다. 두 번째 벽 점프부터 0.5칸씩.',
    '오르기(턱·난간을 잡고 올라가기) 중에 웅크리기를 누르고 있으면, 다 올라선 뒤 바로 활주(슬라이딩)로 이어져 멈추지 않고 달려 나갑니다.',
    '지고 있는 팀은 트루퍼·중립 유닛·오브젝트 영혼을 최대 26% 더 받습니다. 뒤처져도 파밍이 답입니다.',
    '우리 팀 평균보다 강한 적을 잡으면 처치 보상을 최대 2배 넘게 받습니다.',
    '10분 이후 많이 앞선 영웅이 죽으면 부활 시간이 최대 22초 늘어납니다. 앞설수록 조심.',
    '공중에 뜬 영혼 구슬을 아무도 안 쏘면 1초 뒤 근처 아군에게 갑니다. 근처에 아무도 없으면 그냥 사라집니다.',
    '트루퍼를 근거리 공격으로 마무리하면 영혼 구슬이 뜨지 않아 상대가 디나이할 수 없습니다.',
    '한 전선(라인)에 둘이 서 있으면 트루퍼 영혼을 각자 54%씩 받습니다. 셋이면 36%.',
    '정글·상자·영혼 슬롯머신 영혼은 "미확보 영혼"으로 들어와 몇 초에 걸쳐 확보됩니다. 그 전에 죽으면 떨어져 적이 주워 갑니다.',
    '바닥에 떨어진 영혼 구슬은 18m 안에 들어가야 흡수됩니다. 멀리서 능력으로만 트루퍼를 잡으면 절반을 놓칩니다.',
    '영혼 슬롯머신은 불빛이 거의 꺼지면 다시 하나씩 켜집니다. 전부 켜진 순간 강한 근거리 공격으로 마무리하면 영구 능력치 4개.',
    '기운의 파편(5분부터 5분마다)은 강한 근거리 공격으로 얻고 160초 지속됩니다.',
    '적 워커를 하나 부술 때마다 플렉스 슬롯이 하나 열립니다.',
    '워커 영혼은 부서지기 전 20초 안에 때린 영웅들이 40%를 나눠 갖고, 나머지 60%는 팀 전원이 똑같이 나눕니다.',
    '혼자 워커를 깰 수 있으면 죽더라도 가져가는 게 이득인 경우가 많습니다. 15~20분 이후엔 그 사이 중앙 보스를 내줄 수 있으니 조심하세요.',
    '황금 조각상(50% 확률로 생김)은 부수면 영구 능력치를 줍니다. 쌓일수록 차이가 커지니 보이면 꼭 챙기세요.',
    '균열 점령전이 60초 넘게 이어지면 영혼이 떠오르기 시작합니다. 그때부턴 쏴서 확정하고 상대 몫은 디나이하는 싸움입니다.',
    '증기 배출구 안에선 밖에서 보이지 않고 체력 재생이 조금 오릅니다.',
    '보라색 안개 지역에선 보이지도 들리지도 않지만 활력(스태미나)이 계속 줄어듭니다.',
    '기지 가디언을 부수면 그 전선의 우리 집라인이 훨씬 빨라집니다.',
    '영혼 단지를 배달하면 배달한 사람이 영혼과 영구 능력치 4개를 받습니다. 영혼은 구슬로 떨어지니 쏘거나 근거리 공격으로 바로 확보하세요. 아군이 챙기면 배달한 사람과 나눠 갖습니다.',
    '무기·생명·마법 투자는 한 갈래에 아이템 4,800 소울어치를 갖추는 순간 크게 뜁니다(무기 투자: 무기 피해 증가 18% → 46%). 주력 갈래를 먼저 4,800까지 채우세요.',
    '투자 보너스는 갈래마다 28,800 소울에서 "최대!"가 됩니다. 그 뒤로 그 갈래 아이템은 아이템 자체 효과만 더해 줍니다.',
    '불안정한 균열을 확보하면 그 자리에서 균열 트루퍼 5명이 내려갑니다(뒤처진 팀이면 최대 14명). 체력·피해가 2배 이상인 대신 영혼은 주지 않으니, 확보한 팀은 같이 밀고 들어가세요.',
    '불안정한 균열 구역 안에 있으면 미니맵에 위치가 드러납니다. 구역 밖에서 모였다가 한꺼번에 들어가세요.',
    '뒤처진 팀은 불안정한 균열 구역 안에서 저항 보너스를 받습니다. 순자산이 15% 뒤처지면 최대치이고, 첫 균열 약 20%에서 30분 40%까지 커집니다. 질수록 균열에서 싸우세요.'
  ];
  // The same tips in the game's English terms, for the English overlay (same order).
  const GAME_TIPS_EN = [
    "Sliding doesn't use ammo. Shoot while you slide to keep firing without a reload.",
    'A successful Parry (F) stuns the enemy, and they take 25% more damage from everything for 2.75s.',
    "Parry's cooldown is refunded only when you block a hero's melee. Don't waste it on Troopers or Guardians.",
    'Jump right after a dash, as the Stamina bar turns blue, for a long dash-jump.',
    'Press crouch twice in the air to down dash (0.5 Stamina).',
    'Your first wall jump per jump costs no Stamina. Each one after that costs 0.5.',
    "Hold crouch while you Mantle and you'll Slide as soon as you're up, without losing speed.",
    'The losing team gets up to 26% more Souls from Troopers, neutrals and objectives. When behind, farm.',
    "Killing an enemy stronger than your team's average pays up to more than double the bounty.",
    'After 10 min, a hero far ahead waits up to 22s longer to respawn. The further ahead, the more careful.',
    "If nobody shoots a floating Soul orb, it goes to a nearby ally after 1s. With no one nearby, it's lost.",
    "Finish Troopers with melee and no Soul orb pops up, so the enemy can't deny it.",
    'Two players in one lane each get 54% of the Trooper Souls. Three get 36% each.',
    "Souls from the jungle, crates and Sinner's Sacrifice come in as Unsecured Souls and take a few seconds to secure. Die before that and they drop for the enemy.",
    'Dropped Soul orbs are absorbed only within 18m. Kill Troopers with abilities from far away and you miss half.',
    "Sinner's Sacrifice lights come back on one by one once nearly all are out. Finish it with heavy melee when all are lit for 4 permanent stat boosts.",
    'Power-ups (every 5 min from 5:00) are claimed with heavy melee and last 160s.',
    'Each enemy Walker you destroy opens a Flex Slot.',
    'Heroes who hit a Walker in its last 20s split 40% of its Souls; the other 60% goes evenly to the whole team.',
    "If you can take a Walker alone, it's often worth it even if you die. After 15 to 20 min, careful: you may give up the Mid-Boss meanwhile.",
    'Golden Statues (50% chance to spawn) give a permanent stat boost when broken. They add up, so take every one you see.',
    'When a rift fight runs past 60s, Souls start floating up. From then on, shoot to secure yours and deny theirs.',
    "Inside a steam vent you can't be seen from outside, and your health regen goes up a little.",
    "In purple fog you can't be seen or heard, but your Stamina keeps draining.",
    'Destroying a Base Guardian makes your Zipline in that lane much faster.',
    'Delivering the Soul Urn gives the carrier Souls and 4 permanent stat boosts. The Souls drop as orbs: shoot or melee them right away. Allies who grab them share with the carrier.',
    'Weapon, Vitality and Spirit Investment jump once you hold 4,800 Souls of items in one category (Weapon Investment: weapon damage 18% → 46%). Fill your main category to 4,800 first.',
    'Investment reaches "Max!" at 28,800 Souls in a category. After that, items in it add only their own effects.',
    'Securing the Unstable Rift sends 5 Rift Troopers down from it (up to 14 if your team is behind). They have double or more health and damage but give no Souls, so push in with them.',
    'Anyone inside the Unstable Rift zone shows on the minimap. Group up outside it, then go in together.',
    'The team behind gets a resist bonus inside the Unstable Rift zone. It is full at 15% net worth behind and grows from about 20% at the first Rift to 40% at 30 min. The further behind, the more the Rift is worth fighting.'
  ];
  // A tip that changes every 7 s, taking turns: the hero's own (plan, spikes, match statistics,
  // skill order), then a game mechanic. `phase` keeps only that phase's plan line; `max` drops long ones.
  function tipFor(heroId, { phase, max = 200 } = {}) {
    // English tips run about 1.9 times the Korean length in the same width.
    const en = I18N.foreign,
      limit = en ? Math.round(max * 1.9) : max;
    const k = Math.floor(Date.now() / 7000),
      plans = en ? { early: 'Laning:', mid: 'Mid game:', late: 'Late game:' } : { early: '라인전:', mid: '중반:', late: '후반:' },
      own = ((en ? window.HERO_TIPS_EN : window.HERO_TIPS)?.[heroId] || []).filter(
        t =>
          t.length <= limit && !(phase && Object.entries(plans).some(([p, label]) => p !== phase && t.startsWith(label)))
      ),
      general = (en ? GAME_TIPS_EN : GAME_TIPS).filter(t => t.length <= limit);
    // Each list steps through its own order (a stride coprime to its length), so every tip comes up.
    const pick = xs => xs[(Math.floor(k / 2) * 7919) % xs.length];
    if (own.length && (k % 2 === 0 || !general.length)) {
      // Chinese uses a full-width colon after the label.
      const t = I18N.tr(pick(own)),
        m = /: |：/.exec(t),
        at = m ? m.index : -1;
      return { head: at > 0 ? t.slice(0, at) : L('팁', 'Tip'), text: at > 0 ? t.slice(at + m[0].length) : t };
    }
    return general.length ? { head: L('게임 팁', 'Game tip'), text: I18N.tr(pick(general)) } : null;
  }
  // A lane opponent's ultimate coming in: when its net worth first passes the unlock, an alert for
  // a while. Enemies outside my lane are left out, and an ultimate already in when first seen is
  // not news.
  const ultSeen = new Map(),
    ULT_ALERT_MS = 15000;
  function laneUlt(s) {
    const secs = s.live?.seconds,
      lane = new Set(s.intel?.lane?.opponents || []),
      now = Date.now();
    if (Number.isFinite(secs) && secs < 30) ultSeen.clear();
    let fresh = null;
    for (const o of s.live?.opponents || []) {
      const p = window.SoulLevels?.progress(o.souls);
      if (!p) continue;
      const seen = ultSeen.get(o.heroId);
      if (seen === undefined) ultSeen.set(o.heroId, p.ult.unlocked ? 0 : null);
      else if (seen === null && p.ult.unlocked) ultSeen.set(o.heroId, now);
      const at = ultSeen.get(o.heroId);
      if (lane.has(o.heroId) && at && now - at < ULT_ALERT_MS && (!fresh || at > fresh.at))
        fresh = { id: o.heroId, at };
    }
    return fresh;
  }
  const tipRow = (tip, cls) => (tip ? `<p class="${cls}"><small>${esc(tip.head)}</small>${esc(tip.text)}</p>` : '');
  // The parts of the overlay the settings can switch off (model.cjs `show`); each part carries its
  // key in data-pv, which the settings page's preview (preview.html) uses to point at it.
  // In a Street Brawl the normal-match parts step aside (brawl-mode.cjs BRAWL_OFF).
  const shown = (s, key) => s.settings?.show?.[key] !== false && !(s.brawl?.on && s.brawl.off?.includes(key));
  // The live layout follows the editable Figma frames. Keep the legacy brief() available to the
  // dashboard; game panels have independent anchors so tips cannot move the camp/ultimate rows.
  function compactTeams(s) {
    const a = analysis(s);
    if (!a) return `<p class="fg-wait">${L('양 팀 영웅 확인 중', 'Reading both teams')}</p>`;
    const one = (t, side, label) => {
      const ids = side === 'ally' ? rosters(s).ours : rosters(s).theirs,
        mix = { spirit: 0, hybrid: 0, gun: 0 };
      for (const id of ids) {
        const k = heroType(id)?.fight;
        if (k in mix) mix[k]++;
      }
      const curve = t.curve || {},
        when =
          curve.late - curve.early >= 2
            ? L(
                `후반형이 ${curve.late}명이라 오래 갈수록 세집니다.`,
                `${curve.late} late-game heroes: stronger the longer it goes.`
              )
            : curve.early - curve.late >= 2
              ? L(`초반형이 ${curve.early}명이라 초반에 몰아붙입니다.`, `${curve.early} early heroes: strongest early.`)
              : L('시간대를 크게 타지 않습니다.', 'No strong timing.');
      const sp = mix.spirit + mix.hybrid / 2,
        gn = mix.gun + mix.hybrid / 2,
        defence =
          sp - gn >= 1.5
            ? L('마법 저항부터 챙기세요.', 'Buy spirit armor first.')
            : gn - sp >= 1.5
              ? L('총탄 방어부터 챙기세요.', 'Buy bullet armor first.')
              : L('마법·총탄 방어를 고르게 챙기세요.', 'Buy spirit and bullet armor evenly.');
      return `<div class="fg-team ${side}"><small>${label}${ids.length < 6 ? L(` · ${ids.length}명 확인`, ` · ${ids.length} read`) : ''}</small><p><b>${esc(t.style)}</b><em>${esc(topTraits(t).join(', '))}</em></p><p>${esc(when)}</p><small class="fg-mix">${L(
        `마법 ${mix.spirit} · 혼합 ${mix.hybrid} · 무기 ${mix.gun}`,
        `Spirit ${mix.spirit} · Mixed ${mix.hybrid} · Weapon ${mix.gun}`
      )}</small>${side === 'enemy' ? `<p class="fg-defence">→ ${defence}</p>` : ''}</div>`;
    };
    return one(a.us, 'ally', L('아군', 'Allies')) + one(a.them, 'enemy', L('적군', 'Enemies'));
  }
  function spawnBands(s) {
    if (!shown(s, 'spawns')) return '';
    const secs = s.live?.seconds;
    if (!Number.isFinite(secs))
      return `<div class="fg-spawns" data-pv="spawns">${L('경기 시간 확인 중', 'Reading match time')}</div>`;
    // The next two spawn times (one row per time: camps, crates, bridge buffs, urns), and the rift,
    // in time order. The rift opens somewhere in its window, so it says by when.
    const o = shown(s, 'objectives') && s.intel?.objectives?.known ? s.intel.objectives : null,
      due = new Map(),
      add = (t, what) => t > secs && due.set(t, [...(due.get(t) || []), what]);
    for (const [t, what] of SPAWNS) add(t, what);
    for (let t = Math.max(900, (Math.floor(secs / 300) + 1) * 300); t <= secs + 600; t += 300)
      add(t, L('기운의 파편', 'Power-up'));
    // Which way the next urn runs: the HUD's top bar (top-bar.cjs, around a spawn), else the urn
    // schedule (objectives.cjs, the same rule). That urn gets a row of its own, so the lane names fit
    // on one line next to whatever else spawns then. The only place the way shows (2026-10-29: the
    // label under the top bar was folded into this row).
    const urn =
        s.topBar?.urn ||
        (o?.urn?.remaining > 0 && URN_LANE[o.urn.lane]
          ? { from: o.urn.lane, to: o.urn.lane === 'yellow' ? 'green' : 'yellow', remaining: o.urn.remaining }
          : null),
      way = urn && URN_LANE[urn.from] && URN_LANE[urn.to] ? '\u0001' : '',
      wayHtml = way
        ? ` <i class="urn-way"><span class="${urn.from}">${esc(URN_LANE[urn.from])}</span>→<span class="${urn.to}">${esc(URN_LANE[urn.to])}</span></i>`
        : '',
      out = way && !(urn.remaining > 0),
      urnAt = o?.urn ? o.urn.at : urn?.remaining > 0 ? Math.round(secs + urn.remaining) : null,
      ownRow = way && !out && urnAt > secs;
    if (urnAt && !ownRow) add(urnAt, L('영혼 단지', 'Soul Urn'));
    if (o?.urn) add(o.urn.at + o.rules.urn.interval, L('영혼 단지', 'Soul Urn'));
    const left = t => clock(Math.max(0, t - Math.floor(secs))),
      row = (at, what) => ({ at, cls: '', time: clock(at), when: L(`${left(at)} 뒤`, `in ${left(at)}`), what });
    const rows = [...[...due].map(([at, what]) => row(at, what.join(' · '))), ...(ownRow ? [row(urnAt, L('영혼 단지', 'Soul Urn') + way)] : [])]
      .sort((a, b) => a.at - b.at)
      .slice(0, out ? 1 : 2);
    const r = o?.rift;
    if (r)
      rows.push({
        at: r.to,
        cls: 'rift',
        time: `~${clock(r.to)}`,
        when: L(`${left(r.to)} 안에`, `within ${left(r.to)}`),
        what: L('불안정한 균열', 'Unstable Rift')
      });
    // An urn already out: its way on a row of its own, first, in place of the second spawn row.
    if (out) rows.push({ at: secs, cls: 'urn', time: L('지금', 'Now'), when: '', what: L('영혼 단지', 'Soul Urn') + way });
    // The soonest row is highlighted, the rift too when it comes first.
    return `<div class="fg-spawns" data-pv="spawns">${rows
      .sort((a, b) => a.at - b.at)
      .map(
        (x, i) =>
          `<div class="${[x.cls, i === 0 && 'next'].filter(Boolean).join(' ')}"><time>${esc(x.time)}</time><span>${esc(x.when)}</span><b>${esc(x.what).replace('\u0001', wayHtml)}</b></div>`
      )
      .join('')}</div>`;
  }
  // The team soul gap and the trailing team's comeback bonus (top-bar.cjs), in a box of its own under
  // the next-spawn panel (or where that panel would be when it is off), so it never covers the panel.
  // Approximate: the top bar's totals are rounded to 1k.
  function soulsBox(s) {
    const g = shown(s, 'topBar') ? s.topBar?.souls : null;
    if (!g) return '';
    const k = n => (n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 100000 ? 1 : 0).replace(/\.0$/, '')}K`),
      bonus = g.behind ? Math.round(g.comeback * 100) : 0;
    return !g.behind
      ? `<div class="fg-souls" data-pv="topBar">${L('영혼 거의 동률', 'Souls about even')}</div>`
      : `<div class="fg-souls ${g.behind === 'us' ? 'behind' : 'ahead'}" data-pv="topBar">${L('영혼', 'Souls')} <b>≈${g.behind === 'us' ? '−' : '+'}${k(Math.abs(g.gap))}</b> (${Math.max(1, Math.round(g.share * 100))}%)${
          bonus ? ` · <em>${g.behind === 'us' ? L(`역전 보너스 ≈${bonus}%`, `Comeback bonus ≈${bonus}%`) : L(`적 역전 보너스 ≈${bonus}%`, `Enemy comeback ≈${bonus}%`)}</em>` : ''
        }</div>`;
  }
  // Holding Tab: what the comeback rules give right now, at the top centre (deadlock.wiki Souls and Soul
  // Urn, patch notes 06-30 to 09-16-2026). The trailing team's rift and urn bonuses scale with
  // `comeback` (full at 15% behind); the resist cap is 10% + 1%/min up to 40% at 30:00; Rift Troopers
  // go from 5 to 14; the urn runner sprints up to +5 m/s; the claiming timer and the rift and urn soul
  // bonuses scale too, with no published numbers. The kill and catch-up rules apply either way.
  function comebackBox(s) {
    const g = shown(s, 'topBar') ? s.topBar?.souls : null;
    if (!g) return '';
    const mins = Math.max(0, (s.live?.seconds || 0) / 60),
      c = g.behind ? g.comeback : 0,
      them = g.behind === 'them',
      pct = Math.round(c * 100);
    // Head: whose bonus and how much of the full one, with a bar. Then a grid of what it gives now:
    // resist (bullet and spirit in the rift zone, 35 m; debuff resist too on the urn runner), Rift
    // Troopers, the claiming timer (no published values), the urn runner's sprint, and the extra souls
    // from farming and objectives (plus a comeback share of the rift and urn rewards).
    const head = !c
      ? `<header><b>${L('역전 보너스 없음', 'No comeback bonus')}</b><em>${L('거의 동률', 'About even')}</em></header>`
      : `<header><b>${them ? L('적 역전 보너스', 'Enemy comeback bonus') : L('우리 역전 보너스', 'Our comeback bonus')}</b><em>≈${pct}%</em></header><i class="cb-bar"><i style="width:${pct}%"></i></i>`;
    let grid = '';
    if (c) {
      const resist = Math.round(c * Math.min(40, 10 + mins)),
        cell = (label, value, sub = '') => `<div><small>${label}</small><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
      grid = `<div class="cb-grid">${[
        cell(L('균열 저항', 'Rift resist'), `≈${resist}%`),
        cell(L('균열 트루퍼', 'Rift troopers'), L(`${Math.round(5 + c * 9)}명`, String(Math.round(5 + c * 9)))),
        cell(L('균열 점령', 'Rift claim'), L('유리', 'Faster')),
        cell(L('단지 질주', 'Urn sprint'), `+${(c * 5).toFixed(1).replace(/\.0$/, '')}<i>m/s</i>`),
        cell(L('단지 저항', 'Urn resist'), `≈${resist}%`, L('디버프 포함', 'debuff too')),
        cell(L('추가 영혼', 'Extra souls'), g.income ? `+${g.income}%` : '—', L('균열·단지도', 'rift/urn too'))
      ].join('')}</div>`;
    }
    // Always on, either way: kills on richer heroes, the team's two poorest, and what any urn runner gets.
    const rule = (k, v) => `<p><b>${k}</b>${v}</p>`;
    return `<section class="fg-comeback ${c ? (them ? 'ahead' : 'behind') : ''}">${head}${grid}<div class="cb-rules">${[
      rule(L('처치', 'Kills'), L('부자 영웅 +127% · 부활 +6~22초', 'richer: +127% · respawn +6-22 s')),
      rule(L('하위 2명', '2 poorest'), L('팀 수입 2.5·1.5% + 역전 영혼 70%', 'team income 2.5/1.5% + 70% comeback')),
      rule(L('단지 운반', 'Urn runner'), L('이동 +2 · 대시 +10% · 둔화 저항 100%', 'move +2 · dash +10% · slow resist 100%'))
    ].join('')}</div></section>`;
  }
  // The farming priority and a game tip, bottom centre left (Figma Frame 23 on every in-game screen,
  // the late Tab board included).
  function farmingBox(s) {
    const tip = shown(s, 'tip')
        ? tipFor(s.live?.local?.heroId, { phase: window.MatchPhase?.of(s.live?.seconds).key, max: 90 })
        : null,
      plan = (s.coach || []).find(c => c.id === 'plan'),
      priority =
        typeof plan?.priority === 'string'
          ? plan.priority
          : L('라인 푸시→영혼 슬롯머신→정글 캠프→상자', "Push lane→Sinner's Sacrifice→camps→crates");
    if (!shown(s, 'route') && !tip) return '';
    return `<section class="fg-farming" data-figma="42:148">${shown(s, 'route') ? `<div data-pv="route"><small>${L('파밍 우선순위', 'Farming priority')}</small><b>${esc(priority)}</b></div>` : ''}${tip ? `<div data-pv="tip"><small>${esc(tip.head)}</small><p>${esc(tip.text)}</p></div>` : ''}</section>`;
  }
  // Street Brawl: my hero's tier in the mode and the items most taken with it (picked from the draft
  // at each round's start), with how often and how they win. Nothing until the stats are in.
  function brawlBox(s) {
    const id = s.live?.local?.heroId,
      h = s.brawl?.on && Number.isInteger(id) ? s.brawl.stats?.heroes?.[id] : null;
    if (!h) return '';
    const catalog = window.ITEM_CATALOG || [],
      items = (s.brawl.stats.mine || [])
        .slice(0, 6)
        .map(i => ({ ...i, it: catalog.find(c => c.id === i.id) }))
        .filter(i => i.it)
        .map(
          i =>
            `<div class="fg-brawl-item"><span class="sel-rank t${i.tier}"><b>${i.tier}</b></span><img src="ui/${esc(i.it.file)}" alt=""><b>${esc(itemName(i.id))}</b><span>${pct1(i.winRate, 0)}%<small>${L(`선택 ${pct1(i.pickRate, 0)}%`, `taken ${pct1(i.pickRate, 0)}%`)}</small></span></div>`
        )
        .join('');
    return `<div class="fg-brawl" data-pv="brawl"><div class="fg-row"><b>${esc(L(`난투 · ${heroName(id)}`, `Brawl · ${heroName(id)}`))}</b><span>${L(`${h.tier}티어 · 승률 ${pct1(h.winRate)}%`, `Tier ${h.tier} · ${pct1(h.winRate)}% win`)}</span></div>${
      items ? `<p class="fg-brawl-h">${L('자주 고르는 아이템 · 승률', 'Most taken items · win rate')}</p>${items}` : ''
    }</div>`;
  }
  // Street Brawl item draft: a bar on each offered item with its pick-rate tier (S to D), the item and
  // its one-line summary (ui/item-brief.js), and its pick rank among my hero's items; numbers from few
  // games or from every hero are flagged (no pick is marked best: the user asked for none, 2026-10-29). Where: above each
  // item's ring, in screen heights: x from the middle, the ring's top from the screen's (the recorded
  // draft, data/brawl-draft, and a 2026-10-29 match where the middle ring sat higher). The bar stands
  // on it.
  const DRAFT_PLACE = { left: [-0.4, 0.455], center: [0, 0.255], right: [0.395, 0.47] };
  const TIER_LETTER = ['S', 'A', 'B', 'C', 'D'];
  const draftFlag = c =>
    !c.tier
      ? L('기록 없음', 'No games')
      : c.scope === 'all'
        ? L('전체 영웅 기준', 'All heroes')
        : c.few
          ? L(`표본 ${c.matches}판`, `${c.matches} games`)
          : '';
  function draftCards(s) {
    const d = s.brawl?.on ? s.brawl.draft : null;
    if (!d?.cards?.length) return '';
    return `<div class="fg-draft" data-pv="brawl">${d.cards
      .map(c => {
        const [dx, y] = DRAFT_PLACE[c.pos],
          flag = draftFlag(c),
          brief = window.ITEM_BRIEF?.[c.id];
        return `<div class="fg-draft-card${c.tier ? ` t${c.tier}` : ''}" style="left:calc(50% + ${dx * 100}vh);top:${y * 100}vh"><span class="fg-draft-tier">${
          c.tier ? TIER_LETTER[c.tier - 1] : '–'
        }</span><div class="fg-draft-text"><b>${esc(itemName(c.id))}${flag ? `<em class="rough">${flag}</em>` : ''}</b>${
          brief ? `<p>${esc(brief)}</p>` : ''
        }</div>${
          c.rank ? `<span class="fg-draft-rank">${c.rank}/${c.of}</span>` : ''
        }</div>`;
      })
      .join('')}</div>`;
  }
  function gameCompact(s) {
    const early = window.MatchPhase?.of(s.live?.seconds).laning,
      row = (name, value, cls = '') => `<div class="fg-row ${cls}"><b>${esc(name)}</b><span>${esc(value)}</span></div>`,
      camps =
        early && shown(s, 'camps')
          ? `<div class="fg-camps" data-pv="camps">${row(L('아군 소형 정글 캠프', 'Our small camps'), jungleSide(s, true)?.text || L('미확인', 'Unseen'), 'ally')}${row(L('적군 소형 정글 캠프', 'Enemy small camps'), jungleSide(s, false)?.text || L('미확인', 'Unseen'), 'enemy')}</div>`
          : '',
      lane = s.intel?.lane,
      souls = soulsMap(s),
      ids = [
        ...(Number.isInteger(lane?.partner) ? [[lane.partner, 'ally']] : []),
        ...(lane?.opponents || []).map(id => [id, 'enemy'])
      ],
      ultsOn = ultShown(
        'lane',
        [s.live?.local?.heroId, ...ids.map(([id]) => id)].filter(Number.isInteger),
        id => souls.get(id),
        s.live?.seconds
      ),
      // My partner and lane opponents, written like the label beside my own souls: until the ultimate,
      // souls (and troopers) to the next level and whether that level brings it; after it just
      // "궁 해금" (until every hero has it, ultShown), no level-up amount.
      // A duo splits each trooper's souls: my partner shares with me, the opponents with each other.
      sharing = side => (side === 'ally' ? 2 : Math.max(1, lane?.opponents?.length || 1)),
      ults =
        early && shown(s, 'ults')
          ? ids
              .map(([id, side]) => {
                const have = souls.get(id),
                  p = window.SoulLevels?.progress(have);
                if (!p) return '';
                if (p.ult.unlocked) return ultsOn ? row(heroName(id), L('궁 해금', 'Ult ready'), side) : '';
                const n = window.SoulLevels.next(have),
                  t = n && window.SoulLevels.troopers(have, s.live?.seconds, n.need, sharing(side));
                if (!n) return '';
                const text = L(
                  `레벨업까지 ${n.need.toLocaleString('en-US')}${t ? ` (${t}트루퍼)` : ''}`,
                  `${n.need.toLocaleString('en-US')} to level up${t ? ` (${I18N.count(t, '트루퍼', 'trooper')})` : ''}`
                );
                // The ultimate in small yellow type under the amount, on every row it applies to.
                return n.ult
                  ? `<div class="fg-row ${side} ult-next"><b>${esc(heroName(id))}</b><span>${esc(text)}<small>${L('다음 레벨업 궁극기', 'Ultimate next level')}</small></span></div>`
                  : row(heroName(id), text, side);
              })
              .join('')
          : '',
      farming = farmingBox(s),
      soulsTag = soulsBox(s),
      draft = shown(s, 'brawl') ? draftCards(s) : '',
      // The draft screen has its own title at the top left: the brawl panel steps aside meanwhile.
      brawl = shown(s, 'brawl') && !draft ? brawlBox(s) : '';
    return `<div class="figma-game ${early ? 'laning' : 'post'}"><aside class="fg-summary" data-figma="${early ? '42:159' : '64:172'}">${brawl}${camps}${ults ? `<div class="fg-ults" data-pv="ults">${ults}</div>` : ''}${shown(s, 'pregame') ? `<div class="fg-teams" data-pv="pregame">${compactTeams(s)}</div>` : ''}</aside><div class="fg-spawn-stack">${shown(s, 'spawns') ? `<section class="fg-spawn-panel" data-figma="41:4">${spawnBands(s)}</section>` : ''}${soulsTag ? `<section class="fg-souls-box">${soulsTag}</section>` : ''}</div>${farming}${draft}</div>`;
  }
  function brief(s) {
    const rows = [],
      part = key => (shown(s, key) ? key : null),
      row = (name, value, cls = '', pv = null) =>
        pv &&
        rows.push(`<div class="br-row ${cls}" data-pv="${pv}"><b>${esc(name)}</b><span>${esc(value)}</span></div>`);
    const alert = (s.coach || []).find(c => ['low', 'status'].includes(c.id));
    if (alert) row(alert.short || alert.title, '', 'alert', part('alerts'));
    const ult = laneUlt(s);
    if (ult && shown(s, 'alerts'))
      rows.push(
        `<div class="br-alert bad ult" data-pv="alerts"><small>${L('내 라인 · 적 궁극기', 'My lane · enemy ultimate')}</small><b>${L(
          `${esc(heroName(ult.id, '상대'))} 궁극기 해금`,
          `${esc(heroName(ult.id, 'Enemy'))} has the ultimate`
        )}</b><span>${L('궁극기를 쓰는 걸 보기 전엔 무리하게 들어가지 마세요', "Don't commit until you see it used")}</span></div>`
      );
    // Timed alerts (2:00 small camps and so on) have their own strip: alerts.cjs, hud-label.js.
    const secs = s.live?.seconds,
      tip = shown(s, 'tip')
        ? tipRow(
            tipFor(s.live?.local?.heroId, {
              phase: window.MatchPhase?.of(secs).key || 'unknown',
              max: 90
            }),
            'br-tip'
          ).replace('<p ', '<p data-pv="tip" ')
        : '';
    if (pregame(s)) {
      if (shown(s, 'pregame')) pregameRows(s, (name, value, cls) => row(name, value, cls, 'pregame'));
      return rows.join('') + tip;
    }
    // Until 10:00, first the camps: the small and medium ones by my lane once it is known, else our
    // half's and the enemy half's small ones.
    if (window.MatchPhase?.of(secs).laning && shown(s, 'camps')) {
      const near = laneCamps(s);
      if (near?.length)
        for (const n of near) {
          const st = campState(n.camp);
          row(
            `${SIDE_KO[n.side]} ${n.camp.kind === 'medium' ? L('중형', 'medium') : L('소형', 'small')}`,
            st.text,
            `big ${n.side} ${st.cls}`,
            'camps'
          );
        }
      else
        for (const [label, ours] of [
          [L('우리 소형', 'Our small'), true],
          [L('상대 소형', 'Their small'), false]
        ]) {
          const j = jungleSide(s, ours);
          if (j) row(label, j.text, `big ${ours ? 'ours' : 'theirs'} ${j.cls}`, 'camps');
        }
    }
    // My lane partner's ultimate and each lane opponent's (from the souls under the top-bar portraits),
    // until three minutes after the whole lane, me included, has one.
    {
      const lane = s.intel?.lane,
        all = soulsMap(s),
        mine = s.live?.local?.heroId,
        partner = Number.isInteger(lane?.partner) ? [lane.partner] : [],
        opp = lane?.opponents || [];
      if (opp.length && ultShown('lane', [mine, ...partner, ...opp].filter(Number.isInteger), id => all.get(id), secs))
        for (const [id, side] of [...partner.map(id => [id, 'ally']), ...opp.map(id => [id, 'enemy'])]) {
          const g = all.has(id) && growth(id, all.get(id));
          if (g) row(heroName(id), g.text, `ult ${side} ${g.cls}`, part('ults'));
        }
    }
    // While laning: what spawns next on the map.
    if (window.MatchPhase?.of(secs).laning && shown(s, 'spawns')) rows.push(spawnTable(secs));
    // Then the three objectives, always in the same order: mid-boss, rift, urn.
    const o = s.intel?.objectives,
      obj = part('objectives');
    if (o?.known) {
      row(L('보스', 'Boss'), o.midboss.state === 'respawn' ? clock(o.midboss.remaining) : L('생존', 'Alive'), '', obj);
      row(L('균열 생성', 'Rift spawn'), riftBand(o.rift), 'rift-band' + (o.rift.state === 'window' ? ' hot' : ''), obj);
      row(L('영혼 단지', 'Soul Urn'), urnText(o.urn), '', obj);
    } else
      for (const k of [L('보스', 'Boss'), L('균열', 'Rift'), L('영혼 단지', 'Soul Urn')]) row(k, '—', 'quiet', obj);
    const route = s.jungle?.route;
    if (route?.stops?.length && shown(s, 'route')) {
      const first = route.stops[0],
        camp = s.jungle.camps.find(c => c.id === first.id),
        kind = L(
          { weak: '소형', medium: '중형', strong: '대형', vault: '금고' },
          { weak: 'Small camp', medium: 'Medium camp', strong: 'Large camp', vault: "Sinner's Sacrifice" }
        )[first.kind];
      row(
        L('추천 캠프', 'Next camp'),
        L(
          `${camp?.nameKo || camp?.name || kind || ''} · ${first.walk}초 이동 추정`,
          `${camp?.name || kind || ''} · ~${first.walk}s walk`
        ),
        first.confirmed ? 'hot' : 'quiet',
        'route'
      );
      row(
        L('동선 근거', 'Route basis'),
        first.confirmed
          ? L('생존 확인 · 도착 시 재확인', 'Seen alive · recheck on arrival')
          : L('생존 미확인 · 도착 시 확인', 'Not seen · check on arrival'),
        'sub quiet',
        'route'
      );
    }
    return rows.join('') + tip;
  }
  // First spawns on the map (deadlock.wiki Denizens · Crate · Soul Urn, 2026-10). After its first
  // spawn each crate, camp and slot machine keeps its own timer, so only the buffs (기운의 파편, every
  // 5 min from 5:00 for the whole map) come back here. The urn and the rift have their own rows under it.
  const SPAWNS = tr(
    [
      [120, '소형 캠프'],
      [180, '상자'],
      [300, '중형 캠프 · 기운의 파편'],
      [480, '대형 캠프 · 영혼 슬롯머신'],
      [600, '기운의 파편']
    ],
    [
      [120, 'Small camps'],
      [180, 'Crates'],
      [300, 'Medium camps · Power-up'],
      [480, "Large camps · Sinner's Sacrifice"],
      [600, 'Power-up']
    ]
  );
  function spawnTable(secs) {
    const next = SPAWNS.filter(([t]) => t > secs).slice(0, 2);
    return `<div class="br-spawns" data-pv="spawns"><small>${L('다음 생성', 'Next spawns')}</small>${next
      .map(
        ([t, what], i) =>
          `<div class="${i === 0 ? 'next' : ''}"><time>${clock(t)}</time><b>${esc(what)}</b><span>${L(`${clock(t - Math.floor(secs))} 뒤`, `in ${clock(t - Math.floor(secs))}`)}</span></div>`
      )
      .join('')}</div>`;
  }
  // One side of the jungle (our half of the minimap is the bottom one, where our base is).
  // One side's small camps (our half of the minimap is the bottom one, where our base is): before
  // they spawn the first-spawn countdown; then one that just came back, else the next respawn; with
  // none down, that they are up (85 s respawn once taken).
  // One camp, the way the folded list says it: first spawn, just back, respawn, or (not seen cleared) up.
  function campState(c) {
    if (c.state === 'first')
      return { text: `${L('첫 생성', 'First spawn')} ${clock(c.remaining)}`, cls: c.remaining <= 15 ? 'hot' : '' };
    if (c.respawnedAgo !== null && c.respawnedAgo !== undefined && c.respawnedAgo <= 20)
      return { text: c.observation === 'present' ? L('생존', 'Alive') : L('생성 확인 필요', 'Check spawn'), cls: 'hot' };
    if (c.state === 'respawn' && c.remaining !== null)
      return { text: `${L('재생성', 'Respawn')} ${campClockText(c)}`, cls: c.remaining <= 15 ? 'hot' : '' };
    // Alive only while the minimap shows its icon: a clear the tracker missed must not read as 생존.
    // Before 5:00 the minimap shows no camps at all, so then it stays 미확인 (jungle.cjs MAP_ICONS_FROM).
    if (c.observation === 'absent')
      return { text: c.detection?.label || L('처치 미확정', 'Clear unconfirmed'), cls: 'quiet' };
    return c.observation === 'present'
      ? { text: L('생존', 'Alive'), cls: 'quiet' }
      : { text: c.detection?.label || L('미확인', 'Unseen'), cls: 'quiet' };
  }
  const SIDE_KO = tr(
    { ours: '우리 쪽', theirs: '상대 쪽', mid: '전선 옆' },
    { ours: 'Our side', theirs: 'Their side', mid: 'By lane' }
  );
  // The small camps within reach of where my lane's waves meet (lane-route.js: the same point and
  // reach as the route after the wave), and the nearest medium one by the lane itself; nearest first,
  // each on our side, theirs or by the lane.
  function laneCamps(s) {
    const j = s.jungle,
      lane = s.intel?.lane?.lane,
      P = window.MAP_POINTS,
      R = window.LaneRoute;
    if (!j?.camps?.length || !Number.isFinite(j.seconds) || !lane || !P?.guardians || !R) return null;
    const team = j.rotation === 180 ? 1 : 0,
      band = lane.band || R.COLOR_BAND[team]?.[lane.color];
    if (!band) return null;
    const id = R.LANES[team][band],
      [ox, oy] = P.guardians[team][id],
      [ex, ey] = P.guardians[1 - team][id],
      start = { x: ox + (ex - ox) * 0.55, y: oy + (ey - oy) * 0.55 },
      midY = (oy + ey) / 2;
    return (
      j.camps
        .filter(c => ['weak', 'medium'].includes(c.kind) && Number.isFinite(c.x) && Number.isFinite(c.y))
        .map(c => ({ camp: c, d: Math.hypot(c.x - start.x, c.y - start.y) }))
        .filter(x => x.d <= R.REACH)
        .sort((a, b) => a.d - b.d)
        .map(({ camp, d }) => {
          // Team 0's base is at the bottom of the map data (larger y), team 1's at the top.
          const off = (camp.y - midY) * (team === 0 ? 1 : -1);
          return { camp, side: off >= 0.015 ? 'ours' : off <= -0.015 ? 'theirs' : 'mid' };
        })
        // Every small camp in reach; of the medium ones only the nearest by the lane itself.
        .filter(
          (x, i, all) =>
            x.camp.kind === 'weak' ||
            (x.side === 'mid' && all.findIndex(y => y.camp.kind === 'medium' && y.side === 'mid') === i)
        )
    );
  }
  // Team against team: what each composition is (comp.js) and how our heroes have done against theirs
  // in public matches (hero-counters.js, last 30 days): the mean, over every pair, of our hero's win
  // rate against theirs less our hero's own win rate.
  function teamMatch(ours, theirs) {
    if (ours.length < 2 || theirs.length < 2 || !window.Comp) return null;
    const a = window.Comp.analyze(ours, theirs, window.HERO_GUIDE || [], window.HERO_TYPES || []),
      C = window.HERO_COUNTERS;
    let sum = 0,
      n = 0;
    for (const h of ours)
      for (const e of theirs) {
        const v = C?.vs?.[h]?.[e];
        if (v && v[1] >= 1000 && Number.isFinite(C.overall[h])) {
          sum += v[0] - C.overall[h];
          n++;
        }
      }
    return { us: a.us.style, them: a.them.style, edge: n ? sum / n : null, pairs: n, tips: a.strategy.slice(0, 2) };
  }
  function jungleSide(s, ours) {
    const j = s.jungle;
    if (!j?.camps?.length || !Number.isFinite(j.seconds)) return null;
    const t = j.mapTransform,
      yOf = c => (t ? t.ty + t.scale * (t.rotation ? 1 - c.y : c.y) : j.rotation === 180 ? 1 - c.y : c.y),
      mid = t ? t.ty + t.scale * 0.5 : 0.5,
      side = j.camps.filter(c => c.kind === 'weak' && yOf(c) > mid === ours);
    if (!side.length) return null;
    const first = side.find(c => c.state === 'first');
    if (first)
      return { text: `${L('첫 생성', 'First spawn')} ${clock(first.remaining)}`, cls: first.remaining <= 15 ? 'hot' : '' };
    const back = side.filter(c => c.respawnedAgo !== null && c.respawnedAgo !== undefined && c.respawnedAgo <= 20);
    if (back.length)
      return {
        text: L(
          `생성 확인 필요${back.length > 1 ? ` ${back.length}곳` : ''}`,
          `Check spawn${back.length > 1 ? ` (${back.length})` : ''}`
        ),
        cls: 'hot'
      };
    const due = side
      .filter(c => c.state === 'respawn' && c.remaining !== null)
      .sort((a, b) => a.remaining - b.remaining);
    if (due.length)
      return {
        text: L(
          `재생성 ${campClockText(due[0])}${due.length > 1 ? ` 외 ${due.length - 1}` : ''}`,
          `Respawn ${campClockText(due[0])}${due.length > 1 ? ` +${due.length - 1}` : ''}`
        ),
        cls: due[0].remaining <= 15 ? 'hot' : ''
      };
    const gone = side.filter(c => c.observation === 'absent');
    if (gone.length)
      return {
        text: L(`처치됨${gone.length > 1 ? ` ${gone.length}곳` : ''}`, `Cleared${gone.length > 1 ? ` (${gone.length})` : ''}`),
        cls: ''
      };
    return side.every(c => c.observation === 'present')
      ? { text: L('생존', 'Alive'), cls: 'quiet' }
      : { text: L('미확인', 'Unseen'), cls: 'quiet' };
  }
  // Shared clicks for the views above. `view` holds per-page focus/skill selection.
  function handle(b, s, view, rerender) {
    const info = s?.intel?.lane || {};
    if (b.dataset.laneOpp) {
      const id = +b.dataset.laneOpp,
        opp = info.manual?.opponents?.length ? info.manual.opponents : info.opponents || [];
      window.lane.command('lane-set', {
        opponents: opp.includes(id) ? opp.filter(x => x !== id) : [...opp, id].slice(-2)
      });
      return true;
    }
    if (b.dataset.lanePartner) {
      const id = +b.dataset.lanePartner;
      window.lane.command('lane-set', { partner: info.partner === id ? null : id });
      return true;
    }
    if (b.dataset.laneFocus !== undefined) {
      view.focus = +b.dataset.laneFocus;
      view.skill = 1;
      rerender();
      return true;
    }
    if (b.dataset.skill !== undefined) {
      view.skill = +b.dataset.skill;
      rerender();
      return true;
    }
    if (b.dataset.objective) {
      window.lane.command('objective-record', b.dataset.objective);
      return true;
    }
    if (b.dataset.objectiveUndo) {
      window.lane.command('objective-undo', b.dataset.objectiveUndo);
      return true;
    }
    return false;
  }
  window.IntelUI = {
    tipFor,
    esc,
    guide,
    clock,
    heroType,
    typeChips,
    heroPicker,
    buildBlock,
    enemyBuilds,
    heroCard,
    skills,
    lane,
    mia,
    timers,
    now,
    urgent,
    pregame,
    teams,
    teamPrep,
    prepLayout,
    hoverCard,
    selectBadges,
    board,
    keyItems,
    shopList,
    brief,
    gameCompact,
    spawnBands,
    shown,
    handle
  };
})();

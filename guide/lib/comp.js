// Team composition analysis from the hero guide: traits per hero, team strengths and gaps,
// matchup strategy and pick suggestions. Heuristic and editorial, not a win-rate model.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.Comp = api;
})(globalThis, () => {
  'use strict';
  // Display language: ui/i18n.js (the global I18N in a window, required in node). Without it, Korean.
  const I18N = (typeof module === 'object' && module.exports ? require('./i18n.js') : globalThis.I18N) || null;
  const L = (ko, en) => (I18N ? I18N.L(ko, en) : ko);
  // The regexes read the Korean hero guide text, so they stay Korean in both languages.
  const TRAITS = {
    frontline: { ko: '전면·탱킹', en: 'Frontline', re: /탱커|탱킹|근접|버티|전면|앞에서|체력이 높/ },
    burst: { ko: '순간 폭딜', en: 'Burst', re: /암살|폭딜|순간|마무리|처형|기습|한 방/ },
    range: { ko: '원거리 견제', en: 'Ranged poke', re: /원거리|저격|견제|사격|장거리|포킹/ },
    control: { ko: '군중 제어', en: 'Crowd control', re: /기절|속박|이동 불가|군중|제어|끌어|침묵|수면|묶|넉백|밀어/ },
    sustain: { ko: '회복·생존', en: 'Sustain', re: /회복|흡혈|치유|재생|부활|보호막|방벽/ },
    mobility: { ko: '기동성', en: 'Mobility', re: /기동|대시|돌진|순간이동|비행|빠르게|도약|이동 속도/ },
    aoe: { ko: '광역 피해', en: 'Area damage', re: /광역|범위|여러 적|주변 적|구역/ }
  };
  // TRAITS[k].ko reads in the display language (en holds the English).
  for (const t of Object.values(TRAITS)) {
    const ko = t.ko;
    Object.defineProperty(t, 'ko', { enumerable: true, get: () => L(ko, t.en) });
  }
  const ROLE_TRAIT = { brawler: 'frontline', assassin: 'burst', marksman: 'range', mystic: 'aoe' };
  const STRENGTH = { strong: 2, even: 1, weak: 0 };

  function traitsOf(g) {
    if (!g) return {};
    const text = [g.style, ...(g.tags || []), ...(g.strengths || [])].join(' ');
    const t = {};
    for (const [k, v] of Object.entries(TRAITS)) if (v.re.test(text)) t[k] = 1;
    if (ROLE_TRAIT[g.role]) t[ROLE_TRAIT[g.role]] = 1;
    return t;
  }
  function team(ids, guides, types = []) {
    const heroes = ids.map(id => guides.find(g => g.id === id)).filter(Boolean);
    const counts = Object.fromEntries(Object.keys(TRAITS).map(k => [k, 0]));
    for (const h of heroes) for (const k of Object.keys(traitsOf(h))) counts[k]++;
    const early = heroes.length
      ? heroes.reduce((n, h) => n + (STRENGTH[h.laneStrength] ?? 1), 0) / heroes.length
      : null;
    const roles = {};
    for (const h of heroes) roles[h.role] = (roles[h.role] || 0) + 1;
    const n = heroes.length;
    const strengths = [],
      weaknesses = [];
    if (counts.frontline >= 2) strengths.push(L('앞에서 버티고 진입할 영웅이 충분합니다.', 'Enough heroes to hold the front and engage.'));
    if (counts.control >= 3) strengths.push(L('제어기가 많아 한 명을 묶고 잡기 좋습니다.', 'Lots of CC to lock down and kill one target.'));
    if (counts.burst >= 2) strengths.push(L('순간 폭딜로 끊어 먹기(픽)에 강합니다.', 'Strong burst for picking off enemies.'));
    if (counts.range >= 3) strengths.push(L('원거리 견제로 교전 전에 체력을 깎을 수 있습니다.', 'Ranged poke can chip health before fights.'));
    if (counts.sustain >= 2) strengths.push(L('회복·보호가 있어 긴 교전에 버팁니다.', 'Healing and shields hold up in long fights.'));
    if (counts.mobility >= 3) strengths.push(L('기동성이 좋아 전선 이동과 합류가 빠릅니다.', 'Good mobility for fast rotations between lanes.'));
    if (counts.aoe >= 3) strengths.push(L('광역 피해가 많아 좁은 길목 한타에 강합니다.', 'Lots of area damage, strong in chokepoint team fights.'));
    if (n >= 4) {
      if (counts.frontline === 0) weaknesses.push(L('진입·탱킹을 맡을 영웅이 없습니다.', 'No hero to engage or tank.'));
      if (counts.control <= 1) weaknesses.push(L('제어기가 부족해 도망가는 적을 잡기 어렵습니다.', 'Little CC, so fleeing enemies get away.'));
      if (counts.range === 0) weaknesses.push(L('원거리 딜이 없어 견제 싸움에 밀립니다.', 'No ranged damage, so it loses poke fights.'));
      if (counts.sustain === 0) weaknesses.push(L('회복 수단이 없어 연속 교전이 어렵습니다.', 'No healing, so back-to-back fights are hard.'));
      if (counts.mobility <= 1) weaknesses.push(L('기동성이 낮아 합류가 늦고 기습에 약합니다.', 'Low mobility: slow to rotate and weak to ganks.'));
    }
    const style =
      counts.frontline >= 2 && counts.aoe + counts.control >= 4
        ? L('한타형', 'Team fight')
        : counts.burst >= 2 && counts.mobility >= 2
          ? L('기습·픽형', 'Pick-off')
          : counts.range >= 3
            ? L('견제·포킹형', 'Poke')
            : counts.mobility >= 3
              ? L('운영·스플릿형', 'Split push')
              : L('균형형', 'Balanced');
    // Power curve from public win rates by game length (hero-types).
    const curve = { early: 0, late: 0 };
    for (const h of heroes) {
      const c = types.find(t => t.id === h.id)?.curve;
      if (c === 'early' || c === 'late') curve[c]++;
    }
    if (curve.late >= 3) strengths.push(L(`후반형 영웅이 ${curve.late}명이라 시간이 갈수록 강해집니다.`, `${curve.late} late-game heroes, stronger as the game goes on.`));
    if (curve.early >= 3) strengths.push(L(`스노우볼형 영웅이 ${curve.early}명이라 초반 주도권이 좋습니다.`, `${curve.early} snowball heroes, strong early pressure.`));
    return { ids: heroes.map(h => h.id), counts, early, roles, strengths, weaknesses, style, curve };
  }
  function strategy(us, them) {
    const tips = [];
    if (!us.ids.length || !them.ids.length) return tips;
    const e = them.counts,
      o = us.counts;
    // One game plan from two measures: who is stronger early (lane strength, and snowball heroes by
    // win rate over game length) and who scales better late (late heroes by the same win rates). They
    // can point opposite ways (a lane-strong team of late heroes), so the plan is picked from both
    // and never says rush and hold out at once. Early measures that disagree say nothing.
    const side = (a, b, gap) => (a - b >= gap ? 'us' : b - a >= gap ? 'them' : null);
    const lane = us.early !== null && them.early !== null ? side(us.early, them.early, 0.35) : null,
      snow = us.curve && them.curve ? side(us.curve.early, them.curve.early, 2) : null,
      early = lane && snow && lane !== snow ? null : lane || snow,
      late = us.curve && them.curve ? side(us.curve.late, them.curve.late, 2) : null;
    if (late === 'them' && early === 'them')
      tips.push(L('상대가 초반에 세고 후반형도 더 많습니다. 라인전은 죽지 않고 버티다가, 첫 균열(11~13분)과 중앙 보스에 다 같이 모여 차이를 벌리세요.', 'They are stronger early and have more late heroes. Survive the laning phase, then group up for the first rift (11-13 min) and the Mid-Boss to get ahead.'));
    else if (late === 'them')
      tips.push(L('상대에 후반형이 더 많습니다. 균열과 중앙 보스로 앞서 나가서 25분 안에 끝내세요.', 'They scale better late. Get ahead with rifts and the Mid-Boss and end it within 25 min.'));
    else if (late === 'us' && early === 'us')
      tips.push(L('우리가 초반에 세고 후반형도 더 많습니다. 전선을 밀어 첫 균열(11~13분)과 중앙 보스를 먼저 챙기고, 무리하지 말고 차이를 굳히세요.', 'We are stronger early and have more late heroes. Push lanes, take the first rift (11-13 min) and the Mid-Boss first, and grow the lead without risky fights.'));
    else if (late === 'us')
      tips.push(L('우리가 후반형입니다. 초반 싸움은 피하고 파밍하다가 30분 넘어서 한타로 이기세요.', 'We scale better late. Avoid early fights, farm, and win team fights after 30 min.'));
    else if (early === 'us')
      tips.push(L('우리가 초반에 셉니다. 전선을 밀고 첫 균열(11~13분)과 중앙 보스를 먼저 챙기세요.', 'We are stronger early. Push lanes and take the first rift (11-13 min) and the Mid-Boss first.'));
    else if (early === 'them')
      tips.push(L('초반은 상대가 셉니다. 가디언 근처에서 파밍하며 아이템이 나올 때까지 버티세요.', 'They are stronger early. Farm near your Guardian and hold out until your items are in.'));
    if (e.sustain >= 2) tips.push(L('상대 회복이 많습니다. 한두 명은 치유 억제를 사세요.', 'They have lots of healing. One or two of you should buy Healbane.'));
    if (e.control >= 3) tips.push(L('상대 제어기가 많습니다. 뭉쳐 서지 말고, 약화 감소도 생각해 두세요.', "They have lots of CC. Don't bunch up, and consider Debuff Reducer."));
    if (e.burst >= 2) tips.push(L('상대에 암살형이 많습니다. 뒤에서 딜하는 아군은 혼자 다니지 마세요.', 'They have several assassins. Backline damage dealers should not walk alone.'));
    if (e.range >= 3) tips.push(L('상대 견제가 셉니다. 엄폐물을 타고 붙어서 짧게 싸우세요.', 'Their poke is strong. Close in behind cover and keep fights short.'));
    if (e.frontline >= 2 && o.range >= 2)
      tips.push(L('상대 탱커가 많습니다. 앞을 두드리기보다 뒤쪽 딜러를 노리세요.', 'They have several tanks. Go for their backline instead of hitting the front.'));
    if (o.frontline >= 2 && o.control >= 2) tips.push(L('우리 진입과 제어가 좋습니다. 좁은 길목으로 끌어들여 한타하세요.', 'Our engage and CC are good. Pull them into chokepoints and team fight there.'));
    if (o.burst >= 2) tips.push(L('우리 폭딜이 좋습니다. 혼자 다니는 적을 끊어서 머릿수를 앞서세요.', 'Our burst is strong. Pick off lone enemies to get a numbers lead.'));
    if (o.mobility >= 3 && them.counts.mobility <= 1)
      tips.push(L('우리 기동성이 앞섭니다. 옆 전선을 밀다가 빠르게 합류하세요.', 'Our mobility is better. Push a side lane, then join fights fast.'));
    if (o.aoe >= 3) tips.push(L('우리 광역 피해가 많습니다. 균열 점령 구역처럼 적이 모이는 곳에서 싸우세요.', 'Our area damage is high. Fight where enemies group up, like rift capture zones.'));
    if (!tips.length) tips.push(L('뚜렷한 상성은 없습니다. 오브젝트 시간에 먼저 자리 잡는 쪽이 이깁니다.', 'No clear matchup edge. The team that sets up first at objective timings wins.'));
    return tips;
  }
  // Heroes that fill our gaps and answer the enemy's strengths.
  function suggest(ourIds, theirIds, guides, limit = 5) {
    const us = team(ourIds, guides),
      them = team(theirIds, guides),
      taken = new Set([...ourIds, ...theirIds]);
    const want = {
      frontline: us.counts.frontline === 0 ? 3 : us.counts.frontline === 1 ? 1 : 0,
      control: us.counts.control <= 1 ? 2 : 0.5,
      range: us.counts.range === 0 ? 2.5 : us.counts.range === 1 ? 1.5 : us.counts.range >= 3 ? -1 : 0.3,
      sustain: us.counts.sustain === 0 ? 1.5 : 0,
      mobility: us.counts.mobility <= 1 ? 1 : 0,
      burst: them.counts.range + them.counts.aoe >= 4 ? 1.5 : 0.5,
      aoe: them.counts.frontline >= 2 ? 1 : 0.5
    };
    return guides
      .filter(g => !taken.has(g.id) && g.style)
      .map(g => {
        const t = traitsOf(g);
        let score = 0;
        const why = [];
        for (const [k, w] of Object.entries(want))
          if (t[k] && w > 0) {
            score += w;
            if (w >= 1.5) why.push(L(TRAITS[k].ko + ' 보강', 'Adds ' + TRAITS[k].en.toLowerCase()));
          } else if (t[k]) score += w;
        if (us.early !== null && them.early !== null && them.early > us.early + 0.3 && g.laneStrength === 'strong') {
          score += 0.8;
          why.push(L('초반 전선 보강', 'Stronger early lane'));
        }
        if (g.confidence === 'low') score -= 0.3;
        return { id: g.id, ko: L(g.ko, g.en || g.ko), role: g.role, score: Math.round(score * 10) / 10, why };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  function analyze(ourIds, theirIds, guides, types = []) {
    const us = team(ourIds, guides, types),
      them = team(theirIds, guides, types);
    return {
      us,
      them,
      strategy: strategy(us, them),
      suggestions: ourIds.length < 6 ? suggest(ourIds, theirIds, guides) : []
    };
  }
  return { TRAITS, traitsOf, team, strategy, suggest, analyze };
});

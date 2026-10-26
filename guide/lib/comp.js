// Team composition analysis from the hero guide: traits per hero, team strengths and gaps,
// matchup strategy and pick suggestions. Heuristic and editorial, not a win-rate model.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.Comp = api;
})(globalThis, () => {
  'use strict';
  const TRAITS = {
    frontline: { ko: '전면·탱킹', re: /탱커|탱킹|근접|버티|전면|앞에서|체력이 높/ },
    burst: { ko: '순간 폭딜', re: /암살|폭딜|순간|마무리|처형|기습|한 방/ },
    range: { ko: '원거리 견제', re: /원거리|저격|견제|사격|장거리|포킹/ },
    control: { ko: '군중 제어', re: /기절|속박|이동 불가|군중|제어|끌어|침묵|수면|묶|넉백|밀어/ },
    sustain: { ko: '회복·생존', re: /회복|흡혈|치유|재생|부활|보호막|방벽/ },
    mobility: { ko: '기동성', re: /기동|대시|돌진|순간이동|비행|빠르게|도약|이동 속도/ },
    aoe: { ko: '광역 피해', re: /광역|범위|여러 적|주변 적|구역/ }
  };
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
    if (counts.frontline >= 2) strengths.push('앞에서 버티고 진입할 영웅이 충분합니다.');
    if (counts.control >= 3) strengths.push('제어기가 많아 한 명을 묶고 잡기 좋습니다.');
    if (counts.burst >= 2) strengths.push('순간 폭딜로 끊어 먹기(픽)에 강합니다.');
    if (counts.range >= 3) strengths.push('원거리 견제로 교전 전에 체력을 깎을 수 있습니다.');
    if (counts.sustain >= 2) strengths.push('회복·보호가 있어 긴 교전에 버팁니다.');
    if (counts.mobility >= 3) strengths.push('기동성이 좋아 전선 이동과 합류가 빠릅니다.');
    if (counts.aoe >= 3) strengths.push('광역 피해가 많아 좁은 길목 한타에 강합니다.');
    if (n >= 4) {
      if (counts.frontline === 0) weaknesses.push('진입·탱킹을 맡을 영웅이 없습니다.');
      if (counts.control <= 1) weaknesses.push('제어기가 부족해 도망가는 적을 잡기 어렵습니다.');
      if (counts.range === 0) weaknesses.push('원거리 딜이 없어 견제 싸움에 밀립니다.');
      if (counts.sustain === 0) weaknesses.push('회복 수단이 없어 연속 교전이 어렵습니다.');
      if (counts.mobility <= 1) weaknesses.push('기동성이 낮아 합류가 늦고 기습에 약합니다.');
    }
    const style =
      counts.frontline >= 2 && counts.aoe + counts.control >= 4
        ? '한타형'
        : counts.burst >= 2 && counts.mobility >= 2
          ? '기습·픽형'
          : counts.range >= 3
            ? '견제·포킹형'
            : counts.mobility >= 3
              ? '운영·스플릿형'
              : '균형형';
    // Power curve from public win rates by game length (hero-types).
    const curve = { early: 0, late: 0 };
    for (const h of heroes) {
      const c = types.find(t => t.id === h.id)?.curve;
      if (c === 'early' || c === 'late') curve[c]++;
    }
    if (curve.late >= 3) strengths.push(`후반형 영웅이 ${curve.late}명이라 시간이 갈수록 강해집니다.`);
    if (curve.early >= 3) strengths.push(`스노우볼형 영웅이 ${curve.early}명이라 초반 주도권이 좋습니다.`);
    return { ids: heroes.map(h => h.id), counts, early, roles, strengths, weaknesses, style, curve };
  }
  function strategy(us, them) {
    const tips = [];
    if (!us.ids.length || !them.ids.length) return tips;
    const e = them.counts,
      o = us.counts;
    if (us.curve && them.curve) {
      if (them.curve.late - us.curve.late >= 2)
        tips.push('상대에 후반형이 더 많습니다. 균열과 중앙 보스로 앞서 나가서 25분 안에 끝내세요.');
      else if (us.curve.late - them.curve.late >= 2)
        tips.push('우리가 후반형입니다. 초반 싸움은 피하고 파밍하다가 30분 넘어서 한타로 이기세요.');
      if (them.curve.early - us.curve.early >= 2)
        tips.push('상대가 초반에 강합니다. 라인전에서는 죽지 않는 게 먼저입니다.');
    }
    if (us.early !== null && them.early !== null) {
      if (us.early - them.early >= 0.35)
        tips.push('우리가 초반에 셉니다. 전선을 밀고 첫 균열(11~13분)과 중앙 보스를 먼저 챙기세요.');
      else if (them.early - us.early >= 0.35)
        tips.push('초반은 상대가 셉니다. 가디언 근처에서 파밍하며 아이템이 나올 때까지 버티세요.');
    }
    if (e.sustain >= 2) tips.push('상대 회복이 많습니다. 한두 명은 치유 억제를 사세요.');
    if (e.control >= 3) tips.push('상대 제어기가 많습니다. 뭉쳐 서지 말고, 약화 감소도 생각해 두세요.');
    if (e.burst >= 2) tips.push('상대에 암살형이 많습니다. 뒤에서 딜하는 아군은 혼자 다니지 마세요.');
    if (e.range >= 3) tips.push('상대 견제가 셉니다. 엄폐물을 타고 붙어서 짧게 싸우세요.');
    if (e.frontline >= 2 && o.range >= 2)
      tips.push('상대 탱커가 많습니다. 앞을 두드리기보다 뒤쪽 딜러를 노리세요.');
    if (o.frontline >= 2 && o.control >= 2) tips.push('우리 진입과 제어가 좋습니다. 좁은 길목으로 끌어들여 한타하세요.');
    if (o.burst >= 2) tips.push('우리 폭딜이 좋습니다. 혼자 다니는 적을 끊어서 머릿수를 앞서세요.');
    if (o.mobility >= 3 && them.counts.mobility <= 1)
      tips.push('우리 기동성이 앞섭니다. 옆 전선을 밀다가 빠르게 합류하세요.');
    if (o.aoe >= 3) tips.push('우리 광역 피해가 많습니다. 균열 점령 구역처럼 적이 모이는 곳에서 싸우세요.');
    if (!tips.length) tips.push('뚜렷한 상성은 없습니다. 오브젝트 시간에 먼저 자리 잡는 쪽이 이깁니다.');
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
            if (w >= 1.5) why.push(TRAITS[k].ko + ' 보강');
          } else if (t[k]) score += w;
        if (us.early !== null && them.early !== null && them.early > us.early + 0.3 && g.laneStrength === 'strong') {
          score += 0.8;
          why.push('초반 전선 보강');
        }
        if (g.confidence === 'low') score -= 0.3;
        return { id: g.id, ko: g.ko, role: g.role, score: Math.round(score * 10) / 10, why };
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

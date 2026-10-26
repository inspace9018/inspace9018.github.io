// Enemy item knowledge: which items matter, what build they point to, and how to answer them.
// Item names are the current shop names (deadlock-api 2026-10-23); Korean names come from ITEM_KO.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.ItemIntel = api;
})(globalThis, () => {
  'use strict';
  // Threat groups: what the item does to you, and the answer (counter items by English shop name).
  const THREATS = {
    heal: {
      ko: '회복',
      tip: '긴 교전에서 계속 회복합니다. 치유 억제를 맞히고 짧게 몰아쳐 끝내세요.',
      counters: ['Healbane', 'Toxic Bullets', 'Decay'],
      items: [
        'Healing Tempo',
        'Healing Nova',
        'Rescue Beam',
        'Leech',
        'Siphon Bullets',
        'Vampiric Burst',
        'Bullet Lifesteal',
        'Spirit Lifesteal',
        'Restorative Locket',
        'Celestial Blessing',
        'Radiant Regeneration',
        'Infuser',
        'Lifestrike'
      ]
    },
    gunBurst: {
      ko: '무기 폭딜',
      tip: '사격 피해가 매우 큽니다. 긴 사선을 피하고 총탄 방어를 올리세요.',
      counters: ['Metal Skin', 'Bullet Resilience', 'Return Fire', 'Plated Armor'],
      items: [
        'Glass Cannon',
        'Crippling Headshot',
        'Lucky Shot',
        'Frenzy',
        'Ricochet',
        'Silencer',
        'Infinite Rounds',
        'Haunting Shot',
        'Armor Piercer',
        'Spiritual Overflow',
        'Headhunter',
        'Sharpshooter',
        'Mercurial Magnum'
      ]
    },
    spiritBurst: {
      ko: '마법 폭딜',
      tip: '능력 한 번에 큰 피해가 들어옵니다. 마법 저항을 올리고 주요 능력이 빠진 뒤 싸우세요.',
      counters: ['Spirit Resilience', 'Spirit Shielding', 'Witchmail', 'Counterspell'],
      items: [
        'Echo Shard',
        'Refresher',
        'Boundless Spirit',
        'Spirit Burn',
        'Mystic Reverb',
        'Escalating Exposure',
        'Scourge',
        'Lightning Scroll',
        'Focus Lens',
        'Mystic Conduit',
        'Prism Blast',
        'Mystical Piano',
        'Transcendent Cooldown'
      ]
    },
    control: {
      ko: '제어·침묵',
      tip: '묶이거나 능력이 막힙니다. 약화 감소·마법 해제로 풀고, 뭉쳐 서지 마세요.',
      counters: ['Debuff Reducer', 'Dispel Magic', 'Unstoppable'],
      items: [
        'Silence Wave',
        'Knockdown',
        'Vortex Web',
        'Disarming Hex',
        'Slowing Hex',
        'Cursed Relic',
        'Arctic Blast',
        'Inhibitor',
        'Capacitor',
        'Shrink Ray',
        'Frostbite Charm'
      ]
    },
    dive: {
      ko: '진입·기습',
      tip: '갑자기 붙어 옵니다. 혼자 다니지 말고, 진입기에 맞춰 제어기를 아껴 두세요.',
      counters: ['Knockdown', 'Slowing Hex', 'Silence Wave'],
      items: [
        'Phantom Strike',
        'Majestic Leap',
        'Warp Stone',
        'Magic Carpet',
        'Shadow Weave',
        'Veil Walker',
        'Shadow Strike',
        'Kinetic Dash'
      ]
    },
    gunDefense: {
      ko: '총탄 방어',
      tip: '총으로는 잘 안 죽습니다. 마법 피해로 공격하거나 방어 관통을 고려하세요.',
      counters: ['Armor Piercer', 'Spirit Burn', 'Escalating Exposure'],
      items: ['Metal Skin', 'Plated Armor', 'Bullet Resilience', 'Juggernaut', 'Return Fire']
    },
    spiritDefense: {
      ko: '능력 방어',
      tip: '마법 피해가 덜 들어갑니다. 무기 피해로 마무리하세요.',
      counters: ['Spirit Shredder', 'Toxic Bullets', 'Crippling Headshot'],
      items: [
        'Spirit Resilience',
        'Witchmail',
        'Spellbreaker',
        'Counterspell',
        "Diviner's Kevlar",
        'Divine Barrier',
        'Spirit Shielding'
      ]
    },
    immune: {
      ko: '면역·무적',
      tip: '제어 면역이나 잠깐의 무적이 있습니다. 효과가 끝난 뒤 제어기와 궁극기를 쓰세요.',
      counters: ['Silence Wave', 'Knockdown'],
      items: ['Unstoppable', 'Ethereal Shift', 'Cheat Death', 'Colossus', 'Indomitable', 'Nullification Burst']
    }
  };
  const SLOT_KO = { weapon: '무기', spirit: '마법', vitality: '생명' };
  // How each answer item works against the enemy, for the shop strip. HOW_VS overrides it where the
  // same item answers a threat in a different way.
  const HOW = {
    Healbane: '내 마법 피해를 맞은 적은 회복을 덜 받아 버티지 못합니다.',
    'Toxic Bullets': '총으로 계속 맞히면 출혈과 치유 감소가 걸립니다.',
    Decay: '체력이 많을수록 크게 깎여 회복으로 버티는 적을 갉아먹습니다.',
    'Metal Skin': '적이 총을 몰아쏠 때 켜면 그동안 총탄을 받지 않습니다.',
    'Bullet Resilience': '총탄 피해를 덜 받고, 체력이 반 아래면 더 단단해집니다.',
    'Return Fire': '맞을 때마다 쏜 적에게 총탄을 자동으로 돌려줍니다.',
    'Plated Armor': '날아오는 총탄 일부를 튕겨 내 적중 효과까지 막습니다.',
    'Spirit Resilience': '능력 피해를 덜 받아 연계 한 번에 쓰러지지 않습니다.',
    'Spirit Shielding': '능력을 몰아 맞으면 방벽이 생겨 폭딜을 한 번 받아 냅니다.',
    Witchmail: '능력에 크게 맞을수록 내 능력이 빨리 돌아와 바로 받아칩니다.',
    Counterspell: '적 능력 하나를 막습니다. 궁극기나 제어기에 맞춰 켜세요.',
    'Debuff Reducer': '기절·침묵·둔화가 짧게 끝나 묶인 채 죽는 일이 줄어듭니다.',
    'Dispel Magic': '걸린 약화를 풀고 회복해 제어에서 빠져나옵니다.',
    Unstoppable: '켜 두는 동안 기절·침묵·이동 불가에 걸리지 않습니다. 맞기 전에 켜세요.',
    Knockdown: '잠시 뒤 기절이 걸려 파고든 적을 그 자리에 세웁니다.',
    'Slowing Hex': '느려지고 이동기가 막혀 붙거나 도망가는 적을 놓치지 않습니다.',
    'Silence Wave': '맞은 적이 잠시 능력을 못 써 진입기와 궁극기가 끊깁니다.',
    'Armor Piercer': '일부 총탄이 총탄 저항을 무시해 방어를 산 적도 뚫습니다.',
    'Spirit Burn': '능력을 몰아 넣으면 폭발과 화상이 붙어 총에 강한 적을 녹입니다.',
    'Escalating Exposure': '능력을 맞힐수록 그 적이 받는 마법 피해가 커집니다.',
    'Spirit Shredder': '총으로 맞힌 적의 마법 저항을 깎아 능력 피해가 들어갑니다.',
    'Crippling Headshot': '헤드샷을 맞히면 적의 저항과 회복이 함께 줄어듭니다.'
  };
  const HOW_VS = {
    immune: {
      'Silence Wave': '면역이 끝난 직후 맞혀 다시 버티기 전에 능력을 막으세요.',
      Knockdown: '면역이 끝난 걸 보고 걸어야 기절이 들어갑니다.'
    },
    spiritDefense: { 'Toxic Bullets': '총탄 출혈이라 마법 저항과 상관없이 체력을 깎습니다.' }
  };

  function lookup(catalog, ko) {
    const byId = new Map(catalog.map(i => [i.id, i])),
      byName = new Map(catalog.map(i => [i.name, i])),
      koById = new Map((ko || []).map(i => [i.id, i]));
    const koName = item => koById.get(item?.id)?.ko || item?.name || '';
    return { byId, byName, koById, koName };
  }
  // Classify a set of items: build direction by cost share per slot, plus threat groups.
  function inferBuild(itemIds, catalog, ko) {
    const { byId, byName, koById, koName } = lookup(catalog, ko);
    const owned = itemIds.map(id => byId.get(id)).filter(Boolean);
    if (!owned.length) return null;
    const cost = { weapon: 0, spirit: 0, vitality: 0 };
    for (const i of owned) cost[i.slot] = (cost[i.slot] || 0) + (i.cost || 500);
    const total = cost.weapon + cost.spirit + cost.vitality || 1;
    const share = Object.fromEntries(Object.entries(cost).map(([k, v]) => [k, Math.round((v / total) * 100)]));
    const top = Object.entries(share).sort((a, b) => b[1] - a[1]);
    const build =
      top[0][1] >= 55
        ? top[0][0]
        : top[0][0] === 'vitality' || top[1][0] === 'vitality'
          ? `${top[0][0]}+vitality`
          : 'hybrid';
    const label =
      build === 'hybrid'
        ? '무기·마법 혼합'
        : build.includes('+')
          ? `${SLOT_KO[top[0][0]]} + 생명`
          : `${SLOT_KO[build]} 빌드`;
    const threats = [];
    for (const [key, t] of Object.entries(THREATS)) {
      const hits = owned.filter(i => t.items.includes(i.name));
      if (hits.length)
        threats.push({ key, ko: t.ko, tip: t.tip, items: hits.map(i => koName(i)), counters: t.counters });
    }
    // Answers, most-cited first; only items that exist in the shop.
    const votes = new Map();
    for (const t of threats) for (const c of t.counters) votes.set(c, (votes.get(c) || 0) + t.items.length);
    if (share.weapon >= 55) for (const c of THREATS.gunBurst.counters) votes.set(c, (votes.get(c) || 0) + 1);
    if (share.spirit >= 55) for (const c of THREATS.spiritBurst.counters) votes.set(c, (votes.get(c) || 0) + 1);
    const counters = [...votes]
      .filter(([name]) => byName.has(name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => ({ name, ko: koName(byName.get(name)), desc: koById.get(byName.get(name).id)?.desc || '' }));
    const key = owned
      .filter(i => i.tier >= 3)
      .sort((a, b) => b.tier - a.tier || (b.cost || 0) - (a.cost || 0))
      .slice(0, 4)
      .map(i => ({ id: i.id, name: i.name, ko: koName(i), desc: koById.get(i.id)?.desc || '', tier: i.tier }));
    return { share, build, label, threats, counters, key };
  }
  // Without seen items: the hero's usual core items from public stats, read the same way.
  function expectedBuild(heroId, types, catalog, ko) {
    const t = (types || []).find(x => x.id === heroId);
    if (!t?.coreItems?.length) return null;
    const result = inferBuild(t.coreItems, catalog, ko);
    return result && { ...result, expected: true, curve: t.curve };
  }
  return { THREATS, HOW, HOW_VS, SLOT_KO, inferBuild, expectedBuild };
});

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.LaneRoute = api;
})(globalThis, () => {
  'use strict';
  // What to farm after clearing a wave in my lane: from where the waves meet, the camps on our side
  // that are up (or spawn by the time I get there), the crates and golden statue spots on the way,
  // and back before the next wave. Priority as in the guide: lane, then camps, then crates (a crate
  // drops souls only 60% of the time). The enemy jungle is offered apart, for when it is safe.
  // Positions are 0-1 map coordinates with team 0's base at the bottom (jungle-data, map-points).
  const VALUE = { weak: 1, medium: 2.4, strong: 4.2, vault: 2.6 };
  const CLEAR = { weak: 8, medium: 16, strong: 26, vault: 18 };
  // One map width on foot (the overlay's jungle route uses the same pace).
  const CROSS = 70;
  // Waves come every 30 s; out, clear and back must fit in that.
  const BUDGET = 30;
  // Camps further than this from the lane are not on the way (about 15 s on foot).
  const REACH = 0.22;
  // A crate or statue within this distance of the path is on the way.
  const NEAR = 0.025;
  const CRATES_FROM = 180;
  // Lanes are numbered 1, 3 and 4 in the map data (lane 1 at team 0's left). With our base at the
  // bottom of the minimap, team 1 sees the map turned around.
  const LANES = { 0: { left: '1', mid: '3', right: '4' }, 1: { left: '4', mid: '3', right: '1' } };
  // Lane colours are the zipline colours, fixed on the map: yellow in the west (lane 1), green in the
  // east (lane 4). So the band a colour is in depends on which way the minimap is turned.
  const COLOR_BAND = {
    0: { yellow: 'left', blue: 'mid', green: 'right' },
    1: { green: 'left', blue: 'mid', yellow: 'right' }
  };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const walk = (a, b) => (dist(a, b) * CROSS);
  function nearSegment(p, a, b) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      len = dx * dx + dy * dy,
      t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }
  // Seconds until the camp is up: 0 when up or not known to be down.
  function upIn(c) {
    if (c.state === 'first' || c.state === 'respawn') return c.remaining ?? Infinity;
    return c.state === 'unknown' && c.observation === 'absent' ? Infinity : 0;
  }
  // The one or two camps (in that order) from `start` and back that give the most souls within the
  // time between two waves; the shorter trip when two give the same.
  function best(camps, start) {
    const near = camps.filter(c => dist(c, start) <= REACH);
    let top = null;
    const consider = list => {
      let t = 0,
        here = start,
        value = 0;
      const stops = [];
      for (const c of list) {
        const w = walk(here, c),
          wait = Math.max(0, upIn(c) - (t + w));
        // Waiting more than a few seconds at a camp is not worth leaving the lane for.
        if (wait > 5) return;
        stops.push({ ...c, walk: Math.round(w), wait: Math.round(wait), clear: CLEAR[c.kind] });
        t += w + wait + CLEAR[c.kind];
        value += VALUE[c.kind];
        here = c;
      }
      const back = walk(here, start),
        total = t + back;
      if (total > BUDGET) return;
      if (!top || value > top.value + 1e-9 || (Math.abs(value - top.value) < 1e-9 && total < top.total))
        top = { stops, back: Math.round(back), total: Math.round(total), value };
    };
    for (const a of near) {
      consider([a]);
      for (const b of near) if (b !== a) consider([a, b]);
    }
    return top;
  }
  function along(points, path) {
    const out = [];
    for (const [x, y] of points || []) {
      const p = { x, y };
      for (let i = 1; i < path.length; i++)
        if (nearSegment(p, path[i - 1], path[i]) <= NEAR) {
          out.push(p);
          break;
        }
    }
    return out;
  }
  // camps: the jungle snapshot's camps (x, y, kind, state, remaining, observation).
  // team: 0 or 1 (1 when the minimap is turned around). band: 'left' | 'mid' | 'right' as seen on
  // the minimap with our base at the bottom; color is used when the band is not read yet.
  function plan({ camps, points, team, band, color, seconds }) {
    band = band || COLOR_BAND[team]?.[color] || null;
    if (!points?.guardians || !camps?.length || ![0, 1].includes(team)) return null;
    if (!band) return { missing: 'lane' };
    if (!Number.isFinite(seconds)) return { missing: 'clock' };
    const lane = LANES[team][band],
      [ox, oy] = points.guardians[team][lane],
      [ex, ey] = points.guardians[1 - team][lane];
    // Where the waves meet: a little past the middle of the two guardians, after pushing.
    const start = { x: ox + (ex - ox) * 0.55, y: oy + (ey - oy) * 0.55 },
      midY = (oy + ey) / 2,
      // Camps right on the middle line are anyone's: offered on both sides.
      ours = c => (team === 0 ? c.y >= midY - 0.015 : c.y <= midY + 0.015),
      mine = c => (team === 0 ? c.y >= midY + 0.015 : c.y <= midY - 0.015);
    const own = best(camps.filter(ours), start),
      theirs = best(camps.filter(c => !mine(c) && !own?.stops.some(s => s.id === c.id)), start);
    const path = own ? [start, ...own.stops, start] : [start];
    const cratesUp = seconds >= CRATES_FROM;
    // No camp to take: the crates near the lane on our side, nearest first.
    let crateRun = null;
    if (!own && cratesUp) {
      const near = (points.crates || [])
        .map(([x, y]) => ({ x, y }))
        .filter(p => ours(p) && dist(p, start) <= REACH * 0.6)
        .sort((a, b) => dist(a, start) - dist(b, start))
        .slice(0, 5);
      if (near.length) {
        const run = [start];
        let left = [...near];
        while (left.length) {
          const here = run.at(-1),
            next = left.reduce((m, p) => (dist(p, here) < dist(m, here) ? p : m));
          run.push(next);
          left = left.filter(p => p !== next);
        }
        run.push(start);
        let t = 0;
        for (let i = 1; i < run.length; i++) t += walk(run[i - 1], run[i]) + (i < run.length - 1 ? 1.5 : 0);
        crateRun = { path: run, count: near.length, total: Math.round(t) };
      }
    }
    // When nothing is up, the next camp on our side near the lane to come back for.
    const next = own
      ? null
      : camps
          .filter(c => ours(c) && dist(c, start) <= REACH && Number.isFinite(upIn(c)) && upIn(c) > 0)
          .sort((a, b) => upIn(a) - upIn(b))[0] || null;
    const route = crateRun ? crateRun.path : path;
    return {
      team,
      band,
      lane,
      start,
      seconds,
      stops: own?.stops || [],
      back: own?.back ?? null,
      total: own?.total ?? crateRun?.total ?? null,
      path: route,
      crateRun: !!crateRun,
      cratesUp,
      crates: cratesUp ? along(points.crates, route) : [],
      tough: cratesUp ? along(points.tough, route) : [],
      statues: along(points.statues, route),
      next: next ? { ...next, in: upIn(next) } : null,
      enemy: theirs ? { stops: theirs.stops, back: theirs.back, total: theirs.total, path: [start, ...theirs.stops, start] } : null,
      wave: 30
    };
  }
  return { plan, CLEAR, CROSS, REACH, LANES, COLOR_BAND };
});

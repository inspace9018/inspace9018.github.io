'use strict';
// Display language (설정 → 언어). Korean text stays where it is written and the English sits beside
// it: L('영혼 단지', 'Soul Urn'). English uses the game's own English terms (Souls, Lane, Soul Urn,
// Mid-Boss, Rejuvenator, Guardian, Walker, Shrine, Patron, Troopers). The main process and every
// window load this one file; each window takes the language from the state it receives (state.lang).
// Chinese and Russian are built on the English: every English text goes through tr(), which looks it
// up in i18n-zh.js / i18n-ru.js (made by tools/build-i18n.cjs from tools/i18n/zh.json, ru.json and the game's own
// names). English made from a template, `${n} matches`, is found by its pattern "{0} matches".
// Anything not in the dictionary stays English.
(function (root) {
  const LANGS = ['ko', 'en', 'zh', 'ru'];
  let lang = 'ko',
    dict = null;
  const node = typeof module !== 'undefined' && module.exports;
  // The dictionaries: i18n-zh.js and i18n-ru.js, required here in Node and loaded as scripts in a
  // window (root.I18N_DICT), where a web page may add one later.
  const D = () => {
    if (!node) return root.I18N_DICT?.[lang];
    if (!dict) {
      dict = {};
      for (const l of ['zh', 'ru'])
        try {
          dict[l] = require(`./i18n-${l}.js`);
        } catch {}
    }
    return dict[lang];
  };
  // Patterns compiled once per language: "{0} matches" → /^(.*?) matches$/ and the order its
  // placeholders appear in.
  const compiled = {},
    seen = {};
  function patterns(d) {
    if (compiled[lang]) return compiled[lang];
    return (compiled[lang] = (d.patterns || []).map(([en, to]) => {
      const order = [];
      const re = en.split(/(\{\d+\})/).map(p => (/^\{\d+\}$/.test(p) ? (order.push(+p.slice(1, -1)), '([\\s\\S]*?)') : p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      return [new RegExp('^' + re.join('') + '$'), to, order];
    }));
  }
  function lookup(d, en) {
    const hit = d.text[en];
    if (hit != null) return hit;
    for (const [re, to, order] of patterns(d)) {
      const m = re.exec(en);
      if (m) {
        const val = {};
        order.forEach((n, i) => (val[n] = m[i + 1]));
        return to.replace(/\{(\d+)\}/g, (_, n) => val[n] ?? '');
      }
    }
    return null;
  }
  // English → the current language (unchanged in Korean and English, and where no translation exists).
  function tr(en) {
    if (lang === 'ko' || lang === 'en' || en == null) return en;
    if (Array.isArray(en)) return en.map(tr);
    // A table of English text ({ early, mid, late }, { good, bad, even }): each value translated.
    if (en && typeof en === 'object' && Object.getPrototypeOf(en) === Object.prototype) return Object.fromEntries(Object.entries(en).map(([k, v]) => [k, tr(v)]));
    if (typeof en !== 'string' || !/[A-Za-z]/.test(en)) return en;
    const d = D();
    if (!d) return en;
    const cache = (seen[lang] ||= new Map());
    if (cache.has(en)) return cache.get(en);
    let out = lookup(d, en);
    if (out == null) {
      // The dictionary keeps text trimmed: " · Strength: " is found as "· Strength:".
      const core = en.trim();
      const t = core !== en ? lookup(d, core) : null;
      out = t == null ? en : en.replace(core, t);
    }
    // Text joined from parts ("Large camps · Sinner's Sacrifice"): each part on its own.
    if (out === en && / · |→/.test(en)) {
      const parts = en.split(/( · |→)/).map((p, i) => (i % 2 ? p : lookup(d, p.trim()) ?? p));
      out = parts.join('');
    }
    if (cache.size > 20000) cache.clear();
    cache.set(en, out);
    return out;
  }
  // L(koTable, enTable): each English value translated, except what the Korean table has too in the
  // same place, keys and class names ([['early', '초반']] / [['early', 'Early']]).
  function zip(ko, en) {
    if (typeof en === 'string') return en === ko ? en : tr(en);
    if (Array.isArray(en)) return en.map((x, i) => zip(ko?.[i], x));
    if (en && typeof en === 'object' && Object.getPrototypeOf(en) === Object.prototype) return Object.fromEntries(Object.entries(en).map(([k, x]) => [k, zip(ko?.[k], x)]));
    return en;
  }
  const I18N = {
    LANGS,
    get lang() {
      return lang;
    },
    // Not Korean: English, or a language built on the English.
    get foreign() {
      return lang !== 'ko';
    },
    // For dates, numbers and speech.
    get locale() {
      return { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ru: 'ru-RU' }[lang];
    },
    set(next) {
      lang = LANGS.includes(next) ? next : 'ko';
      if (typeof document !== 'undefined') document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
      return lang;
    },
    // The setting ('auto' or a language) and the system languages: auto follows Windows, English
    // when Windows is in none of these languages.
    resolve(setting, systemLanguages = []) {
      if (LANGS.includes(setting)) return setting;
      for (const l of systemLanguages) {
        const m = /^(ko|zh|ru)\b/i.exec(l);
        if (m) return m[1].toLowerCase();
      }
      return 'en';
    },
    tr,
    L(ko, en) {
      return lang === 'ko' || en == null ? ko : zip(ko, en);
    },
    // Korean-only text not translated yet (hero guides, tips): empty in other languages, so the block
    // that shows it is left out instead of showing Korean in an English overlay.
    only(ko) {
      return lang === 'ko' ? ko : '';
    },
    // Guide text kept in both languages (style / styleEn, tags / tagsEn): the English (translated), or
    // nothing (never the Korean) where no English was written.
    pick(ko, en) {
      if (lang === 'ko') return ko;
      return tr(en ?? (Array.isArray(ko) ? [] : ko && typeof ko === 'object' ? null : ''));
    },
    // A hero or ability record carrying both names ({ en, ko }); Chinese and Russian from the game.
    name(x, fallback = '') {
      if (lang === 'ko') return x?.ko || x?.en || x?.name || fallback;
      const en = x?.en || x?.name;
      return (lang === 'en' ? en : D()?.names?.[en] || tr(en)) || fallback;
    },
    // Item names: the shop's own English name, the Korean client's (ITEM_KO) in Korean, and the
    // Chinese and Russian clients' names.
    item(id, catalog, ko) {
      const it = (catalog || []).find(i => i.id === id);
      if (lang === 'en') return it?.name || '';
      if (lang !== 'ko') return D()?.items?.[id] || tr(it?.name) || '';
      return (ko || []).find(k => k.id === id)?.ko || it?.name || '';
    },
    // Number words that differ: "3명" / "3 heroes" / "3名英雄".
    count(n, ko, one, many = one + 's') {
      if (lang === 'ko') return `${n}${ko}`;
      // In Chinese and Russian through the dictionary's "{0} troopers" pattern.
      return tr(`${n} ${n === 1 ? one : many}`);
    }
  };
  if (node) module.exports = I18N;
  else {
    root.I18N = I18N;
    root.L = I18N.L;
    // The website picks its language before this file runs (site/guide/lib/site-lang.js).
    if (root.SITE_LANG) I18N.set(root.SITE_LANG);
  }
})(typeof window !== 'undefined' ? window : globalThis);

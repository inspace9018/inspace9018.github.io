'use strict';
// Display language (설정 → 언어). Korean text stays where it is written and the English sits beside
// it: L('영혼 단지', 'Soul Urn'). English uses the game's own English terms (Souls, Lane, Soul Urn,
// Mid-Boss, Rejuvenator, Guardian, Walker, Shrine, Patron, Troopers). The main process and every
// window load this one file; each window takes the language from the state it receives (state.lang).
(function (root) {
  let lang = 'ko';
  const I18N = {
    get lang() {
      return lang;
    },
    set(next) {
      lang = next === 'en' ? 'en' : 'ko';
      if (typeof document !== 'undefined') document.documentElement.lang = lang;
      return lang;
    },
    // The setting ('auto', 'ko' or 'en') and the system languages: auto is Korean on a Korean Windows.
    resolve(setting, systemLanguages = []) {
      if (setting === 'ko' || setting === 'en') return setting;
      return systemLanguages.some(l => /^ko\b/i.test(l)) ? 'ko' : 'en';
    },
    L(ko, en) {
      return lang === 'en' && en != null ? en : ko;
    },
    // Korean-only text not translated yet (hero guides, tips): empty in English, so the block that
    // shows it is left out instead of showing Korean in an English overlay.
    only(ko) {
      return lang === 'en' ? '' : ko;
    },
    // Guide text kept in both languages (style / styleEn, tags / tagsEn): the English in English,
    // or nothing (never the Korean) where no English was written.
    pick(ko, en) {
      if (lang !== 'en') return ko;
      return en ?? (Array.isArray(ko) ? [] : ko && typeof ko === 'object' ? null : '');
    },
    // A hero or ability record carrying both names ({ en, ko }).
    name(x, fallback = '') {
      return (lang === 'en' ? x?.en || x?.name : x?.ko || x?.en || x?.name) || fallback;
    },
    // Item names: the shop's own English name, or the Korean client's (ITEM_KO) in Korean.
    item(id, catalog, ko) {
      const it = (catalog || []).find(i => i.id === id);
      if (lang === 'en') return it?.name || '';
      return (ko || []).find(k => k.id === id)?.ko || it?.name || '';
    },
    // Number words that differ: "3명" / "3 heroes".
    count(n, ko, one, many = one + 's') {
      return lang === 'en' ? `${n} ${n === 1 ? one : many}` : `${n}${ko}`;
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
  else {
    root.I18N = I18N;
    root.L = I18N.L;
  }
})(typeof window !== 'undefined' ? window : globalThis);

'use strict';
// Stable source-language URLs; legacy ?lang= links keep working.
(function () {
  const LANGS = ['ko', 'en', 'zh', 'ru'];
  const source = document.currentScript.src.replace(/[^/]*$/, '');
  const current = new URL(location.href);
  const pathLanguage = /^\/(en|zh|ru)(?=\/)/.exec(current.pathname)?.[1] || 'ko';
  const asked = current.searchParams.get('lang');
  const bare = current.pathname.replace(/^\/(en|zh|ru)(?=\/)/, '').replace(/index\.html$/, '');
  const address = lang => (lang === 'ko' ? '' : '/' + lang) + bare;
  if (LANGS.includes(asked)) {
    current.pathname = address(asked);
    current.searchParams.delete('lang');
    location.replace(current.href);
  }
  const lang = pathLanguage;
  window.SITE_LANG = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
  if (lang === 'zh' || lang === 'ru') document.write('<script src="' + source + 'i18n-' + lang + '.js"><\/script>');
  function links() {
    for (const link of document.querySelectorAll('a[href]')) {
      const raw = link.getAttribute('href');
      if (!raw || /^(mailto:|tel:|javascript:)/.test(raw)) continue;
      const url = new URL(raw, document.baseURI);
      if (url.origin !== location.origin) continue;
      let plain = url.pathname.replace(/^\/(en|zh|ru)(?=\/)/, '').replace(/index\.html$/, '');
      if (raw.startsWith('#')) plain = bare;
      if (!/^\/(?:guide\/(?:heroes\.html|comp\.html|map\.html|routes\.html|heroes\/[a-z-]+\/|jungle-timers\/|brawl\/|ability-upgrades\/)?|help\/(?:install\/|performance\/)?|)$/.test(plain)) continue;
      const next = (lang === 'ko' ? '' : '/' + lang) + plain + url.search + url.hash;
      if (raw !== next) link.setAttribute('href', next);
    }
  }
  window.SITE_TEXT = () => {
    const pick = document.querySelector('[data-lang]');
    if (pick && !pick.dataset.languageBound) {
      pick.dataset.languageBound = '1';
      pick.value = lang;
      pick.addEventListener('change', () => {
        const url = new URL(location.href);
        url.pathname = address(pick.value);
        url.searchParams.delete('lang');
        location.href = url.href;
      });
    }
    links();
    if (document.body) new MutationObserver(links).observe(document.body, { childList: true, subtree: true });
  };
})();

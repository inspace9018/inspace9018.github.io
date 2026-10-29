"use strict";
// Only the explicitly placed right-rail units belong on Lookout pages. RevIQ's
// tag also creates an automatic anchor. Detach it, rather than hiding an ad.
(() => {
  const removeAnchors = () => {
    for (const node of document.querySelectorAll(
      '[data-reviq-sticky-ad], [data-ad="anchor"]',
    )) {
      node.removeAttribute("data-ad");
      for (const slot of node.querySelectorAll("[data-ad]"))
        slot.removeAttribute("data-ad");
      node.remove();
    }
  };
  new MutationObserver(removeAnchors).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  removeAnchors();
})();

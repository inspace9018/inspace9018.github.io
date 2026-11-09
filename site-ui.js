'use strict';
// Static HTML stays usable without JavaScript. This only switches the example image.
(() => {
  const preview = document.querySelector('.site-preview');
  if (!preview) return;
  const image = preview.querySelector('.dl-shot img');
  const link = preview.querySelector('.dl-shot');
  const caption = preview.querySelector('figcaption');
  const examples = { play: { src: image.getAttribute('src'), alt: image.alt } };
  for (const scene of ['tab', 'select']) {
    const example = document.querySelector(`.dl-gallery img[src*="overlay-${scene}."]`);
    if (example) examples[scene] = { src: example.getAttribute('src'), alt: example.alt };
  }
  let request = 0;
  preview.addEventListener('click', async event => {
    const button = event.target.closest('[data-preview]');
    if (!button) return;
    if (button.getAttribute('aria-pressed') === 'true') {
      ++request;
      preview.removeAttribute('aria-busy');
      return;
    }
    const example = examples[button.dataset.preview];
    if (!example) return;
    const current = ++request;
    preview.setAttribute('aria-busy', 'true');
    try {
      const loaded = new Image();
      loaded.src = example.src;
      await loaded.decode();
      if (current !== request) return;
      image.src = example.src;
      image.alt = example.alt;
      image.removeAttribute('data-t-alt');
      link.href = example.src;
      caption.textContent = example.alt + ' · ' + preview.dataset.previewNote;
      for (const item of preview.querySelectorAll('[data-preview]'))
        item.setAttribute('aria-pressed', String(item === button));
    } catch {
      // Keep the last loaded image and selected button when a request fails.
    } finally {
      if (current === request) preview.removeAttribute('aria-busy');
    }
  });
})();

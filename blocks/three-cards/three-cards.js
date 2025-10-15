/* three-cards.js
   Features:
   • Lazy-load images (data-src / data-srcset)
   • Reveal animation on scroll
   • Optional click analytics beacon
*/

(function () {
  'use strict';

  const rootSelector = '.three-cards';
  const cardSelector = '.three-cards__card';
  const revealClass = 'card--reveal';
  const visibleClass = 'is-visible';

  function loadImage(img) {
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
  }

  function init(container) {
    if (container.dataset.init) return;
    container.dataset.init = 'true';

    const cards = container.querySelectorAll(cardSelector);
    cards.forEach(c => c.classList.add(revealClass));

    // lazy load & reveal
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card = entry.target;
            const img = card.querySelector('img[data-src]');
            if (img) loadImage(img);
            card.classList.add(visibleClass);
            obs.unobserve(card);
          }
        });
      }, { threshold: 0.2, rootMargin: '100px' });

      cards.forEach(card => observer.observe(card));
    } else {
      // fallback
      cards.forEach(card => {
        const img = card.querySelector('img[data-src]');
        if (img) loadImage(img);
        card.classList.add(visibleClass);
      });
    }

    // click beacon (optional)
    container.addEventListener('click', e => {
      const btn = e.target.closest('.card__cta');
      if (!btn) return;
      const title = btn.closest(cardSelector)?.querySelector('.card__title')?.textContent?.trim() || '';
      const endpoint = container.dataset.analyticsEndpoint;
      if (endpoint) {
        const payload = JSON.stringify({ event: 'cardClick', title });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(endpoint, payload);
        } else {
          fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
        }
      }
    });
  }

  function autoInit() {
    document.querySelectorAll(rootSelector).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.ThreeCards = { init };
})();

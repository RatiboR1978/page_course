/* ============================================================
   ANIMATIONS — появление блоков при скролле
   Разметка: <div class="reveal"> … </div>
   Задержка каскада: data-reveal-delay="120" (мс)
   ============================================================ */

(function () {
  'use strict';

  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const delay = Number(entry.target.dataset.revealDelay || 0);
        setTimeout(() => entry.target.classList.add('is-visible'), delay);

        obs.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
})();

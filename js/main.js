/* ============================================================
   MAIN — интерактив лендинга

   Первому экрану скрипты не нужны: прилипающей шапки нет,
   логотип лежит внутри контейнера с контентом. Аккордеоны программы
   и FAQ собраны на нативных <details>/<summary> и тоже не требуют
   скриптов. Логика следующих секций добавляется сюда.
   ============================================================ */

/* ------------------------------------------------------------
   COUNTDOWN — таймер семнадцатого экрана (#timer):
   «Стоимость для участников вебинара действует 24 часа».

   Дедлайн — 24 часа от первого визита конкретного посетителя,
   а не от каждой загрузки страницы: момент истечения один раз
   сохраняется в localStorage и переживает перезагрузку и переход
   между вкладками. Если посетитель вернётся позже дедлайна,
   таймер честно останавливается на 00:00:00, а не запускается
   заново, — цена действительно перестала быть стартовой для него.

   Разметка (см. #timer в index.html):
   [data-countdown] — обёртка часов, [data-countdown-hours/minutes/seconds] —
   ячейки цифр. Без JS в разметке остаётся первый честный кадр — 24:00:00.
   ------------------------------------------------------------ */
(function () {
  'use strict';

  const STORAGE_KEY = 'tsss-cta-deadline';
  const DURATION_MS = 24 * 60 * 60 * 1000;

  const clock = document.querySelector('[data-countdown]');
  if (!clock) return;

  const hoursEl = clock.querySelector('[data-countdown-hours]');
  const minutesEl = clock.querySelector('[data-countdown-minutes]');
  const secondsEl = clock.querySelector('[data-countdown-seconds]');
  if (!hoursEl || !minutesEl || !secondsEl) return;

  let deadline = Number(window.localStorage ? localStorage.getItem(STORAGE_KEY) : NaN);

  if (!deadline || Number.isNaN(deadline)) {
    deadline = Date.now() + DURATION_MS;

    try {
      localStorage.setItem(STORAGE_KEY, String(deadline));
    } catch (e) {
      /* приватный режим или отключенное хранилище — таймер всё равно
         отработает эти 24 часа, просто не переживёт перезагрузку */
    }
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  let timerId = null;

  function render() {
    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      clock.classList.add('is-expired');

      if (timerId) clearInterval(timerId);
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);

    hoursEl.textContent = pad(Math.floor(totalSeconds / 3600));
    minutesEl.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    secondsEl.textContent = pad(totalSeconds % 60);
  }

  render();
  timerId = setInterval(render, 1000);
})();

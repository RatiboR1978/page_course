/* ============================================================
   MAIN — интерактив лендинга

   Первому экрану скрипты не нужны: прилипающей шапки нет,
   логотип лежит внутри контейнера с контентом. Аккордеоны программы
   и FAQ собраны на нативных <details>/<summary> и тоже не требуют
   скриптов. Логика следующих секций добавляется сюда.
   ============================================================ */

/* ------------------------------------------------------------
   METHOD TABS — переключатель четырёх шагов восьмого экрана (#method).

   Разметка (см. секцию METHOD в index.html): [data-method-tabs] — обёртка,
   внутри рельс с четырьмя [role="tab"] и четыре [role="tabpanel"],
   связанные через aria-controls/id.

   Прогрессивное улучшение: в разметке панели не скрыты, поэтому без
   скрипта видны все четыре шага сразу — текст секции не теряется.
   Скрипт прячет неактивные, синхронизирует aria-selected и добавляет
   клавиатуру. Стрелки работают по обеим осям: до 768px рельс
   горизонтальный, дальше вертикальный.
   ------------------------------------------------------------ */
(function () {
  'use strict';

  const root = document.querySelector('[data-method-tabs]');
  if (!root) return;

  const tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

  if (!tabs.length || panels.some((panel) => !panel)) return;

  function select(index, moveFocus) {
    tabs.forEach((tab, i) => {
      const isActive = i === index;

      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panels[i].hidden = !isActive;
    });

    if (moveFocus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', function () {
      select(index, false);
    });

    tab.addEventListener('keydown', function (event) {
      let next = null;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = (index + 1) % tabs.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (index - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      select(next, true);
    });
  });

  select(0, false);
})();

/* ------------------------------------------------------------
   COUNTDOWN — таймер семнадцатого экрана (#timer):
   «Стоимость для участников вебинара действует 24 часа».

   Дедлайн — 24 часа от текущего захода: при каждой загрузке страницы
   отсчёт начинается заново с 24:00:00, ничего не сохраняется между
   визитами и вкладками.

   Разметка (см. #timer в index.html):
   [data-countdown] — обёртка часов, [data-countdown-hours/minutes/seconds] —
   ячейки цифр. Без JS в разметке остаётся первый честный кадр — 24:00:00.
   ------------------------------------------------------------ */
(function () {
  'use strict';

  const DURATION_MS = 24 * 60 * 60 * 1000;

  const clock = document.querySelector('[data-countdown]');
  if (!clock) return;

  const hoursEl = clock.querySelector('[data-countdown-hours]');
  const minutesEl = clock.querySelector('[data-countdown-minutes]');
  const secondsEl = clock.querySelector('[data-countdown-seconds]');
  if (!hoursEl || !minutesEl || !secondsEl) return;

  const deadline = Date.now() + DURATION_MS;

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

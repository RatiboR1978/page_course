/* ------------------------------------------------------------
   NETWORK-BG — живой узор точек-линий для фона .reason, .path и .timing
   (десктопный брейкпоинт, ≥768px). Раньше на этом месте была
   статичная картинка reason-bg.png/path-bg.png с "нейросетевым"
   узором — точки-узлы дугой у левого/правого края, соединённые
   тонкими линиями, пустая середина под текст. Здесь тот же узор,
   но живой: узлы медленно и органично дрейфуют.

   На мобильных/планшетных (<768px) canvas скрыт через CSS
   (display: none) и скрипт для него не инициализируется — расход
   трафика/CPU не растёт по сравнению с прежним поведением (там
   картинка тоже не подключалась). При prefers-reduced-motion canvas
   тоже скрыт CSS-ом, поэтому просто не инициализируем анимацию.
   ------------------------------------------------------------ */

(function () {
  'use strict';

  var DESKTOP_QUERY = '(min-width: 768px)';
  var REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

  // Цвета узла/линий — те же, что в существующих угловых
  // radial-gradient засветках этих секций (см. .reason::before /
  // .path::before): циан справа, лаванда слева.
  var COLOR_LEFT = [184, 140, 255];  // лаванда
  var COLOR_RIGHT = [127, 232, 255]; // циан

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia(REDUCED_MOTION_QUERY).matches;
  }

  function isDesktop() {
    return window.matchMedia && window.matchMedia(DESKTOP_QUERY).matches;
  }

  // Случайное число в диапазоне [min, max)
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function NetworkField(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.running = false;
    this.rafId = null;
    this.linkDistance = 0;

    this._onResize = this.resize.bind(this);
    this._tick = this.tick.bind(this);
  }

  NetworkField.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Радиус связи между узлами масштабируется от ширины секции —
    // на широких экранах линии не становятся визуально гуще/реже.
    this.linkDistance = Math.max(120, this.width * 0.14);

    this.generateNodes();
  };

  // Узлы сгруппированы дугой у краёв (левый низ / правый верх-низ),
  // середина остаётся пустой под текст — повторяет композицию
  // исходных reason-bg.png / path-bg.png, а не равномерную сетку.
  NetworkField.prototype.generateNodes = function () {
    var w = this.width;
    var h = this.height;
    var count = Math.max(36, Math.min(70, Math.round((w * h) / 26000)));
    var nodes = [];

    for (var i = 0; i < count; i++) {
      var leftSide = i % 2 === 0;
      var edgeX = leftSide ? rand(-0.04, 0.30) : rand(0.70, 1.04);
      var y = rand(-0.05, 1.05);
      var color = leftSide ? COLOR_LEFT : COLOR_RIGHT;

      nodes.push({
        x: edgeX * w,
        y: y * h,
        vx: rand(-1, 1) * 0.10,
        vy: rand(-1, 1) * 0.10,
        r: rand(1.1, 2.6),
        color: color
      });
    }

    this.nodes = nodes;
  };

  NetworkField.prototype.step = function () {
    var w = this.width;
    var h = this.height;
    var margin = 40;

    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      // Мягкое отражение от расширенных границ области — точки не
      // телепортируются и не совершают резких разворотов, дрейф
      // остаётся плавным и органичным.
      if (n.x < -margin || n.x > w + margin) { n.vx *= -1; }
      if (n.y < -margin || n.y > h + margin) { n.vy *= -1; }
    }
  };

  NetworkField.prototype.draw = function () {
    var ctx = this.ctx;
    var nodes = this.nodes;
    ctx.clearRect(0, 0, this.width, this.height);

    // Линии между близкими узлами, прозрачность убывает с расстоянием.
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i];
        var b = nodes[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= this.linkDistance) { continue; }

        var alpha = (1 - dist / this.linkDistance) * 0.35;
        var color = a.color;
        ctx.strokeStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + alpha.toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Узлы поверх линий, с лёгким свечением.
    for (var k = 0; k < nodes.length; k++) {
      var node = nodes[k];
      var c = node.color;
      ctx.save();
      ctx.shadowColor = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.9)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.9)';
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  NetworkField.prototype.tick = function () {
    if (!this.running) { return; }
    this.step();
    this.draw();
    this.rafId = window.requestAnimationFrame(this._tick);
  };

  NetworkField.prototype.start = function () {
    if (this.running) { return; }
    this.running = true;
    this.rafId = window.requestAnimationFrame(this._tick);
  };

  NetworkField.prototype.stop = function () {
    this.running = false;
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  NetworkField.prototype.init = function () {
    window.addEventListener('resize', this._onResize);
    this.resize();

    // Останавливаем requestAnimationFrame, когда секция вне вьюпорта —
    // экономия CPU при длинной странице с несколькими такими фонами.
    if (window.IntersectionObserver) {
      var self = this;
      this.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            self.start();
          } else {
            self.stop();
          }
        });
      }, { threshold: 0.01 });
      this.observer.observe(this.canvas);
    } else {
      this.start();
    }
  };

  var fields = [];

  // Брейкпоинт/reduced-motion могут поменяться в рантайме (изменение
  // размера окна, смена настройки ОС) — переоцениваем состояние вместо
  // разовой инициализации при загрузке.
  function syncAll() {
    var active = isDesktop() && !prefersReducedMotion();

    if (active) {
      var canvases = document.querySelectorAll('.reason .network-bg, .path .network-bg, .timing .network-bg');
      canvases.forEach(function (canvas) {
        if (!canvas.dataset.networkBgInit) {
          canvas.dataset.networkBgInit = '1';
          var field = new NetworkField(canvas);
          field.init();
          fields.push(field);
        }
      });
      // Мог быть остановлен предыдущим переходом на мобильный брейкпоинт —
      // возобновляем (IntersectionObserver сам остановит, если секция
      // сейчас вне вьюпорта).
      fields.forEach(function (field) { field.start(); });
    } else {
      fields.forEach(function (field) { field.stop(); });
    }
  }

  function initAll() {
    syncAll();

    window.addEventListener('resize', syncAll);
    if (window.matchMedia) {
      var motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', syncAll);
      } else if (motionQuery.addListener) {
        motionQuery.addListener(syncAll);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();

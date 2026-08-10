/* AKN — shared behaviour: theme, nav, reveal, counters, hijri date,
   home prayer widget, hadith of the day. Classic script, no dependencies.
   Per-page strings come from window.AKN_L10N (set inline before this script). */
(function () {
  'use strict';
  var L = window.AKN_L10N || {};
  var lang = document.documentElement.lang === 'ur' ? 'ur' : 'en';

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('akn-theme', t); } catch (e) {}
  }
  var themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Mobile sheet ---------- */
  var burger = document.querySelector('[data-burger]');
  var sheet = document.querySelector('[data-sheet]');
  var sheetClose = document.querySelector('[data-sheet-close]');
  function setSheet(open) {
    if (!sheet) return;
    sheet.classList.toggle('open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var f = sheet.querySelector('a,button'); if (f) f.focus(); }
    else if (burger) burger.focus();
  }
  if (burger && sheet) {
    burger.addEventListener('click', function () { setSheet(!sheet.classList.contains('open')); });
    if (sheetClose) sheetClose.addEventListener('click', function () { setSheet(false); });
    sheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSheet(false); });
  }

  /* ---------- Tools dropdown ---------- */
  document.querySelectorAll('[data-drop]').forEach(function (drop) {
    var btn = drop.querySelector('button');
    var menu = drop.querySelector('.menu');
    if (!btn || !menu) return;
    function close() { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) close(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
  });

  /* ---------- Reveal on scroll ---------- */
  var toReveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && toReveal.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    toReveal.forEach(function (el) { io.observe(el); });
  } else {
    toReveal.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var raw = el.getAttribute('data-count');
    var target = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!isFinite(target)) return;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, t0 = null;
    var fmt = new Intl.NumberFormat(lang === 'ur' ? 'en-PK' : 'en-PK');
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      p = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt.format(Math.round(target * p)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = prefix + fmt.format(target) + suffix; return;
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Hijri + Gregorian date ---------- */
  var dateEl = document.querySelector('[data-hijri]');
  if (dateEl) {
    try {
      var now = new Date();
      var hj = new Intl.DateTimeFormat((lang === 'ur' ? 'ur-PK' : 'en-GB') + '-u-ca-islamic-umalqura',
        { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      var gg = new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : 'en-GB',
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      dateEl.textContent = hj + (lang === 'ur' ? ' — ' : ' — ') + gg;
    } catch (e) { dateEl.textContent = ''; }
  }

  /* ---------- Home prayer widget (needs prayer.js) ---------- */
  var strip = document.querySelector('[data-prayer-strip]');
  if (strip && window.AKNPrayer) {
    var P = window.AKNPrayer;
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('akn-city') || 'null'); } catch (e) {}
    var city = saved && P.CITIES.filter(function (c) { return c.id === saved; })[0] || P.CITIES[0];
    var cityEl = document.querySelector('[data-prayer-city]');
    if (cityEl) cityEl.textContent = lang === 'ur' ? city.ur : city.en;
    var order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    var names = L.prayers || { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
    function render() {
      var now = new Date();
      var tz = P.tzOffsetHours(city.tz, now);
      var t = P.compute(now, city.lat, city.lng, tz, { method: 'Karachi', asr: 'Hanafi' });
      var nowMin = now.getHours() * 60 + now.getMinutes();
      var nextKey = null;
      for (var i = 0; i < order.length; i++) {
        if (order[i] !== 'sunrise' && t[order[i]] > nowMin) { nextKey = order[i]; break; }
      }
      strip.innerHTML = '';
      order.forEach(function (k) {
        var d = document.createElement('div');
        d.className = 'ptime' + (k === nextKey ? ' is-next' : '');
        d.innerHTML = '<div class="pt-name">' + (names[k] || k) + '</div>' +
          '<div class="pt-time">' + P.fmt(t[k], lang) + '</div>' +
          (k === nextKey ? '<div class="pt-count" data-count-to="' + t[k] + '"></div>' : '');
        strip.appendChild(d);
      });
      var cd = strip.querySelector('[data-count-to]');
      if (cd && nextKey) {
        var mins = t[nextKey] - nowMin;
        if (mins < 0) mins += 1440;
        var h = Math.floor(mins / 60), m = mins % 60;
        cd.textContent = (L.inLabel || 'in ') + (h ? h + (L.h || 'h ') : '') + m + (L.m || 'm');
      }
    }
    render();
    setInterval(render, 30000);
  }

  /* ---------- Hadith of the day (needs hadith data) ---------- */
  var hod = document.querySelector('[data-hadith-day]');
  if (hod && window.AKN_HADITH && window.AKN_HADITH.items.length) {
    var items = window.AKN_HADITH.items;
    var day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
    var it = items[day % items.length];
    var q = function (s) { return String(s == null ? '' : s); };
    hod.innerHTML =
      '<span class="ar">' + q(it.ar) + '</span>' +
      (lang === 'ur'
        ? '<p class="ur m-ur">' + q(it.ur) + '</p><p class="m-src">' + q(it.src_ur) + ' — ' + q(it.narrator_ur) + '</p>'
        : '<p class="m-en">&ldquo;' + q(it.en) + '&rdquo;</p><p class="m-src">' + q(it.src_en) + ' — ' + q(it.narrator_en) + '</p>');
  }

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    var swPath = document.documentElement.getAttribute('data-sw') || 'sw.js';
    navigator.serviceWorker.register(swPath).catch(function () {});
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

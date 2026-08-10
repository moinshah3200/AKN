/* =========================================================================
 * AKNPrayer — dependency-free prayer-times + qibla engine (classic script)
 * Exposes ONE global: window.AKNPrayer (and module.exports for node tests)
 * Solar model: NOAA/Meeus approximation, two-pass per prayer for minute
 * accuracy. All times returned as minutes-since-midnight (rounded numbers).
 * ========================================================================= */
(function (root) {
  'use strict';

  var DEG = Math.PI / 180;

  function d2r(d) { return d * DEG; }
  function r2d(r) { return r / DEG; }
  function fixAngle(a) { a = a % 360; return a < 0 ? a + 360 : a; }
  function fixHour(h) { h = h % 24; return h < 0 ? h + 24 : h; }

  /* ---------------------------------------------------------------------
   * Calculation methods
   * ------------------------------------------------------------------- */
  var METHODS = {
    Karachi: {
      fajr: 18, isha: 18,
      label: { en: 'University of Islamic Sciences, Karachi', ur: 'جامعہ علومِ اسلامیہ کراچی' }
    },
    MWL: {
      fajr: 18, isha: 17,
      label: { en: 'Muslim World League', ur: 'رابطہ عالم اسلامی' }
    },
    ISNA: {
      fajr: 15, isha: 15,
      label: { en: 'Islamic Society of North America', ur: 'اسلامک سوسائٹی آف نارتھ امریکہ' }
    },
    Egypt: {
      fajr: 19.5, isha: 17.5,
      label: { en: 'Egyptian General Authority of Survey', ur: 'مصری جنرل اتھارٹی' }
    },
    Makkah: {
      fajr: 18.5, ishaMin: 90,
      label: { en: 'Umm al-Qura University, Makkah', ur: 'جامعہ ام القریٰ مکہ' }
    }
  };

  /* ---------------------------------------------------------------------
   * Cities (Chenab Nagar first = default)
   * ------------------------------------------------------------------- */
  var CITIES = [
    { id: 'chenab-nagar', en: 'Chenab Nagar', ur: 'چناب نگر',    lat: 31.7546, lng: 72.9194,  tz: 'Asia/Karachi' },
    { id: 'chiniot',      en: 'Chiniot',      ur: 'چنیوٹ',        lat: 31.7292, lng: 72.9822,  tz: 'Asia/Karachi' },
    { id: 'lahore',       en: 'Lahore',       ur: 'لاہور',        lat: 31.5204, lng: 74.3587,  tz: 'Asia/Karachi' },
    { id: 'faisalabad',   en: 'Faisalabad',   ur: 'فیصل آباد',    lat: 31.4504, lng: 73.1350,  tz: 'Asia/Karachi' },
    { id: 'islamabad',    en: 'Islamabad',    ur: 'اسلام آباد',   lat: 33.6844, lng: 73.0479,  tz: 'Asia/Karachi' },
    { id: 'karachi',      en: 'Karachi',      ur: 'کراچی',        lat: 24.8607, lng: 67.0011,  tz: 'Asia/Karachi' },
    { id: 'multan',       en: 'Multan',       ur: 'ملتان',        lat: 30.1575, lng: 71.5249,  tz: 'Asia/Karachi' },
    { id: 'peshawar',     en: 'Peshawar',     ur: 'پشاور',        lat: 34.0151, lng: 71.5249,  tz: 'Asia/Karachi' },
    { id: 'quetta',       en: 'Quetta',       ur: 'کوئٹہ',        lat: 30.1798, lng: 66.9750,  tz: 'Asia/Karachi' },
    { id: 'makkah',       en: 'Makkah',       ur: 'مکہ مکرمہ',    lat: 21.4225, lng: 39.8262,  tz: 'Asia/Riyadh' },
    { id: 'madinah',      en: 'Madinah',      ur: 'مدینہ منورہ',  lat: 24.5247, lng: 39.5692,  tz: 'Asia/Riyadh' },
    { id: 'dubai',        en: 'Dubai',        ur: 'دبئی',         lat: 25.2048, lng: 55.2708,  tz: 'Asia/Dubai' },
    { id: 'london',       en: 'London',       ur: 'لندن',         lat: 51.5074, lng: -0.1278,  tz: 'Europe/London' },
    { id: 'birmingham',   en: 'Birmingham',   ur: 'برمنگھم',      lat: 52.4862, lng: -1.8904,  tz: 'Europe/London' },
    { id: 'new-york',     en: 'New York',     ur: 'نیو یارک',     lat: 40.7128, lng: -74.0060, tz: 'America/New_York' }
  ];

  /* ---------------------------------------------------------------------
   * DST-correct timezone offset in hours for an IANA zone
   * ------------------------------------------------------------------- */
  function tzOffsetHours(ianaTz, dateObj) {
    var date = dateObj || new Date();
    var name = '';
    var kinds = ['shortOffset', 'longOffset'];
    for (var k = 0; k < kinds.length && !name; k++) {
      try {
        var dtf = new Intl.DateTimeFormat('en-US', { timeZone: ianaTz, timeZoneName: kinds[k] });
        var parts = dtf.formatToParts(date);
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].type === 'timeZoneName') { name = parts[i].value; break; }
        }
      } catch (e) { /* try next flavour */ }
    }
    // name looks like 'GMT', 'GMT+5', 'GMT-4:30', 'GMT+05:00'
    var m = /GMT([+−-])(\d{1,2})(?::(\d{2}))?/.exec(name);
    if (!m) return 0; // plain 'GMT' → zero offset
    var sign = (m[1] === '-' || m[1] === '−') ? -1 : 1;
    var hours = parseInt(m[2], 10);
    var mins = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (hours + mins / 60);
  }

  /* ---------------------------------------------------------------------
   * Astronomy: Julian day + solar position (NOAA/Meeus approximation)
   * ------------------------------------------------------------------- */
  function julianDay(y, m, d) {
    // Julian day at 0h UT for a Gregorian calendar date
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  function sunPosition(jd) {
    // Days since J2000.0
    var D = jd - 2451545.0;
    // Mean anomaly and mean longitude of the sun (degrees)
    var g = fixAngle(357.529 + 0.98560028 * D);
    var q = fixAngle(280.459 + 0.98564736 * D);
    // Equation of centre → geocentric apparent ecliptic (true) longitude
    var L = fixAngle(q + 1.915 * Math.sin(d2r(g)) + 0.020 * Math.sin(d2r(2 * g)));
    // Mean obliquity of the ecliptic
    var e = 23.439 - 0.00000036 * D;
    // Declination
    var decl = r2d(Math.asin(Math.sin(d2r(e)) * Math.sin(d2r(L))));
    // Right ascension (hours)
    var RA = fixHour(r2d(Math.atan2(Math.cos(d2r(e)) * Math.sin(d2r(L)), Math.cos(d2r(L)))) / 15);
    // Equation of time (minutes)
    var eotH = q / 15 - RA;
    if (eotH > 12) eotH -= 24;
    if (eotH < -12) eotH += 24;
    return { decl: decl, eot: eotH * 60 };
  }

  // Minutes offset from solar noon for the sun at altitude h (deg). NaN if never reached.
  function hourAngleMinutes(hDeg, latDeg, declDeg) {
    var phi = d2r(latDeg), delta = d2r(declDeg);
    var cosH = (Math.sin(d2r(hDeg)) - Math.sin(phi) * Math.sin(delta)) /
               (Math.cos(phi) * Math.cos(delta));
    if (cosH < -1 || cosH > 1) return NaN;
    return 4 * r2d(Math.acos(cosH));
  }

  /* ---------------------------------------------------------------------
   * compute(date, lat, lng, tzHours, opts) → minutes-since-midnight
   * ------------------------------------------------------------------- */
  function compute(date, lat, lng, tzHours, opts) {
    opts = opts || {};
    var method = METHODS[opts.method || 'Karachi'] || METHODS.Karachi;
    var shadowFactor = (opts.asr === 'Hanafi') ? 2 : 1;
    var highLat = opts.highLat || 'NightMiddle';

    var jd0 = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());

    // Sun state for a given local-clock time (minutes since local midnight)
    function sunAt(localMin) {
      return sunPosition(jd0 + (localMin / 60 - tzHours) / 24);
    }
    function solarNoon(sun) {
      return 720 - 4 * lng - sun.eot + 60 * tzHours;
    }

    // Two-pass solar noon
    var sNoon = sunAt(720);
    var noon = solarNoon(sNoon);
    sNoon = sunAt(noon);
    noon = solarNoon(sNoon);

    // Two-pass time for the sun at altitude h, before (-1) or after (+1) noon
    function timeAtAltitude(hDeg, dir, guess) {
      var t = guess;
      for (var pass = 0; pass < 2; pass++) {
        var sun = sunAt(t);
        var ha = hourAngleMinutes(hDeg, lat, sun.decl);
        if (isNaN(ha)) return NaN;
        t = solarNoon(sun) + dir * ha;
      }
      return t;
    }

    var sunrise = timeAtAltitude(-0.833, -1, noon - 360);
    var sunset  = timeAtAltitude(-0.833, +1, noon + 360);
    var fajr    = timeAtAltitude(-method.fajr, -1, noon - 420);
    var dhuhr   = noon + 1;

    // Asr: altitude where shadow = shadowFactor + tan|φ − δ| (two-pass)
    var asr = (function () {
      var t = noon + 180;
      for (var pass = 0; pass < 2; pass++) {
        var sun = sunAt(t);
        var alt = r2d(Math.atan(1 / (shadowFactor + Math.tan(d2r(Math.abs(lat - sun.decl))))));
        var ha = hourAngleMinutes(alt, lat, sun.decl);
        if (isNaN(ha)) return NaN;
        t = solarNoon(sun) + ha;
      }
      return t;
    })();

    var maghrib = sunset;
    var isha;
    if (method.ishaMin != null) {
      isha = maghrib + method.ishaMin;               // Makkah: fixed minutes after maghrib
    } else {
      isha = timeAtAltitude(-method.isha, +1, noon + 420);
    }

    // High-latitude adjustment: middle-of-the-night rule
    if (highLat === 'NightMiddle' && !isNaN(sunrise) && !isNaN(sunset)) {
      var night = (1440 - sunset) + sunrise;         // sunset → next sunrise
      var half = night / 2;
      if (isNaN(fajr) || (sunrise - fajr) > half) fajr = sunrise - half;
      if (isNaN(isha) || (isha - sunset) > half) isha = sunset + half;
    }

    return {
      fajr: Math.round(fajr),
      sunrise: Math.round(sunrise),
      dhuhr: Math.round(dhuhr),
      asr: Math.round(asr),
      maghrib: Math.round(maghrib),
      isha: Math.round(isha)
    };
  }

  /* ---------------------------------------------------------------------
   * Formatting
   * ------------------------------------------------------------------- */
  function fmt(minutes, lang) {
    if (minutes == null || isNaN(minutes)) return (lang === 'ur') ? '—' : '--';
    var m = ((Math.round(minutes) % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60);
    var mm = m % 60;
    var isAM = h < 12;
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    var mmStr = (mm < 10 ? '0' : '') + mm;
    if (lang === 'ur') {
      return (isAM ? 'صبح' : 'شام') + ' ' + h12 + ':' + mmStr;
    }
    return h12 + ':' + mmStr + ' ' + (isAM ? 'AM' : 'PM');
  }

  /* ---------------------------------------------------------------------
   * Qibla + distance to the Kaaba
   * ------------------------------------------------------------------- */
  var KAABA = { lat: 21.422487, lng: 39.826206 };

  function qibla(lat, lng) {
    var phi1 = d2r(lat), phi2 = d2r(KAABA.lat);
    var dLng = d2r(KAABA.lng - lng);
    var y = Math.sin(dLng) * Math.cos(phi2);
    var x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
    var bearing = fixAngle(r2d(Math.atan2(y, x)));
    return Math.round(bearing * 10) / 10;
  }

  function distanceKm(lat, lng) {
    var R = 6371;
    var dPhi = d2r(KAABA.lat - lat);
    var dLam = d2r(KAABA.lng - lng);
    var a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
            Math.cos(d2r(lat)) * Math.cos(d2r(KAABA.lat)) *
            Math.sin(dLam / 2) * Math.sin(dLam / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* ---------------------------------------------------------------------
   * Export
   * ------------------------------------------------------------------- */
  var AKNPrayer = {
    METHODS: METHODS,
    CITIES: CITIES,
    KAABA: KAABA,
    tzOffsetHours: tzOffsetHours,
    compute: compute,
    fmt: fmt,
    qibla: qibla,
    distanceKm: distanceKm
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AKNPrayer;
  }
  if (root) {
    root.AKNPrayer = AKNPrayer;
  }
})(typeof window !== 'undefined' ? window : this);

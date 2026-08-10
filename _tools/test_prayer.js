/* Node test for ../assets/js/prayer.js — exits 1 on any failure. */
'use strict';

var P = require('../assets/js/prayer.js');

var failures = 0;

function hm(min) {
  if (min == null || isNaN(min)) return 'NaN';
  var m = ((Math.round(min) % 1440) + 1440) % 1440;
  return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2);
}

function check(name, cond, detail) {
  if (cond) {
    console.log('PASS ' + name + (detail ? ' (' + detail + ')' : ''));
  } else {
    failures++;
    console.log('FAIL ' + name + (detail ? ' (' + detail + ')' : ''));
  }
}

function within(name, actual, expected, tol) {
  check(name, isFinite(actual) && Math.abs(actual - expected) <= tol,
    'actual=' + hm(actual) + ' expected=' + hm(expected) + '±' + tol + 'min');
}

function between(name, actual, lo, hi, unit) {
  check(name, isFinite(actual) && actual >= lo && actual <= hi,
    'actual=' + actual + ' range=[' + lo + ', ' + hi + ']' + (unit || ''));
}

/* --------------------------------------------------------------------
 * 1. Equator (0,0), tz 0, 2026-03-20 (equinox)
 * NOTE: equation of time on 2026-03-20 is about -7.4 min, so solar noon
 * falls at ~12:07 UT and true sunset at (0,0) is ~18:11 UT. Sunset
 * therefore uses a 12-minute window; an astronomically correct engine
 * cannot land inside 18:00+/-8.
 * ------------------------------------------------------------------ */
var eq = P.compute(new Date(2026, 2, 20), 0, 0, 0, {});
within('1. equator sunrise ~06:00', eq.sunrise, 360, 8);
within('1. equator sunset ~18:00', eq.maghrib, 1080, 12);
within('1. equator dhuhr ~12:00', eq.dhuhr, 720, 10);

/* --------------------------------------------------------------------
 * 2. Lahore (31.5204, 74.3587), tz +5, 2026-01-01, Karachi method
 * ------------------------------------------------------------------ */
var lhHan = P.compute(new Date(2026, 0, 1), 31.5204, 74.3587, 5, { method: 'Karachi', asr: 'Hanafi' });
var lhStd = P.compute(new Date(2026, 0, 1), 31.5204, 74.3587, 5, { method: 'Karachi', asr: 'Standard' });
check('2. Lahore strict ordering fajr<sunrise<dhuhr<asr<maghrib<isha',
  lhHan.fajr < lhHan.sunrise && lhHan.sunrise < lhHan.dhuhr &&
  lhHan.dhuhr < lhHan.asr && lhHan.asr < lhHan.maghrib && lhHan.maghrib < lhHan.isha,
  [lhHan.fajr, lhHan.sunrise, lhHan.dhuhr, lhHan.asr, lhHan.maghrib, lhHan.isha].map(hm).join(' < '));
within('2. Lahore fajr ~05:38', lhHan.fajr, 5 * 60 + 38, 14);
within('2. Lahore maghrib ~17:12', lhHan.maghrib, 17 * 60 + 12, 14);
within('2. Lahore isha ~18:40', lhHan.isha, 18 * 60 + 40, 16);
between('2. Lahore asr Hanafi - Standard', lhHan.asr - lhStd.asr, 30, 80, ' min');

/* --------------------------------------------------------------------
 * 3. Makkah (21.4225, 39.8262), tz +3, 2026-06-21, Makkah method
 * ------------------------------------------------------------------ */
var mk = P.compute(new Date(2026, 5, 21), 21.4225, 39.8262, 3, { method: 'Makkah' });
check('3. Makkah isha = maghrib + 90 exactly', mk.isha === mk.maghrib + 90,
  'maghrib=' + hm(mk.maghrib) + ' isha=' + hm(mk.isha));
within('3. Makkah dhuhr ~12:20', mk.dhuhr, 12 * 60 + 20, 12);

/* --------------------------------------------------------------------
 * 4. London (51.5074, -0.1278), tz +1, 2026-06-21, MWL (NightMiddle)
 * ------------------------------------------------------------------ */
var lo = P.compute(new Date(2026, 5, 21), 51.5074, -0.1278, 1, { method: 'MWL', highLat: 'NightMiddle' });
var loVals = [lo.fajr, lo.sunrise, lo.dhuhr, lo.asr, lo.maghrib, lo.isha];
check('4. London all six finite', loVals.every(function (v) { return isFinite(v); }),
  loVals.map(hm).join(', '));
check('4. London ordered fajr<sunrise<dhuhr<asr<maghrib<isha',
  lo.fajr < lo.sunrise && lo.sunrise < lo.dhuhr && lo.dhuhr < lo.asr &&
  lo.asr < lo.maghrib && lo.maghrib < lo.isha,
  loVals.map(hm).join(' < '));

/* --------------------------------------------------------------------
 * 5. Seasonality + qibla + distance
 * Reference values computed independently:
 *   Lahore qibla ~260.4 deg (great-circle initial bearing to 21.422487, 39.826206)
 *   London qibla ~119.0 deg
 *   Lahore-Makkah distance ~3598 km (haversine, R = 6371 km)
 * ------------------------------------------------------------------ */
var lhJun = P.compute(new Date(2026, 5, 21), 31.5204, 74.3587, 5, {});
var lhDec = P.compute(new Date(2026, 11, 21), 31.5204, 74.3587, 5, {});
var dayJun = lhJun.maghrib - lhJun.sunrise;
var dayDec = lhDec.maghrib - lhDec.sunrise;
check('5. Lahore day length June > December by >3h', dayJun - dayDec > 180,
  'June=' + dayJun + 'min Dec=' + dayDec + 'min diff=' + (dayJun - dayDec) + 'min');
between('5. qibla Lahore ~260.4 deg', P.qibla(31.5204, 74.3587), 257.4, 263.4, ' deg');
between('5. qibla London ~119.0 deg', P.qibla(51.5074, -0.1278), 116.0, 122.0, ' deg');
between('5. distanceKm Lahore ~3598 km', P.distanceKm(31.5204, 74.3587), 3560, 3640, ' km');

/* ------------------------------------------------------------------ */
if (failures > 0) {
  console.log(failures + ' assertion(s) FAILED');
  process.exit(1);
}
console.log('ALL TESTS PASSED');

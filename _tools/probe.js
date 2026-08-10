// Functional probe: exercises the interactive tools headlessly and reports failures.
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const U = p => 'file:///' + path.join(ROOT, p).replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const fails = [];
  const errs = [];
  page.on('pageerror', e => errs.push(page.url().split('/').pop() + ': ' + e.message));

  async function check(name, fn) {
    try { const r = await fn(); if (r !== true) fails.push(name + ': ' + r); else console.log('OK', name); }
    catch (e) { fails.push(name + ': threw ' + e.message.slice(0, 140)); }
  }

  // Prayer times page
  await page.goto(U('prayer-times.html'), { waitUntil: 'networkidle' });
  await check('prayer: six times render', async () => {
    const n = await page.locator('.ptime .pt-time').count();
    const txt = await page.locator('.ptime .pt-time').allTextContents();
    return (n >= 6 && txt.filter(t => /\d/.test(t)).length >= 6) || ('only ' + n + ' tiles / ' + JSON.stringify(txt.slice(0, 3)));
  });
  await check('prayer: monthly table has ~30 rows', async () => {
    const rows = await page.locator('table tbody tr').count();
    return rows >= 28 || (rows + ' rows');
  });
  await check('prayer: city change updates times', async () => {
    const before = await page.locator('.ptime .pt-time').first().textContent();
    const sel = page.locator('select').first();
    await sel.selectOption({ index: 12 }); // London-ish
    await page.waitForTimeout(400);
    const after = await page.locator('.ptime .pt-time').first().textContent();
    return before !== after || ('unchanged: ' + before);
  });

  // Qibla
  await page.goto(U('qibla.html'), { waitUntil: 'networkidle' });
  await check('qibla: bearing shown', async () => {
    const t = await page.locator('.qibla-read').first().textContent();
    return /\d/.test(t || '') || ('no number in: ' + (t || '').slice(0, 60));
  });
  await check('qibla: needle svg present', async () => (await page.locator('.compass svg').count()) >= 1 || 'no svg');

  // Tasbeeh
  await page.goto(U('tasbeeh.html'), { waitUntil: 'networkidle' });
  await check('tasbeeh: tap increments', async () => {
    const btn = page.locator('.tas-count');
    await btn.click(); await btn.click(); await btn.click();
    const t = (await btn.textContent() || '').trim();
    return /3/.test(t) || ('count shows: ' + t.slice(0, 20));
  });
  await check('tasbeeh: dhikr select changes arabic', async () => {
    const ar1 = await page.locator('.tas-ar .ar').first().textContent();
    await page.locator('select').first().selectOption({ index: 4 });
    await page.waitForTimeout(300);
    const ar2 = await page.locator('.tas-ar .ar').first().textContent();
    return ar1 !== ar2 || 'unchanged';
  });

  // Duas
  await page.goto(U('duas.html'), { waitUntil: 'networkidle' });
  await check('duas: cards render', async () => (await page.locator('.dua').count()) >= 25 || ((await page.locator('.dua').count()) + ' cards'));
  await check('duas: category filter works', async () => {
    const all = await page.locator('.dua:visible').count();
    await page.locator('.pill').nth(1).click();
    await page.waitForTimeout(300);
    const filtered = await page.locator('.dua:visible').count();
    return (filtered > 0 && filtered < all) || (`all=${all} filtered=${filtered}`);
  });

  // Hadith
  await page.goto(U('hadith.html'), { waitUntil: 'networkidle' });
  await check('hadith: 20 cards', async () => (await page.locator('.dua, .card').count()) >= 20 || 'too few');

  // Names
  await page.goto(U('names.html'), { waitUntil: 'networkidle' });
  await check('names: 99 cards', async () => {
    const n = await page.locator('.name-card').count();
    return n === 99 || (n + ' cards');
  });

  // Zakat
  await page.goto(U('zakat.html'), { waitUntil: 'networkidle' });
  await check('zakat: computes 2.5%', async () => {
    const inputs = page.locator('.panel input[type="number"]');
    const n = await inputs.count();
    if (n < 3) return 'only ' + n + ' number inputs';
    // silver price then a cash amount — fill price first field, cash somewhere
    await inputs.nth(0).fill('40');            // per-gram price
    await inputs.nth(1).fill('1000000');       // first asset field
    await page.waitForTimeout(400);
    const t = await page.locator('.zk-total').textContent();
    return /25,?000|25000/.test(t || '') || ('total reads: ' + (t || '').replace(/\s+/g, ' ').slice(0, 120));
  });

  // UR spot probes
  await page.goto(U('ur/prayer-times.html'), { waitUntil: 'networkidle' });
  await check('ur prayer: times render', async () => {
    const txt = await page.locator('.ptime .pt-time').allTextContents();
    return txt.filter(t => /\d/.test(t)).length >= 6 || JSON.stringify(txt.slice(0, 3));
  });
  await page.goto(U('ur/duas.html'), { waitUntil: 'networkidle' });
  await check('ur duas: cards render with urdu', async () => {
    const n = await page.locator('.dua').count();
    const t = await page.locator('.dua').first().textContent();
    return (n >= 25 && /[؀-ۿ]/.test(t || '')) || (n + ' cards');
  });
  await page.goto(U('ur/tasbeeh.html'), { waitUntil: 'networkidle' });
  await check('ur tasbeeh: increments', async () => {
    const btn = page.locator('.tas-count');
    await btn.click();
    return /1/.test((await btn.textContent() || '')) || 'no count';
  });

  console.log('\n=== PAGE ERRORS ===');
  errs.forEach(e => console.log('ERR', e));
  console.log('\n=== FAILURES (' + fails.length + ') ===');
  fails.forEach(f => console.log('FAIL', f));
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})();

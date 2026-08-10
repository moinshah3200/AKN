// Screenshot pages of the AKN site at multiple viewports/themes.
// Usage: node shot.js [pageName ...]  (default: index.html)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html'];

(async () => {
  const browser = await chromium.launch();
  for (const pg of pages) {
    const file = path.join(ROOT, pg);
    if (!fs.existsSync(file)) { console.log('MISSING', pg); continue; }
    const url = 'file:///' + file.replace(/\\/g, '/');
    for (const [w, h, tag] of [[1440, 940, 'desktop'], [390, 844, 'mobile']]) {
      for (const theme of ['light', 'dark']) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        const errors = [];
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.evaluate(t => { localStorage.setItem('akn-theme', t); document.documentElement.setAttribute('data-theme', t); }, theme);
        await page.waitForTimeout(650);
        // force reveals visible for full-page shots
        await page.evaluate(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('in')));
        await page.waitForTimeout(250);
        const name = pg.replace(/[\\/]/g, '_').replace('.html', '') + `_${tag}_${theme}.png`;
        await page.screenshot({ path: path.join(OUT, name), fullPage: true });
        console.log('SHOT', name, errors.length ? ('CONSOLE_ERRORS: ' + errors.join(' | ').slice(0, 300)) : 'clean');
        await ctx.close();
      }
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });

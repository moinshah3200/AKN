const fs = require('fs');
const path = require('path');

const siteDir = path.resolve(__dirname, '..');
const rootFiles = fs.readdirSync(siteDir)
  .filter((name) => name.toLowerCase().endsWith('.html'))
  .map((name) => path.join(siteDir, name));
const urDir = path.join(siteDir, 'ur');
const urFiles = fs.readdirSync(urDir)
  .filter((name) => name.toLowerCase().endsWith('.html'))
  .map((name) => path.join(urDir, name));
const htmlFiles = [...rootFiles, ...urFiles].sort();

const externalScheme = /^[a-z][a-z0-9+.-]*:/i;
const tagPattern = /<(?!\/|!|\?)[a-z][^>]*>/giu;
const attrPattern = /\b(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu;
let total = 0;
let skipped = 0;
let internal = 0;
let ok = 0;
const broken = [];

for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const tagMatch of text.matchAll(tagPattern)) {
    const tag = tagMatch[0];
    for (const match of tag.matchAll(attrPattern)) {
      total += 1;
      const attr = match[1].toLowerCase();
      const raw = match[2] ?? match[3] ?? match[4] ?? '';
      const value = raw.replaceAll('&amp;', '&').trim();

      if (!value || value.startsWith('#') || value.startsWith('//') || externalScheme.test(value)) {
        skipped += 1;
        continue;
      }

      let pathname = value.split('#', 1)[0].split('?', 1)[0];
      if (!pathname) {
        skipped += 1;
        continue;
      }
      try { pathname = decodeURIComponent(pathname); } catch (_) { /* retain literal path */ }

      const target = pathname.startsWith('/')
        ? path.resolve(siteDir, `.${pathname}`)
        : path.resolve(path.dirname(file), pathname);
      internal += 1;
      const relativeTarget = path.relative(siteDir, target);
      const withinSite = relativeTarget === '' || (
        relativeTarget !== '..' &&
        !relativeTarget.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativeTarget)
      );

      if (withinSite && fs.existsSync(target)) {
        ok += 1;
      } else {
        const absoluteIndex = tagMatch.index + match.index;
        const line = text.slice(0, absoluteIndex).split(/\r?\n/).length;
        broken.push({
          file: path.relative(siteDir, file).replaceAll('\\', '/'),
          line,
          attr,
          raw,
          resolved: relativeTarget.replaceAll('\\', '/'),
        });
      }
    }
  }
}

console.log(`HTML files scanned: ${htmlFiles.length}`);
console.log(`href/src attributes: ${total}`);
console.log(`External, fragment-only, or empty references skipped: ${skipped}`);
console.log(`Internal references checked: ${internal}`);
console.log(`Internal references valid: ${ok}`);
console.log(`Broken internal references: ${broken.length}`);

if (broken.length) {
  console.log('\nBROKEN REFERENCES');
  for (const item of broken) {
    console.log(`- ${item.file}:${item.line} ${item.attr}="${item.raw}" -> ${item.resolved}`);
  }
} else {
  console.log('\nBROKEN REFERENCES: none');
}

process.exitCode = broken.length ? 1 : 0;

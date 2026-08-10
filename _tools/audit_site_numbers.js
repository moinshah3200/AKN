const fs = require('fs');
const path = require('path');

const toolsDir = __dirname;
const siteDir = path.resolve(toolsDir, '..');
const factsPath = path.join(siteDir, 'FACTS.md');

const rootFiles = fs.readdirSync(siteDir)
  .filter((name) => name.toLowerCase().endsWith('.html'))
  .map((name) => path.join(siteDir, name));
const urDir = path.join(siteDir, 'ur');
const urFiles = fs.readdirSync(urDir)
  .filter((name) => name.toLowerCase().endsWith('.html'))
  .map((name) => path.join(urDir, name));
const htmlFiles = [...rootFiles, ...urFiles].sort();

const facts = fs.readFileSync(factsPath, 'utf8');
const canonical = (value) => {
  const match = value.match(/\d(?:[\d,-]*\d)?(?:\.\d+)?/u);
  return match ? match[0].replaceAll(',', '').replaceAll('-', '') : '';
};
const factsNumbers = new Set();
for (const match of facts.matchAll(/\d(?:[\d,-]*\d)?(?:\.\d+)?/g)) {
  factsNumbers.add(canonical(match[0]));
}

const found = new Map();
const add = (raw, kind, file, index, text) => {
  const key = canonical(raw);
  if (!key) return;
  const before = text.slice(0, index);
  const line = before.split(/\r?\n/).length;
  const record = found.get(key) || { key, forms: new Set(), kinds: new Set(), hits: [] };
  record.forms.add(raw.trim());
  record.kinds.add(kind);
  record.hits.push(`${path.relative(siteDir, file).replaceAll('\\', '/')}:${line}`);
  found.set(key, record);
};

for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const occupied = [];

  const priorityPatterns = [
    ['currency', /(?:₨|Rs\.?)\s*\d[\d,]*(?:\.\d+)?/giu],
    ['phone', /(?<![\p{L}\p{N}])(?:\+?92[-\s]?)?0?3\d{2}[-\s]?\d{7}(?![\p{L}\p{N}])/gu],
  ];

  for (const [kind, pattern] of priorityPatterns) {
    for (const match of text.matchAll(pattern)) {
      add(match[0], kind, file, match.index, text);
      occupied.push([match.index, match.index + match[0].length]);
    }
  }

  const largeNumber = /(?<![\p{L}\p{N}.])\d(?:[\d,]*\d)?(?:\.\d+)?(?![\p{L}\p{N}.])/gu;
  for (const match of text.matchAll(largeNumber)) {
    const start = match.index;
    const end = start + match[0].length;
    if (occupied.some(([a, b]) => start < b && end > a)) continue;
    const numericValue = Number(match[0].replaceAll(',', ''));
    if (!Number.isFinite(numericValue) || Math.abs(numericValue) < 100) continue;
    add(match[0], 'large', file, start, text);
  }
}

const records = [...found.values()]
  .map((record) => ({
    canonical: record.key,
    forms: [...record.forms].sort(),
    kinds: [...record.kinds].sort(),
    inFacts: factsNumbers.has(record.key),
    hits: [...new Set(record.hits)].sort(),
  }))
  .sort((a, b) => Number(a.canonical) - Number(b.canonical) || a.canonical.localeCompare(b.canonical));

const missing = records.filter((record) => !record.inFacts);
console.log(`HTML files scanned: ${htmlFiles.length}`);
console.log(`Unique currency/large-number values: ${records.length}`);
console.log(`Values present in FACTS.md: ${records.length - missing.length}`);
console.log(`Values absent from FACTS.md: ${missing.length}`);

if (missing.length) {
  console.log('\nABSENT FROM FACTS.md');
  for (const record of missing) {
    console.log(`- ${record.forms.join(' | ')} [${record.kinds.join(', ')}] - ${record.hits.join(', ')}`);
  }
} else {
  console.log('\nABSENT FROM FACTS.md: none');
}

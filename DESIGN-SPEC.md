# AKN site — build spec for page agents

Read this WHOLE file, then `FACTS.md`, then open `index.html` (the exemplar) before writing any page.
`index.html` is the canonical reference for head boilerplate, header, footer, icons and section
rhythm — **copy its structures verbatim** and change only what each page needs.

## Files & URLs (flat, both trees)

```
/                       EN pages: index about departments medical-center impact donate contact
                        prayer-times qibla tasbeeh duas hadith names zakat   (.html)
/ur/                    UR mirror — SAME filenames
/assets/css/fonts.css   style.css
/assets/js/main.js  prayer.js  data/{duas,hadith,names,tasbeeh}.data.js
/assets/img/*.jpg  favicon.svg  icon-192.png  icon-512.png
/manifest.json  /sw.js
```

- EN pages reference `assets/...`, `manifest.json`; UR pages reference `../assets/...`,
  `../manifest.json`, and set `<html lang="ur" dir="rtl">` + `data-sw="../sw.js"` on `<html>`.
- Language toggle: EN page `x.html` → `ur/x.html`; UR page → `../x.html` (label `English`,
  the EN label styled plain — keep the `.lang-link` component).
- Every page: `<link rel="alternate" hreflang="...">` pair, favicon, manifest, fonts.css,
  style.css, the theme pre-paint `<script>` from index.html VERBATIM, `theme-color` meta.
- Scripts at body end, all `defer`: page-specific data files → `prayer.js` (only pages that
  need it) → `main.js`. `window.AKN_L10N` inline BEFORE them (copy shape from index.html;
  translate values on UR pages).

## Header / footer

Copy from `index.html`. Per page change ONLY:
1. `aria-current="page"` — move to this page's link (nav, tools menu when applicable, sheet).
2. `.lang-link` href → this page's twin.
3. On UR pages translate visible labels (nav: مرکزی صفحہ، تعارف، شعبہ جات، میڈیکل سینٹر،
   کارکردگی، عطیات، رابطہ; tools: اوقاتِ نماز، سمتِ قبلہ، تسبیحات، دعائیں، احادیث، اسماء الحسنیٰ،
   زکوٰۃ کیلکولیٹر; buttons: عطیہ کریں; skip link: مواد پر جائیں) and brand
   sub-line (`انوار ختم نبوت ٹرسٹ`) — brand `b` stays "AKN Trust" inside `.en-inline` on UR pages.
4. Footer link labels likewise; addresses in Urdu on UR pages
   (مرکز: چناب نگر (محلہ نصرت آباد) ضلع چنیوٹ، پنجاب / 55-غنی سٹریٹ راجگڑھ لاہور).

## Design language (already in style.css — use, don't reinvent)

Sections alternate `.section` / `.section-alt`; navy accents via `.section-navy`; every content
page starts with `.page-hero` (kicker + h1 + lead). Reveal animation: add `.reveal`
(+ `.reveal-d1/2/3` stagger) to cards/blocks. Components: `.card .card-img .card-body .ic-badge`,
`.stat`, `.rate`, `.split`, `.figrow`, `.table-wrap table`, `.chip`, `.btn btn-gold|btn-green|btn-ghost`,
`.motto`, `.orn`, `.cta-band`, `.panel`, `.fields .field`, `.seg`, `.pill-row .pill`, `.dua`,
`.name-card`, `.grid grid-2|3|4|grid-names`, `.list-check`, `.tool-hero .tool-shell`,
`.pattern-star` overlay, `.wave` divider. Icons: inline SVG, stroke 1.6–1.8, `currentColor`,
copy exact ones from index.html where they exist.
Arabic text: wrap in `<span class="ar" lang="ar" dir="rtl">`. Urdu inside EN pages: `.ur` + `lang="ur" dir="rtl"`.

## Image manifest (assets/img/) — use these, with honest alt text

| File | Shows | Use on |
|---|---|---|
| medical-render.jpg | Rafiq Medical Center 3D render | home (used), medical-center hero |
| build-foundation.jpg / build-bricklayer.jpg | early construction "before" | medical-center |
| build-shell.jpg / build-progress.jpg / build-street.jpg | structure rising "after" | medical-center, donate |
| founder-speech.jpg | leadership address at podium | about |
| dept-dawah.jpg · dept-acceptance.jpg | da'wah gatherings | departments#dawah, about |
| dept-ration.jpg · ration-sacks.jpg · relief-distribution.jpg | ration work | departments#ration, impact |
| dept-stipend.jpg · stipend-cash.jpg | stipend distribution | departments#stipends |
| dept-employment.jpg | rickshaw key handover | departments#employment |
| dept-handpump.jpg · dept-well.jpg · water-hands.jpg · pump-drilling.jpg | water works | departments#water, impact |
| dept-quran-school.jpg · dept-quran-class.jpg · kids-school.jpg | education | departments#quranic-schools, #education |
| dept-marriage.jpg | nikah signing | departments#marriage |
| dept-darul-kafalah.jpg | Darul Kafalah building | departments#darul-kafalah |
| dept-modern-edu.jpg | technical classroom | departments#education |
| dept-home-build.jpg · dept-home-repair.jpg | housing | departments#housing |
| dept-courses.jpg | course session | departments#courses |
| dept-broadcast.jpg | magazine covers | departments#broadcasting |
| dept-treatment.jpg | doctor & stethoscope | departments#medical aid mentions |
| dept-qurbani.jpg | qurbani animals | impact (qurbani row context) |
| dept-eid.jpg · dept-iftar.jpg · food-dist.jpg · wheat.jpg | seasonal programmes | impact, departments |
| relief-mountain.jpg · relief-gaza.jpg · relief-camp.jpg | flood/Gaza relief — **LOW RES (~220–400px): use only as small figures (max ~260px wide) or omit; never full-width** | impact#flood-relief |
| sky-rays.jpg | sunrise sky | optional soft banner |
| quran-book.jpg | Quran (small) | minor use only |
| gen-pattern.jpg | emerald/gold girih art (GENERATED) | page-hero backgrounds, navy bands |
| gen-kaaba.jpg (GENERATED) | the Kaaba | qibla page |
| gen-mosque-dusk.jpg (GENERATED) | mosque at maghrib | prayer-times page |
| gen-tasbeeh.jpg (GENERATED) | misbaha beads macro | tasbeeh page |
| gen-quran.jpg (GENERATED) | mushaf on rehal | duas + hadith pages |

Generated images: caption/alt as illustrative imagery, never as photos of AKN's own projects.
PDF photos: alt describes the real activity (they ARE the Trust's photos).

**LOW-RES images — never render wider than ~280px (thumbnails/figrow only), never as a split or
hero image:** dept-broadcast, dept-eid, dept-iftar, dept-qurbani, dept-treatment, food-dist,
kids-school, pump-drilling, quran-book, ration-sacks, relief-camp, relief-distribution,
relief-gaza, relief-mountain, stipend-cash, water-hands, wheat.
**Full-size safe (splits/cards/heroes):** medical-render, sky-rays, build-*, founder-speech,
dept-dawah, dept-ration, dept-stipend, dept-employment, dept-handpump, dept-well,
dept-quran-school, dept-quran-class, dept-marriage, dept-darul-kafalah, dept-modern-edu,
dept-home-build, dept-home-repair, dept-courses, dept-acceptance, gen-*.

## JS contracts

`window.AKNPrayer`: `CITIES[{id,en,ur,lat,lng,tz}]` (first = Chenab Nagar default) ·
`METHODS` · `tzOffsetHours(tz, date)` · `compute(date,lat,lng,tzHours,{method,asr,highLat})`
→ `{fajr,sunrise,dhuhr,asr,maghrib,isha}` minutes · `fmt(min, lang)` · `qibla(lat,lng)` ·
`distanceKm(lat,lng)`.
Data globals: `AKN_DUAS {categories[{id,en,ur}], items[{cat,title_en,title_ur,ar,translit,en,ur,src_en,src_ur}]}` ·
`AKN_HADITH {items[{no,theme,ar,narrator_en,narrator_ur,en,ur,src_en,src_ur}]}` ·
`AKN_NAMES {items[{n,ar,translit,en,ur}]}` ·
`AKN_TASBEEH {items[{id,ar,translit,en,ur,target,virtue_en,virtue_ur,src}]}`.
`localStorage` keys: `akn-theme`, `akn-city` (city id JSON string), `akn-tasbeeh` (page's own).

## Page specs (EN; UR mirrors the same structure in Urdu)

Content pages (page-hero → sections; use FACTS.md wording faithfully):

- **about.html** — hero "About the Trust". Sections: Introduction (est. 11/09/2013, founders,
  purpose — split with founder-speech.jpg); What we defend & why (khatm-e-nabuwat mission in
  the Trust's framing + kifalat of new Muslims); Where we work (markaz Chenab Nagar, Lahore
  office, Sindh/Punjab reach); Report of Acceptance of Islam (stats: hundreds, 4 murabbis +
  1 mufti, 350+, 50 in 2025 — stat tiles + dept-acceptance.jpg); Media & publications
  (magazine, AKN63Channel, dept-broadcast.jpg); motto band; CTA donate.
- **departments.html** — hero "Thirteen departments of service". A `.grid grid-3` index of
  anchor cards at top, then one `.split` section per department (alternate image side via
  order, `id=` anchors: dawah, ration, stipends, employment, water, quranic-schools, marriage,
  darul-kafalah, education, housing, courses, broadcasting, acceptance) — each with photo,
  the FACTS description, key numbers as `.chip`s. End: donate CTA band.
- **medical-center.html** — hero w/ medical-render.jpg (arch-frame). Sections: the need +
  facilities (`.list-check` of 6 departments + ambulance); construction progress —
  before/after `.figrow` (build-foundation/build-bricklayer vs build-progress/build-shell) +
  chips (started 2025 · plinth ₨ 1,25,00,000 · est. ₨ 5,00,00,000); Sponsor-the-build: 6
  `.rate` cards (all six units from FACTS); how to give (phones, home collection); CTA.
- **impact.html** — hero "Impact 2025". Big stat tiles row; full 2025 services `.table-wrap`
  table (Service | Amount ₨ | Detail — every FACTS row, amounts `td.num`); Qurbani highlight;
  `id="flood-relief"` section: table of 6 relief rows + district chips list + relief photos
  `.figrow`; note-worthy photos; CTA.
- **donate.html** — hero "Give with trust". Ways to give (home collection cash/cheque, phones,
  banks note per FACTS — NO invented account numbers); What your giving becomes (rate cards:
  ₨ 6,000 family ration package + the 6 medical build units); Zakat guidance blurb + link
  zakat.html; medical build feature; big CTA band with both phones + WhatsApp links.
- **contact.html** — hero "Contact us". `.grid grid-2`: contact card (phones as tel: links,
  WhatsApp buttons wa.me/923048012789 & /923134356695, both addresses w/ icons) + a `.panel`
  "Visit or write" describing markaz + Lahore office; media row (magazine + AKN63Channel);
  full-width CTA. No contact form (no backend) — say replies come via phone/WhatsApp.

Tool pages (structure: `.tool-hero` (kicker/h1/lead) → `.tool-shell` panels; each opens with
its generated header image inside `.arch-frame` at reduced height (`style="--r-l:22px"` fine),
then the app panel):

- **prayer-times.html** — Panel 1 controls: `.fields` city `<select>` (AKNPrayer.CITIES,
  saved to `akn-city`), "Use my location" `.btn btn-ghost` (geolocation → nearest city by
  distance OR raw coords labelled "My location"), method select (METHODS labels), Asr `.seg`
  Standard/Hanafi (default Hanafi), date `<input type="date">` default today. Panel 2: today
  grid — six `.ptime` tiles (reuse markup) + hijri line `[data-hijri]`. Panel 3: monthly
  table (`.table-wrap`, rows = each day of selected month, columns Fajr…Isha, today's row
  highlighted via inline `style="background:var(--green-ghost)"`). All client-computed, no
  network. Cache selection in localStorage. Note methods used (University of Islamic Sciences
  Karachi default).
- **qibla.html** — Panel 1: location (same city select + geolocation). Panel 2 `.compass`:
  inline SVG compass rose (circle, N/E/S/W ticks, gold needle group `.needle`, small Kaaba
  glyph at needle tip) rotated to bearing; `.qibla-read` "Qibla is **X°** from North ·
  distance Y km"; on devices with orientation, a "Live compass" `.btn` requesting
  `DeviceOrientationEvent.requestPermission` (iOS) then rotating needle by
  `bearing - heading` (webkitCompassHeading fallback `360-alpha`); graceful message when
  unsupported. Panel 3: gen-kaaba.jpg + one-line adab note.
- **tasbeeh.html** — Panel 1: dhikr select from AKN_TASBEEH (shows `.tas-ar` Arabic +
  translit + meaning + virtue small). Panel 2: `.tas-count` big circle button (count),
  `<small>` target progress `12 / 33`; `.tas-meta` today total · lifetime total;
  `.tas-actions` reset-count / reset-all `.btn btn-ghost` (confirm via double-press pattern:
  first press arms "Press again to confirm"), vibrate(12) each tap when supported; counts in
  `localStorage 'akn-tasbeeh'` `{[id]:{count,today,date,life}}`; target reached → brief
  `.chip chip-gold` "Set complete — SubhanAllah" + auto-advance count to 0 keeping laps.
  Keyboard: Space/Enter increments (button element). Panel 3: gen-tasbeeh.jpg strip.
- **duas.html** — `.pill-row` category filters (All + 8 categories from data, aria-pressed) →
  `.dua .card` list: title h3, `.ar`, `.translit`, `.dua-tr` EN (UR page: `.ur` Urdu), `.src`
  chip. Render via JS from AKN_DUAS; no-JS fallback `<noscript>` note.
- **hadith.html** — same pattern, theme pills (All/service/khatm/iman/character/mercy/
  knowledge/charity with proper labels); each `.dua`-style card: number chip, `.ar`, EN
  (or UR), narrator + `.src`.
- **names.html** — intro + `.grid grid-names` of 99 `.name-card`s from AKN_NAMES (`.nn`
  number, `.ar`, translit b, meaning span). Static render via JS.
- **zakat.html** — Panel 1: nisab basis `.seg` (Gold 87.48 g / Silver 612.36 g — default
  Silver with note that most scholars advise silver as safer for giving), per-gram price
  inputs (placeholder ₨, no fabricated live price), assets fields (cash, bank, gold value,
  silver value, business stock, receivables), liabilities field; Panel 2 `.zk-total`:
  "Zakatable wealth ₨ X · Nisab ₨ Y → Zakat due (2.5%): **₨ Z**" or "below nisab" state;
  `.zk-note` method note + "consult a scholar for unusual cases". All computed client-side
  on input. CTA: give your zakat → donate.html + phones.

## UR tree — extra rules

Fully translate ALL copy (headings, leads, buttons, alts, table headers, chips, notes,
`<title>`/meta description). Keep: brand "AKN Trust" (in `.en-inline`), "AKN63Channel",
phone digits, ₨ amounts and Western numerals, `wa.me` links. Use FACTS.md Urdu terminology.
`AKN_L10N` values in Urdu (prayers: فجر، طلوعِ آفتاب، ظہر، عصر، مغرب، عشاء; inLabel:' ',
h:' گھنٹے ', m:' منٹ'). Tables keep `dir="rtl"` naturally — `.num` cells stay Western digits.
Dates dd/mm/yyyy. Tone: فلاحی، باوقار.

## QA checklist (self-check before finishing a page)

1. Valid HTML5, one `<h1>`, landmarks, unique title + meta description.
2. Every internal href resolves to a file in the map above; assets prefix correct for tree.
3. aria-current set; lang toggle points at the twin; alternate links correct.
4. All images: real files from the manifest, honest alt, `loading="lazy"` except first hero.
5. Interactive: keyboard operable, labels on all fields, aria-pressed on pills/segs.
6. `.reveal` used tastefully; nothing hidden without JS (data-rendered lists get noscript note).
7. No invented facts, no Lorem, no external URLs except tel:/wa.me. UK English.

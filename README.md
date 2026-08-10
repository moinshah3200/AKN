# AKN Trust — Anwar Khatm-e-Nabuwat Trust Pakistan

Bilingual (English + اردو RTL) website for Anwar Khatm-e-Nabuwat Trust Pakistan — welfare,
education and support of new Muslims across Pakistan, and the Rafiq Medical Center project
in Chenab Nagar.

**ایک نئی امید — A New Hope**

## Structure

- `index.html` … 14 English pages (site root)
- `ur/` … complete Urdu mirror, same filenames, RTL Nastaliq typography
- Tools: prayer times (self-contained astronomical engine), qibla compass, tasbeeh counter,
  duas, hadith, 99 Names, zakat calculator — all offline-capable, no external services
- `assets/` … self-hosted fonts (Marcellus, Manrope, Amiri, Noto Nastaliq Urdu), images, CSS, JS
- `FACTS.md` … single source of truth for every fact on the site (extracted + verified from the
  Trust's profile PDF); `DESIGN-SPEC.md` … build contract for the design system
- `_tools/` … audit scripts (`audit_links.js`, `audit_site_numbers.js`, `test_prayer.js`,
  `shot.js` screenshots, `probe.js` functional tests)

## Running

Static site — open `index.html` directly, or serve the folder with any web server.
No build step, no dependencies. PWA manifest + service worker included (https only).

## Verification state

- Prayer engine: 16/16 astronomical tests pass (`node _tools/test_prayer.js`)
- Links: 1,618 internal references, 0 broken (`node _tools/audit_links.js`)
- All facts verified against the Trust's profile document

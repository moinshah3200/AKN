# -*- coding: utf-8 -*-
"""Mirror the four site fonts from Google Fonts as self-hosted woff2 + a local fonts.css.
Keeps every unicode-range subset so Arabic, Urdu and Latin all render offline."""

import os, re, urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
FAMS = [
    "family=Marcellus",
    "family=Manrope:wght@400;500;600;700;800",
    "family=Amiri:ital,wght@0,400;0,700;1,400",
    "family=Noto+Nastaliq+Urdu:wght@400;500;600;700",
]
URL = "https://fonts.googleapis.com/css2?" + "&".join(FAMS) + "&display=swap"

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.normpath(os.path.join(HERE, "..", "assets", "fonts"))
os.makedirs(FONTS, exist_ok=True)

req = urllib.request.Request(URL, headers={"User-Agent": UA})
css = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

n = 0
def repl(m):
    global n
    url = m.group(1)
    n += 1
    base = re.sub(r"[^A-Za-z0-9]+", "", url.split("/")[-2] if url.endswith("/") else url.split("/")[-1].split(".")[0])
    name = "f%03d_%s.woff2" % (n, base[:40])
    dest = os.path.join(FONTS, name)
    if not os.path.exists(dest):
        r2 = urllib.request.Request(url, headers={"User-Agent": UA})
        with open(dest, "wb") as f:
            f.write(urllib.request.urlopen(r2, timeout=30).read())
    return "url('../fonts/%s')" % name

css2 = re.sub(r"url\((https://[^)]+)\)", repl, css)
out = os.path.normpath(os.path.join(HERE, "..", "assets", "css", "fonts.css"))
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    f.write("/* Self-hosted mirror of Google Fonts: Marcellus, Manrope, Amiri, Noto Nastaliq Urdu */\n" + css2)
print("fonts downloaded:", n)
print("fonts.css bytes:", os.path.getsize(out))
total = sum(os.path.getsize(os.path.join(FONTS, f)) for f in os.listdir(FONTS))
print("fonts dir KB:", total // 1024)

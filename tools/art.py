"""Build the claude.ai artifact copy of Connect in ../shpc-art next to the repo, or $SHPC_ART (GitHub Pages uses the repo as is).

An artifact version holds at most 512 files, so both apps' images ship as bundles (tools/pack.py).
  python3 tools/art.py
"""
import json, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from pack import transform, write_packs, IMG

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('SHPC_ART') or os.path.join(os.path.dirname(ROOT), 'shpc-art')
SERVED = set('htm html css cjs js jsx mjs wasm csv cts geojson json map md mts ts tsx txt webmanifest xml avif gif ico jpeg jpg png svg webp otf ttf woff woff2 mp3 mp4 ogg wav webm pdf'.split())
LANDING_KEEP = {'pitch/assets/home2.webp', 'pitch/assets/vl/imagine.webp', 'pitch/assets/icon-192.png', 'recruit/a_470ace19f4f41e262a08af30291d0034.webp', 'recruit/icon.png', 'connect/bg.webp'}
PACK_MAX = 7_000_000


def files_under(d):
    for dp, _, fs in os.walk(d):
        for f in fs:
            yield os.path.relpath(os.path.join(dp, f), d)


def copy(rel):
    s, t = os.path.join(ROOT, rel), os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(t), exist_ok=True); shutil.copy2(s, t)


def split(groups, base):
    """{name: [files]} -> {name or name-2: [files]} with each pack under PACK_MAX bytes"""
    out = {}
    for g, fs in groups.items():
        part, size, n = [], 0, 1
        for f in sorted(fs):
            sz = os.path.getsize(os.path.join(base, f)) * 4 // 3
            if part and size + sz > PACK_MAX:
                out[g if n == 1 else '%s-%d' % (g, n)] = part; part, size, n = [], 0, n + 1
            part.append(f); size += sz
        if part: out[g if n == 1 else '%s-%d' % (g, n)] = part
    return out


def app(name, prefix_js, prefix_re, groups, first, strip=()):
    base = os.path.join(ROOT, name)
    packed = {f for fs in groups.values() for f in fs}
    packs = split(groups, base)
    pmap = {f: p for p, fs in packs.items() for f in fs}
    first = [p for p in packs if p.split('-')[0] in first]
    html = open(os.path.join(base, 'index.html'), encoding='utf-8').read()
    for s in strip:
        html = html.replace(s, '')
    ver = str(int(os.path.getmtime(os.path.join(base, 'index.html'))))
    html = transform(html, pmap, prefix_re, first, ver, prefix_js)
    os.makedirs(os.path.join(OUT, name), exist_ok=True)
    open(os.path.join(OUT, name, 'index.html'), 'w', encoding='utf-8').write(html)
    write_packs(base, packs, os.path.join(OUT, name, 'packs'))
    for f in files_under(base):
        rel = name + '/' + f
        if f == 'index.html' or f.rsplit('.', 1)[-1].lower() not in SERVED:
            continue
        if f in packed and rel not in LANDING_KEEP:
            continue
        copy(rel)
    return len(packs)


def pitch():
    base = os.path.join(ROOT, 'pitch')
    groups = {}
    for f in files_under(base):
        if not f.startswith('assets/') or not f.lower().endswith(IMG) or f.startswith(('assets/emu/', 'assets/tour/', 'assets/seq/')):
            continue
        parts = f.split('/')
        g = parts[1] if len(parts) > 2 else 'root'
        if f in ('assets/favicon-32.png', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/og.jpg'):
            continue
        groups.setdefault(g, []).append(f)
    return app('pitch', 'assets/', r'assets/[^"\']*', groups, ['cat', 'tiles', 'icons', 'root'])


def recruit():
    base = os.path.join(ROOT, 'recruit')
    rx = re.compile(r'^(?:am|img|a)_[0-9a-f]{32}\.(?:webp|png|jpg|jpeg)$')
    imgs = {f for f in files_under(base) if rx.match(f)}
    groups, left = {}, set(imgs)
    for b in ['Main', 'Why-Vivint', 'Experience', 'Opportunity', 'FAQs', 'Recruiting-Guide']:
        p = os.path.join(base, 'boards_%s.json' % b)
        if not os.path.exists(p):
            continue
        t = open(p, encoding='utf-8').read()
        hit = {f for f in left if f in t or f.replace('am_', 'a_', 1) in t or f.replace('am_', 'img_', 1) in t}
        if hit:
            groups[b.lower()] = sorted(hit); left -= hit
    if left:
        groups['misc'] = sorted(left)
    sw = re.search(r"<script>if \('serviceWorker' in navigator\).*?</script>\n", open(os.path.join(base, 'index.html'), encoding='utf-8').read())
    return app('recruit', r'(?<![\w])(?:am|img|a)_[0-9a-f]{32}\.(?:webp|png|jpg|jpeg)', r'(?:am|img|a)_[0-9a-f]{32}\.(?:webp|png|jpg|jpeg)[^"\']*',
               groups, ['main'], strip=[sw.group(0)] if sw else [])


if __name__ == '__main__':
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    for f in ['index.html', 'dock.js', 'screens.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png']:
        copy(f)
    np, nr = pitch(), recruit()
    for f in LANDING_KEEP | {'pitch/assets/fonts/' + x for x in os.listdir(os.path.join(ROOT, 'pitch/assets/fonts'))}:
        if os.path.exists(os.path.join(ROOT, f)):
            copy(f)
    n = sum(1 for _ in files_under(OUT))
    print('artifact files:', n, '(pitch packs %d, recruit packs %d)' % (np, nr))
    assert n <= 500, 'too many files for one artifact version'

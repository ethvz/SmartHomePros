"""Pack form for the claude.ai artifact (an artifact version holds at most 512 files).

Images are bundled into packs/<app>-<group>.json ({files: {path: [mime, base64]}}); a small loader injected at the top of
the page resolves every image URL the app sets (src, poster, inline style, innerHTML, fetch) to a blob URL from its bundle.
Static <img src> in the page's markup waits in data-pk-src until its bundle has arrived. Videos, fonts, JSON, CSS and
scripts stay as plain files. GitHub Pages serves the normal form, unpacked.
"""
import base64, json, mimetypes, os, re

LOADER = open(os.path.join(os.path.dirname(__file__), 'pack_loader.js')).read()
IMG = ('.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg')


def split_scripts(s):
    """yield (is_script, chunk)"""
    pos = 0
    for m in re.finditer(r'<script\b[^>]*>.*?</script>', s, re.S):
        yield False, s[pos:m.start()]; yield True, m.group(0); pos = m.end()
    yield False, s[pos:]


def transform(html, packmap, prefix_re, first, ver, prefix_js):
    """prefix_re: regex for the asset url part (e.g. assets/[^"']* or (?:a|am|img)_[^"']*)"""
    out = []
    for is_s, ch in split_scripts(html):
        if not is_s:
            ch = re.sub(r'img\[src\*="([^"]+)"\]', r'img:is([src*="\1"],[data-pk-o-src*="\1"])', ch)
            def rep(m):
                a, q, u = m.group(1), m.group(2), m.group(3); k = u.split('?')[0].split('#')[0]
                return 'data-pk-%s=%s%s%s data-pk-o-%s=%s%s%s' % (a, q, u, q, a, q, u, q) if k in packmap else m.group(0)
            ch = re.sub(r'(?<![\w-])(src|poster)=(["\'])(' + prefix_re + r')\2', rep, ch)
        out.append(ch)
    s = ''.join(out)
    inj = ('<script>window.PK_MAP=%s;window.PK_FIRST=%s;window.PK_V=%s;window.PK_PREFIX=%s;</script>\n<script>%s</script>\n'
           % (json.dumps(packmap, separators=(',', ':')), json.dumps(first), json.dumps(ver), json.dumps(prefix_js), LOADER))
    return s.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + inj, 1)


def write_packs(root, files_by_pack, outdir):
    os.makedirs(outdir, exist_ok=True)
    for p, fs in files_by_pack.items():
        j = {'files': {}}
        for f in fs:
            t = mimetypes.guess_type(f)[0] or ('image/webp' if f.endswith('.webp') else 'application/octet-stream')
            j['files'][f] = [t, base64.b64encode(open(os.path.join(root, f), 'rb').read()).decode()]
        json.dump(j, open(os.path.join(outdir, p + '.json'), 'w'), separators=(',', ':'))

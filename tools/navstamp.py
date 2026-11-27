"""Stamp the shared navigation's content version into the pages that load it, so browsers and the Fast Pitch offline
helper (cache-first by exact URL) pick up every change to nav/shpnav.css / nav/shpnav.js.

  python3 tools/navstamp.py        rewrite nav/shpnav.(css|js)?v=... in index.html and pitch/index.html (only when it changed)

Runs automatically from `tools/artifact-sync.sh build` and `tools/build.py`. Fast Recruit gets the same version from
tools/build.py patch_recruit(). The edit is a version string only (exact pattern, nothing else in those files is touched)."""
import hashlib, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ('nav/shpnav.css', 'nav/shpnav.js')
PAGES = ('index.html', 'pitch/index.html')
PAT = re.compile(r'(nav/shpnav\.(?:css|js))\?v=[0-9A-Za-z]+')


def ver():
    h = hashlib.sha1()
    for f in FILES:
        h.update(open(os.path.join(ROOT, f), 'rb').read())
    return h.hexdigest()[:8]


def stamp():
    v = ver()
    for rel in PAGES:
        p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
        n = len(PAT.findall(s))
        assert n == 2, 'navstamp: expected the css + js include in %s, found %d' % (rel, n)
        t = PAT.sub(lambda m: m.group(1) + '?v=' + v, s)
        if t != s:
            open(p, 'w', encoding='utf-8').write(t)
    return v


if __name__ == '__main__':
    print('nav version', stamp())

"""SmartHomePros Connect build.

  python3 tools/build.py            refresh recruit/ from the Fast Recruit working copy, then patch both apps
  python3 tools/build.py --pitch    also re-copy pitch/ from a Fast Pitch checkout (only for the first import:
                                    pitch/ is Fast Pitch's home now, edit it in place)

Patches (all idempotent, applied on every run):
  * both apps use the Connect manifest and icon, so "Add to Home Screen" from anywhere installs Connect
  * each app records itself as the last app used (the picker reopens it on launch)
  * a "Switch app" button in each app's menu goes back to the picker
  * the offline helpers only clear their own caches (they used to clear everything that wasn't theirs)
  * Fast Pitch's art-board edits live in fp_layout / fp_nav (Fast Recruit already uses layout / nav)
"""
import os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = '/home/claude/fast-recruit'
FP = sys.argv[sys.argv.index('--pitch') + 1] if '--pitch' in sys.argv and len(sys.argv) > sys.argv.index('--pitch') + 1 else '/tmp/fpchk'


def tracked(repo):
    return subprocess.run(['git', '-C', repo, 'ls-files'], capture_output=True, text=True, check=True).stdout.split('\n')


def copy_tree(src_repo, dst, skip):
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    for f in tracked(src_repo):
        if not f or any(f == s or f.startswith(s) for s in skip):
            continue
        d = os.path.join(dst, f)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copy2(os.path.join(src_repo, f), d)


def sub(s, old, new, label, count=1):
    if new in s:
        return s
    assert old in s, 'patch target missing: ' + label
    return s.replace(old, new, count)


TITLE = '<meta name="apple-mobile-web-app-title" content="SHP Connect">'


DOCK = '<script src="../dock.js" defer></script>\n'   # the shared editor dock (Edit layout + Screens)


def head_hook(app):
    return ("<script>window.SHPC = { app: '%s', picker: '../index.html?pick' }; try { localStorage.setItem('shpc_last', '%s'); } catch (e) {}\n"
            "document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-shpc-switch]')) { e.preventDefault(); e.stopPropagation(); location.href = window.SHPC.picker; } }, true);</script>\n" % (app, app))


GRID = ('<svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>')


def patch_recruit():
    p = os.path.join(ROOT, 'recruit/index.html'); s = open(p, encoding='utf-8').read()
    s = sub(s, '<link rel="manifest" href="manifest.webmanifest">', '<link rel="manifest" href="../manifest.webmanifest">', 'fr manifest')
    s = sub(s, '<link rel="apple-touch-icon" href="apple-touch-icon.png">', '<link rel="apple-touch-icon" href="../apple-touch-icon.png">', 'fr touch icon')
    s = sub(s, '<meta name="apple-mobile-web-app-title" content="Vivint Recruiting">', '<meta name="apple-mobile-web-app-title" content="SHP Connect">', 'fr title')
    if 'window.SHPC = {' not in s:
        s = s.replace(TITLE, TITLE + '\n' + head_hook('recruit'), 1)
    if 'dock.js' not in s:
        s = s.replace(TITLE, TITLE + '\n' + DOCK, 1)
    # menu: a full-width "Switch app" row above the menu's bottom buttons
    btn = ("'<div class=\"dw-foot\">' + (window.SHPC ? '<button type=\"button\" class=\"dw-u dw-app\" data-shpc-switch title=\"Switch app\" aria-label=\"Switch app\">"
           + GRID.replace('class="ic" width="20" height="20" ', '') + "<span>Switch app</span></button>' : '') + '<button type=\"button\" class=\"dw-u dw-social\"")
    s = sub(s, "'<div class=\"dw-foot\"><button type=\"button\" class=\"dw-u dw-social\"", btn, 'fr menu foot')
    if '.dw-foot .dw-app' not in s:
        s = s.replace('</style>', '  .dw-foot .dw-app { grid-column: 1 / -1; } .dw.short .dw-foot .dw-app span { display: inline; }   /* SmartHomePros Connect */\n</style>', 1)
    open(p, 'w', encoding='utf-8').write(s)
    p = os.path.join(ROOT, 'recruit/sw.js'); s = open(p).read()
    s = sub(s, 'ks.filter(k => k !== V && k !== MC && k !== META)', "ks.filter(k => k.startsWith('fast-recruit-') && k !== V)", 'fr sw caches')
    open(p, 'w').write(s)


def patch_pitch():
    p = os.path.join(ROOT, 'pitch/index.html'); s = open(p, encoding='utf-8').read()
    s = sub(s, '<link rel="manifest" href="manifest.webmanifest">', '<link rel="manifest" href="../manifest.webmanifest">', 'fp manifest')
    s = sub(s, '<link rel="apple-touch-icon" href="assets/icon-180.png">', '<link rel="apple-touch-icon" href="../apple-touch-icon.png">', 'fp touch icon')
    s = sub(s, '<meta name="apple-mobile-web-app-title" content="Fast Pitch 2027">', '<meta name="apple-mobile-web-app-title" content="SHP Connect">', 'fp title')
    if 'window.SHPC = {' not in s:
        s = s.replace(TITLE, TITLE + '\n' + head_hook('pitch'), 1)
    if 'dock.js' not in s:
        s = s.replace(TITLE, TITLE + '\n' + DOCK, 1)
    s = sub(s, "col=db.collection('layout');", "col=db.collection('fp_layout');", 'fp layout db')
    s = s.replace("db.collection('nav')", "db.collection('fp_nav')")
    s = sub(s, '<i id="dlBar"></i></button>', '<i id="dlBar"></i></button><button class="m2-dl m2-app" data-shpc-switch>' + GRID + '<span>Switch app</span></button>', 'fp menu foot')
    s = sub(s, '#drawer .m2-dl.done{', '#drawer .m2-f .m2-dl{margin-right:0}#drawer .m2-f .m2-app{margin-right:auto}#drawer .m2-app .ic{color:#fff}/* SmartHomePros Connect */\n#drawer .m2-dl.done{', 'fp menu css')
    open(p, 'w', encoding='utf-8').write(s)
    p = os.path.join(ROOT, 'pitch/sw.js'); s = open(p).read()
    s = sub(s, 'if (k !== CACHE) await caches.delete(k);', "if (k !== CACHE && k.startsWith('fp-')) await caches.delete(k);", 'fp sw caches')
    open(p, 'w').write(s)


if __name__ == '__main__':
    copy_tree(FR, os.path.join(ROOT, 'recruit'), ['src/', 'README.md', '.gitignore'])
    if '--pitch' in sys.argv:
        copy_tree(FP, os.path.join(ROOT, 'pitch'), ['README.md', 'tools/', '.gitignore'])
    patch_recruit(); patch_pitch()
    print('Connect built')

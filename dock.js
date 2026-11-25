/* SmartHomePros Connect: the editor dock, shared by Fast Pitch and Fast Recruit.
   One frosted-glass pill with Edit layout and Screens. Drag it by the six dots to anywhere on the screen; it stays
   there (in both apps) until it's moved again. It only shows for editors (when the app's own Edit layout button would),
   and hides while editing or while the screen preview is open. */
(function () {
  if (/[?&]sim=/.test(location.search) || window.__shpcDock) return; window.__shpcDock = 1;
  const APP = (window.SHPC && window.SHPC.app) || (/\/pitch\//.test(location.pathname) ? 'pitch' : 'recruit');
  const KEY = 'shpc_dock', M = 10;   // M: the closest it may sit to a screen edge (inside the safe area)
  const css = `
#lyBtn,#lySimBtn{display:none!important}
#shpcDock{position:fixed;left:0;top:0;z-index:9000;display:none;align-items:center;height:48px;padding:4px 5px 4px 3px;border-radius:24px;
  background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.06)),rgba(22,24,26,.38);
  -webkit-backdrop-filter:blur(26px) saturate(1.8);backdrop-filter:blur(26px) saturate(1.8);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),inset 0 1px 0 rgba(255,255,255,.22),0 12px 34px rgba(0,0,0,.38);
  font:500 14px/1 'Vivint Sans',-apple-system,Helvetica,Arial,sans-serif;color:#fff;-webkit-user-select:none;user-select:none;
  opacity:0;transform:translate3d(var(--x,0px),var(--y,0px),0) scale(.94);transition:opacity .28s ease,transform .32s cubic-bezier(.2,.8,.2,1),box-shadow .25s}
#shpcDock.on{display:flex}
#shpcDock.in{opacity:1;transform:translate3d(var(--x,0px),var(--y,0px),0)}
#shpcDock.drag{transition:opacity .28s ease,box-shadow .25s;transform:translate3d(var(--x,0px),var(--y,0px),0) scale(1.04);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),inset 0 1px 0 rgba(255,255,255,.26),0 22px 50px rgba(0,0,0,.5)}
#shpcDock .grip{width:30px;height:40px;display:grid;place-items:center;cursor:grab;touch-action:none;border-radius:20px;color:rgba(255,255,255,.62)}
#shpcDock.drag .grip{cursor:grabbing;color:#fff}
#shpcDock .grip svg{width:12px;height:20px;fill:currentColor}
#shpcDock button{height:40px;padding:0 14px 0 11px;border:0;border-radius:20px;background:none;color:#fff;font:inherit;display:flex;align-items:center;gap:8px;cursor:pointer;white-space:nowrap;transition:background .2s,transform .15s}
#shpcDock button svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#shpcDock button:active{transform:scale(.95);background:rgba(255,255,255,.16)}
@media (hover:hover){#shpcDock button:hover{background:rgba(255,255,255,.12)}#shpcDock .grip:hover{color:#fff}}
#shpcDock i.sep{width:1px;height:22px;background:rgba(255,255,255,.2);margin:0 2px}
body.ly-on #shpcDock,body.shpc-scr #shpcDock{opacity:0!important;pointer-events:none}
#shpcScr{position:fixed;inset:0;z-index:9600;background:#070908;display:none}
#shpcScr.open{display:block}
#shpcScr iframe{width:100%;height:100%;border:0;display:block}`;
  const GRIP = '<svg viewBox="0 0 12 20"><circle cx="3" cy="3" r="1.7"/><circle cx="9" cy="3" r="1.7"/><circle cx="3" cy="10" r="1.7"/><circle cx="9" cy="10" r="1.7"/><circle cx="3" cy="17" r="1.7"/><circle cx="9" cy="17" r="1.7"/></svg>';
  const EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
  const SCR = '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="12" height="15" rx="2"/><rect x="16.5" y="8" width="5" height="9" rx="1.5"/><path d="M7.5 17.5h2"/></svg>';

  function boot() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'shpcDock'; d.setAttribute('role', 'toolbar'); d.setAttribute('aria-label', 'Editor');
    d.innerHTML = '<span class="grip" title="Drag to move" aria-label="Move">' + GRIP + '</span>'
      + '<button type="button" data-a="edit">' + EDIT + 'Edit layout</button><i class="sep"></i>'
      + '<button type="button" data-a="scr">' + SCR + 'Screens</button>';
    document.body.appendChild(d);
    const scr = document.createElement('div'); scr.id = 'shpcScr'; document.body.appendChild(scr);

    /* position: kept as a fraction of the room left around the pill, so it lands in the same spot on every size */
    let fx = 0.5, fy = 0.86, x = 0, y = 0;   // first time: bottom centre, clear of the bottom bars
    try { const p = JSON.parse(localStorage.getItem(KEY)); if (p && isFinite(p.x) && isFinite(p.y)) { fx = p.x; fy = p.y; } } catch (e) {}
    const room = () => { const w = d.offsetWidth || 260, h = d.offsetHeight || 48, vv = window.visualViewport;
      const W = vv ? vv.width : innerWidth, H = vv ? vv.height : innerHeight;
      return { x0: M, y0: M, x1: Math.max(M, W - w - M), y1: Math.max(M, H - h - M) }; };
    const place = () => { const R = room(); x = R.x0 + fx * (R.x1 - R.x0); y = R.y0 + fy * (R.y1 - R.y0);
      d.style.setProperty('--x', Math.round(x) + 'px'); d.style.setProperty('--y', Math.round(y) + 'px'); };
    addEventListener('resize', place); window.visualViewport && visualViewport.addEventListener('resize', place);

    /* drag by the six dots */
    const grip = d.querySelector('.grip'); let drag = null;
    grip.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); drag = { id: e.pointerId, dx: e.clientX - x, dy: e.clientY - y }; d.classList.add('drag');
      try { grip.setPointerCapture(e.pointerId); } catch (er) {} });
    const move = e => { if (!drag || e.pointerId !== drag.id) return; e.preventDefault(); const R = room();
      x = Math.min(R.x1, Math.max(R.x0, e.clientX - drag.dx)); y = Math.min(R.y1, Math.max(R.y0, e.clientY - drag.dy));
      fx = R.x1 > R.x0 ? (x - R.x0) / (R.x1 - R.x0) : 0.5; fy = R.y1 > R.y0 ? (y - R.y0) / (R.y1 - R.y0) : 0.5;
      d.style.setProperty('--x', Math.round(x) + 'px'); d.style.setProperty('--y', Math.round(y) + 'px'); };
    const up = e => { if (!drag || e.pointerId !== drag.id) return; drag = null; d.classList.remove('drag');
      try { localStorage.setItem(KEY, JSON.stringify({ x: +fx.toFixed(4), y: +fy.toFixed(4) })); } catch (er) {} };
    grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
    ['click', 'touchstart'].forEach(t => grip.addEventListener(t, e => e.stopPropagation(), { passive: false }));

    /* the buttons hand off to each app's own editor */
    d.addEventListener('click', e => { const b = e.target.closest('button[data-a]'); if (!b) return; e.stopPropagation();
      if (b.dataset.a === 'edit') { const lb = document.getElementById('lyBtn'); lb && lb.click(); }
      else { if (!scr.firstChild) { const f = document.createElement('iframe'); f.src = '../screens.html?app=' + APP + (location.hash ? '&go=' + encodeURIComponent(location.hash.slice(1)) : ''); f.title = 'Screen preview'; scr.appendChild(f); }
        scr.classList.add('open'); document.body.classList.add('shpc-scr'); } });
    addEventListener('message', e => { if (e.data && (e.data.frSim === 'close' || e.data.shpcScr === 'close')) { scr.classList.remove('open'); scr.innerHTML = ''; document.body.classList.remove('shpc-scr'); } });

    /* show it only for editors: follow the app's own Edit layout button */
    const sync = () => { const lb = document.getElementById('lyBtn'), on = !!(lb && lb.classList.contains('show'));
      if (on && !d.classList.contains('on')) { d.classList.add('on'); place(); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('in'))); }
      else if (!on && d.classList.contains('on')) d.classList.remove('on', 'in'); };
    let obs = null; const hook = () => { const lb = document.getElementById('lyBtn'); if (lb && !obs) { obs = new MutationObserver(sync); obs.observe(lb, { attributes: true, attributeFilter: ['class'] }); } sync(); return !!lb; };
    if (!hook()) { const t = setInterval(() => { if (hook()) clearInterval(t); }, 400); setTimeout(() => clearInterval(t), 20000); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

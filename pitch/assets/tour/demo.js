/* 3D Home live demo: the house behaves like one integrated Vivint system.
   - Smart Hub: the real Smart Hub Pro 2 emulator (../emu, flat mode) sits on the 3D panel's glass; anything done on it
     flies the camera to that device and plays it (lock, garage, thermostat, arm/disarm automations).
   - Smart Lock keypad (4-digit code 1234: keys light green), Keypad (code / Away / Stay), garage door (sectional panels
     on the track), thermostat (set point, blue/orange downcast LED), automations from the Scenes button.
   Loaded by index.html after window.__tour exists. Idle cost: nothing runs per frame unless something is moving. */
const T = window.__tour;
const { THREE, camera, controls, scene, state, renderer, byKey, flyTo, PRODUCTS } = T;
const HOUSE = T.house || {};
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CODE = '1234';
const GREEN = 0x05e5af, LIME = 0xdfff1a, RED = 0xff3b30, AMBER = 0xff8a1f;
const $ = s => document.querySelector(s);
const easeIO = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeSine = t => -(Math.cos(Math.PI*t) - 1)/2;

/* ------------------------------------------------------------------ tiny animation engine (rAF only while busy) */
const anims = new Set(), perFrame = new Set(), waits = new Set(); let raf = 0;
const SKIP = { on:false };
function kick(){ if(!raf) raf = requestAnimationFrame(tick); }
function tick(now){ raf = 0;
  for(const a of [...anims]){ const k = Math.min(1, (now - a.t0)/a.d); a.fn(a.ease(k), k); if(k >= 1){ anims.delete(a); a.res(); } }
  for(const f of [...perFrame]) f(now);
  if(anims.size || perFrame.size) kick(); }
function tween(sec, fn, ease = easeIO){ return new Promise(res => {
  if(SKIP.on || sec <= 0){ fn(1, 1); res(); return; }
  anims.add({ t0:performance.now(), d:sec*1000*(reduce ? .5 : 1), fn, ease, res }); kick(); }); }
function wait(sec){ return new Promise(res => { if(SKIP.on){ res(); return; } const w = { res, t:setTimeout(() => { waits.delete(w); res(); }, sec*1000) }; waits.add(w); }); }
function flushAll(){ for(const a of [...anims]){ anims.delete(a); a.fn(1, 1); a.res(); } for(const w of [...waits]){ clearTimeout(w.t); waits.delete(w); w.res(); }
  if(state.fly) state.fly.start = -1e9; }
/* cinematic camera move: a cubic Bezier through a waypoint, so a move from inside the house leaves through the open
   front of the great room instead of cutting through walls. It drives the tour's own fly state (index.html stepFly),
   which keeps OrbitControls out of the way while the camera is ours. */
const inside = p => p.z < 3.95 && p.x > -10.5 && p.x < 7.6 && p.y < 7;
const sph = new THREE.Spherical();
function setFly(f, pos, tg){ f.t0.copy(tg); f.t1.copy(tg); sph.setFromVector3(tmpF.copy(pos).sub(tg)); f.s0.copy(sph); f.s1.copy(sph); f.r0 = f.r1 = Math.log(sph.radius); f.bump = 0; f.dTheta = 0; }
const tmpF = new THREE.Vector3();
function fly(pose, dur){ return new Promise(res => {
  if(SKIP.on){ res(); return; }
  const p0 = camera.position.clone(), t0 = controls.target.clone(), p1 = pose.pos.clone(), t1 = pose.target.clone(), dist = p0.distanceTo(p1);
  if(dur == null) dur = THREE.MathUtils.clamp(1.15 + dist*.075, 1.3, 2.5);
  const i0 = inside(p0), i1 = inside(p1); let W;
  if(dist < 1.2) W = p0.clone().lerp(p1, .5);
  else if(i0 && i1) W = V((p0.x + p1.x)/2, Math.max(p0.y, p1.y) + .6 + dist*.05, 6.2 + dist*.12);
  else if(i0) W = V(p0.x, p0.y + .5 + dist*.04, 7.2);
  else if(i1) W = V(p1.x, p1.y + .5 + dist*.04, 7.2);
  else { W = p0.clone().lerp(p1, .5); W.y += dist*.12; W.z = Math.max(W.z, Math.max(p0.z, p1.z) + dist*.08); }
  const bz = e => { const u = 1 - e; return V(0,0,0).addScaledVector(p0, u*u*u).addScaledVector(W, 3*u*e).addScaledVector(p1, e*e*e); };   // C1 = C2 = W
  flyTo(pose, { dur:1e6, done:() => { controls.enabled = !MODE.lockCam; res(); } });
  const f = state.fly, start = performance.now(), D = dur*1000*(reduce ? .5 : 1), tg = V(0,0,0);
  if(!f){ res(); return; }
  setFly(f, p0, t0);
  const step = now => { if(state.fly !== f){ perFrame.delete(step); return; }
    const k = SKIP.on ? 1 : Math.min(1, (now - start)/D), e = easeIO(k);
    tg.copy(t0).lerp(t1, easeIO(Math.min(1, k*1.06))); setFly(f, bz(e), tg);
    if(k >= 1){ setFly(f, p1, t1); f.dur = 1; f.start = -1e9; perFrame.delete(step); } };
  perFrame.add(step); kick(); }); }

/* ------------------------------------------------------------------ styles + HUD */
const css = document.createElement('style'); css.id = 'demoCss'; css.textContent = `
#dmHud{position:fixed;top:calc(env(safe-area-inset-top,0px) + 18px);right:max(18px,env(safe-area-inset-right,0px));z-index:8;display:flex;gap:8px;transition:opacity .4s,transform .4s var(--ease)}
.emb #dmHud{top:22px}
.dmPill{display:flex;align-items:center;gap:8px;height:48px;padding:0 18px 0 14px;border-radius:24px;font-weight:600;font-size:15px;color:#fff;transition:transform .2s var(--ease),background .25s}
.dmPill:active{transform:scale(.95)}
.dmPill svg{width:22px;height:22px;flex:none}
.dmPill.on{background:rgba(5,229,175,.22);box-shadow:inset 0 0 0 1px rgba(5,229,175,.55)}
#dmArm{display:flex;align-items:center;gap:7px;height:48px;padding:0 14px;border-radius:24px;font-size:13px;font-weight:600;letter-spacing:.04em;color:#cfe;pointer-events:none}
#dmArm i{width:9px;height:9px;border-radius:50%;background:var(--vg);box-shadow:0 0 10px var(--vg);transition:background .4s,box-shadow .4s}
#dmArm.armed i{background:#ff8a1f;box-shadow:0 0 10px #ff8a1f}
#dmArm.alarm i{background:#ff3b30;box-shadow:0 0 12px #ff3b30;animation:dmBlink .8s infinite}
@keyframes dmBlink{50%{opacity:.25}}
#dmScenes{position:fixed;z-index:9;top:calc(env(safe-area-inset-top,0px) + 76px);right:max(18px,env(safe-area-inset-right,0px));width:min(340px,calc(100vw - 32px));padding:14px;border-radius:24px;
  display:grid;grid-template-columns:1fr 1fr;gap:10px;transform-origin:top right;transition:opacity .3s,transform .4s var(--ease)}
.emb #dmScenes{top:80px}
#dmScenes.off{opacity:0;transform:scale(.92) translateY(-8px);pointer-events:none}
#dmScenes h3{grid-column:1/-1;margin:2px 4px 2px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--mint);font-weight:600}
.dmSc{display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:14px;border-radius:18px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);text-align:left;font-weight:600;font-size:15px;transition:transform .2s var(--ease),background .25s}
.dmSc:active{transform:scale(.96);background:rgba(255,255,255,.14)}
.dmSc i{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--c,#05E5AF);color:#04110d}
.dmSc i svg{width:22px;height:22px}
.dmSc small{display:block;font-size:12px;font-weight:500;color:var(--muted);margin-top:2px}
/* hub emulator: one iframe, docked on the 3D glass (homography) or floating as a picture-in-picture card */
#dmHub{position:fixed;left:0;top:0;width:1280px;height:750px;transform-origin:0 0;z-index:4;pointer-events:none;opacity:0;transition:opacity .45s}
#dmHub.vis{opacity:1}
#dmHub.live{pointer-events:auto}
#dmHub iframe{position:absolute;inset:0;width:1280px;height:750px;border:0;background:#000;display:block}
#dmHub.pip{z-index:10}
#dmHub.pip iframe{border-radius:44px;box-shadow:0 0 0 10px #0c0d0d,0 0 0 13px #d9dbd8,0 40px 90px rgba(0,0,0,.6)}
#dmShield{position:absolute;inset:0;cursor:pointer}
#dmHub.live #dmShield{display:none}
#dmTry{position:fixed;z-index:5;left:0;top:0;padding:6px 11px 6px 9px;border-radius:16px;font-size:12px;font-weight:600;white-space:nowrap;display:flex;align-items:center;gap:8px;pointer-events:none;opacity:0;transition:opacity .35s}
#dmTry.vis{opacity:1}
#dmTry b{width:8px;height:8px;border-radius:50%;background:var(--vg);box-shadow:0 0 10px var(--vg);animation:dmBlink 1.6s infinite}
#dmDone{position:fixed;z-index:11;top:calc(env(safe-area-inset-top,0px) + 18px);left:max(18px,env(safe-area-inset-left,0px));display:flex;align-items:center;gap:8px;height:48px;padding:0 18px 0 12px;border-radius:24px;font-weight:600;font-size:16px;transition:opacity .3s}
.emb #dmDone{top:22px}
#dmDone svg{width:22px;height:22px}
#dmDone[hidden]{display:none}
/* code dots for the lock / keypad close-up */
#dmPad{position:fixed;z-index:8;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 34px + var(--fb,0px));transform:translateX(-50%);padding:14px 22px;border-radius:26px;display:flex;align-items:center;gap:18px;transition:opacity .3s,transform .4s var(--ease)}
#dmPad[hidden]{display:none}
#dmPad .dots{display:flex;gap:12px}
#dmPad .dots i{width:14px;height:14px;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(255,255,255,.55);transition:background .15s,box-shadow .15s,transform .2s var(--ease)}
#dmPad .dots i.on{background:var(--vg);box-shadow:0 0 12px var(--vg);transform:scale(1.12)}
#dmPad.bad .dots i{background:#ff3b30;box-shadow:0 0 12px #ff3b30}
#dmPad.bad{animation:dmShake .45s}
#dmPad.ok .dots i{background:var(--vg)}
#dmPad .cd{font-size:13px;color:var(--muted);font-weight:500;line-height:1.3}
#dmPad .cd b{display:block;color:#fff;font-size:15px;letter-spacing:.3em;font-weight:700}
#dmPad .ks{display:flex;gap:8px}
#dmPad .ks button{height:44px;padding:0 16px;border-radius:22px;background:rgba(255,255,255,.1);font-weight:600;font-size:14px}
#dmPad .ks button:active{transform:scale(.95)}
@keyframes dmShake{0%,100%{translate:0}20%{translate:-10px}40%{translate:9px}60%{translate:-6px}80%{translate:4px}}
/* action bar under a focused smart device */
#dmAct{position:fixed;z-index:8;left:50%;bottom:236px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px;border-radius:30px;transition:opacity .3s,transform .45s var(--ease)}
#dmAct.off{opacity:0;transform:translateX(-50%) translateY(12px);pointer-events:none}
#dmAct button{display:flex;align-items:center;gap:8px;height:48px;padding:0 18px;border-radius:24px;font-weight:600;font-size:15px;background:rgba(255,255,255,.08);white-space:nowrap;transition:transform .18s var(--ease),background .25s}
#dmAct button:active{transform:scale(.95)}
#dmAct button.pri{background:var(--vg);color:#04110d}
#dmAct button.rnd{width:48px;padding:0;justify-content:center;font-size:26px;font-weight:400}
#dmAct svg{width:20px;height:20px}
#dmAct .tv{min-width:64px;text-align:center;font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}
#dmAct .tv small{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--muted)}
#dmAct .tv small.cool{color:#7aa2ff}#dmAct .tv small.heat{color:#ffb060}
/* live caption while an automation plays */
#dmCap{position:fixed;z-index:12;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 28px + var(--fb,0px));transform:translateX(-50%);max-width:calc(100vw - 24px);padding:12px 12px 12px 18px;border-radius:28px;display:flex;align-items:center;gap:14px;transition:opacity .4s,transform .5s var(--ease)}
#dmCap.off{opacity:0;transform:translateX(-50%) translateY(20px);pointer-events:none}
#dmCap .tt{display:flex;flex-direction:column;gap:2px;min-width:0}
#dmCap .tt small{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--mint);font-weight:600}
#dmCap .tt b{font-size:19px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dmCap .st{display:flex;gap:6px}
#dmCap .st i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);color:rgba(255,255,255,.4);transition:background .35s,color .35s,transform .35s var(--ease)}
#dmCap .st i svg{width:16px;height:16px}
#dmCap .st i.cur{color:#fff;box-shadow:inset 0 0 0 2px var(--vg);transform:scale(1.08)}
#dmCap .st i.done{background:var(--vg);color:#04110d}
#dmCap button{height:40px;padding:0 16px;border-radius:20px;background:rgba(255,255,255,.1);font-weight:600;font-size:14px;flex:none}
#dmCap.alarm .st i.cur{box-shadow:inset 0 0 0 2px #ff3b30}
#dmShieldRun{position:fixed;inset:0;z-index:9}
#dmRed{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;transition:opacity .6s;box-shadow:inset 0 0 min(160px,18vmin) min(30px,3vmin) rgba(255,36,24,.75)}
#dmRed.on{opacity:1;animation:dmRedP 1.1s ease-in-out infinite}
@keyframes dmRedP{50%{opacity:.35}}
#dmShieldRun[hidden]{display:none}
/* while a close-up or automation plays, the tour's own chrome steps aside */
body.dmMode #rail,body.dmMode #spots,body.dmMode #card,body.dmMode #cFeats,body.dmMode #back,body.dmMode #brand,body.dmMode #hint,body.dmMode #dmAct,body.dmMode #dmTry{opacity:0!important;pointer-events:none!important}
body.dmMode #dmHud{opacity:0;pointer-events:none;transform:translateY(-10px)}
#rail,#spots,#brand{transition:opacity .4s}
@media (max-width:760px), (max-aspect-ratio:1/1){
  .dmPill{height:42px;padding:0 13px 0 11px;font-size:14px}
  .dmPill span{display:none} .dmPill{padding:0 10px} .dmPill.lbl span{display:inline} .dmPill.lbl{padding:0 14px 0 11px}
  #dmArm{height:42px;padding:0 10px}
  #dmArm span{display:none}
  #dmScenes{top:calc(env(safe-area-inset-top,0px) + 68px)}
  #dmCap{padding:10px 10px 10px 14px;gap:10px}
  #dmCap .tt b{font-size:16px}
  #dmCap .st i{width:24px;height:24px} #dmCap .st i svg{width:13px;height:13px}
  #dmCap button{height:36px;padding:0 12px}
  #dmPad{gap:12px;padding:12px 16px}
}
@media (max-width:430px){ #dmCap .st{display:none} #dmPad .cd{display:none} }
`; document.head.appendChild(css);

const IC = {
  hub:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="12" rx="2.2"/><path d="M3 13.2h18M8.5 19.5h7"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/></svg>',
  fire:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 0 0 6 6z"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
  unlock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 7.7-1.5"/></svg>',
  garage:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 20V9l9-5 9 5v11"/><path d="M6.5 20v-8h11v8M6.5 15h11"/></svg>',
  temp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/></svg>',
  bulb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
  door:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4h10v17M15 6l4 1.5V21M3 21h18"/><circle cx="12" cy="13" r=".9" fill="currentColor"/></svg>',
  keys:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="7" r="1.8"/><circle cx="12" cy="7" r="1.8"/><circle cx="18" cy="7" r="1.8"/><circle cx="6" cy="13" r="1.8"/><circle cx="12" cy="13" r="1.8"/><circle cx="18" cy="13" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
};
const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for(const k in attrs) e.setAttribute(k, attrs[k]); e.innerHTML = html; document.body.appendChild(e); return e; };
const hud = el('div', { id:'dmHud' }, `<div id="dmArm" class="glass"><i></i><span>Disarmed</span></div>
  <button class="dmPill glass" id="dmHubB" aria-label="Use the Smart Hub">${IC.hub}<span>Smart Hub</span></button>
  <button class="dmPill glass lbl" id="dmScB" aria-label="Scenes">${IC.spark}<span>Scenes</span></button>`);
const SCN = [['away','Arm Away','Leaving home', IC.shield, '#ff9a3c'], ['welcome','Welcome Home','Code at the door', IC.home, '#05E5AF'],
  ['night','Goodnight','Lock up for bed', IC.moon, '#8fa8ff'], ['smoke','Smoke Alarm','Fire safety', IC.fire, '#ff5a4a']];
const scenesEl = el('div', { id:'dmScenes', class:'glass off' }, '<h3>Automations</h3>' + SCN.map(([k, t, s, i, c]) =>
  `<button class="dmSc" data-sc="${k}" style="--c:${c}"><i>${i}</i><span>${t}<small>${s}</small></span></button>`).join(''));
const hubEl = el('div', { id:'dmHub' }, '<div id="dmShield"></div>');
const tryEl = el('div', { id:'dmTry', class:'glass' }, '<b></b>Tap the screen');
const doneB = el('button', { id:'dmDone', class:'glass', hidden:'' }, IC.back + '<span>Done</span>');
const padEl = el('div', { id:'dmPad', class:'glass', hidden:'' }, '<div class="dots"><i></i><i></i><i></i><i></i></div><div class="cd">Code<b>1234</b></div><div class="ks"></div>');
const actEl = el('div', { id:'dmAct', class:'glass off' });
const capEl = el('div', { id:'dmCap', class:'glass off' }, '<div class="tt"><small></small><b></b></div><div class="st"></div><button id="dmSkip">Skip</button>');
const runShield = el('div', { id:'dmShieldRun', hidden:'' });
const redEl = el('div', { id:'dmRed' });
document.body.appendChild(capEl);   // keep the caption above the run shield

/* ------------------------------------------------------------------ the house's live state */
const M = { arm:'dis', locked:true, garage:0, garageOpen:false, door:0, th:{ mode:'cool', sp:70, cur:72 }, lights:1, alarm:false };
const MODE = { kind:null, lockCam:false, run:null, back:null };   // kind: 'panel' | 'lockpad' | 'keypad'
const P = k => byKey[k];
const parts = k => (P(k) && P(k).model && P(k).model.userData.parts) || {};

/* fill light that rides with the camera during demo shots (added now, before the tour compiles its shaders) */
const fill = new THREE.SpotLight(0xffffff, 0, 5, .5, .85, 1.4); fill.castShadow = false;
if(!window.__warm){ scene.add(fill, fill.target); }
let fillOn = 0, fillWant = 0;
function setFill(v, col = 0xffffff){ fillWant = v; fill.color.setHex(col); perFrame.add(fillStep); kick(); }
function fillStep(){ fillOn += (fillWant - fillOn)*.12; fill.intensity = fillOn; fill.position.copy(camera.position).add(V(0, .25, 0)); fill.target.position.copy(controls.target); fill.target.updateMatrixWorld();
  if(Math.abs(fillWant - fillOn) < .01 && !fillWant){ fill.intensity = 0; perFrame.delete(fillStep); } }

/* ------------------------------------------------------------------ camera shots */
const aspect = () => innerWidth/innerHeight;
const hfov = () => 2*Math.atan(Math.tan(camera.fov*Math.PI/360)*aspect());
/* distance at which a w x h (metres) patch fills fw of the width / fh of the height */
const fitDist = (w, h, fw = .8, fh = .7) => Math.max(w/2/Math.tan(hfov()/2)/fw, h/2/Math.tan(camera.fov*Math.PI/360)/fh);
const spread = () => aspect() < .6 ? 1.75 : aspect() < 1 ? 1.35 : 1;   // portrait screens need more distance for the same width
function shot(target, from, dist){ const d = from.clone().normalize().multiplyScalar(dist*spread()); return { pos:target.clone().add(d), target:target.clone() }; }
const SH = {
  door:    () => shot(V(-3.95, 1.25, 3.7), V(.55, .28, 1), 3.6),
  doorIn:  () => shot(V(-3.75, 1.2, 3.86), V(.45, .15, -1), 1.25),
  lock:    () => { const p = P('lock'); return shot(p.center.clone(), V(.35, .12, 1), .62); },
  garage:  () => shot(V(-8.4, 1.55, 3.6), V(.42, .26, 1), 7.2),
  therm:   () => { const p = P('therm'); return shot(p.center.clone().add(V(0, -.08, 0)), V(.28, .05, 1), .85); },
  hub:     () => { const p = P('hub'); return shot(p.center.clone().add(V(0, -.05, 0)), V(1, .08, .3), 1.05); },
  keypad:  () => { const p = P('keypad'); return shot(p.center.clone(), V(-1, .08, .35), .8); },
  smoke:   () => { const p = P('smokeco'); return shot(p.center.clone().add(V(0, -.9, 0)), V(.2, -.25, 1), 3.1); },
  great:   () => shot(V(1.2, 1.6, -1.5), V(.15, .35, 1), 8.5),
  home:    () => { const HV = T.homeView(); return T.poseFor(HV); },
};

/* ------------------------------------------------------------------ devices */
const tmpV = V(0, 0, 0);
function glowMat(m, hex, k){ if(!m || !m.emissive) return; if(m.userData.e0 == null){ m.userData.e0 = m.emissive.getHex(); m.userData.ei0 = m.emissiveIntensity; }
  if(k <= 0){ m.emissive.setHex(m.userData.e0); m.emissiveIntensity = m.userData.ei0; } else { m.emissive.setHex(hex); m.emissiveIntensity = k; } }
const meshMats = o => { const a = []; o.traverse(m => { if(m.isMesh) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => a.push(x)); }); return a; };
function pressKey(mesh, hex = GREEN){ if(!mesh) return; const mats = meshMats(mesh);
  if(mesh.userData.z0 == null) mesh.userData.z0 = mesh.position.z;
  const tint = (m, k) => { if(!m.color) return; if(m.userData.kc0 == null) m.userData.kc0 = m.color.getHex(); m.color.setHex(m.userData.kc0).lerp(KEYC.setHex(hex), .85*k); };   // backlit key: the whole cap turns green
  mats.forEach(m => { glowMat(m, hex, 1.1); tint(m, 1); }); mesh.position.z = mesh.userData.z0 - .0004;
  clearTimeout(mesh.userData.kt); mesh.userData.kt = setTimeout(() => { mesh.position.z = mesh.userData.z0;
    tween(.4, k => mats.forEach(m => { glowMat(m, hex, 1.1*(1 - k)); tint(m, 1 - k); }), easeOut); }, 300); }
const KEYC = new THREE.Color();

/* Smart Lock: status LEDs, thumb-turn, keys; it rides on the front door when the door swings */
const LOCK = {
  flash(hex, n = 2){ const leds = (parts('lock').led || []).concat(parts('lock').interiorLed || []);
    return tween(.45*n, (e, k) => { const on = Math.sin(k*n*Math.PI) ** 2; leds.forEach(m => meshMats(m).forEach(x => { glowMat(x, hex, 2.4*on); if(x.color){ if(x.userData.c0 == null) x.userData.c0 = x.color.getHex(); x.color.setHex(on > .05 ? hex : x.userData.c0); } })); }, t => t); },
  async set(locked){ const t = parts('lock').turn; M.locked = locked; syncAct();
    const from = t ? t.rotation.z : 0, to = locked ? 0 : -Math.PI/2;
    await Promise.all([ t ? tween(.55, e => { t.rotation.z = from + (to - from)*e; }, easeIO) : Promise.resolve(), this.flash(locked ? 0xff7a1a : GREEN, 2) ]); },
  shake(){ const g = P('lock').model, x0 = g.position.x; return tween(.45, (e, k) => { g.position.x = x0 + Math.sin(k*Math.PI*6)*(1 - k)*.004; }, t => t); },
};
/* Front door on its hinge (house.frontDoor: rotate y; the sign that opens inward is measured once) */
const DOOR = { pivot:HOUSE.frontDoor, sign:0,
  init(){ const d = this.pivot; if(!d) return; const c0 = new THREE.Box3().setFromObject(d).getCenter(V(0,0,0)); d.rotation.y = .3; d.updateMatrixWorld(true);
    const c1 = new THREE.Box3().setFromObject(d).getCenter(V(0,0,0)); d.rotation.y = 0; d.updateMatrixWorld(true); this.sign = c1.z < c0.z ? 1 : -1;
    const lk = P('lock') && P('lock').model; if(lk) d.attach(lk); },
  swing(open, sec = 2.1){ const d = this.pivot; if(!d){ M.door = open ? 1 : 0; return Promise.resolve(); } const a0 = M.door;
    M.door = open ? 1 : 0; return tween(sec, e => { d.rotation.y = this.sign*1.35*(a0 + (M.door - a0)*e); }, open ? easeIO : t => easeSine(t)); },
};
/* Sectional garage door: five rigid panels riding the track (up the opening, round the radius, along the ceiling) */
const GAR = { panels:(HOUSE.garagePanels || []).slice(), tr:HOUSE.garageTrack,
  init(){ if(!this.panels.length || !this.tr) return; const t = this.tr; this.R = t.radius; this.yC = t.yCeil - t.radius; this.Lv = this.yC - t.yBottom; this.arc = Math.PI*t.radius/2;
    this.panels.sort((a, b) => a.position.y - b.position.y); this.travel = this.Lv + this.arc + .06; this.place(0); },
  at(s){ const t = this.tr; if(s <= this.Lv) return [t.yBottom + s, t.z]; if(s <= this.Lv + this.arc){ const f = (s - this.Lv)/this.R; return [this.yC + this.R*Math.sin(f), t.z - this.R*(1 - Math.cos(f))]; }
    return [t.yCeil, t.z - this.R - (s - this.Lv - this.arc)]; },
  place(u){ if(!this.tr) return; const h = this.tr.panelH, off = u*this.travel;
    this.panels.forEach((p, i) => { const a = this.at(i*h + off), b = this.at((i + 1)*h + off); p.position.y = (a[0] + b[0])/2; p.position.z = (a[1] + b[1])/2; p.rotation.x = Math.atan2(b[1] - a[1], b[0] - a[0]); }); },
  leds(on){ const L = parts('garage').leds || []; L.forEach((m, i) => meshMats(m).forEach(x => glowMat(x, LIME, on ? (on === 2 ? 2 : .9) : 0))); },
  async set(open, sec = 5.2){ if(M.garageOpen === open && (M.garage === (open ? 1 : 0))) return; M.garageOpen = open; syncAct(); const u0 = M.garage, u1 = open ? 1 : 0, gl = (HOUSE.lights || {}).garage, gi = gl ? gl.userData.i0 ?? (gl.userData.i0 = gl.intensity) : 0;
    const btn = (parts('garage').buttons || [])[open ? 2 : 0]; pressKey(btn, LIME);
    let blink = 0; const bl = setInterval(() => this.leds((blink++ % 2) ? 1 : 2), 260);
    await tween(sec*Math.abs(u1 - u0 || 1), e => { M.garage = u0 + (u1 - u0)*e; this.place(M.garage); if(gl) gl.intensity = gi*(1 + .6*Math.sin(Math.PI*e)); }, t => easeSine(t));
    clearInterval(bl); this.leds(0); },
};
/* Thermostat: set point, current, mode; the downcast LED glows only while it is actually heating or cooling */
const TH = {
  active(){ const t = M.th; return t.mode === 'cool' && t.cur > t.sp ? 'cool' : t.mode === 'heat' && t.cur < t.sp ? 'heat' : null; },
  paint(){ const p = parts('therm'); if(!p.setState) return; p.setState({ mode:M.th.mode, setpoint:M.th.sp, current:M.th.cur });
    const a = this.active(); if(p.led){ if(a){ p.led.setColor(p.led.colors[a]); p.led.setIntensity(this.glow ?? 1); } else p.led.setIntensity(0); } syncAct(); },
  async to(sp, mode){ const t = M.th, from = t.sp; if(mode) t.mode = mode; else if(sp !== t.cur) t.mode = sp > t.cur ? 'heat' : 'cool';
    const n = Math.abs(sp - from), dir = Math.sign(sp - from); this.glow = 0;
    for(let i = 1; i <= n; i++){ t.sp = from + dir*i; this.paint(); await wait(n > 4 ? .09 : .16); }
    if(!n) this.paint();
    if(this.active()) await tween(.9, e => { this.glow = e; const p = parts('therm'); p.led && p.led.setIntensity(e); }, easeOut);
    this.glow = 1; },
};
/* Keypad: status ring + downcast slot follow the arm state */
const KP = { paint(){ const p = parts('keypad'); if(p.slot) meshMats(p.slot).forEach(m => { m.emissive && m.emissive.setHex(M.alarm ? RED : M.arm === 'dis' ? 0x83f4b8 : AMBER); m.emissiveIntensity = 1.1; });
  (p.statusIcons || []).forEach((r, i) => meshMats(r).forEach(m => glowMat(m, RED, M.alarm && i === 2 ? 2 : 0))); } };
/* Smart Hub downcast LED: an additive wash on the wall under the hub (green disarmed / orange armed / red alarm) */
const HUBLED = (() => { const p = P('hub'); if(!p) return { set(){} };
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.save(); x.translate(128, 0); x.scale(1, .5); const g = x.createRadialGradient(0, 0, 0, 0, 0, 128);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.3, 'rgba(255,255,255,.42)'); g.addColorStop(.7, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(-128, 0, 256, 256); x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ color:GREEN, map:t, transparent:true, depthWrite:false, toneMapped:false, blending:THREE.AdditiveBlending, opacity:.75 });
  const w = new THREE.Mesh(new THREE.PlaneGeometry(.3, .15), m); w.position.set(0, -.079 - .072, .0015); w.renderOrder = 2; p.model.add(w);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(.2, .0022), new THREE.MeshBasicMaterial({ color:GREEN, toneMapped:false, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }));
  strip.position.set(0, -.0795, .012); strip.rotation.x = Math.PI/2; p.model.add(strip);
  let pulse = null;
  return { set(hex, alarm){ m.color.setHex(hex); strip.material.color.setHex(hex);
    if(alarm && !pulse){ pulse = now => { m.opacity = .45 + .45*Math.abs(Math.sin(now/260)); }; perFrame.add(pulse); kick(); }
    if(!alarm && pulse){ perFrame.delete(pulse); pulse = null; m.opacity = .75; } } }; })();
/* house lights (interior point lights + exposure) for Goodnight / Welcome / Smoke */
const LIT = { base:null, exp0:renderer.toneMappingExposure,
  list(){ const L = HOUSE.lights || {}; return (L.interior || []).filter(Boolean); },
  to(v, sec = 1.4){ const ls = this.list(); if(!this.base) this.base = ls.map(l => l.intensity); const from = M.lights; M.lights = v;
    return tween(sec, e => { const k = from + (v - from)*e; ls.forEach((l, i) => l.intensity = this.base[i]*(.12 + .88*k)); renderer.toneMappingExposure = this.exp0*(.45 + .55*k); }, easeSine); } };
/* a soft red pulse at the smoke detector */
const SMOKE = (() => { const p = P('smokeco'); if(!p) return { on(){}, off(){} };
  const m = new THREE.SpriteMaterial({ color:RED, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false,
    map:(() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() });
  m.blending = THREE.NormalBlending; const s = new THREE.Sprite(m); s.scale.setScalar(1.1); s.position.copy(p.center).add(V(0, -.05, .08)); s.visible = false; scene.add(s);
  let f = null; return { on(){ s.visible = true; redEl.classList.add('on'); f = now => { m.opacity = .25 + .75*Math.abs(Math.sin(now/300)); fill.color.setHex(RED); }; perFrame.add(f); kick(); },
    off(){ redEl.classList.remove('on'); if(f) perFrame.delete(f); f = null; tween(.5, e => { m.opacity *= 1 - e; }).then(() => { s.visible = false; }); } }; })();

/* ------------------------------------------------------------------ the Smart Hub emulator (same-origin iframe) */
const EMU = { frame:null, w:null, doc:null, UI:null, S:null, ready:null, driving:false, docked:true, mx:'' };
function emu(){ if(EMU.ready) return EMU.ready;
  EMU.ready = new Promise(res => { const f = document.createElement('iframe'); f.title = 'Smart Hub Pro 2'; f.setAttribute('allow', 'autoplay');
    f.src = '../emu/index.html?flat&v=' + (T.TOURV || 1); hubEl.insertBefore(f, hubEl.firstChild); EMU.frame = f;
    f.addEventListener('load', () => { const poll = () => { try { const d = f.contentDocument, u = f.contentWindow.eval('UI');
        if(!d || !u || !d.getElementById('gB')) return setTimeout(poll, 80);
        EMU.w = f.contentWindow; EMU.doc = d; EMU.UI = u; EMU.S = u.S; hookEmu(); res(EMU); } catch(e){ setTimeout(poll, 120); } }; poll(); }); });
  return EMU.ready; }
const q = s => EMU.doc && EMU.doc.querySelector(s);
function emuClick(sel){ const b = q(sel); if(!b) return false; EMU.driving = true; try { b.click(); } finally { EMU.driving = false; } return true; }
/* 3D -> hub: press the emulator's own buttons, so its UI animates itself */
const HUBDO = {
  lock(locked){ if(!EMU.S || EMU.S.locks.front === locked) return; emuClick('[data-act="lock"][data-lk="front"]'); },
  garage(open){ if(!EMU.S) return; const busy = q('#gB') && q('#gB').classList.contains('busy'); if(busy || (EMU.S.garage === 'open') === open) return; emuClick('#gB'); },
  arm(k){ if(!EMU.S || EMU.S.arm === k) return; emuClick(`[data-act="setarm"][data-arm="${k}"]`); },
  therm(){ const S = EMU.S; if(!S) return; const t = M.th;
    for(let i = 0; i < 4 && S.th.mode !== t.mode; i++) emuClick('[data-act="tmode"]');
    S.th.cur = t.cur; let n = 0; while(S.th.sp < t.sp && n++ < 40) emuClick('[data-act="tup"]'); while(S.th.sp > t.sp && n++ < 80) emuClick('[data-act="tdn"]');
    if(!n){ emuClick('[data-act="tup"]'); emuClick('[data-act="tdn"]'); } },
  alarm(msg){ if(!EMU.UI) return; EMU.driving = true; EMU.UI.demo(3); EMU.driving = false; const s = q('#almS'); if(s) s.innerHTML = 'Enter PIN to silence alarm.<br>' + msg; },
  clearAlarm(){ if(!EMU.S || !EMU.S.alarm) return; for(const d of CODE) emuClick(`[data-pin="${d}"]`); },
  home(){ if(EMU.UI){ emuClick('[data-act="close"]'); } },
};
function syncEmu(){ if(!EMU.S) return; const S = EMU.S; S.th.cur = M.th.cur; HUBDO.therm(); HUBDO.lock(M.locked); HUBDO.garage(M.garageOpen); HUBDO.arm(M.arm); }
/* hub -> 3D: watch what the emulator does */
let pend = null;
function hookEmu(){ const d = EMU.doc;
  EMU.w.addEventListener('hubled', e => { const c = e.detail || {}; HUBLED.set(c.alarm || EMU.S.alarm ? RED : EMU.S.arm !== 'dis' ? AMBER : GREEN, !!EMU.S.alarm); });
  d.addEventListener('click', e => { if(EMU.driving) return; const a = e.target.closest && e.target.closest('[data-act]'); if(!a) return;
    const act = a.dataset.act;
    if(act === 'garage' && !a.classList.contains('busy')) setTimeout(() => fromHub('garage', !M.garageOpen), 0);
    if(act === 'tup' || act === 'tdn' || act === 'tmode') setTimeout(() => fromHub('therm'), 0); }, true);
  new MutationObserver(() => { if(!pend) pend = Promise.resolve().then(() => { pend = null; diffEmu(); }); })
    .observe(d.getElementById('scr'), { subtree:true, attributes:true, attributeFilter:['class'], childList:true });
  syncEmu(); }
function diffEmu(){ if(EMU.driving || !EMU.S || MODE.run) return; const S = EMU.S;   // during a sequence the 3D side leads; settle() syncs the hub after
  if(S.arm !== M.arm && !S.alarm){ const k = S.arm; M.arm = k; paintArm(); fromHub('arm', k); return; }
  if(S.locks.front !== M.locked) fromHub('lock', S.locks.front);
  if(!S.alarm && M.alarm){ M.alarm = false; paintArm(); } }
function paintArm(){ const a = $('#dmArm'); a.classList.toggle('armed', M.arm !== 'dis'); a.classList.toggle('alarm', M.alarm);
  a.querySelector('span').textContent = M.alarm ? 'Alarm' : M.arm === 'away' ? 'Armed Away' : M.arm === 'stay' ? 'Armed Stay' : 'Disarmed';
  HUBLED.set(M.alarm ? RED : M.arm !== 'dis' ? AMBER : GREEN, M.alarm); KP.paint(); }

/* dock: the iframe drawn onto the 3D hub glass with a CSS homography of the four projected screen corners */
const SCR = { c:V(-.0032, .01555, .0227), w:.1513, h:.1513*750/1280 };
function screenCorners(){ const g = P('hub').model; g.updateMatrixWorld(); const { c, w, h } = SCR;
  return [[-w/2, h/2], [w/2, h/2], [w/2, -h/2], [-w/2, -h/2]].map(([x, y]) => g.localToWorld(V(c.x + x, c.y + y, c.z))); }
function homog(pts){ const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = pts, W = 1280, H = 750;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, c, d, e, f, g = 0, h = 0;
  if(Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9){ a = x1 - x0; b = x2 - x1; c = x0; d = y1 - y0; e = y2 - y1; f = y0; }
  else { const den = dx1*dy2 - dx2*dy1; g = (dx3*dy2 - dx2*dy3)/den; h = (dx1*dy3 - dx3*dy1)/den; a = x1 - x0 + g*x1; b = x3 - x0 + h*x3; c = x0; d = y1 - y0 + g*y1; e = y3 - y0 + h*y3; f = y0; }
  const r = v => +v.toFixed(9);
  return `matrix3d(${r(a/W)},${r(d/W)},0,${r(g/W)},${r(b/H)},${r(e/H)},0,${r(h/H)},0,0,1,0,${r(c)},${r(f)},0,1)`; }
function dockMatrix(){ camera.updateMatrixWorld(); const W = innerWidth, H = innerHeight, pts = [];
  const n = V(0, 0, 1).applyQuaternion(P('hub').model.getWorldQuaternion(new THREE.Quaternion()));
  if(tmpV.copy(camera.position).sub(P('hub').center).dot(n) < .02) return null;           // looking at the back of the hub
  for(const p of screenCorners()){ const v = p.project(camera); if(v.z > 1 || v.z < -1) return null; pts.push([(v.x + 1)/2*W, (1 - v.y)/2*H]); }
  return homog(pts); }
function pipMatrix(){ const W = innerWidth, s = Math.min(380, W*.46)/1280, top = (document.documentElement.classList.contains('emb') ? 22 : 18) + 14;
  return `matrix3d(${s},0,0,0,0,${s},0,0,0,0,1,0,${W - 1280*s - 22},${top},0,1)`; }
function dockStep(){ if(!EMU.docked) return; const m = dockMatrix(); if(!m){ hubEl.classList.remove('vis'); return; }
  if(m !== EMU.mx){ EMU.mx = m; hubEl.style.transform = m; }
  if(!hubEl.classList.contains('vis')) hubEl.classList.add('vis');
  if(MODE.kind !== 'panel' && !MODE.run){ const r = hubEl.getBoundingClientRect(); tryEl.style.transform = `translate3d(${(r.left + r.right)/2 - tryEl.offsetWidth/2}px,${r.bottom + 4}px,0)`; } }
function showDock(on){ if(on){ emu(); EMU.docked = true; hubEl.classList.remove('pip'); hubEl.style.transition = ''; perFrame.add(dockStep); kick(); }
  else { perFrame.delete(dockStep); hubEl.classList.remove('vis', 'live'); tryEl.classList.remove('vis'); } }
async function toPip(){ if(!hubEl.classList.contains('vis')) { hubEl.style.transition = 'none'; hubEl.style.transform = pipMatrix(); hubEl.classList.add('pip'); void hubEl.offsetWidth; hubEl.style.transition = ''; hubEl.classList.add('vis'); EMU.docked = false; perFrame.delete(dockStep); return; }
  EMU.docked = false; perFrame.delete(dockStep); hubEl.classList.remove('live'); hubEl.classList.add('pip');
  hubEl.style.transition = 'transform .8s cubic-bezier(.2,.75,.2,1), opacity .45s'; hubEl.style.transform = pipMatrix(); EMU.mx = ''; await wait(.8); }
/* end of an automation: pull back to the whole home, unless we are about to return to the hub or a product anyway */
function finale(){ const b = MODE.back; return b && (b.kind || b.focus) ? wait(.4) : fly(SH.home()); }
async function atHub(){ await fly(SH.hub()); if(!SKIP.on) await toDock(); }
async function offHub(){ if(EMU.docked && !SKIP.on) await toPip(); }
async function toDock(){ const m = dockMatrix(); if(!m){ showDock(false); return; }
  hubEl.style.transition = 'transform .75s cubic-bezier(.2,.75,.2,1), opacity .45s'; hubEl.style.transform = m; EMU.mx = m; await wait(.75);
  hubEl.classList.remove('pip'); hubEl.style.transition = ''; EMU.docked = true; perFrame.add(dockStep); kick(); }

/* ------------------------------------------------------------------ modes: hub panel, lock keypad, keypad close-ups */
const tour = { card:$('#card'), back:$('#back') };
function quietTour(){ state.focus = null; document.body.classList.remove('focus'); document.body.classList.add('dmMode'); tour.card.classList.add('away'); tour.back.hidden = true;
  PRODUCTS.forEach(q => q.chip && q.chip.setAttribute('aria-current', 'false')); state.idleAt = performance.now() + 1e9; controls.autoRotate = false; scenesEl.classList.add('off'); }
function context(){ if(MODE.kind === 'panel') return { kind:'panel' }; if(MODE.kind && PAD.k) return { focus:PAD.k }; if(state.focus) return { focus:state.focus.k }; return {}; }
async function restore(c){ document.body.classList.remove('dmMode'); setFill(0); state.idleAt = performance.now();
  if(c && c.kind === 'panel') return enterPanel(true);
  if(c && c.focus){ state.focus = null; T.focus(c.focus); return; }
  T.overview(); }
function panelPose(){ const p = P('hub'), g = p.model, c = g.localToWorld(SCR.c.clone()), n = V(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
  const s = g.scale.x, d = fitDist(SCR.w*s, SCR.h*s, .8, aspect() < 1 ? .56 : .68); return { pos:c.clone().addScaledVector(n, d), target:c }; }
async function enterPanel(back){ if(MODE.run) return; await emu(); quietTour(); MODE.kind = 'panel'; MODE.lockCam = true; doneB.hidden = false; tryEl.classList.remove('vis'); hudOn();
  if(!EMU.docked || !hubEl.classList.contains('vis')) showDock(true);
  await fly(panelPose(), back ? 1.5 : 1.3); controls.enabled = false;
  if(!EMU.docked) await toDock();
  if(MODE.kind === 'panel') hubEl.classList.add('live'); }
function padPose(k){ const p = P(k), g = p.model, keys = k === 'lock' ? parts('lock').keys : [...parts('keypad').keys, parts('keypad').stay, parts('keypad').away].filter(Boolean);
  const b = new THREE.Box3(); keys.forEach(m => b.expandByObject(m)); if(k === 'lock' && parts('lock').button) b.expandByObject(parts('lock').button);
  const c = b.getCenter(V(0,0,0)), sz = b.getSize(V(0,0,0)), n = V(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
  const w = Math.max(Math.abs(sz.x*n.z) + Math.abs(sz.z*n.x), .01), h = sz.y;   // span across the device face
  const d = fitDist(w, h, aspect() < 1 ? .6 : .34, aspect() < 1 ? .4 : .5);
  return { pos:c.clone().addScaledVector(n, d).add(V(0, d*.06, 0)), target:c }; }
const PAD = { k:null, code:'' };
function padDots(){ padEl.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', i < PAD.code.length)); }
async function enterPad(k){ if(MODE.run) return; emu(); quietTour(); MODE.kind = k === 'lock' ? 'lockpad' : 'keypad'; MODE.lockCam = true; PAD.k = k; PAD.code = ''; padDots();
  padEl.classList.remove('bad', 'ok'); padEl.hidden = false; doneB.hidden = false;
  padEl.querySelector('.ks').innerHTML = k === 'keypad' ? '<button data-k="away">Away</button><button data-k="stay">Stay</button>' : '';
  await fly(padPose(k)); controls.enabled = false; }
function leaveMode(){ const k = MODE.kind, pk = PAD.k; MODE.kind = null; MODE.lockCam = false; padEl.hidden = true; doneB.hidden = true; hubEl.classList.remove('live');
  controls.enabled = true; document.body.classList.remove('dmMode');
  if(k === 'panel'){ state.focus = null; T.focus('hub'); } else if(pk){ state.focus = null; T.focus(pk); } else T.overview(); }
doneB.addEventListener('click', () => { if(MODE.run) return; leaveMode(); });
hubEl.querySelector('#dmShield').addEventListener('click', () => enterPanel());
padEl.querySelector('.ks').addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; const kp = parts('keypad'); pressKey(kp[b.dataset.k], GREEN);
  setTimeout(() => automation(b.dataset.k === 'away' ? 'away' : 'stay', { from:'keypad' }), 350); });

/* keys: the nearest key on screen to the tap (keys are small, so a near miss still counts) */
function nearestKey(list, e){ let best = null, bd = 1e9; const W = innerWidth, H = innerHeight;
  for(const m of list){ if(!m) continue; m.geometry.computeBoundingBox && !m.geometry.boundingBox && m.geometry.computeBoundingBox();
    const c = m.localToWorld(m.geometry.boundingBox.getCenter(V(0,0,0))).project(camera); const x = (c.x + 1)/2*W, y = (1 - c.y)/2*H, d = Math.hypot(x - e.clientX, y - e.clientY);
    if(d < bd){ bd = d; best = { m, d, x, y }; } }
  if(!best) return null; const sp = list.length > 1 ? (() => { const a = list[0], b = list[1]; const pa = a.localToWorld(a.geometry.boundingBox.getCenter(V(0,0,0))).project(camera), pb = b.localToWorld(b.geometry.boundingBox.getCenter(V(0,0,0))).project(camera); return Math.hypot((pa.x - pb.x)/2*W, (pa.y - pb.y)/2*H); })() : 60;
  return best.d < Math.max(26, sp*.75) ? best : null; }
const digitOf = m => (m.name || '').replace(/^key/, '');
function padKey(m){ const d = digitOf(m); if(!/^\d$/.test(d) || PAD.code.length >= 4) return; pressKey(m, GREEN); PAD.code += d; padDots();
  if(PAD.code.length === 4) setTimeout(padCheck, 260); }
async function padCheck(){ const ok = PAD.code === CODE, k = PAD.k;
  if(!ok){ padEl.classList.remove('bad'); void padEl.offsetWidth; padEl.classList.add('bad'); if(k === 'lock'){ LOCK.flash(RED, 2); LOCK.shake(); } else KP.flashBad && KP.flashBad();
    await wait(.7); PAD.code = ''; padDots(); padEl.classList.remove('bad'); return; }
  padEl.classList.add('ok');
  if(k === 'lock') automation('welcome', { typed:true });
  else automation(M.arm === 'dis' ? 'kpok' : 'disarm', { from:'keypad' }); }

/* taps on the 3D scene (called by index.html before its own product hit test) */
const hits = (o, ray) => o && ray.intersectObject(o, true).length > 0;
window.__tapHook = (ray, e) => {
  if(MODE.run){ skip(); return true; }
  if(MODE.kind === 'lockpad'){ const n = nearestKey(parts('lock').keys || [], e); if(n) padKey(n.m); return true; }
  if(MODE.kind === 'keypad'){ const kp = parts('keypad'); const n = nearestKey([...(kp.keys || []), kp.stay, kp.away, kp.clear].filter(Boolean), e);
    if(n){ if(n.m === kp.stay || n.m === kp.away){ pressKey(n.m); setTimeout(() => automation(n.m === kp.away ? 'away' : 'stay', { from:'keypad' }), 300); }
      else if(n.m === kp.clear){ pressKey(n.m); PAD.code = ''; padDots(); } else padKey(n.m); } return true; }
  if(MODE.kind === 'panel') return true;
  const f = state.focus && state.focus.k;
  if(f === 'lock' && hits(P('lock').model, ray)){ enterPad('lock'); return true; }
  if(f === 'keypad' && hits(P('keypad').model, ray)){ enterPad('keypad'); return true; }
  if(f === 'hub' && hits(P('hub').model, ray)){ enterPanel(); return true; }
  if(f === 'garage'){ const b = parts('garage').buttons || []; const n = nearestKey(b, e); if(n){ const i = b.indexOf(n.m); if(i === 1){ pressKey(n.m, LIME); return true; } device('garage', i === 2); return true; } }
  if(f === 'therm' && hits(P('therm').model, ray)){ const c = P('therm').center.clone().project(camera), y = (1 - c.y)/2*innerHeight; device('therm', M.th.sp + (e.clientY < y ? 1 : -1)); return true; }
  return false; };

/* ------------------------------------------------------------------ action bar for the focused smart device */
let actK = null;
function syncAct(){ const f = !MODE.kind && !MODE.run && state.focus ? state.focus.k : null;
  const want = ['lock', 'garage', 'therm', 'keypad', 'hub'].includes(f) ? f : null;
  if(!want){ if(actK){ actEl.classList.add('off'); actK = null; } showTry(false); return; }
  const H = {
    lock:`<button class="pri" data-a="pad">${IC.keys}Enter code</button><button data-a="lock">${M.locked ? IC.unlock + 'Unlock' : IC.lock + 'Lock'}</button>`,
    garage:`<button class="pri" data-a="gar">${IC.garage}${M.garageOpen ? 'Close' : 'Open'}</button>`,
    therm:`<button class="rnd" data-a="tdn" aria-label="Cooler">${IC.down}</button><div class="tv">${M.th.sp}°<small class="${TH.active() || ''}">${TH.active() === 'cool' ? 'Cooling' : TH.active() === 'heat' ? 'Heating' : 'Idle'}</small></div><button class="rnd" data-a="tup" aria-label="Warmer">${IC.up}</button>`,
    keypad:`<button class="pri" data-a="kpad">${IC.keys}Enter code</button><button data-a="away">Away</button><button data-a="stay">Stay</button>`,
    hub:`<button class="pri" data-a="panel">${IC.hub}Use the hub</button>`,
  }[want];
  if(actEl.dataset.h !== H){ actEl.innerHTML = H; actEl.dataset.h = H; }
  actK = want; actEl.classList.remove('off');
  placeAct();
  showTry(want === 'hub'); }
/* dock the control just above the tour's slim product bar (#card), centred on it; never over the product */
function placeAct(){ const c = tour.card; if(!c) return; const r = c.getBoundingClientRect(), cs = getComputedStyle(c);
  const m = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform), tr = (cs.translate || '').split(' ');   // the bar slides in: measure where it rests
  const top = r.top - m.m42 - (parseFloat(tr[1]) || 0), cx = r.left + r.width/2 - m.m41 - (parseFloat(tr[0]) || 0);
  actEl.style.left = cx + 'px'; actEl.style.bottom = Math.max(12, innerHeight - top + 10) + 'px'; }
function showTry(on){ if(on){ showDock(true); tryEl.classList.add('vis'); } else { tryEl.classList.remove('vis'); if(!MODE.kind && !MODE.run && EMU.docked) showDock(false); } }
actEl.addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; const a = b.dataset.a;
  if(a === 'pad') enterPad('lock'); if(a === 'kpad') enterPad('keypad'); if(a === 'panel') enterPanel();
  if(a === 'lock') device('lock', !M.locked); if(a === 'gar') device('garage', !M.garageOpen);
  if(a === 'tup') device('therm', Math.min(90, M.th.sp + 1)); if(a === 'tdn') device('therm', Math.max(50, M.th.sp - 1));
  if(a === 'away' || a === 'stay') automation(a, { from:'keypad' }); });
tour.card && tour.card.addEventListener('transitionend', () => { if(actK) placeAct(); });
/* watch the tour's focus changes cheaply (it has no events): body class + data attribute */
new MutationObserver(() => syncAct()).observe(document.body, { attributes:true, attributeFilter:['class', 'data-fk'] });

/* ------------------------------------------------------------------ the caption + sequencer */
const STEPI = { keys:IC.keys, lock:IC.lock, unlock:IC.unlock, garage:IC.garage, temp:IC.temp, shield:IC.shield, bulb:IC.bulb, door:IC.door, bell:IC.bell, fire:IC.fire, home:IC.home, moon:IC.moon };
function caption(kicker, title, steps, alarm){ capEl.querySelector('small').textContent = kicker; capEl.querySelector('b').textContent = title;
  capEl.querySelector('.st').innerHTML = (steps || []).map(s => `<i>${STEPI[s] || IC.check}</i>`).join(''); capEl.classList.toggle('alarm', !!alarm); capEl.classList.remove('off'); }
function capStep(i, title){ const st = [...capEl.querySelectorAll('.st i')]; st.forEach((s, j) => { s.classList.toggle('done', j < i); s.classList.toggle('cur', j === i); }); if(title) capEl.querySelector('b').textContent = title; }
function capDone(title){ capEl.querySelectorAll('.st i').forEach(s => { s.classList.add('done'); s.classList.remove('cur'); }); if(title) capEl.querySelector('b').textContent = title; }
function skip(){ if(!MODE.run || SKIP.on) return; SKIP.on = true; flushAll(); }
$('#dmSkip').addEventListener('click', skip); runShield.addEventListener('click', skip);
let queue = Promise.resolve();
/* run one sequence at a time; `body(ctx)` does the moves; `withHub` floats the hub UI as picture-in-picture */
function sequence(name, body, { withHub = true } = {}){ queue = queue.then(async () => {
  const back = MODE.run ? null : context(), wasPanel = back && back.kind === 'panel'; MODE.back = back;
  MODE.run = name; MODE.lockCam = true; PAD.k = null; padEl.hidden = true; doneB.hidden = true; quietTour(); actEl.classList.add('off'); runShield.hidden = false; setFill(1.6);
  if(withHub){ await emu(); if(wasPanel && EMU.docked) await toPip(); else if(!hubEl.classList.contains('pip') || !hubEl.classList.contains('vis')) await toPip(); }
  try { await body(); } catch(e){ console.warn('demo', name, e); }
  const wasSkip = SKIP.on; SKIP.on = false; flushAll(); settle();
  await wait(wasSkip ? .2 : 1.1); capEl.classList.add('off'); runShield.hidden = true; MODE.run = null; MODE.lockCam = false; MODE.kind = null;
  if(wasPanel){ await restore({ kind:'panel' }); }
  else { hubEl.classList.remove('vis'); setTimeout(() => { if(!MODE.kind && !MODE.run && !(state.focus && state.focus.k === 'hub')){ hubEl.classList.remove('pip'); showDock(false); } }, 500); await restore(back); }
  syncAct(); }); return queue; }
/* make every device match the model in one go (after a skip) */
function settle(){ GAR.place(M.garage = M.garageOpen ? 1 : 0); GAR.leds(0); const t = parts('lock').turn; if(t) t.rotation.z = M.locked ? 0 : -Math.PI/2;
  if(DOOR.pivot) DOOR.pivot.rotation.y = DOOR.sign*1.35*M.door; TH.glow = 1; TH.paint(); paintArm();
  const ls = LIT.list(); if(LIT.base) ls.forEach((l, i) => l.intensity = LIT.base[i]*(.12 + .88*M.lights)); renderer.toneMappingExposure = LIT.exp0*(.45 + .55*M.lights);
  syncEmu(); }

/* a single device, driven from the hub, the action bar or a 3D tap */
function device(k, v){
  if(k === 'therm' && !MODE.run && !MODE.kind && state.focus && state.focus.k === 'therm'){ TH.to(v); setTimeout(() => HUBDO.therm(), 0); return; }   // already looking at it
  return sequence('dev-' + k, async () => {
    if(k === 'lock'){ caption('Smart Lock', v ? 'Locking…' : 'Unlocking…', ['lock']); HUBDO.lock(v); await fly(SH.lock()); await LOCK.set(v); capDone(v ? 'Front door locked' : 'Front door unlocked'); await wait(.6); }
    if(k === 'garage'){ caption('Garage', v ? 'Opening…' : 'Closing…', ['garage']); HUBDO.garage(v); const f = fly(SH.garage()); await wait(.5); await Promise.all([f, GAR.set(v)]); capDone(v ? 'Garage open' : 'Garage closed'); }
    if(k === 'therm'){ caption('Thermostat', `Set to ${v}°`, ['temp']); await fly(SH.therm()); await TH.to(v); HUBDO.therm(); capDone(`${v}° · ${TH.active() === 'heat' ? 'Heating' : TH.active() === 'cool' ? 'Cooling' : 'Holding'}`); await wait(.8); }
  }); }
/* the hub asked for something */
function fromHub(k, v){ if(MODE.run && k !== 'arm') return;
  if(k === 'lock'){ if(M.locked === v) return; device('lock', v); }
  if(k === 'garage'){ if(M.garageOpen === v) return; device('garage', v); }
  if(k === 'therm'){ const S = EMU.S; if(!S) return; const sp = S.th.sp, mode = S.th.mode === 'auto' ? M.th.mode : S.th.mode;
    if(sp === M.th.sp && mode === M.th.mode) return; M.th.mode = mode; if(MODE.run) { TH.to(sp, mode); return; }
    if(hubEl.classList.contains('live') && thermTimer){ TH.to(sp, mode); clearTimeout(thermTimer); thermTimer = setTimeout(() => { thermTimer = null; }, 1500); return; }
    thermTimer = setTimeout(() => { thermTimer = null; }, 1500);
    sequence('dev-therm', async () => { caption('Thermostat', `Set to ${sp}°`, ['temp']); await fly(SH.therm()); await TH.to(EMU.S.th.sp, mode); await wait(1.4); while(EMU.S.th.sp !== M.th.sp){ await TH.to(EMU.S.th.sp, mode); await wait(1.2); }
      capDone(`${M.th.sp}° · ${TH.active() === 'heat' ? 'Heating' : TH.active() === 'cool' ? 'Cooling' : 'Holding'}`); await wait(.6); }); }
  if(k === 'arm') automation(v === 'dis' ? 'disarm' : v, { from:'hub' }); }
let thermTimer = null;

/* ------------------------------------------------------------------ automations */
const ECO = 78;
function automation(name, o = {}){
  const S = () => EMU.S;
  if(name === 'away' || name === 'stay') return sequence(name, async () => {
    const away = name === 'away';
    caption('Automation', away ? 'Arm Away' : 'Arm Stay', away ? ['garage', 'lock', 'bulb', 'temp', 'shield'] : ['garage', 'lock', 'shield']);
    M.arm = name; paintArm();
    capStep(0, M.garageOpen ? 'Closing the garage' : 'Garage closed'); await fly(SH.garage()); HUBDO.garage(false); await GAR.set(false); if(!M.garageOpen) await wait(.5);
    capStep(1, 'Locking the doors'); HUBDO.lock(true); await fly(SH.lock()); await LOCK.set(true); await wait(.3);
    if(away){ capStep(2, 'Lights off'); await fly(SH.great()); await LIT.to(.15, 1.6);
      capStep(3, `Eco mode ${ECO}°`); await fly(SH.therm()); await TH.to(ECO, 'cool'); HUBDO.therm(); await wait(.5); }
    capStep(away ? 4 : 2, away ? 'Armed Away' : 'Armed Stay'); await atHub(); HUBDO.home(); HUBDO.arm(name); paintArm(); await wait(1.6);
    capDone(away ? 'Armed Away' : 'Armed Stay'); await offHub(); await finale(); });
  if(name === 'welcome') return sequence('welcome', async () => {
    const armed = M.arm !== 'dis';
    caption('Automation', 'Welcome Home', ['keys', 'shield', 'unlock', 'door', 'bulb', 'temp']);
    if(!o.typed){   // played from Scenes: the house is set as if nobody is home, then we walk up to the door and key in the code
      if(!armed){ M.arm = 'away'; paintArm(); HUBDO.arm('away'); }
      capStep(0, 'Code at the door'); const dim = M.lights > .5 ? LIT.to(.15, 1.2) : null; await fly(padPose('lock')); if(dim) await dim;
      for(const d of CODE){ await wait(.45); pressKey((parts('lock').keys || []).find(m => digitOf(m) === d)); } await wait(.4); }
    capStep(1, 'Alarm disarmed'); M.arm = 'dis'; paintArm(); HUBDO.home(); HUBDO.arm('dis'); await LOCK.flash(GREEN, 1);   // the hub card shows it disarm
    capStep(2, 'Door unlocked'); HUBDO.lock(false); await LOCK.set(false);
    capStep(3, 'Door opens'); await fly(SH.door()); await DOOR.swing(true);
    capStep(4, 'Lights on'); if(M.lights < .9){ await fly(SH.great()); await LIT.to(1, 1.4); }
    capStep(5, 'Comfort 72°'); await fly(SH.therm()); M.th.cur = Math.max(M.th.cur, 74); await TH.to(72, 'cool'); HUBDO.therm(); await wait(.6);
    capDone('Welcome home'); await fly(SH.door()); await DOOR.swing(false, 1.8); });
  if(name === 'disarm' || name === 'kpok') return sequence('disarm', async () => {
    caption('Security', name === 'kpok' ? 'Code accepted' : 'Disarmed', ['shield']);
    M.arm = 'dis'; paintArm(); HUBDO.arm('dis'); if(o.from === 'keypad'){ await wait(.6); } else { await fly(SH.home()); }
    await LOCK.flash(GREEN, 1); capDone('System disarmed'); await wait(.4); }, { withHub:o.from !== 'keypad' || true });
  if(name === 'night') return sequence('night', async () => {
    caption('Automation', 'Goodnight', ['lock', 'garage', 'bulb', 'temp', 'shield']);
    capStep(0, 'Doors locked'); HUBDO.lock(true); await fly(SH.lock()); if(M.door) await DOOR.swing(false, 1.4); await LOCK.set(true);
    capStep(1, M.garageOpen ? 'Closing the garage' : 'Garage closed'); await fly(SH.garage()); HUBDO.garage(false); await GAR.set(false); await wait(.3);
    capStep(2, 'Lights off'); await fly(SH.great()); await LIT.to(.15, 1.8);
    capStep(3, 'Sleep 68°'); await fly(SH.therm()); M.th.cur = Math.max(M.th.cur, 72); await TH.to(68, 'cool'); HUBDO.therm(); await wait(.5);
    capStep(4, 'Armed Stay'); await atHub(); HUBDO.home(); M.arm = 'stay'; HUBDO.arm('stay'); paintArm(); await wait(1.6); await offHub();
    capDone('Goodnight'); await finale(); });
  if(name === 'smoke') return sequence('smoke', async () => {
    caption('Life safety', 'Smoke detected', ['fire', 'bell', 'bulb', 'temp', 'unlock'], true);
    capStep(0); setFill(1.4, RED); await fly(SH.smoke()); SMOKE.on(); await wait(1.6);
    capStep(1, 'Fire dept. alerted'); await atHub(); M.alarm = true; HUBDO.alarm('Smoke detected in the living room. The fire department has been requested.'); paintArm(); await wait(2);
    await offHub(); capStep(2, 'Lights on'); await fly(SH.great()); await LIT.to(1, .8);
    capStep(3, 'HVAC off'); await fly(SH.therm()); await TH.to(M.th.sp, 'off'); HUBDO.therm(); await wait(.7);
    capStep(4, 'Doors unlock'); HUBDO.lock(false); await fly(SH.door()); await LOCK.set(false); await DOOR.swing(true, 1.8); await wait(.8);
    capDone('Clear path out'); await wait(1.2);
    /* reset: the alarm is silenced, the door closes, heating/cooling resumes */
    SMOKE.off(); setFill(1.6); M.alarm = false; HUBDO.clearAlarm(); M.arm = 'dis'; paintArm(); await DOOR.swing(false, 1.6); M.th.mode = 'cool'; TH.paint(); HUBDO.therm(); }, {});
}
/* scenes menu */
$('#dmScB').addEventListener('click', e => { e.stopPropagation(); if(MODE.run) return; scenesEl.classList.toggle('off'); $('#dmScB').classList.toggle('on', !scenesEl.classList.contains('off')); });
scenesEl.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if(!b) return; scenesEl.classList.add('off'); $('#dmScB').classList.remove('on');
  if(MODE.kind && MODE.kind !== 'panel') leaveModeQuiet(); automation(b.dataset.sc); });
addEventListener('pointerdown', e => { if(!scenesEl.classList.contains('off') && !e.target.closest('#dmScenes,#dmScB')){ scenesEl.classList.add('off'); $('#dmScB').classList.remove('on'); } }, true);
$('#dmHubB').addEventListener('click', () => { if(MODE.run) return; if(MODE.kind === 'panel') return leaveMode(); if(MODE.kind) leaveModeQuiet(); enterPanel(); });
function leaveModeQuiet(){ MODE.kind = null; MODE.lockCam = false; padEl.hidden = true; doneB.hidden = true; }
function hudOn(){ $('#dmHubB').classList.toggle('on', MODE.kind === 'panel'); }
addEventListener('keydown', e => { if(e.key === 'Escape'){ if(MODE.run) skip(); else if(MODE.kind) leaveMode(); } });
addEventListener('resize', () => { if(MODE.kind === 'panel' && !MODE.run){ const p = panelPose(); camera.position.copy(p.pos); controls.target.copy(p.target); camera.lookAt(p.target); kick(); }
  if(hubEl.classList.contains('pip')) hubEl.style.transform = pipMatrix(); syncAct(); });
/* Fast Pitch pauses the tour while it is off screen: let the emulator rest too */

/* ------------------------------------------------------------------ boot */
DOOR.init(); GAR.init(); TH.paint(); paintArm(); syncAct();
window.__demo = { stats:() => ({ anims:anims.size, perFrame:perFrame.size, raf }), M, MODE, EMU, automation, device, enterPanel, enterPad, leaveMode, skip, GAR, DOOR, TH, LOCK, padKey, PAD, parts, SH, fly, pipMatrix, dockMatrix };

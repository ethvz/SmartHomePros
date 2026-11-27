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
const GREEN = 0x05e5af, LIME = 0xdfff1a, RED = 0xff3b30, AMBER = 0xff8a1f, BAD = 0xff2020;
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
.dmSc.wide{grid-column:1/-1;flex-direction:row;align-items:center;gap:12px}
.dmSc.wide i{color:#fff}
/* Smart Deter controls in the camera bars: the deter toggle glows red while on; the linger time cycles 2 / 5 / 10 / 15 s */
#card #dmAct button.dtr.on{background:rgba(255,59,48,.24);box-shadow:inset 0 0 0 1px rgba(255,92,80,.65)}
#card #dmAct button.dtr.on svg{color:#ff5a4f}
#card #dmAct button.lg{padding:0 13px;gap:6px;font-variant-numeric:tabular-nums}
/* hub emulator: one iframe, docked on the 3D glass (homography) or floating as a picture-in-picture card */
#dmHub{position:fixed;left:0;top:0;width:1280px;height:750px;transform-origin:0 0;z-index:4;pointer-events:none;opacity:0;transition:opacity .45s}
#dmHub.vis{opacity:1}
#dmHub.live{pointer-events:auto}
#dmHub iframe{position:absolute;inset:0;width:1280px;height:750px;border:0;background:#000;display:block}
#dmHub.pip{z-index:10}
#dmHub.pip iframe{border-radius:44px;box-shadow:0 0 0 10px #0c0d0d,0 0 0 13px #d9dbd8,0 40px 90px rgba(0,0,0,.6)}
#dmShield{position:absolute;inset:0;cursor:pointer}
/* Vivint App emulator: one iframe, docked on the 3D phone's glass on the island (homography) or floating as picture-in-picture */
#dmApp{position:fixed;left:0;top:0;width:440px;height:956px;transform-origin:0 0;z-index:4;pointer-events:none;opacity:0;transition:opacity .45s;border-radius:55px;overflow:hidden}
#dmApp.vis{opacity:1}
#dmApp.live{pointer-events:auto}
#dmApp iframe{position:absolute;inset:0;width:440px;height:956px;border:0;background:#f3f3f3;display:block}
#dmApp.pip{z-index:10;overflow:visible}
#dmApp.pip iframe{border-radius:55px;box-shadow:0 0 0 12px #0c0d0d,0 0 0 15px #5d5e60,0 40px 90px rgba(0,0,0,.6)}
#dmAppShield{position:absolute;inset:0;cursor:pointer}
#dmApp.live #dmAppShield{display:none}
#dmTryApp{position:fixed;z-index:5;left:0;top:0;padding:6px 11px 6px 9px;border-radius:16px;font-size:12px;font-weight:600;white-space:nowrap;display:flex;align-items:center;gap:8px;pointer-events:none;opacity:0;transition:opacity .35s}
#dmTryApp.vis{opacity:1}
#dmTryApp b{width:8px;height:8px;border-radius:50%;background:var(--vg);box-shadow:0 0 10px var(--vg);animation:dmBlink 1.6s infinite}
#dmHub.live #dmShield{display:none}
#dmTry{position:fixed;z-index:5;left:0;top:0;padding:6px 11px 6px 9px;border-radius:16px;font-size:12px;font-weight:600;white-space:nowrap;display:flex;align-items:center;gap:8px;pointer-events:none;opacity:0;transition:opacity .35s}
#dmTry.vis{opacity:1}
#dmTry b{width:8px;height:8px;border-radius:50%;background:var(--vg);box-shadow:0 0 10px var(--vg);animation:dmBlink 1.6s infinite}
#dmDone{position:fixed;z-index:11;top:calc(env(safe-area-inset-top,0px) + 18px);left:max(18px,env(safe-area-inset-left,0px));display:flex;align-items:center;gap:8px;height:48px;padding:0 18px 0 12px;border-radius:24px;font-weight:600;font-size:16px;transition:opacity .3s}
.emb #dmDone{top:max(22px,var(--ft,0px))}   /* --ft: set by the host when its nav corner sits at the top (upright iPhone) */
#dmDone svg{width:22px;height:22px}
#dmDone[hidden]{display:none}
/* code dots for the lock / keypad close-up */
#dmPad{position:fixed;z-index:8;left:50%;top:calc(env(safe-area-inset-top,0px) + 18px);transform:translateX(-50%);padding:14px 22px;border-radius:26px;display:flex;align-items:center;gap:18px;transition:opacity .3s,transform .4s var(--ease)}
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
/* docked inside the tour's product bar */
#card #dmAct{position:static;transform:none;left:auto;bottom:auto;padding:0;margin:0 2px;gap:6px;background:none;border:0;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;border-radius:0;flex:none}
#card #dmAct.off{display:none}
#dmAct .nm{display:none}
#card #dmAct button{height:44px;padding:0 15px;font-size:14px;gap:7px;background:rgba(255,255,255,.1)}
#card #dmAct button.pri{background:var(--vg);color:#04110d}
#card #dmAct button.rnd{width:44px;padding:0}
#card #dmAct .tv{min-width:58px;font-size:20px;line-height:1.05}
#card #dmAct svg{width:19px;height:19px}
@media (max-width:560px){
  #card.dmHas .c-name{display:none!important}
  #card #dmAct{gap:4px;margin:0}
  #card #dmAct .t{display:none}
  #card #dmAct .nm{display:block;font-size:11.5px;letter-spacing:-.01em;font-weight:700;color:#fff;margin:0 4px 0 2px;white-space:nowrap}
  #card #dmAct button{height:40px;padding:0 11px;font-size:13px}
  #card #dmAct button.pri:has(.t),#card #dmAct button[data-a=lock],#card #dmAct button.dtr{width:40px;padding:0;justify-content:center}
  #card #dmAct button.lg{padding:0 9px;gap:4px}
  #card #dmAct button.rnd{width:34px;height:34px}
  #card #dmAct .tv{min-width:40px;font-size:16px}
  #card #dmAct .tv small{font-size:8.5px;letter-spacing:.1em}
}
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
#dmCap button.nudge{animation:dmNudge .5s}
@keyframes dmNudge{30%{transform:scale(1.12);background:rgba(255,255,255,.28)}}
#dmCap button{height:40px;padding:0 16px;border-radius:20px;background:rgba(255,255,255,.1);font-weight:600;font-size:14px;flex:none}
#dmCap.alarm .st i.cur{box-shadow:inset 0 0 0 2px #ff3b30}
#dmShieldRun{position:fixed;inset:0;z-index:9}
#dmRed{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;transition:opacity .6s;box-shadow:inset 0 0 min(160px,18vmin) min(30px,3vmin) rgba(255,36,24,.75)}
#dmRed.on{opacity:1;animation:dmRedP 1.1s ease-in-out infinite}
@keyframes dmRedP{50%{opacity:.35}}
#dmShieldRun[hidden]{display:none}
/* while a close-up or automation plays, the tour's own chrome steps aside */
body.dmMode #rail,body.dmMode #spots,body.dmMode #card,body.dmMode #cFeats,body.dmMode #back,body.dmMode #brand,body.dmMode #hint,body.dmMode #dmAct,body.dmMode #dmTry,body.dmMode #dmTryApp{opacity:0!important;pointer-events:none!important}
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
  #dmPad{top:calc(env(safe-area-inset-top,0px) + 76px)}
  .emb #dmPad{top:78px}
}
@media (max-width:560px){ body:not(.focus) #dmHud{top:calc(env(safe-area-inset-top,0px) + 64px)} .emb body:not(.focus) #dmHud{top:66px} body:not(.focus) #dmScenes{top:calc(env(safe-area-inset-top,0px) + 116px)} .emb body:not(.focus) #dmScenes{top:118px} }
@media (max-width:430px){ #dmCap .st{display:none} #dmPad .cd{display:none} }
`; document.head.appendChild(css);

const IC = {
  hub:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="12" rx="2.2"/><path d="M3 13.2h18M8.5 19.5h7"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="6.5" y="2.8" width="11" height="18.4" rx="2.6"/><path d="M10.5 5.6h3" stroke-linecap="round"/></svg>',
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
  deter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 12L6.2 17.6M12 12l5.8 5.6" opacity=".55"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
  person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="2.6"/><path d="M8.5 21l1.2-6.5L8 11.5c1-1.6 2.4-2.3 4-2.3s3 .7 4 2.3l-1.7 3L15.5 21"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  spk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/></svg>',
};
const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for(const k in attrs) e.setAttribute(k, attrs[k]); e.innerHTML = html; document.body.appendChild(e); return e; };
const hud = el('div', { id:'dmHud' }, `<div id="dmArm" class="glass"><i></i><span>Disarmed</span></div>
  <button class="dmPill glass" id="dmHubB" aria-label="Use the Smart Hub">${IC.hub}<span>Smart Hub</span></button>
  <button class="dmPill glass" id="dmAppB" aria-label="Use the Vivint App">${IC.phone}<span>App</span></button>
  <button class="dmPill glass lbl" id="dmScB" aria-label="Scenes">${IC.spark}<span>Scenes</span></button>`);
const SCN = [['away','Arm Away','Leaving home', IC.shield, '#ff9a3c'], ['welcome','Welcome Home','Code at the door', IC.home, '#05E5AF'],
  ['night','Goodnight','Lock up for bed', IC.moon, '#8fa8ff'], ['smoke','Smoke Alarm','Fire safety', IC.fire, '#ff5a4a'], ['deter','Smart Deter','A visitor at night', IC.person, '#ff3b30']];
const scenesEl = el('div', { id:'dmScenes', class:'glass off' }, '<h3>Automations</h3>' + SCN.map(([k, t, s, i, c]) =>
  `<button class="dmSc${k === 'deter' ? ' wide' : ''}" data-sc="${k}" style="--c:${c}"><i>${i}</i><span>${t}<small>${s}</small></span></button>`).join(''));
const hubEl = el('div', { id:'dmHub' }, '<div id="dmShield"></div>');
const appEl = el('div', { id:'dmApp' }, '<div id="dmAppShield"></div>');
const tryApp = el('div', { id:'dmTryApp', class:'glass' }, '<b></b>Tap the phone');
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
  front:   () => { const port = aspect() < 1, tg = port ? V(-3.4, 2.2, 5.6) : V(-1.6, 1.7, 5.4), d = fitDist(port ? 11 : 15.6, 5.8, .92, .74);   // the whole street front: cones, door, visitor
    return { pos:tg.clone().addScaledVector(V(0, .44, 1).normalize(), d), target:tg }; },
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
    return tween(.45*n, (e, k) => { const on = Math.sin(k*n*Math.PI) ** 2; leds.forEach(m => meshMats(m).forEach(x => { const bad = hex === BAD; glowMat(x, bad ? 0xff0000 : hex, (bad ? .42 : 2.4)*on); if(x.color){ if(x.userData.c0 == null) x.userData.c0 = x.color.getHex(); x.color.setHex(on > .05 ? (bad ? 0x500000 : hex) : x.userData.c0); }   /* red stays red under ACES only at low brightness */ })); }, t => t); },
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
const KP = {
  flashBad(){ const p = parts('keypad'), g = P('keypad') && P('keypad').model; if(!g) return;
    const mats = [...(p.statusIcons || []).flatMap(meshMats), ...(p.slot ? meshMats(p.slot) : [])], x0 = g.position.clone(), side = V(0, 0, 1).applyQuaternion(g.quaternion).cross(V(0, 1, 0)).normalize();
    tween(.6, (e, k) => { const on = Math.sin(k*3*Math.PI) ** 2; mats.forEach(m => glowMat(m, RED, 2.2*on)); g.position.copy(x0).addScaledVector(side, Math.sin(k*Math.PI*6)*(1 - k)*.004); }, t => t)
      .then(() => { g.position.copy(x0); mats.forEach(m => glowMat(m, RED, 0)); KP.paint(); }); },
  paint(){ const p = parts('keypad'); if(p.slot) meshMats(p.slot).forEach(m => { m.emissive && m.emissive.setHex(M.alarm ? RED : M.arm === 'dis' ? 0x83f4b8 : AMBER); m.emissiveIntensity = 1.1; });
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
/* the 3D hub's own glass: an always-on status screen drawn to match the live hub (demo time 6:30 pm, arm state), so the
   panel never shows a stale screenshot next to the live UI */
const DEMO_TIME = { h:18, m:30 };
const HUBSCR = (() => { let mesh = null; const p = P('hub'); if(!p) return { draw(){} };
  p.model.traverse(o => { if(o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs((o.geometry.parameters || {}).width - .1513) < 1e-4) mesh = o; });
  if(!mesh || !mesh.material.map) return { draw(){} };
  const c = document.createElement('canvas'); c.width = 1024; c.height = 620; const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const draw = () => { const W = 1024, Hh = 620, F = '"Vivint Sans",-apple-system,Helvetica,Arial,sans-serif';
    const col = M.alarm ? '#ff3b30' : M.arm !== 'dis' ? '#ff8a1f' : '#05E5AF', lab = M.alarm ? 'Alarm' : M.arm === 'away' ? 'Armed Away' : M.arm === 'stay' ? 'Armed Stay' : 'Disarmed';
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 900); g.addColorStop(0, M.alarm ? '#3a0c08' : M.arm !== 'dis' ? '#3a1c08' : '#0b2a20'); g.addColorStop(.6, '#050807'); g.addColorStop(1, '#000');
    x.fillStyle = g; x.fillRect(0, 0, W, Hh);
    x.fillStyle = '#fff'; x.textBaseline = 'alphabetic'; x.font = '300 210px ' + F; const hh = ((DEMO_TIME.h + 11) % 12) + 1, tm = hh + ':' + String(DEMO_TIME.m).padStart(2, '0');
    x.fillText(tm, 80, 330); const tw = x.measureText(tm).width; x.font = '400 54px ' + F; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText(DEMO_TIME.h < 12 ? 'AM' : 'PM', 96 + tw, 330);
    x.font = '400 40px ' + F; x.fillText(new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' }), 84, 140);
    x.beginPath(); x.roundRect(80, 400, 380, 92, 46); x.fillStyle = col + '33'; x.fill(); x.strokeStyle = col; x.lineWidth = 3; x.stroke();
    x.beginPath(); const sx = 128, sy = 446; x.moveTo(sx, sy - 22); x.lineTo(sx + 19, sy - 14); x.lineTo(sx + 19, sy + 2); x.quadraticCurveTo(sx + 17, sy + 18, sx, sy + 25); x.quadraticCurveTo(sx - 17, sy + 18, sx - 19, sy + 2); x.lineTo(sx - 19, sy - 14); x.closePath(); x.fillStyle = col; x.fill();
    x.fillStyle = '#fff'; x.font = '500 44px ' + F; x.fillText(lab, 168, 461);
    t.needsUpdate = true; };
  const m = mesh.material; m.map = t; m.emissiveMap = t; draw(); document.fonts && document.fonts.ready.then(draw);
  return { draw }; })();
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
/* the emulators show the demo time (6:30 pm), like the 3D hub glass and the phone's lock screen */
function pinTime(f, re){ const pin = () => { try { const w = f.contentWindow, d = f.contentDocument; if(!w || !d || !re.test(d.URL)){ setTimeout(pin, 4); return; } if(w.__demoTime) return;
    const RD = w.Date, fixed = () => { const n = new RD(); n.setHours(DEMO_TIME.h, DEMO_TIME.m, 0, 0); return n.getTime(); };
    w.Date = class extends RD { constructor(...a){ if(a.length) super(...a); else super(fixed()); } static now(){ return fixed(); } }; w.__demoTime = true; } catch(e){ setTimeout(pin, 8); } };
  pin(); }
function emu(){ if(EMU.ready) return EMU.ready;
  EMU.ready = new Promise(res => { const f = document.createElement('iframe'); f.title = 'Smart Hub Pro 2'; f.setAttribute('allow', 'autoplay');
    f.src = '../emu/index.html?flat&v=' + (T.TOURV || 1); hubEl.insertBefore(f, hubEl.firstChild); EMU.frame = f;
    pinTime(f, /emu/);
    f.addEventListener('load', () => { const poll = () => { try { const d = f.contentDocument, u = f.contentWindow.eval('UI');
        if(!d || !u || !d.getElementById('gB')) return setTimeout(poll, 80);
        EMU.w = f.contentWindow; EMU.doc = d; EMU.UI = u; EMU.S = u.S; hookEmu(); res(EMU); } catch(e){ setTimeout(poll, 120); } }; poll(); }); });
  return EMU.ready; }
const q = s => EMU.doc && EMU.doc.querySelector(s);
function emuClick(sel){ const b = q(sel); if(!b) return false; EMU.driving = true; try { b.click(); } finally { EMU.driving = false; } return true; }
/* 3D -> hub: press the emulator's own buttons, so its UI animates itself */
const HUBDO = {
  lock(locked){ if(!EMU.S || EMU.S.locks.front === locked || lockBusy()) return; emuClick('[data-act="lock"][data-lk="front"]'); },
  garage(open){ if(!EMU.S) return; const busy = q('#gB') && q('#gB').classList.contains('busy'); if(busy || (EMU.S.garage === 'open') === open) return; emuClick('#gB'); },
  arm(k){ if(!EMU.S || EMU.S.arm === k) return; emuClick(`[data-act="setarm"][data-arm="${k}"]`); },
  therm(){ const S = EMU.S; if(!S) return; const t = M.th;
    for(let i = 0; i < 4 && S.th.mode !== t.mode; i++) emuClick('[data-act="tmode"]');
    S.th.cur = t.cur; let n = 0; while(S.th.sp < t.sp && n++ < 40) emuClick('[data-act="tup"]'); while(S.th.sp > t.sp && n++ < 80) emuClick('[data-act="tdn"]');
    if(!n){ emuClick('[data-act="tup"]'); emuClick('[data-act="tdn"]'); } },
  alarm(msg){ if(!EMU.UI) return; EMU.driving = true; EMU.UI.demo(3); EMU.driving = false; const s = q('#almS'); if(s) s.innerHTML = 'Enter PIN to silence alarm.<br>' + msg; },
  clearAlarm(){ if(!EMU.S || !EMU.S.alarm) return; if(SKIP.on){ EMU.driving = true; EMU.UI.demo(0); EMU.driving = false; return; }   // instant; a reconcile restores anything demo(0) reset
    for(const d of CODE) emuClick(`[data-pin="${d}"]`); },
  home(){ if(EMU.UI){ emuClick('[data-act="close"]'); } },
};
const lockBusy = () => !!q('[data-act="lock"][data-lk="front"].busy');
/* push the house's state to the hub. Order matters: disarm before unlocking (or the hub raises "front door opened"),
   lock before arming. The hub's lock and garage buttons flip after a delay, so this runs again shortly after. */
function syncEmu(){ if(!EMU.S || MODE.run) return; const S = EMU.S; S.th.cur = M.th.cur; HUBDO.therm();
  if(M.arm === 'dis') HUBDO.arm('dis'); HUBDO.lock(M.locked); HUBDO.garage(M.garageOpen); if(M.arm !== 'dis' && !M.garageOpen) HUBDO.arm(M.arm); }
function reconcile(){ syncApp(); syncEmu(); clearTimeout(reconcile.t); reconcile.t = setTimeout(() => { syncEmu(); reconcile.t = setTimeout(syncEmu, 1900); }, 900); }
/* what the presenter last touched on the hub: only a real tap there may change the house (stale reads never do) */
const USER = { lock:0, arm:0 };
const recent = (t, ms) => performance.now() - t < ms;
/* hub -> 3D: watch what the emulator does */
let pend = null;
function hookEmu(){ const d = EMU.doc;
  EMU.w.addEventListener('hubled', e => { const c = e.detail || {}; HUBLED.set(c.alarm || EMU.S.alarm ? RED : EMU.S.arm !== 'dis' ? AMBER : GREEN, !!EMU.S.alarm); });
  d.addEventListener('click', e => { if(EMU.driving) return; if(e.target.closest && e.target.closest('[data-pin]')) USER.arm = performance.now();
    const a = e.target.closest && e.target.closest('[data-act]'); if(!a) return;
    const act = a.dataset.act;
    if(act === 'lock' || act === 'pdlock' || (act === 'rail' && a.dataset.r === 'lock')) USER.lock = performance.now();
    if(act === 'setarm' || act === 'arm') USER.arm = performance.now();
    if(act === 'garage' && !a.classList.contains('busy')) setTimeout(() => fromHub('garage', !M.garageOpen), 0);
    if(act === 'tup' || act === 'tdn' || act === 'tmode') setTimeout(() => fromHub('therm'), 0); }, true);
  new MutationObserver(() => { if(!pend) pend = Promise.resolve().then(() => { pend = null; diffEmu(); }); })
    .observe(d.getElementById('scr'), { subtree:true, attributes:true, attributeFilter:['class'], childList:true });
  syncEmu(); }
function diffEmu(){ if(EMU.driving || !EMU.S || MODE.run) return; const S = EMU.S;   // during a sequence the 3D side leads; it syncs the hub after
  if(S.arm !== M.arm && !S.alarm){ if(recent(USER.arm, 6000)){ USER.arm = 0; const k = S.arm; M.arm = k; paintArm(); fromHub('arm', k); return; } reconcile(); }
  if(S.locks.front !== M.locked && !lockBusy()){ if(recent(USER.lock, 2500)){ USER.lock = 0; fromHub('lock', S.locks.front); } else reconcile(); }
  if(!S.alarm && M.alarm){ M.alarm = false; paintArm(); } }
function paintArm(){ const a = $('#dmArm'); a.classList.toggle('armed', M.arm !== 'dis'); a.classList.toggle('alarm', M.alarm);
  a.querySelector('span').textContent = M.alarm ? 'Alarm' : M.arm === 'away' ? 'Armed Away' : M.arm === 'stay' ? 'Armed Stay' : 'Disarmed';
  HUBLED.set(M.alarm ? RED : M.arm !== 'dis' ? AMBER : GREEN, M.alarm); KP.paint(); HUBSCR.draw && HUBSCR.draw(); }

/* dock: the iframe drawn onto the 3D hub glass with a CSS homography of the four projected screen corners */
const SCR = { c:V(-.0032, .01555, .0227), w:.1513, h:.1513*750/1280 };
function screenCorners(){ const g = P('hub').model; g.updateMatrixWorld(); const { c, w, h } = SCR;
  return [[-w/2, h/2], [w/2, h/2], [w/2, -h/2], [-w/2, -h/2]].map(([x, y]) => g.localToWorld(V(c.x + x, c.y + y, c.z))); }
function homog(pts, W = 1280, H = 750){ const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = pts;
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
  if(MODE.kind !== 'panel' && !MODE.run){ const r = hubEl.getBoundingClientRect(), b = P('hub').model.localToWorld(V(0, -.085, .02)).project(camera), by = (1 - b.y)/2*innerHeight; tryEl.style.transform = `translate3d(${(r.left + r.right)/2 - tryEl.offsetWidth/2}px,${by + 10}px,0)`; } }
function showDock(on){ if(on){ emu(); EMU.docked = true; hubEl.classList.remove('pip'); hubEl.style.transition = ''; perFrame.add(dockStep); kick(); }
  else { perFrame.delete(dockStep); hubEl.classList.remove('vis', 'live'); tryEl.classList.remove('vis'); } }
async function toPip(){ if(!hubEl.classList.contains('vis')) { hubEl.style.transition = 'none'; hubEl.style.transform = pipMatrix(); hubEl.classList.add('pip'); void hubEl.offsetWidth; hubEl.style.transition = ''; hubEl.classList.add('vis'); EMU.docked = false; perFrame.delete(dockStep); return; }
  EMU.docked = false; perFrame.delete(dockStep); hubEl.classList.remove('live'); hubEl.classList.add('pip');
  hubEl.style.transition = 'transform .8s cubic-bezier(.2,.75,.2,1), opacity .45s'; hubEl.style.transform = pipMatrix(); EMU.mx = ''; await wait(.8); }
/* end of an automation: pull back to the whole home, unless we are about to return to the hub or a product anyway */
function finale(){ const b = MODE.back; return b && (b.kind || b.focus) ? wait(.4) : fly(SH.home()); }
async function atHub(){ await fly(SH.hub()); if(!SKIP.on && !(MODE.viaApp && !EMU.S)) await toDock(); }   // from the app with the hub never opened: its 3D glass shows the arm state (one emulator in memory)
async function offHub(){ if(MODE.viaApp){ hubEl.classList.remove('vis'); perFrame.delete(dockStep); if(!SKIP.on) await wait(.3); return; }   // the app is already the floating screen
  if(EMU.docked && !SKIP.on) await toPip(); }
async function toDock(){ const m = dockMatrix(); if(!m){ showDock(false); return; }
  hubEl.style.transition = 'transform .75s cubic-bezier(.2,.75,.2,1), opacity .45s'; hubEl.style.transform = m; EMU.mx = m; await wait(.75);
  hubEl.classList.remove('pip'); hubEl.style.transition = ''; EMU.docked = true; perFrame.add(dockStep); kick(); }

/* ------------------------------------------------------------------ the Vivint App emulator on the phone (../appemu, same-origin iframe)
   Works like the hub: docked on the phone's glass with a homography, live in a close-up looking down at the island, floating as
   picture-in-picture while the house plays what was tapped. Loaded on first use of the phone. */
const APP = { frame:null, w:null, api:null, ready:null, docked:true, mx:'' };
function app(){ if(APP.ready) return APP.ready;
  APP.ready = new Promise(res => { const f = document.createElement('iframe'); f.title = 'Vivint App'; f.setAttribute('allow', 'autoplay');
    f.src = '../appemu/index.html?v=' + (T.TOURV || 1); appEl.insertBefore(f, appEl.firstChild); APP.frame = f; pinTime(f, /appemu/);
    f.addEventListener('load', () => { const poll = () => { try { const w = f.contentWindow; if(!w || !w.__appReady || !w.AppEmu) return setTimeout(poll, 80);
        APP.w = w; APP.api = w.AppEmu; APP.api.on(fromApp); syncApp(); res(APP); } catch(e){ setTimeout(poll, 120); } }; poll(); }); });
  return APP.ready; }
const appScr = () => P('app').model.userData.screen;
const appQuat = () => appScr().obj.getWorldQuaternion(new THREE.Quaternion());
function appCorners(){ const sc = appScr(); sc.obj.updateMatrixWorld();
  return [[-sc.w/2, sc.h/2], [sc.w/2, sc.h/2], [sc.w/2, -sc.h/2], [-sc.w/2, -sc.h/2]].map(([x, y]) => sc.obj.localToWorld(V(x, y, sc.z))); }
function appMatrix(){ camera.updateMatrixWorld(); const W = innerWidth, H = innerHeight, pts = [];
  if(tmpV.copy(camera.position).sub(P('app').center).dot(V(0, 0, 1).applyQuaternion(appQuat())) < .02) return null;
  for(const p of appCorners()){ const v = p.project(camera); if(v.z > 1 || v.z < -1) return null; pts.push([(v.x + 1)/2*W, (1 - v.y)/2*H]); }
  return homog(pts, 440, 956); }
function appPip(){ const W = innerWidth, H = innerHeight, s = Math.min(300, H*.4, W*.3*956/440)/956, top = (document.documentElement.classList.contains('emb') ? 22 : 18) + 18;
  return `matrix3d(${s},0,0,0,0,${s},0,0,0,0,1,0,${W - 440*s - 30},${top},0,1)`; }
let appHideT = 0;
function appVis(on){ clearTimeout(appHideT); if(on){ appEl.style.visibility = ''; if(!appEl.classList.contains('vis')) appEl.classList.add('vis'); }
  else { appEl.classList.remove('vis'); appHideT = setTimeout(() => { if(!appEl.classList.contains('vis')) appEl.style.visibility = 'hidden'; }, 500); } }   // hidden: the app's own animations stop painting
function appDockStep(){ if(!APP.docked) return; const m = appMatrix(); if(!m){ appVis(false); return; }
  if(m !== APP.mx){ APP.mx = m; appEl.style.transform = m; }
  if(!appEl.classList.contains('vis')) appVis(true);
  if(MODE.kind !== 'app' && !MODE.run){ const c = appCorners(), a = c[2].clone().project(camera), b = c[3].clone().project(camera), cx = ((a.x + b.x)/2 + 1)/2*innerWidth, by = (1 - Math.min(a.y, b.y))/2*innerHeight;
    tryApp.style.transform = `translate3d(${cx - tryApp.offsetWidth/2}px,${by + 14}px,0)`; } }
function appShowDock(on){ if(on){ app(); APP.docked = true; appEl.classList.remove('pip'); appEl.style.transition = ''; perFrame.add(appDockStep); kick(); }
  else { perFrame.delete(appDockStep); appVis(false); appEl.classList.remove('live'); tryApp.classList.remove('vis'); } }
async function appToPip(){ if(!appEl.classList.contains('vis')){ appEl.style.transition = 'none'; appEl.style.transform = appPip(); appEl.classList.add('pip'); void appEl.offsetWidth; appEl.style.transition = ''; appVis(true); APP.docked = false; perFrame.delete(appDockStep); return; }
  APP.docked = false; perFrame.delete(appDockStep); appEl.classList.remove('live'); appEl.classList.add('pip');
  appEl.style.transition = 'transform .8s cubic-bezier(.2,.75,.2,1), opacity .45s'; appEl.style.transform = appPip(); APP.mx = ''; await wait(.8); }
async function appToDock(){ const m = appMatrix(); if(!m){ appShowDock(false); return; }
  appEl.style.transition = 'transform .75s cubic-bezier(.2,.75,.2,1), opacity .45s'; appEl.style.transform = m; APP.mx = m; await wait(.75);
  appEl.classList.remove('pip'); appEl.style.transition = ''; APP.docked = true; perFrame.add(appDockStep); kick(); }
/* the close-up: look down at the phone from just past its bottom edge, so the screen reads upright */
function appPose(){ const sc = appScr(), q = appQuat(), c = sc.obj.localToWorld(V(0, 0, sc.z)), n = V(0, 0, 1).applyQuaternion(q), dn = V(0, -1, 0).applyQuaternion(q);
  const s = P('app').model.scale.x, d = fitDist(sc.w*s, sc.h*s, .8, aspect() < 1 ? .74 : .8), dir = n.clone().addScaledVector(dn, .14).normalize();
  return { pos:c.clone().addScaledVector(dir, d), target:c }; }
async function enterApp(back){ if(MODE.run) return; await app(); quietTour(); MODE.kind = 'app'; MODE.lockCam = true; doneB.hidden = false; tryApp.classList.remove('vis'); hudOn();
  const shown = APP.docked && appEl.classList.contains('vis');   // already on the glass: it rides along; otherwise it fades in on arrival (never drawn over a wall mid-flight)
  if(!shown && APP.docked) appShowDock(false);
  await fly(appPose(), back ? 1.5 : 1.3); controls.enabled = false; if(MODE.kind !== 'app') return;
  if(APP.docked && !shown) appShowDock(true);
  if(!APP.docked) await appToDock();
  if(MODE.kind === 'app') appEl.classList.add('live'); }
/* house -> app: the app shows what the house (or the hub) just did, without echoing it back */
function syncApp(){ if(!APP.api || MODE.run) return; const t = M.th;
  APP.api.apply({ sec:M.alarm ? null : M.arm, lock:{ front:M.locked }, gar:{ main:M.garageOpen }, th:{ hall:{ set:t.sp, cur:t.cur, mode:t.mode === 'off' ? 'off' : t.mode === 'heat' ? 'heat' : 'cool' } }, lights:M.lights > .5,
    deter:{ door:+M.deter.dbcp, night:+M.deter.ocp, gen2:+M.deter.ocspot } }); }
/* app -> house: a tap in the app plays the same 3D sequences the hub triggers */
let appTh = null;
function fromApp(type, d){ if(MODE.run) return;
  if(type === 'lock' && d.k === 'front'){ if(M.locked !== d.lock) device('lock', d.lock); }
  if(type === 'gar' && d.k === 'main'){ if(M.garageOpen !== d.open) device('garage', d.open); }
  if(type === 'sec'){ if(d.k !== M.arm) automation(d.k === 'dis' ? 'disarm' : d.k, { from:'app' }); }
  if(type === 'th' && d.k === 'hall'){ clearTimeout(appTh); appTh = setTimeout(() => { appTh = null; if(d.mode === 'off'){ if(M.th.mode !== 'off') sequence('dev-therm', async () => { caption('Thermostat', 'Off', ['temp']); await fly(SH.therm()); await TH.to(M.th.sp, 'off'); HUDO_therm(); capDone('Thermostat off'); await wait(.6); }); return; }
      if(d.set !== M.th.sp || d.mode !== M.th.mode){ M.th.mode = d.mode; device('therm', d.set); } }, 900); }
  if(type === 'light'){ const S = APP.api.state, on = !!(S.light[3] || S.light[4]); if(on === (M.lights > .5)) return;
    sequence('dev-lights', async () => { caption('Lights', on ? 'Lights on' : 'Lights off', ['bulb']); await fly(SH.great()); await LIT.to(on ? 1 : .15, 1.4); capDone(on ? 'Lights on' : 'Lights off'); await wait(.5); }); }
  if(type === 'deter'){ const ks = (d.keys || []).map(k => FROMAPP[k]).filter(k => k && M.deter[k] !== !!d.on); if(!ks.length) return;
    sequence('dev-deter', async () => { caption('Smart Deter', d.on ? 'Turning deter on' : 'Turning deter off', ['eye']); await fly(SH.front()); setDeter(ks, d.on);
      await wait(d.on ? 2.6 : 1.2); capDone(d.on ? 'Deter on · Scanning' : 'Deter off'); await wait(.6); }, { withHub:false }); }
  if(type === 'sc') automation(d.k === 'leave' ? 'away' : d.k === 'bed' ? 'night' : 'welcome', d.k === 'arrive' ? { typed:true } : {});
}
const HUDO_therm = () => HUBDO.therm();
appEl.querySelector('#dmAppShield').addEventListener('click', () => enterApp());

/* ------------------------------------------------------------------ modes: hub panel, lock keypad, keypad close-ups */
const tour = { card:$('#card'), back:$('#back') };
function quietTour(){ state.focus = null; document.body.classList.remove('focus'); document.body.classList.add('dmMode'); tour.card.classList.add('away'); tour.back.hidden = true;
  PRODUCTS.forEach(q => q.chip && q.chip.setAttribute('aria-current', 'false')); state.idleAt = performance.now() + 1e9; controls.autoRotate = false; scenesEl.classList.add('off'); }
function context(){ if(MODE.kind === 'panel') return { kind:'panel' }; if(MODE.kind === 'app') return { kind:'app' }; if(MODE.kind && PAD.k) return { focus:PAD.k }; if(state.focus) return { focus:state.focus.k }; return {}; }
async function restore(c){ document.body.classList.remove('dmMode'); setFill(0); state.idleAt = performance.now();
  if(c && c.kind === 'panel') return enterPanel(true);
  if(c && c.kind === 'app') return enterApp(true);
  if(c && c.focus){ state.focus = null; T.focus(c.focus); return; }
  T.overview(); }
function panelPose(){ const p = P('hub'), g = p.model, c = g.localToWorld(SCR.c.clone()), n = V(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
  const s = g.scale.x, d = fitDist(SCR.w*s, SCR.h*s, .8, aspect() < 1 ? .56 : .68); return { pos:c.clone().addScaledVector(n, d), target:c }; }
async function enterPanel(back){ if(MODE.run) return; await emu(); if(EMU.S && (EMU.S.open === 'sv' || EMU.S.open === 'pd')) emuClick('[data-act="close"]');   /* wake from the always-on view */ quietTour(); MODE.kind = 'panel'; MODE.lockCam = true; doneB.hidden = false; tryEl.classList.remove('vis'); hudOn();
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
function leaveMode(){ const k = MODE.kind, pk = PAD.k; MODE.kind = null; setTimeout(hudOn, 0); MODE.lockCam = false; padEl.hidden = true; doneB.hidden = true; hubEl.classList.remove('live'); appEl.classList.remove('live');
  controls.enabled = true; document.body.classList.remove('dmMode');
  if(k === 'panel'){ state.focus = null; T.focus('hub'); } else if(k === 'app'){ state.focus = null; T.focus('app'); } else if(pk){ state.focus = null; T.focus(pk); } else T.overview(); }
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
  if(!ok){ padEl.classList.remove('bad'); void padEl.offsetWidth; padEl.classList.add('bad'); if(k === 'lock'){ LOCK.flash(BAD, 2); LOCK.shake(); } else KP.flashBad();
    await wait(.7); PAD.code = ''; padDots(); padEl.classList.remove('bad'); return; }
  padEl.classList.add('ok');
  if(k === 'lock') automation('welcome', { typed:true });
  else automation(M.arm === 'dis' ? 'kpok' : 'disarm', { from:'keypad' }); }

/* taps on the 3D scene (called by index.html before its own product hit test) */
const hits = (o, ray) => o && ray.intersectObject(o, true).length > 0;
window.__tapHook = (ray, e) => {
  if(MODE.run){ nudgeSkip(); return true; }
  if(MODE.kind === 'lockpad'){ const n = nearestKey(parts('lock').keys || [], e); if(n) padKey(n.m); return true; }
  if(MODE.kind === 'keypad'){ const kp = parts('keypad'); const n = nearestKey([...(kp.keys || []), kp.stay, kp.away, kp.clear].filter(Boolean), e);
    if(n){ if(n.m === kp.stay || n.m === kp.away){ pressKey(n.m); setTimeout(() => automation(n.m === kp.away ? 'away' : 'stay', { from:'keypad' }), 300); }
      else if(n.m === kp.clear){ pressKey(n.m); PAD.code = ''; padDots(); } else padKey(n.m); } return true; }
  if(MODE.kind === 'panel' || MODE.kind === 'app') return true;
  const f = state.focus && state.focus.k;
  if(f === 'lock' && hits(P('lock').model, ray)){ enterPad('lock'); return true; }
  if(f === 'keypad' && hits(P('keypad').model, ray)){ enterPad('keypad'); return true; }
  if(f === 'hub' && hits(P('hub').model, ray)){ enterPanel(); return true; }
  if(f === 'app' && hits(P('app').model, ray)){ enterApp(); return true; }
  if(f === 'garage'){ const b = parts('garage').buttons || []; const n = nearestKey(b, e); if(n){ const i = b.indexOf(n.m); if(i === 1){ pressKey(n.m, LIME); return true; } device('garage', i === 2); return true; } }
  if(f === 'therm' && hits(P('therm').model, ray)){ const c = P('therm').center.clone().project(camera), y = (1 - c.y)/2*innerHeight; device('therm', M.th.sp + (e.clientY < y ? 1 : -1)); return true; }
  return false; };

/* ------------------------------------------------------------------ action bar for the focused smart device */
let actK = null;
/* the per-device control lives inside the tour's slim product bar (#card), before the › button, so nothing sits between
   the product and the bar (the thermostat's downcast glow stays clear) */
function adoptTherm(){ const p = parts('therm'); if(!p.getState) return; const st = p.getState();   // someone else may have set it
  if(st.mode) M.th.mode = st.mode; if(st.setpoint != null) M.th.sp = st.setpoint; if(st.current != null) M.th.cur = st.current; }
const T_ = s => `<span class="t">${s}</span>`;
function syncAct(){ const f = !MODE.kind && !MODE.run && state.focus ? state.focus.k : null;
  const want = ['lock', 'garage', 'therm', 'keypad', 'hub', 'app', ...DCAM].includes(f) ? f : null;
  if(!want){ if(actK){ actEl.classList.add('off'); tour.card.classList.remove('dmHas'); actK = null; } showTry(false); showTryApp(false); return; }
  if(want === 'therm') adoptTherm();
  const a = TH.active(), lab = a === 'cool' ? 'Cooling' : a === 'heat' ? 'Heating' : M.th.mode === 'off' ? 'Off' : 'Idle';
  let H = {
    lock:`<button class="pri" data-a="pad" aria-label="Enter code">${IC.keys}${T_('Enter code')}</button><button data-a="lock" aria-label="${M.locked ? 'Unlock' : 'Lock'}">${M.locked ? IC.unlock + T_('Unlock') : IC.lock + T_('Lock')}</button>`,
    garage:`<button class="pri" data-a="gar">${IC.garage}${M.garageOpen ? 'Close' : 'Open'}</button>`,
    therm:`<button class="rnd" data-a="tdn" aria-label="Cooler">${IC.down}</button><div class="tv">${M.th.sp}°<small class="${a || ''}">${lab}</small></div><button class="rnd" data-a="tup" aria-label="Warmer">${IC.up}</button>`,
    keypad:`<button class="pri" data-a="kpad" aria-label="Enter code">${IC.keys}${T_('Enter code')}</button><button data-a="away">Away</button><button data-a="stay">Stay</button>`,
    hub:`<button class="pri" data-a="panel">${IC.hub}${T_('Use the hub')}</button>`,
    app:`<button class="pri" data-a="app">${IC.phone}${T_('Use the app')}</button>`,
  }[want] ?? deterBar(want);
  H = `<span class="nm">${{ lock:'Lock', garage:'Garage', therm:'Thermostat', keypad:'Keypad', hub:'Smart Hub', app:'Vivint App', dbcp:'Doorbell', ocp:'Camera', ocspot:'Spotlight' }[want]}</span>` + H;
  if(want === 'therm' && actEl.dataset.k === 'therm' && actEl.querySelector('.tv')){ const tv = actEl.querySelector('.tv'), t = H.match(/<div class="tv">(.*?)<\/div>/)[1]; if(tv.innerHTML !== t) tv.innerHTML = t; }   // keep the buttons under the finger
  else if(actEl.dataset.h !== H){ actEl.innerHTML = H; actEl.dataset.h = H; }
  actEl.dataset.k = want;
  const nx = tour.card.querySelector('#next'); if(actEl.parentNode !== tour.card || actEl.nextSibling !== nx) tour.card.insertBefore(actEl, nx);
  actK = want; actEl.classList.remove('off'); tour.card.classList.add('dmHas'); tour.card.dataset.dm = want;
  showTry(want === 'hub'); showTryApp(want === 'app'); }
/* a camera's bar: Deter on/off; with deter on, "Visitor" plays the demo (and the Spotlight Pro sets its linger time) */
function deterBar(k){ const on = M.deter[k];
  return `<button class="dtr${on ? ' on' : ''}" data-a="deter" aria-pressed="${on}" aria-label="Deter ${on ? 'on' : 'off'}">${IC.deter}${T_(on ? 'Deter on' : 'Deter off')}</button>`
    + (on ? `<button class="pri" data-a="visit" aria-label="Simulate a visitor">${IC.person}${T_('Visitor')}</button>` : '')
    + (on && k === 'ocspot' ? `<button class="lg" data-a="linger" aria-label="Strobe after lingering ${LINGER.get()} seconds">${IC.clock}<span>${LINGER.get()}s</span></button>` : ''); }
{ const p = parts('therm'); if(p.setState){ const set0 = p.setState; p.setState = o => { const r = set0(o); if(actK === 'therm') queueMicrotask(syncAct); return r; }; } }
function showTryApp(on){ if(on){ appShowDock(true); tryApp.classList.add('vis'); } else { tryApp.classList.remove('vis'); if(!MODE.kind && !MODE.run && APP.docked) appShowDock(false); } }
function showTry(on){ if(on){ showDock(true); tryEl.classList.add('vis'); } else { tryEl.classList.remove('vis'); if(!MODE.kind && !MODE.run && EMU.docked) showDock(false); } }
actEl.addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; const a = b.dataset.a;
  if(a === 'pad') enterPad('lock'); if(a === 'kpad') enterPad('keypad'); if(a === 'panel') enterPanel(); if(a === 'app') enterApp();
  if(a === 'lock') device('lock', !M.locked); if(a === 'gar') device('garage', !M.garageOpen);
  if(a === 'tup') device('therm', Math.min(90, M.th.sp + 1)); if(a === 'tdn') device('therm', Math.max(50, M.th.sp - 1));
  if(a === 'away' || a === 'stay') automation(a, { from:'keypad' });
  if(a === 'deter' && actK && !MODE.run){ WH.prime(); setDeter([actK], !M.deter[actK]); syncApp(); }
  if(a === 'visit') visitor(); if(a === 'linger'){ LINGER.next(); syncAct(); } });
/* watch the tour's focus changes cheaply (it has no events): body class + data attribute */
new MutationObserver(() => syncAct()).observe(document.body, { attributes:true, attributeFilter:['class', 'data-fk'] });

/* ------------------------------------------------------------------ the caption + sequencer */
const STEPI = { eye:IC.eye, person:IC.person, clock:IC.clock, spk:IC.spk, keys:IC.keys, lock:IC.lock, unlock:IC.unlock, garage:IC.garage, temp:IC.temp, shield:IC.shield, bulb:IC.bulb, door:IC.door, bell:IC.bell, fire:IC.fire, home:IC.home, moon:IC.moon };
function caption(kicker, title, steps, alarm){ capEl.querySelector('small').textContent = kicker; capEl.querySelector('b').textContent = title;
  capEl.querySelector('.st').innerHTML = (steps || []).map(s => `<i>${STEPI[s] || IC.check}</i>`).join(''); capEl.classList.toggle('alarm', !!alarm); capEl.classList.remove('off'); }
function capStep(i, title){ const st = [...capEl.querySelectorAll('.st i')]; st.forEach((s, j) => { s.classList.toggle('done', j < i); s.classList.toggle('cur', j === i); }); if(title) capEl.querySelector('b').textContent = title; }
function capDone(title){ capEl.querySelectorAll('.st i').forEach(s => { s.classList.add('done'); s.classList.remove('cur'); }); if(title) capEl.querySelector('b').textContent = title; }
function skip(){ if(!MODE.run || SKIP.on) return; if(performance.now() - MODE.runT0 < 800){ nudgeSkip(); return; } SKIP.on = true;
  hubEl.style.transition = 'none'; if(hubEl.classList.contains('pip')) hubEl.style.transform = pipMatrix(); appEl.style.transition = 'none'; if(appEl.classList.contains('pip')) appEl.style.transform = appPip();   // no half-way hub UI left floating
  flushAll(); }
function nudgeSkip(){ const b = $('#dmSkip'); b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); }
$('#dmSkip').addEventListener('click', e => { e.stopPropagation(); skip(); }); runShield.addEventListener('click', nudgeSkip); capEl.addEventListener('click', nudgeSkip);
let queue = Promise.resolve();
/* run one sequence at a time; `body(ctx)` does the moves; `withHub` floats the hub UI as picture-in-picture */
function sequence(name, body, { withHub = true } = {}){ queue = queue.then(async () => {
  const back = MODE.run ? null : context(), wasPanel = back && back.kind === 'panel', wasApp = back && back.kind === 'app'; MODE.back = back; MODE.viaApp = wasApp;
  MODE.run = name; MODE.runT0 = performance.now(); MODE.lockCam = true; PAD.k = null; padEl.hidden = true; doneB.hidden = true; quietTour(); actEl.classList.add('off'); runShield.hidden = false; setFill(1.6);
  if(wasApp){ await app(); await appToPip(); }   // started on the phone: the app floats, the hub only shows when the camera is at it
  else { appShowDock(false); if(withHub){ await emu(); if(wasPanel && EMU.docked) await toPip(); else if(!hubEl.classList.contains('pip') || !hubEl.classList.contains('vis')) await toPip(); } }
  try { await body(); } catch(e){ console.warn('demo', name, e); }
  const wasSkip = SKIP.on; SKIP.on = false; flushAll(); settle();
  await wait(wasSkip ? .2 : 1.1); capEl.classList.add('off'); runShield.hidden = true; MODE.run = null; MODE.viaApp = false; MODE.lockCam = false; MODE.kind = null; hudOn(); reconcile();
  if(wasPanel){ await restore({ kind:'panel' }); }
  else { hubEl.classList.remove('vis'); setTimeout(() => { if(MODE.kind !== 'panel' && !MODE.run && !(state.focus && state.focus.k === 'hub')){ hubEl.classList.remove('pip'); showDock(false); } }, 500); await restore(back); }
  syncAct(); }); return queue; }
/* make every device match the model in one go (after a skip) */
function settle(){ GAR.place(M.garage = M.garageOpen ? 1 : 0); GAR.leds(0); const t = parts('lock').turn; if(t) t.rotation.z = M.locked ? 0 : -Math.PI/2;
  if(DOOR.pivot) DOOR.pivot.rotation.y = DOOR.sign*1.35*M.door; TH.glow = 1; TH.paint(); paintArm();
  const ls = LIT.list(); if(LIT.base) ls.forEach((l, i) => l.intensity = LIT.base[i]*(.12 + .88*M.lights)); renderer.toneMappingExposure = LIT.exp0*(.45 + .55*M.lights);
  }

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
  if(name === 'deter') return visitor();
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
    capDone('Welcome home'); await fly(SH.door()); await DOOR.swing(false, 1.8); M.th.cur = 72; TH.paint(); });   // by now the room has reached 72°
  if(name === 'disarm' || name === 'kpok') return sequence('disarm', async () => {
    caption('Security', name === 'kpok' ? 'Code accepted' : 'Disarmed', ['shield']);
    M.arm = 'dis'; paintArm(); HUBDO.arm('dis'); if(o.from === 'keypad'){ await wait(.6); } else { await fly(SH.home()); }
    await Promise.all([LOCK.flash(GREEN, 1), M.lights < .9 ? LIT.to(1, 1.2) : null]); capDone('System disarmed'); await wait(.4); });
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
    SMOKE.off(); setFill(1.6); M.alarm = false; HUBDO.clearAlarm(); M.arm = 'dis'; paintArm(); await DOOR.swing(false, 1.6); await LOCK.set(true); M.th.mode = 'cool'; TH.paint(); }, {});   // reset: door shut and relocked, comfort back on (the hub follows when the run ends)
}
/* ------------------------------------------------------------------ Smart Deter (Doorbell Camera Pro, Outdoor Camera Pro, Spotlight Pro)
   Deter on: the camera's red light ring goes dark and an illustrative red cone sweeps the yard from it (the Vivint app's deter
   animation). A visitor: the rings blink, the cones lock on, the whistle sounds; the Spotlight Pro's beam follows the person, and
   lingering past the set time (2 / 5 / 10 / 15 s, remembered) makes the Spotlight Pro strobe and whistle again. Cones, beam, person and sound waves exist only while
   deter is on or a visitor plays, and are disposed after. */
const DCAM = ['dbcp', 'ocp', 'ocspot'], APPK = { dbcp:'door', ocp:'night', ocspot:'gen2' }, FROMAPP = { door:'dbcp', night:'ocp', gen2:'ocspot' };
M.deter = { dbcp:false, ocp:false, ocspot:false };
const LINGERS = [2, 5, 10, 15];   // owner: the Spotlight Pro strobes after someone lingers a couple of seconds (default 2 s)
const LINGER = { mem:2,
  get(){ try { const v = +localStorage.getItem('tourDeterLinger'); if(LINGERS.includes(v)) return v; } catch(e){} return this.mem; },
  next(){ const v = LINGERS[(LINGERS.indexOf(this.get()) + 1) % LINGERS.length]; this.mem = v; try { localStorage.setItem('tourDeterLinger', String(v)); } catch(e){} return v; } };
/* the whistle: primed on the tap that starts a visitor (iOS plays audio only after a gesture); silent fallback = the sound waves */
const WH = { a:null, ok:false,
  el(){ if(!this.a){ try { const a = new Audio('../oc/whistle.mp3'); a.preload = 'auto'; a.playsInline = true; this.a = a; } catch(e){ this.a = null; } } return this.a; },
  prime(){ const a = this.el(); if(!a || this.ok) return; try { a.muted = true; const p = a.play(); if(p) p.then(() => { if(!this.live){ a.pause(); a.currentTime = 0; } a.muted = false; this.ok = true; }).catch(() => { a.muted = false; }); } catch(e){} },
  play(){ if(SKIP.on) return; const a = this.el(); if(!a) return; try { this.live = true; a.muted = false; a.currentTime = 0; const p = a.play(); if(p) p.catch(() => {}); } catch(e){} } };
/* the light rings: each camera's own copy of its ring material (the Outdoor Camera Pro and Spotlight Pro share one otherwise) */
const RING = { m:{},
  mats(k){ if(this.m[k]) return this.m[k]; const a = [], g = P(k) && P(k).model;
    if(g) g.traverse(o => { if(o.isMesh && o.userData.ring && !Array.isArray(o.material)){ o.material = o.material.clone(); o.material.userData.ei0 = o.material.emissiveIntensity; a.push(o.material); } });
    return (this.m[k] = a); },
  set(k, f){ for(const x of this.mats(k)){ const v = x.userData.ei0*f; if(x.emissiveIntensity !== v) x.emissiveIntensity = v; } } };
const GY = .055;                                                         // the yard's surface
const DCFG = { dbcp:{ reach:2.3, amp:.6, per:7.2, ph:0, yaw:.05 }, ocp:{ reach:4.4, amp:.5, per:8.6, ph:2.1, yaw:-.35 }, ocspot:{ reach:4.1, amp:.5, per:6.4, ph:4.2, yaw:.3 } };
const CONE_VS = `varying float vT; varying float vF; varying float vD;
void main(){ vT = position.z; vec4 mv = modelViewMatrix*vec4(position, 1.); vec3 n = normalize(normalMatrix*normal); vF = abs(dot(n, normalize(-mv.xyz))); vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
const CONE_FS = `uniform vec3 uC; uniform float uO; varying float vT; varying float vF; varying float vD;
void main(){ float a = uO*pow(1. - vT, 1.35)*smoothstep(0., .07, vT)*(.28 + .72*vF*vF)*smoothstep(.35, 2., vD); gl_FragColor = vec4(uC, a); }`;
const DT = { cones:{}, beam:null, waves:[], person:null, alert:{}, track:null, aim:null, spotOn:false, lit:0, last:0, geo:null, pgeo:null, wgeo:null, tex:null, leds:null };
const tmpD = V(0, 0, 0), WARM = new THREE.Color(0xfff2dc);
function glowTex(){ const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function mkCone(col, half, op, gop){
  if(!DT.geo){ DT.geo = new THREE.ConeGeometry(1, 1, 28, 1, true); DT.geo.translate(0, -.5, 0); DT.geo.rotateX(-Math.PI/2);   // apex at the origin, base at z = 1, radius 1
    DT.pgeo = new THREE.PlaneGeometry(1, 1); DT.pgeo.rotateX(-Math.PI/2); DT.tex = glowTex(); }
  const mat = new THREE.ShaderMaterial({ uniforms:{ uC:{ value:new THREE.Color(col) }, uO:{ value:0 } }, vertexShader:CONE_VS, fragmentShader:CONE_FS,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
  const piv = new THREE.Object3D(); piv.rotation.order = 'YXZ'; const m = new THREE.Mesh(DT.geo, mat); m.renderOrder = 3; m.frustumCulled = false; piv.add(m);
  const sm = new THREE.MeshBasicMaterial({ map:DT.tex, color:col, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false });
  const spot = new THREE.Mesh(DT.pgeo, sm); spot.renderOrder = 2; spot.frustumCulled = false; piv.visible = spot.visible = false; scene.add(piv, spot);
  return { piv, m, mat, spot, sm, half, op, gop, yaw:0, pitch:.5, vis:0, A:null }; }
function dropCone(c){ scene.remove(c.piv, c.spot); c.mat.dispose(); c.sm.dispose(); }
/* point a cone from A along yaw / pitch (down); it reaches the ground (or maxLen), with a soft pool where its axis lands */
function placeCone(c, maxLen){ const A = c.A, sp = Math.max(Math.sin(c.pitch), .05), cp = Math.cos(c.pitch), drop = A.y - GY, full = drop/sp, L = Math.min(full, maxLen), r = Math.tan(c.half)*L;
  const on = c.vis > .001; if(c.piv.visible !== on){ c.piv.visible = c.spot.visible = on; } if(!on) return;
  c.piv.position.copy(A); c.piv.rotation.set(c.pitch, c.yaw, 0); c.m.scale.set(r, r, L);
  c.spot.position.set(A.x + Math.sin(c.yaw)*cp*L, GY + .02, A.z + Math.cos(c.yaw)*cp*L); c.spot.rotation.y = c.yaw; c.spot.scale.set(2.1*r, 1, Math.min(2.1*r/sp, 6*r));
  c.mat.uniforms.uO.value = c.op*c.vis; c.sm.opacity = (full <= maxLen + .01 ? c.gop : 0)*c.vis; }
function apexOf(k){ const p = P(k), g = p.model; g.updateMatrixWorld(true); const hp = g.userData.headPose;
  if(k === 'dbcp') return p.center.clone().add(V(0, .06, .04));         // lens at the top of the doorbell
  return hp ? g.localToWorld(hp.glass.clone()) : p.center.clone(); }
function ensureCone(k){ if(DT.cones[k] || !P(k)) return; const c = mkCone(0xff2a1f, .27, .62, .5), cf = DCFG[k], v = P(k).view;
  c.A = apexOf(k); c.base = Math.atan2(v.x, v.z) + cf.yaw; c.p0 = Math.atan2(c.A.y - GY, cf.reach); c.yaw = c.base; c.pitch = c.p0; DT.cones[k] = c;
  if(renderer.compileAsync) renderer.compileAsync(c.piv, camera, scene).catch(() => {}); }
function ensureBeam(){ if(DT.beam || !P('ocspot')) return; const g = P('ocspot').model; g.updateMatrixWorld(true);
  const c = mkCone(0xfff0d2, .24, .55, .75); c.A = g.localToWorld(V(0, -.118, .07)); c.yaw = 0; c.pitch = .8; DT.beam = c;
  const L = g.userData.spotLeds || []; DT.leds = L.map(m => ({ m, e:m.emissive.getHex(), i:m.emissiveIntensity })); }
/* sound waves: rings that open out from a whistling camera (also the visual when the audio can't play) */
function wave(k, delay = 0){ const p = P(k); if(!p) return;
  if(!DT.wgeo) DT.wgeo = new THREE.RingGeometry(.86, 1, 40);
  for(let i = 0; i < 3; i++){ const m = new THREE.Mesh(DT.wgeo, new THREE.MeshBasicMaterial({ color:0xff3b30, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false, side:THREE.DoubleSide }));
    m.renderOrder = 4; m.position.copy(k === 'ocspot' ? DT.cones.ocspot ? DT.cones.ocspot.A : p.center : apexOf(k)); m.visible = false; scene.add(m);
    DT.waves.push({ m, t0:performance.now() + delay*1000 + i*260 }); } runDeter(); }
/* someone was seen: rings blink, the whistle sounds, the app gets the event */
function detect(keys, msg){ const now = performance.now(); keys.forEach(k => { DT.alert[k] = now + 2800; wave(k); }); WH.play();
  if(msg && APP.api) try { APP.api.apply({ toast:msg }); } catch(e){} }
/* a simple low-poly visitor (capsules, a hood, a walk cycle) on a path from the street to the front door */
const VPATH = [V(2.9, 0, 7.25), V(.7, 0, 6.15), V(-1.8, 0, 5.35), V(-3.3, 0, 4.95), V(-3.88, 0, 4.8)];
function mkPerson(){ const mk = (c, e) => new THREE.MeshStandardMaterial({ color:c, roughness:.85, emissive:e, transparent:true, opacity:0 });
  const top = mk(0x4b5563, 0x161a20), bot = mk(0x262b33, 0x0d0f13), skin = mk(0xc69c7e, 0x22170f), mats = [top, bot, skin], e0 = mats.map(m => m.emissive.clone()), geos = [];
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mesh = (geo, m, x, y, z, par) => { geos.push(geo); const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); par.add(o); return o; };
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 3, 10);
  mesh(cap(.155, .34), top, 0, 1.19, 0, body).scale.set(1, 1, .68);
  mesh(new THREE.SphereGeometry(.1, 14, 10), skin, 0, 1.6, .012, body);
  mesh(new THREE.SphereGeometry(.118, 14, 10, 0, Math.PI*2, 0, Math.PI*.6), top, 0, 1.61, -.014, body).rotation.x = -.35;   // hood
  const limb = (x, y, r, l, m) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); body.add(pv); mesh(cap(r, l), m, 0, -(l/2 + r), 0, pv); return pv; };
  const legs = [limb(-.085, .86, .066, .66, bot), limb(.085, .86, .066, .66, bot)], arms = [limb(-.215, 1.42, .05, .5, top), limb(.215, 1.42, .05, .5, top)];
  arms[0].rotation.z = -.08; arms[1].rotation.z = .08;
  const curve = new THREE.CatmullRomCurve3(VPATH, false, 'centripetal'), len = curve.getLength(), N = 40, hy = new Float32Array(N + 1);
  { const sh = []; scene.traverse(o => { if(o.isMesh && o.userData.shell) sh.push(o); }); const rc = new THREE.Raycaster(), dn = V(0, -1, 0), q = V(0, 0, 0);
    for(let i = 0; i <= N; i++){ curve.getPointAt(i/N, q); rc.set(q.set(q.x, 2.6, q.z), dn); const h = rc.intersectObjects(sh, false)[0]; hy[i] = h ? Math.min(.4, h.point.y) : GY; } }
  g.visible = false; scene.add(g);
  const pos = V(0, 0, 0), tan = V(0, 0, 0), chest = V(0, 0, 0), aim = V(0, 0, 0); let rotY = null;
  const P_ = {
    chest, aim, u:0,
    at(u, back, moving = true){ P_.u = u; curve.getPointAt(Math.min(1, Math.max(0, u)), pos); curve.getTangentAt(Math.min(1, Math.max(0, u)), tan); if(back) tan.negate();
      const f = u*N, i = Math.min(N - 1, Math.floor(f)); pos.y = hy[i] + (hy[i + 1] - hy[i])*(f - i); g.position.copy(pos);
      const want = Math.atan2(tan.x, tan.z); if(rotY == null) rotY = want; let d = want - rotY; d = Math.atan2(Math.sin(d), Math.cos(d)); rotY += d*(SKIP.on ? 1 : .18); g.rotation.y = rotY;
      const ph = u*len/.74*Math.PI, s = moving ? Math.sin(ph) : 0;
      legs[0].rotation.x = s*.5; legs[1].rotation.x = -s*.5; arms[0].rotation.x = -s*.42; arms[1].rotation.x = s*.42; body.position.y = moving ? Math.abs(Math.cos(ph))*.028 : 0;
      chest.copy(pos).y += 1.05; aim.copy(pos).y += .55; },
    walk(u0, u1, back){ return tween(Math.abs(u1 - u0)*len/1.15, e => P_.at(u0 + (u1 - u0)*e, back), t => t).then(() => P_.at(u1, back, false)); },
    fade(o){ g.visible = o > .002; mats.forEach(m => { m.opacity = o; m.depthWrite = o > .98; }); },
    light(v){ mats.forEach((m, i) => m.emissive.copy(e0[i]).lerp(WARM, v*.26)); },
    dispose(){ scene.remove(g); geos.forEach(x => x.dispose()); mats.forEach(m => m.dispose()); } };
  P_.at(0); return P_; }
/* one step for everything above; it removes itself (and frees the GPU objects) once nothing is on */
function dtStep(now){ const dt = Math.min(.05, (now - (DT.last || now))/1000); DT.last = now; const t = now/1000; let busy = false;
  const blink = .5 + .5*Math.sin(now/62);
  for(const k of DCAM){ const c = DT.cones[k], want = M.deter[k] && !(k === 'ocspot' && DT.spotOn) ? 1 : 0;   // the Spotlight Pro's own beam takes over from its red cone
    if(c){ c.vis += (want - c.vis)*Math.min(1, dt*(want ? 3 : 5)); if(Math.abs(want - c.vis) < .004) c.vis = want;
      const cf = DCFG[k]; let y, p, rate;
      let sees = false;   // a camera only locks on when the person is inside its own sweep (else its cone would cut through the house)
      if(DT.track && want){ tmpD.copy(DT.track).sub(c.A); y = Math.atan2(tmpD.x, tmpD.z); let d = y - c.base; d = Math.atan2(Math.sin(d), Math.cos(d));
        sees = Math.abs(d) <= Math.max(cf.amp*1.35, .45); if(sees){ y = c.base + d; p = Math.atan2(-tmpD.y, Math.hypot(tmpD.x, tmpD.z)); rate = 8; } }
      if(sees){}
      else { y = c.base + (reduce ? 0 : cf.amp*Math.sin(t*2*Math.PI/cf.per + cf.ph)); p = c.p0; rate = 2.2; }
      const s = SKIP.on ? 1 : 1 - Math.exp(-dt*rate); c.yaw += (y - c.yaw)*s; c.pitch += (p - c.pitch)*s;
      placeCone(c, sees ? c.A.distanceTo(DT.track) + .45 : k === 'dbcp' ? 6 : 9);   // locked on: the cone ends on the person
      if(c.vis > 0 || want) busy = true; else if(!M.deter[k]){ dropCone(c); delete DT.cones[k]; } }
    const al = DT.alert[k] > now; if(al) busy = true;
    RING.set(k, al ? blink : M.deter[k] ? 0 : 1); }
  if(DT.spotOn && !DT.beam) ensureBeam();
  const b = DT.beam; if(b){ const want = DT.spotOn ? 1 : 0; b.vis += (want - b.vis)*Math.min(1, dt*4); if(Math.abs(want - b.vis) < .004) b.vis = want;
    if(DT.aim){ tmpD.copy(DT.aim).sub(b.A); const s = SKIP.on ? 1 : 1 - Math.exp(-dt*6); b.yaw += (Math.atan2(tmpD.x, tmpD.z) - b.yaw)*s; b.pitch += (Math.atan2(-tmpD.y, Math.hypot(tmpD.x, tmpD.z)) - b.pitch)*s; }
    placeCone(b, DT.aim ? b.A.distanceTo(DT.aim) + 1.2 : 12);
    if(DT.aim && b.vis > .001){ b.spot.position.set(DT.aim.x, GY + .02, DT.aim.z); b.spot.scale.set(1.9, 1, 1.9); b.sm.opacity = b.gop*b.vis; }   // a pool of light at the visitor's feet (DT.leds || []).forEach(({ m, e, i }, j) => { if(b.vis > .001){ m.emissive.setHex(j ? 0xffffff : 0xfff4e2); m.emissiveIntensity = j ? .55*b.vis : 1 + 5*b.vis; } else { m.emissive.setHex(e); m.emissiveIntensity = i; } });
    /* lingering: the Spotlight Pro strobes (6 flashes a second; 2 with reduced motion) */
    const sf = DT.strobe > now ? (Math.floor(now/(reduce ? 250 : 83)) % 2 ? 1 : .05) : 1;
    if(sf < 1){ b.mat.uniforms.uO.value *= sf; b.sm.opacity *= sf; (DT.leds || []).forEach(({ m }) => { m.emissiveIntensity *= sf; }); }
    if(DT.person) DT.person.light(b.vis*sf);
    if(b.vis > 0 || want) busy = true; else { dropCone(b); DT.beam = null; } }
  for(let i = DT.waves.length - 1; i >= 0; i--){ const w = DT.waves[i], e = (now - w.t0)/1200;
    if(e >= 1){ scene.remove(w.m); w.m.material.dispose(); DT.waves.splice(i, 1); continue; } busy = true; if(e < 0) continue;
    w.m.visible = true; w.m.quaternion.copy(camera.quaternion); w.m.scale.setScalar(.08 + .85*e); w.m.material.opacity = .9*Math.pow(1 - e, 1.6); }
  if(DT.person) busy = true;
  if(!busy) stopDeter(); }
function runDeter(){ if(!perFrame.has(dtStep)){ DT.last = 0; perFrame.add(dtStep); } kick(); }
function stopDeter(){ perFrame.delete(dtStep); DCAM.forEach(k => RING.set(k, M.deter[k] ? 0 : 1));
  if(!Object.keys(DT.cones).length && !DT.beam && !DT.waves.length){ [DT.geo, DT.pgeo, DT.wgeo, DT.tex].forEach(x => x && x.dispose()); DT.geo = DT.pgeo = DT.wgeo = DT.tex = null; } }
function setDeter(keys, on){ keys.forEach(k => { if(!(k in M.deter)) return; M.deter[k] = !!on; if(on) ensureCone(k); }); runDeter(); syncAct(); }
/* "Simulate visitor": someone walks up to the door at night, gets seen, lit and whistled at, lingers, gets whistled at again, leaves */
function visitor(){ if(MODE.run) return; WH.prime();
  return sequence('deter', async () => {
    const auto = !DCAM.some(k => M.deter[k]), cams = () => DCAM.filter(k => M.deter[k]);
    caption('Smart Deter', 'Watching the yard', ['eye', 'person', 'bulb', 'clock', 'spk']); capStep(0);
    const f = fly(SH.front()); if(auto){ await wait(.5); setDeter(DCAM, true); } await f; if(!SKIP.on) await wait(1.2);
    const per = DT.person = mkPerson(); runDeter();
    try {
      await Promise.all([tween(.7, e => per.fade(e)), per.walk(0, .17)]);
      DT.track = per.chest; capStep(1, 'Person detected · Whistle'); detect(cams(), 'Person detected at the Front Door. Deter whistle sounded.');
      await per.walk(.17, .32); DT.aim = per.aim; DT.spotOn = true; capStep(2, 'Spotlight follows');
      await per.walk(.32, 1); per.at(1, false, false);
      const n = LINGER.get(); for(let i = n; i > 0; i--){ capStep(3, `Lingering · ${i}s`); await wait(1); }
      capStep(4, 'Strobe · Whistle'); DT.strobe = performance.now() + 2600; detect([...new Set(['ocspot', ...cams()])], `Person lingering over ${n}s. Spotlight Pro strobed.`); await wait(2.6); DT.strobe = 0;
      await per.walk(1, .1, true); await Promise.all([tween(.6, e => per.fade(1 - e)), per.walk(.1, 0, true)]);
    } finally { DT.track = null; DT.aim = null; DT.spotOn = false; DT.strobe = 0; per.dispose(); DT.person = null; runDeter(); }
    capDone('Visitor deterred'); await wait(1);
    if(auto){ setDeter(DCAM, false); }
  }, { withHub:false }); }
/* scenes menu */
$('#dmScB').addEventListener('click', e => { e.stopPropagation(); if(MODE.run) return; scenesEl.classList.toggle('off'); $('#dmScB').classList.toggle('on', !scenesEl.classList.contains('off')); });
scenesEl.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if(!b) return; scenesEl.classList.add('off'); $('#dmScB').classList.remove('on');
  if(MODE.kind && MODE.kind !== 'panel') leaveModeQuiet(); automation(b.dataset.sc); });
addEventListener('pointerdown', e => { if(!scenesEl.classList.contains('off') && !e.target.closest('#dmScenes,#dmScB')){ scenesEl.classList.add('off'); $('#dmScB').classList.remove('on'); } }, true);
$('#dmHubB').addEventListener('click', () => { if(MODE.run) return; if(MODE.kind === 'panel') return leaveMode(); if(MODE.kind) leaveModeQuiet(); enterPanel(); });
$('#dmAppB').addEventListener('click', () => { if(MODE.run) return; if(MODE.kind === 'app') return leaveMode(); if(MODE.kind) leaveModeQuiet(); enterApp(); });
function leaveModeQuiet(){ hubEl.classList.remove('live'); appEl.classList.remove('live'); MODE.kind = null; MODE.lockCam = false; padEl.hidden = true; doneB.hidden = true; hudOn(); }
function hudOn(){ $('#dmHubB').classList.toggle('on', MODE.kind === 'panel'); $('#dmAppB').classList.toggle('on', MODE.kind === 'app'); }
addEventListener('keydown', e => { if(e.key === 'Escape'){ if(MODE.run) skip(); else if(MODE.kind) leaveMode(); } });
addEventListener('resize', () => { if((MODE.kind === 'panel' || MODE.kind === 'app') && !MODE.run){ const p = MODE.kind === 'app' ? appPose() : panelPose(); camera.position.copy(p.pos); controls.target.copy(p.target); camera.lookAt(p.target); kick(); }
  if(appEl.classList.contains('pip')) appEl.style.transform = appPip();
  if(hubEl.classList.contains('pip')) hubEl.style.transform = pipMatrix(); });

/* ------------------------------------------------------------------ boot */
DOOR.init(); GAR.init(); TH.paint(); paintArm(); syncAct();
window.__demo = { DT, setDeter, visitor, LINGER, WH, RING, stats:() => ({ anims:anims.size, perFrame:perFrame.size, raf }), M, MODE, EMU, APP, automation, device, enterPanel, enterApp, appMatrix, appPip, enterPad, leaveMode, skip, GAR, DOOR, TH, LOCK, padKey, PAD, parts, SH, fly, pipMatrix, dockMatrix };

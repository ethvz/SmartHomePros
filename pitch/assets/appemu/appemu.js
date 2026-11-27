/* ===== Vivint app emulator (built from Ethan's demo-mode screen recordings) =====
   One source for Fast Pitch's App section (index.html) and the 3D Home's phone (assets/appemu/index.html).
   Asset paths resolve from this file's own URL (pitch/), so it works from both pages.
   Parent hooks: AppEmu.on(fn) gets (type, detail) for the presenter's own taps only ('lock' {k,lock}, 'gar' {k,open},
   'sec' {k}, 'deter' {keys,on}, 'th' {k,set,mode}, 'light' {i,v,all}, 'sc' {k}); AppEmu.apply({...}) sets state from outside
   without echoing back (deter {door,night,gen2: 0|1}; toast: 'message' shows an info toast). */
window.AppEmu=(()=>{
const BASE=(()=>{ try{ return new URL('../../',document.currentScript.src).href; }catch(e){ return ''; } })();
const subs=new Set(); let QUIET=0;
const emit=(type,detail)=>{ if(QUIET) return; subs.forEach(f=>{ try{ f(type,detail); }catch(e){ console.warn('AppEmu',e); } }); };
const P={lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
 unlock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>',
 garage:'<path d="M3.5 9.5L12 4l8.5 5.5V20"/><path d="M3.5 9.5V20"/><path d="M6.5 11h11M6.5 13.5h11M6.5 16h11M6.5 18.5h11"/>',
 garage2:'<rect x="4" y="6" width="16" height="13" rx="1.5"/><path d="M4 9.5h16M7 12.5h10M7 15.5h10"/>',
 deter:'<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/><path d="M9 9.5a4 4 0 0 1 6 0"/>',
 cam:'<rect x="3" y="6.5" width="13" height="11" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3"/>',
 bulb:'<path d="M9 18h6M10 21h4"/><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.8-1 1.7-1 3h-5c0-1.3-.2-2.2-1-3z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
 spark:'<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
 home:'<path d="M4 10.5L12 4l8 6.5V20H4z"/><path d="M10 20v-5.5h4V20"/>',
 homeF:'<path d="M4 10.5L12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" fill="currentColor" stroke="none"/>',
 moon:'<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
 leave:'<path d="M5 20V4h9v16H5z"/><path d="M11.5 12h.1M14 8.5h6M17 5.5l3 3-3 3"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 clockF:'<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M12 7.5V12l3 2" stroke="#fff"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
 userF:'<circle cx="12" cy="8" r="4.2" fill="currentColor" stroke="none"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6z" fill="currentColor" stroke="none"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', dots:'<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>', check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
 chevD:'<path d="M6 9.5l6 6 6-6"/>', chevU:'<path d="M6 14.5l6-6 6 6"/>', chevR:'<path d="M9.5 6l6 6-6 6"/>', chevL:'<path d="M14.5 6l-6 6 6 6"/>',
 flame:'<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.6 3.2-5.4 3.6-9.4 2.4 1.6 3.4 3.6 3.4 5.4 1-.6 1.6-1.6 1.8-2.8 2 1.8 3.2 4 3.2 6.6 0 3.4-2.4 5.8-6 5.8z"/>',
 snow:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
 fan:'<circle cx="12" cy="12" r="1.8"/><path d="M12 10.2C11 6 13 3.5 15.5 4.5s1 4.5-3.5 5.7zM13.8 12c4.2-1 6.7 1 5.7 3.5s-4.5 1-5.7-3.5zM12 13.8c1 4.2-1 6.7-3.5 5.7s-1-4.5 3.5-5.7zM10.2 12C6 13 3.5 11 4.5 8.5s4.5-1 5.7 3.5z"/>',
 power:'<path d="M12 4v8M7.5 6.8a7 7 0 1 0 9 0"/>', cal:'<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="M8 13.5h.1M12 13.5h.1M16 13.5h.1M8 16.8h.1M12 16.8h.1"/>',
 clip:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 9h16M8 5l2 4M13 5l2 4"/><path d="M10.5 12.3v4.4l3.8-2.2z"/>',
 mic:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3"/>', photo:'<path d="M4 8.5h3l1.8-2.5h6.4L17 8.5h3v11H4z"/><circle cx="12" cy="13.5" r="3.4"/>',
 drop:'<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>', gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.8 2.6 3.1-.6.6 3.1 2.6 1.8-1.6 2.3 1.6 2.3-2.6 1.8-.6 3.1-3.1-.6L12 21.2l-1.8-2.6-3.1.6-.6-3.1-2.6-1.8L5.5 12 3.9 9.7l2.6-1.8.6-3.1 3.1.6z"/>',
 bell:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>', chat:'<path d="M4.5 11.5a7.5 7 0 1 1 3.6 6l-3.6 1.3 1.1-3.3a7 7 0 0 1-1.1-4z"/>',
 pen:'<path d="M15.5 4.5l4 4L9 19H5v-4z"/>', swap:'<path d="M4 8.5h14l-3.5-3.5M20 15.5H6l3.5 3.5"/>', userAdd:'<circle cx="10" cy="8" r="4"/><path d="M3 20.5c.8-4 3.6-6 7-6 1.5 0 2.9.4 4 1.2M18 13v7M14.5 16.5h7"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', grid:'<rect x="4.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.5"/>',
 list:'<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.1M4.5 12h.1M4.5 17h.1"/>', shield:'<path d="M12 3.5l7 2.6v5.2c0 4.6-3 8-7 9.2-4-1.2-7-4.6-7-9.2V6.1z"/>', thermo:'<rect x="5" y="5" width="14" height="14" rx="3"/><text x="12" y="14.6" font-size="6.5" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif">65</text>',
 link:'<path d="M10 14l4-4M8.5 11.5L6.3 13.7a3.3 3.3 0 0 0 4.7 4.7l2.2-2.2M15.5 12.5l2.2-2.2a3.3 3.3 0 0 0-4.7-4.7l-2.2 2.2"/>', users:'<circle cx="9" cy="8.5" r="3.5"/><path d="M3 19.5c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2M15 5.5a3.5 3.5 0 0 1 0 6.5M17.5 14.6c1.8.8 3 2.4 3.4 4.9"/>',
 appear:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>', energy:'<path d="M4 20h16M6 20V11h12v9M3.5 11L12 5l8.5 6M12 8v1M8 14h8M8 17h8"/>', eye:'<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/><path d="M4 4l16 16"/>', spk:'<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/>'};
const SPR={"p_indoor":[0,0,560,801],"p_spot":[562,0,560,795],"v_door":[1124,0,720,720],"hero":[0,803,880,630],"hero_armed":[882,803,880,630],"a_det":[0,1435,820,551],"f_house":[822,1435,820,414],"a_catch":[1644,1435,320,405],"a_people":[0,1988,320,405],"c_door":[322,1988,400,400],"c_drive":[724,1988,400,400],"c_gen2":[1126,1988,400,400],"c_indoor":[1528,1988,400,400],"c_night":[0,2395,400,400],"x_away":[402,2395,400,398],"x_comfort":[804,2395,400,398],"x_package":[1206,2395,400,398],"k_yard":[1608,2395,300,380],"k_gen2":[0,2797,300,377],"k_hoodie":[302,2797,300,377],"k_indoor":[604,2797,300,377],"e_sarah":[906,2797,320,320],"e_visitor":[1228,2797,320,320],"e_hoodie":[1550,2797,320,180],"e_linger":[0,3176,320,180],"e_person":[322,3176,320,180]}, SW=2048, SH2=3356;
const SP=n=>{ const [x,y,w,h]=SPR[n]; return `background-image:url(${BASE}assets/emu/sprite2.webp?v=1);background-repeat:no-repeat;background-size:${(SW/w*100).toFixed(3)}% ${(SH2/h*100).toFixed(3)}%;background-position:${(x/(SW-w)*100).toFixed(3)}% ${(y/(SH2-h)*100).toFixed(3)}%`; };
const SPI=(n,st='',cls='')=>{ const [x,y,w,h]=SPR[n]; return `<span class="aei ${cls}" style="display:block;aspect-ratio:${w}/${h};${SP(n)};${st}"></span>`; };
const LIVE={indoor:[0,4.6],drive:[4.6,16.6],yard:[16.6,32.6],night:[32.6,47]};
const I=(k,s=22,w=1.6)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[k]||''}</svg>`;
const SH=(kind,s=30)=>{ const c=kind==='dis'?'#111':'#fff', bg=kind==='dis'?'#1a2a24':'#c9471f';
  const g=kind==='dis'?'<path d="M9.3 9.6l5.4 5.4M14.7 9.6l-5.4 5.4" stroke="#05e0a6" stroke-width="2" stroke-linecap="round"/>':kind==='away'?'<rect x="8.4" y="10.6" width="7.2" height="4" rx="1.2" fill="#fff"/><path d="M9.4 10.6l.9-2h3.4l.9 2" stroke="#fff" stroke-width="1.3" fill="none"/>':'<path d="M8.4 12.6L12 9.6l3.6 3v3.4H8.4z" fill="#fff"/>';
  return `<svg class="sh" width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2.6l8 3v6c0 5.2-3.4 9-8 10.4-4.6-1.4-8-5.2-8-10.4v-6z" fill="${kind==='dis'?'#14211c':'#f2683a'}"/>${g}</svg>`; };
const CAMS=[{k:'door',n:'Doorbell Camera Pro',t:'1h ago',dt:1,src:'v_door',sq:1},{k:'indoor',n:'Indoor Camera Pro',t:'5m ago',src:'indoor',talk:1},
  {k:'drive',n:'Outdoor Camera Pro',t:'38m ago',src:'drive'},{k:'night',n:'Outdoor Camera Pro',t:'8h ago',dt:1,src:'yard'},{k:'gen2',n:'Outdoor Camera Pro Gen 2',t:'yesterday',dt:1,src:'night'}];
const LIGHTS=[['Bedroom',75],['Entryway',0],['Front Porch',100],['Kitchen',90],['Living Room',85],['Outdoor Camera Pro…',0]];
const S={sec:'dis',since:'11:08 PM',lock:{front:1,side:1},gar:{main:0,side:0},th:{bed:{n:'Bedroom',mode:'heat',set:66,cur:65,fan:'auto',hum:33},hall:{n:'Hallway',mode:'cool',set:72,cur:74,fan:'auto',hum:38}},light:LIGHTS.map(l=>l[1]),lastL:LIGHTS.map(l=>l[1]||80),deter:{door:0,night:0,gen2:0},tab:'home',busy:{}};
let R,toastT,zoomT,liveCam=null;
const $=(s,r=R)=>r.querySelector(s), $$=(s,r=R)=>[...r.querySelectorAll(s)];
const now=()=>{ const d=new Date(); let h=d.getHours(),m=d.getMinutes(); const ap=h>=12?'PM':'AM'; h=h%12||12; return h+':'+String(m).padStart(2,'0')+' '+ap; };
const toast=(msg,kind)=>{ const t=$('.ae-toast'); t.className='ae-toast'+(kind?' '+kind:''); t.innerHTML=(kind==='info'?I('info',22):I('check',22,2))+`<span>${msg}</span>`; requestAnimationFrame(()=>t.classList.add('on')); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),2600); };
const zoom=(z)=>{ const h=$('.ae-hero'); h.classList.remove('zdoor','zgar'); if(z) h.classList.add(z); clearTimeout(zoomT); zoomT=setTimeout(()=>h.classList.remove('zdoor','zgar'),3200); $('[data-v=home]').scrollTo({top:0,behavior:'smooth'}); };

/* ---------- Home ---------- */
const quick=()=>{ const unl=Object.entries(S.lock).filter(([k,v])=>!v), opn=Object.entries(S.gar).filter(([k,v])=>v), dc=Object.values(S.deter).filter(Boolean).length;
  const L=S.busy.lock?{c:'spin',i:I('clock',26),l:S.busy.lock}:unl.length?{c:'y',i:I('unlock',26),l:unl.length===2?'2 unlocked':(unl[0][0]==='front'?'Front Door':'Side Door')+' unlocked'}:{c:'',i:I('lock',26),l:'All locked'};
  const G=S.busy.gar?{c:'spin',i:I('clock',26),l:S.busy.gar}:opn.length?{c:'y',i:I('garage2',26),l:opn.length===2?'2 open':(opn[0][0]==='main'?'Main Garage':'Side Garage')+' open'}:{c:'',i:I('garage2',26),l:'All closed'};
  const md=[S.th.bed.mode,S.th.hall.mode], tl=md.includes('heat')&&md.includes('cool')?'Heating & Cooling':md.includes('heat')?'Heating':md.includes('cool')?'Cooling':'Off';
  return `<button data-q="lock" class="tap"><span class="qc ${L.c}">${L.i}</span><span>${L.l}</span></button>
    <button data-q="gar" class="tap"><span class="qc ${G.c}">${G.i}</span><span>${G.l}</span></button>
    <button data-q="th" class="tap"><span class="qc" style="font-size:21px">70<sup>°</sup></span><span>${tl}</span></button>
    <button data-q="det" class="tap"><span class="qc">${dc?'<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#d0021b" stroke-width="2.4"/></svg>':I('deter',26)}</span><span>${S.busy.det||(dc?`Deter on (${dc})`:'Deter off')}</span></button>`; };
const secPill=()=>{ const k=S.sec, lab=k==='dis'?'Disarmed':k==='away'?'Armed away':'Armed stay'; return `${SH(k)}<span class="t"><b>${S.busy.sec||lab}</b><small>Since ${S.since}</small></span>${I('chevD',20,2)}`; };
const camTile=c=>`<div class="ae-cam tap" data-cam="${c.k}"><div class="im" style="${SP('c_'+c.k)}">${c.dt?`<span class="dt${S.deter[c.k]?' on':''}" data-dt="${c.k}"><i>${S.deter[c.k]?'<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>':I('deter',18)}</i></span>`:''}<span class="dm">${I('dots',18)}</span></div>
  <div class="ft"><span><b>${c.n}</b><small>${c.t}</small></span><span class="ae-ob" data-evs="${c.k}">${I('clip',20)}</span></div></div>`;
const thTile=k=>{ const t=S.th[k]; return `<button class="ae-th ${t.mode} tap" data-th="${k}"><b>${t.n}</b><small>${t.mode==='off'?'Off':(t.mode==='heat'?'Heating from':'Cooling from')+'<br>'+t.cur+'°'}</small><span class="big">${t.mode==='off'?t.cur:t.set}<sup>${t.mode==='heat'?'<svg width="14" height="18" viewBox="0 0 24 24" style="display:inline"><path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.6 3.2-5.4 3.6-9.4 2.4 1.6 3.4 3.6 3.4 5.4 1-.6 1.6-1.6 1.8-2.8 2 1.8 3.2 4 3.2 6.6 0 3.4-2.4 5.8-6 5.8z" fill="#fff"/></svg>':t.mode==='cool'?'*':'°'}</sup></span><span class="hm">${I('homeF',24)}</span></button>`; };
const homeHTML=()=>`<div class="ae-hero"><div class="zm"><div class="hi" style="${SP('hero')}"></div><div class="hi arm" style="${SP('hero_armed')}"></div><div class="gd"></div><div class="dr"></div></div><div class="hfade"></div></div>
  <div class="ae-hdr"><button class="hp ae-gl tap" data-menu>${I('menu',24)}John’s House</button><button class="hp sos ae-gl tap" data-sos><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2.6l8 3v6c0 5.2-3.4 9-8 10.4-4.6-1.4-8-5.2-8-10.4v-6z" fill="#111"/><path d="M12 7.6l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" fill="#fff"/></svg>SOS</button><button class="hp more ae-gl tap" data-more>${I('dots',24)}</button></div>
  <div class="ae-top"><div class="ae-q">${quick()}</div><button class="ae-sec tap" data-arm>${secPill()}</button></div>
  <div class="ae-body">
   <div class="ae-chips">${[['all','grid','All'],['cams','cam'],['locks','lock'],['gar','garage2'],['th','thermo'],['lights','bulb'],['sc','spark']].map(([k,i,l])=>`<button class="tap${k==='all'?' on':''}" data-chip="${k}">${I(i,17)}${l||''}</button>`).join('')}</div>
   <div data-s="cams"><div class="ae-h"><h3>Cameras</h3><span class="r"><button class="ae-pl tap" data-evs="all">All Events</button><span class="ae-dots">${I('dots',18)}</span></span></div><div class="ae-g2">${CAMS.map(camTile).join('')}</div></div>
   <div data-s="locks"><div class="ae-h"><h3>Door locks</h3><span class="ae-dots">${I('dots',18)}</span></div><div class="ae-g2" id="aeLocks"></div></div>
   <div data-s="gar"><div class="ae-h"><h3>Garage doors</h3><span class="ae-dots">${I('dots',18)}</span></div><div class="ae-stack" id="aeGars"></div></div>
   <div data-s="th"><div class="ae-h"><h3>Thermostats</h3><span class="ae-dots">${I('dots',18)}</span></div><div class="ae-g2" id="aeThs"></div></div>
   <div data-s="lights"><div class="ae-h"><h3>Lights</h3><span class="r"><button class="ae-pl tap" data-alloff>Turn all off</button><span class="ae-dots">${I('dots',18)}</span></span></div><div class="ae-g2" id="aeLights"></div></div>
   <div data-s="sc"><div class="ae-h"><h3>Shortcuts</h3><span class="r"><span class="ae-dots">${I('plus',18)}</span><span class="ae-dots">${I('dots',18)}</span></span></div><div class="ae-g2">
     ${[['arrive','Arriving','home'],['bed','Bedtime','moon'],['leave','Leaving','leave']].map(([k,n,i])=>`<button class="ae-tile tap" data-sc="${k}"><b>${n}</b><span class="ae-ci">${I(i,22)}</span></button>`).join('')}</div></div>
  </div>`;
const renderDev=()=>{
  $('#aeLocks').innerHTML=[['front','Front Door'],['side','Side Door']].map(([k,n])=>`<button class="ae-tile tap" data-lk="${k}"><span><b>${n}</b><small>${S.busy['l'+k]||(S.lock[k]?'Locked':'Unlocked')}</small></span><span class="ae-ci${S.lock[k]?'':' y'}">${I(S.lock[k]?'lock':'unlock',22)}</span></button>`).join('');
  $('#aeGars').innerHTML=[['main','Main Garage'],['side','Side Garage']].map(([k,n])=>`<button class="ae-tile tap" data-gr="${k}"><span><b>${n}</b><small>${S.busy['g'+k]||(S.gar[k]?'Open':'Closed')}</small></span><span class="ae-ci${S.gar[k]?' y':''}">${I('garage2',22)}</span></button>`).join('');
  $('#aeThs').innerHTML=thTile('bed')+thTile('hall');
  $('#aeLights').innerHTML=LIGHTS.map(([n],i)=>`<button class="ae-tile tap" data-li="${i}"><span><b>${n}</b><small>${S.light[i]?S.light[i]+'%':'Off'}</small></span><span class="ae-ci${S.light[i]?' lit':''}">${I(S.light[i]?'sun':'bulb',22)}</span></button>`).join(''); };
const renderTop=()=>{ $('.ae-q').innerHTML=quick(); $('.ae-sec').innerHTML=secPill(); R.dataset.sec=S.sec;
  $$('.ae-cam .dt').forEach(d=>{ const on=!!S.deter[d.dataset.dt]; d.classList.toggle('on',on); d.querySelector('i').innerHTML=on?'<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>':I('deter',18); });
  const h=$('.ae-hero'); h.classList.toggle('gopen',!!S.gar.main); h.classList.toggle('dopen',!S.lock.front); };
const render=()=>{ renderTop(); renderDev(); };
/* device actions with an in-progress state, like the real app */
const doLock=(k,lock)=>{ if(S.lock[k]===lock||S.busy['l'+k]) return; emit('lock',{k,lock:!!lock}); const n=k==='front'?'Front Door':'Side Door'; S.busy['l'+k]=lock?'Locking…':'Unlocking…'; S.busy.lock=lock?'Locking…':'Unlocking…'; render(); if(k==='front') zoom('zdoor');
  setTimeout(()=>{ S.lock[k]=lock; delete S.busy['l'+k]; delete S.busy.lock; render(); toast(`${n} ${lock?'locked':'unlocked'} successfully.`); },1300); };
const doGar=(k,open)=>{ if(S.gar[k]===open||S.busy['g'+k]) return; emit('gar',{k,open:!!open}); const n=k==='main'?'Main Garage':'Side Garage'; S.busy['g'+k]=open?'Opening…':'Closing…'; S.busy.gar=S.busy['g'+k]; render(); if(k==='main') zoom('zgar');
  setTimeout(()=>{ S.gar[k]=open; delete S.busy['g'+k]; delete S.busy.gar; render(); toast(`${n} ${open?'opened':'closed'} successfully.`); },1800); };
const setSec=(k,quiet)=>{ if(S.sec===k) return; emit('sec',{k}); S.sec=k; S.since=now(); render(); if(!quiet) toast('Security state set to '+(k==='dis'?'disarmed':k==='away'?'armed away':'armed stay')+'.'); };
const setDeter=(keys,on)=>{ emit('deter',{keys,on:!!on}); S.busy.det='Adjusting'; renderTop(); toast(on?'Turning deter on':'Turning deter off','info'); setTimeout(()=>{ keys.forEach(k=>S.deter[k]=on?1:0); delete S.busy.det; renderTop(); },1100); };

/* ---------- popovers ---------- */
const pop=(html,anchor)=>{ const p=$('.ae-pop'), a=anchor.getBoundingClientRect(), r=R.getBoundingClientRect(), k=r.width/440; p.innerHTML=html;
  const cx=(a.left+a.width/2-r.left)/k, top=(a.top-r.top)/k-8; let left=Math.max(12,Math.min(440-12-250,cx-125)); p.style.left=left+'px'; p.style.top=top+'px'; p.style.setProperty('--ox',(cx-left)+'px'); p.style.setProperty('--oy','30px');
  $('.ae-scrim').classList.add('on'); requestAnimationFrame(()=>p.classList.add('on')); };
const unpop=()=>{ $('.ae-pop').classList.remove('on'); $('.ae-scrim').classList.remove('on'); };
const popFor=q=>{ if(q==='lock'){ const a=Object.values(S.lock).every(Boolean); return `<div class="two"><button data-pa="lockall" ${a?'disabled':''}>${I('lock',22)}Lock all</button><button data-pa="unlockall" ${Object.values(S.lock).some(Boolean)?'':'disabled'}>${I('unlock',22)}Unlock all</button></div>`+[['front','Front Door'],['side','Side Door']].map(([k,n])=>`<button class="it" data-pa="lk:${k}">${I(S.lock[k]?'unlock':'lock',22)}${S.lock[k]?'Unlock':'Lock'} ${n}</button>`).join(''); }
  if(q==='gar') return `<div class="two"><button data-pa="closeall" ${Object.values(S.gar).some(Boolean)?'':'disabled'}>${I('garage2',22)}Close all</button><button data-pa="openall" ${Object.values(S.gar).every(Boolean)?'disabled':''}>${I('garage2',22)}Open all</button></div>`+[['main','Main Garage'],['side','Side Garage']].map(([k,n])=>`<button class="it" data-pa="gr:${k}">${I('garage2',22)}${S.gar[k]?'Close':'Open'} ${n}</button>`).join('');
  if(q==='th') return ['bed','hall'].map(k=>{ const t=S.th[k]; return `<div class="grp"><b>${t.n}</b><small>Currently ${t.cur}° · ${t.mode==='off'?'Off':(t.mode==='heat'?'Heating to ':'Cooling to ')+t.set+'°'}</small><button data-pa="th:${k}">Quick Controls ${I('chevR',16,2)}</button></div>`; }).join('');
  if(q==='det'){ const any=Object.values(S.deter).some(Boolean), all=Object.values(S.deter).every(Boolean); return `<div class="two"><button data-pa="detoff" ${any?'':'disabled'}>${I('deter',22)}Turn all off</button><button data-pa="deton" ${all?'disabled':''}><svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#d0021b" stroke-width="2"/></svg>Turn all on</button></div>`+CAMS.filter(c=>c.dt).map(c=>`<button class="it" data-pa="dt:${c.k}">${I('deter',22)}<span>${c.n}<small>Turn deter ${S.deter[c.k]?'off':'on'}</small></span></button>`).join(''); } };

/* ---------- thermostat sheet ---------- */
let thK=null;
const thSheet=()=>{ const t=S.th[thK], s=$('.ae-ts'); s.className='ae-sheet ae-ts on '+t.mode;
  const stat=t.mode==='off'?`Currently ${t.cur}°`:(t.mode==='heat'?'Heating from ':'Cooling from ')+t.cur+'°';
  s.innerHTML=`<span class="grab"></span><button class="x tap" data-tx>${I('x',24,1.8)}</button><h2>${t.n}</h2>
   <div class="dial"><button class="tap" data-tu ${t.mode==='off'?'style="visibility:hidden"':''}>${I('chevU',34,1.6)}</button><div class="num">${t.mode==='off'?'Off':t.set}${t.mode==='off'?'':`<sup>${t.mode==='heat'?'<svg width="22" height="28" viewBox="0 0 24 24"><path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.6 3.2-5.4 3.6-9.4 2.4 1.6 3.4 3.6 3.4 5.4 1-.6 1.6-1.6 1.8-2.8 2 1.8 3.2 4 3.2 6.6 0 3.4-2.4 5.8-6 5.8z" fill="currentColor"/></svg>':'✻'}</sup>`}</div><button class="tap" data-td ${t.mode==='off'?'style="visibility:hidden"':''}>${I('chevD',34,1.6)}</button></div>
   <div class="lbl">${stat}</div><div class="hum">${I('drop',16,1.4)}Humidity ${t.hum}%</div>
   <div class="btns"><button class="tap" data-tm>${I(t.mode==='heat'?'flame':t.mode==='cool'?'snow':'power',18)}${t.mode==='heat'?'Heat':t.mode==='cool'?'Cool':'Off'}</button><button class="tap" data-tf>${I('fan',18)}Fan ${t.fan}</button></div>
   <button class="sch tap" data-sched>${I('cal',20)}Set up a schedule</button>
   <div class="menu" data-mm style="left:16px"><div class="mh">Select mode</div>${[['cool','snow','Cool'],['heat','flame','Heat'],['off','power','Off']].map(([m,i,l])=>`<button data-tset="${m}">${I(i,18)}${l}${t.mode===m?' ✓':''}</button>`).join('')}</div>
   <div class="menu" data-fm style="right:16px"><div class="mh">Select fan mode</div>${['auto','on'].map(f=>`<button data-fset="${f}">${f==='auto'?'Auto':'On'}${t.fan===f?' ✓':''}</button>`).join('')}</div>`;
  $('.ae-dim').classList.add('on'); R.classList.add('dark-stat'); };
const openTh=k=>{ thK=k; unpop(); thSheet(); };
const closeSheets=()=>{ $$('.ae-sheet').forEach(s=>s.classList.remove('on')); $('.ae-dim').classList.remove('on'); R.classList.toggle('dark-stat',$('.ae-live').classList.contains('on')); };

/* ---------- live view ---------- */
const openLive=k=>{ const c=CAMS.find(x=>x.k===k); liveCam=c; const L=$('.ae-live'); L.classList.toggle('sq',!!c.sq);
  const v=LIVE[c.src]?`<video src="${BASE}assets/emu/live.mp4?v=1#t=${LIVE[c.src][0]}" muted playsinline autoplay preload="auto"></video>`:SPI(c.src,'width:100%;height:100%');
  L.innerHTML=`<button class="vx tap" data-lx>${I('x',26,1.6)}</button>${c.dt?`<button class="lv dt${S.deter[k]?'':' off'}" data-ldt>Deter ${S.deter[k]?'on':'off'} <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></button>`:'<span class="lv">LIVE</span>'}
   <div class="vid">${v}<div class="flash"></div></div>
   <div class="lk">${[['front','Front Door'],['side','Side Door'],['main','Main Garage'],['side','Side Garage']].map(([kk,n],i)=>i<2?`<button data-llk="${kk}"><span><b>${n}</b><small>${S.lock[kk]?'Locked':'Unlocked'}</small></span><i>${I(S.lock[kk]?'lock':'unlock',20)}</i></button>`:`<button data-lgr="${kk}"><span><b>${n}</b><small>${S.gar[kk]?'Open':'Closed'}</small></span><i>${I('garage2',20)}</i></button>`).join('')}</div>
   <div class="ctl"><button data-lc="locks"><i>${I('lock',22)}</i>LOCKS</button>${c.k!=='drive'?`<button data-lc="talk"><i>${I('mic',22)}</i>TALK</button>`:''}<button data-lc="photo"><i>${I('photo',22)}</i>PHOTO</button></div>
   <button class="ev" data-evs="${k}">${I('chevU',14,2)}EVENTS</button>`;
  L.classList.add('on'); R.classList.add('dark-stat'); const vid=L.querySelector('video'); if(vid){ const [a,b]=LIVE[c.src]; const go=()=>{ try{vid.currentTime=a+.05;}catch(e){} vid.play().catch(()=>{}); }; vid.addEventListener('loadedmetadata',go,{once:true}); vid.addEventListener('timeupdate',()=>{ if(vid.currentTime>=b-.08||vid.currentTime<a-.2) vid.currentTime=a+.05; }); vid.addEventListener('ended',go); if(vid.readyState>=1) go(); } };
const closeLive=()=>{ const L=$('.ae-live'); L.classList.remove('on'); R.classList.remove('dark-stat'); setTimeout(()=>{ if(!L.classList.contains('on')) L.innerHTML=''; },320); };

/* ---------- events sheet ---------- */
const EV={door:[['10:30:20 PM','Sarah seen <i style="width:6px;height:6px;border-radius:50%;background:#111;display:inline-block"></i>','Doorbell rang','e_sarah'],['10:28:20 PM','A visitor rang your doorbell','','e_visitor']],
  night:[['10:30:20 PM','Person detected','','e_hoodie']],gen2:[['10:30:20 PM','<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#d0021b" stroke-width="2.4"/></svg>Person Lingering','','e_linger'],['10:29:20 PM','Person detected','','e_person']]};
const evList=k=>{ const ks=k==='all'?['gen2','night','door']:[k]; const rows=ks.flatMap(x=>EV[x]||[]);
  return `<div class="ae-dh">Thursday, March 31st</div>`+(rows.length?rows.map(([t,a,b,img])=>`<div class="ae-evc"><span><small>${t}</small><b>${a}</b>${b?`<b style="margin-top:0">${b}</b>`:''}</span>${SPI(img,'width:160px;border-radius:8px;flex:none;align-self:flex-start')}</div>`).join(''):'<div style="padding:30px 8px;color:#888;font-size:14px">No events today for this camera.</div>'); };
const openEvs=k=>{ const s=$('.ae-sheet.ae-evs'); const cams=[['all','All'],...CAMS.map(c=>[c.k,c.n])];
  s.innerHTML=`<div class="top"><button class="tap" data-tx>${I('chevD',24,1.8)}</button><span style="display:flex;gap:16px;align-items:center;font-size:14px">Select ${I('gear',24)}</span></div><h2>Events</h2>
   <div class="fl"><button>${I('cal',18)}</button>${cams.map(([c,n])=>`<button data-evf="${c}" class="${c===k?'on':''}">${c==='all'?I('cam',16):''}${n}</button>`).join('')}</div><div class="ls">${evList(k)}</div>`;
  s.classList.add('on'); $('.ae-dim').classList.add('on'); };

/* ---------- Activity & For You ---------- */
const TLg=`<div class="ae-tl"><span style="left:0;width:48%;background:#5ee39d"></span><span style="left:49%;width:22%;background:#ff6a2f"></span><span style="left:72%;width:27%;background:#5ee39d"></span><em style="left:0">12AM</em><em style="left:47%">12PM</em></div>`;
const TLd=`<div class="ae-tl"><span style="left:0;width:36%;background:#fff"></span><span style="left:48%;width:51%;background:#fff"></span><em style="left:0">12AM</em><em style="left:47%">12PM</em></div>`;
const actHTML=()=>`<div class="ae-ah"><button class="cb ae-gl tap" data-menu>${I('menu',24)}</button><button class="cb ae-gl tap" data-na="Activity settings">${I('gear',24)}</button></div>
  <div class="ae-ttl">Activity</div><div class="ae-sub"><button class="on">History</button><button data-na="Insights">Insights</button></div>
  <div class="ae-seg" data-seg><i></i><button class="on" data-ap="sum">${I('grid',16)}Summary</button><button data-ap="all">${I('list',16)}All Events</button></div>
  <div class="ae-pane on" data-pane="sum"><div class="ae-sl">Clips</div><div class="ae-hs">${['k_indoor','k_yard','k_gen2','k_hoodie'].map(k=>`<span class="tap" data-clip="${k}" style="flex:none;width:151px">${SPI(k,'width:151px;height:190px;border-radius:12px')}</span>`).join('')}</div>
   <div class="ae-sl">Overview</div><div class="ae-dk"><div class="hd">${I('grid',18)}Detections</div>${SPI('a_det','width:100%;border-radius:10px')}</div>
   <div class="ae-dk gr"><div class="hd">${SH('dis',20)}Security</div><div class="in"><b data-asec>${S.sec==='dis'?'Disarmed':'Armed'} since ${S.since}</b><span class="eb">Events</span>${TLg}</div></div>
   <div class="ae-dk"><div class="hd">${I('lock',18)}Locks</div>${[['front','Front Door'],['side','Side Door']].map(([k,n])=>`<div class="in"><small>${n}</small><b>${S.lock[k]?'Locked':'Unlocked'} since 10:57 AM</b><span class="eb">Events</span>${TLd}</div>`).join('')}</div>
   <div class="ae-dk"><div class="hd">${I('garage2',18)}Garage Doors</div>${[['main','Main Garage','12:21 PM'],['side','Side Garage','8:39 PM']].map(([k,n,t])=>`<div class="in"><small>${n}</small><b>${S.gar[k]?'Open':'Closed'} since ${t}</b><span class="eb">Events</span>${TLd}</div>`).join('')}</div></div>
  <div class="ae-pane" data-pane="all"><div class="ae-hs" style="margin-top:18px;padding-top:2px;padding-bottom:4px"><span class="ae-cc tap" data-evs="door">${SPI('a_catch')}</span><span class="ae-cc tap" data-evs="indoor">${SPI('a_people')}</span></div>
   <div class="ae-evs" style="position:static;transform:none;background:none"><div class="fl" style="padding:16px 0 0;border:0">${[['search',''],['cal',''],['','Devices'],['','Packages'],['shield','Security'],['','Deter'],['','Vehicles']].map(([i,l])=>`<button>${i?I(i,16):''}${l}</button>`).join('')}</div></div>${evList('all')}</div>`;
const fyHTML=()=>`<div class="ae-ah" style="height:104px"><button class="cb tap" data-menu>${I('menu',24)}</button><span style="display:flex;gap:6px"><button class="cb tap" data-na="Notifications">${I('bell',24)}</button><button class="cb tap" data-na="Support chat">${I('chat',24)}</button></span></div>
  <div class="ae-ttl">For You</div><div class="ae-sub" data-fys style="font-size:17px;border-bottom:1px solid #e6e6e6;padding-bottom:10px">${[['sys','My System'],['acct','Account'],['exp','Explore']].map(([k,l],i)=>`<button data-fy="${k}" class="${i?'':'on'}">${l}</button>`).join('')}</div>
  <div class="ae-pane on" data-fyp="sys" style="padding-top:16px"><div class="ae-fc">${SPI('f_house','width:100%;height:206px')}<div class="b"><h4>John’s House</h4><div class="bb"><button class="tap" data-na="Edit home">${I('pen',18)}Edit</button><button class="tap" data-na="Switch home">${I('swap',18)}Switch</button></div></div></div>
   <div class="ae-h" style="margin-top:34px"><h3 style="font-size:17px">Users</h3><a style="font-size:13px;text-decoration:underline" data-na="Add user">Add user</a></div>
   <div class="ae-us"><div style="padding:0 13px">${I('userAdd',26)}</div><div><i>J</i><span><small>Owner</small><b>John Smith</b></span></div><div><i style="background:#d6e6ff;color:#2a5fd0">J</i><span><small>Admin</small><b>Jane Smith</b></span></div><div><i style="background:#c9f5df;color:#0a8a55">A</i><span><small>User</small><b>Alex Smith</b></span></div></div>
   <div class="ae-h" style="margin-top:34px"><h3 style="font-size:17px">Your devices</h3><a style="font-size:13px;text-decoration:underline" data-na="Add a device">Add a device</a></div>
   <div class="ae-g2">${[['Cameras','5 devices'],['Locks','2 devices'],['Garage doors','2 devices'],['Thermostats','2 devices'],['Lights','6 devices'],['Sensors','8 devices']].map(([a,b])=>`<div class="ae-dv"><b>${a}</b><small>${b}</small></div>`).join('')}</div></div>
  <div class="ae-pane" data-fyp="acct" style="padding-top:22px"><div style="background:linear-gradient(160deg,#dfeeff,#eef6ff);border-radius:20px;padding:26px;text-align:center"><div style="width:96px;height:96px;margin:0 auto;border-radius:50%;background:#c9d6ea;display:grid;place-items:center;font-size:40px;color:#4c6a96">JS</div><div style="font-size:11px;color:#2a5fd0;margin-top:8px">◆ Premium</div><div style="font-size:21px;font-weight:500;margin:4px 0 16px">John Smith</div><button class="tap" style="height:42px;width:100%;border-radius:21px;box-shadow:inset 0 0 0 1.2px #2a5fd0;color:#2a5fd0;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px" data-na="Edit profile">${I('pen',16)}Edit profile</button></div>
   <div class="ae-sl" style="margin-top:28px">More options</div>${[['users','Referrals'],['info','Support'],['shield','Legal']].map(([i,l])=>`<button class="ae-row" data-na="${l}">${I(i,20)}${l}${I('chevR',16)}</button>`).join('')}</div>
  <div class="ae-pane" data-fyp="exp"><div class="ae-sl" style="font-size:17px">Your recommended features</div><div class="ae-hs">${[['x_comfort','Smart comfort','Conserve energy and save on your utility bills.'],['x_away','Away lighting','Protect your home while you’re away.'],['x_package','Package protection','Prevent package theft from your doorstep.']].map(([im,a,b])=>`<div class="ae-xp">${SPI(im,'width:197px;height:196px;border-radius:12px')}<b>${a}</b><small>${b}</small></div>`).join('')}</div>
   <div class="ae-sl" style="font-size:17px;margin-top:30px">Products for you</div><div class="ae-hs"><div class="ae-pc">${SPI('p_indoor','width:100%;height:100%')}</div><div class="ae-pc grad"><div><b>Doorbell Camera Pro</b><small>You received 18 packages last month. Keep them protected.</small></div></div><div class="ae-pc">${SPI('p_spot','width:100%;height:100%')}</div></div></div>`;
const menuHTML=()=>`<h2>John’s House</h2><button class="x tap" data-mx>${I('x',26,1.6)}</button><div class="gl">Home</div><div class="ml">${[['swap','Switch Home'],['spark','Smart Actions','sa'],['energy','Energy'],['plus','Add a Device'],['link','Smarter with Vivint'],['user','Profile'],['users','Users'],['appear','Appearance']].map(([i,l,p])=>`<button ${p?`data-page="${p}"`:`data-na="${l}"`}>${I(i,22)}${l}</button>`).join('')}</div><div class="ver"><b>App version:</b> 26.12.130 (57103)</div>`;
const saHTML=()=>`<button class="bk tap" data-pb>${I('chevL',22,2)}</button><h2>Smart Actions <a data-na="Add a Smart Action">Add new</a></h2>${[['bell','Notify me when…','14 enabled'],['shield','Arm or disarm the home when…','3 enabled'],['bulb','Turn the lights on or off when…','3 enabled'],['cam','Record a video clip when…','1 enabled'],['eye','Change camera privacy when…','0 enabled'],['spk','Trigger deter when…','0 enabled'],['lock','Lock or unlock the door when…','6 enabled'],['garage','Open or close the garage when…','0 enabled'],['thermo','Adjust the thermostat when…','0 enabled']].map(([i,a,b])=>`<button class="ae-sa" data-na="${a.replace('…','')}">${I(i,24)}<span><b>${a}</b><small>${b}</small></span></button>`).join('')}`;

/* ---------- mount ---------- */
const tab=t=>{ S.tab=t; $$('.ae-view').forEach(v=>v.classList.toggle('on',v.dataset.v===t)); const i=['home','activity','foryou'].indexOf(t); $('.ae-tabs .ind').style.transform=`translateX(${i*100}%)`;
  $$('.ae-tabs button').forEach((b,j)=>{ b.innerHTML=I([['homeF','home'],['clockF','clock'],['userF','user']][j][j===i?0:1],24)+`<span>${['My Home','Activity','For you'][j]}</span>`; });
  if(t==='activity'){ const v=$('[data-v=activity]'); v.innerHTML=actHTML(); } };
const mount=host=>{ if(!host||host.__emu) return; host.__emu=1; host.innerHTML=`<div class="ae-app" data-sec="dis">
   <div class="ae-stat"><b data-clock>9:41</b><span><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>5G<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="4" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4" stroke="currentColor" stroke-width="1.5" opacity=".4" stroke-linecap="round"/></svg></span></div><div class="ae-isl"></div>
   <div class="ae-view on" data-v="home">${homeHTML()}</div><div class="ae-view" data-v="activity"></div><div class="ae-view" data-v="foryou">${fyHTML()}</div>
   <nav class="ae-tabs"><span class="ind"></span><button data-tab="home"></button><button data-tab="activity"></button><button data-tab="foryou"></button></nav>
   <div class="ae-scrim"></div><div class="ae-pop"></div><div class="ae-arm"></div><div class="ae-dim"></div><div class="ae-sheet ae-ts"></div><div class="ae-live"></div><div class="ae-sheet ae-evs"></div>
   <div class="ae-menu">${menuHTML()}</div><div class="ae-page"></div><div class="ae-toast"></div></div>`;
  R=host.querySelector('.ae-app'); render(); tab('home');
  const clk=()=>{ const d=new Date(); R.querySelector('[data-clock]').textContent=(d.getHours()%12||12)+':'+String(d.getMinutes()).padStart(2,'0'); }; clk(); setInterval(clk,15000);
  R.addEventListener('click',onClick); };
const onClick=e=>{ const t=e.target.closest('button,[data-cam],[data-evs],[data-dt],[data-na],[data-clip],.ae-scrim'); if(!t) return; const d=t.dataset;
  if(t.classList.contains('ae-scrim')){ unpop(); return; }
  if(d.tab){ tab(d.tab); return; }
  if(d.arm!==undefined){ const a=$('.ae-arm'); const cur=k=>S.sec===k?` cur ${k==='dis'?'dis':'arm'}`:'';
    a.innerHTML=`<button data-set="dis" class="tap${cur('dis')}">${SH('dis',40)}<span><b>Disarmed</b><small>${S.sec==='dis'?'Since '+S.since:'Disarm your home'}</small></span></button><button data-set="away" class="tap${cur('away')}">${SH('away',40)}<span><b>${S.sec==='away'?'Armed Away':'Arm Away'}</b><small>${S.sec==='away'?'Since '+S.since:'Arm when no one is home'}</small></span></button><button data-set="stay" class="tap${cur('stay')}">${SH('stay',40)}<span><b>${S.sec==='stay'?'Armed Stay':'Arm Stay'}</b><small>${S.sec==='stay'?'Since '+S.since:'Arm when someone is home'}</small></span></button>`;
    a.classList.add('on'); return; }
  if(d.set){ $('.ae-arm').classList.remove('on'); setTimeout(()=>setSec(d.set),250); return; }
  if(t.classList.contains('ae-arm')) return;
  if(d.q){ pop(popFor(d.q),t); return; }
  if(d.pa){ const [a,k]=d.pa.split(':'); unpop();
    if(a==='lockall') ['front','side'].forEach((x,i)=>setTimeout(()=>doLock(x,1),i*150)); else if(a==='unlockall') ['front','side'].forEach((x,i)=>setTimeout(()=>doLock(x,0),i*150));
    else if(a==='lk') doLock(k,S.lock[k]?0:1); else if(a==='closeall') ['main','side'].forEach(x=>doGar(x,0)); else if(a==='openall') ['main','side'].forEach(x=>doGar(x,1)); else if(a==='gr') doGar(k,S.gar[k]?0:1);
    else if(a==='th') openTh(k); else if(a==='deton') setDeter(['door','night','gen2'],1); else if(a==='detoff') setDeter(['door','night','gen2'],0); else if(a==='dt') setDeter([k],!S.deter[k]);
    return; }
  if(d.dt){ e.stopPropagation(); setDeter([d.dt],!S.deter[d.dt]); return; }
  if(d.evs){ e.stopPropagation(); openEvs(d.evs); return; }
  if(d.evf){ $$('.ae-evs [data-evf]').forEach(b=>b.classList.toggle('on',b===t)); $('.ae-evs .ls').innerHTML=evList(d.evf); return; }
  if(d.cam){ openLive(d.cam); return; }
  if(d.lx!==undefined){ closeLive(); return; }
  if(d.ldt!==undefined){ const k=liveCam.k; setDeter([k],!S.deter[k]); setTimeout(()=>{ const b=$('[data-ldt]'); if(b){ b.classList.toggle('off',!S.deter[k]); b.firstChild.textContent='Deter '+(S.deter[k]?'on':'off')+' '; } },1150); return; }
  if(d.lc){ if(d.lc==='locks') $('.ae-live .lk').classList.toggle('on'); if(d.lc==='talk'){ t.classList.toggle('on'); toast(t.classList.contains('on')?'Two-way talk on. Speak now.':'Two-way talk ended.','info'); }
    if(d.lc==='photo'){ const f=$('.ae-live .flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); toast('Photo saved to your activity.'); } return; }
  if(d.llk){ doLock(d.llk,S.lock[d.llk]?0:1); setTimeout(()=>{ if(liveCam) openLive(liveCam.k), $('.ae-live .lk').classList.add('on'); },1400); return; }
  if(d.lgr){ doGar(d.lgr,S.gar[d.lgr]?0:1); setTimeout(()=>{ if(liveCam) openLive(liveCam.k), $('.ae-live .lk').classList.add('on'); },1900); return; }
  if(d.lk){ doLock(d.lk,S.lock[d.lk]?0:1); return; }
  if(d.gr){ doGar(d.gr,S.gar[d.gr]?0:1); return; }
  if(d.th){ openTh(d.th); return; }
  if(d.tx!==undefined){ closeSheets(); render(); return; }
  if(d.tu!==undefined||d.td!==undefined){ const th=S.th[thK]; th.set=Math.max(50,Math.min(90,th.set+(d.tu!==undefined?1:-1))); emit('th',{k:thK,set:th.set,mode:th.mode}); const n=$('.ae-ts .num'); n.firstChild.textContent=th.set; n.animate([{transform:`translateY(${d.tu!==undefined?8:-8}px)`,opacity:.4},{transform:'none',opacity:1}],{duration:220,easing:'ease-out'}); renderDev(); return; }
  if(d.tm!==undefined){ $('.ae-ts [data-mm]').classList.toggle('on'); $('.ae-ts [data-fm]').classList.remove('on'); return; }
  if(d.tf!==undefined){ $('.ae-ts [data-fm]').classList.toggle('on'); $('.ae-ts [data-mm]').classList.remove('on'); return; }
  if(d.tset){ const th=S.th[thK]; th.mode=d.tset; if(d.tset==='cool'&&th.set<th.cur-8) th.set=Math.max(th.set,72); if(d.tset==='heat'&&th.set>78) th.set=68; emit('th',{k:thK,set:th.set,mode:th.mode}); thSheet(); render(); return; }
  if(d.fset){ S.th[thK].fan=d.fset; thSheet(); return; }
  if(d.li!==undefined){ const i=+d.li; if(S.light[i]){ S.lastL[i]=S.light[i]; S.light[i]=0; } else S.light[i]=S.lastL[i]||80; emit('light',{i,v:S.light[i]}); renderDev(); return; }
  if(d.alloff!==undefined){ S.light=S.light.map((v,i)=>{ if(v) S.lastL[i]=v; return 0; }); emit('light',{all:0}); renderDev(); toast('All lights turned off.'); return; }
  if(d.sc){ emit('sc',{k:d.sc}); QUIET++; try{ if(d.sc==='leave'){ setSec('away',1); ['front','side'].forEach(x=>doLock(x,1)); ['main','side'].forEach(x=>doGar(x,0)); toast('Leaving: armed away, doors locked, garage closed.'); }
    if(d.sc==='bed'){ setSec('stay',1); ['front','side'].forEach(x=>doLock(x,1)); ['main','side'].forEach(x=>doGar(x,0)); S.light=S.light.map((v,i)=>{ if(v) S.lastL[i]=v; return 0; }); renderDev(); toast('Bedtime: armed stay, doors locked, lights off.'); }
    if(d.sc==='arrive'){ setSec('dis',1); S.light[2]=100; S.light[1]=80; renderDev(); toast('Arriving: disarmed, entry lights on.'); } }finally{ QUIET--; } return; }
  if(d.chip){ $$('.ae-chips button').forEach(b=>b.classList.toggle('on',b===t)); $$('[data-v=home] [data-s]').forEach(s=>s.style.display=(d.chip==='all'||s.dataset.s===d.chip)?'':'none'); return; }
  if(d.ap){ $$('[data-ap]').forEach(b=>b.classList.toggle('on',b===t)); $('[data-seg]').classList.toggle('r',d.ap==='all'); $$('[data-pane]').forEach(p=>p.classList.toggle('on',p.dataset.pane===d.ap)); return; }
  if(d.fy){ $$('[data-fy]').forEach(b=>b.classList.toggle('on',b===t)); $$('[data-fyp]').forEach(p=>p.classList.toggle('on',p.dataset.fyp===d.fy)); return; }
  if(d.clip){ openLive({k_indoor:'indoor',k_yard:'night',k_gen2:'gen2',k_hoodie:'night'}[d.clip]); return; }
  if(d.menu!==undefined){ $('.ae-menu').classList.add('on'); return; }
  if(d.mx!==undefined){ $('.ae-menu').classList.remove('on'); return; }
  if(d.page){ const p=$('.ae-page'); p.innerHTML=saHTML(); p.classList.add('on'); return; }
  if(d.pb!==undefined){ $('.ae-page').classList.remove('on'); return; }
  if(d.sos!==undefined){ toast('SOS is off in demo mode. In the real app it alerts Vivint monitoring.','info'); return; }
  if(d.sched!==undefined||d.more!==undefined){ toast('Available in the full Vivint app.','info'); return; }
  if(d.na){ toast(d.na+' is available in the full Vivint app.','info'); return; }
};
document.addEventListener('click',e=>{ if(R&&e.target.closest&&e.target.closest('.ae-dim')){ closeSheets(); render(); } });
/* set from outside (the house / hub changed): animate like a real update, never echo back */
const apply=o=>{ if(!R) return; QUIET++; try{
  if(o.sec&&o.sec!==S.sec) setSec(o.sec,1);
  if(o.lock) for(const k in o.lock) if(o.lock[k]!=null&&!!S.lock[k]!==!!o.lock[k]) doLock(k,o.lock[k]?1:0);
  if(o.gar) for(const k in o.gar) if(o.gar[k]!=null&&!!S.gar[k]!==!!o.gar[k]) doGar(k,o.gar[k]?1:0);
  if(o.th) for(const k in o.th){ const t=S.th[k], v=o.th[k]; if(t&&v){ Object.assign(t,v); } }
  if(o.deter) for(const k in o.deter) if(k in S.deter&&!!S.deter[k]!==!!o.deter[k]) S.deter[k]=o.deter[k]?1:0;
  if(o.lights!=null){ const on=!!o.lights; [3,4].forEach(i=>{ if(!!S.light[i]!==on){ if(S.light[i]) S.lastL[i]=S.light[i]; S.light[i]=on?(S.lastL[i]||80):0; } }); }
  render(); if(thK&&$('.ae-ts').classList.contains('on')) thSheet(); if(o.toast) toast(o.toast,'info'); }finally{ QUIET--; } };
const reset=()=>{ if(!R) return; closeSheets(); closeLive(); unpop(); $('.ae-arm').classList.remove('on'); $('.ae-menu').classList.remove('on'); $('.ae-page').classList.remove('on'); tab('home'); $('[data-v=home]').scrollTo({top:0}); };
return {mount,state:S,on:f=>{ subs.add(f); return ()=>subs.delete(f); },apply,reset};
})();


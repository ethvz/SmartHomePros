/* iPad portrait (html.ipp) behaviour: prodA group (#p-prod, #p-hub, #p-therm). Only acts while html.ipp is on, and undoes
   everything it set when the class goes away (rotation to landscape). Layout numbers are stage px on the 1032-wide stage. */
(function(){ try{
  const BOX=['#prScroll','#hbScroll','#thScroll'], $=q=>document.querySelector(q), isI=()=>document.documentElement.classList.contains('ipp');
  const W=1032, cssN=(el,v,d)=>{ const n=parseFloat(getComputedStyle(el).getPropertyValue(v)); return isNaN(n)?d:n; };
  const TOP=()=>cssN($('#stage'),'--ippT',96), FOOT=()=>cssN($('#stage'),'--ippFoot',84), L=128, R=56;
  const setI=(el,p,v)=>{ if(el.style.getPropertyValue(p)!==v||el.style.getPropertyPriority(p)!=='important') el.style.setProperty(p,v,'important'); };
  const unset=(el,ps)=>ps.forEach(p=>{ if(el.style.getPropertyValue(p)) el.style.removeProperty(p); });
  const setCls=(el,c,on)=>{ if(el.classList.contains(c)!==!!on) el.classList.toggle(c,!!on); };
  let later=()=>{};

  /* ---- swipe strips (Hardware | Specs, Door & Window hero): each pane is 1032 wide, so the step follows the pane (.wide) ---- */
  function strips(){ const on=isI();
    BOX.forEach(q=>{ const b=$(q); if(!b) return;
      b.querySelectorAll('.strip').forEach(st=>{
        if(on&&!st.classList.contains('wide')){ st.classList.add('wide'); st.dataset.ipw=1; }
        else if(!on&&st.dataset.ipw){ st.classList.remove('wide'); delete st.dataset.ipw; }
        const sec=st.closest('[data-t]'); if(!sec||sec.__drag||typeof stripSet!=='function') return;
        const stp=st.classList.contains('wide')?(st.firstElementChild&&st.firstElementChild.offsetWidth||1376):1376, old=+(st.dataset.ipStep||stp);
        if(old!==stp){ const m=new DOMMatrix(getComputedStyle(st).transform), p=Math.max(0,Math.min(1,Math.round(-m.m41/old))); try{ stripSet(sec,p,false); }catch(e){} }
        st.dataset.ipStep=stp; }); }); }

  /* ---- focal points: landscape photos cropped to the upright screen keep the product in view.
     fx = where the product sits across the source image (0..1). ---- */
  const FOC={'ph/motion':.57,'ph/glass':.26,'ph/water':.60,'ph/smoke':.70,'ph/pendant':.30,'ph/fob':.38,'ph/keypad':.33,'ph/lock3':.70,
    'ph/plug3':.33,'ph/chime3':.40,'ph/garage2':.25,'ph/firefighter':.55,'ph/therm2':.675,'ph/dws_surf':.62,'ph/dws_rec':.25,'p/ic_hero':.46,
    'gal/lock_0':.40,'gal/lock_1':.27,'gal/lock_2':.27,'gal/lock_3':.53,'gal/lock_4':.40,'gal/lock_5':.55,'gal/lock_6':.52,'gal/lock_7':.52,'gal/lock_8':.28,
    'gal/therm_0':.50,'gal/therm_1':.83,'gal/therm_2':.42,'gal/therm_3':.66,'gal/garage_0':.72,'gal/garage_1':.52,'gal/garage_2':.22,'gal/garage_3':.33,
    'gal/hub_0':.63,'gal/hub_1':.64,'gal/hub_2':.42,'gal/hub_3':.83,'gal/hub_4':.70,'gal/hub_5':.66,'gal/hub_6':.68,'gal/hub_7':.70,'gal/hub_8':.68,
    'gal/icp_0':.63,'gal/icp_1':.65,'gal/icp_2':.73,'gal/icp_3':.32,'gal/icp_4':.40,'gal/icp_5':.37,'gal/icp_6':.62};
  const focKey=el=>{ const u=el.getAttribute('src')||el.getAttribute('poster')||''; const m=u.match(/assets\/((?:ph|gal|p)\/[\w]+)\./); return m&&m[1]; };
  function focal(){ const on=isI();
    BOX.forEach(q=>{ const b=$(q); if(!b) return;
      b.querySelectorAll('img,video').forEach(el=>{ const k=focKey(el), fx=k&&FOC[k];
        if(!on||fx==null){ if(el.dataset.ipf){ el.style.removeProperty('object-position'); if(el.dataset.ipf!=='-') el.style.objectPosition=el.dataset.ipf; delete el.dataset.ipf; } return; }
        const nw=el.naturalWidth||el.videoWidth, nh=el.naturalHeight||el.videoHeight, bw=el.offsetWidth, bh=el.offsetHeight;
        if(!nw||!bw||!bh){ if(!el.__ipfl){ el.__ipfl=1; el.addEventListener(el.tagName==='VIDEO'?'loadedmetadata':'load',()=>later(),{once:true}); } return; }
        const vis=(bw/bh)/(nw/nh); if(vis>=1) return;
        const x=Math.max(0,Math.min(1,(fx-vis/2)/(1-vis))), v=(x*100).toFixed(1)+'% 50%';
        if(!el.dataset.ipf) el.dataset.ipf=el.style.objectPosition||'-';
        setI(el,'object-position',v); }); }); }

  /* ---- Hardware | Specs panes ----
     Hardware: the product render large and centred in the upper part, its green feature dots on it; the callouts below in two
     columns (left-hand callouts left, right-hand ones right, top to bottom as in landscape).
     Specs: render on the left, the table on the right, both centred in the screen (the landscape arrangement, taller). */
  const PS=['left','top','width','height','z-index','transform','transform-origin','grid-column','order'];
  function specs(){ const on=isI(), T=TOP(), F=FOOT();
    BOX.forEach(q=>{ const b=$(q); if(!b) return;
      b.querySelectorAll('.strip.fsx>.fsp-pane').forEach((pn,pi)=>{
        const ims=[...pn.querySelectorAll(':scope>img.fsp-im')], svg=pn.querySelector(':scope>svg.fsp-ln'), cos=[...pn.querySelectorAll(':scope>.fsp-co')], fst=pn.querySelector(':scope>.fst');
        if(!on){ [...pn.children].forEach(c=>{ if(c.dataset.ipo!=null){ unset(c,PS); const o=JSON.parse(c.dataset.ipo); Object.keys(o).forEach(p=>c.style[p]=o[p]); delete c.dataset.ipo; } });
          setCls(pn,'ipA-f',0); setCls(pn,'ipA-s',0); return; }
        [...pn.children].forEach(c=>{ if(c.dataset.ipo==null){ const o={}; ['left','top','width','height'].forEach(p=>o[p]=c.style[p]); c.dataset.ipo=JSON.stringify(o); } });
        if(!ims.length) return;
        const R0=ims.map(im=>{ const o=JSON.parse(im.dataset.ipo); return [parseFloat(o.left),parseFloat(o.top),parseFloat(o.width),parseFloat(o.height)]; });
        if(R0.some(r=>r.some(isNaN))) return;
        const gx=Math.min(...R0.map(r=>r[0])), gy=Math.min(...R0.map(r=>r[1])), gw=Math.max(...R0.map(r=>r[0]+r[2]))-gx, gh=Math.max(...R0.map(r=>r[1]+r[3]))-gy;
        let cap=9; ims.forEach((im,i)=>{ if(im.naturalWidth) cap=Math.min(cap,im.naturalWidth*1.25/R0[i][2]); else if(!im.__ipl){ im.__ipl=1; im.addEventListener('load',()=>later(),{once:true}); } });
        const H=pn.offsetHeight||window.SH||1400, feat=!fst;
        setCls(pn,'ipA-f',feat); setCls(pn,'ipA-s',!feat);
        let k,X,Y;
        if(feat){
          /* callouts: left column = those left of the product in landscape, right column = the rest; landscape order top to bottom */
          cos.forEach(c=>{ const o=JSON.parse(c.dataset.ipo); setI(c,'grid-column',c.classList.contains('r')?'1':'2'); setI(c,'order',String(Math.round(parseFloat(o.top)||0))); });
          const tops=[...pn.children].filter(c=>!c.matches('img,svg')&&c.offsetHeight).map(c=>c.offsetTop), tTop=tops.length?Math.min(...tops):H-F-300;
          const free=Math.max(200,tTop-56-(T+30)); k=Math.min(600/gw,free/gh,cap); X=(L+W-R)/2-gw*k/2; Y=T+30+(free-gh*k)/2; }
        else {
          const colW=400, free=H-T-F-190; k=Math.min(colW/gw,free/gh,cap); X=L+(colW-gw*k)/2; Y=T+40+(free-gh*k)/2;
          const th=fst.offsetHeight; setI(fst,'left',(L+colW+56)+'px'); setI(fst,'width',(W-R-(L+colW+56))+'px'); setI(fst,'top',Math.max(T+60,Math.round(Y+gh*k/2-th/2+20))+'px'); }
        ims.forEach((im,i)=>{ const r=R0[i]; setI(im,'left',(X+(r[0]-gx)*k).toFixed(1)+'px'); setI(im,'top',(Y+(r[1]-gy)*k).toFixed(1)+'px'); setI(im,'width',(r[2]*k).toFixed(1)+'px'); setI(im,'height',(r[3]*k).toFixed(1)+'px'); });
        if(svg){ setI(svg,'transform-origin','0 0'); setI(svg,'transform',`translate(${(X-gx*k).toFixed(1)}px,${(Y-gy*k).toFixed(1)}px) scale(${k.toFixed(4)})`); }
      }); }); }


  /* ---- picture sections (one 1376x964 artwork + video + hotspots: Smart Lock highlights / colours, Garage, App):
     the artwork is wrapped in .ipart and scaled up around its region of interest (several crops = parts of it stacked, or a
     2x2 grid); tiles that pick what it shows (.lvt / .lvl) are lifted into .ipctl under it at full size, except in 'keep'
     layouts where the landscape arrangement already fits the upright width and the tiles stay beside the picture. ---- */
  const LAY={
    'lock:lock':{mode:'stack',crops:[[70,200,820,590],[930,190,420,610]],w:[1,.8]},
    'lock:lock:2':{crops:[[176,104,930,700]]},
    'lock:lock:3':{crops:[[462,8,496,776]]},
    'lock:colors':{mode:'grid',crops:[[66,222,296,428],[362,222,296,428],[660,222,296,428],[1004,222,296,428]],fade:['r','r','r','l'],labels:['Bronze','Nickel','Brass','Matte Black']},
    'garage:garage':{mode:'stack',crops:[[80,130,500,720],[592,190,696,710]],w:[.8,1]},
    'garage:gphone':{keep:1,crops:[[200,30,900,900]]},
    'app:hero':{mode:'stack',crops:[[40,96,690,210],[60,390,640,320],[716,0,660,964]],w:[1,1,.86],fade:['','','b']},
    'app:phone':{crops:[[90,60,700,840]]}};
  const ART='img.full,video.ovid,.hl,.tip,.xf-ghost', CAPK=1.65;
  function artSecs(){ const b=$('#prScroll'); return b?[...b.children].filter(s=>s.classList.contains('psec')&&(s.querySelector(':scope>img.full')||s.querySelector(':scope>.ipart>img.full'))):[]; }
  function ghost(sec,w,i){ let g=sec.querySelector(':scope>.ipart.ipx[data-i="'+i+'"]');
    if(!g){ g=document.createElement('div'); g.className='ipart ipx'; g.dataset.i=i; g.setAttribute('aria-hidden','true'); g.innerHTML='<img class="full" alt=""><video class="ovid" muted playsinline loop></video>'; w.after(g); }
    const im=w.querySelector('img.full'), gi=g.querySelector('img'); if(im&&gi.getAttribute('src')!==im.getAttribute('src')) gi.src=im.getAttribute('src'); gi.hidden=!!(im&&im.hidden);
    const v=w.querySelector('video.ovid'), gv=g.querySelector('video');
    if(v&&!v.hidden&&v.currentSrc){ if(gv.__u!==v.currentSrc){ gv.__u=v.currentSrc; gv.src=v.currentSrc; } gv.hidden=false; gv.style.cssText=v.style.cssText; gv.className=v.className;
      if(!gv.__sync){ gv.__sync=setInterval(()=>{ if(!document.contains(gv)){ clearInterval(gv.__sync); return; } const o=gv.__o; if(!o||!isI()||document.hidden) return; if(o.paused!==gv.paused) o.paused?gv.pause():gv.play().catch(()=>{}); if(Math.abs(o.currentTime-gv.currentTime)>.15) try{ gv.currentTime=o.currentTime; }catch(e){} },700); }
      gv.__o=v; if(!v.paused&&gv.paused) gv.play().catch(()=>{}); }
    else { gv.hidden=true; if(!gv.paused) gv.pause(); }
    return g; }
  const fadeEdge=(el,r,fd)=>{ const g=[]; fd=fd||'';
    if(fd.includes('r')) g.push(`linear-gradient(90deg,#000 ${(r[0]+r[2]*.8).toFixed(0)}px,transparent ${(r[0]+r[2]).toFixed(0)}px)`);
    if(fd.includes('l')) g.push(`linear-gradient(90deg,transparent ${r[0].toFixed(0)}px,#000 ${(r[0]+r[2]*.2).toFixed(0)}px)`);
    if(fd.includes('b')) g.push(`linear-gradient(180deg,#000 ${(r[1]+r[3]*.8).toFixed(0)}px,transparent ${(r[1]+r[3]).toFixed(0)}px)`);
    const m=g.join(','), c=g.length>1?g.slice(1).map(()=>'intersect').join(','):'';
    if(el.__fd!==m){ el.__fd=m; el.style.webkitMaskImage=m; el.style.maskImage=m; el.style.maskComposite=c; el.style.webkitMaskComposite=g.length>1?g.slice(1).map(()=>'source-in').join(','):''; } };
  const place=(el,r,k,x,y)=>{ if(!el.dataset.ipl) setTimeout(()=>{ el.dataset.ipl=1; },80); const tr=`${(x-r[0]*k).toFixed(1)}px ${(y-r[1]*k).toFixed(1)}px`, sc=k.toFixed(4), cp=`inset(${r[1]}px ${1376-r[0]-r[2]}px ${964-r[1]-r[3]}px ${r[0]}px)`;
    if(el.style.translate!==tr) el.style.translate=tr; if(el.style.scale!==sc) el.style.scale=sc; if(el.style.clipPath!==cp) el.style.clipPath=cp; };
  function art(){ const on=isI(), H=window.SH||1400, id=(typeof PR!=='undefined'&&PR&&PR.id)||'', T=TOP(), F=FOOT(), CX=(L+W-R)/2, CW=W-L-R;
    artSecs().forEach(sec=>{
      let w=sec.querySelector(':scope>.ipart:not(.ipx)'), c=sec.querySelector(':scope>.ipctl');
      if(!on){ if(w){ [...w.children].forEach(x=>sec.insertBefore(x,w)); w.remove(); } if(c){ const hl=sec.querySelector('.hl'); [...c.children].forEach(x=>hl&&hl.appendChild(x)); c.remove(); }
        sec.querySelectorAll(':scope>.ipart.ipx,:scope>.iplab').forEach(x=>{ const v=x.querySelector('video'); if(v) v.pause(); x.remove(); }); setCls(sec,'ipA-tiles',0); return; }
      if(!w){ w=document.createElement('div'); w.className='ipart'; sec.insertBefore(w,sec.firstChild); }
      sec.querySelectorAll(':scope>'+ART.split(',').join(',:scope>')).forEach(x=>w.appendChild(x));
      const sub=PR&&PR.st&&PR.st[sec.dataset.t]?PR.st[sec.dataset.t].sub:null;
      const Ly=LAY[id+':'+sec.dataset.t+':'+sub]||LAY[id+':'+sec.dataset.t]||{crops:[[0,0,1376,964]]}, cr=Ly.crops, hl=w.querySelector('.hl');
      if(Ly.keep){ if(c){ [...c.children].forEach(x=>hl&&hl.appendChild(x)); c.remove(); c=null; } }
      else { if(!c){ c=document.createElement('div'); c.className='ipctl'; sec.appendChild(c); }
        const tiles=hl?[...hl.querySelectorAll(':scope>.lvt,:scope>.lvl')]:[]; if(tiles.length){ c.innerHTML=''; tiles.forEach(x=>c.appendChild(x)); } }
      const n=c?c.querySelectorAll('.lvt').length:0, list=c&&c.querySelector('.lvl');
      const cols=n<=5?n:4, rows=list?0:n?Math.ceil(n/cols):0, th=n<=5?130:112, ctlH=list?list.children.length*64:rows*th+(rows?(rows-1)*12:0);
      if(c){ c.style.setProperty('--cols',cols||1); c.style.setProperty('--th',th+'px'); } setCls(sec,'ipA-tiles',n>0);
      const top0=T+24, bot=F+(n?36:110), gap=ctlH?36:0, avail=H-top0-bot-ctlH-gap;
      const used=new Set([0]); let blockH=0;
      if(Ly.mode==='grid'){ const lh=48, gx=24, gy=20, cw=(CW-gx)/2, x0=L; let k=Math.min(CAPK,...cr.map(r=>cw/r[2]),...cr.map(r=>(avail-2*lh-gy)/2/r[3]));
        const ch=Math.max(...cr.map(r=>r[3]*k)); blockH=2*(ch+lh)+gy; const y0=top0+Math.max(0,(avail-blockH)/2);
        cr.forEach((r,i)=>{ const col=i%2, row=i>>1, x=x0+col*(cw+gx)+(cw-r[2]*k)/2, y=y0+row*(ch+lh+gy); const el=i?ghost(sec,w,i):w; used.add(i); place(el,r,k,x,y);
          let lb=sec.querySelector(':scope>.iplab[data-i="'+i+'"]'); if(!lb){ lb=document.createElement('div'); lb.className='iplab'; lb.dataset.i=i; sec.appendChild(lb); }
          const tx=(Ly.labels||[])[i]||''; if(lb.textContent!==tx) lb.textContent=tx;
          fadeEdge(el,r,(Ly.fade||[])[i]); Object.assign(lb.style,{left:(x0+col*(cw+gx))+'px',top:(y+ch+10).toFixed(0)+'px',width:cw+'px'}); }); }
      else { const ws=Ly.w||cr.map(()=>1), sg=24, maxW=Ly.keep?CW:CW;
        let k=Math.min(CAPK,...cr.map((r,i)=>maxW/(r[2]*ws[i])), (avail-sg*(cr.length-1))/cr.reduce((a,r,i)=>a+r[3]*ws[i],0));
        blockH=cr.reduce((a,r,i)=>a+r[3]*k*ws[i],0)+sg*(cr.length-1); let y=top0+Math.max(0,(avail-blockH)/2);
        cr.forEach((r,i)=>{ const kk=k*ws[i], el=i?ghost(sec,w,i):w; used.add(i); place(el,r,kk,CX-r[2]*kk/2,y); fadeEdge(el,r,(Ly.fade||[])[i]); y+=r[3]*kk+sg; }); }
      sec.querySelectorAll(':scope>.ipart.ipx,:scope>.iplab').forEach(x=>{ if(!used.has(+x.dataset.i)||(x.classList.contains('iplab')&&Ly.mode!=='grid')){ const v=x.querySelector('video'); if(v) v.pause(); x.remove(); } });
      if(c){ const ct=(H-bot-ctlH).toFixed(0)+'px'; if(c.style.top!==ct) c.style.top=ct; c.style.height=ctlH+'px'; }
    }); }

  /* ---- Smart Thermostat Highlights: the picture as large as the room above the feature list allows ---- */
  function therm(){ const b=$('#thScroll'); if(!b) return; if(!isI()){ if(b.style.getPropertyValue('--ipThk')) b.style.removeProperty('--ipThk'); return; }
    const H=window.SH||1400, v=Math.max(.6,Math.min(1.18,(H-TOP()-FOOT()-500)/700)).toFixed(3); if(b.style.getPropertyValue('--ipThk')!==v) b.style.setProperty('--ipThk',v); }

  /* ---- Smart Hub live 3D view (#emuF): Modes keeps the landscape geometry (the Hub between the two rails); Hardware / Specs
     draw the Hub large at the top with the text in a grid under it. Its messages carry a 'pre' geometry; we swap hw / sp. ---- */
  const hubPre=()=>{ const T=TOP(); return { hw:{cx:552,cy:T+250,w:640}, sp:{cx:552,cy:T+240,w:600} }; };
  function hub(){ const f=$('#emuF'), w=f&&f.contentWindow; if(!w) return; let fresh=false;
    try{ if(!w.__ipA){ const o=w.postMessage.bind(w); w.postMessage=function(m,t){ if(isI()&&m&&m.pre) m=Object.assign({},m,{pre:Object.assign({},m.pre,hubPre())}); return o(m,t); }; w.__ipA=1; fresh=true; } }catch(e){ return; }
    const k=(isI()?'ip':'ls')+(window.SH||0); if(fresh||hub.k!==k){ hub.k=k; } }
  { const f=$('#emuF'); if(f) f.addEventListener('load',()=>setTimeout(hub,50)); }

  function run(){ strips(); focal(); specs(); art(); therm(); hub(); }
  window.__ipA=run;
  let t=0, busy=false; later=()=>{ if(busy) return; cancelAnimationFrame(t); t=requestAnimationFrame(()=>{ busy=true; try{ run(); }catch(e){ window.__ipAerr=String(e&&e.stack||e); } finally{ setTimeout(()=>busy=false,0); } }); };
  BOX.forEach(q=>{ const b=$(q); if(b) new MutationObserver(later).observe(b,{childList:true,subtree:true}); });
  new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',later); addEventListener('orientationchange',()=>setTimeout(later,300)); later();
  }catch(e){ window.__ipAerr=String(e&&e.stack||e); }
})();

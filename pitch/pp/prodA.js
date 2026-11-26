/* iPhone portrait (html.pp) behaviour: prodA group. Only act when document.documentElement.classList.contains("pp"). */
(function(){ try{
  const BOX=['#prScroll','#hbScroll','#thScroll'], isPP=()=>document.documentElement.classList.contains('pp'), $=q=>document.querySelector(q);

  /* ---- Hardware|Specs strips: in pp each pane is 600 wide, so the swipe step must follow the pane width (.wide makes
     stripSet/bindStrips measure the first pane instead of assuming 1376). Marked strips get data-ppw so we only undo ours. ---- */
  function strips(){ const pp=isPP();
    BOX.forEach(q=>{ const b=$(q); if(!b) return;
      b.querySelectorAll('.strip').forEach(st=>{
        if(pp&&!st.classList.contains('wide')){ st.classList.add('wide'); st.dataset.ppw=1; }
        else if(!pp&&st.dataset.ppw){ st.classList.remove('wide'); delete st.dataset.ppw; }
        const sec=st.closest('[data-t]'); if(!sec||sec.__drag||typeof stripSet!=='function') return;
        const stp=st.classList.contains('wide')?(st.firstElementChild&&st.firstElementChild.offsetWidth||1376):1376, old=+(st.dataset.ppStep||stp);
        if(old!==stp){ const m=new DOMMatrix(getComputedStyle(st).transform), p=Math.max(0,Math.min(1,Math.round(-m.m41/old))); try{ stripSet(sec,p,false); }catch(e){} }
        st.dataset.ppStep=stp; }); }); }

  /* ---- picture sections (one 1376x964 artwork + video + hotspots, e.g. Smart Lock highlights / colours, Garage, App):
     the artwork is wrapped in .ppart and scaled to the upright width around its region of interest; the tiles that pick
     what it shows (.lvt / .lvl) are lifted into .ppctl below it at full size, so they stay readable and easy to tap. ---- */
  /* Layout per product:section, in artwork px (1376x964). One crop = scale it to the width around that region;
     several crops = cut the artwork into parts: 'stack' piles them up (w: relative scale), 'grid' makes a 2x2 with live labels.
     Parts after the first show a clone of the picture (and of its video, kept in sync). Default: the whole picture. */
  const LAY={
    'lock:lock':{mode:'stack',crops:[[70,200,820,590],[930,190,420,610]],w:[1,.78]},
    'lock:colors':{mode:'grid',crops:[[66,222,298,428],[362,222,296,428],[662,222,296,428],[958,222,342,428]],labels:['Bronze','Nickel','Brass','Matte Black']},
    'garage:garage':{mode:'stack',crops:[[80,130,500,320],[592,190,696,710]],w:[.85,1]},
    'garage:gphone':{crops:[[224,36,448,900]]},
    'app:hero':{mode:'stack',crops:[[40,96,690,210],[60,390,640,320],[716,0,660,964]],w:[1,1,.8]},
    'app:phone':{crops:[[90,60,700,840]]}};
  const ART='img.full,video.ovid,.hl,.tip,.xf-ghost';
  const footH=()=>parseFloat(getComputedStyle($('#stage')).getPropertyValue('--ppFoot'))||86;
  function artSecs(){ const b=$('#prScroll'); return b?[...b.children].filter(s=>s.classList.contains('psec')&&(s.querySelector(':scope>img.full')||s.querySelector(':scope>.ppart>img.full'))):[]; }
  /* a clone of the picture (and its video) for an extra crop */
  function ghost(sec,w,i){ let g=sec.querySelector(':scope>.ppart.ppx[data-i="'+i+'"]');
    if(!g){ g=document.createElement('div'); g.className='ppart ppx'; g.dataset.i=i; g.setAttribute('aria-hidden','true'); g.innerHTML='<img class="full" alt=""><video class="ovid" muted playsinline loop></video>'; w.after(g); }
    const im=w.querySelector('img.full'), gi=g.querySelector('img'); if(im&&gi.getAttribute('src')!==im.getAttribute('src')) gi.src=im.getAttribute('src'); gi.hidden=!!(im&&im.hidden);
    const v=w.querySelector('video.ovid'), gv=g.querySelector('video');
    if(v&&!v.hidden&&v.currentSrc){ if(gv.__u!==v.currentSrc){ gv.__u=v.currentSrc; gv.src=v.currentSrc; } gv.hidden=false; gv.style.cssText=v.style.cssText; gv.className=v.className;
      if(!gv.__sync){ gv.__sync=setInterval(()=>{ if(!document.contains(gv)){ clearInterval(gv.__sync); return; } const o=gv.__o; if(!o||!isPP()) return; if(o.paused!==gv.paused) o.paused?gv.pause():gv.play().catch(()=>{}); if(Math.abs(o.currentTime-gv.currentTime)>.15) try{ gv.currentTime=o.currentTime; }catch(e){} },700); }
      gv.__o=v; if(!v.paused&&gv.paused) gv.play().catch(()=>{}); }
    else { gv.hidden=true; if(!gv.paused) gv.pause(); }
    return g; }
  const place=(el,r,k,x,y)=>{ el.style.translate=`${(x-r[0]*k).toFixed(1)}px ${(y-r[1]*k).toFixed(1)}px`; el.style.scale=k.toFixed(4);
    el.style.clipPath=`inset(${r[1]}px ${1376-r[0]-r[2]}px ${964-r[1]-r[3]}px ${r[0]}px)`; };
  function art(){ const pp=isPP(), H=window.SH||1032, id=(typeof PR!=='undefined'&&PR&&PR.id)||'';
    artSecs().forEach(sec=>{
      let w=sec.querySelector(':scope>.ppart:not(.ppx)'), c=sec.querySelector(':scope>.ppctl');
      if(!pp){ if(w){ [...w.children].forEach(x=>sec.insertBefore(x,w)); w.remove(); } if(c){ const hl=sec.querySelector('.hl'); [...c.children].forEach(x=>hl&&hl.appendChild(x)); c.remove(); }
        sec.querySelectorAll(':scope>.ppart.ppx,:scope>.pplab').forEach(x=>{ const v=x.querySelector('video'); if(v) v.pause(); x.remove(); }); sec.classList.remove('ppA-tiles'); return; }
      if(!w){ w=document.createElement('div'); w.className='ppart'; sec.insertBefore(w,sec.firstChild); }
      sec.querySelectorAll(':scope>'+ART.split(',').join(',:scope>')).forEach(x=>w.appendChild(x));
      if(!c){ c=document.createElement('div'); c.className='ppctl'; sec.appendChild(c); }
      const hl=w.querySelector('.hl'), tiles=hl?[...hl.querySelectorAll(':scope>.lvt,:scope>.lvl')]:[];
      if(tiles.length){ c.innerHTML=''; tiles.forEach(x=>c.appendChild(x)); }
      const n=c.querySelectorAll('.lvt').length, list=c.querySelector('.lvl'), short=H<1150;
      const cols=n<=4?n:3, rows=list?0:n?Math.ceil(n/cols):0, th=short?96:(n<=4?118:108), ctlH=list?list.children.length*64:rows*th+(rows?(rows-1)*10:0);
      c.dataset.n=n; c.style.setProperty('--cols',cols||1); c.style.setProperty('--th',th+'px'); sec.classList.toggle('ppA-tiles',n>0);
      const L=LAY[id+':'+sec.dataset.t]||{crops:[[0,0,1376,964]]}, cr=L.crops, top0=100, bot=footH()+(n?20:96), gap=ctlH?24:0, avail=H-top0-bot-ctlH-gap;
      const used=new Set([0]); let blockH=0;
      if(L.mode==='grid'){ const lh=40, cw=284, gx=12, gy=14; let k=Math.min(...cr.map(r=>cw/r[2]),...cr.map(r=>(avail-2*lh-gy)/2/r[3]));
        const ch=Math.max(...cr.map(r=>r[3]*k)); blockH=2*(ch+lh)+gy; const y0=top0+Math.max(0,(H-top0-bot-ctlH-gap-blockH)/2);
        cr.forEach((r,i)=>{ const col=i%2, row=i>>1, x=16+col*(cw+gx)+(cw-r[2]*k)/2, y=y0+row*(ch+lh+gy); const el=i?ghost(sec,w,i):w; used.add(i); place(el,r,k,x,y);
          let lb=sec.querySelector(':scope>.pplab[data-i="'+i+'"]'); if(!lb){ lb=document.createElement('div'); lb.className='pplab'; lb.dataset.i=i; sec.appendChild(lb); }
          lb.textContent=(L.labels||[])[i]||''; Object.assign(lb.style,{left:(16+col*(cw+gx))+'px',top:(y+ch+6).toFixed(0)+'px',width:cw+'px'}); });
        c.style.top=(y0+blockH+gap).toFixed(0)+'px'; }
      else { const ws=L.w||cr.map(()=>1), sg=16;
        let k=Math.min(...cr.map((r,i)=>600/(r[2]*ws[i])), (avail-sg*(cr.length-1))/cr.reduce((a,r,i)=>a+r[3]*ws[i],0));
        blockH=cr.reduce((a,r,i)=>a+r[3]*k*ws[i],0)+sg*(cr.length-1); let y=top0+Math.max(0,(H-top0-bot-ctlH-gap-blockH)/2);
        cr.forEach((r,i)=>{ const kk=k*ws[i], el=i?ghost(sec,w,i):w; used.add(i); place(el,r,kk,300-r[2]*kk/2,y); y+=r[3]*kk+sg; });
        c.style.top=(y-sg+gap).toFixed(0)+'px'; }
      sec.querySelectorAll(':scope>.ppart.ppx,:scope>.pplab').forEach(x=>{ if(!used.has(+x.dataset.i)||(x.classList.contains('pplab')&&L.mode!=='grid')) x.remove(); });
      c.style.height=ctlH+'px';
    }); }

  /* thermostat Features picture: as large as the upright screen leaves room for (headline + feature grid under it) */
  function therm(){ const b=$('#thScroll'); if(!b) return; if(!isPP()){ b.style.removeProperty('--thk'); return; }
    const H=window.SH||1032; b.style.setProperty('--thk',Math.max(.5,Math.min(.82,(H-800)/700)).toFixed(3)); }

  /* Smart Hub live 3D view (#emuF): in pp, tell it to draw the Hub centred and full width (Modes), and at the top
     (Hardware / Specs) with the text in a grid below. Its messages carry a 'pre' geometry; we swap it for ours. */
  const hubPre=()=>{ const H=window.SH||1032; return { modes:{a0:-40,a1:640,top:110,bot:H-30}, hw:{cx:300,cy:Math.round(H/2-250),w:470}, sp:{cx:300,cy:Math.round(H/2-330),w:420} }; };
  function hub(){ const f=$('#emuF'), w=f&&f.contentWindow; if(!w) return; let fresh=false;
    try{ if(!w.__ppA){ const o=w.postMessage.bind(w); w.postMessage=function(m,t){ if(isPP()&&m&&m.pre) m=Object.assign({},m,{pre:hubPre()}); return o(m,t); }; w.__ppA=1; fresh=true; } }catch(e){ return; }
    const k=(isPP()?'pp':'ls')+(window.SH||0); if(fresh||hub.k!==k){ hub.k=k; if(isPP()) try{ w.postMessage({fpEmu:'frame',pre:hubPre()},'*'); }catch(e){} } }
  { const f=$('#emuF'); if(f) f.addEventListener('load',()=>setTimeout(hub,50)); }

  /* Vivint App live phone: below its copy, as large as the room above the footer allows */
  function appEmu(){ const sec=document.querySelector('#prScroll .appemu'); if(!sec) return; if(!isPP()){ sec.style.removeProperty('--aek'); sec.style.removeProperty('--aey'); return; }
    const cp=sec.querySelector('.ae-copy'), H=window.SH||1032, y=(cp?cp.offsetTop+cp.offsetHeight:300)+28, k=Math.max(.4,Math.min(1,(H-y-footH()-28)/884));
    sec.style.setProperty('--aey',Math.round(y)+'px'); sec.style.setProperty('--aek',k.toFixed(3)); }

  /* hide the page title (#gTitle) while the section on screen already names the product in its own heading */
  function title(){ const html=document.documentElement; let on=false;
    if(isPP()){ const pg=document.querySelector('.page.on'), box=pg&&pg.querySelector('#prScroll,#hbScroll,#thScroll'), g=$('#gTitle');
      if(box&&g){ const name=(g.textContent||'').replace(/^\s*vivint\s+/i,'').trim().toLowerCase(), br=box.getBoundingClientRect(), mid=br.top+br.height*.4;
        const sec=[...box.children].find(x=>{ const r=x.getBoundingClientRect(); return r.height&&r.top<=mid&&r.bottom>mid; });
        if(sec&&name){ const hd=sec.querySelector('.eb,.xeb,.lh-txt .eb,.ae-copy .eb,h1,h2'); on=!!(hd&&hd.textContent.toLowerCase().includes(name)); } } }
    html.classList.toggle('ppA-ngt',on); }
  BOX.forEach(q=>{ const b=$(q); if(b) b.addEventListener('scroll',()=>{ cancelAnimationFrame(title.r); title.r=requestAnimationFrame(title); },{passive:true}); });


  /* ---- focal points: landscape photos cropped to the tall screen keep the product in the horizontal centre.
     fx = where the product sits across the source image (0..1); the object-position is worked out from the box and image shapes. ---- */
  const setI=(el,p,v)=>{ if(el.style.getPropertyValue(p)!==v||el.style.getPropertyPriority(p)!=='important') el.style.setProperty(p,v,'important'); };
  const FOC={'ph/motion':.57,'ph/glass':.26,'ph/water':.60,'ph/smoke':.70,'ph/pendant':.30,'ph/fob':.38,'ph/keypad':.33,'ph/lock3':.70,
    'ph/plug3':.33,'ph/chime3':.40,'ph/garage2':.30,'ph/firefighter':.55,'ph/therm2':.62,'ph/dws_surf':.62,'ph/dws_rec':.25,'p/ic_hero':.52,
    'gal/lock_0':.40,'gal/lock_1':.27,'gal/lock_2':.27,'gal/lock_3':.53,'gal/lock_4':.40,'gal/lock_5':.55,'gal/lock_6':.52,'gal/lock_7':.52,'gal/lock_8':.28,
    'gal/therm_0':.50,'gal/therm_1':.80,'gal/therm_2':.42,'gal/therm_3':.57,'gal/garage_0':.72,'gal/garage_1':.52,'gal/garage_2':.22,'gal/garage_3':.33,
    'gal/hub_0':.63,'gal/hub_1':.64,'gal/hub_2':.42,'gal/hub_3':.80,'gal/hub_4':.70,'gal/hub_5':.66,'gal/hub_6':.68,'gal/hub_7':.70,'gal/hub_8':.68,
    'gal/icp_0':.63,'gal/icp_1':.65,'gal/icp_2':.68,'gal/icp_3':.32,'gal/icp_4':.40,'gal/icp_5':.37,'gal/icp_6':.62};
  const ZH={'ph/plug3':.72,'ph/firefighter':.74,'ph/water':.8,'ph/lock3':.66,'ph/chime3':.72,'ph/dws_surf':.76,'ph/dws_rec':.76,'gal/hub_0':.64,'gal/hub_5':.74};
  const focKey=el=>{ const u=el.getAttribute('src')||''; const m=u.match(/assets\/((?:ph|gal|p)\/[\w]+)\./); return m&&m[1]; };
  function focal(){ const pp=isPP();
    BOX.forEach(q=>{ const b=$(q); if(!b) return;
      b.querySelectorAll('img,video').forEach(el=>{ const k=focKey(el), fx=k&&FOC[k];
        if((!pp||fx==null)&&el.dataset.ppz){ ['height','-webkit-mask-image','mask-image'].forEach(p=>el.style.removeProperty(p)); delete el.dataset.ppz; }
        if(!pp||fx==null){ if(el.dataset.ppf){ el.style.removeProperty('object-position'); if(el.dataset.ppf!=='-') el.style.objectPosition=el.dataset.ppf; delete el.dataset.ppf; } return; }
        const nw=el.naturalWidth||el.videoWidth, nh=el.naturalHeight||el.videoHeight, bw=el.offsetWidth, bh=el.offsetHeight;
        if(!nw||!bw||!bh){ if(!el.__ppfl){ el.__ppfl=1; el.addEventListener(el.tagName==='VIDEO'?'loadedmetadata':'load',later,{once:true}); } return; }
        /* products wider than the cropped slice (or tall ones the copy would cover): a shorter photo that fades into the black under the copy */
        const zh=ZH[k]; if(zh){ setI(el,'height',(zh*100)+'%'); const mk='linear-gradient(180deg,#000 72%,transparent 100%)'; setI(el,'-webkit-mask-image',mk); setI(el,'mask-image',mk); el.dataset.ppz=1; }
        else if(el.dataset.ppz){ ['height','-webkit-mask-image','mask-image'].forEach(p=>el.style.removeProperty(p)); delete el.dataset.ppz; }
        const vis=(el.offsetWidth/el.offsetHeight)/(nw/nh); if(vis>=1) return;   /* the box is wider than the photo: nothing is cropped sideways */
        const x=Math.max(0,Math.min(1,(fx-vis/2)/(1-vis))), v=(x*100).toFixed(1)+'% 50%';
        if(!el.dataset.ppf) el.dataset.ppf=el.style.objectPosition||'-';
        if(el.style.getPropertyValue('object-position')!==v||el.style.getPropertyPriority('object-position')!=='important') el.style.setProperty('object-position',v,'important'); }); }); }

  /* ---- Hardware | Specs panes: the copy sits at the bottom (above the pill) and the product render fills the room above it,
     oversized and cut by the screen edge: Hardware bleeds off the right, Specs off the left. ---- */
  function bleed(){ const pp=isPP();
    BOX.forEach(q=>{ const b=$(q); if(!b) return;
      b.querySelectorAll('.strip.fsx>.fsp-pane').forEach((pn,pi)=>{ const ims=[...pn.querySelectorAll(':scope>img.fsp-im')]; if(!ims.length) return;
        if(!pp){ ims.forEach(im=>{ if(!im.dataset.ppo) return; const o=JSON.parse(im.dataset.ppo); ['left','top','width','height'].forEach(p=>{ im.style.removeProperty(p); im.style[p]=o[p]; });
            if(o.src&&im.getAttribute('src')!==o.src) im.src=o.src; delete im.dataset.ppo; }); pn.classList.remove('ppA-bl','ppA-br'); return; }
        ims.forEach(im=>{ if(!im.dataset.ppo) im.dataset.ppo=JSON.stringify({left:im.style.left,top:im.style.top,width:im.style.width,height:im.style.height,src:im.getAttribute('src')});
          /* the Firefighter side view is a photo on a grey wall: use the clean render instead */
          if(/fs\/fire_s\./.test(im.getAttribute('src'))) im.src=im.getAttribute('src').replace('fire_s.','fire_f.'); });
        const O=ims.map(im=>JSON.parse(im.dataset.ppo)), R=O.map(o=>[parseFloat(o.left),parseFloat(o.top),parseFloat(o.width),parseFloat(o.height)]);
        if(R.some(r=>r.some(isNaN))) return;
        const gx=Math.min(...R.map(r=>r[0])), gy=Math.min(...R.map(r=>r[1])), gw=Math.max(...R.map(r=>r[0]+r[2]))-gx, gh=Math.max(...R.map(r=>r[1]+r[3]))-gy;
        const H=pn.offsetHeight, txt=[...pn.children].filter(c=>!c.matches('img,svg')&&c.offsetHeight), tTop=txt.length?Math.min(...txt.map(c=>c.offsetTop)):H-200;
        const T=100, free=Math.max(160,tTop-30-T);
        /* a render may not be blown up past ~1.15x its own pixels */
        let cap=9; ims.forEach((im,i)=>{ if(im.naturalWidth) cap=Math.min(cap,im.naturalWidth*1.15/R[i][2]); else if(!im.__ppl){ im.__ppl=1; im.addEventListener('load',later,{once:true}); } });
        const k=Math.min(760/gw,free/gh,cap), w=gw*k, h=gh*k, right=pi%2===0;
        /* narrow renders lose less to the edge so they still read as the product */
        const off=w>320?.26:.14, L=right?600-w*(1-off):-w*off, Y=T+(free-h)/2;
        ims.forEach((im,i)=>{ const r=R[i]; setI(im,'left',(L+(r[0]-gx)*k).toFixed(1)+'px'); setI(im,'top',(Y+(r[1]-gy)*k).toFixed(1)+'px'); setI(im,'width',(r[2]*k).toFixed(1)+'px'); setI(im,'height',(r[3]*k).toFixed(1)+'px'); });
        const want=right?'ppA-br':'ppA-bl'; if(!pn.classList.contains(want)){ pn.classList.remove('ppA-bl','ppA-br'); pn.classList.add(want); } }); }); }

  /* ---- "Which one" cards: sharp, large renders that bleed off the card's right edge ---- */
  const CARDI={motion:'fs/motion.webp',glass:'fs/glass_f.webp',window:'fs/window_f.webp',smokeco:'fs/smokeco_f.webp',fire:'fs/fire_f.webp'};
  function cards(){ const pp=isPP(), b=$('#prScroll'); if(!b) return;
    b.querySelectorAll('.sns-c>img,.smk-c>img').forEach(im=>{ const u=im.getAttribute('src')||'', m=u.match(/assets\/cat\/(\w+)\.webp/);
      if(pp&&m&&CARDI[m[1]]){ im.dataset.ppc=u; im.src='assets/'+CARDI[m[1]]+'?v=208'; }
      else if(!pp&&im.dataset.ppc){ im.src=im.dataset.ppc; delete im.dataset.ppc; } }); }

  function run(){ strips(); art(); therm(); hub(); appEmu(); focal(); bleed(); cards(); title(); }
  window.__ppA=run;
  let t=0, busy=false; const later=()=>{ if(busy) return; cancelAnimationFrame(t); t=requestAnimationFrame(()=>{ busy=true; try{ run(); }catch(e){ window.__ppAerr=String(e&&e.stack||e); } finally{ setTimeout(()=>busy=false,0); } }); };
  BOX.forEach(q=>{ const b=$(q); if(b) new MutationObserver(later).observe(b,{childList:true,subtree:true}); });
  new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',later); addEventListener('orientationchange',()=>setTimeout(later,300)); later();
  }catch(e){ window.__ppAerr=String(e&&e.stack||e); }
})();

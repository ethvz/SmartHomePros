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
    'lock:colors':{mode:'grid',crops:[[60,200,320,450],[360,200,320,450],[650,200,320,450],[960,200,340,450]],labels:['Bronze','Nickel','Brass','Matte Black']},
    'garage:garage':{mode:'stack',crops:[[80,130,520,320],[560,190,740,720]],w:[.82,1]},
    'garage:gphone':{crops:[[224,36,448,900]]},
    'app:hero':{mode:'stack',crops:[[40,90,690,640],[660,0,716,964]],w:[1,.8]},
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
  const hubPre=()=>{ const H=window.SH||1032; return { modes:{a0:0,a1:600,top:120,bot:H-40}, hw:{cx:300,cy:Math.round(H/2-250),w:470}, sp:{cx:300,cy:Math.round(H/2-330),w:420} }; };
  function hub(){ const f=$('#emuF'), w=f&&f.contentWindow; if(!w) return; let fresh=false;
    try{ if(!w.__ppA){ const o=w.postMessage.bind(w); w.postMessage=function(m,t){ if(isPP()&&m&&m.pre) m=Object.assign({},m,{pre:hubPre()}); return o(m,t); }; w.__ppA=1; fresh=true; } }catch(e){ return; }
    const k=(isPP()?'pp':'ls')+(window.SH||0); if(fresh||hub.k!==k){ hub.k=k; if(isPP()) try{ w.postMessage({fpEmu:'frame',pre:hubPre()},'*'); }catch(e){} } }
  { const f=$('#emuF'); if(f) f.addEventListener('load',()=>setTimeout(hub,50)); }

  function run(){ strips(); art(); therm(); hub(); }
  window.__ppA=run;
  let t=0, busy=false; const later=()=>{ if(busy) return; cancelAnimationFrame(t); t=requestAnimationFrame(()=>{ busy=true; try{ run(); }catch(e){ window.__ppAerr=String(e&&e.stack||e); } finally{ setTimeout(()=>busy=false,0); } }); };
  BOX.forEach(q=>{ const b=$(q); if(b) new MutationObserver(later).observe(b,{childList:true,subtree:true}); });
  new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',later); addEventListener('orientationchange',()=>setTimeout(later,300)); later();
  }catch(e){ window.__ppAerr=String(e&&e.stack||e); }
})();

/* iPhone portrait (html.pp) behaviour: prodA group. Only act when document.documentElement.classList.contains("pp"). */
(function(){
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
  /* region of interest in artwork px [x,y,w,h] by product:section (default: the whole picture) */
  const ROI={'lock:lock':[150,150,1110,520],'lock:colors':[120,170,1150,420],'garage:gphone':[224,36,448,900],'app:phone':[90,60,700,840],'garage:garage':[0,0,1376,964],'app:hero':[0,0,1376,964]};
  const ART='img.full,video.ovid,.hl,.tip,.xf-ghost';
  function artSecs(){ const b=$('#prScroll'); return b?[...b.children].filter(s=>s.classList.contains('psec')&&(s.querySelector(':scope>img.full')||s.querySelector(':scope>.ppart>img.full'))):[]; }
  function art(){ const pp=isPP(), H=window.SH||1032, id=(window.PR&&PR.id)||'';
    artSecs().forEach(sec=>{
      let w=sec.querySelector(':scope>.ppart'), c=sec.querySelector(':scope>.ppctl');
      if(!pp){ if(w){ [...w.children].forEach(x=>sec.insertBefore(x,w)); w.remove(); } if(c){ const hl=sec.querySelector('.hl'); [...c.children].forEach(x=>hl&&hl.appendChild(x)); c.remove(); } return; }
      if(!w){ w=document.createElement('div'); w.className='ppart'; sec.insertBefore(w,sec.firstChild); }
      sec.querySelectorAll(':scope>'+ART.split(',').join(',:scope>')).forEach(x=>w.appendChild(x));
      if(!c){ c=document.createElement('div'); c.className='ppctl'; sec.appendChild(c); }
      const hl=w.querySelector('.hl'), tiles=hl?[...hl.querySelectorAll(':scope>.lvt,:scope>.lvl')]:[];
      if(tiles.length){ c.innerHTML=''; tiles.forEach(x=>c.appendChild(x)); }
      if(hl) hl.querySelectorAll(':scope>.lvmask').forEach(x=>x.hidden=true);
      const n=c.querySelectorAll('.lvt').length, list=c.querySelector('.lvl');
      c.dataset.n=n; const rows=list?0:n>4?2:n?(n===4?2:1):0, ctlH=list?list.children.length*64:rows*112+(rows?(rows-1)*12:0);
      const r=ROI[id+':'+sec.dataset.t]||[0,0,1376,964], top0=104, bot=170, gap=ctlH?28:0;
      const k=Math.min(600/r[2],(H-top0-bot-ctlH-gap)/r[3]), vh=r[3]*k, tot=vh+gap+ctlH, y=top0+Math.max(0,(H-top0-bot-tot)/2);
      w.style.transform=`translate(${(300-(r[0]+r[2]/2)*k).toFixed(1)}px,${(y-r[1]*k).toFixed(1)}px) scale(${k.toFixed(4)})`;
      c.style.top=(y+vh+gap).toFixed(0)+'px'; c.style.height=ctlH+'px'; sec.style.setProperty('--ppk',k.toFixed(4));
    }); }

  function run(){ strips(); art(); }
  let t=0, busy=false; const later=()=>{ if(busy) return; cancelAnimationFrame(t); t=requestAnimationFrame(()=>{ busy=true; try{ run(); } finally{ setTimeout(()=>busy=false,0); } }); };
  BOX.forEach(q=>{ const b=$(q); if(b) new MutationObserver(later).observe(b,{childList:true,subtree:true}); });
  new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',later); addEventListener('orientationchange',()=>setTimeout(later,300)); later();
})();

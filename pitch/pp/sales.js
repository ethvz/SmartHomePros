/* iPhone portrait (html.pp) behaviour: sales group. Only act when document.documentElement.classList.contains("pp"). */
(function(){
  const root=document.documentElement, isPP=()=>root.classList.contains('pp');

  /* Social: each tap tile shows its crop of the same picture (the img's own src, so packed/offline copies keep working) */
  const soc=document.querySelector('#p-social>img');
  const setSoc=()=>{ const u=soc&&(soc.currentSrc||soc.src); if(!u) return;
    document.querySelectorAll('#p-social .hot').forEach(h=>h.style.setProperty('--soc',`url("${u}")`)); };
  if(soc){ setSoc(); soc.addEventListener('load',setSoc); }

  /* Packages: one product scale for all four cards. The landscape rows use different sizes per kit (sc = 1.15 / 1.1 / .82 / .82,
     read back from the doorbell, which every kit has, base height 82); here a doorbell is the same size in every kit. The scale E is
     as large as the narrowest row and the total height allow, and each card is then given exactly the height its rows need
     (one-row kits get less, two-row kits more), with any leftover shared out evenly. */
  const fitPk=()=>{ const pg=document.getElementById('p-packages'); if(!pg) return;
    const rows=[...pg.querySelectorAll('.pk2-r')];
    if(!isPP()){ rows.forEach(r=>{ r.style.flex=''; r.querySelectorAll('.pk-line,.pk-svc,.pk-sign2').forEach(l=>l.style.zoom=''); }); return; }
    if(!pg.classList.contains('on')) return;
    rows.forEach(r=>r.style.flex='');
    const fit=rows.map(r=>{ const d=r.querySelector('.pk-dev'), ls=[...d.querySelectorAll('.pk-line')]; ls.forEach(l=>l.style.zoom=1);
      const db=d.querySelector('.pk-i img[src*="dbcp"]'), sc=db&&db.parentElement.offsetHeight?db.parentElement.offsetHeight/82:1;
      d.querySelectorAll('.pk-svc,.pk-sign2').forEach(e=>e.style.zoom=sc.toFixed(3)); /* not sized by sc: match them to the products */
      const aw=d.clientWidth-8; if(aw<=0||!d.clientHeight) return null;
      const w=Math.max(...ls.map(l=>l.offsetWidth)), h=ls.reduce((s,l)=>s+l.offsetHeight+12,0)+8*(ls.length-1)+10; /* +12: count badges */
      return { r, d, ls, sc, ew: aw/w*sc, hs: h/sc, fixed: r.offsetHeight-d.clientHeight }; });
    if(fit.some(f=>!f)) return;
    const D=fit.reduce((a,f)=>a+f.d.clientHeight,0), E=Math.max(.35,Math.min(1.4,...fit.map(f=>f.ew),D/fit.reduce((a,f)=>a+f.hs,0)));
    const left=Math.max(0,D-fit.reduce((a,f)=>a+f.hs*E,0))/fit.length;
    fit.forEach(f=>{ const z=(E/f.sc).toFixed(3); f.ls.forEach(l=>{ if(l.style.zoom!==z) l.style.zoom=z; });
      f.r.style.flex=`0 0 ${Math.floor(f.fixed+f.hs*E+left)}px`; }); };

  /* Moves: the titles' landscape line breaks are dropped on the phone; give them a space so the words don't run together */
  document.querySelectorAll('#p-moves .mcard h3 br').forEach(b=>{ const p=b.previousSibling; if(!(p&&p.nodeType===3&&/\s$/.test(p.data))) b.before(' '); });

  const sync=()=>{ if(window.SH) root.style.setProperty('--salesH',window.SH); requestAnimationFrame(fitPk); };
  addEventListener('resize',sync); addEventListener('orientationchange',()=>setTimeout(sync,300));
  if(window.visualViewport) visualViewport.addEventListener('resize',sync);
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class']});
  const pk=document.getElementById('p-packages');
  if(pk){ let t=0; pk.addEventListener('load',()=>{ clearTimeout(t); t=setTimeout(fitPk,60); },true); } /* icons that load late change the widths */
  if(pk) new MutationObserver(()=>{ if(pk.classList.contains('on')) requestAnimationFrame(fitPk); }).observe(pk,{attributes:true,attributeFilter:['class']});
  sync(); setTimeout(sync,400);
})();

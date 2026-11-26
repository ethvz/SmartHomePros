/* iPhone portrait (html.pp) behaviour: sales group. Only act when document.documentElement.classList.contains("pp"). */
(function(){
  const root=document.documentElement, isPP=()=>root.classList.contains('pp');

  /* Social: each tap tile shows its crop of the same picture (the img's own src, so packed/offline copies keep working) */
  const soc=document.querySelector('#p-social>img');
  const setSoc=()=>{ const u=soc&&(soc.currentSrc||soc.src); if(!u) return;
    document.querySelectorAll('#p-social .hot').forEach(h=>h.style.setProperty('--soc',`url("${u}")`)); };
  if(soc){ setSoc(); soc.addEventListener('load',setSoc); }

  /* Packages: scale each card's icon lines to fill the space under its title, as large as fits */
  const fitPk=()=>{ const pg=document.getElementById('p-packages'); if(!pg) return;
    const devs=pg.querySelectorAll('.pk-dev');
    if(!isPP()){ devs.forEach(d=>d.querySelectorAll('.pk-line').forEach(l=>l.style.zoom='')); return; }
    if(!pg.classList.contains('on')) return;
    devs.forEach(d=>{ const ls=[...d.querySelectorAll('.pk-line')]; ls.forEach(l=>l.style.zoom=1);
      const aw=d.clientWidth-8, ah=d.clientHeight-8*(ls.length-1)-10; if(aw<=0||ah<=0) return;
      const w=Math.max(...ls.map(l=>l.offsetWidth)), h=ls.reduce((s,l)=>s+l.offsetHeight+12,0); /* +12: room for the count badges */
      const z=Math.max(.4,Math.min(1.3,aw/w,ah/h)); ls.forEach(l=>l.style.zoom=z.toFixed(3)); }); };

  const sync=()=>{ if(window.SH) root.style.setProperty('--salesH',window.SH); requestAnimationFrame(fitPk); };
  addEventListener('resize',sync); addEventListener('orientationchange',()=>setTimeout(sync,300));
  if(window.visualViewport) visualViewport.addEventListener('resize',sync);
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class']});
  const pk=document.getElementById('p-packages');
  if(pk){ let t=0; pk.addEventListener('load',()=>{ clearTimeout(t); t=setTimeout(fitPk,60); },true); } /* icons that load late change the widths */
  if(pk) new MutationObserver(()=>{ if(pk.classList.contains('on')) requestAnimationFrame(fitPk); }).observe(pk,{attributes:true,attributeFilter:['class']});
  sync(); setTimeout(sync,400);
})();

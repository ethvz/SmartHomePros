/* iPhone portrait (html.pp) behaviour: prodA group. Only act when document.documentElement.classList.contains("pp"). */
(function(){
  const BOX=['#prScroll','#hbScroll','#thScroll'], isPP=()=>document.documentElement.classList.contains('pp');
  /* Hardware|Specs strips: in pp each pane is 600 wide, so the swipe step must follow the pane width (.wide makes
     stripSet/bindStrips measure the first pane instead of assuming 1376). Marked strips get data-ppw so we only undo ours. */
  function strips(){ const pp=isPP();
    BOX.forEach(q=>{ const b=document.querySelector(q); if(!b) return;
      b.querySelectorAll('.strip').forEach(st=>{
        if(pp&&!st.classList.contains('wide')){ st.classList.add('wide'); st.dataset.ppw=1; }
        else if(!pp&&st.dataset.ppw){ st.classList.remove('wide'); delete st.dataset.ppw; }
        /* re-seat the strip on its current pane at the new step */
        const sec=st.closest('[data-t]'); if(sec&&window.stripSet&&!sec.__drag){ const m=new DOMMatrix(getComputedStyle(st).transform), w0=st.dataset.ppStep||1376, p=Math.round(-m.m41/w0);
          const stp=st.classList.contains('wide')?(st.firstElementChild&&st.firstElementChild.offsetWidth||1376):1376; st.dataset.ppStep=stp;
          if(Math.abs(-m.m41-stp*p)>1) try{ stripSet(sec,Math.max(0,Math.min(1,p)),false); }catch(e){} }
      }); }); }
  let t=0; const later=()=>{ cancelAnimationFrame(t); t=requestAnimationFrame(strips); };
  BOX.forEach(q=>{ const b=document.querySelector(q); if(b) new MutationObserver(later).observe(b,{childList:true,subtree:true}); });
  new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',later); addEventListener('orientationchange',()=>setTimeout(later,300)); later();
})();

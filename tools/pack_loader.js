(function(){
  const MAP = window.PK_MAP; if(!MAP) return;
  const URLS = {}, LOADING = {}, ORDER = Object.values(MAP).filter((v,i,a)=>a.indexOf(v)===i);
  const P = window.PK_PREFIX, PRE = new RegExp(P);
  const RX_ATTR = new RegExp('\\b(src|poster)=(["\'])([^"\']*?(?:' + P + ')[^"\']*)\\2', 'g');
  const RX_URL = () => new RegExp('url\\((["\']?)([^)"\']*?(?:' + P + ')[^)"\']*)\\1\\)', 'g');
  const key = u => { if(typeof u!=='string') return null; let s = u.split('#')[0].split('?')[0];
    const m = PRE.exec(s); if(!m) return null; s = s.slice(m.index); return MAP[s] ? s : null; };
  const res = u => { const k = key(u); return k ? (URLS[k] || (load(MAP[k]), null)) : undefined; };
  const desc = (P,n) => Object.getOwnPropertyDescriptor(P,n);
  const D = { img:desc(HTMLImageElement.prototype,'src'), media:desc(HTMLMediaElement.prototype,'src'), source:desc(HTMLSourceElement.prototype,'src'),
              poster:desc(HTMLVideoElement.prototype,'poster'), setAttr:Element.prototype.setAttribute, getAttr:Element.prototype.getAttribute,
              inner:desc(Element.prototype,'innerHTML'), outer:desc(Element.prototype,'outerHTML'), adj:Element.prototype.insertAdjacentHTML };
  const fixHTML = h => typeof h!=='string' || !PRE.test(h) ? h :
    h.replace(RX_ATTR, (m,a,q,u) => { const r = res(u); return r===undefined ? m : r ? `${a}=${q}${r}${q} data-pk-o-${a}=${q}${u}${q}` : `data-pk-${a}=${q}${u}${q} data-pk-o-${a}=${q}${u}${q}`; })
     .replace(RX_URL(), (m,q,u) => { const r = res(u); return r ? `url(${q}${r}${q})` : m; });
  const fixCSS = s => typeof s!=='string' || !PRE.test(s) ? s : s.replace(RX_URL(), (m,q,u) => { const r = res(u); return r ? `url(${q}${r}${q})` : m; });
  function setURL(el, attr, u, orig){ const r = res(u);
    if(r===undefined){ el.removeAttribute('data-pk-'+attr); el.removeAttribute('data-pk-o-'+attr); return orig(u); }
    D.setAttr.call(el, 'data-pk-o-'+attr, u);
    if(r){ el.removeAttribute('data-pk-'+attr); return orig(r); }
    D.setAttr.call(el, 'data-pk-'+attr, u); }
  const abs = u => { try{ return new URL(u, location.href).href; }catch(e){ return u; } };
  const og = (el, a, get) => { const o = D.getAttr.call(el, 'data-pk-o-'+a); return o ? abs(o) : get.call(el); };
  Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,get(){return og(this,'src',D.img.get);},set(u){ setURL(this,'src',u,v=>D.img.set.call(this,v)); }});
  Object.defineProperty(HTMLMediaElement.prototype,'src',{configurable:true,get(){return og(this,'src',D.media.get);},set(u){ setURL(this,'src',u,v=>D.media.set.call(this,v)); }});
  Object.defineProperty(HTMLSourceElement.prototype,'src',{configurable:true,get(){return og(this,'src',D.source.get);},set(u){ setURL(this,'src',u,v=>D.source.set.call(this,v)); }});
  Object.defineProperty(HTMLVideoElement.prototype,'poster',{configurable:true,get(){return og(this,'poster',D.poster.get);},set(u){ setURL(this,'poster',u,v=>D.poster.set.call(this,v)); }});
  Element.prototype.setAttribute = function(n,v){ const l = String(n).toLowerCase();
    if((l==='src'||l==='poster') && /^(IMG|VIDEO|AUDIO|SOURCE)$/.test(this.tagName)) return setURL(this,l,String(v),x=>D.setAttr.call(this,n,x));
    if(l==='style') v = fixCSS(String(v));
    return D.setAttr.call(this,n,v); };
  Element.prototype.getAttribute = function(n){ const l = String(n).toLowerCase();
    if(l==='src'||l==='poster'){ const o = D.getAttr.call(this,'data-pk-o-'+l); if(o) return o; } return D.getAttr.call(this,n); };
  Object.defineProperty(Element.prototype,'innerHTML',{configurable:true,get(){return D.inner.get.call(this);},set(h){ D.inner.set.call(this,fixHTML(h)); }});
  Object.defineProperty(Element.prototype,'outerHTML',{configurable:true,get(){return D.outer.get.call(this);},set(h){ D.outer.set.call(this,fixHTML(h)); }});
  Element.prototype.insertAdjacentHTML = function(p,h){ return D.adj.call(this,p,fixHTML(h)); };
  for(const p of ['background','backgroundImage','cssText','maskImage','webkitMaskImage']){ const d = desc(CSSStyleDeclaration.prototype,p); if(!d||!d.set) continue;
    Object.defineProperty(CSSStyleDeclaration.prototype,p,{configurable:true,get(){return d.get.call(this);},set(v){ d.set.call(this,fixCSS(v)); }}); }
  const sp = CSSStyleDeclaration.prototype.setProperty; CSSStyleDeclaration.prototype.setProperty = function(n,v,pr){ return sp.call(this,n,fixCSS(v),pr); };
  const f0 = window.fetch; window.fetch = function(u,o){ const k = typeof u==='string' ? key(u) : null;
    if(k) return (URLS[k] ? Promise.resolve() : load(MAP[k])).then(()=>f0.call(window,URLS[k]||u,o)); return f0.apply(window,arguments); };
  /* fill in everything that was waiting on a bundle */
  function sweep(root){ const R = root||document;
    R.querySelectorAll('[data-pk-src],[data-pk-poster]').forEach(el => { for(const a of ['src','poster']){ const u = el.getAttribute('data-pk-'+a); if(!u) continue;
      const r = res(u); if(r){ el.removeAttribute('data-pk-'+a); if(a==='src') (el.tagName==='IMG'?D.img:el.tagName==='SOURCE'?D.source:D.media).set.call(el,r); else D.poster.set.call(el,r); } } });
    R.querySelectorAll('[style]').forEach(el => { const s = el.getAttribute('style'); if(!PRE.test(s)) return; const f = fixCSS(s); if(f!==s) D.setAttr.call(el,'style',f); });
    for(const st of document.querySelectorAll('style')){ const t = st.textContent; if(PRE.test(t)){ const f = fixCSS(t); if(f!==t) st.textContent = f; } } }
  function load(p){ if(LOADING[p]) return LOADING[p];
    return LOADING[p] = f0.call(window, 'packs/'+p+'.json?v='+(window.PK_V||1)).then(r=>r.json()).then(async j => {
      await Promise.all(Object.entries(j.files).map(([k,[t,b64]]) => Promise.resolve().then(()=>{ const bin=atob(b64), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); URLS[k] = URL.createObjectURL(new Blob([u],{type:t})); })));
      sweep(); }).catch(()=>{ delete LOADING[p]; }); }
  new MutationObserver(ms => { for(const m of ms) for(const n of m.addedNodes) if(n.nodeType===1 && (n.hasAttribute('data-pk-src')||n.hasAttribute('data-pk-poster')||n.querySelector && n.querySelector('[data-pk-src],[data-pk-poster]'))) sweep(n.parentNode||document); })
    .observe(document.documentElement,{childList:true,subtree:true});
  /* everything the first screen needs comes first, the rest streams in behind it */
  const first = window.PK_FIRST || [];
  Promise.all(first.map(load)).then(() => ORDER.reduce((p,x) => p.then(()=>load(x)), Promise.resolve()));
  document.addEventListener('DOMContentLoaded', () => sweep());
})();

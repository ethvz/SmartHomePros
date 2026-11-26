/* iPad portrait (html.ipp) behaviour: sales group. Only act when document.documentElement.classList.contains("ipp"). */
(function () {
  /* Social: each tap card shows its crop of the same picture (the img's own src, so packed/offline copies keep working) */
  const soc = document.querySelector('#p-social>img');
  const setSoc = () => { const u = soc && (soc.currentSrc || soc.src); if (!u) return; const v = `url("${u}")`;
    document.querySelectorAll('#p-social .hot').forEach(h => { if (h.style.getPropertyValue('--soc') !== v) h.style.setProperty('--soc', v); }); };
  if (soc) { setSoc(); soc.addEventListener('load', setSoc); }
})();

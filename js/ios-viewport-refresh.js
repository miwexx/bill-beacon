/* Bill Beacon: test workaround for iPhone standalone viewport recalculation.
   No navigation offsets or financial data are changed. */
(() => {
  'use strict';
  if (window.BillBeaconViewportRefresh) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (!standalone || !/iPhone|iPod/.test(navigator.userAgent)) return;
  let timer = null;
  let running = false;
  function editing() {
    const node = document.activeElement;
    return !!node && (node.matches('input,textarea,select') || node.isContentEditable);
  }
  function refresh() {
    if (running || document.visibilityState !== 'visible' || editing()) return;
    if (document.documentElement.getAttribute('data-bb-startup') !== 'ready') return;
    const app = document.getElementById('app');
    if (!app || !app.getClientRects().length) return;
    running = true;
    const display = app.style.getPropertyValue('display');
    const priority = app.style.getPropertyPriority('display');
    const x = window.scrollX, y = window.scrollY;
    const scrollers = [...app.querySelectorAll('.main-content')].map(node => ({node,top:node.scrollTop,left:node.scrollLeft}));
    const before = window.innerHeight;
    try {
      app.style.setProperty('display', 'none', 'important');
      void app.offsetHeight;
    } finally {
      if (display) app.style.setProperty('display', display, priority);
      else app.style.removeProperty('display');
      void app.offsetHeight;
      for (const saved of scrollers) {
        saved.node.scrollTop = saved.top;
        saved.node.scrollLeft = saved.left;
      }
      if (window.scrollX !== x || window.scrollY !== y) window.scrollTo(x, y);
      running = false;
    }
    window.BillBeaconViewportRefresh.last = {before,after:window.innerHeight};
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => requestAnimationFrame(refresh), 250);
  }
  window.BillBeaconViewportRefresh = {refresh:schedule,last:null};
  window.addEventListener('billbeacon:household-ready', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', () => {if(document.visibilityState === 'visible') schedule();});
  document.addEventListener('focusout', schedule);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
})();
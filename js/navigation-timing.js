/* Bill Beacon temporary navigation timing. Remove after diagnosis.
   No storage writes, network requests, account IDs, bill names or amounts. */
(() => {
 'use strict';
 if(window.BillBeaconSpeedReport)return;
 const reports=[];let pending=null,sequence=0;
 const now=()=>performance.now();
 const route=()=>typeof currentRoute==='string'?currentRoute:'unknown';
 const round=n=>Math.round(n*10)/10;
 const reads={};let current=null;
 function instrument(object,key){
  const before=object?.[key];if(typeof before!=='function')return;
  object[key]=function(){
   if(!current)return before.apply(this,arguments);
   const entry=current;const start=now();
   try{return before.apply(this,arguments);}
   finally {const item=entry.readers[key]||(entry.readers[key]={calls:0,inclusiveMs:0});item.calls++;item.inclusiveMs+=now()-start;}
  };
 }
 if(typeof Store!=='undefined')for(const key of ['getBills','getBill','getPayments','getPaymentsForBill','getIncomeSources','getSettings'])instrument(Store,key);
 if(typeof render==='function'){
  const before=render;
  render=function(){
   const entry={screen:route(),durationMs:0,readers:{}};const previous=current;current=entry;const start=now();
   try{return before.apply(this,arguments);}
   finally{
    entry.durationMs=round(now()-start);for(const value of Object.values(entry.readers))value.inclusiveMs=round(value.inclusiveMs);
    current=previous;
    if(pending)pending.renders.push(entry);
   }
  };
  window.render=render;
 }
 function finish(token){
  if(!pending||pending.token!==token)return;
  const item=pending;pending=null;
  const entry={from:item.from,to:route(),clickToSecondFrameMs:round(now()-item.start),renders:item.renders};
  reports.push(entry);if(reports.length>12)reports.shift();
  button.textContent='Speed report ('+reports.length+')';
  console.info('Bill Beacon timing (instrumented; not a paint-completion guarantee):',entry);
 }
 function click(event){
  const target=event.target instanceof Element?event.target.closest('button,a,[role="tab"]'):null;
  const action=target?.getAttribute('onclick')||'';
  if(!/\bnavigate\s*\(/.test(action))return;
  if(pending)finish(pending.token);
  const token=++sequence;
  pending={token,from:route(),start:now(),renders:[]};
  requestAnimationFrame(()=>requestAnimationFrame(()=>finish(token)));
 }
 document.addEventListener('click',click,true);
 const button=document.createElement('button');button.type='button';button.textContent='Speed report (0)';
 button.setAttribute('aria-label','Download a temporary navigation timing report');
 button.style.cssText='position:fixed;right:12px;bottom:calc(100px + env(safe-area-inset-bottom));z-index:2147483000;min-height:40px;padding:8px 12px;border:1px solid #79b9ff;border-radius:12px;background:#142033;color:#fff;font:600 12px system-ui;box-shadow:0 3px 12px #0005;';
 function download(){
  if(pending)finish(pending.token);
  if(!reports.length){alert('Switch between the bottom tabs a few times, wait for each screen, then tap Speed report.');return;}
  const payload={kind:'bill-beacon-navigation-timing-v1',notes:['Temporary instrumented measurements; instrumentation adds overhead.','Reader times are inclusive and overlap; do not sum them.','Second animation frame is a responsiveness proxy, not proof of completed paint.','This captures inline navigate() buttons/links, including the existing tab bar.','No bill contents or account identifiers collected.'],reports};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='bill-beacon-speed-report.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 button.addEventListener('click',download);document.body.appendChild(button);
 window.BillBeaconSpeedReport=Object.freeze({version:1,download,getReport:()=>JSON.parse(JSON.stringify(reports))});
})();

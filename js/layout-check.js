/* Temporary, read-only layout diagnostics. Remove after troubleshooting. */
(() => {
  'use strict';
  if(window.BillBeaconLayoutCheck)return;
  const snapshots=[];
  let lastSignature='',timer=null;
  const round=n=>Math.round(n*10)/10;
  function measure(){
    const nav=document.querySelector('#app .tab-bar');
    if(!nav||!nav.getClientRects().length)return null;
    const rect=nav.getBoundingClientRect(),css=getComputedStyle(nav),vv=window.visualViewport;
    const ancestors=[];
    for(let node=nav.parentElement;node;node=node.parentElement){
      const s=getComputedStyle(node);
      if(s.transform!=='none'||s.filter!=='none'||s.perspective!=='none'||s.contain!=='none'||s.willChange!=='auto'){
        ancestors.push({element:node.id?'#'+node.id:node.tagName,transform:s.transform,filter:s.filter,perspective:s.perspective,contain:s.contain,willChange:s.willChange});
      }
    }
    return {
      tab:nav.querySelector('.tab-item.active')?.textContent.trim().replace(/\s+/g,' ')||'unknown',
      tutorial:!!document.getElementById('billBeaconTutorial'),
      viewport:{innerHeight:window.innerHeight,clientHeight:document.documentElement.clientHeight,visualHeight:vv?round(vv.height):null,visualTop:vv?round(vv.offsetTop):null,scale:vv?round(vv.scale):null,scrollY:round(window.scrollY)},
      nav:{top:round(rect.top),bottom:round(rect.bottom),height:round(rect.height),gapToInnerBottom:round(window.innerHeight-rect.bottom),position:css.position,bottomCSS:css.bottom,marginBottom:css.marginBottom,paddingBottom:css.paddingBottom,transform:css.transform},
      htmlOverflow:getComputedStyle(document.documentElement).overflow,
      bodyOverflow:getComputedStyle(document.body).overflow,
      appInert:!!document.getElementById('app')?.inert,
      styleCount:document.querySelectorAll('style,link[rel="stylesheet"]').length,
      ancestors
    };
  }
  function capture(){
    const value=measure();if(!value)return;
    const signature=JSON.stringify(value);
    if(signature===lastSignature)return;
    lastSignature=signature;
    snapshots.push({time:new Date().toLocaleTimeString(),...value});
    if(snapshots.length>18)snapshots.shift();
  }
  function show(){
    capture();
    const existing=document.getElementById('bb-layout-report');if(existing)return;
    const dialog=document.createElement('dialog');dialog.id='bb-layout-report';
    dialog.style.cssText='width:calc(100% - 24px);max-width:600px;max-height:82dvh;margin:auto;padding:16px;background:#15151d;color:#fff;border:1px solid #777;border-radius:14px;overflow:auto;';
    const heading=document.createElement('h2');heading.textContent='Navigation layout report';heading.style.margin='0 0 12px';
    const hint=document.createElement('p');hint.textContent='Read-only measurements. Copy this report before closing/restarting the app.';
    const text=document.createElement('textarea');text.readOnly=true;text.value=JSON.stringify(snapshots,null,2);text.style.cssText='display:block;width:100%;height:48dvh;font:12px monospace;background:#08080b;color:#fff;box-sizing:border-box;';
    const copy=document.createElement('button');copy.textContent='Copy report';copy.style.cssText='padding:12px;margin:8px;';
    copy.onclick=async()=>{try{await navigator.clipboard.writeText(text.value);copy.textContent='Copied';}catch{text.focus();text.select();copy.textContent='Select text and copy';}};
    const close=document.createElement('button');close.textContent='Close';close.style.cssText='padding:12px;margin:8px;';close.onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.append(heading,hint,text,copy,close);document.body.append(dialog);dialog.showModal();
  }
  function start(){
    const button=document.createElement('button');button.id='bb-layout-check-button';button.type='button';button.textContent='Layout report';
    button.style.cssText='position:fixed;right:10px;top:calc(8px + env(safe-area-inset-top,0px));z-index:40000;padding:8px 12px;border:1px solid #b45cff;border-radius:10px;background:#15151d;color:#fff;font:12px system-ui;';
    button.addEventListener('click',show);document.body.append(button);capture();timer=setInterval(capture,700);
  }
  window.BillBeaconLayoutCheck={capture,report:()=>JSON.stringify(snapshots,null,2),stop(){clearInterval(timer);document.getElementById('bb-layout-check-button')?.remove();document.getElementById('bb-layout-report')?.remove();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
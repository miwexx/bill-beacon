/* Bill Beacon More popup swipe + opaque background, v1.
Load ONCE, AFTER more-tools-preview.js:
<script src="js/more-popup-swipe.js?v=1"></script>
Targets only the More native dialog (#bbml-dialog; also supports preview v1).
No data reads/writes, network requests, global router changes, or app swipe patches.
Swipe right from the left 36px of a popup, or across its header/body text.
Controls are protected (except a gesture starting at the popup's left edge).
Vertical scrolling, ordinary taps and text inputs keep their normal behavior.
Backdrop is fully opaque. The More page is revealed only when the popup closes.
Validation: syntax check and 20 controlled Chromium checks passed, including
native touch input and vertical scrolling. Not tested on a physical iPhone.
Removal: remove this script tag and reload, or BillBeaconMorePopupSwipe.uninstall().
*/
(() => {
 'use strict';
 if (window.BillBeaconMorePopupSwipe) return;
 const STYLE='bb-more-popup-swipe-style';
 const SELECTOR='dialog#bbml-dialog,dialog#bbmp-dialog';
 const contexts=new Map();
 let observer=null, active=true;
 const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const CSS=String.raw`
 dialog#bbml-dialog::backdrop,
 dialog#bbmp-dialog::backdrop {
   background:var(--bg,#15151e)!important;
   opacity:1!important;
   backdrop-filter:none!important;
   -webkit-backdrop-filter:none!important;
 }
 dialog#bbml-dialog.bb-more-swipe-ready,
 dialog#bbmp-dialog.bb-more-swipe-ready {
   will-change:auto;
 }
 dialog#bbml-dialog.bb-more-swiping,
 dialog#bbmp-dialog.bb-more-swiping {
   will-change:transform;
   user-select:none!important;
   -webkit-user-select:none!important;
 }
 `;
 function visible(dialog){
   return dialog.isConnected && dialog.open && !dialog.closest('[data-bb-drag-preview],[data-bb-copy-id]');
 }
 function attach(dialog){
   if(contexts.has(dialog)||!active)return;
   const ac=new AbortController();
   const savedTransform=dialog.style.getPropertyValue('transform');
   const savedTransformPriority=dialog.style.getPropertyPriority('transform');
   const savedTransition=dialog.style.getPropertyValue('transition');
   const savedTransitionPriority=dialog.style.getPropertyPriority('transition');
   let gesture=null, settling=false, suppressClick=false, timer=null;
   dialog.classList.add('bb-more-swipe-ready');
   const listen=(name,fn,options={})=>dialog.addEventListener(name,fn,{...options,signal:ac.signal});
   function restoreStyle(){
     if(savedTransform)dialog.style.setProperty('transform',savedTransform,savedTransformPriority);else dialog.style.removeProperty('transform');
     if(savedTransition)dialog.style.setProperty('transition',savedTransition,savedTransitionPriority);else dialog.style.removeProperty('transition');
     dialog.classList.remove('bb-more-swiping');
   }
   function reset(){clearTimeout(timer);timer=null;gesture=null;settling=false;restoreStyle();}
   function finish(complete){
     if(settling)return;
     settling=true;
     const dx=gesture?.dx||0;
     gesture=null;
     if(dx>0)suppressClick=true;
     const duration=reduced()?0:complete?180:150;
     const end=()=>{
       timer=null;
       if(complete&&visible(dialog)){
         // Use the owning add-on's close method so its state and focus cleanup run.
         const api=dialog.id==='bbml-dialog'?window.BillBeaconMoreLive:window.BillBeaconMorePreview;
         if(typeof api?.close==='function')api.close();
         else {dialog.close();dialog.remove();}
       }
       restoreStyle();settling=false;
       setTimeout(()=>{suppressClick=false;},0);
     };
     if(!duration){end();return;}
     dialog.style.setProperty('transition',`transform ${duration}ms ease-out`,'important');
     dialog.style.setProperty('transform',`translate3d(${complete?window.innerWidth:0}px,0,0)`,'important');
     timer=setTimeout(end,duration+25);
   }
   function touchById(event,id){return [...event.touches,...event.changedTouches].find(t=>t.identifier===id);}
   function start(event){
     if(!active||settling||!visible(dialog)||event.touches.length!==1)return;
     const touch=event.touches[0],target=event.target;
     if(!(target instanceof Element))return;
     if(target.closest('input,textarea,select,option,[contenteditable],a,[data-bb-drag-preview]'))return;
     const rect=dialog.getBoundingClientRect();
     const edge=touch.clientX>=rect.left&&touch.clientX<=rect.left+36;
     const header=!!target.closest('.bbml-dialog-header,.bbmp-dialog-header');
     if(target.closest('button,[role="button"],label')&&!edge)return;
     const selection=window.getSelection?.();
     if(selection&&!selection.isCollapsed&&String(selection).trim())return;
     gesture={id:touch.identifier,x:touch.clientX,y:touch.clientY,dx:0,dragging:false,edge,header,samples:[{x:touch.clientX,t:performance.now()}]};
   }
   function move(event){
     if(!gesture)return;
     if(event.touches.length!==1){if(gesture.dragging)finish(false);else gesture=null;return;}
     const touch=touchById(event,gesture.id);if(!touch)return;
     const dx=touch.clientX-gesture.x,dy=touch.clientY-gesture.y;
     if(!gesture.dragging){
       if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;
       if(Math.abs(dy)>=Math.abs(dx)||dx<=0){gesture=null;return;}
       if(dx<Math.abs(dy)*1.35)return;
       gesture.dragging=true;
       dialog.classList.add('bb-more-swiping');
       dialog.style.setProperty('transition','none','important');
     }
     if(!event.cancelable){finish(false);return;}
     event.preventDefault();
     // Only stop other gesture systems once horizontal intent is established.
     event.stopPropagation();
     gesture.dx=Math.max(0,dx);
     const now=performance.now();
     gesture.samples.push({x:touch.clientX,t:now});
     gesture.samples=gesture.samples.filter(s=>now-s.t<=120).slice(-10);
     dialog.style.setProperty('transform',`translate3d(${gesture.dx}px,0,0)`,'important');
   }
   function end(event){
     if(!gesture)return;
     if(!gesture.dragging){gesture=null;return;}
     const touch=touchById(event,gesture.id);
     const now=performance.now(),samples=gesture.samples.filter(s=>now-s.t<=100),first=samples[0];
     const velocity=touch&&first?(touch.clientX-first.x)/Math.max(1,now-first.t):0;
     const dx=touch?Math.max(0,touch.clientX-gesture.x):gesture.dx;
     gesture.dx=dx;
     const threshold=Math.min(140,dialog.getBoundingClientRect().width*.30);
     const deliberate=dx>=threshold||(dx>=50&&velocity>.55);
     const reversing=velocity<-.15;
     if(event.cancelable)event.preventDefault();
     event.stopPropagation();
     finish(!!touch&&deliberate&&!reversing);
   }
   function cancel(){if(gesture?.dragging)finish(false);else gesture=null;}
   function click(event){if(!suppressClick)return;event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}
   listen('touchstart',start,{passive:true,capture:true});
   listen('touchmove',move,{passive:false,capture:true});
   listen('touchend',end,{passive:false,capture:true});
   listen('touchcancel',cancel,{passive:true,capture:true});
   listen('click',click,{capture:true});
   listen('close',()=>{reset();detach(dialog);},{once:true});
   const cleanup=()=>{reset();ac.abort();dialog.classList.remove('bb-more-swipe-ready');};
   contexts.set(dialog,{cleanup,reset});
 }
 function detach(dialog){const ctx=contexts.get(dialog);if(!ctx)return;ctx.cleanup();contexts.delete(dialog);}
 function scan(){
   for(const dialog of document.querySelectorAll(SELECTOR))attach(dialog);
   for(const dialog of contexts.keys())if(!dialog.isConnected)detach(dialog);
 }
 function interrupted(){for(const ctx of contexts.values())ctx.reset();}
 function init(){
   if(!active)return;
   if(!document.getElementById(STYLE)){const style=document.createElement('style');style.id=STYLE;style.textContent=CSS;document.head.append(style);}
   scan();observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});
 }
 function uninstall(){
   if(!active)return;active=false;observer?.disconnect();
   for(const dialog of [...contexts.keys()])detach(dialog);
   document.getElementById(STYLE)?.remove();
   document.removeEventListener('DOMContentLoaded',init);
   document.removeEventListener('visibilitychange',interrupted);
   window.removeEventListener('resize',interrupted);
   delete window.BillBeaconMorePopupSwipe;
 }
 document.addEventListener('visibilitychange',interrupted);
 window.addEventListener('resize',interrupted);
 window.BillBeaconMorePopupSwipe=Object.freeze({version:'1.0.0',uninstall});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

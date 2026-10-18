/* Bill Beacon More popup swipe v3 — 
*/
(() => {
 'use strict';
 if(window.BillBeaconMorePopupSwipe?.version==='3.0.0')return;
 window.BillBeaconMorePopupSwipe?.uninstall?.();
 const STYLE='bb-more-popup-swipe-style',SELECTOR='dialog#bbml-dialog,dialog#bbmp-dialog';
 const contexts=new Map();let observer=null,active=true;
 const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const TEXT_PROPERTIES=['font-family','font-size','font-weight','font-style','font-stretch','font-variant','font-size-adjust','font-synthesis','line-height','letter-spacing','word-spacing','text-transform','text-align','text-indent','text-decoration','text-rendering','white-space','word-break','overflow-wrap','writing-mode','direction','margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left'];
 const CSS=String.raw`
 dialog#bbml-dialog::backdrop,dialog#bbmp-dialog::backdrop{background:var(--bg,#15151e)!important;opacity:1!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
 .bb-more-swipe-stage-front{display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;position:absolute;z-index:2;will-change:transform;user-select:none;-webkit-user-select:none;text-size-adjust:100%;-webkit-text-size-adjust:100%}
 .bb-more-swipe-stage-back{position:absolute;inset:0;overflow:hidden;z-index:0;pointer-events:none;background:var(--bg,#15151e);text-size-adjust:100%;-webkit-text-size-adjust:100%}
 .bb-more-swipe-stage-dim{position:absolute;inset:0;z-index:1;background:rgba(0,0,0,.28);pointer-events:none}
 `;
 function visible(d){return d.isConnected&&d.open&&!d.closest('[data-bb-drag-preview],[data-bb-copy-id]');}
 function freezeText(source,copy){
  const computed=getComputedStyle(source);
  for(const property of TEXT_PROPERTIES){const value=computed.getPropertyValue(property);if(value)copy.style.setProperty(property,value,'important');}
  copy.style.setProperty('text-size-adjust','100%','important');
  copy.style.setProperty('-webkit-text-size-adjust','100%','important');
  return computed;
 }
 function snapshot(){
  const app=document.getElementById('app');if(!app)return null;
  const rect=app.getBoundingClientRect();if(!rect.width||!rect.height)return null;
  const copy=app.cloneNode(true),originals=[app,...app.querySelectorAll('*')],copies=[copy,...copy.querySelectorAll('*')],scrolls=[];
  for(let i=0;i<copies.length;i++){
   const n=copies[i],o=originals[i];
   // Read styles while the ORIGINAL remains in its normal app context.
   const computed=freezeText(o,n);
   if(n.id){n.setAttribute('data-bb-copy-id',n.id);n.removeAttribute('id');}
   for(const attr of [...n.attributes])if(/^on/i.test(attr.name)||attr.name==='autofocus')n.removeAttribute(attr.name);
   n.style.setProperty('animation','none','important');n.style.setProperty('transition','none','important');
   if(o.scrollTop||o.scrollLeft)scrolls.push([n,o.scrollTop,o.scrollLeft]);
   if(o instanceof HTMLInputElement){n.value=o.value;n.checked=o.checked;}
   else if(o instanceof HTMLTextAreaElement||o instanceof HTMLSelectElement)n.value=o.value;
   if(o.matches('.main-content')){n.style.setProperty('height',o.getBoundingClientRect().height+'px','important');n.style.setProperty('overflow-y',computed.overflowY,'important');}
  }
  copy.querySelectorAll('script,iframe,object,embed').forEach(n=>n.remove());
  copy.setAttribute('data-bb-drag-preview','more-page');copy.setAttribute('aria-hidden','true');copy.inert=true;
  for(const [key,value]of Object.entries({position:'absolute',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',transform:'none'}))copy.style.setProperty(key,value,'important');
  return {copy,restore(){for(const [node,top,left]of scrolls){node.scrollTop=top;node.scrollLeft=left;}}};
 }
 function attach(dialog){
  if(!active||contexts.has(dialog))return;
  const ac=new AbortController();let gesture=null,stage=null,settling=false,suppressClick=false,timer=null;
  const listen=(name,fn,options={})=>dialog.addEventListener(name,fn,{...options,signal:ac.signal});
  function restore(){
   if(!stage)return;const old=stage;stage=null;
   for(const child of [...old.front.childNodes])dialog.appendChild(child);
   old.front.remove();old.back.remove();old.dim.remove();
   if(old.inline===null)dialog.removeAttribute('style');else dialog.setAttribute('style',old.inline);
   for(const [node,top,left]of old.scrolls){node.scrollTop=top;node.scrollLeft=left;}
   for(const [node,style]of old.textStyles){if(style===null)node.removeAttribute('style');else node.setAttribute('style',style);}
   if(old.focus?.isConnected&&dialog.open)old.focus.focus({preventScroll:true});
  }
  function reset(){clearTimeout(timer);timer=null;gesture=null;settling=false;restore();}
  function buildStage(){
   const snap=snapshot();if(!snap)return false;
   const r=dialog.getBoundingClientRect(),style=getComputedStyle(dialog);
   const front=document.createElement('div'),back=document.createElement('div'),dim=document.createElement('div');
   front.className='bb-more-swipe-stage-front';back.className='bb-more-swipe-stage-back';dim.className='bb-more-swipe-stage-dim';
   back.setAttribute('data-bb-drag-preview','more-background');back.setAttribute('aria-hidden','true');back.inert=true;dim.setAttribute('aria-hidden','true');
   const scrolls=[...dialog.querySelectorAll('*')].filter(n=>n.scrollTop||n.scrollLeft).map(n=>[n,n.scrollTop,n.scrollLeft]);
   // Preserve the moving popup's text too, in case mobile text autosizing reacts
   // to its temporary full-viewport dialog shell. Restore these inline styles.
   const textStyles=[...dialog.querySelectorAll('*')].map(n=>[n,n.getAttribute('style')]);
   for(const [n]of textStyles)freezeText(n,n);
   const original={inline:dialog.getAttribute('style'),focus:document.activeElement,scrolls,textStyles,front,back,dim};
   Object.assign(front.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',background:style.backgroundColor,color:style.color,border:style.border,borderRadius:style.borderRadius,boxShadow:style.boxShadow,font:style.font});
   front.style.setProperty('transform','translate3d(0,0,0)','important');
   while(dialog.firstChild)front.appendChild(dialog.firstChild);
   back.appendChild(snap.copy);dialog.append(back,dim,front);stage=original;
   const full={position:'fixed',inset:'0',left:'0',top:'0',right:'0',bottom:'0',width:'100%',height:'100dvh','max-width':'none','max-height':'none','min-width':'0',margin:'0',padding:'0',border:'0','border-radius':'0','box-shadow':'none',background:'transparent',overflow:'hidden',display:'block',transform:'none'};
   for(const [key,value]of Object.entries(full))dialog.style.setProperty(key,value,'important');
   snap.restore();for(const [n,t,l]of scrolls){n.scrollTop=t;n.scrollLeft=l;}
   return true;
  }
  function finish(complete){
   if(settling)return;settling=true;const dx=gesture?.dx||0;gesture=null;suppressClick=dx>0;
   const duration=reduced()?0:complete?180:150;
   const end=()=>{
    timer=null;
    if(complete&&visible(dialog)){const api=dialog.id==='bbml-dialog'?window.BillBeaconMoreLive:window.BillBeaconMorePreview;if(typeof api?.close==='function')api.close();else{dialog.close();dialog.remove();}}
    restore();settling=false;setTimeout(()=>{suppressClick=false;},0);
   };
   if(!stage||!duration){end();return;}
   stage.front.style.setProperty('transition',`transform ${duration}ms ease-out`,'important');stage.front.style.setProperty('transform',`translate3d(${complete?window.innerWidth:0}px,0,0)`,'important');
   stage.dim.style.transition=`opacity ${duration}ms ease-out`;stage.dim.style.opacity=complete?'0':'1';timer=setTimeout(end,duration+25);
  }
  const findTouch=(e,id)=>[...e.touches,...e.changedTouches].find(t=>t.identifier===id);
  function start(e){
   if(settling||!visible(dialog)||e.touches.length!==1)return;
   const t=e.touches[0],target=e.target;if(!(target instanceof Element))return;
   if(target.closest('input,textarea,select,option,[contenteditable],a,[data-bb-drag-preview]'))return;
   const r=dialog.getBoundingClientRect(),edge=t.clientX>=r.left&&t.clientX<=r.left+36;
   if(target.closest('button,[role="button"],label')&&!edge)return;
   const selection=window.getSelection?.();if(selection&&!selection.isCollapsed&&String(selection).trim())return;
   gesture={id:t.identifier,x:t.clientX,y:t.clientY,dx:0,dragging:false,width:r.width,samples:[{x:t.clientX,t:performance.now()}]};
  }
  function move(e){
   if(!gesture)return;if(e.touches.length!==1){if(gesture.dragging)finish(false);else gesture=null;return;}
   const t=findTouch(e,gesture.id);if(!t)return;const dx=t.clientX-gesture.x,dy=t.clientY-gesture.y;
   if(!gesture.dragging){if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;if(Math.abs(dy)>=Math.abs(dx)||dx<=0){gesture=null;return;}if(dx<Math.abs(dy)*1.35)return;if(!e.cancelable||!buildStage()){gesture=null;return;}gesture.dragging=true;}
   if(!e.cancelable){finish(false);return;}e.preventDefault();e.stopPropagation();gesture.dx=Math.max(0,dx);
   const now=performance.now();gesture.samples.push({x:t.clientX,t:now});gesture.samples=gesture.samples.filter(s=>now-s.t<=120).slice(-10);
   stage.front.style.setProperty('transform',`translate3d(${gesture.dx}px,0,0)`,'important');stage.dim.style.opacity=String(Math.max(0,1-gesture.dx/window.innerWidth));
  }
  function end(e){
   if(!gesture)return;if(!gesture.dragging){gesture=null;return;}
   const t=findTouch(e,gesture.id),now=performance.now(),first=gesture.samples.filter(s=>now-s.t<=100)[0],velocity=t&&first?(t.clientX-first.x)/Math.max(1,now-first.t):0;
   const dx=t?Math.max(0,t.clientX-gesture.x):gesture.dx;gesture.dx=dx;
   const complete=!!t&&velocity>=-.15&&(dx>=Math.min(140,gesture.width*.30)||(dx>=50&&velocity>.55));
   if(e.cancelable)e.preventDefault();e.stopPropagation();finish(complete);
  }
  function cancel(){if(gesture?.dragging)finish(false);else gesture=null;}
  listen('touchstart',start,{capture:true,passive:true});listen('touchmove',move,{capture:true,passive:false});listen('touchend',end,{capture:true,passive:false});listen('touchcancel',cancel,{capture:true,passive:true});
  listen('click',e=>{if(!suppressClick)return;e.preventDefault();e.stopImmediatePropagation();suppressClick=false;},{capture:true});listen('close',()=>{reset();detach(dialog);},{once:true});
  contexts.set(dialog,{reset,cleanup(){reset();ac.abort();}});
 }
 function detach(d){const c=contexts.get(d);if(c){c.cleanup();contexts.delete(d);}}
 function scan(){for(const d of document.querySelectorAll(SELECTOR))attach(d);for(const d of contexts.keys())if(!d.isConnected)detach(d);}
 function interrupt(){for(const c of contexts.values())c.reset();}
 function init(){if(!active)return;const style=document.createElement('style');style.id=STYLE;style.textContent=CSS;document.head.append(style);scan();observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});}
 function uninstall(){if(!active)return;active=false;observer?.disconnect();for(const d of [...contexts.keys()])detach(d);document.getElementById(STYLE)?.remove();document.removeEventListener('DOMContentLoaded',init);document.removeEventListener('visibilitychange',interrupt);window.removeEventListener('resize',interrupt);delete window.BillBeaconMorePopupSwipe;}
 document.addEventListener('visibilitychange',interrupt);window.addEventListener('resize',interrupt);window.BillBeaconMorePopupSwipe=Object.freeze({version:'3.0.0',uninstall});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

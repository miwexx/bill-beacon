/* Bill Beacon Calendar performance phase 2 (v3).
   Full replacement for calendar-preview.js. Load after app.js and bill-splits.js.
   Remove the processing-calendar.js script: Processing is rendered here.
   Read-only, bounded in-memory models; no financial storage writes. */
(() => {
  "use strict";
  if(window.BillBeaconCalendarPreview)return;
  if(typeof renderRecurring!=="function"||typeof getCalendarBillsForMonth!=="function"||
     typeof isOccurrenceProcessing!=="function") {
    console.error("Calendar v3: load app.js and the existing split/UI scripts first.");return;
  }
  const original=renderRecurring;
  const key=value=>financialDateKey(value);
  const localDate=value=>new Date(`${value}T12:00:00`);
  const dateKey=date=>getLocalDateKey(date);
  const monthKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
  const iso=value=>localDate(value).toISOString();
  const firstOfMonth=date=>new Date(date.getFullYear(),date.getMonth(),1,12);
  const clone=value=>JSON.parse(JSON.stringify(value));
  function addDays(value,amount){const date=localDate(value);date.setDate(date.getDate()+amount);return dateKey(date);}
  function startOfWeek(value){const date=localDate(value);return addDays(value,-date.getDay());}
  function state() {
    const now=new Date(),raw=String(routeParams.month||"");
    const match=raw.match(/^(\d{4})-(\d{2})/);
    const valid=match&&Number(match[2])>=1&&Number(match[2])<=12;
    const date=valid?new Date(Number(match[1]),Number(match[2])-1,1,12):firstOfMonth(now);
    const month=monthKey(date),mode=routeParams.bbCalendarView==="week"?"week":"month";
    const picked=key(routeParams.recurringSelectedDate||"");
    const defaultAnchor=picked||(month===monthKey(now)?dateKey(now):`${month}-01`);
    const anchor=key(routeParams.bbCalendarWeekAnchor||"")||defaultAnchor;
    const start=mode==="week"?startOfWeek(anchor):`${month}-01`;
    const end=mode==="week"?addDays(start,6):dateKey(new Date(date.getFullYear(),date.getMonth()+1,0,12));
    return {date,month,mode,anchor,start,end,selected:picked&&picked>=start&&picked<=end?picked:null,
      filter:["all","unpaid","paid"].includes(routeParams.bbCalendarFilter)?routeParams.bbCalendarFilter:"all",
      expanded:routeParams.bbCalendarExpanded===true};
  }
  const MONTH_LIMIT=6,PERIOD_LIMIT=8;
  let revision=null,overdueCache=null;
  const months=new Map(),periods=new Map();
  function invalidate(){revision=null;overdueCache=null;months.clear();periods.clear();}
  function freshness() {
    const now=new Date(),user=window.getBillBeaconFirebaseUser?.(),context=window.getBillBeaconHouseholdContext?.();
    const next={raw:["bills","payments","archivedBills","settings"].map(name=>localStorage.getItem(name)),
      scope:JSON.stringify([user?.uid||null,context?.uid||null,context?.householdId||null,context?.generation??null,context?.ready??null]),
      day:dateKey(now),offset:now.getTimezoneOffset(),zone:Intl.DateTimeFormat().resolvedOptions().timeZone||"",
      refs:[Store.getBills,Store.getPayments,Store.getPaymentsForBill,Store.getSettings,getCalendarBillsForMonth,
        getOccurrenceStatus,isOccurrencePaid,getOccurrencePaidAmount,getAllOverdueBillOccurrences,isOccurrenceProcessing]};
    const same=revision&&revision.scope===next.scope&&revision.day===next.day&&revision.offset===next.offset&&revision.zone===next.zone&&
      next.raw.every((value,index)=>revision.raw[index]===value)&&next.refs.every((value,index)=>revision.refs[index]===value);
    if(!same){invalidate();revision=next;}
  }
  function keep(map,name,value,limit){map.delete(name);map.set(name,value);if(map.size>limit)map.delete(map.keys().next().value);return value;}
  function entryFor(bill) {
    const status=getOccurrenceStatus(bill,new Date(bill.dueDate));
    return {bill,day:key(bill.dueDate),status,paid:status==="paid",
      paidAmount:status==="paid"?getOccurrencePaidAmount(bill):0};
  }
  function monthEntries(month) {
    if(months.has(month)){const value=months.get(month);months.delete(month);months.set(month,value);return value;}
    const bills=getCalendarBillsForMonth(localDate(month+"-01"));
    if(!Array.isArray(bills))throw new Error("Calendar month records are unavailable.");
    return keep(months,month,bills.map(entryFor),MONTH_LIMIT);
  }
  function periodData(s) {
    const token=s.start+"|"+s.end;
    if(periods.has(token)){const value=periods.get(token);periods.delete(token);periods.set(token,value);return value;}
    const monthNames=new Set([s.start.slice(0,7),s.end.slice(0,7)]);
    const entries=[...monthNames].flatMap(monthEntries).filter(entry=>entry.day>=s.start&&entry.day<=s.end)
      .sort((a,b)=>String(a.day).localeCompare(String(b.day))||String(a.bill.name).localeCompare(String(b.bill.name)));
    return keep(periods,token,{entries},PERIOD_LIMIT);
  }
  function isPaid(bill){return isOccurrencePaid(bill,new Date(bill.dueDate));}
  function filteredBills(bills,filter) {
    return bills.filter(bill=>filter==="all"||(filter==="paid"?isPaid(bill):!isPaid(bill)))
      .slice().sort((a,b)=>String(key(a.dueDate)).localeCompare(String(key(b.dueDate)))||String(a.name).localeCompare(String(b.name)));
  }
  function total(values){return values.reduce((sum,value)=>{const n=Math.round(Number(value)*100);return sum+(Number.isSafeInteger(n)?n:0);},0)/100;}
  function periodBills(s){freshness();return periodData(s).entries.map(entry=>clone(entry.bill));}
  function model(s=state()) {
    freshness();
    const visibleEntries=periodData(s).entries.filter(entry=>s.filter==="all"||(s.filter==="paid"?entry.paid:!entry.paid));
    const byDay=new Map();
    for(const entry of visibleEntries){if(!byDay.has(entry.day))byDay.set(entry.day,[]);byDay.get(entry.day).push(entry);}
    const listEntries=s.selected?(byDay.get(s.selected)||[]):visibleEntries;
    const amount=s.filter==="paid"?total(listEntries.map(entry=>entry.paidAmount)):total(listEntries.filter(entry=>!entry.paid).map(entry=>entry.bill.amount));
    const pending=listEntries.filter(entry=>entry.status==="processing");
    const dates=[];for(let value=s.start;value<=s.end;value=addDays(value,1))dates.push(value);
    return {s,visible:visibleEntries.map(entry=>entry.bill),list:listEntries.map(entry=>entry.bill),
      visibleEntries,listEntries,byDay,amount,dates,processingAmount:total(pending.map(entry=>entry.bill.amount)),processingCount:pending.length};
  }
  function overdueModel() {
    if(overdueCache)return overdueCache;
    const bills=getAllOverdueBillOccurrences(new Date());
    if(!Array.isArray(bills))throw new Error("Overdue records are unavailable.");
    overdueCache={count:bills.length,amount:total(bills.map(bill=>bill.amount))};return overdueCache;
  }
  function update(changes,resetScroll=false) {
    if(currentRoute!=="recurring")return;
    const scroll={window:window.scrollY||0,main:document.querySelector("#app .main-content")?.scrollTop||0};
    routeParams={...routeParams,...changes};render();
    requestAnimationFrame(()=>{
      if(currentRoute!=="recurring")return;
      window.scrollTo(0,resetScroll?0:scroll.window);
      const main=document.querySelector("#app .main-content");if(main)main.scrollTop=resetScroll?0:scroll.main;
    });
  }
  function changeMonth(offset) {
    if(![-1,1].includes(offset))return;
    const s=state();
    if(s.mode==="week") {
      const anchor=addDays(s.start,offset*7);
      update({month:firstOfMonth(localDate(anchor)).toISOString(),bbCalendarWeekAnchor:anchor,recurringSelectedDate:null,bbCalendarExpanded:false},true);
    } else {
      const next=new Date(s.date.getFullYear(),s.date.getMonth()+offset,1,12);
      update({month:next.toISOString(),bbCalendarWeekAnchor:null,recurringSelectedDate:null,bbCalendarExpanded:false},true);
    }
  }
  function setView(mode) {
    if(!["month","week"].includes(mode))return;
    const s=state();if(mode===s.mode)return;
    const focus=s.selected||(s.mode==="week"?s.anchor:(s.month===monthKey(new Date())?dateKey(new Date()):s.start));
    update({bbCalendarView:mode,month:firstOfMonth(localDate(focus)).toISOString(),bbCalendarWeekAnchor:focus,bbCalendarExpanded:false},true);
  }
  function today() {
    const now=new Date(),value=dateKey(now);
    update({month:firstOfMonth(now).toISOString(),bbCalendarWeekAnchor:value,recurringSelectedDate:iso(value),bbCalendarExpanded:false},true);
  }
  function selectDay(value) {
    const s=state();if(!key(value)||value<s.start||value>s.end)return;
    update({recurringSelectedDate:s.selected===value?null:iso(value),bbCalendarExpanded:false});
  }
  function clearDay(){update({recurringSelectedDate:null,bbCalendarExpanded:false});}
  function filter(value){if(["all","unpaid","paid"].includes(value))update({bbCalendarFilter:value,bbCalendarExpanded:false});}
  function expand(){update({bbCalendarExpanded:!state().expanded});}
  function openBill(id,dueDate) {
    if(currentRoute!=="recurring")return;
    const params=JSON.parse(JSON.stringify(routeParams));
    params.bbCalendarPreviewReturn={window:window.scrollY||0,main:document.querySelector("#app .main-content")?.scrollTop||0};
    navigate("detail",{id,occurrenceDueDate:dueDate,returnRoute:"recurring",returnParams:params});
  }
  function rangeLabel(start,end) {
    const first=localDate(start),last=localDate(end),crossYear=first.getFullYear()!==last.getFullYear();
    const left=first.toLocaleDateString(undefined,{month:"short",day:"numeric",...(crossYear?{year:"numeric"}:{})});
    return left+" – "+last.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
  }
  function row(entry) {
    const {bill,paid,status}=entry;
    const color=paid?"var(--paid)":status==="processing"?"#79b9ff":status==="overdue"?"var(--overdue)":"var(--text-muted)";
    const label=paid?"Paid":status==="processing"?"Processing":status==="overdue"?"Overdue":"Due";
    const name=bill.splitPaymentParentId&&!/\s-\sSplit\s\d+$/i.test(bill.name)?`${bill.name} - Split ${bill.splitPaymentPartNumber}`:bill.name;
    const id=getBillPaymentId(bill),visual={...bill,name};
    return `<button type="button" class="bill-row" style="width:100%;text-align:left;color:var(--text);"
      onclick="BillBeaconCalendarPreview.openBill('${escapeInlineString(id)}','${escapeInlineString(bill.dueDate)}')"
      aria-label="${escapeHtml(`${name}, ${label.toLowerCase()}, ${formatDate(bill.dueDate,"full")}, ${formatCurrency(bill.amount)}`)}">
      <span class="bill-icon bb-calendar-preview-logo" style="
  width:42px;
  height:42px;
  min-width:42px;
  flex:0 0 42px;
  border-radius:10px;
  overflow:hidden;
  background:${
    bill.installmentPlanId || bill.installmentProvider
      ? "transparent"
      : getBillBrand(visual.name)
        ? "#fff"
        : `var(--${getCategory(bill.category).color})`
  };
  color:${
    bill.installmentPlanId || bill.installmentProvider
      ? "var(--accent)"
      : getBillBrand(visual.name)
        ? "#1e1e2e"
        : "#fff"
  };
">
  ${billOrPaymentPlanVisual(visual,42)}
</span>
      <span class="bill-info"><span class="bill-name" style="display:block;">${escapeHtml(name)}</span>
      <span class="bill-meta" style="color:${color};">${paid?svgIcon("checkCircle",13):status==="processing"?svgIcon("clock",13):status==="overdue"?svgIcon("warning",13):svgIcon("calendar",13)} ${label} · ${escapeHtml(formatDate(bill.dueDate,"short"))}</span></span>
      <span class="bill-amount">${formatCurrency(bill.amount)}</span><span aria-hidden="true" style="color:var(--text-muted);">${svgIcon("chevronRight",16)}</span></button>`;
  }
  function agenda(entries,s) {
    const shown=entries.slice(0,s.expanded?entries.length:5);
    if(s.mode!=="week"||s.selected)return shown.map(row).join("");
    let previous="";
    return shown.map(entry=>{
      const day=entry.day;
      const heading=day!==previous?`<div class="section-header" style="padding:12px 14px 6px;">${escapeHtml(formatDate(iso(day),"full"))}</div>`:"";
      previous=day;return heading+row(entry);
    }).join("");
  }
  function view() {
    const m=model(),{s,list,amount,dates}=m,todayKey=dateKey(new Date());
    const cells=s.mode==="month"?Array.from({length:s.date.getDay()},()=>'<div class="recurring-calendar-day is-empty"></div>'):[];
    for(const value of dates) {
      const date=localDate(value),entries=m.byDay.get(value)||[];
      let paidCount=0,processingCount=0,overdue=false,upcoming=false;
      for(const entry of entries){if(entry.paid)paidCount++;if(entry.status==="processing")processingCount++;if(entry.status==="overdue")overdue=true;if(entry.status==="upcoming")upcoming=true;}
      const markerClass=overdue?"overdue":upcoming?"upcoming":processingCount?"processing":"paid";
      const description=processingCount
        ? `${formatDate(iso(value),"full")}, ${entries.length} payments, ${paidCount} paid, ${processingCount} processing, ${entries.length-paidCount-processingCount} still to submit`
        : `${formatDate(iso(value),"full")}, ${entries.length} payments, ${paidCount} paid, ${entries.length-paidCount} unpaid`;
      cells.push(`<button type="button" class="recurring-calendar-day${value===todayKey?' is-today':''}${s.selected===value?' is-selected':''}${overdue?' has-overdue':''}"
        onclick="BillBeaconCalendarPreview.selectDay('${value}')"
        aria-label="${escapeHtml(description)}"
        aria-pressed="${s.selected===value}" ${value===todayKey?'aria-current="date"':''}>
        <span>${date.getDate()}</span>${entries.length?`<i class="recurring-calendar-marker ${markerClass}" ${markerClass==='processing'?'style="background-color:#79b9ff;"':''} aria-hidden="true"></i>`:""}</button>`);
    }
    const overdue=overdueModel();
    const heading=s.selected?formatDate(iso(s.selected),"full"):s.mode==="week"?"Week Payments":formatDate(s.date,"monthYear")+" Payments";
    const empty=s.filter==="paid"?"No paid payments":s.filter==="unpaid"?"No unpaid payments":"No payments";
    return `<div class="nav-bar"><div class="nav-bar-content" style="display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;">
      <div style="width:44px;"></div><div class="nav-title" style="text-align:center;">Calendar</div>
      <button type="button" class="nav-button" style="width:44px;height:44px;justify-content:center;" onclick="openAddMenu()" aria-label="Add a bill or payment plan">${svgIcon("plus",20)}</button></div></div>
      <main class="main-content bb-calendar-preview-page"><div class="content-pad content-gap">
      <style>
        /* Existing Calendar/control appearance retained. */
        .bb-calendar-preview-page{min-width:0;}
        .bb-cal-view-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0;}
        .bb-cal-view-toggle{display:flex;gap:3px;padding:3px;border:1px solid var(--border);border-radius:999px;background:var(--surface-2);}
        .bb-cal-view-toggle button{min-height:32px;padding:5px 16px;border:1px solid transparent;border-radius:999px;background:transparent;color:var(--text-muted);font:inherit;font-size:12px;font-weight:700;}
        .bb-cal-view-toggle button[aria-pressed="true"]{background:var(--surface);border-color:var(--border);color:var(--text);}
        .bb-cal-today{min-height:34px;padding:5px 14px;border:1px solid var(--border);border-radius:999px;background:transparent;color:var(--text);font:inherit;font-size:12px;font-weight:700;}
        .bb-cal-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:4px;border:1px solid var(--border);border-radius:13px;background:var(--surface-2);}
        .bb-cal-filters button{min-height:36px;padding:6px 8px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--text-muted);font:inherit;font-size:var(--text-sm);font-weight:700;}
        .bb-cal-filters button[aria-pressed="true"]{background:var(--surface);border-color:var(--border);color:var(--text);}
        .bb-cal-overdue{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;min-height:42px;padding:9px 12px;border:1px solid var(--border);border-radius:12px;background:transparent;color:var(--overdue);font:inherit;font-size:var(--text-xs);font-weight:700;text-align:left;}
        .bb-cal-listhead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:2px 0 10px;}
        .bb-cal-listhead h2{margin:0;font-size:var(--text-base);font-weight:800;line-height:1.4;}
        .bb-cal-listmeta{margin-top:4px;color:var(--text-muted);font-size:var(--text-xs);}
        .bb-cal-clear{display:flex;align-items:center;justify-content:center;flex:0 0 36px;min-height:36px;padding:0;border:1px solid var(--border);border-radius:999px;background:transparent;color:var(--text);}
        .bb-calendar-preview-page button:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
        .bb-cal-more{width:100%;min-height:42px;padding:10px 12px;border:0;border-top:1px solid var(--border);background:transparent;color:var(--text);font:inherit;font-size:var(--text-sm);font-weight:700;}
      </style>
      ${renderLegacyPaymentReviewNotice()}
      <section class="recurring-calendar-card" aria-label="${s.mode==='week'?'Weekly':'Monthly'} Bills Calendar">
        <div class="recurring-calendar-heading">
          <button type="button" class="month-nav-btn" onclick="BillBeaconCalendarPreview.changeMonth(-1)" aria-label="Previous ${s.mode}">${svgIcon("chevronLeft",18)}</button>
          <strong>${escapeHtml(s.mode==="month"?formatDate(s.date,"monthYear"):rangeLabel(s.start,s.end))}</strong>
          <button type="button" class="month-nav-btn" onclick="BillBeaconCalendarPreview.changeMonth(1)" aria-label="Next ${s.mode}">${svgIcon("chevronRight",18)}</button>
        </div>
        <div class="bb-cal-view-controls"><div class="bb-cal-view-toggle" role="group" aria-label="Calendar view">
          <button type="button" aria-pressed="${s.mode==='month'}" onclick="BillBeaconCalendarPreview.setView('month')">Month</button>
          <button type="button" aria-pressed="${s.mode==='week'}" onclick="BillBeaconCalendarPreview.setView('week')">Week</button>
        </div><button type="button" class="bb-cal-today" onclick="BillBeaconCalendarPreview.today()">Today</button></div>
        <div class="recurring-calendar-weekdays">${["S","M","T","W","T","F","S"].map(day=>`<span>${day}</span>`).join("")}</div>
        <div class="recurring-calendar-grid">${cells.join("")}</div>
      </section>
      <div class="bb-cal-filters" role="group" aria-label="Filter calendar payments">${[["all","All"],["unpaid","Unpaid"],["paid","Paid"]].map(([id,label])=>`<button type="button" aria-pressed="${s.filter===id}" onclick="BillBeaconCalendarPreview.filter('${id}')">${label}</button>`).join("")}</div>
      ${overdue.count?`<button type="button" class="bb-cal-overdue" onclick="openDashboardStatusSheet('overdue')" aria-label="View all overdue payments, including earlier months"><span>${overdue.count} Overdue · All Dates</span><span>${formatCurrency(overdue.amount)}</span></button>`:""}
      <section ${s.selected?'class="recurring-calendar-selected-day"':''} aria-label="Calendar payment list">
        <div class="bb-cal-listhead"><div><h2>${escapeHtml(heading)}</h2><div class="bb-cal-listmeta">${list.length} ${list.length===1?'Payment':'Payments'} · ${s.filter==='paid'?'Paid':'Remaining'} ${formatCurrency(amount)}${m.processingCount?` · ${formatCurrency(m.processingAmount)} processing`:''}</div></div>
        ${s.selected?`<button type="button" class="bb-cal-clear" onclick="BillBeaconCalendarPreview.clearDay()" aria-label="Close selected day">${svgIcon("close",16)}</button>`:""}</div>
        <div class="card">${list.length?agenda(m.listEntries,s):`<div style="padding:22px 14px;text-align:center;color:var(--text-muted);font-size:var(--text-sm);">${empty} ${s.selected?'for this day':s.mode==='week'?'for this week':'for this month'}.</div>`}
        ${list.length>5?`<button type="button" class="bb-cal-more" onclick="BillBeaconCalendarPreview.expand()" aria-expanded="${s.expanded}">${s.expanded?'Show Less':`Show More (${list.length-5})`}</button>`:""}</div>
      </section></div></main>`;
  }
  renderRecurring=function() {
    let html;
    try{html=view();}catch(error){invalidate();console.error("Calendar v3 failed; original view retained.",error);return original.apply(this,arguments);}
    const scroll=routeParams.bbCalendarPreviewReturn;
    if(scroll){delete routeParams.bbCalendarPreviewReturn;requestAnimationFrame(()=>{
      if(currentRoute!=="recurring")return;window.scrollTo(0,scroll.window||0);
      const main=document.querySelector("#app .main-content");if(main)main.scrollTop=scroll.main||0;
    });}
    return html;
  };
  for(const event of ["billbeacon:data-changed","billbeacon:signed-out","billbeacon:authenticated","billbeacon:household-ready"])window.addEventListener(event,invalidate);
  window.addEventListener("storage",event=>{if(event.key===null||["bills","payments","archivedBills","settings"].includes(event.key))invalidate();});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")invalidate();});
  function publicModel(s){const value=model(s);return {s:value.s,visible:clone(value.visible),list:clone(value.list),amount:value.amount,dates:[...value.dates],processingAmount:value.processingAmount,processingCount:value.processingCount};}
  window.BillBeaconCalendarPreview={version:3,changeMonth,setView,today,selectDay,clearDay,filter,expand,openBill,
    originalRenderer:original,_test:{state,model:publicModel,periodBills,startOfWeek,addDays,filteredBills,total,view,
      cacheSizes:()=>({months:months.size,periods:periods.size,overdue:!!overdueCache})}};
  // Prevent an older cached HTML page from installing the retired adapter twice.
  if(!window.BillBeaconProcessingCalendar)window.BillBeaconProcessingCalendar=Object.freeze({version:2,integrated:true});
})();

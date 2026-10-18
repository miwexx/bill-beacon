/* Bill Beacon BROWSER Calendar preview v1.
   Load after the existing app/UI scripts. Remove its script line and reload
   to restore the original Calendar. No financial data/storage writes. */
(() => {
  "use strict";
  if(window.BillBeaconCalendarPreview)return;
  if(typeof renderRecurring!=="function"||typeof getCalendarBillsForMonth!=="function"||
      typeof getOccurrenceStatus!=="function") {
    console.error("Calendar preview: load app.js and bill-splits.js first.");return;
  }
  const original=renderRecurring;
  const dayKey=value=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)?value:financialDateKey(value);
  const nowKey=()=>getLocalDateKey(new Date());
  const localDate=value=>new Date(`${value}T12:00:00`);
  const monthKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
  const iso=value=>localDate(value).toISOString();

  function state() {
    const now=new Date(),raw=String(routeParams.month||"");
    const match=raw.match(/^(\d{4})-(\d{2})/);
    const valid=match&&Number(match[2])>=1&&Number(match[2])<=12;
    const date=valid?new Date(Number(match[1]),Number(match[2])-1,1,12):new Date(now.getFullYear(),now.getMonth(),1,12);
    const month=monthKey(date);
    const selected=dayKey(routeParams.recurringSelectedDate||"");
    return {date,month,selected:selected.startsWith(month+"-")?selected:null,
      filter:["all","unpaid","paid"].includes(routeParams.bbCalendarFilter)?routeParams.bbCalendarFilter:"all",
      expanded:routeParams.bbCalendarExpanded===true};
  }
  function isPaid(bill){return isOccurrencePaid(bill,new Date(bill.dueDate));}
  function filteredBills(bills,filter) {
    return bills.filter(bill=>filter==="all"||(filter==="paid"?isPaid(bill):!isPaid(bill)))
      .slice().sort((a,b)=>String(dayKey(a.dueDate)).localeCompare(String(dayKey(b.dueDate)))||String(a.name).localeCompare(String(b.name)));
  }
  function total(values) {
    return values.reduce((sum,value)=>{
      const n=Math.round(Number(value)*100);
      return sum+(Number.isSafeInteger(n)?n:0);
    },0)/100;
  }
  function update(changes,resetScroll=false) {
    if(currentRoute!=="recurring")return;
    const scroll={window:window.scrollY||0,main:document.querySelector("#app .main-content")?.scrollTop||0};
    routeParams={...routeParams,...changes};
    render();
    requestAnimationFrame(()=>{
      if(currentRoute!=="recurring")return;
      window.scrollTo(0,resetScroll?0:scroll.window);
      const main=document.querySelector("#app .main-content");if(main)main.scrollTop=resetScroll?0:scroll.main;
    });
  }
  function changeMonth(offset) {
    if(![-1,1].includes(offset))return;
    const s=state(),next=new Date(s.date.getFullYear(),s.date.getMonth()+offset,1,12);
    update({month:next.toISOString(),recurringSelectedDate:null,bbCalendarExpanded:false},true);
  }
  function today() {
    const date=new Date();
    update({month:new Date(date.getFullYear(),date.getMonth(),1,12).toISOString(),recurringSelectedDate:iso(nowKey()),bbCalendarExpanded:false},true);
  }
  function selectDay(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.slice(0,7)!==state().month)return;
    update({recurringSelectedDate:state().selected===value?null:iso(value),bbCalendarExpanded:false});
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
  function row(bill) {
    const paid=isPaid(bill),status=getOccurrenceStatus(bill,new Date(bill.dueDate));
    const color=paid?"var(--paid)":status==="overdue"?"var(--overdue)":"var(--text-muted)";
    const label=paid?"Paid":status==="overdue"?"Overdue":"Due";
    const name=bill.splitPaymentParentId&&!/\s-\sSplit\s\d+$/i.test(bill.name)?`${bill.name} - Split ${bill.splitPaymentPartNumber}`:bill.name;
    const id=getBillPaymentId(bill);
    const visual={...bill,name};
    return `<button type="button" class="bill-row" style="width:100%;text-align:left;color:var(--text);"
      onclick="BillBeaconCalendarPreview.openBill('${escapeInlineString(id)}','${escapeInlineString(bill.dueDate)}')"
      aria-label="${escapeHtml(`${name}, ${label.toLowerCase()}, ${formatDate(bill.dueDate,"full")}, ${formatCurrency(bill.amount)}`)}">
      <span style="display:flex;align-items:center;justify-content:center;flex:0 0 34px;width:34px;height:34px;overflow:hidden;">${billOrPaymentPlanVisual(visual,32)}</span>
      <span class="bill-info"><span class="bill-name" style="display:block;">${escapeHtml(name)}</span>
        <span class="bill-meta" style="color:${color};">${paid?svgIcon("checkCircle",13):status==="overdue"?svgIcon("warning",13):svgIcon("calendar",13)} ${label} · ${escapeHtml(formatDate(bill.dueDate,"short"))}</span></span>
      <span class="bill-amount">${formatCurrency(bill.amount)}</span>
      <span aria-hidden="true" style="color:var(--text-muted);">${svgIcon("chevronRight",16)}</span></button>`;
  }

  function view() {
    const s=state(),bills=getCalendarBillsForMonth(s.date),todayValue=nowKey();
    const visible=filteredBills(bills,s.filter);
    const list=s.selected?visible.filter(bill=>dayKey(bill.dueDate)===s.selected):visible;
    const unpaid=list.filter(bill=>!isPaid(bill));
    const amount=s.filter==="paid"?total(list.map(bill=>getOccurrencePaidAmount(bill))):total(unpaid.map(bill=>bill.amount));
    const amountLabel=s.filter==="paid"?"Paid":"Remaining";
    const days=new Date(s.date.getFullYear(),s.date.getMonth()+1,0).getDate();
    const cells=Array.from({length:s.date.getDay()},()=>'<span aria-hidden="true"></span>');
    for(let day=1;day<=days;day++) {
      const value=`${s.month}-${String(day).padStart(2,"0")}`;
      const dayBills=visible.filter(bill=>dayKey(bill.dueDate)===value);
      const paid=dayBills.filter(isPaid).length,unpaid=dayBills.length-paid;
      const overdue=dayBills.some(bill=>!isPaid(bill)&&getOccurrenceStatus(bill,new Date(bill.dueDate))==="overdue");
      const marker=!dayBills.length?"":unpaid?`${dayBills.length}${overdue?" !":""}`:"✓";
      const label=`${formatDate(iso(value),"full")}, ${dayBills.length} payments, ${paid} paid, ${unpaid} unpaid`;
      cells.push(`<button type="button" class="bb-calendar-preview-day${value===todayValue?' is-today':''}${s.selected===value?' is-selected':''}"
        onclick="BillBeaconCalendarPreview.selectDay('${value}')" aria-label="${escapeHtml(label)}" aria-pressed="${s.selected===value}"
        ${value===todayValue?'aria-current="date"':''}><span>${day}</span><span class="bb-calendar-preview-marker" style="color:${overdue?'var(--overdue)':unpaid?'var(--text-muted)':'var(--paid)'};">${marker}</span></button>`);
    }
    const overdue=getAllOverdueBillOccurrences(new Date());
    const heading=s.selected?formatDate(iso(s.selected),"full"):formatDate(s.date,"monthYear")+" Payments";
    const empty=s.filter==="paid"?"No paid payments":s.filter==="unpaid"?"No unpaid payments":"No payments";
    return `<div class="nav-bar"><div class="nav-bar-content" style="display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;">
      <div style="width:44px;"></div><div class="nav-title" style="text-align:center;">Calendar</div>
      <button type="button" class="nav-button" style="width:44px;height:44px;justify-content:center;" onclick="openAddMenu()" aria-label="Add a bill or payment plan">${svgIcon("plus",20)}</button></div></div>
      <main class="main-content bb-calendar-preview-page"><div class="content-pad content-gap">
      <style>
        .bb-calendar-preview-page{min-width:0;}
        .bb-calendar-preview-month{padding:12px;}
        .bb-calendar-preview-nav{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:6px;}
        .bb-calendar-preview-nav button{display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;color:var(--text);border:0;background:transparent;}
        .bb-calendar-preview-title{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;font-size:var(--text-base);font-weight:800;}
        .bb-calendar-preview-title button{width:auto;height:30px;padding:0 10px;border:1px solid var(--border);border-radius:999px;font-size:11px;font-weight:700;}
        .bb-calendar-preview-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin-top:8px;}
        .bb-calendar-preview-weekday{text-align:center;color:var(--text-muted);font-size:10px;font-weight:700;padding:4px 0;}
        .bb-calendar-preview-day{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:0;min-height:38px;padding:3px 0;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--text);font-size:13px;}
        .bb-calendar-preview-marker{font-size:9px;line-height:10px;min-height:10px;font-weight:750;}
        .bb-calendar-preview-day.is-today{font-weight:850;border-color:var(--border-strong);background:var(--surface-2);}
        .bb-calendar-preview-day.is-selected{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent);background:rgba(180,92,255,.07);}
        .bb-calendar-preview-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:4px;border:1px solid var(--border);border-radius:13px;background:var(--surface-2);}
        .bb-calendar-preview-filters button{min-height:38px;padding:6px 8px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--text-muted);font:inherit;font-size:var(--text-sm);font-weight:700;}
        .bb-calendar-preview-filters button[aria-pressed="true"]{background:var(--surface);border-color:var(--border);color:var(--text);}
        .bb-calendar-preview-overdue{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;min-height:42px;padding:9px 12px;border:1px solid var(--border);border-radius:12px;background:transparent;color:var(--overdue);font:inherit;font-size:var(--text-xs);font-weight:700;text-align:left;}
        .bb-calendar-preview-listhead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:2px 0 10px;}
        .bb-calendar-preview-listhead h2{margin:0;font-size:var(--text-base);font-weight:800;line-height:1.4;}
        .bb-calendar-preview-listmeta{margin-top:4px;color:var(--text-muted);font-size:var(--text-xs);}
        .bb-calendar-preview-clear{display:flex;align-items:center;justify-content:center;flex:0 0 36px;min-height:36px;padding:0;border:1px solid var(--border);border-radius:999px;background:transparent;color:var(--text);}
        .bb-calendar-preview-page button:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
        .bb-calendar-preview-more{width:100%;min-height:42px;padding:10px 12px;border:0;border-top:1px solid var(--border);background:transparent;color:var(--text);font:inherit;font-size:var(--text-sm);font-weight:700;}
      </style>
      ${renderLegacyPaymentReviewNotice()}
      <section class="card bb-calendar-preview-month" aria-label="Payment calendar">
        <div class="bb-calendar-preview-nav">
          <button type="button" onclick="BillBeaconCalendarPreview.changeMonth(-1)" aria-label="Previous month">${svgIcon("chevronLeft",20)}</button>
          <div class="bb-calendar-preview-title"><span>${escapeHtml(formatDate(s.date,"monthYear"))}</span>
            <button type="button" onclick="BillBeaconCalendarPreview.today()">Today</button></div>
          <button type="button" onclick="BillBeaconCalendarPreview.changeMonth(1)" aria-label="Next month">${svgIcon("chevronRight",20)}</button>
        </div>
        <div class="bb-calendar-preview-grid">
          ${["S","M","T","W","T","F","S"].map(day=>`<span class="bb-calendar-preview-weekday" aria-hidden="true">${day}</span>`).join("")}${cells.join("")}
        </div>
      </section>
      <div class="bb-calendar-preview-filters" role="group" aria-label="Filter calendar payments">
        ${[["all","All"],["unpaid","Unpaid"],["paid","Paid"]].map(([id,label])=>`<button type="button" aria-pressed="${s.filter===id}" onclick="BillBeaconCalendarPreview.filter('${id}')">${label}</button>`).join("")}
      </div>
      ${overdue.length?`<button type="button" class="bb-calendar-preview-overdue" onclick="openDashboardStatusSheet('overdue')" aria-label="View all overdue payments, including earlier months"><span>${overdue.length} Overdue · All Dates</span><span>${formatCurrency(total(overdue.map(bill=>bill.amount)))}</span></button>`:""}
      <section ${s.selected?'class="recurring-calendar-selected-day"':''} aria-label="Calendar payment list">
        <div class="bb-calendar-preview-listhead"><div><h2>${escapeHtml(heading)}</h2>
          <div class="bb-calendar-preview-listmeta">${list.length} ${list.length===1?'Payment':'Payments'} · ${amountLabel} ${formatCurrency(amount)}</div></div>
          ${s.selected?`<button type="button" class="bb-calendar-preview-clear" onclick="BillBeaconCalendarPreview.clearDay()" aria-label="Close selected day">${svgIcon("close",16)}</button>`:""}</div>
        <div class="card">
          ${list.length?list.slice(0,s.expanded?list.length:5).map(row).join(""):`<div style="padding:22px 14px;text-align:center;color:var(--text-muted);font-size:var(--text-sm);">${empty} ${s.selected?'for this day':'for this month'}.</div>`}
          ${list.length>5?`<button type="button" class="bb-calendar-preview-more" onclick="BillBeaconCalendarPreview.expand()" aria-expanded="${s.expanded}">${s.expanded?'Show Less':`Show More (${list.length-5})`}</button>`:""}
        </div>
      </section></div></main>`;
  }
  renderRecurring=function() {
    let html;
    try{html=view();}
    catch(error){console.error("Calendar preview failed; original view retained.",error);return original.apply(this,arguments);}
    const scroll=routeParams.bbCalendarPreviewReturn;
    if(scroll){delete routeParams.bbCalendarPreviewReturn;requestAnimationFrame(()=>{
      if(currentRoute!=="recurring")return;window.scrollTo(0,scroll.window||0);
      const main=document.querySelector("#app .main-content");if(main)main.scrollTop=scroll.main||0;
    });}
    return html;
  };
  window.BillBeaconCalendarPreview={version:1,changeMonth,today,selectDay,clearDay,filter,expand,openBill,
    originalRenderer:original,_test:{state,filteredBills,total,view}};
})();

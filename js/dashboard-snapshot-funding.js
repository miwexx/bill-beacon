/* Bill Beacon BROWSER: Monthly Snapshot by assigned paycheck month.
   Load after the existing Dashboard scripts. Does not change due dates,
   stored payments, Calendar, Insights or the Payment Status counts. */
(() => {
  "use strict";
  if(window.BillBeaconFundingSnapshot)return;
  if(typeof renderToday!=="function"||typeof getPaycheckFundingBills!=="function"||
      typeof getDashboardPaidOccurrences!=="function") {
    console.error("Funding Snapshot: load app.js and bill-splits.js first.");return;
  }
  const before=renderToday;
  const key=value=>financialDateKey(value);
  const month=value=>key(value).slice(0,7);
  const monthDate=value=>{const [y,m]=value.split("-").map(Number);return new Date(y,m-1,1,12);};
  const identity=(id,date)=>JSON.stringify([id,key(date)]);
  const money=values=>values.reduce((sum,value)=>{
    const cents=Math.round(Number(value)*100);
    if(!Number.isSafeInteger(cents)||cents<0)throw new Error("Invalid amount in the funding snapshot.");
    const result=sum+cents;if(!Number.isSafeInteger(result))throw new Error("Funding total is too large.");return result;
  },0)/100;

  function fundingForPaid(item,source) {
    const payments=item.payments||[];
    const original=payments.map(p=>p.originalDueDate||p.billSnapshot?.originalDueDate).find(Boolean)||item.dueDate;
    const overrides=source?.paycheckOccurrenceOverrides||{};
    const direct=overrides[key(original)];
    const moved=direct||Object.values(overrides).find(move=>key(move?.dueDate)===key(item.dueDate));
    if(moved&&/^\d{4}-(0[1-9]|1[0-2])$/.test(moved.month)&&["first","second"].includes(moved.paycheck))
      return moved.month;
    return month(item.dueDate);
  }

  function getFundingSnapshot(referenceDate=new Date()) {
    const target=paycheckMonthKey(referenceDate);
    const sources=new Map([...getArchivedBills(),...Store.getBills()].map(bill=>[bill.id,bill]));
    const seenBills=new Set();
    const bills=getPaycheckFundingBills(referenceDate).filter(bill=>{
      const id=getBillPaymentId(bill),token=identity(id,bill.dueDate);
      if(!id||!key(bill.dueDate)||seenBills.has(token)||getOccurrenceFunding(bill).month!==target)return false;
      seenBills.add(token);return true;
    });
    const unpaid=bills.filter(bill=>!isOccurrencePaid(bill,new Date(bill.dueDate)));
    // Paid records may belong to an older due month but have been assigned to
    // this funding month. Use original payment grouping/snapshots, never new payments.
    const dueMonths=new Set([target]);
    for(const source of sources.values())for(const [original,move]of Object.entries(source.paycheckOccurrenceOverrides||{})) {
      if(move?.month!==target)continue;
      if(month(original))dueMonths.add(month(original));
      if(month(move.dueDate))dueMonths.add(month(move.dueDate));
    }
    bills.forEach(bill=>dueMonths.add(month(bill.dueDate)));
    const seenPaid=new Set(),paid=[];
    for(const dueMonth of dueMonths) {
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(dueMonth))continue;
      for(const item of getDashboardPaidOccurrences(monthDate(dueMonth))) {
        if(fundingForPaid(item,sources.get(item.billId))!==target)continue;
        const token=identity(item.billId,item.dueDate);if(seenPaid.has(token))continue;
        seenPaid.add(token);paid.push(item);
      }
    }
    const historicalPaid=paid.filter(item=>!seenBills.has(identity(item.billId,item.dueDate)));
    const totalCount=paid.length+unpaid.length;
    return {month:target,bills,unpaid,paid,
      remainingTotal:money(unpaid.map(bill=>bill.amount)),
      paidTotal:money(paid.map(item=>item.amount)),
      scheduled:money([...bills.map(bill=>bill.amount),...historicalPaid.map(item=>item.expectedAmount??item.amount)]),
      paidCount:paid.length,totalCount,progress:totalCount?paid.length/totalCount*100:0};
  }

  window.closeFundingSnapshotList=function(){document.getElementById("bbFundingSnapshotContainer")?.remove();};
  window.openFundingSnapshotList=function(kind) {
    if(!["paid","unpaid"].includes(kind))return;
    window.closeFundingSnapshotList();
    const date=new Date(),summary=getFundingSnapshot(date),paid=kind==="paid";
    const items=paid?summary.paid:summary.unpaid;
    const title=paid?"Paid · Paycheck Month":"Remaining · Paycheck Month";
    const total=paid?summary.paidTotal:summary.remainingTotal;
    const rows=items.map(item=>{
      const id=paid?item.billId:getBillPaymentId(item);
      const source=Store.getBill(id)||getArchivedBills().find(bill=>bill.id===id);
      const name=item.name||source?.name||"Removed bill",due=item.dueDate;
      const canOpen=Boolean(source);
      const action=canOpen?`onclick="closeFundingSnapshotList();navigate('detail',{id:'${escapeInlineString(id)}',occurrenceDueDate:'${escapeInlineString(due)}',returnRoute:'today'})"`:"";
      const tag=canOpen?"button":"div";
      return `<${tag} ${canOpen?'type="button"':''} class="bill-row" ${action} style="width:100%;text-align:left;color:var(--text);">
        <span class="bill-info"><span class="bill-name" style="display:block;">${escapeHtml(name)}</span>
        <span class="bill-meta">Original due ${escapeHtml(formatDate(due,"short"))}</span>
        ${paid&&item.paidDate?`<span class="bill-meta" style="color:var(--paid);">Paid ${escapeHtml(formatDate(item.paidDate,"short"))}</span>`:""}</span>
        <span class="bill-amount" style="color:${paid?'var(--paid)':'var(--text)'};">${formatCurrency(item.amount)}</span></${tag}>`;
    }).join("");
    const container=document.createElement("div");container.id="bbFundingSnapshotContainer";
    container.innerHTML=`<div class="sheet-overlay show" onclick="closeFundingSnapshotList()"></div>
      <section class="sheet show" id="bbFundingSnapshotSheet" role="dialog" aria-modal="true" aria-labelledby="bbFundingSnapshotTitle">
        <div class="sheet-handle"></div><div class="sheet-nav">
          <button type="button" class="nav-button" onclick="closeFundingSnapshotList()" aria-label="Back to Dashboard">${svgIcon("chevronLeft",22)}</button>
          <div class="sheet-title" id="bbFundingSnapshotTitle">${title}</div><div style="width:44px;"></div></div>
        <div class="sheet-body"><div class="card card-pad">
          <div style="display:flex;justify-content:space-between;gap:12px;font-weight:750;"><span>${items.length} payments</span><span>${formatCurrency(total)}</span></div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:6px;">Assigned to ${escapeHtml(formatDate(date,"monthYear"))} paycheck plans</div></div>
          <div class="card" style="margin-top:12px;">${rows||'<div style="padding:16px;color:var(--text-muted);">Nothing to show.</div>'}</div>
        </div></section>`;
    document.body.appendChild(container);
    if(typeof fitBillListSheet==="function")fitBillListSheet("bbFundingSnapshotSheet",1);
  };

  renderToday=function() {
    const html=before.apply(this,arguments);
    const holder=document.createElement("div");holder.innerHTML=html;
    const card=holder.querySelector(".dashboard-month-card");if(!card)return html;
    let summary;
    try{summary=getFundingSnapshot(new Date());}
    catch(error){console.error("Funding Snapshot calculation failed; original card retained.",error);return html;}
    const buttons=[...card.querySelectorAll("button")];
    const remaining=buttons.find(button=>/openDashboardStatusSheet\(['"]unpaid['"]\)/.test(button.getAttribute("onclick")||""));
    const paid=buttons.find(button=>/openDashboardPaidSheet\(/.test(button.getAttribute("onclick")||""));
    const amount=remaining?.querySelector(".text-upcoming"),paidAmount=paid?.querySelector(".text-paid");
    // If the base card changes, do not partially rewrite it.
    if(!remaining||!paid||!amount||!paidAmount)return html;
    amount.textContent=formatCurrency(summary.remainingTotal);paidAmount.textContent=formatCurrency(summary.paidTotal);
    remaining.setAttribute("onclick","openFundingSnapshotList('unpaid')");
    paid.setAttribute("onclick","openFundingSnapshotList('paid')");
    remaining.setAttribute("aria-label","View remaining payments assigned to this month's paycheck plans");
    paid.setAttribute("aria-label","View paid payments assigned to this month's paycheck plans");
    card.setAttribute("aria-label","Monthly Snapshot by assigned paycheck month");
    const progress=card.querySelector(".dashboard-progress-fill");if(progress)progress.style.width=`${summary.progress}%`;
    const caption=document.createElement("div");caption.textContent="By paycheck month";
    caption.style.cssText="text-align:center;font-size:10px;color:var(--text-muted);margin-top:5px;";
    const heading=card.querySelector(".dashboard-card-topline");if(heading)heading.insertAdjacentElement("afterend",caption);
    return holder.innerHTML;
  };
  window.addEventListener("billbeacon:signed-out",window.closeFundingSnapshotList);
  window.addEventListener("billbeacon:household-ready",window.closeFundingSnapshotList);
  window.BillBeaconFundingSnapshot={version:1,getSummary:getFundingSnapshot,originalRenderer:before,
    _test:{fundingForPaid}};
})();

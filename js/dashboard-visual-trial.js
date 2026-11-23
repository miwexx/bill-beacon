
(() => {
 'use strict';
 if(window.BillBeaconDashboardVisualTrial)return;
 if(typeof renderToday!=='function'||typeof getPaycheckPlan!=='function'||typeof setDashboardPaycheck!=='function'){
  console.error('Dashboard performance: load core and existing UI scripts first.');return;
 }
 const original=renderToday,beforeSwitch=setDashboardPaycheck;
 let enabled=true,revision=null,epoch=0,recentCache=null,lastNotificationCount=null,switchToken=0;
 const months=new Map(),amounts=new Map();
 const monthKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
 function copy(value,seen=new Map()){
  if(value===null||typeof value!=='object')return value;
  if(value instanceof Date)return new Date(value.getTime());
  if(seen.has(value))return seen.get(value);
  const result=Array.isArray(value)?[]:{};seen.set(value,result);
  for(const [key,item]of Object.entries(value))Object.defineProperty(result,key,{value:copy(item,seen),enumerable:true,writable:true,configurable:true});
  return result;
 }
 function invalidate(){revision=null;recentCache=null;months.clear();amounts.clear();switchToken++;}
 function freshness(){
  const now=new Date(),user=window.getBillBeaconFirebaseUser?.(),context=window.getBillBeaconHouseholdContext?.();
  const next={raw:['bills','payments','archivedBills','incomeSources','settings'].map(key=>localStorage.getItem(key)),
   scope:JSON.stringify([user?.uid||null,context?.uid||null,context?.householdId||null,context?.generation??null,context?.ready??null]),
   day:getLocalDateKey(now),offset:now.getTimezoneOffset(),zone:Intl.DateTimeFormat().resolvedOptions().timeZone||'',
   language:typeof navigator==='undefined'?'':(navigator.languages||[navigator.language]).join('|'),
   refs:[Store.getBills,Store.getBill,Store.getPayments,Store.getPaymentsForBill,Store.getIncomeSources,Store.getSettings,
    getArchivedBills,getDashboardMonthSummary,getPaycheckPlan,getPaycheckFundingBills,getOccurrenceFunding,
    isOccurrencePaid,getOccurrencePaidAmount,getActivePaymentForOccurrence,getPaycheckLeftoverEstimate,
    getTotalIncomeForPayCycle,bbLFExpenses,bbProcessingSplit,isOccurrenceProcessing,
    renderDashboardSeparatedStatus,getDashboardSeparatedStatus,renderPaycheckDueAndLeftover,
    renderPaycheckInlineRows,getPaycheckBillStatusLabel,getCategory]};
  const same=revision&&revision.scope===next.scope&&revision.day===next.day&&revision.offset===next.offset&&
   revision.zone===next.zone&&revision.language===next.language&&next.raw.every((value,index)=>revision.raw[index]===value)&&
   next.refs.every((value,index)=>revision.refs[index]===value);
  if(!same){invalidate();revision=next;epoch++;}
 }
 function keep(map,key,value,limit){map.delete(key);map.set(key,value);if(map.size>limit)map.delete(map.keys().next().value);return value;}
 function monthData(date){
  const key=monthKey(date);
  if(months.has(key)){const value=months.get(key);months.delete(key);months.set(key,value);return value;}
  const summary=getDashboardMonthSummary(date),plan=getPaycheckPlan(date);
  return keep(months,key,{summary,plan,statusHTML:null},3);
 }
 function amountsHTML(selected, date, paidCents) {
  const key = monthKey(date) + ":" + selected.id;

  if (amounts.has(key)) return amounts.get(key);

  const template = document.createElement("template");

  template.innerHTML =
    renderPaycheckDueAndLeftover(selected);

  const row = template.content.firstElementChild;
  const leftoverColumn = row?.lastElementChild;
  const labelBox = leftoverColumn?.firstElementChild;
  const valueBox = labelBox?.nextElementSibling;

  const label = labelBox
    ?.querySelector("span")
    ?.textContent.trim();

  if (
    !row ||
    !valueBox ||
    !["Leftover", "Shortfall"].includes(label)
  ) {
    throw new Error(
      "Dashboard amount layout changed; " +
      "keeping the original fallback."
    );
  }

  const helpButton = labelBox.querySelector("button");

  const notes = [...leftoverColumn.children]
    .slice(2)
    .map(note => `
      <span
        style="
          flex-basis:100%;
          font-size:var(--text-xs);
          color:${
            note.style.color || "var(--text-muted)"
          };
        "
      >
        ${escapeHtml(note.textContent.trim())}
      </span>
    `)
    .join("");

  const leftover = `
    <span
      style="
        display:inline-flex;
        align-items:center;
        flex-wrap:wrap;
        gap:2px 4px;
        min-width:0;
      "
    >
      <span>${escapeHtml(label)}:</span>

      <span
        style="
          color:${valueBox.style.color || "inherit"};
          font-variant-numeric:tabular-nums;
        "
      >
        ${valueBox.innerHTML}
      </span>

      ${helpButton ? helpButton.outerHTML : ""}

      ${notes}
    </span>
  `;

  const paid = document.createElement("div");

  paid.style.cssText = "min-width:0;text-align:right;";

  paid.innerHTML = `
    <div
      style="
        min-height:36px;
        display:flex;
        align-items:center;
        justify-content:flex-end;
        font-size:var(--text-sm);
        font-weight:700;
        color:var(--text-secondary);
      "
    >
      Paid
    </div>

    <div
      style="
        font-size:clamp(19px,5.5vw,26px);
        font-weight:800;
        line-height:1.2;
        font-variant-numeric:tabular-nums;
        overflow-wrap:anywhere;
        color:var(--paid);
      "
    >
      ${
        Number.isSafeInteger(paidCents) && paidCents >= 0
          ? formatCurrency(paidCents / 100)
          : "&mdash;"
      }
    </div>
  `;

  leftoverColumn.replaceWith(paid);

  return keep(
    amounts,
    key,
    {
      row: template.innerHTML,
      leftover
    },
    6
  );
 }
 function monthlyHTML(date){
  const data=monthData(date);
  if(data.statusHTML!==null)return data.statusHTML;
  let status=renderDashboardSeparatedStatus(date,copy(data.summary));
  const compact=/class=["'][^"']*\bbb-payment-status-title\b/.test(status);
  if(compact)status=status.replace('>Payment Status</h2>','>Monthly Status</h2>');
  const header=compact?'':`<header class="bb-layout-monthly-heading"><h2 id="bbLayoutMonthlyStatusTitle">Monthly Status</h2><span>${escapeHtml(formatDate(date,'monthYear'))}</span></header>`;
  const label=compact?'aria-label="Monthly Status"':'aria-labelledby="bbLayoutMonthlyStatusTitle"';
  data.statusHTML=`<section class="card bb-dashboard-monthly-status-card" ${label}>${header}<section class="dashboard-month-card" aria-label="Monthly Bills And Installments Payment Status" style="display:block;width:100%;height:auto;min-height:0;box-sizing:border-box;text-align:left;">${status}</section></section>`;
  return data.statusHTML;
 }
  function buildRecent(){
  const allBillsById = new Map(
    getArchivedBills().map(bill => [bill.id, bill])
  );

  for (const bill of Store.getBills()) {
    allBillsById.set(bill.id, bill);
  }

  const recentPayments = Store.getPayments()
    .map(payment => ({
      ...payment,
      bill: allBillsById.get(payment.billId) || null
    }))
    .sort((a, b) =>
      (dashboardDate(b.voidedAt || b.paidDate)?.getTime() || 0) -
      (dashboardDate(a.voidedAt || a.paidDate)?.getTime() || 0)
    )
    .slice(0, 3);


  const recentRows = recentPayments.map(payment => {
    const voided = payment.status === "voided";
    const removed = !Store.getBill(payment.billId);

    const name =
      payment.billSnapshot?.name ||
      payment.bill?.name ||
      "Removed bill";

    const shownDate = payment.voidedAt || payment.paidDate;
    const dateLabel = shownDate
      ? formatDate(shownDate, "full")
      : "Date unavailable";

    return `
      <div
        class="recent-payment-row"
        style="${voided ? "opacity:.58;" : ""}"
      >
        <div
          class="recent-payment-icon"
          style="color:${
            voided ? "var(--text-muted)" : "var(--paid)"
          };"
        >
          ${svgIcon(voided ? "close" : "checkCircle", 18)}
        </div>

        <div class="bill-info">
          <div class="bill-name">
            ${escapeHtml(name)}${voided ? " · Voided" : ""}
          </div>

          <div class="bill-meta">
            ${voided ? "Payment Voided" : "Paid"}
            · ${escapeHtml(dateLabel)}
          </div>

          ${
            removed
              ? `
                <div
                  class="bill-meta"
                  style="color:var(--overdue);"
                >
                  Removed · History Retained
                </div>
              `
              : ""
          }
        </div>

        <div
          class="recent-payment-amount"
          style="${
            voided
              ? "text-decoration:line-through;color:var(--text-muted);"
              : ""
          }"
        >
          ${formatCurrency(payment.amount)}
        </div>
      </div>
    `;
  }).join("");
    return {payments:recentPayments,rows:recentRows};
  }
function navigationHTML() {
  const date = getDashboardReportMonth();
  return `
    <div class="bb-paycheck-month-navigation" style="display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:8px;">
      <button type="button" class="bb-outline-pill" aria-label="Previous reporting month"
        onclick="changeDashboardReportMonth(-1)"
        style="display:flex;align-items:center;justify-content:center;width:44px;min-height:44px;padding:0;box-sizing:border-box;">
        ${svgIcon("chevronLeft", 20)}
      </button>
      <div aria-live="polite" style="min-width:0;text-align:center;font-size:var(--text-base);font-weight:800;line-height:1.3;">
        ${formatDate(date, "monthYear")}
      </div>
      <button type="button" class="bb-outline-pill" aria-label="Next reporting month"
        onclick="changeDashboardReportMonth(1)"
        style="display:flex;align-items:center;justify-content:center;width:44px;min-height:44px;padding:0;box-sizing:border-box;">
        ${svgIcon("chevronRight", 20)}
      </button>
    </div>
  `;
}function paycheckHTML(
  referenceDate = getDashboardPaycheckMonth()
) {
  freshness();
  const plan = copy(monthData(referenceDate).plan);
    const displayedMonthKey =
    `${referenceDate.getFullYear()}-` +
    String(referenceDate.getMonth() + 1).padStart(2, "0");

  const displayedMonthChanged =
    dashboardPaycheckSelectionMonthKey !== displayedMonthKey;

  if (
    displayedMonthChanged ||
    !selectedDashboardPaycheck
  ) {
    selectedDashboardPaycheck =
      getDashboardPaycheckDefaultCycle();

    dashboardPaycheckSelectionMonthKey =
      displayedMonthKey;
  }
  const selectedKey =
    selectedDashboardPaycheck === "second" ? "second" : "first";

  const selected = plan[selectedKey];

  const firstLabel = formatDate(plan.first.payday, "short");
  const secondLabel = formatDate(plan.second.payday, "short");

  const cents = value => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(value), rounded = Math.round(number * 100);
    return Number.isFinite(number) && number >= 0 && Number.isSafeInteger(rounded) ? rounded : null;
  };
  const paidCents = cents(selected.paid);
  const scheduledCents = cents(selected.scheduled);
  const validTotals = paidCents !== null && scheduledCents !== null;
  const paymentProgress = validTotals && scheduledCents > 0
    ? Math.max(0, Math.min(100, paidCents / scheduledCents * 100)) : 0;
      const amountParts = amountsHTML(
    selected,
    referenceDate,
    paidCents
  );


    return `
    

    <div class="card card-pad bb-dashboard-paycheck-plan" style="padding:0!important;margin:0!important;border:0!important;outline:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;">
      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
          margin-bottom:var(--space-3);
        "
      >
        <button
          type="button"
          onclick="setDashboardPaycheck('first')"
          style="
            min-height:42px;
            border:1px solid ${
              selectedKey === "first"
                ? "var(--accent)"
                : "var(--border)"
            };
            border-radius:12px;
            background:${
              selectedKey === "first"
                ? "var(--accent-soft, rgba(124,92,255,.14))"
                : "transparent"
            };
            color:var(--text);
            font:inherit;
            font-size:var(--text-sm);
            font-weight:800;
            cursor:pointer;
          "
        >
          PAYCHECK · ${firstLabel}
        </button>

        <button
          type="button"
          onclick="setDashboardPaycheck('second')"
          style="
            min-height:42px;
            border:1px solid ${
              selectedKey === "second"
                ? "var(--accent)"
                : "var(--border)"
            };
            border-radius:12px;
            background:${
              selectedKey === "second"
                ? "var(--accent-soft, rgba(124,92,255,.14))"
                : "transparent"
            };
            color:var(--text);
            font:inherit;
            font-size:var(--text-sm);
            font-weight:800;
            cursor:pointer;
          "
        >
          PAYCHECK · ${secondLabel}
        </button>
      </div>

      ${amountParts.row}

      ${validTotals ? `
        <div class="dashboard-progress-track"
          role="progressbar"
          aria-label="Payment Progress For Assigned Bills"
          aria-valuemin="0" aria-valuemax="100"
          aria-valuenow="${Math.round(paymentProgress * 10) / 10}"
          aria-valuetext="${escapeHtml(scheduledCents > 0
            ? `${formatCurrency(paidCents / 100)} Paid Of ${formatCurrency(scheduledCents / 100)} Scheduled`
            : 'No Scheduled Amount')}"
          style="height:6px;min-height:6px;max-height:6px;margin-top:14px;overflow:hidden;border-radius:999px;">
          <div class="dashboard-progress-fill"
            style="width:${paymentProgress}%;height:100%;min-height:6px;border-radius:inherit;"></div>
        </div>
      ` : `<div style="margin-top:10px;color:var(--text-muted);font-size:var(--text-xs);">Payment Progress Unavailable</div>`}

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          flex-wrap:wrap;
          gap:4px 12px;
          margin-top:7px;
          color:var(--text-muted);
          font-size:var(--text-xs);
          line-height:1.4;
          font-variant-numeric:tabular-nums;
        "
      >
        ${amountParts.leftover}

        <span>
          ${
            scheduledCents === null
              ? "&mdash;"
              : formatCurrency(scheduledCents / 100)
          }
          Scheduled
        </span>
      </div>

      ${renderPaycheckInlineRows(selected)}
    </div>
  `;
}  function view(){
    freshness();
    const now=new Date(),reportMonth=getDashboardReportMonth();
    const currentDateLabel=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(now);
    if(!recentCache)recentCache=buildRecent();
    const recentPayments=recentCache.payments,recentRows=recentCache.rows;
    const notificationCount=getNotificationCount();lastNotificationCount=notificationCount;
  return `
    <div class="nav-bar dashboard-nav">
      <div class="nav-bar-content">
        <button
          type="button"
          class="nav-button dashboard-icon-button"
          onclick="navigate('settings', { returnRoute: 'today' })"
          aria-label="Open settings"
          style="color:var(--text-muted);"
        >
          ${svgIcon("gear", 22)}
        </button>

        <div class="dashboard-date">
          ${escapeHtml(currentDateLabel)}
        </div>

        <button
          type="button"
          class="nav-button dashboard-icon-button"
          onclick="openNotificationCenter()"
          aria-label="Open notifications"
          style="position:relative;color:var(--text-muted);"
        >
          ${svgIcon("bell", 22)}

          ${
            notificationCount > 0
              ? `
                <span style="
                  position:absolute;
                  top:-3px;
                  right:0;
                  min-width:17px;
                  padding:1px 4px;
                  border-radius:999px;
                  background:var(--overdue);
                  color:#fff;
                  font-size:10px;
                  font-weight:800;
                ">
                  ${notificationCount > 9 ? "9+" : notificationCount}
                </span>
              `
              : ""
          }
        </button>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad dashboard-content">
        ${renderLegacyPaymentReviewNotice()}

        <style>${CSS}</style>
        <div class="bb-dashboard-split-layout" data-bb-dashboard-epoch="${epoch}" data-bb-dashboard-month="${monthKey(reportMonth)}">
          <div class="card bb-dashboard-paycheck-card" aria-label="Paycheck plan and reporting month">
            ${navigationHTML()}
            <div class="bb-dashboard-paycheck" aria-label="Paycheck Plan">${paycheckHTML()}</div>
          </div>
          ${monthlyHTML(reportMonth)}
        </div>
        <div class="dashboard-section-title-row">
          <div class="section-header dashboard-section-header">
            Recent Payments
          </div>

          ${
            recentPayments.length
              ? `
                <button
                  type="button"
                  class="bb-outline-pill"
                  style="
                    min-height:34px;
                    padding:0 12px;
                    font-size:var(--text-xs);
                  "
                  onclick="navigate('history')"
                >
                  <span>See All</span>
                  <span class="pill-chevron">
                    ${svgIcon("chevronRight", 14)}
                  </span>
                </button>
              `
              : ""
          }
        </div>

        ${
          recentPayments.length
            ? `<div class="card">${recentRows}</div>`
            : `
              <div class="dashboard-empty-card">
                ${svgIcon("tray", 22)}
                <span>
                  Payments you mark as paid will appear here
                </span>
              </div>
            `
        }
      </div>
    </div>
  `;
}
 const CSS=`
    .bb-dashboard-split-layout {display:grid;gap:16px;min-width:0;}
    .bb-dashboard-split-layout > .bb-dashboard-paycheck-card,
    .bb-dashboard-split-layout > .bb-dashboard-monthly-status-card {
      min-width:0;margin:0!important;padding:16px!important;overflow:hidden;
    }
    .bb-dashboard-paycheck-card > .bb-paycheck-month-navigation {margin-bottom:14px;}
    .bb-dashboard-paycheck-card > .bb-dashboard-paycheck {
      border:0!important;padding:0!important;min-width:0;
    }
    .bb-dashboard-paycheck-card > .bb-dashboard-paycheck > .card {
      padding:0!important;margin:0!important;border:0!important;
      box-shadow:none!important;background:transparent!important;
    }
    .bb-dashboard-monthly-status-card > .dashboard-month-card {
      display:block;width:100%;min-width:0;height:auto;min-height:0;
      padding:0!important;margin:0!important;border:0!important;border-radius:0!important;
      box-shadow:none!important;background:transparent!important;
    }
    .bb-dashboard-monthly-status-card .bb-dashboard-payment-status {
      margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important;
    }
    .bb-dashboard-monthly-status-card > .dashboard-month-card::before,
    .bb-dashboard-monthly-status-card > .dashboard-month-card::after,
    .bb-dashboard-paycheck-card .bb-dashboard-paycheck-plan::before,
    .bb-dashboard-paycheck-card .bb-dashboard-paycheck-plan::after {content:none!important;display:none!important;}
    .bb-dashboard-paycheck-card .bb-dashboard-paycheck-plan {
      border:0!important;border-image:none!important;outline:0!important;
      border-radius:0!important;box-shadow:none!important;background:transparent!important;
    }
    .bb-dashboard-monthly-status-card .bb-layout-monthly-heading {
      display:flex;align-items:baseline;justify-content:space-between;gap:12px;
      margin:0 0 8px;
    }
    .bb-dashboard-monthly-status-card .bb-layout-monthly-heading h2 {
      margin:0;font-size:var(--text-base);font-weight:800;line-height:1.4;color:var(--text);
    }
    .bb-dashboard-monthly-status-card .bb-layout-monthly-heading span {
      font-size:var(--text-xs);color:var(--text-muted);line-height:1.4;text-align:right;
    }
 `;

 renderToday=function(){
  if(!enabled)return original.apply(this,arguments);
  try{return view();}
  catch(error){invalidate();console.warn('Dashboard performance retained the original error fallback:',error);return original.apply(this,arguments);}
 };
 setDashboardPaycheck=function(paycheckKey){
  if(!enabled||currentRoute!=='today')return beforeSwitch.apply(this,arguments);
  const host=document.querySelector('#app .bb-dashboard-paycheck');
  const wrapper=host?.closest('.bb-dashboard-split-layout');
  if(!host||!wrapper)return beforeSwitch.apply(this,arguments);
  try{freshness();}
  catch(error){return beforeSwitch.apply(this,arguments);}
  const month=monthKey(getDashboardReportMonth());
  if(wrapper.dataset.bbDashboardEpoch!==String(epoch)||wrapper.dataset.bbDashboardMonth!==month||
     getNotificationCount()!==lastNotificationCount)return beforeSwitch.apply(this,arguments);
  capturePaycheckInlineView();
  const target=paycheckKey==='second'?'second':'first';
  const main=document.querySelector('#app .main-content');
  const scroll={window:window.scrollY||0,main:main?.scrollTop||0};
  const focus=host.contains(document.activeElement);
  selectedDashboardPaycheck=target;
  const token=++switchToken,stamp=revision;
  try{
   const html=paycheckHTML();
   host.innerHTML=html;
   restorePaycheckInlineView();
   if(focus)host.querySelector(`button[onclick="setDashboardPaycheck('${target}')"]`)?.focus({preventScroll:true});
   requestAnimationFrame(()=>{
    if(token!==switchToken||revision!==stamp||currentRoute!=='today'||selectedDashboardPaycheck!==target||
       monthKey(getDashboardReportMonth())!==month)return;
    window.scrollTo(0,scroll.window);
    const current=document.querySelector('#app .main-content');
    if(current&&current===main)current.scrollTop=scroll.main;
   });
  }catch(error){invalidate();console.warn('Dashboard paycheck update used full render:',error);render();}
 };
 for(const event of ['billbeacon:data-changed','billbeacon:signed-out','billbeacon:authenticated','billbeacon:household-ready'])window.addEventListener(event,invalidate);
 window.addEventListener('storage',event=>{if(event.key===null||['bills','payments','archivedBills','incomeSources','settings'].includes(event.key))invalidate();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')invalidate();});
 function redrawIfVisible(){if(typeof currentRoute!=='undefined'&&currentRoute==='today'&&document.querySelector('#app .dashboard-content')&&typeof render==='function')render();}
 window.BillBeaconDashboardVisualTrial=Object.freeze({version:3,performancePhase:4,
  setEnabled(value){enabled=Boolean(value);redrawIfVisible();},isEnabled(){return enabled;},
  _test:{view,model:date=>{freshness();return copy(monthData(date||getDashboardReportMonth()));},
   cacheSizes:()=>({months:months.size,amounts:amounts.size,recent:!!recentCache,epoch})}});
})();

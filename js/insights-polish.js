/* Bill Beacon Insights performance phase 3 (v2).
   Replaces insights-polish.js. Direct final renderer; the old renderer is used only on error.
   No financial writes, network calls, or detached-DOM rewriting. */
(() => {
  'use strict';
  if(window.BillBeaconInsightsPolish)return;
  if(typeof renderInsights!=='function'||typeof getDashboardMonthSummary!=='function'||
     typeof getMonthlyCategoryPayments!=='function'||typeof bbInsightSplit!=='function') {
    console.error('Insights performance: load app.js and the existing UI scripts first.');return;
  }
  const original=renderInsights;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const moneyCents=value=>{
    if(value===null||value===undefined||value===''||typeof value==='boolean')throw new Error('Missing payment amount');
    const amount=Number(value),rounded=Math.round(amount*100);
    if(!Number.isFinite(amount)||amount<0||!Number.isSafeInteger(rounded))throw new Error('Invalid payment amount');
    return rounded;
  };
  const finite=value=>{const amount=Number(value);if(!Number.isFinite(amount))throw new Error('Unavailable financial total');return amount;};
  const monthKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const monthName=date=>date.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const cash=cents=>formatCurrency(cents/100);
  let revision=null,prepared=null;
  const paidMonths=new Map(),summaryMonths=new Map();
  function invalidate(){revision=null;prepared=null;paidMonths.clear();summaryMonths.clear();}
  function freshness(){
    const now=new Date(),user=window.getBillBeaconFirebaseUser?.(),context=window.getBillBeaconHouseholdContext?.();
    const next={raw:['bills','payments','archivedBills','incomeSources','settings'].map(key=>localStorage.getItem(key)),
      scope:JSON.stringify([user?.uid||null,context?.uid||null,context?.householdId||null,context?.generation??null,context?.ready??null]),
      day:getLocalDateKey(now),offset:now.getTimezoneOffset(),zone:Intl.DateTimeFormat().resolvedOptions().timeZone||'',
      language:typeof navigator==='undefined'?'':(navigator.languages||[navigator.language]).join('|'),
      refs:[Store.getBills,Store.getPayments,Store.getPaymentsForBill,Store.getIncomeSources,Store.getSettings,
        getDashboardMonthSummary,getMonthlyCategoryPayments,bbInsightSplit,bbInsightIsInstallment,bbInsightMoneyCents,getMonthlyIncomeEstimate,
        getTotalMonthlyIncomeEstimate,getMonthlySpendingLimit,getCalendarBillsForMonth,getDashboardPaidOccurrences,
        isOccurrencePaid,getActivePaymentForOccurrence,getCategory,getBillPaymentId,getLocalDateKey]};
    const same=revision&&revision.scope===next.scope&&revision.day===next.day&&revision.offset===next.offset&&
      revision.zone===next.zone&&revision.language===next.language&&next.raw.every((value,index)=>revision.raw[index]===value)&&
      next.refs.every((value,index)=>revision.refs[index]===value);
    if(!same){invalidate();revision=next;}
  }
  function keep(map,key,value,limit){map.delete(key);map.set(key,value);if(map.size>limit)map.delete(map.keys().next().value);return value;}
  function paymentData(date){
    const key=monthKey(date);
    if(paidMonths.has(key)){const value=paidMonths.get(key);paidMonths.delete(key);paidMonths.set(key,value);return value;}
    const items=getMonthlyCategoryPayments(date);
    if(!Array.isArray(items))throw new Error('Invalid monthly payments');
    const totals={bills:0,installments:0,total:0},categories=new Map();
    for(const item of items){
      const amount=moneyCents(item.amount),group=bbInsightIsInstallment(item)?'installments':'bills';
      totals[group]+=amount;totals.total+=amount;
      if(!Number.isSafeInteger(totals.total))throw new Error('Payment total exceeds supported range');
      categories.set(item.categoryId,(categories.get(item.categoryId)||0)+amount);
    }
    return keep(paidMonths,key,{totals,categories:[...categories].map(([id,cents])=>[id,cents/100]).sort((a,b)=>b[1]-a[1])},6);
  }
  function splitFromSummary(summary){
    const seen=new Set(),items=[];
    for(const bill of summary.bills){
      if(bill.cancelledAt||['cancelled','canceled'].includes(String(bill.status||'').toLowerCase()))continue;
      const key=`${getBillPaymentId(bill)}:${getLocalDateKey(bill.dueDate)}`;
      if(seen.has(key))continue;seen.add(key);items.push({bill,expectedAmount:bill.amount});
    }
    for(const paid of summary.paid){if(seen.has(paid.key))continue;seen.add(paid.key);items.push(paid);}
    const value=bbInsightSplit(items,true);
    if(!value||!['bills','installments','total'].every(key=>Number.isSafeInteger(value[key])&&value[key]>=0)||value.bills+value.installments!==value.total)throw new Error('Invalid scheduled totals');
    return value;
  }
  function summaryData(date){
    const key=monthKey(date);
    if(summaryMonths.has(key)){const value=summaryMonths.get(key);summaryMonths.delete(key);summaryMonths.set(key,value);return value;}
    const source=getDashboardMonthSummary(date);
    if(!source||!Array.isArray(source.bills)||!Array.isArray(source.paid))throw new Error('Monthly summary unavailable');
    return keep(summaryMonths,key,{scheduled:finite(source.scheduled),paid:finite(source.paidTotal),split:splitFromSummary(source)},3);
  }
  function model(date=new Date()){
    freshness();const key=monthKey(date);
    if(prepared?.key===key)return prepared;
    const currentSummary=summaryData(date),currentPayments=paymentData(date);
    const history=Array.from({length:6},(_,i)=>{
      const month=new Date(date.getFullYear(),date.getMonth()-5+i,1,12);
      return {month,total:paymentData(month).totals.total,current:i===5};
    });
    const schedules=Array.from({length:3},(_,i)=>{
      const month=new Date(date.getFullYear(),date.getMonth()+i,1,12);return {month,totals:summaryData(month).split};
    });
    const income=finite(getTotalMonthlyIncomeEstimate()),limit=finite(getMonthlySpendingLimit()),paid=currentSummary.paid;
    prepared={key,income,scheduled:currentSummary.scheduled,remainder:income-currentSummary.scheduled,
      paid,limit,limitRemaining:Math.max(limit-paid,0),limitPercent:limit>0?Math.min(paid/limit*100,100):0,
      overLimit:limit>0&&paid>limit,totals:currentPayments.totals,categories:currentPayments.categories,history,schedules};
    return prepared;
  }
  function section(title,body){return `<section class="bbip-section"><h2 class="section-header">${esc(title)}</h2><div class="card card-pad">${body}</div></section>`;}
  function paymentsHTML(date,totals){
    const share=totals.total?totals.bills/totals.total*100:0;
    return section('Payments Recorded',`
      <p class="bbip-note">Recorded payments toward bills and installments due in ${esc(monthName(date))}.</p>
      <div class="bbip-payment-row"><span><i class="bbip-dot bbip-bill-color"></i>Bills</span><strong>${esc(cash(totals.bills))}</strong></div>
      <div class="bbip-payment-row"><span><i class="bbip-dot bbip-plan-color"></i>Installments</span><strong>${esc(cash(totals.installments))}</strong></div>
      <div class="bbip-total"><span>Total recorded</span><strong>${esc(cash(totals.total))}</strong></div>
      ${totals.total?`<div class="bbip-composition" role="img" aria-label="Composition of recorded payments: bills ${Math.round(share)} percent; installments ${Math.round(100-share)} percent"><span class="bbip-bill-color" style="width:${share}%"></span><span class="bbip-plan-color" style="width:${100-share}%"></span></div><p class="bbip-caption">Bills versus installments—not completion progress.</p>`:'<p class="bbip-note">No qualifying payments recorded for this due month.</p>'}
    `);
  }
  function scheduledHTML(schedules){
    const rows=schedules.map(({month,totals:value})=>`<div class="bbip-schedule-row"><div><strong>${esc(monthName(month))}</strong><strong>${esc(cash(value.total))}</strong></div><p class="bbip-note">Bills ${esc(cash(value.bills))} · Installments ${esc(cash(value.installments))}</p></div>`).join('');
    return section('Next Three Months','<p class="bbip-note">Based on saved schedules. Includes paid and unpaid commitments, not just balances still due.</p>'+rows);
  }
  function barHeights(values,height=136){const max=Math.max(0,...values);return values.map(value=>max?value/max*height:0);}
  function historyHTML(date,items){
    const heights=barHeights(items.map(item=>item.total));
    if(!items.some(item=>item.total))return section('Payment History','<p class="bbip-note">No qualifying payments recorded for these six due months yet.</p>');
    return section('Payment History',`
      <p class="bbip-note">Six due months · ${esc(items[0].month.toLocaleDateString(undefined,{month:'short',year:'numeric'}))}–${esc(date.toLocaleDateString(undefined,{month:'short',year:'numeric'}))}</p>
      <div class="bbip-chart-scroll"><div class="bbip-chart" role="list" aria-label="Recorded payments by bill due month">
      ${items.map((item,i)=>`<div class="bbip-chart-column" role="listitem" aria-label="${esc(monthName(item.month))}: ${esc(cash(item.total))}${item.current?'; month in progress':''}"><div class="bbip-chart-amount">${esc(cash(item.total))}</div><div class="bbip-chart-track"><div class="bbip-chart-bar ${item.current?'is-current':''}" style="height:${heights[i].toFixed(3)}px"></div></div><div class="bbip-chart-label">${esc(item.month.toLocaleDateString(undefined,{month:'short'}))}</div><div class="bbip-chart-state">${item.current?'In progress':''}</div></div>`).join('')}
      </div></div>
      <p class="bbip-note">Uses the bill’s due month, not the payment’s transaction month. The current month is unfinished; historical totals can change when payments are recorded or reversed.</p>
    `);
  }
  function summaryHTML(m,date){
    const estimatedMonthlyIncome=m.income,scheduledThisMonth=m.scheduled,estimatedRemaining=m.remainder;
    return `        <section class="card card-pad insights-leftover-card"
          aria-label="Monthly plan: expected income minus scheduled commitments">
          <div class="insights-leftover-top">
            <div class="insights-leftover-column">
              <div class="insights-leftover-label">Expected Income</div>
              <div class="insights-leftover-amount">
                ${estimatedMonthlyIncome > 0 ? formatCurrency(estimatedMonthlyIncome) : "Not set"}
              </div>
            </div>
            <div class="insights-leftover-column insights-leftover-right">
              <div class="insights-leftover-label">Scheduled commitments</div>
              <div class="insights-leftover-amount">${formatCurrency(scheduledThisMonth)}</div>
            </div>
          </div>
          <div class="insights-leftover-result">
            <div class="insights-leftover-result-heading">
              <div class="insights-leftover-result-label">
                ${estimatedMonthlyIncome > 0 && estimatedRemaining < 0 ? "Planned shortfall" : "Planned remainder"}
              </div>
              <div class="insights-leftover-result-amount" style="color:${estimatedMonthlyIncome <= 0 ? "var(--text-muted)" : estimatedRemaining < 0 ? "var(--overdue)" : "var(--paid)"}">
                ${estimatedMonthlyIncome > 0 ? formatCurrency(Math.abs(estimatedRemaining)) : "—"}
              </div>
            </div>
          </div>
          <details class="bbip-explanation"><summary>How this estimate works</summary><p>Expected income minus this month’s tracked scheduled bills and installments, including those already paid. This is not your bank balance or a complete spending budget. Set up expected income in Settings if it is not available.</p></details>
        </section>`;
  }
  function limitHTML(m,date){
    const now=date,monthlyLimit=m.limit,paidThisMonth=m.paid,remainingLimit=m.limitRemaining,limitPercent=m.limitPercent,isOverLimit=m.overLimit;
    return `        ${
          monthlyLimit > 0
            ? `
              <div>
                <div class="section-header">Monthly Spending Limit</div>

                <div class="card card-pad">
                  <div
                    style="
                      display:flex;
                      justify-content:space-between;
                      align-items:baseline;
                      gap:var(--space-3);
                    "
                  >
                    <div>
                      <div
                        style="
                          font-size:var(--text-sm);
                          color:var(--text-muted);
                        "
                      >
                        Paid toward ${formatDate(now, "monthYear")} payments
                      </div>

                      <div
                        style="
                          font-size:var(--text-xl);
                          font-weight:800;
                          color:${
                            isOverLimit
                              ? "var(--overdue)"
                              : "var(--text)"
                          };
                          margin-top:4px;
                        "
                      >
                        ${formatCurrency(paidThisMonth)}
                      </div>
                    </div>

                    <div style="text-align:right">
                      <div
                        style="
                          font-size:var(--text-sm);
                          color:var(--text-muted);
                        "
                      >
                        Limit
                      </div>

                      <div
                        style="
                          font-size:var(--text-xl);
                          font-weight:800;
                          margin-top:4px;
                        "
                      >
                        ${formatCurrency(monthlyLimit)}
                      </div>
                    </div>
                  </div>

                  <div
                    class="dashboard-progress-track"
                    style="margin-top:var(--space-3)"
                  >
                    <div
                      class="dashboard-progress-fill"
                      style="
                        width:${limitPercent}%;
                        background:${
                          isOverLimit
                            ? "var(--overdue)"
                            : "var(--accent)"
                        };
                      "
                    ></div>
                  </div>

                  <div
                    style="
                      margin-top:8px;
                      font-size:var(--text-xs);
                      color:${
                        isOverLimit
                          ? "var(--overdue)"
                          : "var(--text-muted)"
                      };
                    "
                  >
                    ${
                      isOverLimit
                        ? `${formatCurrency(
                            paidThisMonth - monthlyLimit
                          )} over your monthly limit`
                        : `${formatCurrency(remainingLimit)} remaining`
                    }
                  </div>
                </div>
              </div>
            `
            : ""
        }
`;
  }
  function categoryHTML(m){
    const catEntries=m.categories,maxCat=catEntries.length?catEntries[0][1]:1;
    return `        <div>
          <div class="section-header">Payments by Group</div>

          <div class="card card-pad"><p class="bbip-note">Existing payment grouping is preserved. Installments are a payment type; other labels use the app’s saved categories.</p>
            ${
              catEntries.length === 0
                ? `
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      ${svgIcon("pieChart", 40)}
                    </div>

                    <div class="empty-state-text">
                      No payments this month yet.
                    </div>
                  </div>
                `
                : catEntries
                    .map(([categoryId, total]) => {
                      const category = getCategory(categoryId);

                      return `
                        <button
                          type="button"
                          class="h-chart-row"
                          onclick="openCategorySpendingSheet('${escapeInlineString(categoryId)}')"
                          aria-label="View ${escapeHtml(
                            category.label
                          )} spending details"
                          style="
                            width:100%;
                            border:0;
                            background:transparent;
                            color:inherit;
                            padding:8px 0;
                            cursor:pointer;
                            text-align:left;
                          "
                        >
                          <div class="h-chart-label">
                            ${escapeHtml(category.label)}
                          </div>

                          <div class="h-chart-bar-bg">
                            <div
                              class="h-chart-bar-fill"
                              style="
                                width:${(total / maxCat) * 100}%;
                                background:var(--${category.color});
                              "
                            ></div>
                          </div>

                          <div class="h-chart-value">
                            ${formatCurrency(total)}
                          </div>
                        </button>
                      `;
                    })
                    .join("")
            }
          </div>
        </div>

`;
  }
  const CSS=`
    .bbip-section .section-header{margin:0;}
    .bbip-section .card-pad{padding:16px 18px;}
    .bbip-note{margin:0;color:var(--text-secondary);font-size:var(--text-xs,11px);line-height:1.6;}
    .bbip-caption{margin:9px 0 0;color:var(--text-secondary);font-size:var(--text-xs,11px);line-height:1.5;}
    .bbip-payment-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;}
    .bbip-payment-row>span{display:flex;align-items:center;gap:8px;}
    .bbip-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex:0 0 8px;}
    .bbip-bill-color{background:var(--paid,#00D4AA);}
    .bbip-plan-color{background:var(--accent,#b45cff);}
    .bbip-total{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:13px;margin-top:2px;border-top:1px solid var(--border);font-weight:750;}
    .bbip-composition{display:flex;height:8px;overflow:hidden;border-radius:99px;margin-top:14px;background:var(--surface-2);}
    .bbip-composition>span{display:block;flex:none;height:100%;}
    .bbip-schedule-row{padding:14px 0;}
    .bbip-schedule-row+.bbip-schedule-row{border-top:1px solid var(--border);}
    .bbip-schedule-row>div{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:var(--text-sm,13px);}
    .bbip-schedule-row p{margin-top:6px;}
    .bbip-chart-scroll{overflow-x:auto;margin:16px 0 12px;}
    .bbip-chart{display:grid;grid-template-columns:repeat(6,minmax(54px,1fr));gap:8px;min-width:364px;padding:0 0 6px;}
    .bbip-chart-column{min-width:0;text-align:center;}
    .bbip-chart-amount{font-size:10px;line-height:1.5;font-weight:700;white-space:nowrap;margin-bottom:7px;font-variant-numeric:tabular-nums;}
    .bbip-chart-track{height:136px;display:flex;align-items:flex-end;justify-content:center;border-bottom:1px solid var(--border);}
    .bbip-chart-bar{width:65%;max-width:38px;min-height:0;border-radius:7px 7px 0 0;background:var(--accent);opacity:.55;flex:none;}
    .bbip-chart-bar.is-current{opacity:1;background:var(--sunset,var(--accent));}
    .bbip-chart-label{margin-top:7px;font-size:11px;color:var(--text-secondary);}
    .bbip-chart-state{min-height:15px;margin-top:3px;font-size:9px;color:var(--text-secondary);}
    .bbip-explanation{margin-top:13px;padding-top:12px;border-top:1px solid var(--border);font-size:var(--text-xs,11px);line-height:1.6;color:var(--text-secondary);}
    .bbip-explanation summary{cursor:pointer;min-height:36px;display:list-item;}
    .bbip-explanation p{margin:6px 0 0;}
  `;
  function view(date=new Date()){
    const m=model(date);
    return `<style data-bb-insights-polish="true">${CSS}</style>
      <div class="nav-bar"><div class="nav-bar-content"><div class="nav-title bb-centered-page-title">Insights</div></div></div>
      <div class="main-content fade-in"><div class="content-pad content-gap">
        <div class="section-header" style="color:var(--text);font-size:18px;font-weight:700;line-height:1.4;">${formatDate(date,'monthYear')}</div>
        ${summaryHTML(m,date)}${paymentsHTML(date,m.totals)}${scheduledHTML(m.schedules)}${categoryHTML(m)}${historyHTML(date,m.history)}${limitHTML(m,date)}
      </div></div>`;
  }
  renderInsights=function(){
    try{return view(new Date());}
    catch(error){invalidate();console.warn('Insights performance retained the original error fallback:',error);return original.apply(this,arguments);}
  };
  for(const event of ['billbeacon:data-changed','billbeacon:signed-out','billbeacon:authenticated','billbeacon:household-ready'])window.addEventListener(event,invalidate);
  window.addEventListener('storage',event=>{if(event.key===null||['bills','payments','archivedBills','incomeSources','settings'].includes(event.key))invalidate();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')invalidate();});
  window.BillBeaconInsightsPolish=Object.freeze({version:2,performancePhase:3,
    _test:{model:date=>clone(model(date||new Date())),view,barHeights,
      splitFromSummary:summary=>clone(splitFromSummary(summary)),cacheSizes:()=>({payments:paidMonths.size,summaries:summaryMonths.size,prepared:!!prepared})}});
})();

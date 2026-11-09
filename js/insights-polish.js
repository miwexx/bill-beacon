/* Bill Beacon Insights presentation v1.
   Load after the existing app and UI scripts. No financial storage writes.
   Reuses existing totals/helpers and transforms HTML before it enters the live DOM. */
(() => {
  'use strict';
  if (window.BillBeaconInsightsPolish) return;
  if (typeof renderInsights !== 'function') {
    console.error('Insights polish: load app.js first.');return;
  }
  const original = renderInsights;
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cents = value => {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') throw new Error('Missing payment amount');
    const n=Number(value),rounded=Math.round(n*100);
    if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(rounded))throw new Error('Invalid payment amount');
    return rounded;
  };
  function paymentSplit(date) {
    const items=getMonthlyCategoryPayments(date);
    if(!Array.isArray(items))throw new Error('Invalid monthly payments');
    const result={bills:0,installments:0,total:0};
    for(const item of items){
      const amount=cents(item.amount);
      const key=bbInsightIsInstallment(item)?'installments':'bills';
      result[key]+=amount;result.total+=amount;
      if(!Number.isSafeInteger(result.total))throw new Error('Payment total exceeds supported range');
    }
    return result;
  }
  function scheduledSplit(date) {
    const result=bbInsightScheduledSplit(date);
    if(!result||!['bills','installments','total'].every(key=>Number.isSafeInteger(result[key])&&result[key]>=0)||result.bills+result.installments!==result.total)throw new Error('Invalid scheduled totals');
    return result;
  }
  const cash = n => formatCurrency(n/100);
  const monthName = date => date.toLocaleDateString(undefined,{month:'long',year:'numeric'});
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
  function scheduledHTML(date){
    const rows=Array.from({length:3},(_,i)=>{
      const month=new Date(date.getFullYear(),date.getMonth()+i,1,12),value=scheduledSplit(month);
      return `<div class="bbip-schedule-row"><div><strong>${esc(monthName(month))}</strong><strong>${esc(cash(value.total))}</strong></div><p class="bbip-note">Bills ${esc(cash(value.bills))} · Installments ${esc(cash(value.installments))}</p></div>`;
    }).join('');
    return section('Next Three Months','<p class="bbip-note">Based on saved schedules. Includes paid and unpaid commitments, not just balances still due.</p>'+rows);
  }
  function historyModel(date){
    return Array.from({length:6},(_,i)=>{
      const month=new Date(date.getFullYear(),date.getMonth()-5+i,1,12);
      return {month,total:paymentSplit(month).total,current:i===5};
    });
  }
  function barHeights(values,height=136){
    const max=Math.max(0,...values);
    return values.map(value=>max?value/max*height:0);
  }
  function historyHTML(date){
    const items=historyModel(date),heights=barHeights(items.map(item=>item.total));
    if(!items.some(item=>item.total))return section('Payment History','<p class="bbip-note">No qualifying payments recorded for these six due months yet.</p>');
    return section('Payment History',`
      <p class="bbip-note">Six due months · ${esc(items[0].month.toLocaleDateString(undefined,{month:'short',year:'numeric'}))}–${esc(date.toLocaleDateString(undefined,{month:'short',year:'numeric'}))}</p>
      <div class="bbip-chart-scroll"><div class="bbip-chart" role="list" aria-label="Recorded payments by bill due month">
      ${items.map((item,i)=>`<div class="bbip-chart-column" role="listitem" aria-label="${esc(monthName(item.month))}: ${esc(cash(item.total))}${item.current?'; month in progress':''}"><div class="bbip-chart-amount">${esc(cash(item.total))}</div><div class="bbip-chart-track"><div class="bbip-chart-bar ${item.current?'is-current':''}" style="height:${heights[i].toFixed(3)}px"></div></div><div class="bbip-chart-label">${esc(item.month.toLocaleDateString(undefined,{month:'short'}))}</div><div class="bbip-chart-state">${item.current?'In progress':''}</div></div>`).join('')}
      </div></div>
      <p class="bbip-note">Uses the bill’s due month, not the payment’s transaction month. The current month is unfinished; historical totals can change when payments are recorded or reversed.</p>
    `);
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
  function nodeFromHTML(html){const holder=document.createElement('div');holder.innerHTML=html;return holder.firstElementChild;}
  function findGroup(content,pattern){
    const header=[...content.querySelectorAll('.section-header')].find(node=>pattern.test(node.textContent.trim()));
    if(!header)return null;
    const parent=header.parentElement;
    if(parent!==content&&parent.querySelector('.card'))return parent;
    const card=header.nextElementSibling;
    if(!card?.classList.contains('card'))return null;
    const group=document.createElement('section');header.before(group);group.append(header,card);return group;
  }
  function polish(html,date){
    const root=document.createElement('div');root.innerHTML=html;
    const content=root.querySelector('.main-content .content-pad');
    const summary=content?.querySelector('.insights-leftover-card');
    if(!content||!summary)throw new Error('Expected Insights structure was not found');
    const groups={
      breakdown:findGroup(content,/^Spending Breakdown$/i),
      scheduled:findGroup(content,/^Scheduled Commitments$/i),
      category:findGroup(content,/^(Spending|Payments) by Category$/i),
      history:findGroup(content,/^Monthly (Spending|Payments)(?:\s|$)/i)
    };
    if(!groups.category||!groups.history)throw new Error('Existing category/history section was not found');
    const totals=paymentSplit(date);
    const payments=nodeFromHTML(paymentsHTML(date,totals));
    const scheduled=nodeFromHTML(scheduledHTML(date));
    const history=nodeFromHTML(historyHTML(date));
    const labels=summary.querySelectorAll('.insights-leftover-label');
    if(labels[1])labels[1].textContent='Scheduled commitments';
    const result=summary.querySelector('.insights-leftover-result-label');
    if(result)result.textContent=/shortfall/i.test(result.textContent)?'Planned shortfall':'Planned remainder';
    summary.setAttribute('aria-label','Monthly plan: expected income minus scheduled commitments');
    summary.querySelector('.insights-leftover-note')?.remove();
    const explanation=document.createElement('details');explanation.className='bbip-explanation';
    const explainTitle=document.createElement('summary');explainTitle.textContent='How this estimate works';
    const explainText=document.createElement('p');explainText.textContent='Expected income minus this month’s tracked scheduled bills and installments, including those already paid. This is not your bank balance or a complete spending budget. Set up expected income in Settings if it is not available.';
    explanation.append(explainTitle,explainText);summary.append(explanation);
    const categoryHeader=groups.category.querySelector('.section-header');categoryHeader.textContent='Payments by Group';
    const categoryNote=document.createElement('p');categoryNote.className='bbip-note';
    categoryNote.textContent='Existing payment grouping is preserved. Installments are a payment type; other labels use the app’s saved categories.';
    groups.category.querySelector('.card')?.prepend(categoryNote);
    const old=[groups.breakdown,groups.scheduled,groups.category,groups.history].filter(Boolean);
    for(const group of old)group.remove();
    summary.insertAdjacentElement('afterend',payments);
    payments.insertAdjacentElement('afterend',scheduled);
    scheduled.insertAdjacentElement('afterend',groups.category);
    groups.category.insertAdjacentElement('afterend',history);
    const style=document.createElement('style');style.dataset.bbInsightsPolish='true';style.textContent=CSS;root.prepend(style);
    return root.innerHTML;
  }
  renderInsights=function(){
    const html=original.apply(this,arguments);
    try{
      if(typeof getMonthlyCategoryPayments!=='function'||typeof bbInsightIsInstallment!=='function'||typeof bbInsightScheduledSplit!=='function')throw new Error('Existing Insights helpers are unavailable');
      return polish(html,new Date());
    }catch(error){console.warn('Insights polish kept the original screen:',error.message);return html;}
  };
  window.BillBeaconInsightsPolish=Object.freeze({version:1});
})();
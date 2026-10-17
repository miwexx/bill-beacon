/* Bill Beacon BROWSER: compact Dashboard Payment Status.
   Load after app.js and the existing UI scripts. No stored-data changes.
   Remove this script line to restore the previous status layout. */
(() => {
  "use strict";
  if (window.BillBeaconCompactStatus) return;
  if (typeof renderDashboardSeparatedStatus !== "function" ||
      typeof getDashboardSeparatedStatus !== "function" ||
      typeof openDashboardSeparatedStatus !== "function") {
    console.error("Compact Payment Status: load app.js first.");
    return;
  }
  const original=renderDashboardSeparatedStatus;

  renderDashboardSeparatedStatus=function(referenceDate=new Date()) {
    const groups=getDashboardSeparatedStatus(referenceDate);
    const hasInstallments=Store.getBills().some(bill=>Boolean(bill.installmentPlanId));
    const month=formatDate(referenceDate,"monthYear");
    const overdueFromEarlier=[...(groups.bills.olderOverdue||[]),
      ...(hasInstallments?(groups.installments.olderOverdue||[]):[])].length;
    const statuses=[
      {key:"paid",label:"Paid",color:"var(--paid)"},
      {key:"due",label:"Due",color:"var(--upcoming)"},
      {key:"overdue",label:"Overdue",color:"var(--overdue)"}
    ];
    const renderRow=(name,label)=>`<div class="bb-payment-status-grid bb-payment-status-row" role="row">
      <div class="bb-payment-status-row-label" role="rowheader">${label}</div>
      ${statuses.map(status=>{
        const count=groups[name][status.key].length;
        const period=status.key==="overdue"?"all dates":month;
        return `<div role="cell"><button type="button" class="bb-payment-status-count"
          onclick="openDashboardSeparatedStatus('${name}','${status.key}')"
          aria-label="${escapeHtml(`View ${count} ${status.label.toLowerCase()} ${label.toLowerCase()} payments, ${period}`)}"
          style="color:${status.color};">${count}</button></div>`;
      }).join("")}</div>`;
    return `<section class="card bb-dashboard-payment-status" aria-labelledby="bbPaymentStatusTitle">
      <style>
        .bb-dashboard-payment-status {padding:12px 14px 0;min-width:0;overflow:hidden;}
        .bb-payment-status-heading {display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px;}
        .bb-payment-status-title {margin:0;color:var(--text);font-size:var(--text-base);font-weight:800;line-height:1.3;}
        .bb-payment-status-month {color:var(--text-muted);font-size:var(--text-xs);white-space:nowrap;}
        .bb-payment-status-grid {display:grid;grid-template-columns:minmax(0,1.25fr) repeat(3,minmax(0,1fr));align-items:center;gap:4px;}
        .bb-payment-status-columns {min-height:24px;color:var(--text-muted);font-size:11px;font-weight:650;text-align:center;}
        .bb-payment-status-row {min-height:48px;}
        .bb-payment-status-row + .bb-payment-status-row {border-top:1px solid var(--border);}
        .bb-payment-status-row-label {min-width:0;color:var(--text);font-size:var(--text-sm);font-weight:750;overflow-wrap:anywhere;}
        .bb-payment-status-count {display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;padding:4px 0;border:0;background:transparent;font:inherit;font-size:23px;line-height:1.2;font-weight:850;font-variant-numeric:tabular-nums;cursor:pointer;}
        .bb-payment-status-count:focus-visible,.bb-payment-status-plans:focus-visible {outline:2px solid var(--accent);outline-offset:-2px;border-radius:8px;}
        .bb-payment-status-count:active {background:var(--surface-2);border-radius:8px;}
        .bb-payment-status-plans {display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:40px;margin-top:4px;padding:9px 0;border:0;border-top:1px solid var(--border);background:transparent;color:var(--text);font:inherit;font-size:var(--text-xs);font-weight:650;text-align:left;cursor:pointer;}
        .bb-payment-status-scope {margin:0;padding:4px 0 9px;color:var(--text-muted);font-size:10px;line-height:1.4;}
        @media(max-width:350px){.bb-dashboard-payment-status{padding-left:10px;padding-right:10px}.bb-payment-status-grid{gap:2px;grid-template-columns:minmax(0,1.15fr) repeat(3,minmax(0,1fr))}.bb-payment-status-row-label{font-size:12px}.bb-payment-status-columns{font-size:10px}.bb-payment-status-count{font-size:21px}.bb-payment-status-month{font-size:10px}}
      </style>
      <header class="bb-payment-status-heading">
        <h2 class="bb-payment-status-title" id="bbPaymentStatusTitle">Payment Status</h2>
        <span class="bb-payment-status-month">${escapeHtml(month)}</span>
      </header>
      <div role="table" aria-label="Bill${hasInstallments?' and installment':''} payment counts">
        <div class="bb-payment-status-grid bb-payment-status-columns" role="row">
          <span role="columnheader"><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);">Payment type</span></span>
          ${statuses.map(status=>`<span role="columnheader">${status.label}</span>`).join("")}
        </div>
        ${renderRow("bills","Bills")}
        ${hasInstallments?renderRow("installments","Installments"):""}
      </div>
      ${overdueFromEarlier?'<p class="bb-payment-status-scope">Overdue includes earlier months.</p>':""}
      ${hasInstallments?`<button type="button" class="bb-payment-status-plans"
        onclick="navigate('payment-plans',{returnRoute:'today'})" aria-label="View installment plans">
        <span>View installment plans</span><span aria-hidden="true">${svgIcon("chevronRight",16)}</span>
      </button>`:'<div style="height:8px;"></div>'}
    </section>`;
  };
  window.BillBeaconCompactStatus={version:1,originalRenderer:original};
})();

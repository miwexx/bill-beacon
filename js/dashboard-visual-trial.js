/* Bill Beacon Dashboard visual trial v1.
   Load LAST, after the current Dashboard/UI scripts.
   Presentation only: no payment, funding, account, or storage operations. */
(() => {
  'use strict';
  if (window.BillBeaconDashboardVisualTrial) return;
  if (typeof renderToday !== 'function') {
    console.error('Dashboard visual trial: load the app and UI scripts first.');
    return;
  }
  const original = renderToday;
  let enabled = true;
  const style = document.createElement('style');
  style.id = 'bbDashboardVisualTrialStyle';
  style.textContent = `
  .bb-dashboard-visual-trial .bb-trial-month-label {
    margin:12px 0 6px;color:var(--text-secondary,#bcb5c6);
    font-size:.73rem;line-height:1.5;font-weight:650;letter-spacing:.02em;
  }
  .bb-dashboard-visual-trial .bb-month-status-count,
  .bb-dashboard-visual-trial .bb-payment-status-count {
    font-size:21px!important;font-weight:750!important;min-height:44px!important;
  }
  .bb-dashboard-visual-trial .bb-month-status-row,
  .bb-dashboard-visual-trial .bb-payment-status-row {min-height:46px!important;}
  .bb-dashboard-visual-trial .bb-month-status-head,
  .bb-dashboard-visual-trial .bb-payment-status-columns {
    color:var(--text-secondary,#bcb5c6)!important;font-size:.71rem!important;
  }
  .bb-dashboard-visual-trial .bb-dashboard-paycheck {
    margin-top:16px!important;padding-top:16px!important;
    border-top:1px solid var(--border)!important;
  }
  .bb-dashboard-visual-trial .bb-dashboard-paycheck-plan > div:first-child {
    margin-bottom:16px!important;
  }
  .bb-dashboard-visual-trial .bb-dashboard-paycheck-plan > div:first-child > button {
    min-height:44px!important;font-size:.79rem!important;font-weight:700!important;
  }
  .bb-dashboard-visual-trial .bb-trial-amounts {
    padding:10px 10px 12px!important;border:1px solid var(--border)!important;
    border-radius:14px!important;background:var(--surface-2,transparent)!important;
    gap:8px!important;align-items:start!important;
  }
  .bb-dashboard-visual-trial .bb-trial-amounts > * {min-width:0!important;}
  .bb-dashboard-visual-trial .bb-trial-amount {
    font-size:clamp(17px,4.8vw,25px)!important;line-height:1.25!important;
    font-weight:800!important;letter-spacing:-.025em;font-variant-numeric:tabular-nums;
    overflow-wrap:anywhere!important;
  }
  .bb-dashboard-visual-trial .bb-trial-amount-label {
    font-size:.76rem!important;font-weight:650!important;
    color:var(--text-secondary,#bcb5c6)!important;
  }
  .bb-dashboard-visual-trial .dashboard-progress-track {
    height:4px!important;min-height:4px!important;max-height:4px!important;
    margin-top:14px!important;
  }
  .bb-dashboard-visual-trial .dashboard-progress-fill {
    height:100%!important;min-height:0!important;
  }
  .bb-dashboard-visual-trial .bb-trial-progress-caption {
    color:var(--text-secondary,#bcb5c6)!important;
    font-size:.73rem!important;line-height:1.5!important;
  }
  .bb-dashboard-visual-trial #paycheckInlineList {margin-top:18px!important;}
  .bb-dashboard-visual-trial .bb-trial-bill-row {padding:14px 0!important;gap:11px!important;}
  .bb-dashboard-visual-trial .bb-trial-bill-name {
    font-size:.86rem!important;font-weight:750!important;line-height:1.4!important;
  }
  .bb-dashboard-visual-trial .bb-trial-status {
    font-size:.74rem!important;line-height:1.5!important;margin-top:4px!important;
  }
  .bb-dashboard-visual-trial .bb-trial-move-note {
    color:var(--text-secondary,#bcb5c6)!important;font-size:.73rem!important;
    line-height:1.5!important;margin-top:5px!important;
  }
  @media(max-width:350px) {
    .bb-dashboard-visual-trial .bb-trial-amounts {padding-left:7px!important;padding-right:7px!important;gap:5px!important;}
    .bb-dashboard-visual-trial .bb-trial-amount {font-size:17px!important;}
    .bb-dashboard-visual-trial .bb-trial-amount-label {font-size:.7rem!important;}
  }
  `;
  document.head.appendChild(style);
  function decorate(html) {
    const root = document.createElement('div'); root.innerHTML = html;
    const combined = root.querySelector('.dashboard-content .bb-dashboard-combined');
    const month = combined?.querySelector('.dashboard-month-card');
    const plan = combined?.querySelector('.bb-dashboard-paycheck-plan');
    if (!combined || !month || !plan) return html;
    const table = month.querySelector('[role="table"]');
    if (!table) return html;
    combined.classList.add('bb-dashboard-visual-trial');
    const existingTitle = month.querySelector('.bb-payment-status-title');
    if (existingTitle) existingTitle.textContent = 'Monthly status';
    else {
      const label = document.createElement('div');
      label.className = 'bb-trial-month-label'; label.textContent = 'Monthly status';
      table.before(label);
    }
    const processing = plan.querySelector('button[onclick*="openProcessingList("]');
    const amounts = processing?.parentElement;
    // Do not guess at a changed/non-Processing layout.
    if (amounts && amounts.children.length === 3) {
      amounts.classList.add('bb-trial-amounts');
      for (const cell of amounts.children) {
        const amount = [...cell.children].find(node => (node.getAttribute('style') || '').includes('font-variant-numeric:tabular-nums'));
        if (amount) amount.classList.add('bb-trial-amount');
        const label = cell.firstElementChild;
        if (label) {
          label.classList.add('bb-trial-amount-label');
          // Leftover's information button keeps its handler, target and original size.
          const text = [...label.children].find(node => node.tagName === 'SPAN');
          if (text) text.classList.add('bb-trial-amount-label');
        }
      }
    }
    const track = plan.querySelector('.dashboard-progress-track');
    if (track?.nextElementSibling && !track.nextElementSibling.id) track.nextElementSibling.classList.add('bb-trial-progress-caption');
    for (const button of plan.querySelectorAll('#paycheckInlineList button[onclick*="openPaycheckInlineBill("]')) {
      button.classList.add('bb-trial-bill-row');
      const info = button.children[1];
      if (!info) continue;
      info.children[0]?.classList.add('bb-trial-bill-name');
      info.children[1]?.classList.add('bb-trial-status');
      info.children[2]?.classList.add('bb-trial-move-note');
    }
    return root.innerHTML;
  }
  renderToday = function() {
    const html = original.apply(this,arguments);
    if (!enabled) return html;
    try { return decorate(html); }
    catch (error) { console.warn('Dashboard visual trial retained the original screen:',error); return html; }
  };
  function redrawIfVisible() {
    if (typeof currentRoute !== 'undefined' && currentRoute === 'today' &&
        document.querySelector('#app .bb-dashboard-combined') && typeof render === 'function') render();
  }
  window.BillBeaconDashboardVisualTrial = Object.freeze({
    version:1,
    setEnabled(value) { enabled=Boolean(value); style.disabled=!enabled; redrawIfVisible(); },
    isEnabled() { return enabled; }
  });
  redrawIfVisible();
})();

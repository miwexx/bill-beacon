/* Bill Beacon Dashboard layout trial v2 — placement only.
   REPLACE dashboard-visual-trial.js; do not append to v1.
   Load last, after all existing UI and Processing scripts.
   No financial reads/writes; existing HTML, handlers, and values are retained. */
(() => {
  'use strict';
  if (window.BillBeaconDashboardVisualTrial) return;
  if (typeof renderToday !== 'function') {
    console.error('Dashboard layout trial: load the app and UI scripts first.'); return;
  }
  const original = renderToday;
  let enabled = true;
  const style = document.createElement('style');
  style.id = 'bbDashboardVisualTrialStyle';
  style.textContent = `
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
  document.head.appendChild(style);
  function splitDashboard(root) {
    const combined = root.querySelector('.dashboard-content .bb-dashboard-combined');
    const month = combined?.querySelector('.dashboard-month-card');
    const paycheck = combined?.querySelector('.bb-dashboard-paycheck');
    if (!combined || !month || !paycheck || month.parentElement !== combined || paycheck.parentElement !== combined) return false;
    if (!month.querySelector('[role="table"]') || !paycheck.querySelector('.bb-dashboard-paycheck-plan')) return false;
    const arrows = node => [...node.querySelectorAll('button[onclick]')].map(button =>
      (button.getAttribute('onclick') || '').replace(/\s+/g,''));
    const nav = [...month.children].find(node => {
      const handlers=arrows(node);
      return handlers.includes('changeDashboardReportMonth(-1)') && handlers.includes('changeDashboardReportMonth(1)');
    });
    if (!nav) return false;
    const allArrows=arrows(combined).filter(handler=>/^changeDashboardReportMonth\(/.test(handler));
    if (allArrows.length !== 2) return false;
    const monthName = nav.children[1]?.textContent.trim();
    if (!monthName) return false;
    const monthly = document.createElement('section');
    monthly.className='card bb-dashboard-monthly-status-card';
    const title = month.querySelector('.bb-payment-status-title');
    if (title) {
      title.textContent='Monthly Status';
      if (!title.id) title.id='bbLayoutMonthlyStatusTitle';
      monthly.setAttribute('aria-labelledby',title.id);
    } else {
      const header=document.createElement('header');header.className='bb-layout-monthly-heading';
      const heading=document.createElement('h2');heading.id='bbLayoutMonthlyStatusTitle';heading.textContent='Monthly Status';
      const date=document.createElement('span');date.textContent=monthName;
      header.append(heading,date);monthly.append(header);
      monthly.setAttribute('aria-labelledby',heading.id);
    }
    // Move the original navigation; do not create independent month state or handlers.
    nav.classList.add('bb-paycheck-month-navigation');
    combined.insertBefore(nav,paycheck);
    monthly.append(month);
    combined.classList.remove('bb-dashboard-combined');
    combined.classList.add('bb-dashboard-paycheck-card');
    combined.setAttribute('aria-label','Paycheck plan and reporting month');
    const wrapper=document.createElement('div');wrapper.className='bb-dashboard-split-layout';
    combined.replaceWith(wrapper);wrapper.append(combined,monthly);
    return true;
  }
  renderToday=function() {
    const html=original.apply(this,arguments);
    if (!enabled) return html;
    try {
      const root=document.createElement('div');root.innerHTML=html;
      return splitDashboard(root) ? root.innerHTML : html;
    } catch(error) {
      console.warn('Dashboard layout trial retained the original layout:',error);
      return html;
    }
  };
  function redrawIfVisible() {
    if (typeof currentRoute !== 'undefined' && currentRoute === 'today' &&
        document.querySelector('#app .dashboard-content') && typeof render === 'function') render();
  }
  window.BillBeaconDashboardVisualTrial=Object.freeze({
    version:2,
    setEnabled(value) {enabled=Boolean(value);style.disabled=!enabled;redrawIfVisible();},
    isEnabled(){return enabled;},
    _test:{splitDashboard}
  });
  redrawIfVisible();
})();

/*
Bill Beacon — More tools design preview v1
INSTALL: Load ONCE as the LAST classic script in index.html:
<script src="js/more-tools-preview.js?v=1"></script>
Requires app.js (renderMore, render, navigate). All styles are included.
New tools use SAMPLE DATA ONLY. No storage writes, fetches, sync calls,
permission requests, file uploads or financial actions are performed here.
Banking, Activity & Changes and Settings use the app's existing routes.
REMOVE: remove the script tag and reload, or call BillBeaconMorePreview.uninstall().
This is a visual/interaction prototype, not completed feature implementations.
Validation: Node syntax check and 36 Chromium fixture checks passed.
Fixture checks are not an end-to-end test against the deployed Bill Beacon app.
*/
(() => {
  'use strict';
  if (window.BillBeaconMorePreview) return;
  if (typeof renderMore !== 'function' || typeof navigate !== 'function') {
    console.error('More preview: load after app.js and other app scripts.');
    return;
  }
  const savedRenderMore = renderMore;
  const STYLE_ID = 'bbmp-style-v1';
  const DIALOG_ID = 'bbmp-dialog';
  let active = true;
  const money = amount => new Intl.NumberFormat('en-US', {
    style:'currency', currency:'USD', maximumFractionDigits:0
  }).format(amount);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
  const PATHS = {
    bank:'M3 10h18M4 10V20M9 10V20M15 10V20M20 10V20M2 21h20M12 3 2 8h20Z',
    forecast:'m3 17 5-5 4 3 8-10M14 5h6v6',
    goal:'M20 12a8 8 0 1 1-3-6M16 12a4 4 0 1 1-4-4M12 12l9-9M17 3h4v4',
    renew:'M20 7v5h-5M4 17v-5h5M5 8a7 7 0 0 1 12-3l3 4M4 15l3 4a7 7 0 0 0 12-3',
    card:'M3 5h18v14H3ZM3 10h18M7 15h4',
    review:'M9 3h6v4H9ZM9 5H5v16h14V5h-4M9 12h6M9 16h4',
    report:'M5 3h10l4 4v14H5ZM14 3v5h5M9 17v-3M12 17v-6M15 17v-4',
    activity:'M3 12h4l3-7 4 14 3-7h4',
    sync:'M20 7v5h-5M4 17v-5h5M5 8a7 7 0 0 1 12-3l3 4M4 15l3 4a7 7 0 0 0 12-3',
    settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
    document:'M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h6',
    arrow:'m9 5 7 7-7 7',
    close:'m6 6 12 12M18 6 6 18',
    check:'m5 12 4 4L19 6'
  };
  function icon(name, size=22) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PATHS[name] || PATHS.document}"/></svg>`;
  }
  const TOOLS = {
    forecast:{name:'Forecast & What-If', sub:'Explore your next paychecks before making changes.', icon:'forecast', tone:'purple'},
    goals:{name:'Goals & Sinking Funds', sub:'Build a little at a time for bigger expenses.', icon:'goal', tone:'green'},
    subscriptions:{name:'Subscriptions & Renewals', sub:'Trials, renewals and upcoming price changes.', icon:'renew', tone:'pink'},
    cards:{name:'Credit Cards', sub:'Payoff ideas, promotional rates and annual fees.', icon:'card', tone:'blue'},
    documents:{name:'Bill Documents', sub:'Statements, receipts and cancellation records.', icon:'document', tone:'orange'},
    review:{name:'Needs Review', sub:'Unconfirmed matches and schedule questions.', icon:'review', tone:'orange'},
    monthly:{name:'Monthly Review', sub:'See what changed, moved or cost more.', icon:'report', tone:'purple'},
    connections:{name:'Connections & Sync Health', sub:'A clearer view of bank, household and reminder status.', icon:'sync', tone:'green'}
  };
  function row(name, sub, symbol, tone, action, preview=false) {
    return `<button type="button" class="bbmp-row" data-bbmp-action="${escape(action)}">
      <span class="bbmp-icon bbmp-${tone}">${icon(symbol)}</span>
      <span class="bbmp-row-copy"><span class="bbmp-row-title">${escape(name)}</span><span class="bbmp-row-sub">${escape(sub)}</span></span>
      ${preview ? '<span class="bbmp-tag">Preview</span>' : ''}
      <span class="bbmp-chevron">${icon('arrow',16)}</span>
    </button>`;
  }
  function toolRow(key) {
    const item = TOOLS[key];
    return row(item.name,item.sub,item.icon,item.tone,'open:'+key,true);
  }
  function section(label, content) {
    return `<section class="bbmp-section"><h2 class="bbmp-section-title">${label}</h2><div class="bbmp-group">${content}</div></section>`;
  }
  function previewRenderMore() {
    return `<div class="nav-bar"><div class="nav-bar-content bbmp-nav"><span></span><div class="nav-title">More</div><span></span></div></div>
    <div class="main-content fade-in bbmp-page"><div class="content-pad bbmp-content">
      <div class="bbmp-intro"><div><p class="bbmp-eyebrow">YOUR MONEY TOOLKIT</p><h1>Plan ahead. Stay in control.</h1></div><span class="bbmp-preview-label">Design preview</span></div>
      <p class="bbmp-intro-note">New tools open with sample data. Your current records stay unchanged.</p>
      <button type="button" class="bbmp-bank" data-bbmp-action="route:transactions">
        <span class="bbmp-icon bbmp-purple">${icon('bank',24)}</span><span class="bbmp-row-copy"><span class="bbmp-row-title">Banking</span><span class="bbmp-row-sub">Open your existing transactions</span></span><span class="bbmp-bank-link">View ${icon('arrow',15)}</span>
      </button>
      ${section('Planning', toolRow('forecast')+toolRow('goals'))}
      ${section('Manage', toolRow('subscriptions')+toolRow('cards')+toolRow('documents'))}
      ${section('Review', toolRow('review')+toolRow('monthly')+row('Activity & Changes','Your existing bill and payment change history.','activity','orange','route:activity'))}
      ${section('App',toolRow('connections')+row('Settings','Account, appearance, reminders and backups.','settings','purple','route:settings'))}
      <p class="bbmp-footer">Preview v1 · New feature screens are demonstrations, not live financial tools.</p>
    </div></div>`;
  }
  function metric(label, value, note='') {
    return `<div class="bbmp-metric"><span>${escape(label)}</span><strong>${escape(value)}</strong>${note?`<small>${escape(note)}</small>`:''}</div>`;
  }
  function panel(title, body) {
    return `<section class="bbmp-panel"><h3>${escape(title)}</h3>${body}</section>`;
  }
  function detail(label, value, note='') {
    return `<div class="bbmp-detail"><div><span>${escape(label)}</span>${note?`<small>${escape(note)}</small>`:''}</div><strong>${escape(value)}</strong></div>`;
  }
  function example(title, detailText, value, tone='purple') {
    return `<div class="bbmp-example"><span class="bbmp-dot bbmp-${tone}"></span><div><strong>${escape(title)}</strong><small>${escape(detailText)}</small></div><span class="bbmp-example-value">${escape(value)}</span></div>`;
  }
  function goal(name, saved, total, perPaycheck, tone) {
    return `<div class="bbmp-goal"><div class="bbmp-goal-heading"><strong>${escape(name)}</strong><span>${money(saved)} / ${money(total)}</span></div><progress max="${total}" value="${saved}" aria-label="${escape(name)} example progress">${Math.round(saved/total*100)}%</progress><small>${money(perPaycheck)} per paycheck · sample contribution</small></div>`;
  }
  function content(key) {
    switch(key) {
      case 'forecast': return `
        <div class="bbmp-metric-grid">${metric('Expected income','$4,000','Example month')}${metric('Projected remainder','$300','Before a new scenario')}</div>
        ${panel('Example monthly plan', detail('Expected income','$4,000')+detail('Scheduled bills','−$2,750')+detail('Living expenses allowance','−$800')+detail('Goal contributions','−$150'))}
        ${panel('Try a what-if', `<label class="bbmp-field-label" for="bbmp-extra">Add a monthly expense — example USD</label><div class="bbmp-input-wrap"><span aria-hidden="true">$</span><input id="bbmp-extra" type="number" min="0" max="1000000" step="1" value="75" inputmode="decimal" aria-describedby="bbmp-scenario-help"></div><p id="bbmp-scenario-help" class="bbmp-help">Changes only this sample calculation. Nothing is saved.</p><div id="bbmp-scenario-result" class="bbmp-result" aria-live="polite"></div>`)}
        <p class="bbmp-help">Projected remainder is not a guarantee of money available to spend. These are invented inputs, not your account balances.</p>`;
      case 'goals': return `
        <div class="bbmp-metric-grid">${metric('Example funds','$800','Across two sample goals')}${metric('Per paycheck','$75','Planned contributions')}</div>
        ${panel('Save for less-frequent expenses',goal('Car insurance',450,900,50,'green')+goal('Holiday fund',350,700,25,'purple'))}
        ${panel('How it would work','<p>Set a target amount and date, then plan a contribution from each paycheck. A fund could link to the bill it is intended to cover.</p><p class="bbmp-help">This preview does not move or reserve money, or deduct a fund from your real paycheck plan.</p>')}`;
      case 'subscriptions': return `
        <div class="bbmp-metric-grid">${metric('Monthly equivalent','$18','Example subscriptions')}${metric('Upcoming events','3','Trial, price change and renewal')}</div>
        ${panel('Upcoming — sample dates',example('Music service','Renews October 25','$12 / month','pink')+example('Cloud storage','Annual renewal November 1','$72 / year','blue')+example('Video trial','Trial ends October 28','Review trial','orange'))}
        ${panel('Price-change reminder', '<div class="bbmp-callout">Example: music service increases from $12 to $14 next month.</div><p class="bbmp-help">A future version would distinguish a price change you entered from one suggested by a transaction. No price change has been detected or applied here.</p>')}`;
      case 'cards': return `
        <div class="bbmp-metric-grid">${metric('Sample balance','$1,200','Fictional card')}${metric('Example payment','$100','Per month')}</div>
        ${panel('Card overview',detail('Purchase APR','24%','Example rate, not a payoff quote')+detail('Promotional APR expiry','March 31','Example date')+detail('Annual fee','$95','Example upcoming charge'))}
        ${panel('Payoff scenarios','<p>Compare a fixed monthly payment with a target payoff date. A complete tool would show interest assumptions, fees and whether the payment covers interest.</p><div class="bbmp-callout">Payoff calculation is not implemented in this design preview.</div>')}
        ${panel('Balance history','<div class="bbmp-history" aria-label="Example balance history"><div style="--level:95%"><i></i><span>Jul</span></div><div style="--level:78%"><i></i><span>Aug</span></div><div style="--level:65%"><i></i><span>Sep</span></div><div style="--level:56%"><i></i><span>Oct</span></div></div><p class="bbmp-help">Illustrative trend only. This is not bank-synced balance history.</p>')}`;
      case 'documents': return `
        ${panel('Example document library',example('Electric statement.pdf','Example only · linked to an October bill','PDF','orange')+example('Payment receipt.pdf','Example only · linked to one payment','PDF','green')+example('Cancellation confirmation.pdf','Example only · linked to a subscription','PDF','purple'))}
        <div class="bbmp-empty">${icon('document',32)}<h3>Keep the proof with the bill</h3><p>A future version could attach statements, receipts and cancellation confirmations to bills or individual payments.</p><small>No documents were read or uploaded. Storage, access controls and deletion are not implemented here.</small></div>`;
      case 'review': return `
        <div class="bbmp-callout">3 invented examples — no scan of your bills or transactions has run.</div>
        ${panel('Example review queue',example('Possible payment match','Electric bill · expected $90, transaction $94','Confirm match','orange')+example('Possible duplicate','Two example bills share a similar name','Compare','purple')+example('Incomplete schedule','Example bill needs a due date','Check schedule','pink'))}
        ${panel('Resolve, don’t just notify','<p>Each issue would explain the evidence and open a focused review screen. No item should be treated as confirmed until you approve it.</p><p class="bbmp-help">The examples above are not actionable and are not findings about your account.</p>')}`;
      case 'monthly': return `
        <div class="bbmp-metric-grid">${metric('Expected payments','$2,750','Sample month')}${metric('Recorded payments','$2,768','Sample month')}</div>
        ${panel('Example month-end story',example('Electric payment was $18 higher','Expected $90 · recorded $108','+$18','orange')+example('Two payments changed paychecks','One moved earlier; one moved later','2 moves','purple')+example('One bill was split','Two planned payments of $60','$120 total','blue'))}
        ${panel('What this adds','<p>A readable summary of changes, with links to the underlying bill occurrences and Activity & Changes entries.</p><p class="bbmp-help">Recorded payments alone do not prove all bills were paid. This preview does not calculate your month-end position.</p>')}`;
      case 'connections': return `
        <div class="bbmp-callout">Illustrative statuses only — this preview does not check your real connections.</div>
        ${panel('Example health view',example('Bank connection','Sample status: reconnection needed','Needs attention','orange')+example('Household sync','Sample status: last completed 2 minutes ago','Example only','green')+example('Notification registration','Not checked by this preview','Not checked','purple'))}
        ${panel('Separate the three systems',`<p>Bank data, household synchronization and notification enrollment should each show their own status and recovery action.</p><button type="button" class="bbmp-outline" data-bbmp-action="route:transactions">Open existing Banking ${icon('arrow',16)}</button>`)}`;
      default: return '<p>This preview is unavailable.</p>';
    }
  }
  function updateScenario() {
    const input = document.getElementById('bbmp-extra');
    const result = document.getElementById('bbmp-scenario-result');
    if (!input || !result) return;
    const amount = Number(input.value);
    if (input.value.trim()==='' || !Number.isFinite(amount) || amount<0 || amount>1000000) {
      result.textContent='Enter an example amount from $0 to $1,000,000.';
      result.classList.remove('bbmp-negative');
      return;
    }
    const remainder = 300-amount;
    result.classList.toggle('bbmp-negative',remainder<0);
    result.innerHTML=`<span>${remainder<0?'Example projected shortfall':'Example projected remainder'}</span><strong>${money(Math.abs(remainder))}</strong><small>Original remainder $300 − new expense ${money(amount)}. Sample only.</small>`;
  }
  function close() {
    const dialog = document.getElementById(DIALOG_ID);
    if (!dialog) return;
    if (dialog.open) dialog.close();
    dialog.remove();
  }
  function open(key) {
    if (!active || !TOOLS[key]) return;
    const previousOpener = document.activeElement;
    close();
    const focusTarget = previousOpener;
    const tool=TOOLS[key];
    const dialog=document.createElement('dialog');
    dialog.id=DIALOG_ID;
    dialog.className='bbmp-dialog';
    dialog.setAttribute('aria-labelledby','bbmp-dialog-title');
    dialog.setAttribute('aria-describedby','bbmp-preview-notice');
    dialog.innerHTML=`<header class="bbmp-dialog-header"><div class="bbmp-dialog-heading"><span class="bbmp-icon bbmp-${tool.tone}">${icon(tool.icon)}</span><div><span class="bbmp-eyebrow">TOOL PREVIEW</span><h2 id="bbmp-dialog-title">${escape(tool.name)}</h2></div></div><button type="button" class="bbmp-close" data-bbmp-action="close" aria-label="Close tool preview">${icon('close')}</button></header><div class="bbmp-dialog-body"><p id="bbmp-preview-notice" class="bbmp-sample-notice">Sample data · not your account · new features are not active</p><p class="bbmp-dialog-sub">${escape(tool.sub)}</p>${content(key)}</div>`;
    dialog.addEventListener('close',()=>{
      dialog.remove();
      if(!document.querySelector('#'+DIALOG_ID+'[open]') && focusTarget?.isConnected) focusTarget.focus({preventScroll:true});
    },{once:true});
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const r=dialog.getBoundingClientRect();
      if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)close();
    });
    dialog.addEventListener('input',event=>{
      if(event.target.id==='bbmp-extra')updateScenario();
    });
    document.body.appendChild(dialog);
    if(key==='forecast')updateScenario();
    dialog.showModal();
    dialog.querySelector('.bbmp-close').focus({preventScroll:true});
  }
  function onClick(event) {
    if (!(event.target instanceof Element))return;
    const button=event.target.closest('[data-bbmp-action]');
    if(!button || button.closest('[data-bb-drag-preview],[data-bb-copy-id]'))return;
    if(!button.closest('.bbmp-page,#'+DIALOG_ID))return;
    const action=button.dataset.bbmpAction;
    if(action==='close')close();
    else if(action.startsWith('open:'))open(action.slice(5));
    else if(action.startsWith('route:')) {
      const route=action.slice(6);
      if(!['transactions','activity','settings'].includes(route))return;
      close();
      navigate(route);
    }
  }
  const CSS=String.raw`
    .bbmp-page,.bbmp-dialog {--bbmp-muted:var(--text-secondary,#b4b4c8);--bbmp-line:var(--border,rgba(192,151,255,.18));--bbmp-panel:var(--surface,#20202b);--bbmp-purple:#c58bff;--bbmp-green:#7bdfbf;--bbmp-blue:#82d3f3;--bbmp-orange:#f4c08c;--bbmp-pink:#ed9bc8;color:var(--text,#f5f4fb)}
    html[data-theme="light"] .bbmp-page,html[data-theme="light"] .bbmp-dialog {--bbmp-purple:#7542ad;--bbmp-green:#14795b;--bbmp-blue:#176b91;--bbmp-orange:#92521b;--bbmp-pink:#9a326b}
    .bbmp-page *,.bbmp-dialog * {box-sizing:border-box}
    .bbmp-nav {display:grid!important;grid-template-columns:44px 1fr 44px!important;align-items:center}
    .bbmp-nav .nav-title {text-align:center}
    .bbmp-content {max-width:680px;margin:0 auto;padding-top:16px;padding-bottom:calc(112px + env(safe-area-inset-bottom,0px))!important}
    .bbmp-intro {display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .bbmp-eyebrow {display:block;margin:0 0 7px;font-size:10px;letter-spacing:1.5px;font-weight:800;color:var(--bbmp-muted);line-height:1.4}
    .bbmp-intro h1 {font-size:22px;font-weight:800;line-height:1.25;letter-spacing:-.45px;margin:0;max-width:320px}
    .bbmp-preview-label {flex-shrink:0;display:inline-block;border:1px solid var(--bbmp-line);border-radius:999px;padding:5px 8px;color:var(--bbmp-muted);font-size:10px;font-weight:700;line-height:1.4}
    .bbmp-intro-note,.bbmp-footer {color:var(--bbmp-muted);font-size:12px;line-height:1.55;margin:10px 0 18px}
    .bbmp-bank {width:100%;display:flex;align-items:center;gap:12px;padding:18px 16px;border:1px solid rgba(178,117,242,.35);border-radius:20px;color:inherit;background:radial-gradient(ellipse at top right,rgba(172,79,240,.13),transparent 65%),var(--bbmp-panel);font:inherit;text-align:left;cursor:pointer}
    .bbmp-bank-link {display:flex;align-items:center;gap:4px;font-size:12px;font-weight:750;color:var(--bbmp-purple);white-space:nowrap}
    .bbmp-section {margin-top:22px}
    .bbmp-section-title {margin:0 0 10px 2px;color:var(--bbmp-muted);font-size:12px;font-weight:750;letter-spacing:.6px;text-transform:uppercase;line-height:1.4}
    .bbmp-group {border:1px solid var(--bbmp-line);border-radius:20px;overflow:hidden;background:var(--bbmp-panel)}
    .bbmp-row {width:100%;display:flex;align-items:center;gap:12px;padding:16px 14px;min-height:84px;background:transparent;color:inherit;border:0;font:inherit;text-align:left;cursor:pointer}
    .bbmp-row+.bbmp-row {border-top:1px solid var(--bbmp-line)}
    .bbmp-icon {width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border-radius:14px}
    .bbmp-purple {color:var(--bbmp-purple);background:rgba(153,87,235,.13)}
    .bbmp-green {color:var(--bbmp-green);background:rgba(69,174,138,.12)}
    .bbmp-blue {color:var(--bbmp-blue);background:rgba(66,158,208,.12)}
    .bbmp-orange {color:var(--bbmp-orange);background:rgba(220,143,62,.12)}
    .bbmp-pink {color:var(--bbmp-pink);background:rgba(211,89,157,.12)}
    .bbmp-row-copy {display:block;flex:1;min-width:0}
    .bbmp-row-title {display:block;font-size:14px;font-weight:750;line-height:1.35}
    .bbmp-row-sub {display:block;margin-top:4px;font-size:12px;line-height:1.45;color:var(--bbmp-muted)}
    .bbmp-tag {font-size:9px;line-height:1.3;color:var(--bbmp-muted);border:1px solid var(--bbmp-line);padding:4px 5px;border-radius:6px;flex-shrink:0}
    .bbmp-chevron {display:flex;color:var(--bbmp-muted);flex-shrink:0}
    .bbmp-footer {text-align:center;margin:22px 6px 0}
    .bbmp-dialog {position:fixed;inset:0;margin:auto;width:calc(100% - 24px);max-width:580px;height:auto;max-height:calc(100dvh - 32px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));padding:0;border:1px solid var(--bbmp-line);border-radius:24px;background:var(--bg,#15151e);font-family:inherit;overflow:hidden;box-shadow:0 20px 70px rgba(0,0,0,.35)}
    .bbmp-dialog[open] {display:flex;flex-direction:column}
    .bbmp-dialog::backdrop {background:rgba(0,0,0,.62)}
    .bbmp-dialog-header {padding:18px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--bbmp-line);flex:0 0 auto;background:var(--bbmp-panel)}
    .bbmp-dialog-heading {display:flex;align-items:center;gap:12px;min-width:0}
    .bbmp-dialog-heading>div {min-width:0}
    .bbmp-dialog-header .bbmp-eyebrow {font-size:9px;margin-bottom:3px}
    .bbmp-dialog h2 {font-size:18px;line-height:1.3;font-weight:800;letter-spacing:-.2px;margin:0;overflow-wrap:anywhere}
    .bbmp-close {display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;padding:0;border:1px solid var(--bbmp-line);border-radius:14px;background:transparent;color:var(--bbmp-muted);cursor:pointer}
    .bbmp-dialog-body {min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:16px 16px calc(22px + env(safe-area-inset-bottom,0px))}
    .bbmp-sample-notice {font-size:10px;line-height:1.5;font-weight:750;color:var(--bbmp-purple);margin:0 0 10px;letter-spacing:.2px}
    .bbmp-dialog-sub {font-size:13px;line-height:1.5;color:var(--bbmp-muted);margin:0 0 18px}
    .bbmp-metric-grid {display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:14px}
    .bbmp-metric {display:flex;flex-direction:column;gap:6px;min-width:0;border:1px solid var(--bbmp-line);border-radius:16px;padding:14px 12px;background:var(--bbmp-panel)}
    .bbmp-metric>span,.bbmp-metric small {font-size:11px;color:var(--bbmp-muted);line-height:1.4}
    .bbmp-metric strong {font-size:25px;line-height:1.2;letter-spacing:-.5px;font-weight:800}
    .bbmp-panel {padding:16px 14px;border:1px solid var(--bbmp-line);background:var(--bbmp-panel);border-radius:18px;margin-bottom:14px}
    .bbmp-panel h3,.bbmp-empty h3 {font-size:14px;line-height:1.4;margin:0 0 12px;font-weight:750}
    .bbmp-panel p,.bbmp-empty p {font-size:13px;line-height:1.65;margin:0 0 10px;color:var(--bbmp-muted)}
    .bbmp-panel p:last-child {margin-bottom:0}
    .bbmp-detail {display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid var(--bbmp-line);font-size:12px;line-height:1.5}
    .bbmp-detail:last-child {border:0;padding-bottom:0}
    .bbmp-detail strong {font-weight:750;text-align:right;flex-shrink:0}
    .bbmp-detail small {display:block;font-size:11px;line-height:1.5;color:var(--bbmp-muted);margin-top:3px}
    .bbmp-field-label {display:block;font-size:12px;line-height:1.5;font-weight:700;margin-bottom:8px}
    .bbmp-input-wrap {display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--bbmp-line);border-radius:12px;background:var(--bg,#15151e)}
    .bbmp-input-wrap input {flex:1;min-width:0;width:100%;border:0;padding:0;margin:0;background:transparent;color:inherit;font:inherit;font-size:18px;min-height:26px;outline-offset:3px}
    .bbmp-help {font-size:11px!important;line-height:1.6!important;color:var(--bbmp-muted)!important;margin-top:8px!important}
    .bbmp-result {display:flex;flex-direction:column;gap:6px;margin-top:16px;padding:14px;border:1px solid rgba(69,174,138,.28);border-radius:14px;color:var(--bbmp-green);background:rgba(69,174,138,.06);font-size:12px}
    .bbmp-result strong {font-size:28px;font-weight:800;line-height:1.2}
    .bbmp-result small {font-size:10px;line-height:1.5;color:var(--bbmp-muted)}
    .bbmp-negative {color:var(--overdue,#ef8295);border-color:rgba(220,90,100,.3);background:rgba(220,90,100,.05)}
    .bbmp-goal+.bbmp-goal {border-top:1px solid var(--bbmp-line);margin-top:18px;padding-top:18px}
    .bbmp-goal-heading {display:flex;justify-content:space-between;gap:12px;font-size:12px;line-height:1.5}
    .bbmp-goal-heading>span {color:var(--bbmp-muted);white-space:nowrap}
    .bbmp-goal progress {display:block;appearance:none;width:100%;height:8px;margin:12px 0;border:0;border-radius:8px;overflow:hidden;background:var(--bbmp-line);accent-color:var(--bbmp-purple)}
    .bbmp-goal progress::-webkit-progress-bar {background:var(--bbmp-line);border-radius:8px}
    .bbmp-goal progress::-webkit-progress-value {background:linear-gradient(90deg,#8956d8,#df7bb4);border-radius:8px}
    .bbmp-goal small {font-size:11px;color:var(--bbmp-muted);line-height:1.4}
    .bbmp-example {display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid var(--bbmp-line)}
    .bbmp-example:last-child {border:0;padding-bottom:0}
    .bbmp-example>div {min-width:0;flex:1}
    .bbmp-example strong {display:block;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
    .bbmp-example small {display:block;margin-top:4px;font-size:11px;line-height:1.55;color:var(--bbmp-muted)}
    .bbmp-dot {width:8px;height:8px;margin-top:6px;border-radius:50%;flex:0 0 8px;background:currentColor}
    .bbmp-example-value {font-size:10px;line-height:1.5;color:var(--bbmp-muted);max-width:90px;text-align:right}
    .bbmp-callout {padding:12px;border-radius:12px;border:1px solid var(--bbmp-line);background:rgba(153,87,235,.06);font-size:12px;line-height:1.6;color:var(--bbmp-muted);margin-bottom:14px}
    .bbmp-panel .bbmp-callout:last-child {margin-bottom:0}
    .bbmp-history {height:130px;display:flex;gap:18px;align-items:flex-end;padding:8px 10px 0}
    .bbmp-history>div {height:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:8px}
    .bbmp-history i {display:block;width:100%;max-width:60px;height:var(--level);background:linear-gradient(0deg,#7652b2,#ba7bde);border-radius:8px 8px 3px 3px}
    .bbmp-history span {font-size:10px;color:var(--bbmp-muted)}
    .bbmp-empty {text-align:center;padding:18px 14px;border:1px dashed var(--bbmp-line);border-radius:18px;color:var(--bbmp-muted)}
    .bbmp-empty>svg {color:var(--bbmp-purple);margin-bottom:12px}
    .bbmp-empty small {font-size:11px;line-height:1.6;display:block}
    .bbmp-outline {width:100%;display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:10px 14px;border:1px solid var(--bbmp-purple);border-radius:999px;background:transparent;color:var(--bbmp-purple);font:inherit;font-size:12px;font-weight:750;cursor:pointer}
    .bbmp-row:focus-visible,.bbmp-bank:focus-visible,.bbmp-dialog button:focus-visible {outline:2px solid var(--bbmp-purple);outline-offset:-4px}
    @media(max-width:360px) {.bbmp-row{gap:9px;padding-left:12px;padding-right:12px}.bbmp-row-title{font-size:13px}.bbmp-row-sub{font-size:11px}.bbmp-icon{width:38px;height:38px;flex-basis:38px}.bbmp-tag{font-size:8px;padding:3px}.bbmp-intro{flex-wrap:wrap}.bbmp-intro h1{font-size:21px}.bbmp-dialog h2{font-size:16px}}
    @media(prefers-reduced-motion:reduce) {.bbmp-page{animation:none!important}}
  `;
  function ensureStyle() {
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;style.textContent=CSS;document.head.appendChild(style);
  }
  function redrawIfMore() {
    if(typeof currentRoute!=='undefined' && currentRoute==='more' && typeof render==='function')render();
  }
  function uninstall() {
    if(!active)return;
    close();active=false;
    document.removeEventListener('click',onClick);
    document.removeEventListener('DOMContentLoaded',start);
    ['billbeacon:signed-out','billbeacon-signed-out'].forEach(name=>window.removeEventListener(name,close));
    if(renderMore===previewRenderMore)renderMore=savedRenderMore;
    redrawIfMore();
    document.getElementById(STYLE_ID)?.remove();
    delete window.BillBeaconMorePreview;
  }
  function start(){if(!active)return;ensureStyle();redrawIfMore();}
  renderMore=previewRenderMore;
  document.addEventListener('click',onClick);
  ['billbeacon:signed-out','billbeacon-signed-out'].forEach(name=>window.addEventListener(name,close));
  window.BillBeaconMorePreview=Object.freeze({version:'1.0.0',sampleData:true,open,close,uninstall});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

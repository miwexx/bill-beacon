/* Bill Beacon feature organization v1.
   Load AFTER more-tools-preview.js and more-popup-swipe.js.
   Adds shortcuts to existing tools; does not rewrite bills, payments or totals. */
(() => {
  'use strict';
  if (window.BillBeaconFeatureOrganization) return;
  if (!window.BillBeaconMoreLive || typeof render !== 'function') {
    console.error('Feature organization: load existing app and More tools first.');
    return;
  }
  let scheduled = false, helpDialog = null;
  const STYLE = 'bb-feature-organization-style';
  const owned = new Set(['bb-organize-dashboard', 'bb-organize-insights', 'bb-organize-bills', 'bb-organize-settings']);
  function identity() {
    const user = window.getBillBeaconFirebaseUser?.();
    const context = window.getBillBeaconHouseholdContext?.();
    return user?.uid && context?.ready && context.uid === user.uid && context.householdId
      ? JSON.stringify([user.uid, context.householdId, context.generation]) : null;
  }
  function installStyle() {
    if (document.getElementById(STYLE)) return;
    const style = document.createElement('style');style.id = STYLE;
    style.textContent = `
      .bb-organize-strip{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}
      .bb-organize-strip button,.bb-organize-help button{font:inherit;min-height:44px;padding:10px 14px;border:1px solid var(--border);border-radius:14px;background:var(--surface);color:var(--text);font-size:var(--text-sm,13px);font-weight:650;cursor:pointer;}
      .bb-organize-strip button[data-attention="true"]{border-color:var(--accent);}
      .bb-organize-strip button:focus-visible,.bb-organize-help button:focus-visible{outline:2px solid var(--accent);outline-offset:3px;}
      .bb-organize-strip .bb-organize-note{flex:0 0 100%;font-size:var(--text-xs,11px);line-height:1.5;color:var(--text-secondary);}
      .bb-organize-help{margin:auto;width:min(440px,calc(100% - 28px));max-height:85dvh;box-sizing:border-box;overflow:auto;padding:22px;border:1px solid var(--border);border-radius:24px;background:var(--surface);color:var(--text);font-family:inherit;}
      .bb-organize-help::backdrop{background:rgba(0,0,0,.7);}
      .bb-organize-help h2{margin:0 0 12px;font-size:22px;}
      .bb-organize-help p{font-size:14px;line-height:1.6;color:var(--text-secondary);margin:0 0 16px;}
      .bb-organize-help button{display:block;width:100%;margin-top:8px;text-align:left;}
      .bb-organize-help button:last-child{text-align:center;}
    `;
    document.head.appendChild(style);
  }
  function button(action, text, attention = false) {
    const node = document.createElement('button');node.type = 'button';
    node.dataset.bbOrganize = action;node.textContent = text;
    if (attention) node.dataset.attention = 'true';
    return node;
  }
  function strip(container, id, entries, note = '', after = null) {
    let node = document.getElementById(id);
    if (!entries.length) {node?.remove();return;}
    const signature = JSON.stringify([entries,note]);
    if (node?.dataset.signature === signature) return;
    if (!node) {
      node = document.createElement('section');node.id = id;
      node.className = 'bb-organize-strip';node.setAttribute('aria-label','Related tools');
      if (after?.isConnected) after.insertAdjacentElement('afterend', node);
      else container.prepend(node);
    }
    node.dataset.signature = signature;
    node.replaceChildren(...entries.map(entry => button(...entry)));
    if (note) {
      const caption = document.createElement('p');caption.className = 'bb-organize-note';caption.textContent = note;node.appendChild(caption);
    }
  }
  function decorate() {
    scheduled = false;
    if (!identity()) return;
    const app = document.getElementById('app');
    const main = app?.querySelector('.main-content');
    if (!main) return;
    const container = main.querySelector('.content-pad') || main;
    const route = typeof currentRoute === 'string' ? currentRoute : '';
    const activeLabel = (app.querySelector('.tab-item.active')?.textContent || '').trim().replace(/\s+/g,' ');
    const insight = /^Insights$/i.test(activeLabel);
    const summary = window.BillBeaconFeatureBridge?.summary?.();
    const required = new Set();
    if (route === 'today' && summary) {
      required.add('bb-organize-dashboard');
      const entries = [['income', summary.incomeCount ? 'Manage income' : 'Set up income', !summary.incomeCount]];
      if (!summary.billCount) entries.push(['add', 'Add your first bill', true]);
      if (summary.reviewCount > 0) entries.push(['tool:review', `Needs Review (${summary.reviewCount})`, true]);
      strip(container, 'bb-organize-dashboard', entries, '', main.querySelector('.dashboard-month-card'));
    }
    if (insight) {
      required.add('bb-organize-insights');
      const month = new Date().toLocaleDateString(undefined,{month:'long',year:'numeric'});
      strip(container, 'bb-organize-insights', [['tool:monthly', `Monthly Review · ${month}`]],
        'This review opens the current calendar month. Payment-date totals and bill due-month totals are different views.');
    }
    if (route === 'bills') {
      required.add('bb-organize-bills');
      strip(container, 'bb-organize-bills', [['tool:subscriptions','Subscriptions'],['tool:cards','Credit Cards']],
        'Shortcuts to the existing tools. Subscriptions use your saved category; these are not new or duplicated bill records.');
    }
    if (route === 'settings') {
      required.add('bb-organize-settings');
      strip(container, 'bb-organize-settings', [['tool:connections','Connections & Sync'],['help','Help & Tutorial']]);
    }
    for (const id of owned) if (!required.has(id)) document.getElementById(id)?.remove();
  }
  function schedule() {
    if (scheduled) return;scheduled = true;requestAnimationFrame(decorate);
  }
  function closeHelp() {if (helpDialog?.open) helpDialog.close();else helpDialog?.remove();helpDialog = null;}
  function showHelp() {
    if (!identity() || helpDialog) return;
    const trigger = document.activeElement;
    const dialog = document.createElement('dialog');helpDialog = dialog;
    dialog.className = 'bb-organize-help';dialog.setAttribute('aria-labelledby','bb-organize-help-title');
    const heading = document.createElement('h2');heading.id='bb-organize-help-title';heading.textContent='Help & Tutorial';
    const text = document.createElement('p');text.textContent='Start with income, add your bills, then review your paycheck plan on the Dashboard. Replay the visual tour whenever you need a reminder.';
    dialog.append(heading,text,button('tutorial','Replay tutorial'),button('income','Income & Paychecks'),button('backup','Backup & Restore'),button('help-close','Close'));
    dialog.addEventListener('close',()=>{dialog.remove();if(helpDialog===dialog)helpDialog=null;if(trigger?.isConnected&&trigger.getClientRects().length)trigger.focus({preventScroll:true});},{once:true});
    document.body.appendChild(dialog);dialog.showModal();
  }
  function settingsSection(key) {
    const scope = identity();
    if (!scope) return;
    navigate('settings');
    requestAnimationFrame(()=>{
      if (identity() === scope && typeof window.openSettingsSection === 'function') window.openSettingsSection(key);
    });
  }
  function handle(action) {
    if (!identity()) return;
    if (action === 'help-close') {closeHelp();return;}
    if (action === 'help') {showHelp();return;}
    if (action === 'tutorial') {
      const scope = identity();closeHelp();
      requestAnimationFrame(()=>{
        if (identity() !== scope) return;
        if (!window.BillBeaconTutorial?.preview?.()) alert('The tutorial is not ready. Close any open dialog and try again.');
      });
      return;
    }
    if (action === 'income' || action === 'backup') {
      closeHelp();settingsSection(action === 'income' ? 'income' : 'records');return;
    }
    if (action === 'add') {
      if (typeof openAddMenu === 'function') openAddMenu();
      else if (typeof openBillForm === 'function') openBillForm();
      return;
    }
    if (action.startsWith('tool:')) {
      const key = action.slice(5);
      if (['monthly','subscriptions','cards','review','connections'].includes(key)) window.BillBeaconMoreLive.open(key);
    }
  }
  document.addEventListener('click',event=>{
    const target = event.target instanceof Element ? event.target.closest('[data-bb-organize]') : null;
    if (!target) return;event.preventDefault();handle(target.dataset.bbOrganize);
  });
  function start() {
    installStyle();
    const app = document.getElementById('app');
    if (app) new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
    schedule();
  }
  for (const name of ['billbeacon:household-ready','billbeacon:data-changed']) window.addEventListener(name,schedule);
  for (const name of ['billbeacon:signed-out','billbeacon:authenticated']) window.addEventListener(name,closeHelp);
  window.BillBeaconFeatureOrganization = Object.freeze({version:1,refresh:schedule});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
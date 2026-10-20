/* Bill Beacon More tools — app-data beta v2.
REPLACE the old more-tools-preview.js with this file. Load once LAST:
<script src="js/more-tools-preview.js?v=2"></script>
Reads existing Store records and app calculation helpers. No new record schema,
network requests, storage writes, permission requests or automatic corrections.
Goals, card debt terms and documents remain unconfigured when unsupported.
Figures are current-device household snapshots, not bank-balance guarantees.
Remove the script and reload to restore More; uninstall() also restores it.
Validation: syntax check plus 39 Chromium fixture checks passed. These checks
use controlled records and adapter functions, not your deployed production app.
*/
(() => {
 'use strict';
 if(window.BillBeaconMoreLive)return;
 if(typeof renderMore!=='function'||typeof navigate!=='function'||typeof Store==='undefined'){
  console.error('More tools: load after app.js and all app add-ons.');return;
 }
 window.BillBeaconMorePreview?.uninstall?.();
 const originalMore=renderMore, STYLE='bbml-style', DIALOG='bbml-dialog';
 let active=true, opened=null, openedScope=null, timer=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const array=x=>Array.isArray(x)?x:[];
 const num=x=>x!==null&&x!==undefined&&String(x).trim()!==''&&Number.isFinite(Number(x))?Number(x):null;
 const cents=x=>{const n=num(x);return n!==null&&n>=0&&Number.isSafeInteger(Math.round(n*100))?Math.round(n*100):null;};
 const total=xs=>{let n=0;for(const x of xs){const c=cents(x);if(c===null||!Number.isSafeInteger(n+c))return null;n+=c;}return n/100;};
 function date(x){if(!x)return null;const s=String(x);if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const [y,m,d]=s.split('-').map(Number);const t=new Date(y,m-1,d,12);return t.getFullYear()===y&&t.getMonth()===m-1&&t.getDate()===d?t:null;}const t=new Date(s);return Number.isFinite(t.getTime())?t:null;}
 const sameMonth=(x,ref=new Date())=>{const d=date(x);return !!d&&d.getFullYear()===ref.getFullYear()&&d.getMonth()===ref.getMonth();};
 const fmtDate=x=>{const d=date(x);return d?d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Date unavailable';};
 const monthLabel=()=>new Date().toLocaleDateString(undefined,{month:'long',year:'numeric'});
 function money(x,s){if(x===null||!Number.isFinite(Number(x)))return 'Unavailable';const currency=s?.settings?.currency||'USD';try{return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(Number(x));}catch{return Number(x).toFixed(2)+' '+currency;}}
 function scope(){
  if(typeof window.getBillBeaconFirebaseUser!=='function'||typeof window.getBillBeaconHouseholdContext!=='function')return {ok:false,reason:'Household identity helpers are unavailable. Records are not displayed.'};
  const u=window.getBillBeaconFirebaseUser(),h=window.getBillBeaconHouseholdContext();
  if(!u?.uid)return {ok:false,reason:'Sign in to view household data.'};
  if(!h?.ready||!h.householdId||h.uid!==u.uid)return {ok:false,reason:'Wait for your signed-in household to finish loading.'};
  return {ok:true,key:JSON.stringify([u.uid,h.householdId,h.generation??null]),context:h};
 }
 function snapshot(){
  const identity=scope();if(!identity.ok)return {ok:false,reason:identity.reason};
  try{
   const read=name=>{if(typeof Store[name]!=='function')throw new Error('Missing '+name);const v=Store[name]();if(!Array.isArray(v)||v.some(x=>!x||typeof x!=='object'||Array.isArray(x)))throw new Error('Invalid '+name);return v;};
   const settings=Store.getSettings();if(!settings||typeof settings!=='object')throw new Error('Settings unavailable');
   return {ok:true,scope:identity.key,bills:read('getBills'),payments:read('getPayments'),income:read('getIncomeSources'),activity:read('getActivityLog'),settings};
  }catch{return {ok:false,reason:'The app records could not be read safely. Open the existing screens and check household sync.'};}
 }
 const enabled=b=>b&&!b.archived&&!b.archivedAt&&!b.cancelled&&!b.cancelledAt&&!['cancelled','canceled','archived','paid-in-full','paidInFull'].includes(b.status)&&!b.paidInFullAt;
 const regular=s=>s.bills.filter(b=>enabled(b)&&!b.installmentPlanId&&!b.splitPaymentParentId);
 function paymentActive(p){try{if(typeof isFinancialPaymentActive==='function')return !!isFinancialPaymentActive(p);}catch{return false;}return !!p&&!p.voidedAt&&(!p.status||p.status==='active');}
 function uniquePayments(s){const seen=new Set();return s.payments.filter(p=>{if(!p||!p.id)return !!p;if(seen.has(p.id))return false;seen.add(p.id);return true;});}
 const PATHS={bank:'M3 10h18M4 10v10M9 10v10M15 10v10M20 10v10M2 21h20M12 3 2 8h20Z',forecast:'m3 17 5-5 4 3 8-10M14 5h6v6',goal:'M20 12a8 8 0 1 1-3-6M16 12a4 4 0 1 1-4-4M12 12l9-9M17 3h4v4',renew:'M20 7v5h-5M4 17v-5h5M5 8a7 7 0 0 1 12-3l3 4M4 15l3 4a7 7 0 0 0 12-3',card:'M3 5h18v14H3ZM3 10h18M7 15h4',review:'M9 3h6v4H9ZM9 5H5v16h14V5h-4M9 12h6M9 16h4',report:'M5 3h10l4 4v14H5ZM14 3v5h5M9 17v-3M12 17v-6M15 17v-4',activity:'M3 12h4l3-7 4 14 3-7h4',sync:'M20 7v5h-5M4 17v-5h5M5 8a7 7 0 0 1 12-3l3 4M4 15l3 4a7 7 0 0 0 12-3',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',document:'M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h6',arrow:'m9 5 7 7-7 7',close:'m6 6 12 12M18 6 6 18'};
 const icon=(name,size=22)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PATHS[name]||PATHS.document}"/></svg>`;
 const TOOLS={forecast:['Forecast & What-If','Compare expected income with assigned bills.','forecast','purple'],goals:['Savings Plan','Organize goals, emergency funds and planned transfers.','goal','green'],subscriptions:['Subscriptions & Renewals','Your subscription-category bills and saved schedules.','renew','pink'],cards:['Credit Cards','Existing Credit Card Bills.','card','blue'],documents:['Bill Documents','Your saved bill notes; attachments are not enabled.','document','orange'],review:['Needs Review','Basic checks of the records already in the app.','review','orange'],monthly:['Monthly Review','Recorded payments and changes for this month.','report','purple'],connections:['Connections & Sync Health','What this device currently knows about connections.','sync','green']};
 const note=t=>`<div class="bbml-callout">${esc(t)}</div>`;
 const help=t=>`<p class="bbml-help">${esc(t)}</p>`;
 const panel=(t,b)=>`<section class="bbml-panel"><h3>${esc(t)}</h3>${b}</section>`;
 const empty=(t,b)=>`<div class="bbml-empty">${icon('document',30)}<h3>${esc(t)}</h3><p>${esc(b)}</p></div>`;
 const metric=(label,value,sub='')=>`<div class="bbml-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(sub)}</small></div>`;
 const metrics=(a,b)=>`<div class="bbml-metrics">${a}${b}</div>`;
 const detail=(label,value,sub='')=>`<div class="bbml-detail"><div><span>${esc(label)}</span>${sub?`<small>${esc(sub)}</small>`:''}</div><strong>${esc(value)}</strong></div>`;
 const routeButton=(label,route)=>`<button type="button" class="bbml-outline" data-bbml-action="route:${esc(route)}">${esc(label)} ${icon('arrow',16)}</button>`;
 function item(title,sub,value='',action=''){
  const tag=action?'button':'div';return `<${tag} ${action?`type="button" data-bbml-action="${esc(action)}"`:''} class="bbml-item"><span class="bbml-dot"></span><span class="bbml-item-copy"><strong>${esc(title)}</strong><small>${esc(sub)}</small></span>${value?`<span class="bbml-value">${esc(value)}</span>`:''}${action?icon('arrow',14):''}</${tag}>`;
 }
 function billItem(b,s,sub){return item(b.name||'Unnamed bill',sub,money(num(b.amount),s),'bill:'+b.id);}
 function row(name,sub,symbol,tone,action,tag=''){
  return `<button type="button" class="bbml-row" data-bbml-action="${esc(action)}"><span class="bbml-icon bbml-${tone}">${icon(symbol)}</span><span class="bbml-row-copy"><span class="bbml-row-title">${esc(name)}</span><span class="bbml-row-sub">${esc(sub)}</span></span>${tag?`<span class="bbml-tag">${esc(tag)}</span>`:''}<span class="bbml-chevron">${icon('arrow',16)}</span></button>`;
 }
 const group=(title,body)=>`<section class="bbml-section"><h2>${esc(title)}</h2><div class="bbml-group">${body}</div></section>`;
 function main(){
  const s=snapshot();const tool=k=>{const t=TOOLS[k];return row(t[0],t[1],t[2],t[3],'open:'+k,k==='goals'?'Shared':k==='documents'?'Notes':k==='cards'?'Bills':'Read-only');};
  return `<div class="nav-bar"><div class="nav-bar-content bbml-nav"><span></span><div class="nav-title">More</div><span></span></div></div><div class="main-content fade-in bbml-page"><div class="content-pad bbml-content"><div class="bbml-intro"><div><p class="bbml-eyebrow">YOUR MONEY TOOLKIT</p><h1>Plan ahead. Stay in control.</h1></div><span class="bbml-badge">App-data beta</span></div><p class="bbml-intro-note">${esc(s.ok?'Your household records and shared savings plans.':s.reason)}</p><button type="button" class="bbml-bank" data-bbml-action="route:transactions"><span class="bbml-icon bbml-purple">${icon('bank',24)}</span><span class="bbml-row-copy"><span class="bbml-row-title">Banking</span><span class="bbml-row-sub">Open your existing transactions</span></span><span class="bbml-bank-link">View ${icon('arrow',15)}</span></button>${group('Planning',tool('forecast')+tool('goals'))}${group('Manage',tool('subscriptions')+tool('cards')+tool('documents'))}${group('Review',tool('review')+tool('monthly')+row('Activity & Changes','Your existing bill and payment change history.','activity','orange','route:activity'))}${group('App',tool('connections')+row('Settings','Account, appearance, reminders and backups.','settings','purple','route:settings'))}<p class="bbml-footer">No sample records · projections are not available balances · ${esc(monthLabel())}</p></div></div>`;
 }
 function forecast(s){
  if(!s.income.length)return {error:'No income sources are saved. Add income in Settings before comparing income with bills.'};
  if(typeof getPaycheckPlan!=='function'||typeof getTotalIncomeForPayCycle!=='function')return {error:'The existing paycheck calculation helpers are unavailable. No substitute totals were invented.'};
  try{const p=getPaycheckPlan(new Date());const first=num(getTotalIncomeForPayCycle('first')),second=num(getTotalIncomeForPayCycle('second'));
   if(first===null||second===null||!p?.first||!p?.second||cents(p.first.scheduled)===null||cents(p.second.scheduled)===null)throw new Error();
   return {plan:p,first,second};
  }catch{return {error:'The app paycheck plan could not be calculated. Check Needs Review and the existing Dashboard.'};}
 }
 function forecastHTML(s){
  const f=forecast(s);if(f.error)return empty('Forecast not available',f.error)+routeButton('Open Settings','settings');
  const p=f.plan;const first=f.first-Number(p.first.scheduled),second=f.second-Number(p.second.scheduled);
  return note('Current-month funding model: full expected income minus all assigned scheduled bills, including paid bills. This is not a bank balance or money left to spend.')+metrics(metric('Paycheck 1 model',money(first,s),monthLabel()),metric('Paycheck 2 model',money(second,s),monthLabel()))+panel('Existing paycheck plan',detail('Paycheck 1 expected income',money(f.first,s))+detail('Paycheck 1 scheduled bills',money(p.first.scheduled,s))+detail('Paycheck 2 expected income',money(f.second,s))+detail('Paycheck 2 scheduled bills',money(p.second.scheduled,s))+(p.previous?detail('Previous-paycheck scheduled bills',money(p.previous.scheduled,s),'Separate funding bucket; excluded from the two comparisons above.'):'') )+help('Uses the app’s current income-estimate and paycheck-assignment rules. Variable/manual income, everyday spending, savings, older overdue bills and actual account balances may not be included. No money is reserved.')+panel('Try a hypothetical change',`<label for="bbml-cycle" class="bbml-field-label">Apply to paycheck</label><select id="bbml-cycle" class="bbml-input"><option value="first">Paycheck 1</option><option value="second">Paycheck 2</option></select><label for="bbml-extra" class="bbml-field-label">Additional expense (${esc(s.settings.currency||'USD')})</label><input id="bbml-extra" class="bbml-input" type="number" min="0" max="1000000000" step="0.01" inputmode="decimal" value="0"><div id="bbml-result" class="bbml-result" aria-live="polite"></div>${help('This adjustment exists only in this open screen. It does not add a bill or change your paycheck plan.')}`)+routeButton('Open Dashboard paycheck plan','today');
 }
 function normalizedMonthly(b){const n=num(b.amount);if(n===null||n<0)return null;return ({Weekly:n*52/12,'Every 2 Weeks':n*26/12,Monthly:n,Quarterly:n/3,Yearly:n/12})[b.recurrence]??null;}
 function nextDates(bills){
  const result=new Map(),today=new Date();today.setHours(0,0,0,0);
  const add=(id,value)=>{const d=date(value);if(d&&d>=today&&(!result.has(id)||d<result.get(id)))result.set(id,d);};
  try{if(typeof getCalendarBillsForMonth==='function')for(let i=0;i<13;i++)for(const x of array(getCalendarBillsForMonth(new Date(today.getFullYear(),today.getMonth()+i,1,12))))add(x.sourceBillId||x.id,x.dueDate);
   if(typeof getCurrentCalendarBillOccurrence==='function')for(const b of bills){const x=getCurrentCalendarBillOccurrence(b,new Date());if(x)add(b.id,x.dueDate);}
  }catch{}
  return result;
 }
 function subscriptionsHTML(s) {
   const bills = regular(s).filter(
     b => b.category === 'subscriptions'
   );

   if (!bills.length) {
     return empty(
       'No subscription-category bills',
       'Only bills already categorized as Subscriptions appear here. Other recurring bills are not automatically reclassified.'
     ) + routeButton('Open Bills', 'bills');
   }

   const amounts = bills.map(normalizedMonthly);

   const known = amounts.filter(
     value => value !== null
   );

   const upcoming = nextDates(bills);

   const summary = metrics(
     metric(
       'Subscription Bills',
       String(bills.length),
       'Explicit Subscriptions Category'
     ),
     metric(
       'Monthly Equivalent',
       money(known.length ? total(known) : null, s),
       `${known.length} Of ${bills.length} Schedules Normalized` +
       (known.length < bills.length ? ' · partial total' : '')
     )
   );

   const list = panel(
     'Saved Subscription Schedules',
     bills.slice(0, 50).map(b => {
       const next = upcoming.get(b.id);

       return item(
         b.name || 'Subscription',
         `${b.recurrence || 'No Recurrence'} · ${
           next
             ? 'Next Displayed Occurrence: ' + fmtDate(next)
             : 'Next Occurrence Unavailable'
         }`,
         money(num(b.amount), s)
       );
     }).join('')
   );

   const overflow = bills.length > 50
     ? help(
         'Showing the first 50 subscription bills. Open Bills for the full list.'
       )
     : '';

   return summary +
     list +
     overflow +
     routeButton('Open Bills', 'bills');
 }
 function reviewIssues(s){
  const issues=[],add=(title,sub,b)=>issues.push({title,sub,id:b?.id});const regularBills=regular(s),byId=new Map(s.bills.map(b=>[b.id,b])),names=new Map();
  for(const b of regularBills){
   if(cents(b.amount)===null)add('Invalid bill amount',b.name||'Unnamed bill',b);
   if(!date(b.dueDate))add('Missing or invalid due date',b.name||'Unnamed bill',b);
   if(b.recurrence==='Monthly'&&b.dueDay!=null&&(!Number.isInteger(Number(b.dueDay))||Number(b.dueDay)<1||Number(b.dueDay)>31))add('Invalid monthly due day',b.name||'Unnamed bill',b);
   const name=String(b.name||'').trim().toLowerCase().replace(/\s+/g,' ');
   if(name&&cents(b.amount)!==null){const k=JSON.stringify([name,cents(b.amount),b.recurrence||'None',b.dueDay??null,b.dueDate||'']);if(names.has(k))add('Possible duplicate bill',`${b.name} has the same name, amount and stored schedule as another active bill. Compare before changing anything.`,b);else names.set(k,b.id);}
  }
  for(const b of s.bills.filter(enabled)){
   if(b.splitPaymentParentId&&!byId.has(b.splitPaymentParentId))add('Split portion has no active parent',b.name||'Linked portion',b);
   for(const p of Object.values(b.splitOccurrencePlans||{})){if(!p?.enabled)continue;const ids=array(p.partIds),parts=ids.map(id=>byId.get(id));if(ids.length<2||new Set(ids).size!==ids.length||parts.some(x=>!x)){add('Split schedule needs review',`${b.name}: a linked portion is missing or duplicated.`,b);continue;}const sum=total(parts.map(x=>x.amount));if(sum===null||!Number.isSafeInteger(p.totalCents)||Math.round(sum*100)!==p.totalCents)add('Split total does not match',`${b.name}: linked portions do not match the saved split total.`,b);}
  }
  try{if(typeof plaidBankState!=='undefined'){for(const tx of array(plaidBankState.transactions))if(['review','needs-review','needs_review','manual-review','ambiguous','conflict'].includes(String(tx.matchStatus||'').toLowerCase()))issues.push({title:'Bank transaction flagged for review',sub:String(tx.merchantName||'Transaction')+' · '+fmtDate(tx.date),route:'transactions'});}}
  catch{}
  return issues;
 }
 function reviewHTML(s){const issues=reviewIssues(s);return metrics(metric('Review items',String(issues.length),'Basic local checks'),metric('Active bill definitions',String(regular(s).length),'Excludes installments and split children'))+note('These checks are not the full audit. A possible duplicate is not confirmed, and an unflagged record is not guaranteed correct. No corrections or payment matches are applied.')+(issues.length?panel('Records to inspect',issues.slice(0,100).map(x=>item(x.title,x.sub,'',x.id?'bill:'+x.id:'route:'+(x.route||'bills'))).join('')):empty('No issues found by these checks','No invalid amounts, due dates, basic duplicate definitions, broken split links or loaded bank review flags were found. Other problems may still exist.'))+routeButton('Open existing Activity & Changes','activity');}
 function monthlyHTML(s){
  const payments=uniquePayments(s);const posted=payments.filter(p=>paymentActive(p)&&sameMonth(p.paidDate));const reversed=payments.filter(p=>(p.status==='voided'||p.voidedAt)&&sameMonth(p.voidedAt));const changes=s.activity.filter(a=>sameMonth(a.timestamp)).slice().sort((a,b)=>(date(b.timestamp)?.getTime()||0)-(date(a.timestamp)?.getTime()||0));
  let summary=null;try{if(typeof getDashboardMonthSummary==='function')summary=getDashboardMonthSummary(new Date());}catch{}
  const names=new Map(s.bills.map(b=>[b.id,b.name]));const amount=total(posted.map(p=>p.amount));
  return metrics(metric('Payments recorded',money(amount,s),'Active payment records with paidDate this month'),metric('Recorded changes',String(changes.length),monthLabel()))+help('Recorded payments use the payment date. Scheduled and unpaid figures below use the bill occurrence’s due month, so they are not directly comparable totals.')+(summary?panel('Existing Dashboard occurrence summary',detail('Scheduled for this due month',money(num(summary.scheduled),s))+detail('Unpaid in this due month',money(num(summary.remainingTotal),s))+detail('Active payment records this month',String(posted.length))+detail('Reversals recorded this month',String(reversed.length))):note('The existing Dashboard month-summary helper is unavailable; scheduled totals are not estimated from raw bill definitions.'))+panel('Latest recorded payments',posted.length?posted.slice().sort((a,b)=>(date(b.paidDate)?.getTime()||0)-(date(a.paidDate)?.getTime()||0)).slice(0,20).map(p=>item(p.billSnapshot?.name||names.get(p.billId)||'Historical bill',`Recorded ${fmtDate(p.paidDate)} · due ${fmtDate(p.paidForDueDate)}`,money(num(p.amount),s),names.has(p.billId)?'bill:'+p.billId:'')).join(''):help('No active payments with a payment date in this month.'))+panel('Latest activity this month',changes.length?changes.slice(0,25).map(a=>item(a.title||a.action||'Activity',`${fmtDate(a.timestamp)}${a.detail?' · '+a.detail:''}`)).join(''):help('No saved activity entries dated this month.'))+help('Only existing history is shown. Earlier events that were never recorded cannot be reconstructed. Payment records do not prove a bank transfer occurred.')+routeButton('Open complete Activity & Changes','activity');
 }
 function connectionsHTML(s){
  let bank=null;try{if(typeof plaidBankState!=='undefined')bank=plaidBankState;}catch{}
  const loaded=bank&&(bank.connected===true||array(bank.accounts).length>0||!!bank.lastSyncedAt);let bankStatus=bank?.connected===true?'Connected in loaded app data':loaded?'Connection not reported as active':'Not loaded / not verified in this session';
  let status=window.billBeaconSyncStatus;const identity=scope();const syncText=status?.conflict?'Conflict reported by app':status?.pending?'Changes pending':status?.ready&&identity.ok?'App reports ready':'Not ready / unavailable';
  const permission=typeof Notification==='undefined'?'Unsupported in this browser':Notification.permission;
  return note('Local status snapshot, not a new server check. “Not loaded” does not mean disconnected. “Ready” does not independently prove the latest changes reached the server.')+panel('Bank connection',detail('Loaded status',bankStatus)+detail('Loaded accounts',loaded?String(array(bank.accounts).length):'Not loaded')+detail('Reported last bank timestamp',bank?.lastSyncedAt?fmtDate(bank.lastSyncedAt)+' '+(date(bank.lastSyncedAt)?.toLocaleTimeString()||''):'Not available')+routeButton('Open Banking to verify or sync','transactions'))+panel('Household sync',detail('Current household context',identity.ok?'Ready for signed-in user':'Not ready')+detail('Sync state',syncText)+help('No sync operation or conflict resolution is run by this screen.'))+panel('Notifications',detail('Browser permission',permission)+detail('Server subscription registration','Not verified here')+help('Permission being granted does not prove the server has an active registration for this account. Verify from the existing Notifications settings.')+routeButton('Open Settings','settings'));
 }
  let savingsState = null;

  function svToday() {
   let zone = 'America/New_York';

   try {
     zone = Store.getSettings().timeZone || zone;
   } catch {}

   let formatter;

   try {
     formatter = new Intl.DateTimeFormat('en-CA', {
       timeZone: zone,
       year: 'numeric',
       month: '2-digit',
       day: '2-digit'
     });
   } catch {
     formatter = new Intl.DateTimeFormat('en-CA', {
       timeZone: 'America/New_York',
       year: 'numeric',
       month: '2-digit',
       day: '2-digit'
     });
   }

   const parts = Object.fromEntries(
     formatter.formatToParts(new Date())
       .filter(part => part.type !== 'literal')
       .map(part => [part.type, part.value])
   );

   return `${parts.year}-${parts.month}-${parts.day}`;
 }

 function svDate(key) {
   if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key))) {
     return null;
   }

   const [y, m, d] = key.split('-').map(Number);
   const value = new Date(y, m - 1, d, 12);

   return value.getFullYear() === y &&
     value.getMonth() === m - 1 &&
     value.getDate() === d
       ? value
       : null;
 }

 function svKey(d) {
   return `${d.getFullYear()}-${
     String(d.getMonth() + 1).padStart(2, '0')
   }-${String(d.getDate()).padStart(2, '0')}`;
 }

 function svShift(key, count, monthly = false) {
   const d = svDate(key);

   if (!d) throw new Error('Invalid date.');

   if (monthly) {
     const day = d.getDate();

     d.setDate(1);
     d.setMonth(d.getMonth() + count);

     const last = new Date(
       d.getFullYear(),
       d.getMonth() + 1,
       0
     ).getDate();

     d.setDate(Math.min(day, last));
   } else {
     d.setDate(d.getDate() + count);
   }

   return svKey(d);
 }

 function svAmount(value, optional = false) {
   const text = String(value ?? '').trim();

   if (!text && optional) return null;

   if (!/^\d+(\.\d{1,2})?$/.test(text)) {
     throw new Error(
       'Use a nonnegative amount with up to two decimals.'
     );
   }

   const [whole, fraction = ''] = text.split('.');

   const result =
     Number(whole) * 100 +
     Number(fraction.padEnd(2, '0'));

   if (
     !Number.isSafeInteger(result) ||
     result > 1000000000000
   ) {
     throw new Error('Amount is too large.');
   }

   return result;
 }

  function svDispose() {
   const previous = savingsState;
   savingsState = null;
   previous?.stop?.();
 }

 function svIsCurrent(m) {
   const identity = scope();

   return savingsState === m &&
     identity.ok &&
     identity.key === m.key;
 }

 function svPaint(m) {
   if (
     svIsCurrent(m) &&
     opened === 'goals' &&
     document.getElementById(DIALOG)?.open
   ) {
     refreshDialog();
   }
 }

 function svNotice(m, message) {
   m.message = message;

   if (!svIsCurrent(m) || opened !== 'goals') {
     return;
   }

   const target = document.getElementById(
     'bbsv-cloud-message'
   );

   if (target) target.textContent = message;
 }

 function svApply(m, data) {
   m.currency = data.currency;
   m.revision = data.revision;
   m.writeId = data.writeId;
   m.funds = data.funds;
   m.entries = data.entries;
   m.ready = true;
   m.error = '';
 }

 function svState(s) {
   if (
     savingsState &&
     savingsState.key === s.scope
   ) {
     return savingsState;
   }

   svDispose();

   const m = {
     key: s.scope,
     currency: s.settings.currency || 'USD',
     funds: [],
     entries: [],
     form: null,
     expanded: [],
     message: '',
     ready: false,
     connected: false,
     saving: false,
     revision: 0,
     writeId: null,
     error: '',
     pendingRemote: null,
     conflict: false,
     reloadRequired: false,
     stop: null
   };

   savingsState = m;

   const store = window.BillBeaconSavingsStore;

   if (!store) {
     m.error =
       'Savings storage did not load. ' +
       'Check the script order and reload.';

     return m;
   }

   try {
     m.stop = store.watch(
       m.currency,

       data => {
         if (
           !svIsCurrent(m) ||
           m.reloadRequired
         ) {
           return;
         }

         if (m.saving) {
           m.pendingRemote = data;
           return;
         }

         if (
           m.form &&
           data.revision !== m.revision
         ) {
           m.pendingRemote = data;
           m.conflict = true;

           svNotice(
             m,
             'Shared savings changed on another device. ' +
             'Your form has not been saved. Cancel it, ' +
             'review the updated plan, and reopen the action.'
           );

           return;
         }

         svApply(m, data);

         svNotice(
           m,
           'Shared with your household. ' +
           'Changes save after server confirmation.'
         );

         svPaint(m);
       },

       error => {
         if (!svIsCurrent(m)) return;

         m.connected = false;
         m.ready = false;
         m.error =
           error.message || 'Savings could not load.';

         if (m.form) {
           svNotice(
             m,
             m.error +
             ' Cancel the form before reloading.'
           );
         } else {
           svPaint(m);
         }
       },

       connected => {
         if (!svIsCurrent(m)) return;

         m.connected = connected;

         if (m.ready && !connected) {
           svNotice(
             m,
             'Server connection unavailable. ' +
             'Savings are read-only until reconnected.'
           );
         }
       }
     );
   } catch (error) {
     m.error = error.message;
   }

   return m;
 }

 function svSessionChanged() {
   if (
     savingsState &&
     !svIsCurrent(savingsState)
   ) {
     svDispose();

     if (opened === 'goals') close();
   }
 }

 const savingsSessionEvents = [
   'billbeacon:authenticated',
   'billbeacon:household-ready',
   'billbeacon:sync-status',
   'billbeacon:signed-out'
 ];

 savingsSessionEvents.forEach(name => {
   window.addEventListener(
     name,
     svSessionChanged
   );
 });
 function svBalance(m, f) {
   return f.opening + m.entries
     .filter(e => e.fund === f.id && !e.voided)
     .reduce((sum, e) => sum + e.delta, 0);
 }

 function svSchedule(m, f) {
   if (
     f.paused ||
     (f.target && svBalance(m, f) >= f.target)
   ) {
     return [];
   }

   const end = f.deadline ||
     svShift(svToday(), 120, true);

   const done = new Set(
     m.entries
       .filter(e =>
         e.fund === f.id &&
         !e.voided &&
         e.slot
       )
       .map(e => e.slot)
   );

   const result = [];

   for (let n = 0; n < 600; n++) {
     const origin = f.cadence === 'monthly'
       ? svShift(f.first, n, true)
       : svShift(
           f.first,
           n * (f.cadence === 'weekly' ? 7 : 14)
         );

     if (origin > end) break;

     const key = `${f.version}:${origin}`;
     const day = f.moves[key] || origin;

     if (
       !f.skips.includes(key) &&
       !done.has(key) &&
       day <= end
     ) {
       result.push({
         key,
         day,
         fund: f.id,
         amount: f.amount
       });
     }
   }

   return result.sort((a, b) =>
     a.day.localeCompare(b.day) ||
     a.key.localeCompare(b.key)
   );
 }

 function svCash(value, s) {
   if (value == null) return 'N/A';

   const currency =
     savingsState?.currency ||
     s.settings.currency ||
     'USD';

   return money(value / 100, {
     ...s,
     settings: {
       ...s.settings,
       currency
     }
   });
 }

 function svButton(label, action, id = '', slot = '') {
   return `
     <button
       type="button"
              ${savingsState?.saving ? 'disabled' : ''}
       class="bbml-outline"
       data-bbml-action="savings:${esc(action)}"
       data-sv-id="${esc(id)}"
       data-sv-slot="${esc(slot)}"
     >
       ${esc(label)}
     </button>
   `;
 }

 function svInput(
   label,
   name,
   type = 'text',
   value = '',
   extra = ''
 ) {
   return `
     <label
       class="bbml-field-label"
       for="bbsv-${name}"
     >
       ${esc(label)}
     </label>

     <input
       class="bbml-input"
       id="bbsv-${name}"
       name="${name}"
       type="${type}"
       value="${esc(value)}"
       ${extra}
     >
   `;
 }

 function svSelect(label, name, options, value) {
   return `
     <label
       class="bbml-field-label"
       for="bbsv-${name}"
     >
       ${esc(label)}
     </label>

     <select
       class="bbml-input"
       id="bbsv-${name}"
       name="${name}"
     >
       ${options.map(([v, t]) => `
         <option
           value="${esc(v)}"
           ${v === value ? 'selected' : ''}
         >
           ${esc(t)}
         </option>
       `).join('')}
     </select>
   `;
 }

 function svForm(m, s) {
   const draft = m.form;

   if (!draft) return '';

   const f = m.funds.find(
     item => item.id === draft.id
   );

   const dollars = value => value == null
     ? ''
     : (value / 100).toFixed(2);

   let title;
   let fields;

   if (
     draft.mode === 'new' ||
     draft.mode === 'edit'
   ) {
     title = f
       ? 'Edit savings plan'
       : 'Create a savings fund';

     fields =
       svInput(
         'Fund name',
         'name',
         'text',
         f?.name || '',
         'maxlength="80" required'
       ) +
       svSelect(
         'Fund type',
         'type',
         [
           ['emergency', 'Emergency fund'],
           ['sinking', 'Planned expense / sinking fund'],
           ['goal', 'Savings goal']
         ],
         f?.type || 'goal'
       ) +
       svInput(
         'Target amount — optional',
         'target',
         'number',
         dollars(f?.target),
         'min="0.01" step="0.01"'
       ) +
       (
         !f
           ? svInput(
               'Already Saved',
               'opening',
               'number',
               '0',
               'min="0" step="0.01" required'
             )
           : ''
       ) +
       svInput(
         'Contribution per transfer',
         'amount',
         'number',
         dollars(f?.amount),
         'min="0.01" step="0.01" required'
       ) +
       svSelect(
         'Transfer schedule',
         'cadence',
         [
           ['weekly', 'Every week'],
           ['biweekly', 'Every 2 weeks / payday interval'],
           ['monthly', 'Every month']
         ],
         f?.cadence || 'monthly'
       ) +
       svInput(
         'First transfer date',
         'first',
         'date',
         f?.first || svToday(),
         'required'
       ) +
       svInput(
         'Goal deadline — optional',
         'deadline',
         'date',
         f?.deadline || ''
       ) +
       svInput(
         'Account label / note — optional',
         'note',
         'text',
         f?.note || '',
         'maxlength="200"'
       ) +
       help(
         'Use an account nickname only. Do not enter account ' +
         'numbers. Dates can extend up to 10 years from today. ' +
         'A biweekly schedule uses your chosen first date; ' +
         'it does not read payroll records.'
       );
   } else if (draft.mode === 'reschedule') {
     title = 'Reschedule one transfer';

     fields = svInput(
       'New transfer date',
       'date',
       'date',
       draft.day || svToday(),
       `min="${svToday()}" required`
     );
   } else {
     title = draft.mode === 'move'
       ? 'Move savings between funds'
       : draft.mode === 'withdraw'
         ? 'Record a withdrawal'
         : 'Record a contribution';

     fields =
       (
         draft.mode === 'move'
           ? svSelect(
               'Move to',
               'destination',
               m.funds
                 .filter(item => item.id !== f.id)
                 .map(item => [item.id, item.name]),
               ''
             )
           : ''
       ) +
       svInput(
         'Amount',
         'amount',
         'number',
         draft.slot ? dollars(f.amount) : '',
         'min="0.01" step="0.01" required'
       ) +
       svInput(
         'Actual date',
         'date',
         'date',
         svToday(),
         `min="${f.created}" max="${svToday()}" required`
       ) +
       svInput(
         'Note — optional',
         'note',
         'text',
         '',
         'maxlength="200"'
       ) +
       help(
                  'This records money you have already moved. ' +
         'It does not send money or change a bank balance.'
       );
   }

   return `
     <fieldset
       id="bbsv-form"
       class="bbml-panel bbsv-form"
     >
       <legend>${esc(title)}</legend>

       ${fields}

       <p
         id="bbsv-error"
         class="bbsv-error"
         role="alert"
       ></p>

       <div class="bbsv-actions">
         ${svButton('Save', 'save')}
         ${svButton('Cancel', 'cancel')}
       </div>
     </fieldset>
   `;
 }

 function savingsHTML(s) {
   const m = svState(s);

   if (!m.ready) {
     return panel(
       'Savings Plan',
       help(
         m.error ||
         'Loading shared household savings…'
       ) +
       (
         m.error
           ? svButton(
               'Reload Savings Plan',
               'reload-savings'
             )
           : ''
       )
     );
   }
 function savingsActionLocal(action, button) {
   const s = snapshot();

   if (!s.ok) {
     close();
     return;
   }

   const m = svState(s);
   const id = button.dataset.svId;
   const slot = button.dataset.svSlot;

   m.expanded = [
     ...document.querySelectorAll(
       '#bbml-dialog [data-sv-fund][open]'
     )
   ].map(node => node.dataset.svFund);

   const f = m.funds.find(
     item => item.id === id
   );

   const uuid = () => crypto.randomUUID();

   const refresh = () => {
     refreshDialog();

     document.getElementById(
       'bbsv-form'
     )?.scrollIntoView({block: 'start'});
   };

   try {
     if (
       m.form &&
       !['save', 'cancel'].includes(action)
     ) {
       throw new Error(
         'Finish or cancel the open form first.'
       );
     }

     m.message = '';

     if (action === 'new') {
       m.form = {mode: 'new'};

     } else if (action === 'cancel') {
       m.form = null;

     } else if ([
       'edit',
       'contribute',
       'withdraw',
       'move',
       'reschedule'
     ].includes(action)) {
       if (!f) {
         throw new Error('Fund no longer exists.');
       }

       const occurrence = slot
         ? svSchedule(m, f).find(p => p.key === slot)
         : null;

       if (slot && !occurrence) {
         throw new Error(
           'That scheduled transfer has changed.'
         );
       }

       m.form = {
         mode: action,
         id,
         slot,
         day: occurrence?.day
       };

     } else if (action === 'pause') {
       if (!f) {
         throw new Error('Fund no longer exists.');
       }

       if (f.paused) {
         f.first = svToday();
         f.version++;
         f.skips = [];
         f.moves = {};

         m.message =
           'Plan resumed with a new schedule starting today.';
       }

       f.paused = !f.paused;

     } else if (action === 'skip') {
       if (
         !f ||
         !svSchedule(m, f).some(p => p.key === slot)
       ) {
         throw new Error('Transfer no longer scheduled.');
       }

       if (!confirm(
         'Skip this planned contribution? ' +
         'Recorded savings will not change.'
       )) {
         return;
       }

       f.skips.push(slot);

     } else if (action === 'undo') {
       const original = m.entries.find(
         e => e.id === id && !e.voided
       );

       if (!original) {
         throw new Error('Record already reversed.');
       }

       const group = m.entries.filter(
         e => !e.voided && e.group === original.group
       );

       for (const fund of m.funds) {
         const impact = group
           .filter(e => e.fund === fund.id)
           .reduce((sum, e) => sum + e.delta, 0);

         if (svBalance(m, fund) - impact < 0) {
           throw new Error(
             'Reverse later withdrawals or moves first; ' +
             'this would make a fund negative.'
           );
         }
       }

       if (!confirm(
         'Reverse this record? Both sides of a move ' +
         'are reversed together.'
       )) {
         return;
       }

       group.forEach(e => {
         e.voided = true;
       });


     } else if (action === 'save') {
       const box = document.getElementById('bbsv-form');
       const draft = m.form;

       if (!box || !draft) return;

       for (const input of box.querySelectorAll(
         'input,select'
       )) {
         if (!input.reportValidity()) return;
       }

       const values = Object.fromEntries(
         [...box.querySelectorAll('[name]')]
           .map(input => [input.name, input.value])
       );

       const fund = m.funds.find(
         item => item.id === draft.id
       );

       const today = svToday();
       const limit = svShift(today, 120, true);

       if (['new', 'edit'].includes(draft.mode)) {
         if (!fund && m.funds.length >= 30) {
           throw new Error(
             'This savings plan supports up to 30 funds.'
           );
         }

         const name = values.name.trim();
         const target = svAmount(values.target, true);
         const amount = svAmount(values.amount);

         if (
           !name ||
           name.length > 80 ||
           !['goal', 'sinking', 'emergency']
             .includes(values.type)
         ) {
           throw new Error(
             'Enter a name and valid fund type.'
           );
         }

         if (
           !amount ||
           target === 0 ||
           !['weekly', 'biweekly', 'monthly']
             .includes(values.cadence)
         ) {
           throw new Error(
             'Contribution and any target must be ' +
             'greater than zero.'
           );
         }

         const changed = !fund ||
           fund.first !== values.first ||
           fund.cadence !== values.cadence;

         if (
           !svDate(values.first) ||
           values.first > limit ||
           (changed && values.first < today)
         ) {
           throw new Error(
             'A new schedule must start today or later, ' +
             'within 10 years.'
           );
         }

         if (
           values.deadline &&
           (
             !svDate(values.deadline) ||
             values.deadline > limit ||
             values.deadline < values.first
           )
         ) {
           throw new Error(
             'Use a valid deadline on or after the first ' +
             'transfer, within 10 years.'
           );
         }

         const fields = {
           name,
           type: values.type,
           target,
           amount,
           cadence: values.cadence,
           first: values.first,
           deadline: values.deadline,
           note: values.note.trim()
         };

         if (fund) {
           Object.assign(fund, fields);

           if (changed) {
             fund.version++;
             fund.skips = [];
             fund.moves = {};
           }
         } else {
           m.funds.push({
             ...fields,
             id: uuid(),
             opening: svAmount(values.opening),
             created: today,
             version: 1,
             skips: [],
             moves: {},
             paused: false
           });
         }

       } else if (draft.mode === 'reschedule') {
         if (
           !fund ||
           !svSchedule(m, fund).some(
             p => p.key === draft.slot
           )
         ) {
           throw new Error(
             'Transfer no longer scheduled.'
           );
         }

         if (
           !svDate(values.date) ||
           values.date < today ||
           values.date > limit ||
           (
             fund.deadline &&
             values.date > fund.deadline
           )
         ) {
           throw new Error(
             'Choose today or later, no later than the ' +
             'goal deadline or supported date range.'
           );
         }

         fund.moves[draft.slot] = values.date;

       } else {
         if (!fund) {
           throw new Error('Fund no longer exists.');
         }

         const amount = svAmount(values.amount);

         if (
           !amount ||
           !svDate(values.date) ||
           values.date < fund.created ||
           values.date > today
         ) {
           throw new Error(
             'Use a positive amount and an actual date ' +
             'from fund creation through today.'
           );
         }

         if (
           draft.slot &&
           !svSchedule(m, fund).some(
             p => p.key === draft.slot
           )
         ) {
           throw new Error(
             'That transfer was already recorded or changed.'
           );
         }

         const destination = draft.mode === 'move'
           ? m.funds.find(
               item =>
                 item.id === values.destination &&
                 item.id !== fund.id
             )
           : null;

         if (
           draft.mode === 'move' &&
           (
             !destination ||
             values.date < destination.created
           )
         ) {
           throw new Error(
             'Choose another fund and a date on or ' +
             'after its creation.'
           );
         }

         if (
           draft.mode !== 'contribute' &&
           amount > svBalance(m, fund)
         ) {
           throw new Error(
             'This exceeds the recorded savings in that fund.'
           );
         }

         if (
           draft.mode === 'contribute' &&
           svBalance(m, fund) + amount > 1000000000000
         ) {
           throw new Error(
             'Fund balance would exceed the preview limit.'
           );
         }

         if (
           destination &&
           svBalance(m, destination) + amount >
             1000000000000
         ) {
           throw new Error(
             'Destination balance would exceed the preview limit.'
           );
         }

         const group = uuid();

         const base = {
           date: values.date,
           note: values.note.trim(),
           group,
           voided: false
         };

         m.entries.push({
           ...base,
           id: uuid(),
           fund: fund.id,
           delta: draft.mode === 'contribute'
             ? amount
             : -amount,
           kind: draft.mode === 'move'
             ? 'Move out'
             : draft.mode === 'withdraw'
               ? 'Withdrawal'
               : 'Contribution',
           slot: draft.mode === 'contribute'
             ? draft.slot || ''
             : ''
         });

         if (destination) {
           m.entries.push({
             ...base,
             id: uuid(),
             fund: destination.id,
             delta: amount,
             kind: 'Move in',
             slot: ''
           });
         }
       }

       m.form = null;

              m.message = 'Preparing to save…';
     }

     refresh();

   } catch (error) {
     const target = document.getElementById(
       'bbsv-error'
     );

     if (target) {
       target.textContent = error.message;
     } else {
       m.message = error.message;
       refresh();
     }
   }
 }
  async function savingsAction(action, button) {
   const s = snapshot();

   if (!s.ok) {
     close();
     return;
   }

   const m = svState(s);

   if (action === 'reload-savings') {
     if (m.saving) return;

     svDispose();
     refreshDialog();
     return;
   }

   if (m.saving) return;

   if (action === 'cancel') {
     m.form = null;

     if (m.pendingRemote) {
       svApply(m, m.pendingRemote);
       m.pendingRemote = null;
     }

     m.conflict = false;
     svPaint(m);
     return;
   }

   if (!m.ready || m.reloadRequired) {
     svNotice(
       m,
       'Reload Savings Plan before making another change.'
     );

     return;
   }

   if (
     !m.connected ||
     navigator.onLine === false
   ) {
     svNotice(
       m,
       'Connect to the internet before changing shared savings.'
     );

     return;
   }

   if (m.conflict) {
     svNotice(
       m,
       'Cancel the open form, review the shared changes, ' +
       'and reopen the action.'
     );

     return;
   }

   const allowed = [
     'new',
     'edit',
     'contribute',
     'withdraw',
     'move',
     'reschedule',
     'save',
     'pause',
     'skip',
     'undo'
   ];

   if (!allowed.includes(action)) return;

   const before = JSON.parse(JSON.stringify({
     funds: m.funds,
     entries: m.entries
   }));

   const mutates = [
     'save',
     'pause',
     'skip',
     'undo'
   ].includes(action);

   try {
     savingsActionLocal(action, button);

     if (
       !mutates ||
       JSON.stringify(before) ===
         JSON.stringify({
           funds: m.funds,
           entries: m.entries
         })
     ) {
       return;
     }

     const payload = {
       currency: m.currency,
       funds: m.funds,
       entries: m.entries
     };

     const revision = m.revision;
     const writeId = crypto.randomUUID();

     m.saving = true;

     svNotice(
       m,
       'Saving to your shared household…'
     );

     svPaint(m);

     const result =
       await window.BillBeaconSavingsStore.save(
         payload,
         revision,
         writeId
       );

     if (!svIsCurrent(m)) return;

     m.saving = false;

     const newest =
       m.pendingRemote &&
       m.pendingRemote.revision > result.revision
         ? m.pendingRemote
         : result;

     svApply(m, newest);

     m.pendingRemote = null;
     m.form = null;

     svNotice(
       m,
       'Saved to your shared household.'
     );

     svPaint(m);

   } catch (error) {
     if (!svIsCurrent(m)) return;

     m.saving = false;
     m.form = null;
     m.funds = before.funds;
     m.entries = before.entries;

     if (
       error.code === 'savings/conflict' &&
       error.remote
     ) {
       svApply(m, error.remote);
       m.pendingRemote = null;

       svNotice(
         m,
         'Another member changed Savings Plan. ' +
         'Your change was not applied. Review the current ' +
         'amounts before trying again.'
       );
     } else {
       m.ready = false;
       m.reloadRequired = true;

       m.error =
         'Save was not confirmed. Reload and check ' +
         'balances/history before repeating the action. ' +
         error.message;
     }

     svPaint(m);
   }
 }
 function content(key,s){
  if(!s.ok)return empty('Data not available',s.reason);
  switch(key){
   case 'forecast':return forecastHTML(s);
   case 'subscriptions':return subscriptionsHTML(s);
   case 'review':return reviewHTML(s);
   case 'monthly':return monthlyHTML(s);
   case 'connections':return connectionsHTML(s);
   case 'goals':return savingsHTML(s);
   case 'cards': {
     const bills = regular(s).filter(
       b => b.category === 'creditcards'
     );

     const monthlyAmounts = bills
       .map(normalizedMonthly)
       .filter(value => value !== null);

     const partial = monthlyAmounts.length < bills.length;

     const monthlyEquivalent = bills.length === 0
       ? 0
       : monthlyAmounts.length
         ? total(monthlyAmounts)
         : null;

     const summary = metrics(
       metric(
         'Credit Cards',
         String(bills.length),
         'Active Card-Payment Bills'
       ),
       metric(
         'Monthly Equivalent',
         money(monthlyEquivalent, s),
         bills.length === 0
           ? 'No active card-payment bills'
           : `${monthlyAmounts.length} of ${bills.length} Schedules Included` +
             (partial ? ' · partial total' : '')
       )
     );

     const list = bills.length
       ? `
           <section class="bbml-panel">
             ${bills.map(b => item(
               b.name || 'Credit-card bill',
               `${b.recurrence || 'No recurrence'} · Stored Due Date ${fmtDate(b.dueDate)}`,
               money(num(b.amount), s)
             )).join('')}
           </section>
         `
       : empty(
           'No credit-card payment bills',
           'Bills categorized as Credit Cards will appear here.'
         );

     return summary +
       list +
       (
         partial
           ? help(
               'One-time or unsupported schedules are excluded ' +
               'from the monthly equivalent.'
             )
           : ''
       ) +
       routeButton('Open Bills', 'bills');
   }
   case 'documents':{const notes=regular(s).filter(b=>String(b.notes||'').trim());return empty('Document attachments are not enabled','No statement, receipt or cancellation files are read, uploaded or invented. Secure attachment storage needs a separate implementation.')+(notes.length?panel('Bills with existing notes',notes.slice(0,30).map(b=>item(b.name||'Bill',String(b.notes).slice(0,240)+(String(b.notes).length>240?'…':''),'','bill:'+b.id)).join('')):help('No saved notes on active regular bills.'))+routeButton('Open Bills','bills');}
   default:return empty('Unavailable','This tool is not available.');
  }
 }
 function close(){const d=document.getElementById(DIALOG);if(d?.open)d.close();d?.remove();opened=null;openedScope=null;}
 function updateScenario(){
  const output=document.getElementById('bbml-result');if(!output)return;const s=snapshot();if(!s.ok||s.scope!==openedScope){close();return;}const f=forecast(s);if(f.error){output.textContent=f.error;return;}
  const raw=document.getElementById('bbml-extra')?.value??'',amount=num(raw),cycle=document.getElementById('bbml-cycle')?.value==='second'?'second':'first';
  if(amount===null||amount<0||amount>1000000000||Math.abs(amount*100-Math.round(amount*100))>0.00001){output.textContent='Enter a nonnegative amount with up to two decimal places.';return;}
  const income=cycle==='first'?f.first:f.second;const scheduled=Number(f.plan[cycle].scheduled);const result=(Math.round(income*100)-Math.round(scheduled*100)-Math.round(amount*100))/100;
  output.classList.toggle('bbml-negative',result<0);output.innerHTML=`<span>${result<0?'Modeled shortfall':'Modeled income less assigned bills'}</span><strong>${esc(money(result,s))}</strong><small>${esc(money(income,s))} expected income − ${esc(money(scheduled,s))} scheduled bills − ${esc(money(amount,s))} hypothetical expense. Not a spendable balance.</small>`;
 }
 function refreshDialog(){const d=document.getElementById(DIALOG);if(!d||!opened)return;const s=snapshot();if(!s.ok||s.scope!==openedScope){close();redraw();return;}const body=d.querySelector('.bbml-dialog-body');body.innerHTML=`<p id="bbml-source" class="bbml-source">Current household snapshot · ${esc(new Date().toLocaleString())}</p>${content(opened,s)}`;if(opened==='forecast')updateScenario();}
 function open(key){
  if(!active||!TOOLS[key])return;const target=document.activeElement;close();const s=snapshot();opened=key;openedScope=s.scope||null;const t=TOOLS[key],d=document.createElement('dialog');d.id=DIALOG;d.className='bbml-dialog';d.setAttribute('aria-labelledby','bbml-dialog-title');
  d.innerHTML=`<header class="bbml-dialog-header"><div class="bbml-dialog-heading"><span class="bbml-icon bbml-${t[3]}">${icon(t[2])}</span><div><span class="bbml-eyebrow">APP-DATA BETA</span><h2 id="bbml-dialog-title">${esc(t[0])}</h2></div></div><div class="bbml-dialog-actions"><button type="button" class="bbml-close" data-bbml-action="close" aria-label="Close tool">${icon('close')}</button></div></header><div class="bbml-dialog-body"><p id="bbml-source" class="bbml-source">${s.ok?'Current household snapshot · '+esc(new Date().toLocaleString()):'Data unavailable'}</p>${content(key,s)}</div>`;
  d.addEventListener('close',()=>{d.remove();if(!document.querySelector('#'+DIALOG+'[open]')){opened=null;openedScope=null;if(target?.isConnected)target.focus({preventScroll:true});}},{once:true});
  d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
  d.addEventListener('input',e=>{if(['bbml-extra','bbml-cycle'].includes(e.target.id))updateScenario();});d.addEventListener('change',e=>{if(e.target.id==='bbml-cycle')updateScenario();});
  document.body.append(d);if(key==='forecast')updateScenario();d.showModal();d.querySelector('.bbml-close').focus({preventScroll:true});
 }
 function onClick(e){
  if(!(e.target instanceof Element))return;const b=e.target.closest('[data-bbml-action]');if(!b||b.closest('[data-bb-drag-preview],[data-bb-copy-id]')||!b.closest('.bbml-page,#'+DIALOG))return;const a=b.dataset.bbmlAction;

  if (a.startsWith('savings:')) {
    e.preventDefault();
    e.stopImmediatePropagation();
    savingsAction(a.slice(8), b);
    return;
  }
  if(a==='close')return close();if(a==='refresh')return refreshDialog();if(a.startsWith('open:'))return open(a.slice(5));
  if(a.startsWith('route:')){const r=a.slice(6);if(['today','transactions','activity','settings','bills'].includes(r)){close();navigate(r);}return;}
  if(a.startsWith('bill:')){const s=snapshot();if(!s.ok)return;const id=a.slice(5);if(!s.bills.some(x=>x.id===id))return;close();navigate('detail',{id,returnRoute:'more'});}
 }
 function redraw(){if(!active||typeof currentRoute==='undefined'||currentRoute!=='more'||typeof render!=='function')return;const main=document.querySelector('#app .main-content'),y=main?.scrollTop||0,wy=window.scrollY;render();const next=document.querySelector('#app .main-content');if(next)next.scrollTop=y;window.scrollTo(0,wy);}
 function changed(){if(!active)return;clearTimeout(timer);timer=setTimeout(()=>{if(document.getElementById(DIALOG)){const identity=scope();if(!identity.ok||identity.key!==openedScope)close();else{const label=document.getElementById('bbml-source');if(label)label.textContent='App data changed. Refresh to reload this view (what-if input recalculates from current data).';}}redraw();},80);}
 function signedOut(){
   savingsState = null;
   close();
   changed();
 }
 const DATA_EVENTS=['billbeacon:data-changed','billbeacon-data-changed','billbeacon:household-ready','billbeacon-household-ready'];
 const OUT_EVENTS=['billbeacon:signed-out','billbeacon-signed-out'];
 const CSS=String.raw`
  .bbsv-root .bbsv-actions {
   display: grid;
   grid-template-columns: repeat(2, minmax(0, 1fr));
   gap: 9px;
   margin: 14px 0 18px;
 }

 .bbsv-root .bbsv-actions .bbml-outline {
   min-width: 0;
   min-height: 44px;
   padding: 10px;
   font-size: 11px;
   line-height: 1.4;
 }

 .bbsv-preview {
   margin: 0 0 16px;
   padding-left: 10px;
   border-left: 3px solid var(--ml-purple);
   color: var(--ml-muted);
   font-size: 10px;
   line-height: 1.65;
 }

 .bbsv-form {
   min-width: 0;
   margin: 0 0 18px;
 }

 .bbsv-form legend {
   padding: 0 6px;
   font-size: 14px;
   font-weight: 750;
 }

 .bbsv-error {
   color: var(--overdue, #ef8295);
   font-size: 12px;
   line-height: 1.6;
 }

 .bbsv-fund {
   padding: 16px;
 }

 .bbsv-fund > summary {
   display: flex;
   align-items: flex-start;
   justify-content: space-between;
   gap: 12px;
   cursor: pointer;
   list-style: none;
 }

 .bbsv-fund > summary::-webkit-details-marker {
   display: none;
 }

 .bbsv-fund > summary::marker {
   content: "";
 }

 .bbsv-fund > summary strong {
   display: block;
   font-size: 15px;
   line-height: 1.4;
   overflow-wrap: anywhere;
 }

 .bbsv-fund > summary small {
   display: block;
   margin-top: 5px;
   color: var(--ml-muted);
   font-size: 10px;
   line-height: 1.6;
 }

 .bbsv-summary-money {
   flex-shrink: 0;
   max-width: 45%;
   color: var(--ml-purple);
   text-align: right;
   font-size: 17px;
   font-weight: 800;
   overflow-wrap: anywhere;
 }

 .bbsv-fund progress {
   display: block;
   width: 100%;
   height: 7px;
   margin-top: 16px;
   accent-color: var(--ml-purple);
 }

 .bbsv-fund-body {
   margin-top: 12px;
   padding-top: 6px;
   border-top: 1px solid var(--ml-line);
 }

 .bbsv-history {
   margin-top: 16px;
   padding-top: 14px;
   border-top: 1px solid var(--ml-line);
 }

 .bbsv-history > summary,
 .bbsv-root > details > summary {
   cursor: pointer;
   color: var(--ml-muted);
   font-size: 12px;
   line-height: 1.6;
 }

 .bbsv-history > .bbml-outline {
   min-height: 36px;
   margin: 8px 0 14px;
   font-size: 10px;
 }

 .bbsv-upcoming {
   display: flex;
   align-items: center;
   justify-content: space-between;
   gap: 12px;
   padding: 12px 0;
   border-bottom: 1px solid var(--ml-line);
 }

 .bbsv-upcoming:last-child {
   border-bottom: 0;
 }

 .bbsv-upcoming > div {
   min-width: 0;
 }

 .bbsv-upcoming strong {
   display: block;
   font-size: 12px;
   overflow-wrap: anywhere;
 }

 .bbsv-upcoming small {
   display: block;
   margin-top: 5px;
   color: var(--ml-muted);
   font-size: 10px;
   line-height: 1.6;
 }

 .bbsv-upcoming > button {
   flex: 0 0 auto;
   width: auto;
   min-height: 38px;
   padding: 8px 13px;
   font-size: 11px;
 }

 .bbsv-root > .bbml-outline {
   margin-top: 18px;
 }

 @media (max-width: 350px) {
   .bbsv-root .bbsv-actions {
     grid-template-columns: minmax(0, 1fr);
   }

   .bbsv-summary-money {
     font-size: 15px;
   }
 }
  #bbml-dialog #bbml-source {
   display: none;
 }
 .bbml-page,.bbml-dialog{--ml-muted:var(--text-secondary,#b4b4c8);--ml-line:var(--border,#393447);--ml-panel:var(--surface,#22222e);--ml-purple:#c58bff;--ml-green:#7bdfbf;--ml-blue:#82d3f3;--ml-orange:#f4c08c;--ml-pink:#ed9bc8;color:var(--text,#f5f4fb)}
 html[data-theme="light"] .bbml-page,html[data-theme="light"] .bbml-dialog{--ml-purple:#7542ad;--ml-green:#14795b;--ml-blue:#176b91;--ml-orange:#92521b;--ml-pink:#9a326b}
 .bbml-page *,.bbml-dialog *{box-sizing:border-box}.bbml-nav{display:grid!important;grid-template-columns:44px 1fr 44px!important;align-items:center}.bbml-nav .nav-title{text-align:center}.bbml-content{max-width:680px;margin:auto;padding-top:16px;padding-bottom:calc(112px + env(safe-area-inset-bottom,0px))!important}.bbml-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.bbml-eyebrow{display:block;margin:0 0 7px;font-size:10px;letter-spacing:1.5px;font-weight:800;color:var(--ml-muted);line-height:1.4}.bbml-intro h1{font-size:22px;font-weight:800;line-height:1.25;letter-spacing:-.45px;margin:0;max-width:320px}.bbml-badge{flex-shrink:0;border:1px solid var(--ml-line);border-radius:999px;padding:5px 8px;color:var(--ml-muted);font-size:10px;line-height:1.4;font-weight:700}.bbml-intro-note,.bbml-footer{color:var(--ml-muted);font-size:12px;line-height:1.55;margin:10px 0 18px}.bbml-bank{width:100%;display:flex;align-items:center;gap:12px;padding:18px 16px;border:1px solid rgba(178,117,242,.35);border-radius:20px;color:inherit;background:radial-gradient(ellipse at top right,rgba(172,79,240,.13),transparent 65%),var(--ml-panel);font:inherit;text-align:left;cursor:pointer}.bbml-bank-link{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:750;color:var(--ml-purple);white-space:nowrap}.bbml-section{margin-top:22px}.bbml-section>h2{margin:0 0 10px 2px;color:var(--ml-muted);font-size:12px;font-weight:750;letter-spacing:.6px;text-transform:uppercase;line-height:1.4}.bbml-group{border:1px solid var(--ml-line);border-radius:20px;overflow:hidden;background:var(--ml-panel)}.bbml-row{width:100%;display:flex;align-items:center;gap:12px;padding:16px 14px;min-height:84px;background:transparent;color:inherit;border:0;font:inherit;text-align:left;cursor:pointer}.bbml-row+.bbml-row{border-top:1px solid var(--ml-line)}.bbml-icon{width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border-radius:14px}.bbml-purple{color:var(--ml-purple);background:rgba(153,87,235,.13)}.bbml-green{color:var(--ml-green);background:rgba(69,174,138,.12)}.bbml-blue{color:var(--ml-blue);background:rgba(66,158,208,.12)}.bbml-orange{color:var(--ml-orange);background:rgba(220,143,62,.12)}.bbml-pink{color:var(--ml-pink);background:rgba(211,89,157,.12)}.bbml-row-copy{display:block;flex:1;min-width:0}.bbml-row-title{display:block;font-size:14px;font-weight:750;line-height:1.35}.bbml-row-sub{display:block;margin-top:4px;font-size:12px;line-height:1.45;color:var(--ml-muted)}.bbml-tag{font-size:9px;line-height:1.3;color:var(--ml-muted);border:1px solid var(--ml-line);padding:4px 5px;border-radius:6px;flex-shrink:0}.bbml-chevron{display:flex;color:var(--ml-muted);flex-shrink:0}.bbml-footer{text-align:center;margin:22px 6px 0}
 .bbml-dialog{position:fixed;inset:0;margin:auto;width:calc(100% - 24px);max-width:620px;max-height:calc(100dvh - 32px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));padding:0;border:1px solid var(--ml-line);border-radius:24px;background:var(--bg,#15151e);font-family:inherit;overflow:hidden;box-shadow:0 20px 70px rgba(0,0,0,.35)}.bbml-dialog[open]{display:flex;flex-direction:column}.bbml-dialog::backdrop{background:rgba(0,0,0,.62)}.bbml-dialog-header{padding:18px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid var(--ml-line);flex:0 0 auto;background:var(--ml-panel)}.bbml-dialog-heading{display:flex;align-items:center;gap:10px;min-width:0}.bbml-dialog-heading>div{min-width:0}.bbml-dialog-header .bbml-eyebrow{font-size:9px;margin-bottom:3px}.bbml-dialog h2{font-size:18px;line-height:1.3;font-weight:800;letter-spacing:-.2px;margin:0;overflow-wrap:anywhere}.bbml-dialog-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}.bbml-close{display:grid;place-items:center;width:40px;height:44px;padding:0;border:1px solid var(--ml-line);border-radius:13px;background:transparent;color:var(--ml-muted);cursor:pointer}.bbml-refresh{min-height:44px;padding:5px 6px;border:0;background:transparent;color:var(--ml-purple);font:inherit;font-size:11px;cursor:pointer}.bbml-dialog-body{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:16px 14px calc(22px + env(safe-area-inset-bottom,0px))}.bbml-source{font-size:10px;line-height:1.55;font-weight:700;color:var(--ml-purple);margin:0 0 16px}.bbml-metrics{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:14px}.bbml-metric{display:flex;flex-direction:column;gap:6px;min-width:0;border:1px solid var(--ml-line);border-radius:16px;padding:14px 12px;background:var(--ml-panel)}.bbml-metric>span,.bbml-metric small{font-size:11px;color:var(--ml-muted);line-height:1.4}.bbml-metric strong{font-size:23px;line-height:1.2;letter-spacing:-.5px;font-weight:800;overflow-wrap:anywhere}.bbml-panel{padding:16px 13px;border:1px solid var(--ml-line);background:var(--ml-panel);border-radius:18px;margin-bottom:14px}.bbml-panel h3,.bbml-empty h3{font-size:14px;line-height:1.4;margin:0 0 12px;font-weight:750}.bbml-help,.bbml-empty p{font-size:11px;line-height:1.65;color:var(--ml-muted);margin:8px 0 12px}.bbml-detail{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid var(--ml-line);font-size:12px;line-height:1.5}.bbml-detail:last-child{border:0;padding-bottom:0}.bbml-detail>div{min-width:0}.bbml-detail strong{font-weight:750;text-align:right;max-width:55%;overflow-wrap:anywhere}.bbml-detail small{display:block;font-size:11px;line-height:1.5;color:var(--ml-muted);margin-top:3px}.bbml-field-label{display:block;font-size:12px;line-height:1.5;font-weight:700;margin:12px 0 8px}.bbml-input{width:100%;min-width:0;min-height:46px;border:1px solid var(--ml-line);border-radius:12px;background:var(--bg,#15151e);color:inherit;font:inherit;padding:10px 12px}.bbml-result{display:flex;flex-direction:column;gap:6px;margin-top:16px;padding:14px;border:1px solid rgba(69,174,138,.28);border-radius:14px;color:var(--ml-green);background:rgba(69,174,138,.06);font-size:12px}.bbml-result strong{font-size:27px;font-weight:800;line-height:1.2;overflow-wrap:anywhere}.bbml-result small{font-size:10px;line-height:1.5;color:var(--ml-muted)}.bbml-negative{color:var(--overdue,#ef8295);border-color:rgba(220,90,100,.3);background:rgba(220,90,100,.05)}.bbml-item{display:flex;align-items:flex-start;gap:9px;padding:12px 0;border:0;border-bottom:1px solid var(--ml-line);width:100%;text-align:left;font:inherit;background:transparent;color:inherit}.bbml-item:last-child{border:0}.bbml-item[type=button]{cursor:pointer}.bbml-item-copy{min-width:0;flex:1}.bbml-item strong{display:block;font-size:12px;line-height:1.5;overflow-wrap:anywhere}.bbml-item small{display:block;margin-top:4px;font-size:11px;line-height:1.55;color:var(--ml-muted);overflow-wrap:anywhere}.bbml-dot{width:7px;height:7px;margin-top:6px;border-radius:50%;flex:0 0 7px;background:var(--ml-purple)}.bbml-value{font-size:11px;line-height:1.5;color:var(--ml-muted);max-width:35%;text-align:right;overflow-wrap:anywhere}.bbml-item>svg{flex:0 0 14px;color:var(--ml-muted);margin-top:3px}.bbml-callout{padding:12px;border-radius:12px;border:1px solid var(--ml-line);background:rgba(153,87,235,.06);font-size:12px;line-height:1.65;color:var(--ml-muted);margin-bottom:14px}.bbml-empty{text-align:center;padding:20px 14px;border:1px dashed var(--ml-line);border-radius:18px;color:var(--ml-muted);margin-bottom:14px}.bbml-empty>svg{color:var(--ml-purple);margin-bottom:12px}.bbml-outline{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:10px 14px;border:1px solid var(--ml-purple);border-radius:999px;background:transparent;color:var(--ml-purple);font:inherit;font-size:12px;font-weight:750;cursor:pointer}.bbml-row:focus-visible,.bbml-bank:focus-visible,.bbml-dialog button:focus-visible{outline:2px solid var(--ml-purple);outline-offset:-4px}
 @media(max-width:360px){.bbml-row{gap:8px;padding:16px 11px}.bbml-row-title{font-size:13px}.bbml-row-sub{font-size:11px}.bbml-icon{width:36px;height:39px;flex-basis:36px}.bbml-tag{font-size:8px;padding:3px}.bbml-intro{flex-wrap:wrap}.bbml-intro h1{font-size:21px}.bbml-dialog h2{font-size:15px}.bbml-dialog-header{padding:14px 10px;gap:6px}.bbml-dialog-heading{gap:7px}.bbml-dialog .bbml-icon{display:none}.bbml-metric strong{font-size:20px}}
 @media(prefers-reduced-motion:reduce){.bbml-page{animation:none!important}}
 `;
 function init(){if(!active)return;if(!document.getElementById(STYLE)){const style=document.createElement('style');style.id=STYLE;style.textContent=CSS;document.head.append(style);}redraw();}
 function uninstall(){if(!active)return;svDispose();savingsSessionEvents.forEach(name=>window.removeEventListener(name,svSessionChanged));close();active=false;clearTimeout(timer);document.removeEventListener('click',onClick);document.removeEventListener('DOMContentLoaded',init);DATA_EVENTS.forEach(x=>window.removeEventListener(x,changed));OUT_EVENTS.forEach(x=>window.removeEventListener(x,signedOut));window.removeEventListener('storage',changed);if(renderMore===main)renderMore=originalMore;document.getElementById(STYLE)?.remove();delete window.BillBeaconMoreLive;delete window.BillBeaconMorePreview;if(typeof currentRoute!=='undefined'&&currentRoute==='more'&&typeof render==='function')render();}
 renderMore=main;document.addEventListener('click',onClick);DATA_EVENTS.forEach(x=>window.addEventListener(x,changed));OUT_EVENTS.forEach(x=>window.addEventListener(x,signedOut));window.addEventListener('storage',changed);
 const api=Object.freeze({version:'2.0.0-data-beta',readOnly:true,open,close,refresh:refreshDialog,uninstall});window.BillBeaconMoreLive=api;window.BillBeaconMorePreview=api;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

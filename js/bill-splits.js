/* Bill Beacon BROWSER script v3: split labels, previous-detail navigation and occurrence notes.
   Load as a CLASSIC script AFTER app.js and settings-cleanup.js. */
(() => {
  "use strict";
  if (window.BillBeaconSplits) return;
  const original = {
    billRow: billRow,
    calendar: getCalendarBillsForMonth,
    resolve: resolveCalendarBillOccurrence,
    current: getCurrentCalendarBillOccurrence,
    active: getActivePaymentForOccurrence,
    fundingAction: renderOccurrenceFundingAction,
    detail: renderBillDetail,
    inlineRows: renderPaycheckInlineRows,
    sheet: openPaycheckPlanSheet,
    moveContext: getPaycheckMoveContext,
    mark: markBillPaid,
    markOccurrence: confirmMarkPaidOccurrence,
    unmark: markBillUnpaid,
    unmarkOccurrence: markBillOccurrenceUnpaid,
    form: openBillForm,
    savePayments: Store.savePayments,
    updateBill: Store.updateBill,
    deleteBill: Store.deleteBill,
    csv: bbBillsCsvBuild,
    eligible: bankMatchIsEligibleBill
  };
  let busy = false;
  let editor = null;
  const key = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? String(value) : financialDateKey(value);
  const month = value => key(value).slice(0,7);
  const allBills = () => Store.getBills();
  const active = payment => isFinancialPaymentActive(payment);
  const cents = value => {
    const text = String(value ?? "").trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error("Use a nonnegative amount with no more than two decimal places.");
    const n = Math.round(Number(text)*100);
    if (!Number.isSafeInteger(n)) throw new Error("Amount is too large.");
    return n;
  };
  const planFor = (bill, date) => {
    if (!bill || bill.splitPaymentParentId) return null;
    const entries = Object.values(bill.splitOccurrencePlans || {});
    return entries.find(p => p.enabled && [key(p.dueDate),key(p.originalDueDate)].includes(key(date))) || null;
  };
  const partsFor = (bill, plan) => plan.partIds.map(id => allBills().find(b => b.id === id)).filter(Boolean);
  const paymentFor = bill => Store.getPaymentsForBill(bill.id).find(p =>
    active(p) && getPaymentOccurrenceDateKey(p) === key(bill.dueDate));
  const sourceFor = bill => Store.getBill(getBillPaymentId(bill));
  const originKey = bill => key(bill.originalDueDate || bill.dueDate);
  const session = () => {
    const user=window.getBillBeaconFirebaseUser?.();
    const context=window.getBillBeaconHouseholdContext?.();
    if (!user?.uid || !context?.ready || context.uid!==user.uid || !context.householdId)
      throw new Error("Wait for your signed-in household to finish loading.");
    if (window.billBeaconSyncStatus?.().conflict) throw new Error("Resolve the sync conflict before editing.");
    return {uid:user.uid,householdId:context.householdId,generation:context.generation};
  };
  const assertSession = saved => {
    if (JSON.stringify(session())!==JSON.stringify(saved)) throw new Error("Your account or household changed. Reopen this screen.");
  };
  const actor = () => {
    const user=window.getBillBeaconFirebaseUser?.();
    return {actorUid:user?.uid || null,actorName:String(user?.displayName || user?.email || "Household member")};
  };
  const note = (bill, occurrenceKey, text, entryId=uid()) => {
    const records=bill.occurrenceNotes?.[occurrenceKey] || [];
    if (records.some(n=>n.id===entryId)) return bill;
    return {...bill,occurrenceNotes:{...(bill.occurrenceNotes || {}),[occurrenceKey]:[
      ...records,{id:entryId,timestamp:new Date().toISOString(),...actor(),text}
    ]},updatedAt:new Date().toISOString()};
  };
  function commit(records) {
    const previous=new Map(Object.keys(records).map(k=>[k,localStorage.getItem(k)]));
    try {for (const [k,v] of Object.entries(records)) localStorage.setItem(k,JSON.stringify(v));}
    catch (error) {
      let failed=false;
      for (const [k,v] of previous) {try {v===null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(_){failed=true;}}
      throw new Error(failed?"Storage write and rollback were incomplete. Keep your backup and stop editing until storage is recovered.":"Nothing was changed. Check available device storage and try again.");
    }
    window.dispatchEvent(new CustomEvent("billbeacon:data-changed"));
  }
  const activity = (action,bill,text,before=null,after=null) => ({
    id:uid(),timestamp:new Date().toISOString(),...actor(),action,entityType:"bill",
    entityId:bill.splitPaymentParentId || bill.id,title:bill.splitParentName || bill.name,detail:text,before,after
  });
  const fingerprint = () => JSON.stringify([allBills(),Store.getPayments()]);
  async function prepare(saved) {
    assertSession(saved);
    if (typeof window.billBeaconPrepareDataTransfer!=="function") throw new Error("The sync helper is unavailable.");
    const result=await window.billBeaconPrepareDataTransfer();
    assertSession(saved);
    if (result.householdId!==saved.householdId) throw new Error("Household verification failed.");
  }
  async function operation(callback) {
    if (busy) return;
    busy=true;let applied=false;
    try {
      const saved=session();await prepare(saved);
      const result=await callback(saved,()=>{applied=true;});
      if (applied) {refresh();await prepare(saved);}
      return result;
    } catch(error) {
      alert((applied?"Saved locally, but cloud confirmation did not finish. Keep local data and review sync before retrying.\n\n":"")+error.message);
    } finally {busy=false;}
  }
  function refresh() { render(); }
  function occurrenceFor(id,date) {
    const source=Store.getBill(id);
    if (!source) throw new Error("Bill is no longer active.");
    return resolveCalendarBillOccurrence(id,date) ||
      (!isRecurringBill(source) && key(source.dueDate)===key(date)?source:null);
  }
  function cleanNoteText(value) {
    return String(value || "").replace(/\n?Fully allocated[;,]?\s*original biller due date unchanged[.;,]?\s*Only this occurrence\.?/gi, "").trim();
  }
  function notesHTML(bill) {
    const source=sourceFor(bill);if(!source) return "";
    const notes=source.occurrenceNotes?.[originKey(bill)] || [];
    if (!notes.length) return "";
    return `<details class="card" style="margin-top:12px;padding:14px;"><summary style="font-weight:750;cursor:pointer;">Notes for this occurrence (${notes.length})</summary>${notes.map(n=>
      `<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px;"><div style="font-size:var(--text-xs);color:var(--text-muted);">${escapeHtml(new Date(n.timestamp).toLocaleString())} · ${escapeHtml(n.actorName || "Household member")}</div><div style="white-space:pre-wrap;overflow-wrap:anywhere;margin-top:5px;">${escapeHtml(cleanNoteText(n.text))}</div></div>`).join("")}</details>`;
  }
  function displayBill(bill) {
    if(!bill?.splitPaymentParentId)return bill;
    const name=String(bill.splitParentName || bill.name || "Bill").replace(/\s*-\s*Split\s+\d+$/i,"");
    return {...bill,name:`${name} - Split ${bill.splitPaymentPartNumber}`};
  }
  function row(bill) {
    const status=getPaycheckBillStatusLabel(bill),id=getBillPaymentId(bill);
    return `<button type="button" class="bill-row" style="width:100%;text-align:left;color:var(--text);"
      onclick="bbSplitOpenDetail('${escapeInlineString(id)}','${escapeInlineString(bill.dueDate)}')">
      <span style="width:32px;flex:0 0 32px;overflow:hidden;">${billOrPaymentPlanVisual(bill,32)}</span>
      <span class="bill-info"><span class="bill-name" style="display:block;">${escapeHtml(displayBill(bill).name)}</span>
      <span class="bill-meta" style="color:${status.color};">${escapeHtml(status.label)}</span></span>
      <span class="bill-amount">${formatCurrency(bill.amount)}</span></button>`;
  }
  window.bbSplitOpenDetail=function(id,date) {
    const params=JSON.parse(JSON.stringify(routeParams || {}));
    const route=currentRoute;
    const scroll={window:window.scrollY || 0,main:document.querySelector("#app .main-content")?.scrollTop || 0};
    // Each child carries the exact route/params it was opened from, including
    // the existing paycheck-sheet/inline return information. No Dashboard fallback.
    navigate("detail",{id,occurrenceDueDate:date,returnRoute:route,returnParams:params,
      bbSplitReturn:{route,params,scroll}});
  };
  let editorScroll=null,editorFocus=null;
  function closeEditor() {
    document.getElementById("bbSplitContainer")?.remove();
    if(editorScroll?.node?.isConnected)editorScroll.node.style.overflowY=editorScroll.overflowY;
    editorScroll=null;
    const focus=editorFocus;editorFocus=null;editor=null;
    if(focus?.isConnected)focus.focus({preventScroll:true});
  }
  window.closeBillSplitEditor=function() {if(!busy)closeEditor();};
  function editorRows() {
    const body=document.getElementById("bbSplitRows");if(!body||!editor)return;
    body.innerHTML=editor.rows.map((r,i)=>`<fieldset style="min-width:0;border:1px solid var(--border);border-radius:14px;padding:14px;margin:0 0 14px;">
      <legend style="font-weight:750;padding:0 5px;">Payment ${i+1}${r.locked?" · Paid history":""}</legend>
      <label style="display:block;font-weight:650;">Amount<input aria-label="Payment ${i+1} amount" data-field="amount" data-index="${i}" type="number" min="0.01" step="0.01" inputmode="decimal" value="${escapeHtml(r.amount)}" ${r.locked?"disabled":""} style="display:block;width:100%;min-height:48px;box-sizing:border-box;border:1px solid var(--border);background:var(--surface-2);color:var(--text);border-radius:10px;padding:10px;font-size:16px;margin-top:6px;"></label>
      <label style="display:block;margin-top:12px;font-weight:650;">New Payment Date<input aria-label="Payment ${i+1} new payment date" data-field="date" data-index="${i}" type="date" value="${escapeHtml(r.date)}" ${r.locked?"disabled":""} style="display:block;width:100%;min-width:0;min-height:48px;box-sizing:border-box;border:1px solid var(--border);background:var(--surface-2);color:var(--text);border-radius:10px;padding:10px;font-size:16px;margin-top:6px;"></label>
    </fieldset>`).join("");
    body.oninput=event=>{
      const input=event.target;if(!input.dataset.field||!editor||busy)return;
      editor.rows[Number(input.dataset.index)][input.dataset.field]=input.value;totals();
    };
    body.onchange=body.oninput;totals();
  }
  function totals() {
    if(!editor)return;let total=0;
    try{for(const r of editor.rows)total+=cents(r.amount);}catch(_){}
    const remaining=editor.totalCents-total;
    document.getElementById("bbSplitTotals").textContent=`Bill ${formatCurrency(editor.totalCents/100)} · Allocated ${formatCurrency(total/100)} · ${remaining<0?"Overallocated":"Unallocated"} ${formatCurrency(Math.abs(remaining)/100)}`;
  }
  function openEditor(id,date) {
    try {
      const saved=session(),bill=occurrenceFor(id,date),source=Store.getBill(id);
      if(!bill||source.splitPaymentParentId||source.installmentPlanId)throw new Error("Split regular bill occurrences only. Installment-plan payments are unchanged.");
      const plan=planFor(source,date);
      if(!plan&&original.active(bill,new Date(bill.dueDate)))throw new Error("Reverse the existing full payment before splitting this occurrence.");
      closeEditor();
      const totalCents=plan?.totalCents ?? cents(bill.amount);
      if(totalCents<=0)throw new Error("A split bill must have a positive total.");
      editor={session:saved,id,date:bill.dueDate,key:plan?.occurrenceKey || originKey(bill),totalCents,expected:fingerprint(),rows:
        plan?partsFor(source,plan).map(p=>({id:p.id,amount:String(p.amount),date:key(p.dueDate),locked:Store.getPaymentsForBill(p.id).length>0})):
        [{id:uid(),amount:(Math.floor(totalCents/2)/100).toFixed(2),date:key(bill.dueDate),locked:false},{id:uid(),amount:((totalCents-Math.floor(totalCents/2))/100).toFixed(2),date:key(bill.dueDate),locked:false}]};
      if(plan&&editor.rows.length!==plan.partIds.length)throw new Error("A split payment is missing. Review the backup before editing.");
      editorFocus=document.activeElement;
      const container=document.createElement("div");container.id="bbSplitContainer";
      container.style.cssText="position:fixed;inset:0;z-index:1500;isolation:isolate;";
      container.innerHTML=`
        <style>
          #bbSplitContainer > #bbSplitOverlay {position:absolute !important;inset:0 !important;z-index:0 !important;}
          #bbSplitContainer > #bbSplitDialog {
            position:absolute !important;top:calc(env(safe-area-inset-top,0px) + 12px) !important;
            bottom:calc(env(safe-area-inset-bottom,0px) + 8px) !important;
            left:calc(env(safe-area-inset-left,0px) + 4px) !important;right:calc(env(safe-area-inset-right,0px) + 4px) !important;
            display:flex !important;flex-direction:column;min-height:0;max-height:none !important;
            width:auto !important;margin:0 !important;padding:0 !important;box-sizing:border-box;
            border:1px solid var(--border);border-radius:24px !important;overflow:hidden !important;
            background:var(--surface);color:var(--text);z-index:1501 !important;
          }
          #bbSplitDialog > .sheet-handle,#bbSplitDialog > .sheet-nav {flex:0 0 auto;}
          #bbSplitDialog > .sheet-nav {display:grid;grid-template-columns:48px minmax(0,1fr) 48px;align-items:center;gap:8px;}
          #bbSplitDialog .sheet-title {min-width:0;text-align:center;white-space:normal;}
          #bbSplitDialog > .sheet-body {flex:1 1 0;min-height:0;overflow:auto !important;padding:16px;box-sizing:border-box;}
        </style>
        <div class="sheet-overlay show" id="bbSplitOverlay" onclick="closeBillSplitEditor()"></div>
        <section class="sheet show" id="bbSplitDialog" role="dialog" aria-modal="true" aria-labelledby="bbSplitTitle">
          <div class="sheet-handle"></div>
          <div class="sheet-nav">
            <button type="button" class="nav-button" id="bbSplitClose" onclick="closeBillSplitEditor()" aria-label="Back" style="width:44px;min-height:44px;justify-content:center;">${svgIcon("chevronLeft",22)}</button>
            <div class="sheet-title" id="bbSplitTitle">${plan?"Manage Split Payments":"Split Payment"}</div><div style="width:44px;"></div>
          </div>
          <div class="sheet-body">
            <div style="font-size:var(--text-lg);font-weight:800;overflow-wrap:anywhere;margin-bottom:16px;">${escapeHtml(bill.name)}</div>
            <div id="bbSplitRows"></div>
            <p id="bbSplitTotals" role="status" style="font-size:var(--text-sm);font-weight:650;margin:12px 0;"></p>
            <p id="bbSplitError" role="alert" style="color:var(--overdue);white-space:pre-wrap;"></p>
            <div style="display:grid;gap:12px;margin-top:16px;">
              <button type="button" class="btn-primary" id="bbSplitSave">Save Split Payments</button>
              ${plan?'<button type="button" class="btn-danger" id="bbSplitCancelPlan">Remove Split Schedule</button>':''}
            </div>
          </div>
        </section>`;
      document.body.appendChild(container);
      const main=document.querySelector("#app .main-content");
      if(main){editorScroll={node:main,overflowY:main.style.overflowY};main.style.overflowY="hidden";}
      document.getElementById("bbSplitSave").onclick=()=>saveEditor(false);
      document.getElementById("bbSplitCancelPlan")?.addEventListener("click",()=>saveEditor(true));
      container.addEventListener("keydown",event=>{
        if(event.key==="Escape"){event.preventDefault();event.stopPropagation();window.closeBillSplitEditor();return;}
        if(event.key!=="Tab")return;
        const nodes=[...container.querySelectorAll("button:not(:disabled),input:not(:disabled),[tabindex='0']")];
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      });
      editorRows();document.getElementById("bbSplitClose").focus({preventScroll:true});
    } catch(error){closeEditor();alert(error.message);}
  }

  async function saveEditor(remove) {
    const draft=editor;if(!draft||busy)return;
    await operation(async(saved,applied)=>{
      assertSession(draft.session);
      if(editor!==draft||fingerprint()!==draft.expected)throw new Error("The bill or payments changed. Close and reopen the split editor.");
      const bills=allBills(),index=bills.findIndex(b=>b.id===draft.id),source=bills[index];
      if(!source)throw new Error("Bill is no longer active.");
      const bill=occurrenceFor(draft.id,draft.date);if(!bill)throw new Error("Occurrence is no longer available.");
      const old=planFor(source,draft.date);
      const history=Store.getPayments(),oldParts=old?partsFor(source,old):[];
      let text,nextBills,archived=getArchivedBills();
      if(remove) {
        if(!old)return;
        if(oldParts.some(p=>paymentFor(p)))throw new Error("Reverse the paid portions before removing the split schedule. Payment history will be preserved.");
        if(!confirm("Remove this split schedule? The original unpaid occurrence and its original overdue rules return. Reversed payment history is retained."))return;
        assertSession(saved);
        const ids=new Set(old.partIds);
        archived=[...archived,...oldParts.filter(p=>history.some(pay=>pay.billId===p.id)).map(p=>({...p,archivedAt:new Date().toISOString()}))];
        nextBills=bills.filter(b=>!ids.has(b.id));
        const parent=nextBills.find(b=>b.id===source.id);
        parent.splitOccurrencePlans={...parent.splitOccurrencePlans,[draft.key]:{...old,enabled:false,cancelledAt:new Date().toISOString()}};
        parent.occurrenceOverrides=(parent.occurrenceOverrides || []).filter(o=>o.splitPaymentPlanId!==old.id);
        text=`Split schedule removed. Bill ${formatCurrency(old.totalCents/100)}, originally due ${formatDate(old.dueDate,"full")}, returned to its original unpaid schedule.`;
      } else {
        if(draft.rows.length<2||draft.rows.length>24)throw new Error("Use between 2 and 24 payments.");
        let total=0;
        for(const r of draft.rows){const amount=cents(r.amount);if(amount<=0||!dateFromInput(r.date))throw new Error("Each payment needs a positive amount and valid payment date.");total+=amount;}
        if(total!==draft.totalCents)throw new Error(`Allocate exactly ${formatCurrency(draft.totalCents/100)}. The payment amounts must add up to the full bill total.`);
        for(const p of oldParts.filter(p=>history.some(pay=>pay.billId===p.id))) {
          const r=draft.rows.find(r=>r.id===p.id);
          if(!r||cents(r.amount)!==cents(p.amount)||r.date!==key(p.dueDate))throw new Error("Portions with payment history cannot be changed or removed. Reverse and remove the schedule to start over.");
        }
        const now=new Date().toISOString(),planId=old?.id || uid();
        const parts=draft.rows.map((r,i)=>{
          const existing=oldParts.find(p=>p.id===r.id);
          return {...(existing || {}),id:r.id,name:bill.name,amount:cents(r.amount)/100,dueDate:dateFromInput(r.date),category:bill.category,
            recurrence:"None",payCycle:Number(r.date.slice(-2))<=14?"first":"second",paycheckAssignment:existing?.paycheckAssignment || "auto",
            trackingStartDate:r.date.slice(0,7)+"-01",reminderOffsets:[...(bill.reminderOffsets || [])],autopay:Boolean(bill.autopay),
            paymentMethod:bill.paymentMethod || "",paymentUrl:bill.paymentUrl || "",notes:existing?.notes || "",
            createdAt:existing?.createdAt || now,updatedAt:now,splitPaymentParentId:source.id,splitPaymentOccurrenceKey:draft.key,
            splitPaymentPlanId:planId,splitPaymentPartNumber:i+1,splitPaymentTotalParts:draft.rows.length,
            splitOriginalDueDate:old?.dueDate || bill.dueDate,splitParentName:bill.name};
        });
        const plan={version:1,id:planId,enabled:true,occurrenceKey:draft.key,totalCents:draft.totalCents,
          originalDueDate:old?.originalDueDate || bill.originalDueDate || bill.dueDate,dueDate:old?.dueDate || bill.dueDate,
          partIds:parts.map(p=>p.id),createdAt:old?.createdAt || now,updatedAt:now};
        const oldIds=new Set(old?.partIds || []);
        nextBills=bills.filter(b=>!oldIds.has(b.id));
        const parent=nextBills.find(b=>b.id===source.id);
        parent.splitOccurrencePlans={...(parent.splitOccurrencePlans || {}),[draft.key]:plan};
        if(isRecurringBill(source)||source.scheduleHistory?.length) {
          parent.occurrenceOverrides=[...(parent.occurrenceOverrides || []).filter(o=>key(o.originalDueDate)!==draft.key),{
            id:uid(),originalDueDate:plan.originalDueDate,cancelled:true,splitPaymentPlanId:plan.id}];
        }
        nextBills.push(...parts);
        text=`${old?"Split schedule updated":"Bill split"}: ${formatCurrency(plan.totalCents/100)}, originally due ${formatDate(plan.dueDate,"full")}.\n`+parts.map(p=>`${formatCurrency(p.amount)} planned ${formatDate(p.dueDate,"full")} · ${occurrenceFundingLabel(getOccurrenceFunding(p))}`).join("\n");
      }
      const parentIndex=nextBills.findIndex(b=>b.id===source.id);
      nextBills[parentIndex]=note(nextBills[parentIndex],draft.key,text);
      assertSession(saved);
      commit({bills:nextBills,archivedBills:archived,activityLog:[...Store.getActivityLog(),activity(remove?"bill_split_removed":old?"bill_split_updated":"bill_split_created",source,text,old,remove?null:nextBills[parentIndex].splitOccurrencePlans[draft.key])]});
      applied();closeEditor();
    });
  }

  // A portion is a real linked one-time obligation, so existing payment history,
  // calendar totals and reversals operate on its exact amount, not the parent total.
  getCalendarBillsForMonth=function(date=new Date()) {
    return original.calendar(date).filter(b=>!planFor(sourceFor(b)||b,b.originalDueDate || b.dueDate)).map(displayBill);
  };
  billRow=function(bill,...args) {return original.billRow(displayBill(bill),...args);};
  resolveCalendarBillOccurrence=function(id,date) {
    const found=original.resolve(id,date);if(found)return found;
    const source=Store.getBill(id),p=planFor(source,date);if(!p)return null;
    return {...source,id:getOccurrenceKey(id,p.originalDueDate),sourceBillId:id,isOccurrence:true,
      originalDueDate:p.originalDueDate,dueDate:p.dueDate,amount:p.totalCents/100};
  };
  getCurrentCalendarBillOccurrence=function(bill,date=new Date()) {
    const found=original.current(bill,date);if(found)return found;
    const p=Object.values(bill.splitOccurrencePlans || {}).find(p=>p.enabled&&month(p.dueDate)===key(date.toISOString()).slice(0,7));
    return p?resolveCalendarBillOccurrence(bill.id,p.dueDate):null;
  };
  getActivePaymentForOccurrence=function(bill,date=new Date()) {
    const source=sourceFor(bill)||bill,p=planFor(source,getBillOccurrenceDueDate(bill,date));
    if(!p)return original.active(bill,date);
    const parts=partsFor(source,p);if(parts.length!==p.partIds.length)return null;
    const payments=parts.map(paymentFor);if(payments.some(p=>!p))return null;
    const newest=payments.slice().sort((a,b)=>new Date(b.paidDate)-new Date(a.paidDate))[0];
    return {...newest,amount:p.totalCents/100,splitAggregate:true};
  };
  renderOccurrenceFundingAction=function(bill) {
    const source=sourceFor(bill),p=planFor(source,bill.originalDueDate || bill.dueDate);
    if(p) {
      const parts=partsFor(source,p),paid=parts.filter(paymentFor).reduce((s,b)=>s+cents(b.amount),0);
      return `<section class="card" style="padding:14px;margin-top:14px;"><div style="font-weight:800;">Split Payment Schedule</div><p style="font-size:var(--text-sm);color:var(--text-muted);">Total ${formatCurrency(p.totalCents/100)} · Paid ${formatCurrency(paid/100)} · Remaining ${formatCurrency((p.totalCents-paid)/100)}</p>${parts.map(row).join("")}<button type="button" class="bb-outline-pill" style="width:100%;margin-top:10px;" onclick="bbOpenSplit('${escapeInlineString(source.id)}','${escapeInlineString(p.dueDate)}')">Manage Split Payments</button></section>${notesHTML(bill)}`;
    }
    const splitButton=source&&!source.splitPaymentParentId&&!source.installmentPlanId&&!isOccurrencePaid(bill,new Date(bill.dueDate))?
      `<button type="button" class="bb-outline-pill" style="width:100%;margin-top:12px;" onclick="bbOpenSplit('${escapeInlineString(source.id)}','${escapeInlineString(bill.dueDate)}')">Split This Payment</button>`:"";
    const parentLink=source?.splitPaymentParentId?`<p style="font-size:var(--text-sm);color:var(--text-muted);">Split ${source.splitPaymentPartNumber} of ${source.splitPaymentTotalParts} · Original bill due ${escapeHtml(formatDate(source.splitOriginalDueDate,"full"))}</p><button type="button" class="bb-outline-pill" style="width:100%;" onclick="bbSplitOpenDetail('${escapeInlineString(source.splitPaymentParentId)}','${escapeInlineString(source.splitOriginalDueDate)}')">View Original Bill & Split Notes</button>`:"";
    return original.fundingAction(bill)+splitButton+parentLink+notesHTML(bill);
  };
  renderBillDetail=function() {
    const source=Store.getBill(routeParams.id);
    const p=planFor(source,routeParams.occurrenceDueDate || (source?getCurrentCalendarBillOccurrence(source)?.dueDate:null));
    let html=original.detail();
    if(!source?.splitPaymentParentId&&!p&&!routeParams.bbSplitReturn)return html;
    const holder=document.createElement("div");holder.innerHTML=html;
    if(p) {
      // Parent is a schedule container, not a second overdue obligation.
      holder.querySelector(".detail-status")?.remove();
      for(const button of holder.querySelectorAll("button")) {
        if(button.textContent.trim()==="Mark as Paid") {
          button.innerHTML="Manage Split Payments";
          button.setAttribute("onclick",`bbOpenSplit('${escapeInlineString(source.id)}','${escapeInlineString(p.dueDate)}')`);
        } else if(button.textContent.trim()==="Mark as Unpaid") button.innerHTML="Manage Paid Portions";
      }
    }
    for(const button of holder.querySelectorAll("button")) {
      if(!["Manage Split Payments","Postpone","Manage Paid Portions"].includes(button.textContent.trim()))continue;
      button.style.setProperty("min-height","40px","important");
      button.style.setProperty("height","auto","important");
      button.style.setProperty("padding","8px 12px","important");
      button.style.setProperty("font-size","14px","important");
      button.style.setProperty("line-height","1.2","important");
    }
    if(routeParams.bbSplitReturn) {
      const back=holder.querySelector(".nav-bar .nav-button");
      if(back) {
        // Keep a navigate(...) handler: the existing swipe engine discovers it.
        back.setAttribute("onclick","navigate('detail', bbSplitBackParams())");
        back.setAttribute("aria-label","Back to previous bill details");
        back.innerHTML=svgIcon("chevronLeft",22)+" Back";
      }
    }
    return holder.innerHTML;
  };
  window.bbSplitBackParams=function() {
    const back=routeParams.bbSplitReturn;
    if(!back||back.route!=="detail")return getBillDetailReturnParams();
    const params=JSON.parse(JSON.stringify(back.params));
    params.bbSplitRestoreScroll={...back.scroll};
    return params;
  };
  // Restore scroll after returning; the normal navigate function handles sheet
  // and inline paycheck state already carried by the preserved route parameters.
  const renderBeforeSplitScroll=render;
  render=function(...args) {
    const saved=routeParams.bbSplitRestoreScroll;
    if(saved)delete routeParams.bbSplitRestoreScroll;
    const result=renderBeforeSplitScroll.apply(this,args);
    if(saved) {
      const route=currentRoute,id=routeParams.id,due=routeParams.occurrenceDueDate;
      requestAnimationFrame(()=>{
        if(currentRoute!==route||routeParams.id!==id||routeParams.occurrenceDueDate!==due)return;
        window.scrollTo(0,saved.window || 0);
        const main=document.querySelector("#app .main-content");if(main)main.scrollTop=saved.main || 0;
      });
    }
    return result;
  };
  window.render=render;
  // Original paycheck inline list and popup layouts are unchanged.
  getPaycheckMoveContext=function(id,date) {
    const context=original.moveContext(id,date);
    return context?{...context,splitSession:session()}:context;
  };
  saveOccurrenceFundingMove=function(id,date,expected) {
    assertSession(expected.splitSession || session());
    const context=getPaycheckMoveContext(id,date);
    if(!context||context.key!==expected.key||JSON.stringify(context.from)!==JSON.stringify(expected.from)||JSON.stringify(context.to)!==JSON.stringify(expected.to)||JSON.stringify(context.source)!==JSON.stringify(expected.source))
      throw new Error("This occurrence changed. Close and reopen the move sheet.");
    const bills=allBills(),i=bills.findIndex(b=>b.id===id),at=new Date().toISOString();
    const text=`${context.bill.name}: ${formatCurrency(context.bill.amount)}, due ${formatDate(context.bill.dueDate,"full")}. Moved from ${occurrenceFundingLabel(context.from)} to ${occurrenceFundingLabel(context.to)} `;
    bills[i]={...bills[i],paycheckOccurrenceOverrides:{...(bills[i].paycheckOccurrenceOverrides || {}),[context.key]:{month:context.to.month,paycheck:context.to.paycheck,fromMonth:context.from.month,fromPaycheck:context.from.paycheck,dueDate:context.bill.dueDate,movedAt:at}}};
    bills[i]=note(bills[i],context.key,text);
    if(bills[i].splitPaymentParentId) {
      const j=bills.findIndex(b=>b.id===bills[i].splitPaymentParentId);
      if(j<0)throw new Error("The original bill is missing.");
      bills[j]=note(bills[j],bills[i].splitPaymentOccurrenceKey,`Split portion ${bills[i].splitPaymentPartNumber}: ${text}`);
    }
    commit({bills,activityLog:[...Store.getActivityLog(),activity("bill_occurrence_paycheck_moved",bills[i],text,context.from,context.to)]});
  };
  Store.savePayments=function(payments) {
    const previous=Store.getPayments(),byId=new Map(previous.map(p=>[p.id,p]));
    const bills=allBills();let changed=false;
    for(const payment of payments) {
      const before=byId.get(payment.id),i=bills.findIndex(b=>b.id===payment.billId),part=bills[i];
      if(!part?.splitPaymentParentId || (before && active(before)===active(payment)))continue;
      if(!before&&!active(payment))continue;
      const state=active(payment)?"recorded as paid":"payment reversed";
      const text=`Split portion ${part.splitPaymentPartNumber}: ${formatCurrency(payment.amount)} ${state}. Planned ${formatDate(part.dueDate,"full")} · ${occurrenceFundingLabel(getOccurrenceFunding(part))}.`;
      bills[i]=note(part,key(part.dueDate),text,`${payment.id}:${state}`);
      const j=bills.findIndex(b=>b.id===part.splitPaymentParentId);
      if(j>=0)bills[j]=note(bills[j],part.splitPaymentOccurrenceKey,text,`${payment.id}:${state}`);
      changed=true;
    }
    if(!changed)return original.savePayments.call(Store,payments);
    const preserved=payments.map(p=>byId.get(p.id)?.billSnapshot?{...p,billSnapshot:byId.get(p.id).billSnapshot}:attachPaymentBillSnapshot(p,Boolean(byId.get(p.id))));
    commit({bills,payments:preserved});
  };
  window.bbSplitQuickPaid=(id,date)=>operation(async(saved,applied)=>{
    const bill=occurrenceFor(id,date);if(!bill)throw new Error("Occurrence is no longer available.");
    const source=Store.getBill(id);if(planFor(source,date)){openEditor(id,date);return;}
    if(isOccurrencePaid(bill,new Date(date)))return;
    if(!confirmUnlinkedPaymentReview(id))return;
    const expected=fingerprint();
    if(!confirm(`Record ${formatCurrency(bill.amount)} as paid for ${bill.name}${source.splitPaymentParentId?` (split ${source.splitPaymentPartNumber} of ${source.splitPaymentTotalParts})`:""}?\nPlanned/due ${formatDate(date,"full")}.\nThis records a payment only; it does not send money.`))return;
    assertSession(saved);if(fingerprint()!==expected)throw new Error("The bill changed. Review it before paying.");
    const payment={id:uid(),billId:id,paidDate:new Date().toISOString(),amount:Number(bill.amount),paidForDueDate:bill.dueDate,
      originalDueDate:bill.originalDueDate || bill.dueDate,status:"active",voidedAt:null,source:"paycheck-quick-pay"};
    payment.billSnapshot=createPaymentBillSnapshot(payment,bill,false);
    const payments=[...Store.getPayments(),payment];
    const previousActivity=Store.getActivityLog();
    // savePayments supplies occurrence notes for linked portions.
    // Stage its writes so notes, payment and activity publish as one change.
    const bills=allBills();let parentIndex=-1;
    if(source.splitPaymentParentId) {
      const i=bills.findIndex(b=>b.id===id);parentIndex=bills.findIndex(b=>b.id===source.splitPaymentParentId);
      if(parentIndex<0)throw new Error("Original bill is missing.");
      const text=`Split portion ${source.splitPaymentPartNumber}: ${formatCurrency(payment.amount)} recorded as paid on ${formatDate(payment.paidDate,"full")}; planned ${formatDate(source.dueDate,"full")} · ${occurrenceFundingLabel(getOccurrenceFunding(source))}.`;
      bills[i]=note(bills[i],key(source.dueDate),text,`${payment.id}:paid`);bills[parentIndex]=note(bills[parentIndex],source.splitPaymentOccurrenceKey,text,`${payment.id}:paid`);
    }
    commit({bills,payments,activityLog:[...previousActivity,activity("bill_paid",source,`${formatCurrency(payment.amount)} recorded as paid · ${formatDate(bill.dueDate,"full")}`,null,{paymentId:payment.id,billId:id,amount:payment.amount,dueDate:bill.dueDate})]});applied();
  });
  window.bbSplitUndo=paymentId=>operation(async(saved,applied)=>{
    const payments=Store.getPayments(),i=payments.findIndex(p=>p.id===paymentId&&active(p));if(i<0)return;
    const payment=payments[i],source=Store.getBill(payment.billId);if(!source)throw new Error("Use Payment History to reverse an archived payment.");
    const expected=fingerprint();if(!confirm(`Reverse ${formatCurrency(payment.amount)} for ${source.name}? Payment history is retained.`))return;
    assertSession(saved);if(fingerprint()!==expected)throw new Error("The payment changed. Reopen the list.");
    payments[i]={...payment,status:"voided",voidedAt:new Date().toISOString()};
    const bills=allBills();
    if(source.splitPaymentParentId) {
      const text=`Split portion ${source.splitPaymentPartNumber}: ${formatCurrency(payment.amount)} payment reversed. The portion is unpaid again; planned ${formatDate(source.dueDate,"full")}.`;
      const j=bills.findIndex(b=>b.id===source.id),k=bills.findIndex(b=>b.id===source.splitPaymentParentId);
      bills[j]=note(bills[j],key(source.dueDate),text,`${payment.id}:reversed`);if(k>=0)bills[k]=note(bills[k],source.splitPaymentOccurrenceKey,text,`${payment.id}:reversed`);
    }
    commit({bills,payments,activityLog:[...Store.getActivityLog(),activity("payment_voided",source,`${formatCurrency(payment.amount)} payment reversed`,{paymentId}, {paymentId,status:"voided"})]});applied();
  });
  function intercept(fn,id,date,unpaid=false) {
    const source=Store.getBill(id);if(!source)return fn(id,date);
    const due=date || getCurrentCalendarBillOccurrence(source)?.dueDate || source.dueDate;
    if(source.splitPaymentParentId) {
      if(unpaid){const payment=paymentFor(source);if(payment)return window.bbSplitUndo(payment.id);return;}
      return window.bbSplitQuickPaid(id,due);
    }
    if(planFor(source,due))return openEditor(id,due);
    return fn(id,date);
  }
  markBillPaid=id=>intercept(original.mark,id);
  confirmMarkPaidOccurrence=(id,date)=>intercept(original.markOccurrence,id,date);
  markBillUnpaid=id=>intercept(original.unmark,id,null,true);
  markBillOccurrenceUnpaid=(id,date)=>intercept(original.unmarkOccurrence,id,date,true);
  openBillForm=function(id=null,date=null) {
    const source=Store.getBill(id);
    if(source?.splitPaymentParentId)return openEditor(source.splitPaymentParentId,source.splitOriginalDueDate);
    if(source&&Object.values(source.splitOccurrencePlans || {}).some(p=>p.enabled)) {
      alert("Manage or remove this bill's split schedules before editing the underlying bill. This protects their amounts and history.");return;
    }
    return original.form(id,date);
  };
  Store.updateBill=function(id,updates) {
    const source=this.getBill(id);
    if(source?.splitPaymentParentId&&["amount","dueDate","recurrence","dueDay"].some(k=>updates[k]!==undefined&&updates[k]!==source[k]))
      throw new Error("Edit the linked portion through Manage Split Payments.");
    if(source&&Object.values(source.splitOccurrencePlans || {}).some(p=>p.enabled)&&["amount","dueDate","recurrence","dueDay"].some(k=>updates[k]!==undefined&&updates[k]!==source[k]))
      throw new Error("Remove the split schedules before changing this bill's financial schedule.");
    return original.updateBill.call(this,id,updates);
  };
  Store.deleteBill=function(id) {
    const source=this.getBill(id);
    if(source?.splitPaymentParentId||Object.values(source?.splitOccurrencePlans || {}).some(p=>p.enabled))
      throw new Error("Remove the split schedule from the original bill before deleting its records. Reverse paid portions first.");
    return original.deleteBill.call(this,id);
  };
  bankMatchIsEligibleBill=function(bill) {
    if(bill?.splitPaymentParentId||planFor(sourceFor(bill)||bill,bill.originalDueDate || bill.dueDate))return false;
    return original.eligible(bill);
  };
  bbBillsCsvBuild=function(bills,householdId) {
    // CSV carries reusable definitions, not occurrence-specific split history.
    return original.csv(bills.filter(b=>!b.splitPaymentParentId),householdId);
  };
  window.bbOpenSplit=openEditor;
  window.addEventListener("billbeacon:signed-out",closeEditor);
  window.BillBeaconSplits={version:3,
    _test:{cents,planFor,partsFor,note,commit,session,row,openEditor,saveEditor,displayBill,cleanNoteText}};
})();

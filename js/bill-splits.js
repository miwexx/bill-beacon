/* Bill Beacon: linked split payments, occurrence notes, and paycheck quick-pay.
   Load as a CLASSIC script AFTER app.js and settings-cleanup.js. */
(() => {
  "use strict";
  if (window.BillBeaconSplits) return;
  const original = {
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
  function refresh() {
    const popup=document.getElementById("paycheckPlanContainer");
    const pk=popup?.dataset.paycheckKey;
    const scroll=popup?.querySelector(".paycheck-bills-scroll")?.scrollTop || 0;
    const inline=document.getElementById("paycheckInlineList");
    const view=inline?capturePaycheckInlineView(inline):null;
    render();
    if (view) {try {restorePaycheckInlineView(view);}catch(_) {}}
    if (popup?.isConnected && pk) {
      const selected=getPaycheckPlan(getDashboardPaycheckMonth())[pk];
      const list=popup.querySelector(".paycheck-bills-scroll");
      if (list && selected) {list.innerHTML=selected.bills.map(row).join("");list.scrollTop=scroll;}
    }
  }
  function occurrenceFor(id,date) {
    const source=Store.getBill(id);
    if (!source) throw new Error("Bill is no longer active.");
    return resolveCalendarBillOccurrence(id,date) ||
      (!isRecurringBill(source) && key(source.dueDate)===key(date)?source:null);
  }
  function notesHTML(bill) {
    const source=sourceFor(bill);if(!source) return "";
    const notes=source.occurrenceNotes?.[originKey(bill)] || [];
    if (!notes.length) return "";
    return `<details class="card" style="margin-top:12px;padding:14px;"><summary style="font-weight:750;cursor:pointer;">Notes for this occurrence (${notes.length})</summary>${notes.map(n=>
      `<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px;"><div style="font-size:var(--text-xs);color:var(--text-muted);">${escapeHtml(new Date(n.timestamp).toLocaleString())} · ${escapeHtml(n.actorName || "Household member")}</div><div style="white-space:pre-wrap;overflow-wrap:anywhere;margin-top:5px;">${escapeHtml(n.text)}</div></div>`).join("")}</details>`;
  }
  function row(bill) {
    const status=getPaycheckBillStatusLabel(bill),paid=isOccurrencePaid(bill,new Date(bill.dueDate));
    const id=getBillPaymentId(bill),p=paid?getActivePaymentForOccurrence(bill,new Date(bill.dueDate)):null;
    const open=`navigate('detail',{id:'${escapeInlineString(id)}',occurrenceDueDate:'${escapeInlineString(bill.dueDate)}',returnRoute:'today'})`;
    const split=bill.splitPaymentParentId?`Split ${bill.splitPaymentPartNumber} of ${bill.splitPaymentTotalParts} · `:"";
    return `<div class="bill-row" style="align-items:center;gap:10px;padding:12px 10px;">
      <button type="button" onclick="${open}" aria-label="View ${escapeHtml(bill.name)}" style="min-width:0;flex:1;display:flex;align-items:center;gap:10px;text-align:left;color:var(--text);">
        <span style="width:32px;flex:0 0 32px;overflow:hidden;">${billOrPaymentPlanVisual(bill,32)}</span>
        <span style="min-width:0;flex:1;"><span style="display:block;font-weight:750;overflow-wrap:anywhere;">${escapeHtml(bill.name)}</span><span style="display:block;font-size:var(--text-xs);color:${status.color};margin-top:4px;">${escapeHtml(split+status.label)}</span>${renderOccurrenceMoveNote(bill)}</span>
      </button>
      <div style="flex:0 0 auto;text-align:right;max-width:48%;"><div style="font-weight:800;">${formatCurrency(bill.amount)}</div>
        <button type="button" class="bb-outline-pill" style="min-height:44px;min-width:96px;padding:4px 10px;margin-top:7px;font-size:var(--text-xs);" ${p?`onclick="bbSplitUndo('${escapeInlineString(p.id)}')"`:`onclick="bbSplitQuickPaid('${escapeInlineString(id)}','${escapeInlineString(bill.dueDate)}')"`} aria-label="${paid?'Reverse payment for':'Mark paid:'} ${escapeHtml(bill.name)}">${svgIcon(paid?"checkCircle":"check",15)} ${paid?"Paid · Undo":"Mark Paid"}</button>
      </div></div>`;
  }
  function closeEditor() {
    document.getElementById("bbSplitDialog")?.close();
    document.getElementById("bbSplitDialog")?.remove();editor=null;
  }
  function editorRows() {
    const body=document.getElementById("bbSplitRows");if(!body||!editor)return;
    body.innerHTML=editor.rows.map((r,i)=>`<fieldset style="min-width:0;border:1px solid var(--border);border-radius:14px;padding:12px;margin:12px 0;">
      <legend>Portion ${i+1}${r.locked?" · payment history locked":""}</legend>
      <label style="display:block;">Amount<input data-field="amount" data-index="${i}" type="number" min="0.01" step="0.01" inputmode="decimal" value="${escapeHtml(r.amount)}" ${r.locked?"disabled":""} style="display:block;width:100%;min-height:44px;box-sizing:border-box;border:1px solid var(--border);background:var(--surface-2);border-radius:10px;padding:8px;"></label>
      <label style="display:block;margin-top:10px;">Planned payment date<input data-field="date" data-index="${i}" type="date" value="${escapeHtml(r.date)}" ${r.locked?"disabled":""} style="display:block;width:100%;min-width:0;min-height:44px;box-sizing:border-box;border:1px solid var(--border);background:var(--surface-2);border-radius:10px;padding:8px;"></label>
      <div data-funding="${i}" style="font-size:var(--text-xs);color:var(--text-muted);margin-top:8px;">${r.date?escapeHtml(occurrenceFundingLabel({month:r.date.slice(0,7),paycheck:Number(r.date.slice(-2))<=14?"first":"second"})):"Select a date"}</div>
      ${!r.locked?`<button type="button" class="bb-muted-pill" data-remove="${i}" style="margin-top:8px;">Remove portion</button>`:""}</fieldset>`).join("");
    body.oninput=event=>{
      const input=event.target;if(!input.dataset.field)return;
      editor.rows[Number(input.dataset.index)][input.dataset.field]=input.value;
      totals();
      if(input.dataset.field==="date") {
        const target=body.querySelector(`[data-funding="${input.dataset.index}"]`);
        target.textContent=input.value?occurrenceFundingLabel({month:input.value.slice(0,7),paycheck:Number(input.value.slice(-2))<=14?"first":"second"}):"Select a date";
      }
    };
    body.onclick=event=>{
      const button=event.target.closest("[data-remove]");if(!button)return;
      editor.rows.splice(Number(button.dataset.remove),1);editorRows();
    };
    totals();
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
      if(plan&&editor.rows.length!==plan.partIds.length)throw new Error("A split portion is missing. Restore or review the backup before editing.");
      const dialog=document.createElement("dialog");dialog.id="bbSplitDialog";
      dialog.style.cssText="position:fixed;inset:0;margin:auto;width:min(520px,calc(100% - 20px));max-height:calc(100dvh - 40px);box-sizing:border-box;overflow:auto;padding:20px;border:1px solid var(--border);border-radius:22px;background:var(--surface);color:var(--text);";
      dialog.innerHTML=`<h2 style="margin:0 0 8px;">${plan?"Manage":"Split"} Bill Payment</h2><p style="overflow-wrap:anywhere;">${escapeHtml(bill.name)} · Originally due ${escapeHtml(formatDate(bill.dueDate,"full"))}</p><p style="font-size:var(--text-sm);color:var(--text-muted);line-height:1.5;">For this occurrence only. Allocate the full total. Dates assign portions automatically to Paycheck 1 (days 1–14) or Paycheck 2 (day 15 onward). These are planning dates; they do not change your provider’s due date. Record each portion as paid from its paycheck plan.</p><div id="bbSplitRows"></div><p id="bbSplitTotals" role="status"></p><p id="bbSplitError" role="alert" style="color:var(--overdue);"></p><div style="display:grid;gap:10px;"><button type="button" class="bb-muted-pill" id="bbSplitAdd">Add Portion</button><button type="button" class="bb-muted-pill" id="bbSplitRemainder">Fill Last Portion With Remainder</button><button type="button" class="btn-primary" id="bbSplitSave">Save Split Schedule</button>${plan?'<button type="button" class="btn-danger" id="bbSplitCancelPlan">Remove Split Schedule</button>':''}<button type="button" class="bb-outline-pill" id="bbSplitClose">Close</button></div>`;
      dialog.addEventListener("cancel",event=>{if(busy)event.preventDefault();else closeEditor();});
      document.body.appendChild(dialog);
      document.getElementById("bbSplitClose").onclick=closeEditor;
      document.getElementById("bbSplitAdd").onclick=()=>{if(editor.rows.length>=24)return;editor.rows.push({id:uid(),amount:"0.00",date:key(bill.dueDate),locked:false});editorRows();};
      document.getElementById("bbSplitRemainder").onclick=()=>{
        try{const i=editor.rows.length-1;if(i<0||editor.rows[i].locked)throw new Error("Add an editable last portion first.");const rest=editor.totalCents-editor.rows.slice(0,i).reduce((s,r)=>s+cents(r.amount),0);if(rest<=0)throw new Error("No positive remainder is available.");editor.rows[i].amount=(rest/100).toFixed(2);editorRows();}catch(e){document.getElementById("bbSplitError").textContent=e.message;}
      };
      document.getElementById("bbSplitSave").onclick=()=>saveEditor(false);
      document.getElementById("bbSplitCancelPlan")?.addEventListener("click",()=>saveEditor(true));
      editorRows();dialog.showModal();
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
        if(draft.rows.length<2||draft.rows.length>24)throw new Error("Use between 2 and 24 portions.");
        let total=0;
        for(const r of draft.rows){const amount=cents(r.amount);if(amount<=0||!dateFromInput(r.date))throw new Error("Each portion needs a positive amount and valid payment date.");total+=amount;}
        if(total!==draft.totalCents)throw new Error(`Allocate exactly ${formatCurrency(draft.totalCents/100)}. Use Fill Last Portion With Remainder to include the final cents.`);
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
        text=`${old?"Split schedule updated":"Bill split"}: ${formatCurrency(plan.totalCents/100)}, originally due ${formatDate(plan.dueDate,"full")}.\n`+parts.map(p=>`${formatCurrency(p.amount)} planned ${formatDate(p.dueDate,"full")} · ${occurrenceFundingLabel(getOccurrenceFunding(p))}`).join("\n")+"\nFully allocated; original biller due date unchanged. Only this occurrence.";
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
    return original.calendar(date).filter(b=>!planFor(sourceFor(b)||b,b.originalDueDate || b.dueDate));
  };
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
    const parentLink=source?.splitPaymentParentId?`<p style="font-size:var(--text-sm);color:var(--text-muted);">Split ${source.splitPaymentPartNumber} of ${source.splitPaymentTotalParts} · Original bill due ${escapeHtml(formatDate(source.splitOriginalDueDate,"full"))}</p><button type="button" class="bb-outline-pill" style="width:100%;" onclick="navigate('detail',{id:'${escapeInlineString(source.splitPaymentParentId)}',occurrenceDueDate:'${escapeInlineString(source.splitOriginalDueDate)}',returnRoute:'today'})">View Original Bill & Split Notes</button>`:"";
    return original.fundingAction(bill)+splitButton+parentLink+notesHTML(bill);
  };
  renderBillDetail=function() {
    const source=Store.getBill(routeParams.id);
    const p=planFor(source,routeParams.occurrenceDueDate || getCurrentCalendarBillOccurrence(source)?.dueDate);
    let html=original.detail();
    if(p) html=html.replace(/Mark as Paid/g,"Manage Split Payments").replace(/Mark as Unpaid/g,"Manage Paid Portions");
    return html;
  };
  renderPaycheckInlineRows=function(selected) {
    const entries=[],groups=new Map();
    for(const bill of selected.bills) {
      if(!bill.installmentPlanId){entries.push({bill});continue;}
      const name=String(bill.installmentProvider || "Installments"),id=name.toLowerCase().replace(/\s+/g," ");
      if(!groups.has(id)){const group={id,name,bills:[]};groups.set(id,group);entries.push(group);}
      groups.get(id).bills.push(bill);
    }
    if(!entries.length)return '<p style="color:var(--text-muted);margin-top:12px;">No bills assigned to this paycheck.</p>';
    return `<div id="paycheckInlineList" data-view-key="${escapeHtml(paycheckInlineViewKey())}" style="margin-top:12px;">${entries.map((entry,i)=>`<div ${i>=3?'data-paycheck-extra hidden':''} style="border-top:1px solid var(--border);">${entry.bill?row(entry.bill):`<details data-paycheck-provider="${escapeHtml(entry.id)}"><summary style="display:flex;align-items:center;gap:10px;padding:12px;cursor:pointer;">${paymentPlanVisual(entry.name,28)}<span style="flex:1;font-weight:750;">${escapeHtml(entry.name)}</span><span>${formatCurrency(entry.bills.filter(b=>!isOccurrencePaid(b,new Date(b.dueDate))).reduce((s,b)=>s+Number(b.amount),0))} left</span></summary>${entry.bills.map(row).join("")}</details>`}</div>`).join("")}${entries.length>3?'<button type="button" class="bb-outline-pill" data-paycheck-show-more aria-expanded="false" style="width:100%;margin-top:12px;" onclick="togglePaycheckInlineRows(this)">Show More</button>':''}</div>`;
  };
  openPaycheckPlanSheet=function(pk) {
    original.sheet(pk);
    const list=document.querySelector("#paycheckPlanContainer .paycheck-bills-scroll");
    if(list)list.innerHTML=getPaycheckPlan(getDashboardPaycheckMonth())[pk==="second"?"second":"first"].bills.map(row).join("");
  };
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
    const text=`${context.bill.name}: ${formatCurrency(context.bill.amount)}, due ${formatDate(context.bill.dueDate,"full")}. Moved from ${occurrenceFundingLabel(context.from)} to ${occurrenceFundingLabel(context.to)}. Original due date unchanged; only this occurrence.`;
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
  window.BillBeaconSplits={version:1,
    _test:{cents,planFor,partsFor,note,commit,session,row,openEditor,saveEditor}};
})();

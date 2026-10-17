/* Bill Beacon BROWSER popup cleanup v2.
   Replace js/bill-popup-cleanup.js. Load after js/bill-splits.js.
   Presentation/navigation only; no financial storage writes. */
(() => {
  "use strict";
  if (window.BillBeaconPopupCleanup) return;
  if (!window.BillBeaconSplits || typeof renderBillDetail !== "function" ||
      typeof renderOccurrenceFundingAction !== "function" || typeof openBillDetailsSheet !== "function") {
    console.error("Popup cleanup: load app.js, settings-cleanup.js and bill-splits.js first.");
    return;
  }
  const before={funding:renderOccurrenceFundingAction,detail:renderBillDetail,details:openBillDetailsSheet};
  const dateKey=value=>typeof financialDateKey==="function"?financialDateKey(value):"";
  const records=()=>[...Store.getBills(),...getArchivedBills()];
  const record=id=>records().find(bill=>bill.id===id)||null;
  const cleanText=value=>String(value||"").replace(
    /\n?Fully allocated[;,]?\s*original biller due date unchanged[.;,]?\s*Only this occurrence\.?/gi,""
  ).trim();
  const text=node=>String(node?.textContent||"").replace(/\s+/g," ").trim();
  const holderFor=html=>{const node=document.createElement("div");node.innerHTML=html;return node;};
  const clone=value=>JSON.parse(JSON.stringify(value));

  function noteContext(id,dueDate) {
    const source=record(id);if(!source)return null;
    let parent=source,occurrenceKey="",effectiveDate=dueDate||source.dueDate;
    if(source.splitPaymentParentId) {
      parent=record(source.splitPaymentParentId);if(!parent)return null;
      occurrenceKey=source.splitPaymentOccurrenceKey||dateKey(source.splitOriginalDueDate);
      effectiveDate=source.splitOriginalDueDate;
    } else {
      const selected=dateKey(effectiveDate);
      const entry=Object.entries(source.splitOccurrencePlans||{}).find(([key,plan])=>
        key===selected||dateKey(plan?.originalDueDate)===selected||dateKey(plan?.dueDate)===selected);
      if(entry){occurrenceKey=entry[0];effectiveDate=entry[1].dueDate||effectiveDate;}
      if(!occurrenceKey){const occurrence=resolveCalendarBillOccurrence(id,effectiveDate);occurrenceKey=dateKey(occurrence?.originalDueDate||effectiveDate);}
    }
    if(!occurrenceKey)return null;
    const savedPlan=parent.splitOccurrencePlans?.[occurrenceKey];
    const plan=savedPlan?.enabled?savedPlan:null;
    return {source,parent,occurrenceKey,effectiveDate,plan};
  }

  function sharedNotes(context) {
    if(!context)return [];
    const {parent,occurrenceKey}=context;
    const candidates=[...(parent.occurrenceNotes?.[occurrenceKey]||[])];
    for(const child of records()) {
      if(child.splitPaymentParentId!==parent.id||child.splitPaymentOccurrenceKey!==occurrenceKey)continue;
      candidates.push(...(child.occurrenceNotes?.[dateKey(child.dueDate)]||[]));
    }
    const ids=new Set(),content=new Set(),result=[];
    for(const entry of candidates) {
      if(!entry||typeof entry!=="object")continue;
      const value=cleanText(entry.text);if(!value)continue;
      const signature=JSON.stringify([entry.timestamp||"",entry.actorUid||entry.actorName||"",value]);
      if((entry.id&&ids.has(entry.id))||content.has(signature))continue;
      if(entry.id)ids.add(entry.id);content.add(signature);result.push({...entry,text:value});
    }
    return result.sort((a,b)=>String(a.timestamp||"").localeCompare(String(b.timestamp||"")));
  }

  function notesMarkup(context) {
    const entries=sharedNotes(context);
    const body=entries.length?entries.map(entry=>{
      const stamp=new Date(entry.timestamp);
      const time=Number.isFinite(stamp.getTime())?stamp.toLocaleString():"";
      const meta=[time,entry.actorName||""].filter(Boolean).join(" · ");
      return `<article style="padding:12px 0;border-top:1px solid var(--border);">
        ${meta?`<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:6px;">${escapeHtml(meta)}</div>`:""}
        <div style="color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;">${escapeHtml(entry.text)}</div></article>`;
    }).join(""):'<div style="padding:10px 0;color:var(--text-muted);font-size:var(--text-sm);">No changes recorded for this occurrence.</div>';
    return `<section data-bb-shared-occurrence-notes="details"><div class="section-header" style="padding-left:0;padding-right:0;">Notes for this occurrence</div><div class="card" style="padding:0 14px;">${body}</div></section>`;
  }

  function stripNotes(root) {
    root.querySelectorAll("details").forEach(node=>{
      if(/^Notes for this occurrence\b/i.test(text(node.querySelector("summary"))))node.remove();
    });
    root.querySelectorAll("[data-bb-shared-occurrence-notes]").forEach(node=>node.remove());
  }

  function compact(button) {
    for(const [property,value]of Object.entries({"min-height":"40px",height:"auto",padding:"8px 12px","font-size":"14px","line-height":"1.2"}))
      button.style.setProperty(property,value,"important");
  }

  function groupParts(context) {
    if(!context?.plan||!Array.isArray(context.plan.partIds))return [];
    const active=Store.getBills();
    return context.plan.partIds.map(id=>{
      const child=active.find(bill=>bill.id===id);
      return child&&child.splitPaymentParentId===context.parent.id&&
        child.splitPaymentOccurrenceKey===context.occurrenceKey&&
        child.splitPaymentPlanId===context.plan.id?child:null;
    });
  }

  function paymentCents(bill) {
    if(!bill)return 0;
    const seen=new Set();let total=0;
    for(const payment of Store.getPaymentsForBill(bill.id)) {
      if(!isFinancialPaymentActive(payment)||getPaymentOccurrenceDateKey(payment)!==dateKey(bill.dueDate))continue;
      if(payment.id&&seen.has(payment.id))continue;
      if(payment.id)seen.add(payment.id);
      const value=Math.round(Number(payment.amount)*100);
      if(Number.isSafeInteger(value)&&value>=0)total+=value;
    }
    return total;
  }

  function scheduleMarkup(context) {
    if(!context?.plan)return "";
    const parts=groupParts(context),missing=parts.some(part=>!part);
    const total=Number(context.plan.totalCents);
    const paid=parts.reduce((sum,part)=>sum+paymentCents(part),0);
    const summary=Number.isSafeInteger(total)&&total>=0&&!missing?
      `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 14px;margin:10px 0 8px;font-size:var(--text-sm);"><span>Total ${formatCurrency(total/100)}</span><span style="color:var(--paid);">Paid ${formatCurrency(paid/100)}</span><span>Remaining ${formatCurrency(Math.max(0,total-paid)/100)}</span></div>`:
      '<p role="status" style="color:var(--overdue);font-size:var(--text-sm);">Split schedule needs review: a payment or total is unavailable.</p>';
    const rows=parts.map((part,index)=>{
      if(!part)return `<div style="padding:12px 0;color:var(--overdue);">Payment ${index+1} unavailable</div>`;
      const selected=routeParams.id===part.id&&dateKey(routeParams.occurrenceDueDate||part.dueDate)===dateKey(part.dueDate);
      const status=getPaycheckBillStatusLabel(part);
      return `<button type="button" data-bb-split-payment="${escapeHtml(part.id)}" ${selected?'aria-current="true"':""}
        onclick="bbSelectSplitPayment('${escapeInlineString(part.id)}','${escapeInlineString(part.dueDate)}')"
        style="display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:12px 10px;box-sizing:border-box;text-align:left;color:var(--text);border:0;border-top:1px solid var(--border);border-radius:10px;background:${selected?'var(--accent-dim,transparent)':'transparent'};">
        <span style="min-width:0;flex:1;"><span style="display:block;font-weight:750;">Payment ${part.splitPaymentPartNumber||index+1}${selected?' · Selected':''}</span>
        <span style="display:block;margin-top:4px;font-size:var(--text-xs);color:${status.color};">${escapeHtml(status.label)}</span></span>
        <span style="font-weight:800;white-space:nowrap;">${formatCurrency(part.amount)}</span>
        <span aria-hidden="true" style="color:var(--text-muted);">${svgIcon("chevronRight",16)}</span></button>`;
    }).join("");
    return `<section class="card" data-bb-split-schedule style="padding:14px;margin-top:14px;">
      <div style="font-weight:800;">Split Payment Schedule</div>${summary}${rows}
      ${!missing?`<button type="button" class="bb-outline-pill" style="width:100%;min-height:40px;height:auto;padding:8px 12px;font-size:14px;line-height:1.2;margin-top:12px;" onclick="bbOpenSplit('${escapeInlineString(context.parent.id)}','${escapeInlineString(context.plan.dueDate)}')">Manage Split Payments</button>`:""}</section>`;
  }

  function selectedParams(params,id,dueDate) {
    let destination=clone(params||{});
    const seen=new Set();
    // Remove only obsolete detail-to-detail split navigation. Keep the original
    // paycheck return route, selected month, expanded groups and sheet scroll.
    for(let depth=0;destination.bbSplitReturn?.route==="detail"&&depth<32;depth++) {
      const previous=destination.bbSplitReturn.params;
      if(!previous||typeof previous!=="object")break;
      const signature=JSON.stringify(previous);if(seen.has(signature))break;
      seen.add(signature);destination=clone(previous);
    }
    delete destination.bbSplitReturn;delete destination.bbSplitRestoreScroll;
    return {...destination,id,occurrenceDueDate:dueDate};
  }

  window.bbSelectSplitPayment=function(id,dueDate) {
    if(currentRoute!=="detail")return;
    const context=noteContext(routeParams.id,routeParams.occurrenceDueDate);
    if(!context?.plan)return;
    const candidate=groupParts(context).find(part=>part?.id===id&&dateKey(part.dueDate)===dateKey(dueDate));
    if(!candidate)return;
    const main=document.querySelector("#app .main-content");
    const position={window:window.scrollY||0,main:main?.scrollTop||0};
    // Change selection, not navigation: no additional detail page or Back step.
    routeParams=selectedParams(routeParams,candidate.id,candidate.dueDate);
    render();
    requestAnimationFrame(()=>{
      if(currentRoute!=="detail"||routeParams.id!==candidate.id)return;
      window.scrollTo(0,position.window);
      const current=document.querySelector("#app .main-content");if(current)current.scrollTop=position.main;
    });
  };

  renderOccurrenceFundingAction=function(bill) {
    const root=holderFor(before.funding(bill));stripNotes(root);
    const source=record(getBillPaymentId(bill));
    const context=source?noteContext(source.id,bill.dueDate):null;
    const buttons=[...root.querySelectorAll("button")];
    const move=buttons.find(button=>/\bopenMoveOccurrencePaycheck\s*\(/.test(button.getAttribute("onclick")||""));
    const split=buttons.find(button=>text(button)==="Split This Payment");
    if(context?.plan) {
      return (move?`<div data-bb-clean-funding style="margin-top:12px;">${move.outerHTML}</div>`:"")+scheduleMarkup(context);
    }
    if(move) {
      const actions=[move];if(split&&!source?.splitPaymentParentId)actions.push(split);
      return `<div data-bb-clean-funding style="margin-top:12px;">${actions.map(button=>button.outerHTML).join("")}</div>`;
    }
    // No active split: keep any existing actions, but never duplicate notes.
    root.querySelectorAll("button").forEach(button=>{
      if(text(button)==="View Original Bill & Split Notes")button.remove();
    });
    return root.innerHTML;
  };

  renderBillDetail=function() {
    const root=holderFor(before.detail());stripNotes(root);
    const context=noteContext(routeParams.id,routeParams.occurrenceDueDate);
    for(const button of [...root.querySelectorAll("button")]) {
      const action=button.getAttribute("onclick")||"",label=text(button);
      if(/\bopenPaymentLinkPopup\s*\(/.test(action)||label==="Add Payment Link"||label==="View Original Bill & Split Notes") {
        button.remove();continue;
      }
      if(button.classList.contains("bill-show-details-button")||/\bopenBillDetailsSheet\s*\(/.test(action))
        button.innerHTML=button.innerHTML.replace(/Show Details(?: &amp; Notes| & Notes)?/g,"Show Details &amp; Notes");
      if(["Manage Split Payments","Manage Paid Portions"].includes(label)&&context?.plan&&!button.closest("[data-bb-split-schedule]")) {
        const parent=button.parentElement;button.remove();
        if(parent&&parent.style.display==="grid"&&parent.children.length===1)parent.style.gridTemplateColumns="1fr";
        continue;
      }
      if(["Manage Split Payments","Manage Paid Portions","Postpone"].includes(label))compact(button);
    }
    return root.innerHTML;
  };

  function activeDetailsRoot() {
    const roots=[...document.querySelectorAll("#billDetailsSheet,.bill-details-sheet")]
      .filter(node=>node.isConnected&&!node.closest("[data-bb-drag-preview]"));
    return roots[roots.length-1]||null;
  }
  function augmentDetails(context,signature,session) {
    if(JSON.stringify(routeParams)!==signature)return;
    const current=window.getBillBeaconHouseholdContext?.();
    if(session&&(!current||current.uid!==session.uid||current.householdId!==session.householdId||current.generation!==session.generation))return;
    const root=activeDetailsRoot();if(!root)return;
    stripNotes(root);
    const body=root.querySelector(".sheet-body")||root;
    const holder=holderFor(notesMarkup(context)),notes=holder.firstElementChild;if(!notes)return;
    const history=[...body.querySelectorAll(".section-header,h2,h3,h4")].find(node=>/^Payment History$/i.test(text(node)));
    if(history)history.parentNode.insertBefore(notes,history);else body.appendChild(notes);
    const title=root.querySelector(".sheet-title");if(title&&/^(Bill )?Details$/i.test(text(title)))title.textContent="Details & Notes";
    root.querySelectorAll("button").forEach(button=>{
      if(/\bopenPaymentLinkPopup\s*\(/.test(button.getAttribute("onclick")||"")||text(button)==="Add Payment Link")button.remove();
    });
  }
  openBillDetailsSheet=function(id,...args) {
    const source=record(id);
    let dueDate=routeParams.id===id?routeParams.occurrenceDueDate:null;
    if(!dueDate&&source)dueDate=source.splitPaymentParentId?source.dueDate:getCurrentCalendarBillOccurrence(source)?.dueDate||source.dueDate;
    const context=noteContext(id,dueDate),signature=JSON.stringify(routeParams),session=window.getBillBeaconHouseholdContext?.();
    const result=before.details.call(this,id,...args);
    if(context) {
      augmentDetails(context,signature,session);
      requestAnimationFrame(()=>augmentDetails(context,signature,session));
      if(result&&typeof result.then==="function")result.then(()=>augmentDetails(context,signature,session)).catch(error=>console.error("Details & Notes:",error));
    }
    return result;
  };
  window.openBillDetailsSheet=openBillDetailsSheet;
  window.BillBeaconPopupCleanup={version:2,
    _test:{noteContext,sharedNotes,notesMarkup,cleanText,groupParts,paymentCents,scheduleMarkup,selectedParams}};
})();
/* Split-card polish: append below the existing popup-cleanup code. */
(() => {
  "use strict";

  if (window.BillBeaconSplitCardPolish) return;

  if (
    !window.BillBeaconPopupCleanup ||
    typeof renderOccurrenceFundingAction !== "function"
  ) {
    console.error(
      "Split-card polish: load the popup cleanup first."
    );
    return;
  }

  const previousFunding = renderOccurrenceFundingAction;

  renderOccurrenceFundingAction = function (bill) {
    const html = previousFunding.apply(this, arguments);

    const root = document.createElement("div");
    root.innerHTML = html;

    const card = root.querySelector(
      "[data-bb-split-schedule]"
    );

    // Leave ordinary, unsplit bills unchanged.
    if (!card) return html;

    const move = [...root.querySelectorAll("button")]
      .find(button =>
        /\bopenMoveOccurrencePaycheck\s*\(/.test(
          button.getAttribute("onclick") || ""
        )
      );

    const manage = [...card.querySelectorAll("button")]
      .find(button =>
        button.textContent.replace(/\s+/g, " ").trim() ===
        "Manage Split Payments"
      );

    if (move && manage) {
      const oldContainer = move.parentElement;

      // Move the existing control; keep its payment-specific action.
      manage.insertAdjacentElement("afterend", move);

      move.classList.add("bb-outline-pill");
        move.textContent = "Move To Next Paycheck";
      const styles = {
  width: "100%",
  "min-height": "40px",
  height: "auto",
  padding: "8px 12px",
  "margin-top": "10px",
  display: "flex",
  "align-items": "center",
  "justify-content": "center",
  "text-align": "center",
  color: "var(--text)",
  "font-size": "14px",
  "font-weight": "700",
  "line-height": "1.2",
  "box-sizing": "border-box"
};

      for (const [property, value] of Object.entries(styles)) {
        move.style.setProperty(property, value, "important");
      }

      if (
        oldContainer !== card &&
        oldContainer?.hasAttribute("data-bb-clean-funding") &&
        oldContainer.children.length === 0
      ) {
        oldContainer.remove();
      }
    }

    card.querySelectorAll(
      '[data-bb-split-payment][aria-current="true"]'
    ).forEach(button => {
      const styles = {
        background: "rgba(180, 92, 255, 0.07)",
        border: "1px solid rgba(180, 92, 255, 0.30)",
        "border-radius": "12px",
        "box-shadow":
          "inset 3px 0 0 rgba(180, 92, 255, 0.75)",
        color: "var(--text)"
      };

      for (const [property, value] of Object.entries(styles)) {
        button.style.setProperty(property, value, "important");
      }
    });

    return root.innerHTML;
  };

  window.BillBeaconSplitCardPolish = { version: 1 };
})();
/* Consistent Move To Next Paycheck styling.
   Does not relocate any buttons. */
(() => {
  "use strict";

  if (window.BillBeaconMoveButtonStyle) return;
  if (typeof renderOccurrenceFundingAction !== "function") return;

  const previousFunding = renderOccurrenceFundingAction;

  renderOccurrenceFundingAction = function () {
    const html = previousFunding.apply(this, arguments);

    const root = document.createElement("div");
    root.innerHTML = html;

    let changed = false;

    root.querySelectorAll("button[onclick]").forEach(button => {
      const action = button.getAttribute("onclick") || "";

      if (!/\bopenMoveOccurrencePaycheck\s*\(/.test(action)) {
        return;
      }

      button.textContent = "Move To Next Paycheck";
      button.classList.add("bb-outline-pill");

      const styles = {
        width: "100%",
        "min-height": "40px",
        height: "auto",
        padding: "8px 12px",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "text-align": "center",
        color: "var(--text)",
        "font-size": "14px",
        "font-weight": "700",
        "line-height": "1.2",
        "box-sizing": "border-box"
      };

      for (const [property, value] of Object.entries(styles)) {
        button.style.setProperty(property, value, "important");
      }

      changed = true;
    });

    return changed ? root.innerHTML : html;
  };

  window.BillBeaconMoveButtonStyle = { version: 1 };
})();
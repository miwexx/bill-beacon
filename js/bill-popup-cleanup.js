/* Bill Beacon BROWSER popup cleanup v1.
   Load AFTER js/bill-splits.js. Presentation only: no financial storage writes. */
(() => {
  "use strict";
  if (window.BillBeaconPopupCleanup) return;
  if (!window.BillBeaconSplits || typeof renderBillDetail !== "function" ||
      typeof renderOccurrenceFundingAction !== "function" || typeof openBillDetailsSheet !== "function") {
    console.error("Bill Beacon popup cleanup: load app.js, settings-cleanup.js and bill-splits.js first.");
    return;
  }
  const before = {
    funding: renderOccurrenceFundingAction,
    detail: renderBillDetail,
    details: openBillDetailsSheet
  };
  const dateKey = value => typeof financialDateKey === "function" ? financialDateKey(value) : "";
  const records = () => [...Store.getBills(), ...getArchivedBills()];
  const record = id => records().find(bill => bill.id === id) || null;
  const cleanText = value => String(value || "").replace(
    /\n?Fully allocated[;,]?\s*original biller due date unchanged[.;,]?\s*Only this occurrence\.?/gi, ""
  ).trim();
  const text = node => String(node?.textContent || "").replace(/\s+/g, " ").trim();
  const holderFor = html => {const node=document.createElement("div");node.innerHTML=html;return node;};
  const isPaycheckEntry = params => !params?.bbSplitReturn && params?.returnRoute === "today" &&
    Boolean(params?.returnParams?.paycheckInlineReturn || params?.returnParams?.paycheckSheetReturn);
  const isNestedPayment = (bill,params) => Boolean(bill?.splitPaymentParentId &&
    params?.bbSplitReturn?.route === "detail");

  function noteContext(id,dueDate) {
    const source=record(id);
    if(!source)return null;
    let parent=source,occurrenceKey="",effectiveDate=dueDate || source.dueDate;
    if(source.splitPaymentParentId) {
      parent=record(source.splitPaymentParentId);
      // Never substitute a different series if the original bill is unavailable.
      if(!parent)return null;
      occurrenceKey=source.splitPaymentOccurrenceKey || dateKey(source.splitOriginalDueDate);
      effectiveDate=source.splitOriginalDueDate;
    } else {
      const selectedKey=dateKey(effectiveDate);
      const entry=Object.entries(source.splitOccurrencePlans || {}).find(([key,plan]) =>
        key===selectedKey || dateKey(plan?.originalDueDate)===selectedKey || dateKey(plan?.dueDate)===selectedKey);
      if(entry) {occurrenceKey=entry[0];effectiveDate=entry[1].dueDate || effectiveDate;}
      if(!occurrenceKey) {
        const occurrence=resolveCalendarBillOccurrence(id,effectiveDate);
        occurrenceKey=dateKey(occurrence?.originalDueDate || effectiveDate);
      }
    }
    if(!occurrenceKey)return null;
    return {source,parent,occurrenceKey,effectiveDate};
  }

  function sharedNotes(context) {
    if(!context)return [];
    const {parent,occurrenceKey}=context;
    const candidates=[...(parent.occurrenceNotes?.[occurrenceKey] || [])];
    for(const child of records()) {
      if(child.splitPaymentParentId!==parent.id || child.splitPaymentOccurrenceKey!==occurrenceKey)continue;
      const ownKey=dateKey(child.dueDate);
      candidates.push(...(child.occurrenceNotes?.[ownKey] || []));
    }
    const seenIds=new Set(),seenContent=new Set(),result=[];
    for(const entry of candidates) {
      if(!entry || typeof entry!=="object")continue;
      const value=cleanText(entry.text);
      if(!value)continue;
      const signature=JSON.stringify([entry.timestamp || "",entry.actorUid || entry.actorName || "",value]);
      if((entry.id&&seenIds.has(entry.id)) || seenContent.has(signature))continue;
      if(entry.id)seenIds.add(entry.id);
      seenContent.add(signature);result.push({...entry,text:value});
    }
    return result.sort((a,b)=>String(a.timestamp || "").localeCompare(String(b.timestamp || "")));
  }

  function notesMarkup(context,inline=false) {
    const entries=sharedNotes(context);
    if(!entries.length && inline)return "";
    const body=entries.length ? entries.map(entry=>{
      const stamp=new Date(entry.timestamp);
      const time=Number.isFinite(stamp.getTime()) ? stamp.toLocaleString() : "";
      const metadata=[time,entry.actorName || ""].filter(Boolean).join(" · ");
      return `<article style="padding:12px 0;border-top:1px solid var(--border);">
        ${metadata?`<div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:6px;">${escapeHtml(metadata)}</div>`:""}
        <div style="color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;">${escapeHtml(entry.text)}</div>
      </article>`;
    }).join("") : `<div style="padding:10px 0;color:var(--text-muted);font-size:var(--text-sm);">No changes recorded for this occurrence.</div>`;
    if(inline)return `<details class="card" data-bb-shared-occurrence-notes="inline" style="padding:14px;margin-top:12px;">
      <summary style="font-weight:750;cursor:pointer;">Notes for this occurrence (${entries.length})</summary>${body}</details>`;
    return `<section data-bb-shared-occurrence-notes="details">
      <div class="section-header" style="padding-left:0;padding-right:0;">Notes for this occurrence</div>
      <div class="card" style="padding:0 14px;">${body}</div></section>`;
  }

  function stripOldOccurrenceNotes(root) {
    root.querySelectorAll("details").forEach(details=>{
      if(/^Notes for this occurrence\b/i.test(text(details.querySelector("summary"))))details.remove();
    });
    root.querySelectorAll("[data-bb-shared-occurrence-notes]").forEach(node=>node.remove());
  }

  function compact(button) {
    button.style.setProperty("min-height","40px","important");
    button.style.setProperty("height","auto","important");
    button.style.setProperty("padding","8px 12px","important");
    button.style.setProperty("font-size","14px","important");
    button.style.setProperty("line-height","1.2","important");
  }

  renderOccurrenceFundingAction=function(bill) {
    const source=record(getBillPaymentId(bill));
    const root=holderFor(before.funding(bill));
    stripOldOccurrenceNotes(root);
    const buttons=[...root.querySelectorAll("button")];
    const move=buttons.find(button=>/\bopenMoveOccurrencePaycheck\s*\(/.test(button.getAttribute("onclick") || ""));
    const split=buttons.find(button=>text(button)==="Split This Payment");
    const parentLink=buttons.find(button=>text(button)==="View Original Bill & Split Notes");
    // Only action buttons survive for normal/individual payment views. This
    // removes repeated Due/Funded by/Moved from and original-due paragraphs.
    if(move) {
      const actions=[move];
      if(!isNestedPayment(source,routeParams)) {
        if(split)actions.push(split);
        if(parentLink)actions.push(parentLink);
      }
      let html=`<div data-bb-clean-funding style="margin-top:12px;">${actions.map(button=>button.outerHTML).join("")}</div>`;
      if(source?.splitPaymentParentId && isPaycheckEntry(routeParams)) {
        html+=notesMarkup(noteContext(source.id,bill.dueDate),true);
      }
      return html;
    }
    // Original split occurrence: retain its schedule card, without repeated notes.
    for(const button of root.querySelectorAll("button")) {
      if(["Manage Split Payments","Manage Paid Portions","Postpone"].includes(text(button)))compact(button);
    }
    return root.innerHTML;
  };

  renderBillDetail=function() {
    const root=holderFor(before.detail());
    const source=record(routeParams.id);
    const nested=isNestedPayment(source,routeParams);
    for(const button of [...root.querySelectorAll("button")]) {
      const action=button.getAttribute("onclick") || "";
      if(/\bopenPaymentLinkPopup\s*\(/.test(action) || text(button)==="Add Payment Link") {
        button.remove();continue;
      }
      const isDetails=button.classList.contains("bill-show-details-button") ||
        /\bopenBillDetailsSheet\s*\(/.test(action);
      if(isDetails) {
        if(nested){button.remove();continue;}
        // Preserve the existing icon and chevron.
        button.innerHTML=button.innerHTML.replace(/Show Details(?: &amp; Notes| & Notes)?/g,"Show Details &amp; Notes");
      }
      if(["Manage Split Payments","Manage Paid Portions","Postpone"].includes(text(button)))compact(button);
    }
    return root.innerHTML;
  };

  function activeDetailsRoot() {
    const candidates=[...document.querySelectorAll("#billDetailsSheet,.bill-details-sheet")]
      .filter(node=>node.isConnected && !node.closest("[data-bb-drag-preview]"));
    return candidates[candidates.length-1] || null;
  }

  function augmentDetails(context,paramsSignature,session) {
    if(JSON.stringify(routeParams)!==paramsSignature)return;
    const now=window.getBillBeaconHouseholdContext?.();
    if(session && (!now || now.uid!==session.uid || now.householdId!==session.householdId || now.generation!==session.generation))return;
    const root=activeDetailsRoot();if(!root)return;
    stripOldOccurrenceNotes(root);
    const body=root.querySelector(".sheet-body") || root;
    const section=document.createElement("div");section.innerHTML=notesMarkup(context,false);
    const notes=section.firstElementChild;
    if(!notes)return;
    const headers=[...body.querySelectorAll(".section-header,h2,h3,h4")];
    const history=headers.find(node=>/^Payment History$/i.test(text(node)));
    if(history)history.parentNode.insertBefore(notes,history);
    else body.appendChild(notes);
    const title=root.querySelector(".sheet-title");
    if(title && /^(Bill )?Details$/i.test(text(title)))title.textContent="Details & Notes";
    // No payment-link invitation when a bill has no saved link.
    root.querySelectorAll("button").forEach(button=>{
      if(/\bopenPaymentLinkPopup\s*\(/.test(button.getAttribute("onclick") || "") || text(button)==="Add Payment Link")button.remove();
    });
  }

  openBillDetailsSheet=function(id,...args) {
    const source=record(id);
    let dueDate=routeParams.id===id ? routeParams.occurrenceDueDate : null;
    if(!dueDate && source)dueDate=source.splitPaymentParentId ? source.dueDate :
      getCurrentCalendarBillOccurrence(source)?.dueDate || source.dueDate;
    const context=noteContext(id,dueDate);
    const signature=JSON.stringify(routeParams);
    const session=window.getBillBeaconHouseholdContext?.();
    const result=before.details.call(this,id,...args);
    if(context) {
      augmentDetails(context,signature,session);
      requestAnimationFrame(()=>augmentDetails(context,signature,session));
      if(result && typeof result.then==="function")result.then(()=>augmentDetails(context,signature,session)).catch(error=>console.error("Details & Notes:",error));
    }
    return result;
  };
  window.openBillDetailsSheet=openBillDetailsSheet;
  window.BillBeaconPopupCleanup={version:1,
    _test:{noteContext,sharedNotes,notesMarkup,isPaycheckEntry,isNestedPayment,cleanText}};
})();

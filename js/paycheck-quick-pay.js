/* Bill Beacon BROWSER: compact Dashboard paycheck quick-pay.
   Load after bill-splits.js and all Dashboard UI scripts.
   Reuses the existing payment confirmation/recording function. */
(() => {
  "use strict";
  if(window.BillBeaconPaycheckQuickPay)return;
  if(typeof renderPaycheckInlineRows!=="function"||typeof window.bbSplitQuickPaid!=="function") {
    console.error("Paycheck quick-pay: load app.js and bill-splits.js first.");return;
  }
  const previous=renderPaycheckInlineRows;
  function rowBill(action,bills) {
    if(!/\bopenPaycheckInlineBill\s*\(/.test(action))return null;
    const matches=bills.filter(bill=>{
      const id=escapeInlineString(getBillPaymentId(bill));
      const date=escapeInlineString(bill.dueDate);
      return action.includes(`'${id}'`)&&action.includes(`'${date}'`);
    });
    return matches.length===1?matches[0]:null;
  }
  window.bbPaycheckRecordPaid=async function(button,id,dueDate) {
    if(button.disabled)return;
    button.disabled=true;button.setAttribute("aria-busy","true");
    const label=button.querySelector("[data-bb-quickpay-label]");
    if(label)label.textContent="Saving…";
    try {await window.bbSplitQuickPaid(id,dueDate);}
    catch(error){alert(error?.message||"Could not record payment. Review payment history before retrying.");}
    finally {
      if(button.isConnected){button.disabled=false;button.removeAttribute("aria-busy");if(label)label.textContent="✓ Mark Paid";}
    }
  };
  renderPaycheckInlineRows=function(selected) {
    const html=previous.apply(this,arguments);
    const root=document.createElement("div");root.innerHTML=html;
    let changed=false;
    for(const mainButton of [...root.querySelectorAll("button[onclick]")]) {
      const bill=rowBill(mainButton.getAttribute("onclick")||"",selected.bills||[]);
      if(!bill||!Store.getBill(getBillPaymentId(bill))||isOccurrencePaid(bill,new Date(bill.dueDate)))continue;
      const amount=mainButton.lastElementChild;
      if(!amount||amount.tagName!=="SPAN")continue;
      const id=getBillPaymentId(bill),dueDate=bill.dueDate;
      // Wrap, rather than nest buttons. The existing details button and its
      // onclick remain unchanged, preserving paycheck return/scroll handling.
      const wrapper=document.createElement("div");
      wrapper.setAttribute("data-bb-paycheck-quickpay-row","");
      wrapper.style.cssText="position:relative;display:block;width:100%;margin:0;padding:0;";
      mainButton.parentNode.insertBefore(wrapper,mainButton);wrapper.appendChild(mainButton);
      amount.style.minWidth="94px";amount.style.textAlign="right";
      amount.style.position="relative";amount.style.top="-11px";
      const button=document.createElement("button");button.type="button";
      button.setAttribute("aria-label",`Mark ${bill.name} ${formatCurrency(bill.amount)} as paid${bill.splitPaymentParentId?`, split payment ${bill.splitPaymentPartNumber}`:""}`);
      button.setAttribute("onclick",`event.stopPropagation();bbPaycheckRecordPaid(this,'${escapeInlineString(id)}','${escapeInlineString(dueDate)}')`);
      button.style.cssText="position:absolute;right:0;bottom:0;display:flex;align-items:center;justify-content:flex-end;width:94px;height:32px;min-height:0;margin:0;padding:0;border:0;background:transparent;color:var(--text);font:inherit;cursor:pointer;";
      button.innerHTML='<span data-bb-quickpay-label style="display:inline-flex;align-items:center;justify-content:center;min-height:22px;box-sizing:border-box;padding:3px 8px;border:1px solid var(--border-strong);border-radius:999px;background:var(--surface);color:var(--text);font-size:10px;line-height:1.2;font-weight:700;white-space:nowrap;">✓ Mark Paid</span>';
      wrapper.appendChild(button);changed=true;
    }
    return changed?root.innerHTML:html;
  };
  window.BillBeaconPaycheckQuickPay={version:1,originalRenderer:previous,_test:{rowBill}};
})();

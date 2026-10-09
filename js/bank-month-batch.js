let billMonthBatchBusy = false;

async function runBillMonthMatchBatch(button, monthKey = "2026-09") {
  if (billMonthBatchBusy || allPostedPreviewBusy || reviewedBankApplyBusy) return;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) throw new Error("Invalid bill month.");
  const context = window.getBillBeaconHouseholdContext?.();
  if (!context?.ready || !context.householdId || plaidBankState.canManageBankConnection === false) {
    setPlaidBankMessage("The signed-in bank owner and a ready household are required."); return;
  }
  const sessionVersion = plaidSessionVersion;
  const accountId = plaidBankState.selectedAccountId;
  if (!accountId || typeof window.billBeaconRefreshSharedHousehold !== "function") {
    setPlaidBankMessage("Load the selected bank account and sync refresh helper first."); return;
  }
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, 12));
  const end = new Date(Date.UTC(year, month, 0, 12));
  start.setUTCDate(start.getUTCDate() - 14); end.setUTCDate(end.getUTCDate() + 14);
  const first = start.toISOString().slice(0, 10), last = end.toISOString().slice(0, 10);
  const inRange = value => {
    const key = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(key) && key >= first && key <= last;
  };
  const effectiveDay = transaction => [transaction.date, transaction.authorizedDate]
    .filter(Boolean).map(value => String(value).slice(0, 10)).sort()[0] || "";
  const unique = new Map();
  for (const transaction of plaidBankState.transactions || []) {
    if (transaction.accountId !== accountId || transaction.pending !== false || transaction.type !== "debit" ||
        typeof transaction.id !== "string" || !(inRange(transaction.date) || inRange(transaction.authorizedDate))) continue;
    const previous = unique.get(transaction.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(transaction)) {
      setPlaidBankMessage("Conflicting duplicate bank data. Sync before running the batch."); return;
    }
    unique.set(transaction.id, {...transaction});
  }
  const transactions = [...unique.values()].sort((a,b) => effectiveDay(a).localeCompare(effectiveDay(b)) ||
    String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
  if (!transactions.length) {setPlaidBankMessage("No loaded posted debits in this bill month's bank window.");return;}
  const account = (plaidBankState.accounts || []).find(item => item.id === accountId);
  const accountLabel = account ? `${account.name}${account.mask ? " ending " + account.mask : ""}` : "selected bank account";
  if (!confirm(`Record all unambiguous ${monthKey} bill matches from ${accountLabel}?\n\n` +
      `${transactions.length} posted debits will be checked, using bank dates ${first} through ${last}.\n` +
      `Successful matches WILL update real shared payment history and paid status. ` +
      `Ambiguous and other-month allocations will be skipped. This does not send money. ` +
      `The batch is not all-or-nothing: completed payments remain saved if it stops.`)) return;

  billMonthBatchBusy = true; allPostedPreviewBusy = true;
  if (button) button.disabled = true;
  const rows = [], confirmedIds = new Set();
  let cancelled = false, failure = "", uncertain = false;
  const dialog = document.createElement("dialog");
  dialog.id = "billBeaconMonthBatchDialog";
  dialog.style.cssText = "max-width:620px;width:90%;max-height:85vh;overflow:auto;padding:20px;border-radius:16px;background:var(--surface,#172025);color:var(--text,#fff);";
  const title = document.createElement("h3"); title.textContent = `Record ${monthKey} matched payments`;
  const progress = document.createElement("p");
  const report = document.createElement("pre"); report.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;max-height:45vh;overflow:auto;";
  const stop = document.createElement("button");stop.type = "button";stop.textContent = "Stop after current transaction";
  stop.onclick = () => {cancelled = true;stop.disabled = true;};
  const download = document.createElement("button");download.type = "button";download.textContent = "Save report";
  download.onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({monthKey, bankWindow:[first,last], failure, uncertain, rows},null,2)],{type:"application/json"}));
    const link = document.createElement("a");link.href = url;link.download = `bill-beacon-${monthKey}-batch-report.json`;link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  dialog.append(title,progress,report,stop,download); document.body.appendChild(dialog); dialog.showModal();
  dialog.addEventListener("cancel", event => {event.preventDefault();cancelled = true;});
  const signOut = () => {cancelled = true;dialog.remove();window.billBeaconMonthBatchReport = null;};
  window.addEventListener("billbeacon:signed-out",signOut);
  window.billBeaconDeferBankRender = true;
  window.billBeaconPostedScanReport = null;
  window.billBeaconMonthBatchReport = {monthKey,rows};
  const checkSession = () => {
    const current = window.getBillBeaconHouseholdContext?.();
    const status = window.billBeaconSyncStatus?.();
    if (sessionVersion !== plaidSessionVersion || accountId !== plaidBankState.selectedAccountId ||
        current?.generation !== context.generation || current.householdId !== context.householdId) throw new Error("Session or bank account changed.");
    if (!status?.ready || status.pending || status.conflict) throw new Error("Household sync needs attention. Finish syncing before continuing.");
  };
  const draw = () => {
    progress.textContent = `Checked ${rows.length} of ${transactions.length}. Recorded: ${rows.filter(r=>r.status==="allocated").length}; reconciled: ${rows.filter(r=>r.status==="reconciled").length}.`;
    report.textContent = rows.map(r=>`${r.date} | ${r.merchant} | $${r.amount.toFixed(2)}\n${r.status}: ${r.reason || ""}\n` +
      r.allocations.map(a=>`  ${a.name || a.billId} — $${Number(a.amount).toFixed(2)} — due ${String(a.dueDate).slice(0,10)}`).join("\n")).join("\n\n");
  };
  try {
    await window.billBeaconPrepareDataTransfer(); checkSession();
    for (const transaction of transactions) {
      if (cancelled) break;
      checkSession();
      const row = {transactionId:transaction.id,date:String(transaction.date).slice(0,10),
        merchant:transaction.merchantName || "",amount:Number(transaction.amount),status:"checking",reason:"",allocations:[]};
      rows.push(row); draw();
      try {
        const preview = await callPlaidWorker("/plaid/match-preview?transactionId="+encodeURIComponent(transaction.id));
        checkSession();
        if (preview.dryRun !== true || preview.diagnosticOnly !== true || preview.checked !== 1) throw new Error("Expected a single-transaction preview.");
        const proposal = (preview.proposals || [])[0]; row.allocations = proposal?.allocations || [];
        if (preview.alreadyLinked) {row.status="already-linked";row.reason="Existing verified payment; not recorded again.";draw();continue;}
        if (!proposal || !["would-allocate","would-reconcile"].includes(proposal.status)) {
          row.status = proposal?.status || (preview.review ? "review" : "unmatched");
          row.reason = proposal?.reason || "No safe eligible match reported. Compare bill name, amount, dates and payment history.";draw();continue;
        }
        if (!row.allocations.length || row.allocations.some(a=>String(a.dueDate).slice(0,7)!==monthKey)) {
          row.status="outside-month";row.reason="Allocation includes another bill month; not applied.";draw();continue;
        }
        if (cancelled) {row.status="not-applied";row.reason="Stopped before applying.";draw();break;}
        checkSession();
        uncertain = true;
        const applied = await callPlaidWorker("/plaid/apply-match",{
          transactionId:transaction.id,accountId,householdId:context.householdId,
          transactionAmount:Number(transaction.amount),postedDate:String(transaction.date).slice(0,10),
          expectedStatus:proposal.status,allocations:row.allocations
        });
        if (!["allocated","reconciled","already-linked"].includes(applied.status) ||
            applied.householdId!==context.householdId || !Array.isArray(applied.paymentIds) || !applied.paymentIds.length) {
          throw new Error("Payment commit confirmation was incomplete.");
        }
        applied.paymentIds.forEach(id=>confirmedIds.add(id));
        row.status=applied.status;row.reason="Server confirmed the shared payment record.";
        uncertain=false; checkSession();
        await window.billBeaconRefreshSharedHousehold(applied.paymentIds);
        checkSession(); draw();
      } catch (error) {
        row.status=uncertain?"commit-uncertain":"error";row.reason=error.message;draw();throw error;
      }
      await new Promise(resolve=>setTimeout(resolve,250));
    }
  } catch (error) {
    failure=error.message;
  } finally {
    window.billBeaconDeferBankRender=false;
    if (sessionVersion===plaidSessionVersion) {
      try {await window.billBeaconRefreshSharedHousehold([...confirmedIds]);}
      catch(error){failure += (failure?" ":"")+"Final refresh: "+error.message;}
      const summary = failure ? `Stopped: ${failure}` : cancelled ? "Stopped by you." : "Batch completed.";
      draw();progress.textContent += " " + summary + (uncertain?" Check shared Payment History before retrying; the last payment may be saved.":"");
      setPlaidBankMessage(summary + " Review the batch report and September Calendar.");
      window.billBeaconMonthBatchReport={monthKey,rows,failure,uncertain,cancelled};
      stop.disabled=false;stop.textContent="Close report";stop.onclick=()=>{dialog.close();dialog.remove();};
      dialog.addEventListener("cancel",()=>{dialog.close();dialog.remove();},{once:true});
    }
    window.removeEventListener("billbeacon:signed-out",signOut);
    billMonthBatchBusy=false;allPostedPreviewBusy=false;
    if(button)button.disabled=false;
  }
}
window.runBillMonthMatchBatch=runBillMonthMatchBatch;

window.addEventListener("billbeacon:signed-out", () => {
  window.billBeaconMonthBatchReport = null;
  document.getElementById("billBeaconMonthBatchDialog")?.remove();
});

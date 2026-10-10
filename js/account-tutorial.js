import {doc, getDoc, updateDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const VERSION = 1;
const prefix = "billbeacon:onboarding:";
const pendingPrefix = "billbeacon:onboarding-pending:";
const seen = new Set();
let generation = 0, checking = false, checkingAgain = false;
let root = null, previousFocus = null, appWasInert = false, screen = 0, previewMode = false;
const steps = [
  {
    title: "Your main tabs",
    icon: "5",
    text: "Dashboard: your bill summary. Calendar: bills by date. Bills: add and manage bills.",
    detail: "Insights: payment and spending summaries. More: banking, installments, and Settings."
  },
  {
    title: "Add and track bills",
    icon: "+",
    text: "Open Bills and tap +. Enter the bill name, amount, and due date.",
    detail: "After paying, open the correct bill occurrence and mark it paid. Payment History keeps the record."
  },
  {
    title: "Track installments",
    icon: "4",
    text: "Open More → Installments to add a purchase split into several payments.",
    detail: "Example: a $100 purchase paid in four $25 installments. Track each due date and the balance remaining."
  },
  {
    title: "Sync your bank",
    icon: "↻",
    text: "Open More → Banking. Connect a bank, select an account, and tap Sync Transactions.",
    detail: "The household owner manages the connection. Sync shows bank activity; it does not send payments."
  },
  {
    title: "Share your household",
    icon: "2",
    text: "Open More → Settings and tap Invite Household Member. Send the invitation link.",
    detail: "Example: your partner joins with their own account, and you both manage the same bills. Share the invite—not your password."
  },
  {
    title: "Make it yours",
    icon: "⚙",
    text: "Use Settings for notifications, income sources, and appearance.",
    detail: "Payment History shows payments. Activity & Changes shows edits and reversals. You are ready to get started."
  }
];

function userContext() {
  const user = window.getBillBeaconFirebaseUser?.();
  const household = window.getBillBeaconHouseholdContext?.();
  if (!user?.uid || !household?.ready || household.uid !== user.uid) return null;
  return {uid:user.uid, householdId:household.householdId};
}
function read(key) {
  try {return JSON.parse(localStorage.getItem(key) || "null");}
  catch {return null;}
}
function write(key,value) {
  try {localStorage.setItem(key,JSON.stringify(value));return true;}
  catch {return false;}
}
function remove(key) {try {localStorage.removeItem(key);} catch {}}
function isFinished(value) {
  return value && value.version === VERSION && ["completed","skipped"].includes(value.status);
}
function escape(value) {
  return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function closeTutorial() {
  if (!root) return;
  root.remove();root=null;
  const app=document.getElementById("app");
  if (app) app.inert=appWasInert;
  if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
  previousFocus=null;
}
async function savePreference(uid, value) {
  const context=userContext();
  if (!context || context.uid !== uid) return;
  const db=window.getBillBeaconFirestore?.();
  if (!db) return;
  try {
    await updateDoc(doc(db,"users",uid),{onboarding:{version:value.version,status:value.status,updatedAt:value.updatedAt}});
    const stored=read(prefix+uid);
    if (stored?.updatedAt===value.updatedAt) write(prefix+uid,{...stored,cloudPending:false});
  } catch (error) {
    console.warn("Tutorial preference is retained locally; cloud save will retry.",error?.code||"save-failed");
  }
}
function finish(status) {
  const context=userContext();
  if (!context || !root || root.dataset.uid !== context.uid) {closeTutorial();return;}
  if (!previewMode) {
    const preference={version:VERSION,status,updatedAt:new Date().toISOString(),cloudPending:true};
    seen.add(context.uid);write(prefix+context.uid,preference);remove(pendingPrefix+context.uid);
    closeTutorial();void savePreference(context.uid,preference);
  } else closeTutorial();
}
function renderStep() {
  if (!root) return;
  const item=steps[screen];
  root.innerHTML=`
    <section style="width:min(100%,440px);max-height:calc(100dvh - 40px);overflow-y:auto;box-sizing:border-box;padding:24px;border:1px solid var(--border);border-radius:24px;background:var(--surface);color:var(--text);">
      <header style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;gap:12px;">
        <span style="font-size:14px;color:var(--text-muted);">${screen+1} of ${steps.length}</span>
        <button type="button" id="bbTutorialX" aria-label="Skip tutorial" style="min-width:44px;min-height:44px;font-size:28px;color:var(--accent);">&times;</button>
      </header>
      <div aria-hidden="true" style="display:flex;align-items:center;justify-content:center;width:64px;height:64px;margin-bottom:18px;border-radius:18px;background:var(--accent-soft,rgba(143,54,255,.12));color:var(--accent);font-size:26px;font-weight:800;">${escape(item.icon)}</div>
      <h2 id="bbTutorialTitle" tabindex="-1" style="margin:0 0 14px;font-size:24px;font-weight:800;">${escape(item.title)}</h2>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">${escape(item.text)}</p>
      <p style="margin:0 0 22px;color:var(--text-muted);font-size:14px;line-height:1.5;">${escape(item.detail)}</p>
      <button type="button" id="bbTutorialNext" class="btn-primary" style="width:100%;">${screen===steps.length-1?"Get Started":"Next"}</button>
      <div style="display:flex;gap:10px;margin-top:12px;">
        ${screen>0?'<button type="button" id="bbTutorialPrevious" class="bb-outline-pill" style="flex:1;min-height:44px;justify-content:center;">Previous</button>':""}
        <button type="button" id="bbTutorialSkip" class="bb-outline-pill" style="flex:1;min-height:44px;justify-content:center;">Skip Tutorial</button>
      </div>
    </section>`;
  root.querySelector("#bbTutorialNext").addEventListener("click",()=>{
    if (screen===steps.length-1) finish("completed");else {screen++;renderStep();}
  });
  root.querySelector("#bbTutorialPrevious")?.addEventListener("click",()=>{screen--;renderStep();});
  root.querySelector("#bbTutorialSkip").addEventListener("click",()=>finish("skipped"));
  root.querySelector("#bbTutorialX").addEventListener("click",()=>finish("skipped"));
  root.querySelector("#bbTutorialTitle").focus();
}
function showTutorial(uid, preview=false) {
  if (root || !userContext() || userContext().uid!==uid) return false;
  previewMode=preview;screen=0;previousFocus=document.activeElement;
  const app=document.getElementById("app");appWasInert=Boolean(app?.inert);
  if (app) app.inert=true;
  root=document.createElement("div");root.id="billBeaconTutorial";root.dataset.uid=uid;
  root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-labelledby","bbTutorialTitle");
  root.style.cssText="position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;padding:max(20px,env(safe-area-inset-top)) 20px max(20px,env(safe-area-inset-bottom));background:rgba(0,0,0,.75);box-sizing:border-box;overflow-y:auto;";
  root.addEventListener("keydown",event=>{
    if (event.key==="Escape") {event.preventDefault();finish("skipped");}
    if (event.key==="Tab") {
      const buttons=[...root.querySelectorAll("button")].filter(button=>!button.disabled);
      const first=buttons[0],last=buttons[buttons.length-1];
      if (!buttons.includes(document.activeElement)) {
        event.preventDefault();(event.shiftKey?last:first)?.focus();return;
      }
      if (event.shiftKey&&document.activeElement===first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey&&document.activeElement===last) {event.preventDefault();first.focus();}
    }
  });
  document.body.appendChild(root);renderStep();return true;
}
async function maybeStart() {
  if (checking) {checkingAgain=true;return;}
  const context=userContext();
  if (!context) return;
  const local=read(prefix+context.uid);
  if (isFinished(local)) {
    seen.add(context.uid);remove(pendingPrefix+context.uid);
    if (local.cloudPending) void savePreference(context.uid,local);
    return;
  }
  if (seen.has(context.uid) || !read(pendingPrefix+context.uid)) return;
  const db=window.getBillBeaconFirestore?.();
  if (!db) return;
  checking=true;const token=generation;
  try {
    const profile=await getDoc(doc(db,"users",context.uid));
    if (token!==generation || userContext()?.uid!==context.uid) return;
    const stored=profile.exists()?profile.data().onboarding:null;
    if (isFinished(stored)) {
      write(prefix+context.uid,{...stored,cloudPending:false});seen.add(context.uid);remove(pendingPrefix+context.uid);return;
    }
    showTutorial(context.uid);
  } catch (error) {
    if (token===generation && userContext()?.uid===context.uid) showTutorial(context.uid);
  } finally {
    checking=false;
    if (checkingAgain) {checkingAgain=false;queueMicrotask(maybeStart);}
  }
}
window.addEventListener("billbeacon:account-created",event=>{
  const uid=event.detail?.uid;
  if (typeof uid!=="string" || !uid || uid!==window.getBillBeaconFirebaseUser?.()?.uid) return;
  write(pendingPrefix+uid,true);queueMicrotask(maybeStart);
});
window.addEventListener("billbeacon:household-ready",()=>{void maybeStart();});
window.addEventListener("online",()=>{void maybeStart();});
window.addEventListener("billbeacon:signed-out",()=>{generation++;closeTutorial();});
window.addEventListener("billbeacon:authenticated",()=>{generation++;closeTutorial();});
window.BillBeaconTutorial={
  preview(){const context=userContext();return context?showTutorial(context.uid,true):false;}
};
queueMicrotask(maybeStart);

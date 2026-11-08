import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const VERSION = 1;
const prefix = "billbeacon:onboarding:";
const pendingPrefix = "billbeacon:onboarding-pending:";
const seen = new Set();
let generation = 0, checking = false, checkingAgain = false;
let root = null, previousFocus = null, appWasInert = false;
let screen = 0, previewMode = false;

const steps = [
  {
    title: "Your month, at a glance",
    text: "Start on the Dashboard to review your bills and payment progress. Choose the month and paycheck you want to see.",
    visual: "dashboard"
  },
  {
    title: "Know what’s coming",
    text: "Use Calendar to find bills by date. Open Bills to add and manage the payments you track, including recurring bills and installment plans.",
    visual: "calendar"
  },
  {
    title: "Plan around your paychecks",
    text: "Review the bills planned for each paycheck. Open a bill for its paycheck controls and split-payment options.",
    visual: "paychecks"
  },
  {
    title: "Keep the details together",
    text: "Open a bill for payment actions. Choose Show Details & Notes to review payment history and notes for one scheduled instance of that bill.",
    visual: "details"
  },
  {
    title: "Find your way around",
    text: "Visit Insights for spending and payment summaries. Open More for additional tools and Settings, including income, notifications, account details, and household sharing.",
    visual: "navigation"
  }
];

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function read(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function remove(key) { try { localStorage.removeItem(key); } catch {} }
function isFinished(value) { return Boolean(value && value.version === VERSION && ["completed", "skipped"].includes(value.status)); }
function userContext() {
  if (window.billBeaconSignupInProgress) return null;
  const user = window.getBillBeaconFirebaseUser?.();
  const household = window.getBillBeaconHouseholdContext?.();
  if (!user?.uid || !household?.ready || household.uid !== user.uid || !household.householdId) return null;
  return { uid: user.uid, householdId: household.householdId };
}

function installStyle() {
  if (document.getElementById("bb-visual-tutorial-style")) return;
  const style = document.createElement("style");
  style.id = "bb-visual-tutorial-style";
  style.textContent = `
  #billBeaconTutorial{position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));background:rgba(0,0,0,.76);color:var(--text,#f4f4fa);font-family:inherit;overflow:auto;}
  #billBeaconTutorial *{box-sizing:border-box;}
  #billBeaconTutorial .bbt-panel{width:min(100%,460px);max-height:calc(100dvh - 32px);overflow:auto;border:1px solid var(--border,#353442);border-radius:26px;background:var(--surface,#1e1d29);padding:22px;box-shadow:0 22px 80px #0005;}
  #billBeaconTutorial .bbt-top{display:flex;align-items:center;justify-content:space-between;gap:12px;}
  #billBeaconTutorial .bbt-kicker{font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--text-secondary,#b8b5c9);font-weight:700;}
  #billBeaconTutorial button{font:inherit;cursor:pointer;touch-action:manipulation;}
  #billBeaconTutorial .bbt-skip{border:0;background:none;color:var(--text-secondary,#b8b5c9);min-height:44px;padding:8px;font-size:14px;}
  #billBeaconTutorial .bbt-visual{margin:12px 0 20px;padding:16px;border-radius:20px;border:1px solid var(--border,#353442);background:var(--bg,var(--background,#15141e));}
  #billBeaconTutorial .bbt-example{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-secondary,#b8b5c9);margin-bottom:12px;}
  #billBeaconTutorial .bbt-mini-head{font-size:14px;font-weight:750;display:flex;justify-content:space-between;gap:8px;margin-bottom:12px;}
  #billBeaconTutorial .bbt-pill{border:1px solid var(--accent,#b45cff);border-radius:99px;padding:5px 10px;font-size:11px;color:var(--accent,#b45cff);display:inline-block;}
  #billBeaconTutorial .bbt-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  #billBeaconTutorial .bbt-card{border:1px solid var(--border,#353442);border-radius:12px;padding:12px;background:var(--surface,#1e1d29);}
  #billBeaconTutorial .bbt-muted{font-size:11px;color:var(--text-secondary,#b8b5c9);line-height:1.5;}
  #billBeaconTutorial .bbt-value{font-size:21px;font-weight:800;margin-top:5px;}
  #billBeaconTutorial .bbt-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;font-size:12px;}
  #billBeaconTutorial .bbt-row+.bbt-row{border-top:1px solid var(--border,#353442);}
  #billBeaconTutorial .bbt-bar{height:7px;background:var(--border,#353442);border-radius:99px;overflow:hidden;margin:10px 0 6px;}
  #billBeaconTutorial .bbt-bar span{display:block;width:60%;height:100%;background:var(--accent,#b45cff);border-radius:inherit;}
  #billBeaconTutorial .bbt-label{font-size:11px;color:var(--accent,#b45cff);margin:10px 0 0;line-height:1.5;}
  #billBeaconTutorial .bbt-days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;text-align:center;font-size:11px;}
  #billBeaconTutorial .bbt-day{padding:6px 0;border-radius:8px;}
  #billBeaconTutorial .bbt-day.active{background:var(--accent,#b45cff);color:#fff;font-weight:800;}
  #billBeaconTutorial .bbt-tabs{display:flex;gap:8px;margin-bottom:12px;}
  #billBeaconTutorial .bbt-tab{flex:1;text-align:center;border-radius:9px;padding:9px 4px;font-size:11px;border:1px solid var(--border,#353442);}
  #billBeaconTutorial .bbt-tab.active{border-color:var(--accent,#b45cff);color:var(--accent,#b45cff);}
  #billBeaconTutorial .bbt-section{font-size:12px;font-weight:750;margin:13px 0 4px;}
  #billBeaconTutorial .bbt-nav{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;text-align:center;margin-bottom:12px;}
  #billBeaconTutorial .bbt-nav span{padding:10px 0;font-size:10px;border-bottom:2px solid var(--border,#353442);}
  #billBeaconTutorial h2{font-size:25px;line-height:1.2;letter-spacing:-.025em;margin:0 0 10px;font-weight:800;}
  #billBeaconTutorial .bbt-copy{font-size:15px;line-height:1.6;margin:0;color:var(--text-secondary,var(--text,#b8b5c9));}
  #billBeaconTutorial .bbt-start{margin-top:14px;padding:12px;border-left:3px solid var(--accent,#b45cff);border-radius:5px;background:var(--bg,#15141e);font-size:13px;line-height:1.6;}
  #billBeaconTutorial .bbt-footer{margin-top:20px;display:flex;align-items:center;gap:10px;}
  #billBeaconTutorial .bbt-next {
  flex: 1;
  min-height: 46px;
  padding: 10px 16px;
  border: 0;
  border-radius: var(--radius-lg, 18px);
  background: var(--sunset, var(--accent, #b45cff));
  color: #fff;
  font-weight: 750;
  box-shadow: var(--shadow);
}
  #billBeaconTutorial .bbt-back{min-height:46px;padding:10px 16px;border:1px solid var(--border,#353442);border-radius:13px;background:transparent;color:var(--text,#f4f4fa);}
  #billBeaconTutorial .bbt-progress{display:flex;gap:5px;margin:14px 0 0;}
  #billBeaconTutorial .bbt-progress span{height:3px;flex:1;background:var(--border,#353442);border-radius:99px;}
  #billBeaconTutorial .bbt-progress span.active{background:var(--accent,#b45cff);}
  #billBeaconTutorial button:focus-visible{outline:2px solid var(--accent,#b45cff);outline-offset:4px;}
  #billBeaconTutorial .bbt-scene{animation:bbt-appear .18s ease-out;}
  @keyframes bbt-appear{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @media(prefers-reduced-motion:reduce){#billBeaconTutorial .bbt-scene{animation:none;}}
  @media(max-width:360px){#billBeaconTutorial .bbt-panel{padding:16px;}#billBeaconTutorial .bbt-visual{padding:12px;}#billBeaconTutorial h2{font-size:23px;}}
  `;
  document.head.appendChild(style);
}

function visualMarkup(kind) {
  const example = '<div class="bbt-example">Illustrative preview · sample data</div>';
  if (kind === "dashboard") return example + `
    <div class="bbt-mini-head"><span>Dashboard</span><span class="bbt-pill">This month</span></div>
    <div class="bbt-tabs"><span class="bbt-tab active">Paycheck 1</span><span class="bbt-tab">Paycheck 2</span></div>
    <div class="bbt-grid"><div class="bbt-card"><div class="bbt-muted">Example bills</div><div class="bbt-value">$500</div></div><div class="bbt-card"><div class="bbt-muted">Example paid</div><div class="bbt-value">$300</div></div></div>
    <div class="bbt-bar"><span></span></div><div class="bbt-muted">Payment progress</div>
    <div class="bbt-label">Month + paycheck → choose the plan you’re reviewing</div>`;
  if (kind === "calendar") return example + `
    <div class="bbt-mini-head"><span>Calendar</span><span class="bbt-muted">Bills by date</span></div>
    <div class="bbt-days">${["M","T","W","T","F","S","S"].map(day=>`<span class="bbt-muted">${day}</span>`).join("")}${Array.from({length:14},(_,i)=>`<span class="bbt-day ${i===8?'active':''}">${i+1}</span>`).join("")}</div>
    <div class="bbt-card" style="margin-top:12px;"><div class="bbt-row"><span>Internet</span><span>$65</span></div><div class="bbt-muted">Example bill for the selected date</div></div>
    <div class="bbt-label">Calendar → find a date · Bills → add and manage</div>`;
  if (kind === "paychecks") return example + `
    <div class="bbt-mini-head"><span>Your paycheck plan</span></div>
    <div class="bbt-card"><div class="bbt-row"><span>Internet</span><span>$65</span></div><div class="bbt-row"><span>Electricity</span><span>$110</span></div><div class="bbt-muted">Example bills planned for one paycheck</div></div>
    <div class="bbt-section">A payment can have planned portions</div>
    <div class="bbt-grid"><div class="bbt-card"><div class="bbt-muted">Portion 1</div><div class="bbt-value">$50</div></div><div class="bbt-card"><div class="bbt-muted">Portion 2</div><div class="bbt-value">$50</div></div></div>
    <div class="bbt-label">Open a bill → find its payment-planning controls</div>`;
  if (kind === "details") return example + `
    <div class="bbt-mini-head"><span>Internet</span><span>$65</span></div>
    <div class="bbt-card"><span class="bbt-pill">Show Details &amp; Notes</span><div class="bbt-section">Notes for this occurrence</div><div class="bbt-muted">Latest example update<br>Payment plan reviewed</div><div class="bbt-section">Payment History</div><div class="bbt-row"><span>Example payment</span><span>$65</span></div></div>
    <div class="bbt-label">One occurrence = one scheduled instance of a bill</div>`;
  return example + `
    <div class="bbt-nav"><span>Dashboard</span><span>Calendar</span><span>Bills</span><span>Insights</span><span>More</span></div>
    <div class="bbt-card"><div class="bbt-row"><span>Insights</span><span class="bbt-muted">Review summaries</span></div><div class="bbt-row"><span>More</span><span class="bbt-muted">Tools + Settings</span></div><div class="bbt-row"><span>Settings</span><span class="bbt-muted">Income + account</span></div></div>
    <div class="bbt-label">Explore at your own pace—you don’t need to set up everything now</div>`;
}

function closeTutorial(restoreFocus = true) {
  if (!root) return;
  root.remove(); root = null;
  const app = document.getElementById("app");
  if (app) app.inert = appWasInert;
  if (restoreFocus && previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
  previousFocus = null;
}
async function savePreference(uid, value) {
  const context = userContext();
  if (!context || context.uid !== uid) return;
  const db = window.getBillBeaconFirestore?.();
  if (!db) return;
  try {
    await updateDoc(doc(db, "users", uid), { onboarding: {version:value.version, status:value.status, updatedAt:value.updatedAt} });
    const stored = read(prefix + uid);
    if (stored?.updatedAt === value.updatedAt) write(prefix + uid, {...stored, cloudPending:false});
  } catch (error) {
    console.warn("Tutorial preference retained locally; cloud save will retry.", error?.code || "save-failed");
  }
}
function finish(status) {
  const context = userContext();
  if (!context || !root || root.dataset.uid !== context.uid || root.dataset.household !== context.householdId) { closeTutorial(false); return; }
  if (previewMode) { closeTutorial(); return; }
  const value = {version:VERSION, status, updatedAt:new Date().toISOString(), cloudPending:true};
  seen.add(context.uid);
  write(prefix + context.uid, value);
  remove(pendingPrefix + context.uid);
  closeTutorial();
  void savePreference(context.uid, value);
}
function renderStep() {
  if (!root) return;
  const item = steps[screen];
  root.innerHTML = `<section class="bbt-panel">
    <div class="bbt-top"><span class="bbt-kicker">Quick tour · ${screen + 1} of ${steps.length}</span><button type="button" class="bbt-skip" id="bbTutorialSkip">${previewMode ? 'Close tour' : 'Skip tour'}</button></div>
    <div class="bbt-scene"><div class="bbt-visual" role="img" aria-label="${escape(item.title)}: illustrative preview with sample data">${visualMarkup(item.visual)}</div>
    <h2 id="bbTutorialTitle" tabindex="-1">${escape(item.title)}</h2><p class="bbt-copy" id="bbTutorialDescription">${escape(item.text)}</p>
    ${screen === steps.length-1 ? '<div class="bbt-start">Start small: set up your income in Settings, add your bills, then review your plan on the Dashboard.</div>' : ''}</div>
    <div class="bbt-footer">${screen ? '<button type="button" class="bbt-back" id="bbTutorialPrevious">Back</button>' : ''}<button type="button" class="bbt-next" id="bbTutorialNext">${screen === steps.length-1 ? (previewMode ? 'Done' : 'Get Started') : 'Next'}</button></div>
    <div class="bbt-progress" aria-hidden="true">${steps.map((_,i)=>`<span class="${i<=screen?'active':''}"></span>`).join("")}</div>
  </section>`;
  root.querySelector("#bbTutorialSkip").addEventListener("click",()=>finish("skipped"));
  root.querySelector("#bbTutorialPrevious")?.addEventListener("click",()=>{screen--;renderStep();});
  root.querySelector("#bbTutorialNext").addEventListener("click",()=>{
    if (screen === steps.length-1) finish("completed"); else {screen++;renderStep();}
  });
  root.querySelector("#bbTutorialTitle").focus();
}
function showTutorial(uid, preview = false) {
  const context = userContext();
  if (root || !context || context.uid !== uid || document.querySelector("dialog[open]")) return false;
  installStyle();
  previewMode = preview; screen = 0; previousFocus = document.activeElement;
  const app = document.getElementById("app");
  appWasInert = Boolean(app?.inert);
  if (app) app.inert = true;
  root = document.createElement("div");
  root.id = "billBeaconTutorial";
  root.dataset.uid = uid; root.dataset.household = context.householdId;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "bbTutorialTitle");
  root.setAttribute("aria-describedby", "bbTutorialDescription");
  root.addEventListener("keydown",event=>{
    if (event.key === "Escape") {event.preventDefault();finish("skipped");return;}
    if (event.key !== "Tab") return;
    const controls = [...root.querySelectorAll("button")].filter(button=>!button.disabled);
    const first = controls[0], last = controls[controls.length-1];
    if (!controls.includes(document.activeElement)) {event.preventDefault();(event.shiftKey?last:first)?.focus();}
    else if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
  });
  document.body.appendChild(root);
  renderStep();
  return true;
}
async function maybeStart() {
  if (checking) {checkingAgain = true; return;}
  const context = userContext();
  if (!context) return;
  const local = read(prefix + context.uid);
  if (isFinished(local)) {
    seen.add(context.uid);remove(pendingPrefix + context.uid);
    if (local.cloudPending) void savePreference(context.uid, local);
    return;
  }
  if (seen.has(context.uid) || !read(pendingPrefix + context.uid)) return;
  const db = window.getBillBeaconFirestore?.();
  if (!db) return;
  checking = true;
  const token = generation;
  const stillCurrent = () => {
    const live = userContext();
    return token === generation && live?.uid === context.uid && live.householdId === context.householdId;
  };
  try {
    const profile = await getDoc(doc(db, "users", context.uid));
    if (!stillCurrent()) return;
    const stored = profile.exists() ? profile.data().onboarding : null;
    if (isFinished(stored)) {
      write(prefix + context.uid, {...stored, cloudPending:false});seen.add(context.uid);remove(pendingPrefix + context.uid);return;
    }
    showTutorial(context.uid);
  } catch {
    if (stillCurrent()) showTutorial(context.uid);
  } finally {
    checking = false;
    if (checkingAgain) {checkingAgain = false;queueMicrotask(maybeStart);}
  }
}
window.addEventListener("billbeacon:account-created",event=>{
  const uid = event.detail?.uid;
  if (typeof uid !== "string" || !uid || uid !== window.getBillBeaconFirebaseUser?.()?.uid) return;
  write(pendingPrefix + uid, true);queueMicrotask(maybeStart);
});
window.addEventListener("billbeacon:household-ready",()=>{
  const live = userContext();
  if (root && (!live || root.dataset.uid !== live.uid || root.dataset.household !== live.householdId)) closeTutorial(false);
  void maybeStart();
});
window.addEventListener("online",()=>{void maybeStart();});
window.addEventListener("billbeacon:signed-out",()=>{generation++;closeTutorial(false);});
window.addEventListener("billbeacon:authenticated",()=>{generation++;closeTutorial(false);});
window.BillBeaconTutorial = {
  preview() {const context = userContext();return context ? showTutorial(context.uid, true) : false;}
};
queueMicrotask(maybeStart);
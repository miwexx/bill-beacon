/* Load after settings-cleanup.js. Review policy drafts before public release. */
(function () {
  "use strict";
  if (window.BillBeaconAboutLegal) return;
  if (typeof window.openSettingsSection !== "function" ||
      typeof window.closeSettingsSectionSheet !== "function") {
    console.error("Load about-legal.js after settings-cleanup.js.");
    return;
  }
  const email = "rodz.m.1215@gmail.com";
  const revision = "October 12, 2026";
  const documents = {"terms": {"title": "Terms & Conditions", "sections": [["1. About these terms", "These Terms & Conditions govern your use of Bill Beacon, a personal bill-tracking and financial-organization app. Questions about these terms may be sent to rodz.m.1215@gmail.com. Use the app only if you can legally agree to these terms. Bill Beacon is intended for adults aged 18 or older."], ["2. What Bill Beacon does", "Bill Beacon helps you organize bills, due dates, income estimates, installment schedules, recorded payments, and reminders. Banking features, where available and enabled, can display connected account information and help match transactions to bills. Bill Beacon is not a bank, lender, payment processor, credit-reporting agency, or financial, legal, or tax adviser."], ["3. Your payments and financial decisions", "Marking a bill paid, postponing a due date, recording an installment payoff, or turning on an Autopay label in Bill Beacon does not send money, establish automatic payments, or change your agreement with a creditor. A Make a Payment link opens an external website; payment arrangements are between you and that provider. Verify payment amounts, due dates, bank transactions, and balances with your financial institution or creditor. Estimates and transaction matches may be incomplete or incorrect."], ["4. Accounts and security", "Provide accurate account information, protect your login credentials and devices, and use only accounts and financial information you are authorized to access. Contact support promptly if you suspect unauthorized access. You are responsible for activity you authorize and for keeping your information current."], ["5. Shared households", "Joining or inviting someone into a shared household allows authorized members to access shared household records and use the shared features available to their role. Shared records may include bills, income information, payment history, activity, and connected bank information. Invite only people you trust and have permission to share information with. Leaving a household or deleting your personal account does not necessarily delete records shared with other members."], ["6. Banking and other third-party services", "Optional bank connections use third-party services, including Plaid. Your institution and those providers may impose separate terms, permissions, and privacy notices. Connections and transaction updates can be delayed, interrupted, or unavailable. Disconnecting a bank connection does not cancel obligations to your bank or creditor. External payment sites and other linked services are operated by their respective providers."], ["7. Reminders and availability", "Reminders are a convenience, not a guarantee. Notifications can fail or arrive late because of device permissions, network conditions, browser restrictions, time-zone settings, or service interruptions. You remain responsible for paying on time. Features may change or be unavailable during maintenance. Keep independent copies of important financial records."], ["8. Acceptable use and ownership", "Do not use Bill Beacon for unlawful activity, unauthorized access, impersonation, interference with service operation, or uploading information you have no right to share. You retain rights to the information you provide. You permit Bill Beacon and its service providers to process that information as necessary to provide the features you use. Bill Beacon branding and software remain the property of their respective owners; third-party names and logos belong to their owners."], ["9. Ending use and deleting data", "You may stop using Bill Beacon at any time. Where available, use account and data controls in Settings, or contact support for help. Clearing app data, disconnecting a bank, leaving a household, and deleting an account are different actions. Some records may remain in shared households, service-provider systems, backups, or records retained for legal or security reasons. Access may be restricted for abuse, security threats, or legal requirements."], ["10. Disclaimers and liability", "To the extent permitted by applicable law, Bill Beacon is provided as is and as available, without warranties of uninterrupted service, error-free information, or fitness for a particular purpose. To that extent, the operator is not liable for indirect or consequential losses resulting from app errors, missed reminders, third-party outages, or reliance on estimates. Nothing in these terms excludes liability that cannot legally be excluded or limits mandatory consumer rights."], ["11. Changes and contact", "Updates to these terms will be identified by a revised date. Material changes will be communicated through the app or another appropriate channel, and additional agreement will be requested where required by law. For questions or concerns, email rodz.m.1215@gmail.com."]]}, "privacy": {"title": "Privacy Policy", "sections": [["1. Scope and contact", "This Privacy Policy explains how Bill Beacon handles personal information when you use the app. For privacy questions or requests, contact rodz.m.1215@gmail.com. It covers Bill Beacon, not the independent practices of your bank, external payment websites, or other third-party services."], ["2. Account and app information", "Information processed can include your name, email address, account identifier, household membership and role, and authentication-related information. App records can include bill names, amounts, due dates, categories, notes, payment links, installment schedules, income sources and estimates, payment history, activity history, reminder preferences, and settings. We also receive information you send in support messages."], ["3. Optional connected bank information", "If you enable banking features, Plaid and your financial institution process information needed to establish the connection. Bill Beacon can receive account identifiers, account names and types, masked account details, transaction dates, amounts, descriptions, merchant information, and connection or synchronization status, depending on the connection. Connection tokens and retrieved records may be stored in backend systems to support updates and matching. Enter bank credentials only into the authorized bank-linking flow, never into bill notes or support emails. Review the privacy notices shown during connection, including Plaid's policy at https://plaid.com/legal/#end-user-privacy-policy."], ["4. Device storage and notifications", "The app uses browser storage and service-worker caches for saved app records, preferences, login persistence where supported, and app operation. If you enable push notifications, we process a push subscription endpoint and associated keys, your account association, reminder settings, and notification delivery/history records. Reminder content may include bill names, amounts, or due dates and may appear on your lock screen, depending on device settings. Hosting and service providers may process technical information such as IP addresses, browser information, request timestamps, and error or security logs."], ["5. How information is used", "Information is used to provide and synchronize app features, organize bills and payment history, calculate estimates, display and match authorized bank transactions, manage household access, send requested reminders, answer support requests, troubleshoot problems, protect the service, and meet applicable legal obligations. Information is processed according to the features you choose and the permissions needed for those features."], ["6. Household sharing", "Authorized household members can access shared records through the features available to their role. This can include income information, notes, payment and activity history, and connected bank account or transaction information exposed by household banking features. Removing membership stops future authorized access but cannot recall copies, exports, or screenshots someone already obtained. Do not put information into a shared household unless you are authorized to share it."], ["7. Service providers and disclosures", "Bill Beacon uses Google Firebase for authentication and cloud data services, Cloudflare for hosting and backend operations, and Plaid for optional bank connectivity. Browser and device push providers help deliver notifications. Some bill logos are loaded from logo.dev; requesting a logo can disclose technical request information and the requested brand domain to that provider. Email providers process support correspondence. Information may also be disclosed when required by law or reasonably necessary to protect users, investigate abuse, or protect legal rights. External services handle information under their own applicable terms and privacy notices."], ["8. Storage, retention, and deletion", "App records can be stored both on your device and in cloud systems. Records are kept while needed to provide your account and household features, preserve the history you use, resolve support or security issues, or satisfy legal obligations. Retention depends on record type, account and household status, service-provider backup schedules, and legal or security needs. Deleting a bill may archive it and preserve payment or activity history. Clear App Data is not the same as account deletion or bank disconnection. Deleting an account may remove your profile and membership without erasing shared records or immediately removing every backend record, backup, or authentication record. Contact support to request deletion beyond the available controls; we will explain applicable exceptions and verification needs."], ["9. Choices and privacy requests", "You can edit supported app information, manage household membership where permitted, use available export and account controls, and disable notifications through browser or device settings. Device permission changes may stop delivery without immediately deleting server-side subscription records. For help with bank disconnection, access, correction, deletion, or other privacy requests, email rodz.m.1215@gmail.com. Rights such as access, portability, restriction, objection, or complaints to a privacy regulator may apply depending on your location. We may need to verify your identity and authority over the requested records."], ["10. Security and international processing", "The app uses authentication and access controls, but no storage or transmission method is completely secure. Protect your device and login, limit household access, and avoid placing passwords, full card numbers, or unnecessary sensitive information in notes. Cloud and support providers may process information outside your state or country. Where applicable law requires additional safeguards for such processing, those requirements must be met."], ["11. Children and policy updates", "Bill Beacon is intended for adults aged 18 or older and is not directed to children under 13. If you believe a child has provided personal information, contact support so the situation can be reviewed and appropriate action taken. Policy updates will show a revised date. Material changes will be communicated appropriately, and permissions or consent will be obtained where required."]]}, "contact": {"title": "Contact & Support", "sections": [["Contact & Support", "For app support, bug reports, feature suggestions, or privacy questions, email rodz.m.1215@gmail.com."], ["What to include", "Include a short description, the screen involved, your app version, device/browser, and steps to reproduce the problem. If you attach screenshots, remove financial details and personal information that are not necessary."], ["Keep sensitive information out of email", "Do not send passwords, bank login credentials, full card or bank account numbers, verification codes, or unredacted financial records. Bill Beacon support will not ask you to email your password or bank login credentials."], ["Payment problems", "For missing payments, disputed charges, fraud, or urgent account issues, contact your financial institution or creditor directly. Bill Beacon support cannot move funds or resolve bank disputes."]]}};
  const previousOpen = window.openSettingsSection;
  const previousClose = window.closeSettingsSectionSheet;
    let activeDocument = null;
  let aboutBackPreview = null;
  const esc = value => String(value).replace(/[&<>"']/g, ch =>
    ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[ch]));

  function addAboutLinks() {
    const body = document.getElementById("bbSettingsSectionBody");
    if (!body || body.querySelector("[data-bb-about-links]")) return;
    const links = document.createElement("section");
    links.className = "settings-section";
    links.setAttribute("data-bb-about-links", "");
    links.style.cssText = "display:grid;gap:12px;margin-top:12px";
    for (const [key, documentInfo] of Object.entries(documents)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bb-outline-pill";
      button.style.cssText = "width:100%;min-height:48px;justify-content:space-between;padding:0 16px";
      button.setAttribute("onclick", "window.bbShowAboutDocument('" + key + "')");
      button.innerHTML = "<span>" + esc(documentInfo.title) + "</span>" +
        (typeof svgIcon === "function" ? svgIcon("chevronRight", 18) : "<span aria-hidden='true'>&rsaquo;</span>");
      links.appendChild(button);
    }
    body.appendChild(links);
  }

  window.openSettingsSection = function (section) {
    activeDocument = null;
    const result = previousOpen.apply(this, arguments);
    if (section === "about") addAboutLinks();
    return result;
  };

  window.bbShowAboutDocument = function (key) {
    const doc = documents[key];
    if (!doc) return;
    if (!document.getElementById("bbSettingsSectionBody")) {
      window.openSettingsSection("about");
    }
    const body = document.getElementById("bbSettingsSectionBody");
    const title = document.getElementById("bbSettingsSectionTitle");
    const back = document.querySelector("#bbSettingsSectionSheet .sheet-nav .nav-button");
        if (!body || !title || !back) return;

    // Capture About before a legal/contact page replaces it.
    if (!activeDocument) {
      const sheet = document.getElementById(
        "bbSettingsSectionSheet"
      );

      aboutBackPreview = sheet
        ? sheet.cloneNode(true)
        : null;

      if (aboutBackPreview && sheet) {
        const originals = [
          sheet,
          ...sheet.querySelectorAll("*")
        ];

        const copies = [
          aboutBackPreview,
          ...aboutBackPreview.querySelectorAll("*")
        ];

        originals.forEach((original, index) => {
          const copy = copies[index];

          if (original.id) {
            copy.setAttribute(
              "data-bb-copy-id",
              original.id
            );
          }

          copy.removeAttribute("id");

          for (const attribute of [...copy.attributes]) {
            if (
              /^on/i.test(attribute.name) ||
              attribute.name === "autofocus"
            ) {
              copy.removeAttribute(attribute.name);
            }
          }

          copy.style.setProperty(
            "animation",
            "none",
            "important"
          );

          if (original.scrollTop) {
            copy.setAttribute(
              "data-bb-scroll-top",
              String(original.scrollTop)
            );
          }

          if (original.scrollLeft) {
            copy.setAttribute(
              "data-bb-scroll-left",
              String(original.scrollLeft)
            );
          }
        });

        aboutBackPreview
          .querySelectorAll("script,iframe,object,embed")
          .forEach(node => node.remove());

        aboutBackPreview.inert = true;
        aboutBackPreview.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    }

    activeDocument = key;
    title.textContent = doc.title;
    title.style.fontSize = "16px";
    back.setAttribute("aria-label", "Back to About");
    back.setAttribute("title", "Back to About");
    // Retain the existing close handler so the swipe gesture recognizes it.
    body.innerHTML = '<article class="card card-pad" style="line-height:1.65;overflow-wrap:anywhere">' +
      '<p style="margin:0 0 18px;color:var(--text-muted);font-size:12px">' +
      (key === "contact" ? "" : "Draft &middot; ") + "Last updated: " + revision + "</p>" +
      doc.sections.map(([heading, text]) =>
        '<section style="margin-bottom:20px"><h2 style="font-size:16px;margin:0 0 8px;font-weight:800">' +
        esc(heading) + '</h2><p style="margin:0;color:var(--text-muted);font-size:14px">' +
        esc(text) + "</p></section>").join("") +
      '<a class="bb-outline-pill" style="display:flex;width:100%;min-height:46px;justify-content:center;text-decoration:none;box-sizing:border-box" href="mailto:' +
      email + '?subject=Bill%20Beacon%20' + (key === "privacy" ? "Privacy%20Request" : "Support") + '">Email Support</a></article>';
    body.scrollTop = 0;
    back.focus({preventScroll:true});
  };
  window.bbGetPopupBackPreview = function (root) {
    if (
      !activeDocument ||
      !aboutBackPreview ||
      root?.id !== "bbSettingsSectionSheet"
    ) {
      return null;
    }

    return aboutBackPreview.cloneNode(true);
  };
  window.closeSettingsSectionSheet = function () {
    if (activeDocument && document.getElementById("bbSettingsSectionContainer")) {
      activeDocument = null;
      window.openSettingsSection("about");
      return;
    }
    activeDocument = null;
    return previousClose.apply(this, arguments);
  };
  window.BillBeaconAboutLegal = {version:1};
})();
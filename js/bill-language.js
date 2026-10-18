/*
 * Bill Beacon — English / Spanish language test
 *
 * Load once, AFTER your other app scripts.
 *
 * Writes only this localStorage key:
 * billbeacon:device-language:v1
 *
 * Does not modify bills, payments, currency, or household settings.
 */

(() => {
  "use strict";

  if (window.BillBeaconLanguage) return;

  const STORAGE_KEY = "billbeacon:device-language:v1";

  const OWN_TEXT = {
    language: ["Language", "Idioma"],
    select: ["Select Language", "Seleccionar idioma"],
    close: ["Close", "Cerrar"],
    hint: [
      "Your choice is saved on this device.",
      "Tu selección se guarda en este dispositivo."
    ],
    saveError: [
      "Could not save your language. Check browser storage and try again.",
      "No se pudo guardar el idioma. Revisa el almacenamiento del navegador e inténtalo de nuevo."
    ]
  };

  /*
   * Only exact, approved interface labels are translated.
   * Missing entries remain in English.
   */
  const SPANISH = {
    "Today": "Hoy",
    "Dashboard": "Inicio",
    "Bills": "Facturas",
    "Calendar": "Calendario",
    "More": "Más",
    "Insights": "Resumen",

    "Settings": "Configuración",
    "Account & Household": "Cuenta y hogar",
    "Notifications": "Notificaciones",
    "Income & Paychecks": "Ingresos y nóminas",
    "Appearance": "Apariencia",
    "Backup & Restore": "Copia de seguridad y restauración",
    "About": "Acerca de",
    "Advanced": "Avanzado",
    "Sign Out": "Cerrar sesión",

    "Dark": "Oscuro",
    "Light": "Claro",
    "Automatic": "Automático",
    "Automatic appearance": "Apariencia automática",
    "Follow device": "Usar la del dispositivo",
    "Custom schedule": "Horario personalizado",
    "Light starts": "Inicio del modo claro",
    "Dark starts": "Inicio del modo oscuro",
    "Uses this device’s local time.": "Usa la hora local de este dispositivo.",
    "Uses this device's local time.": "Usa la hora local de este dispositivo.",

    "Cancel": "Cancelar",
    "Close": "Cerrar",
    "Save": "Guardar",
    "Done": "Listo",
    "Back": "Atrás",
    "Edit": "Editar",
    "Delete": "Eliminar",
    "Continue": "Continuar",
    "Show More": "Mostrar más",
    "Show Less": "Mostrar menos",
    "Show more": "Mostrar más",
    "Show less": "Mostrar menos",
    "See All": "Ver todo",
    "Show Details": "Ver detalles",

    "Add Bill": "Agregar factura",
    "New Bill": "Nueva factura",
    "Edit Bill": "Editar factura",
    "Delete Bill": "Eliminar factura",
    "Save Bill": "Guardar factura",
    "Update Bill": "Actualizar factura",
    "Add Recurring Bill": "Agregar factura recurrente",
    "Sort bills": "Ordenar facturas",
    "Name A–Z": "Nombre A–Z",
    "Name A-Z": "Nombre A–Z",
    "Due Date": "Fecha de vencimiento",
    "Amount Low to High": "Importe: menor a mayor",
    "Amount High to Low": "Importe: mayor a menor",
    "Category": "Categoría",
    "No bills yet": "Aún no hay facturas",
    "Add a bill to start tracking payments.":
      "Agrega una factura para empezar a registrar los pagos.",

    "Bill Name": "Nombre de la factura",
    "Amount": "Importe",
    "Recurrence": "Frecuencia",
    "Repeat": "Repetir",
    "Payment Method": "Método de pago",
    "Payment Link": "Enlace de pago",
    "Notes": "Notas",
    "Autopay": "Pago automático",
    "Reminders": "Recordatorios",
    "Fund With": "Financiar con",
    "Due Day": "Día de vencimiento",

    "Paid": "Pagadas",
    "Due": "Por vencer",
    "Overdue": "Vencidas",
    "Unpaid": "Pendientes",
    "Mark as Paid": "Marcar como pagada",
    "Mark as Unpaid": "Marcar como pendiente",
    "Postpone": "Posponer",
    "Payment History": "Historial de pagos",
    "Recent Payments": "Pagos recientes",
    "All Payments": "Todos los pagos",
    "Remaining": "Pendiente",
    "Scheduled": "Programado",

    "Paycheck Plan": "Plan de nómina",
    "Money tools": "Herramientas financieras",
    "Banking": "Banca",
    "View Transactions": "Ver transacciones",
    "Credit Cards": "Tarjetas de crédito",
    "Soon": "Próximamente",
    "Activity Changes": "Registro de cambios",
    "Current Month": "Mes actual",
    "Installments": "Cuotas",

    "Upcoming": "Próximas",
    "Coming Up Later": "Más adelante",
    "This Month": "Este mes",
    "Nothing Upcoming": "Nada próximo",
    "You’re All Caught Up": "Estás al día",
    "Nothing Scheduled For This Day.":
      "No hay nada programado para este día.",
    "No Bills Due": "No hay facturas por vencer",
    "There are no bills scheduled for this date.":
      "No hay facturas programadas para esta fecha.",

    "Personal Details": "Datos personales",
    "Email Address": "Correo electrónico",
    "Password": "Contraseña",
    "Shared Household": "Hogar compartido",
    "Generate Invite Code": "Generar código de invitación",
    "Cancel Invite Code": "Cancelar código de invitación",
    "Join a Household": "Unirse a un hogar",
    "Leave Household": "Salir del hogar",
    "Delete Account": "Eliminar cuenta",

    "Turn On Notifications": "Activar notificaciones",
    "Notifications On": "Notificaciones activadas",
    "Notifications Blocked": "Notificaciones bloqueadas",
    "Notifications Unavailable": "Notificaciones no disponibles",
    "Re-register Notifications": "Volver a registrar notificaciones",
    "Verify / Re-register Notifications":
      "Verificar o registrar notificaciones",
    "Global Reminders": "Recordatorios generales",
    "Time": "Hora",
    "Time zone": "Zona horaria",
    "1 day before": "1 día antes",
    "3 days before": "3 días antes",
    "7 days before": "7 días antes",
    "14 days before": "14 días antes",

    "Add Income Source": "Agregar fuente de ingresos",
    "Edit Income Source": "Editar fuente de ingresos",
    "Bills & Installments": "Facturas y cuotas",
    "Full Backup & Restore": "Copia completa y restauración",
    "Export Bills & Installments CSV":
      "Exportar facturas y cuotas en CSV",
    "Import Bills & Installments CSV":
      "Importar facturas y cuotas en CSV",
    "Create Full Backup": "Crear copia completa",
    "Restore Full Backup": "Restaurar copia completa",
    "Clear App Data": "Borrar datos de la app",

    "Split Payment Schedule": "Calendario de pagos divididos",
    "Split Payment": "Dividir pago",
    "Add Payment": "Agregar pago",
    "Payment Plans": "Planes de pago",
    "Edit Payment Plan": "Editar plan de pago",
    "New Payment Plan": "Nuevo plan de pago",

    "Email": "Correo electrónico",
    "Sign In": "Iniciar sesión",
    "Create Account": "Crear cuenta",
    "Forgot password?": "¿Olvidaste tu contraseña?",

    "Open settings": "Abrir configuración",
    "Open notifications": "Abrir notificaciones",
    "Add a bill": "Agregar una factura",
    "Previous Month": "Mes anterior",
    "Next Month": "Mes siguiente",
    "More options": "Más opciones"
  };

  let language = "en";

  try {
    if (localStorage.getItem(STORAGE_KEY) === "es") {
      language = "es";
    }
  } catch {
    language = "en";
  }

  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();

  let observer = null;
  let scheduled = false;
  let returnFocus = null;

  function ownText(key) {
    const entry = OWN_TEXT[key];
    return entry ? entry[language === "es" ? 1 : 0] : key;
  }

  function normalize(value) {
    return String(value).replace(/\s+/g, " ").trim();
  }

  function translateLabel(value) {
    if (language === "en") return value;

    if (Object.prototype.hasOwnProperty.call(SPANISH, value)) {
      return SPANISH[value];
    }

    const sort = value.match(/^Sort:\s*(.+)$/);

    if (sort) {
      const label = SPANISH[sort[1]] || sort[1];
      return `Ordenar: ${label}`;
    }

    return value;
  }

  function translateSchedule(value) {
    if (language === "en") return value;

    const monthly = value.match(
      /^Due on the (\d{1,2})(?:st|nd|rd|th) of each month$/i
    );

    if (monthly) {
      return `Vence el día ${monthly[1]} de cada mes`;
    }

    const schedules = {
      "Repeats Weekly": "Se repite cada semana",
      "Repeats Every 2 Weeks": "Se repite cada 2 semanas",
      "Repeats Every 3 Months": "Se repite cada 3 meses",
      "Repeats Yearly": "Se repite cada año"
    };

    return schedules[value] || translateLabel(value);
  }

  /*
   * Never translate user-entered fields, bill names,
   * financial values, account names, or gesture previews.
   */
  const PROTECTED = [
    "script",
    "style",
    "svg",
    "textarea",
    "input",
    "select",
    "option",
    "code",
    "pre",
    "[contenteditable]",
    "[translate='no']",
    ".notranslate",
    "[data-bb-user-content]",
    "[data-bb-drag-preview]",
    "[data-bb-copy-id]",
    ".bill-name",
    ".bill-amount",
    ".bill-icon",
    ".upcoming-bill-name",
    ".recent-payment-amount",
    ".detail-header",
    ".detail-amount",
    ".notes",
    "#bbAccountDisplayName",
    "#bbHouseholdRole",
    "#bbHouseholdInviteCode",
    "#bbJoinMessage",
    "#householdInviteStatus",
    "#notificationTestStatus",
    "#notificationEnrollmentStatus",
    "#personalReminderSaveStatus",
    "#login-error"
  ].join(",");

  /*
   * Limit automatic translation to known interface slots.
   * This intentionally does NOT scan and replace all page text.
   */
  const UI_SLOTS = [
    "#app > .nav-bar .nav-title",
    "#bbSettingsSectionTitle",
    ".tab-bar .tab-item",
    ".tab-bar .tab-label",
    ".tab-bar .tab-item-label",
    ".tab-bar button",
    "#app .section-header",
    "#app .form-label",
    "#app .empty-state-title",
    "#app .empty-state-text",
    ".dashboard-status-label",
    ".dashboard-installments-combined-label",
    ".dashboard-installments-heading-title",
    ".dashboard-installments-heading-caption",
    ".calendar-summary-label",
    ".calendar-caught-up-title",
    ".bill-swipe-delete-label",
    ".bill-swipe-edit-label",
    "#billSheet .sheet-title",
    "#billSheet .form-label",
    "#billSortSheet .sheet-title",
    "#bbSettingsSectionBody .form-label",
    "#bbSettingsSectionBody .section-header",
    "#bbSettingsSectionBody .settings-footer",
    "#login-screen .login-label",
    "#login-screen button"
  ].join(",");

  const APPROVED_ACTION = /^(?:window\.)?(?:openSettingsSection|bbOpenAccountSettings|setTheme|updateDeviceAppearance|openBillForm|openBillSortSheet|setBillSort|openBillDetailsSheet|openPostpone\w*|markBillPaid|markBillUnpaid|confirmMarkPaid|confirmMarkPaidOccurrence|markBillOccurrenceUnpaid|saveBill|close\w*|toggleRecurringSection|togglePaycheckInlineRows|resetDashboardPaycheckMonth|navigateMainTab|navigate|activateBillNotifications|openIncomeSourceForm|exportCSV|exportBillTrackerBackup|chooseBillTrackerBackup|createHouseholdInviteCode|cancelHouseholdInviteCode|openJoinHouseholdCodeDialog|leaveSharedHousehold|deleteBillBeaconAccount|clearAllAppData)\s*\(/;

  const DATA_BUTTONS = [
    ".bill-row",
    ".bill-swipe-wrapper",
    ".dashboard-upcoming-tile",
    "[data-paycheck-provider]",
    "#paycheckInlineList button:not([data-paycheck-show-more])"
  ].join(",");

  function translateTextNode(node, translator) {
    const parent = node.parentElement;

    if (!parent || parent.closest(PROTECTED)) return;

    let saved = originalText.get(node);

    /*
     * If the app changes an existing text node,
     * treat its new content as the new English source.
     */
    if (
      !saved ||
      (node.data !== saved.last && node.data !== saved.source)
    ) {
      saved = {
        source: node.data,
        last: node.data
      };

      originalText.set(node, saved);
    }

    const parts = saved.source.match(
      /^(\s*)([\s\S]*?)(\s*)$/
    );

    const sourceLabel = normalize(parts[2]);
    const translated = translator(sourceLabel);

    const next =
      language === "en" || translated === sourceLabel
        ? saved.source
        : parts[1] + translated + parts[3];

    if (node.data !== next) {
      node.data = next;
    }

    saved.last = next;
  }

  function translateElement(
    element,
    translator = translateLabel,
    seen = new Set()
  ) {
    if (element.closest(PROTECTED)) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;

      if (seen.has(node)) continue;

      seen.add(node);
      translateTextNode(node, translator);
    }
  }

  function translateAttribute(element, attribute) {
    if (element.closest(PROTECTED)) return;

    const current = element.getAttribute(attribute);

    let saved = originalAttributes.get(element);

    if (!saved) {
      saved = {};
      originalAttributes.set(element, saved);
    }

    let entry = saved[attribute];

    if (
      !entry ||
      (current !== entry.last && current !== entry.source)
    ) {
      entry = {
        source: current,
        last: current
      };

      saved[attribute] = entry;
    }

    const next =
      language === "en"
        ? entry.source
        : translateLabel(entry.source);

    if (current !== next) {
      element.setAttribute(attribute, next);
    }

    entry.last = next;
  }

  function mountSettingsButton() {
    const app = document.getElementById("app");

    if (!app || app.querySelector("#bbLanguageSetting")) {
      return;
    }

    const appearanceButton = [
      ...app.querySelectorAll("button[onclick]")
    ].find(button => {
      const action = button.getAttribute("onclick") || "";

      return /openSettingsSection\(['"]appearance['"]\)/.test(
        action
      );
    });

    const heading = app.querySelector(
      ":scope > .nav-bar .nav-title"
    );

    const isSettingsPage = [
      "Settings",
      "Configuración"
    ].includes(heading?.textContent.trim());

    if (!appearanceButton && !isSettingsPage) return;

    const button = document.createElement("button");

    button.id = "bbLanguageSetting";
    button.type = "button";
    button.className =
      "bb-outline-pill bb-language-settings-row";

    button.innerHTML = `
      <span data-bb-language-text="language"></span>
      <span
        class="bb-language-value"
        data-bb-language-value
      ></span>
    `;

    button.addEventListener("click", openLanguagePicker);

    if (appearanceButton) {
      appearanceButton.after(button);
      return;
    }

    const content = app.querySelector(
      ".main-content .content-pad"
    );

    if (!content) return;

    const section = document.createElement("section");
    section.className = "settings-section";

    const card = document.createElement("div");
    card.className = "card card-pad";

    card.append(button);
    section.append(card);
    content.prepend(section);
  }

  function paintLanguageUI() {
    document
      .querySelectorAll("[data-bb-language-text]")
      .forEach(element => {
        const next = ownText(element.dataset.bbLanguageText);

        if (element.textContent !== next) {
          element.textContent = next;
        }
      });

    document
      .querySelectorAll("[data-bb-language-value]")
      .forEach(element => {
        const next =
          (language === "es" ? "Español" : "English") + "  ›";

        if (element.textContent !== next) {
          element.textContent = next;
        }
      });

    const dialog = document.getElementById(
      "bbLanguageDialog"
    );

    if (!dialog) return;

    dialog.querySelectorAll("[data-language]").forEach(button => {
      const selected = button.dataset.language === language;

      button.setAttribute("aria-checked", String(selected));
      button.tabIndex = selected ? 0 : -1;

      button.querySelector(".bb-language-check").textContent =
        selected ? "✓" : "";
    });
  }

  function refresh() {
    scheduled = false;

    if (!document.body) return;

    observer?.disconnect();

    try {
      document.documentElement.lang = language;

      mountSettingsButton();

      const seen = new Set();

      document.querySelectorAll(UI_SLOTS).forEach(element => {
        translateElement(element, translateLabel, seen);
      });

      document
        .querySelectorAll("button[onclick], #signout-button")
        .forEach(button => {
          if (
            button.closest(PROTECTED) ||
            button.closest(DATA_BUTTONS)
          ) {
            return;
          }

          const action = (
            button.getAttribute("onclick") || ""
          ).trim();

          if (
            button.id === "signout-button" ||
            APPROVED_ACTION.test(action)
          ) {
            translateElement(button, translateLabel, seen);
          }
        });

      document
        .querySelectorAll(
          ".bills-page-content .bill-meta-row .bill-meta"
        )
        .forEach(element => {
          translateElement(element, translateSchedule, seen);
        });

      document
        .querySelectorAll("[aria-label], [title]")
        .forEach(element => {
          ["aria-label", "title"].forEach(attribute => {
            if (element.hasAttribute(attribute)) {
              translateAttribute(element, attribute);
            }
          });
        });

      paintLanguageUI();
    } finally {
      observer?.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["aria-label", "title"]
      });
    }
  }

  function scheduleRefresh() {
    if (scheduled) return;

    scheduled = true;
    queueMicrotask(refresh);
  }

  function setLanguage(code) {
    if (!["en", "es"].includes(code)) {
      throw new RangeError("Supported languages: en, es");
    }

    /*
     * Do not change the interface if saving failed.
     */
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      const error = document.getElementById(
        "bbLanguageError"
      );

      if (error) {
        error.hidden = false;
        error.textContent = ownText("saveError");
      }

      return false;
    }

    language = code;
    refresh();

    window.dispatchEvent(
      new CustomEvent("bb-language-changed", {
        detail: { language }
      })
    );

    return true;
  }

  function openLanguagePicker() {
    const existing = document.getElementById(
      "bbLanguageDialog"
    );

    if (existing) {
      existing.focus();
      return;
    }

    returnFocus = document.activeElement;

    const dialog = document.createElement("dialog");

    dialog.id = "bbLanguageDialog";
    dialog.setAttribute(
      "aria-labelledby",
      "bbLanguageTitle"
    );

    dialog.innerHTML = `
      <div
        class="bb-language-handle"
        aria-hidden="true"
      ></div>

      <header class="bb-language-header">
        <h2
          id="bbLanguageTitle"
          data-bb-language-text="select"
        ></h2>

        <button
          type="button"
          class="bb-language-close"
          data-bb-language-text="close"
        ></button>
      </header>

      <div
        class="bb-language-options"
        role="radiogroup"
        aria-labelledby="bbLanguageTitle"
      >
        <button
          type="button"
          role="radio"
          data-language="en"
          lang="en"
          translate="no"
        >
          <span>English</span>
          <span
            class="bb-language-check"
            aria-hidden="true"
          ></span>
        </button>

        <button
          type="button"
          role="radio"
          data-language="es"
          lang="es"
          translate="no"
        >
          <span>Español</span>
          <span
            class="bb-language-check"
            aria-hidden="true"
          ></span>
        </button>
      </div>

      <p
        class="bb-language-hint"
        data-bb-language-text="hint"
      ></p>

      <p
        id="bbLanguageError"
        role="alert"
        hidden
      ></p>
    `;

    dialog.querySelector(".bb-language-close").onclick =
      () => dialog.close();

    dialog.querySelectorAll("[data-language]").forEach(button => {
      button.onclick = () => {
        if (setLanguage(button.dataset.language)) {
          dialog.close();
        }
      };
    });

    dialog.addEventListener("keydown", event => {
      const buttons = [
        ...dialog.querySelectorAll("[data-language]")
      ];

      const index = buttons.indexOf(document.activeElement);

      const keys = [
        "ArrowDown",
        "ArrowUp",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End"
      ];

      if (index < 0 || !keys.includes(event.key)) return;

      event.preventDefault();

      let next;

      if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = buttons.length - 1;
      } else {
        const forward = [
          "ArrowDown",
          "ArrowRight"
        ].includes(event.key);

        next = (
          index +
          (forward ? 1 : -1) +
          buttons.length
        ) % buttons.length;
      }

      if (setLanguage(buttons[next].dataset.language)) {
        buttons[next].focus();
      }
    });

    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();

      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;

      if (outside) dialog.close();
    });

    dialog.addEventListener(
      "close",
      () => {
        dialog.remove();

        const target = returnFocus?.isConnected
          ? returnFocus
          : document.getElementById("bbLanguageSetting");

        target?.focus({ preventScroll: true });

        returnFocus = null;
      },
      { once: true }
    );

    document.body.append(dialog);

    refresh();
    dialog.showModal();

    dialog
      .querySelector(`[data-language="${language}"]`)
      .focus({ preventScroll: true });
  }

  const CSS = `
    #bbLanguageSetting.bb-language-settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      width: 100%;
      min-width: 0;
      min-height: 48px;
      margin-top: 10px;
      padding: 12px 18px;
      box-sizing: border-box;

      font-family: inherit;
      line-height: 1.4;
      text-align: left;
    }

    .bb-language-value {
      color: var(--text-secondary, #b4b4c8);
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
    }

    #bbLanguageDialog {
      position: fixed;
      inset: auto 12px 12px;
      margin: 0 auto;

      width: calc(100% - 24px);
      max-width: 520px;
      max-height: 85vh;
      max-height: 85dvh;

      padding:
        12px 20px
        calc(24px + env(safe-area-inset-bottom, 0px));

      box-sizing: border-box;
      overflow-y: auto;
      overscroll-behavior: contain;

      border: 1px solid var(--border, #453650);
      border-radius: 24px;

      background: var(--surface, #242432);
      color: var(--text, #f8f8fc);
      font-family: inherit;

      box-shadow: 0 18px 60px rgba(0, 0, 0, .3);
    }

    #bbLanguageDialog::backdrop {
      background: rgba(0, 0, 0, .58);
    }

    #bbLanguageDialog .bb-language-handle {
      width: 38px;
      height: 4px;
      margin: 0 auto 18px;

      border-radius: 4px;
      background: var(--text-muted, #77778d);
      opacity: .6;
    }

    #bbLanguageDialog .bb-language-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      margin-bottom: 20px;
    }

    #bbLanguageDialog h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      line-height: 1.35;
    }

    #bbLanguageDialog .bb-language-close {
      min-height: 44px;
      padding: 8px;

      border: 0;
      background: none;
      color: var(--text-secondary, #b4b4c8);
      font: inherit;
      cursor: pointer;
    }

    #bbLanguageDialog .bb-language-options {
      overflow: hidden;
      border: 1px solid var(--border, #453650);
      border-radius: 16px;
    }

    #bbLanguageDialog [data-language] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      width: 100%;
      min-height: 60px;
      padding: 16px;

      border: 0;
      background: transparent;
      color: inherit;

      font: inherit;
      font-weight: 650;
      text-align: left;
      cursor: pointer;
    }

    #bbLanguageDialog [data-language] + [data-language] {
      border-top: 1px solid var(--border, #453650);
    }

    #bbLanguageDialog [data-language][aria-checked="true"] {
      background: var(
        --accent-soft,
        rgba(143, 54, 255, .12)
      );
    }

    #bbLanguageDialog .bb-language-check {
      color: var(--accent, #bb83ff);
      font-size: 22px;
      font-weight: 800;
    }

    #bbLanguageDialog .bb-language-hint {
      margin: 16px 0 0;
      color: var(--text-secondary, #b4b4c8);
      font-size: 13px;
      line-height: 1.5;
    }

    #bbLanguageError {
      color: var(--overdue, #ff889c);
      font-size: 13px;
      line-height: 1.5;
    }

    #bbLanguageDialog button:focus-visible,
    #bbLanguageSetting:focus-visible {
      outline: 2px solid var(--accent, #bb83ff);
      outline-offset: 3px;
    }
  `;

  function initialize() {
    if (!document.getElementById("bb-language-style")) {
      const style = document.createElement("style");

      style.id = "bb-language-style";
      style.textContent = CSS;

      document.head.append(style);
    }

    observer = new MutationObserver(scheduleRefresh);

    refresh();
  }

  window.BillBeaconLanguage = Object.freeze({
    version: "1.0.0-test",
    storageKey: STORAGE_KEY,
    getLanguage: () => language,
    setLanguage,
    open: openLanguagePicker,
    refresh
  });

  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY && event.key !== null) {
      return;
    }

    try {
      language =
        localStorage.getItem(STORAGE_KEY) === "es"
          ? "es"
          : "en";
    } catch {
      language = "en";
    }

    refresh();
  });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();
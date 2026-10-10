(() => {
  "use strict";
  const styleId = "bb-login-polish-style";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    #login-screen .login-logo {
      width: 72px !important;
      height: 72px !important;
      margin-bottom: 18px !important;
      border-radius: 18px !important;
    }
    #login-screen .login-logo img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    #login-screen #login-error:empty,
    #login-screen #login-error.bb-login-empty-message {
      display: none !important;
    }
    #login-screen #forgot-password-button {
      margin-bottom: 0 !important;
    }
    #login-screen #email-signin-button {
      margin-top: 2px !important;
    }
    #login-screen .bb-login-password-row {
      position: relative;
      width: 100%;
      min-width: 0;
    }
    #login-screen .bb-login-password-row input {
      width: 100%;
      box-sizing: border-box;
      padding-right: 54px !important;
    }
    #login-screen .bb-login-password-toggle {
      position: absolute;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: var(--text-secondary, #b4b4c8);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    #login-screen .bb-login-password-toggle svg {
      display: block;
      width: 22px;
      height: 22px;
      pointer-events: none;
    }
    #login-screen .bb-login-password-toggle:hover {
      color: var(--accent, #b45cff);
    }
    #login-screen .bb-login-password-toggle:focus-visible {
      outline: 2px solid var(--accent, #b45cff);
      outline-offset: 1px;
    }
  `;
  document.head.appendChild(style);

  const eye = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeOff = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.1 4M6.5 6.5A18 18 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5.5-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;
  const enhanced = new WeakMap();
  let nextId = 0;

  function setVisibility(input, button, label, visible) {
    input.type = visible ? "text" : "password";
    button.setAttribute("aria-label", `${visible ? "Hide" : "Show"} ${label}`);
    button.setAttribute("aria-pressed", String(visible));
    button.innerHTML = visible ? eyeOff : eye;
  }

  function enhancePassword(input) {
    if (enhanced.has(input)) return;
    const wrapper = document.createElement("div");
    wrapper.className = "bb-login-password-row";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    if (!input.id) input.id = `bb-login-password-${++nextId}`;
    input.dataset.bbLoginPassword = "true";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "bb-login-password-toggle";
    button.setAttribute("aria-controls", input.id);
    const label = input.labels?.[0]?.textContent.trim().toLowerCase() || "password";
    setVisibility(input, button, label, false);
    wrapper.appendChild(button);
    enhanced.set(input, { button, label });

    button.addEventListener("mousedown", event => event.preventDefault());
    button.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    });
    button.addEventListener("click", () => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      setVisibility(input, button, label, input.type === "password");
      input.focus({ preventScroll: true });
      if (start !== null && end !== null) {
        try { input.setSelectionRange(start, end); } catch {}
      }
    });
  }

  function start() {
    const login = document.getElementById("login-screen");
    if (!login) return;

    function concealPasswords() {
      login.querySelectorAll("input[data-bb-login-password]").forEach(input => {
        const state = enhanced.get(input);
        if (state && input.type === "text") {
          setVisibility(input, state.button, state.label, false);
        }
      });
    }

    function refresh() {
      login.querySelectorAll('input[type="password"]').forEach(enhancePassword);
      const message = login.querySelector("#login-error");
      if (message) {
        const empty = !message.textContent.trim();
        if (message.classList.contains("bb-login-empty-message") !== empty) {
          message.classList.toggle("bb-login-empty-message", empty);
        }
      }
      if (login.hidden || login.classList.contains("hidden") ||
          login.style.display === "none" || login.getAttribute("aria-hidden") === "true") {
        concealPasswords();
      }
    }

    refresh();
    new MutationObserver(refresh).observe(login, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "hidden", "style", "aria-hidden"]
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) concealPasswords();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
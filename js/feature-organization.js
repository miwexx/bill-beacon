/* Feature organization v2: one native Settings entry only.
   Replaces the old shortcut-strip/Help implementation completely. */
(() => {
  'use strict';
  if (window.BillBeaconFeatureOrganization?.version === 2) return;
  if (typeof renderSettings !== 'function' || !window.BillBeaconMoreLive) {
    console.error('Settings connection entry: load Settings and More tools first.');
    return;
  }
  const previous = renderSettings;
  renderSettings = function () {
    const html = previous.apply(this, arguments);
    const root = document.createElement('div');
    root.innerHTML = html;
    if (root.querySelector('[data-bb-connections-entry]')) return html;
    const card = root.querySelector('.main-content .settings-section .card');
    if (!card) return html;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bb-outline-pill';
    button.dataset.bbConnectionsEntry = 'true';
    button.textContent = 'Connections & Sync';
    button.style.cssText = 'width:100%;min-height:46px;justify-content:center;margin-top:10px;';
    button.setAttribute('onclick', "window.BillBeaconMoreLive.open('connections')");
    const backup = [...card.querySelectorAll('button')].find(node =>
      /openSettingsSection\(['"]records['"]\)/.test(node.getAttribute('onclick') || ''));
    if (backup) backup.before(button); else card.appendChild(button);
    return root.innerHTML;
  };
  window.BillBeaconFeatureOrganization = Object.freeze({version:2});
})();
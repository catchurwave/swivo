/*
  Swivo Autofill — content script.

  Features:
    - Resilient field matching: name / id / data-test(id) / explicit CSS / aria-label
      / placeholder / <label for> / parent fieldset legend (fuzzy normalized).
    - Multiple value variants per key (e.g. dates as ISO + FR; civilité M./Monsieur/1)
      — try each until one is accepted by the field.
    - Type-aware setters: text, email, tel, date, select, radio, checkbox, combobox
      (React/Angular Material Autocomplete pattern).
    - Native setter + dispatch input/change/blur so React state updates.
    - SPA-aware: MutationObserver re-runs autofill on URL change or DOM mutation
      (debounced) when auto-fill mode is enabled.
    - Record mode: Alt+click on any field → maps it to the autofill key you pick
      from a small overlay, stored in chrome.storage.local under host overrides.
    - In-page panel (Alt+S) showing matched/unmatched fields, with quick re-run.

  All matching strategies are configurable via selectors.json + user overrides.
*/

(function () {
  if (window.__swivoAutofillLoaded) return;
  window.__swivoAutofillLoaded = true;

  let baseSelectors = {};
  let userOverrides = {};
  let settings = { autoFill: false, recordMode: false, verbose: true };
  let lastRunAt = 0;

  /* ============================================================ */
  /* BOOT                                                          */
  /* ============================================================ */
  Promise.all([
    fetch(chrome.runtime.getURL('selectors.json')).then((r) => r.json()).catch(() => ({})),
    chrome.storage.local.get(['userOverrides', 'settings', 'dossier']),
  ]).then(([dict, store]) => {
    baseSelectors = dict || {};
    delete baseSelectors._pages;
    delete baseSelectors.$schema;
    userOverrides = (store.userOverrides || {})[location.host] || {};
    settings = { ...settings, ...(store.settings || {}) };

    if (settings.autoFill && store.dossier?.autofill) {
      setTimeout(() => window.__swivoAutofill(store.dossier.autofill), 800);
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.userOverrides) {
      userOverrides = (changes.userOverrides.newValue || {})[location.host] || {};
    }
    if (changes.settings) {
      settings = { ...settings, ...(changes.settings.newValue || {}) };
    }
  });

  /* ============================================================ */
  /* UTILS                                                         */
  /* ============================================================ */
  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  function transform(value, transformName) {
    if (!transformName || value == null) return value;
    const s = String(value);
    switch (transformName) {
      case 'upper':      return s.toUpperCase();
      case 'lower':      return s.toLowerCase();
      case 'capitalize': return s.replace(/(^|[\s-])(.)/g, (_, p, c) => p + c.toUpperCase());
      case 'date_fr':    return toDateFr(s);
      case 'date_iso':   return toDateIso(s);
      case 'digits':     return s.replace(/[^\d]/g, '');
      default:           return s;
    }
  }
  function toDateFr(s) {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  }
  function toDateIso(s) {
    const m = s.match(/^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return s;
  }

  function nativeSetter(el) {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype
      : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    return Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  }

  function trigger(el, evts = ['input', 'change', 'blur']) {
    evts.forEach((t) => {
      const evt = t === 'input' || t === 'change' ? new Event(t, { bubbles: true })
        : new FocusEvent(t, { bubbles: true });
      el.dispatchEvent(evt);
    });
  }

  /* ============================================================ */
  /* CONFIG ACCESS (base + user override merge)                   */
  /* ============================================================ */
  function configFor(key) {
    const base = baseSelectors[key] || {};
    const over = userOverrides[key] || {};
    return {
      type:       over.type       || base.type       || 'text',
      transform:  over.transform  || base.transform  || null,
      names:      [...(over.names || []),     ...(base.names || []),     key],
      labels:     [...(over.labels || []),    ...(base.labels || [])],
      selectors:  [...(over.selectors || []), ...(base.selectors || [])],
    };
  }

  function valueAndVariants(payload) {
    if (payload == null) return { value: null, variants: [] };
    if (typeof payload === 'object' && 'value' in payload) {
      return { value: payload.value, variants: Array.isArray(payload.variants) ? payload.variants : [] };
    }
    return { value: payload, variants: [] };
  }

  /* ============================================================ */
  /* FIND CANDIDATES                                              */
  /* ============================================================ */
  function findField(key) {
    const cfg = configFor(key);
    const root = document;
    const isUsable = (el) => el && !el.disabled && !el.readOnly && el.type !== 'hidden';

    for (const v of cfg.names) {
      const el = root.querySelector(`[name="${CSS.escape(v)}"]`)
        || root.querySelector(`#${CSS.escape(v)}`)
        || root.querySelector(`[data-test-id="${CSS.escape(v)}"]`)
        || root.querySelector(`[data-testid="${CSS.escape(v)}"]`)
        || root.querySelector(`[formcontrolname="${CSS.escape(v)}"]`);
      if (isUsable(el)) return { el, cfg };
    }
    for (const s of cfg.selectors) {
      try {
        const el = root.querySelector(s);
        if (isUsable(el)) return { el, cfg };
      } catch {}
    }
    // Fuzzy label/aria/placeholder
    const hints = new Set([normalize(key), ...cfg.labels.map(normalize)]);
    const inputs = root.querySelectorAll('input, select, textarea');
    for (const el of inputs) {
      if (!isUsable(el)) continue;
      const aria = normalize(el.getAttribute('aria-label'));
      const ph = normalize(el.placeholder);
      const labelEl = el.id ? root.querySelector(`label[for="${CSS.escape(el.id)}"]`) : el.closest('label');
      const lab = normalize(labelEl?.textContent);
      const legend = normalize(el.closest('fieldset')?.querySelector('legend')?.textContent);
      for (const hint of hints) {
        if (!hint) continue;
        if (aria.includes(hint) || ph.includes(hint) || lab.includes(hint) || legend.includes(hint)) {
          return { el, cfg };
        }
      }
    }
    return null;
  }

  /* ============================================================ */
  /* SETTERS                                                       */
  /* ============================================================ */
  function setText(el, value) {
    const setter = nativeSetter(el);
    if (setter) setter.call(el, value); else el.value = value;
    trigger(el);
    return el.value == String(value);
  }
  function setDate(el, value) {
    const candidates = el.type === 'date' ? [toDateIso(String(value))] : [String(value), toDateFr(String(value)), toDateIso(String(value))];
    for (const v of candidates) {
      setText(el, v);
      if (el.value) return true;
    }
    return false;
  }
  function setSelect(el, value, variants) {
    const allValues = [String(value), ...variants.map(String)];
    for (const v of allValues) {
      const target = Array.from(el.options).find((o) =>
        o.value === v
        || normalize(o.textContent) === normalize(v)
        || normalize(o.textContent).includes(normalize(v))
      );
      if (target) {
        el.value = target.value;
        trigger(el, ['input', 'change', 'blur']);
        return true;
      }
    }
    return false;
  }
  function setRadioOrCheckbox(el, value, variants) {
    // el may be one option of a group: query siblings by name.
    const name = el.name;
    const group = name ? document.querySelectorAll(`[name="${CSS.escape(name)}"]`) : [el];
    const allValues = [String(value), ...variants.map(String)];
    const truthy = ['1','true','oui','o','yes','on'].includes(String(value).toLowerCase());
    for (const opt of group) {
      const ownVal = opt.value;
      const labelEl = opt.id ? document.querySelector(`label[for="${CSS.escape(opt.id)}"]`) : opt.closest('label');
      const labText = normalize(labelEl?.textContent);
      const aria = normalize(opt.getAttribute('aria-label'));
      const match = allValues.some((v) => {
        const nv = normalize(v);
        return ownVal === v || normalize(ownVal) === nv || labText === nv || labText.includes(nv) || aria === nv;
      });
      if (match || (opt.type === 'checkbox' && group.length === 1 && truthy)) {
        if (!opt.checked) opt.click();
        trigger(opt, ['input', 'change']);
        return true;
      }
    }
    return false;
  }
  function setCombobox(el, value, variants) {
    // Material / React autocomplete: type, wait, click matching listbox option.
    setText(el, value);
    return new Promise((resolve) => {
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        const listbox = document.querySelector('[role="listbox"], .pmpro-dropdown, .mat-mdc-autocomplete-panel, .MuiAutocomplete-popper');
        const options = listbox?.querySelectorAll('[role="option"], li, .mat-mdc-option');
        if (options?.length) {
          const allValues = [String(value), ...variants.map(String)];
          let target = null;
          for (const opt of options) {
            const t = normalize(opt.textContent);
            if (allValues.some((v) => t === normalize(v) || t.includes(normalize(v)))) { target = opt; break; }
          }
          if (!target) target = options[0]; // best-effort first item
          target.click();
          clearInterval(interval);
          resolve(true);
          return;
        }
        if (tries > 12) { clearInterval(interval); resolve(false); }
      }, 120);
    });
  }

  async function applyValue(key, payload) {
    const found = findField(key);
    if (!found) return { key, hit: false };
    const { el, cfg } = found;
    const { value, variants } = valueAndVariants(payload);
    if (value == null || value === '') return { key, hit: false };
    const transformed = transform(value, cfg.transform);
    const variantsT = variants.map((v) => transform(v, cfg.transform));

    try {
      el.focus();
      const tag = el.tagName;
      const type = (el.type || '').toLowerCase();
      const effType = cfg.type === 'auto'
        ? (tag === 'SELECT' ? 'select' : type === 'date' ? 'date' : tag === 'TEXTAREA' ? 'textarea' : 'text')
        : cfg.type;

      let ok = false;
      switch (effType) {
        case 'select':           ok = setSelect(el, transformed, variantsT); break;
        case 'radio':
        case 'checkbox':
        case 'radio_or_select':  ok = (tag === 'SELECT') ? setSelect(el, transformed, variantsT) : setRadioOrCheckbox(el, transformed, variantsT); break;
        case 'date':             ok = setDate(el, transformed); break;
        case 'combobox':         ok = await setCombobox(el, transformed, variantsT); break;
        case 'textarea':
        case 'text':
        case 'email':
        case 'tel':
        default:                 ok = setText(el, transformed); break;
      }
      flashEl(el, ok);
      return { key, hit: true, ok, el };
    } catch (e) {
      console.warn('[Swivo] setter error', key, e);
      return { key, hit: true, ok: false, error: e?.message };
    }
  }

  function flashEl(el, ok) {
    const prev = el.style.boxShadow;
    el.style.transition = 'box-shadow .25s';
    el.style.boxShadow = ok
      ? '0 0 0 3px rgba(5,150,105,.45)'
      : '0 0 0 3px rgba(220,38,38,.45)';
    setTimeout(() => { el.style.boxShadow = prev; }, 1400);
  }

  /* ============================================================ */
  /* PUBLIC ENTRY                                                  */
  /* ============================================================ */
  window.__swivoAutofill = async function (autofill) {
    if (!autofill || typeof autofill !== 'object') return { error: 'Aucune donnée autofill fournie.' };
    lastRunAt = Date.now();
    const results = [];
    for (const [key, payload] of Object.entries(autofill)) {
      // eslint-disable-next-line no-await-in-loop
      const r = await applyValue(key, payload);
      results.push(r);
    }
    const filled = results.filter((r) => r.ok).length;
    const scanned = results.length;
    const missed = results.filter((r) => !r.hit).map((r) => r.key);
    flashBanner(`Swivo : ${filled}/${scanned} champ(s) remplis`);
    if (settings.verbose && missed.length) console.info('[Swivo] champs non trouvés :', missed);
    return { filled, scanned, missed };
  };

  function flashBanner(text) {
    const id = 'swivo-flash-banner';
    document.getElementById(id)?.remove();
    const div = document.createElement('div');
    div.id = id;
    div.textContent = text;
    div.style.cssText = `
      position: fixed; top: 16px; right: 16px; z-index: 2147483647;
      background: linear-gradient(120deg,#2563eb,#ec4899);
      color: white; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600;
      padding: 10px 14px; border-radius: 999px; box-shadow: 0 8px 24px rgba(15,23,42,.2);
    `;
    document.body.appendChild(div);
    setTimeout(() => { div.style.opacity = '0'; div.style.transition = 'opacity .4s'; }, 2000);
    setTimeout(() => div.remove(), 2500);
  }

  /* ============================================================ */
  /* SPA OBSERVER                                                  */
  /* ============================================================ */
  let lastUrl = location.href;
  let mutationDebounce = null;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      maybeAutoFill('url change', 600);
    } else if (settings.autoFill) {
      clearTimeout(mutationDebounce);
      mutationDebounce = setTimeout(() => maybeAutoFill('dom mutation', 0), 500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  async function maybeAutoFill(reason, delay = 0) {
    if (!settings.autoFill) return;
    if (Date.now() - lastRunAt < 1500) return; // throttle
    const { dossier } = await chrome.storage.local.get('dossier');
    if (!dossier?.autofill) return;
    if (delay) await new Promise((r) => setTimeout(r, delay));
    window.__swivoAutofill(dossier.autofill);
  }

  /* ============================================================ */
  /* RECORD MODE — Alt+click associates field with autofill key   */
  /* ============================================================ */
  document.addEventListener('click', async (e) => {
    if (!settings.recordMode) return;
    if (!e.altKey) return;
    const el = e.target;
    if (!el || !el.matches?.('input, select, textarea, [contenteditable="true"]')) return;
    e.preventDefault(); e.stopPropagation();

    const keys = Object.keys(baseSelectors).sort();
    const choice = prompt(
      `Swivo Autofill — Associer ce champ à une clé.\n\n`
      + `Identité champ: name="${el.name || ''}" id="${el.id || ''}"\n\n`
      + `Tapez la clé Swivo (ex: prenom, dateNaissance...) ou laissez vide pour annuler.\n\n`
      + `Clés disponibles : ${keys.join(', ')}`
    );
    if (!choice) return;
    const key = choice.trim();
    const sel = el.id ? `#${CSS.escape(el.id)}` : el.name ? `[name="${CSS.escape(el.name)}"]` : null;
    if (!sel) { alert('Champ sans id/name — impossible d\'enregistrer un sélecteur stable.'); return; }
    const store = (await chrome.storage.local.get('userOverrides')).userOverrides || {};
    const host = location.host;
    store[host] = store[host] || {};
    store[host][key] = store[host][key] || { selectors: [], names: [], labels: [] };
    if (!store[host][key].selectors.includes(sel)) store[host][key].selectors.push(sel);
    await chrome.storage.local.set({ userOverrides: store });
    flashBanner(`✓ ${key} → ${sel}`);
  }, true);

  /* ============================================================ */
  /* FAB + KEYBOARD                                                */
  /* ============================================================ */
  function injectFAB() {
    if (document.getElementById('swivo-fab')) return;
    if (!/inpi\.fr|formalites\.entreprises\.gouv\.fr/.test(location.host)) return;
    const fab = document.createElement('button');
    fab.id = 'swivo-fab';
    fab.title = 'Swivo Autofill (Alt+S pour le panneau)';
    fab.textContent = 'S';
    fab.addEventListener('click', async () => {
      const { dossier } = await chrome.storage.local.get('dossier');
      if (!dossier) { flashBanner('Swivo : aucun dossier chargé'); return; }
      window.__swivoAutofill(dossier.autofill || {});
    });
    document.body.appendChild(fab);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectFAB);
  else injectFAB();

  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      openPanel();
    }
  });

  /* ============================================================ */
  /* IN-PAGE PANEL                                                 */
  /* ============================================================ */
  async function openPanel() {
    document.getElementById('swivo-panel')?.remove();
    const { dossier } = await chrome.storage.local.get('dossier');
    const af = dossier?.autofill || {};
    const keys = Object.keys(af);
    const found = keys.map((k) => ({ k, hit: !!findField(k) }));
    const matched = found.filter((x) => x.hit);
    const missed  = found.filter((x) => !x.hit);

    const panel = document.createElement('div');
    panel.id = 'swivo-panel';
    panel.style.cssText = `
      position: fixed; bottom: 84px; right: 24px; width: 360px; max-height: 70vh; overflow: auto;
      z-index: 2147483647; background: white; color: #0f172a;
      font-family: -apple-system, sans-serif; font-size: 13px;
      border-radius: 14px; border: 1px solid #e2e8f0;
      box-shadow: 0 12px 40px rgba(15,23,42,.18);
    `;
    panel.innerHTML = `
      <div style="padding:12px 14px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
        <strong style="color:#1d4ed8">Swivo Autofill</strong>
        <button id="swivo-close" style="background:none;border:none;font-size:18px;cursor:pointer;color:#475569">×</button>
      </div>
      <div style="padding:12px 14px">
        <div style="display:flex;gap:6px;margin-bottom:10px">
          <button id="swivo-run" style="flex:1;padding:8px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">Remplir</button>
          <button id="swivo-toggle-auto" style="flex:1;padding:8px;background:${settings.autoFill?'#059669':'#f1f5f9'};color:${settings.autoFill?'white':'#0f172a'};border:none;border-radius:8px;cursor:pointer;font-size:12px">Auto: ${settings.autoFill?'ON':'OFF'}</button>
          <button id="swivo-toggle-rec" style="flex:1;padding:8px;background:${settings.recordMode?'#dc2626':'#f1f5f9'};color:${settings.recordMode?'white':'#0f172a'};border:none;border-radius:8px;cursor:pointer;font-size:12px">Record: ${settings.recordMode?'ON':'OFF'}</button>
        </div>
        <p style="margin:4px 0;font-size:12px;color:#475569"><strong>${matched.length}</strong> match(s) · <strong>${missed.length}</strong> manquant(s)</p>
        <details open style="margin-top:6px"><summary style="cursor:pointer;color:#059669">Trouvés (${matched.length})</summary>
          <ul style="margin:6px 0 0;padding-left:20px">${matched.map(x=>`<li>${x.k}</li>`).join('')}</ul>
        </details>
        <details style="margin-top:6px"><summary style="cursor:pointer;color:#b45309">Non trouvés (${missed.length})</summary>
          <ul style="margin:6px 0 0;padding-left:20px">${missed.map(x=>`<li>${x.k}</li>`).join('')}</ul>
          <p style="font-size:11px;color:#475569;margin-top:6px">Activez <strong>Record</strong> puis <kbd>Alt+clic</kbd> sur un champ pour le mapper.</p>
        </details>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById('swivo-close').onclick = () => panel.remove();
    document.getElementById('swivo-run').onclick = async () => {
      window.__swivoAutofill(af);
    };
    document.getElementById('swivo-toggle-auto').onclick = async () => {
      settings.autoFill = !settings.autoFill;
      await chrome.storage.local.set({ settings });
      panel.remove(); openPanel();
    };
    document.getElementById('swivo-toggle-rec').onclick = async () => {
      settings.recordMode = !settings.recordMode;
      await chrome.storage.local.set({ settings });
      panel.remove(); openPanel();
    };
  }
})();

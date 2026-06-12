/*
  Popup logic — load/persist a Swivo dossier export, trigger autofill on the
  active tab. Dossier stays in chrome.storage.local; cleared on demand.
*/

const $ = (sel) => document.querySelector(sel);

async function loadDossier() {
  const { dossier } = await chrome.storage.local.get('dossier');
  return dossier || null;
}

async function saveDossier(d) {
  await chrome.storage.local.set({ dossier: d });
}

async function clearDossier() {
  await chrome.storage.local.remove('dossier');
}

function setStatus(message, kind = 'ok') {
  const el = $('#status');
  el.innerHTML = message ? `<div class="status ${kind}">${message}</div>` : '';
}

function render(dossier) {
  const info = $('#dossier-info');
  const fillBtn = $('#fill-btn');
  if (!dossier) {
    info.innerHTML = `<div class="status warn">Aucun dossier chargé. Collez le JSON exporté depuis l'admin Swivo.</div>`;
    fillBtn.disabled = true;
    return;
  }
  const m = dossier.meta || {};
  const af = dossier.autofill || {};
  const fields = Object.keys(af).length;
  info.innerHTML = `
    <div class="dossier">
      <div class="row"><span>ID Swivo</span><strong>#${m.swivoId ?? '—'}</strong></div>
      <div class="row"><span>Forme</span><strong>${(m.forme ?? '—').toUpperCase()}</strong></div>
      <div class="row"><span>Email</span><strong>${m.email ?? '—'}</strong></div>
      <div class="row"><span>Champs autofill</span><strong>${fields}</strong></div>
      <div class="row"><span>Statut</span><span class="badge">${m.status ?? '—'}</span></div>
    </div>
  `;
  fillBtn.disabled = false;
}

async function init() {
  const dossier = await loadDossier();
  render(dossier);

  $('#paste-btn').addEventListener('click', async () => {
    const ta = $('#json-input');
    ta.hidden = false;
    try {
      const text = await navigator.clipboard.readText();
      if (text) ta.value = text;
    } catch (e) {
      // user will paste manually
    }
    ta.focus();
    ta.addEventListener('blur', async () => {
      const text = ta.value.trim();
      if (!text) return;
      try {
        const parsed = JSON.parse(text);
        if (!parsed.autofill || typeof parsed.autofill !== 'object') {
          setStatus('JSON invalide : champ "autofill" manquant.', 'err');
          return;
        }
        await saveDossier(parsed);
        render(parsed);
        setStatus(`Dossier #${parsed.meta?.swivoId ?? '?'} chargé (${Object.keys(parsed.autofill).length} champs).`, 'ok');
        ta.hidden = true;
      } catch (e) {
        setStatus('JSON illisible : ' + e.message, 'err');
      }
    }, { once: true });
  });

  $('#clear-btn').addEventListener('click', async () => {
    await clearDossier();
    render(null);
    setStatus('Dossier effacé.', 'ok');
  });

  $('#open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  $('#fill-btn').addEventListener('click', async () => {
    const dossier = await loadDossier();
    if (!dossier) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { setStatus('Aucun onglet actif.', 'err'); return; }
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (autofillData) => {
          if (typeof window.__swivoAutofill === 'function') {
            return window.__swivoAutofill(autofillData);
          }
          return { error: 'content script non chargé sur cette page' };
        },
        args: [dossier.autofill],
      });
      const r = res?.result || {};
      if (r.error) {
        setStatus('⚠ ' + r.error, 'err');
      } else {
        setStatus(`✅ ${r.filled ?? 0} champ(s) remplis sur ${r.scanned ?? 0} détectés.`, 'ok');
      }
    } catch (e) {
      setStatus('Erreur injection : ' + e.message, 'err');
    }
  });
}

init();

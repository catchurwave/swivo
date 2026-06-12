/*
  Options page — manage settings, dossier in storage, per-host selector
  overrides, and import/export of the entire extension state.
*/

const $ = (sel) => document.querySelector(sel);
let baseDict = {};
let currentHost = 'procedures.inpi.fr';

async function init() {
  baseDict = await fetch(chrome.runtime.getURL('selectors.json')).then((r) => r.json());
  delete baseDict.$schema;
  delete baseDict._pages;
  $('#base-dict').value = JSON.stringify(baseDict, null, 2);

  // Populate key autocomplete
  const dl = $('#key-list');
  Object.keys(baseDict).sort().forEach((k) => {
    const o = document.createElement('option'); o.value = k; dl.appendChild(o);
  });

  // Load settings
  const { settings, dossier, userOverrides } = await chrome.storage.local.get(['settings', 'dossier', 'userOverrides']);
  const s = settings || {};
  $('#autoFill').checked   = !!s.autoFill;
  $('#recordMode').checked = !!s.recordMode;
  $('#verbose').checked    = s.verbose !== false;

  // Dossier
  if (dossier) {
    $('#dossier-json').value = JSON.stringify(dossier, null, 2);
    renderDossierMeta(dossier);
  }

  // Host overrides
  const host = new URLSearchParams(location.search).get('host') || currentHost;
  $('#host').value = host;
  currentHost = host;
  $('#host-pill').textContent = host;
  const overrides = (userOverrides || {})[host] || {};
  renderOverrides(overrides);

  // Wire events
  ['autoFill','recordMode','verbose'].forEach((id) => {
    $('#' + id).addEventListener('change', saveSettings);
  });
  $('#save-dossier').onclick = saveDossier;
  $('#clear-dossier').onclick = clearDossier;
  $('#add-row').onclick = addOverrideRow;
  $('#reset-host').onclick = resetHost;
  $('#host').addEventListener('change', async (e) => {
    currentHost = e.target.value.trim();
    $('#host-pill').textContent = currentHost;
    const { userOverrides } = await chrome.storage.local.get('userOverrides');
    renderOverrides((userOverrides || {})[currentHost] || {});
  });
  $('#export-all').onclick = exportAll;
  $('#import-btn').onclick = () => $('#import-file').click();
  $('#import-file').onchange = importFile;
}

function renderDossierMeta(d) {
  const m = d.meta || {};
  $('#dossier-meta').innerHTML = `Dossier <strong>#${m.swivoId ?? '?'}</strong> · forme <strong>${(m.forme||'').toUpperCase()}</strong> · ${Object.keys(d.autofill||{}).length} clés`;
}

async function saveSettings() {
  const settings = {
    autoFill: $('#autoFill').checked,
    recordMode: $('#recordMode').checked,
    verbose: $('#verbose').checked,
  };
  await chrome.storage.local.set({ settings });
}

async function saveDossier() {
  const text = $('#dossier-json').value.trim();
  if (!text) { alert('Coller le JSON exporté depuis l\'admin Swivo.'); return; }
  try {
    const parsed = JSON.parse(text);
    if (!parsed.autofill) { alert('JSON invalide : champ "autofill" manquant.'); return; }
    await chrome.storage.local.set({ dossier: parsed });
    renderDossierMeta(parsed);
    alert('Dossier enregistré.');
  } catch (e) {
    alert('JSON illisible : ' + e.message);
  }
}

async function clearDossier() {
  if (!confirm('Vider le dossier en mémoire ?')) return;
  await chrome.storage.local.remove('dossier');
  $('#dossier-json').value = '';
  $('#dossier-meta').textContent = 'Aucun dossier chargé.';
}

function renderOverrides(map) {
  const tbody = $('#overrides-table tbody');
  tbody.innerHTML = '';
  for (const [key, def] of Object.entries(map)) {
    addOverrideRow(null, key, def);
  }
}

function addOverrideRow(_e, presetKey, presetDef) {
  const tbody = $('#overrides-table tbody');
  const tr = document.createElement('tr');
  const key = presetKey || $('#new-key').value.trim();
  if (!key && !presetKey) { alert('Saisissez une clé d\'abord.'); return; }
  const def = presetDef || { names: [], selectors: [], labels: [], type: '' };
  tr.dataset.key = key;
  tr.innerHTML = `
    <td><strong>${key}</strong></td>
    <td><input type="text" class="ov-names" value="${(def.names||[]).join(', ')}" /></td>
    <td><textarea class="ov-selectors" style="min-height:48px">${(def.selectors||[]).join('\n')}</textarea></td>
    <td><input type="text" class="ov-labels" value="${(def.labels||[]).join(', ')}" /></td>
    <td><select class="ov-type">
      ${['','text','date','select','radio_or_select','combobox','textarea','email','tel'].map((t)=>`<option value="${t}" ${def.type===t?'selected':''}>${t||'(défaut)'}</option>`).join('')}
    </select></td>
    <td><button class="danger ov-del">×</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelector('.ov-del').onclick = async () => {
    tr.remove();
    await saveOverridesFromTable();
  };
  ['ov-names','ov-selectors','ov-labels','ov-type'].forEach((cls) => {
    tr.querySelector('.' + cls).addEventListener('change', saveOverridesFromTable);
  });
  if (!presetKey) $('#new-key').value = '';
}

async function saveOverridesFromTable() {
  const { userOverrides = {} } = await chrome.storage.local.get('userOverrides');
  const host = currentHost;
  const next = {};
  document.querySelectorAll('#overrides-table tbody tr').forEach((tr) => {
    const key = tr.dataset.key;
    const names = tr.querySelector('.ov-names').value.split(',').map((s) => s.trim()).filter(Boolean);
    const selectors = tr.querySelector('.ov-selectors').value.split('\n').map((s) => s.trim()).filter(Boolean);
    const labels = tr.querySelector('.ov-labels').value.split(',').map((s) => s.trim()).filter(Boolean);
    const type = tr.querySelector('.ov-type').value;
    next[key] = { names, selectors, labels, type: type || undefined };
  });
  userOverrides[host] = next;
  await chrome.storage.local.set({ userOverrides });
}

async function resetHost() {
  if (!confirm('Réinitialiser les overrides pour ' + currentHost + ' ?')) return;
  const { userOverrides = {} } = await chrome.storage.local.get('userOverrides');
  delete userOverrides[currentHost];
  await chrome.storage.local.set({ userOverrides });
  renderOverrides({});
}

async function exportAll() {
  const data = await chrome.storage.local.get(['settings', 'dossier', 'userOverrides']);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'swivo-autofill-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    await chrome.storage.local.set(data);
    alert('Import OK — rechargez la page d\'options.');
    location.reload();
  } catch (err) {
    alert('Import KO : ' + err.message);
  }
}

init();

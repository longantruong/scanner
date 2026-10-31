'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const defaults = {mode:'enter', timeout:150, sound:true, highlight:true, persist:true};
  const notice = (message, type = 'info') => {
    $('notice').textContent = message;
    $('notice').classList.toggle('notice-error', type === 'error');
    $('notice').hidden = false;
  };
  const storage = new ScannerStorage(message => { $('storage-error').textContent = message; $('storage-error').hidden = false; });
  const saved = storage.read('settings', {});
  const settings = {...defaults};
  if (saved && typeof saved === 'object') {
    if (['enter','tab','timeout'].includes(saved.mode)) settings.mode = saved.mode;
    if (Number.isInteger(saved.timeout) && saved.timeout >= 50 && saved.timeout <= 1000) settings.timeout = saved.timeout;
    ['sound','highlight','persist'].forEach(key => { if (typeof saved[key] === 'boolean') settings[key] = saved[key]; });
  }
  let records = [], limit = 100, latest = null, audio = null;
  if (settings.persist) {
    const raw = storage.read('history', []);
    if (Array.isArray(raw)) {
      records = raw.filter(r => r && typeof r.id === 'string' && typeof r.value === 'string' && r.value.length && typeof r.timestamp === 'string' && Number.isFinite(Date.parse(r.timestamp)));
      if (records.length !== raw.length) notice('Some saved records are invalid and could not be loaded. Original storage is unchanged until your next history edit.');
    } else notice('Saved history is invalid. Starting an empty session.');
  }
  function reindex() {
    const seen = new Set();
    for (let i = records.length - 1; i >= 0; i--) { records[i].isDuplicate = seen.has(records[i].value); seen.add(records[i].value); }
    return seen.size;
  }
  function saveHistory() { if (settings.persist) storage.write('history', records); }
  function sound() {
    if (!settings.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio unavailable');
      audio = audio || new Audio();
      const play = () => {
        if (audio.state !== 'running') { notice('Scan saved. Sound is blocked by the browser; click Focus Scanner to enable audio.'); return; }
        const osc = audio.createOscillator(), gain = audio.createGain();
        osc.frequency.value = 880; gain.gain.setValueAtTime(.07, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .1);
        osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .11);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      };
      audio.resume().then(play).catch(() => notice('Scan saved, but sound could not play.'));
    } catch (_) { notice('Scan saved. Audio is unavailable in this browser.'); }
  }
  function timestamp() {
    const d = new Date(), offset = -d.getTimezoneOffset(), pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,'0')}${offset>=0?'+':'-'}${pad(Math.floor(Math.abs(offset)/60))}:${pad(Math.abs(offset)%60)}`;
  }
  function add(value) {
    if (!value.length) { notice('Empty input ignored.'); return; }
    latest = {id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2), value, timestamp:timestamp(), isDuplicate:false};
    records.unshift(latest); limit = 100;
    $('notice').hidden = true;
    render(); saveHistory(); sound();
  }
  async function copy(value) {
    const previous = document.activeElement;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(value); }
      else throw new Error('Use local fallback');
      notice('Value copied.');
    } catch (_) {
      const field = document.createElement('textarea'); field.value = value; field.setAttribute('aria-label','Copy value'); document.body.append(field); field.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { /* Visible fallback below. */ }
      if (ok) { field.remove(); if (previous && previous.focus) previous.focus(); notice('Value copied.'); }
      else { notice('Automatic copy is unavailable. The text at the bottom of the page is selected; press Ctrl+C, then leave the field.'); field.addEventListener('blur', () => field.remove(), {once:true}); }
    }
  }
  function render() {
    const unique = reindex();
    $('total').textContent = records.length; $('unique').textContent = unique; $('duplicates').textContent = records.length - unique;
    latest = records[0] || null;
    $('latest-value').textContent = latest ? latest.value : 'Ready for your first scan';
    $('latest-time').textContent = latest ? new Date(latest.timestamp).toLocaleString() : 'Your scanned value will appear here.';
    $('success').hidden = !latest; $('copy-latest').disabled = !latest;
    const query = $('search').value.toLocaleLowerCase();
    const filtered = records.map((record,index) => ({record,number:records.length-index})).filter(x => x.record.value.toLocaleLowerCase().includes(query));
    const fragment = document.createDocumentFragment();
    filtered.slice(0,limit).forEach(({record,number}) => {
      const row = document.createElement('tr');
      if (record.isDuplicate && settings.highlight) row.className = 'duplicate';
      const d = new Date(record.timestamp);
      [number, record.value, d.toLocaleDateString(), d.toLocaleTimeString(), record.isDuplicate ? 'Duplicate' : 'Unique'].forEach((value,index) => {
        const cell = document.createElement('td'); cell.textContent = value;
        if (index === 1) cell.className = 'value'; if (index === 4) cell.className = 'status'; row.append(cell);
      });
      const actions = document.createElement('td');
      const copyButton = document.createElement('button'); copyButton.textContent = 'Copy'; copyButton.setAttribute('aria-label','Copy record '+number); copyButton.onclick = () => copy(record.value);
      const del = document.createElement('button'); del.textContent = 'Delete'; del.setAttribute('aria-label','Delete record '+number); del.onclick = () => { records = records.filter(r => r !== record); render(); saveHistory(); $('search').focus(); };
      actions.append(copyButton,del); row.append(actions); fragment.append(row);
    });
    $('history').replaceChildren(fragment); $('empty').hidden = filtered.length > 0;
    $('empty').textContent = records.length ? 'No matching scans.' : 'No scans yet. Your next scan starts the story.';
    $('results').textContent = `${filtered.length} records`; $('more').hidden = filtered.length <= limit;
    $('export').disabled = !records.length; $('clear').disabled = !records.length;
  }
  function handleScan(value) {
    add(value);
    sendBarcode(value).catch(error => {
      notice(`Scan ${value} saved locally, but API submission failed (${error.message}). Check the server before scanning again.`, 'error');
    });
  }
  const scanner = new ScannerManager($('capture'), {onScan:handleScan, onNotice:notice});
  function syncSettings() {
    $('mode').value = settings.mode; $('timeout').value = settings.timeout; $('timeout').disabled = settings.mode !== 'timeout';
    ['sound','highlight','persist'].forEach(key => { $(key).checked = settings[key]; });
    $('capture-help').textContent = settings.mode === 'timeout' ? `Complete after ${settings.timeout} ms of inactivity` : `Waiting for ${settings.mode === 'enter' ? 'Enter' : 'Tab'} suffix`;
    scanner.configure(settings);
  }
  $('mode').onchange = () => { settings.mode = $('mode').value; syncSettings(); storage.write('settings', settings); };
  $('timeout').onchange = () => {
    const value = Number($('timeout').value);
    if (!Number.isInteger(value) || value < 50 || value > 1000) { notice('Timeout must be a whole number between 50 and 1000 ms.'); $('timeout').value = settings.timeout; return; }
    settings.timeout = value; syncSettings(); storage.write('settings',settings);
  };
  ['sound','highlight','persist'].forEach(key => { $(key).onchange = () => {
    settings[key] = $(key).checked;
    storage.write('settings',settings);
    if (key === 'persist') { if (settings.persist) saveHistory(); else storage.remove('history'); }
    render();
  }; });
  $('defaults').onclick = () => { Object.assign(settings, defaults); syncSettings(); storage.write('settings', settings); saveHistory(); render(); notice('Default settings restored. History retained.'); };
  $('focus').onclick = () => { $('capture').focus(); if (audio) audio.resume().catch(() => {}); };
  $('complete').onclick = () => { scanner.complete(); $('capture').focus(); };
  $('copy-latest').onclick = () => { if (latest) copy(latest.value); };
  $('add-manual').onclick = () => { if ($('manual').value.length) { add($('manual').value); $('manual').value = ''; } else notice('Enter a value first.'); };
  $('search').oninput = () => { limit = 100; render(); };
  $('more').onclick = () => { limit += 100; render(); };
  $('clear').onclick = () => { if (confirm('Delete all scan history? Export first if you need a backup.')) { records = []; render(); saveHistory(); } };
  $('export').onclick = () => { try { ScannerCSV.download(records); notice('CSV download requested. It includes all records, including those hidden by search.'); } catch (error) { notice('CSV export failed. History is still available. ' + error.message); } };
  function focusStatus() {
    const ready = document.hasFocus() && document.activeElement === $('capture');
    $('ready').textContent = ready ? 'Ready to Scan' : 'Input not focused'; $('ready').classList.toggle('ready',ready);
  }
  ['focus','blur'].forEach(event => { window.addEventListener(event,focusStatus); $('capture').addEventListener(event,focusStatus); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) scanner.pause(); focusStatus(); });
  window.addEventListener('beforeunload', e => { if ($('capture').value.length || $('manual').value.length) { e.preventDefault(); e.returnValue = ''; } });
  syncSettings(); render();
  const tick = () => { $('clock').textContent = new Date().toLocaleString(); }; tick(); setInterval(tick,1000);
  $('capture').focus(); focusStatus();
})();

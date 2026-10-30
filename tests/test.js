'use strict';
(async () => {
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const test = async (name, fn) => { try { await fn(); results.push('PASS '+name); } catch (e) { results.push('FAIL '+name+': '+e.message); } };
  class Field extends EventTarget { constructor() { super(); this.value = ''; } }
  const field = new Field(), scans = [], notices = [];
  const scanner = new ScannerManager(field, {onScan:value => scans.push(value), onNotice:value => notices.push(value)});
  const configure = mode => { field.value = ''; scanner.configure({mode,timeout:50}); };
  const input = value => { field.value = value; field.dispatchEvent(new Event('input')); };
  const key = (name, extra = {}) => { const event = new Event('keydown', {cancelable:true}); Object.assign(event,{key:name,...extra}); field.dispatchEvent(event); return event; };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  await test('EAN-13, leading zeros, alphanumeric, single character and whitespace', () => {
    configure('enter');
    ['4549292144567','000123','ABC-123','1','  A  '].forEach(value => { input(value); key('Enter'); assert(scans.at(-1) === value,'Value changed'); assert(field.value === '', 'Buffer not reset'); });
  });
  await test('Twenty rapid consecutive scans and repeated values', () => {
    const start = scans.length;
    for (let i=0;i<20;i++) { input('000'+i); key('Enter'); }
    input('ABC'); key('Enter'); input('ABC'); key('Enter');
    assert(scans.length === start+22,'Missing or merged scan'); assert(scans.at(-1) === scans.at(-2),'Repeated scan lost');
  });
  await test('Empty and repeated suffix do not add records', () => { const start = scans.length; key('Enter'); key('Enter',{repeat:true}); assert(scans.length === start,'Empty scan accepted'); });
  await test('Tab mode captures and prevents navigation', () => { configure('tab'); input('TAB'); assert(key('Tab').defaultPrevented,'Tab not prevented'); assert(scans.at(-1) === 'TAB','Tab scan missing'); });
  await test('Tab remains navigation in Enter mode', () => { configure('enter'); assert(!key('Tab').defaultPrevented,'Tab swallowed'); });
  await test('Browser shortcuts are not prevented', () => { input('ABC'); const start = scans.length; ['c','v','Enter','Tab'].forEach(k => assert(!key(k,{ctrlKey:true}).defaultPrevented,'Shortcut prevented')); assert(scans.length === start,'Shortcut submitted'); field.value=''; });
  await test('Timeout submits once', async () => { configure('timeout'); const start = scans.length; input('TIME'); await delay(90); assert(scans.length === start+1,'Timeout missing'); key('Enter'); await delay(70); assert(scans.length === start+1,'Double completion'); });
  await test('Suffix completes timeout early without a second event', async () => { const start=scans.length; input('FAST'); key('Tab'); await delay(90); assert(scans.length === start+1,'Duplicate event'); });
  await test('Focus loss retains unfinished input and cancels timeout', async () => { input('PARTIAL'); const start=scans.length; field.dispatchEvent(new Event('blur')); await delay(90); assert(field.value === 'PARTIAL' && scans.length === start,'Partial input lost or submitted'); scanner.complete(); assert(scans.at(-1)==='PARTIAL','Cannot recover partial'); });
  await test('IME composition waits until composition ends', async () => { field.dispatchEvent(new Event('compositionstart')); input('日本語'); const start=scans.length; await delay(90); assert(scans.length===start,'Composition submitted early'); field.dispatchEvent(new Event('compositionend')); await delay(90); assert(scans.at(-1)==='日本語','Composition result lost'); });
  await test('QR content and long text are preserved', () => { configure('enter'); ['https://example.com/?a=1&b=2','<script>alert(1)</script>','日本語,"quote"\nline\tend','Q'.repeat(100000)].forEach(value => { input(value); key('Enter'); assert(scans.at(-1)===value,'QR text changed'); }); });
  await test('Unsupported keyboard key gives visible notice', () => { const start=notices.length; key('Unidentified'); assert(notices.length===start+1,'No notice'); });
  await test('CSV BOM, escaping, line breaks and formula protection', () => {
    const values=['000123','=1+1','+SUM(1,2)','-1','@SUM(A1)','\t=1','\r=1','日本語,"quote"\nnext'];
    const csv=ScannerCSV.build(values.map((value,i)=>({id:String(i),value,timestamp:'2026-10-17T09:00:00+09:00',isDuplicate:false})));
    assert(csv.charCodeAt(0)===0xfeff,'No UTF-8 BOM');
    values.forEach(value => assert(csv.includes(ScannerCSV.cell("'"+value)),'Missing protective prefix/escaping'));
    assert(csv.includes('""quote""'),'Quotes not escaped'); assert(csv.includes('\r\n'),'Wrong row separator');
  });
  await test('Storage access errors preserve fallback and report failures', () => {
    const errors=[], store=new ScannerStorage(message=>errors.push(message));
    const prefix=store.prefix; store.prefix={toString(){throw new Error('Simulated unavailable storage');}};
    assert(store.read('history','fallback')==='fallback','Read fallback missing');
    assert(store.write('history',[])===false,'Failed write not reported'); assert(store.remove('history')===false,'Failed removal not reported'); assert(errors.length===3,'Missing error notices'); store.prefix=prefix;
  });
  scanner.cancelTimer();
  const text=results.join('\n')+'\n\n'+results.filter(r=>r.startsWith('PASS')).length+'/'+results.length+' passed';
  if (typeof document !== 'undefined') document.getElementById('results').textContent=text;
  if (typeof console !== 'undefined') console.log(text);
})();

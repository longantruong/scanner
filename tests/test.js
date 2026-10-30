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
  await test('Exactly 14 digits are accepted with leading zeros preserved', () => {
    configure('enter');
    ['45492921445670','00000000000123'].forEach(value => { input(value); key('Enter'); assert(scans.at(-1) === value,'Value changed'); assert(field.value === '', 'Buffer not reset'); });
  });
  await test('Invalid scans require a rescan and reset the buffer', () => {
    const start = scans.length;
    ['4549292144567','123456789012345','ABC12345678901',' 1234567890123','１２３４５６７８９０１２３４','12345678901234\n'].forEach(value => {
      const before = notices.length;
      input(value); key('Enter');
      assert(scans.length === start, 'Invalid scan accepted');
      assert(field.value === '' && scanner.buffer === '', 'Invalid buffer not reset');
      assert(notices.length === before+1 && notices.at(-1).includes('scan again'), 'Rescan notice missing');
    });
    input('12345678901234'); key('Enter');
    assert(scans.length === start+1, 'Valid rescan missing');
  });
  await test('Twenty rapid consecutive scans and repeated values', () => {
    const start = scans.length;
    for (let i=0;i<20;i++) { input(String(i).padStart(14,'0')); key('Enter'); }
    input('12345678901234'); key('Enter'); input('12345678901234'); key('Enter');
    assert(scans.length === start+22,'Missing or merged scan'); assert(scans.at(-1) === scans.at(-2),'Repeated scan lost');
  });
  await test('Empty and repeated suffix do not add records', () => { const start = scans.length; key('Enter'); key('Enter',{repeat:true}); assert(scans.length === start,'Empty scan accepted'); });
  await test('Tab mode captures and prevents navigation', () => { configure('tab'); input('12345678901234'); assert(key('Tab').defaultPrevented,'Tab not prevented'); assert(scans.at(-1) === '12345678901234','Tab scan missing'); });
  await test('Tab remains navigation in Enter mode', () => { configure('enter'); assert(!key('Tab').defaultPrevented,'Tab swallowed'); });
  await test('Browser shortcuts are not prevented', () => { input('ABC'); const start = scans.length; ['c','v','Enter','Tab'].forEach(k => assert(!key(k,{ctrlKey:true}).defaultPrevented,'Shortcut prevented')); assert(scans.length === start,'Shortcut submitted'); field.value=''; });
  await test('Timeout submits once', async () => { configure('timeout'); const start = scans.length; input('12345678901234'); await delay(90); assert(scans.length === start+1,'Timeout missing'); key('Enter'); await delay(70); assert(scans.length === start+1,'Double completion'); });
  await test('Suffix completes timeout early without a second event', async () => { const start=scans.length; input('23456789012345'); key('Tab'); await delay(90); assert(scans.length === start+1,'Duplicate event'); });
  await test('Focus loss retains unfinished input and cancels timeout', async () => { input('34567890123456'); const start=scans.length; field.dispatchEvent(new Event('blur')); await delay(90); assert(field.value === '34567890123456' && scans.length === start,'Partial input lost or submitted'); scanner.complete(); assert(scans.at(-1)==='34567890123456','Cannot recover partial'); });
  await test('IME composition waits until composition ends', async () => { field.dispatchEvent(new Event('compositionstart')); input('45678901234567'); const start=scans.length; await delay(90); assert(scans.length===start,'Composition submitted early'); field.dispatchEvent(new Event('compositionend')); await delay(90); assert(scans.at(-1)==='45678901234567','Composition result lost'); });
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

'use strict';
class ScannerManager {
  constructor(field, options) {
    this.field = field;
    this.options = options;
    this.buffer = '';
    this.timer = null;
    this.composing = false;
    field.addEventListener('keydown', e => this.keydown(e));
    field.addEventListener('input', () => this.input());
    field.addEventListener('compositionstart', () => { this.composing = true; this.cancelTimer(); });
    field.addEventListener('compositionend', () => { this.composing = false; this.input(); });
    field.addEventListener('blur', () => this.pause());
    window.addEventListener('blur', () => this.pause());
  }
  cancelTimer() { clearTimeout(this.timer); this.timer = null; }
  configure(settings) { this.pause(); this.settings = settings; }
  pause() {
    this.cancelTimer();

    console.log("aaa :",this.field.value.length)
    if (this.field.value.length) this.options.onNotice('Unfinished input retained. Review it, then press Complete input or continue scanning.');
  }
  input() {
    this.buffer = this.field.value;
    this.cancelTimer();
    if (!this.composing && this.settings.mode === 'timeout' && this.buffer.length) {
      this.timer = setTimeout(() => this.complete(), this.settings.timeout);
    }
  }
  keydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || this.composing) return;
    if (e.key === 'Dead' || e.key === 'Unidentified') this.options.onNotice('Unsupported keyboard input. Check the scanner keyboard layout; review the captured value.');
    if (e.key === 'Enter' || e.key === 'Tab') {
      const matches = (e.key === 'Enter' && this.settings.mode === 'enter') || (e.key === 'Tab' && this.settings.mode === 'tab');
      if (matches || this.settings.mode === 'timeout') {
        e.preventDefault();
        if (!e.repeat) this.complete();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.options.onNotice('Enter received in Tab mode. Input retained; use the configured suffix or Complete input.');
      }
    }
  }
  complete() {
    this.cancelTimer();
    this.buffer = this.field.value;
    if (!this.buffer.length) { this.options.onNotice('Empty scan ignored. No record was added.'); return; }
    const value = this.buffer;
    this.buffer = '';
    this.field.value = '';
    if (!/^[0-9]{14}$/.test(value)) {
      this.options.onNotice('Invalid scan. The code must contain exactly 14 digits. Please scan again.', 'error');
      return;
    }
    this.options.onScan(value);

    console.log("value :",value)
  }
}
window.ScannerManager = ScannerManager;

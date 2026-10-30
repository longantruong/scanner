'use strict';
class ScannerStorage {
  constructor(onError) { this.onError = onError; this.prefix = 'local-barcode-scanner.v1.'; }
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) { this.onError('Cannot read local storage. Data may be unavailable or damaged. Export your current history. ' + error.message); return fallback; }
  }
  write(key, value) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); return true; }
    catch (error) { this.onError('History/settings could not be saved (storage blocked or full). Current scans remain in memory; export CSV before closing. ' + error.message); return false; }
  }
  remove(key) {
    try { localStorage.removeItem(this.prefix + key); return true; }
    catch (error) { this.onError('Saved history could not be removed. Clear this file’s browser storage manually if needed. ' + error.message); return false; }
  }
}
window.ScannerStorage = ScannerStorage;

'use strict';
(() => {
  const API_URL = 'https://update.wymanmelyssa4.workers.dev/';

  function parseBarcode(code) {
    if (!/^\d{14}$/.test(code)) return null;
    return {
      game: code.substring(0, 4),
      ticket_number: code.substring(4, 10),
      ticket_sequence: code.substring(10, 13),
      alpha: code.substring(13, 14)
    };
  }

  async function sendBarcode(code) {
    const barcodeData = parseBarcode(code);
    if (!barcodeData) throw new Error('Invalid barcode');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...barcodeData, amount: 1}),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }

  window.parseBarcode = parseBarcode;
  window.sendBarcode = sendBarcode;
})();

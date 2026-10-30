'use strict';
window.ScannerCSV = {
  cell(value) { return '"' + String(value).replace(/"/g, '""') + '"'; },
  // Prefix every barcode with an apostrophe: untrusted content never becomes a formula.
  // CSV has no cell types. Excel import-as-Text is required for exact original values.
  build(records) {
    const rows = [['No', 'Barcode', 'Date', 'Time', 'Duplicate']];
    records.forEach((record, index) => {
      const d = new Date(record.timestamp);
      rows.push([records.length - index, "'" + record.value, d.toLocaleDateString('sv-SE'), d.toLocaleTimeString('en-GB', {hour12:false}), record.isDuplicate ? 'Yes' : 'No']);
    });
    return '\uFEFF' + rows.map(row => row.map(value => this.cell(value)).join(',')).join('\r\n');
  },
  download(records) {
    const blob = new Blob([this.build(records)], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    link.download = `barcode_history_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.csv`;
    link.href = url;
    document.body.append(link);
    try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
  }
};

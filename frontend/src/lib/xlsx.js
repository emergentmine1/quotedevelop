// Excel (.xlsx) import / export utility — uses ExcelJS (actively maintained alternative)
// Replaces SheetJS xlsx which is unmaintained and has 2 known CVEs
import ExcelJS from 'exceljs';

export async function downloadXlsx(filename, rows, { sheetName = 'Sheet1', columns } = {}) {
  if (!rows?.length) return;

  const data = columns ? rows.map((r) => Object.fromEntries(columns.map((c) => [c, r[c]]))) : rows;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add headers from first row keys
  const headers = Object.keys(data[0] || {});
  worksheet.columns = headers.map((header) => ({ header, key: header, width: 15 }));

  // Add rows
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Auto-fit columns based on max content length
  worksheet.columns.forEach((col) => {
    let maxLength = (col.header || '').toString().length + 2;
    data.forEach((row) => {
      const cellValue = String(row[col.key] ?? '').length + 2;
      maxLength = Math.max(maxLength, cellValue);
    });
    col.width = Math.min(40, maxLength);
  });

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function parseXlsxFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheetName = workbook.worksheets[0]?.name || 'Sheet1';
        const worksheet = workbook.getWorksheet(sheetName);

        // Convert worksheet to JSON rows
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            const headerCell = worksheet.getRow(1).getCell(colNumber);
            rowData[headerCell.value] = cell.value;
          });
          rows.push(rowData);
        });

        resolve({
          sheetName,
          rows,
          allSheets: workbook.worksheets.map((ws) => ws.name),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Build a template buffer for a given matrix type so users can fill it in
export function templateColumns(type) {
  switch (type) {
    case 'air':
      return ['airlineCode', 'airlineFlightCode', 'airlineName', 'destination', 'serviceType', 'currency', 'effectiveDate', 'expiryDate', 'status', 'weight', 'freight', 'fuel', 'security', 'other'];
    case 'lcl':
      return ['carrierCode', 'carrierName', 'originPort', 'destinationPort', 'currency', 'effectiveDate', 'expiryDate', 'status', 'minCBM', 'maxCBM', 'ratePerCbm', 'documentationFee', 'thc', 'other'];
    case 'fcl':
      return ['carrierCode', 'carrierName', 'originPort', 'destinationPort', 'currency', 'effectiveDate', 'expiryDate', 'status', '20GP', '40GP', '40HQ', '45HQ', 'Special'];
    case 'surcharge':
      return ['surchargeName', 'surchargeType', 'appliesTo', 'calculationType', 'value', 'currency', 'effectiveDate', 'expiryDate', 'status'];
    default:
      return [];
  }
}


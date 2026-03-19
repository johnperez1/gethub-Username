/**
 * Export Service
 *
 * Handles CSV and JSON file generation and download triggering for portfolio data.
 * Relies on portfolioExportUtils for data preparation and sanitization.
 */

/* global prepareExportData */

/**
 * Converts an array of objects to a CSV string.
 * @param {Array<Object>} rows - Array of flat objects to convert.
 * @returns {string} CSV-formatted string.
 */
function objectsToCSV(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = val != null ? String(val) : '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map((row) => headers.map((h) => escape(row[h])).join(','));

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Builds a multi-section CSV from the prepared export data.
 * Sections: Portfolio Summary, Holdings, Transactions.
 * @param {Object} exportData - Output of prepareExportData().
 * @returns {string} Full CSV string.
 */
function buildCSV(exportData) {
  const lines = [];

  // Summary section
  lines.push('PORTFOLIO SUMMARY');
  lines.push(objectsToCSV([
    {
      portfolioName: exportData.portfolioName,
      totalValue: exportData.totalValue != null ? exportData.totalValue : '',
      currency: exportData.currency,
      exportedAt: exportData.exportedAt,
    },
  ]));
  lines.push('');

  // Holdings section
  if (exportData.holdings && exportData.holdings.length > 0) {
    lines.push('HOLDINGS');
    lines.push(objectsToCSV(exportData.holdings));
    lines.push('');
  }

  // Transactions section
  if (exportData.transactions && exportData.transactions.length > 0) {
    lines.push('TRANSACTIONS');
    lines.push(objectsToCSV(exportData.transactions));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Triggers a file download in the browser.
 * @param {string} content - File content as a string.
 * @param {string} filename - The name for the downloaded file.
 * @param {string} mimeType - MIME type of the file (e.g. 'text/csv').
 */
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Exports portfolio data as a JSON file.
 * @param {Object} portfolioData - Raw portfolio data from the app.
 * @returns {{ success: boolean, message: string }}
 */
function exportAsJSON(portfolioData) {
  try {
    const exportData = prepareExportData(portfolioData);
    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `portfolio-export-${formatDateForFilename(exportData.exportedAt)}.json`;
    triggerDownload(jsonString, filename, 'application/json');
    return { success: true, message: `Portfolio exported successfully as ${filename}` };
  } catch (err) {
    return { success: false, message: `Export failed: ${err.message}` };
  }
}

/**
 * Exports portfolio data as a CSV file.
 * @param {Object} portfolioData - Raw portfolio data from the app.
 * @returns {{ success: boolean, message: string }}
 */
function exportAsCSV(portfolioData) {
  try {
    const exportData = prepareExportData(portfolioData);
    const csvString = buildCSV(exportData);
    const filename = `portfolio-export-${formatDateForFilename(exportData.exportedAt)}.csv`;
    triggerDownload(csvString, filename, 'text/csv');
    return { success: true, message: `Portfolio exported successfully as ${filename}` };
  } catch (err) {
    return { success: false, message: `Export failed: ${err.message}` };
  }
}

/**
 * Formats an ISO date string into a safe filename segment (e.g. "2024-01-15_10-30-00").
 * @param {string} isoString - ISO 8601 date string.
 * @returns {string}
 */
function formatDateForFilename(isoString) {
  return isoString.replace('T', '_').replace(/:/g, '-').replace(/(\.\d+)?Z$/, '');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { objectsToCSV, buildCSV, triggerDownload, exportAsJSON, exportAsCSV, formatDateForFilename };
}

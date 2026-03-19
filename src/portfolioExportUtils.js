/**
 * Portfolio Export Utilities
 *
 * Core functions to format and prepare portfolio data for export.
 * Ensures no sensitive data (private keys, credentials, tokens) is included.
 */

const SENSITIVE_FIELDS = [
  'privateKey',
  'private_key',
  'secretKey',
  'secret_key',
  'password',
  'token',
  'authToken',
  'auth_token',
  'apiKey',
  'api_key',
  'credential',
  'credentials',
  'seed',
  'mnemonic',
  'passphrase',
];

/**
 * Removes sensitive fields from an object recursively.
 * @param {Object} obj - The object to sanitize.
 * @returns {Object} A new object with sensitive fields removed.
 */
function sanitizeData(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }

  return Object.keys(obj).reduce((sanitized, key) => {
    const lowerKey = key.toLowerCase();
    // Use exact match or word-boundary match (handles both camelCase and snake_case)
    // to avoid false positives on non-sensitive fields like 'credential_verified'.
    const isSensitive = SENSITIVE_FIELDS.some((field) => {
      const f = field.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (lowerKey === field.toLowerCase()) return true;
      // Match field as a whole word segment separated by underscores
      return new RegExp('(?:^|_)' + f + '(?:$|_)').test(lowerKey);
    });
    if (!isSensitive) {
      sanitized[key] = sanitizeData(obj[key]);
    }
    return sanitized;
  }, {});
}

/**
 * Formats holdings data for export.
 * @param {Array} holdings - Array of holding objects.
 * @returns {Array} Sanitized and formatted holdings.
 */
function formatHoldings(holdings) {
  if (!Array.isArray(holdings)) return [];
  return holdings.map((holding) => {
    const sanitized = sanitizeData(holding);
    return {
      ...sanitized,
      symbol: sanitized.symbol || '',
      name: sanitized.name || '',
      quantity: sanitized.quantity != null ? sanitized.quantity : '',
      currentPrice: sanitized.currentPrice != null ? sanitized.currentPrice : '',
      totalValue: sanitized.totalValue != null ? sanitized.totalValue : '',
      gainLoss: sanitized.gainLoss != null ? sanitized.gainLoss : '',
      gainLossPercent: sanitized.gainLossPercent != null ? sanitized.gainLossPercent : '',
    };
  });
}

/**
 * Formats transaction history data for export.
 * @param {Array} transactions - Array of transaction objects.
 * @returns {Array} Sanitized and formatted transactions.
 */
function formatTransactions(transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.map((tx) => {
    const sanitized = sanitizeData(tx);
    return {
      ...sanitized,
      date: sanitized.date || '',
      type: sanitized.type || '',
      symbol: sanitized.symbol || '',
      quantity: sanitized.quantity != null ? sanitized.quantity : '',
      price: sanitized.price != null ? sanitized.price : '',
      total: sanitized.total != null ? sanitized.total : '',
      status: sanitized.status || '',
    };
  });
}

/**
 * Prepares the complete portfolio data for export.
 * @param {Object} portfolioData - Raw portfolio data from the app.
 * @returns {Object} Sanitized and structured export payload.
 */
function prepareExportData(portfolioData) {
  if (!portfolioData || typeof portfolioData !== 'object') {
    throw new Error('Invalid portfolio data provided for export.');
  }

  const sanitized = sanitizeData(portfolioData);

  return {
    exportedAt: new Date().toISOString(),
    portfolioName: sanitized.portfolioName || 'My Portfolio',
    totalValue: sanitized.totalValue != null ? sanitized.totalValue : null,
    currency: sanitized.currency || 'USD',
    holdings: formatHoldings(sanitized.holdings || []),
    transactions: formatTransactions(sanitized.transactions || []),
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sanitizeData, formatHoldings, formatTransactions, prepareExportData, SENSITIVE_FIELDS };
}

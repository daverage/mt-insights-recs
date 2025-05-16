const Utils = (() => {
  // --- Utility Functions ---

  const normalise = s => String(s || '').trim();

  const cleanNumber = v => {
    if (v === null || v === undefined || v === '') return 0;
    const cleaned = String(v).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const getPercentile = (arr, p) => {
    const sorted = arr.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const index = (p / 100) * (sorted.length - 1);
    if (Number.isInteger(index)) {
      return sorted[index];
    } else {
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower < 0) return sorted[0];
      if (upper >= sorted.length) return sorted[sorted.length - 1];
      return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
    }
  };

  const escapeCsvValue = (value) => {
    const stringValue = String(value ?? '');
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const sanitiseTextForPrompt = function(text) {
    if (typeof text !== 'string') return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  const showError = function(message, container = null) {
    const target = container || (typeof dom !== 'undefined' && dom.aiReportContainer ? dom.aiReportContainer : null);
    if (target) {
      target.innerHTML = `<p style='color: red; text-align: center; font-weight: bold;'>${message}</p>`;
    } else {
      alert(message);
    }
  }

  const formatCellValue = function(value, key, currencySymbol = '') {
    if (value === null || typeof value === 'undefined') return '';

    if (key === 'overallPerformanceScore' || key === 'potentialScore') {
      return Math.round(Number(value) || 0).toString();
    }
    if (['revenue', 'aov', 'rps', 'rpc', 'revPerImp', 'influencerRev', 'influencerAov'].includes(key)) {
      const numberValue = Number(value) || 0;
      return currencySymbol + Math.round(numberValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    if (key === 'upt' || key === 'influencerUpt') {
      return (Number(value) || 0).toFixed(0);
    }
    if (['ctr', 'desirability', 'desirabilityScore'].includes(key)) {
      return (Number(value) || 0).toFixed(2);
    }
    if (key === 'convRate') {
      const numericValue = typeof value === 'string' ? parseFloat(value.replace('%','')) / 100 : Number(value);
      return (numericValue * 100).toFixed(2) + '%';
    }
    if (key === 'clicks' || key === 'imps') {
      return Number(value || 0).toLocaleString();
    }

    return String(value);
  };
/**
 * Convert an array of JSON objects to a Markdown table string.
 * @param {Array<Object>} data - Array of objects (with consistent keys).
 * @returns {string} Markdown-formatted table.
 */
const jsonToMarkdown = function (data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Collect unique headers in order
  const headers = Array.from(
    data.reduce((set, item) => {
      Object.keys(item).forEach(key => set.add(key));
      return set;
    }, new Set())
  );

  // Build header row
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;

  // Build data rows
  const rows = data.map(item => {
    return `| ${headers
      .map(h => {
        let val = item[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return String(val).replace(/\r?\n/g, ' ');
      })
      .join(' | ')} |`;
  });

  // Combine into a single Markdown string
  return [headerRow, separatorRow, ...rows].join('\n');
}
  return {
    normalise,
    cleanNumber,
    getPercentile,
    escapeCsvValue,
    sanitiseTextForPrompt,
    showError,
    formatCellValue,
    jsonToMarkdown
  };
})();

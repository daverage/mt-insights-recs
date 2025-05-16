// --- Utility Functions ---

export const normalise = s => String(s || '').trim();

export const cleanNumber = v => {
    if (v === null || v === undefined || v === '') return 0;
    const cleaned = String(v).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

export const getPercentile = (arr, p) => {
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

// Helper to escape CSV values if they contain commas, quotes, or newlines
export const escapeCsvValue = (value) => {
    const stringValue = String(value ?? '');
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`; // Escape quotes by doubling them
    }
    return stringValue;
};

// Basic text sanitisation for AI prompts (HTML entity encoding)
export function sanitiseTextForPrompt(text) {
    if (typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;' // HTML5 recommends &#39; over &apos;
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Utility: Centralised error display
/**
 * Display a user-facing error message in a container (default: aiReportContainer).
 * @param {string} message - The error message (HTML allowed).
 * @param {HTMLElement} [container] - The container to display the error in.
 */
export function showError(message, container = null) {
    const target = container || (typeof dom !== 'undefined' && dom.aiReportContainer ? dom.aiReportContainer : null);
    if (target) {
        target.innerHTML = `<p style='color: red; text-align: center; font-weight: bold;'>${message}</p>`;
    } else {
        alert(message);
    }
}

// Formats cell values for display in the UI table
export function formatCellValue(value, key, currencySymbol = '') { // Added currencySymbol parameter
    if (value === null || typeof value === 'undefined') return '';

    // Specific formatting based on column key
    if (['revenue', 'aov', 'rps', 'rpc', 'revPerImp', 'influencerRev', 'influencerAov'].includes(key)) {
        return currencySymbol + (Number(value) || 0).toFixed(2); // Format as currency (e.g., £123.45)
    }
    if (key === 'upt' || key === 'influencerUpt') {
        return (Number(value) || 0).toFixed(0); // Format as whole number
    }
    if (['ctr', 'desirability', 'desirabilityScore'].includes(key)) {
        return (Number(value) || 0).toFixed(2); // Format as percentage or score with 2 decimal places
    }
    if (key === 'convRate') {
        // Assuming convRate is stored as a decimal (e.g., 0.05 for 5%)
        // and convRateNum is the numeric version if convRate is a string like "5.00%"
        const numericValue = typeof value === 'string' ? parseFloat(value.replace('%','')) / 100 : Number(value);
        return (numericValue * 100).toFixed(2) + '%';
    }
    if (key === 'clicks' || key === 'imps') {
        return Number(value || 0).toLocaleString(); // Format with commas for thousands
    }

    return String(value); // Default to string conversion
}

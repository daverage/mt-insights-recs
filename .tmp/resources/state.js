import * as actions from './actions.js'; // Import actions

// --- Global State ---
export let rawData = [];
export let filtered = [];
export let sortState = {}; // { key: 'revenue', dir: 'desc' } initially set in applyFilters
export let isSdkReady = false;
export let isDataProcessed = false;
export let showAllColumns = false;
let geminiApiKeyFromStorage = null; // Renamed for clarity

// --- State Modifiers ---
export function setRows(newRows) {
    rawData = Array.isArray(newRows) ? newRows : []; // Ensure rawData is always an array
}

export function setFiltered(newFilteredData) {
    filtered = Array.isArray(newFilteredData) ? newFilteredData : [];
    actions.updateActionButtonsState(); // Update button states
}

export function setSortState(key, dir) {
    sortState = { key, dir };
}

export function setDataProcessed(status) {
    isDataProcessed = status;
    actions.updateActionButtonsState(); // Update button states
}

export function setShowAllColumns(status) {
    showAllColumns = status;
}

export function setSdkReady(status) {
    isSdkReady = status;
    actions.updateActionButtonsState();
}

export function getApiKey() {
    if (geminiApiKeyFromStorage) return geminiApiKeyFromStorage;
    // Fallback to localStorage directly if state isn't populated yet during early init
    // This helps if getApiKey is called before main.js fully initializes the state via setApiKey
    return localStorage.getItem('geminiApiKey');
}

export function setApiKey(key) {
    geminiApiKeyFromStorage = key;
    if (key) {
        localStorage.setItem('geminiApiKey', key);
    } else {
        localStorage.removeItem('geminiApiKey');
    }
    // When API key changes, re-evaluate SDK readiness and button states
    if (typeof window.GoogleGenerativeAI !== 'undefined') {
        if (key && key.startsWith("AIza")) {
            setSdkReady(true);
        } else {
            setSdkReady(false);
        }
    } else {
        setSdkReady(false); // SDK not loaded, so not ready
    }
    // actions.updateActionButtonsState(); // This is already called by setSdkReady
}

// --- Getter Functions ---
export function getRawData() {
    return rawData;
}

export function getFilteredData() {
    return filtered;
}

export function getSortState() {
    return sortState;
}

export function getIsDataProcessed() {
    return isDataProcessed;
}

export function getShowAllColumns() {
    return showAllColumns;
}

export function getIsSdkReady() {
    return isSdkReady;
}

// --- SDK Ready Callback ---
// This function will be called by the inline script in index.html once the SDK is loaded.
// Add debug log to confirm when sdkLoaded is executed
window.sdkLoaded = function() {
    console.log("LOG: sdkLoaded function executed.");
    if (typeof window.GoogleGenerativeAI !== 'undefined') {
        const key = getApiKey(); // Use getter to access key from localStorage or state
        if (key && key.startsWith("AIza") && key !== "YOUR_API_KEY_HERE") {
            setSdkReady(true);
        } else {
            console.error("LOG_STATE_SDKLOADED_ERROR: Google AI SDK loaded, but API Key is missing or invalid. AI features will be disabled. Please add via modal.");
            setSdkReady(false);
        }
    } else {
        console.error("LOG_STATE_SDKLOADED_ERROR: window.sdkLoaded called, but GoogleGenerativeAI is not defined. AI features will be disabled.");
        setSdkReady(false);
    }
};

import * as dom from './dom.js';
import * as actions from './actions.js';
import * as ui from './ui.js';
import *  as data from './data.js'; // Assuming data.js has processData and other initial setup
import * as state from './state.js'; // Corrected import statement
import { showError } from './utils.js';

// Wait for the DOM to be fully loaded before running setup code
document.addEventListener('DOMContentLoaded', () => {

    // --- Initial Setup ---
    // Initialize UI elements that don't depend on data yet
    ui.renderAiReportHeader(false); // Example: Initial state for AI report header
    ui.renderSummaryHeader();     // Render summary header (buttons might be disabled initially)
    actions.updateActionButtonsState(); // Set initial button states

    // --- Event Listeners ---
    if (dom.fileInput) {
        dom.fileInput.addEventListener('change', (event) => {
            actions.handleFile(event.target.files[0]);
        });
    } else {
        console.error("LOG_MAIN_ERROR: dom.fileInput not found.");
    }
 // Help Modal Logic
  if (dom.helpBtn && dom.helpModal && dom.closeHelpModal) {
    dom.helpBtn.addEventListener('click', () => {
        dom.helpModal.style.display = 'block';
    });

    dom.closeHelpModal.addEventListener('click', () => {
        dom.helpModal.style.display = 'none';
    });

    // Close modal if user clicks outside of the modal content
    window.addEventListener('click', (event) => {
      if (event.target === dom.helpModal) {
        dom.helpModal.style.display = 'none';
      }
    });
  }
    if (dom.goBtn) {
        dom.goBtn.addEventListener('click', async () => {
            const file = dom.fileInput.files[0];
            if (file) {
                dom.goBtn.classList.add('loading');
                dom.goBtn.disabled = true;
                ui.syncCloneButtons(); // Sync go button loading state to clones if any
                try {
                    await data.processData(file); // This will eventually call applyFilters and renderTable
                } catch (error) {
                    console.error("LOG_MAIN_ERROR: Error processing data on GO:", error);
                    // Display error to user
                    showError(`Error processing file: ${error.message}`, dom.summaryContainer);
                    actions.handleFile(null); // Reset file input and UI state, which includes calling updateActionButtonsState
                } finally {
                    dom.goBtn.classList.remove('loading');
                    // goBtn disabled state will be managed by handleFile or processData success/failure
                    ui.syncCloneButtons();
                }
            } else {
                alert('Please select a CSV file first.');
            }
        });
    } else {
        console.error("LOG_MAIN_ERROR: dom.goBtn not found.");
    }

    if (dom.downloadBtn) {
        dom.downloadBtn.addEventListener('click', () => {
            dom.downloadBtn.classList.add('loading');
            actions.downloadCsv('recommendation_summary_filtered.csv');
            setTimeout(() => { // Give some visual feedback
                dom.downloadBtn.classList.remove('loading');
                ui.syncCloneButtons();
            }, 300);
            ui.scrollToSection(dom.summaryContainer);
        });
    } else {
        console.error("LOG_MAIN_ERROR: dom.downloadBtn not found.");
    }

    if (dom.generatePromptBtn) {
        dom.generatePromptBtn.addEventListener('click', () => {
            dom.generatePromptBtn.classList.add('loading');
            actions.displayPrompt();
            setTimeout(() => {
                dom.generatePromptBtn.classList.remove('loading');
                ui.syncCloneButtons();
            }, 300);
            ui.scrollToSection(dom.aiReportContainer);
        });
    } else {
        console.error("LOG_MAIN_ERROR: dom.generatePromptBtn not found.");
    }

    if (dom.aiReportBtn) {
        dom.aiReportBtn.addEventListener('click', async () => {
            // dom.aiReportBtn.classList.add('loading'); // Handled by generateGeminiReport
            // dom.aiReportBtn.disabled = true; // Handled by generateGeminiReport
            // ui.syncCloneButtons(); // Handled by generateGeminiReport
            await actions.generateGeminiReport();
            // generateGeminiReport's finally block calls updateActionButtonsState
        });
    } else {
        console.error("LOG_MAIN_ERROR: dom.aiReportBtn not found.");
    }

    if (dom.downloadWordBtn) {
        dom.downloadWordBtn.addEventListener('click', () => {
            dom.downloadWordBtn.classList.add('loading');
            actions.downloadWordReport();
            setTimeout(() => {
                dom.downloadWordBtn.classList.remove('loading');
                ui.syncCloneButtons();
            }, 300);
            ui.scrollToSection(dom.aiReportContainer);
        });
    } else {
        console.error("LOG_MAIN_ERROR: dom.downloadWordBtn not found.");
    }


    // Filter event listeners
    if (dom.badgeFilter) {
        dom.badgeFilter.addEventListener('change', data.applyFilters);
    } else {
        console.error("LOG_MAIN_ERROR: dom.badgeFilter not found.");
    }

    if (dom.experienceFilter) {
        dom.experienceFilter.addEventListener('change', data.applyFilters);
    } else {
        console.error("LOG_MAIN_ERROR: dom.experienceFilter not found.");
    }

    if (dom.experienceSearch) {
        dom.experienceSearch.addEventListener('input', ui.filterExperienceOptions);
    } else {
        console.error("LOG_MAIN_ERROR: dom.experienceSearch not found.");
    }

    // Show All Columns Toggle
    if (dom.showAllColumnsToggle) {
        dom.showAllColumnsToggle.addEventListener('change', () => {
          state.setShowAllColumns(dom.showAllColumnsToggle.checked);
          ui.renderTable(); // Re-render table with different columns
          actions.updateActionButtonsState(); // Re-check button states if columns change (e.g. for download)
        });
    } else {
        console.error("LOG_MAIN_ERROR: dom.showAllColumnsToggle not found.");
    }

    // Static Badges Toggle
    if (dom.staticBadgesToggle) {
        dom.staticBadgesToggle.addEventListener('change', () => {
            const isChecked = dom.staticBadgesToggle.checked;
            state.setStaticBadgesActive(isChecked);
            if (isChecked) {
                // When checked, badges are based on all data, then filters are re-applied
                data.recalculateBadgesForAllData();
            } else {
                // When unchecked, badges are based on currently filtered data
                data.applyFilters();
            }
        });
    } else {
        console.error("LOG_MAIN_ERROR: dom.staticBadgesToggle not found.");
    }


    // Additional Instructions Textarea
    if (dom.additionalInstructionsTextarea) {
        dom.additionalInstructionsTextarea.addEventListener('input', actions.handleAdditionalInstructionsInput);
    } else {
        console.warn("LOG_MAIN_WARN: dom.additionalInstructionsTextarea not found (optional element).");
    }

    // Initial call to render an empty table or "no data" message.
    // This ensures the table container is initialized before any data processing.
    // ui.renderTable(); // This might be redundant if processData always calls it.
                        // However, it ensures the container is at least cleared.

    // Check for API Key after DOM is loaded and basic UI is ready
    // This ensures that if the modal needs to be shown, the elements are available.
    checkAndPromptForApiKey();

});

// --- NEW: API Key Modal Logic (integrating with existing config.js and new UI elements) ---

/**
 * Checks for the Gemini API key on startup from localStorage.
 * If not found or invalid, it displays the API key modal.
 */
function checkAndPromptForApiKey() {
    let apiKey = state.getApiKey(); // Use state getter which checks localStorage

    if (apiKey && apiKey.startsWith("AIza")) {
        console.log("LOG_MAIN_APIKEY: Gemini API Key found and is valid.");
        // state.setApiKey(apiKey); // Already set by getApiKey if found in localStorage, or will be set by modal
        // SDK readiness is handled by state.js when API key is set or when SDK loads
    } else {
        console.warn("LOG_MAIN_APIKEY: Gemini API Key not found in localStorage or is invalid. Prompting user.");
        fireApiKeyModal();
    }
}

/**
 * Displays the API key modal.
 */
function fireApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    const saveButton = document.getElementById('saveApiKeyButton');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const closeButton = modal.querySelector('.close-button');

    if (!modal || !saveButton || !apiKeyInput || !closeButton) {
        console.error('LOG_MAIN_APIKEY_MODAL: API Key Modal interactive elements not found.');
        alert('Error: Could not display the API Key input dialog. Required elements are missing.');
        return;
    }

    modal.style.display = 'block';
    apiKeyInput.focus();
    apiKeyInput.value = state.getApiKey() || ''; // Pre-fill with current key from state/localStorage

    const saveKeyHandler = () => {
        const newApiKey = apiKeyInput.value.trim();
        if (newApiKey && newApiKey.startsWith("AIza")) { // Basic validation
            state.setApiKey(newApiKey); // This now saves to localStorage via state.js
            console.log("LOG_MAIN_APIKEY_MODAL: API Key saved via state.js.");
            modal.style.display = 'none';
            alert('API Key saved successfully!');
            // actions.updateActionButtonsState(); // Called by state.setApiKey via setSdkReady
        } else {
            state.setApiKey(null); // Clear invalid or empty key from state & localStorage
            alert('Please enter a valid Gemini API key (should start with \'AIza\'). API key has been cleared if previously set.');
            apiKeyInput.focus();
            // actions.updateActionButtonsState(); // Called by state.setApiKey via setSdkReady
        }
    };

    saveButton.removeEventListener('click', saveKeyHandler);
    saveButton.addEventListener('click', saveKeyHandler);

    closeButton.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// --- Main Initialization Function (DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {
    ui.initialiseUI(); // Changed initializeUI to initialiseUI
    // actions.updateActionButtonsState(); // Initial call is good, subsequent calls handled by state changes

    // Load API key from localStorage first (done by state.getApiKey), then prompt if not found/invalid.
    checkAndPromptForApiKey(); 
    // Call updateActionButtonsState once after initial check and potential modal display setup
    // to ensure buttons reflect the very initial state of API key and SDK readiness.
    actions.updateActionButtonsState();

    // ... existing event listeners in main.js ...
});

// ... rest of main.js ...

document.addEventListener('DOMContentLoaded', () => {
    UI.initialiseUI();
    UI.renderSummaryHeader();
    if (typeof AIService !== 'undefined' && AIService.init) {
        AIService.init();
    } else {
        console.warn("LOG_MAIN_WARN: AIService.init not found or AIService is undefined. API key modal might not work.");
    }
    Actions.updateActionButtonsState();

    if (Dom.fileInput) {
        Dom.fileInput.addEventListener('change', (event) => {
            Actions.handleFile(event.target.files[0]);
            // If the file is valid and goBtn is enabled, click it
            if (Dom.goBtn && !Dom.goBtn.disabled) {
                Dom.goBtn.click();
            }
        });
    } else {
        console.error("LOG_MAIN_ERROR: fileInput not found.");
    }

    if (Dom.helpBtn && Dom.helpModal && Dom.closeHelpModal) {
        Dom.helpBtn.addEventListener('click', () => {
            Dom.helpModal.style.display = 'block';
        });

        Dom.closeHelpModal.addEventListener('click', () => {
            Dom.helpModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === Dom.helpModal) {
                Dom.helpModal.style.display = 'none';
            }
        });
    }

    if (Dom.goBtn) {
        Dom.goBtn.addEventListener('click', async () => {
            const file = Dom.fileInput.files[0];
            if (file) {
                Dom.goBtn.classList.add('loading');
                Dom.goBtn.disabled = true;
                UI.syncCloneButtons();
                try {
                    await Data.processData(file);
                    if (Dom.recommendationSummaryDetails) { // Added
                        Dom.recommendationSummaryDetails.open = true; // Added
                    } // Added
                } catch (error) {
                    console.error("LOG_MAIN_ERROR: Error processing data on GO:", error);
                    Utils.showError(`Error processing file: ${error.message}`, Dom.summaryContainer);
                    Actions.handleFile(null);
                } finally {
                    Dom.goBtn.classList.remove('loading');
                    UI.syncCloneButtons();
                }
            } else {
                alert('Please select a CSV file first.');
            }
        });
    } else {
        console.error("LOG_MAIN_ERROR: goBtn not found.");
    }

    if (Dom.downloadBtn) {
        Dom.downloadBtn.addEventListener('click', () => {
            Dom.downloadBtn.classList.add('loading');
            Actions.downloadCsv('recommendation_summary_filtered.csv');
            setTimeout(() => {
                Dom.downloadBtn.classList.remove('loading');
                UI.syncCloneButtons();
            }, 300);
            UI.scrollToSection(Dom.summaryContainer);
        });
    } else {
        console.error("LOG_MAIN_ERROR: downloadBtn not found.");
    }

    if (Dom.generatePromptBtn) {
        Dom.generatePromptBtn.addEventListener('click', () => {
            Dom.generatePromptBtn.classList.add('loading');
            Actions.displayPrompt();
            // Standardized: open and scroll to AI Summary section here only
            if (Dom.aiSummaryDetails) {
                Dom.aiSummaryDetails.open = true;
            }
            setTimeout(() => {
                Dom.generatePromptBtn.classList.remove('loading');
                UI.syncCloneButtons();
            }, 300);
            UI.scrollToSection(Dom.aiReportContainer);
        });
    } else {
        console.error("LOG_MAIN_ERROR: generatePromptBtn not found.");
    }

    if (Dom.generateAiReportBtn) {
        Dom.generateAiReportBtn.addEventListener('click', async () => {
            Dom.generateAiReportBtn.classList.add('loading');
            Dom.generateAiReportBtn.disabled = true;
            // Immediately scroll and open the container, and show spinner
            if (Dom.aiSummaryDetails) {
                Dom.aiSummaryDetails.open = true;
            }
            if (Dom.aiReportContainer) {
                Dom.aiReportContainer.innerHTML = '<div class="loader-container" style="display:inline-block;vertical-align:middle;"><div class="loader" style="display:inline-block;vertical-align:middle;margin-right:8px;"></div><span style="display:inline-block;vertical-align:middle;">Generating AI report, please wait...</span></div>';
            }
            if (UI && UI.scrollToSection && Dom.aiReportContainer) {
                UI.scrollToSection(Dom.aiReportContainer);
            }
            try {
                await Actions.generateAiReport(); // Let actions.js handle all rendering
            } catch (error) {
                console.error("LOG_MAIN_ERROR: Error during AI report generation:", error);
            } finally {
                Dom.generateAiReportBtn.classList.remove('loading');
                Actions.updateActionButtonsState();
            }
        });
    } else {
        console.error("LOG_MAIN_ERROR: generateAiReportBtn not found.");
    }

    if (Dom.manageApiKeyBtn) {
        Dom.manageApiKeyBtn.addEventListener('click', () => {
            if (typeof AIService !== 'undefined' && AIService.manageApiKey) {
                AIService.manageApiKey();
            }
        });
    } else {
        console.warn("LOG_MAIN_WARN: manageApiKeyBtn not found.");
    }

    if (Dom.copyPromptTextBtn) {
        Dom.copyPromptTextBtn.addEventListener('click', Actions.handleCopyPromptText);
    } else {
        console.warn("LOG_MAIN_WARN: copyPromptTextBtn not found.");
    }

    if (Dom.downloadPromptDataCsvBtn) {
        Dom.downloadPromptDataCsvBtn.addEventListener('click', Actions.handleDownloadPromptDataCsv);
    } else {
        console.warn("LOG_MAIN_WARN: downloadPromptDataCsvBtn not found.");
    }

    if (Dom.copyAiReportBtn) {
        Dom.copyAiReportBtn.addEventListener('click', Actions.handleCopyAiReport);
    } else {
        console.warn("LOG_MAIN_WARN: copyAiReportBtn not found.");
    }

    if (Dom.downloadAiSourceDataCsvBtn) {
        Dom.downloadAiSourceDataCsvBtn.addEventListener('click', Actions.handleDownloadAiSourceDataCsv);
    } else {
        console.warn("LOG_MAIN_WARN: downloadAiSourceDataCsvBtn not found.");
    }

    if (Dom.downloadWordBtn) {
        Dom.downloadWordBtn.addEventListener('click', () => {
            Dom.downloadWordBtn.classList.add('loading');
            Actions.downloadWordReport();
            setTimeout(() => {
                Dom.downloadWordBtn.classList.remove('loading');
                UI.syncCloneButtons();
            }, 300);
        });
    } else {
        console.error("LOG_MAIN_ERROR: downloadWordBtn not found.");
    }

    if (Dom.downloadWordBtnAiHeader) {
        Dom.downloadWordBtnAiHeader.addEventListener('click', () => {
            Dom.downloadWordBtnAiHeader.classList.add('loading');
            Actions.downloadWordReport();
            setTimeout(() => {
                Dom.downloadWordBtnAiHeader.classList.remove('loading');
            }, 300);
        });
    } else {
        console.warn("LOG_MAIN_WARN: downloadWordBtnAiHeader not found.");
    }

    if (Dom.badgeFilter) {
        Dom.badgeFilter.addEventListener('change', () => { 
            Data.applyFilters();
        });
    } else {
        console.error("LOG_MAIN_ERROR: badgeFilter not found.");
    }

    if (Dom.experienceFilter) {
        Dom.experienceFilter.addEventListener('change', () => { 
            Data.applyFilters();
        });
    } else {
        console.error("LOG_MAIN_ERROR: experienceFilter not found.");
    }

    if (Dom.experienceSearch) {
        Dom.experienceSearch.addEventListener('input', UI.filterExperienceOptions);
    } else {
        console.error("LOG_MAIN_ERROR: experienceSearch not found.");
    }

    if (Dom.showAllColumnsToggle) {
        Dom.showAllColumnsToggle.addEventListener('change', () => {
          State.setShowAllColumns(Dom.showAllColumnsToggle.checked);
          UI.renderTable();
          Actions.updateActionButtonsState();
        });
    } else {
        console.error("LOG_MAIN_ERROR: showAllColumnsToggle not found.");
    }

    if (Dom.staticBadgesToggle) {
        Dom.staticBadgesToggle.addEventListener('change', () => {
            const isChecked = Dom.staticBadgesToggle.checked;
            State.setStaticBadgesActive(isChecked);
            if (isChecked) {
                Data.recalculateBadgesForAllData(); 
            } else {
                Data.applyFilters(); 
            }
            Actions.updateActionButtonsState();
        });
    } else {
        console.error("LOG_MAIN_ERROR: staticBadgesToggle not found.");
    }

    if (Dom.additionalInstructionsTextarea) {
        Dom.additionalInstructionsTextarea.addEventListener('input', Actions.handleAdditionalInstructionsInput);
    } else {
        console.warn("LOG_MAIN_WARN: additionalInstructionsTextarea not found (optional element).");
    }

    Actions.updateActionButtonsState(); 

    applyZoom(); 
});

let zoomLevel = 0.85;
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;

function applyZoom() {
  const wrapper = document.getElementById('wrapper');
  if(wrapper) {
    wrapper.style.transform = `scale(${zoomLevel})`;
    wrapper.style.transformOrigin = 'top left';
    wrapper.style.width = `${(1/zoomLevel)*100}%`;
    wrapper.style.height = `${(1/zoomLevel)*100}%`;
  }
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && !e.shiftKey) {
    if (e.key === '+' || e.key === '=') {
      zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP);
      applyZoom();
      e.preventDefault();
    } else if (e.key === '-') {
      zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP);
      applyZoom();
      e.preventDefault();
    } else if (e.key === '0') {
      zoomLevel = 0.85;
      applyZoom();
      e.preventDefault();
    }
  }
});

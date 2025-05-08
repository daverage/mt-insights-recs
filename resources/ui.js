import * as dom from './dom.js';
import * as state from './state.js';
import { keyMap, allColumns, coreColumnKeys, badgeUnicodeMap, badgeDefinitions, calculatedColumnDefinitions } from './config.js'; // Added badgeDefinitions and calculatedColumnDefinitions
import * as actions from './actions.js'; // Import all from actions
import * as data from './data.js'; // Import all from data
import { formatCellValue } from './utils.js';

// --- UI Rendering ---

export function renderTable() {
    
    if (!dom.summaryContainer) {
        console.error("LOG_UI_RENDERTABLE_ERROR: dom.summaryContainer is not found. Cannot render table.");
        return;
    }

    const tableContainer = dom.summaryContainer;
    let tableHtml = ''; // Initialize HTML string

    

    if (!state.getFilteredData() || state.getFilteredData().length === 0) { // Use getter
        tableHtml = '<p style="text-align: center; color: var(--muted-color);">No data to display for the current filters. Please upload a CSV or adjust filters.</p>';
        renderSummaryHeader(); // Still render header for buttons
        
        tableContainer.innerHTML = tableHtml;
        return;
    }

    const columnsToRender = state.getShowAllColumns() // Use getter
        ? [...allColumns] 
        : allColumns.filter(col => coreColumnKeys.includes(col.key));

    // Ensure 'badgeText' is the first column if present
    const badgeColIndex = columnsToRender.findIndex(c => c.key === 'badgeText');
    if (badgeColIndex > 0) {
        const badgeColumn = columnsToRender.splice(badgeColIndex, 1)[0];
        columnsToRender.unshift(badgeColumn);
    } else if (badgeColIndex === -1 && !state.getShowAllColumns() && coreColumnKeys.includes('badgeText')) { // Use getter
        const badgeColFromAll = allColumns.find(c => c.key === 'badgeText');
        if (badgeColFromAll && !columnsToRender.find(c => c.key === 'badgeText')) {
             columnsToRender.unshift(badgeColFromAll);
        }
    }
    

    if (columnsToRender.length === 0) {
        console.error("LOG_UI_RENDERTABLE_ERROR: columnsToRender is EMPTY. Table will not have headers or data rows.");
        tableHtml = '<p style="text-align: center; color: red;">Error: Table columns could not be determined.</p>';
        renderSummaryHeader();
        tableContainer.innerHTML = tableHtml;
        return;
    }

    tableHtml += '<table id="summary"><thead><tr>';
    columnsToRender.forEach(col => {
        let headerText = col.label || col.key;
        if (state.getSortState().key === col.key) { // Use getter
            const arrow = state.getSortState().dir === 'asc' ? ' &uarr;' : ' &darr;'; // Use getter, HTML entities for arrows
            headerText += arrow;
        }
        tableHtml += `<th data-sort-key="${col.key}" title="${col.tooltip || ''}">${headerText}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    state.getFilteredData().forEach(row => { // Use getter
        tableHtml += '<tr>';
        columnsToRender.forEach(colDef => {
            let cellContent = '';
            if (colDef.key === 'badgeText') {
                if (row.flag) {
                    cellContent = row.flag; // row.flag should contain the <span> and <i> tags
                } else {
                    // Fallback if row.flag is somehow not set
                    const badgeName = row.badgeText;
                    const badgeDef = badgeDefinitions.find(b => b.label === badgeName);
                    if (badgeDef) {
                        // Correctly construct the badge HTML, matching r.flag structure
                        const iconClass = badgeDef.icon || ''; // e.g., 'fa-solid fa-star'
                        const styleClass = badgeDef.styleClass || ''; // e.g., 'aov'
                        const tip = badgeDef.tip || badgeName;
                        // The outer span gets the styleClass for background/color, and generic badge-icon class
                        // The inner <i> tag ONLY gets the specific Font Awesome icon class(es)
                        cellContent = `<span class="badge-icon ${styleClass}" title="${tip}"><i class="${iconClass}"></i></span>`;
                    } else {
                        // Fallback if no badgeDef found (e.g., badgeName is not in config)
                        cellContent = `<span class="badge-icon" title="${badgeName || 'Unknown Badge'}">${badgeUnicodeMap[badgeName] || badgeName || '-'}</span>`;
                    }
                }
            } else if (colDef.key === 'experience') {
                if (row.experienceUrl) {
                    cellContent = `<a href="${row.experienceUrl}" class="experience-name-link" target="_blank" rel="noopener noreferrer"><strong class="experience-name-text">${row.experience}</strong></a>`;
                } else {
                    cellContent = `<strong class="experience-name-text">${formatCellValue(row[colDef.key], colDef.key)}</strong>`;
                }
                if (row.actionName) {
                    let actionHtml = ''
                    if (row.actionUrl) {
                        actionHtml += `<span class="action-label">Action:</span> <a href="${row.actionUrl}" class="action-name-link action-name" target="_blank" rel="noopener noreferrer">${row.actionName}</a>`;
                    } else {
                        actionHtml += `<span class="action-name-text action-name">${row.actionName}</span>`;
                    }
                    cellContent += `<div class="action-details">${actionHtml}</div>`;
                }
            } else {
                cellContent = formatCellValue(row[colDef.key], colDef.key, row.currencySymbol); // Pass currencySymbol
            }
            tableHtml += `<td>${cellContent}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    tableContainer.innerHTML = tableHtml;

    addSortingListeners();
    renderSummaryHeader();
    // Display the definitions card once tables are rendered
    const definitionsCard = document.getElementById('definitionsCard');
    if (definitionsCard) {
        definitionsCard.style.display = 'block';
        // Optionally, open it by default if it's a <details> element
        definitionsCard.open = true; 
    }
    renderDefinitionsKey(); // Ensure the content of the key is also rendered
}

export function renderInsights() {
  const insightsData = state.getFilteredData().filter(r => r.flag); // Use getter
  let insightsHtml = '';

  if (insightsData.length === 0) {
      insightsHtml = `<p style="text-align: center; color: var(--muted-color);">No specific insights found for the current filters.</p>`;
  } else {
      insightsHtml = `
        <table>
          <thead>
            <tr><th>Badge</th><th>Experience</th><th>Strategy</th><th>Explanation</th></tr>
          </thead>
          <tbody>`;
      insightsData.forEach(r => {
          const tip = r.flag.match(/title="([^"]+)"/)?.[1] || '';
          const expLink = r.experienceUrl
            ? `<a href="${r.experienceUrl}" class="experience-name-link" target="_blank" rel="noopener" ><strong class="experience-name-text">${r.experience}</strong></a>`
            : `<strong class="experience-name-text">${r.experience}</strong>`;
          insightsHtml += `<tr>
              <td>${r.flag}</td>
              <td>
                <div>
                  ${expLink}
                  ${r.actionName ? `<br>
                  <div class="action-details">
                    <span class="action-label">Action:</span> ${r.actionUrl
                      ? `<a href="${r.actionUrl}" class="action-name-link action-name" target="_blank" rel="noopener">${r.actionName}</a>`
                      : `<span class="action-name-text action-name">${r.actionName}</span>`}
                  </div>` : ''}
                </div>
              </td>
              <td>${r.strategy}</td>
              <td>${tip}</td>
            </tr>`;
      });
      insightsHtml += `</tbody></table>`;
  }
  dom.insightsContainer.innerHTML = insightsHtml;
  // Also ensure definitions are visible if insights are rendered (as it implies data is processed)
  const definitionsCard = document.getElementById('definitionsCard');
  if (definitionsCard && state.getIsDataProcessed()) { // Use getter, check if data has been processed
      definitionsCard.style.display = 'block';
      definitionsCard.open = true;
  }
  // renderDefinitionsKey(); // Content should already be there from renderTable or initializeUI
}

// --- Filter UI ---

export function updateFilters(badges, experiences) {
  dom.badgeFilter.innerHTML = '';
  dom.experienceFilter.innerHTML = '';
  dom.experienceSearch.value = '';

  const sortedBadges = [...badges].sort();
  const sortedExperiences = [...experiences].sort();

  dom.badgeFilter.innerHTML = '<option value="All" selected>All Badges</option>' + sortedBadges.map(b => `<option value="${b}">${b}</option>`).join('');
  dom.experienceFilter.innerHTML = '<option value="All" selected>All Experiences</option>' + sortedExperiences.map(e => `<option value="${e}">${e}</option>`).join('');
}

export function filterExperienceOptions() {
    const searchTerm = dom.experienceSearch.value.toLowerCase();
    const options = dom.experienceFilter.options;
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.value === 'All') {
            option.style.display = '';
            continue;
        }
        const optionText = option.textContent.toLowerCase();
        option.style.display = optionText.includes(searchTerm) ? '' : 'none';
    }
}


// --- UI Helpers ---

// Helper to scroll to the relevant section
export function scrollToSection(section) {
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Helper to clone a button and wire it to the original
export function cloneButton(originalBtn, id, text, iconClass) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.disabled = originalBtn.disabled;
    btn.className = originalBtn.className; // Copies classes like 'loading' if original has it

    // Create the inner structure for button text and loader
    const buttonTextSpan = document.createElement('span');
    buttonTextSpan.className = 'button-text';
    buttonTextSpan.innerHTML = `<i class="${iconClass}"></i> ${text}`;

    const loaderSpan = document.createElement('span');
    loaderSpan.className = 'loader';
    // If cloned loaders need unique IDs for JS manipulation (not currently the case for CSS):
    // loaderSpan.id = `loader-${id}`; 

    btn.appendChild(buttonTextSpan);
    btn.appendChild(loaderSpan);

    function setLoading(loading) {
        if (loading) {
            btn.classList.add('loading');
            originalBtn.classList.add('loading'); // Keep original in sync if it's also visible/managed
        } else {
            btn.classList.remove('loading');
            originalBtn.classList.remove('loading');
        }
    }

    // Determine action based on ID and wire to imported functions
    if (id === 'downloadBtnClone') {
        btn.addEventListener('click', () => {
            setLoading(true);
            actions.downloadCsv('recommendation_summary_filtered.csv'); // Use imported function
            setLoading(false); // Stop loading immediately
            scrollToSection(dom.summaryContainer);
        });
    } else if (id === 'generatePromptBtnClone') {
        btn.addEventListener('click', () => {
            setLoading(true);
            actions.displayPrompt(); // Use imported function
            setLoading(false); // Stop loading immediately
            scrollToSection(dom.aiReportContainer);
        });
    } else if (id === 'aiReportBtnClone') {
        btn.addEventListener('click', async () => {
            setLoading(true);
            await actions.generateGeminiReport(); // Use imported function
            setLoading(false);
            // No need to scroll here, generateGeminiReport handles it
        });
    } else if (id === 'downloadWordBtnClone') {
        btn.addEventListener('click', () => {
            setLoading(true);
            actions.downloadWordReport(); // Use imported function
            setLoading(false); // Stop loading immediately
            scrollToSection(dom.aiReportContainer);
        });
    } else {
        // Fallback for other potential clones, though none exist currently
        btn.addEventListener('click', () => {
            setLoading(true);
            originalBtn.click(); // Trigger original button's listener
            setTimeout(() => setLoading(false), 300);
        });
    }
    return btn;
}


// Sync cloned buttons' disabled state with original buttons
export function syncCloneButtons() {
  if (dom.summaryHeader) {
      const downloadBtnClone = document.getElementById('downloadBtnClone');
      const generatePromptBtnClone = document.getElementById('generatePromptBtnClone');
      const aiReportBtnClone = document.getElementById('aiReportBtnClone');
      if (downloadBtnClone) {
          downloadBtnClone.disabled = dom.downloadBtn.disabled;
          downloadBtnClone.className = dom.downloadBtn.className;
      }
      if (generatePromptBtnClone) {
          generatePromptBtnClone.disabled = dom.generatePromptBtn.disabled;
          generatePromptBtnClone.className = dom.generatePromptBtn.className;
      }
      if (aiReportBtnClone) {
          aiReportBtnClone.disabled = dom.aiReportBtn.disabled;
          aiReportBtnClone.className = dom.aiReportBtn.className;
      }
  }
  if (dom.aiReportHeader) {
      const downloadWordBtnClone = document.getElementById('downloadWordBtnClone');
      if (downloadWordBtnClone) {
          downloadWordBtnClone.disabled = dom.downloadWordBtn.disabled;
          downloadWordBtnClone.className = dom.downloadWordBtn.className;
      }
  }
}

// Render buttons in the summary header
export function renderSummaryHeader() {
    if (!dom.summaryHeader) {
        return;
    }

    // Clear existing header content
    dom.summaryHeader.innerHTML = '';

    // Create and append buttons if data is processed
    if (state.getIsDataProcessed()) { // Use getter
        const downloadBtnClone = cloneButton(dom.downloadBtn, 'downloadBtnClone', 'Download CSV', 'fa-solid fa-download');
        const generatePromptBtnClone = cloneButton(dom.generatePromptBtn, 'generatePromptBtnClone', 'Generate Prompt', 'fa-solid fa-file-lines');
        const aiReportBtnClone = cloneButton(dom.aiReportBtn, 'aiReportBtnClone', 'Generate AI Report', 'fa-solid fa-wand-magic-sparkles');

        dom.summaryHeader.appendChild(downloadBtnClone);
        dom.summaryHeader.appendChild(generatePromptBtnClone);
        dom.summaryHeader.appendChild(aiReportBtnClone);
    } else {
        dom.summaryHeader.innerHTML = '<p style="font-style: italic; color: var(--muted-color);">Process a file to enable actions.</p>';
    }
    syncCloneButtons(); // Ensure cloned buttons reflect original state
}

// Render buttons in the AI report header
export function renderAiReportHeader(showWordBtn) {
    if (!dom.aiReportHeader) return;
    dom.aiReportHeader.innerHTML = ''; // Clear existing
    if (showWordBtn) {
        dom.aiReportHeader.appendChild(cloneButton(dom.downloadWordBtn, 'downloadWordBtnClone', 'Download Report (Word)', 'fa-solid fa-file-word'));
    }
    syncCloneButtons(); // Ensure initial state is correct
}

// --- Sorting Logic ---
function addSortingListeners() {
    const table = document.getElementById('summary'); // Get the table by ID
    if (!table) {
        console.error("LOG_UI_SORTING_ERROR: Summary table not found for adding sort listeners.");
        return;
    }
    const headers = table.querySelectorAll('thead th');
    if (!headers || headers.length === 0) {
        return;
    }

    headers.forEach(th => {
        const sortKey = th.dataset.sortKey;
        if (sortKey) { // Only add listener if sortKey is present
            th.style.cursor = 'pointer'; // Indicate it's clickable
            th.addEventListener('click', () => {
                let newDir = 'desc';
                if (state.getSortState().key === sortKey && state.getSortState().dir === 'desc') {
                    newDir = 'asc';
                } else if (state.getSortState().key === sortKey && state.getSortState().dir === 'asc') {
                    newDir = 'desc'; // Or implement a third state like 'none' to reset sort or cycle
                }
                state.setSortState(sortKey, newDir);
                data.applyFilters(); // This will re-sort and re-render the table
            });
        }
    });
}

// --- Initial Render Calls (Example - might be called from main.js) ---
// renderAiReportHeader(false); // Initial state often has no report

export function renderDefinitionsKey() {
    if (!dom.definitionsKeyContainer || !dom.badgesKeyDiv || !dom.calculatedColumnsKeyDiv) {
        return;
    }

    // --- Render Badges Key ---
    let badgesHTML = '<h3>Badges Key</h3><ul>';
    badgeDefinitions.forEach(badge => {
        badgesHTML += `<li><strong>${badge.label} (<i class="${badge.icon}"></i>):</strong> ${badge.tip}</li>`;
    });
    badgesHTML += '</ul>';
    dom.badgesKeyDiv.innerHTML = badgesHTML;

    // --- Render Calculated Columns Key ---
    let calculatedColumnsHTML = '<h3>Calculated Metrics Key</h3><ul>';
    calculatedColumnDefinitions.forEach(col => {
        calculatedColumnsHTML += `<li><strong>${col.label}:</strong>${col.usage}<br /><span style="font-size:0.9em">"${col.description}</span></li>`;
    });
    calculatedColumnsHTML += '</ul>';
    dom.calculatedColumnsKeyDiv.innerHTML = calculatedColumnsHTML;

    dom.definitionsKeyContainer.style.display = 'block'; // Show the container
}

// --- Initial UI Setup ---
export function initialiseUI() { // Renamed initializeUI to initialiseUI
    if (dom.additionalInstructionsContainer) {
        dom.additionalInstructionsContainer.style.display = 'block'; // Show by default
    }
    if (dom.additionalInstructionsTextarea) {
        dom.additionalInstructionsTextarea.disabled = true; // Disabled until file chosen
    }
    if (dom.charCountDisplay) {
        dom.charCountDisplay.textContent = '0/500';
    }

    // Initial render of headers (buttons will be disabled by default via updateActionButtonsState)
    renderSummaryHeader();
    renderAiReportHeader(false); // No report generated initially

    // Render the definitions key as it's static content
    renderDefinitionsKey();

    // Initial render of tables with "no data" message
    renderTable();
    renderInsights();

    // Set initial button states based on no data loaded
    actions.updateActionButtonsState();
}

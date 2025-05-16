import * as dom from './dom.js';
import * as state from './state.js';
import * as ui from './ui.js';
import * as data from './data.js';
import { escapeCsvValue, sanitiseTextForPrompt, showError } from './utils.js';
import { badgeDefinitions, allColumns, coreColumnKeys, badgeUnicodeMap, insightsColumns, calculatedColumnDefinitions } from './config.js';

// --- Centralized Button State Management ---
export function updateActionButtonsState() {
    // Ensure dom elements are available
    if (!dom.downloadBtn || !dom.generatePromptBtn || !dom.aiReportBtn || !dom.downloadWordBtn || !dom.aiReportContainer) {
        console.warn("LOG_ACTIONS_UPDATEBUTTONS: One or more DOM elements for buttons not found. Skipping state update.");
        return;
    }

    const dataAvailable = state.getIsDataProcessed() && state.getFilteredData() && state.getFilteredData().length > 0;
    const sdkReady = state.getIsSdkReady();
    
    let aiReportActuallyGenerated = false;
    if (dom.aiReportContainer.innerHTML && 
        !dom.aiReportContainer.innerHTML.includes("Error:") && 
        !dom.aiReportContainer.innerHTML.includes("Generating AI report...") && 
        !dom.aiReportContainer.innerHTML.includes("Report or Prompt will appear here...") && 
        !dom.aiReportContainer.innerHTML.includes("No data available") && 
        !dom.aiReportContainer.innerHTML.includes("No filtered data available")) {
        aiReportActuallyGenerated = true;
    }

    // Download CSV Button
    dom.downloadBtn.disabled = !dataAvailable;

    // Generate Prompt Button
    dom.generatePromptBtn.disabled = !dataAvailable;

    // AI Report Button
    dom.aiReportBtn.disabled = !(dataAvailable && sdkReady);

    // Download Word Button
    dom.downloadWordBtn.disabled = !aiReportActuallyGenerated;

    ui.syncCloneButtons();
    ui.renderAiReportHeader(aiReportActuallyGenerated); // Update header which may contain cloned Word button
}

// --- Event Handlers ---

// Handles the file input change event.
export function handleFile(file) {
    if (!file) {
        dom.fileNameDisplay.textContent = 'No file chosen';
        dom.goBtn.disabled = true;
        // ui.syncCloneButtons(); // Called by updateActionButtonsState
        if (dom.additionalInstructionsContainer) {
            dom.additionalInstructionsContainer.style.display = 'block';
        }
        if (dom.additionalInstructionsTextarea) {
            dom.additionalInstructionsTextarea.value = '';
            dom.additionalInstructionsTextarea.disabled = true;
        }
        if (dom.charCountDisplay) {
            dom.charCountDisplay.textContent = '0/500';
        }
        state.setDataProcessed(false); // Ensure data processed is false
        updateActionButtonsState(); // Update button states
        return;
    }
    if (!file.name.endsWith('.csv')) {
        dom.fileNameDisplay.textContent = 'Invalid file type (CSV only)';
        dom.fileNameDisplay.style.color = 'red';
        dom.goBtn.disabled = true;
        // ui.syncCloneButtons(); // Called by updateActionButtonsState
        if (dom.additionalInstructionsContainer) {
            dom.additionalInstructionsContainer.style.display = 'block';
        }
        if (dom.additionalInstructionsTextarea) {
            dom.additionalInstructionsTextarea.value = '';
            dom.additionalInstructionsTextarea.disabled = true;
        }
        if (dom.charCountDisplay) {
            dom.charCountDisplay.textContent = '0/500';
        }
        state.setDataProcessed(false); // Ensure data processed is false
        updateActionButtonsState(); // Update button states
        return;
    }
    dom.fileNameDisplay.textContent = `Selected: ${file.name}`;
    dom.fileNameDisplay.style.color = 'inherit';
    dom.goBtn.disabled = false;
    
    // Reset UI elements that are directly controlled here
    if (dom.additionalInstructionsContainer) {
        dom.additionalInstructionsContainer.style.display = 'block'; 
    }
    if (dom.additionalInstructionsTextarea) {
        dom.additionalInstructionsTextarea.value = ''; 
        dom.additionalInstructionsTextarea.disabled = false; 
    }
    if (dom.charCountDisplay) {
        dom.charCountDisplay.textContent = '0/500';
    }
    
    dom.summaryContainer.innerHTML = '';
    dom.insightsContainer.innerHTML = '';
    dom.aiReportContainer.innerHTML = 'Report or Prompt will appear here...';
    
    state.setDataProcessed(false); // Data is not processed yet, only selected
    updateActionButtonsState(); // Update all action buttons based on current state

    // Headers are re-rendered by updateActionButtonsState via renderAiReportHeader
    // and renderSummaryHeader might be needed if its content changes too.
    // For now, renderSummaryHeader is called in main.js initially.
    // If summary header buttons depend on these states, it should also be in updateActionButtonsState.
    // ui.renderSummaryHeader(); // This might be needed if summary buttons change

    // Scroll to the filter section
    // if (dom.badgeFilter) { // Check if the filter element exists
    //     ui.scrollToSection(dom.badgeFilter);
    // }
}

// Handles input in the additional instructions textarea to update character count.
export function handleAdditionalInstructionsInput() {
    if (dom.additionalInstructionsTextarea && dom.charCountDisplay) {
        const maxLength = dom.additionalInstructionsTextarea.maxLength;
        const currentLength = dom.additionalInstructionsTextarea.value.length;
        dom.charCountDisplay.textContent = `${currentLength}/${maxLength}`;
    }
}

// --- AI & Prompt Generation ---

// Generates the instructional text part of the prompt for the AI.
export function generatePromptText() {
    const badgeExplanations = badgeDefinitions.map(b => `${b.label} (${b.icon.replace('fa-solid fa-', '')}): ${b.tip}`).join('\n');
    const sortInfo = state.sortState.key ? `sorted by ${state.sortState.key} ${state.sortState.dir}` : 'default sorting (Revenue Desc)';
    const currencySymbol = state.filtered.length > 0 ? state.filtered[0].currencySymbol : '(unknown currency)';
    const rawExtraInstructions = dom.additionalInstructionsTextarea ? dom.additionalInstructionsTextarea.value : '';
    const extraInstructions = sanitizeTextForPrompt(rawExtraInstructions); // Sanitize before use
    const prompt = `
    Act as a Conversion Rate Optimization (CRO) expert analyzing the performance of website recommendation strategies for a business stakeholder.

    **Analysis Goal:** Provide clear, actionable insights based *only* on the performance data provided in the attached CSV file. Generate the report using **Markdown syntax** suitable for direct rendering into HTML (e.g., using headings, lists, bold text).
    ${extraInstructions ? `\n\n**Additional Instructions:** ${extraInstructions}` : ''}
    **Context:**
    - The attached CSV file contains filtered performance data for recommendation strategies.
    - Each row represents a strategy's performance within a specific Experience (page) and Action (container).
    - Recommendations are displayed in containers (actions) on web pages. Containers might show multiple products, potentially requiring scrolling.
    - Pages often have multiple containers; product deduplication occurs across containers on the same page. Empty containers result if no unique products remain.
    - Impressions count when a strategy renders, even if products aren't immediately visible.
    - Key Metrics in the CSV: Revenue, AOV (Average Order Value), UPT (Units Per Transaction), Conv Rate (%), Clicks, Imps, Desirability Score (normalized engagement/value metric, 0-100), Rev/Imp (Revenue per Impression), Badge (assigned performance category).
    - **Monetary values (Revenue, AOV, RPS, RPC, Rev/Imp, Influencer Rev, Influencer AOV) are reported in ${currencySymbol}.**
    - Badges are assigned based on predefined percentile logic relative to other strategies in the *full* dataset (not just the filtered view provided). The data provided is currently ${sortInfo}.

    **Badge Meanings:**
    ${badgeExplanations}

    **Report Request:**
    Generate a professional, semi-formal summary suitable for business stakeholders using **Markdown**. Use the provided CSV data and badge meanings exclusively. Structure the report clearly as follows:

    ## Executive Summary
    Start with 2 or 3 sentences summarizing the key findings from the provided data.

    ## 1. Top Performers
       - Identify strategies showing strong positive signals within the provided data (e.g., high revenue, 'Strong Conversion', 'High AOV', high desirability score). Use a bulleted list.
       - For each, briefly explain the key metric or badge justifying its inclusion as a top performer in this context. Reference specific Experience/Action/Strategy where relevant.

    ## 2. Key Opportunities
       - Identify strategies flagged as 'Opportunity' or 'Hidden Gem' within the provided data. Use a bulleted list.
       - Briefly explain why they represent an opportunity, referencing the badge definition (e.g., high desirability but low impressions). Reference specific Experience/Action/Strategy.

    ## 3. Underperformers/Concerns
       - Identify strategies flagged with negative badges ('Poor Conversion', 'Ignored', 'Low ROI') within the provided data. Use a bulleted list.
       - Briefly explain the concern based on the badge definition (e.g., high impressions but low desirability for 'Low ROI'). Reference specific Experience/Action/Strategy.

    ## 4. Other Notable Insights
       - Identify any other interesting patterns within the provided data (e.g., 'Volume Drivers', 'Low UPT', 'Influencers'). Use a bulleted list if applicable.
       - Briefly explain the pattern based on the badge definition and its potential implication. Reference specific Experience/Action/Strategy.

    ## 5. Actionable Recommendations
       - Suggest 2–3 specific, actionable next steps derived *directly* from the analysis of the provided data. Use a numbered list.
       - Examples: "Consider promoting **[Strategy X]** in **[Experience Y]** due to its high desirability score.", "Investigate **[Strategy Z]** flagged as 'Poor Conversion' in **[Action A]** to understand the drop-off.", "Propose an A/B test for 'Hidden Gem' **[Strategy A]** against the current leader in **[Action B]** to validate its potential."

    **Important:** Generate only the Markdown report content based *solely* on the attached CSV data and the provided badge definitions. Do not include introductory phrases like "Here is the report:" or any text outside the requested Markdown structure. Maintain a business-focused, semi-formal tone. Do not invent data or insights.
    `;
    return prompt;
}

// Utility function to sanitize text for prompt
function sanitizeTextForPrompt(text) {
    if (!text) return '';
    return text.replace(/[<>]/g, ''); // Remove potentially unsafe characters like < and >
}

// Displays the generated prompt instructions and data summary in the UI.
export function displayPrompt() {
    const promptText = generatePromptText();
    if (!state.getFilteredData().length) { // Use getter
         dom.aiReportContainer.innerHTML = "<p style='color: orange;'>No filtered data available to generate a prompt.</p>";
         updateActionButtonsState(); // Update buttons as AI report content changed
         return;
    }
    const top50Json = data.buildTop50Json(state.getFilteredData()); // Use getter
    const promptWithData = `${promptText}\n\n---\n\nHere is the top 50 summary data in JSON format:\n${JSON.stringify(top50Json, null, 2)}`;

    if (promptText) {
        const promptWrapper = document.createElement('div');
        promptWrapper.style.position = 'relative';
        const preElement = document.createElement('pre');
        preElement.style.whiteSpace = 'pre-wrap';
        preElement.style.wordWrap = 'break-word';
        preElement.textContent = promptWithData;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'absolute';
        buttonContainer.style.top = '5px';
        buttonContainer.style.right = '5px';
        buttonContainer.style.zIndex = '1';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Prompt';
        copyButton.className = 'button copy-button';
        copyButton.title = 'Copy the prompt and summary JSON to clipboard';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(promptWithData).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => { copyButton.textContent = 'Copy Prompt'; }, 2000);
            }).catch(err => {
                console.error('Failed to copy prompt: ', err);
                alert('Failed to copy prompt to clipboard.');
            });
        });

        // --- Download Data Button (CSV for summary) ---
        const downloadDataButton = document.createElement('button');
        downloadDataButton.textContent = 'Download Summary (CSV)';
        downloadDataButton.className = 'button download-data-button';
        downloadDataButton.title = 'Download the top 50 summary as a CSV file';
        downloadDataButton.disabled = state.filtered.length === 0;
        downloadDataButton.addEventListener('click', () => {
            // Check for FileSaver dependency
            if (typeof saveAs === 'undefined') {
                alert("Error: FileSaver library not loaded. Cannot download summary CSV.");
                return;
            }
            downloadCsv('top50_summary.csv', data.getTop50Rows(state.filtered));
        });

        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(downloadDataButton);
        promptWrapper.appendChild(preElement);
        promptWrapper.appendChild(buttonContainer);
        dom.aiReportContainer.innerHTML = '';
        dom.aiReportContainer.appendChild(promptWrapper);

        // dom.downloadWordBtn.disabled = true; // Handled by updateActionButtonsState
        // ui.syncCloneButtons(); // Handled by updateActionButtonsState
        // ui.renderAiReportHeader(false); // Handled by updateActionButtonsState
        updateActionButtonsState(); // Update buttons as AI report content changed
        ui.scrollToSection(dom.aiReportHeader);

    } else {
        dom.aiReportContainer.innerHTML = "<p style='color: orange;'>Could not generate prompt instructions. Process data first.</p>";
        // dom.downloadWordBtn.disabled = true; // Handled by updateActionButtonsState
        // ui.syncCloneButtons(); // Handled by updateActionButtonsState
        updateActionButtonsState(); // Update buttons as AI report content changed
    }
}

// Generates the AI report using the Gemini API.
export async function generateGeminiReport() {
    // --- Pre-checks ---
    if (!state.getIsSdkReady() || typeof window.GoogleGenerativeAI === 'undefined') { // Use getter
        dom.aiReportContainer.innerHTML = "<p style='color: red;'>Error: Google AI SDK not loaded correctly. Please wait or refresh.</p>";
        console.error("LOG: generateGeminiReport - Google AI SDK not ready.");
        updateActionButtonsState(); // Ensure buttons reflect this state
        return;
    }
    // Assumes marked.js is loaded globally
    if (typeof marked === 'undefined') {
        dom.aiReportContainer.innerHTML = "<p style='color: red;'>Error: Markdown library (marked.js) not loaded.</p>";
        console.error("LOG: generateGeminiReport - marked.js not loaded.");
        updateActionButtonsState(); // Ensure buttons reflect this state
        return;
    }
    const apiKey = state.getApiKey();
    if (!apiKey || !apiKey.startsWith("AIza")) { 
        dom.aiReportContainer.innerHTML = "<p style='color: red;'>Error: Gemini API Key is not configured correctly or is insecurely exposed client-side. See console and config.js.</p>";
        console.error("LOG: generateGeminiReport - Invalid or missing Gemini API Key. See config.js security warning.");
        updateActionButtonsState(); // Ensure buttons reflect this state
        return;
    }
    if (!state.getFilteredData().length) { // Use getter
        dom.aiReportContainer.innerHTML = "<p style='color: orange;'>No data available for the current filters to generate a report.</p>";
        updateActionButtonsState(); // Ensure buttons reflect this state
        return;
    }

    // --- UI Updates: Start Loading ---
    dom.aiReportBtn.disabled = true;
    dom.aiReportBtn.classList.add('loading');
    dom.generatePromptBtn.disabled = true; 
    // dom.downloadWordBtn.disabled = true; // Will be handled by updateActionButtonsState if report fails
    ui.syncCloneButtons(); // Sync loading state to clones
    dom.aiReportContainer.innerHTML = "Generating AI report... this may take a moment.";
    dom.aiReportContainer.classList.add('loading');

    try {
        const promptInstructions = generatePromptText();
        if (!promptInstructions) throw new Error("Failed to generate prompt instructions.");

        const top50Json = data.buildTop50Json(state.getFilteredData()); // Use getter
        const prompt = `${promptInstructions}\n\n---\n\nHere is the top 50 summary data in JSON format:\n${JSON.stringify(top50Json, null, 2)}`;

        // --- API Call ---
        const genAI = new window.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" }); // Use a standard model name

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // --- UI Updates: Success ---
        const reportHtml = marked.parse(text);
        dom.aiReportContainer.innerHTML = reportHtml;
        // dom.downloadWordBtn.disabled = false; // Handled by updateActionButtonsState
        // ui.syncCloneButtons(); // Handled by updateActionButtonsState
        // ui.renderAiReportHeader(true); // Handled by updateActionButtonsState
        ui.scrollToSection(dom.aiReportHeader); 

    } catch (error) {
        // --- UI Updates: Error ---
        console.error("LOG: Error during AI report generation:", error);
        let errorMessage = `Error generating report. ${error.message || 'Check console for details.'}`;
        // Provide more specific feedback for common API errors if possible
        if (error.message && error.message.includes('API key not valid')) {
             errorMessage = "Error: Invalid Gemini API Key. Please check the key in config.js.";
        } else if (error.message && error.message.includes('quota')) {
             errorMessage = "Error: API quota exceeded. Please check your Google AI project quotas.";
        }
        dom.aiReportContainer.innerHTML = `<p style='color: red;'>${errorMessage}</p>`;
        // dom.downloadWordBtn.disabled = true; // Handled by updateActionButtonsState
        // ui.syncCloneButtons(); // Handled by updateActionButtonsState
        // ui.renderAiReportHeader(false); // Handled by updateActionButtonsState
    } finally {
        // --- UI Updates: Finish Loading ---
        // const canEnableAi = state.isSdkReady && state.isDataProcessed && state.filtered.length > 0; // Logic now in updateActionButtonsState
        // const canEnablePrompt = state.isDataProcessed && state.filtered.length > 0; // Logic now in updateActionButtonsState
        // dom.aiReportBtn.disabled = !canEnableAi; // Handled by updateActionButtonsState
        // dom.generatePromptBtn.disabled = !canEnablePrompt; // Handled by updateActionButtonsState
        dom.aiReportBtn.classList.remove('loading');
        dom.aiReportContainer.classList.remove('loading');
        updateActionButtonsState(); // Centralized call to update all button states
    }
}


// --- Download Actions ---

// Triggers the download of the currently filtered data (or provided data) as a CSV file.
export function downloadCsv(filename = 'recommendation_summary_filtered.csv', dataToExport = null) {
  // Assumes FileSaver.js (saveAs) is loaded globally
  if (typeof saveAs === 'undefined') {
      alert("Error: FileSaver library not loaded. Cannot download CSV.");
      console.error("LOG: downloadCsv - FileSaver.js (saveAs) not found.");
      return;
  }

  const exportRows = dataToExport || state.getFilteredData(); // Use getter
  if (!exportRows.length) {
      alert("No data available to download.");
      return;
  }

  // Use state.showAllColumns to determine columns
  const columnsToInclude = (state.getShowAllColumns() // Use getter
    ? allColumns
    : allColumns.filter(col => coreColumnKeys.includes(col.key))
  ).concat({ key: 'uid', label: 'UID' }); // Always add UID

  const csvHeaders = columnsToInclude.map(col => col.label);

  const csvRows = exportRows.map(r =>
    columnsToInclude.map(col => {
      let val = r[col.key];
      // ... (Keep formatting logic from original downloadCsv) ...
      if (['revenue','aov','rps','rpc','revPerImp','influencerRev','influencerAov'].includes(col.key))
        return (val ?? 0).toFixed(2);
      else if (col.key === 'upt' || col.key === 'influencerUpt')
        return (val ?? 0).toFixed(0);
      else if (col.key === 'ctr')
        return (val ?? 0).toFixed(2);
      else if (col.key === 'desirability' || col.key === 'desirabilityScore')
        return (val ?? 0).toFixed(2);
      else if (col.key === 'convRate')
        return r.convRateNum ? (r.convRateNum * 100).toFixed(2) : '0.00'; // Use numeric for CSV
      else if (col.key === 'badgeText')
        return r.badgeText || ''; // Use text label for CSV
      else
        return val ?? '';
    })
  );

  // Use utility function for escaping
  const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename); // Use global saveAs
}

// Triggers the download of the AI report and data tables as a Word (.docx) file.
export function downloadWordReport() {
    // Check for dependencies (assuming html-docx-js and FileSaver are global)
    if (typeof htmlDocx === 'undefined' || typeof saveAs === 'undefined') {
        alert('Error: Required libraries for Word download are not loaded (html-docx-js or FileSaver).');
        console.error('LOG: downloadWordReport - html-docx-js or FileSaver not found.');
        updateActionButtonsState();
        return;
    }

    const reportHtml = dom.aiReportContainer.innerHTML;
    // Check for valid report content
    if (!reportHtml || dom.aiReportContainer.classList.contains('loading') || reportHtml.includes("<p style='color: red;'>Error generating report") || reportHtml === 'Report or Prompt will appear here...') {
        alert('No valid AI report content available to download.');
        updateActionButtonsState(); // Ensure button state is correct
        return;
    }

    let summaryTableHtmlForWord = '';
    let insightsTableHtmlForWord = '';
    let definitionsKeyHtmlForWord = '';

    const filteredData = state.getFilteredData(); // Use getter
    const currencySymbol = filteredData.length > 0 ? (filteredData[0].currencySymbol || '') : '';


    // --- Helper function to format cell data for Word ---
    const formatCellForWord = (value, key) => {
        if (value === null || typeof value === 'undefined') return '';
        
        if (key === 'badgeText') { // For main tables, use Unicode from map
            const badgeName = String(value);
            const badgeDef = badgeDefinitions.find(b => b.label === badgeName);
            if (badgeDef && badgeDef.unicode) return badgeDef.unicode;
            return badgeUnicodeMap[badgeName] || badgeName || '-';
        }
        if (['revenue', 'aov', 'rps', 'rpc', 'revPerImp', 'influencerRev', 'influencerAov'].includes(key)) {
            return currencySymbol + (Number(value) || 0).toFixed(2);
        }
        if (key === 'upt' || key === 'influencerUpt') {
            return (Number(value) || 0).toFixed(0);
        }
        if (key === 'ctr' || key === 'desirability' || key === 'desirabilityScore' || key === 'overallPerformanceScore' || key === 'potentialScore') {
            return (Number(value) || 0).toFixed(2);
        }
        if (key === 'convRate') { // Display as percentage
             // Find the original row to access convRateNum for accurate percentage
            const originalRow = filteredData.find(r => r.convRate === value || r.uid === value.uid); // Attempt to match by value or a unique id if available
            if (originalRow && typeof originalRow.convRateNum !== 'undefined') {
                return (originalRow.convRateNum * 100).toFixed(2) + '%';
            }
            // Fallback if direct match or convRateNum isn't found, attempt to parse value if it's already a string like "X.XX%"
            if (typeof value === 'string' && value.includes('%')) return value;
            return (Number(value) || 0).toFixed(2) + '%'; // Fallback, might not be ideal if value isn't numeric rate
        }
        return String(value); // Ensure it's a string
    };

    // --- Generate Summary Table HTML for Word ---
    if (filteredData.length > 0) {
        let columnsToIncludeForSummary = state.getShowAllColumns()
            ? [...allColumns]
            : allColumns.filter(col => coreColumnKeys.includes(col.key));

        const badgeColIndex = columnsToIncludeForSummary.findIndex(c => c.key === 'badgeText');
        if (badgeColIndex > 0) {
            const badgeColumn = columnsToIncludeForSummary.splice(badgeColIndex, 1)[0];
            columnsToIncludeForSummary.unshift(badgeColumn);
        } else if (badgeColIndex === -1 && !state.getShowAllColumns() && coreColumnKeys.includes('badgeText')) {
            const badgeColFromAll = allColumns.find(c => c.key === 'badgeText');
            if (badgeColFromAll && !columnsToIncludeForSummary.find(c => c.key === 'badgeText')) {
                 columnsToIncludeForSummary.unshift(badgeColFromAll);
            }
        }

        let tableRowsHtml = filteredData.map(row => {
            const cellsHtml = columnsToIncludeForSummary.map(col => {
                const cellContent = formatCellForWord(row[col.key], col.key);
                return `<td>${escapeCsvValue(cellContent)}</td>`; // escapeCsvValue might be overly cautious for HTML, but safe.
            }).join('');
            return `<tr>${cellsHtml}</tr>`;
        }).join('');

        const tableHeadersHtml = `<tr>${columnsToIncludeForSummary.map(col => `<th>${escapeCsvValue(col.label)}</th>`).join('')}</tr>`;
        summaryTableHtmlForWord = `<table><thead>${tableHeadersHtml}</thead><tbody>${tableRowsHtml}</tbody></table>`;
    } else {
        summaryTableHtmlForWord = '<p>No summary data available for the current filters.</p>';
    }

    // --- Generate Insights Table HTML for Word ---
    const insightsData = filteredData.filter(r => r.flag);
    if (insightsData.length > 0) {
        let columnsToIncludeForInsights = [...insightsColumns];
        const insightsBadgeColIndex = columnsToIncludeForInsights.findIndex(c => c.key === 'badgeText');

        if (insightsBadgeColIndex > 0) {
            const badgeColumn = columnsToIncludeForInsights.splice(insightsBadgeColIndex, 1)[0];
            columnsToIncludeForInsights.unshift(badgeColumn);
        }

        let tableRowsHtml = insightsData.map(row => {
            const cellsHtml = columnsToIncludeForInsights.map(col => {
                const cellContent = formatCellForWord(row[col.key], col.key);
                return `<td>${escapeCsvValue(cellContent)}</td>`;
            }).join('');
            return `<tr>${cellsHtml}</tr>`;
        }).join('');

        const tableHeadersHtml = `<tr>${columnsToIncludeForInsights.map(col => `<th>${escapeCsvValue(col.label)}</th>`).join('')}</tr>`;
        insightsTableHtmlForWord = `<table><thead>${tableHeadersHtml}</thead><tbody>${tableRowsHtml}</tbody></table>`;
    } else {
        insightsTableHtmlForWord = '<p>No insights data available for the current filters.</p>';
    }

    // --- Get Definitions Key HTML ---
    if (dom.definitionsKeyContainer) {
        // We need to reconstruct the definitions key for Word with appropriate styling,
        // especially ensuring Font Awesome icons are replaced or handled.
        // For simplicity, we'll use the text and Unicode equivalents if available.
        
        let badgesKeyContent = '<h3>Badges Key</h3><ul>';
        badgeDefinitions.forEach(badge => {
            const iconUnicode = badgeUnicodeMap[badge.label] || ''; // Get Unicode if available
            const iconDisplay = iconUnicode ? `${iconUnicode} ` : ''; // Add space if icon exists
            badgesKeyContent += `<li><strong>${iconDisplay}${badge.label}:</strong> ${badge.tip}</li>`;
        });
        badgesKeyContent += '</ul>';

        let calcMetricsKeyContent = '<h3>Calculated Metrics Key</h3><ul>';
        calculatedColumnDefinitions.forEach(col => { // Changed from ui.calculatedColumnDefinitions
            calcMetricsKeyContent += `<li><strong>${col.label}:</strong> ${col.description}</li>`;
        });
        calcMetricsKeyContent += '</ul>';
        definitionsKeyHtmlForWord = `<div class="definitions-key-word">${badgesKeyContent}${calcMetricsKeyContent}</div>`;

    } else {
        definitionsKeyHtmlForWord = '<p>Definitions key not available.</p>';
    }

    const userInputTitle = dom.reportTitleInput && dom.reportTitleInput.value.trim() !== '' ? dom.reportTitleInput.value.trim() : 'Recommendations Insight Report';
    const pageTitle = userInputTitle;
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // --- Generate Full HTML structure for Word doc ---
    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${pageTitle}</title>
            <style>
                body { font-family: sans-serif; line-height: 1.7; padding: 10px; margin: 0 auto; color: #333; font-size: 11pt; }
                h1, h2, h3, h4 { color: #111; margin-top: 1em; margin-bottom: 0.5em; }
                h1 { text-align: center; margin-bottom: 20px; font-size: 18pt; }
                h2 { border-bottom: 2px solid #007bff; padding-bottom: 5px; font-size: 14pt; }
                h3 { border-bottom: 1px solid #eee; padding-bottom: 4px; font-size: 12pt; }
                h4 { font-size: 11pt; color: #555; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 10px; font-size: 10pt; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .ai-report-content h1, .ai-report-content h2, .ai-report-content h3, .ai-report-content h4 { font-family: 'Segoe UI Semibold', Calibri, sans-serif; }
                .ai-report-content h1 { font-size: 18pt; color: #1F4E79; margin-top: 1em; margin-bottom: 0.4em; border-bottom: 1px solid #AEC9E0; padding-bottom: 0.1em; }
                .ai-report-content h2 { font-size: 15pt; color: #2E75B5; margin-top: 0.8em; margin-bottom: 0.3em; }
                .ai-report-content h3 { font-size: 12pt; color: #1F4E79; margin-top: 0.6em; margin-bottom: 0.2em; }
                .ai-report-content p { margin-bottom: 0.6em; line-height: 1.7; }
                .ai-report-content ul, .ai-report-content ol { padding-left: 0.25in; list-style-position: outside; margin-bottom: 0.7em; line-height: 1.7; }
                .ai-report-content li { text-indent: 0; padding-left: 0.25in; margin-bottom: 0.3em; line-height: 1.7; }
                .ai-report-content strong, .ai-report-content b { font-weight: bold; }
                .ai-report-content em, .ai-report-content i { font-style: italic; }
                .ai-report-content code { font-family: 'Consolas', 'Courier New', monospace; background-color: #f5f5f5; padding: 1px 4px; font-size: 10pt; border: 1px solid #e0e0e0; border-radius: 3px; }
                .ai-report-content pre { background-color: #f5f5f5; padding: 10px; border: 1px solid #d0d0d0; border-radius: 4px; font-family: 'Consolas', 'Courier New', monospace; font-size: 9.5pt; white-space: pre-wrap; word-wrap: break-word; margin-bottom: 0.8em; }
                table tbody tr td:first-child { font-size: 12pt; text-align: center; vertical-align: middle; }
                .definitions-key-word { margin-top: 1em; /* Removed padding, border, border-radius */ }
                .definitions-key-word h3 { font-size: 12pt; color: #1F4E79; /* Matched .ai-report-content h3 color */ margin-top: 0.6em; /* Matched .ai-report-content h3 margin */ margin-bottom: 0.2em; /* Matched .ai-report-content h3 margin */ border-bottom: 1px solid #eee; /* Added general h3 border */ padding-bottom: 4px; /* Added general h3 padding */ }
                .definitions-key-word ul { padding-left: 0.25in; list-style-position: outside; list-style-type: disc; margin-bottom: 0.7em; /* Matched .ai-report-content ul */ line-height: 1.7; /* Matched .ai-report-content ul */ }
                .definitions-key-word li { text-indent: 0; padding-left: 0.25in; margin-bottom: 0.3em; /* Matched .ai-report-content li */ line-height: 1.7; /* Matched .ai-report-content li */ }
                a { color: #005A9C; text-decoration: underline; }
                .page-break { page-break-before: always; }

            </style>
        </head>
        <body>
            <h1>${pageTitle}</h1>
            <div class="ai-report-content">
                ${reportHtml}
            </div>

            <div class="page-break"></div>
            <h2>Filtered Data Summary</h2>
            ${summaryTableHtmlForWord}

            <div class="page-break"></div>
            <h2>Insights from Filtered Data</h2>
            ${insightsTableHtmlForWord}
            
            <div class="page-break"></div>
            <h2>Definitions Key</h2>
            ${definitionsKeyHtmlForWord}

        </body>
        </html>`;

    try {
        // Ensure htmlDocx is available (it's checked at the start of the function)
        const converted = htmlDocx.asBlob(fullHtml);
        const filename = `${pageTitle.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_')}_${timestamp}.docx`;
        saveAs(converted, filename); 
    } catch (e) {
        alert('Error generating Word document. Check console for details.');
        console.error('LOG: Error using html-docx-js:', e);
        updateActionButtonsState(); // Ensure button state is correct
    }
}
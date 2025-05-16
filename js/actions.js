const Actions = (() => {
  function updateActionButtonsState() {
    if (!Dom.downloadBtn || !Dom.generatePromptBtn || !Dom.generateAiReportBtn) {
      console.warn("LOG_ACTIONS_UPDATEBUTTONS: One or more DOM elements for buttons not found. Skipping state update.");
      return;
    }

    let summaryHasRows = false;
    if (Dom.summaryContainer) {
      const table = Dom.summaryContainer.querySelector('table');
      if (table) {
        const tbody = table.querySelector('tbody');
        if (tbody && tbody.querySelector('tr')) {
          summaryHasRows = true;
        }
      }
    }
    if (!summaryHasRows && State.getFilteredData && State.getFilteredData().length > 0) {
      summaryHasRows = true;
    }

    Dom.downloadBtn.disabled = !summaryHasRows;
    Dom.generatePromptBtn.disabled = !summaryHasRows;

    if (Config.isAiReportEnabled === false) {
        Dom.generateAiReportBtn.style.display = 'none';
        Dom.manageApiKeyBtn.style.display = 'none';
    } else {
        Dom.generateAiReportBtn.style.display = '';
        Dom.manageApiKeyBtn.style.display = '';
        Dom.generateAiReportBtn.disabled = !summaryHasRows;
    }

    if (Dom.downloadWordBtn) {
      Dom.downloadWordBtn.disabled = !summaryHasRows;
    }

    UI.syncCloneButtons = function(){}; // Remove clone button sync logic
  }

  function handleFile(file) {
    if (!file) {
      // Reset everything on the page
      if (Dom.summaryContainer) Dom.summaryContainer.innerHTML = '';
      if (Dom.insightsContainer) Dom.insightsContainer.innerHTML = '';
      if (Dom.aiReportContainer) Dom.aiReportContainer.innerHTML = '';
      if (Dom.fileNameDisplay) Dom.fileNameDisplay.textContent = 'No file chosen';
      if (Dom.goBtn) Dom.goBtn.disabled = true;
      if (Dom.additionalInstructionsContainer) Dom.additionalInstructionsContainer.style.display = 'block';
      if (Dom.additionalInstructionsTextarea) {
        Dom.additionalInstructionsTextarea.value = '';
        Dom.additionalInstructionsTextarea.disabled = true;
      }
      if (Dom.charCountDisplay) Dom.charCountDisplay.textContent = '0/500';
      if (Dom.reportTitleInput) Dom.reportTitleInput.value = '';
      if (Dom.definitionsKeyContainer) Dom.definitionsKeyContainer.innerHTML = '';
      if (Dom.resultsCount) Dom.resultsCount.textContent = '';
      if (Dom.errorContainer) Dom.errorContainer.innerHTML = '';
      if (Dom.loader) Dom.loader.style.display = 'none';
      if (Dom.aiSummaryDetails) Dom.aiSummaryDetails.open = false;
      State.setDataProcessed(false);
      State.setRows([]);
      State.setFiltered([]);
      State.setSortState('overallPerformanceScore', 'desc');
      State.setShowAllColumns(false);
      State.setStaticBadgesActive(false);
      updateActionButtonsState();
      return;
    }
    if (!file.name.endsWith('.csv')) {
      Dom.fileNameDisplay.textContent = 'Invalid file type (CSV only)';
      Dom.fileNameDisplay.style.color = 'red';
      Dom.goBtn.disabled = true;
      if (Dom.additionalInstructionsContainer) {
        Dom.additionalInstructionsContainer.style.display = 'block';
      }
      if (Dom.additionalInstructionsTextarea) {
        Dom.additionalInstructionsTextarea.value = '';
        Dom.additionalInstructionsTextarea.disabled = true;
      }
      if (Dom.charCountDisplay) {
        Dom.charCountDisplay.textContent = '0/500';
      }
      State.setDataProcessed(false);
      updateActionButtonsState();
      return;
    }
    Dom.fileNameDisplay.textContent = `Selected: ${file.name}`;
    Dom.fileNameDisplay.style.color = 'inherit';
    Dom.goBtn.disabled = false;
    
    if (Dom.additionalInstructionsContainer) {
      Dom.additionalInstructionsContainer.style.display = 'block'; 
    }
    if (Dom.additionalInstructionsTextarea) {
      Dom.additionalInstructionsTextarea.value = ''; 
      Dom.additionalInstructionsTextarea.disabled = false; 
    }
    if (Dom.charCountDisplay) {
      Dom.charCountDisplay.textContent = '0/500';
    }
    
    Dom.summaryContainer.innerHTML = '';
    if (Dom.insightsContainer) {
      Dom.insightsContainer.innerHTML = '';    
    }
    State.setDataProcessed(false);
    updateActionButtonsState();
  }

  function handleAdditionalInstructionsInput() {
    if (Dom.additionalInstructionsTextarea && Dom.charCountDisplay) {
      const maxLength = Dom.additionalInstructionsTextarea.maxLength;
      const currentLength = Dom.additionalInstructionsTextarea.value.length;
      Dom.charCountDisplay.textContent = `${currentLength}/${maxLength}`;
    }
  }

  function generatePromptText() {
    const badgeExplanations = Config.badgeDefinitions.map(b => {
      let iconName = '';
      // Ensure b is an object and b.icon is a string before trying to use it
      if (b && typeof b.icon === 'string') {
        iconName = b.icon.replace('fa-solid fa-', '');
      }
      
      // Ensure b.label and b.tip are strings, default to empty string if not
      const label = (b && b.label) ? String(b.label) : '';
      const tip = (b && b.tip) ? String(b.tip) : '';

      // Sanitize each part
      const sanitizedLabel = Utils.sanitiseTextForPrompt(label);
      const sanitizedIconName = Utils.sanitiseTextForPrompt(iconName); // iconName is derived, less likely to need this but safe
      const sanitizedTip = Utils.sanitiseTextForPrompt(tip);

      return `${sanitizedLabel} (${sanitizedIconName}): ${sanitizedTip}`;
    }).join('\n');

    // Column explanations (similar to badgeExplanations)
    const columnExplanations = (Config.calculatedColumnDefinitions || []).map(col => {
      const label = (col && col.label) ? String(col.label) : '';
      const desc = (col && col.description) ? String(col.description) : '';
      const sanitizedLabel = Utils.sanitiseTextForPrompt(label);
      const sanitizedDesc = Utils.sanitiseTextForPrompt(desc);
      return `${sanitizedLabel}: ${sanitizedDesc}`;
    }).join('\n');

    const sortState = State.getSortState ? State.getSortState() : {};
    const sortInfo = sortState.key ? `sorted by ${sortState.key} ${sortState.dir}` : 'default sorting (Revenue Desc)';
    const filteredData = State.getFilteredData ? State.getFilteredData() : [];
    const currencySymbol = filteredData.length > 0 ? filteredData[0].currencySymbol : '(unknown currency)';
    const rawExtraInstructions = Dom.additionalInstructionsTextarea ? Dom.additionalInstructionsTextarea.value : '';
    const extraInstructions = Utils.sanitiseTextForPrompt(rawExtraInstructions); 
    // Always use all columns for top50 in prompt/AI, regardless of show all metrics
    const top50Json = Data.buildTop50Json && Data.buildTop50Json ? Data.buildTop50Json(filteredData, Config.allColumns) : [];
    const promptWithData = `Here is the top 50 summary data in markdown format:\n${Utils.jsonToMarkdown(top50Json)}`;
    

    console.log("DEBUG: badgeExplanations", badgeExplanations);
    console.log("DEBUG: currencySymbol", currencySymbol);
    console.log("DEBUG: extraInstructions", extraInstructions);
    // Use window.data.buildTop50Json instead of data.buildTop50Json
      const prompt = `
        Act as a Conversion Rate Optimization (CRO) expert analyzing the performance of website recommendation strategies for a business stakeholder. Be insightful and concise, using data to support your conclusions.
        **Analysis Goal:**  
        Produce a data-driven **Markdown** report that explains _what_ the data shows, _why_ those patterns matter, and presents _exact figures_ drawn from the input CSV—so the stakeholder can act immediately.
        ${extraInstructions ? `\n\n**Additional Instructions which you should pay attention to:** ${extraInstructions}` : ''}
        **Context & Data:**  
        - You receive a CSV (or Markdown table directly included) of performance data for recommendation strategies (Experience + Action + Strategy).  
        - Key metrics include:  
          - **Revenue** (£), **AOV** (£), **UPT**, **Conv Rate** (%), **Clicks**, **Impressions**, **Desirability Score** (0–100), **Rev/Imp** (£), **RPS** (£), **RPC** (£), **Influencer Rev** (£).  
            **Badge Meanings:**
            ${badgeExplanations}
            **Column Definitions:**
            ${columnExplanations}
        **Deliverables & Structure:**  
        Use Markdown headings, bullet lists, and small tables. Wherever you reference a metric, include the actual value from the data.

        ## Executive Summary  
        1–2 sentences summarizing the **top two** insights, each citing the specific metric and badge that drove it.

        ## Top Performers  
        - List the **top three** strategies by \`overallPerformanceScore\`.  
        - For each, include a mini-table of its key metrics:

          \`\`\`markdown
          **Strategy:** [Strategy Name]  
          | Metric    | Value           |
          |-----------|-----------------|
          | Revenue   | [${currencySymbol}X,XXX,XXX]    |
          | Conv Rate | [Y.YY%]         |
          | Rev/Imp   | [${currencySymbol}Z.ZZ]         |
          | Badge     | [Badge Name]    |

      ----

       Add one sentence after the table explaining why it excels (e.g. volume + efficiency, premium basket value).

       ## Key Opportunities
        Identify all “Opportunity” and “Hidden Gem” rows.
        For each, list Impressions, Desirability Score, and PotentialScore.
        In one line, explain:
        “With only [Impressions] impressions vs. median [Median Impressions], but a desirability score of [Score], scaling this could unlock incremental revenue.”
        If there are no Opportunity or Hiddeh Gems, use your understanding to offer other opportunities you see in the results.

       ## Underperformers & Risks
        Identify any rows flagged “Needs Review,” “Unengaged,” or those with impressions > [25th percentile] but CTR < 1%.

        For each, list Impressions, CTR, Conv Rate, and one-line recommendation (e.g. “Retire or A/B test alternative content.”).

       ## Actionable Recommendations (Prioritized)
        Provide a numbered list of the top three next steps. For each step include:
        What to do: e.g. “A/B test [Strategy A] vs. [Strategy B] in [Experience X].”
        Why: cite the exact metrics (e.g. “Desirability = [Score], Impressions = [Count], PotentialScore = [Score].”)
        Expected impact: describe the likely direction (e.g. “could boost revenue by 5–10%”).

        Strict instructions:
        Only use the data provided; do not invent or estimate values outside of computed percentiles.
        Always present actual numbers drawn from the CSV.
        Stick to the Markdown structure above and a semi-formal business tone.
        Do not include any content outside these sections.
        Round numbers over 1 to the nearest whole number, otherwise 2 dp.
        Output in Markdown
	Always use long names for badges or columns (e.g. overallPerformanceScore = Overall Performance Score and strongconv =  Strong Conversion)
        Do not include AI Report in the page
	
        **Do not include the raw data / top 50 summary data in the repsponse.

        ${promptWithData};
        `;
    return prompt;
  }

  function displayPrompt() {
    if (!State.getFilteredData || !State.getFilteredData().length) {
      console.warn("displayPrompt: No filtered data available. Prompt not displayed.");
      if (Dom.aiReportContainer) {
        Dom.aiReportContainer.innerHTML = "<p style='color: orange;'>Could not generate prompt. Process data first.</p>";
      }
      updateActionButtonsState();
      return;
    }

    const basePrompt = generatePromptText();
    // Only show the Markdown prompt, no JSON data block
    const fullPromptForDisplay = basePrompt;

    if (Dom.aiReportContainer) {
      Dom.aiReportContainer.innerHTML = `
        <h2>Copy Full Prompt for AI</h2>
        <p>The following text includes the instructional prompt. You can copy and paste this into an external AI tool if you prefer not to use the integrated "Generate AI Report" feature.</p>
        <pre style="white-space: pre-wrap; word-wrap: break-word; background-color: #f0f0f0; border: 1px solid #ccc; padding: 10px; max-height: 400px; overflow-y: auto;" id="promptTextForCopy">${Utils.sanitiseTextForPrompt(fullPromptForDisplay)}</pre>
      `;
      if (UI && UI.updateAiReportActionsVisibility) {
        UI.updateAiReportActionsVisibility('prompt');
      }
      if (UI && UI.scrollToSection && Dom.aiReportHeader) {
        UI.scrollToSection(Dom.aiReportHeader);
      }
      // Ensure AI summary details is open
      if (Dom.aiSummaryDetails) {
        Dom.aiSummaryDetails.open = true;
      }
    } else {
      console.error("displayPrompt: Dom.aiReportContainer not found.");
    }
    updateActionButtonsState();
  }

  async function generateAiReport() {
    if (!State.getFilteredData || !State.getFilteredData().length) {
      console.warn("generateAiReport: No filtered data available.");
      if (Dom.aiReportContainer) {
        Dom.aiReportContainer.innerHTML = "<p style='color: orange;'>Could not generate AI report. Process data first.</p>";
      }
      updateActionButtonsState();
      return;
    }

    const apiKey = AIService.getApiKey();
    if (!apiKey) {
      AIService.requestApiKey(); 
      if (Dom.aiReportContainer) {
          Dom.aiReportContainer.innerHTML = "<p style='color: #ff9800;'>API Key needed. Please enter your Gemini API Key when prompted.</p>";
      }
      return;
    }

    if (Dom.aiReportContainer) {
      Dom.aiReportContainer.innerHTML = '<div class="loader-container"><div class="loader"></div><p>Generating AI report, please wait...</p></div>';
      if (UI && UI.updateAiReportActionsVisibility) {
        UI.updateAiReportActionsVisibility('none'); 
      }
      // Ensure spinner is rendered before starting async AI call
      await new Promise(requestAnimationFrame);
    }

    try {
      const basePrompt = generatePromptText();
      const fullPrompt = basePrompt;
      const aiMarkdownResponse = await AIService.callGemini(apiKey, fullPrompt);

      if (Dom.aiReportContainer) {
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
          // Preprocess AI response: remove leading/trailing code fences (``` or ```markdown)
          let aiText = aiMarkdownResponse.trim();
          aiText = aiText.replace(/^```(?:markdown)?\s*/i, '').replace(/\s*```$/, '');

          // --- IMPROVED FIX: Ensure blank line after tables before any non-table content ---
          // Insert a blank line after any table row (line ending with |) that is immediately followed by a line that does NOT start with |, -, or ` (code block)
          aiText = aiText.replace(/^(\|.*\|.*)\n(?![|\-`\s])/gm, '$1\n\n$2');

          let rawHtml = marked.parse(aiText);
          console.log("DEBUG: rawHtml", rawHtml);
          // Remove <pre> and <code> tags that wrap the entire report (but not inline or code blocks)
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = rawHtml.trim();
          if (tempDiv.childNodes.length === 1 && tempDiv.firstChild.nodeName === 'PRE') {
            const pre = tempDiv.firstChild;
            if (pre.childNodes.length === 1 && pre.firstChild.nodeName === 'CODE') {
              tempDiv.innerHTML = pre.firstChild.innerHTML;
            } else {
              tempDiv.innerHTML = pre.innerHTML;
            }
            rawHtml = tempDiv.innerHTML;
          }
          // If the AI response is already HTML and contains <body>, extract only the body content
          let bodyContent = '';
          const htmlMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (htmlMatch && htmlMatch[1]) {
            bodyContent = htmlMatch[1];
          } else {
            bodyContent = rawHtml;
          }
          // Always sanitize and set as HTML
          Dom.aiReportContainer.innerHTML = DOMPurify.sanitize(bodyContent, { USE_PROFILES: { html: true } });
        } else {
          Dom.aiReportContainer.innerHTML = `<div style="color: red;">AI report could not be rendered as HTML. Please ensure marked.js and DOMPurify are loaded.</div><div style="white-space: pre-wrap; word-wrap: break-word; color: #333; background: #f8d7da; border: 1px solid #f5c2c7; padding: 10px;">${Utils.sanitiseTextForPrompt(aiMarkdownResponse)}</div>`;
        }
        if (UI && UI.updateAiReportActionsVisibility) {
          UI.updateAiReportActionsVisibility('report');
        }
        // Ensure AI summary details is open
        if (Dom.aiSummaryDetails) {
          Dom.aiSummaryDetails.open = true;
        }
      }
    } catch (error) {
      console.error("Error generating AI report:", error);
      if (Dom.aiReportContainer) {
        let errorMessage = "Failed to generate AI report.";
        if (typeof error === 'string') {
            errorMessage += ` <br><small>${Utils.sanitiseTextForPrompt(error)}</small>`;
        } else if (error && error.message) {
            errorMessage += ` <br><small>${Utils.sanitiseTextForPrompt(error.message)}</small>`;
        }
        Dom.aiReportContainer.innerHTML = `<p style='color: red;'>${errorMessage}</p>`;
        if (UI && UI.updateAiReportActionsVisibility) {
          UI.updateAiReportActionsVisibility('none');
        }
      }
    } finally {
      updateActionButtonsState();
    }
  }

  function _generateFilename(baseName, suffix, extension) {
    const cleanBase = baseName.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
    const dateStamp = new Date().toISOString().split('T')[0];
    return `${cleanBase}_${suffix}_${dateStamp}.${extension}`;
  }

  function _formatCellForWord(value, key, currencySymbol, allFilteredData) {
    if (value === null || typeof value === 'undefined') return '';

    if (key === 'badgeText') {
      // Assuming 'value' here is the badge KEY after previous changes, not the label.
      const badgeKey = String(value || ''); 
      if (!badgeKey) return '';

      // Use the badgeDef's wordBgColor and wordIconColor for Word export, matching the website
      const badgeDef = Config.badgeDefinitions.find(b => b.key === badgeKey); // Changed from b.label to b.key
      if (badgeDef && badgeDef.unicode) {
        // Always use the same colors as the website for Word export
        return `<span style="background-color:${badgeDef.wordBgColor};color:${badgeDef.wordIconColor};padding:2px 8px;border-radius:6px;display:inline-block;min-width:1.5em;text-align:center;">${badgeDef.unicode}</span>`;
      }
      return ''; 
    }    if (key === 'overallPerformanceScore' || key === 'potentialScore') {
      const num = Number(value) || 0;
      return num >= 1 ? Math.round(num).toString() : num.toFixed(2);
    }
    if (['revenue', 'aov', 'rps', 'rpc', 'revPerImp', 'influencerRev', 'influencerAov'].includes(key)) {
      const numberValue = Number(value) || 0;
      return currencySymbol + (numberValue >= 1 ? Math.round(numberValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : numberValue.toFixed(2));
    }
    if (key === 'upt' || key === 'influencerUpt') {
      const num = Number(value) || 0;
      return num >= 1 ? Math.round(num).toString() : num.toFixed(2);
    }
    if (['ctr', 'desirability', 'desirabilityScore'].includes(key)) {
      const num = Number(value) || 0;
      return num >= 1 ? Math.round(num).toString() : num.toFixed(2);
    }
    if (key === 'convRate') {
      const originalRow = allFilteredData.find(r => r.convRate === value || (r.uid && value && typeof value === 'object' && r.uid === value.uid));
      if (originalRow && typeof originalRow.convRateNum !== 'undefined') {
        return (originalRow.convRateNum * 100).toFixed(2) + '%';
      }
      if (typeof value === 'string' && value.includes('%')) return value;
      return (Number(value) || 0).toFixed(2) + '%';
    }
    if (key === 'clicks' || key === 'imps') {
        return Number(value || 0).toLocaleString();
    }
    return Utils.escapeCsvValue(String(value));
  }

  function _generateWordTableHtml(dataRows, columnConfig, currencySymbol, allFilteredData, tableTitle = '') {
    if (!dataRows || dataRows.length === 0) {
      return tableTitle ? `<h2>${Utils.escapeCsvValue(tableTitle)}</h2><p>No data available for this section.</p>` : '<p>No data available.</p>';
    }

    const tableHeadersHtml = `<tr>${columnConfig.map(col => `<th>${Utils.escapeCsvValue(col.label)}</th>`).join('')}</tr>`;
    const tableRowsHtml = dataRows.map(row => {
      const cellsHtml = columnConfig.map(col => {
        const cellValue = row[col.key]; // This 'cellValue' for 'badgeText' column should be the badge KEY
        const formattedContent = _formatCellForWord(cellValue, col.key, currencySymbol, allFilteredData);
        if (col.key === 'badgeText') {
          const badgeDef = Config.badgeDefinitions.find(b => b.key === cellValue); // Changed from b.label to b.key
          if (badgeDef && badgeDef.wordBgColor && badgeDef.wordIconColor) {
            return `<td style="background-color:${badgeDef.wordBgColor}; color:${badgeDef.wordIconColor}; text-align:center; font-size:14pt;">${formattedContent}</td>`;
          }
          return `<td style="text-align:center; font-size:14pt;">${formattedContent}</td>`; 
        }
        return `<td>${formattedContent}</td>`;
      }).join('');
      return `<tr>${cellsHtml}</tr>`;
    }).join('');

    const titleHtml = tableTitle ? `<h2>${Utils.escapeCsvValue(tableTitle)}</h2>` : '';
    return `${titleHtml}<table>${tableHeadersHtml}${tableRowsHtml}</table>`;
  }

  function _generateDefinitionsKeyHtmlForWord() {
    if (!Dom.definitionsKeyContainer || !Config.badgeDefinitions || !Config.calculatedColumnDefinitions) {
      return '<p>Definitions key not available.</p>';
    }
    let badgesKeyContent = '<h3>Badges Key</h3><ul>';
    Config.badgeDefinitions.forEach(badge => {
      const iconUnicode = badge.unicode || '';
      const iconDisplay = iconUnicode ? `${iconUnicode} ` : '';
      badgesKeyContent += `<li><strong>${iconDisplay}${Utils.escapeCsvValue(badge.label)}:</strong> ${Utils.escapeCsvValue(badge.tip)}`;
      if (badge.usage) {
        badgesKeyContent += `<br><em>Usage:</em> ${Utils.escapeCsvValue(badge.usage)}`;
      }
      badgesKeyContent += '</li>';
    });
    badgesKeyContent += '</ul>';

    let calcMetricsKeyContent = '<h3>Calculated Metrics Key</h3><ul>';
    Config.calculatedColumnDefinitions.forEach(col => {
      calcMetricsKeyContent += `<li><strong>${Utils.escapeCsvValue(col.label)}:</strong> ${Utils.escapeCsvValue(col.description)}`;
      if (col.usage) {
        calcMetricsKeyContent += `<br><em>Usage:</em> ${Utils.escapeCsvValue(col.usage)}`;
      }
      calcMetricsKeyContent += '</li>';
    });
    calcMetricsKeyContent += '</ul>';
    return `<div class="definitions-key-word">${badgesKeyContent}${calcMetricsKeyContent}</div>`;
  }

  function _getWordDocumentBaseHtml(pageTitle, bodyContentHtml) {
    const logoDataUrl = "data:image/jpeg;base64,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";
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${Utils.escapeCsvValue(pageTitle)}</title>
        <style>
            body { font-family: 'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; line-height:1.6; padding:5px; margin:0 auto; color:#333333; font-size:11pt; background-color:#ffffff; }
            h1 { font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; text-align:center; margin-bottom:20px; font-size:22pt; color:#333333; border-bottom:1px solid #cccccc; padding-bottom:0.2em; }
            h2 { font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; border-bottom:2px solid #8566AB; padding-bottom:5px; font-size:16pt; color:#333333; margin-top:1.8em; margin-bottom:1em; }
            h3 { font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; border-bottom:1px solid #f0f0f0; padding-bottom:4px; font-size:13pt; color:#333333; margin-top:1.5em; margin-bottom:0.8em; }
            table { border-collapse:collapse; width: fit-content; margin-bottom:20px; font-size:9pt; }
            th, td { border:1px solid #cccccc; padding:6px; text-align:left; vertical-align:top; }
            th { background-color:#f0f0f0; font-weight:bold; font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; color:#333333; }
            td:first-child { font-size:11pt; text-align:center; }
            .ai-report-content-wrapper h1 { font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; font-size:20pt; color:#333333; margin-top:1.5em; margin-bottom:0.5em; border-bottom:1px solid #cccccc; padding-bottom:0.2em; text-align:left; }
            .ai-report-content-wrapper h2 { font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; font-size:15pt; color:#333333; margin-top:1.2em; margin-bottom:0.4em; border-bottom:1px solid #f0f0f0; padding-bottom:0.2em; }
            .ai-report-content-wrapper h3 { font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; font-size:12pt; color:#333333; margin-top:1em; margin-bottom:0.3em; font-weight:bold; border-bottom:none; }
            .ai-report-content-wrapper h4 { font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; font-size:11pt; color:#333333; font-weight:bold; }
            .ai-report-content-wrapper p { margin-bottom:0.8em; line-height:1.5; }
            .ai-report-content-wrapper ul, .ai-report-content-wrapper ol { padding-left:25px; list-style-position:outside; margin-bottom:0.8em; line-height:1.5; }
            .ai-report-content-wrapper li { margin-bottom:0.4em; }
            .ai-report-content-wrapper strong, .ai-report-content-wrapper b { font-weight:bold; color:#333333; }
            .ai-report-content-wrapper em, .ai-report-content-wrapper i { font-style:italic; }
            .ai-report-content-wrapper code { font-family:'IBM Plex Mono',monospace; padding:2px 5px; font-size:9pt; border:1px solid #cccccc; border-radius:4px; }
            .ai-report-content-wrapper pre { padding:12px; border:1px solid #cccccc; border-radius:4px; font-family:'IBM Plex Mono',monospace; font-size:9pt; white-space:pre-wrap; word-wrap:break-word; margin-bottom:1em; }
            .definitions-key-word { margin-top:2em; padding:15px; border:1px solid #f0f0f0; border-radius:8px; }
            .definitions-key-word h3 { font-family:'Montserrat','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif; font-size:13pt; color:#333333; margin-top:0.5em; margin-bottom:0.5em; border-bottom:1px solid #cccccc; padding-bottom:4px; }
            .definitions-key-word ul { padding-left:20px; list-style-position:outside; list-style-type:disc; margin-bottom:0.8em; line-height:1.5; }
            .definitions-key-word li { margin-bottom:0.4em; }
            .page-break { page-break-before:always; }
            @media print { .page-break { break-before:always; } }


        </style>
      </head>
      <body>
        <p style="text-align:right;height:40px;margin-bottom:10px;" ><img width="255" height="42" src="${logoDataUrl}" alt="Monetate Logo" id="monetateLogo"></p>
        ${bodyContentHtml}
      </body>
      </html>`;
  }
  // --- Download Actions ---
  function downloadCsv(filename = 'recommendation_summary_filtered.csv', dataToExport = null) {
    if (typeof saveAs === 'undefined') {
      alert("Error: FileSaver library not loaded. Cannot download CSV.");
      console.error("downloadCsv - FileSaver.js (saveAs) not found.");
      return;
    }

    const exportRows = dataToExport || State.getFilteredData(); 
    if (!exportRows || !exportRows.length) {
      alert("No data available to download.");
      return;
    }

    let finalFilename = filename; 

    if (filename === 'recommendation_summary_filtered.csv' && dataToExport === null) {
        const reportTitle = Dom.reportTitleInput && Dom.reportTitleInput.value.trim() !== '' 
                            ? Dom.reportTitleInput.value.trim().replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_') 
                            : 'report';
        const dateStamp = new Date().toISOString().split('T')[0];
        finalFilename = `${reportTitle}_recommendation_insights_${dateStamp}.csv`;
    }

    const columnsToInclude = State.getShowAllColumns()
      ? Config.allColumns
      : Config.allColumns.filter(col => Config.coreColumnKeys.includes(col.key));

    const csvHeaders = columnsToInclude.map(col => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = col.label;
      return tempDiv.textContent || tempDiv.innerText || "";
    });

    const csvRows = exportRows.map(r =>
      columnsToInclude.map(col => {
        let val = r[col.key];
        if (['revenue','aov','rps','rpc','revPerImp','influencerRev','influencerAov'].includes(col.key))
          return (val ?? 0).toFixed(2);
        else if (col.key === 'upt' || col.key === 'influencerUpt')
          return (val ?? 0).toFixed(0);
        else if (col.key === 'ctr')
          return (val ?? 0).toFixed(2);
        else if (col.key === 'desirability' || col.key === 'desirabilityScore')
          return (val ?? 0).toFixed(2);
        else if (col.key === 'convRate')
          return r.convRateNum ? (r.convRateNum * 100).toFixed(2) : '0.00';
        else if (col.key === 'badgeText')
          return r.badgeText || '';
        else
          return val ?? '';
      })
    );

    const csvContent = [
      csvHeaders.map(Utils.escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(Utils.escapeCsvValue).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, finalFilename);
  }

  function copyToClipboard(text, successMessage, failureMessage) {
    navigator.clipboard.writeText(text).then(() => {
        alert(successMessage || 'Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert(failureMessage || 'Failed to copy to clipboard. See console for details.');
    });
  }

  function handleCopyPromptText() {
    const promptTextElement = document.getElementById('promptTextForCopy');
    if (promptTextElement && promptTextElement.textContent) {
        copyToClipboard(promptTextElement.textContent, 'Prompt text copied to clipboard!', 'Failed to copy prompt text.');
    } else {
        alert('Could not find prompt text to copy.');
    }
  }

  function handleCopyAiReport() {
    if (Dom.aiReportContainer) {
        let reportContent = Dom.aiReportContainer.innerHTML;
        if (typeof DOMPurify !== 'undefined') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = reportContent;
            reportContent = tempDiv.textContent || tempDiv.innerText || "";
        }
        copyToClipboard(reportContent, 'AI report content copied to clipboard!', 'Failed to copy AI report content.');
    } else {
        alert('Could not find AI report content to copy.');
    }
  }

  function handleDownloadPromptDataCsv() {
    const filteredData = State.getFilteredData ? State.getFilteredData() : [];
    if (filteredData.length > 0) {
        const finalFilename = _generateFilename('prompt', 'data', 'csv');
        downloadCsv(finalFilename, filteredData);
        
    } else {
        alert("No data available to download for the prompt source.");
    }
  }

  function handleDownloadAiSourceDataCsv() {
    const filteredData = State.getFilteredData ? State.getFilteredData() : [];
    if (filteredData.length > 0) {
        const finalFilename = _generateFilename('ai_report_source', 'data', 'csv');
        downloadCsv(finalFilename, filteredData);
    } else {
        alert("No data available to download for the AI report source.");
    }
  }

  function downloadWordReport(includeTablesOnly = false) {
    if (typeof saveAs === 'undefined' || typeof htmlDocx === 'undefined') {
      alert("Error: Required libraries (FileSaver, html-docx-js) not loaded. Cannot download Word report.");
      console.error("downloadWordReport - FileSaver.js or html-docx.js not found.");
      return;
    }

    const reportTitleInput = Dom.reportTitleInput ? Dom.reportTitleInput.value.trim() : 'Recommendation Insights Report';
    const pageTitle = reportTitleInput || 'Recommendation Insights Report';
    let bodyContentHtml = `<h1>${Utils.escapeCsvValue(pageTitle)}</h1>`;

    // --- Determine what to include ---
    let hasPrompt = false;
    let hasAiReport = false;
    let promptHtml = '';
    let aiReportHtmlOutput = '';

    // Check for prompt (prompt is shown in aiReportContainer as <pre id="promptTextForCopy">)
    if (Dom.aiReportContainer && Dom.aiReportContainer.querySelector('#promptTextForCopy')) {
      const promptText = Dom.aiReportContainer.querySelector('#promptTextForCopy').textContent;
      if (promptText && promptText.trim().length > 0) {
        hasPrompt = true;
        promptHtml = `<div class="ai-report-content-wrapper"><h2>Prompt</h2><pre>${Utils.escapeCsvValue(promptText)}</pre></div>`;
      }
    }

    // Check for AI report (look for h2, h3, p, ul, ol, pre, table, but not just the prompt)
    if (Dom.aiReportContainer && Dom.aiReportContainer.innerHTML.trim() !== '') {
      const aiContainerText = Dom.aiReportContainer.textContent || "";
      const isPlaceholder = aiContainerText.includes("Generating AI report, please wait...") ||
                            aiContainerText.includes("Could not generate AI report.") ||
                            aiContainerText.includes("Failed to generate AI report.") ||
                            aiContainerText.includes("API Key needed.");
      // If not placeholder and has real content (not just prompt)
      if (!isPlaceholder && Dom.aiReportContainer.querySelector('h2, h3, p, ul, ol, pre, table')) {
        // If the only content is the prompt, don't count as AI report
        if (!Dom.aiReportContainer.querySelector('#promptTextForCopy')) {
          hasAiReport = true;
          aiReportHtmlOutput = `<div class="ai-report-content-wrapper"><h2>AI Report</h2>${Dom.aiReportContainer.innerHTML}</div>`;
        } else if (Dom.aiReportContainer.children.length > 1) {
          // If both prompt and report are present
          hasAiReport = true;
          aiReportHtmlOutput = `<div class="ai-report-content-wrapper"><h2>AI Report</h2>${Dom.aiReportContainer.innerHTML}</div>`;
        }
      }
    }

    // --- Data Table and Definitions ---
    const filteredData = State.getFilteredData ? State.getFilteredData() : [];
    const currencySymbol = filteredData.length > 0 && filteredData[0].currencySymbol ? filteredData[0].currencySymbol : '$';
    // Always use only core columns for Word export, regardless of show all metrics
    const columnsForWordTable = Config.allColumns.filter(col => Config.coreColumnKeys.includes(col.key));
    const summaryTableHtml = _generateWordTableHtml(
        filteredData,
        columnsForWordTable, 
        currencySymbol,
        filteredData,
        'Recommendation Summary Table'
    );
    const definitionsHtml = _generateDefinitionsKeyHtmlForWord();

    // --- Compose final bodyContentHtml based on what is present ---
    if (hasAiReport) {
      // AI report, then definitions, then data table
      bodyContentHtml += aiReportHtmlOutput;
      bodyContentHtml += definitionsHtml;
      bodyContentHtml += summaryTableHtml;
    } else if (hasPrompt) {
      // Prompt, then tables, then definitions
      bodyContentHtml += promptHtml;
      bodyContentHtml += summaryTableHtml;
      bodyContentHtml += definitionsHtml;
    } else {
      // Only tables and definitions
      bodyContentHtml += summaryTableHtml;
      bodyContentHtml += definitionsHtml;
    }

    const fullHtml = _getWordDocumentBaseHtml(pageTitle, bodyContentHtml);
    const filenameSuffix = includeTablesOnly ? 'tables_only' : 'full_report';
    const finalFilename = _generateFilename(reportTitleInput || 'insights_report', filenameSuffix, 'docx');
    
    try {
      const converted = htmlDocx.asBlob(fullHtml,{  
    margins: {
    top: 720,
    right: 720,
    bottom: 720,
    left: 720,
    header: 720,
    footer: 720,
    gutter: 0
  }});
      saveAs(converted, finalFilename);
    } catch (error) {
      console.error("Error generating Word document:", error);
      alert("Failed to generate Word document. Check console for details.");
    }
  }

  function downloadWordTablesOnly() {
    downloadWordReport(true);
  }

  function fetchDataAndUpdateState(url) {
    if (!url) {
      console.error("LOG_ACTIONS_FETCH_ERROR: URL is not provided.");
      Dom.hideElement(Dom.loader);
      Dom.displayError("URL is not provided. Please check the configuration.");
      return;
    }

    Dom.showElement(Dom.loader);
    Dom.hideError();

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data || !data.recs) {
          console.warn("LOG_ACTIONS_FETCH_WARN: Data or recs not found in response:", data);
          Dom.displayError("No recommendations data found in the response.");
          State.setRows([]);
        } else {
          State.setRows(data.recs);
        }
        State.setDataProcessed(true);
        Dom.renderTable(State.getFilteredData());
        Dom.updateResultsCount(State.getFilteredData().length);
        Dom.hideElement(Dom.loader);
      })
      .catch(error => {
        console.error("LOG_ACTIONS_FETCH_ERROR: Error fetching or processing data:", error);
        Dom.hideElement(Dom.loader);
        Dom.displayError(`Failed to fetch data: ${error.message}`);
        State.setRows([]);
        State.setDataProcessed(true);
        Dom.renderTable(State.getFilteredData());
        Dom.updateResultsCount(0);
      });
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredData = State.getRawData().filter(row => {
      return Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm)
      );
    });
    State.setFiltered(filteredData);
    Dom.renderTable(State.getFilteredData());
    Dom.updateResultsCount(filteredData.length);
  }

  function handleSort(key) {
    const currentSortState = State.getSortState();
    let direction = 'asc';
    if (currentSortState.key === key && currentSortState.dir === 'asc') {
      direction = 'desc';
    }
    State.setSortState(key, direction);
    const sortedData = Sorter.sortData(State.getFilteredData(), key, direction);
    State.setFiltered(sortedData);
    Dom.renderTable(State.getFilteredData());
    Dom.updateSortIndicators(key, direction);
  }

  function handleToggleColumns() {
    const newShowAllState = !State.getShowAllColumns();
    State.setShowAllColumns(newShowAllState);
    Dom.renderTable(State.getFilteredData());
    Dom.toggleColumnButtonText(newShowAllState);
  }

  function handleExportData() {
    const dataToExport = State.getFilteredData();
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data to export.");
      return;
    }
    Exporter.exportToCSV(dataToExport, 'recommendations_export.csv');
  }

  function handleReset() {
    const defaultSortKey = 'overallPerformanceScore';
    const defaultSortDir = 'desc';

    document.getElementById('search-input').value = '';
    State.setFiltered(State.getRawData());
    State.setSortState(defaultSortKey, defaultSortDir);
    const sortedData = Sorter.sortData(State.getFilteredData(), defaultSortKey, defaultSortDir);
    State.setFiltered(sortedData);

    if (State.getShowAllColumns()) {
      handleToggleColumns();
    }

    Dom.renderTable(State.getFilteredData());
    Dom.updateResultsCount(State.getFilteredData().length);
    Dom.updateSortIndicators(defaultSortKey, defaultSortDir);
    Dom.hideError();
    console.log("LOG_ACTIONS_RESET: Application reset to initial state.");
  }

  function handleToggleStaticBadges() {
    const isActive = !State.getStaticBadgesActive();
    State.setStaticBadgesActive(isActive);
    Dom.renderTable(State.getFilteredData());
    Dom.updateStaticBadgesButton(isActive);
    console.log(`LOG_ACTIONS_STATIC_BADGES: Static badges toggled ${isActive ? 'on' : 'off'}.`);
  }


  function initEventListeners() {
    const searchInput = document.getElementById('search-input');
    const toggleColumnsButton = document.getElementById('toggle-columns-btn');
    const exportButton = document.getElementById('export-btn');
    const resetButton = document.getElementById('reset-btn');
    const staticBadgesButton = document.getElementById('static-badges-btn');

    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    } else {
      console.warn("LOG_ACTIONS_INIT_WARN: Search input not found.");
    }

    if (toggleColumnsButton) {
      toggleColumnsButton.addEventListener('click', handleToggleColumns);
    } else {
      console.warn("LOG_ACTIONS_INIT_WARN: Toggle columns button not found.");
    }

    if (exportButton) {
      exportButton.addEventListener('click', handleExportData);
    } else {
      console.warn("LOG_ACTIONS_INIT_WARN: Export button not found.");
    }

    if (resetButton) {
      resetButton.addEventListener('click', handleReset);
    } else {
      console.warn("LOG_ACTIONS_INIT_WARN: Reset button not found.");
    }

    if (staticBadgesButton) {
      staticBadgesButton.addEventListener('click', handleToggleStaticBadges);
    } else {
      console.warn("LOG_ACTIONS_INIT_WARN: Static badges button not found.");
    }

    const summaryTable = Dom.getSummaryTable();
    if (summaryTable) {
      summaryTable.addEventListener('click', (event) => {
        const headerCell = event.target.closest('th');
        if (headerCell && headerCell.dataset.sortKey) {
          handleSort(headerCell.dataset.sortKey);
        }
      });
    } else {
      console.warn("LOG_ACTIONS_INIT_WARN: Summary table not found for attaching sort listener.");
    }
  }

  // Public API
  return {
    updateActionButtonsState,
    handleFile,
    handleAdditionalInstructionsInput,
    generatePromptText,
    displayPrompt,
    generateAiReport,
    downloadCsv,
    downloadWordReport,
    downloadWordTablesOnly,
    handleCopyPromptText,
    handleCopyAiReport,
    handleDownloadPromptDataCsv,
    handleDownloadAiSourceDataCsv,
    fetchDataAndUpdateState,
    handleSearch,
    handleSort,
    handleToggleColumns,
    handleExportData,
    handleReset,
    handleToggleStaticBadges,
    initEventListeners
  };
})();

window.Actions = Actions;
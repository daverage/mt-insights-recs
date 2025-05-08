import * as state from './state.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import { normalise, cleanNumber, getPercentile, showError } from './utils.js';
import { badgeDefinitions, currencySymbolMap } from './config.js';
import { keyMap } from './config.js';

// --- Data Processing ---

/**
 * Parses the CSV file, maps data, calculates metrics, assigns initial badges, and updates UI.
 * @returns {Promise<void>}
 */
export async function processData() {
  const file = dom.fileInput.files[0];
  if (!file) return;

  dom.goBtn.disabled = true;
  dom.goBtn.classList.add('loading');
  state.setDataProcessed(false);

  try {
      const text = await file.text();
      // Assumes PapaParse is loaded globally
      if (typeof Papa === 'undefined') {
          throw new Error("PapaParse library is not loaded.");
      }
      const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true });

      if (parseResult.errors.length > 0) {
          console.error("LOG: CSV Parsing Errors:", parseResult.errors);
          throw new Error(`CSV parsing error: ${parseResult.errors[0].message} on row ${parseResult.errors[0].row}`);
      }
      const rawData = parseResult.data;

      if (rawData.length > 0) {
      }

      // --- Data Mapping ---
      const mappedRows = rawData.map(r => {
          // --- !! IMPORTANT: Verify these field names match your CSV headers exactly !! ---
          const revenue = cleanNumber(r['Cart Revenue (Purchased Clicked Recommendation)']);
          const currencyCode = normalise(r['Currency']);
          const currencySymbol = currencySymbolMap[currencyCode.toUpperCase()] || currencyCode;
          const imps = cleanNumber(r['Impressions']);
          const clicks = cleanNumber(r['Clickthroughs']);
          const aov = cleanNumber(r['Average Order Value (AOV) - (Purchased Clicked Recommendation)']);
          const upt = cleanNumber(r['Units Per Transaction (UPT) - (Purchased Clicked Recommendation)']);
          
          const experienceNameFromCSV = normalise(r['Name']);
          const experienceNameForDisplay = normalise(r['Name']);
          const actionName = normalise(r['Action Label']);
          const actionStrategyFull = normalise(r['Action Strategy']);
          const recAlgorithm = normalise(r['Rec Algorithm']);

          let actionIdDerived = ''; // For existing actionUrl if needed
          const actionStrategyPartsForId = actionStrategyFull.split(' - ');
          if (actionStrategyPartsForId.length > 0 && !isNaN(parseInt(actionStrategyPartsForId[0].trim()))) {
              actionIdDerived = actionStrategyPartsForId[0].trim();
          }
          
          let strategyForReport = recAlgorithm;
          const actionStrategyParts = actionStrategyFull.split(' - ');
          if (actionStrategyParts.length > 1) {
              strategyForReport = actionStrategyParts.slice(1).join(' - ').trim();
          }
          if (!strategyForReport && recAlgorithm) {
              strategyForReport = recAlgorithm;
          } else if (!strategyForReport && !recAlgorithm) {
              strategyForReport = 'Unknown Strategy';
          }

          const totalSessions = cleanNumber(r['Total Sessions']);
          const convRateNum = totalSessions > 0 ? cleanNumber(r['Converted Sessions']) / totalSessions : 0;
          const rps = totalSessions > 0 ? cleanNumber(r['Total Revenue']) / totalSessions : 0;
          const ctr = imps > 0 ? (clicks / imps) * 1000 : 0;
          const rpc = clicks > 0 ? revenue / clicks : 0;
          //const desirability = (ctr * 0.4) + (rpc * 0.6);
          //const rpc = clicks > 0 ? revenue / clicks : 0;
          const desirability = (rpc * 0.7) + (convRateNum * 0.3);
          const influencerRev = cleanNumber(r['Cart Revenue (Clicked but Purchased Other)']);
          const influencerAov = cleanNumber(r['Average Order Value (AOV) - (Clicked but Purchased Other)']);
          const influencerUpt = cleanNumber(r['Units Per Transaction (UPT) - (Clicked but Purchased Other)']);
          const experienceId = normalise(r['Experience ID']);
          const campaignId = normalise(r['Campaign ID']);
          const actionIdFromColumn = normalise(r['Action ID']);
          const revPerImp = imps > 0 ? revenue / imps : 0;
          const uid = `${experienceId}-${actionStrategyFull}-${recAlgorithm}`;

          // --- URL Construction ---
          // PapaParse makes the first "Name" column available as r['Name'] (actualExperienceName)
          // The customer instance name is read from the "Instance Name" column (e.g., 'a-e7e73c1d')
          const customerInstanceName = normalise(r['Instance Name']); 
          const monetateInstance = normalise(r['Instance']); // e.g., 'p'
          const monetateDomain = normalise(r['Domain']); // e.g., 'uk.nespresso.com'
          
          let NewExperienceURL = '';
          if (customerInstanceName && monetateInstance && monetateDomain && experienceId) {
              NewExperienceURL = `https://marketer.monetate.net/control/${customerInstanceName}/${monetateInstance}/${monetateDomain}/experience/${experienceId}`;
          }

          let NewActionURL = '';
          if (customerInstanceName && monetateInstance && monetateDomain && experienceId && campaignId && actionIdFromColumn) {
              NewActionURL = `https://marketer.monetate.net/control/${customerInstanceName}/${monetateInstance}/${monetateDomain}/experience/${experienceId}#c${campaignId}:what,a${actionIdFromColumn}`;
          }
          const experienceDisplayValue = normalise(r['Name']);


          return {
              experience: experienceDisplayValue, // This might be the account_id if 'Name' header was overwritten. Needs to be textual experience name.
              actionName: actionName,
              strategy: strategyForReport,
              recAlgorithm: recAlgorithm,
              revenue, aov, upt, rps, ctr, rpc, desirability,
              clicks, imps,
              convRate: totalSessions > 0 ? (convRateNum * 100).toFixed(2) + '%' : '0.00%',
              convRateNum,
              influencerRev, influencerAov, influencerUpt,
              revPerImp,
              desirabilityScore: 0, flag: '', badgeText: '', overallPerformanceScore: 0, potentialScore: 0, // Removed old overallPerformanceScore, performanceScore is now overallPerformanceScore
              experienceUrl: NewExperienceURL, 
              actionUrl: NewActionURL,  
              currencyCode, currencySymbol,
              experienceId, campaignId, actionStrategyFull, uid, actionIdFromColumn, // added actionIdFromColumn for reference
              // --- Adding the new URL fields ---
              NewExperienceURL,
              NewActionURL
          };
      });

      state.setRows(mappedRows); // Update global state with all processed rows

      // --- Initial Badge Assignment (on all rows) ---
      // This calculates percentiles based on the *entire* dataset
      assignBadges(state.getRawData()); // Changed from state.rows to state.rawData, and use getter

      // --- Update Filter Dropdowns ---
      const badgeOptions = new Set(state.getRawData().map(r => r.badgeText).filter(Boolean)); // Changed from state.rows to state.rawData, and use getter
      const experienceOptions = new Set(state.getRawData().map(r => r.experience)); // Changed from state.rows to state.rawData, and use getter
      ui.updateFilters(badgeOptions, experienceOptions);

      applyFilters(); // Apply default filters (All/All) and render initial table

      // --- Update Button States ---
      dom.downloadBtn.disabled = false;
      const canEnableAi = state.getIsSdkReady() && state.getFilteredData().length > 0; // Use getters
      const canEnablePrompt = state.getFilteredData().length > 0; // Use getter
      dom.aiReportBtn.disabled = !canEnableAi;
      dom.generatePromptBtn.disabled = !canEnablePrompt;
      dom.downloadWordBtn.disabled = true; // Word download disabled until report generated
      ui.syncCloneButtons();

      state.setDataProcessed(true);

      // Render headers now that buttons might be enabled/disabled
      ui.renderSummaryHeader();
      ui.renderAiReportHeader(false); // No AI report initially

      // Scroll to summary table header
      ui.scrollToSection(dom.summaryHeader);


  } catch (error) {
      console.error("LOG: Error processing file:", error);
      // Display user-friendly error message
      showError(`Error processing file: ${error.message}`, dom.summaryContainer);
      dom.insightsContainer.innerHTML = '';
      dom.aiReportContainer.innerHTML = '';
      // Disable buttons on error
      dom.downloadBtn.disabled = true;
      dom.aiReportBtn.disabled = true;
      dom.generatePromptBtn.disabled = true;
      dom.downloadWordBtn.disabled = true;
      ui.syncCloneButtons();
      state.setDataProcessed(false);
  } finally {
      dom.goBtn.disabled = false; // Re-enable button
      dom.goBtn.classList.remove('loading'); // Hide loader
      // syncCloneButtons called within try/catch blocks where state changes
  }
}


// --- Filtering Logic ---

/**
 * Filters the main rows array based on selected dropdown values and re-renders the UI.
 */
export function applyFilters() {
    // --- GUARD CLAUSE ---
    if (!state.getRawData() || !Array.isArray(state.getRawData())) { // Use getter
        console.warn("LOG_DATA_APPLYFILTERS_WARN: state.rawData is not iterable or not yet defined. Aborting applyFilters.");
        // Optionally, render an empty table or a specific message
        state.setFiltered([]); // Ensure filtered is also empty
        ui.renderTable();
        ui.renderInsights();
        ui.renderSummaryHeader();
        return;
    }

    let processedData = [...state.getRawData()]; // Use getter, start with a copy of the full dataset

    const selectedBadges = dom.badgeFilter ? [...dom.badgeFilter.selectedOptions].map(o => o.value) : ['All'];
    const selectedExperiences = dom.experienceFilter ? [...dom.experienceFilter.selectedOptions].map(o => o.value) : ['All'];

    const filterByBadge = !selectedBadges.includes('All');
    const filterByExperience = !selectedExperiences.includes('All');

    // Ensure processedData is an array before filtering, though the guard above should handle it.
    if (Array.isArray(processedData)) {
        processedData = processedData.filter(r => {
            const badgeMatch = !filterByBadge || selectedBadges.includes(r.badgeText);
            const experienceMatch = !filterByExperience || selectedExperiences.includes(r.experience);
            return badgeMatch && experienceMatch;
        });
    } else {
        console.error("LOG_DATA_APPLYFILTERS_ERROR: processedData became non-array before filtering. This shouldn't happen.");
        processedData = []; // Reset to empty array to prevent further errors
    }


    // Re-calculate badges based *only* on the currently filtered data.
    // This means percentiles (and thus badges) can change depending on the filter.
    // If badges should always reflect percentiles of the *full* dataset,
    // remove this call and rely on the initial assignment in processData.
    if (processedData.length > 0) { // Only assign badges if there's data
        assignBadges(processedData);
    }


    // --- Sorting ---
    if (state.getSortState().key && Array.isArray(processedData) && processedData.length > 0) { // Use getter
        const sortKey = state.getSortState().key; // Use getter
        // Use keyMap if your display labels differ from actual data keys for sorting
        // Ensure keyMap access is safe
        const actualSortKey = keyMap[(sortKey.toLowerCase().replace(/ /g, ''))] || sortKey;


        processedData.sort((a, b) => {
            let valA = a[actualSortKey];
            let valB = b[actualSortKey];

            // Handle different data types for robust sorting
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                // Numbers are fine
            } else { // Mixed types or other types, convert to string for basic comparison
                valA = String(valA ?? '').toLowerCase(); // Handle null/undefined gracefully
                valB = String(valB ?? '').toLowerCase(); // Handle null/undefined gracefully
            }

            if (valA < valB) return state.getSortState().dir === 'asc' ? -1 : 1; // Use getter
            if (valA > valB) return state.getSortState().dir === 'asc' ? 1 : -1; // Use getter, -1 was a bug here for desc
            return 0;
        });
    }

    state.setFiltered(processedData);
    ui.renderTable(); // Render the table with filtered and sorted data
    ui.renderInsights(); // Also re-render insights if they depend on filtered data
    ui.renderSummaryHeader(); // Update button states etc.
}


/**
 * Calculates percentiles and assigns badges based on the provided dataRows. Modifies the dataRows array directly.
 * @param {Array} dataRows - The array of data rows to assign badges to.
 */
export function assignBadges(dataRows) {
    if (!dataRows || dataRows.length === 0) return; // Handle empty array

    // --- Normalization (0-100 score for Desirability) ---
    const desirabilities = dataRows.map(r => r.desirability).filter(d => typeof d === 'number' && !isNaN(d) && isFinite(d));
    const minDesirability = desirabilities.length ? Math.min(...desirabilities) : 0;
    const maxDesirability = desirabilities.length ? Math.max(...desirabilities) : 0;
    const desirabilityRange = maxDesirability - minDesirability;

    dataRows.forEach(r => {
        if (typeof r.desirability === 'number' && !isNaN(r.desirability) && isFinite(r.desirability) && desirabilityRange > 0) {
            r.desirabilityScore = ((r.desirability - minDesirability) / desirabilityRange) * 100;
        } else {
            r.desirabilityScore = 0;
        }
    });

    // --- Percentile Calculation (based on the input dataRows) ---
    const convRates = dataRows.map(r => r.convRateNum);
    const desirabilityScores = dataRows.map(r => r.desirabilityScore);
    const impressions = dataRows.map(r => r.imps);
    const aovs = dataRows.map(r => r.aov);
    const upts = dataRows.map(r => r.upt);
    const revPerImps = dataRows.map(r => r.revPerImp);
    const influencerRevenues = dataRows.map(r => r.influencerRev);
    const clicksArr = dataRows.map(r => r.clicks);
    const revenues = dataRows.map(r => r.revenue);

    // Normalize metrics for scores (0-100 range for internal use before final 0-1 scaling if needed)
    const normaliseMetricTo100 = (values) => {
        const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
        if (numericValues.length === 0) return values.map(() => 0);
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const range = max - min;
        return values.map(v => {
            if (typeof v !== 'number' || isNaN(v) || !isFinite(v)) return 0;
            if (range === 0) return numericValues.length > 0 ? 100 : 0;
            return ((v - min) / range) * 100;
        });
    };

    const normalizedConvRates100 = dataRows.map(r => r.convRateNum * 100);
    const normalizedRevPerImps100 = normaliseMetricTo100(dataRows.map(r => r.revPerImp));
    const normalizedRevenues100 = normaliseMetricTo100(revenues);
    const normalizedRPCs100 = normaliseMetricTo100(dataRows.map(r => r.rpc));

    // For Potential Score - Low Impression Boost
    const medianImpressions = getPercentile(impressions, 50);

    const convRate90 = getPercentile(convRates, 90);
    const desirabilityScore80 = getPercentile(desirabilityScores, 80);
    const desirabilityScore25 = getPercentile(desirabilityScores, 25);
    const imps50 = getPercentile(impressions, 50);
    const imps75 = getPercentile(impressions, 75);
    const imps25 = getPercentile(impressions, 25);
    const aov80 = getPercentile(aovs, 80);
    const aov25 = getPercentile(aovs, 25);
    const upt80 = getPercentile(upts, 80);
    const upt25 = getPercentile(upts, 25);
    const revPerImp85 = getPercentile(revPerImps, 85);
    const influencerRev50 = getPercentile(influencerRevenues, 50);
    const minRevenueThreshold = getPercentile(revenues.filter(rev => rev > 0), 10);

    // --- Consistent Performer Check (based on input dataRows) ---
    const strategyExperienceMap = {};
    dataRows.forEach(r => {
        const key = r.strategy + '|' + r.actionStrategy;
        if (!strategyExperienceMap[key]) strategyExperienceMap[key] = [];
        if (r.revenue >= getPercentile(revenues, 50) ||
            r.desirabilityScore >= getPercentile(desirabilityScores, 50) ||
            r.convRateNum >= getPercentile(convRates, 50)) {
            strategyExperienceMap[key].push(r.experienceId + '-' + r.campaignId);
        }
    });

    // --- Badge Assignment Logic (modifies dataRows directly) ---
    dataRows.forEach((r, rIndex) => {
        const badges = [];
        // ... (Keep the entire badge assignment logic from the original assignBadges/processData)
        if (r.convRateNum >= convRate90 && r.revenue > 0 && convRate90 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Strong Conversion'));
        if (r.desirabilityScore >= desirabilityScore80 && r.imps <= imps50 && desirabilityScore80 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Opportunity'));
        if (r.desirabilityScore >= desirabilityScore80 && r.imps <= imps50 && r.clicks <= 10 && desirabilityScore80 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Hidden Gem'));
        if (r.aov >= aov80 && r.revenue >= minRevenueThreshold && aov80 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'High AOV'));
        if (r.revPerImp >= revPerImp85 && r.imps >= imps25 && revPerImp85 > 0)
           badges.push(badgeDefinitions.find(b => b.label === 'Efficient Earner'));
        if (r.upt >= upt80 && r.aov <= aov25 && upt80 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Volume Driver'));
        if (r.upt <= upt25 && r.aov >= aov80 && aov80 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Low UPT'));
        if (r.influencerRev >= influencerRev50 && r.revenue === 0 && influencerRev50 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Influencer'));
        if (r.clicks > 0 && r.aov === 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Poor Conversion'));
        if (r.imps <= imps50 && r.clicks === 0 && imps50 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Ignored'));
        if (r.desirabilityScore <= desirabilityScore25 && r.imps >= imps75 && imps75 > 0)
          badges.push(badgeDefinitions.find(b => b.label === 'Low ROI'));
        const stratKey = r.strategy + '|' + r.actionStrategy;
        if (strategyExperienceMap[stratKey] && strategyExperienceMap[stratKey].length >= 2) {
          badges.push(badgeDefinitions.find(b => b.label === 'Consistent Performer'));
        }
        if (r.imps >= imps75 && r.clicks < getPercentile(clicksArr, 25) && r.convRateNum < getPercentile(convRates, 25)) {
          badges.push(badgeDefinitions.find(b => b.label === 'Needs Review'));
        }
        if (r.imps === 0 && r.clicks === 0 && r.revenue === 0 && r.convRateNum === 0) {
          badges.push(badgeDefinitions.find(b => b.label === 'No Activity'));
        }
        if (r.clicks >= getPercentile(clicksArr, 75) && r.convRateNum < 0.01) {
          badges.push(badgeDefinitions.find(b => b.label === 'Clicker, Not Closer'));
        }
        if (r.imps >= getPercentile(impressions, 90) && r.ctr < 0.1) {
          badges.push(badgeDefinitions.find(b => b.label === 'Overexposed'));
        }
        if (r.rpc >= getPercentile(dataRows.map(x => x.rpc), 90) && r.clicks < getPercentile(clicksArr, 25) && r.imps < getPercentile(impressions, 25)) {
          badges.push(badgeDefinitions.find(b => b.label === 'Premium Performer'));
        }

        // --- Calculate Overall Performance Score (0-100 range) ---
        // This is the score from Prompt 1, now named overallPerformanceScore
        const revWeight = 0.40;
        const rpiWeight = 0.30;
        const rpcWeight = 0.20;
        const crWeight = 0.10;

        const currentOverallPerformanceScore = 
            (normalizedRevenues100[rIndex] * revWeight) +
            (normalizedRevPerImps100[rIndex] * rpiWeight) +
            (normalizedRPCs100[rIndex] * rpcWeight) +
            (normalizedConvRates100[rIndex] * crWeight);
        r.overallPerformanceScore = Math.max(0, Math.min(100, parseFloat(currentOverallPerformanceScore.toFixed(1))));

        // --- Calculate Potential Score (0-100 range) ---
        const rpcWeightPotential = 0.50;
        const crWeightPotential = 0.30;
        const lowImpBoostWeight = 0.20;

        const lowImpressionBoost = (r.imps < medianImpressions) ? 100 : 0; // Boost is 100 if active, 0 otherwise

        const currentPotentialScore = 
            (normalizedRPCs100[rIndex] * rpcWeightPotential) +
            (normalizedConvRates100[rIndex] * crWeightPotential) +
            (lowImpressionBoost * lowImpBoostWeight);
        r.potentialScore = Math.max(0, Math.min(100, parseFloat(currentPotentialScore.toFixed(1))));

        // --- Assign highest priority badge ---
        const validBadges = badges.filter(b => b);
        const priorityOrder = badgeDefinitions.map(b => b.label);
        const chosenLabel = priorityOrder.find(p => validBadges.some(b => b.label === p));
        if (chosenLabel) {
          const chosenBadge = validBadges.find(b => b.label === chosenLabel);
          r.flag = `<span class="badge-icon ${chosenBadge.styleClass}" title="${chosenBadge.label}: ${chosenBadge.tip}"><i class="${chosenBadge.icon}"></i></span>`; // Changed chosenBadge.class to chosenBadge.styleClass
          r.badgeText = chosenBadge.label;
        } else {
          r.flag = '';
          r.badgeText = '';
        }
    });
}

// --- Data Preparation for AI/Downloads ---

/**
 * Gets the top/bottom rows for concise summaries (e.g., for AI prompt).
 * @param {Array} dataRows - The data rows to select from.
 * @returns {Array} The top and bottom 25 rows (or all if <= 50).
 */
export function getTop50Rows(dataRows) {
    if (dataRows.length <= 50) return [...dataRows];
    return [
        ...dataRows.slice(0, 25),
        ...dataRows.slice(-25)
    ];
}

/**
 * Creates a JSON summary of the top rows, suitable for AI analysis.
 * @param {Array} dataRows - The data rows to summarize.
 * @returns {Array} The summary JSON array.
 */
export function buildTop50Json(dataRows) {
    return getTop50Rows(dataRows).map(r => ({
        badge: r.badgeText,
        experience: r.experience,
        action: r.actionName,
        strategy: r.strategy,
        revenue: r.revenue,
        aov: r.aov,
        upt: r.upt,
        rps: r.rps,
        convRate: r.convRateNum,
        clicks: r.clicks,
        imps: r.imps,
        ctr: r.ctr,
        rpc: r.rpc,
        desirability: r.desirability,
        desirabilityScore: r.desirabilityScore,
        revPerImp: r.revPerImp,
        influencerRev: r.influencerRev,
        influencerAov: r.influencerAov,
        influencerUpt: r.influencerUpt,
        overallPerformanceScore: r.overallPerformanceScore, // This is the primary performance score now
        potentialScore: r.potentialScore
    }));
}

(() => {

// --- Data Processing ---

function parseCsvData(text) {
    if (typeof Papa === 'undefined') {
        Utils.showError("Error: PapaParse library is not loaded. Please ensure papaparse.min.js is included via CDN in your HTML.", Dom.summaryContainer);
        throw new Error("PapaParse library is not loaded.");
    }
    const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parseResult.errors.length > 0) {
        console.error("LOG: CSV Parsing Errors:", parseResult.errors);
        throw new Error(`CSV parsing error: ${parseResult.errors[0].message} on row ${parseResult.errors[0].row}`);
    }
    return parseResult.data;
}

function mapRawDataToInternalFormat(rawData) {
    return rawData.map(r => {
        const revenue = Utils.cleanNumber(r['Cart Revenue (Purchased Clicked Recommendation)']);
        const currencyCode = Utils.normalise(r['Currency']);
        const currencySymbol = Config.currencySymbolMap[currencyCode.toUpperCase()] || currencyCode;
        const imps = Utils.cleanNumber(r['Impressions']);
        const clicks = Utils.cleanNumber(r['Clickthroughs']);
        const aov = Utils.cleanNumber(r['Average Order Value (AOV) - (Purchased Clicked Recommendation)']);
        const upt = Utils.cleanNumber(r['Units Per Transaction (UPT) - (Purchased Clicked Recommendation)']);
        
        const experienceNameFromCSV = Utils.normalise(r['Name']);
        const experienceNameForDisplay = Utils.normalise(r['Name']);
        const actionName = Utils.normalise(r['Action Label']);
        const actionStrategyFull = Utils.normalise(r['Action Strategy']);
        const recAlgorithm = Utils.normalise(r['Rec Algorithm']);

        let actionIdDerived = '';
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

        const totalSessions = Utils.cleanNumber(r['Total Sessions']);
        const respondentConvertedSessions = Utils.cleanNumber(r['Respondent Converted Sessions']);
        const convRateNum = totalSessions > 0 ? respondentConvertedSessions / totalSessions : 0;
        const rps = totalSessions > 0 ? Utils.cleanNumber(r['Cart Revenue (Purchased Clicked Recommendation)']) / totalSessions : 0;
        const ctr = imps > 0 ? (clicks / imps) * 1000 : 0;
        const rpc = clicks > 0 ? revenue / clicks : 0;
        const desirability = (rpc * 0.7) + (convRateNum * 0.3);
        const influencerRev = Utils.cleanNumber(r['Cart Revenue (Clicked but Purchased Other)']);
        const influencerAov = Utils.cleanNumber(r['Average Order Value (AOV) - (Clicked but Purchased Other)']);
        const influencerUpt = Utils.cleanNumber(r['Units Per Transaction (UPT) - (Clicked but Purchased Other)']);
        const experienceId = Utils.normalise(r['Experience ID']);
        const campaignId = Utils.normalise(r['Campaign ID']);
        const actionIdFromColumn = Utils.normalise(r['Action ID']);
        const revPerImp = imps > 0 ? revenue / imps : 0;
        const uid = `${experienceId}-${actionStrategyFull}-${recAlgorithm}`;

        const customerInstanceName = Utils.normalise(r['Instance Name']); 
        const monetateInstance = Utils.normalise(r['Instance']);
        const monetateDomain = Utils.normalise(r['Domain']);
        
        let NewExperienceURL = '';
        if (customerInstanceName && monetateInstance && monetateDomain && experienceId) {
            NewExperienceURL = `https://marketer.monetate.net/control/${customerInstanceName}/${monetateInstance}/${monetateDomain}/experience/${experienceId}`;
        }

        let NewActionURL = '';
        if (customerInstanceName && monetateInstance && monetateDomain && experienceId && campaignId && actionIdFromColumn) {
            NewActionURL = `https://marketer.monetate.net/control/${customerInstanceName}/${monetateInstance}/${monetateDomain}/experience/${experienceId}#c${campaignId}:what,a${actionIdFromColumn}`;
        }
        const experienceDisplayValue = Utils.normalise(r['Name']);

        let clickedAndPurchasedSessions = Utils.cleanNumber(r['Respondent Converted Sessions']);
        let clickedAndPurchasedOtherSessions = Utils.cleanNumber(r['Recommendation Clicked and Purchased']);

        let totalClickedSessions = Utils.cleanNumber(r['Respondent Sessions']);
        if (!totalClickedSessions) {
            totalClickedSessions = Utils.cleanNumber(r['Clicked Sessions']);
        }
        if (!totalClickedSessions) {
            totalClickedSessions = Utils.cleanNumber(r['Total Clicked Sessions']);
        }
        let purchasedOther = clickedAndPurchasedOtherSessions;
        if (isNaN(purchasedOther) || purchasedOther === 0) {
            purchasedOther = Utils.cleanNumber(r['Clicked and Purchased Other Sessions']);
        }

        const convRateClickedPurchased = totalClickedSessions > 0 ? (clickedAndPurchasedSessions / totalClickedSessions) * 100 : 0;
        const convRateClickedPurchasedOther = totalClickedSessions > 0 ? (purchasedOther / totalClickedSessions) * 100 : 0;

        const respondentSessions = Utils.cleanNumber(r['Respondent Sessions']);
        const totalRevenue = Utils.cleanNumber(r['Total Revenue']);
        const revInfluencePct = (totalRevenue > 0) ? (revenue / totalRevenue) * 100 : 0;
        const sessInfluencePct = (totalSessions > 0) ? (respondentSessions / totalSessions) * 100 : 0;
        const convRate = (respondentSessions > 0) ? (respondentConvertedSessions / respondentSessions) * 100 : 0; // Definition for 'Conv Rate (Clicked)'

        return {
            experience: experienceDisplayValue,
            actionName: actionName,
            strategy: strategyForReport,
            recAlgorithm: recAlgorithm,
            revenue, aov, upt, rps, ctr, rpc, desirability,
            clicks, imps,
            convRateNum,
            influencerRev, influencerAov, influencerUpt,
            revPerImp,
            desirabilityScore: 0, flag: '', badgeText: '', overallPerformanceScore: 0, potentialScore: 0,
            experienceUrl: NewExperienceURL, 
            actionUrl: NewActionURL,  
            currencyCode, currencySymbol,
            experienceId, campaignId, actionStrategyFull, uid, actionIdFromColumn,
            NewExperienceURL,
            NewActionURL,
            convRateClickedPurchased: convRateClickedPurchased.toFixed(2),
            convRateClickedPurchasedOther: convRateClickedPurchasedOther.toFixed(2),
            respondentSessions,
            respondentConvertedSessions,
            revInfluencePct: revInfluencePct.toFixed(2),
            sessInfluencePct: sessInfluencePct.toFixed(2),
            convRate: convRate.toFixed(2) // This is the correct 'Conv Rate (Clicked)'
        };
    });
}

function initializeFiltersAndUI(mappedRows) {
    // Build badgeOptions as unique array of {key, label} for filter dropdown
    const badgeMap = new Map();
    mappedRows.forEach(r => {
        const def = BadgesConfig.badgeDefinitions && Array.isArray(BadgesConfig.badgeDefinitions)
            ? BadgesConfig.badgeDefinitions.find(b => b.key === r.badgeText)
            : null;
        const key = def ? def.key : r.badgeText;
        const label = def ? def.label : r.badgeText;
        if (key && !badgeMap.has(key)) {
            badgeMap.set(key, label);
        }
    });
    // Pass array of {key, label} objects to UI.updateFilters
    const badgeOptions = Array.from(badgeMap, ([key, label]) => ({ key, label }));
    const experienceOptions = Array.from(new Set(mappedRows.map(r => r.experience)));
    UI.updateFilters(badgeOptions, experienceOptions);

    applyFilters();

    Dom.downloadBtn.disabled = false;
    const canEnablePrompt = State.getFilteredData().length > 0;
    Dom.generatePromptBtn.disabled = !canEnablePrompt;
    UI.syncCloneButtons();

    State.setDataProcessed(true);
    UI.renderSummaryHeader();
    UI.scrollToSection(Dom.summaryHeader);
}

async function processData(file) {
  if (!file) {
    return;
  }

  Dom.goBtn.disabled = true;
  Dom.goBtn.classList.add('loading');
  State.setDataProcessed(false);

  try {
      const text = await file.text();
      const rawData = parseCsvData(text);
      const mappedRows = mapRawDataToInternalFormat(rawData);
      State.setRows(mappedRows);
      Config.assignBadges(State.getRawData()); // Use badge logic from badges.js
      initializeFiltersAndUI(State.getRawData());
      State.setSortState('overallPerformanceScore', 'desc');
  } catch (error) {
      console.error("LOG: Error processing file:", error);
      if (Dom.summaryContainer) {
        Utils.showError(`Error processing file: ${error.message}`, Dom.summaryContainer);
      }
      if (Dom.insightsContainer) {
        Dom.insightsContainer.innerHTML = '';
      }
      if (Dom.downloadBtn) Dom.downloadBtn.disabled = true;
      if (Dom.generatePromptBtn) Dom.generatePromptBtn.disabled = true;
      UI.syncCloneButtons();
      State.setDataProcessed(false);
  } finally {
      Dom.goBtn.disabled = false;
      Dom.goBtn.classList.remove('loading');
  }
}

function applyFilters() {
    if (!State.getRawData() || !Array.isArray(State.getRawData())) {
        State.setFiltered([]);
        UI.renderTable();
        UI.renderSummaryHeader();
        return;
    }

    let processedData = [...State.getRawData()];

    // Use badge key for filtering
    const selectedBadges = Dom.badgeFilter ? [...Dom.badgeFilter.selectedOptions].map(o => o.value) : ['All'];
    const selectedExperiences = Dom.experienceFilter ? [...Dom.experienceFilter.selectedOptions].map(o => o.value) : ['All'];

    const filterByBadge = !selectedBadges.includes('All');
    const filterByExperience = !selectedExperiences.includes('All');

    if (Array.isArray(processedData)) {
        processedData = processedData.filter(r => {
            const badgeMatch = !filterByBadge || selectedBadges.includes(r.badgeText); // badgeText is the key
            const experienceMatch = !filterByExperience || selectedExperiences.includes(r.experience);
            return badgeMatch && experienceMatch;
        });
    } else {
        console.error("LOG_DATA_APPLYFILTERS_ERROR: processedData became non-array before filtering. This shouldn't happen.");
        processedData = [];
    }

    if (!State.getStaticBadgesActive() && processedData.length > 0) {
        Config.assignBadges(processedData); // Use badge logic from badges.js
    }

    if (State.getSortState().key && Array.isArray(processedData) && processedData.length > 0) {
        const sortKey = State.getSortState().key;
        const actualSortKey = Config.keyMap[(sortKey.toLowerCase().replace(/ /g, ''))] || sortKey;

        processedData.sort((a, b) => {
            let valA = a[actualSortKey];
            let valB = b[actualSortKey];

            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                // Numbers are fine
            } else { 
                valA = String(valA ?? '').toLowerCase();
                valB = String(valB ?? '').toLowerCase();
            }

            if (valA < valB) return State.getSortState().dir === 'asc' ? -1 : 1;
            if (valA > valB) return State.getSortState().dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    State.setFiltered(processedData);
    UI.renderTable();
    UI.renderSummaryHeader();
}

function recalculateBadgesForAllData() {
    const allData = State.getRawData();
    if (allData && allData.length > 0) {
        Config.assignBadges(allData); // Use badge logic from badges.js
        State.setStaticBadgesActive(true);
    } else {
        console.warn('[DEBUG] recalculateBadgesForAllData: No raw data to process or allData is null.');
    }
    applyFilters();
}

function getTop50Rows(dataRows) {
    if (dataRows.length <= 50) return [...dataRows];
    return [
        ...dataRows.slice(0, 25),
        ...dataRows.slice(-25)
    ];
}

function buildTop50Json(dataRows) {
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
        overallPerformanceScore: r.overallPerformanceScore,
        potentialScore: r.potentialScore
    }));
}

window.Data = {
    processData: processData,
    assignBadges: Config.assignBadges, // Expose from badges.js
    applyFilters: applyFilters,
    getTop50Rows: getTop50Rows,
    buildTop50Json: buildTop50Json,
    recalculateBadgesForAllData: recalculateBadgesForAllData
};
})();
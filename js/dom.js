const Dom = (() => {
  return {
    fileInput: document.getElementById('fileInput'),
    fileNameDisplay: document.getElementById('fileName'),
    goBtn: document.getElementById('goBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    generatePromptBtn: document.getElementById('generatePromptBtn'),
    badgeFilter: document.getElementById('badgeFilter'),
    experienceFilter: document.getElementById('experienceFilter'),
    experienceSearch: document.getElementById('experienceSearch'),
    summaryContainer: document.getElementById('summary'),
    insightsContainer: document.getElementById('insights'),
    definitionsKeyContainer: document.getElementById('definitionsKeyContainer'),
    badgesKeyDiv: document.getElementById('badgesKey'),
    calculatedColumnsKeyDiv: document.getElementById('calculatedColumnsKey'),
    reportTitleInput: document.getElementById('reportTitleInput'),
    processLoader: document.getElementById('processLoader'),
    showAllColumnsToggle: document.getElementById('showAllColumnsToggle'),
    staticBadgesToggle: document.getElementById('staticBadgesToggle'),
    summaryHeader: document.getElementById('summaryHeader'),
    additionalInstructionsContainer: document.getElementById('additionalInstructionsContainer'),
    additionalInstructionsTextarea: document.getElementById('additionalInstructions'),
    charCountDisplay: document.getElementById('charCountDisplay'),
    helpBtn: document.getElementById('helpBtn'),
    helpModal: document.getElementById('helpModal'),
    closeHelpModal: document.getElementById('closeHelpModal'),
    aiReportContainer: document.getElementById('aiReportContainer'),
    aiReportHeader: document.getElementById('aiReportHeader'),
    downloadWordBtn: document.getElementById('downloadWordBtn'),
    generateAiReportBtn: document.getElementById('generateAiReportBtn'), // New AI Report Button
    recommendationSummaryDetails: document.getElementById('recommendationSummaryDetails'), // Added
    aiSummaryDetails: document.getElementById('aiSummaryDetails'), // Added

    // API Key Entry Modal Elements
    apiKeyEntryModal: document.getElementById('apiKeyEntryModal'),
    closeApiKeyModal: document.getElementById('closeApiKeyModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    apiKeyEntryStatus: document.getElementById('apiKeyEntryStatus'),

    // New buttons
    manageApiKeyBtn: document.getElementById('manageApiKeyBtn'),
    copyPromptTextBtn: document.getElementById('copyPromptTextBtn'),
    downloadPromptDataCsvBtn: document.getElementById('downloadPromptDataCsvBtn'),
    copyAiReportBtn: document.getElementById('copyAiReportBtn'),
    downloadAiSourceDataCsvBtn: document.getElementById('downloadAiSourceDataCsvBtn'),
    downloadWordBtnAiHeader: document.getElementById('downloadWordBtnAiHeader') // New Word download button in AI header
  };
})();

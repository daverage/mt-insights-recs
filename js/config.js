const Config = (() => {
  // --- Constants and Definitions ---
  // (Moved badgeDefinitions, badgeUnicodeMap, coreColumnKeys, allColumns, insightsColumns, calculatedColumnDefinitions to badges.js)

  // Import badge/column config from badges.js
  const {
    badgeDefinitions,
    coreColumnKeys,
    allColumns,
    calculatedColumnDefinitions
  } = window.BadgesConfig;

  // Map display names (lowercase) to data keys for sorting
  const keyMap = {
    'badge': 'badgeText', // Sort by badge label text
    'experience': 'experience',
    'strategy': 'strategy',
    'revenue': 'revenue',
    'aov': 'aov',
    'upt': 'upt',
    'rps': 'rps',
    'influencerrev': 'influencerRev',
    'respondentsessions': 'respondentSessions',
    'respondentconvertedsessions': 'respondentConvertedSessions',
    'convrate': 'convRate',
    'ctr': 'ctr',
    'revinfluencepct': 'revInfluencePct',
    'sessinfluencepct': 'sessInfluencePct',
    'overallperformancescore': 'overallPerformanceScore',
    'potentialscore': 'potentialScore'
  };

  const currencySymbolMap = {
    USD: '$', // US Dollar
    EUR: '€', // Euro
    GBP: '£', // British Pound
    JPY: '¥', // Japanese Yen
    CAD: '$', // Canadian Dollar (often uses $, can specify C$)
    AUD: '$', // Australian Dollar (often uses $, can specify A$)
    CHF: 'Fr', // Swiss Franc
    CNY: '¥', // Chinese Yuan
    SEK: 'kr', // Swedish Krona
    NZD: '$', // New Zealand Dollar (often uses $, can specify NZ$)
    MXN: '$', // Mexican Peso
    SGD: '$', // Singapore Dollar
    HKD: '$', // Hong Kong Dollar
    NOK: 'kr', // Norwegian Krone
    KRW: '₩', // South Korean Won
    TRY: '₺', // Turkish Lira
    RUB: '₽', // Russian Ruble
    INR: '₹', // Indian Rupee
    BRL: 'R$', // Brazilian Real
    ZAR: 'R', // South African Rand
    PLN: 'zł', // Polish Zloty
    // Add more currencies as needed
  };

  const isAiReportEnabled = true; // AI Report feature flag

  return {
    badgeDefinitions,
    coreColumnKeys,
    allColumns,
    calculatedColumnDefinitions,
    keyMap,
    currencySymbolMap,
    isAiReportEnabled, // Expose the new flag
    // Expose badge logic from badges.js
    assignBadges: window.BadgesConfig.assignBadges,
    determineAppliedBadges: window.BadgesConfig.determineAppliedBadges,
    normalizeDesirabilityScores: window.BadgesConfig.normalizeDesirabilityScores,
    calculatePercentiles: window.BadgesConfig.calculatePercentiles,
    normalizeMetricsForScoring: window.BadgesConfig.normalizeMetricsForScoring,
    calculateRowScores: window.BadgesConfig.calculateRowScores,
    checkConsistentPerformers: window.BadgesConfig.checkConsistentPerformers,
    selectAndFormatDisplayBadges: window.BadgesConfig.selectAndFormatDisplayBadges
  };
})();


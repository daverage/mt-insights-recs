// filepath: js/badges.js
// Badge, column, and calculation logic extracted from config.js and data.js

// --- Badge Definitions (with unicode merged) ---
const badgeDefinitions = [
  { key: 'strongconv',label: 'Strong Conversion', icon: 'fa-solid fa-arrow-trend-up', styleClass: 'strongconv', tip: 'Top 10% conversion rate from rec clicks — highly persuasive.', unicode: '📈', wordBgColor: '#28a745', wordIconColor: '#ffffff', usage: 'Indicates strategies with the highest conversion rates from recommendation clicks. Use to identify your most persuasive recommendations.' },
  { key: 'promote', label: 'Opportunity', icon: 'fa-solid fa-lightbulb', styleClass: 'promote', tip: 'High desirability, low impressions — promote for more impact.', unicode: '💡', wordBgColor: '#ffc107', wordIconColor: '#1f1f1f', usage: 'Highlights high-performing but underexposed strategies. Use to find candidates for increased exposure.' },
  { key: 'hidden',label: 'Hidden Gem', icon: 'fa-solid fa-gem', styleClass: 'hidden', tip: 'High desirability, low impressions, low clicks — test prioritizing.', unicode: '💎', wordBgColor: '#8566AB', wordIconColor: '#ffffff', usage: 'Identifies strategies with strong potential that have not yet received much attention. Consider prioritizing these.' },
  { key: 'aov',label: 'High AOV', icon: 'fa-solid fa-star', styleClass: 'aov', tip: 'Top 20% average order value from recs.', unicode: '⭐', wordBgColor: '#F8A7AD', wordIconColor: '#1f1f1f', usage: 'Marks strategies that drive higher average order values. Use to focus on high-value recommendations.' },
  { key: 'efficient', label: 'Efficient Earner', icon: 'fa-solid fa-hand-holding-dollar', styleClass: 'efficient', tip: 'Top 15% revenue per impression.', unicode: '💰', wordBgColor: '#5DD9B7', wordIconColor: '#ffffff', usage: 'Shows which strategies generate the most revenue per impression. Use to maximize efficiency.' },
  { key: 'consistent', label: 'Consistent Performer', icon: 'fa-solid fa-medal', styleClass: 'consistent', tip: 'Performs above median in multiple campaigns.', unicode: '🏅', wordBgColor: '#3C51A3', wordIconColor: '#ffffff', usage: 'Highlights strategies that perform well across multiple campaigns. Use to identify reliable performers.' },
  { key: 'needsreview', label: 'Needs Review', icon: 'fa-solid fa-magnifying-glass', styleClass: 'needsreview', tip: 'High impressions but low clicks/conversions.', unicode: '🔍', wordBgColor: '#cccccc', wordIconColor: '#1f1f1f', usage: 'Indicates strategies with high exposure but low engagement. Use to investigate and optimize.' },
  { key: 'noactivity', label: 'No Activity', icon: 'fa-solid fa-ban', styleClass: 'noactivity', tip: 'Zero impressions, clicks, conversions, and revenue.', unicode: '🚫', wordBgColor: '#666666', wordIconColor: '#ffffff', usage: 'Marks strategies with no activity. Use to identify and remove or revise inactive recommendations.' },
  { key: 'influencer', label: 'Influencer', icon: 'fa-solid fa-people-arrows', styleClass: 'influencer', tip: 'Top 20% influencer revenue, not top 20% direct revenue. Drives purchases of other products.', unicode: '🔄', wordBgColor: '#F36B21', wordIconColor: '#ffffff', usage: 'Identifies recommendations that influence purchases of other products. Use to recognize indirect value.' },
  { key: 'hiddeninfluencer', label: 'Hidden Influencer', icon: 'fa-solid fa-user-secret', styleClass: 'hiddeninfluencer', tip: 'High influencer revenue, low direct revenue, and underexposed (low impressions). May be undervalued.', unicode: '🕵️', wordBgColor: '#CC2A53', wordIconColor: '#ffffff', usage: 'Highlights underexposed recommendations that drive indirect revenue. Use to uncover hidden value.' },
  { key: 'overexposed', label: 'Overexposed', icon: 'fa-solid fa-eye-slash', styleClass: 'overexposed', tip: 'Top 10% impressions but very low CTR (<0.1%). Consider reducing exposure.', unicode: '🙈', wordBgColor: '#dc3545', wordIconColor: '#ffffff', usage: 'Marks strategies with high exposure but poor engagement. Use to reduce or optimize exposure.' },
  { key: 'oneoffstar',label: 'One-off Star', icon: 'fa-solid fa-star-half-stroke', styleClass: 'oneoffstar', tip: 'Single-appearance strategy with top 10% performance — don’t overlook.', unicode: '🌟', wordBgColor: '#FFCB53', wordIconColor: '#1f1f1f', usage: 'Identifies one-time or rare strategies with outstanding performance. Use to spot overlooked winners.' },
  { key: 'risinggem', label: 'Rising Gem', icon: 'fa-solid fa-arrow-up', styleClass: 'risinggem', tip: 'High desirability, low impressions, slightly above 10 clicks — may be emerging.', unicode: '📈', wordBgColor: '#5DD9B7', wordIconColor: '#1f1f1f', usage: 'Highlights emerging strategies with growing engagement. Use to monitor and nurture potential.' },
  { key: 'unengaged', label: 'Unengaged', icon: 'fa-solid fa-user-slash', styleClass: 'unengaged', tip: 'Has impressions but zero clicks or conversions — not resonating.', unicode: '😶', wordBgColor: '#888888', wordIconColor: '#ffffff', usage: 'Marks strategies that are seen but not engaged with. Use to identify and revise unappealing recommendations.' },
  { key: 'revenuedriver', label: 'Revenue Driver', icon: 'fa-solid fa-bolt', styleClass: 'revenuedriver', tip: 'Top 10% of total revenue share — key contributor.', unicode: '⚡', wordBgColor: '#017B84', wordIconColor: '#ffffff', usage: 'Highlights strategies that contribute the most to total revenue. Use to focus on your biggest drivers.' }
];

// --- Column Definitions ---
const coreColumnKeys = [
  'badgeText',
  'experience',
  'strategy',
  'revenue',
  'aov',
  'rps',
  'convRate',
  'ctr',
  'overallPerformanceScore',
  'potentialScore'
];

const allColumns = [
  { key: 'badgeText', label: 'Badge', tooltip: 'Performance category badge.' },
  { key: 'experience', label: 'Experience', tooltip: 'Monetate experience name.' },
  { key: 'strategy', label: 'Strategy', tooltip: 'Recommendation algorithm or strategy.' },
  { key: 'overallPerformanceScore', label: 'Performance<br>Score', tooltip: 'Weighted score: AOV, Revenue, Rev/Imp, RPC, Conv Rate.' },
  { key: 'potentialScore', label: 'Potential<br>Score', tooltip: 'Weighted: Desirability Score, Low Impression Boost.' },
  { key: 'revenue', label: 'Revenue', tooltip: 'Revenue from clicked recommendations (purchased that item).' },
  { key: 'aov', label: 'AOV', tooltip: 'Average Order Value from clicked recommendations.' },
  { key: 'upt', label: 'UPT', tooltip: 'Units Per Transaction from clicked recommendations.' },
  { key: 'rps', label: 'RPS', tooltip: 'Revenue Per Session (clicked recs): Cart Revenue (Purchased Clicked Recommendation) / Respondent Sessions.' },
  { key: 'influencerRev', label: 'Influencer Rev', tooltip: 'Revenue from sessions where a rec was clicked but a different item was purchased.' },
  { key: 'influencerAov', label: 'Influencer AOV', tooltip: 'AOV from influencer sessions.' },
  { key: 'influencerUpt', label: 'Influencer UPT', tooltip: 'UPT from influencer sessions.' },
  { key: 'respondentSessions', label: 'Rec Click Sessions', tooltip: 'Sessions where a rec was clicked.' },
  { key: 'respondentConvertedSessions', label: 'Rec Click Converted Sessions', tooltip: 'Sessions where a rec was clicked and a conversion occurred (any product).' },
  { key: 'convRate', label: 'Conv Rate (Clicked)', tooltip: 'Conversion rate for sessions where a rec was clicked: Respondent Converted Sessions / Respondent Sessions.' },
  { key: 'ctr', label: 'CTR/1k', tooltip: 'Click-Through Rate per 1,000 impressions.' },
  { key: 'revInfluencePct', label: '% Revenue Influenced', tooltip: 'Cart Revenue (Purchased Clicked Recommendation) as a % of Total Revenue.' },
  { key: 'sessInfluencePct', label: '% Sessions Influenced', tooltip: 'Respondent Sessions as a % of Total Sessions.' },
  { key: 'revPerImp', label: 'Rev/Imp', tooltip: 'Revenue per impression.' },
  { key: 'rpc', label: 'Rev/Click', tooltip: 'Revenue per click.' },
  { key: 'desirabilityScore', label: 'Desirability Score', tooltip: 'Normalized desirability score (0-100).' },
];

const calculatedColumnDefinitions = [
  { label: 'Conv Rate (Clicked)', description: 'Conversion rate for sessions where a recommendation was clicked: Respondent Converted Sessions / Respondent Sessions.', usage: 'What can I learn? High values mean your recs are persuasive when engaged. Use to identify top-performing strategies.' },
  { label: 'RPS', description: 'Revenue Per Session (clicked recs): Cart Revenue (Purchased Clicked Recommendation) / Respondent Sessions.', usage: 'What can I learn? Shows how much revenue each engaged session generates. Use to compare efficiency across strategies.' },
  { label: 'Influencer Rev', description: 'Revenue from sessions where a rec was clicked but a different item was purchased.', usage: 'What can I learn? Indicates recs that influence purchases beyond direct clicks. Use to spot hidden value.' },
  { label: '% Revenue Influenced', description: 'Cart Revenue (Purchased Clicked Recommendation) as a % of Total Revenue.', usage: 'What can I learn? Shows how much of your total revenue is directly driven by recs. Use to gauge rec program impact.' },
  { label: '% Sessions Influenced', description: 'Respondent Sessions as a % of Total Sessions.', usage: 'What can I learn? Reveals how much of your session volume is engaging with recs. Use to assess reach.' },
  { label: 'Performance Score', description: 'Weighted score: AOV, Revenue, Rev/Imp, RPC, Conv Rate.', usage: 'What can I learn? Overall effectiveness of the strategy. Use to quickly compare and rank.' },
  { label: 'Potential Score', description: 'Weighted: Desirability Score, Low Impression Boost.', usage: 'What can I learn? Highlights underexposed but high-performing strategies. Use to find candidates for more exposure.' },
  { label: 'Desirability Score', description: 'Normalized score (0-100) based on conversion rate, revenue per impression, and other engagement metrics. Higher = more desirable.', usage: 'What can I learn? Use to spot strategies that are attractive to users. High score = good candidate for more exposure.' },
  { label: 'Desirability Calculation', description: 'Desirability is calculated as a weighted combination of conversion rate, revenue per impression, and click-through rate, normalized to a 0-100 scale. The formula is: Desirability = 0.5 * (normalized Conv Rate) + 0.3 * (normalized Rev/Imp) + 0.2 * (normalized CTR).', usage: 'What can I do? Use this to understand what drives the desirability score and how to improve it (e.g., boost conversion rate or revenue per impression).' }
];

// --- Badge Calculation and Assignment Logic ---

function normalizeDesirabilityScores(dataRows) {
    const desirabilities = dataRows.map(r => r.desirability).filter(d => typeof d === 'number' && !isNaN(d) && isFinite(d));
    const minDesirability = desirabilities.length ? Math.min(...desirabilities) : 0;
    const maxDesirability = desirabilities.length ? Math.max(...desirabilities) : 0;
    const desirabilityRange = maxDesirability - minDesirability;

    dataRows.forEach(r => {
        if (typeof r.desirability !== 'number' || isNaN(r.desirability) || !isFinite(r.desirability)) {
            r.desirabilityScore = 0;
        } else if (desirabilityRange === 0) {
            r.desirabilityScore = (minDesirability !== 0) ? 100 : 0;
        } else {
            r.desirabilityScore = ((r.desirability - minDesirability) / desirabilityRange) * 100;
        }
    });
}

function calculatePercentiles(dataRows) {
    const convRates = dataRows.map(r => r.convRateNum);
    const desirabilityScores = dataRows.map(r => r.desirabilityScore);
    const impressions = dataRows.map(r => r.imps);
    const aovs = dataRows.map(r => r.aov);
    const upts = dataRows.map(r => r.upt);
    const revPerImps = dataRows.map(r => r.revPerImp);
    const influencerRevenues = dataRows.map(r => r.influencerRev);
    const clicksArr = dataRows.map(r => r.clicks);
    const revenues = dataRows.map(r => r.revenue);
    const rpcs = dataRows.map(r => r.rpc);
    const influencerRev80 = Utils.getPercentile(dataRows.map(r => r.influencerRev), 80);
    const directRev80 = Utils.getPercentile(dataRows.map(r => r.revenue), 80);
    const directRev50 = Utils.getPercentile(dataRows.map(r => r.revenue), 50);
    const impsMedian = Utils.getPercentile(dataRows.map(r => r.imps), 50);

    return {
        convRate90: Utils.getPercentile(convRates, 90),
        convRate25: Utils.getPercentile(convRates, 25),
        desirabilityScore80: Utils.getPercentile(desirabilityScores, 80),
        desirabilityScore50: Utils.getPercentile(desirabilityScores, 50),
        desirabilityScore25: Utils.getPercentile(desirabilityScores, 25),
        imps75: Utils.getPercentile(impressions, 75),
        imps50: Utils.getPercentile(impressions, 50),
        imps25: Utils.getPercentile(impressions, 25),
        medianImpressions: Utils.getPercentile(impressions, 50),
        impressions90: Utils.getPercentile(impressions, 90),
        aov80: Utils.getPercentile(aovs, 80),
        aov25: Utils.getPercentile(aovs, 25),
        upt80: Utils.getPercentile(upts, 80),
        upt25: Utils.getPercentile(upts, 25),
        revPerImp85: Utils.getPercentile(revPerImps, 85),
        influencerRev50: Utils.getPercentile(influencerRevenues, 50),
        minRevenueThreshold: Utils.getPercentile(revenues.filter(rev => rev > 0), 10),
        revenue50: Utils.getPercentile(revenues, 50),
        clicks25: Utils.getPercentile(clicksArr, 25),
        clicks75: Utils.getPercentile(clicksArr, 75),
        rpc90: Utils.getPercentile(rpcs, 90),
        influencerRev80,
        directRev80,
        directRev50,
        impsMedian
    };
}

function normalizeMetricsForScoring(dataRows) {
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

    return {
        normalizedConvRates100: dataRows.map(r => r.convRateNum * 100),
        normalizedRevPerImps100: normaliseMetricTo100(dataRows.map(r => r.revPerImp)),
        normalizedRevenues100: normaliseMetricTo100(dataRows.map(r => r.revenue)),
        normalizedRPCs100: normaliseMetricTo100(dataRows.map(r => r.rpc)),
        normalizedAovs100: normaliseMetricTo100(dataRows.map(r => r.aov))
    };
}

function calculateRowScores(r, rIndex, normalizedMetrics, medianImpressions) {
    const {
        normalizedConvRates100,
        normalizedRevPerImps100,
        normalizedRevenues100,
        normalizedRPCs100,
        normalizedAovs100
    } = normalizedMetrics;

    const revWeight = 0.32;
    const rpiWeight = 0.24;
    const rpcWeight = 0.16;
    const crWeight = 0.08;
    const aovWeight = 0.20;

    const overallScore =
        (normalizedRevenues100[rIndex] * revWeight) +
        (normalizedRevPerImps100[rIndex] * rpiWeight) +
        (normalizedRPCs100[rIndex] * rpcWeight) +
        (normalizedConvRates100[rIndex] * crWeight) +
        (normalizedAovs100[rIndex] * aovWeight);
    r.overallPerformanceScore = Math.max(0, Math.min(100, parseFloat(overallScore.toFixed(1))));

    // --- Potential Score Calculation ---
    const desirabilityWeightPotential = 0.70;
    const lowImpBoostWeightPotential = 0.30;
    const desirabilityScoreValue = (typeof r.desirabilityScore === 'number' && !isNaN(r.desirabilityScore)) ? r.desirabilityScore : 0;
    // Only apply low impression boost if desirabilityScore is at least 0.1
    const lowImpressionBoost = (desirabilityScoreValue >= 0.1 && r.imps < medianImpressions && r.imps > 0) ? 100 : 0;
    const potentialScoreVal =
        (desirabilityScoreValue * desirabilityWeightPotential) +
        (lowImpressionBoost * lowImpBoostWeightPotential);
    r.potentialScore = Math.max(0, Math.min(100, parseFloat(potentialScoreVal.toFixed(1))));
}

function checkConsistentPerformers(dataRows, percentiles) {
    const strategyExperienceMap = {};
    dataRows.forEach(r => {
        const key = r.strategy + '|' + r.actionStrategyFull;
        if (!strategyExperienceMap[key]) strategyExperienceMap[key] = 0;
        if (r.revenue >= percentiles.revenue50 ||
            r.desirabilityScore >= percentiles.desirabilityScore50 ||
            r.convRateNum >= Utils.getPercentile(dataRows.map(dr => dr.convRateNum), 50)) {
            strategyExperienceMap[key]++;
        }
    });
    return strategyExperienceMap;
}

function determineAppliedBadges(r, percentiles, consistentPerformerMap, dataRows) {
    const badges = [];
    const badgeDefs = badgeDefinitions;
    const stratKey = r.strategy + '|' + r.actionStrategyFull;

    // Standard badges
    if (r.influencerRev >= percentiles.influencerRev80 && r.revenue < percentiles.directRev80) {
        badges.push(badgeDefs.find(b => b.key === 'influencer'));
    }
    if (r.influencerRev >= percentiles.influencerRev80 && r.revenue < percentiles.directRev50 && r.imps < percentiles.impsMedian) {
        badges.push(badgeDefs.find(b => b.key === 'hiddeninfluencer'));
    }
    if (r.imps >= percentiles.impressions90 && r.ctr < 0.1) {
        badges.push(badgeDefs.find(b => b.key === 'overexposed'));
    }
    if (r.convRateNum >= percentiles.convRate90 && r.revenue > 0 && percentiles.convRate90 > 0)
        badges.push(badgeDefs.find(b => b.key === 'strongconv'));
    if (r.desirabilityScore >= percentiles.desirabilityScore80 && r.imps <= percentiles.imps50 && percentiles.desirabilityScore80 > 0)
        badges.push(badgeDefs.find(b => b.key === 'promote'));
    if (r.desirabilityScore >= percentiles.desirabilityScore80 && r.imps <= percentiles.imps50 && r.clicks <= 10 && percentiles.desirabilityScore80 > 0)
        badges.push(badgeDefs.find(b => b.key === 'hidden'));
    if (r.aov >= percentiles.aov80 && r.revenue >= percentiles.minRevenueThreshold && percentiles.aov80 > 0)
        badges.push(badgeDefs.find(b => b.key === 'aov'));
    if (r.revPerImp >= percentiles.revPerImp85 && r.imps >= percentiles.imps25 && percentiles.revPerImp85 > 0)
        badges.push(badgeDefs.find(b => b.key === 'efficient'));
    if (consistentPerformerMap[stratKey] && consistentPerformerMap[stratKey] >= 2) {
        badges.push(badgeDefs.find(b => b.key === 'consistent'));
    }
    if (r.imps >= percentiles.imps75 && r.clicks < percentiles.clicks25 && r.convRateNum < percentiles.convRate25) {
        badges.push(badgeDefs.find(b => b.key === 'needsreview'));
    }
    if (r.imps === 0 && r.clicks === 0 && r.revenue === 0 && r.convRateNum === 0) {
        badges.push(badgeDefs.find(b => b.key === 'noactivity'));
    }

    // --- NEW BADGES ---
    // One-off Star: single appearance, top 10% performance
    if (!consistentPerformerMap[stratKey] && r.revenue > 0 && (r.overallPerformanceScore >= Utils.getPercentile(dataRows.map(dr => dr.overallPerformanceScore), 90))) {
        badges.push(badgeDefs.find(b => b.key === 'oneoffstar'));
    }
    // Rising Gem: high desirability, low imps, 11-20 clicks
    if (r.desirabilityScore >= percentiles.desirabilityScore80 && r.imps <= percentiles.imps50 && r.clicks > 10 && r.clicks <= 20 && percentiles.desirabilityScore80 > 0) {
        badges.push(badgeDefs.find(b => b.key === 'risinggem'));
    }
    // Unengaged: has impressions but zero clicks/conversions
    if (r.imps > 0 && r.clicks === 0 && r.respondentConvertedSessions === 0) {
        badges.push(badgeDefs.find(b => b.key === 'unengaged'));
    }
    // Revenue Driver: top 10% of total revenue share
    if (dataRows && dataRows.length > 0) {
        const totalRevenueSum = dataRows.reduce((sum, dr) => sum + (dr.revenue || 0), 0);
        if (totalRevenueSum > 0 && (r.revenue / totalRevenueSum) * 100 >= Utils.getPercentile(dataRows.map(dr => (dr.revenue / totalRevenueSum) * 100), 90)) {
            badges.push(badgeDefs.find(b => b.key === 'revenuedriver'));
        }
    }

    return badges.filter(b => b);
}

function selectAndFormatDisplayBadges(r, appliedBadges) {
    const priorityOrderKeys = badgeDefinitions.map(b => b.key); // Use key for priority order
    // Filter appliedBadges (which are full badge objects) by checking if their key is in priorityOrderKeys
    // Then map to get the actual badge objects, maintaining priority.
    const top3Badges = priorityOrderKeys
        .map(key => appliedBadges.find(b => b.key === key)) // Find applied badge by key
        .filter(Boolean) // Remove undefined if a priority key isn't in appliedBadges
        .slice(0, 3); // Take the top 3

    let tooltipHtml = '';
    if (top3Badges.length > 0) {
        tooltipHtml = top3Badges.map(b =>
            `<span style='display:inline-flex;align-items:flex-start;margin-bottom:2px;'>
  <i class="badge-icon ${b.icon} ${b.styleClass}" style='margin-right:4px;margin-top:0px;'></i>
  <span><b>${Utils.escapeCsvValue(b.label)}</b><br>${Utils.escapeCsvValue(b.tip)}</span>
</span>`
        ).join('<br>');
    }

    if (top3Badges.length > 0) {
        const chosenBadge = top3Badges[0];
        r.flag = `<span class="badge-icon custom-badge-tooltip ${chosenBadge.styleClass}" data-badgetooltip="${tooltipHtml.replace(/"/g, '&quot;')}"><i class="${chosenBadge.icon}"></i></span>`;
        r.badgeText = chosenBadge.key; // Set badgeText to the key
    } else {
        r.flag = '';
        r.badgeText = '';
    }
}

function assignBadges(dataRows) {
    if (!dataRows || dataRows.length === 0) {
        console.warn("LOG_DATA_ASSIGNBADGES_WARN: No dataRows provided or empty. Skipping badge assignment.");
        return;
    }

    normalizeDesirabilityScores(dataRows);
    const percentiles = calculatePercentiles(dataRows);
    const normalizedMetrics = normalizeMetricsForScoring(dataRows);
    const consistentPerformerMap = checkConsistentPerformers(dataRows, percentiles);

    dataRows.forEach((r, rIndex) => {
        const appliedBadges = determineAppliedBadges(r, percentiles, consistentPerformerMap, dataRows);
        calculateRowScores(r, rIndex, normalizedMetrics, percentiles.medianImpressions);
        selectAndFormatDisplayBadges(r, appliedBadges);
    });
}

// --- Export for use in other modules ---
window.BadgesConfig = {
  badgeDefinitions,
  coreColumnKeys,
  allColumns,
  calculatedColumnDefinitions,
  assignBadges,
  determineAppliedBadges,
  normalizeDesirabilityScores,
  calculatePercentiles,
  normalizeMetricsForScoring,
  calculateRowScores,
  checkConsistentPerformers,
  selectAndFormatDisplayBadges
};

// --- Constants and Definitions ---

// !!! SECURITY WARNING !!!
// Exposing API keys directly in client-side code is highly insecure.
// For production, this key MUST be handled by a backend server.
// The client should query your server, which then securely uses the key.
//
// === Getting an API Key for https://aistudio.google.com ===
// 1. Visit https://aistudio.google.com/ and sign in with your Google account.
// 2. Open or create a new project.
// 3. Click the ⚙️ (gear icon) in the left sidebar to access project settings.
// 4. Go to the "API Key" section.
// 5. Click "Create API Key" or copy your existing one.
// 6. Use this key server-side only to securely call the Gemini API.
//    (Direct use in the browser is discouraged due to key exposure risk.)
export const coreColumnKeys = ['badgeText','experience','strategy','revenue','aov','upt'
  ,'rps','convRate','clicks','imps', 'overallPerformanceScore', 'potentialScore'];

export const badgeDefinitions = [
    { label: 'Strong Conversion', icon: 'fa-solid fa-arrow-trend-up', styleClass: 'strongconv', tip: 'Top 10% conversion rate — highly persuasive strategy' },
    { label: 'Opportunity', icon: 'fa-solid fa-lightbulb', styleClass: 'promote', tip: 'Top 20% desirability, bottom 50% impressions — strong performance if given more visibility' },
    { label: 'Hidden Gem', icon: 'fa-solid fa-gem', styleClass: 'hidden', tip: 'Top 20% desirability, bottom 50% impressions, <= 10 clicks — test prioritizing this' },
    { label: 'High AOV', icon: 'fa-solid fa-star', styleClass: 'aov', tip: 'Top 20% average order value — high revenue per buyer' },
    { label: 'Efficient Earner', icon: 'fa-solid fa-hand-holding-dollar', styleClass: 'efficient', tip: 'Top 15% revenue per impression - very efficient use of space' },
    { label: 'Volume Driver', icon: 'fa-solid fa-boxes-stacked', styleClass: 'volume', tip: 'Top 20% UPT, bottom 25% AOV — likely driving volume through low-cost items' },
    { label: 'Low UPT', icon: 'fa-solid fa-cart-flatbed', styleClass: 'lowupt', tip: 'Top 20% AOV, bottom 25% UPT — high spend but low basket depth' },
    { label: 'Influencer', icon: 'fa-solid fa-compass', styleClass: 'influencer', tip: 'Top 50% influencer revenue, zero direct revenue — generated interest leading to other purchases' }, // Changed from 'Indirect Influencer'
    { label: 'Poor Conversion', icon: 'fa-solid fa-thumbs-down', styleClass: 'poorconv', tip: 'Got clicks but zero AOV — possibly misaligned or broken experience' },
    { label: 'Ignored', icon: 'fa-solid fa-eye-slash', styleClass: 'ignored', tip: 'Bottom 50% impressions, zero clicks — lacks appeal' },
    { label: 'Low ROI', icon: 'fa-solid fa-arrow-trend-down', styleClass: 'lowroi', tip: 'Bottom 25% desirability, top 25% impressions — visible but underperforming' },
    { label: 'Consistent Performer', icon: 'fa-solid fa-medal', styleClass: 'consistent', tip: 'Performs above median in multiple campaigns/experiences' },
    { label: 'Needs Review', icon: 'fa-solid fa-magnifying-glass', styleClass: 'needsreview', tip: 'High impressions but low clicks/conversions across placements' },
    { label: 'No Activity', icon: 'fa-solid fa-ban', styleClass: 'noactivity', tip: 'Zero impressions, clicks, conversions, and revenue' },
    { label: 'Clicker, Not Closer', icon: 'fa-solid fa-mouse-pointer', styleClass: 'clickernotcloser', tip: 'High clicks but conversion rate below 1%' },
    { label: 'Overexposed', icon: 'fa-solid fa-eye', styleClass: 'overexposed', tip: 'Top 10% impressions but CTR below 0.1%' },
    { label: 'Premium Performer', icon: 'fa-solid fa-gem', styleClass: 'premium', tip: 'Top 10% revenue per click but low total clicks/impressions' },
];

export const badgeUnicodeMap = {
    'Strong Conversion': '📈', // Chart Increasing
    'Opportunity': '💡',     // Light Bulb
    'Hidden Gem': '💎',      // Gem Stone
    'High AOV': '⭐',        // Star
    'Efficient Earner': '💰', // Money Bag
    'Volume Driver': '📦',   // Package
    'Low UPT': '🛒',        // Shopping Cart
    'Influencer': '🧭',      // Compass (Matches 'Indirect Influencer' logic)
    'Poor Conversion': '👎', // Thumbs Down
    'Ignored': '🙈',        // See-No-Evil Monkey
    'Low ROI': '📉',         // Chart Decreasing
    'Consistent Performer': '🏅', // Medal
    'Needs Review': '🔍',       // Magnifying Glass
    'No Activity': '🚫',        // Prohibited/Ban
    'Clicker, Not Closer': '🖱️', // Mouse Pointer
    'Overexposed': '👁️',        // Eye
    'Premium Performer': '🏆'     // Trophy (Differentiates from Hidden Gem)
};

// Map display names (lowercase) to data keys for sorting
export const keyMap = {
  'badge': 'badgeText', // Sort by badge label text
  'experience': 'experience',
  'action': 'actionName',
  'strategy': 'strategy',
  'revenue': 'revenue',
  'aov': 'aov',
  'upt': 'upt',
  'rps': 'rps',
  'conv rate': 'convRateNum', // Sort by numeric value
  'clicks': 'clicks',
  'imps': 'imps',
  'ctr/1k': 'ctr',
  'rev/click': 'rpc',
  'desirability': 'desirability',
  'desirability score': 'desirabilityScore',
  'rev/imp': 'revPerImp',
  'inf aov': 'influencerAov',
  'inf upt': 'influencerUpt',
  'overallperformancescore': 'overallPerformanceScore', // Keep this for the new 0-1 score, renamed from performanceScore
  'potentialscore': 'potentialScore' // Added for sorting
};

// Define core and all columns
export const allColumns = [
  { key: 'badgeText', label: 'Badge', tooltip: 'Visual indicator of performance category.' },
  { key: 'experience', label: 'Experience', tooltip: 'Name of the Monetate experience.' },
  { key: 'strategy', label: 'Strategy', tooltip: 'Recommendation algorithm or strategy used.' },
  { key: 'revenue', label: 'Revenue', tooltip: 'Total revenue generated from clicked recommendations that led to a purchase.' },
  { key: 'aov', label: 'AOV', tooltip: 'Average Order Value from clicked recommendations.' },
  { key: 'upt', label: 'UPT', tooltip: 'Units Per Transaction from clicked recommendations.' },
  { key: 'rps', label: 'RPS', tooltip: 'Revenue Per Session where a recommendation was clicked.' },
  { key: 'convRate', label: 'Conv Rate', tooltip: 'Conversion Rate of sessions where a recommendation was clicked.' },
  { key: 'clicks', label: 'Clicks', tooltip: 'Total number of clicks on recommendations.' },
  { key: 'imps', label: 'Imps', tooltip: 'Total number of impressions (views) of recommendations.' },
  { key: 'ctr', label: 'CTR/1k', tooltip: 'Click-Through Rate per 1000 impressions (Clicks / Imps * 1000).' },
  { key: 'rpc', label: 'Rev/Click', tooltip: 'Revenue Per Click on recommendations.' },
  { key: 'desirability', label: 'Desirability', tooltip: 'Weighted score based on revenue per click and conversion rate. Highlights high-potential strategies.' },
  { key: 'desirabilityScore', label: 'Desirability Score', tooltip: 'Normalized desirability score (0-100).' },
  { key: 'revPerImp', label: 'Rev/Imp', tooltip: 'Revenue Per Impression.' },
  { key: 'influencerRev', label: 'Influencer Rev', tooltip: 'Revenue from sessions where a recommendation was clicked but a different item was purchased.' },
  { key: 'influencerAov', label: 'Influencer AOV', tooltip: 'Average Order Value from influencer sessions.' },
  { key: 'influencerUpt', label: 'Influencer UPT', tooltip: 'Units Per Transaction from influencer sessions.' },
  { key: 'overallPerformanceScore', label: 'Performance<br>Score', tooltip: 'Overall Performance Score (0-100). Weighted: Revenue (40%), Rev/Imp (30%), RPC (20%), Conv Rate (10%).' }, // Renamed from performanceScore, scale updated in tooltip
  { key: 'potentialScore', label: 'Potential<br>Score', tooltip: 'Overall Potential Score (0-100). Weighted: RPC (50%), Conv Rate (30%), Low Impression Boost (20%). Highlights underexposed, high-performing strategies.' } // Updated scale in tooltip
];

export const currencySymbolMap = {
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

export const insightsColumns = [
  { key: 'badgeText', label: 'Badge' }, // Changed from 'badge'
  { key: 'experience', label: 'Experience' },
  { key: 'actionName', label: 'Action Name' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'ctr', label: 'CTR (per 1k Imps)' },
  { key: 'desirabilityScore', label: 'Desirability' },
  { key: 'overallPerformanceScore', label: 'Perfomance' }, // Renamed from performanceScore
  { key: 'potentialScore', label: 'Potential' } // Updated label
  // Add or remove columns as needed for your insights table
];

export const calculatedColumnDefinitions = [
  {
    label: 'Conv Rate (%)',
    description: 'Conversion Rate as a percentage. Calculated as: (Converted Sessions / Total Sessions) * 100. Displayed with a "%" symbol.',
    usage: 'Displaying the conversion rate in a user-friendly percentage format in the main table.'
  },
  {
    label: 'Conv Rate (Numeric)',
    description: 'The underlying numeric conversion rate used in calculations. Calculated as: Converted Sessions / Total Sessions (from CSV).',
    usage: 'Internal calculation for Desirability, Overall Performance Score, and Potential Score.'
  },
  {
    label: 'RPS (Revenue Per Session)',
    description: 'Calculated as: Total Revenue (from CSV) / Total Sessions (from CSV).',
    usage: 'Assessing overall revenue efficiency per session for a strategy.'
  },
  {
    label: 'CTR/1k (Click-Through Rate per 1000 impressions)',
    description: 'Calculated as: (Clicks / Impressions) * 1000.',
    usage: 'Measuring how often recommendations are clicked relative to how many times they are shown.'
  },
  {
    label: 'Rev/Click (RPC)',
    description: 'Revenue Per Click. Calculated as: Revenue / Clicks.',
    usage: 'Determining the average revenue generated by each click on a recommendation; key input for Desirability, Performance, and Potential scores.'
  },
  {
    label: 'Desirability',
    description: 'A raw weighted score indicating engagement. Calculated as: (Revenue Per Click * 0.7) + (Numeric Conversion Rate * 0.3).',
    usage: 'Internal raw score to identify strategies that are highly engaging and convert well, prior to normalisation.'
  },
  {
    label: 'Desirability Score',
    description: 'Normalised Desirability (0-100 scale) relative to other strategies in the current view. Based on the "Desirability" metric.',
    usage: 'Identifying high-potential strategies by comparing their engagement and conversion effectiveness against others in the dataset; used for badge assignment.'
  },
  {
    label: 'Rev/Imp (Revenue Per Impression)',
    description: 'Calculated as: Revenue / Impressions.',
    usage: 'Measuring the revenue generated each time a recommendation is shown; key input for Overall Performance Score and the "Efficient Earner" badge.'
  },
  {
    label: 'Performance Score',
    description: 'Overall Performance Score (0-100). Weighted calculation: Revenue (40%), Revenue per Impression (30%), Revenue per Click (20%), Numeric Conversion Rate (10%). Each component is normalised to a 0-100 scale within the current dataset before weighting.',
    usage: 'Providing a holistic view of a strategy\'s success based on revenue generation, efficiency, and conversion.'
  },
  {
    label: 'Potential Score',
    description: 'Overall Potential Score (0-100). Weighted calculation: Revenue per Click (50%), Numeric Conversion Rate (30%), Low Impression Boost (20%). Low Impression Boost is active (contributes 100 to its weighted component) if strategy impressions are below median for the current dataset, else 0. Each main component (RPC, CR) is normalised to a 0-100 scale before weighting.',
    usage: 'Highlighting strategies that perform well on key conversion and revenue metrics but may be underexposed (low impressions).'
  },
];


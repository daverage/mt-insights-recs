# Recommendation Insight Summary

This application provides a comprehensive analysis of recommendation strategy performance data, typically exported from a Looker report. It processes a CSV file, calculates various metrics, assigns performance badges, and generates an interactive summary table. Additionally, it can leverage a Gemini API key to produce an AI-generated textual summary of the findings and allows for exporting the report in Word format.

## Features

- **CSV Upload:** Parses CSV files containing recommendation performance data.
- **Data Processing:** Cleans and normalizes input data.
- **Metric Calculation:** Computes several key performance indicators (KPIs) and derived metrics.
- **Badge Assignment:** Assigns predefined badges to strategies based on their performance relative to percentile thresholds. All badges have detailed tooltips and are prioritized for display.
- **Interactive Summary Table:** Displays the processed data with sortable columns and filterable badges and experiences.
- **AI-Powered Summary (Optional):** If a Gemini API key is provided, generates a textual summary of the key insights.
- **Download Options:**
    - Download filtered summary data as CSV.
    - Download the full report (including AI summary and data tables) as a Word document (core columns only).
    - Copy AI generation prompt and AI report text to clipboard.
- **Definitions Key:** Provides detailed explanations for all calculated metrics and badges, including tooltips and descriptions.
- **Customizable Report Title:** Allows users to set a title for the Word export.
- **Additional Instructions for AI:** Users can provide specific instructions to guide the AI report generation.

## Badges & Column Definitions

### Badge Table

| Badge | Key | Tooltip | Description |
|-------|-----|---------|-------------|
| 📈 | strongconv | Top 10% conversion rate from rec clicks — highly persuasive. Indicates strategies that consistently convert engaged users at a high rate, suggesting strong message/offer fit. | Strong Conversion: Recognizes strategies with exceptional conversion rates, highlighting persuasive recommendations. |
| 💡 | promote | High desirability, low impressions — promote for more impact. These strategies are attractive to users but underexposed, representing quick wins if given more visibility. | Opportunity: Underexposed but attractive strategies that could benefit from increased exposure. |
| 💎 | hidden | High desirability, low impressions, low clicks — test prioritizing. May be overlooked but have strong potential if surfaced more. | Hidden Gem: Strategies with strong potential that are not currently prioritized. |
| ⭐ | aov | Top 20% average order value from recs. Indicates strategies that drive larger baskets and higher-value purchases. | High AOV: Drives higher-value purchases. |
| 💰 | efficient | Top 15% revenue per impression. Highly efficient at monetizing each impression, maximizing revenue from available traffic. | Efficient Earner: Maximizes revenue per impression. |
| 🏅 | consistent | Performs above median in multiple campaigns. Reliable and steady, these strategies deliver solid results across different contexts. | Consistent Performer: Reliable results across campaigns. |
| 🔍 | needsreview | High impressions but low clicks/conversions. May be overexposed or misaligned with user intent; consider revising or replacing. | Needs Review: May require revision or reduced exposure. |
| 🚫 | noactivity | Zero impressions, clicks, conversions, and revenue. Not currently active or visible to users. | No Activity: Not active or visible. |
| 🔄 | influencer | Top 20% influencer revenue, not top 20% direct revenue. Drives purchases of other products, showing indirect value. | Influencer: Drives indirect purchases. |
| 🕵️ | hiddeninfluencer | High influencer revenue, low direct revenue, and underexposed (low impressions). May be undervalued and worth further testing. | Hidden Influencer: Indirect value, underexposed. |
| 🙈 | overexposed | Top 10% impressions but very low CTR (<0.1%). Consider reducing exposure to avoid wasted impressions. | Overexposed: High exposure, low engagement. |
| 🌟 | oneoffstar | Single-appearance strategy with top 10% performance — don’t overlook. May be a new or niche strategy with outsized impact. | One-off Star: High performer with limited appearances. |
| 📈 | risinggem | High desirability, low impressions, slightly above 10 clicks — may be emerging. Watch for future growth. | Rising Gem: Emerging strategy with growth potential. |
| 😶 | unengaged | Has impressions but zero clicks or conversions — not resonating. Consider pausing or reworking. | Unengaged: Not resonating with users. |
| ⚡ | revenuedriver | Top 10% of total revenue share — key contributor. These strategies are essential for overall program success. | Revenue Driver: Major contributor to revenue. |

### Column Table

| Key | Label | Tooltip | Description |
|-----|-------|---------|-------------|
| badgeText | Badge | Performance category badge. Shows the most important badge for this row, based on priority. | A visual indicator of the row’s performance category, such as “Strong Conversion” or “Opportunity.” Hover for details. |
| experience | Experience | Monetate experience name. The campaign or experience this strategy belongs to. | The name of the Monetate experience or campaign in which this recommendation strategy was deployed. |
| strategy | Strategy | Recommendation algorithm or strategy. The specific approach used for recommendations. | The algorithm or method used to generate recommendations (e.g., “Best Sellers,” “Personalized,” etc.). |
| overallPerformanceScore | Performance Score | Weighted score: AOV, Revenue, Rev/Imp, RPC, Conv Rate. Summarizes overall effectiveness. | A composite score reflecting the overall performance of the strategy, combining key metrics such as AOV, revenue, revenue per impression, revenue per click, and conversion rate. |
| potentialScore | Potential Score | Weighted: Desirability Score, Low Impression Boost. Highlights underexposed high-potential strategies. | A score indicating the potential for further growth, based on desirability and low impression boost. |
| revenue | Revenue | Revenue from clicked recommendations (purchased that item). | Total revenue generated from sessions where a recommendation was clicked and the recommended item was purchased. |
| aov | AOV | Average Order Value from clicked recommendations. | The average order value for purchases resulting from clicked recommendations. |
| upt | UPT | Units Per Transaction from clicked recommendations. | The average number of units per transaction for purchases from clicked recommendations. |
| rps | RPS | Revenue Per Session (clicked recs): Cart Revenue (Purchased Clicked Recommendation) / Respondent Sessions. | Revenue per session for sessions where a recommendation was clicked. |
| influencerRev | Influencer Rev | Revenue from sessions where a rec was clicked but a different item was purchased. | Revenue generated from sessions where a recommendation was clicked, but a different item was purchased (indirect influence). |
| influencerAov | Influencer AOV | AOV from influencer sessions. | Average order value for sessions where a recommendation influenced a purchase of a different item. |
| influencerUpt | Influencer UPT | UPT from influencer sessions. | Units per transaction for sessions influenced by a recommendation but resulting in a different purchase. |
| respondentSessions | Rec Click Sessions | Sessions where a rec was clicked. | Number of sessions in which a recommendation was clicked. |
| respondentConvertedSessions | Rec Click Converted Sessions | Sessions where a rec was clicked and a conversion occurred (any product). | Sessions where a recommendation was clicked and a purchase was made (any product). |
| convRate | Conv Rate (Clicked) | Conversion rate for sessions where a rec was clicked: Respondent Converted Sessions / Respondent Sessions. | The percentage of sessions with a clicked recommendation that resulted in a purchase. |
| ctr | CTR/1k | Click-Through Rate per 1,000 impressions. | The number of clicks per 1,000 impressions for this strategy. |
| revInfluencePct | % Revenue Influenced | Cart Revenue (Purchased Clicked Recommendation) as a % of Total Revenue. | The percentage of total revenue directly attributable to clicked recommendations. |
| sessInfluencePct | % Sessions Influenced | Respondent Sessions as a % of Total Sessions. | The percentage of all sessions that included a clicked recommendation. |
| revPerImp | Rev/Imp | Revenue per impression. | Revenue generated per impression of the recommendation. |
| rpc | Rev/Click | Revenue per click. | Revenue generated per click on the recommendation. |
| desirabilityScore | Desirability Score | Normalized desirability score (0-100). | A score (0-100) reflecting how attractive the strategy is to users, based on conversion rate, revenue per impression, and click-through rate. |

## How to Use

1.  **Upload CSV:**
    *   Click "Choose CSV File" and select the CSV file exported from the [Monetate Looker Report (Looks/2372)](https://kibo.looker.com/looks/2372).
    *   **Important:** When downloading from Looker, ensure "Visualization options applied" is checked, the format is "CSV", and "All Results" are included.
2.  **Report Title (Optional):**
    *   Enter a custom title in the "Report Title" field. This will be used in the Word document export.
3.  **Generate Summary:**
    *   Click "Generate Summary". This processes the data and populates the "Recommendation Summary" table.
4.  **Filters:**
    *   **Badges:** Filter the summary table by selecting one or more performance badges.
    *   **Experiences:** Filter by Monetate experience names. A search bar is available for experiences.
    *   **Show all metrics:** Toggles between a core set of columns and all available columns in the "Recommendation Summary" table.
    *   **Static Badges:** If checked, badges are calculated based on the entire dataset, regardless of active filters. If unchecked, badges are recalculated based on the currently filtered data.
    *   **Additional Instructions for Report (Optional):** Provide specific guidance for the AI report generation (e.g., "Focus on strategies with high AOV but low click-through rate").
5.  **Manage API Key (for AI Summary):**
    *   Click "Manage API Key".
    *   Enter your Gemini API key (starts with `AIza...`). You can obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   The key is stored locally in your browser's local storage.
6.  **Generate AI Report:**
    *   Once an API key is saved and data is processed, click "Generate AI Report".
    *   The AI-generated summary will appear in the "AI Summary" section.
7.  **Download Options:**
    *   **Download CSV:** Downloads the currently visible (filtered) data from the "Recommendation Summary" table.
    *   **Generate Prompt:** Creates a detailed text prompt (including a JSON representation of the top 50 filtered rows) that can be used with an external AI model.
    *   **Download Report (Word):** Downloads a `.docx` file containing the report title, AI summary (if generated), data tables (Top Performers, Key Opportunities, Underperformers/Concerns, Other Notable Insights), and the definitions key (core columns only).
    *   **Copy Prompt Text / AI Report:** Buttons in the "AI Summary" section allow copying the generated prompt or the AI report content.
    *   **Download Prompt Data / Report Data:** Buttons in the "AI Summary" section allow downloading the CSV data used for generating the prompt or the AI report.
8.  **Tables:**
    *   **Recommendation Summary:** The main table showing all processed strategy data. Columns are sortable.
    *   **Definitions Key:** Explains each badge and calculated metric.
    *   **AI Summary:** Displays the AI-generated report.
    *   All these sections are collapsible.

## Calculations and Logic

The application performs several calculations to derive metrics and assign badges.

### Data Cleaning and Preparation

-   Numeric values are cleaned by removing non-numeric characters (except decimal points and negative signs).
-   Empty or invalid numeric fields are typically treated as 0.
-   `convRate` (Conversion Rate) is processed from percentage strings to numeric values (e.g., "5.2%" becomes 0.052 for calculations, then formatted back to "5.20%" for display).

### Core Metrics (from CSV or calculated)

The input CSV is expected to contain columns like:
`Experience`, `Action Strategy Full`, `Strategy`, `Impressions`, `Clicks`, `Respondent Sessions`, `Respondent Converted Sessions`, `Cart Revenue (Purchased Clicked Recommendation)`, `Cart AOV (Purchased Clicked Recommendation)`, `Cart UPT (Purchased Clicked Recommendation)`, `Influencer Revenue`, `Influencer AOV`, `Influencer UPT`, `Desirability`.

From these, the following are often directly used or slightly processed:
-   `experience`: Monetate experience name.
-   `strategy`: Recommendation algorithm or strategy name.
-   `imps`: Impressions.
-   `clicks`: Clicks.
-   `revenue`: `Cart Revenue (Purchased Clicked Recommendation)`.
-   `aov`: `Cart AOV (Purchased Clicked Recommendation)`.
-   `upt`: `Cart UPT (Purchased Clicked Recommendation)`.
-   `respondentSessions`: Sessions where a recommendation was clicked.
-   `respondentConvertedSessions`: Sessions where a rec was clicked AND a conversion occurred.
-   `influencerRev`: Influencer Revenue.
-   `influencerAov`: Influencer AOV.
-   `influencerUpt`: Influencer UPT.
-   `desirability`: A raw desirability score from the input data.

### Calculated Metrics

-   **`convRateNum` (Numeric Conversion Rate):**
    `respondentConvertedSessions / respondentSessions` (if `respondentSessions > 0`, else 0).
-   **`convRate` (Formatted Conversion Rate):**
    `convRateNum` formatted as a percentage string (e.g., "5.20%").
-   **`ctr` (Click-Through Rate per 1k impressions):**
    `(clicks / imps) * 1000` (if `imps > 0`, else 0). Formatted to 2 decimal places.
-   **`rps` (Revenue Per Session - clicked recs):**
    `revenue / respondentSessions` (if `respondentSessions > 0`, else 0).
-   **`revPerImp` (Revenue Per Impression):**
    `revenue / imps` (if `imps > 0`, else 0).
-   **`rpc` (Revenue Per Click):**
    `revenue / clicks` (if `clicks > 0`, else 0).
-   **`desirabilityScore` (Normalized Desirability Score):**
    The raw `desirability` metric is normalized to a 0-100 scale across all data rows.
    Formula: `((current_desirability - min_desirability) / (max_desirability - min_desirability)) * 100`.
    If `max_desirability - min_desirability` is 0, score is 100 if `min_desirability > 0`, else 0. If `desirability` is not a valid number, score is 0.
-   **`overallPerformanceScore` (0-100):**
    A weighted score based on normalized metrics. Each component metric (Revenue, Rev/Imp, RPC, Conv Rate, AOV) is first normalized to a 0-100 scale across all data rows.
    Weights:
    *   Normalized Revenue: 32%
    *   Normalized Rev/Imp: 24%
    *   Normalized RPC: 16%
    *   Normalized Conv Rate (numeric * 100): 8%
    *   Normalized AOV: 20%
    Formula: `(norm_revenue * 0.32) + (norm_rev_per_imp * 0.24) + (norm_rpc * 0.16) + (norm_conv_rate * 0.08) + (norm_aov * 0.20)`.
    The final score is capped between 0 and 100.
-   **`potentialScore` (0-100):**
    A weighted score indicating untapped potential.
    Weights:
    *   `desirabilityScore`: 70%
    *   `lowImpressionBoost`: 30%
    `lowImpressionBoost` is 100 if `desirabilityScore >= 0.1` AND `imps < median_impressions` AND `imps > 0`. Otherwise, it's 0.
    Formula: `(desirabilityScore * 0.70) + (lowImpressionBoost * 0.30)`.
    The final score is capped between 0 and 100.

### Percentile Calculations

Percentiles are calculated for various metrics across the dataset (or filtered dataset if "Static Badges" is unchecked). These are used as thresholds for badge assignment. The `Utils.getPercentile(array, p)` function is used, which sorts the array and finds the value at the p-th percentile, interpolating if necessary.

Metrics for which percentiles are calculated include: `convRateNum`, `desirabilityScore`, `imps`, `aov`, `upt`, `revPerImp`, `influencerRev`, `clicks`, `revenue`, `rpc`.

Key percentiles used:
-   `convRate90`, `convRate25`
-   `desirabilityScore80`, `desirabilityScore50`, `desirabilityScore25`
-   `impressions90`, `imps75`, `imps50` (medianImpressions), `imps25`
-   `aov80`, `aov25`
-   `revPerImp85`
-   `influencerRev80`
-   `directRev80`, `directRev50` (percentiles of `revenue`)
-   `minRevenueThreshold` (10th percentile of revenues > 0)
-   `clicks75`, `clicks25`
-   `rpc90`

### Badge Assignment Logic (`determineAppliedBadges` function)

Badges are assigned based on rules comparing a strategy's metrics against the calculated percentiles. A strategy can have multiple badges, but typically the top 3 by a predefined priority are displayed.

**Badge Definitions & Primary Conditions:**

*   **Strong Conversion (📈):** `convRateNum >= convRate90` AND `revenue > 0` AND `convRate90 > 0`.
*   **Opportunity (💡):** `desirabilityScore >= desirabilityScore80` AND `imps <= imps50` AND `desirabilityScore80 > 0`.
*   **Hidden Gem (💎):** `desirabilityScore >= desirabilityScore80` AND `imps <= imps50` AND `clicks <= 10` AND `desirabilityScore80 > 0`.
*   **High AOV (⭐):** `aov >= aov80` AND `revenue >= minRevenueThreshold` AND `aov80 > 0`.
*   **Efficient Earner (💰):** `revPerImp >= revPerImp85` AND `imps >= imps25` AND `revPerImp85 > 0`.
*   **Consistent Performer (🏅):** Strategy appears in multiple campaigns (Experience + Action combinations) and performs above median (50th percentile) for `revenue` OR `desirabilityScore` OR `convRateNum` in at least 2 of those appearances.
*   **Needs Review (🔍):** `imps >= imps75` AND `clicks < clicks25` AND `convRateNum < convRate25`.
*   **No Activity (🚫):** `imps === 0` AND `clicks === 0` AND `revenue === 0` AND `convRateNum === 0`.
*   **Influencer (🔄):** `influencerRev >= influencerRev80` AND `revenue < directRev80`.
*   **Hidden Influencer (🕵️):** `influencerRev >= influencerRev80` AND `revenue < directRev50` AND `imps < impsMedian`.
*   **Overexposed (🙈):** `imps >= impressions90` AND `ctr < 0.1`.
*   **One-off Star (🌟):** Not a 'Consistent Performer', `revenue > 0`, AND `overallPerformanceScore >= 90th percentile of overallPerformanceScore`.
*   **Rising Gem (📈 - different icon/style):** `desirabilityScore >= desirabilityScore80` AND `imps <= imps50` AND `clicks > 10` AND `clicks <= 20` AND `desirabilityScore80 > 0`.
*   **Unengaged (😶):** `imps > 0` AND `clicks === 0` AND `respondentConvertedSessions === 0`.
*   **Revenue Driver (⚡):** Strategy's revenue contribution is in the top 10% of total revenue share across all strategies. (`(r.revenue / total_revenue_sum) * 100 >= 90th percentile of revenue shares`).

The `selectAndFormatDisplayBadges` function then chooses up to the top 3 badges based on the order in `badgeDefinitions` and formats them for display with tooltips.

### Word Document Generation (`_generateWordDocumentBaseHtml` and related functions)

The Word document is generated by creating an HTML string which is then converted to a `.docx` file using the `html-docx-js` library.
The HTML includes:
-   Monetate logo.
-   Report Title (if provided).
-   AI Summary (if generated, converted from Markdown to HTML).
-   Data Tables:
    -   These are generated by filtering the main dataset based on specific badge criteria (e.g., "Opportunity" or "Hidden Gem" for the Key Opportunities table).
    -   A predefined set of columns is used for these tables.
    -   `_generateWordTableHtml` formats the data into HTML tables.
    -   `_formatCellForWord` formats individual cell values, including currency symbols and badge icons (unicode).
-   Definitions Key:
    -   `_generateDefinitionsKeyHtmlForWord` creates an HTML representation of the badge and calculated metric definitions.

### AI Report Generation

-   **Prompt Generation (`generatePromptText`):**
    *   Constructs a detailed prompt for the Gemini AI model.
    *   Includes:
        *   Context about the data (source, meaning of columns, currency).
        *   Badge meanings.
        *   A request for a Markdown report with specific sections: Executive Summary, Top Performers, Key Opportunities, Underperformers/Concerns, Other Notable Insights, Actionable Recommendations.
        *   Additional instructions provided by the user.
        *   The top 50 rows of the currently filtered data, formatted as JSON.
-   **API Call (`AIService.generateReport`):**
    *   Sends the generated prompt to the Gemini API using the user's API key.
-   **Display (`displayAiReport`):**
    *   The Markdown response from the AI is converted to HTML using `marked.js` and sanitized using `DOMPurify` before being displayed.

## File Structure

-   `index.html`: The main page structure.
-   `css/style.css`: Styles for the application.
-   `js/`: Contains the JavaScript modules:
    -   `main.js`: Initializes the application, event listeners.
    -   `actions.js`: Handles user actions like generating reports, downloads, prompt generation.
    -   `ai_service.js`: Interacts with the Gemini API.
    -   `badges.js`: Contains all definitions and logic for badges, column configurations, and score calculations (Overall Performance, Potential).
    -   `config.js`: General configuration, currency symbols, feature flags (references `badges.js` for most data structure definitions).
    -   `data.js`: Handles CSV parsing, data processing, filtering, and sorting.
    -   `dom.js`: Manages DOM element selections and manipulations.
    -   `state.js`: Manages the application's state (raw data, filtered data, API key, etc.).
    -   `ui.js`: Handles UI updates, modal interactions, table rendering.
    -   `utils.js`: Utility functions for number cleaning, percentile calculation, CSV escaping, etc.
-   `brand/`: Contains branding assets (logo, icons).
-   `favicon.ico`: Application favicon.

## Dependencies

-   **PapaParse:** For CSV parsing.
-   **FileSaver.js:** For triggering file downloads.
-   **html-docx-js:** For converting HTML to Word documents.
-   **Marked.js:** For converting Markdown to HTML (for AI report).
-   **DOMPurify:** For sanitizing HTML generated from Markdown.
-   **Google Fonts:** Inter, IBM Plex Mono, Montserrat, Playfair Display.
-   **Font Awesome:** For icons.
-   **@google/generative-ai:** For interacting with the Gemini API.

This provides a detailed overview of the Recommendation Insight Summary tool, its functionalities, and the underlying calculations.

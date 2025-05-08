# MT Insights: Recommendations

This application, "MT Insights: Recommendations," allows you to upload CSV files containing recommendation data to generate insights, summaries, and AI-powered reports. It is designed to work with data exported from a specific Looker Report (details in the app).

## Features

*   **Upload CSV Data**: Import your recommendation data from a CSV file.
*   **Generate Summaries**: Get quick summaries and insights from your data, displayed in tables.
*   **Interactive Filtering**: Filter the displayed data by "Badges" and "Experiences."
*   **AI-Powered Reports**: Leverage the Gemini API to generate detailed analytical reports based on your data. (Requires a user-provided Google AI Studio API Key).
*   **Customizable Reports**:
    *   Optionally set a custom title for your reports.
    *   Provide additional instructions to guide the AI report generation.
*   **Downloadable Content**:
    *   Download the filtered summary data as a CSV file.
    *   Download the comprehensive AI-generated report (including tables and definitions) as a Word (.docx) document.
    *   Generate a text prompt based on your data for use with external AI models.
*   **Clear Definitions**: An in-app key explains the various badges and calculated metrics used in the tables.
*   **User-Friendly Interface**: Includes a built-in help modal to guide users through the application's features and an API key management modal.

## How to Run

To run this application, you need the main application binary for your operating system and the `resources.neu` file. Both files **must be placed in the same directory**.

After building the project (e.g., by running `neu build`), you will typically find these files in the `dist/mt-insights-recommendations/` directory.

**Download Links (Placeholder):**
*These links are placeholders. You will need to update them if you host these files, for example, on GitHub Releases. Otherwise, users will need to build the project themselves (see below).*

*   `resources.neu`: `[Link to your hosted resources.neu]` (Locally: `dist/mt-insights-recommendations/resources.neu`)

### Windows

1.  **Download**:
    *   Executable: `mt-insights-recommendations-win_x64.exe` - `[Link to your hosted Windows binary]` (Locally: `dist/mt-insights-recommendations/mt-insights-recommendations-win_x64.exe`)
    *   Resources: `resources.neu` (see above)
    *   *Note*: If using bundles created by `build-scripts/build-win.sh`, ensure `WebView2Loader.dll` is also present with the executable.
2.  Place `mt-insights-recommendations-win_x64.exe` and `resources.neu` (and `WebView2Loader.dll` if applicable) in the same folder.
3.  Double-click `mt-insights-recommendations-win_x64.exe` to run.

### macOS

1.  **Download**:
    *   Executable: `mt-insights-recommendations-mac_universal` - `[Link to your hosted macOS universal binary]` (Locally: `dist/mt-insights-recommendations/mt-insights-recommendations-mac_universal`)
    *   Resources: `resources.neu` (see above)
2.  Place both `mt-insights-recommendations-mac_universal` and `resources.neu` in the same folder.
3.  Make the binary executable: Open Terminal, navigate to the folder, and run `chmod +x mt-insights-recommendations-mac_universal`.
4.  Double-click `mt-insights-recommendations-mac_universal` or run from the Terminal: `./mt-insights-recommendations-mac_universal`.

### Linux

1.  **Download**:
    *   Executable: `mt-insights-recommendations-linux_x64` (or `_arm64`, `_armhf` depending on architecture) - `[Link to your hosted Linux binary]` (Locally: `dist/mt-insights-recommendations/mt-insights-recommendations-linux_x64`)
    *   Resources: `resources.neu` (see above)
2.  Place both the Linux binary and `resources.neu` in the same folder.
3.  Make the binary executable: Open Terminal, navigate to the folder, and run `chmod +x mt-insights-recommendations-linux_x64` (adjust filename if using a different architecture).
4.  Run from the Terminal: `./mt-insights-recommendations-linux_x64`.

## Building from Source (Basic)

1.  Clone this repository.
2.  Ensure you have the Neutralinojs CLI installed: `npm install -g @neutralinojs/neu`.
3.  Navigate to the root project directory in your terminal.
4.  Run the command: `neu build`.
5.  The distributable application files (binaries and `resources.neu`) will be generated in the `dist/mt-insights-recommendations/` directory.

## Generating Application Bundles (Using `neutralino-build-scripts`)

For more polished application bundles (e.g., a structured app folder for Windows or a `.app` bundle for macOS), this project is configured to use the `hschneider/neutralino-build-scripts`.

1.  Ensure the `build-scripts` directory from `https://github.com/hschneider/neutralino-build-scripts` is present in the project root. If not, clone it:
    `git clone https://github.com/hschneider/neutralino-build-scripts.git build-scripts`
2.  Install `jq` (a command-line JSON processor). Refer to the `neutralino-build-scripts` documentation or web resources for installation instructions for your OS.
3.  Navigate to the `build-scripts` directory in your terminal.
4.  Run the appropriate script for your target platform:
    *   Windows: `./build-win.sh`
    *   macOS: `./build-mac.sh`
    *   Linux: `./build-linux.sh`
5.  The output bundles will typically be located in a `dist` folder, either within the `build-scripts` directory or the main project `dist` folder. These bundles will package the executable, resources, and any necessary helper files (like `WebView2Loader.dll` for Windows or creating a `.app` structure for macOS).

## API Key for AI Features

To use the "Generate AI Report" feature, you will need a Gemini API Key from Google AI Studio. The application will prompt you to enter this key upon first use of the feature. The key is then saved to your browser's local storage for convenience.

## Contributors

[![Contributors](https://contrib.rocks/image?repo=neutralinojs/neutralinojs-minimal)](https://github.com/neutralinojs/neutralinojs-minimal/graphs/contributors)

## License

[MIT](LICENSE)

## Icon credits

- `trayIcon.png` - Made by [Freepik](https://www.freepik.com) and downloaded from [Flaticon](https://www.flaticon.com)

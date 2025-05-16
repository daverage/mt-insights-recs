const AIService = (() => {
    const GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey';

    let _shouldTriggerReportAfterSave = true;

    function _saveApiKey() {
        if (Dom.apiKeyInput && Dom.apiKeyEntryModal && Dom.apiKeyEntryStatus) {
            const newKey = Dom.apiKeyInput.value.trim();
            if (newKey) {
                localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, newKey);
                Dom.apiKeyEntryStatus.textContent = 'API Key saved successfully!';
                Dom.apiKeyEntryStatus.style.color = 'green';
                setTimeout(() => {
                    Dom.apiKeyEntryModal.style.display = 'none';
                    Dom.apiKeyEntryStatus.textContent = '';

                    if (_shouldTriggerReportAfterSave) {
                        if (typeof State !== 'undefined' &&
                            typeof State.getFilteredData === 'function' &&
                            typeof Actions !== 'undefined' &&
                            typeof Actions.generateAiReport === 'function') {

                            if (State.getFilteredData().length > 0) {
                                Actions.generateAiReport();
                            } else {
                                console.log('API key saved, but no data available to generate an AI report at this time.');
                            }
                        } else {
                            console.warn('State or Actions module not available, cannot automatically trigger AI report generation after saving API key.');
                        }
                    } else {
                        console.log('API key saved via "Manage API Key". Report generation not triggered.');
                    }
                    _shouldTriggerReportAfterSave = true;
                }, 1500);
            } else {
                Dom.apiKeyEntryStatus.textContent = 'Please enter a valid API Key.';
                Dom.apiKeyEntryStatus.style.color = 'red';
            }
        }
    }

    function _closeApiKeyModal() {
        if (Dom.apiKeyEntryModal) {
            Dom.apiKeyEntryModal.style.display = 'none';
            if (Dom.apiKeyEntryStatus) {
                Dom.apiKeyEntryStatus.textContent = '';
            }
            _shouldTriggerReportAfterSave = true;
        }
    }

    return {
        init: () => {
            if (Dom.saveApiKeyBtn) {
                Dom.saveApiKeyBtn.addEventListener('click', _saveApiKey);
            }
            if (Dom.closeApiKeyModal) {
                Dom.closeApiKeyModal.addEventListener('click', _closeApiKeyModal);
            }
            window.addEventListener('click', (event) => {
                if (Dom.apiKeyEntryModal && event.target === Dom.apiKeyEntryModal) {
                    _closeApiKeyModal();
                }
            });
        },

        getApiKey: () => {
            return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
        },

        requestApiKey: (triggerReportOnSave = true) => {
            _shouldTriggerReportAfterSave = triggerReportOnSave;
            if (Dom.apiKeyEntryModal && Dom.apiKeyInput && Dom.apiKeyEntryStatus) {
                Dom.apiKeyInput.value = '';
                Dom.apiKeyEntryStatus.textContent = '';
                Dom.apiKeyEntryModal.style.display = 'block';
                Dom.apiKeyInput.focus();
            }
        },

        manageApiKey: () => {
            AIService.requestApiKey(false);
        },

        callGemini: async (apiKey, fullPrompt, _modelTried) => {
            if (!apiKey) {
                return Promise.reject("API Key is missing. Cannot call Gemini API.");
            }
            if (!fullPrompt) {
                return Promise.reject("Prompt is missing. Cannot call Gemini API.");
            }

            // Default model order: try Pro first, then Flash if quota error
            const primaryModel = "gemini-2.5-pro-exp-03-25";
            const fallbackModel = "gemini-2.5-flash-preview-04-17";
            const modelToUse = _modelTried === fallbackModel ? fallbackModel : primaryModel;

            try {
                const googleGenAiModule = await import('https://esm.run/@google/generative-ai');
                const GoogleGenerativeAI = googleGenAiModule.GoogleGenerativeAI;

                if (!GoogleGenerativeAI) {
                    throw new Error("GoogleGenerativeAI SDK not loaded. Check import map and network.");
                }
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelToUse });

                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                const text = await response.text();
                return text;

            } catch (error) {
                
                let errorMessage = `Error generating report: ${error.message || 'Unknown error'}.`;
                const isQuotaError = (error && error.message && (
                    error.message.toLowerCase().includes('quota') ||
                    error.message.includes('429')
                ));
                if (isQuotaError && modelToUse === primaryModel) {
                    console.error("Quoata hit moving to fallback:", fallbackModel);
                    try {
                        return await AIService.callGemini(apiKey, fullPrompt, fallbackModel);
                    } catch (fallbackError) {
                        // If fallback also fails, show both errors
                        console.error("Had a prolem with fallback model:", fallbackError);
                        errorMessage += `\nTried fallback model (${fallbackModel}) but also failed: ${fallbackError.message || fallbackError}`;
                    }
                } else if (error && error.message) {
                    console.error("Error calling Gemini API:", error);
                    if (error.message.toLowerCase().includes('api key not valid') || 
                        error.message.toLowerCase().includes('invalid api key') || 
                        (error.message.includes('[400]') && error.message.toLowerCase().includes('api_key'))) {
                        errorMessage += ' Please verify your API key.';
                    } else if (isQuotaError) {
                        errorMessage += ' You might have exceeded your API quota.';
                    } else if (error.message.includes("GoogleGenerativeAI SDK not loaded")) {
                        errorMessage += ' The AI SDK could not be loaded. Check your internet connection and browser console for errors related to @google/generative-ai module loading.';
                    }
                }
                return Promise.reject(errorMessage);
            }
        }
    };
})();

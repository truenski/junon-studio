/**
 * Content Script for Junon.io Command Blocks Automation
 * Runs in the context of the junon.io page
 */

console.log('[Junon Extension] Content script loading...');
console.log('[Junon Extension] Script execution context:', {
    hasWindow: typeof window !== 'undefined',
    hasDocument: typeof document !== 'undefined',
    location: window.location?.href || 'N/A'
});

// Check immediately if scripts are available
const checkScripts = () => {
    const hasAutomation = typeof window !== 'undefined' && typeof window.JunonAutomation !== 'undefined';
    const hasExtractor = typeof window !== 'undefined' && typeof window.JunonExtractor !== 'undefined';
    console.log('[Junon Extension] Scripts check:', { hasAutomation, hasExtractor });
    
    // If scripts are not available, wait a bit and check again
    if (!hasAutomation || !hasExtractor) {
        console.warn('[Junon Extension] Scripts not found on first check');
        setTimeout(() => {
            console.log('[Junon Extension] Re-checking scripts after delay...');
            const hasAutomation2 = typeof window !== 'undefined' && typeof window.JunonAutomation !== 'undefined';
            const hasExtractor2 = typeof window !== 'undefined' && typeof window.JunonExtractor !== 'undefined';
            console.log('[Junon Extension] Scripts re-check:', { hasAutomation: hasAutomation2, hasExtractor: hasExtractor2 });
            
            if (!hasAutomation2 || !hasExtractor2) {
                console.error('[Junon Extension] Scripts still not available!');
                console.error('[Junon Extension] This usually means:');
                console.error('[Junon Extension] 1. The page was loaded before the extension was installed/updated');
                console.error('[Junon Extension] 2. The content script failed to load');
                console.error('[Junon Extension] 3. There is a CSP (Content Security Policy) blocking the script');
                console.error('[Junon Extension] SOLUTION: Please refresh the page (F5 or Ctrl+R)');
            }
        }, 1000);
    } else {
        console.log('[Junon Extension] ✓ All scripts are available!');
    }
};

// Check scripts after a short delay to allow junon_automation.js to load
setTimeout(checkScripts, 100);
setTimeout(checkScripts, 500);
setTimeout(checkScripts, 1000);

// Listen for messages from the popup - MUST be registered FIRST (before anything else)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Junon Extension] Message received:', request.action);
    console.log('[Junon Extension] Scripts status:', { 
        JunonAutomation: typeof window.JunonAutomation !== 'undefined',
        JunonExtractor: typeof window.JunonExtractor !== 'undefined'
    });
    
    if (request.action === "extractTriggers") {
        try {
            // Wait for JunonExtractor to be available
            const extractData = async () => {
                let retries = 0;
                const maxRetries = 20; // Increased retries
                
                // First, try to inject the script if it's not available
                if (!window.JunonExtractor && !window.JunonAutomation) {
                    console.log('[Junon Extension] Scripts not found, attempting to inject...');
                    try {
                        const script = document.createElement('script');
                        script.src = chrome.runtime.getURL('junon_automation.js');
                        script.onload = () => {
                            console.log('[Junon Extension] Script injected successfully');
                        };
                        script.onerror = () => {
                            console.error('[Junon Extension] Failed to inject script');
                        };
                        (document.head || document.documentElement).appendChild(script);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        console.error('[Junon Extension] Error injecting script:', error);
                    }
                }
                
                while (!window.JunonExtractor && retries < maxRetries) {
                    console.log(`[Junon Extension] Waiting for JunonExtractor... (${retries + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                    retries++;
                }
                
                console.log('[Junon Extension] Final check - JunonExtractor:', typeof window.JunonExtractor !== 'undefined');
                
                if (!window.JunonExtractor) {
                    console.error('[Junon Extension] JunonExtractor still not available after retries');
                    sendResponse({ success: false, error: 'Extractor script not loaded. Please refresh the page (F5 or Ctrl+R).' });
                    return;
                }
                
                try {
                    const extractor = new window.JunonExtractor();
                    const data = extractor.extractAll();
                    console.log('[Junon Extension] Extraction completed:', data);
                    sendResponse({ success: true, data });
                } catch (error) {
                    console.error('[Junon Extension] Extraction error:', error);
                    sendResponse({ success: false, error: error.message });
                }
            };
            
            extractData();
            return true; // Keep the message channel open for async response
        } catch (error) {
            sendResponse({ success: false, error: error.message });
            return false;
        }
    }
    
    if (request.action === "executeAutomation") {
        // JunonAutomation should already be loaded by manifest
        const executeAutomation = async () => {
            // First, try to inject the script if it's not available
            if (!window.JunonAutomation && !window.JunonExtractor) {
                console.log('[Junon Extension] Scripts not found, attempting to inject...');
                try {
                    const script = document.createElement('script');
                    script.src = chrome.runtime.getURL('junon_automation.js');
                    script.onload = () => {
                        console.log('[Junon Extension] Script injected successfully');
                    };
                    script.onerror = () => {
                        console.error('[Junon Extension] Failed to inject script');
                    };
                    (document.head || document.documentElement).appendChild(script);
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error('[Junon Extension] Error injecting script:', error);
                }
            }
            
            // Wait a bit to ensure script is loaded
            let retries = 0;
            const maxRetries = 20; // Increased retries
            while (!window.JunonAutomation && retries < maxRetries) {
                console.log(`[Junon Extension] Waiting for JunonAutomation... (${retries + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 200));
                retries++;
            }
            
            console.log('[Junon Extension] Final check - JunonAutomation:', typeof window.JunonAutomation !== 'undefined');
            
            if (!window.JunonAutomation) {
                console.error('[Junon Extension] JunonAutomation still not available after retries');
                sendResponse({ success: false, error: 'Automation script not loaded. Please refresh the page (F5 or Ctrl+R).' });
                return;
            }
            
            try {
                console.log('[Junon Extension] Creating automation with data:', request.data);
                const automation = new window.JunonAutomation(request.data);
                const result = await automation.run();
                console.log('[Junon Extension] Automation completed:', result);
                sendResponse({ success: true, message: "Automation completed", ...result });
            } catch (error) {
                console.error('[Junon Extension] Automation error:', error);
                sendResponse({ success: false, error: error.message });
            }
        };
        
        executeAutomation();
        return true; // Keep the message channel open for async response
    }
    
    return false;
});

// Listen for progress updates from JunonAutomation (via custom events)
window.addEventListener('junonProgressUpdate', (event) => {
    const progress = event.detail;
    // Forward to popup
    chrome.runtime.sendMessage({
        action: "progressUpdate",
        progress: progress
    }).catch(() => {});
});

// Log script availability after a delay to allow junon_automation.js to load
setTimeout(() => {
    console.log('[Junon Extension] Content script loaded');
    console.log('[Junon Extension] window type:', typeof window);
    console.log('[Junon Extension] window.JunonAutomation type:', typeof window.JunonAutomation);
    console.log('[Junon Extension] window.JunonExtractor type:', typeof window.JunonExtractor);
    console.log('[Junon Extension] JunonAutomation available:', typeof window.JunonAutomation !== 'undefined');
    console.log('[Junon Extension] JunonExtractor available:', typeof window.JunonExtractor !== 'undefined');
    
    // Try to access window properties to see what's available
    console.log('[Junon Extension] window properties check:', {
        hasWindow: typeof window !== 'undefined',
        windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(k => k.includes('Junon')) : []
    });
    
    if (typeof window.JunonAutomation === 'undefined' || typeof window.JunonExtractor === 'undefined') {
        console.error('[Junon Extension] ✗ WARNING: Some scripts are not loaded!');
        console.error('[Junon Extension] This may happen if:');
        console.error('[Junon Extension] 1. The page was loaded before the extension was installed/updated');
        console.error('[Junon Extension] 2. The content script failed to load');
        console.error('[Junon Extension] 3. There is a CSP (Content Security Policy) blocking the script');
        console.error('[Junon Extension] SOLUTION: Please refresh the page (F5 or Ctrl+R)');
        
        // Try to manually check if the script file exists
        console.log('[Junon Extension] Attempting to verify script file...');
        const scriptUrl = chrome.runtime.getURL('junon_automation.js');
        console.log('[Junon Extension] Script URL:', scriptUrl);
    } else {
        console.log('[Junon Extension] ✓ All scripts are loaded and available!');
    }
}, 500);

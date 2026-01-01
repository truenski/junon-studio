/**
 * Content Script for Junon.io Command Blocks Automation
 * Runs in the context of the junon.io page
 */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "executeAutomation") {
        const automation = new JunonAutomation(request.data);
        automation.run()
            .then(() => {
                sendResponse({ success: true, message: "Automation completed" });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for async response
    }
});

// Inject the automation class into the page context
const script = document.createElement('script');
script.textContent = `
${document.querySelector('script[src*="junon_automation"]')?.textContent || ''}

${JunonAutomation.toString()}

// Make it available globally
window.JunonAutomation = JunonAutomation;
`;
document.documentElement.appendChild(script);

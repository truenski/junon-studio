/**
 * Background Service Worker for Junon Automation Extension
 */

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Junon Automation Extension installed');
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes('junon.io')) {
        console.log('Junon.io tab detected');
    }
});

// Content script for editor local - syncs data to chrome.storage

(function() {
  'use strict';

  // Check if we're on the editor page
  if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return;
  }

  console.log('[Junon Extension] Editor sync script loaded');

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'syncData') {
      syncData().then(data => {
        sendResponse({ success: true, data });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // Will respond asynchronously
    }
  });

  async function syncData() {
    try {
      // Read localStorage
      const temporaryFiles = getLocalStorageData('junon_temporary_files');
      const currentFileId = localStorage.getItem('junon_current_file_id');
      
      // Try to get snippets from the page
      let snippets = [];
      try {
        // Check if snippets are available in window object or try to fetch
        if (window.__JUNON_SNIPPETS__) {
          snippets = window.__JUNON_SNIPPETS__;
        } else {
          // Try to read from localStorage if stored there
          snippets = getLocalStorageData('junon_snippets') || [];
        }
      } catch (e) {
        console.warn('[Junon Extension] Could not load snippets:', e);
      }

      const syncData = {
        temporaryFiles: temporaryFiles || [],
        snippets: snippets || [],
        lastSync: Date.now()
      };

      // Save to chrome.storage
      await chrome.storage.local.set(syncData);

      console.log('[Junon Extension] Data synced:', {
        files: temporaryFiles?.length || 0,
        snippets: snippets.length
      });

      return syncData;
    } catch (error) {
      console.error('[Junon Extension] Sync error:', error);
      throw error;
    }
  }

  function getLocalStorageData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`[Junon Extension] Error reading ${key}:`, error);
      return null;
    }
  }

  // Auto-sync on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(syncData, 2000); // Wait for page to fully load
    });
  } else {
    setTimeout(syncData, 2000);
  }

  // Expose sync function globally for manual sync
  window.__JUNON_EXTENSION_SYNC__ = syncData;
})();


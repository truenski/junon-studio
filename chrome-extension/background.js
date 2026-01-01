// Background service worker for Junon.io Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Junon Extension] Extension installed');
});

// Handle sync request from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncFromEditor') {
    syncFromEditor().then(data => {
      sendResponse({ success: true, data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  }
});

async function syncFromEditor() {
  try {
    // Find editor tab (localhost) - try multiple patterns
    let tabs = await chrome.tabs.query({ url: ['*://localhost/*', '*://127.0.0.1/*'] });
    
    // If no tabs found with URL pattern, try finding by hostname
    if (tabs.length === 0) {
      const allTabs = await chrome.tabs.query({});
      tabs = allTabs.filter(tab => 
        tab.url && (
          tab.url.includes('localhost') || 
          tab.url.includes('127.0.0.1') ||
          (tab.url.startsWith('http://') && tab.url.includes(':8080'))
        )
      );
    }
    
    if (tabs.length === 0) {
      throw new Error('Editor not found. Please open the Junon Code Editor (localhost:8080) first.');
    }

    const editorTab = tabs[0];
    console.log('[Background] Found editor tab:', editorTab.url);
    
    // Try to execute script to read localStorage and snippets
    const results = await chrome.scripting.executeScript({
      target: { tabId: editorTab.id },
      func: () => {
        return new Promise((resolve) => {
          try {
            const files = localStorage.getItem('junon_temporary_files');
            const currentFileId = localStorage.getItem('junon_current_file_id');
            
            // Function to get snippets
            const getSnippets = () => {
              if (window.__JUNON_SNIPPETS__) {
                return window.__JUNON_SNIPPETS__;
              }
              return [];
            };
            
            // Try immediately
            let snippets = getSnippets();
            
            if (snippets.length > 0) {
              const parsedFiles = files ? JSON.parse(files) : [];
              resolve({
                temporaryFiles: parsedFiles,
                snippets: snippets,
                currentFileId: currentFileId
              });
              return;
            }
            
            // Wait a bit and try again (snippets might load async)
            setTimeout(() => {
              try {
                snippets = getSnippets();
                const parsedFiles = files ? JSON.parse(files) : [];
                
                console.log('[Editor Sync] Found:', {
                  files: parsedFiles.length,
                  snippets: snippets.length
                });
                
                resolve({
                  temporaryFiles: parsedFiles,
                  snippets: snippets,
                  currentFileId: currentFileId
                });
              } catch (e) {
                console.error('[Editor Sync] Error:', e);
                resolve({ error: e.message });
              }
            }, 2000);
          } catch (e) {
            console.error('[Editor Sync] Error:', e);
            resolve({ error: e.message });
          }
        });
      }
    });
    
    if (results && results[0] && results[0].result) {
      const data = await results[0].result; // Wait for promise to resolve
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Save to chrome.storage
      const storageData = {
        temporaryFiles: data.temporaryFiles || [],
        snippets: data.snippets || [],
        lastSync: Date.now()
      };
      
      await chrome.storage.local.set(storageData);
      
      console.log('[Background] Saved to storage:', {
        files: storageData.temporaryFiles.length,
        snippets: storageData.snippets.length
      });
      
      return storageData;
    }
    
    throw new Error('Failed to read data from editor');
  } catch (error) {
    console.error('[Junon Extension] Sync error:', error);
    throw error;
  }
}

// Listen for tab updates to auto-sync when editor is opened
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && 
      (tab.url.includes('localhost') || tab.url.includes('127.0.0.1'))) {
    // Auto-sync when editor page loads
    try {
      await syncFromEditor();
      console.log('[Junon Extension] Auto-synced from editor');
    } catch (error) {
      // Silent fail for auto-sync
      console.log('[Junon Extension] Auto-sync failed (this is ok)');
    }
  }
});

// Popup script for Junon.io Code Importer

let selectedItem = null;
let selectedType = null; // 'file' or 'snippet'

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupSyncButton();
  await loadData();
  
  // Also listen for storage changes to auto-update
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.temporaryFiles || changes.snippets)) {
      console.log('[Popup] Storage changed, reloading data');
      loadData();
    }
  });
});

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Update buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update content
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(`${tabName}Tab`).classList.add('active');
      
      // Clear selection when switching tabs
      selectedItem = null;
      selectedType = null;
      updateImportButton();
    });
  });
}

function setupSyncButton() {
  const syncBtn = document.getElementById('syncBtn');
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    
    try {
      // Send message to background to sync from editor
      const response = await chrome.runtime.sendMessage({ action: 'syncFromEditor' });
      
      if (response && response.success) {
        showStatus('Synced successfully!', 'success');
        // Wait a bit for storage to be updated
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadData();
      } else {
        showStatus('Sync failed: ' + (response?.error || 'Editor not found'), 'error');
      }
    } catch (error) {
      showStatus('Sync error: ' + error.message, 'error');
    } finally {
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync from Editor';
    }
  });
}

async function loadData() {
  try {
    const data = await chrome.storage.local.get(['temporaryFiles', 'snippets']);
    
    console.log('[Popup] Loading data:', {
      files: data.temporaryFiles?.length || 0,
      snippets: data.snippets?.length || 0
    });
    
    // Load files
    const filesList = document.getElementById('filesList');
    if (data.temporaryFiles && Array.isArray(data.temporaryFiles) && data.temporaryFiles.length > 0) {
      filesList.innerHTML = '';
      data.temporaryFiles.forEach(file => {
        if (file && file.name && file.content) {
          const preview = file.content.length > 100 ? file.content.substring(0, 100) + '...' : file.content;
          const item = createListItem(file.name, preview, 'file', file);
          filesList.appendChild(item);
        }
      });
    } else {
      filesList.innerHTML = '<div class="empty-state">No files found. Sync from editor first.</div>';
    }
    
    // Load snippets
    const snippetsList = document.getElementById('snippetsList');
    if (data.snippets && Array.isArray(data.snippets) && data.snippets.length > 0) {
      snippetsList.innerHTML = '';
      data.snippets.forEach(snippet => {
        if (snippet && snippet.title) {
          const item = createListItem(snippet.title, snippet.description || 'No description', 'snippet', snippet);
          snippetsList.appendChild(item);
        }
      });
    } else {
      snippetsList.innerHTML = '<div class="empty-state">No snippets found. Sync from editor first.</div>';
    }
  } catch (error) {
    console.error('[Popup] Error loading data:', error);
    const filesList = document.getElementById('filesList');
    const snippetsList = document.getElementById('snippetsList');
    filesList.innerHTML = '<div class="empty-state">Error loading data. Please try syncing again.</div>';
    snippetsList.innerHTML = '<div class="empty-state">Error loading data. Please try syncing again.</div>';
  }
}

function createListItem(title, description, type, data) {
  const item = document.createElement('div');
  item.className = 'list-item';
  item.dataset.type = type;
  
  item.innerHTML = `
    <div class="list-item-header">
      <div class="list-item-title">${title}</div>
      <div class="list-item-meta">${type === 'file' ? 'File' : 'Snippet'}</div>
    </div>
    <div class="list-item-description">${description}</div>
  `;
  
  item.addEventListener('click', () => {
    // Remove previous selection
    document.querySelectorAll('.list-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    
    selectedItem = data;
    selectedType = type;
    updateImportButton();
  });
  
  return item;
}

function updateImportButton() {
  let importBtn = document.getElementById('importBtn');
  
  if (!importBtn) {
    importBtn = document.createElement('button');
    importBtn.id = 'importBtn';
    importBtn.className = 'btn btn-secondary';
    importBtn.textContent = 'Import to Junon.io';
    document.querySelector('.container').appendChild(importBtn);
    
    importBtn.addEventListener('click', async () => {
      if (!selectedItem) {
        showStatus('Please select a file or snippet first', 'error');
        return;
      }
      
      const code = selectedType === 'file' ? selectedItem.content : selectedItem.code;
      
      // Get current tab - try to find junon.io tab
      const tabs = await chrome.tabs.query({});
      const junonTab = tabs.find(t => t.url && (t.url.includes('junon.io') || t.url.includes('junon')));
      
      if (!junonTab) {
        showStatus('Please open junon.io in a tab first', 'error');
        return;
      }
      
      // Switch to junon.io tab if not already there
      if (junonTab.id) {
        await chrome.tabs.update(junonTab.id, { active: true });
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Send message to content script
      try {
        importBtn.disabled = true;
        importBtn.textContent = 'Importing...';
        showStatus('Starting import...', 'success');
        
        // Inject content script if not already injected
        try {
          await chrome.scripting.executeScript({
            target: { tabId: junonTab.id },
            files: ['parser.js', 'content.js']
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (injectError) {
          console.warn('Script may already be injected:', injectError);
        }
        
        const response = await chrome.tabs.sendMessage(junonTab.id, {
          action: 'importCode',
          code: code
        });
        
        if (response && response.success) {
          const message = response.triggersProcessed 
            ? `Successfully imported ${response.triggersProcessed} trigger(s)!`
            : 'Code imported successfully!';
          showStatus(message, 'success');
        } else {
          showStatus('Import failed: ' + (response?.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        let errorMessage = error.message;
        
        // Provide more helpful error messages
        if (error.message.includes('Could not establish connection')) {
          errorMessage = 'Please refresh the junon.io page and try again';
        } else if (error.message.includes('Cannot access')) {
          errorMessage = 'Please make sure you are on the junon.io page';
        }
        
        showStatus('Import error: ' + errorMessage, 'error');
      } finally {
        importBtn.disabled = false;
        importBtn.textContent = 'Import to Junon.io';
      }
    });
  }
  
  importBtn.style.display = selectedItem ? 'block' : 'none';
}

function showStatus(message, type = 'success') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  setTimeout(() => {
    status.classList.add('hidden');
  }, 3000);
}

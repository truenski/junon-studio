// Popup script for Junon.io Code Importer

let selectedItem = null;
let selectedType = null; // 'file' or 'snippet'

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupSyncButton();
  setupJsonImport();
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
      
      // Use the shared import function
      importBtn.disabled = true;
      importBtn.textContent = 'Importing...';
      
      try {
        await importCodeToJunon(code);
      } finally {
        importBtn.disabled = false;
        importBtn.textContent = 'Import to Junon.io';
      }
    });
  }
  
  importBtn.style.display = selectedItem ? 'block' : 'none';
}

function setupJsonImport() {
  const parseBtn = document.getElementById('parseJsonBtn');
  const jsonInput = document.getElementById('jsonInput');
  
  if (!parseBtn || !jsonInput) {
    console.error('[Popup] JSON import elements not found');
    return;
  }
  
  parseBtn.addEventListener('click', async () => {
    const jsonText = jsonInput.value.trim();
    
    if (!jsonText) {
      showStatus('Please paste JSON content', 'error');
      return;
    }
    
    try {
      console.log('[Popup] Parsing JSON:', jsonText.substring(0, 100));
      
      // Parse JSON
      const jsonData = JSON.parse(jsonText);
      console.log('[Popup] Parsed JSON data:', jsonData);
      
      // Convert JSON to Junon code
      const code = convertJSONToJunon(jsonData);
      console.log('[Popup] Converted code:', code);
      
      if (!code || code.trim().length === 0) {
        showStatus('Invalid JSON format or empty result. Expected format: {"triggers": [...]}', 'error');
        return;
      }
      
      // Import the code
      parseBtn.disabled = true;
      parseBtn.textContent = 'Importing...';
      showStatus('Converting JSON to code...', 'success');
      
      try {
        await importCodeToJunon(code);
        // Clear JSON input on success
        jsonInput.value = '';
      } catch (importError) {
        console.error('[Popup] Import error:', importError);
        showStatus('Import failed: ' + importError.message, 'error');
      } finally {
        parseBtn.disabled = false;
        parseBtn.textContent = 'Parse & Import JSON';
      }
      
    } catch (error) {
      console.error('[Popup] JSON parse error:', error);
      showStatus('Invalid JSON: ' + error.message, 'error');
      parseBtn.disabled = false;
      parseBtn.textContent = 'Parse & Import JSON';
    }
  });
}

function convertJSONToJunon(json) {
  if (!json || !json.triggers || !Array.isArray(json.triggers)) {
    return null;
  }
  
  let code = '';
  
  json.triggers.forEach((trigger, index) => {
    if (index > 0) code += '\n';
    
    // Trigger
    if (!trigger.event) return;
    code += `@trigger ${trigger.event}\n`;
    
    // Commands
    if (trigger.commands && Array.isArray(trigger.commands) && trigger.commands.length > 0) {
      code += '    @commands\n';
      trigger.commands.forEach(cmd => {
        if (cmd) code += `        ${cmd}\n`;
      });
    }
    
    // Conditions
    if (trigger.conditions && Array.isArray(trigger.conditions) && trigger.conditions.length > 0) {
      trigger.conditions.forEach(condition => {
        if (!condition.condition) return;
        code += `    @if ${condition.condition}\n`;
        
        // Then
        if (condition.then && Array.isArray(condition.then) && condition.then.length > 0) {
          condition.then.forEach(cmd => {
            if (cmd) code += `        then ${cmd}\n`;
          });
        }
        
        // Elseif
        if (condition.elseif && Array.isArray(condition.elseif) && condition.elseif.length > 0) {
          condition.elseif.forEach(elseif => {
            if (!elseif.condition) return;
            code += `        elseif ${elseif.condition}\n`;
            if (elseif.then && Array.isArray(elseif.then) && elseif.then.length > 0) {
              elseif.then.forEach(cmd => {
                if (cmd) code += `            then ${cmd}\n`;
              });
            }
          });
        }
      });
    }
    
    // Timers
    if (trigger.timers && Array.isArray(trigger.timers) && trigger.timers.length > 0) {
      trigger.timers.forEach(timer => {
        if (timer.delay !== undefined) {
          code += `    @timer ${timer.delay}\n`;
          if (timer.commands && Array.isArray(timer.commands) && timer.commands.length > 0) {
            timer.commands.forEach(cmd => {
              if (cmd) code += `        ${cmd}\n`;
            });
          }
        }
      });
    }
  });
  
  return code.trim();
}

async function importCodeToJunon(code) {
  // Get current tab - try to find junon.io tab
  const tabs = await chrome.tabs.query({});
  const junonTab = tabs.find(t => t.url && (t.url.includes('junon.io') || t.url.includes('junon')));
  
  if (!junonTab) {
    throw new Error('Please open junon.io in a tab first');
  }
  
  console.log('[Popup] Found junon.io tab:', junonTab.id, junonTab.url);
  
  // Don't switch tabs - keep popup open
  // Just ensure the tab is accessible
  try {
    await chrome.tabs.get(junonTab.id);
  } catch (e) {
    throw new Error('Cannot access junon.io tab. Please refresh the page.');
  }
  
  try {
    showStatus('Injecting scripts...', 'success');
    
    // Inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: junonTab.id },
        files: ['parser.js', 'content.js']
      });
      console.log('[Popup] Scripts injected successfully');
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (injectError) {
      console.warn('[Popup] Script injection warning:', injectError);
      // Continue anyway - scripts might already be injected
    }
    
    showStatus('Sending code to junon.io...', 'success');
    
    // Wait a bit more to ensure scripts are ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await chrome.tabs.sendMessage(junonTab.id, {
      action: 'importCode',
      code: code
    });
    
    console.log('[Popup] Response from content script:', response);
    
    if (response && response.success) {
      const message = response.triggersProcessed 
        ? `Successfully imported ${response.triggersProcessed} trigger(s)!`
        : 'Code imported successfully!';
      showStatus(message, 'success');
    } else {
      const errorMsg = response?.error || 'Unknown error';
      console.error('[Popup] Import failed:', errorMsg);
      showStatus('Import failed: ' + errorMsg, 'error');
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('[Popup] Import error:', error);
    let errorMessage = error.message;
    
    if (error.message.includes('Could not establish connection')) {
      errorMessage = 'Content script not ready. Please refresh the junon.io page and try again.';
    } else if (error.message.includes('Cannot access')) {
      errorMessage = 'Please make sure you are on the junon.io page';
    } else if (error.message.includes('Receiving end does not exist')) {
      errorMessage = 'Content script not loaded. Please refresh junon.io page.';
    }
    
    showStatus('Import error: ' + errorMessage, 'error');
    throw error;
  }
}

function convertJSONToJunon(json) {
  if (!json || !json.triggers || !Array.isArray(json.triggers)) {
    return null;
  }
  
  let code = '';
  
  json.triggers.forEach((trigger, index) => {
    if (index > 0) code += '\n';
    
    // Trigger
    if (!trigger.event) return;
    code += `@trigger ${trigger.event}\n`;
    
    // Commands
    if (trigger.commands && Array.isArray(trigger.commands) && trigger.commands.length > 0) {
      code += '    @commands\n';
      trigger.commands.forEach(cmd => {
        if (cmd) code += `        ${cmd}\n`;
      });
    }
    
    // Conditions
    if (trigger.conditions && Array.isArray(trigger.conditions) && trigger.conditions.length > 0) {
      trigger.conditions.forEach(condition => {
        if (!condition.condition) return;
        code += `    @if ${condition.condition}\n`;
        
        // Then
        if (condition.then && Array.isArray(condition.then) && condition.then.length > 0) {
          condition.then.forEach(cmd => {
            if (cmd) code += `        then ${cmd}\n`;
          });
        }
        
        // Elseif
        if (condition.elseif && Array.isArray(condition.elseif) && condition.elseif.length > 0) {
          condition.elseif.forEach(elseif => {
            if (!elseif.condition) return;
            code += `        elseif ${elseif.condition}\n`;
            if (elseif.then && Array.isArray(elseif.then) && elseif.then.length > 0) {
              elseif.then.forEach(cmd => {
                if (cmd) code += `            then ${cmd}\n`;
              });
            }
          });
        }
      });
    }
    
    // Timers
    if (trigger.timers && Array.isArray(trigger.timers) && trigger.timers.length > 0) {
      trigger.timers.forEach(timer => {
        if (timer.delay !== undefined) {
          code += `    @timer ${timer.delay}\n`;
          if (timer.commands && Array.isArray(timer.commands) && timer.commands.length > 0) {
            timer.commands.forEach(cmd => {
              if (cmd) code += `        ${cmd}\n`;
            });
          }
        }
      });
    }
  });
  
  return code.trim();
}

async function importCodeToJunon(code) {
  // Get current tab - try to find junon.io tab
  const tabs = await chrome.tabs.query({});
  const junonTab = tabs.find(t => t.url && (t.url.includes('junon.io') || t.url.includes('junon')));
  
  if (!junonTab) {
    throw new Error('Please open junon.io in a tab first');
  }
  
  console.log('[Popup] Found junon.io tab:', junonTab.id, junonTab.url);
  
  // Don't switch tabs - keep popup open
  // Just ensure the tab is accessible
  try {
    await chrome.tabs.get(junonTab.id);
  } catch (e) {
    throw new Error('Cannot access junon.io tab. Please refresh the page.');
  }
  
  try {
    showStatus('Injecting scripts...', 'success');
    
    // Inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: junonTab.id },
        files: ['parser.js', 'content.js']
      });
      console.log('[Popup] Scripts injected successfully');
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (injectError) {
      console.warn('[Popup] Script injection warning:', injectError);
      // Continue anyway - scripts might already be injected
    }
    
    showStatus('Sending code to junon.io...', 'success');
    
    // Wait a bit more to ensure scripts are ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await chrome.tabs.sendMessage(junonTab.id, {
      action: 'importCode',
      code: code
    });
    
    console.log('[Popup] Response from content script:', response);
    
    if (response && response.success) {
      const message = response.triggersProcessed 
        ? `Successfully imported ${response.triggersProcessed} trigger(s)!`
        : 'Code imported successfully!';
      showStatus(message, 'success');
    } else {
      const errorMsg = response?.error || 'Unknown error';
      console.error('[Popup] Import failed:', errorMsg);
      showStatus('Import failed: ' + errorMsg, 'error');
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('[Popup] Import error:', error);
    let errorMessage = error.message;
    
    if (error.message.includes('Could not establish connection')) {
      errorMessage = 'Content script not ready. Please refresh the junon.io page and try again.';
    } else if (error.message.includes('Cannot access')) {
      errorMessage = 'Please make sure you are on the junon.io page';
    } else if (error.message.includes('Receiving end does not exist')) {
      errorMessage = 'Content script not loaded. Please refresh junon.io page.';
    }
    
    showStatus('Import error: ' + errorMessage, 'error');
    throw error;
  }
}

function showStatus(message, type = 'success') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  setTimeout(() => {
    status.classList.add('hidden');
  }, 3000);
}

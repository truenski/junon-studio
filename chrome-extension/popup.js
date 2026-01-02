/**
 * Popup Script for Junon Automation Extension
 */

const jsonInput = document.getElementById('jsonInput');
const executeBtn = document.getElementById('executeBtn');
const statusDiv = document.getElementById('status');
const loadExampleBtn = document.getElementById('loadExample');
const fileInput = document.getElementById('fileInput');
const extractBtn = document.getElementById('extractBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');

// Check if current tab is junon.io
let isJunonSite = false;
let currentTab = null;

// Check current tab on popup open
async function checkCurrentTab() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tab;
        isJunonSite = tab.url && tab.url.includes('junon.io');
        
        // Update UI based on site
        updateUIForSite();
        
        return isJunonSite;
    } catch (error) {
        console.error('Error checking tab:', error);
        isJunonSite = false;
        updateUIForSite();
        return false;
    }
}

function updateUIForSite() {
    if (isJunonSite) {
        // Enable all buttons
        executeBtn.disabled = false;
        extractBtn.disabled = false;
        statusDiv.className = 'status';
        statusDiv.textContent = '';
        
        // Remove warning message if exists
        const warningMsg = document.getElementById('warningMessage');
        if (warningMsg) {
            warningMsg.remove();
        }
    } else {
        // Disable all action buttons
        executeBtn.disabled = true;
        extractBtn.disabled = true;
        downloadBtn.disabled = true;
        copyBtn.disabled = true;
        
        // Show warning message
        showWarningMessage();
    }
}

function showWarningMessage() {
    // Remove existing warning if any
    const existingWarning = document.getElementById('warningMessage');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    // Create warning message
    const warningDiv = document.createElement('div');
    warningDiv.id = 'warningMessage';
    warningDiv.className = 'status error';
    warningDiv.style.marginTop = '10px';
    warningDiv.textContent = '⚠️ Please open junon.io to use this extension';
    
    // Insert after the first section
    const firstSection = document.querySelector('.section');
    if (firstSection) {
        firstSection.parentNode.insertBefore(warningDiv, firstSection.nextSibling);
    }
}

// Example configuration
const exampleConfig = {
  "triggers": [
    {
      "event": "PlayerRespawn",
      "actions": [
        {
          "type": "command",
          "values": ["/give survival_tool 1"]
        },
        {
          "type": "ifthenelse",
          "condition": "player.health == 100",
          "then": [
            {
              "type": "timer",
              "name": "HealthCheck",
              "duration": 10,
              "tick": 1
            },
            {
              "type": "command",
              "values": ["/chat Timer started for full health player"]
            }
          ],
          "else": [
            {
              "type": "command",
              "values": ["/chat You need healing"]
            }
          ]
        }
      ]
    }
  ]
};

// Load example configuration
loadExampleBtn.addEventListener('click', () => {
    jsonInput.value = JSON.stringify(exampleConfig, null, 2);
});

// File input handler
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                jsonInput.value = JSON.stringify(json, null, 2);
                statusDiv.className = 'status success';
                statusDiv.textContent = '✓ JSON file loaded successfully!';
                setTimeout(() => {
                    statusDiv.className = 'status';
                    statusDiv.textContent = '';
                }, 2000);
            } catch (error) {
                statusDiv.className = 'status error';
                statusDiv.textContent = `Error reading file: ${error.message}`;
            }
        };
        reader.readAsText(file);
    } else {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Please select a valid JSON file';
    }
});

// Drag and drop handlers
jsonInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    jsonInput.classList.add('drag-over');
});

jsonInput.addEventListener('dragleave', () => {
    jsonInput.classList.remove('drag-over');
});

jsonInput.addEventListener('drop', (e) => {
    e.preventDefault();
    jsonInput.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                jsonInput.value = JSON.stringify(json, null, 2);
                statusDiv.className = 'status success';
                statusDiv.textContent = '✓ JSON file loaded successfully!';
                setTimeout(() => {
                    statusDiv.className = 'status';
                    statusDiv.textContent = '';
                }, 2000);
            } catch (error) {
                statusDiv.className = 'status error';
                statusDiv.textContent = `Error reading file: ${error.message}`;
            }
        };
        reader.readAsText(file);
    } else {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Please drop a valid JSON file';
    }
});

// Progress elements
const progressContainer = document.getElementById('progressContainer');
const progressText = document.getElementById('progressText');
const progressCount = document.getElementById('progressCount');
const progressFill = document.getElementById('progressFill');
const progressTask = document.getElementById('progressTask');

// Listen for progress updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "progressUpdate") {
        const { completed, total, percentage, task } = request.progress;
        progressContainer.classList.add('active');
        progressText.textContent = `${percentage}%`;
        progressCount.textContent = `${completed} / ${total}`;
        progressFill.style.width = `${percentage}%`;
        progressTask.textContent = task || '';
    }
});

// Execute automation
executeBtn.addEventListener('click', async () => {
    // Re-check if still on junon.io
    const stillOnJunon = await checkCurrentTab();
    if (!stillOnJunon) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Please open junon.io in the current tab';
        return;
    }
    
    try {
        // Validate JSON
        const config = JSON.parse(jsonInput.value);

        // Reset progress
        progressContainer.classList.remove('active');
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        progressCount.textContent = '0 / 0';
        progressTask.textContent = '';

        // Show loading status
        statusDiv.className = 'status loading';
        statusDiv.textContent = 'Executing automation...';
        executeBtn.disabled = true;

        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url || !tab.url.includes('junon.io')) {
            statusDiv.className = 'status error';
            statusDiv.textContent = 'Please open junon.io in the current tab';
            executeBtn.disabled = false;
            updateUIForSite();
            return;
        }

        // Send message to content script with retry logic
        const sendMessageWithRetry = (retries = 3) => {
            return new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "executeAutomation",
                    data: config
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        if (retries > 0) {
                            // Retry after a short delay
                            setTimeout(() => {
                                sendMessageWithRetry(retries - 1).then(resolve).catch(reject);
                            }, 500);
                        } else {
                            reject(new Error(chrome.runtime.lastError.message || 'Content script not responding. Please refresh the page.'));
                        }
                    } else {
                        resolve(response);
                    }
                });
            });
        };

        try {
            const response = await sendMessageWithRetry();
            
            if (response && response.success) {
                statusDiv.className = 'status success';
                statusDiv.textContent = `✓ Automation completed successfully! (${response.triggersProcessed || 0} trigger(s) processed)`;
                // Keep progress visible for a moment, then hide
                setTimeout(() => {
                    progressContainer.classList.remove('active');
                }, 2000);
            } else {
                statusDiv.className = 'status error';
                statusDiv.textContent = `Error: ${response?.error || 'Unknown error'}`;
                progressContainer.classList.remove('active');
            }
        } catch (error) {
            statusDiv.className = 'status error';
            statusDiv.textContent = `Error: ${error.message}`;
            progressContainer.classList.remove('active');
        } finally {
            executeBtn.disabled = false;
        }
    } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.textContent = `Invalid JSON: ${error.message}`;
        executeBtn.disabled = false;
        progressContainer.classList.remove('active');
    }
});

// Load saved configuration on popup open and check site
(async () => {
    // Check if on junon.io first
    await checkCurrentTab();
    
    // Then load saved config
    chrome.storage.local.get(['lastConfig'], (result) => {
        if (result.lastConfig) {
            jsonInput.value = result.lastConfig;
        }
    });
})();

// Save configuration when it changes
jsonInput.addEventListener('change', () => {
    chrome.storage.local.set({ lastConfig: jsonInput.value });
});

// Extract functionality
let extractedData = null;

extractBtn.addEventListener('click', async () => {
    // Re-check if still on junon.io
    const stillOnJunon = await checkCurrentTab();
    if (!stillOnJunon) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Please open junon.io in the current tab';
        return;
    }
    
    try {
        statusDiv.className = 'status loading';
        statusDiv.textContent = 'Extracting triggers and actions...';
        extractBtn.disabled = true;

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url || !tab.url.includes('junon.io')) {
            statusDiv.className = 'status error';
            statusDiv.textContent = 'Please open junon.io in the current tab';
            extractBtn.disabled = false;
            updateUIForSite();
            return;
        }

        // Try to send message with retry logic
        const sendMessageWithRetry = (retries = 3) => {
            return new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "extractTriggers"
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        if (retries > 0) {
                            // Retry after a short delay
                            setTimeout(() => {
                                sendMessageWithRetry(retries - 1).then(resolve).catch(reject);
                            }, 500);
                        } else {
                            reject(new Error(chrome.runtime.lastError.message || 'Content script not responding. Please refresh the page.'));
                        }
                    } else {
                        resolve(response);
                    }
                });
            });
        };

        try {
            const response = await sendMessageWithRetry();
            
            if (response && response.success) {
                extractedData = response.data;
                const jsonString = JSON.stringify(extractedData, null, 2);
                
                // Update textarea with extracted data
                jsonInput.value = jsonString;
                
                // Enable download and copy buttons
                downloadBtn.disabled = false;
                copyBtn.disabled = false;
                
                statusDiv.className = 'status success';
                statusDiv.textContent = `✓ Extracted ${extractedData.triggers?.length || 0} trigger(s) successfully!`;
            } else {
                statusDiv.className = 'status error';
                statusDiv.textContent = `Error: ${response?.error || 'Unknown error'}`;
            }
        } catch (error) {
            statusDiv.className = 'status error';
            statusDiv.textContent = `Error: ${error.message}`;
        } finally {
            extractBtn.disabled = false;
        }
    } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.textContent = `Error: ${error.message}`;
        extractBtn.disabled = false;
    }
});

downloadBtn.addEventListener('click', () => {
    if (!extractedData) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'No data to download. Please extract first.';
        return;
    }

    const jsonString = JSON.stringify(extractedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `junon-triggers-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    statusDiv.className = 'status success';
    statusDiv.textContent = '✓ JSON file downloaded!';
    setTimeout(() => {
        statusDiv.className = 'status';
        statusDiv.textContent = '';
    }, 2000);
});

copyBtn.addEventListener('click', async () => {
    if (!extractedData) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'No data to copy. Please extract first.';
        return;
    }

    const jsonString = JSON.stringify(extractedData, null, 2);
    
    try {
        await navigator.clipboard.writeText(jsonString);
        statusDiv.className = 'status success';
        statusDiv.textContent = '✓ JSON copied to clipboard!';
        setTimeout(() => {
            statusDiv.className = 'status';
            statusDiv.textContent = '';
        }, 2000);
    } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.textContent = `Error copying to clipboard: ${error.message}`;
    }
});

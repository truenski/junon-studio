/**
 * Popup Script for Junon Automation Extension
 */

const jsonInput = document.getElementById('jsonInput');
const executeBtn = document.getElementById('executeBtn');
const statusDiv = document.getElementById('status');
const loadExampleBtn = document.getElementById('loadExample');

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

// Execute automation
executeBtn.addEventListener('click', async () => {
    try {
        // Validate JSON
        const config = JSON.parse(jsonInput.value);

        // Show loading status
        statusDiv.className = 'status loading';
        statusDiv.textContent = 'Executing automation...';

        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Send message to content script
        chrome.tabs.sendMessage(tab.id, {
            action: "executeAutomation",
            data: config
        }, (response) => {
            if (chrome.runtime.lastError) {
                statusDiv.className = 'status error';
                statusDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
                return;
            }

            if (response.success) {
                statusDiv.className = 'status success';
                statusDiv.textContent = '✓ Automation completed successfully!';
            } else {
                statusDiv.className = 'status error';
                statusDiv.textContent = `Error: ${response.error}`;
            }
        });
    } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.textContent = `Invalid JSON: ${error.message}`;
    }
});

// Load saved configuration on popup open
chrome.storage.local.get(['lastConfig'], (result) => {
    if (result.lastConfig) {
        jsonInput.value = result.lastConfig;
    }
});

// Save configuration when it changes
jsonInput.addEventListener('change', () => {
    chrome.storage.local.set({ lastConfig: jsonInput.value });
});

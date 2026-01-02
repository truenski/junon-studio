/**
 * Junon.io Command Blocks Automation Engine
 * Translates a JSON trigger/action structure into UI interactions.
 */

class JunonAutomation {
    constructor(config) {
        this.config = config;
        this.selectors = {
            menu: "#command_block_menu",
            newTriggerBtn: ".add_trigger_btn",
            triggerName: ".trigger_name",
            createBtn: ".create_block_item_btn",
            actionPlus: ".trigger_actions img",
            actionItem: ".left_content_entry",
            input: "input[type='text']",
            numberInput: "input[type='number']",
            ifthenelse: {
                ifPlus: ".ifthenelse_if .add_action_btn",
                thenPlus: ".ifthenelse_then .add_action_btn",
                elsePlus: ".ifthenelse_else .add_action_btn"
            }
        };
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitForElement(selector, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el && el.offsetParent !== null) return el;
            await this.wait(100);
        }
        throw new Error(`Timeout waiting for element: ${selector}`);
    }

    async findAndClick(selector, text) {
        const elements = Array.from(document.querySelectorAll(selector));
        const target = elements.find(el => el.innerText.trim().toLowerCase() === text.toLowerCase());
        if (!target) throw new Error(`Could not find ${selector} with text: ${text}`);
        target.click();
        await this.wait(200);
    }

    async setInputValue(input, value) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.wait(100);
    }

    async createTrigger(triggerData) {
        console.log(`Creating trigger: ${triggerData.event}`);
        
        // 1. Click New Trigger
        const newBtn = await this.waitForElement(this.selectors.newTriggerBtn);
        newBtn.click();
        await this.wait(300);

        // 2. Select the event type
        await this.findAndClick(this.selectors.triggerName, triggerData.event);

        // 3. Click Create
        const createBtn = await this.waitForElement(this.selectors.createBtn);
        createBtn.click();
        await this.wait(500);

        // 4. Add actions
        // Note: We assume the last created trigger is the one we are editing
        const triggerEntries = document.querySelectorAll('.trigger_entry');
        const lastTrigger = triggerEntries[triggerEntries.length - 1];
        
        for (const action of triggerData.actions) {
            await this.createAction(lastTrigger, action);
        }
    }

    async createAction(parentContainer, actionData) {
        console.log(`Creating action: ${actionData.type}`);

        // 1. Click the plus icon to add action
        const plusIcon = parentContainer.querySelector('.trigger_actions img') || parentContainer.querySelector('.add_action_btn');
        if (!plusIcon) throw new Error("Could not find plus icon to add action");
        plusIcon.click();
        await this.wait(300);

        // 2. Select action type
        const typeMap = {
            "command": "commands",
            "ifthenelse": "ifthenelse",
            "timer": "timer"
        };
        const targetType = typeMap[actionData.type] || actionData.type;
        await this.findAndClick(this.selectors.actionItem, targetType);

        // 3. Click Create
        const createBtn = await this.waitForElement(this.selectors.createBtn);
        createBtn.click();
        await this.wait(500);

        // 4. Fill in details based on type
        const actionEntries = parentContainer.querySelectorAll('.action_entry');
        const lastAction = actionEntries[actionEntries.length - 1];

        if (actionData.type === "command") {
            const input = lastAction.querySelector('input[type="text"]');
            if (input && actionData.values && actionData.values[0]) {
                await this.setInputValue(input, actionData.values[0]);
            }
        } else if (actionData.type === "timer") {
            const nameInput = lastAction.querySelector('input[placeholder="name"]');
            const numInputs = lastAction.querySelectorAll('input[type="number"]');
            if (nameInput) await this.setInputValue(nameInput, actionData.name);
            if (numInputs[0]) await this.setInputValue(numInputs[0], actionData.duration.toString());
            if (numInputs[1]) await this.setInputValue(numInputs[1], actionData.tick.toString());
        } else if (actionData.type === "ifthenelse") {
            const conditionInput = lastAction.querySelector('input[type="text"]');
            if (conditionInput) await this.setInputValue(conditionInput, actionData.condition);

            // Handle nested "then" actions
            if (actionData.then) {
                const thenContainer = lastAction.querySelector('.ifthenelse_then');
                for (const subAction of actionData.then) {
                    await this.createAction(thenContainer, subAction);
                }
            }

            // Handle nested "else" actions
            if (actionData.else) {
                const elseContainer = lastAction.querySelector('.ifthenelse_else');
                for (const subAction of actionData.else) {
                    await this.createAction(elseContainer, subAction);
                }
            }
        }
    }

    async run() {
        try {
            // Ensure menu is open
            if (!document.querySelector(this.selectors.menu)) {
                console.log("Opening Command Blocks menu...");
                // Simulate 'K' key press
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK' }));
                await this.wait(500);
            }

            for (const trigger of this.config.triggers) {
                await this.createTrigger(trigger);
            }
            console.log("Automation completed successfully!");
        } catch (error) {
            console.error("Automation failed:", error);
        }
    }
}

// Example usage:
/*
const data = {
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

const automation = new JunonAutomation(data);
automation.run();
*/

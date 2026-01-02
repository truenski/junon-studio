/**
 * Junon.io Command Blocks Automation Engine v2
 * Translates a JSON trigger/action structure into UI interactions.
 * Updated to handle hover-and-edit interactions and multi-line commands.
 */

class JunonAutomation {
    constructor(config) {
        this.config = config;
        this.selectors = {
            menu: "#command_block_menu",
            newTriggerBtn: ".add_trigger_btn",
            triggerName: ".trigger_name",
            createBtn: ".create_block_item_btn",
            actionPlus: ".trigger_actions img, .add_action_btn",
            actionItem: ".left_content_entry",
            input: "input[type='text']",
            numberInput: "input[type='number']",
            actionEntry: ".action_entry",
            addValueBtn: ".add_action_value_btn",
            editValueBtn: ".edit_action_value_btn",
            actionValueRow: ".action_value_list_row",
            actionValueInput: ".black_input",
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

    async hoverAndClick(element) {
        // Simulate hover to reveal edit button
        const event = new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        element.dispatchEvent(event);
        await this.wait(200);

        // Find and click the edit button
        const editBtn = element.querySelector(this.selectors.editValueBtn);
        if (editBtn) {
            editBtn.click();
            await this.wait(200);
        }
    }

    async fillCommandValues(actionEntry, values) {
        console.log(`Filling command values: ${values.join(', ')}`);

        for (let i = 0; i < values.length; i++) {
            // Click the add value button
            const addBtn = actionEntry.querySelector(this.selectors.addValueBtn);
            if (addBtn) {
                addBtn.click();
                await this.wait(300);
            }

            // Find the newly created row
            const rows = actionEntry.querySelectorAll(this.selectors.actionValueRow);
            const lastRow = rows[rows.length - 1];

            if (lastRow) {
                // Hover to reveal edit button
                await this.hoverAndClick(lastRow);

                // Fill the input
                const input = lastRow.querySelector(this.selectors.actionValueInput);
                if (input) {
                    await this.setInputValue(input, values[i]);
                }
            }
        }
    }

    async fillIfThenElseValues(actionEntry, actionData) {
        console.log(`Filling IfThenElse: condition="${actionData.condition}"`);

        // Find the condition input
        const conditionInput = actionEntry.querySelector('input[placeholder*="condition"], input[placeholder*="Condition"]');
        if (conditionInput) {
            await this.setInputValue(conditionInput, actionData.condition);
        } else {
            // Try to find the first value row and fill it as condition
            const rows = actionEntry.querySelectorAll(this.selectors.actionValueRow);
            if (rows.length > 0) {
                await this.hoverAndClick(rows[0]);
                const input = rows[0].querySelector(this.selectors.actionValueInput);
                if (input) {
                    await this.setInputValue(input, actionData.condition);
                }
            }
        }

        // Handle "then" actions
        if (actionData.then && actionData.then.length > 0) {
            const thenContainer = actionEntry.querySelector('.ifthenelse_then');
            if (thenContainer) {
                for (const subAction of actionData.then) {
                    await this.createAction(thenContainer, subAction);
                }
            }
        }

        // Handle "else" actions
        if (actionData.else && actionData.else.length > 0) {
            const elseContainer = actionEntry.querySelector('.ifthenelse_else');
            if (elseContainer) {
                for (const subAction of actionData.else) {
                    await this.createAction(elseContainer, subAction);
                }
            }
        }
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
        const triggerEntries = document.querySelectorAll('.trigger_entry');
        const lastTrigger = triggerEntries[triggerEntries.length - 1];
        
        for (const action of triggerData.actions) {
            await this.createAction(lastTrigger, action);
        }
    }

    async createAction(parentContainer, actionData) {
        console.log(`Creating action: ${actionData.type}`);

        // 1. Click the plus icon to add action
        const plusIcons = parentContainer.querySelectorAll(this.selectors.actionPlus);
        if (plusIcons.length === 0) throw new Error("Could not find plus icon to add action");
        
        // Click the last plus icon (most relevant one)
        plusIcons[plusIcons.length - 1].click();
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
        const actionEntries = parentContainer.querySelectorAll(this.selectors.actionEntry);
        const lastAction = actionEntries[actionEntries.length - 1];

        if (actionData.type === "command") {
            if (actionData.values && actionData.values.length > 0) {
                await this.fillCommandValues(lastAction, actionData.values);
            }
        } else if (actionData.type === "timer") {
            const nameInput = lastAction.querySelector('input[placeholder="name"]');
            const numInputs = lastAction.querySelectorAll('input[type="number"]');
            if (nameInput) await this.setInputValue(nameInput, actionData.name);
            if (numInputs[0]) await this.setInputValue(numInputs[0], actionData.duration.toString());
            if (numInputs[1]) await this.setInputValue(numInputs[1], actionData.tick.toString());
        } else if (actionData.type === "ifthenelse") {
            await this.fillIfThenElseValues(lastAction, actionData);
        }
    }

    async run() {
        try {
            // Ensure menu is open
            if (!document.querySelector(this.selectors.menu)) {
                console.log("Opening Command Blocks menu...");
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK' }));
                await this.wait(500);
            }

            for (const trigger of this.config.triggers) {
                await this.createTrigger(trigger);
            }
            console.log("Automation completed successfully!");
            return "Automation completed successfully!";
        } catch (error) {
            console.error("Automation failed:", error);
            return "Automation failed: " + error.message;
        }
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JunonAutomation;
}

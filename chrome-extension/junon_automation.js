/**
 * Junon.io Command Blocks Automation Engine
 * Translates a JSON trigger/action structure into UI interactions.
 */

// Immediate test to verify script is executing
(function() {
    console.log('[Junon Automation] ========================================');
    console.log('[Junon Automation] Script file STARTING to load...');
    console.log('[Junon Automation] Timestamp:', new Date().toISOString());
    console.log('[Junon Automation] window type:', typeof window);
    console.log('[Junon Automation] document type:', typeof document);
    console.log('[Junon Automation] ========================================');
    
    // Try to set a marker on window immediately
    if (typeof window !== 'undefined') {
        window.__junonAutomationScriptLoaded = true;
        window.__junonAutomationScriptLoadTime = Date.now();
        console.log('[Junon Automation] ✓ Script marker set on window');
    } else {
        console.error('[Junon Automation] ✗ window is undefined!');
    }
})();

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
        // Progress tracking
        this.progress = {
            total: 0,
            completed: 0,
            currentTask: ''
        };
        this.calculateTotalFields();
    }

    calculateTotalFields() {
        let total = 0;
        for (const trigger of this.config.triggers) {
            total += 1; // trigger creation
            for (const action of trigger.actions) {
                total += this.countActionFields(action);
            }
        }
        this.progress.total = total;
    }

    countActionFields(action) {
        let count = 1; // action creation
        if (action.type === "command") {
            count += action.values?.length || 0;
        } else if (action.type === "timer") {
            count += 3; // name, duration, tick
        } else if (action.type === "ifthenelse") {
            count += 3; // value1, operator, value2
            if (action.then) {
                for (const subAction of action.then) {
                    count += this.countActionFields(subAction);
                }
            }
            if (action.else) {
                for (const subAction of action.else) {
                    count += this.countActionFields(subAction);
                }
            }
        }
        return count;
    }

    updateProgress(task, increment = 1) {
        this.progress.completed += increment;
        this.progress.currentTask = task;
        const percentage = Math.round((this.progress.completed / this.progress.total) * 100);
        // Send progress update via custom event (content script will listen)
        const event = new CustomEvent('junonProgressUpdate', {
            detail: {
                completed: this.progress.completed,
                total: this.progress.total,
                percentage: percentage,
                task: task
            }
        });
        window.dispatchEvent(event);
        return percentage;
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
        if (!input) {
            throw new Error('Input element is null');
        }
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.wait(100);
    }

    async createTrigger(triggerData) {
        console.log(`Creating trigger: ${triggerData.event}`);
        this.updateProgress(`Creating trigger: ${triggerData.event}`);
        
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
        await this.wait(300); // Wait for trigger entry to appear
        const triggerEntries = document.querySelectorAll('.trigger_entry');
        if (triggerEntries.length === 0) {
            throw new Error('No trigger entries found after creation');
        }
        const lastTrigger = triggerEntries[triggerEntries.length - 1];
        if (!lastTrigger) {
            throw new Error('Could not find last trigger entry');
        }
        
        for (const action of triggerData.actions) {
            await this.createAction(lastTrigger, action, 0);
        }
    }

    async createAction(parentContainer, actionData, depth = 0) {
        const indent = '  '.repeat(depth);
        console.log(`${indent}Creating action: ${actionData.type} (depth: ${depth})`);

        if (!parentContainer) {
            throw new Error("Parent container is null");
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:149',message:'createAction called',data:{actionType:actionData.type,parentContainerClass:parentContainer.className||'unknown',depth:depth},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
        // #endregion

        // 1. Click the plus icon to add action
        const plusIcon = parentContainer.querySelector('.trigger_actions img') || 
                        parentContainer.querySelector('.add_action_btn') ||
                        parentContainer.querySelector('.add_action_value_btn');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:102',message:'Looking for plus icon',data:{foundPlusIcon:!!plusIcon,parentHTML:parentContainer.outerHTML.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (!plusIcon) {
            throw new Error(`Could not find plus icon to add action in container: ${parentContainer.className || 'unknown'}`);
        }
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
        await this.wait(300); // Wait for action entry to appear
        const actionEntries = parentContainer.querySelectorAll('.action_entry');
        if (actionEntries.length === 0) {
            throw new Error('No action entries found after creation');
        }
        const lastAction = actionEntries[actionEntries.length - 1];
        if (!lastAction) {
            throw new Error('Could not find last action entry');
        }

        if (actionData.type === "command") {
            this.updateProgress('Creating command action');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:180',message:'Filling command action',data:{actionType:'command',valuesCount:actionData.values?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            if (actionData.values && actionData.values.length > 0) {
                // Find add button for commands
                const addBtn = lastAction.querySelector('.add_action_value_btn');
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:186',message:'Looking for add button in command',data:{foundAddBtn:!!addBtn},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                
                if (!addBtn) {
                    throw new Error('Could not find add_action_value_btn for commands');
                }
                
                // Add each command value one by one
                for (let i = 0; i < actionData.values.length; i++) {
                    const value = actionData.values[i];
                    this.updateProgress(`Adding command: ${value.substring(0, 30)}...`);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:195',message:'Adding command value',data:{index:i,value:value},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    
                    // Click add button to create new row (always click, even for first command)
                    addBtn.click();
                    await this.wait(400); // Wait for row with edit_mode to appear
                    
                    // Find the newly created row with edit_mode class
                    const actionValueList = lastAction.querySelector('.action_value_list');
                    const editModeRow = actionValueList?.querySelector('.action_value_list_row.edit_mode');
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:203',message:'Looking for edit_mode row after click',data:{foundEditModeRow:!!editModeRow,actionValueListExists:!!actionValueList},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    
                    if (editModeRow) {
                        const input = editModeRow.querySelector('input.black_input');
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:209',message:'Found input in edit_mode row',data:{foundInput:!!input},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'A'})}).catch(()=>{});
                        // #endregion
                        if (input) {
                            await this.setInputValue(input, value);
                            // Press Enter to confirm and save the command
                            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
                            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
                            await this.wait(300); // Wait for row to exit edit_mode
                        } else {
                            console.warn(`[Junon Automation] Input not found in edit_mode row for command ${i}`);
                        }
                    } else {
                        console.warn(`[Junon Automation] Edit mode row not found after clicking add for command ${i}`);
                    }
                }
            }
        } else if (actionData.type === "timer") {
            this.updateProgress('Creating timer action');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:240',message:'Filling timer action',data:{name:actionData.name,duration:actionData.duration,tick:actionData.tick},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            // Timer name needs edit button click first
            const timerNameRow = lastAction.querySelector('.timer_name');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:199',message:'Looking for timer name row',data:{foundTimerNameRow:!!timerNameRow},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            if (timerNameRow) {
                // Hover to show edit button
                timerNameRow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                await this.wait(200);
                const editBtn = timerNameRow.querySelector('.edit_action_value_btn');
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:207',message:'Looking for edit button',data:{foundEditBtn:!!editBtn},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                if (editBtn) {
                    editBtn.click();
                    await this.wait(200);
                    const nameInput = timerNameRow.querySelector('input.black_input');
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:213',message:'Looking for name input',data:{foundNameInput:!!nameInput,inputValueBefore:nameInput?.value||'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    if (nameInput) {
                        this.updateProgress(`Setting timer name: ${actionData.name || 'Timer'}`);
                        await this.setInputValue(nameInput, actionData.name || 'Timer');
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:264',message:'Set input value',data:{inputValueAfter:nameInput.value,expectedValue:actionData.name||'Timer'},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'A'})}).catch(()=>{});
                        // #endregion
                        // Press Enter to submit (like commands)
                        nameInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
                        nameInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
                        // Also trigger blur to ensure the value is saved
                        nameInput.dispatchEvent(new Event('blur', { bubbles: true }));
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:269',message:'Dispatched Enter and blur events',data:{inputValueAfterEvents:nameInput.value},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'A'})}).catch(()=>{});
                        // #endregion
                        await this.wait(300);
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:273',message:'After wait, checking final value',data:{inputValueFinal:nameInput.value,isEditMode:nameInput.closest('.edit_mode')!==null},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
                    }
                }
            }
            
            // Duration and Tick are direct inputs (no edit button needed)
            const durationInput = lastAction.querySelector('.timer_duration input[type="number"]');
            const tickInput = lastAction.querySelector('.timer_every input[type="number"]');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:280',message:'Looking for timer inputs',data:{foundDurationInput:!!durationInput,foundTickInput:!!tickInput},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            if (durationInput) {
                this.updateProgress(`Setting timer duration: ${actionData.duration || 10}`);
                await this.setInputValue(durationInput, (actionData.duration || 10).toString());
            }
            if (tickInput) {
                this.updateProgress(`Setting timer tick: ${actionData.tick || 1}`);
                await this.setInputValue(tickInput, (actionData.tick || 1).toString());
            }
        } else if (actionData.type === "ifthenelse") {
            this.updateProgress('Creating if/then/else action');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:293',message:'Filling ifthenelse action',data:{condition:actionData.condition,hasThen:!!actionData.then,hasElse:!!actionData.else,thenCount:actionData.then?.length||0,elseCount:actionData.else?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            // Parse condition: "player.health == 100" into value1, operator, value2
            const conditionMatch = actionData.condition.match(/(.+?)\s*(==|!=|>=|<=|>|<|=~)\s*(.+)/);
            if (conditionMatch) {
                const value1 = conditionMatch[1].trim();
                const operator = conditionMatch[2].trim();
                const value2 = conditionMatch[3].trim();
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:202',message:'Parsed condition',data:{value1,operator,value2},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                
                // Find value1 row and click edit button
                const value1Row = lastAction.querySelector('.action_value_list_row.value1, [data-key="value1"]');
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:303',message:'Looking for value1 row',data:{foundValue1Row:!!value1Row,allRows:lastAction.querySelectorAll('.action_value_list_row').length},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                
                if (value1Row) {
                    this.updateProgress(`Setting condition value1: ${value1}`);
                    // Hover to show edit button, then click it
                    value1Row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    await this.wait(200);
                    const editBtn1 = value1Row.querySelector('.edit_action_value_btn');
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:310',message:'Looking for edit button value1',data:{foundEditBtn:!!editBtn1},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    if (editBtn1) {
                        editBtn1.click();
                        await this.wait(200);
                        const input1 = value1Row.querySelector('input.black_input');
                        if (input1) {
                            await this.setInputValue(input1, value1);
                            await this.wait(200);
                        }
                    }
                }
                
                // Find operator select/dropdown
                const operatorSelect = lastAction.querySelector('select');
                if (operatorSelect) {
                    this.updateProgress(`Setting condition operator: ${operator}`);
                    operatorSelect.value = operator;
                    operatorSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    await this.wait(200);
                }
                
                // Find value2 row and click edit button
                const value2Row = lastAction.querySelector('.action_value_list_row.value2, [data-key="value2"]');
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:329',message:'Looking for value2 row',data:{foundValue2Row:!!value2Row},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                if (value2Row) {
                    this.updateProgress(`Setting condition value2: ${value2}`);
                    value2Row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    await this.wait(200);
                    const editBtn2 = value2Row.querySelector('.edit_action_value_btn');
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:335',message:'Looking for edit button value2',data:{foundEditBtn:!!editBtn2},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-fix',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    if (editBtn2) {
                        editBtn2.click();
                        await this.wait(200);
                        const input2 = value2Row.querySelector('input.black_input');
                        if (input2) {
                            await this.setInputValue(input2, value2);
                            await this.wait(200);
                        }
                    }
                }
            } else {
                console.warn('[Junon Automation] Could not parse condition:', actionData.condition);
            }

            // Handle nested "then" actions
            if (actionData.then && actionData.then.length > 0) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:395',message:'Processing then actions',data:{thenActionsCount:actionData.then.length,depth:depth,lastActionClass:lastAction.className||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
                // #endregion
                // Try multiple selectors to find then container (supports nested ifthenelse)
                const thenContainer = lastAction.querySelector('.then.tab_1') || 
                                     lastAction.querySelector('.ifthenelse_then') ||
                                     lastAction.querySelector('.then');
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:400',message:'Looking for then container',data:{foundThenContainer:!!thenContainer,lastActionHTML:lastAction.outerHTML.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
                // #endregion
                if (thenContainer) {
                    console.log(`${indent}  Found then container, processing ${actionData.then.length} actions`);
                    for (let i = 0; i < actionData.then.length; i++) {
                        const subAction = actionData.then[i];
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:406',message:'Creating sub-action in then',data:{subActionType:subAction.type,index:i,total:actionData.then.length,depth:depth},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
                        // #endregion
                        // Recursive call with increased depth
                        await this.createAction(thenContainer, subAction, depth + 1);
                    }
                } else {
                    console.warn(`[Junon Automation] Then container not found at depth ${depth}`);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:412',message:'Then container not found',data:{depth:depth,lastActionClass:lastAction.className,lastActionHTML:lastAction.outerHTML.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
                    // #endregion
                }
            }

            // Handle nested "else" actions
            if (actionData.else && actionData.else.length > 0) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:417',message:'Processing else actions',data:{elseActionsCount:actionData.else.length,depth:depth,lastActionClass:lastAction.className||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
                // #endregion
                // Try multiple selectors to find else container (supports nested ifthenelse)
                const elseContainer = lastAction.querySelector('.else.tab_1') || 
                                     lastAction.querySelector('.ifthenelse_else') ||
                                     lastAction.querySelector('.else');
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:422',message:'Looking for else container',data:{foundElseContainer:!!elseContainer,lastActionHTML:lastAction.outerHTML.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
                // #endregion
                if (elseContainer) {
                    console.log(`${indent}  Found else container, processing ${actionData.else.length} actions`);
                    for (let i = 0; i < actionData.else.length; i++) {
                        const subAction = actionData.else[i];
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:428',message:'Creating sub-action in else',data:{subActionType:subAction.type,index:i,total:actionData.else.length,depth:depth},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
                        // #endregion
                        // Recursive call with increased depth
                        await this.createAction(elseContainer, subAction, depth + 1);
                    }
                } else {
                    console.warn(`[Junon Automation] Else container not found at depth ${depth}`);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:434',message:'Else container not found',data:{depth:depth,lastActionClass:lastAction.className,lastActionHTML:lastAction.outerHTML.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'recursion-check',hypothesisId:'recursion'})}).catch(()=>{});
                    // #endregion
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
            return { success: true, triggersProcessed: this.config.triggers.length };
        } catch (error) {
            console.error("Automation failed:", error);
            throw error;
        }
    }
}

// Make it available globally
console.log('[Junon Automation] Attempting to register classes...');
console.log('[Junon Automation] window available:', typeof window !== 'undefined');
console.log('[Junon Automation] document available:', typeof document !== 'undefined');

if (typeof window !== 'undefined') {
    window.JunonAutomation = JunonAutomation;
    console.log('[Junon Automation] ✓ JunonAutomation class registered on window');
    console.log('[Junon Automation] window.JunonAutomation type:', typeof window.JunonAutomation);
} else {
    console.error('[Junon Automation] ✗ window is undefined, cannot register JunonAutomation');
}

/**
 * Junon.io Command Blocks Extractor
 * Extracts all triggers and their nested actions from the DOM
 */
class JunonExtractor {
    constructor() {
        this.selectors = {
            triggerEntry: '.trigger_entry',
            triggerName: '.trigger_name',
            eventValue: '.event_value', // New selector based on actual HTML
            actionEntry: '.action_entry',
            actionName: '.action_name',
            actionKey: '.action_key', // New selector for action type
            actionValueList: '.action_value_list',
            actionValueListRow: '.action_value_list_row',
            timerName: '.timer_name',
            timerDuration: '.timer_duration',
            timerEvery: '.timer_every',
            ifthenelseThen: '.then.tab_1, .ifthenelse_then',
            ifthenelseElse: '.else.tab_1, .ifthenelse_else',
            ifthenelseIf: '.if.tab_1, .ifthenelse_if',
            input: 'input[type="text"]',
            numberInput: 'input[type="number"]',
            select: 'select'
        };
    }

    /**
     * Extract all triggers and actions from the page
     */
    extractAll() {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractAll',message:'Starting extraction',data:{url:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        const triggers = [];
        // Try multiple selectors for trigger container
        const triggersContainer = document.querySelector('.triggers_container') || document.querySelector('#command_block_menu');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractAll',message:'Looking for triggers container',data:{foundContainer:!!triggersContainer,containerClass:triggersContainer?.className||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        const triggerEntries = triggersContainer 
            ? triggersContainer.querySelectorAll(this.selectors.triggerEntry)
            : document.querySelectorAll(this.selectors.triggerEntry);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractAll',message:'Found trigger entries',data:{count:triggerEntries.length},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        for (const triggerEntry of triggerEntries) {
            const trigger = this.extractTrigger(triggerEntry);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractAll',message:'Extracted trigger',data:{trigger:trigger?trigger.event:'null',actionsCount:trigger?.actions?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            if (trigger) {
                triggers.push(trigger);
            }
        }

        return { triggers };
    }

    /**
     * Extract a single trigger
     */
    extractTrigger(triggerEntry) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractTrigger',message:'Extracting trigger',data:{triggerEntryHTML:triggerEntry.outerHTML.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // Find trigger name/event - try both selectors
        const eventValueEl = triggerEntry.querySelector(this.selectors.eventValue);
        const triggerNameEl = triggerEntry.querySelector(this.selectors.triggerName);
        const eventEl = eventValueEl || triggerNameEl;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractTrigger',message:'Looking for event name',data:{foundEventValue:!!eventValueEl,foundTriggerName:!!triggerNameEl,foundEvent:!!eventEl},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (!eventEl) {
            console.warn('[Junon Extractor] Could not find event name in trigger entry');
            return null;
        }

        const event = eventEl.textContent.trim();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractTrigger',message:'Event name found',data:{event:event},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (!event) return null;

        // Find all actions within this trigger
        // IMPORTANT: Only get top-level actions, not nested actions
        const actions = [];
        const allActionEntries = triggerEntry.querySelectorAll(this.selectors.actionEntry);
        
        // Filter to only top-level actions (not nested in ifthenelse)
        const topLevelActions = Array.from(allActionEntries).filter(entry => {
            // Check if this action is nested inside an ifthenelse's then/else container
            const parentThen = entry.closest('.then.tab_1, .ifthenelse_then');
            const parentElse = entry.closest('.else.tab_1, .ifthenelse_else');
            // Only include if it's not nested in then/else
            return !parentThen && !parentElse;
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractTrigger',message:'Found action entries',data:{total:allActionEntries.length,topLevel:topLevelActions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-duplication-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // Track processed action IDs to avoid duplicates
        const processedIds = new Set();
        
        for (const actionEntry of topLevelActions) {
            const actionId = actionEntry.getAttribute('data-id');
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractTrigger',message:'Processing action entry',data:{actionId,alreadyProcessed:processedIds.has(actionId),actionType:actionEntry.querySelector('.action_key')?.textContent||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-duplication-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            // Skip if already processed
            if (actionId && processedIds.has(actionId)) {
                console.warn(`[Junon Extractor] Skipping duplicate action with id: ${actionId}`);
                continue;
            }
            
            if (actionId) {
                processedIds.add(actionId);
            }
            
            const action = this.extractAction(actionEntry);
            if (action) {
                actions.push(action);
            }
        }

        return {
            event,
            actions
        };
    }

    /**
     * Extract a single action (recursive for nested actions)
     */
    extractAction(actionEntry) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractAction',message:'Extracting action',data:{actionEntryClass:actionEntry.className,hasTimerName:!!actionEntry.querySelector(this.selectors.timerName),hasIfthenelse:!!actionEntry.querySelector(this.selectors.ifthenelseThen)},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Determine action type by checking the structure
        // First check for action_key (most reliable)
        const actionKeyEl = actionEntry.querySelector(this.selectors.actionKey);
        const actionKey = actionKeyEl ? actionKeyEl.textContent.trim() : '';
        
        // Also check class names
        const hasTimerClass = actionEntry.classList.contains('timer');
        const hasIfthenelseClass = actionEntry.classList.contains('ifthenelse');

        // Check for timer
        const timerNameEl = actionEntry.querySelector(this.selectors.timerName);
        if (timerNameEl || hasTimerClass || actionKey.toLowerCase() === 'timer') {
            return this.extractTimer(actionEntry);
        }

        // Check for ifthenelse
        const thenContainer = actionEntry.querySelector(this.selectors.ifthenelseThen);
        const elseContainer = actionEntry.querySelector(this.selectors.ifthenelseElse);
        if (thenContainer || elseContainer || hasIfthenelseClass || actionKey.toLowerCase() === 'ifthenelse') {
            return this.extractIfThenElse(actionEntry);
        }

        // Default to command
        return this.extractCommand(actionEntry);
    }

    /**
     * Extract command action
     */
    extractCommand(actionEntry) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractCommand',message:'Extracting command',data:{actionEntryHTML:actionEntry.outerHTML.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        const values = [];
        const actionValueList = actionEntry.querySelector(this.selectors.actionValueList);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractCommand',message:'Looking for action value list',data:{foundActionValueList:!!actionValueList},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (actionValueList) {
            const rows = actionValueList.querySelectorAll(this.selectors.actionValueListRow);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractCommand',message:'Found rows',data:{rowsCount:rows.length},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            
            for (const row of rows) {
                // Skip edit_mode rows that are empty (they're temporary)
                if (row.classList.contains('edit_mode')) {
                    const rowContent = row.querySelector('.row_content');
                    if (!rowContent || !rowContent.textContent.trim()) {
                        continue;
                    }
                }
                
                // Try to find the displayed value in row_content
                const rowContent = row.querySelector('.row_content');
                if (rowContent) {
                    const value = rowContent.textContent.trim();
                    if (value) {
                        values.push(value);
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractCommand',message:'Found command value from row_content',data:{value:value},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'D'})}).catch(()=>{});
                        // #endregion
                        continue;
                    }
                }
                
                // Fallback: check for input value (might be visible or hidden)
                const input = row.querySelector(this.selectors.input);
                if (input) {
                    const value = input.value || input.getAttribute('value') || '';
                    if (value) {
                        values.push(value);
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractCommand',message:'Found command value from input',data:{value:value},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'D'})}).catch(()=>{});
                        // #endregion
                    }
                }
            }
        } else {
            // Fallback: find any input in the action entry
            const inputs = actionEntry.querySelectorAll(this.selectors.input);
            for (const input of inputs) {
                const value = input.value || input.getAttribute('value') || '';
                if (value) {
                    values.push(value);
                }
            }
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractCommand',message:'Command extraction complete',data:{valuesCount:values.length,values:values},timestamp:Date.now(),sessionId:'debug-session',runId:'extraction-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        return {
            type: 'command',
            values: values.length > 0 ? values : ['']
        };
    }

    /**
     * Extract timer action
     */
    extractTimer(actionEntry) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractTimer',message:'Extracting timer',data:{actionEntryId:actionEntry.getAttribute('data-id'),actionEntryClass:actionEntry.className},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-duplication',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        let name = 'Timer';
        let duration = 10;
        let tick = 1;

        // Extract name
        const timerNameEl = actionEntry.querySelector(this.selectors.timerName);
        if (timerNameEl) {
            // Try row_content first (displayed value)
            const rowContent = timerNameEl.querySelector('.row_content');
            if (rowContent) {
                const contentText = rowContent.textContent.trim();
                if (contentText) {
                    name = contentText;
                }
            }
            
            // Fallback to input value
            if (name === 'Timer') {
                const nameInput = timerNameEl.querySelector(this.selectors.input);
                if (nameInput) {
                    const inputValue = nameInput.value || nameInput.getAttribute('value') || '';
                    if (inputValue) {
                        name = inputValue;
                    }
                }
            }
        }

        // Extract duration
        const durationEl = actionEntry.querySelector(this.selectors.timerDuration);
        if (durationEl) {
            const durationInput = durationEl.querySelector(this.selectors.numberInput);
            if (durationInput) {
                const value = durationInput.value || durationInput.getAttribute('value') || '';
                if (value) {
                    duration = parseInt(value) || duration;
                }
            }
        }

        // Extract tick
        const tickEl = actionEntry.querySelector(this.selectors.timerEvery);
        if (tickEl) {
            const tickInput = tickEl.querySelector(this.selectors.numberInput);
            if (tickInput) {
                const value = tickInput.value || tickInput.getAttribute('value') || '';
                if (value) {
                    tick = parseInt(value) || tick;
                }
            }
        }

        const result = {
            type: 'timer',
            name,
            duration,
            tick
        };
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractTimer',message:'Timer extracted',data:{result,actionEntryId:actionEntry.getAttribute('data-id')},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-duplication',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        return result;
    }

    /**
     * Extract ifthenelse action (recursive)
     */
    extractIfThenElse(actionEntry) {
        // Extract condition: value1, operator, value2
        let value1 = '';
        let operator = '==';
        let value2 = '';

        const value1Row = actionEntry.querySelector('.action_value_list_row.value1, [data-key="value1"]');
        if (value1Row) {
            // Try row_content first (displayed value)
            const rowContent = value1Row.querySelector('.row_content');
            if (rowContent) {
                value1 = rowContent.textContent.trim();
            }
            
            // Fallback to input value
            if (!value1) {
                const input = value1Row.querySelector(this.selectors.input);
                if (input) {
                    value1 = input.value || input.getAttribute('value') || '';
                }
            }
        }

        const operatorSelect = actionEntry.querySelector(this.selectors.select);
        if (operatorSelect) {
            operator = operatorSelect.value || operator;
        }

        const value2Row = actionEntry.querySelector('.action_value_list_row.value2, [data-key="value2"]');
        if (value2Row) {
            // Try row_content first (displayed value)
            const rowContent = value2Row.querySelector('.row_content');
            if (rowContent) {
                value2 = rowContent.textContent.trim();
            }
            
            // Fallback to input value
            if (!value2) {
                const input = value2Row.querySelector(this.selectors.input);
                if (input) {
                    value2 = input.value || input.getAttribute('value') || '';
                }
            }
        }

        const condition = `${value1} ${operator} ${value2}`.trim();

        // Extract then actions (recursive)
        const thenActions = [];
        const thenContainer = actionEntry.querySelector(this.selectors.ifthenelseThen);
        if (thenContainer) {
            // Get all action entries within then container
            const allThenActions = thenContainer.querySelectorAll(this.selectors.actionEntry);
            
            // Filter to only direct children (not nested in another ifthenelse within then)
            const directThenActions = Array.from(allThenActions).filter(entry => {
                // Check if this entry is directly under then container or nested deeper
                const parentThen = entry.closest('.then.tab_1, .ifthenelse_then');
                const parentElse = entry.closest('.else.tab_1, .ifthenelse_else');
                // Only include if it's directly in this then container, not in a nested ifthenelse
                return (parentThen === thenContainer || !parentThen) && !parentElse;
            });
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractIfThenElse',message:'Extracting then actions',data:{total:allThenActions.length,direct:directThenActions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-duplication-fix',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            for (const thenActionEntry of directThenActions) {
                const thenAction = this.extractAction(thenActionEntry);
                if (thenAction) {
                    thenActions.push(thenAction);
                }
            }
        }

        // Extract else actions (recursive)
        const elseActions = [];
        const elseContainer = actionEntry.querySelector(this.selectors.ifthenelseElse);
        if (elseContainer) {
            // Get all action entries within else container
            const allElseActions = elseContainer.querySelectorAll(this.selectors.actionEntry);
            
            // Filter to only direct children (not nested in another ifthenelse within else)
            const directElseActions = Array.from(allElseActions).filter(entry => {
                // Check if this entry is directly under else container or nested deeper
                const parentThen = entry.closest('.then.tab_1, .ifthenelse_then');
                const parentElse = entry.closest('.else.tab_1, .ifthenelse_else');
                // Only include if it's directly in this else container, not in a nested ifthenelse
                return !parentThen && (parentElse === elseContainer || !parentElse);
            });
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/bee00ae0-4be2-431a-8d40-d29a80d2e11f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'junon_automation.js:extractIfThenElse',message:'Extracting else actions',data:{total:allElseActions.length,direct:directElseActions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'timer-duplication-fix',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            for (const elseActionEntry of directElseActions) {
                const elseAction = this.extractAction(elseActionEntry);
                if (elseAction) {
                    elseActions.push(elseAction);
                }
            }
        }

        const result = {
            type: 'ifthenelse',
            condition
        };

        if (thenActions.length > 0) {
            result.then = thenActions;
        }

        if (elseActions.length > 0) {
            result.else = elseActions;
        }

        return result;
    }
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.JunonExtractor = JunonExtractor;
    console.log('[Junon Automation] ✓ JunonExtractor class registered on window');
    console.log('[Junon Automation] window.JunonExtractor type:', typeof window.JunonExtractor);
} else {
    console.error('[Junon Automation] ✗ window is undefined, cannot register JunonExtractor');
}

console.log('[Junon Automation] Script file loaded completely');
console.log('[Junon Automation] Final check - JunonAutomation:', typeof window !== 'undefined' && typeof window.JunonAutomation !== 'undefined');
console.log('[Junon Automation] Final check - JunonExtractor:', typeof window !== 'undefined' && typeof window.JunonExtractor !== 'undefined');

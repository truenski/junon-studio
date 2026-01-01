// Content script for junon.io - handles automation

(function() {
  'use strict';

  // Load parser
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('parser.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Utility functions
  function waitForElement(selector, timeout = 10000, parent = document) {
    return new Promise((resolve, reject) => {
      const element = parent.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = parent.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(parent, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function clickElement(element) {
    if (!element) return false;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.click();
    return true;
  }

  function fillInput(input, value) {
    if (!input) return false;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function selectOption(select, value) {
    if (!select) return false;
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function pressEnter(input) {
    if (!input) return false;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
    return true;
  }

  // Main automation functions
  async function createTriggerBlock(triggerName) {
    try {
      console.log(`[Junon Extension] Creating trigger block: ${triggerName}`);
      
      // 1. Click .command_block_hud_btn
      const hudBtn = await waitForElement('.command_block_hud_btn');
      clickElement(hudBtn);
      await sleep(500);

      // 2. Click .add_trigger_btn
      const addTriggerBtn = await waitForElement('.add_trigger_btn');
      clickElement(addTriggerBtn);
      await sleep(500);

      // 3. Find trigger in .left_content with data-name="PlayerJoined"
      const leftContent = await waitForElement('.left_content');
      const triggerItem = await waitForElement(`[data-name="${triggerName}"]`, 5000, leftContent);
      
      if (!triggerItem) {
        throw new Error(`Trigger ${triggerName} not found in left_content`);
      }

      // 4. Click .create_block_item_btn (should be near the trigger item)
      const createBtn = triggerItem.closest('.left_content')?.querySelector('.create_block_item_btn') ||
                       triggerItem.querySelector('.create_block_item_btn') ||
                       await waitForElement('.create_block_item_btn', 5000, leftContent);
      
      clickElement(createBtn);
      await sleep(1000);

      // 5. Find .trigger_actions -> .event_entry -> .event_value with children="PlayerJoined"
      // Find the trigger_entry with the trigger name
      const triggerEntry = await waitForElement(`.trigger_entry`, 10000);
      
      // Find .trigger_actions within this trigger_entry
      const triggerActions = await waitForElement('.trigger_actions', 5000, triggerEntry);
      
      // Find .event_entry -> .event_value containing the trigger name
      const eventEntries = triggerActions.querySelectorAll('.event_entry');
      let targetEventEntry = null;
      
      for (const entry of eventEntries) {
        const eventValue = entry.querySelector('.event_value');
        if (eventValue && eventValue.textContent.trim() === triggerName) {
          targetEventEntry = entry;
          break;
        }
      }

      if (!targetEventEntry) {
        throw new Error(`Event entry for ${triggerName} not found`);
      }

      // 6. Click on the trigger_actions (or the event_entry itself)
      clickElement(targetEventEntry);
      await sleep(500);

      console.log(`[Junon Extension] Trigger block created: ${triggerName}`);
      return triggerEntry;
    } catch (error) {
      console.error(`[Junon Extension] Error creating trigger block:`, error);
      throw error;
    }
  }

  async function addCommandsAction(commands, triggerEntry) {
    try {
      console.log(`[Junon Extension] Adding commands: ${commands.length} commands`);
      
      if (!commands || commands.length === 0) {
        console.warn('[Junon Extension] No commands to add');
        return;
      }
      
      // Find .add_action_value_btn within trigger_entry
      let addActionBtn;
      try {
        addActionBtn = await waitForElement('.add_action_value_btn', 5000, triggerEntry);
      } catch (error) {
        // Try alternative selectors
        addActionBtn = triggerEntry.querySelector('.add_action_btn, [class*="add"], button');
        if (!addActionBtn) {
          throw new Error('Could not find add action button');
        }
      }
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`[Junon Extension] Adding command ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
        
        try {
          // Click add button
          clickElement(addActionBtn);
          await sleep(400);
          
          // Wait for .action_value_list to appear or find edit_mode
          let input = null;
          let retries = 0;
          
          while (!input && retries < 10) {
            // Try multiple strategies to find the input
            const actionValueList = triggerEntry.querySelector('.action_value_list');
            if (actionValueList) {
              const editMode = actionValueList.querySelector('.edit_mode');
              if (editMode) {
                input = editMode.querySelector('.black_input');
              }
            }
            
            // Alternative: find all edit_mode and get the last one
            if (!input) {
              const editModes = triggerEntry.querySelectorAll('.edit_mode');
              if (editModes.length > 0) {
                const lastEditMode = editModes[editModes.length - 1];
                input = lastEditMode.querySelector('.black_input');
              }
            }
            
            // Alternative: find all black_input and get the last empty one
            if (!input) {
              const allInputs = triggerEntry.querySelectorAll('.black_input');
              for (let j = allInputs.length - 1; j >= 0; j--) {
                if (!allInputs[j].value || allInputs[j].value.trim() === '') {
                  input = allInputs[j];
                  break;
                }
              }
            }
            
            if (!input) {
              await sleep(200);
              retries++;
            }
          }
          
          if (!input) {
            console.warn(`[Junon Extension] Could not find input for command ${i + 1}, skipping`);
            continue;
          }
          
          fillInput(input, command);
          await sleep(100);
          pressEnter(input);
          await sleep(400);
        } catch (cmdError) {
          console.error(`[Junon Extension] Error adding command ${i + 1}:`, cmdError);
          // Continue with next command instead of failing completely
        }
      }
      
      console.log('[Junon Extension] Commands added successfully');
    } catch (error) {
      console.error('[Junon Extension] Error adding commands:', error);
      throw error;
    }
  }

  async function selectActionFromLeftContent(actionType) {
    const leftContent = await waitForElement('.left_content');
    const options = leftContent.querySelectorAll('.action_name, [data-name]');
    
    for (const opt of options) {
      const text = opt.textContent.toLowerCase();
      const dataName = opt.getAttribute('data-name')?.toLowerCase();
      
      if (text.includes(actionType) || dataName === actionType) {
        clickElement(opt);
        await sleep(300);
        
        const createBtn = leftContent.querySelector('.create_block_item_btn');
        if (createBtn) {
          clickElement(createBtn);
          await sleep(500);
        }
        return;
      }
    }
    
    throw new Error(`Action type ${actionType} not found in left_content`);
  }

  async function addIfThenElseAction(ifData, triggerEntry) {
    try {
      console.log(`[Junon Extension] Adding ifthenelse action`);
      
      // Find all .action_entry.ifthenelse within trigger_entry
      const ifThenElseEntries = triggerEntry.querySelectorAll('.action_entry.ifthenelse');
      
      // Get the highest data-id
      let maxId = -1;
      ifThenElseEntries.forEach(entry => {
        const id = parseInt(entry.getAttribute('data-id') || '0');
        if (id > maxId) maxId = id;
      });
      
      // First, we need to add the ifthenelse action
      const addActionBtn = triggerEntry.querySelector('.add_action_btn, .add_action_value_btn');
      if (addActionBtn) {
        clickElement(addActionBtn);
        await sleep(500);
        
        await selectActionFromLeftContent('ifthenelse');
      }
      
      // Now find the newly created ifthenelse entry
      await sleep(500);
      const allIfThenElse = triggerEntry.querySelectorAll('.action_entry.ifthenelse');
      let targetIfThenElse = null;
      
      // Find the one with highest data-id (newest)
      let highestId = -1;
      allIfThenElse.forEach(entry => {
        const id = parseInt(entry.getAttribute('data-id') || '0');
        if (id > highestId) {
          highestId = id;
          targetIfThenElse = entry;
        }
      });
      
      if (!targetIfThenElse) {
        throw new Error('Could not find ifthenelse entry');
      }
      
      // Fill in the comparison values
      const comparison = targetIfThenElse.querySelector('.comparison');
      if (comparison) {
        // Value1
        const value1Row = comparison.querySelector('[data-key="value1"]');
        if (value1Row) {
          const value1Input = value1Row.querySelector('.black_input');
          if (value1Input) {
            fillInput(value1Input, ifData.if.value1);
            await sleep(200);
          }
        }
        
        // Operator
        const operatorSelect = comparison.querySelector('select');
        if (operatorSelect) {
          selectOption(operatorSelect, ifData.if.operator);
          await sleep(200);
        }
        
        // Value2
        const value2Row = comparison.querySelector('[data-key="value2"]');
        if (value2Row) {
          const value2Input = value2Row.querySelector('.black_input');
          if (value2Input) {
            fillInput(value2Input, ifData.if.value2);
            await sleep(200);
          }
        }
      }
      
      // Handle then actions
      if (ifData.then && ifData.then.length > 0) {
        const thenDiv = targetIfThenElse.querySelector('.then');
        if (thenDiv) {
          const thenAddBtn = thenDiv.querySelector('.add_action_btn');
          if (thenAddBtn) {
            clickElement(thenAddBtn);
            await sleep(500);
            
            await selectActionFromLeftContent('commands');
            
            // Add commands in then block - need to find the nested trigger_entry or action area
            const thenActionArea = thenDiv.closest('.action_entry') || targetIfThenElse;
            await addCommandsAction(ifData.then, thenActionArea);
          }
        }
      }
      
      // Handle else actions
      if (ifData.else && ifData.else.length > 0) {
        const elseDiv = targetIfThenElse.querySelector('.else');
        if (elseDiv) {
          const elseAddBtn = elseDiv.querySelector('.add_action_btn');
          if (elseAddBtn) {
            clickElement(elseAddBtn);
            await sleep(500);
            
            await selectActionFromLeftContent('commands');
            
            const elseActionArea = elseDiv.closest('.action_entry') || targetIfThenElse;
            await addCommandsAction(ifData.else, elseActionArea);
          }
        }
      }
      
      // Handle elseif blocks (create new ifthenelse entries)
      if (ifData.elseif && ifData.elseif.length > 0) {
        for (const elseifBlock of ifData.elseif) {
          // Create new ifthenelse for each elseif
          await sleep(500);
          // Similar process - would need to add another ifthenelse and fill it
          console.log('[Junon Extension] Elseif blocks need manual implementation');
        }
      }
      
      console.log('[Junon Extension] IfThenElse added successfully');
    } catch (error) {
      console.error('[Junon Extension] Error adding ifthenelse:', error);
      throw error;
    }
  }

  async function addTimerAction(timerData, triggerEntry) {
    try {
      console.log(`[Junon Extension] Adding timer action`);
      
      // Find or create timer action entry
      const addActionBtn = triggerEntry.querySelector('.add_action_btn, .add_action_value_btn');
      if (addActionBtn) {
        clickElement(addActionBtn);
        await sleep(500);
        
        await selectActionFromLeftContent('timer');
      }
      
      // Find the timer entry
      await sleep(500);
      const timerEntry = await waitForElement('.action_entry.timer', 5000, triggerEntry);
      
      // Fill timer name
      const timerNameRow = timerEntry.querySelector('.timer_name');
      if (timerNameRow) {
        const nameInput = timerNameRow.querySelector('.black_input');
        if (nameInput) {
          fillInput(nameInput, timerData.name || 'Timer');
          await sleep(200);
        }
      }
      
      // Fill duration
      const durationInput = timerEntry.querySelector('.timer_duration input');
      if (durationInput) {
        fillInput(durationInput, timerData.duration.toString());
        await sleep(200);
      }
      
      // Fill tick
      const tickInput = timerEntry.querySelector('.timer_every input');
      if (tickInput) {
        fillInput(tickInput, (timerData.tick || 1).toString());
        await sleep(200);
      }
      
      // Add commands inside timer if any
      if (timerData.commands && timerData.commands.length > 0) {
        await addCommandsAction(timerData.commands, timerEntry);
      }
      
      console.log('[Junon Extension] Timer added successfully');
    } catch (error) {
      console.error('[Junon Extension] Error adding timer:', error);
      throw error;
    }
  }

  // Main import function
  async function importCode(code) {
    try {
      console.log('[Junon Extension] Starting code import');
      
      // Wait for parser to be available
      let retries = 0;
      while (!window.parseJunonCode && retries < 10) {
        await sleep(200);
        retries++;
      }
      
      if (!window.parseJunonCode) {
        throw new Error('Parser not loaded. Please refresh the page.');
      }
      
      // Parse code
      const triggers = window.parseJunonCode(code);
      
      if (!triggers || triggers.length === 0) {
        throw new Error('No triggers found in code');
      }

      console.log(`[Junon Extension] Parsed ${triggers.length} trigger(s)`);

      // Process each trigger
      for (let i = 0; i < triggers.length; i++) {
        const triggerBlock = triggers[i];
        console.log(`[Junon Extension] Processing trigger ${i + 1}/${triggers.length}: ${triggerBlock.trigger}`);
        
        // Create trigger block
        const triggerEntry = await createTriggerBlock(triggerBlock.trigger);
        
        // Process each action in order
        for (let j = 0; j < triggerBlock.actions.length; j++) {
          const action = triggerBlock.actions[j];
          await sleep(800); // Longer delay between actions
          
          console.log(`[Junon Extension] Processing action ${j + 1}/${triggerBlock.actions.length}: ${action.type}`);
          
          try {
            if (action.type === 'commands') {
              await addCommandsAction(action.values, triggerEntry);
            } else if (action.type === 'ifthenelse') {
              await addIfThenElseAction(action, triggerEntry);
            } else if (action.type === 'timer') {
              await addTimerAction(action, triggerEntry);
            }
          } catch (actionError) {
            console.error(`[Junon Extension] Error processing action ${j + 1}:`, actionError);
            // Continue with next action instead of failing completely
          }
        }
        
        // Delay between triggers
        if (i < triggers.length - 1) {
          await sleep(1000);
        }
      }

      console.log('[Junon Extension] Code import completed successfully');
      return { success: true, triggersProcessed: triggers.length };
    } catch (error) {
      console.error('[Junon Extension] Import error:', error);
      throw error;
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'importCode') {
      importCode(request.code).then(result => {
        sendResponse({ success: true, result });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // Will respond asynchronously
    }
  });

  // Export functions for testing
  window.__JUNON_EXTENSION__ = {
    createTriggerBlock,
    addCommandsAction,
    addIfThenElseAction,
    addTimerAction,
    importCode,
    waitForElement,
    sleep
  };

  console.log('[Junon Extension] Content script loaded');
})();

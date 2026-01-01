// Parser for Junon code syntax

/**
 * Parses Junon code into structured format for automation
 * @param {string} code - Junon code to parse
 * @returns {Array} Array of trigger blocks with their actions
 */
function parseJunonCode(code) {
  const triggers = [];
  const lines = code.split('\n');
  
  let currentTrigger = null;
  let currentCommands = [];
  let currentConditions = [];
  let currentTimers = [];
  let inCommands = false;
  let currentCondition = null;
  let currentTimer = null;
  let inTimer = false;
  let triggerIndent = 0;
  
  const saveCurrentTrigger = () => {
    if (currentTrigger) {
      if (currentCommands.length > 0) {
        currentTrigger.actions.push({
          type: 'commands',
          values: currentCommands
        });
      }
      if (currentConditions.length > 0) {
        currentTrigger.actions.push(...currentConditions);
      }
      if (currentTimers.length > 0) {
        currentTrigger.actions.push(...currentTimers);
      }
      triggers.push(currentTrigger);
    }
  };
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;
    
    const indent = line.length - line.trimStart().length;
    
    // New trigger block
    if (trimmed.startsWith('@trigger')) {
      saveCurrentTrigger();
      
      const match = trimmed.match(/@trigger\s+(\w+)/);
      if (match) {
        currentTrigger = {
          trigger: match[1],
          actions: []
        };
        currentCommands = [];
        currentConditions = [];
        currentTimers = [];
        currentCondition = null;
        currentTimer = null;
        inCommands = false;
        inTimer = false;
        triggerIndent = indent;
      }
    }
    // Commands block
    else if (trimmed.startsWith('@commands') && currentTrigger && indent > triggerIndent) {
      inCommands = true;
      inTimer = false;
      currentCondition = null;
    }
    // If condition
    else if (trimmed.startsWith('@if') && currentTrigger && indent > triggerIndent) {
      inCommands = false;
      inTimer = false;
      
      // Parse condition: @if player.health == 100
      const conditionMatch = trimmed.match(/@if\s+(.+)/);
      if (conditionMatch) {
        const conditionStr = conditionMatch[1].trim();
        // Parse: player.health == 100
        const parts = conditionStr.match(/(.+?)\s*(==|!=|>=|<=|>|<|=~)\s*(.+)/);
        
        if (parts) {
          currentCondition = {
            type: 'ifthenelse',
            if: {
              value1: parts[1].trim(),
              operator: parts[2].trim(),
              value2: parts[3].trim()
            },
            then: [],
            else: [],
            elseif: []
          };
          currentConditions.push(currentCondition);
        }
      }
    }
    // Then clause
    else if (trimmed.startsWith('then') && currentCondition && indent > triggerIndent) {
      const thenMatch = trimmed.match(/then\s+(.+)/);
      if (thenMatch) {
        currentCondition.then.push(thenMatch[1].trim());
      }
    }
    // Elseif clause
    else if (trimmed.startsWith('elseif') && currentCondition && indent > triggerIndent) {
      const elseifMatch = trimmed.match(/elseif\s+(.+?)(?:\s+then\s+(.+))?$/);
      if (elseifMatch) {
        const conditionStr = elseifMatch[1].trim();
        const parts = conditionStr.match(/(.+?)\s*(==|!=|>=|<=|>|<|=~)\s*(.+)/);
        
        if (parts) {
          const elseifBlock = {
            type: 'ifthenelse',
            if: {
              value1: parts[1].trim(),
              operator: parts[2].trim(),
              value2: parts[3].trim()
            },
            then: elseifMatch[2] ? [elseifMatch[2].trim()] : []
          };
          currentCondition.elseif.push(elseifBlock);
        }
      }
    }
    // Else clause (without condition)
    else if (trimmed.startsWith('else') && !trimmed.startsWith('elseif') && currentCondition && indent > triggerIndent) {
      const elseMatch = trimmed.match(/else\s+(.+)/);
      if (elseMatch) {
        currentCondition.else.push(elseMatch[1].trim());
      }
    }
    // Timer block
    else if (trimmed.startsWith('@timer') && currentTrigger && indent > triggerIndent) {
      inCommands = false;
      inTimer = true;
      currentCondition = null;
      
      const timerMatch = trimmed.match(/@timer\s+(\d+)/);
      if (timerMatch) {
        currentTimer = {
          type: 'timer',
          duration: parseInt(timerMatch[1], 10),
          name: 'Timer',
          tick: 1,
          commands: []
        };
        currentTimers.push(currentTimer);
      }
    }
    // Command line
    else if (trimmed.startsWith('/') && trimmed.length > 1) {
      if (inCommands && currentTrigger) {
        currentCommands.push(trimmed);
      } else if (inTimer && currentTimer) {
        currentTimer.commands.push(trimmed);
      } else if (currentCondition) {
        // Command in then/elseif block
        const thenMatch = trimmed.match(/then\s+(.+)/);
        if (thenMatch) {
          currentCondition.then.push(thenMatch[1].trim());
        } else {
          // Direct command in condition block
          if (currentCondition.then.length === 0) {
            currentCondition.then.push(trimmed);
          } else {
            currentCondition.then.push(trimmed);
          }
        }
      }
    }
  });
  
  saveCurrentTrigger();
  
  return triggers;
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.parseJunonCode = parseJunonCode;
}


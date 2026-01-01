// Junon syntax definitions and validation
import { getCommandNames, getTriggerNames, type MDXCommand, type MDXTrigger } from '@/lib/mdxLoader';

// These will be populated dynamically from MDX data
export let TRIGGER_EVENTS: readonly string[] = [] as const;
export let COMMANDS: readonly string[] = [] as const;

// MDX data cache
let mdxCommands: MDXCommand[] = [];
let mdxTriggers: MDXTrigger[] = [];

// Initialize MDX data (call this from CodeEditor on mount)
export async function initializeMDXData() {
  try {
    const [commandNames, triggerNames, { getCommands, getTriggers }] = await Promise.all([
      getCommandNames(),
      getTriggerNames(),
      import('@/lib/mdxLoader'),
    ]);
    
    TRIGGER_EVENTS = triggerNames as any;
    COMMANDS = commandNames as any;
    mdxCommands = await getCommands();
    mdxTriggers = await getTriggers();
  } catch (error) {
    console.error('Failed to initialize MDX data:', error);
    // Fallback to default values
    TRIGGER_EVENTS = [
      'onPlayerJoin',
      'onPlayerLeave', 
      'onPlayerDeath',
      'onPlayerRespawn',
      'onPlayerChat',
    ] as const;
    COMMANDS = [
      '/chat',
      '/give',
      '/heal',
      '/kill',
    ] as const;
  }
}

export const CONDITIONS = [
  'player.health',
  'player.score',
  'player.team',
  'player.isAlive',
  'player.inventory',
  'entity.type',
  'entity.health',
  'game.time',
  'game.round',
  'game.players',
] as const;

export const OPERATORS = ['==', '!='] as const;

export type TriggerEvent = string;
export type Command = string;
export type Condition = typeof CONDITIONS[number];
export type Operator = typeof OPERATORS[number];

export interface ValidationError {
  line: number;
  column: number;
  length: number;
  message: string;
}

export interface SuggestionContext {
  type: 'trigger' | 'command' | 'condition' | 'operator' | 'none';
  suggestions: string[];
}

// JSON Model Interfaces
export interface ConditionBlock {
  condition: string;
  then: string[];
  elseif?: ConditionBlock[];
}

export interface TimerBlock {
  delay: number;
  commands: string[];
}

export interface TriggerBlock {
  event: string;
  commands?: string[];
  conditions?: ConditionBlock[];
  timers?: TimerBlock[];
}

export interface JunonCodeJSON {
  triggers: TriggerBlock[];
}

export function validateJunonCode(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');
  
  let inTrigger = false;
  let hasCommands = false;
  let triggerIndent = 0;
  
  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    
    // Check for @trigger
    if (trimmed.startsWith('@trigger')) {
      // A new @trigger automatically closes the previous trigger block
      // This allows multiple trigger blocks to be defined sequentially
      if (inTrigger) {
        // Close the previous trigger block
        inTrigger = false;
        hasCommands = false;
      }
      
      // Validate trigger event
      const match = trimmed.match(/@trigger\s+(\w+)/);
      if (match) {
        const eventName = match[1];
        if (TRIGGER_EVENTS.length > 0 && !TRIGGER_EVENTS.includes(eventName)) {
          const triggerStart = trimmed.indexOf('@trigger');
          const eventStart = trimmed.indexOf(eventName, triggerStart + 8);
          errors.push({
            line: lineIndex,
            column: eventStart,
            length: eventName.length,
            message: `Unknown trigger event: ${eventName}. Valid events: ${TRIGGER_EVENTS.slice(0, 3).join(', ')}...`
          });
        }
      } else if (!trimmed.match(/@trigger\s*$/)) {
        // Has text after @trigger but doesn't match pattern
        const afterTrigger = trimmed.slice(8).trim();
        if (afterTrigger && !afterTrigger.startsWith('on')) {
          errors.push({
            line: lineIndex,
            column: 8,
            length: afterTrigger.length,
            message: 'Trigger events must start with "on" (e.g., onPlayerJoin)'
          });
        }
      }
      
      // Start new trigger block
      inTrigger = true;
      hasCommands = false;
      triggerIndent = indent;
    }
    
    // Check for @commands
    if (trimmed.startsWith('@commands')) {
      if (!inTrigger) {
        errors.push({
          line: lineIndex,
          column: 0,
          length: 9,
          message: '@commands must be inside a @trigger block'
        });
      } else if (hasCommands) {
        errors.push({
          line: lineIndex,
          column: 0,
          length: 9,
          message: 'Only one @commands block allowed per @trigger'
        });
      } else if (indent <= triggerIndent) {
        errors.push({
          line: lineIndex,
          column: 0,
          length: 9,
          message: '@commands must be indented inside @trigger'
        });
      }
      hasCommands = true;
    }
    
    // Check for @if
    if (trimmed.startsWith('@if')) {
      if (!inTrigger) {
        errors.push({
          line: lineIndex,
          column: 0,
          length: 3,
          message: '@if must be inside a @trigger block'
        });
      } else if (indent <= triggerIndent) {
        errors.push({
          line: lineIndex,
          column: 0,
          length: 3,
          message: '@if must be indented inside @trigger'
        });
      }
    }
    
    // Check for @timer
    if (trimmed.startsWith('@timer')) {
      if (!inTrigger) {
        errors.push({
          line: lineIndex,
          column: 0,
          length: 6,
          message: '@timer must be inside a @trigger block'
        });
      } else if (indent <= triggerIndent) {
        errors.push({
          line: lineIndex,
          column: 0,
          length: 6,
          message: '@timer must be indented inside @trigger'
        });
      }
    }
    
    // Check for @event (should be removed)
    if (trimmed.startsWith('@event')) {
      errors.push({
        line: lineIndex,
        column: trimmed.indexOf('@event'),
        length: 6,
        message: '@event is deprecated. Specify events in @trigger (e.g., @trigger onPlayerJoin)'
      });
    }
    
    // Check for standalone commands not in proper context
    if (trimmed.startsWith('/') && inTrigger) {
      const validCommand = COMMANDS.length === 0 || COMMANDS.some(cmd => trimmed.startsWith(cmd));
      if (!validCommand && COMMANDS.length > 0) {
        const cmdMatch = trimmed.match(/^(\/\w+)/);
        if (cmdMatch) {
          errors.push({
            line: lineIndex,
            column: 0,
            length: cmdMatch[1].length,
            message: `Unknown command: ${cmdMatch[1]}`
          });
        }
      }
    }
    
    // Reset trigger state when unindented (but allow empty lines to keep trigger open)
    // A trigger block is considered closed when:
    // 1. A new @trigger is found (handled above)
    // 2. We return to indent level 0 with a non-empty line that's not a @trigger
    if (inTrigger && indent === 0 && !trimmed.startsWith('@trigger') && trimmed.length > 0) {
      inTrigger = false;
      hasCommands = false;
    }
  });
  
  return errors;
}

export function convertJunonToJSON(code: string): JunonCodeJSON {
  const triggers: TriggerBlock[] = [];
  const lines = code.split('\n');
  
  let currentTrigger: TriggerBlock | null = null;
  let currentCommands: string[] = [];
  let currentConditions: ConditionBlock[] = [];
  let currentTimers: TimerBlock[] = [];
  let inCommands = false;
  let currentCondition: ConditionBlock | null = null;
  let currentTimer: TimerBlock | null = null;
  let inTimer = false;
  let triggerIndent = 0;
  
  const saveCurrentTrigger = () => {
    if (currentTrigger) {
      if (currentCommands.length > 0) currentTrigger.commands = currentCommands;
      if (currentConditions.length > 0) currentTrigger.conditions = currentConditions;
      if (currentTimers.length > 0) currentTrigger.timers = currentTimers;
      triggers.push(currentTrigger);
    }
  };
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return; // Skip empty lines
    
    const indent = line.length - line.trimStart().length;
    
    // New trigger block
    if (trimmed.startsWith('@trigger')) {
      saveCurrentTrigger();
      
      const match = trimmed.match(/@trigger\s+(\w+)/);
      if (match) {
        currentTrigger = { event: match[1] };
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
      const conditionMatch = trimmed.match(/@if\s+(.+)/);
      if (conditionMatch) {
        currentCondition = {
          condition: conditionMatch[1].trim(),
          then: [],
          elseif: []
        };
        currentConditions.push(currentCondition);
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
        if (!currentCondition.elseif) {
          currentCondition.elseif = [];
        }
        const elseifBlock: ConditionBlock = {
          condition: elseifMatch[1].trim(),
          then: elseifMatch[2] ? [elseifMatch[2].trim()] : []
        };
        currentCondition.elseif.push(elseifBlock);
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
          delay: parseInt(timerMatch[1], 10),
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
            // Add to last then or create new
            currentCondition.then.push(trimmed);
          }
        }
      }
    }
  });
  
  saveCurrentTrigger();
  
  return { triggers };
}

export function getSuggestionContext(code: string, cursorPosition: number): SuggestionContext {
  const beforeCursor = code.slice(0, cursorPosition);
  const lines = beforeCursor.split('\n');
  const currentLine = lines[lines.length - 1] || '';
  const trimmed = currentLine.trim();
  
  // Check if we're typing after @trigger
  if (/@trigger\s*$/.test(trimmed) || /@trigger\s+\w*$/.test(trimmed)) {
    const partial = trimmed.match(/@trigger\s+(\w*)$/)?.[1] || '';
    const filtered = TRIGGER_EVENTS.filter(e => 
      e.toLowerCase().startsWith(partial.toLowerCase())
    );
    return { type: 'trigger', suggestions: filtered };
  }
  
  // Check if we're in a position for commands
  if (trimmed.startsWith('/') || trimmed === '') {
    // Check if we're inside a trigger
    const inTrigger = beforeCursor.includes('@trigger');
    if (inTrigger) {
      const partial = trimmed.startsWith('/') ? trimmed : '';
      const filtered = COMMANDS.filter(c => 
        c.toLowerCase().startsWith(partial.toLowerCase())
      );
      return { type: 'command', suggestions: filtered };
    }
  }
  
  // Check if we're typing a condition
  if (/@if\s+\w*$/.test(trimmed)) {
    const partial = trimmed.match(/@if\s+(\w*)$/)?.[1] || '';
    const filtered = CONDITIONS.filter(c => 
      c.toLowerCase().includes(partial.toLowerCase())
    );
    return { type: 'condition', suggestions: filtered };
  }
  
  // Check if we need an operator
  if (/@if\s+\w+\.\w+\s*$/.test(trimmed)) {
    return { type: 'operator', suggestions: [...OPERATORS] };
  }
  
  return { type: 'none', suggestions: [] };
}

// Get command examples from MDX
export function getCommandExample(commandName: string): string | null {
  const command = mdxCommands.find(cmd => cmd.name === commandName);
  if (command && command.examples && command.examples.length > 0) {
    return command.examples[0].code;
  }
  return null;
}

// Get trigger example from MDX
export function getTriggerExample(triggerName: string): string | null {
  const trigger = mdxTriggers.find(trg => trg.name === triggerName);
  if (trigger && trigger.examples && trigger.examples.length > 0) {
    return trigger.examples[0].code;
  }
  return null;
}

export function getAutoIndent(code: string, cursorPosition: number): string {
  const beforeCursor = code.slice(0, cursorPosition);
  const lines = beforeCursor.split('\n');
  const currentLine = lines[lines.length - 1] || '';
  const trimmed = currentLine.trim();
  
  // Get current indentation
  const currentIndent = currentLine.match(/^\s*/)?.[0] || '';
  
  // Increase indent after @trigger, @commands, @if, @timer, then, elseif
  if (
    trimmed.startsWith('@trigger') ||
    trimmed.startsWith('@commands') ||
    trimmed.startsWith('@if') ||
    trimmed.startsWith('@timer') ||
    trimmed.startsWith('then') ||
    trimmed.startsWith('elseif')
  ) {
    return currentIndent + '    ';
  }
  
  return currentIndent;
}

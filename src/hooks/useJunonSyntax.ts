// Junon syntax definitions and validation
import { getCommandNames, getTriggerNames, getFunctionNames, type MDXCommand, type MDXTrigger } from '@/lib/mdxLoader';

// These will be populated dynamically from MDX data
export let TRIGGER_EVENTS: readonly string[] = [] as const;
export let COMMANDS: readonly string[] = [] as const;
export let FUNCTIONS: readonly string[] = [] as const;

// MDX data cache
let mdxCommands: MDXCommand[] = [];
let mdxTriggers: MDXTrigger[] = [];

// Initialize MDX data (call this from CodeEditor on mount)
export async function initializeMDXData() {
  try {
    const [commandNames, triggerNames, functionNames, { getCommands, getTriggers }] = await Promise.all([
      getCommandNames(),
      getTriggerNames(),
      getFunctionNames(),
      import('@/lib/mdxLoader'),
    ]);
    
    TRIGGER_EVENTS = triggerNames as any;
    COMMANDS = commandNames as any;
    FUNCTIONS = functionNames as any;
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
    FUNCTIONS = [
      '$getHealth',
      '$getGold',
      '$getScore',
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
  type: 'trigger' | 'command' | 'condition' | 'operator' | 'function' | 'none';
  suggestions: string[];
}

// JSON Model Interfaces - New format with nested actions
export interface Action {
  type: "command" | "ifthenelse" | "timer";
  values?: string[];  // for command
  condition?: string;  // for ifthenelse
  then?: Action[];     // for ifthenelse (nested)
  else?: Action[];     // for ifthenelse (nested)
  name?: string;       // for timer
  duration?: number;   // for timer
  tick?: number;       // for timer
}

export interface TriggerBlock {
  event: string;
  actions: Action[];
}

export interface JunonCodeJSON {
  triggers: TriggerBlock[];
}

export function validateJunonCode(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');
  
  // Recursive validation function
  const validateBlock = (
    startIndex: number,
    endIndex: number,
    baseIndent: number,
    inTrigger: boolean,
    context: 'trigger' | 'then' | 'else'
  ): number => {
    let i = startIndex;
    let currentCondition: { lineIndex: number; indent: number; hasThen: boolean; hasElse: boolean } | null = null;
    
    while (i < endIndex && i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        i++;
        continue;
      }
      
      const indent = line.length - line.trimStart().length;
      
      // Check if we've left this block
      if (indent <= baseIndent && trimmed.length > 0) {
        break;
      }
      
      // @commands validation
      if (trimmed.startsWith('@commands')) {
        if (!inTrigger) {
          errors.push({
            line: i,
            column: 0,
            length: 9,
            message: '@commands must be inside a @trigger block'
          });
        } else if (indent <= baseIndent) {
          errors.push({
            line: i,
            column: 0,
            length: 9,
            message: '@commands must be indented inside its parent block'
          });
        }
        i++;
        // Validate commands inside @commands block
        while (i < endIndex && i < lines.length) {
          const cmdLine = lines[i];
          const cmdTrimmed = cmdLine.trim();
          if (cmdTrimmed.length === 0) {
            i++;
            continue;
          }
          const cmdIndent = cmdLine.length - cmdLine.trimStart().length;
          if (cmdIndent <= baseIndent) break;
          if (cmdTrimmed.startsWith('/')) {
            const validCommand = COMMANDS.length === 0 || COMMANDS.some(cmd => cmdTrimmed.startsWith(cmd));
            if (!validCommand && COMMANDS.length > 0) {
              const cmdMatch = cmdTrimmed.match(/^(\/\w+)/);
              if (cmdMatch) {
                errors.push({
                  line: i,
                  column: 0,
                  length: cmdMatch[1].length,
                  message: `Unknown command: ${cmdMatch[1]}`
                });
              }
            }
          } else {
            break;
          }
          i++;
        }
        continue;
      }
      
      // @if validation
      if (trimmed.startsWith('@if')) {
        if (!inTrigger) {
          errors.push({
            line: i,
            column: 0,
            length: 3,
            message: '@if must be inside a @trigger block'
          });
        } else if (indent <= baseIndent) {
          errors.push({
            line: i,
            column: 0,
            length: 3,
            message: '@if must be indented inside its parent block'
          });
        }
        
        const conditionMatch = trimmed.match(/@if\s+(.+)/);
        if (!conditionMatch) {
          errors.push({
            line: i,
            column: 0,
            length: 3,
            message: '@if must have a condition'
          });
        }
        
        currentCondition = {
          lineIndex: i,
          indent: indent,
          hasThen: false,
          hasElse: false
        };
        i++;
        continue;
      }
      
      // then validation
      if (trimmed.startsWith('then') && currentCondition && indent > currentCondition.indent) {
        currentCondition.hasThen = true;
        // Validate then block recursively
        const thenEnd = validateBlock(i + 1, endIndex, indent, inTrigger, 'then');
        i = thenEnd;
        continue;
      }
      
      // else validation
      if (trimmed.startsWith('else') && !trimmed.startsWith('elseif') && currentCondition && indent > currentCondition.indent) {
        currentCondition.hasElse = true;
        // Validate else block recursively
        const elseEnd = validateBlock(i + 1, endIndex, indent, inTrigger, 'else');
        i = elseEnd;
        continue;
      }
      
      // @timer validation (new format: @timer Name duration tick)
      if (trimmed.startsWith('@timer')) {
        if (!inTrigger) {
          errors.push({
            line: i,
            column: 0,
            length: 6,
            message: '@timer must be inside a @trigger block'
          });
        } else if (indent <= baseIndent) {
          errors.push({
            line: i,
            column: 0,
            length: 6,
            message: '@timer must be indented inside its parent block'
          });
        }
        
        const timerMatch = trimmed.match(/@timer\s+(\w+)\s+(\d+)\s+(\d+)/);
        if (!timerMatch) {
          errors.push({
            line: i,
            column: 0,
            length: 6,
            message: '@timer must have format: @timer Name duration tick'
          });
        }
        i++;
        continue;
      }
      
      // Command validation
      if (trimmed.startsWith('/') && trimmed.length > 1) {
        const validCommand = COMMANDS.length === 0 || COMMANDS.some(cmd => trimmed.startsWith(cmd));
        if (!validCommand && COMMANDS.length > 0) {
          const cmdMatch = trimmed.match(/^(\/\w+)/);
          if (cmdMatch) {
            errors.push({
              line: i,
              column: 0,
              length: cmdMatch[1].length,
              message: `Unknown command: ${cmdMatch[1]}`
            });
          }
        }
        i++;
        continue;
      }
      
      i++;
    }
    
    // Check if @if has at least then or else
    if (currentCondition && !currentCondition.hasThen && !currentCondition.hasElse) {
      errors.push({
        line: currentCondition.lineIndex,
        column: 0,
        length: 3,
        message: '@if must have at least a then or else clause'
      });
    }
    
    return i;
  };
  
  // Main validation loop
  let inTrigger = false;
  let triggerIndent = 0;
  
  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;
    
    const indent = line.length - line.trimStart().length;
    
    // Check for @trigger
    if (trimmed.startsWith('@trigger')) {
      if (inTrigger) {
        inTrigger = false;
      }
      
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
      }
      
      inTrigger = true;
      triggerIndent = indent;
      
      // Validate trigger block recursively
      validateBlock(lineIndex + 1, lines.length, triggerIndent, true, 'trigger');
    }
    
    // Check for @event (deprecated)
    if (trimmed.startsWith('@event')) {
      errors.push({
        line: lineIndex,
        column: trimmed.indexOf('@event'),
        length: 6,
        message: '@event is deprecated. Specify events in @trigger (e.g., @trigger onPlayerJoin)'
      });
    }
    
    // Check for elseif (deprecated, should use else @if)
    if (trimmed.startsWith('elseif')) {
      errors.push({
        line: lineIndex,
        column: 0,
        length: 6,
        message: 'elseif is deprecated. Use "else @if condition" instead'
      });
    }
  });
  
  return errors;
}

export function convertJunonToJSON(code: string): JunonCodeJSON {
  const triggers: TriggerBlock[] = [];
  const lines = code.split('\n');
  
  // Recursive function to parse actions within a block (then/else or top-level)
  const parseActions = (
    startIndex: number,
    endIndex: number,
    baseIndent: number,
    parentActions: Action[]
  ): number => {
    let i = startIndex;
    let currentCommands: string[] = [];
    let inCommands = false;
    let currentCondition: { condition: string; then: Action[]; else: Action[]; ifIndent: number } | null = null;
    let inThen = false;
    let inElse = false;
    let thenIndent = 0;
    let elseIndent = 0;
    
    const flushCommands = () => {
      if (currentCommands.length > 0) {
        const action: Action = {
          type: "command",
          values: [...currentCommands]
        };
        if (inThen && currentCondition) {
          currentCondition.then.push(action);
        } else if (inElse && currentCondition) {
          currentCondition.else.push(action);
        } else {
          parentActions.push(action);
        }
        currentCommands = [];
      }
    };
    
    const flushCondition = () => {
      if (currentCondition) {
        flushCommands();
        const action: Action = {
          type: "ifthenelse",
          condition: currentCondition.condition,
          then: currentCondition.then.length > 0 ? currentCondition.then : undefined,
          else: currentCondition.else.length > 0 ? currentCondition.else : undefined
        };
        parentActions.push(action);
        currentCondition = null;
        inThen = false;
        inElse = false;
      }
    };
    
    while (i < endIndex && i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        i++;
        continue;
      }
      
      const indent = line.length - line.trimStart().length;
      
      // Check if we've left this block (indent <= baseIndent and not empty)
      if (indent <= baseIndent && trimmed.length > 0) {
        break;
      }
      
      // @commands block
      if (trimmed.startsWith('@commands') && indent > baseIndent) {
        flushCommands();
        flushCondition();
        inCommands = true;
        inThen = false;
        inElse = false;
        currentCondition = null;
        i++;
        // Collect commands until next block
        while (i < endIndex && i < lines.length) {
          const cmdLine = lines[i];
          const cmdTrimmed = cmdLine.trim();
          if (cmdTrimmed.length === 0) {
            i++;
            continue;
          }
          const cmdIndent = cmdLine.length - cmdLine.trimStart().length;
          if (cmdIndent <= baseIndent) break;
          if (cmdTrimmed.startsWith('/')) {
            currentCommands.push(cmdTrimmed);
          } else {
            break;
          }
          i++;
        }
        flushCommands();
        inCommands = false;
        continue;
      }
      
      // @if condition
      if (trimmed.startsWith('@if') && indent > baseIndent) {
        flushCommands();
        flushCondition();
        inCommands = false;
        inThen = false;
        inElse = false;
        const conditionMatch = trimmed.match(/@if\s+(.+)/);
        if (conditionMatch) {
          currentCondition = {
            condition: conditionMatch[1].trim(),
            then: [],
            else: [],
            ifIndent: indent
          };
        }
        i++;
        continue;
      }
      
      // then clause
      if (trimmed.startsWith('then') && currentCondition && indent > currentCondition.ifIndent) {
        flushCommands();
        inThen = true;
        inElse = false;
        thenIndent = indent;
        
        // Check if then has inline command or @commands/@if/@timer
        const thenMatch = trimmed.match(/then\s+(.+)/);
        if (thenMatch) {
          const thenContent = thenMatch[1].trim();
          if (thenContent.startsWith('/')) {
            // Inline command
            currentCondition.then.push({
              type: "command",
              values: [thenContent]
            });
            i++;
            continue;
          } else if (thenContent.startsWith('@commands')) {
            // @commands in then
            i++;
            const thenCommands: string[] = [];
            while (i < endIndex && i < lines.length) {
              const cmdLine = lines[i];
              const cmdTrimmed = cmdLine.trim();
              if (cmdTrimmed.length === 0) {
                i++;
                continue;
              }
              const cmdIndent = cmdLine.length - cmdLine.trimStart().length;
              if (cmdIndent <= thenIndent) break;
              if (cmdTrimmed.startsWith('/')) {
                thenCommands.push(cmdTrimmed);
              } else {
                break;
              }
              i++;
            }
            if (thenCommands.length > 0) {
              currentCondition.then.push({
                type: "command",
                values: thenCommands
              });
            }
            continue;
          } else if (thenContent.startsWith('@if')) {
            // Nested @if in then
            const nestedIfMatch = thenContent.match(/@if\s+(.+)/);
            if (nestedIfMatch) {
              const nestedActions: Action[] = [];
              const nestedIfIndent = indent;
              i++;
              // Parse nested if recursively
              const nestedEnd = parseActions(i, endIndex, nestedIfIndent, nestedActions);
              if (nestedActions.length > 0) {
                currentCondition.then.push(...nestedActions);
              }
              i = nestedEnd;
              continue;
            }
          } else if (thenContent.startsWith('@timer')) {
            // @timer in then
            const timerMatch = thenContent.match(/@timer\s+(\w+)\s+(\d+)\s+(\d+)/);
            if (timerMatch) {
              currentCondition.then.push({
                type: "timer",
                name: timerMatch[1],
                duration: parseInt(timerMatch[2], 10),
                tick: parseInt(timerMatch[3], 10)
              });
              i++;
              continue;
            }
          }
        }
        
        // Parse then block content
        i++;
        const thenActions: Action[] = [];
        const thenEnd = parseActions(i, endIndex, thenIndent, thenActions);
        if (thenActions.length > 0) {
          currentCondition.then.push(...thenActions);
        }
        i = thenEnd;
        continue;
      }
      
      // else clause
      if (trimmed.startsWith('else') && !trimmed.startsWith('elseif') && currentCondition && indent > currentCondition.ifIndent) {
        flushCommands();
        inThen = false;
        inElse = true;
        elseIndent = indent;
        
        // Check if else has inline command or @commands/@if/@timer
        const elseMatch = trimmed.match(/else\s+(.+)/);
        if (elseMatch) {
          const elseContent = elseMatch[1].trim();
          if (elseContent.startsWith('/')) {
            // Inline command
            currentCondition.else.push({
              type: "command",
              values: [elseContent]
            });
            i++;
            continue;
          } else if (elseContent.startsWith('@commands')) {
            // @commands in else
            i++;
            const elseCommands: string[] = [];
            while (i < endIndex && i < lines.length) {
              const cmdLine = lines[i];
              const cmdTrimmed = cmdLine.trim();
              if (cmdTrimmed.length === 0) {
                i++;
                continue;
              }
              const cmdIndent = cmdLine.length - cmdLine.trimStart().length;
              if (cmdIndent <= elseIndent) break;
              if (cmdTrimmed.startsWith('/')) {
                elseCommands.push(cmdTrimmed);
              } else {
                break;
              }
              i++;
            }
            if (elseCommands.length > 0) {
              currentCondition.else.push({
                type: "command",
                values: elseCommands
              });
            }
            continue;
          } else if (elseContent.startsWith('@if')) {
            // Nested @if in else
            const nestedIfMatch = elseContent.match(/@if\s+(.+)/);
            if (nestedIfMatch) {
              const nestedActions: Action[] = [];
              const nestedIfIndent = indent;
              i++;
              // Parse nested if recursively
              const nestedEnd = parseActions(i, endIndex, nestedIfIndent, nestedActions);
              if (nestedActions.length > 0) {
                currentCondition.else.push(...nestedActions);
              }
              i = nestedEnd;
              continue;
            }
          } else if (elseContent.startsWith('@timer')) {
            // @timer in else
            const timerMatch = elseContent.match(/@timer\s+(\w+)\s+(\d+)\s+(\d+)/);
            if (timerMatch) {
              currentCondition.else.push({
                type: "timer",
                name: timerMatch[1],
                duration: parseInt(timerMatch[2], 10),
                tick: parseInt(timerMatch[3], 10)
              });
              i++;
              continue;
            }
          }
        }
        
        // Parse else block content
        i++;
        const elseActions: Action[] = [];
        const elseEnd = parseActions(i, endIndex, elseIndent, elseActions);
        if (elseActions.length > 0) {
          currentCondition.else.push(...elseActions);
        }
        i = elseEnd;
        continue;
      }
      
      // @timer standalone (new format: @timer Name duration tick)
      if (trimmed.startsWith('@timer') && indent > baseIndent) {
        flushCommands();
        flushCondition();
        const timerMatch = trimmed.match(/@timer\s+(\w+)\s+(\d+)\s+(\d+)/);
        if (timerMatch) {
          parentActions.push({
            type: "timer",
            name: timerMatch[1],
            duration: parseInt(timerMatch[2], 10),
            tick: parseInt(timerMatch[3], 10)
          });
        }
        i++;
        continue;
      }
      
      // Command line
      if (trimmed.startsWith('/') && trimmed.length > 1) {
        if (inCommands) {
          currentCommands.push(trimmed);
        } else if (inThen && currentCondition) {
          // Command directly in then block
          currentCondition.then.push({
            type: "command",
            values: [trimmed]
          });
        } else if (inElse && currentCondition) {
          // Command directly in else block
          currentCondition.else.push({
            type: "command",
            values: [trimmed]
          });
        } else if (indent > baseIndent) {
          // Command at top level of block
          currentCommands.push(trimmed);
        }
        i++;
        continue;
      }
      
      i++;
    }
    
    flushCommands();
    flushCondition();
    
    return i;
  };
  
  // Main parsing loop
  let currentTrigger: TriggerBlock | null = null;
  let triggerIndent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    
    const indent = line.length - line.trimStart().length;
    
    // New trigger block
    if (trimmed.startsWith('@trigger')) {
      // Save previous trigger
      if (currentTrigger) {
        triggers.push(currentTrigger);
      }
      
      const match = trimmed.match(/@trigger\s+(\w+)/);
      if (match) {
        currentTrigger = { event: match[1], actions: [] };
        triggerIndent = indent;
        
        // Parse actions for this trigger
        const actions: Action[] = [];
        const endIndex = parseActions(i + 1, lines.length, triggerIndent, actions);
        currentTrigger.actions = actions;
        i = endIndex - 1; // -1 because loop will increment
      }
    }
  }
  
  // Save last trigger
  if (currentTrigger) {
    triggers.push(currentTrigger);
  }
  
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
  
  // Check if we're typing a command (starts with /)
  if (trimmed.startsWith('/')) {
    const partial = trimmed.match(/\/(\w*)$/)?.[1] || '';
    const filtered = COMMANDS.filter(c => 
      c.toLowerCase().startsWith(partial.toLowerCase())
    );
    if (filtered.length > 0) {
      return { type: 'command', suggestions: filtered };
    }
  }
  
  // Check if we're typing a function (starts with $)
  if (trimmed.startsWith('$')) {
    const partial = trimmed.match(/\$(\w*)$/)?.[1] || '';
    const filtered = FUNCTIONS.filter(f => 
      f.toLowerCase().startsWith(partial.toLowerCase())
    );
    if (filtered.length > 0) {
      return { type: 'function', suggestions: filtered };
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
  
  // Increase indent after @trigger, @commands, @if, @timer, then, else
  if (
    trimmed.startsWith('@trigger') ||
    trimmed.startsWith('@commands') ||
    trimmed.startsWith('@if') ||
    trimmed.startsWith('@timer') ||
    trimmed.startsWith('then') ||
    trimmed.startsWith('else')
  ) {
    return currentIndent + '    ';
  }
  
  return currentIndent;
}

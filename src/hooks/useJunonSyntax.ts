// Junon syntax definitions and validation
import { getCommandNames, getTriggerNames, getFunctionNames, type MDXCommand, type MDXTrigger, type MDXFunction, type MDXAction } from '@/lib/mdxLoader';

// These will be populated dynamically from MDX data
export let TRIGGER_EVENTS: readonly string[] = [] as const;
export let COMMANDS: readonly string[] = [] as const;
export let FUNCTIONS: readonly string[] = [] as const;
export let VARIABLES: readonly string[] = [] as const;

// MDX data cache
let mdxCommands: MDXCommand[] = [];
let mdxTriggers: MDXTrigger[] = [];
let mdxFunctions: MDXFunction[] = [];
let mdxActions: MDXAction[] = [];
let mdxVariables: Array<{ name: string }> = [];

// Initialize MDX data (call this from CodeEditor on mount)
export async function initializeMDXData() {
  try {
    const [commandNames, triggerNames, functionNames, { getCommands, getTriggers, getFunctions, getActions, getVariables }] = await Promise.all([
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
    mdxFunctions = await getFunctions();
    mdxActions = await getActions();
    mdxVariables = await getVariables();
    VARIABLES = mdxVariables.map(v => v.name) as any;
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
    VARIABLES = [] as const;
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
  type: 'trigger' | 'command' | 'condition' | 'operator' | 'function' | 'variable' | 'none';
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

/**
 * Extract all function calls from a string (including nested ones)
 * Returns array of { name, startIndex, endIndex }
 */
function extractFunctions(text: string): Array<{ name: string; startIndex: number; endIndex: number; fullMatch: string }> {
  const functions: Array<{ name: string; startIndex: number; endIndex: number; fullMatch: string }> = [];
  const processed = new Set<number>(); // Track processed function start positions to avoid duplicates
  
  // Recursive function to extract functions from a substring
  const extractFromRange = (start: number, end: number) => {
    for (let i = start; i < end && i < text.length; i++) {
      // Look for $ followed by word characters and optional whitespace and (
      if (text[i] === '$' && i + 1 < text.length && !processed.has(i)) {
        let j = i + 1;
        // Extract function name
        while (j < text.length && /[\w]/.test(text[j])) {
          j++;
        }
        
        if (j > i + 1) {
          const funcName = text.substring(i + 1, j);
          // Skip whitespace
          while (j < text.length && /\s/.test(text[j])) {
            j++;
          }
          
          // Check if followed by opening paren
          if (j < text.length && text[j] === '(') {
            processed.add(i); // Mark as processed
            const funcStartIndex = i;
            const openParenIndex = j;
            let parenCount = 0;
            let k = openParenIndex;
            
            // Find the matching closing paren
            while (k < text.length && k < end) {
              if (text[k] === '(') parenCount++;
              if (text[k] === ')') {
                if (parenCount === 0) {
                  const funcEndIndex = k + 1;
                  const fullMatch = text.substring(funcStartIndex, funcEndIndex);
                  
                  // Recursively extract functions from inside this function's arguments
                  extractFromRange(openParenIndex + 1, k);
                  
                  // Add this function to the list
                  functions.push({
                    name: funcName,
                    startIndex: funcStartIndex,
                    endIndex: funcEndIndex,
                    fullMatch
                  });
                  
                  break;
                }
                parenCount--;
              }
              k++;
            }
          }
        }
      }
    }
  };
  
  extractFromRange(0, text.length);
  
  return functions;
}

/**
 * Check if a function name is valid
 */
function isValidFunction(funcName: string): boolean {
  if (FUNCTIONS.length === 0) return true; // If functions not loaded, allow all
  return FUNCTIONS.some(f => {
    // Remove $ prefix from both for comparison
    const fName = f.startsWith('$') ? f.substring(1) : f;
    const compareName = funcName.startsWith('$') ? funcName.substring(1) : funcName;
    return fName === compareName;
  });
}

/**
 * Extract simple variables (not function calls) from text
 */
function extractSimpleVariables(text: string): Array<{ name: string; index: number }> {
  const variables: Array<{ name: string; index: number }> = [];
  const varPattern = /\$(\w+)/g;
  let match;
  
  // First, find all function calls to exclude them
  const functions = extractFunctions(text);
  const functionRanges = functions.map(f => ({ start: f.startIndex, end: f.endIndex }));
  
  // Reset regex lastIndex
  varPattern.lastIndex = 0;
  
  while ((match = varPattern.exec(text)) !== null) {
    const varName = match[1];
    const index = match.index;
    
    // Check if this is inside a function call
    // We need to check if the $var is part of a function call pattern $func(
    // If it's followed by a parenthesis, it's a function, not a variable
    const isFunctionCall = text[index + varName.length + 1] === '(';
    
    // Also check if it's inside another function's range
    const isInFunctionRange = functionRanges.some(range => index >= range.start && index < range.end);
    
    if (!isFunctionCall && !isInFunctionRange) {
      variables.push({ name: varName, index });
    }
  }
  
  return variables;
}

export function validateJunonCode(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');
  
  // Track variables declared with /variable set
  const declaredVariables = new Set<string>();
  // Track trigger variables from MDX data
  const triggerVariables = new Map<string, Set<string>>();
  
  // Extract variables from trigger MDX data
  mdxTriggers.forEach(trigger => {
    const vars = new Set<string>();
    trigger.variables?.forEach(v => vars.add(v.name));
    triggerVariables.set(trigger.name, vars);
  });
  
  // Recursive validation function
  const validateBlock = (
    startIndex: number,
    endIndex: number,
    baseIndent: number,
    inTrigger: boolean,
    context: 'trigger' | 'then' | 'else',
    triggerName?: string
  ): number => {
    let i = startIndex;
    let currentCondition: { lineIndex: number; indent: number; hasThen: boolean; hasElse: boolean; thenContent?: string } | null = null;
    let commandCount = 0; // Track commands without @commands
    let hasCommandsBlock = false;
    
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
        
        hasCommandsBlock = true;
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
            // Validate command
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
            
            // Extract and validate functions first (including nested ones)
            const functions = extractFunctions(cmdTrimmed);
            for (const func of functions) {
              if (!isValidFunction(func.name)) {
                // Calculate column offset within the full line
                const lineStart = line.indexOf(cmdTrimmed);
                errors.push({
                  line: i,
                  column: lineStart + func.startIndex,
                  length: func.name.length + 1,
                  message: `Unknown function: $${func.name}. Check available functions.`
                });
              }
            }
            
            // Extract and validate simple variables (not function calls)
            const simpleVars = extractSimpleVariables(cmdTrimmed);
            for (const varInfo of simpleVars) {
              const varName = varInfo.name;
              
              // Check if variable is declared or is a trigger variable
              const isDeclared = declaredVariables.has(varName);
              const isTriggerVar = triggerName && triggerVariables.get(triggerName)?.has(varName);
              
              if (!isDeclared && !isTriggerVar) {
                // Calculate column offset within the full line
                const lineStart = line.indexOf(cmdTrimmed);
                errors.push({
                  line: i,
                  column: lineStart + varInfo.index,
                  length: varName.length + 1,
                  message: `Unknown variable: $${varName}. Declare it with /variable set or check trigger variables.`
                });
              }
            }
            
            // Check for /variable set to track declared variables
            const varSetMatch = cmdTrimmed.match(/\/variable\s+set\s+(\w+)/);
            if (varSetMatch) {
              declaredVariables.add(varSetMatch[1]);
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
        const thenMatch = trimmed.match(/then\s+(.+)/);
        if (thenMatch) {
          const thenContent = thenMatch[1].trim();
          currentCondition.thenContent = thenContent;
          
          // Validate that then has @commands, @if, or @timer
          if (!thenContent.startsWith('@commands') && !thenContent.startsWith('@if') && !thenContent.startsWith('@timer') && !thenContent.startsWith('/')) {
            errors.push({
              line: i,
              column: trimmed.indexOf('then') + 4,
              length: thenContent.length,
              message: 'then clause must specify @commands, @if, or @timer'
            });
          }
        } else {
          // then on its own line - check next line
          if (i + 1 < endIndex) {
            const nextLine = lines[i + 1];
            const nextTrimmed = nextLine.trim();
            if (!nextTrimmed.startsWith('@commands') && !nextTrimmed.startsWith('@if') && !nextTrimmed.startsWith('@timer')) {
              errors.push({
                line: i,
                column: 0,
                length: 4,
                message: 'then clause must be followed by @commands, @if, or @timer'
              });
            }
          }
        }
        
        // Validate then block recursively
        const thenEnd = validateBlock(i + 1, endIndex, indent, inTrigger, 'then', triggerName);
        i = thenEnd;
        continue;
      }
      
      // else validation
      if (trimmed.startsWith('else') && !trimmed.startsWith('elseif') && currentCondition && indent > currentCondition.indent) {
        currentCondition.hasElse = true;
        const elseMatch = trimmed.match(/else\s+(.+)/);
        if (elseMatch) {
          const elseContent = elseMatch[1].trim();
          
          // Validate that else has @commands, @if, or @timer
          if (!elseContent.startsWith('@commands') && !elseContent.startsWith('@if') && !elseContent.startsWith('@timer') && !elseContent.startsWith('/')) {
            errors.push({
              line: i,
              column: trimmed.indexOf('else') + 4,
              length: elseContent.length,
              message: 'else clause must specify @commands, @if, or @timer'
            });
          }
        } else {
          // else on its own line - check next line
          if (i + 1 < endIndex) {
            const nextLine = lines[i + 1];
            const nextTrimmed = nextLine.trim();
            if (!nextTrimmed.startsWith('@commands') && !nextTrimmed.startsWith('@if') && !nextTrimmed.startsWith('@timer')) {
              errors.push({
                line: i,
                column: 0,
                length: 4,
                message: 'else clause must be followed by @commands, @if, or @timer'
              });
            }
          }
        }
        
        // Validate else block recursively
        const elseEnd = validateBlock(i + 1, endIndex, indent, inTrigger, 'else', triggerName);
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
      
      // Command validation (outside @commands block)
      if (trimmed.startsWith('/') && trimmed.length > 1) {
        // Check if command is outside @commands block
        if (context === 'trigger' && !hasCommandsBlock) {
          commandCount++;
          if (commandCount > 1) {
            errors.push({
              line: i,
              column: 0,
              length: trimmed.length,
              message: 'Multiple commands found without @commands block. Wrap commands in @commands block.'
            });
          }
        }
        
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
        
        // Extract and validate functions first (including nested ones)
        const functions = extractFunctions(trimmed);
        for (const func of functions) {
          if (!isValidFunction(func.name)) {
            errors.push({
              line: i,
              column: func.startIndex,
              length: func.name.length + 1,
              message: `Unknown function: $${func.name}. Check available functions.`
            });
          }
        }
        
        // Extract and validate simple variables (not function calls)
        const simpleVars = extractSimpleVariables(trimmed);
        for (const varInfo of simpleVars) {
          const varName = varInfo.name;
          
          // Check if variable is declared or is a trigger variable
          const isDeclared = declaredVariables.has(varName);
          const isTriggerVar = triggerName && triggerVariables.get(triggerName)?.has(varName);
          
          if (!isDeclared && !isTriggerVar) {
            errors.push({
              line: i,
              column: varInfo.index,
              length: varName.length + 1,
              message: `Unknown variable: $${varName}. Declare it with /variable set or check trigger variables.`
            });
          }
        }
        
        // Check for /variable set to track declared variables
        const varSetMatch = trimmed.match(/\/variable\s+set\s+(\w+)/);
        if (varSetMatch) {
          declaredVariables.add(varSetMatch[1]);
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
  let currentTriggerName: string | undefined;
  
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
        currentTriggerName = eventName;
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
      validateBlock(lineIndex + 1, lines.length, triggerIndent, true, 'trigger', currentTriggerName);
    } else if (!inTrigger && (trimmed.startsWith('@commands') || trimmed.startsWith('@if') || trimmed.startsWith('@timer') || trimmed.startsWith('/'))) {
      // Action without trigger
      errors.push({
        line: lineIndex,
        column: 0,
        length: trimmed.length,
        message: 'Actions must be inside a @trigger block'
      });
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
  
  // Recursive function to parse actions within a block
  const parseActions = (
    startIndex: number,
    endIndex: number,
    baseIndent: number,
    parentActions: Action[]
  ): number => {
    let i = startIndex;
    
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
      
      // @if condition - create structure but wait for then/else
      if (trimmed.startsWith('@if') && indent > baseIndent) {
        const conditionMatch = trimmed.match(/@if\s+(.+)/);
        if (conditionMatch) {
          const condition = conditionMatch[1].trim();
          const ifIndent = indent;
          i++;
          
          // Parse then and else blocks
          const thenActions: Action[] = [];
          const elseActions: Action[] = [];
          let hasThen = false;
          let hasElse = false;
          
          // Look for then clause
          while (i < endIndex && i < lines.length) {
            const nextLine = lines[i];
            const nextTrimmed = nextLine.trim();
            if (nextTrimmed.length === 0) {
              i++;
              continue;
            }
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            
            // If we've gone back to ifIndent or less, we're done with this if
            if (nextIndent <= ifIndent && !nextTrimmed.startsWith('then') && !nextTrimmed.startsWith('else')) {
              break;
            }
            
            // Process then clause
            if (nextTrimmed.startsWith('then') && nextIndent > ifIndent) {
              hasThen = true;
              const thenIndent = nextIndent;
              const thenMatch = nextTrimmed.match(/then\s+(.+)/);
              
              if (thenMatch) {
                const thenContent = thenMatch[1].trim();
                
                // then @commands
                if (thenContent === '@commands' || thenContent.startsWith('@commands')) {
                  i++;
                  const commands: string[] = [];
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
                      commands.push(cmdTrimmed);
                    } else {
                      break;
                    }
                    i++;
                  }
                  if (commands.length > 0) {
                    thenActions.push({ type: "command", values: commands });
                  }
                }
                // then @if (nested) - @if is on the same line as then
                else if (thenContent.startsWith('@if')) {
                  const nestedIfMatch = thenContent.match(/@if\s+(.+)/);
                  if (nestedIfMatch) {
                    // Create a nested if structure manually since @if is on same line
                    const nestedCondition = nestedIfMatch[1].trim();
                    i++;
                    
                    // Parse then/else for nested if
                    const nestedThenActions: Action[] = [];
                    const nestedElseActions: Action[] = [];
                    const nestedIfIndent = thenIndent;
                    
                    // Look for then/else of nested if
                    while (i < endIndex && i < lines.length) {
                      const nestedLine = lines[i];
                      const nestedTrimmed = nestedLine.trim();
                      if (nestedTrimmed.length === 0) {
                        i++;
                        continue;
                      }
                      const nestedLineIndent = nestedLine.length - nestedLine.trimStart().length;
                      
                      if (nestedLineIndent <= nestedIfIndent) break;
                      
                      // Process nested then
                      if (nestedTrimmed.startsWith('then') && nestedLineIndent > nestedIfIndent) {
                        const nestedThenIndent = nestedLineIndent;
                        const nestedThenMatch = nestedTrimmed.match(/then\s+(.+)/);
                        
                        if (nestedThenMatch) {
                          const nestedThenContent = nestedThenMatch[1].trim();
                          if (nestedThenContent === '@commands' || nestedThenContent.startsWith('@commands')) {
                            i++;
                            const commands: string[] = [];
                            while (i < endIndex && i < lines.length) {
                              const cmdLine = lines[i];
                              const cmdTrimmed = cmdLine.trim();
                              if (cmdTrimmed.length === 0) {
                                i++;
                                continue;
                              }
                              const cmdIndent = cmdLine.length - cmdLine.trimStart().length;
                              if (cmdIndent <= nestedThenIndent) break;
                              if (cmdTrimmed.startsWith('/')) {
                                commands.push(cmdTrimmed);
                              } else {
                                break;
                              }
                              i++;
                            }
                            if (commands.length > 0) {
                              nestedThenActions.push({ type: "command", values: commands });
                            }
                          } else if (nestedThenContent.startsWith('/')) {
                            nestedThenActions.push({ type: "command", values: [nestedThenContent] });
                            i++;
                          }
                        } else {
                          i++;
                          const nestedThenEnd = parseActions(i, endIndex, nestedThenIndent, nestedThenActions);
                          i = nestedThenEnd;
                        }
                        continue;
                      }
                      
                      // Process nested else
                      if (nestedTrimmed.startsWith('else') && !nestedTrimmed.startsWith('elseif') && nestedLineIndent > nestedIfIndent) {
                        const nestedElseIndent = nestedLineIndent;
                        const nestedElseMatch = nestedTrimmed.match(/else\s+(.+)/);
                        
                        if (nestedElseMatch) {
                          const nestedElseContent = nestedElseMatch[1].trim();
                          if (nestedElseContent === '@commands' || nestedElseContent.startsWith('@commands')) {
                            i++;
                            const commands: string[] = [];
                            while (i < endIndex && i < lines.length) {
                              const cmdLine = lines[i];
                              const cmdTrimmed = cmdLine.trim();
                              if (cmdTrimmed.length === 0) {
                                i++;
                                continue;
                              }
                              const cmdIndent = cmdLine.length - cmdLine.trimStart().length;
                              if (cmdIndent <= nestedElseIndent) break;
                              if (cmdTrimmed.startsWith('/')) {
                                commands.push(cmdTrimmed);
                              } else {
                                break;
                              }
                              i++;
                            }
                            if (commands.length > 0) {
                              nestedElseActions.push({ type: "command", values: commands });
                            }
                          } else if (nestedElseContent.startsWith('/')) {
                            nestedElseActions.push({ type: "command", values: [nestedElseContent] });
                            i++;
                          }
                        } else {
                          i++;
                          const nestedElseEnd = parseActions(i, endIndex, nestedElseIndent, nestedElseActions);
                          i = nestedElseEnd;
                        }
                        continue;
                      }
                      
                      if (nestedLineIndent <= nestedIfIndent) break;
                      i++;
                    }
                    
                    // Create nested ifthenelse
                    const nestedIfAction: Action = {
                      type: "ifthenelse",
                      condition: nestedCondition,
                      then: nestedThenActions.length > 0 ? nestedThenActions : undefined,
                      else: nestedElseActions.length > 0 ? nestedElseActions : undefined
                    };
                    thenActions.push(nestedIfAction);
                  }
                }
                // then @timer
                else if (thenContent.startsWith('@timer')) {
                  const timerMatch = thenContent.match(/@timer\s+(\w+)\s+(\d+)\s+(\d+)/);
                  if (timerMatch) {
                    thenActions.push({
                      type: "timer",
                      name: timerMatch[1],
                      duration: parseInt(timerMatch[2], 10),
                      tick: parseInt(timerMatch[3], 10)
                    });
                  }
                  i++;
                }
                // then /command (inline)
                else if (thenContent.startsWith('/')) {
                  thenActions.push({ type: "command", values: [thenContent] });
                  i++;
                }
                // then without content - parse block
                else {
                  i++;
                  const thenEnd = parseActions(i, endIndex, thenIndent, thenActions);
                  i = thenEnd;
                }
              } else {
                // then on its own line - parse block
                i++;
                const thenEnd = parseActions(i, endIndex, nextIndent, thenActions);
                i = thenEnd;
              }
              continue;
            }
            
            // Process else clause
            if (nextTrimmed.startsWith('else') && !nextTrimmed.startsWith('elseif') && nextIndent > ifIndent) {
              hasElse = true;
              const elseIndent = nextIndent;
              const elseMatch = nextTrimmed.match(/else\s+(.+)/);
              
              if (elseMatch) {
                const elseContent = elseMatch[1].trim();
                
                // else @commands
                if (elseContent === '@commands' || elseContent.startsWith('@commands')) {
                  i++;
                  const commands: string[] = [];
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
                      commands.push(cmdTrimmed);
                    } else {
                      break;
                    }
                    i++;
                  }
                  if (commands.length > 0) {
                    elseActions.push({ type: "command", values: commands });
                  }
                }
                // else @if (nested) - @if is on the same line as else
                else if (elseContent.startsWith('@if')) {
                  const nestedIfMatch = elseContent.match(/@if\s+(.+)/);
                  if (nestedIfMatch) {
                    // Create a nested if structure manually since @if is on same line
                    const nestedCondition = nestedIfMatch[1].trim();
                    i++;
                    
                    // Parse then/else for nested if
                    const nestedThenActions: Action[] = [];
                    const nestedElseActions: Action[] = [];
                    const nestedIfIndent = elseIndent;
                    
                    // Look for then/else of nested if
                    while (i < endIndex && i < lines.length) {
                      const nestedLine = lines[i];
                      const nestedTrimmed = nestedLine.trim();
                      if (nestedTrimmed.length === 0) {
                        i++;
                        continue;
                      }
                      const nestedLineIndent = nestedLine.length - nestedLine.trimStart().length;
                      
                      if (nestedLineIndent <= nestedIfIndent) break;
                      
                      // Process nested then
                      if (nestedTrimmed.startsWith('then') && nestedLineIndent > nestedIfIndent) {
                        const nestedThenIndent = nestedLineIndent;
                        const nestedThenMatch = nestedTrimmed.match(/then\s+(.+)/);
                        
                        if (nestedThenMatch) {
                          const nestedThenContent = nestedThenMatch[1].trim();
                          if (nestedThenContent === '@commands' || nestedThenContent.startsWith('@commands')) {
                            i++;
                            const commands: string[] = [];
                            while (i < endIndex && i < lines.length) {
                              const cmdLine = lines[i];
                              const cmdTrimmed = cmdLine.trim();
                              if (cmdTrimmed.length === 0) {
                                i++;
                                continue;
                              }
                              const cmdIndent = cmdLine.length - cmdLine.trimStart().length;
                              if (cmdIndent <= nestedThenIndent) break;
                              if (cmdTrimmed.startsWith('/')) {
                                commands.push(cmdTrimmed);
                              } else {
                                break;
                              }
                              i++;
                            }
                            if (commands.length > 0) {
                              nestedThenActions.push({ type: "command", values: commands });
                            }
                          } else if (nestedThenContent.startsWith('/')) {
                            nestedThenActions.push({ type: "command", values: [nestedThenContent] });
                            i++;
                          }
                        } else {
                          i++;
                          const nestedThenEnd = parseActions(i, endIndex, nestedThenIndent, nestedThenActions);
                          i = nestedThenEnd;
                        }
                        continue;
                      }
                      
                      // Process nested else
                      if (nestedTrimmed.startsWith('else') && !nestedTrimmed.startsWith('elseif') && nestedLineIndent > nestedIfIndent) {
                        const nestedElseIndent = nestedLineIndent;
                        const nestedElseMatch = nestedTrimmed.match(/else\s+(.+)/);
                        
                        if (nestedElseMatch) {
                          const nestedElseContent = nestedElseMatch[1].trim();
                          if (nestedElseContent === '@commands' || nestedElseContent.startsWith('@commands')) {
                            i++;
                            const commands: string[] = [];
                            while (i < endIndex && i < lines.length) {
                              const cmdLine = lines[i];
                              const cmdTrimmed = cmdLine.trim();
                              if (cmdTrimmed.length === 0) {
                                i++;
                                continue;
                              }
                              const cmdIndent = cmdLine.length - cmdLine.trimStart().length;
                              if (cmdIndent <= nestedElseIndent) break;
                              if (cmdTrimmed.startsWith('/')) {
                                commands.push(cmdTrimmed);
                              } else {
                                break;
                              }
                              i++;
                            }
                            if (commands.length > 0) {
                              nestedElseActions.push({ type: "command", values: commands });
                            }
                          } else if (nestedElseContent.startsWith('/')) {
                            nestedElseActions.push({ type: "command", values: [nestedElseContent] });
                            i++;
                          }
                        } else {
                          i++;
                          const nestedElseEnd = parseActions(i, endIndex, nestedElseIndent, nestedElseActions);
                          i = nestedElseEnd;
                        }
                        continue;
                      }
                      
                      if (nestedLineIndent <= nestedIfIndent) break;
                      i++;
                    }
                    
                    // Create nested ifthenelse
                    const nestedIfAction: Action = {
                      type: "ifthenelse",
                      condition: nestedCondition,
                      then: nestedThenActions.length > 0 ? nestedThenActions : undefined,
                      else: nestedElseActions.length > 0 ? nestedElseActions : undefined
                    };
                    elseActions.push(nestedIfAction);
                  }
                }
                // else @timer
                else if (elseContent.startsWith('@timer')) {
                  const timerMatch = elseContent.match(/@timer\s+(\w+)\s+(\d+)\s+(\d+)/);
                  if (timerMatch) {
                    elseActions.push({
                      type: "timer",
                      name: timerMatch[1],
                      duration: parseInt(timerMatch[2], 10),
                      tick: parseInt(timerMatch[3], 10)
                    });
                  }
                  i++;
                }
                // else /command (inline)
                else if (elseContent.startsWith('/')) {
                  elseActions.push({ type: "command", values: [elseContent] });
                  i++;
                }
                // else without content - parse block
                else {
                  i++;
                  const elseEnd = parseActions(i, endIndex, elseIndent, elseActions);
                  i = elseEnd;
                }
              } else {
                // else on its own line - parse block
                i++;
                const elseEnd = parseActions(i, endIndex, nextIndent, elseActions);
                i = elseEnd;
              }
              continue;
            }
            
            // If we're here and haven't processed then/else, break
            if (nextIndent <= ifIndent) {
              break;
            }
            
            i++;
          }
          
          // Create ifthenelse action
          const ifAction: Action = {
            type: "ifthenelse",
            condition: condition,
            then: thenActions.length > 0 ? thenActions : undefined,
            else: elseActions.length > 0 ? elseActions : undefined
          };
          parentActions.push(ifAction);
        }
        continue;
      }
      
      // @commands block
      if (trimmed.startsWith('@commands') && indent > baseIndent) {
        i++;
        const commands: string[] = [];
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
            commands.push(cmdTrimmed);
          } else {
            break;
          }
          i++;
        }
        if (commands.length > 0) {
          parentActions.push({ type: "command", values: commands });
        }
        continue;
      }
      
      // @timer standalone
      if (trimmed.startsWith('@timer') && indent > baseIndent) {
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
      
      // Command line (should not be here if properly formatted)
      if (trimmed.startsWith('/') && trimmed.length > 1 && indent > baseIndent) {
        // This is an error case - command without @commands
        parentActions.push({ type: "command", values: [trimmed] });
        i++;
        continue;
      }
      
      i++;
    }
    
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
        i = endIndex - 1;
      }
    } else if (currentTrigger === null && trimmed.length > 0) {
      // Action without trigger - this is an error but we'll still parse it
      const actions: Action[] = [];
      const endIndex = parseActions(i, lines.length, indent, actions);
      if (actions.length > 0) {
        // Create a dummy trigger for orphaned actions
        triggers.push({ event: 'Unknown', actions });
      }
      i = endIndex - 1;
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
  
  // Check if we're typing a function or variable (starts with $)
  if (trimmed.startsWith('$')) {
    const partial = trimmed.match(/\$(\w*)$/)?.[1] || '';
    
    // Check for functions first (they include the $ in the name)
    const filteredFunctions = FUNCTIONS.filter(f => 
      f.toLowerCase().startsWith(`$${partial.toLowerCase()}`)
    );
    if (filteredFunctions.length > 0) {
      return { type: 'function', suggestions: filteredFunctions };
    }
    
    // Then check for variables (they don't include the $ in the name)
    const filteredVariables = VARIABLES.filter(v => 
      v.toLowerCase().startsWith(partial.toLowerCase())
    );
    if (filteredVariables.length > 0) {
      return { type: 'variable', suggestions: filteredVariables.map(v => `$${v}`) };
    }
    
    // If no matches, return functions as fallback
    if (FUNCTIONS.length > 0) {
      return { type: 'function', suggestions: FUNCTIONS.slice(0, 10) };
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

// Get complete command data from MDX cache
export function getCommandData(commandName: string): MDXCommand | null {
  // Remove leading / if present
  const name = commandName.startsWith('/') ? commandName.slice(1) : commandName;
  return mdxCommands.find(cmd => cmd.name === name || cmd.name === `/${name}`) || null;
}

// Get complete trigger data from MDX cache
export function getTriggerData(triggerName: string): MDXTrigger | null {
  return mdxTriggers.find(trg => trg.name === triggerName) || null;
}

// Get complete function data from MDX cache
export function getFunctionData(functionName: string): MDXFunction | null {
  // Remove leading $ if present
  const name = functionName.startsWith('$') ? functionName.slice(1) : functionName;
  return mdxFunctions.find(func => func.name === functionName || func.name === name || func.name === `$${name}`) || null;
}

// Get complete action data from MDX cache
export function getActionData(actionName: string): MDXAction | null {
  // Actions might be referenced by name without @ prefix
  const name = actionName.startsWith('@') ? actionName.slice(1) : actionName;
  return mdxActions.find(action => action.name === actionName || action.name === name || action.name === `@${name}`) || null;
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

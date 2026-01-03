// AI Context Builder - Builds comprehensive documentation context for Gemini

import type { MDXCommand, MDXTrigger, MDXFunction, MDXAction } from './mdxLoader';
import { getCommands, getTriggers, getFunctions, getActions } from './mdxLoader';

/**
 * Build comprehensive documentation context for AI code generation
 * Includes all commands, triggers, functions, actions with their full documentation
 */
export async function buildDocumentationContext(): Promise<string> {
  const [commands, triggers, functions, actions] = await Promise.all([
    getCommands(),
    getTriggers(),
    getFunctions(),
    getActions(),
  ]);

  let context = `# Junon Code Language Documentation

## Syntax Rules

1. All code must be inside a @trigger block
2. Use @commands to group multiple commands
3. Use @if for conditionals with then/else clauses
4. Use @timer Name duration tick for timers
5. Variables start with $ and must be declared with /variable set or come from trigger variables
6. Functions start with $ and can be nested: $floor($subtract($log($add($getScore($player),7),1.2),10))
7. Commands start with / and must be on separate lines within @commands blocks
8. Indentation is important - use 4 spaces for nested blocks

## Commands

`;

  // Add all commands
  commands.forEach((cmd: MDXCommand) => {
    context += `### ${cmd.name}\n`;
    context += `Description: ${cmd.description}\n`;
    if (cmd.syntax && cmd.syntax.length > 0) {
      context += `Syntax:\n`;
      cmd.syntax.forEach(syn => {
        context += `  - ${syn}\n`;
      });
    }
    if (cmd.args && cmd.args.length > 0) {
      context += `Arguments:\n`;
      cmd.args.forEach(arg => {
        context += `  - ${arg.name} (${arg.type}${arg.required ? ', required' : ', optional'}): ${arg.description}\n`;
      });
    }
    if (cmd.examples && cmd.examples.length > 0) {
      context += `Examples:\n`;
      cmd.examples.forEach(ex => {
        context += `  ${ex.code}\n`;
        if (ex.description) {
          context += `  # ${ex.description}\n`;
        }
      });
    }
    context += `\n`;
  });

  context += `\n## Triggers\n\n`;

  // Add all triggers
  triggers.forEach((trigger: MDXTrigger) => {
    context += `### ${trigger.name}\n`;
    context += `Description: ${trigger.description}\n`;
    if (trigger.variables && trigger.variables.length > 0) {
      context += `Available Variables:\n`;
      trigger.variables.forEach(v => {
        context += `  - $${v.name} (${v.type}): ${v.description}\n`;
      });
    }
    if (trigger.examples && trigger.examples.length > 0) {
      context += `Examples:\n`;
      trigger.examples.forEach(ex => {
        context += `  ${ex.code}\n`;
        if (ex.description) {
          context += `  # ${ex.description}\n`;
        }
      });
    }
    context += `\n`;
  });

  context += `\n## Functions\n\n`;

  // Add all functions
  functions.forEach((func: MDXFunction) => {
    context += `### ${func.name}\n`;
    context += `Description: ${func.description}\n`;
    if (func.syntax) {
      context += `Syntax: ${func.syntax}\n`;
    }
    if (func.parameters && func.parameters.length > 0) {
      context += `Arguments:\n`;
      func.parameters.forEach(arg => {
        context += `  - ${arg.name} (${arg.type}${arg.required ? ', required' : ', optional'}): ${arg.description}\n`;
      });
    }
    if (func.examples && func.examples.length > 0) {
      context += `Examples:\n`;
      func.examples.forEach(ex => {
        context += `  ${ex.code}\n`;
        if (ex.description) {
          context += `  # ${ex.description}\n`;
        }
      });
    }
    context += `\n`;
  });

  context += `\n## Actions\n\n`;

  // Add all actions
  actions.forEach((action: MDXAction) => {
    context += `### ${action.name}\n`;
    context += `Description: ${action.description}\n`;
    if (action.syntax && action.syntax.length > 0) {
      context += `Syntax:\n`;
      action.syntax.forEach(syn => {
        context += `  - ${syn}\n`;
      });
    }
    if (action.examples && action.examples.length > 0) {
      context += `Examples:\n`;
      action.examples.forEach(ex => {
        context += `  ${ex.code}\n`;
        if (ex.description) {
          context += `  # ${ex.description}\n`;
        }
      });
    }
    context += `\n`;
  });

  context += `\n## Important Notes

- Always wrap code in @trigger blocks
- Use proper indentation (4 spaces)
- Functions can be nested: $floor($subtract($log($add($getScore($player),7),1.2),10))
- Variables must be declared or come from trigger context
- Commands in @commands blocks must be on separate lines
- @if statements require then and/or else clauses
- @timer format: @timer Name duration tick

`;

  return context;
}


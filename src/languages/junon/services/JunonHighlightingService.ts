import { HighlightingService } from '../../../editor/services/highlighting/HighlightingService';
import type { HighlightedLine, HighlightedToken, Token } from '../../../editor/services/highlighting/IHighlightingService';
import type { Position } from '../../../editor/core/types';
import { mapParenthesesToFunctions, ENABLE_PARENTHESIS_HIGHLIGHTING } from '@/hooks/useJunonSyntax';
import type { ValidationError } from '@/hooks/useJunonSyntax';

export class JunonHighlightingService extends HighlightingService {
  override id = 'junon-highlighting';
  override name = 'Junon Highlighting Service';
  override version = '1.0.0';

  highlightLine(line: string, lineIndex: number, errors: ValidationError[]): React.ReactNode {
    const lineErrors = errors.filter(e => e.line === lineIndex);
    
    // Get function and parenthesis mapping (only if enabled)
    const parenMapping = ENABLE_PARENTHESIS_HIGHLIGHTING ? mapParenthesesToFunctions(line) : new Map();
    
    // Check if this line contains /variable set
    const isVariableSet = /\/variable\s+set/i.test(line);
    
    // Check for @ keywords
    const atKeywords = ['@trigger', '@commands', '@if', '@timer', '@event'];
    const controlWords = ['then', 'elseif'];
    
    // Process the line character by character for proper highlighting
    const parts: Array<{ text: string; type: string; hasError: boolean; charIndex: number; parenInfo?: { funcId: number; color: string; isOpen: boolean } }> = [];
    
    // First, identify all keywords and commands in the line
    const keywordRanges: Array<{ start: number; end: number; type: string }> = [];
    
    // Find @keywords
    for (const kw of atKeywords) {
      let searchStart = 0;
      while (true) {
        const index = line.indexOf(kw, searchStart);
        if (index === -1) break;
        keywordRanges.push({ 
          start: index, 
          end: index + kw.length, 
          type: kw === '@event' ? 'deprecated' : 'keyword' 
        });
        searchStart = index + 1;
      }
    }
    
    // Find control words
    for (const cw of controlWords) {
      let searchStart = 0;
      while (true) {
        const index = line.indexOf(cw, searchStart);
        if (index === -1) break;
        // Check if it's a whole word (not part of another word)
        const before = index === 0 ? ' ' : line[index - 1];
        const after = index + cw.length >= line.length ? ' ' : line[index + cw.length];
        if (/\s/.test(before) && /\s/.test(after)) {
          keywordRanges.push({ start: index, end: index + cw.length, type: 'control' });
        }
        searchStart = index + 1;
      }
    }
    
    // Find commands (start with /)
    const commandPattern = /(\/\w+)/g;
    let match;
    while ((match = commandPattern.exec(line)) !== null) {
      keywordRanges.push({ start: match.index, end: match.index + match[1].length, type: 'command' });
    }
    
    // Find numbers
    const numberPattern = /\b\d+(\.\d+)?\b/g;
    while ((match = numberPattern.exec(line)) !== null) {
      keywordRanges.push({ start: match.index, end: match.index + match[0].length, type: 'number' });
    }
    
    // Find operators
    const operatorPattern = /(==|!=|<=|>=|<|>)/g;
    while ((match = operatorPattern.exec(line)) !== null) {
      keywordRanges.push({ start: match.index, end: match.index + match[1].length, type: 'operator' });
    }
    
    // Find conditions (for @if)
    const conditionPattern = /(\w+\.\w+)/g;
    while ((match = conditionPattern.exec(line)) !== null) {
      keywordRanges.push({ start: match.index, end: match.index + match[1].length, type: 'condition' });
    }
    
    // Process character by character
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const hasError = lineErrors.some(e => i >= e.column && i < e.column + e.length);
      const errorMessage = lineErrors.find(e => i >= e.column && i < e.column + e.length)?.message;
      
      // Check if this character is part of a function/parenthesis mapping
      const parenInfo = parenMapping.get(i);
      
      let type = 'normal';
      
      // If character is mapped (part of function or parenthesis), use that
      if (parenInfo) {
        if (char === '(' || char === ')') {
          type = 'parenthesis';
        } else if (char === '$' || /[\w]/.test(char)) {
          type = 'function';
        }
      } else {
        // Check if character is part of a keyword/command range
        const keywordRange = keywordRanges.find(range => i >= range.start && i < range.end);
        if (keywordRange) {
          type = keywordRange.type;
        } else {
          // Regular syntax highlighting for other characters
          if (isVariableSet && !/\s/.test(char)) {
            type = 'variable-declaration';
          } else if (char === '(' || char === ')') {
            type = 'parenthesis-error';
          }
        }
      }
      
      parts.push({ 
        text: char, 
        type, 
        hasError, 
        charIndex: i,
        parenInfo: parenInfo 
      });
    }
    
    // Group consecutive characters with same type
    const grouped: Array<{ text: string; type: string; hasError: boolean; className?: string; style?: React.CSSProperties }> = [];
    let currentGroup = { text: '', type: '', hasError: false, className: '', style: {} as React.CSSProperties };
    
    parts.forEach((part, index) => {
      if (part.type !== currentGroup.type || part.hasError !== currentGroup.hasError) {
        if (currentGroup.text) {
          grouped.push({ ...currentGroup });
        }
        currentGroup = { 
          text: part.text, 
          type: part.type, 
          hasError: part.hasError,
          className: '',
          style: {} as React.CSSProperties
        };
        
        // Apply styles based on type
        if (part.parenInfo) {
          currentGroup.className = part.parenInfo.color;
        } else {
          switch (part.type) {
            case 'keyword':
              currentGroup.className = 'text-blue-500 font-semibold';
              break;
            case 'command':
              currentGroup.className = 'text-purple-500';
              break;
            case 'function':
              currentGroup.className = 'text-yellow-500';
              break;
            case 'number':
              currentGroup.className = 'text-green-500';
              break;
            case 'operator':
              currentGroup.className = 'text-pink-500';
              break;
            case 'condition':
              currentGroup.className = 'text-cyan-500';
              break;
            case 'control':
              currentGroup.className = 'text-orange-500';
              break;
            case 'deprecated':
              currentGroup.className = 'text-red-500 line-through';
              break;
            case 'parenthesis-error':
              currentGroup.className = 'text-red-500';
              break;
            default:
              currentGroup.className = '';
          }
        }
        
        if (part.hasError) {
          currentGroup.className += ' underline decoration-red-500';
          currentGroup.style = { textDecoration: 'underline', textDecorationColor: '#ef4444' };
        }
      } else {
        currentGroup.text += part.text;
      }
    });
    
    if (currentGroup.text) {
      grouped.push({ ...currentGroup });
    }
    
    return (
      <span>
        {grouped.map((part, i) => (
          <span
            key={i}
            className={part.className}
            style={part.style}
            title={part.hasError ? 'Error' : undefined}
          >
            {part.text}
          </span>
        ))}
      </span>
    );
  }

  override highlight(code: string, language: string, theme?: any): HighlightedLine[] {
    // This is a simplified version - the actual highlighting is done in highlightLine
    // which is called from the UI component
    return code.split('\n').map((line, index) => ({
      line: index,
      tokens: [{ text: line, type: 'text' }],
    }));
  }

  override getTokenAt(code: string, position: Position, language: string): Token | null {
    const lines = code.split('\n');
    const line = lines[position.line];
    if (!line) return null;

    // Simple token detection
    const beforeCursor = line.substring(0, position.column);
    const afterCursor = line.substring(position.column);
    
    // Try to find a token at the cursor position
    const tokenMatch = beforeCursor.match(/(\$?\w+)$/);
    if (tokenMatch) {
      const start = position.column - tokenMatch[1].length;
      const end = position.column;
      return {
        type: 'identifier',
        value: tokenMatch[1],
        start,
        end,
      };
    }

    return null;
  }
}


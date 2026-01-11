import type { IService } from '../base/IService';
import type { Position, Range } from '../../core/types';

export type CompletionItemKind =
  | 'text'
  | 'method'
  | 'function'
  | 'constructor'
  | 'field'
  | 'variable'
  | 'class'
  | 'interface'
  | 'module'
  | 'property'
  | 'unit'
  | 'value'
  | 'enum'
  | 'keyword'
  | 'snippet'
  | 'color'
  | 'file'
  | 'reference'
  | 'folder'
  | 'enumMember'
  | 'constant'
  | 'struct'
  | 'event'
  | 'operator'
  | 'typeParameter';

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText: string;
  range?: Range;
  sortText?: string;
  filterText?: string;
  commitCharacters?: string[];
}

export interface CompletionContext {
  type: 'trigger' | 'command' | 'function' | 'variable' | 'keyword' | 'none';
  partial: string;
  line: number;
  column: number;
  lineText: string;
  beforeCursor: string;
  afterCursor: string;
}

export interface CompletionProvider {
  getCompletions(
    code: string,
    position: Position,
    language: string,
    context: CompletionContext
  ): Promise<CompletionItem[]>;
  resolveCompletion?(item: CompletionItem): Promise<CompletionItem>;
}

export interface IAutocompleteService extends IService {
  getCompletions(
    code: string,
    position: Position,
    language: string,
    context: CompletionContext
  ): Promise<CompletionItem[]>;

  resolveCompletion(item: CompletionItem): Promise<CompletionItem>;

  registerProvider(language: string, provider: CompletionProvider): void;
}


import type { ILanguagePlugin, LanguageMetadata } from './ILanguagePlugin';
import type { IHighlightingService } from '../../editor/services/highlighting/IHighlightingService';
import type { IValidationService } from '../../editor/services/validation/IValidationService';
import type { IAutocompleteService } from '../../editor/services/autocomplete/IAutocompleteService';

export abstract class LanguagePlugin implements ILanguagePlugin {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  abstract metadata: LanguageMetadata;

  abstract getHighlightingService(): IHighlightingService;
  abstract getValidationService(): IValidationService;
  abstract getAutocompleteService(): IAutocompleteService;

  getFormattingService?(): any {
    return undefined;
  }

  getFoldingService?(): any {
    return undefined;
  }

  async initialize?(): Promise<void> {
    // Override in subclasses if needed
  }
}


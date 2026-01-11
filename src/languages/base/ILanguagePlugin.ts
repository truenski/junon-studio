import type { IHighlightingService } from '../../editor/services/highlighting/IHighlightingService';
import type { IValidationService } from '../../editor/services/validation/IValidationService';
import type { IAutocompleteService } from '../../editor/services/autocomplete/IAutocompleteService';

export interface LanguageMetadata {
  id: string;
  name: string;
  extensions: string[];
  aliases?: string[];
}

export interface ILanguagePlugin {
  id: string;
  name: string;
  version: string;
  metadata: LanguageMetadata;
  
  // Services provided by this language
  getHighlightingService(): IHighlightingService;
  getValidationService(): IValidationService;
  getAutocompleteService(): IAutocompleteService;
  
  // Optional services
  getFormattingService?(): any;
  getFoldingService?(): any;
  
  // Initialize language-specific data
  initialize?(): Promise<void>;
}


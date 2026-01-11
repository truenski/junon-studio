import { LanguagePlugin } from '../base/LanguagePlugin';
import { JunonHighlightingService } from './services/JunonHighlightingService';
import { JunonValidationService } from './services/JunonValidationService';
import { JunonAutocompleteService } from './services/JunonAutocompleteService';
import type { IHighlightingService, IValidationService, IAutocompleteService } from '../../editor/services';
import { initializeMDXData } from '@/hooks/useJunonSyntax';

export class JunonLanguagePlugin extends LanguagePlugin {
  id = 'junon';
  name = 'Junon';
  version = '1.0.0';

  metadata = {
    id: 'junon',
    name: 'Junon',
    extensions: ['.junon'],
    aliases: ['junon'],
  };

  private highlightingService: IHighlightingService;
  private validationService: IValidationService;
  private autocompleteService: IAutocompleteService;

  constructor() {
    super();
    this.highlightingService = new JunonHighlightingService();
    this.validationService = new JunonValidationService();
    this.autocompleteService = new JunonAutocompleteService();
  }

  getHighlightingService(): IHighlightingService {
    return this.highlightingService;
  }

  getValidationService(): IValidationService {
    return this.validationService;
  }

  getAutocompleteService(): IAutocompleteService {
    return this.autocompleteService;
  }

  async initialize(): Promise<void> {
    await initializeMDXData();
  }
}


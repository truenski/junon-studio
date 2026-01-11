import { BaseService } from '../base/BaseService';
import type { IValidationService, Validator, ValidationResult, Diagnostic } from './IValidationService';
import { EditorEvents } from '../../core/EditorEvents';

export class ValidationService extends BaseService implements IValidationService {
  id = 'validation';
  name = 'Validation Service';
  version = '1.0.0';

  private validators: Map<string, Validator> = new Map();

  registerValidator(language: string, validator: Validator): void {
    this.validators.set(language, validator);
  }

  validate(code: string, language: string): ValidationResult {
    const validator = this.validators.get(language);
    if (!validator) {
      return { diagnostics: [], valid: true };
    }

    const result = validator.validate(code, language);
    
    const context = this.getContext();
    context.events.emit(EditorEvents.VALIDATION_COMPLETE, { diagnostics: result.diagnostics });
    
    return result;
  }

  getDiagnostics(code: string, language: string): Diagnostic[] {
    const validator = this.validators.get(language);
    if (!validator) {
      return [];
    }

    return validator.getDiagnostics(code, language);
  }
}


import { ValidationService } from '../../../editor/services/validation/ValidationService';
import type { ValidationResult, Diagnostic } from '../../../editor/services/validation/IValidationService';
import { validateJunonCode } from '@/hooks/useJunonSyntax';
import type { ValidationError } from '@/hooks/useJunonSyntax';
import type { Range } from '../../../editor/core/types';

export class JunonValidationService extends ValidationService {
  override id = 'junon-validation';
  override name = 'Junon Validation Service';
  override version = '1.0.0';

  override validate(code: string, language: string): ValidationResult {
    const errors = validateJunonCode(code);
    const diagnostics: Diagnostic[] = errors.map(error => ({
      range: {
        start: { line: error.line, column: error.column },
        end: { line: error.line, column: error.column + error.length },
      },
      severity: 'error',
      message: error.message,
      source: 'junon',
    }));

    return {
      diagnostics,
      valid: diagnostics.length === 0,
    };
  }

  override getDiagnostics(code: string, language: string): Diagnostic[] {
    const errors = validateJunonCode(code);
    return errors.map(error => ({
      range: {
        start: { line: error.line, column: error.column },
        end: { line: error.line, column: error.column + error.length },
      },
      severity: 'error',
      message: error.message,
      source: 'junon',
    }));
  }
}


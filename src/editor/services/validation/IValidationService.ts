import type { IService } from '../base/IService';
import type { Range } from '../../core/types';

export interface Diagnostic {
  range: Range;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source?: string;
  code?: string | number;
}

export interface ValidationResult {
  diagnostics: Diagnostic[];
  valid: boolean;
}

export interface Validator {
  validate(code: string, language: string): ValidationResult;
  getDiagnostics(code: string, language: string): Diagnostic[];
}

export interface IValidationService extends IService {
  validate(code: string, language: string): ValidationResult;
  getDiagnostics(code: string, language: string): Diagnostic[];
  registerValidator(language: string, validator: Validator): void;
}


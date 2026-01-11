import type { IService } from '../base/IService';

export interface VersioningStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  staged: string[];
}

export interface Commit {
  id: string;
  message: string;
  author: string;
  date: Date;
  changes: FileChange[];
}

export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  content?: string;
}

export interface Diff {
  file: string;
  changes: DiffChange[];
}

export interface DiffChange {
  line: number;
  type: 'added' | 'removed' | 'modified';
  content: string;
}

export interface Branch {
  name: string;
  current: boolean;
  lastCommit?: Commit;
}

export interface VersioningProvider {
  name: string;
  commit(message: string, changes: FileChange[]): Promise<Commit>;
  getHistory(limit?: number): Promise<Commit[]>;
  revert(commitId: string): Promise<void>;
  getStatus(): Promise<VersioningStatus>;
  diff(file: string, commit1?: string, commit2?: string): Promise<Diff>;
}

export interface IVersioningService extends IService {
  commit(message: string, changes: FileChange[]): Promise<Commit>;
  getHistory(limit?: number): Promise<Commit[]>;
  revert(commitId: string): Promise<void>;
  getStatus(): Promise<VersioningStatus>;
  diff(file: string, commit1?: string, commit2?: string): Promise<Diff>;
  createBranch(name: string): Promise<void>;
  switchBranch(name: string): Promise<void>;
  getBranches(): Promise<Branch[]>;
  registerProvider(provider: VersioningProvider): void;
}


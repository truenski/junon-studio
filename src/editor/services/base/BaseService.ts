import type { IService, ServiceContext } from './IService';

export abstract class BaseService implements IService {
  abstract id: string;
  abstract name: string;
  abstract version: string;

  protected context?: ServiceContext;
  protected activated = false;

  async activate(context: ServiceContext): Promise<void> {
    this.context = context;
    this.activated = true;
    await this.onActivate();
  }

  async deactivate(): Promise<void> {
    await this.onDeactivate();
    this.activated = false;
    this.context = undefined;
  }

  dispose(): void {
    this.onDispose();
  }

  protected async onActivate(): Promise<void> {
    // Override in subclasses
  }

  protected async onDeactivate(): Promise<void> {
    // Override in subclasses
  }

  protected onDispose(): void {
    // Override in subclasses
  }

  protected getContext(): ServiceContext {
    if (!this.context) {
      throw new Error(`Service ${this.id} is not activated`);
    }
    return this.context;
  }
}


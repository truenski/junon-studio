import type { IExtension, ExtensionContext } from './IExtension';

export class ExtensionRegistry {
  private extensions: Map<string, IExtension> = new Map();
  private activatedExtensions: Set<string> = new Set();

  register(extension: IExtension): void {
    if (this.extensions.has(extension.id)) {
      console.warn(`Extension ${extension.id} is already registered`);
      return;
    }
    this.extensions.set(extension.id, extension);
  }

  unregister(id: string): void {
    const extension = this.extensions.get(id);
    if (extension && this.activatedExtensions.has(id)) {
      extension.deactivate().catch(console.error);
      this.activatedExtensions.delete(id);
    }
    this.extensions.delete(id);
  }

  get(id: string): IExtension | undefined {
    return this.extensions.get(id);
  }

  getAll(): IExtension[] {
    return Array.from(this.extensions.values());
  }

  async activate(id: string, context: ExtensionContext): Promise<void> {
    const extension = this.extensions.get(id);
    if (!extension) {
      throw new Error(`Extension ${id} not found`);
    }

    if (this.activatedExtensions.has(id)) {
      return;
    }

    await extension.activate(context);
    this.activatedExtensions.add(id);
  }

  async deactivate(id: string): Promise<void> {
    const extension = this.extensions.get(id);
    if (!extension) {
      return;
    }

    if (!this.activatedExtensions.has(id)) {
      return;
    }

    await extension.deactivate();
    this.activatedExtensions.delete(id);
  }

  isActivated(id: string): boolean {
    return this.activatedExtensions.has(id);
  }

  async activateAll(context: ExtensionContext): Promise<void> {
    const promises = Array.from(this.extensions.values())
      .filter(ext => !this.activatedExtensions.has(ext.id))
      .map(ext => this.activate(ext.id, context).catch(console.error));
    await Promise.all(promises);
  }

  async deactivateAll(): Promise<void> {
    const promises = Array.from(this.activatedExtensions).map(id =>
      this.deactivate(id).catch(console.error)
    );
    await Promise.all(promises);
  }
}


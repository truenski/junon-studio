import type { IService } from './base/IService';

export class ServiceRegistry {
  private services: Map<string, IService> = new Map();

  register(service: IService): void {
    if (this.services.has(service.id)) {
      console.warn(`Service ${service.id} is already registered`);
      return;
    }
    this.services.set(service.id, service);
  }

  unregister(id: string): void {
    const service = this.services.get(id);
    if (service) {
      service.dispose();
      this.services.delete(id);
    }
  }

  get<T extends IService = IService>(id: string): T | undefined {
    return this.services.get(id) as T | undefined;
  }

  has(id: string): boolean {
    return this.services.has(id);
  }

  getAll(): IService[] {
    return Array.from(this.services.values());
  }

  async activateAll(context: any): Promise<void> {
    const promises = Array.from(this.services.values()).map(service =>
      service.activate(context).catch(error => {
        console.error(`Failed to activate service ${service.id}:`, error);
      })
    );
    await Promise.all(promises);
  }

  async deactivateAll(): Promise<void> {
    const promises = Array.from(this.services.values()).map(service =>
      service.deactivate().catch(error => {
        console.error(`Failed to deactivate service ${service.id}:`, error);
      })
    );
    await Promise.all(promises);
  }

  dispose(): void {
    this.services.forEach(service => service.dispose());
    this.services.clear();
  }
}


import type { Disposable } from './types';

type EventHandler<T = any> = (data: T) => void;

export class EventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on<T = any>(event: string, handler: EventHandler<T>): Disposable {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    const handlers = this.handlers.get(event)!;
    handlers.add(handler);

    return {
      dispose: () => {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(event);
        }
      },
    };
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  emit<T = any>(event: string, data?: T): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  once<T = any>(event: string, handler: EventHandler<T>): Disposable {
    const wrappedHandler = (data: T) => {
      handler(data);
      disposable.dispose();
    };
    
    const disposable = this.on(event, wrappedHandler);
    return disposable;
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}


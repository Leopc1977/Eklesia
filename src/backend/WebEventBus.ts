// backend/WebEventBus.ts
import { EventBus } from "./EventBus";

export class WebEventBus implements EventBus {
  private listeners: Record<string, ((payload: any) => void)[]> = {};

  on(event: string, listener: (payload: any) => void) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(listener);
  }

  off(event: string, listener: (payload: any) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, payload?: any) {
    (this.listeners[event] || []).forEach(l => l(payload));
  }
}

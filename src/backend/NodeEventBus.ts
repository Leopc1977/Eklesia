// backend/NodeEventBus.ts
import { EventEmitter } from "events";
import { EventBus } from "./EventBus";

export class NodeEventBus implements EventBus {
  private emitter = new EventEmitter();

  on(event: string, listener: (payload: any) => void) {
    this.emitter.on(event, listener);
  }

  off(event: string, listener: (payload: any) => void) {
    this.emitter.off(event, listener);
  }

  emit(event: string, payload?: any) {
    this.emitter.emit(event, payload);
  }
}

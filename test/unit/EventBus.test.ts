import { describe, it, expect, beforeEach, mock } from "bun:test";
import { NodeEventBus } from "../../src/backend/NodeEventBus";
import { WebEventBus } from "../../src/backend/WebEventBus";
import type { EventBus } from "../../src/backend/EventBus";

/**
 * Shared behavioural contract — run the same suite against both implementations.
 */
function sharedEventBusSuite(createBus: () => EventBus) {
  let bus: EventBus;

  beforeEach(() => {
    bus = createBus();
  });

  describe("on() / emit()", () => {
    it("calls a registered listener when the event is emitted", () => {
      const listener = mock(() => {});
      bus.on("test", listener);
      bus.emit("test");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("passes the payload to the listener", () => {
      const listener = mock((_payload: any) => {});
      bus.on("data", listener);
      bus.emit("data", { value: 42 });
      expect(listener).toHaveBeenCalledWith({ value: 42 });
    });

    it("calls all registered listeners for the same event", () => {
      const l1 = mock(() => {});
      const l2 = mock(() => {});
      bus.on("evt", l1);
      bus.on("evt", l2);
      bus.emit("evt", "payload");
      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledTimes(1);
    });

    it("does not call listeners registered for a different event", () => {
      const listener = mock(() => {});
      bus.on("other", listener);
      bus.emit("test");
      expect(listener).not.toHaveBeenCalled();
    });

    it("calls a listener multiple times when the event is emitted multiple times", () => {
      const listener = mock(() => {});
      bus.on("evt", listener);
      bus.emit("evt");
      bus.emit("evt");
      bus.emit("evt");
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it("works with undefined payload", () => {
      const listener = mock((_payload: any) => {});
      bus.on("evt", listener);
      bus.emit("evt");
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("off()", () => {
    it("stops calling the listener after it is removed", () => {
      const listener = mock(() => {});
      bus.on("evt", listener);
      bus.off("evt", listener);
      bus.emit("evt");
      expect(listener).not.toHaveBeenCalled();
    });

    it("only removes the specified listener, leaving others intact", () => {
      const l1 = mock(() => {});
      const l2 = mock(() => {});
      bus.on("evt", l1);
      bus.on("evt", l2);
      bus.off("evt", l1);
      bus.emit("evt");
      expect(l1).not.toHaveBeenCalled();
      expect(l2).toHaveBeenCalledTimes(1);
    });

    it("does not throw when removing a listener that was never registered", () => {
      const listener = mock(() => {});
      expect(() => bus.off("nonexistent", listener)).not.toThrow();
    });

    it("does not throw when removing from an event with no listeners", () => {
      const listener = mock(() => {});
      expect(() => bus.off("empty-event", listener)).not.toThrow();
    });
  });

  describe("event isolation", () => {
    it("different events do not interfere with each other", () => {
      const l1 = mock(() => {});
      const l2 = mock(() => {});
      bus.on("event-a", l1);
      bus.on("event-b", l2);

      bus.emit("event-a", "a-payload");
      expect(l1).toHaveBeenCalledWith("a-payload");
      expect(l2).not.toHaveBeenCalled();

      bus.emit("event-b", "b-payload");
      expect(l2).toHaveBeenCalledWith("b-payload");
    });
  });
}

describe("NodeEventBus", () => {
  sharedEventBusSuite(() => new NodeEventBus());
});

describe("WebEventBus", () => {
  sharedEventBusSuite(() => new WebEventBus());
});

import { describe, it, expect, beforeEach, mock } from "bun:test";
import { BackendAgnostic } from "../../src/backend/BackendAgnostic";
import { WebEventBus } from "../../src/backend/WebEventBus";
import { NodeEventBus } from "../../src/backend/NodeEventBus";
import type { TaskRequest } from "../../src/shared/types";

describe("BackendAgnostic", () => {
  let bus: WebEventBus;
  let backend: BackendAgnostic;

  beforeEach(() => {
    bus = new WebEventBus();
    backend = new BackendAgnostic(bus);
  });

  describe("executeTask()", () => {
    it("returns a TaskResult with output for the given prompt", async () => {
      const task: TaskRequest = { id: "t1", prompt: "Hello" };
      const result = await backend.executeTask(task);
      expect(result.output).toContain("Hello");
      expect(result.id).toBe("t1");
    });

    it("emits 'taskStarted' event when a task begins", async () => {
      const events: any[] = [];
      bus.on("taskStarted", (p) => events.push(p));

      await backend.executeTask({ id: "start-test", prompt: "start" });
      expect(events).toHaveLength(1);
      expect(events[0]?.id).toBe("start-test");
      expect(events[0]?.prompt).toBe("start");
    });

    it("emits 'taskCompleted' event when a task finishes", async () => {
      const events: any[] = [];
      bus.on("taskCompleted", (p) => events.push(p));

      await backend.executeTask({ id: "done-test", prompt: "done" });
      expect(events).toHaveLength(1);
      expect(events[0]?.id).toBe("done-test");
    });

    it("emits 'taskProgress' events during execution", async () => {
      const events: any[] = [];
      bus.on("taskProgress", (p) => events.push(p));

      await backend.executeTask({ id: "progress-test", prompt: "progress" });
      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.step === "preprocessing")).toBe(true);
      expect(events.some((e) => e.step === "running")).toBe(true);
    });

    it("uses Date.now() as id when task has no id", async () => {
      const events: any[] = [];
      bus.on("taskStarted", (p) => events.push(p));

      await backend.executeTask({ prompt: "no id" });
      expect(events[0]?.id).toBeDefined();
      expect(typeof events[0]?.id).toBe("string");
    });

    it("emits 'taskError' and rethrows when taskManager throws", async () => {
      const errorEvents: any[] = [];
      bus.on("taskError", (p) => errorEvents.push(p));

      // Inject a failing TaskManager by patching the private field
      const failingManager = {
        runTask: mock(async () => {
          throw new Error("Task exploded");
        }),
        listTasks: mock(() => []),
        cancelTask: mock(() => {}),
      };
      (backend as any).taskManager = failingManager;

      await expect(backend.executeTask({ id: "fail", prompt: "fail" })).rejects.toThrow(
        "Task exploded",
      );
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0]?.id).toBe("fail");
    });
  }, { timeout: 10000 });

  describe("listTasks()", () => {
    it("returns an empty list initially", () => {
      expect(backend.listTasks()).toEqual([]);
    });

    it("returns completed tasks", async () => {
      await backend.executeTask({ id: "listed", prompt: "list me" });
      const tasks = backend.listTasks();
      expect(tasks.find((t) => t.id === "listed")).toBeDefined();
    });
  }, { timeout: 5000 });

  describe("cancelTask()", () => {
    it("removes the task from the list", async () => {
      await backend.executeTask({ id: "to-cancel", prompt: "cancel me" });
      backend.cancelTask("to-cancel");
      expect(backend.listTasks().find((t) => t.id === "to-cancel")).toBeUndefined();
    });

    it("does not throw for an unknown task id", () => {
      expect(() => backend.cancelTask("ghost")).not.toThrow();
    });
  }, { timeout: 5000 });

  describe("works with NodeEventBus", () => {
    it("completes a task using the Node event bus", async () => {
      const nodeBus = new NodeEventBus();
      const nodeBackend = new BackendAgnostic(nodeBus);
      const result = await nodeBackend.executeTask({ id: "node-task", prompt: "node test" });
      expect(result.id).toBe("node-task");
    });
  }, { timeout: 5000 });
});

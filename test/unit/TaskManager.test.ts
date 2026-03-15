import { describe, it, expect, beforeEach, mock } from "bun:test";
import { TaskManager } from "../../src/backend/TaskManager";
import type { TaskRequest } from "../../src/shared/types";

describe("TaskManager", () => {
  let manager: TaskManager;

  beforeEach(() => {
    manager = new TaskManager();
  });

  describe("runTask()", () => {
    it("returns a TaskResult with the expected output string", async () => {
      const task: TaskRequest = { prompt: "Hello, world!" };
      const result = await manager.runTask(task);
      expect(result.output).toBe("Result for: Hello, world!");
    });

    it("returns a TaskResult with an id", async () => {
      const task: TaskRequest = { prompt: "test" };
      const result = await manager.runTask(task);
      expect(typeof result.id).toBe("string");
      expect(result.id.length).toBeGreaterThan(0);
    });

    it("uses the provided id when the task has one", async () => {
      const task: TaskRequest = { id: "my-task-42", prompt: "test" };
      const result = await manager.runTask(task);
      expect(result.id).toBe("my-task-42");
    });

    it("generates an id when the task has none", async () => {
      const task: TaskRequest = { prompt: "no id" };
      const result = await manager.runTask(task);
      expect(result.id).toBeDefined();
    });

    it("calls onProgress with 'preprocessing' and 'running' steps in order", async () => {
      const steps: string[] = [];
      const task: TaskRequest = { prompt: "test" };
      await manager.runTask(task, (progress) => steps.push(progress.step));
      expect(steps).toEqual(["preprocessing", "running"]);
    });

    it("does not throw when no onProgress callback is provided", async () => {
      const task: TaskRequest = { prompt: "test" };
      await expect(manager.runTask(task)).resolves.toBeDefined();
    });
  }, { timeout: 5000 });

  describe("listTasks()", () => {
    it("returns an empty array when no tasks have been run", () => {
      expect(manager.listTasks()).toEqual([]);
    });

    it("returns completed tasks after they are run", async () => {
      await manager.runTask({ id: "t1", prompt: "first" });
      const tasks = manager.listTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0]?.id).toBe("t1");
    });

    it("accumulates multiple completed tasks", async () => {
      await manager.runTask({ id: "t1", prompt: "first" });
      await manager.runTask({ id: "t2", prompt: "second" });
      const tasks = manager.listTasks();
      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t.id)).toContain("t1");
      expect(tasks.map((t) => t.id)).toContain("t2");
    });
  }, { timeout: 10000 });

  describe("cancelTask()", () => {
    it("removes a completed task from the list", async () => {
      await manager.runTask({ id: "to-delete", prompt: "delete me" });
      manager.cancelTask("to-delete");
      const tasks = manager.listTasks();
      expect(tasks.find((t) => t.id === "to-delete")).toBeUndefined();
    });

    it("does not throw when cancelling a non-existent task", () => {
      expect(() => manager.cancelTask("ghost-task")).not.toThrow();
    });

    it("only removes the targeted task, leaving others intact", async () => {
      await manager.runTask({ id: "keep", prompt: "keep me" });
      await manager.runTask({ id: "remove", prompt: "remove me" });
      manager.cancelTask("remove");
      const tasks = manager.listTasks();
      expect(tasks.find((t) => t.id === "keep")).toBeDefined();
      expect(tasks.find((t) => t.id === "remove")).toBeUndefined();
    });
  }, { timeout: 10000 });
});

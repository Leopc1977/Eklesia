// backend/BackendAgnostic.ts
import { EventBus } from "./EventBus";
import { TaskManager } from "./TaskManager";
import { TaskRequest, TaskResult } from "../shared/types";

export class BackendAgnostic {
  private taskManager: TaskManager;

  constructor(private bus: EventBus) {
    this.taskManager = new TaskManager();
  }

  async executeTask(task: TaskRequest): Promise<TaskResult> {
    const id = task.id ?? Date.now().toString();
    this.bus.emit("taskStarted", { id, prompt: task.prompt });

    try {
      const result = await this.taskManager.runTask(task, (progress) => {
        this.bus.emit("taskProgress", { id, ...progress });
      });

      this.bus.emit("taskCompleted", result);
      return result;
    } catch (err) {
      this.bus.emit("taskError", { id, error: err });
      throw err;
    }
  }

  listTasks() {
    return this.taskManager.listTasks();
  }

  cancelTask(id: string) {
    return this.taskManager.cancelTask(id);
  }
}

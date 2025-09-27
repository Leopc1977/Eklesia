import { TaskRequest, TaskResult } from '../shared/types'

export class TaskManager {
  private tasks: Record<string, TaskResult> = {};

  async runTask(task: TaskRequest, onProgress?: (progress: { step: string }) => void): Promise<TaskResult> {
    const id = task.id ?? Date.now().toString();

    // Exemple de progression
    onProgress?.({ step: "preprocessing" });
    await new Promise((r) => setTimeout(r, 500));
    onProgress?.({ step: "running" });
    await new Promise((r) => setTimeout(r, 500));

    const result: TaskResult = { id, output: `Result for: ${task.prompt}` };
    this.tasks[id] = result;
    return result;
  }

  listTasks() {
    return Object.values(this.tasks);
  }

  cancelTask(id: string) {
    // Minimal: juste supprime la tâche stockée
    delete this.tasks[id];
  }
}

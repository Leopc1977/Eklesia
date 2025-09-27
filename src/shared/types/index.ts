import type ChatCompletionResponse from "./ChatCompletionResponse";
import type Message from "./Message";

export type {
  ChatCompletionResponse,
  Message,
};

export interface TaskRequest {
  id?: string;
  prompt: string;
  params?: any;
}

export interface TaskResult {
  id: string;
  output: string;
  metadata?: any;
}

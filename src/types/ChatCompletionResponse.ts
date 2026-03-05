export default interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  system_fingerprint?: string;
  choices: Array<{
    index: number;
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | string | null;
    message: {
      role: "system" | "user" | "assistant" | "tool";
      content: string | null;
    };
  }>;
}

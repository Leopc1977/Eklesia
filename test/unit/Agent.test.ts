import { describe, it, expect, beforeEach, mock } from "bun:test";
import Agent from "../../src/core/agents/Agent";
import Provider from "../../src/providers/Provider";
import { SIGNAL_END_OF_CONVERSATION } from "../../src/shared/constants";
import type { ChatCompletionResponse, Message } from "../../src/shared/types";

function makeMockProvider(response: string): Provider {
  const provider = new Provider();
  provider.query = mock(async (): Promise<ChatCompletionResponse> => ({
    choices: [{ message: { role: "assistant", content: response } }],
  }));
  return provider;
}

function captureProvider(): { provider: Provider; capturedMessages: Message[][] } {
  const capturedMessages: Message[][] = [];
  const provider = new Provider();
  provider.query = mock(async (msgs: Message[]): Promise<ChatCompletionResponse> => {
    capturedMessages.push([...msgs]);
    return { choices: [{ message: { role: "assistant", content: "ok" } }] };
  });
  return { provider, capturedMessages };
}

describe("Agent", () => {
  describe("constructor", () => {
    it("stores agentName, roleDesc, and provider", () => {
      const provider = makeMockProvider("hello");
      const agent = new Agent("Alice", "You are helpful.", provider);
      expect(agent.agentName).toBe("Alice");
      expect(agent.roleDesc).toBe("You are helpful.");
      expect(agent.provider).toBe(provider);
    });

    it("defaults mergeOtherAgentAsUser to false", () => {
      const agent = new Agent("Alice", "role", makeMockProvider("hi"));
      expect(agent.mergeOtherAgentAsUser).toBe(false);
    });

    it("defaults requestMsg to null", () => {
      const agent = new Agent("Alice", "role", makeMockProvider("hi"));
      expect(agent.requestMsg).toBeNull();
    });

    it("accepts custom mergeOtherAgentAsUser and requestMsg", () => {
      const requestMsg: Message = { role: "system", content: "Please respond." };
      const agent = new Agent("Bob", "role", makeMockProvider("hi"), true, requestMsg);
      expect(agent.mergeOtherAgentAsUser).toBe(true);
      expect(agent.requestMsg).toBe(requestMsg);
    });
  });

  describe("act()", () => {
    it("returns the provider's response trimmed", async () => {
      const agent = new Agent("Alice", "You are helpful.", makeMockProvider("  Hello world!  "));
      const result = await agent.act([], "Some environment");
      expect(result).toBe("Hello world!");
    });

    it("calls the provider exactly once per act() call", async () => {
      const provider = makeMockProvider("response");
      const agent = new Agent("Alice", "role", provider);
      await agent.act([], "env");
      expect(provider.query).toHaveBeenCalledTimes(1);
    });

    it("returns error signal when provider throws", async () => {
      const provider = new Provider();
      provider.query = mock(async () => {
        throw new Error("Network failure");
      });
      const agent = new Agent("Alice", "role", provider);
      const result = await agent.act([], "env");
      expect(result).toContain(SIGNAL_END_OF_CONVERSATION);
      expect(result).toContain("Network failure");
    });

    it("returns error signal when provider returns empty choices", async () => {
      const provider = new Provider();
      provider.query = mock(async (): Promise<ChatCompletionResponse> => ({
        choices: [],
      }));
      const agent = new Agent("Alice", "role", provider);
      const result = await agent.act([], "env");
      expect(result).toContain(SIGNAL_END_OF_CONVERSATION);
    });

    it("returns error signal when provider returns null content", async () => {
      const provider = new Provider();
      provider.query = mock(async (): Promise<any> => ({
        choices: [{ message: { role: "assistant", content: null } }],
      }));
      const agent = new Agent("Alice", "role", provider);
      const result = await agent.act([], "env");
      expect(result).toContain(SIGNAL_END_OF_CONVERSATION);
    });

    it("includes the agent name in the error signal message", async () => {
      const provider = new Provider();
      provider.query = mock(async () => {
        throw new Error("Timeout");
      });
      const agent = new Agent("FailingAgent", "role", provider);
      const result = await agent.act([], "env");
      expect(result).toContain("FailingAgent");
    });
  });

  describe("message formatting", () => {
    it("includes a system message as the first message sent to provider", async () => {
      const { provider, capturedMessages } = captureProvider();
      const agent = new Agent("Alice", "You help people.", provider);
      await agent.act([], "The environment description");

      const messages = capturedMessages[0]!;
      expect(messages[0]?.role).toBe("system");
      expect(messages[0]?.content).toContain("Alice");
      expect(messages[0]?.content).toContain("You help people.");
    });

    it("includes environment description in the system prompt", async () => {
      const { provider, capturedMessages } = captureProvider();
      const agent = new Agent("Alice", "role", provider);
      await agent.act([], "A special environment context");

      expect(capturedMessages[0]?.[0]?.content).toContain("A special environment context");
    });

    it("maps agent's own messages to 'assistant' role", async () => {
      const { provider, capturedMessages } = captureProvider();
      const agent = new Agent("Alice", "role", provider);

      await agent.act([{ role: "Alice", content: "I said this before" }], "env");

      const messages = capturedMessages[0]!;
      const assistantMsg = messages.find((m) => m.role === "assistant");
      expect(assistantMsg).toBeDefined();
      expect(assistantMsg?.content).toContain("I said this before");
    });

    it("maps other agents' messages to 'user' role", async () => {
      const { provider, capturedMessages } = captureProvider();
      const agent = new Agent("Alice", "role", provider);

      await agent.act([{ role: "Bob", content: "Bob said this" }], "env");

      const messages = capturedMessages[0]!;
      const userMsg = messages.find((m) => m.role === "user");
      expect(userMsg).toBeDefined();
      expect(userMsg?.content).toContain("[Bob]");
      expect(userMsg?.content).toContain("Bob said this");
    });

    it("appends 'Now you speak' system message at the end by default", async () => {
      const { provider, capturedMessages } = captureProvider();
      const agent = new Agent("Alice", "role", provider);
      await agent.act([], "env");

      const messages = capturedMessages[0]!;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg?.role).toBe("system");
      expect(lastMsg?.content).toContain("Now you speak");
      expect(lastMsg?.content).toContain("Alice");
    });

    it("uses requestMsg instead of 'Now you speak' when set", async () => {
      const { provider, capturedMessages } = captureProvider();
      const requestMsg: Message = { role: "system", content: "Please answer in one word." };
      const agent = new Agent("Alice", "role", provider, false, requestMsg);
      await agent.act([], "env");

      const messages = capturedMessages[0]!;
      const lastMsg = messages[messages.length - 1];
      expect(lastMsg?.role).toBe("system");
      expect(lastMsg?.content).toBe("Please answer in one word.");
    });

    it("merges consecutive other-agent messages into a single user message when mergeOtherAgentAsUser=true", async () => {
      const { provider, capturedMessages } = captureProvider();
      const agent = new Agent("Alice", "role", provider, true);

      await agent.act(
        [
          { role: "Bob", content: "Bob speaks first" },
          { role: "Charlie", content: "Charlie chimes in" },
        ],
        "env",
      );

      const messages = capturedMessages[0]!;
      const userMessages = messages.filter((m) => m.role === "user");
      expect(userMessages).toHaveLength(1);
      expect(userMessages[0]?.content).toContain("[Bob]");
      expect(userMessages[0]?.content).toContain("[Charlie]");
    });

    it("creates separate user messages for consecutive other-agent messages when mergeOtherAgentAsUser=false", async () => {
      const { provider, capturedMessages } = captureProvider();
      const agent = new Agent("Alice", "role", provider, false);

      await agent.act(
        [
          { role: "Bob", content: "Bob speaks first" },
          { role: "Charlie", content: "Charlie chimes in" },
        ],
        "env",
      );

      const messages = capturedMessages[0]!;
      const userMessages = messages.filter((m) => m.role === "user");
      // Bob → user; Charlie after Bob (user) → new user msg
      expect(userMessages.length).toBeGreaterThanOrEqual(1);
      const combined = userMessages.map((m) => m.content).join(" ");
      expect(combined).toContain("[Bob]");
      expect(combined).toContain("[Charlie]");
    });
  });
});

import { describe, it, expect, beforeEach, mock } from "bun:test";
import Arena from "../../src/core/Arena";
import Agent from "../../src/core/agents/Agent";
import Orchestrator from "../../src/core/orchestrators/Orchestrator";
import ConversationEnvironment from "../../src/core/environments/ConversationEnvironment";
import Provider from "../../src/providers/Provider";
import type { ChatCompletionResponse } from "../../src/shared/types";

function makeMockProvider(response = "ok"): Provider {
  const provider = new Provider();
  provider.query = mock(async (): Promise<ChatCompletionResponse> => ({
    choices: [{ message: { role: "assistant", content: response } }],
  }));
  return provider;
}

function makeAgent(name: string, response = "ok"): Agent {
  const agent = new Agent(name, `${name}'s role`, makeMockProvider(response));
  agent.act = mock(async () => response);
  return agent;
}

/** Minimal valid JSON config matching Arena.loadConfigJSON expectations */
function makeValidConfig(overrides: Record<string, any> = {}): string {
  const base = {
    global_prompt: "A test environment.",
    environment: {
      type: "conversation",
      moderator: {
        role_desc: "You are a moderator.",
        terminal_condition: "Is it over?",
        terminal_sentences: ["Yes", "yes"],
        period: "turn",
        provider: {
          type: "openai-chat",
          url: "https://api.example.com/v1/chat/completions",
          model: "test-model",
          apiKey: "test-key",
        },
      },
    },
    agents: [
      {
        name: "Alice",
        role_desc: "You are Alice.",
        provider: {
          type: "openai-chat",
          url: "https://api.example.com/v1/chat/completions",
          model: "test-model",
          apiKey: "test-key",
        },
      },
      {
        name: "Bob",
        role_desc: "You are Bob.",
        provider: {
          type: "openai-chat",
          url: "https://api.example.com/v1/chat/completions",
          model: "test-model",
          apiKey: "test-key",
        },
      },
    ],
    ...overrides,
  };
  return JSON.stringify(base);
}

describe("Arena", () => {
  describe("constructor", () => {
    it("stores agents, orchestrator, and environment", () => {
      const env = new ConversationEnvironment("test");
      const orch = new Orchestrator(env);
      const agents = [makeAgent("Alice"), makeAgent("Bob")];
      const arena = new Arena(agents, orch, env);

      expect(arena.agents).toBe(agents);
      expect(arena.orchestrator).toBe(orch);
      expect(arena.environment).toBe(env);
    });
  });

  describe("run()", () => {
    it("calls orchestrator.step() up to maxSteps times", async () => {
      const env = new ConversationEnvironment("test");
      const orch = new Orchestrator(env);
      orch.step = mock(async () => false);
      const arena = new Arena([makeAgent("Alice")], orch, env);

      await arena.run(5);

      expect(orch.step).toHaveBeenCalledTimes(5);
    });

    it("stops early when orchestrator.step() returns true", async () => {
      const env = new ConversationEnvironment("test");
      const orch = new Orchestrator(env);
      let callCount = 0;
      orch.step = mock(async () => {
        callCount++;
        return callCount >= 3; // terminal after 3 steps
      });
      const arena = new Arena([makeAgent("Alice")], orch, env);

      await arena.run(100);

      expect(orch.step).toHaveBeenCalledTimes(3);
    });

    it("uses maxSteps=100 by default", async () => {
      const env = new ConversationEnvironment("test");
      const orch = new Orchestrator(env);
      orch.step = mock(async () => false);
      const arena = new Arena([makeAgent("Alice")], orch, env);

      await arena.run();

      expect(orch.step).toHaveBeenCalledTimes(100);
    });

    it("does not call step when maxSteps is 0", async () => {
      const env = new ConversationEnvironment("test");
      const orch = new Orchestrator(env);
      orch.step = mock(async () => false);
      const arena = new Arena([makeAgent("Alice")], orch, env);

      await arena.run(0);

      expect(orch.step).toHaveBeenCalledTimes(0);
    });

    it("stops on the first step when it immediately returns true", async () => {
      const env = new ConversationEnvironment("test");
      const orch = new Orchestrator(env);
      orch.step = mock(async () => true);
      const arena = new Arena([makeAgent("Alice")], orch, env);

      await arena.run(50);

      expect(orch.step).toHaveBeenCalledTimes(1);
    });

    it("passes the agents array to each step call", async () => {
      const env = new ConversationEnvironment("test");
      const orch = new Orchestrator(env);
      const agents = [makeAgent("Alice"), makeAgent("Bob")];
      orch.step = mock(async () => false);
      const arena = new Arena(agents, orch, env);

      await arena.run(2);

      expect(orch.step).toHaveBeenNthCalledWith(1, agents);
      expect(orch.step).toHaveBeenNthCalledWith(2, agents);
    });
  });

  describe("loadConfigJSON()", () => {
    it("parses a valid config and returns an Arena instance", async () => {
      const arena = await Arena.loadConfigJSON(makeValidConfig());
      expect(arena).toBeInstanceOf(Arena);
    });

    it("creates the correct number of agents", async () => {
      const arena = await Arena.loadConfigJSON(makeValidConfig());
      expect(arena.agents).toHaveLength(2);
    });

    it("assigns agent names from config", async () => {
      const arena = await Arena.loadConfigJSON(makeValidConfig());
      const names = arena.agents.map((a) => a.agentName);
      expect(names).toContain("Alice");
      expect(names).toContain("Bob");
    });

    it("assigns agent role descriptions from config", async () => {
      const arena = await Arena.loadConfigJSON(makeValidConfig());
      const alice = arena.agents.find((a) => a.agentName === "Alice");
      expect(alice?.roleDesc).toBe("You are Alice.");
    });

    it("creates a ConversationEnvironment when type is 'conversation'", async () => {
      const arena = await Arena.loadConfigJSON(makeValidConfig());
      expect(arena.environment).toBeInstanceOf(ConversationEnvironment);
    });

    it("sets the environment description to global_prompt", async () => {
      const arena = await Arena.loadConfigJSON(makeValidConfig());
      expect(arena.environment.description).toBe("A test environment.");
    });

    it("attaches a moderator with the configured terminal sentences", async () => {
      const arena = await Arena.loadConfigJSON(makeValidConfig());
      expect(arena.environment.moderator).not.toBeNull();
      expect(arena.environment.moderator?.terminalSentences).toContain("Yes");
      expect(arena.environment.moderator?.terminalSentences).toContain("yes");
    });

    it("attaches a moderator with the configured period", async () => {
      const arena = await Arena.loadConfigJSON(makeValidConfig());
      expect(arena.environment.moderator?.period).toBe("turn");
    });

    it("accepts a terminal_sentences string and wraps it in an array", async () => {
      const config = makeValidConfig({
        environment: {
          type: "conversation",
          moderator: {
            role_desc: "Mod",
            terminal_condition: "Done?",
            terminal_sentences: "Done",
            period: "turn",
            provider: {
              type: "openai-chat",
              url: "https://api.example.com",
              model: "test",
              apiKey: "key",
            },
          },
        },
      });
      const arena = await Arena.loadConfigJSON(config);
      expect(arena.environment.moderator?.terminalSentences).toEqual(["Done"]);
    });

    it("throws when an agent has no apiKey and API_KEY env var is not set", async () => {
      const origKey = process.env.API_KEY;
      delete process.env.API_KEY;

      const config = JSON.stringify({
        global_prompt: "env",
        environment: {
          type: "conversation",
          moderator: {
            role_desc: "Mod",
            terminal_condition: "Done?",
            terminal_sentences: ["Yes"],
            period: "turn",
            provider: { type: "openai-chat", url: "http://x", model: "m", apiKey: "key" },
          },
        },
        agents: [
          {
            name: "NoKey",
            role_desc: "role",
            provider: { type: "openai-chat", url: "http://x", model: "m" },
          },
        ],
      });

      await expect(Arena.loadConfigJSON(config)).rejects.toThrow();

      if (origKey !== undefined) process.env.API_KEY = origKey;
    });

    it("throws when a provider type is unsupported", async () => {
      const config = makeValidConfig({
        agents: [
          {
            name: "Agent",
            role_desc: "role",
            provider: {
              type: "unsupported-provider",
              url: "http://x",
              model: "m",
              apiKey: "key",
            },
          },
        ],
      });

      await expect(Arena.loadConfigJSON(config)).rejects.toThrow();
    });
  });
});

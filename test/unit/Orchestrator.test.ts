import { describe, it, expect, beforeEach, mock } from "bun:test";
import Orchestrator from "../../src/core/orchestrators/Orchestrator";
import ConversationEnvironment from "../../src/core/environments/ConversationEnvironment";
import Agent from "../../src/core/agents/Agent";
import Moderator from "../../src/core/agents/Moderator";
import Provider from "../../src/providers/Provider";
import type { ChatCompletionResponse } from "../../src/shared/types";

function makeMockProvider(response: string): Provider {
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

describe("Orchestrator", () => {
  let env: ConversationEnvironment;

  beforeEach(() => {
    env = new ConversationEnvironment("Test arena");
  });

  describe("constructor", () => {
    it("stores the environment", () => {
      const orch = new Orchestrator(env);
      expect(orch.environment).toBe(env);
    });

    it("starts with currentAgentIndex at 0", () => {
      const orch = new Orchestrator(env);
      // Access protected field via cast
      expect((orch as any).currentAgentIndex).toBe(0);
    });
  });

  describe("step() with empty agents array", () => {
    it("returns false immediately", async () => {
      const orch = new Orchestrator(env);
      expect(await orch.step([])).toBe(false);
    });

    it("does not modify environment messages", async () => {
      const orch = new Orchestrator(env);
      await orch.step([]);
      expect(env.messages).toHaveLength(0);
    });
  });

  describe("step() agent selection", () => {
    it("activates the first agent on the first step", async () => {
      const alice = makeAgent("Alice", "Hello");
      const bob = makeAgent("Bob", "Hi");
      const orch = new Orchestrator(env);

      await orch.step([alice, bob]);

      expect(alice.act).toHaveBeenCalledTimes(1);
      expect(bob.act).toHaveBeenCalledTimes(0);
    });

    it("activates the second agent on the second step", async () => {
      const alice = makeAgent("Alice", "Hello");
      const bob = makeAgent("Bob", "Hi");
      const orch = new Orchestrator(env);

      await orch.step([alice, bob]);
      await orch.step([alice, bob]);

      expect(alice.act).toHaveBeenCalledTimes(1);
      expect(bob.act).toHaveBeenCalledTimes(1);
    });

    it("wraps back to the first agent after all agents have acted", async () => {
      const alice = makeAgent("Alice", "a");
      const bob = makeAgent("Bob", "b");
      const orch = new Orchestrator(env);

      await orch.step([alice, bob]); // Alice
      await orch.step([alice, bob]); // Bob
      await orch.step([alice, bob]); // Alice again

      expect(alice.act).toHaveBeenCalledTimes(2);
      expect(bob.act).toHaveBeenCalledTimes(1);
    });

    it("handles a single agent across multiple steps", async () => {
      const solo = makeAgent("Solo", "I speak");
      const orch = new Orchestrator(env);

      await orch.step([solo]);
      await orch.step([solo]);
      await orch.step([solo]);

      expect(solo.act).toHaveBeenCalledTimes(3);
    });
  });

  describe("step() environment mutations", () => {
    it("adds the agent's response to the environment", async () => {
      const alice = makeAgent("Alice", "Hello world");
      const orch = new Orchestrator(env);

      await orch.step([alice]);

      expect(env.messages).toHaveLength(1);
      expect(env.messages[0]).toEqual({ role: "Alice", content: "Hello world" });
    });

    it("accumulates messages across multiple steps", async () => {
      const alice = makeAgent("Alice", "From Alice");
      const bob = makeAgent("Bob", "From Bob");
      const orch = new Orchestrator(env);

      await orch.step([alice, bob]);
      await orch.step([alice, bob]);

      expect(env.messages).toHaveLength(2);
      expect(env.messages[0]).toEqual({ role: "Alice", content: "From Alice" });
      expect(env.messages[1]).toEqual({ role: "Bob", content: "From Bob" });
    });

    it("passes the environment description to act()", async () => {
      const alice = makeAgent("Alice", "ok");
      const orch = new Orchestrator(env);

      await orch.step([alice]);

      expect(alice.act).toHaveBeenCalledWith(
        expect.any(Array),
        "Test arena",
      );
    });
  });

  describe("step() terminal detection", () => {
    it("returns false when no moderator is set", async () => {
      const alice = makeAgent("Alice", "not done");
      const orch = new Orchestrator(env);

      const isTerminal = await orch.step([alice]);
      expect(isTerminal).toBe(false);
    });

    it("returns true when the moderator evaluates terminal condition as met", async () => {
      const terminalProvider = makeMockProvider("Yes");
      const moderator = new Moderator(
        "Moderator",
        "Is it over?",
        ["Yes"],
        "turn",
        terminalProvider,
      );
      const envWithMod = new ConversationEnvironment("With moderator", moderator);
      const alice = makeAgent("Alice", "ok");
      const orch = new Orchestrator(envWithMod);

      const isTerminal = await orch.step([alice]);
      expect(isTerminal).toBe(true);
    });

    it("returns false when moderator says it is not terminal", async () => {
      const notTerminalProvider = makeMockProvider("No");
      const moderator = new Moderator(
        "Moderator",
        "Is it over?",
        ["Yes"],
        "turn",
        notTerminalProvider,
      );
      const envWithMod = new ConversationEnvironment("With moderator", moderator);
      const alice = makeAgent("Alice", "ok");
      const orch = new Orchestrator(envWithMod);

      const isTerminal = await orch.step([alice]);
      expect(isTerminal).toBe(false);
    });

    it("increments currentAgentIndex after each step regardless of terminal state", async () => {
      const alice = makeAgent("Alice", "ok");
      const orch = new Orchestrator(env);

      await orch.step([alice]);
      expect((orch as any).currentAgentIndex).toBe(1);

      await orch.step([alice]);
      expect((orch as any).currentAgentIndex).toBe(2);
    });
  });
});

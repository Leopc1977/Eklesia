import { describe, it, expect, beforeEach, mock } from "bun:test";
import ConversationEnvironment from "../../src/core/environments/ConversationEnvironment";
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

function makeModerator(response: string, terminalSentences: string[], period = "turn"): Moderator {
  return new Moderator(
    "You are a moderator.",
    "Is the conversation over?",
    terminalSentences,
    period,
    makeMockProvider(response),
  );
}

describe("ConversationEnvironment", () => {
  let env: ConversationEnvironment;

  beforeEach(() => {
    env = new ConversationEnvironment("A test environment");
  });

  describe("constructor", () => {
    it("stores the description", () => {
      expect(env.description).toBe("A test environment");
    });

    it("starts with an empty messages array", () => {
      expect(env.messages).toEqual([]);
    });

    it("sets moderator to null by default", () => {
      expect(env.moderator).toBeNull();
    });

    it("accepts a moderator as the second argument", () => {
      const moderator = makeModerator("No", ["Yes"]);
      const envWithMod = new ConversationEnvironment("desc", moderator);
      expect(envWithMod.moderator).toBe(moderator);
    });
  });

  describe("addMessage", () => {
    it("adds a message with the correct role and content", () => {
      env.addMessage("Alice", "Hello!");
      expect(env.messages).toHaveLength(1);
      expect(env.messages[0]).toEqual({ role: "Alice", content: "Hello!" });
    });

    it("preserves insertion order", () => {
      env.addMessage("Alice", "First");
      env.addMessage("Bob", "Second");
      env.addMessage("Alice", "Third");
      expect(env.messages.map((m) => m.role)).toEqual(["Alice", "Bob", "Alice"]);
      expect(env.messages.map((m) => m.content)).toEqual(["First", "Second", "Third"]);
    });

    it("allows empty string content", () => {
      env.addMessage("Alice", "");
      expect(env.messages[0]?.content).toBe("");
    });
  });

  describe("getObservation", () => {
    beforeEach(() => {
      env.addMessage("Alice", "Alice says hello");
      env.addMessage("Bob", "Bob replies");
      env.addMessage("Alice", "Alice responds again");
    });

    it("returns all messages when called with null", () => {
      expect(env.getObservation(null)).toHaveLength(3);
    });

    it("returns all messages when called without arguments", () => {
      expect(env.getObservation()).toHaveLength(3);
    });

    it("returns only messages from the specified agent", () => {
      const obs = env.getObservation("Alice");
      expect(obs).toHaveLength(2);
      expect(obs.every((m) => m.role === "Alice")).toBe(true);
    });

    it("returns only Bob's messages when asked for Bob", () => {
      const obs = env.getObservation("Bob");
      expect(obs).toHaveLength(1);
      expect(obs[0]?.content).toBe("Bob replies");
    });

    it("returns an empty array for an agent with no messages", () => {
      expect(env.getObservation("Charlie")).toEqual([]);
    });

    it("returns the same array reference as the internal messages when given null", () => {
      const obs = env.getObservation(null);
      expect(obs).toBe(env.messages);
    });
  });

  describe("isTerminal", () => {
    it("returns false when there is no moderator (beforeNewRound=false)", async () => {
      expect(await env.isTerminal(false)).toBe(false);
    });

    it("returns false when there is no moderator (beforeNewRound=true)", async () => {
      expect(await env.isTerminal(true)).toBe(false);
    });

    describe("with a moderator of period 'turn'", () => {
      it("returns true when moderator response contains a terminal sentence", async () => {
        const envWithMod = new ConversationEnvironment("test", makeModerator("Yes", ["Yes"], "turn"));
        envWithMod.addMessage("Alice", "Some message");
        expect(await envWithMod.isTerminal(false)).toBe(true);
      });

      it("returns true even when beforeNewRound is false", async () => {
        const envWithMod = new ConversationEnvironment("test", makeModerator("Yes", ["Yes"], "turn"));
        envWithMod.addMessage("Alice", "msg");
        expect(await envWithMod.isTerminal(false)).toBe(true);
      });

      it("returns false when moderator response does not match any terminal sentence", async () => {
        const envWithMod = new ConversationEnvironment("test", makeModerator("No, not yet", ["Yes", "Done"], "turn"));
        envWithMod.addMessage("Alice", "msg");
        expect(await envWithMod.isTerminal(false)).toBe(false);
      });

      it("matches any sentence in the terminal sentences list", async () => {
        const envWithMod = new ConversationEnvironment(
          "test",
          makeModerator("wins the game!", ["Yes", "yes", "wins the game"], "turn"),
        );
        envWithMod.addMessage("Alice", "msg");
        expect(await envWithMod.isTerminal(false)).toBe(true);
      });

      it("does a substring match on the terminal sentence", async () => {
        const envWithMod = new ConversationEnvironment(
          "test",
          makeModerator("Player 2 wins the game! Congratulations.", ["wins the game"], "turn"),
        );
        envWithMod.addMessage("Alice", "msg");
        expect(await envWithMod.isTerminal(false)).toBe(true);
      });
    });

    describe("with a moderator of period 'round'", () => {
      it("does not call the moderator when beforeNewRound is false", async () => {
        const provider = makeMockProvider("Yes");
        const querySpy = provider.query as ReturnType<typeof mock>;
        const moderator = new Moderator("Mod", "Is it done?", ["Yes"], "round", provider);
        const envWithMod = new ConversationEnvironment("test", moderator);

        await envWithMod.isTerminal(false);
        expect(querySpy).not.toHaveBeenCalled();
      });

      it("calls the moderator and returns true when beforeNewRound is true and response matches", async () => {
        const envWithMod = new ConversationEnvironment("test", makeModerator("Yes", ["Yes"], "round"));
        envWithMod.addMessage("Alice", "msg");
        expect(await envWithMod.isTerminal(true)).toBe(true);
      });

      it("calls the moderator and returns false when beforeNewRound is true but response does not match", async () => {
        const envWithMod = new ConversationEnvironment("test", makeModerator("No", ["Yes"], "round"));
        envWithMod.addMessage("Alice", "msg");
        expect(await envWithMod.isTerminal(true)).toBe(false);
      });
    });
  });
});

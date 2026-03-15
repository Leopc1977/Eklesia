import { describe, it, expect } from "bun:test";
import getProviderByType from "../../src/providers/utils/getProviderByType";
import OpenAIGenericProvider from "../../src/providers/OpenAIGenericProvider";

describe("getProviderByType()", () => {
  const model = "test-model";
  const url = "https://api.example.com/v1/chat/completions";
  const apiKey = "sk-test-key";

  describe("openai-chat", () => {
    it("returns an OpenAIGenericProvider instance", () => {
      const provider = getProviderByType("openai-chat", model, url, apiKey);
      expect(provider).toBeInstanceOf(OpenAIGenericProvider);
    });

    it("sets the model on the returned provider", () => {
      const provider = getProviderByType("openai-chat", model, url, apiKey);
      expect(provider.model).toBe(model);
    });

    it("sets the endpointUrl on the returned provider", () => {
      const provider = getProviderByType("openai-chat", model, url, apiKey);
      expect(provider.endpointUrl).toBe(url);
    });

    it("sets the apiKey on the returned provider", () => {
      const provider = getProviderByType("openai-chat", model, url, apiKey);
      expect(provider.apiKey).toBe(apiKey);
    });

    it("uses the default temperature when none is provided", () => {
      const provider = getProviderByType("openai-chat", model, url, apiKey);
      // Default from Provider base class is 0.7
      expect(provider.temperature).toBe(0.7);
    });

    it("forwards the temperature to the provider", () => {
      const provider = getProviderByType("openai-chat", model, url, apiKey, 0.2);
      expect(provider.temperature).toBe(0.2);
    });

    it("forwards max_tokens to the provider", () => {
      const provider = getProviderByType("openai-chat", model, url, apiKey, undefined, 512);
      expect(provider.max_tokens).toBe(512);
    });
  });

  describe("unsupported types", () => {
    it("throws for an unknown provider type", () => {
      expect(() => getProviderByType("unknown-type", model, url, apiKey)).toThrow();
    });

    it("throws for an empty string type", () => {
      expect(() => getProviderByType("", model, url, apiKey)).toThrow();
    });

    it("throws for 'openai-generic' (wrong name — correct is 'openai-chat')", () => {
      expect(() => getProviderByType("openai-generic", model, url, apiKey)).toThrow();
    });

    it("error message includes the unsupported type name", () => {
      expect(() => getProviderByType("my-custom-llm", model, url, apiKey)).toThrow(
        "my-custom-llm",
      );
    });
  });
});

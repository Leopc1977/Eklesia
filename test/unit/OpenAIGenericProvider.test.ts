import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import OpenAIGenericProvider from "../../src/providers/OpenAIGenericProvider";
import type { Message } from "../../src/shared/types";

const ENDPOINT = "https://api.example.com/v1/chat/completions";
const MODEL = "test-model";
const API_KEY = "sk-test-api-key";

const MESSAGES: Message[] = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Hello!" },
];

function makeSuccessResponse(content: string) {
  return {
    choices: [{ message: { role: "assistant", content } }],
  };
}

function mockFetch(responseBody: object, status = 200) {
  return mock(async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => responseBody,
  }));
}

describe("OpenAIGenericProvider", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("constructor", () => {
    it("stores model, endpointUrl, and apiKey", () => {
      const p = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      expect(p.model).toBe(MODEL);
      expect(p.endpointUrl).toBe(ENDPOINT);
      expect(p.apiKey).toBe(API_KEY);
    });

    it("uses default temperature 0.7 when not specified", () => {
      const p = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      expect(p.temperature).toBe(0.7);
    });

    it("uses the provided temperature", () => {
      const p = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY, 0.2);
      expect(p.temperature).toBe(0.2);
    });

    it("uses the provided max_tokens", () => {
      const p = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY, undefined, 512);
      expect(p.max_tokens).toBe(512);
    });
  });

  describe("query()", () => {
    it("sends a POST request to the endpoint URL", async () => {
      const fetchMock = mockFetch(makeSuccessResponse("Hi!"));
      globalThis.fetch = fetchMock as any;

      const provider = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      await provider.query(MESSAGES);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = (fetchMock as any).mock.calls[0];
      expect(url).toBe(ENDPOINT);
      expect(init.method).toBe("POST");
    });

    it("sends the correct Authorization header", async () => {
      const fetchMock = mockFetch(makeSuccessResponse("Hi!"));
      globalThis.fetch = fetchMock as any;

      const provider = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      await provider.query(MESSAGES);

      const [, init] = (fetchMock as any).mock.calls[0];
      expect(init.headers["Authorization"]).toBe(`Bearer ${API_KEY}`);
    });

    it("sends Content-Type: application/json", async () => {
      const fetchMock = mockFetch(makeSuccessResponse("Hi!"));
      globalThis.fetch = fetchMock as any;

      const provider = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      await provider.query(MESSAGES);

      const [, init] = (fetchMock as any).mock.calls[0];
      expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("includes model, temperature, and messages in the request body", async () => {
      const fetchMock = mockFetch(makeSuccessResponse("Hi!"));
      globalThis.fetch = fetchMock as any;

      const provider = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY, 0.5);
      await provider.query(MESSAGES);

      const [, init] = (fetchMock as any).mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.model).toBe(MODEL);
      expect(body.temperature).toBe(0.5);
      expect(body.messages).toEqual(MESSAGES);
    });

    it("returns the parsed JSON response", async () => {
      const expected = makeSuccessResponse("Hello, world!");
      globalThis.fetch = mockFetch(expected) as any;

      const provider = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      const result = await provider.query(MESSAGES);

      expect(result).toEqual(expected);
    });

    it("returns the full response even when it contains extra fields", async () => {
      const response = {
        id: "chatcmpl-123",
        object: "chat.completion",
        choices: [{ message: { role: "assistant", content: "response" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      };
      globalThis.fetch = mockFetch(response) as any;

      const provider = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      const result = await provider.query(MESSAGES);

      expect(result).toEqual(response);
    });

    it("propagates fetch errors (network failure)", async () => {
      globalThis.fetch = mock(async () => {
        throw new Error("Network unreachable");
      }) as any;

      const provider = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      await expect(provider.query(MESSAGES)).rejects.toThrow("Network unreachable");
    });

    it("sends an empty messages array when no messages are provided", async () => {
      const fetchMock = mockFetch(makeSuccessResponse("ok"));
      globalThis.fetch = fetchMock as any;

      const provider = new OpenAIGenericProvider(MODEL, ENDPOINT, API_KEY);
      await provider.query([]);

      const [, init] = (fetchMock as any).mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.messages).toEqual([]);
    });
  });
});

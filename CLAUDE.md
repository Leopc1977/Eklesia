# CLAUDE.md — Eklesia Codebase Guide

## Project Overview

**Eklesia** is a TypeScript multi-agent orchestration library for simulating conversations and interactions between AI agents in configurable environments. It is inspired by [ChatArena](https://github.com/Farama-Foundation/ChatArena) but is designed to be backend-agnostic and provider-flexible.

- **Version:** 0.1.4 (pre-release / work in progress)
- **License:** MIT
- **Runtime:** Bun >=1.0.0 (primary), Node.js compatible
- **Language:** TypeScript 5.0+ (strict mode)
- **Package exports:** CommonJS (`dist/index.js`) + ESM (`dist/index.mjs`) + declarations (`dist/index.d.ts`)

---

## Repository Structure

```
/
├── src/
│   ├── index.ts                    # Library entry point — re-exports core
│   ├── core/
│   │   ├── index.ts               # Core exports (Arena, Agent, Orchestrator, etc.)
│   │   ├── Arena.ts               # Main orchestration container
│   │   ├── agents/
│   │   │   ├── Agent.ts           # Base agent (queries provider, formats messages)
│   │   │   ├── User.ts            # Human-in-the-loop agent type
│   │   │   └── Moderator.ts       # Agent that evaluates terminal conditions
│   │   ├── environments/
│   │   │   ├── Environment.ts          # Abstract base class
│   │   │   └── ConversationEnvironment.ts  # Concrete chat environment
│   │   ├── orchestrators/
│   │   │   └── Orchestrator.ts    # Manages turn-taking between agents
│   │   └── utils/
│   │       └── getFormattedMessages.ts
│   ├── providers/
│   │   ├── Provider.ts            # Abstract provider base class
│   │   ├── OpenAIGenericProvider.ts  # OpenAI-compatible API provider
│   │   ├── TerminalInputProvider.ts  # Human terminal input provider
│   │   └── getProviderByType.ts   # Factory function for providers
│   ├── backend/
│   │   ├── BackendAgnostic.ts     # Node/Web EventBus and TaskManager
│   │   └── EventBus/             # Node.js and Web event bus implementations
│   ├── shared/
│   │   ├── types/                # Message, ChatCompletionResponse, TaskRequest/Result
│   │   └── constants/            # Signal strings, base prompts, system names
│   ├── adapters/                 # (empty — extensible for future backends)
│   ├── types/                    # Type re-exports
│   └── utils/
│       ├── getYaml.ts
│       └── getFormattedMessages.ts
├── examples/
│   ├── configs/
│   │   └── rock-paper-scissors.json   # Example JSON config
│   ├── ai-council.ts                  # Board of advisors simulation
│   └── use-config.ts                  # Config-file-based arena setup
├── test/
│   ├── setup.ts                  # Test preload configuration
│   └── core.test.ts              # Placeholder tests
├── scripts/
│   ├── build.ts                  # Bun build script (CJS + ESM output)
│   └── dev.ts                    # File watcher for development
├── playground.ts                 # Interactive demo / quick-start
├── package.json
├── tsconfig.json
├── bunfig.toml
├── todo.md                       # Roadmap and open issues
└── README.md
```

---

## Development Commands

```bash
bun run build       # Build CJS + ESM outputs with TypeScript declarations
bun run dev         # Watch src/ and rebuild on changes
bun test            # Run tests with Bun test runner
bun test --watch    # Test watch mode
bun run lint        # Lint src/**/*.ts with ESLint
bun run format      # Format src/**/*.ts with Prettier
bun run clean       # Remove dist/ directory
```

---

## Core Architecture

### Key Classes and Their Roles

| Class | File | Purpose |
|-------|------|---------|
| `Arena` | `src/core/Arena.ts` | Top-level container; holds agents, orchestrator, and environment; runs simulation |
| `Agent` | `src/core/agents/Agent.ts` | Sends messages to provider, stores conversation history |
| `Moderator` | `src/core/agents/Moderator.ts` | Evaluates terminal conditions (yes/no decisions) |
| `User` | `src/core/agents/User.ts` | Human-in-the-loop agent via terminal input |
| `Orchestrator` | `src/core/orchestrators/Orchestrator.ts` | Manages turn order and step execution |
| `Environment` | `src/core/environments/Environment.ts` | Abstract base for shared context/state |
| `ConversationEnvironment` | `src/core/environments/ConversationEnvironment.ts` | Concrete chat environment |
| `OpenAIGenericProvider` | `src/providers/OpenAIGenericProvider.ts` | OpenAI-compatible API integration |
| `TerminalInputProvider` | `src/providers/TerminalInputProvider.ts` | Reads input from stdin |

### Data Flow

```
Arena.run(maxSteps)
  └─► Orchestrator.step()  (for each step)
        ├─► Agent.query(environment)
        │     ├─► Provider.query(messages)  →  LLM response
        │     └─► Appends response to environment history
        └─► Moderator.evaluate(terminalCondition)  →  end if "yes"
```

### Conversation Termination Signal

When a conversation ends, agents emit a special UUID-tagged signal:
```
<<<<<<END_OF_CONVERSATION>>>>>>{uuid}
```
This is defined in `src/shared/constants/`.

---

## Programmatic API

### Direct Initialization

```typescript
import { Arena, Agent, ConversationEnvironment, Orchestrator } from "eklesia";
import { OpenAIGenericProvider } from "eklesia/providers";

const provider = new OpenAIGenericProvider({ apiKey: process.env.API_KEY, endpoint: "..." });
const agent1 = new Agent("Alice", "You are a helpful assistant.", provider);
const agent2 = new Agent("Bob", "You are a skeptical reviewer.", provider);
const environment = new ConversationEnvironment("A debate about AI safety.");
const orchestrator = new Orchestrator(environment);
const arena = new Arena([agent1, agent2], orchestrator, environment);

await arena.run(10); // max 10 steps
```

### Config-Based Loading (JSON)

```typescript
import { Arena } from "eklesia";
import { readFileSync } from "fs";

const config = readFileSync("./examples/configs/rock-paper-scissors.json", "utf8");
const arena = await Arena.loadConfigJSON(config);
await arena.run(20);
```

### Config JSON Schema

```json
{
  "environment": {
    "description": "Shared context description"
  },
  "agents": [
    {
      "name": "AgentName",
      "role": "Role description for this agent",
      "provider": {
        "type": "openai-generic",
        "model": "model-name",
        "endpoint": "https://api.example.com/v1",
        "apiKey": "optional-inline-key"
      }
    }
  ],
  "moderator": {
    "role": "Moderator description",
    "terminalCondition": "Has the task been completed? Answer yes or no.",
    "provider": { "...": "same as above" }
  }
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `API_KEY` | Yes (for LLM providers) | API key for OpenAI-compatible endpoints |

> **Note:** There is an open TODO to improve API key handling. Currently accessed via `process.env.API_KEY!` with non-null assertion.

---

## TypeScript Conventions

- **Strict mode** is fully enabled including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- **Private methods** use the `#` prefix (e.g., `#rawQuery()`)
- **Class names:** PascalCase
- **Constants:** UPPER_SNAKE_CASE
- **Generic types** are used throughout for extensibility (`Agent<T>`, `Arena<Agent, Orchestrator, Environment>`)
- Both **default and named exports** are used; prefer named exports for types

---

## Provider Pattern

Providers are created via a factory function:

```typescript
import { getProviderByType } from "eklesia/providers";

const provider = getProviderByType("openai-generic", { model, endpoint, apiKey });
```

Currently supported provider types:
- `"openai-generic"` — Any OpenAI-compatible API (OpenAI, Together.xyz, Ollama, etc.)
- `"terminal"` — Human input from stdin

To add a new provider, extend the abstract `Provider` class and register it in `getProviderByType.ts`.

---

## Build System

The build uses Bun's native build API (`scripts/build.ts`) to produce:

| Output | Format | Purpose |
|--------|--------|---------|
| `dist/index.js` | CommonJS | Node.js / legacy bundlers |
| `dist/index.mjs` | ES Modules | Modern bundlers / ESM |
| `dist/index.d.ts` | TypeScript declarations | Type checking in consuming projects |

Source maps are generated for both formats. No minification is applied.

---

## Testing

Tests use Bun's built-in test runner. The test suite is currently minimal (placeholder).

```bash
bun test
bun test --watch
```

Configuration in `bunfig.toml`:
- Preload: `./test/setup.ts`
- Timeout: 5000ms

When adding tests, place them in `test/` following the `*.test.ts` naming convention.

---

## Key Architectural Decisions

1. **Backend-agnostic design:** `EventBus` has both Node.js and Web implementations, allowing use in browser or server environments.
2. **Provider abstraction:** Wrapping LLM calls behind a `Provider` interface makes it easy to swap models or backends without changing agent logic.
3. **In-memory only:** No persistence layer — this is a library, not a full framework. The `TaskManager` stores state in memory only.
4. **Minimal dependencies:** Only 2 runtime deps (`uuid`, `gray-matter`) keep the library lightweight.
5. **Config-driven orchestration:** JSON configs allow non-programmatic setup of complex multi-agent scenarios.

---

## Open TODOs (from todo.md)

**v1 milestone:**
- Parameter consolidation across agents/orchestrators
- Moderator visibility into full conversation
- Additional orchestrator strategies (beyond round-robin)
- Improved error handling (especially for missing API keys)

**Roadmap:**
- Case sensitivity options
- Improved test coverage
- Extended API options

---

## Common Patterns to Follow

When modifying this codebase:

1. **Adding a new agent type:** Extend `Agent` class, add to `src/core/agents/`, export from `src/core/index.ts`
2. **Adding a new provider:** Extend `Provider`, add to `src/providers/`, register in `getProviderByType.ts`
3. **Adding a new environment:** Extend `Environment`, add to `src/core/environments/`, export from core index
4. **Changing shared types:** Update `src/shared/types/` and verify all consumers still type-check
5. **Always run `bun run lint` and `bun run build` before committing**

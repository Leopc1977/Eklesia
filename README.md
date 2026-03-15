# Eklesia

> ⚠️ Work in progress. Use at your own risk :)
> 📝 This README is temporary and subject to change.

Eklesia was originally conceived as a **TypeScript rewrite of [ChatArena](https://github.com/Farama-Foundation/chatarena)** by the [Farama Foundation](https://github.com/Farama-Foundation), which defines multi-agent environments using Arena, Environment, Backend and Player abstractions. However, Eklesia already diverges by introducing an explicit **Orchestrator** layer, an architectural component that coordinates agents, environments, and interaction flows, making the system more modular and backend-agnostic.

---

## Origin & Differences

- **Origin**: Inspired by [ChatArena](https://github.com/Farama-Foundation/chatarena) (Python, multi-agent language game framework) and rewritten in TypeScript.
- **Key architectural differences**:
  - Introduction of an explicit **Orchestrator** to manage interactions between agents and environments.
  - Backend-agnostic design (compatibility with Elysia, Next.js, Bun, etc.).
  - Extensible support for not just chat but also games and other interaction paradigms.

---

## Features

- **Multi-Agent Orchestration**: Easily manage multiple AI agents in the same environment.  
- **Simulated Environments**: Build or plug in different environments (chat, games, arenas…).  
- **Backend Agnostic**: Works with Elysia, Next.js, local setups, or any transport layer.  
- **Extensible**: Add new agents, environments, or interaction patterns effortlessly.  

---

## Installation

```bash
bun install eklesia
```

---

### Quick Start

**Install:**

```bash
bun install eklesia
```

**Set your API key:**

```bash
export API_KEY=your_api_key_here
```

**Run a two-agent conversation:**

```typescript
import { Arena, Agent, ConversationEnvironment, Orchestrator } from "eklesia";
import { OpenAIGenericProvider } from "eklesia/providers";

const provider = new OpenAIGenericProvider(
  "gpt-4o-mini",
  "https://api.openai.com/v1/chat/completions",
  process.env.API_KEY,
);

const alice = new Agent(
  "Alice",
  "You are a helpful assistant who explains things clearly.",
  provider,
);

const bob = new Agent(
  "Bob",
  "You are a skeptical reviewer who challenges assumptions.",
  provider,
);

const environment = new ConversationEnvironment(
  "Alice and Bob are debating the pros and cons of microservices architecture.",
);

const orchestrator = new Orchestrator(environment);

const arena = new Arena([alice, bob], orchestrator, environment);

await arena.run(10); // run for up to 10 steps
```

**Or load from a JSON config:**

```typescript
import { Arena } from "eklesia";
import { readFileSync } from "fs";

const config = readFileSync("./my-arena-config.json", "utf8");
const arena = await Arena.loadConfigJSON(config);
await arena.run(20);
```

See [`examples/`](./examples/) for more complete scenarios including config-driven setups and multi-agent boards.

---

### Examples

- Chat Arena: Multi-agent conversation simulation.

- Game Arena: Turn-based or real-time interactions between agents.

- Custom Environments: Plug your own environment logic with ease.

---

### Contributing

Pull requests are welcome! Feel free to open issues for bugs, feature requests, or questions.

---

### Authors

- **Leopc1977** – *Initial work* – [GitHub](https://github.com/Leopc1977) – Discord: [Leopc1977](https://discordapp.com/users/399631094514843669)

---

### Acknowledgments

- Inspired by:
  - [ChatArena](https://github.com/Farama-Foundation/chatarena) by [Farama Foundation](https://github.com/Farama-Foundation)
  - [House](https://github.com/sausheong/house) by [sausheong](https://github.com/sausheong)
  - [game_arena](https://github.com/google-deepmind/game_arena) by [Google DeepMind](https://github.com/google-deepmind)

- Special thanks to the AI & dev communities for ideas and feedback.

---

### License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details

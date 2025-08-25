// Run this script from the same directory

import { Agent, Arena, OpenAIGenericProvider, User, ConversationEnvironment, TerminalInputProvider, ConversationOrchestrator } from "../src"; // TODO change to dist

const configPath = "./configs/rock-paper-scissors.json";

const arena = await Arena.loadConfig(configPath, "deepseek-llm-7b-chat.Q4_K_M");

arena.run(100);

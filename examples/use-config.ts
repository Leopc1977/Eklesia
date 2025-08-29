// Run this script from the same directory

import { Arena } from "../dist"; // TODO change to dist

const configPath = "./configs/rock-paper-scissors.json";

const arena = await Arena.loadConfig(configPath, "deepseek-llm-7b-chat.Q4_K_M");
arena.run(100);

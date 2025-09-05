// Run this script from the same directory

import { Arena } from "../src";

const configPath = "./configs/rock-paper-scissors.json";

const arena = await Arena.loadConfig(configPath);
arena.run(100);

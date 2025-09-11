// Run this script from the same directory
import fs from "fs";
import { Arena } from "../dist/index.mjs";

const configPath = "./configs/rock-paper-scissors.json";

const arena = await Arena.loadConfig(
    fs.readFileSync(configPath, "utf-8")
);
arena.run(100);

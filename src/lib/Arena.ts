import { getFile } from "../utils/getFile";
import { Moderator } from "./Agents";
import Agent from "./Agents/Agent";
import { ConversationEnvironment } from "./Environments";
import Environment from "./Environments/Environment";
import Orchestrator from "./Orchestrators/Orchestrator";
import { getProviderByType } from "./Providers";

export default class Arena <
  GenericAgent extends Agent = Agent,
  GenericOrchestrator extends Orchestrator = Orchestrator,
  GenericEnvironment extends Environment = Environment
> {
  agents: Array<GenericAgent>;
  orchestrator: GenericOrchestrator;
  environment: GenericEnvironment;

  constructor(
    agents: Array<GenericAgent>,
    orchestrator: GenericOrchestrator,
    environment: GenericEnvironment,
  ) {
    this.agents = agents;
    this.orchestrator = orchestrator;
    this.environment = environment;
  }

  reset() {
    
  }

  static async loadConfig(
    path: string, 
  ) : Promise<Arena> {
    if (!this.loadConfig) {
      throw new Error(``);
    }

    const file = getFile(path);
    const config = await file.json();

    const agents: Array<Agent> = config.agents.map((agentConfig: any) => {
      const provider = getProviderByType(
        agentConfig.provider.type,
        agentConfig.provider.model,
        `http://127.0.0.1:8081/v1/chat/completions`,
        agentConfig.provider.temperature,
        agentConfig.provider.max_tokens,
      );

      if (!provider) { throw new Error(`Provider type ${agentConfig.provider.type} not found or not supported`) }

      return new Agent(
        agentConfig.name,
        agentConfig.role_desc,
        provider,
      );
    });

    const SelectedOrchestrator = Orchestrator; // TODO: creer un switch based sur le type turn;

    const SelectedEnvironment = config.environment.type === "conversation"
      ? ConversationEnvironment
      : Environment;

    const terminalSentences = typeof config.environment.moderator.terminal_sentences
      === "string"
      ? [config.environment.moderator.terminal_sentences]
      : config.environment.moderator.terminal_sentences;

    const environment = new SelectedEnvironment(
      config.global_prompt,
      new Moderator(
        config.environment.moderator.role_desc,
        config.environment.moderator.terminal_condition,
        terminalSentences,
        config.environment.moderator.period,
        getProviderByType(
          config.environment.moderator.provider.type,
          config.environment.moderator.provider.model,
          `http://127.0.0.1:8081/v1/chat/completions`,
          config.environment.moderator.temperature,
          config.environment.moderator.max_tokens,
        ),
      )
    );

    const orchestrator = new SelectedOrchestrator (
      environment,
    );

    return new Arena<Agent, typeof orchestrator, typeof environment>(
      agents,
      orchestrator,
      environment,
    );
  }

  async run (maxSteps: number = 100) {
    for (let i = 0; i < maxSteps; i++) {
      const isTerminal = await this.orchestrator.step(
        this.agents,
      );

      if (isTerminal)
        break;
    }
  }
}

import Agent from "../agents/Agent";
import Environment from "../environments/Environment";

export default class Orchestrator<
  GenericEnvironment extends Environment = Environment
> {
  protected currentAgentIndex: number = 0;
  environment: GenericEnvironment;

  constructor(
    environment: GenericEnvironment,
  ) {
    this.environment = environment;
  }

  async step(
    agents: Array<Agent>,
  ) : Promise<boolean> {
    if (agents.length === 0) return false;

    const currentAgent = agents[this.currentAgentIndex % agents.length];
    if (!currentAgent) {
      throw new Error(`No agent found at index ${this.currentAgentIndex % agents.length}`);
    }
    const observation = this.environment.getObservation(currentAgent.agentName);
    if (!observation) {
      throw new Error(`No observation available for agent "${currentAgent.agentName}"`);
    }

    const action = await currentAgent.act(
      observation, 
      this.environment.description
    );

    console.log(action)

    this.environment.addMessage(currentAgent.agentName, action)

    const endingRound = this.currentAgentIndex % agents.length && this.currentAgentIndex > 0;
    const isTerminal = await this.environment.isTerminal(endingRound);

    this.currentAgentIndex = (this.currentAgentIndex + 1);

    return isTerminal;
  }
}

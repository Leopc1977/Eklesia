import { Moderator } from "../Agents";
import Agent from "../Agents/Agent";
import Environment from "../Environments/Environment";

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
    const observation = this.environment.getObservation(
      // currentAgent.agentName
      null,
    );

    if (!observation || !currentAgent) return false; // TODO: cleaner
 
    const action = await currentAgent.act(
      observation, 
      this.environment.description
    );
  
    const isTerminal = await this.environment.isTerminal(
      this.currentAgentIndex % agents.length && this.currentAgentIndex > 0,
    );
  
    this.environment.addMessage(currentAgent.agentName, action)
    this.currentAgentIndex = (this.currentAgentIndex + 1);
    return isTerminal;
  }
}

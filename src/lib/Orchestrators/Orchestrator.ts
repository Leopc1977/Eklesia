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
    if (!currentAgent) {
      // TODO: Error handling
      return false;
    }
    const observation = this.environment.getObservation(currentAgent.agentName);
    if (!observation) {
      // TODO: Error handling
      return false;
    }
    const action = await currentAgent.act(
      observation, 
      this.environment.description
    );

    // if (action.includes(SIGNAL_END_OF_CONVERSATION)) {
    //   return true;
    // }
    
    this.environment.addMessage(currentAgent.agentName, action)

    const endingRound = this.currentAgentIndex % agents.length && this.currentAgentIndex > 0;
    const isTerminal = await this.environment.isTerminal(endingRound);

    this.currentAgentIndex = (this.currentAgentIndex + 1);

    return isTerminal;
  }
}

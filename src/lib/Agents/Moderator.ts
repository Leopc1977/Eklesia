import Agent from "./Agent";
import Provider from "../Providers";

export default class ModeratorUser extends Agent {
  terminalConditionPrompt: string;
  terminalSentence: string;
  period: string;

  constructor(
    roleDesc: string,
    terminalConditionPrompt: string,
    terminalSentence: string,
    period: string,
    provider: Provider,
  ) {
    super("Moderator", roleDesc, provider);

    this.terminalConditionPrompt = terminalConditionPrompt;
    this.terminalSentence = terminalSentence;
    this.period = period;
  }
}

import Agent from "./Agent";
import Provider from "../Providers";

export default class ModeratorUser extends Agent {
  terminalConditionPrompt: string;
  terminalSentences:  Array<string>;
  period: string;

  constructor(
    roleDesc: string,
    terminalConditionPrompt: string,
    terminalSentences: Array<string>,
    period: string,
    provider: Provider,
  ) {
    super("Moderator", roleDesc, provider);

    this.terminalConditionPrompt = terminalConditionPrompt;
    this.terminalSentences = terminalSentences;
    this.period = period;
  }
}

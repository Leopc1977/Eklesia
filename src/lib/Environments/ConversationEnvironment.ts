import Environment from "./Environment";
import { Message } from "../types";
import { Moderator } from "../Agents";

export default class ConversationEnvironment extends Environment {
  messages: Array<Message> = [];
  nextAgentIdx = 0;

  constructor(
    description: string,
    moderator: Moderator | null = null,
  ) {
    super(description, moderator);
  }

  addMessage(agentName: string, content: string) {
    const newMessage: Message = { role: agentName, content: content };
    this.messages.push(newMessage);
  }

  print() {
    console.log(this.messages);
  }

  getObservation(
    agentName: string | null = null
  ) : Array<Message> {
    if (agentName === null) return this.messages;
    return this.messages.filter(m => m.role === agentName);
  }

  async isTerminal(
    beforeNewRound: boolean
  ) {
    if (this.moderator !== null 
      && (
        this.moderator.period === "turn" 
        || this.moderator.period === "round" && beforeNewRound
      )
    ) {
      this.print()
      const response: string = await this.moderator.act(
        this.getObservation(null),
        this.moderator.terminalConditionPrompt
      );

      for (const terminalSentence of this.moderator.terminalSentences) {
        if (response.includes(terminalSentence)) {
          return true;
        }
      }
    }

    return false;
  }
}

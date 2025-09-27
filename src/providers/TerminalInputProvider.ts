import Provider from "./Provider";
import { Message } from "../shared/types";

export default class TerminalInputProvider extends Provider {
  constructor() {
    super();
  }

  async query(
    _messages: Array<Message>,
    _temperature: number
  ): Promise<any> {
    const input = prompt("user: ");

    return {
      choices: [
        {
          message: {
            role: "user",
            content: input
          }
        }
      ]
    };
  }
}

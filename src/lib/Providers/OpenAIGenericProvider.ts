import Provider from "./Provider";
import { Message } from "../types";
export default class OpenAIGenericProvider extends Provider {

  endpointUrl: string;
  model: string;
  apiKey: string;

  constructor(
    model:string, 
    endpointUrl: string, 
    apiKey: string,
    temperature?: number,
    max_tokens?: number,
  ) {
      super(temperature, max_tokens);

      this.model = model;
      this.endpointUrl = endpointUrl;
      this.apiKey = apiKey;
  }

  async query(
    messages: Array<Message>
  ): Promise<any> {
    const res = await fetch(this.endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature: this.temperature,
        messages: messages,
      })
    });

    const data = await res.json();

    return data;
  }
}

import Provider from "./Provider";
import { Message } from "../shared/types";

export default class OpenAIGenericProvider extends Provider {

  endpointUrl: string;
  model: string;

  constructor(
    model:string, 
    endpointUrl: string, 
    temperature?: number,
    max_tokens?: number,
  ) {
      super(temperature, max_tokens);

      this.model = model;
      this.endpointUrl = endpointUrl;
  }

  // async query(
  //   messages: Array<Message>
  // ): Promise<any> {
  //   const res = await fetch(this.endpointUrl, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //       model: this.model,
  //       temperature: this.temperature,
  //       messages: messages,
  //     })
  //   });
  
  //   const data = await res.json();
  //   return data;
  // }

  async query(messages: Array<Message>): Promise<any> {
    const res = await fetch(this.endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        temperature: this.temperature,
        messages: messages,
        stream: true // ⚡ important pour activer le streaming
      }),
    });
  
    if (!res.body) throw new Error("Pas de body dans la réponse");
  
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      const chunk = decoder.decode(value, { stream: true });
  
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
  
          try {
            const parsed = JSON.parse(data);
            const token = parsed.content ?? parsed.token ?? "";
            if (token) {
              process.stdout.write(token); // affiche direct dans la console
              fullText += token;
            }
          } catch {
            // ignore si ce n'est pas du JSON
          }
        }
      }
    }
  
    return fullText;
  }  
}

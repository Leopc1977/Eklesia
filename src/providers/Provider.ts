import {ChatCompletionResponse, Message} from "../shared/types";

const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKEN = 300

export default class Provider {
    temperature: number;
    max_tokens: number;

    constructor(
        temperature: number = DEFAULT_TEMPERATURE,
        max_tokens: number = DEFAULT_MAX_TOKEN,
    ) {
        this.temperature = temperature;
        this.max_tokens = max_tokens;
    }

    async query(
        _messages: Array<Message>,
        _temperature: number = this.temperature
    ) : Promise<ChatCompletionResponse> {
        throw new Error("Method not implemented.");
    };  
}

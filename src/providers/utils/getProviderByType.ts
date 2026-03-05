import OpenAIGenericProvider from "../OpenAIGenericProvider";

export default function getProviderByType(
    type: string,
    model: string,
    endpointUrl: string,
    apiKey: string,
    temperature?: number,
    max_tokens?: number,
) {
    if (type === "openai-chat") 
        return new OpenAIGenericProvider(
            model, endpointUrl, apiKey, temperature, max_tokens
        )

    throw new Error(`Provider type ${type} not found or not supported`)
}

export const SIGNAL_END_OF_CONVERSATION = `<<<<<<END_OF_CONVERSATION>>>>>>`;
export const END_OF_MESSAGE = "<EOS>"  // End of message token specified by us not OpenAI
export const STOP = ("<|endoftext|>", END_OF_MESSAGE)  // End of sentence token
export const BASE_PROMPT = ``
export const SYSTEM_NAME = "system"
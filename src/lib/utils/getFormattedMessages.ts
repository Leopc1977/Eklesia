import { Message } from "../types";

export default function getFormattedMessages(
    environmentDescription: string,
    agentName: string,
    roleDesc: string,
    requestMsg: Message | null,
    historyMessages: Array<Message>,
    mergeOtherAgentAsUser: boolean,
    SYSTEM_NAME: string,
    BASE_PROMPT: string,
    END_OF_MESSAGE: string,
) : Array<Message> {
  const systemPrompt = environmentDescription
    ? `You are a helpful assistant.\n${environmentDescription.trim()}\n${BASE_PROMPT}\n\nYour name is ${agentName}.\n\nYour role:${roleDesc}`
    : `You are a helpful assistant. Your name is ${agentName}.\n\nYour role:${roleDesc}\n\n${BASE_PROMPT}`;

  let allMessages: Array<Message> = [{role: SYSTEM_NAME, content: systemPrompt}]

  // Useless code, TODO: remove it ?
  historyMessages.forEach((msg: Message) => {
    if (msg.role == SYSTEM_NAME) {
      allMessages.push(msg)
    } else {
      allMessages.push({
        role: msg.role,
        content: `${msg.content}`,
      })
    }
  })

  if (requestMsg) allMessages.push({role: SYSTEM_NAME, content: requestMsg.content});
  else allMessages.push(
      { role: SYSTEM_NAME, content: `Now you speak.${END_OF_MESSAGE }`}
  );

  const messages: Array<Message> = [];

  allMessages.forEach((msg) => {
    if (msg.role === SYSTEM_NAME) {
      messages.push({ role: "system", content: msg.content });
    } else if (msg.role === agentName) {
      messages.push({ role: "assistant", content: msg.content });
    } else {
      let lastMsg = messages[messages.length - 1];

      if (lastMsg && lastMsg.role === "user") {
        if (mergeOtherAgentAsUser) {
          lastMsg.content = `${lastMsg.content}\n\n[${msg.role}]: ${msg.content}`;
        } else {
          messages.push({ role: "user", content: `[${msg.role}]: ${msg.content}` });
        }
      } else if (lastMsg && lastMsg.role === "assistant") {
        lastMsg.content = `${lastMsg.content}\n${msg.content}`;
      } else if (lastMsg && lastMsg.role === "system") {
        messages.push({ role: "user", content: `[${msg.role}]: ${msg.content}` });
      } else {
        throw new Error(`Invalid role: ${lastMsg ? lastMsg.role : "undefined"}`);
      }
    }
  });

  console.log(messages);

  return messages;
}

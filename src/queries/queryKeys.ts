export const queryKeys = {
  chats: ["chats"] as const,
  chat: (chatId: string) => ["chats", chatId] as const,
  messages: (chatId: string) => ["chats", chatId, "messages"] as const,
  run: (chatId: string, runId: string) =>
    ["chats", chatId, "runs", runId] as const,
  realtimeToken: (runId: string) => ["runs", runId, "realtime-token"] as const,
  waitpoint: (runId: string) => ["runs", runId, "waitpoint"] as const,
  credits: ["credits", "balance"] as const,
  creditLedger: ["credits", "ledger"] as const,
};

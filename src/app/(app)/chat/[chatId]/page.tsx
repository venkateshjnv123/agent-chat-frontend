import { notFound } from "next/navigation";

import { ChatRoute } from "@/components/chat/ChatRoute";

export default async function ChatPage({
  params,
}: Readonly<{ params: Promise<{ chatId: string }> }>) {
  const { chatId } = await params;

  if (chatId.trim().length === 0 || chatId.length > 128) notFound();

  return <ChatRoute chatId={chatId} />;
}

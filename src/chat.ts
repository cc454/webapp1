import { ChatThread, Message } from './types';
import { uid } from './dates';
export function appendExchange(threads: ChatThread[], id: string | null, question: string, reply: string, now = new Date().toISOString()) {
  const previous = threads.find(t => t.id === id);
  const messages: Message[] = [...(previous?.messages ?? []), { role: 'user', content: question, at: now }, { role: 'assistant', content: reply, at: now }];
  const thread: ChatThread = { id: previous?.id ?? uid(), title: previous?.title ?? question.slice(0, 60), updatedAt: now, messages };
  return { thread, threads: [thread, ...threads.filter(t => t.id !== thread.id)].slice(0, 10) };
}

import { appendExchange } from '../src/chat';
import { ChatThread } from '../src/types';
describe('AT-25: conversation retention', () => {
  it('keeps ten threads, resumes history, and orders by recent use', () => {
    let threads: ChatThread[] = [];
    for (let i = 0; i < 11; i++) threads = appendExchange(threads, null, `Question ${i}`, `Reply ${i}`).threads;
    expect(threads).toHaveLength(10); expect(threads.some(t => t.title === 'Question 0')).toBe(false);
    const id = threads[9]!.id; const result = appendExchange(threads, id, 'Again', 'Answer');
    expect(result.threads[0]!.id).toBe(id); expect(result.thread.messages).toHaveLength(4); expect(result.threads).toHaveLength(10);
  });
});

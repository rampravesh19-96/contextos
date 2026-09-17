import { ChatController } from './chat.controller';

describe('ChatController conversation history', () => {
  it('returns persisted messages only for the authenticated workspace conversation', async () => {
    const persisted = {
      id: 'c1',
      workspaceId: 'w1',
      userId: 'u1',
      messages: [
        { id: 'm1', role: 'USER', content: 'Question' },
        { id: 'm2', role: 'ASSISTANT', content: 'Answer' },
      ],
    };
    const prisma = { conversation: { findFirstOrThrow: jest.fn().mockResolvedValue(persisted) } };
    const controller = new ChatController(
      prisma as any,
      { assertMember: jest.fn().mockResolvedValue({}) } as any,
      {} as any,
    );
    const result = await controller.detail({ id: 'u1' } as any, 'w1', 'c1');
    expect(result.messages).toHaveLength(2);
    expect(prisma.conversation.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'c1', workspaceId: 'w1', userId: 'u1' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  });
});

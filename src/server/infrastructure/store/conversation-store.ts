import type { ChatConversation, ChatMessage } from "@/server/domain/chat";
import { getDataSource } from "@/server/infrastructure/database/data-source";
import { ConversationEntity } from "@/server/infrastructure/database/entities/conversation.entity";
import { MessageEntity } from "@/server/infrastructure/database/entities/message.entity";

export async function getConversation(
  conversationId: string,
): Promise<ChatConversation | null> {
  const dataSource = await getDataSource();
  const conversationRepo = dataSource.getRepository(ConversationEntity);

  const entity = await conversationRepo.findOne({
    where: { conversationId },
    relations: ["messages"],
  });

  if (!entity) {
    return null;
  }

  return {
    conversationId: entity.conversationId,
    messages: entity.messages
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export async function listConversations(): Promise<ChatConversation[]> {
  const dataSource = await getDataSource();
  const conversationRepo = dataSource.getRepository(ConversationEntity);

  const entities = await conversationRepo.find({
    relations: ["messages"],
    order: { updatedAt: "DESC" },
  });

  return entities.map((entity) => ({
    conversationId: entity.conversationId,
    messages: entity.messages
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
    updatedAt: entity.updatedAt.toISOString(),
  }));
}

export async function saveConversation(
  conversation: ChatConversation,
): Promise<ChatConversation> {
  const dataSource = await getDataSource();
  const conversationRepo = dataSource.getRepository(ConversationEntity);

  const entity = conversationRepo.create({
    conversationId: conversation.conversationId,
    messages: conversation.messages.map((msg) =>
      dataSource.getRepository(MessageEntity).create({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        conversationId: conversation.conversationId,
      }),
    ),
  });

  await conversationRepo.save(entity);
  return conversation;
}

export async function appendConversationMessage(
  conversationId: string,
  message: ChatMessage,
): Promise<ChatConversation> {
  const dataSource = await getDataSource();
  const messageRepo = dataSource.getRepository(MessageEntity);
  const conversationRepo = dataSource.getRepository(ConversationEntity);

  const messageEntity = messageRepo.create({
    id: message.id,
    role: message.role,
    content: message.content,
    conversationId,
  });

  await messageRepo.save(messageEntity);
  await conversationRepo.update({ conversationId }, { updatedAt: new Date() });

  const updated = await getConversation(conversationId);
  if (!updated) {
    throw new Error(`Conversation ${conversationId} not found after append`);
  }

  return updated;
}

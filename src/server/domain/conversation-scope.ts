export function conversationPrefix(userId: string) {
  return `u_${userId}__`;
}

export function belongsToUser(userId: string, conversationId: string) {
  return conversationId.startsWith(conversationPrefix(userId));
}


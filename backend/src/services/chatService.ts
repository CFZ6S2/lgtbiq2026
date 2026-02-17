import { db } from '../lib/firebase';

export const sendMessage = async (senderId: string, receiverId: string, content: string, type: 'text' | 'image' | 'location') => {
  const chatId = [senderId, receiverId].sort().join('_');
  const messageData = {
    senderId,
    receiverId,
    content,
    type,
    timestamp: new Date().toISOString(),
    read: false
  };

  const messagesRef = db.collection('chats').doc(chatId).collection('messages');
  const docRef = await messagesRef.add(messageData);

  const chatRef = db.collection('chats').doc(chatId);
  await chatRef.set(
    {
      participants: [senderId, receiverId],
      lastMessage: content,
      lastMessageTime: messageData.timestamp,
      updatedAt: messageData.timestamp
    },
    { merge: true }
  );

  return { id: docRef.id, ...messageData };
};

export const getMessages = async (userId: string, otherUserId: string, limit = 50) => {
  const chatId = [userId, otherUserId].sort().join('_');
  const snapshot = await db
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return messages.reverse();
};

export const getConversations = async (userId: string) => {
  const snapshot = await db.collection('chats').where('participants', 'array-contains', userId).get();
  const conversations: any[] = [];
  for (const doc of snapshot.docs) {
    const chatData: any = doc.data();
    const otherUserId = (chatData['participants'] || []).find((id: string) => id !== userId);
    const userDoc = await db.collection('users').doc(otherUserId).get();
    const otherUser: any = userDoc.exists ? userDoc.data() : null;
    conversations.push({
      chatId: doc.id,
      otherUser: {
        id: otherUserId,
        name: otherUser?.['name'] || 'Usuario',
        photo: otherUser?.['photos']?.['profile'] || null
      },
      lastMessage: chatData['lastMessage'],
      lastMessageTime: chatData['lastMessageTime'],
      unreadCount: 0
    });
  }
  conversations.sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );
  return conversations;
};

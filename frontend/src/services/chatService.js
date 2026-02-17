import { database as db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

class ChatService {
  constructor() {
    this.unsubscribers = new Map();
  }

  /**
   * Enviar un mensaje
   */
  async sendMessage(currentUserId, recipientId, content, messageType = 'TEXT') {
    try {
      // Crear referencia al chat único entre dos usuarios
      const chatId = this.generateChatId(currentUserId, recipientId);
      const chatRef = doc(db, 'chats', chatId);
      
      // Crear el mensaje
      const messageData = {
        senderId: currentUserId,
        recipientId,
        content,
        messageType,
        timestamp: serverTimestamp(),
        read: false
      };

      // Agregar mensaje a la subcolección
      const messagesRef = collection(chatRef, 'messages');
      const docRef = await addDoc(messagesRef, messageData);
      
      // Actualizar último mensaje en el documento del chat
      await updateDoc(chatRef, {
        lastMessage: content,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: currentUserId,
        participants: [currentUserId, recipientId]
      });

      return { success: true, messageId: docRef.id };
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener historial de mensajes entre dos usuarios
   */
  async getChatHistory(currentUserId, otherUserId, limitCount = 50) {
    try {
      const chatId = this.generateChatId(currentUserId, otherUserId);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordenar cronológicamente
      messages.reverse();
      
      return { success: true, messages };
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Suscribirse a mensajes en tiempo real
   */
  subscribeToMessages(currentUserId, otherUserId, callback) {
    const chatId = this.generateChatId(currentUserId, otherUserId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    // Cancelar suscripción anterior si existe
    this.unsubscribeFromMessages(chatId);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Ordenar cronológicamente
      messages.reverse();
      callback(messages);
    }, (error) => {
      console.error('Error en suscripción de mensajes:', error);
    });

    // Guardar referencia para poder cancelar después
    this.unsubscribers.set(chatId, unsubscribe);

    return () => this.unsubscribeFromMessages(chatId);
  }

  /**
   * Cancelar suscripción a mensajes
   */
  unsubscribeFromMessages(chatId) {
    const unsubscribe = this.unsubscribers.get(chatId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(chatId);
    }
  }

  /**
   * Marcar mensajes como leídos
   */
  async markMessagesAsRead(currentUserId, otherUserId) {
    try {
      const chatId = this.generateChatId(currentUserId, otherUserId);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      const q = query(
        messagesRef,
        where('senderId', '==', otherUserId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = [];

      querySnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, { read: true })
        );
      });

      await Promise.all(updatePromises);
      return { success: true };
    } catch (error) {
      console.error('Error al marcar como leído:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener lista de chats del usuario
   */
  async getUserChats(userId) {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTimestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const chats = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const otherParticipantId = data.participants.find(p => p !== userId);
        
        chats.push({
          id: doc.id,
          otherUserId: otherParticipantId,
          lastMessage: data.lastMessage,
          lastMessageTimestamp: data.lastMessageTimestamp,
          lastMessageSenderId: data.lastMessageSenderId
        });
      });

      return { success: true, chats };
    } catch (error) {
      console.error('Error al obtener chats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Suscribirse a lista de chats en tiempo real
   */
  subscribeToUserChats(userId, callback) {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chats = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const otherParticipantId = data.participants.find(p => p !== userId);
        
        chats.push({
          id: doc.id,
          otherUserId: otherParticipantId,
          lastMessage: data.lastMessage,
          lastMessageTimestamp: data.lastMessageTimestamp,
          lastMessageSenderId: data.lastMessageSenderId
        });
      });
      callback(chats);
    }, (error) => {
      console.error('Error en suscripción de chats:', error);
    });

    return unsubscribe;
  }

  /**
   * Eliminar un mensaje
   */
  async deleteMessage(chatId, messageId, userId) {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      
      // Verificar que el usuario sea el remitente
      const messageDoc = await getDocs(query(collection(db, 'chats', chatId, 'messages'), where('__name__', '==', messageId)));
      if (messageDoc.empty) {
        return { success: false, error: 'Mensaje no encontrado' };
      }
      
      const messageData = messageDoc.docs[0].data();
      if (messageData.senderId !== userId) {
        return { success: false, error: 'No autorizado' };
      }

      await deleteDoc(messageRef);
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar ID único para chat entre dos usuarios
   * Siempre genera el mismo ID independientemente del orden
   */
  generateChatId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Limpiar todas las suscripciones activas
   */
  cleanup() {
    this.unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribers.clear();
  }
}

// Exportar instancia única
export const chatService = new ChatService();
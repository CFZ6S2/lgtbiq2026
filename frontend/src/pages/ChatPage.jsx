import React, { useState, useEffect } from 'react';
import { Send, Circle, MessageCircle } from 'lucide-react';
import { chatService } from '../services/chatService';
import { auth } from '../firebase';

const mockConversations = [
  {
    id: '1',
    otherUser: {
      id: '2',
      name: 'Alex',
      photo: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20friendly%20LGBTQ%20person%20avatar%2C%20colorful%20background%2C%20professional%20headshot&image_size=square'
    },
    lastMessage: '¡Hola! ¿Cómo estás?',
    lastMessageTime: '2024-01-15T10:30:00Z',
    unreadCount: 2
  },
  {
    id: '2',
    otherUser: {
      id: '3',
      name: 'Sam',
      photo: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20creative%20LGBTQ%20artist%20avatar%2C%20artistic%20style%2C%20vibrant%20colors&image_size=square'
    },
    lastMessage: 'Me encantaría conocerte mejor 😊',
    lastMessageTime: '2024-01-14T18:45:00Z',
    unreadCount: 0
  }
];

export default function ChatPage() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar conversaciones al montar el componente
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // En una implementación real, esto vendría del backend
      // const convs = await chatService.getConversations();
      // setConversations(convs);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    
    try {
      const currentUserId = auth.currentUser?.uid || 'current-user';
      const history = await chatService.getChatHistory(currentUserId, chat.otherUser.id);
      if (history.success) {
        setMessages(history.messages);
      }
      
      // Suscribirse a nuevos mensajes en tiempo real
      const unsubscribe = chatService.subscribeToMessages(currentUserId, chat.otherUser.id, (newMessages) => {
        setMessages(newMessages);
      });

      // Cleanup al cambiar de chat
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      // Usar mensajes mock para demo
      setMessages([
        {
          id: '1',
          senderId: chat.otherUser.id,
          content: '¡Hola! ¿Cómo estás?',
          timestamp: '2024-01-15T10:30:00Z',
          type: 'text'
        },
        {
          id: '2',
          senderId: 'current-user',
          content: '¡Hola Alex! Muy bien, ¿y tú?',
          timestamp: '2024-01-15T10:32:00Z',
          type: 'text'
        }
      ]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setLoading(true);
    
    try {
      const currentUserId = auth.currentUser?.uid || 'current-user';
      await chatService.sendMessage(currentUserId, selectedChat.otherUser.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Para demo, agregar mensaje localmente
      const tempMessage = {
        id: Date.now().toString(),
        senderId: auth.currentUser?.uid || 'current-user',
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedChat) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header del chat */}
        <div className="bg-purple-600 text-white p-4 flex items-center gap-4">
          <button
            onClick={() => setSelectedChat(null)}
            className="text-white hover:text-gray-200"
          >
            ← Volver
          </button>
          
          <img
            src={selectedChat.otherUser.photo}
            alt={selectedChat.otherUser.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          
          <div>
            <h3 className="font-semibold">{selectedChat.otherUser.name}</h3>
            <div className="flex items-center gap-1 text-sm">
              <Circle className="w-2 h-2 fill-current text-green-400" />
              <span>En línea</span>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                (message.senderId === (auth.currentUser?.uid || 'current-user')) ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  (message.senderId === (auth.currentUser?.uid || 'current-user'))
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p>{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === 'current-user'
                      ? 'text-purple-200'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input de mensaje */}
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mensajes</h1>
        
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Aún no tienes conversaciones
            </h3>
            <p className="text-gray-500">
              ¡Haz match con alguien para comenzar a chatear!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectChat(conversation)}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={conversation.otherUser.photo}
                      alt={conversation.otherUser.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {conversation.otherUser.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.lastMessageTime).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

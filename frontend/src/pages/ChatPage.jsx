import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Phone, Video } from 'lucide-react';
import { firebaseAPI } from '../firebase';

const ChatPage = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Mock user data based on ID (in real app, fetch from API)
  const chatUser = {
    id: id,
    displayName: id === '1' ? 'Alex' : 'Sam',
    photoURL: id === '1' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    status: 'En línea'
  };

  useEffect(() => {
    // Simulate fetching messages
    setTimeout(() => {
      setMessages([
        { id: 1, text: 'Hola! Qué tal?', sender: 'them', timestamp: '10:00' },
        { id: 2, text: 'Todo bien, y tú?', sender: 'me', timestamp: '10:05' },
        { id: 3, text: 'Bien también, gracias por preguntar.', sender: 'them', timestamp: '10:06' },
      ]);
      setLoading(false);
    }, 500);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, message]);
    setNewMessage('');
    
    // Simulate reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: '¡Genial!',
        sender: 'them',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/app/matches" className="p-2 -ml-2 hover:bg-gray-700 rounded-full text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <div className="relative">
            <img 
              src={chatUser.photoURL} 
              alt={chatUser.displayName} 
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800"></div>
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">{chatUser.displayName}</h2>
            <span className="text-xs text-green-400">{chatUser.status}</span>
          </div>
        </div>
        <div className="flex gap-2 text-purple-400">
          <button className="p-2 hover:bg-gray-700 rounded-full"><Phone size={20} /></button>
          <button className="p-2 hover:bg-gray-700 rounded-full"><Video size={20} /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                msg.sender === 'me' 
                  ? 'bg-purple-600 text-white rounded-br-none' 
                  : 'bg-gray-800 text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <span className={`text-[10px] block text-right mt-1 ${msg.sender === 'me' ? 'text-purple-200' : 'text-gray-500'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center gap-2 bg-gray-900 rounded-full px-4 py-2 border border-gray-700 focus-within:border-purple-500 transition-colors">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe un mensaje..." 
            className="flex-1 bg-transparent text-white outline-none text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

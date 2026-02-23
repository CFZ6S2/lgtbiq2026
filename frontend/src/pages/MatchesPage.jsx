import React, { useState, useEffect } from 'react';
import { firebaseAPI } from '../firebase';
import { Search, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const result = await firebaseAPI.getMatches();
        if (result.ok && result.matches) {
          setMatches(result.matches);
        } else {
          // Mock data for demo
          setMatches([
            { id: '1', displayName: 'Alex', photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', lastMessage: '¡Hola! ¿Cómo estás?', timestamp: '10:30' },
            { id: '2', displayName: 'Sam', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', lastMessage: 'Me encantó esa foto', timestamp: 'Ayer' },
          ]);
        }
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <h1 className="text-2xl font-bold text-white mb-4">Matches & Chats</h1>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        <input 
          type="text" 
          placeholder="Buscar conversaciones..." 
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-xl border border-gray-700 focus:border-purple-500 outline-none"
        />
      </div>

      {/* New Matches Row */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-purple-400 uppercase mb-3 tracking-wider">Nuevos Matches</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {matches.map((match) => (
            <Link to={`/app/chat/${match.id}`} key={match.id} className="flex flex-col items-center min-w-[70px]">
              <div className="w-16 h-16 rounded-full border-2 border-purple-500 p-0.5">
                <img 
                  src={match.photoURL} 
                  alt={match.displayName} 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-xs text-white mt-1 font-medium">{match.displayName}</span>
            </Link>
          ))}
          {matches.length === 0 && (
            <p className="text-gray-500 text-sm italic">No tienes nuevos matches aún.</p>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div>
        <h2 className="text-sm font-bold text-purple-400 uppercase mb-3 tracking-wider">Conversaciones</h2>
        <div className="space-y-2">
          {matches.map((chat) => (
            <Link 
              to={`/app/chat/${chat.id}`} 
              key={chat.id} 
              className="flex items-center gap-4 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
            >
              <div className="relative">
                <img 
                  src={chat.photoURL} 
                  alt={chat.displayName} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-white truncate">{chat.displayName}</h3>
                  <span className="text-xs text-gray-500">{chat.timestamp}</span>
                </div>
                <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
              </div>
            </Link>
          ))}
           {matches.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={32} className="text-gray-600" />
              </div>
              <p className="text-gray-500">No hay conversaciones activas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;

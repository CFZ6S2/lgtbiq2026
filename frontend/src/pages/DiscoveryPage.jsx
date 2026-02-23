import React, { useState, useEffect } from 'react';
import { firebaseAPI } from '../firebase';
import { Heart, X, Star, MapPin } from 'lucide-react';

const DiscoveryPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const result = await firebaseAPI.getRecommendations();
        if (result.ok && result.recs) {
          setCandidates(result.recs);
        } else {
          // Mock data if API fails or returns empty (for demo purposes)
          setCandidates([
            {
              id: '1',
              displayName: 'Alex',
              age: 25,
              bio: 'Amante de la fotografía y los viajes. 📸✈️',
              photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
              distanceKm: 3
            },
            {
              id: '2',
              displayName: 'Sam',
              age: 28,
              bio: 'Busco alguien para compartir café y libros. ☕📚',
              photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
              distanceKm: 5
            },
            {
              id: '3',
              displayName: 'Jamie',
              age: 24,
              bio: 'Gamer y tech enthusiast. 🎮💻',
              photoURL: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
              distanceKm: 12
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const handleSwipe = async (direction) => {
    if (currentIndex >= candidates.length) return;
    
    const candidate = candidates[currentIndex];
    setCurrentIndex(prev => prev + 1);

    if (direction === 'right') {
      try {
        await firebaseAPI.likeUser(candidate.id);
        console.log('Liked user:', candidate.id);
      } catch (error) {
        console.error('Error liking user:', error);
      }
    } else {
      console.log('Passed user:', candidate.id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (currentIndex >= candidates.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
        <div className="bg-gray-800 p-8 rounded-full mb-6">
          <Search size={48} className="text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No hay más perfiles</h2>
        <p className="text-gray-400">Vuelve más tarde para ver nuevas personas cerca de ti.</p>
      </div>
    );
  }

  const currentProfile = candidates[currentIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] px-4 py-4 max-w-md mx-auto relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Descubrir</h1>
        <div className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-300 flex items-center gap-1">
          <MapPin size={12} />
          {currentProfile.city || 'Cerca de ti'}
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 relative w-full mb-6">
        <div className="absolute inset-0 bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-700">
          {/* Image */}
          <div className="h-3/4 relative">
            <img 
              src={currentProfile.photoURL || 'https://via.placeholder.com/400x500'} 
              alt={currentProfile.displayName}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>
          
          {/* Info */}
          <div className="h-1/4 p-6 flex flex-col justify-center bg-gray-800">
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{currentProfile.displayName}</h2>
              <span className="text-xl text-gray-400">{currentProfile.age}</span>
            </div>
            <p className="text-gray-300 line-clamp-2 text-sm">
              {currentProfile.bio || 'Sin biografía...'}
            </p>
            {currentProfile.distanceKm && (
              <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
                <MapPin size={12} />
                <span>A {currentProfile.distanceKm} km de distancia</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-6 mb-4">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-gray-800 border border-red-500/30 text-red-500 flex items-center justify-center hover:bg-red-500/10 hover:scale-110 transition-all shadow-lg"
        >
          <X size={32} />
        </button>
        
        <button 
          className="w-12 h-12 rounded-full bg-gray-800 border border-blue-500/30 text-blue-400 flex items-center justify-center hover:bg-blue-500/10 hover:scale-110 transition-all shadow-lg mt-2"
        >
          <Star size={24} />
        </button>

        <button 
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-purple-500/30"
        >
          <Heart size={32} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

// Helper for empty state
import { Search } from 'lucide-react';

export default DiscoveryPage;

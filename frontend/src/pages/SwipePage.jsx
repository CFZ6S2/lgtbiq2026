import React, { useState, useEffect } from 'react';
import { Heart, X, Star, MapPin, Calendar } from 'lucide-react';

const mockUsers = [
  {
    id: 1,
    name: 'Alex',
    age: 26,
    location: 'Madrid, España',
    bio: 'Amante del cine indie y los cafés especiales. Buscando alguien con quien compartir risas y aventuras.',
    interests: ['Cine', 'Música', 'Viajes', 'Fotografía'],
    photo: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20friendly%20LGBTQ%20person%20with%20warm%20smile%2C%20diverse%20appearance%2C%20colorful%20background%2C%20professional%20portrait&image_size=square'
  },
  {
    id: 2,
    name: 'Sam',
    age: 24,
    location: 'Barcelona, España',
    bio: 'Artista y soñador. Me encanta pintar al atardecer y descubrir nuevos lugares en la ciudad.',
    interests: ['Arte', 'Pintura', 'Naturaleza', 'Yoga'],
    photo: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20creative%20LGBTQ%20artist%20with%20colorful%20style%2C%20artistic%20background%2C%20confident%20pose%2C%20vibrant%20colors&image_size=square'
  },
  {
    id: 3,
    name: 'Jordan',
    age: 28,
    location: 'Valencia, España',
    bio: 'Ingeniero de software y activista LGBTIQ+. Apasionado por la tecnología y los derechos humanos.',
    interests: ['Tecnología', 'Activismo', 'Libros', 'Cerveza artesanal'],
    photo: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20professional%20LGBTQ%20tech%20person%2C%20smart%20casual%20style%2C%20confident%20smile%2C%20modern%20office%20background&image_size=square'
  }
];

export default function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [users, setUsers] = useState(mockUsers);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const currentUser = users[currentIndex];

  const handleSwipe = (direction) => {
    setSwipeDirection(direction);
    
    setTimeout(() => {
      if (direction === 'right') {
        // Aquí iría la llamada al backend para registrar el like
        console.log('Like a:', currentUser.name);
      }
      
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      
      // Si llegamos al final, reiniciar
      if (currentIndex >= users.length - 1) {
        setTimeout(() => setCurrentIndex(0), 300);
      }
    }, 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handleSwipe('left');
    if (e.key === 'ArrowRight') handleSwipe('right');
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  if (currentIndex >= users.length) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <Heart className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Has visto a todos!
          </h2>
          <p className="text-gray-600">
            Vuelve más tarde para descubrir nuevas personas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Tarjeta de usuario */}
        <div 
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
            swipeDirection === 'left' ? '-translate-x-full rotate-12 opacity-0' :
            swipeDirection === 'right' ? 'translate-x-full -rotate-12 opacity-0' :
            'translate-x-0 rotate-0 opacity-100'
          }`}
        >
          {/* Imagen */}
          <div className="relative h-96">
            <img
              src={currentUser.photo}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Información */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-2xl font-bold mb-1">
                {currentUser.name}, {currentUser.age}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{currentUser.location}</span>
              </div>
              <p className="text-sm mb-3 line-clamp-2">{currentUser.bio}</p>
              
              {/* Intereses */}
              <div className="flex flex-wrap gap-2">
                {currentUser.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-6 mt-8">
          <button
            onClick={() => handleSwipe('left')}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={() => handleSwipe('right')}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <Heart className="w-8 h-8" />
          </button>

          <button
            onClick={() => handleSwipe('superlike')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <Star className="w-8 h-8" />
          </button>
        </div>

        {/* Indicador de progreso */}
        <div className="flex justify-center gap-2 mt-6">
          {users.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentIndex ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Instrucciones */}
        <div className="text-center mt-4 text-gray-600 text-sm">
          <p>Usa ← → para navegar o arrastra</p>
        </div>
      </div>
    </div>
  );
}

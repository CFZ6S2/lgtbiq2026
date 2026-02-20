import React, { useState, useEffect } from 'react';
import { MapPin, Users, Calendar, Navigation } from 'lucide-react';

const mockNearbyUsers = [
  {
    id: '4',
    name: 'María',
    age: 25,
    location: 'A 2.5 km',
    interests: ['Arte', 'Música'],
    photo: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20creative%20LGBTQ%20woman%20avatar%2C%20artistic%20style%2C%20warm%20colors%2C%20friendly%20expression&image_size=square',
    coordinates: { lat: 40.4168, lng: -3.7038 }
  },
  {
    id: '5',
    name: 'Carlos',
    age: 27,
    location: 'A 3.2 km',
    interests: ['Deportes', 'Cine'],
    photo: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20sporty%20LGBTQ%20man%20avatar%2C%20athletic%20style%2C%20confident%20pose%2C%20dynamic%20background&image_size=square',
    coordinates: { lat: 40.4268, lng: -3.7138 }
  }
];

const mockEvents = [
  {
    id: '1',
    name: 'Marcha del Orgullo',
    description: 'Celebra la diversidad con nosotros',
    location: 'Plaza Mayor',
    date: '2024-06-28',
    type: 'marcha',
    attendees: 156
  },
  {
    id: '2',
    name: 'Fiesta Rainbow',
    description: 'Noche de música y baile',
    location: 'Club Central',
    date: '2024-07-15',
    type: 'fiesta',
    attendees: 89
  }
];

export default function MapPage() {
  const [activeTab, setActiveTab] = useState('people'); // people, events
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    // Obtener ubicación del usuario
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setLoadingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error al obtener ubicación:', error);
          // Ubicación por defecto (Madrid)
          setUserLocation({ lat: 40.4168, lng: -3.7038 });
          setLoadingLocation(false);
        }
      );
    } else {
      // Ubicación por defecto
      setUserLocation({ lat: 40.4168, lng: -3.7038 });
      setLoadingLocation(false);
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Explorar</h1>
          <button
            onClick={getUserLocation}
            disabled={loadingLocation}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
            {loadingLocation ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
              activeTab === 'people'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Personas
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-colors ${
              activeTab === 'events'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Eventos
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {activeTab === 'people' ? (
          <div>
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {userLocation
                    ? `Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}`
                    : 'Obteniendo ubicación...'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {mockNearbyUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={user.photo}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {user.name}, {user.age}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{user.location}</span>
                          </div>
                        </div>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                          Ver perfil
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {mockEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{event.name}</h3>
                    <p className="text-gray-600 text-sm">{event.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      event.type === 'fiesta'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {event.type}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(event.date).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{event.attendees} asistentes</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Asistiré
                  </button>
                  <button className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                    Más info
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

// Componente de Filtros de Descubrimiento
export default function DiscoveryFilters({ onClose, onSave }) {
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 50,
    maxDistance: 20,
    interestedInGender: [],
    interestedInRoles: [],
    lookingForRomance: true,
    lookingForFriends: false,
    lookingForPoly: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar configuración actual al abrir
  useEffect(() => {
    loadDiscoverySettings();
  }, []);

  const loadDiscoverySettings = async () => {
    try {
      // Obtener initData de Telegram Web App
      const initData = window.Telegram?.WebApp?.initData || 'test_init_data_12345';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/discovery?initData=${encodeURIComponent(initData)}`);
      const data = await response.json();
      
      if (data.ok && data.settings) {
        setFilters(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validar que la edad mínima no sea mayor que la máxima
      if (filters.minAge > filters.maxAge) {
        alert('La edad mínima no puede ser mayor que la edad máxima');
        return;
      }
      
      // Obtener initData de Telegram Web App
      const initData = window.Telegram?.WebApp?.initData || 'test_init_data_12345';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/discovery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,
          ...filters
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        onSave?.(filters);
        onClose?.();
      } else {
        alert('Error guardando filtros: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error guardando filtros:', error);
      alert('Error guardando filtros');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (role) => {
    const currentRoles = filters.interestedInRoles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    setFilters(prev => ({ ...prev, interestedInRoles: newRoles }));
  };

  const handleGenderToggle = (gender) => {
    const currentGenders = filters.interestedInGender || [];
    const newGenders = currentGenders.includes(gender)
      ? currentGenders.filter(g => g !== gender)
      : [...currentGenders, gender];
    
    setFilters(prev => ({ ...prev, interestedInGender: newGenders }));
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando preferencias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-purple-700">Preferencias de Búsqueda</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>
      
      {/* Rango de Edad */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-gray-700">
          Edad: <span className="text-purple-600 font-semibold">{filters.minAge}</span> - <span className="text-purple-600 font-semibold">{filters.maxAge}</span> años
        </label>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Edad mínima</label>
            <input
              type="range"
              min="18"
              max="99"
              value={filters.minAge}
              onChange={e => setFilters(prev => ({ ...prev, minAge: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Edad máxima</label>
            <input
              type="range"
              min="18"
              max="99"
              value={filters.maxAge}
              onChange={e => setFilters(prev => ({ ...prev, maxAge: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
            />
          </div>
        </div>
      </div>

      {/* Distancia */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-gray-700">
          Distancia Máxima: <span className="text-purple-600 font-semibold">{filters.maxDistance}</span> km
        </label>
        <input
          type="range"
          min="1"
          max="200"
          value={filters.maxDistance}
          onChange={e => setFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 km</span>
          <span>200 km</span>
        </div>
      </div>

      {/* Género de Interés */}
      <div className="mb-6">
        <span className="block text-sm font-medium mb-3 text-gray-700">Género de Interés:</span>
        <div className="flex flex-wrap gap-2">
          {['male', 'female', 'non-binary'].map(gender => (
            <button
              key={gender}
              onClick={() => handleGenderToggle(gender)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                filters.interestedInGender?.includes(gender)
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {gender === 'male' ? 'Hombres' : gender === 'female' ? 'Mujeres' : 'No binario'}
            </button>
          ))}
        </div>
      </div>

      {/* Roles (Ejemplo Multi-select simple) */}
      <div className="mb-6">
        <span className="block text-sm font-medium mb-3 text-gray-700">Roles de Interés:</span>
        <div className="flex flex-wrap gap-2">
          {['ACTIVO', 'PASIVO', 'VERSATIL'].map(role => (
            <button
              key={role}
              onClick={() => handleRoleToggle(role)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                filters.interestedInRoles?.includes(role)
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Intenciones */}
      <div className="mb-6">
        <span className="block text-sm font-medium mb-3 text-gray-700">¿Qué buscas?</span>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.lookingForRomance}
              onChange={e => setFilters(prev => ({ ...prev, lookingForRomance: e.target.checked }))}
              className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-gray-700">💕 Pareja / Romance</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.lookingForFriends}
              onChange={e => setFilters(prev => ({ ...prev, lookingForFriends: e.target.checked }))}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">👥 Amistad</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.lookingForPoly}
              onChange={e => setFilters(prev => ({ ...prev, lookingForPoly: e.target.checked }))}
              className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">💚 Relaciones poliamorosas</span>
          </label>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </div>
          ) : (
            'Aplicar Filtros'
          )}
        </button>
      </div>
    </div>
  );
}

// Estilos CSS personalizados para los sliders
const styles = `
.slider-purple::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #9333ea;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.slider-purple::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #9333ea;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
`;

// Agregar estilos al head si no existen
if (typeof document !== 'undefined' && !document.getElementById('discovery-filters-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'discovery-filters-styles';
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

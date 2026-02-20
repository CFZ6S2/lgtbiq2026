import React, { useState, useEffect } from 'react';
import '../styles/pride-firebase-theme.css';

// Componente de Filtros de Descubrimiento con tema Pride + Firebase Dark Theme
export default function DiscoveryFiltersThemed({ onClose, onSave }) {
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
      <div className="firebase-card animate-pulse">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trans-blue-dark mr-3"></div>
          <span className="text-secondary">Cargando preferencias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pride-firebase-theme">
      <div className="firebase-card animate-float">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gradient-trans">Preferencias de Búsqueda</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors text-2xl font-light"
          >
            ×
          </button>
        </div>
        
        {/* Rango de Edad */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-primary">
            Edad: <span className="text-gradient-pride font-bold">{filters.minAge}</span> - <span className="text-gradient-pride font-bold">{filters.maxAge}</span> años
          </label>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-secondary mb-2 block">Edad mínima</label>
              <input
                type="range"
                min="18"
                max="99"
                value={filters.minAge}
                onChange={e => setFilters(prev => ({ ...prev, minAge: Number(e.target.value) }))}
                className="w-full h-2 bg-firebase-elevated rounded-lg appearance-none cursor-pointer slider-pride"
                style={{
                  background: `linear-gradient(to right, var(--trans-blue-dark) 0%, var(--trans-blue-dark) ${((filters.minAge - 18) / 81) * 100}%, var(--firebase-elevated) ${((filters.minAge - 18) / 81) * 100}%, var(--firebase-elevated) 100%)`
                }}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-2 block">Edad máxima</label>
              <input
                type="range"
                min="18"
                max="99"
                value={filters.maxAge}
                onChange={e => setFilters(prev => ({ ...prev, maxAge: Number(e.target.value) }))}
                className="w-full h-2 bg-firebase-elevated rounded-lg appearance-none cursor-pointer slider-pride"
                style={{
                  background: `linear-gradient(to right, var(--trans-pink-dark) 0%, var(--trans-pink-dark) ${((filters.maxAge - 18) / 81) * 100}%, var(--firebase-elevated) ${((filters.maxAge - 18) / 81) * 100}%, var(--firebase-elevated) 100%)`
                }}
              />
            </div>
          </div>
        </div>

        {/* Distancia */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-primary">
            Distancia Máxima: <span className="text-gradient-trans font-bold">{filters.maxDistance}</span> km
          </label>
          <input
            type="range"
            min="1"
            max="200"
            value={filters.maxDistance}
            onChange={e => setFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
            className="w-full h-2 bg-firebase-elevated rounded-lg appearance-none cursor-pointer slider-pride"
            style={{
              background: `linear-gradient(to right, var(--pan-cyan-dark) 0%, var(--pan-cyan-dark) ${(filters.maxDistance / 200) * 100}%, var(--firebase-elevated) ${(filters.maxDistance / 200) * 100}%, var(--firebase-elevated) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-secondary mt-2">
            <span>1 km</span>
            <span>200 km</span>
          </div>
        </div>

        {/* Género de Interés */}
        <div className="mb-6">
          <span className="block text-sm font-semibold mb-3 text-primary">Género de Interés:</span>
          <div className="flex flex-wrap gap-3">
            {['male', 'female', 'non-binary'].map(gender => (
              <button
                key={gender}
                onClick={() => handleGenderToggle(gender)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                  filters.interestedInGender?.includes(gender)
                    ? 'bg-gradient-trans text-white shadow-lg border-2 border-transparent'
                    : 'bg-firebase-elevated text-secondary hover:bg-firebase-card border-2 border-firebase-elevated'
                }`}
              >
                {gender === 'male' ? '👨 Hombres' : gender === 'female' ? '👩 Mujeres' : '🌈 No binario'}
              </button>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="mb-6">
          <span className="block text-sm font-semibold mb-3 text-primary">Roles de Interés:</span>
          <div className="flex flex-wrap gap-3">
            {['ACTIVO', 'PASIVO', 'VERSATIL'].map(role => (
              <button
                key={role}
                onClick={() => handleRoleToggle(role)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                  filters.interestedInRoles?.includes(role)
                    ? 'bg-gradient-pride text-white shadow-lg border-2 border-transparent'
                    : 'bg-firebase-elevated text-secondary hover:bg-firebase-card border-2 border-firebase-elevated'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Intenciones */}
        <div className="mb-6">
          <span className="block text-sm font-semibold mb-3 text-primary">¿Qué buscas?</span>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.lookingForRomance}
                onChange={e => setFilters(prev => ({ ...prev, lookingForRomance: e.target.checked }))}
                className="w-5 h-5 text-trans-blue-dark bg-firebase-elevated border-firebase-elevated rounded focus:ring-2 focus:ring-trans-blue-dark focus:ring-offset-2 focus:ring-offset-firebase-dark"
              />
              <span className="text-primary group-hover:text-trans-pink-dark transition-colors">💕 Pareja / Romance</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.lookingForFriends}
                onChange={e => setFilters(prev => ({ ...prev, lookingForFriends: e.target.checked }))}
                className="w-5 h-5 text-blue-500 bg-firebase-elevated border-firebase-elevated rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-firebase-dark"
              />
              <span className="text-primary group-hover:text-blue-400 transition-colors">👥 Amistad</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.lookingForPoly}
                onChange={e => setFilters(prev => ({ ...prev, lookingForPoly: e.target.checked }))}
                className="w-5 h-5 text-green-500 bg-firebase-elevated border-firebase-elevated rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-firebase-dark"
              />
              <span className="text-primary group-hover:text-green-400 transition-colors">💚 Relaciones poliamorosas</span>
            </label>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 pt-4 border-t border-glass-border">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-firebase-elevated text-secondary font-medium rounded-lg hover:bg-firebase-card hover:text-primary transition-all duration-300 border border-firebase-elevated hover:border-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 px-4 btn-primary-pride text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </div>
            ) : (
              '✨ Aplicar Filtros'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos CSS personalizados para los sliders
const styles = `
.slider-pride {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 4px;
  outline: none;
  transition: all 0.3s ease;
}

.slider-pride::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--trans-blue-dark), var(--trans-pink-dark));
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.slider-pride::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(91, 206, 250, 0.4);
}

.slider-pride::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--trans-blue-dark), var(--trans-pink-dark));
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.slider-pride::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(91, 206, 250, 0.4);
}
`;

// Agregar estilos al head si no existen
if (typeof document !== 'undefined' && !document.getElementById('discovery-filters-themed-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'discovery-filters-themed-styles';
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

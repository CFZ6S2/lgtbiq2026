import { useState } from 'react';
import DiscoveryFilters from './DiscoveryFilters';

// Componente de botón flotante para filtros de descubrimiento
export default function DiscoveryFilterButton({ onFiltersUpdated }) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFiltersSave = (filters) => {
    console.log('Filtros actualizados:', filters);
    onFiltersUpdated?.(filters);
    // Aquí podrías recargar los perfiles o actualizar el contexto de recomendaciones
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setShowFilters(true)}
        className="fixed bottom-20 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="Ajustar filtros de búsqueda"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
          />
        </svg>
      </button>

      {/* Modal de filtros */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="relative w-full max-w-md">
            <DiscoveryFilters
              onClose={() => setShowFilters(false)}
              onSave={handleFiltersSave}
            />
          </div>
        </div>
      )}
    </>
  );
}
import React, { useState } from 'react';
import DiscoveryFilterButton from './DiscoveryFilterButton';
import UserReportButton from './UserReportButton';

// Componente de ejemplo que muestra cómo integrar los nuevos componentes
export default function ExampleIntegration() {
  const [filters, setFilters] = useState(null);

  const handleFiltersUpdated = (newFilters) => {
    console.log('Filtros actualizados:', newFilters);
    setFilters(newFilters);
    // Aquí puedes recargar los perfiles o actualizar el contexto de recomendaciones
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ejemplo de Integración - Fase 3</h1>
        
        {/* Sección de filtros de descubrimiento */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtros de Descubrimiento</h2>
          <p className="text-gray-600 mb-4">
            El botón flotante de filtros aparecerá en la esquina inferior derecha. 
            Puedes integrarlo en cualquier página que muestre perfiles.
          </p>
          
          {/* Botón de filtros flotante */}
          <DiscoveryFilterButton onFiltersUpdated={handleFiltersUpdated} />
          
          {filters && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Filtros aplicados:</h3>
              <pre className="text-sm text-green-700">{JSON.stringify(filters, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Sección de reporte de usuarios */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Reporte de Usuarios</h2>
          <p className="text-gray-600 mb-4">
            El componente de reporte se puede usar en perfiles de usuario, 
            mensajes, o cualquier lugar donde se muestre información de usuarios.
          </p>
          
          <div className="space-y-4">
            {/* Ejemplo de usuario 1 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">JD</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Juan Díaz</h4>
                  <p className="text-sm text-gray-600">28 años • Madrid</p>
                </div>
              </div>
              <UserReportButton 
                userId="user123"
                userName="Juan Díaz"
                className="ml-4"
              />
            </div>

            {/* Ejemplo de usuario 2 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">MC</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">María Castro</h4>
                  <p className="text-sm text-gray-600">25 años • Barcelona</p>
                </div>
              </div>
              <UserReportButton 
                userId="user456"
                userName="María Castro"
                className="ml-4"
              />
            </div>
          </div>
        </div>

        {/* Sección de integración en SwipePage */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Integración en SwipePage</h2>
          <p className="text-gray-600 mb-4">
            Para integrar estos componentes en tu página de swipe:
          </p>
          
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">1. Importar componentes:</h3>
            <pre className="text-sm text-gray-700 bg-gray-200 p-3 rounded mb-4">
{`import DiscoveryFilterButton from '../components/DiscoveryFilterButton';
import UserReportButton from '../components/UserReportButton';`}
            </pre>

            <h3 className="font-semibold text-gray-800 mb-2">2. Agregar a tu componente:</h3>
            <pre className="text-sm text-gray-700 bg-gray-200 p-3 rounded mb-4">
{`// En el return de tu componente:
return (
  <div className="relative">
    {/* Tu contenido de swipe */}
    
    {/* Botón flotante de filtros */}
    <DiscoveryFilterButton onFiltersUpdated={handleFiltersUpdate} />
    
    {/* En el perfil de cada usuario */}
    <UserReportButton 
      userId={currentUser.id}
      userName={currentUser.name}
    />
  </div>
);`}
            </pre>

            <h3 className="font-semibold text-gray-800 mb-2">3. Manejar actualización de filtros:</h3>
            <pre className="text-sm text-gray-700 bg-gray-200 p-3 rounded">
{`const handleFiltersUpdate = (newFilters) => {
  // Actualizar el contexto o estado de filtros
  setDiscoveryFilters(newFilters);
  // Recargar perfiles con nuevos filtros
  reloadProfiles();
};`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import PrideThemeStyles from './PrideThemeStyles';

// Componente de demostración del tema Pride + Firebase Dark Theme
export default function ThemeDemo() {
  return (
    <>
      <PrideThemeStyles />
    <div className="min-h-screen" style={{ 
      background: 'var(--firebase-dark, #121212)',
      color: 'var(--text-primary, #e8e8e8)'
    }}>
      {/* Header con gradiente Pride */}
      <div className="firebase-header">
        <h1 className="firebase-logo-text">
          <span className="pride-gradient">Tema Pride + Firebase Demo</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Demostración del tema visual con glassmorphism y colores Pride</p>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Cards con glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="firebase-card">
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Card Glassmorphism</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Este card usa glassmorphism con borde Pride animado al hacer hover.</p>
            <div className="mt-4">
              <button className="btn-firebase-pride mr-3">Botón Pride</button>
              <button className="btn-primary-pride">Botón Principal</button>
            </div>
          </div>

          <div className="firebase-card">
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Formulario Estilizado</h3>
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              className="firebase-input mb-3"
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="firebase-input mb-3"
            />
            <button className="btn-primary-pride w-full">Iniciar Sesión</button>
          </div>

          <div className="firebase-card">
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Badges Pride</h3>
            <div className="space-y-2">
              <span className="badge-pride trans">Trans</span>
              <span className="badge-pride pan">Pan</span>
              <span className="badge-pride rainbow">Rainbow</span>
            </div>
          </div>
        </div>

        {/* Tabla estilizada */}
        <div className="firebase-card mb-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Tabla Firebase</h3>
          <table className="firebase-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Edad</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>María Castro</td>
                <td>25</td>
                <td>Barcelona</td>
                <td><span className="badge-pride trans">Activo</span></td>
              </tr>
              <tr>
                <td>Juan Díaz</td>
                <td>28</td>
                <td>Madrid</td>
                <td><span className="badge-pride pan">En línea</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Navegación con tema */}
        <div className="firebase-nav mb-8">
          <nav className="flex space-x-4">
            <a href="#" className="nav-link active">Inicio</a>
            <a href="#" className="nav-link">Perfiles</a>
            <a href="#" className="nav-link">Mensajes</a>
            <a href="#" className="nav-link">Configuración</a>
          </nav>
        </div>

        {/* Demo de DiscoveryFilters */}
        <div className="firebase-card">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Demo DiscoveryFilters</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            El componente DiscoveryFilters ahora usa el tema Pride + Firebase con glassmorphism y gradientes animados.
          </p>
          <div className="text-center">
            <button 
              onClick={() => alert('Abrir modal de filtros con tema Pride')}
              className="btn-primary-pride"
            >
              Abrir Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
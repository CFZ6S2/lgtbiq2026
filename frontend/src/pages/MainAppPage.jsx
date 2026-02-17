import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, User, Settings, LogOut } from 'lucide-react';

// Componentes de la aplicación
import SwipePage from './SwipePage';
import ChatPage from './ChatPage';
import MapPage from './MapPage';
import ProfilePage from './ProfilePage';

export default function MainAppPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Obtener usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // Si no hay usuario, redirigir a landing
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{currentUser.name}</p>
              <p className="text-sm text-gray-500">En línea</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            to="/app"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600"
          >
            <Heart className="w-5 h-5" />
            <span>Descubrir</span>
          </Link>

          <Link
            to="/app/chat"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Mensajes</span>
          </Link>

          <Link
            to="/app/map"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600"
          >
            <MapPin className="w-5 h-5" />
            <span>Mapa</span>
          </Link>

          <Link
            to="/app/profile"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600"
          >
            <User className="w-5 h-5" />
            <span>Mi Perfil</span>
          </Link>

          <div className="pt-4 border-t">
            <Link
              to="/app/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-800"
            >
              <Settings className="w-5 h-5" />
              <span>Configuración</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-gray-600 hover:text-red-600 w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<SwipePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage user={currentUser} />} />
        </Routes>
      </div>
    </div>
  );
}
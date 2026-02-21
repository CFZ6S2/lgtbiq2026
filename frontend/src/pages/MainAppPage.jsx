import React, { useState, useEffect } from 'react';
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
    return <div className="flex items-center justify-center h-screen pride-firebase-theme text-white">Cargando...</div>;
  }

  return (
    <div className="h-screen flex pride-firebase-theme overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 firebase-card !rounded-none !m-0 !h-full !border-r !border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center gradient-pride p-[2px]">
              <div className="w-full h-full bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">{currentUser.name}</p>
              <p className="text-sm text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                En línea
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            to="/app"
            className="nav-link flex items-center gap-3"
          >
            <Heart className="w-5 h-5" />
            <span>Descubrir</span>
          </Link>

          <Link
            to="/app/chat"
            className="nav-link flex items-center gap-3"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Mensajes</span>
          </Link>

          <Link
            to="/app/map"
            className="nav-link flex items-center gap-3"
          >
            <MapPin className="w-5 h-5" />
            <span>Mapa</span>
          </Link>

          <Link
            to="/app/profile"
            className="nav-link flex items-center gap-3"
          >
            <User className="w-5 h-5" />
            <span>Mi Perfil</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/app/settings"
            className="nav-link flex items-center gap-3"
          >
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </Link>

          <button
            onClick={handleLogout}
            className="nav-link flex items-center gap-3 w-full hover:!bg-red-500/20 hover:!text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden relative">
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

import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseAPI } from '../firebase';
import { LayoutDashboard, LogOut, User, Settings } from 'lucide-react';

// Components
import BottomNav from '../components/BottomNav';
import DiscoveryPage from './DiscoveryPage';
import ProfilePage from './ProfilePage';
import MatchesPage from './MatchesPage';
import ChatPage from './ChatPage';

// Placeholder Pages for now
const MapPage = () => <div className="p-8 text-center text-gray-400">Mapa en construcción 🚧</div>;

const MainAppPage = () => {
  const [user, setUser] = useState(undefined);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await firebaseAPI.signOut();
    navigate('/');
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando aplicación…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="bg-gray-800 p-8 rounded-2xl text-center max-w-md w-full mx-4 shadow-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-2 text-red-400">Acceso Denegado</h2>
          <p className="text-gray-300 mb-6">Necesitas iniciar sesión para ver el dashboard.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-2 rounded-lg">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:block">Pride Connect</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-full">
            <User size={16} className="text-gray-400" />
            <span className="text-sm font-medium">{user.displayName || 'Usuario'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-8 container mx-auto px-0 md:px-4 py-4">
        <Routes>
          <Route path="/" element={<DiscoveryPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/chat" element={<MatchesPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default MainAppPage;

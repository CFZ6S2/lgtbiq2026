import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// Páginas
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import MainAppPage from './pages/MainAppPage';

function App() {
  // Configurar Telegram WebApp si está disponible
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rutas de la aplicación principal */}
        <Route path="/app/*" element={<MainAppPage />} />
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import MainAppPage from './pages/MainAppPage';
import PrideHomePage from './components/PrideHomePage';

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
        <Route path="/" element={<PrideHomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/theme-demo" element={<PrideHomePage />} />
        <Route path="/app/*" element={<MainAppPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import Landing from './Landing';
import Register from './Register';
import App from './App';
import { firebaseAPI } from './firebase';

const MainApp = () => {
  const [currentView, setCurrentView] = useState('landing'); // landing, register, app
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario autenticado
    const unsubscribe = firebaseAPI.onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setCurrentView('app');
      } else {
        setUser(null);
        setCurrentView('landing');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRegisterSuccess = () => {
    // Después de un registro exitoso, redirigir a la app
    setCurrentView('app');
  };

  const handleAuthClick = (method) => {
    if (method === 'telegram') {
      // Implementar autenticación con Telegram
      console.log('Autenticación con Telegram');
    } else if (method === 'email') {
      setCurrentView('register');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'landing') {
    return <Landing onAuthClick={handleAuthClick} />;
  }

  if (currentView === 'register') {
    return (
      <Register 
        onBack={() => setCurrentView('landing')} 
        onSuccess={handleRegisterSuccess}
      />
    );
  }

  if (currentView === 'app') {
    return <App />;
  }

  return null;
};

export default MainApp;
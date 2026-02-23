import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, MapPin, MessageCircle, Shield, Send, LayoutDashboard } from 'lucide-react';
import { firebaseAPI } from '../firebase';

export default function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar estado de sesión
  useEffect(() => {
    const unsubscribe = firebaseAPI.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Asegurar carga del Widget de Telegram
  useEffect(() => {
    if (!document.getElementById('telegram-widget-script')) {
      const script = document.createElement('script');
      script.id = 'telegram-widget-script';
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleTelegramAuth = async () => {
    // Verificar si el script del Widget de Telegram está cargado
    if (!window.Telegram?.Login) {
      alert('El widget de Telegram está cargando. Por favor intenta en un momento.');
      return;
    }

    try {
      console.log('[TelegramAuth] Invocando widget de Telegram...');
      
      // Solicitar autenticación con el widget oficial
      window.Telegram.Login.auth(
        { bot_id: '8540644362', request_access: true },
        async (data) => {
          if (!data) {
            console.log('Usuario canceló el login o hubo un error');
            return;
          }
          
          console.log('[TelegramAuth] Payload recibido:', data);
          
          // Enviar datos al backend para validación y login/registro automático
          const result = await firebaseAPI.signInWithTelegram(data);
          console.log('[TelegramAuth] Resultado del backend:', result);
          
          if (result.success) {
            // Redirigir directamente a la app principal
            navigate('/app');
          } else {
            alert('Error al autenticar con Telegram: ' + (result.error || 'Error desconocido'));
          }
        }
      );
    } catch (error) {
      console.error('Error de autenticación Telegram:', error);
      // Mostrar error en lugar de redirigir a registro
      alert('Hubo un error al iniciar el widget de Telegram. Por favor recarga la página e intenta de nuevo.');
      // navigate('/register'); // Deshabilitado para evitar redirección errónea
    }
  };

  const handleGoToDashboard = () => {
    navigate('/app');
  };

  const handleDemoLogin = async () => {
    try {
      console.log('Iniciando login demo...');
      const result = await firebaseAPI.signInWithTelegram('demo_init_data');
      if (result.success) {
        navigate('/app');
      } else {
        alert('Error en login demo: ' + result.error);
      }
    } catch (error) {
      console.error('Error demo:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Pride Connect 🏳️‍🌈
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            La comunidad LGBTIQ+ donde puedes conectar, chatear y encontrar el amor en un entorno seguro y diverso
          </p>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              Encuentra tu lugar en la comunidad
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="bg-white/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Comunidad Real</h3>
                <p className="text-white/80 text-sm">Conecta con personas auténticas de la comunidad</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Seguridad Primero</h3>
                <p className="text-white/80 text-sm">Verificación y moderación para tu tranquilidad</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Amor y Amistad</h3>
                <p className="text-white/80 text-sm">Encuentra relaciones significativas</p>
              </div>
            </div>

            {loading ? (
              <div className="bg-white/20 p-4 rounded-full mx-auto w-fit">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : user ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-white text-lg">Hola, {user.displayName || 'Usuario'}</p>
                <button
                  onClick={handleGoToDashboard}
                  className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors flex items-center gap-3 mx-auto shadow-lg transform hover:scale-105 transition-transform"
                >
                  <LayoutDashboard className="w-6 h-6" />
                  Ir al Dashboard
                </button>
                <button 
                  onClick={() => firebaseAPI.signOut && firebaseAPI.signOut()}
                  className="text-white/80 text-sm underline hover:text-white"
                >
                  Cerrar sesión (si es necesario)
                </button>
              </div>
            ) : (
              <button
                onClick={handleTelegramAuth}
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors flex items-center gap-3 mx-auto shadow-lg transform hover:scale-105 transition-transform"
              >
                <Send className="w-6 h-6" />
                Iniciar con Telegram
              </button>
            )}

            {/* Botón Demo para desarrollo local */}
            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !user && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleDemoLogin}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors"
                  title="Simular Login (Solo Local)"
                >
                  [DEV] Simular Login
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <MapPin className="w-12 h-12 text-white mb-4" />
            <h3 className="text-white text-xl font-bold mb-3">Encuentra Cerca</h3>
            <p className="text-white/80">
              Descubre personas LGBTIQ+ cerca de ti con nuestra función de geolocalización segura
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <MessageCircle className="w-12 h-12 text-white mb-4" />
            <h3 className="text-white text-xl font-bold mb-3">Chat Seguro</h3>
            <p className="text-white/80">
              Conversa con matches en tiempo real con nuestro sistema de chat cifrado
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-white/70">
          <p>© 2024 Pride Connect. Hecho con ❤️ para la comunidad LGBTIQ+</p>
        </footer>
      </div>
    </div>
  );
}

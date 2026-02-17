import { useNavigate } from 'react-router-dom';
import { Heart, Users, MapPin, MessageCircle, Shield, Send } from 'lucide-react';
import { firebaseAPI } from '../firebase';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleTelegramAuth = async () => {
    if (window.Telegram?.WebApp) {
      const initData = window.Telegram.WebApp.initData;
      const result = await firebaseAPI.signInWithTelegram(initData);
      if (result.success) {
        navigate('/app');
        return;
      }
    }
    navigate('/register');
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

            <button
              onClick={handleTelegramAuth}
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors flex items-center gap-3 mx-auto"
            >
              <Send className="w-6 h-6" />
              Iniciar con Telegram
            </button>
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

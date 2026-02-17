import React, { useState } from 'react';
import { Heart, Users, MapPin, Shield, Star, ArrowRight, Send, Mail, Sparkles, Rainbow, Zap } from 'lucide-react';
import './landing-styles.css';

const Landing = ({ onAuthClick }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMethod, setAuthMethod] = useState(null);

  const handleAuthClickInternal = (method) => {
    setAuthMethod(method);
    setShowAuthModal(true);
  };

  const handleContinueWithTelegram = () => {
    setShowAuthModal(false);
    onAuthClick('telegram');
  };

  const handleContinueWithEmail = () => {
    setShowAuthModal(false);
    onAuthClick('email');
  };

  return (
    <div className="min-h-screen landing-container">
      {/* Header */}
      <header className="fixed top-0 w-full landing-header z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Rainbow className="h-8 w-8 text-purple-600 animate-float" />
              <span className="text-2xl font-bold landing-title">
                Prisma
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => handleAuthClickInternal('telegram')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>Iniciar con Telegram</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-4 py-2 rounded-full mb-8">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Bienvenido a la comunidad LGBTIQ+</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Conecta, Chatea y
              </span>
              <br />
              <span className="text-gray-900">Encuentra el Amor</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Únete a la comunidad más vibrante y segura para personas LGBTIQ+. 
              Descubre personas cercanas, chatea en tiempo real y construye conexiones significativas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => handleAuthClickInternal('telegram')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-3 group"
              >
                <Send className="h-6 w-6" />
                <span>Comenzar con Telegram</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => handleAuthClickInternal('email')}
                className="bg-white text-gray-900 border-2 border-gray-300 px-8 py-4 rounded-full font-semibold text-lg hover:border-purple-500 hover:shadow-lg transition-all duration-300 flex items-center space-x-3"
              >
                <Mail className="h-6 w-6" />
                <span>Registrarse con Email</span>
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <MapPin className="h-8 w-8 text-purple-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Encuentra Gente Cerca</h3>
                  <p className="text-gray-600 text-sm">Descubre personas LGBTIQ+ en tu área con nuestra función de geolocalización</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <Heart className="h-8 w-8 text-pink-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Conexiones Reales</h3>
                  <p className="text-gray-600 text-sm">Sistema de likes y matches para conectar con personas compatibles</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <Shield className="h-8 w-8 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Seguro y Privado</h3>
                  <p className="text-gray-600 text-sm">Controles de privacidad avanzados y comunidad moderada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por Qué Elegir Prisma?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Diseñado por y para la comunidad LGBTIQ+, con características que realmente importan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Comunidad Verificada</h3>
              <p className="text-gray-600">Sistema de verificación para asegurar perfiles auténticos y crear un ambiente seguro</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Chat en Tiempo Real</h3>
              <p className="text-gray-600">Mensajería instantánea fluida y moderna para conversaciones naturales</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Orientaciones y Preferencias</h3>
              <p className="text-gray-600">Encuentra personas compatibles con filtros avanzados y preferencias personalizadas</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-orange-100 to-red-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Mapa Interactivo</h3>
              <p className="text-gray-600">Descubre quién está cerca con nuestro mapa seguro y controlado por privacidad</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Heart className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Eventos y Comunidad</h3>
              <p className="text-gray-600">Conoce eventos LGBTIQ+ en tu área y conecta con la comunidad local</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-pink-100 to-rose-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacidad Total</h3>
              <p className="text-gray-600">Controles completos sobre quién puede ver tu perfil y ubicación</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para Encontrar Tu Comunidad?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Únete a miles de personas LGBTIQ+ que ya están conectando, chateando y encontrando amor en Prisma
          </p>
          <button 
            onClick={() => handleAuthClickInternal('telegram')}
            className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 mx-auto group"
          >
            <span>Comenzar Ahora</span>
            <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Rainbow className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold">Prisma</span>
          </div>
          <p className="text-gray-400 mb-6">Conectando corazones LGBTIQ+ desde 2024</p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <Rainbow className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido a Prisma</h3>
              <p className="text-gray-600">
                {authMethod === 'telegram' ? 'Inicia sesión con Telegram' : 'Regístrate con tu email'}
              </p>
            </div>
            
            {authMethod === 'telegram' ? (
              <div className="space-y-4">
                <button 
                  onClick={handleContinueWithTelegram}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-3"
                >
                  <Send className="h-5 w-5" />
                  <span>Continuar con Telegram</span>
                </button>
                <p className="text-sm text-gray-500 text-center">
                  Serás redirigido a Telegram para iniciar sesión de forma segura
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={handleContinueWithEmail}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Continuar con Email
                </button>
                <p className="text-sm text-gray-500 text-center">
                  Regístrate con tu dirección de email
                </p>
              </div>
            )}
            
            <button 
              onClick={() => setShowAuthModal(false)}
              className="w-full mt-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
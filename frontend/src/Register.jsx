import React, { useState } from 'react';
import { ArrowLeft, Send, Mail, Eye, EyeOff, User, Calendar, MapPin, Heart, Shield, Check } from 'lucide-react';
import { firebaseAPI } from './firebase';
import './landing-styles.css';

const Register = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState('method'); // method, telegram, email, profile
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    birthDate: '',
    orientation: '',
    role: '',
    location: '',
    showPassword: false,
    showConfirmPassword: false
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTelegramAuth = async () => {
    try {
      // Llamar a la autenticación real de Telegram
      const result = await firebaseAPI.signInWithTelegram('demo_init_data');
      if (result.success) {
        onSuccess();
      } else {
        alert('Error al autenticar con Telegram: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    try {
      // Crear usuario con email en Firebase
      // Esto es un placeholder - necesitarás implementar la lógica real
      setStep('profile');
    } catch (error) {
      alert('Error al crear cuenta: ' + error.message);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      // Guardar perfil en Firebase
      const user = firebaseAPI.auth.currentUser;
      if (user) {
        await firebaseAPI.updateUserProfile(user.uid, {
          name: formData.name,
          birthDate: formData.birthDate,
          orientation: formData.orientation,
          role: formData.role,
          location: formData.location
        });
      }
      onSuccess();
    } catch (error) {
      alert('Error al guardar perfil: ' + error.message);
    }
  };

  const togglePasswordVisibility = (field) => {
    setFormData({
      ...formData,
      [field]: !formData[field]
    });
  };

  if (step === 'method') {
    return (
      <div className="min-h-screen register-container flex items-center justify-center p-4">
        <div className="register-card rounded-3xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Prisma
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Únete Ahora</h2>
            <p className="text-gray-600">Elige cómo quieres registrarte</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleTelegramAuth}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <Send className="h-6 w-6" />
              <span>Continuar con Telegram</span>
            </button>

            <button 
              onClick={() => setStep('email')}
              className="w-full bg-white text-gray-900 border-2 border-gray-300 py-4 rounded-xl font-semibold text-lg hover:border-purple-500 hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <Mail className="h-6 w-6" />
              <span>Registrarse con Email</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'telegram') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Conectando con Telegram</h2>
            <p className="text-gray-600">Serás redirigido a Telegram para completar el registro de forma segura</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleTelegramAuth}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            >
              Continuar a Telegram
            </button>
            
            <button 
              onClick={() => setStep('method')}
              className="w-full text-gray-500 hover:text-gray-700 transition-colors"
            >
              Elegir otro método
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'email') {
    return (
      <div className="min-h-screen register-container flex items-center justify-center p-4">
        <div className="register-card rounded-3xl p-8 max-w-md w-full">
          <div className="mb-8">
            <button 
              onClick={() => setStep('method')}
              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear Cuenta</h2>
            <p className="text-gray-600">Completa tus datos para registrarte</p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="register-input w-full px-4 py-3 rounded-xl outline-none"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={formData.showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="register-input w-full px-4 py-3 pr-12 rounded-xl outline-none"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('showPassword')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {formData.showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={formData.showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="register-input w-full px-4 py-3 pr-12 rounded-xl outline-none"
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('showConfirmPassword')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {formData.showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="register-button-primary w-full py-3 rounded-xl font-semibold"
            >
              Continuar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen register-container flex items-center justify-center p-4">
        <div className="register-card rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Completa tu Perfil</h2>
            <p className="text-gray-600">Cuéntanos un poco sobre ti</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="register-input w-full px-4 py-3 pl-10 rounded-xl outline-none"
                  placeholder="Tu nombre"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
              <div className="relative">
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  required
                  className="register-input w-full px-4 py-3 pl-10 rounded-xl outline-none"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Orientación</label>
              <select
                name="orientation"
                value={formData.orientation}
                onChange={handleInputChange}
                required
                className="register-input w-full px-4 py-3 rounded-xl outline-none"
              >
                <option value="">Selecciona tu orientación</option>
                <option value="gay">Gay</option>
                <option value="lesbian">Lesbiana</option>
                <option value="bisexual">Bisexual</option>
                <option value="transgender">Transgénero</option>
                <option value="queer">Queer</option>
                <option value="questioning">Cuestionando</option>
                <option value="asexual">Asexual</option>
                <option value="pansexual">Pansexual</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <div className="grid grid-cols-3 gap-2">
                {['ACTIVO', 'PASIVO', 'VERSATIL'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, role })}
                    className={`register-role-button py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      formData.role === role
                        ? 'active'
                        : ''
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="register-input w-full px-4 py-3 pl-10 rounded-xl outline-none"
                  placeholder="Ciudad, País"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="privacy-notice rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900">Tu privacidad es importante</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Puedes controlar quién ve tu información en cualquier momento desde la configuración de privacidad.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="register-button-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
            >
              <Check className="h-5 w-5" />
              <span>Completar Registro</span>
            </button>
          </form>
        </div>
      </div>
    );
  }
};

export default Register;
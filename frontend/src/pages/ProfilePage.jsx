import React, { useState, useEffect } from 'react';
import { firebaseAPI } from '../firebase';
import { Camera, Edit2, MapPin, Briefcase, Smile, Heart } from 'lucide-react';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = firebaseAPI.auth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          const data = await firebaseAPI.getUserProfile(currentUser.uid);
          if (data) {
            setProfile(data.profile);
            setEditForm(data.profile || {});
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await firebaseAPI.updateUserProfile(user.uid, editForm);
      setProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al guardar cambios');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header / Cover */}
      <div className="relative h-48 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500">
        <button 
          className="absolute top-4 right-4 p-2 bg-black/30 rounded-full hover:bg-black/50 text-white transition-colors"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancelar' : <Edit2 size={20} />}
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-4 -mt-16 mb-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full border-4 border-gray-900 bg-gray-800 overflow-hidden relative group">
            <img 
              src={user?.photoURL || 'https://via.placeholder.com/150'} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer group-hover:bg-black/60 transition-colors">
                <Camera className="text-white w-8 h-8" />
              </div>
            )}
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-white text-center">
            {user?.displayName || 'Usuario'}
            {profile?.age && <span className="ml-2 font-normal text-gray-400">, {profile.age}</span>}
          </h1>
          
          <div className="flex items-center gap-2 text-gray-400 mt-1 text-sm">
            <MapPin size={14} />
            <span>{profile?.location || 'Ubicación no definida'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-6 max-w-2xl mx-auto">
        {/* Bio Section */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Smile className="text-purple-400" size={20} />
            Sobre mí
          </h2>
          {isEditing ? (
            <textarea
              name="bio"
              value={editForm.bio || ''}
              onChange={handleInputChange}
              className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              rows="4"
              placeholder="Cuéntanos algo sobre ti..."
            />
          ) : (
            <p className="text-gray-300 leading-relaxed">
              {profile?.bio || '¡Hola! Soy nuevo aquí.'}
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 tracking-wider">Información Básica</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Género</label>
                {isEditing ? (
                  <select 
                    name="gender" 
                    value={editForm.gender || ''}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white rounded p-2 mt-1 border border-gray-700"
                  >
                    <option value="">Selecciona</option>
                    <option value="male">Hombre</option>
                    <option value="female">Mujer</option>
                    <option value="non-binary">No Binario</option>
                    <option value="other">Otro</option>
                  </select>
                ) : (
                  <p className="text-white font-medium">{profile?.gender || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Ocupación</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="job"
                    value={editForm.job || ''}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white rounded p-2 mt-1 border border-gray-700"
                    placeholder="Tu trabajo"
                  />
                ) : (
                  <p className="text-white font-medium flex items-center gap-2">
                    <Briefcase size={14} className="text-gray-500" />
                    {profile?.job || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 tracking-wider">Intereses</h3>
            {isEditing ? (
              <input
                type="text"
                name="interests"
                value={editForm.interests || ''}
                onChange={handleInputChange}
                className="w-full bg-gray-900 text-white rounded p-2 border border-gray-700"
                placeholder="Separados por comas (ej: Cine, Viajes)"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.interests ? (
                  profile.interests.split(',').map((tag, i) => (
                    <span key={i} className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                      {tag.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">Sin intereses definidos</span>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            Guardar Cambios
          </button>
        )}
        
        {/* Logout Button (Moved to Settings later, but useful here for now) */}
        <div className="pt-8 text-center">
           <button 
             onClick={() => firebaseAPI.signOut()}
             className="text-red-400 text-sm hover:text-red-300 underline"
           >
             Cerrar Sesión
           </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

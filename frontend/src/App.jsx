import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, MapPin, Users, Settings, Shield, Heart, Filter, Search, ChevronRight, CheckCheck, Zap, Sparkles, Bell } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('discover')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showNav, setShowNav] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isScrolledTop, setIsScrolledTop] = useState(true)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = scrollContainerRef.current.scrollTop
      setIsScrolledTop(currentScrollY < 10)
      if (currentScrollY > lastScrollY && currentScrollY > 50) setShowNav(false)
      else setShowNav(true)
      setLastScrollY(currentScrollY)
    }
    const container = scrollContainerRef.current
    if (container) container.addEventListener('scroll', handleScroll)
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const mockUsers = [
    { id: 1, name: 'Alex', age: 24, bio: 'Diseñador UX 🎨. Buscando conexiones reales.', dist: '0.5 km', online: true, verified: true, tags: ['Arte','Tech','Cine'] },
    { id: 2, name: 'Sam', age: 28, bio: 'Músico y viajero ✈️.', dist: '1.2 km', online: false, verified: false, tags: ['Música','Senderismo'] },
    { id: 3, name: 'Charlie', age: 22, bio: 'Good vibes only ✨.', dist: '2.4 km', online: true, verified: true, tags: ['Baile','Yoga'] },
  ]

  return (
    <div className="flex flex-col h-screen bg-white font-sans max-w-md mx-auto overflow-hidden shadow-2xl relative border-x border-gray-200">
      <header className={`absolute top-0 w-full z-30 transition-all duration-300 px-6 py-4 flex items-center justify-between ${!isScrolledTop ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200' : 'bg-transparent'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white shadow-lg"><span className="font-bold text-lg">P</span></div>
          <h1 className="font-bold text-xl tracking-tight text-gray-900">Prisma</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors relative"><Bell size={22} /><span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span></button>
      </header>
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto pt-20 pb-24 scroll-smooth no-scrollbar bg-gray-50">
        {activeTab === 'discover' && (
          <div className="px-5 pb-10 space-y-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input type="text" placeholder="Buscar..." className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm text-gray-900" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm ${showFilters ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}><Filter size={20} /></button>
            </div>
            {showFilters && (
              <div className="rounded-2xl p-4 mb-4 shadow-sm border border-gray-200 bg-white">
                <div className="flex flex-wrap gap-2">
                  {['Online','Cerca','Nuevos','Populares'].map(f => (<span key={f} className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-full">{f}</span>))}
                </div>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Personas cerca</h2>
              <div className="grid grid-cols-1 gap-4">
                {mockUsers.map(user => (
                  <div key={user.id} onClick={() => setSelectedUser(user)} className="rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl border border-gray-700">
                    <div className="w-20 h-20 bg-gray-700 rounded-xl relative overflow-hidden flex-shrink-0">
                      <Users className="absolute inset-0 m-auto text-gray-400" size={24} />
                      {user.online && (<div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-gray-900 rounded-full"></div>)}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white flex items-center gap-1">{user.name}, {user.age}{user.verified && <CheckCheck size={14} className="text-emerald-400" />}</h3>
                        <span className="text-xs text-gray-300 flex items-center gap-0.5"><MapPin size={10} /> {user.dist}</span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-1 mt-1">{user.bio}</p>
                      <div className="flex flex-wrap gap-1 mt-2">{user.tags.slice(0, 2).map(tag => (<span key={tag} className="px-2 py-1 bg-gray-700 text-gray-200 text-xs rounded-full">{tag}</span>))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'chats' && (
          <div className="px-2">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl border border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-gray-700 text-purple-400">{String.fromCharCode(64 + i)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">Usuario {i}</span>
                        <span className="text-xs text-gray-400">12:30</span>
                      </div>
                      <p className="text-sm text-gray-300 truncate">Hola, ¿cómo estás? me gustó tu perfil...</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="px-5">
            <div className="rounded-3xl p-6 text-center mb-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl border border-gray-700">
              <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 bg-gray-700 text-purple-400"><Users size={40} /></div>
              <h2 className="text-xl font-bold mb-4 text-white">Mi Usuario</h2>
              <p className="text-sm mb-4 text-gray-300">Plan Gratuito</p>
              <button className="px-6 py-2 rounded-xl font-semibold text-sm w-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">Editar Perfil</button>
            </div>
          </div>
        )}
      </main>
      <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-white rounded-2xl shadow-2xl flex justify-around items-center py-3 z-40 transition-all duration-500 ease-in-out border border-gray-200 ${showNav ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0'}`}>
          <NavButton active={activeTab==='discover'} icon={<Sparkles size={20}/>} label="Inicio" onClick={()=>setActiveTab('discover')} />
          <NavButton active={activeTab==='chats'} icon={<MessageCircle size={20}/>} label="Chats" badge={3} onClick={()=>setActiveTab('chats')} />
          <NavButton active={activeTab==='settings'} icon={<Settings size={20}/>} label="Perfil" onClick={()=>setActiveTab('settings')} />
        </nav>
    </div>
  )
}

function NavButton({ active, icon, label, onClick, badge }) {
  return <button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 transition-colors relative ${active ? 'text-purple-600' : 'text-gray-500 hover:text-gray-900'}`}>
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
    {badge && <span className="absolute -top-1 right-2 w-4 h-4 text-white text-[9px] flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 border-2 border-white">{badge}</span>}
  </button>
}

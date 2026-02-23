import React, { useState } from 'react';
import { Home, Search, Heart, MessageCircle, User, Settings, Map } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route) => {
    if (route === '/app' && path === '/app') return true;
    if (route !== '/app' && path.startsWith(route)) return true;
    return false;
  };

  const navItems = [
    { icon: <Search size={24} />, label: 'Explorar', route: '/app' },
    { icon: <Map size={24} />, label: 'Mapa', route: '/app/map' },
    { icon: <Heart size={24} />, label: 'Matches', route: '/app/matches' },
    { icon: <MessageCircle size={24} />, label: 'Chat', route: '/app/chat' },
    { icon: <User size={24} />, label: 'Perfil', route: '/app/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => (
          <Link
            key={item.route}
            to={item.route}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive(item.route) 
                ? 'text-purple-500' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-label={item.label}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive(item.route) ? 'bg-purple-500/10' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

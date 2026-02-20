import React, { useEffect } from 'react';

// Componente que redirige al HTML puro del tema Pride
export default function PrideHtmlRedirect() {
  useEffect(() => {
    // Redirigir al archivo HTML puro
    window.location.href = '/pride-theme-direct.html';
  }, []);
  
  return (
    <div style={{
      backgroundColor: '#121212',
      color: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <div>
        <h1 style={{
          fontSize: '36px',
          marginBottom: '20px',
          background: 'linear-gradient(90deg, #FF0000, #FF8000, #FFFF00, #00FF00, #0080FF, #8000FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🏳️‍🌈 REDIRIGIENDO...
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '18px' }}>
          Redirigiendo al tema Pride + Firebase...
        </p>
        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginTop: '20px' }}>
          <p>Si no se redirige automáticamente, visita:</p>
          <strong>https://lgtbiq26.web.app/pride-theme-direct.html</strong>
        </div>
      </div>
    </div>
  );
}

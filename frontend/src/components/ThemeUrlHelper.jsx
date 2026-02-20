import React from 'react';

// Componente que ayuda a encontrar la URL correcta del tema
export default function ThemeUrlHelper() {
  const currentUrl = window.location.href;
  const basePath = '/';
  const themePath = `/theme-demo`;
  
  return (
    <div style={{
      backgroundColor: '#121212',
      color: '#ffffff',
      minHeight: '100vh',
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: '36px',
        marginBottom: '30px',
        background: 'linear-gradient(90deg, #FF0000, #FF8000, #FFFF00, #00FF00, #0080FF, #8000FF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>
        🏳️‍🌈 TEMA PRIDE + FIREBASE 🏳️‍🌈
      </h1>
      
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '30px',
        margin: '20px auto',
        maxWidth: '700px'
      }}>
        <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>📍 Información de Rutas</h2>
        
        <div style={{ textAlign: 'left', marginBottom: '30px' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '15px' }}>
            <strong>URL Actual:</strong> {currentUrl}
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '15px' }}>
            <strong>Ruta Base Configurada:</strong> {basePath}
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '15px' }}>
            <strong>Ruta del Tema:</strong> {themePath}
          </p>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>🔗 URLs para probar el tema:</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <a 
              href={themePath} 
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #8000FF, #0080FF)',
                color: 'white',
                padding: '15px 25px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 'bold',
                marginBottom: '10px'
              }}
            >
              Ir a: {themePath}
            </a>
            
            <a 
              href="/" 
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #FF0000, #FF8000)',
                color: 'white',
                padding: '15px 25px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              Ir a: /
            </a>
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h4 style={{ color: '#ffffff', marginBottom: '10px' }}>🎯 ¿Qué deberías ver?</h4>
          <ul style={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'left', listStyle: 'none', padding: 0 }}>
            <li>• Fondo oscuro (#121212)</li>
            <li>• Título con gradiente Pride (rojo a morado)</li>
            <li>• Cards con glassmorphism (blur + transparencia)</li>
            <li>• Botones con gradientes Pride</li>
            <li>• Badges con colores trans, pan y rainbow</li>
          </ul>
        </div>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>🌈 Paleta de Colores Pride</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
          {[
            { color: '#FF0000', name: 'Rojo' },
            { color: '#FF8000', name: 'Naranja' },
            { color: '#FFFF00', name: 'Amarillo' },
            { color: '#00FF00', name: 'Verde' },
            { color: '#0080FF', name: 'Azul' },
            { color: '#8000FF', name: 'Morado' }
          ].map((item, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{
                width: '100%',
                height: '40px',
                backgroundColor: item.color,
                borderRadius: '5px',
                marginBottom: '5px'
              }}></div>
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{item.name}</small>
            </div>
          ))}
        </div>
      </div>
      
      <p style={{
        marginTop: '40px',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px'
      }}>
        Si no ves colores vibrantes, hay un problema con la carga del tema 🎨
      </p>
    </div>
  );
}

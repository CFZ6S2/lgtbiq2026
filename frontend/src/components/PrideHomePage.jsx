import React from 'react';
import { Link } from 'react-router-dom';

// Página de inicio con tema Pride + Firebase visible
export default function PrideHomePage() {
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
        fontSize: '48px',
        marginBottom: '40px',
        background: 'linear-gradient(90deg, #FF0000, #FF8000, #FFFF00, #00FF00, #0080FF, #8000FF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>
        🏳️‍🌈 PRISMA - TEMA PRIDE + FIREBASE 🏳️‍🌈
      </h1>
      
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '30px',
        margin: '20px auto',
        maxWidth: '800px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>✨ BIENVENIDO AL TEMA PRIDE ✨</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '30px', fontSize: '18px' }}>
          Este es el tema Pride + Firebase Dark Theme aplicado correctamente
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
          <Link to="/theme-demo" style={{
            background: 'linear-gradient(135deg, #8000FF, #0080FF, #00FFFF)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}>
            Ver Demo del Tema
          </Link>
          
          <Link to="/" style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '15px 30px',
            borderRadius: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            Inicio (/)
          </Link>
        </div>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '30px' }}>🌈 Características del Tema</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{ color: '#5BCEFA', marginBottom: '10px' }}>🎨 Glassmorphism</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Efectos de vidrio esmerilado con backdrop-filter
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{ color: '#FF218C', marginBottom: '10px' }}>✨ Gradientes Animados</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Colores Pride con animaciones suaves
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{ color: '#33CCFF', marginBottom: '10px' }}>🏳️‍⚧️ Badges Inclusivos</h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Identidades trans, pan y rainbow
            </p>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '50px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>🎯 Paleta de Colores Pride</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', maxWidth: '600px', margin: '0 auto' }}>
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
                width: '60px',
                height: '60px',
                backgroundColor: item.color,
                borderRadius: '50%',
                marginBottom: '5px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
              }}></div>
              <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{item.name}</small>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{
        marginTop: '50px',
        padding: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <h4 style={{ color: '#ffffff', marginBottom: '15px' }}>🔗 Rutas Disponibles</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <Link to="/" style={{
            color: 'rgba(255, 255, 255, 0.8)',
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
            maxWidth: '300px'
          }}>
            🏠 / - Página Principal
          </Link>
          <Link to="/theme-demo" style={{
            color: 'rgba(255, 255, 255, 0.8)',
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
            maxWidth: '300px'
          }}>
            🎨 /theme-demo - Demo del Tema
          </Link>
          <Link to="/register" style={{
            color: 'rgba(255, 255, 255, 0.8)',
            textDecoration: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
            maxWidth: '300px'
          }}>
            📝 /register - Registro
          </Link>
        </div>
      </div>
      
      <p style={{
        marginTop: '50px',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px'
      }}>
        🏳️‍🌈 Tema Pride + Firebase Dark Theme aplicado correctamente 🏳️‍🌈
      </p>
    </div>
  );
}

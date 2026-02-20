import React from 'react';
import PrideThemeStyles from './PrideThemeStyles';
import ForcePrideTheme from './ForcePrideTheme';

// Componente simple para probar que el tema se aplica
export default function SimpleThemeTest() {
  return (
    <>
      <ForcePrideTheme />
      <PrideThemeStyles />
      <div style={{
        minHeight: '100vh',
        background: '#121212',
        color: '#e8e8e8',
        padding: '2rem',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            background: 'linear-gradient(120deg, hsl(194deg, 72%, 58%), hsl(349deg, 70%, 68%), hsl(329deg, 80%, 50%), hsl(260deg, 80%, 50%), hsl(210deg, 80%, 45%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'rainbow-text-slide 10s linear infinite'
          }}>
            🏳️‍🌈 TEMA PRIDE + FIREBASE 🏳️‍🌈
          </h1>
          
          <div className="firebase-card" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h2 style={{ color: '#e8e8e8', marginBottom: '1rem' }}>✨ Glassmorphism Card ✨</h2>
            <p style={{ color: 'rgba(232, 232, 232, 0.7)', marginBottom: '1.5rem' }}>
              Este card usa glassmorphism con el tema Pride + Firebase Dark Theme
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={{
                background: 'linear-gradient(135deg, hsl(260deg, 80%, 50%), hsl(210deg, 80%, 45%), hsl(194deg, 72%, 58%))',
                color: 'white',
                border: 'none',
                padding: '0.875rem 2rem',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                animation: 'gradient-shift 8s ease infinite'
              }}>
                Botón Pride
              </button>
              
              <button style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#e8e8e8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.875rem 2rem',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                Botón Secundario
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.875rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid hsl(194deg, 72%, 58%)',
              color: 'hsl(194deg, 72%, 58%)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}>
              TRANS
            </span>
            
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.875rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '600',
              background: 'linear-gradient(90deg, hsl(0deg, 76%, 48%), hsl(260deg, 80%, 50%))',
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              border: 'none'
            }}>
              RAINBOW
            </span>
          </div>
          
          <div style={{
            background: 'rgba(30, 30, 40, 0.7)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: '#e8e8e8', marginBottom: '1rem' }}>🎨 Variables CSS del Tema</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'left' }}>
              <div>
                <strong style={{ color: 'hsl(0deg, 76%, 48%)' }}>--pride-red-dark:</strong>
                <div style={{ width: '100%', height: '20px', background: 'hsl(0deg, 76%, 48%)', borderRadius: '4px', marginTop: '0.25rem' }}></div>
              </div>
              <div>
                <strong style={{ color: 'hsl(210deg, 80%, 45%)' }}>--pride-blue-dark:</strong>
                <div style={{ width: '100%', height: '20px', background: 'hsl(210deg, 80%, 45%)', borderRadius: '4px', marginTop: '0.25rem' }}></div>
              </div>
              <div>
                <strong style={{ color: 'hsl(260deg, 80%, 50%)' }}>--pride-purple-dark:</strong>
                <div style={{ width: '100%', height: '20px', background: 'hsl(260deg, 80%, 50%)', borderRadius: '4px', marginTop: '0.25rem' }}></div>
              </div>
              <div>
                <strong style={{ color: 'hsl(194deg, 72%, 58%)' }}>--trans-blue-dark:</strong>
                <div style={{ width: '100%', height: '20px', background: 'hsl(194deg, 72%, 58%)', borderRadius: '4px', marginTop: '0.25rem' }}></div>
              </div>
            </div>
          </div>
          
          <p style={{ color: 'rgba(232, 232, 232, 0.5)', marginTop: '2rem', fontSize: '0.9rem' }}>
            Si ves este mensaje con colores y estilos, el tema Pride + Firebase está funcionando correctamente 🎯
          </p>
        </div>
      </div>
    </>
  );
}
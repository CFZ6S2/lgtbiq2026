import React, { useEffect, useState } from 'react';

// Componente para asegurar que el tema se cargue correctamente
export default function ThemeLoader({ children }) {
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    // Forzar la carga del tema
    const loadTheme = () => {
      // Verificar si las variables CSS están disponibles
      const testElement = document.createElement('div');
      testElement.style.setProperty('background', 'var(--firebase-dark)');
      document.body.appendChild(testElement);
      
      const computedStyle = getComputedStyle(testElement);
      const bgColor = computedStyle.background;
      
      document.body.removeChild(testElement);
      
      // Si el color no es el esperado, agregar estilos inline temporales
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        console.log('Tema no cargado, aplicando estilos temporales');
        
        // Agregar estilos temporales
        const style = document.createElement('style');
        style.textContent = `
          :root {
            --firebase-dark: #121212;
            --firebase-darker: #0a0a0a;
            --text-primary: #e8e8e8;
            --text-secondary: rgba(232, 232, 232, 0.7);
            --pride-red-dark: hsl(0deg, 76%, 48%);
            --pride-orange-dark: hsl(25deg, 80%, 45%);
            --pride-yellow-dark: hsl(48deg, 80%, 45%);
            --pride-green-dark: hsl(130deg, 80%, 35%);
            --pride-blue-dark: hsl(210deg, 80%, 45%);
            --pride-purple-dark: hsl(260deg, 80%, 50%);
            --trans-blue-dark: hsl(194deg, 72%, 58%);
            --trans-pink-dark: hsl(349deg, 70%, 68%);
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
            --glass-hover: rgba(255, 255, 255, 0.08);
          }
          
          body {
            background: var(--firebase-dark) !important;
            color: var(--text-primary) !important;
          }
          
          .firebase-card {
            background: var(--glass-bg) !important;
            border: 1px solid var(--glass-border) !important;
            border-radius: 16px !important;
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .btn-primary-pride {
            background: linear-gradient(135deg, var(--pride-purple-dark), var(--pride-blue-dark), var(--trans-blue-dark)) !important;
            color: white !important;
            border: none !important;
            padding: 0.875rem 2rem !important;
            border-radius: 12px !important;
            font-weight: 600 !important;
          }
        `;
        document.head.appendChild(style);
      }
      
      setThemeLoaded(true);
    };

    // Pequeño retraso para asegurar que todo esté cargado
    const timer = setTimeout(loadTheme, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!themeLoaded) {
    return (
      <div style={{ 
        background: '#121212', 
        color: '#e8e8e8',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ff4fd8', marginBottom: '1rem' }}>Cargando tema...</h2>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTop: '3px solid #ff4fd8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  return children;
}

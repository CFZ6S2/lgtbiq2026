import { useEffect } from 'react';

// Componente que fuerza la aplicación del tema Pride + Firebase inmediatamente
export default function ForcePrideTheme() {
  useEffect(() => {
    // Aplicar estilos directamente al body
    document.body.style.background = '#121212';
    document.body.style.color = '#e8e8e8';
    document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    document.body.style.lineHeight = '1.6';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Creer gradiente de fondo
    const gradientDiv = document.createElement('div');
    gradientDiv.id = 'pride-gradient-background';
    gradientDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        135deg,
        hsl(0deg, 76%, 48%) 0%,
        hsl(25deg, 80%, 45%) 15%,
        hsl(48deg, 80%, 45%) 30%,
        hsl(130deg, 80%, 35%) 45%,
        hsl(210deg, 80%, 45%) 65%,
        hsl(260deg, 80%, 50%) 85%,
        hsl(349deg, 70%, 68%) 100%
      );
      opacity: 0.22;
      z-index: -1;
      background-size: 400% 400%;
      animation: subtle-pride-shift 20s ease infinite;
      pointer-events: none;
    `;
    
    // Agregar keyframes
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes subtle-pride-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      @keyframes rainbow-text-slide {
        to { background-position: 200% center; }
      }
      
      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `;
    document.head.appendChild(styleSheet);
    document.body.appendChild(gradientDiv);
    
    console.log('🌈 Tema Pride + Firebase aplicado forzadamente');
    
    return () => {
      // Limpiar al desmontar
      const gradient = document.getElementById('pride-gradient-background');
      if (gradient) {
        document.body.removeChild(gradient);
      }
      if (styleSheet.parentNode) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);
  
  return null;
}

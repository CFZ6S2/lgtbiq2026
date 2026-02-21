import { useEffect } from 'react';

// Componente que aplica estilos inline del tema Pride + Firebase
const prideThemeStyles = `
  :root {
    --firebase-dark: #121212;
    --firebase-darker: #0a0a0a;
    --firebase-card: rgba(30, 30, 40, 0.7);
    --firebase-elevated: rgba(40, 40, 50, 0.8);
    
    --pride-red-dark: hsl(0deg, 76%, 48%);
    --pride-orange-dark: hsl(25deg, 80%, 45%);
    --pride-yellow-dark: hsl(48deg, 80%, 45%);
    --pride-green-dark: hsl(130deg, 80%, 35%);
    --pride-blue-dark: hsl(210deg, 80%, 45%);
    --pride-purple-dark: hsl(260deg, 80%, 50%);
    
    --trans-blue-dark: hsl(194deg, 72%, 58%);
    --trans-pink-dark: hsl(349deg, 70%, 68%);
    
    --pan-pink-dark: hsl(329deg, 80%, 50%);
    --pan-yellow-dark: hsl(48deg, 80%, 50%);
    --pan-cyan-dark: hsl(198deg, 80%, 50%);
    
    --text-primary: #e8e8e8;
    --text-secondary: rgba(232, 232, 232, 0.7);
    --text-muted: rgba(232, 232, 232, 0.5);
    
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-hover: rgba(255, 255, 255, 0.08);
    
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
    --shadow-pride: 0 4px 20px rgba(255, 255, 255, 0.1);
    
    --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  body {
    background: var(--firebase-dark) !important;
    color: var(--text-primary) !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    line-height: 1.6 !important;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      var(--pride-red-dark) 0%,
      var(--pride-orange-dark) 15%,
      var(--pride-yellow-dark) 30%,
      var(--pride-green-dark) 45%,
      var(--pride-blue-dark) 65%,
      var(--pride-purple-dark) 85%,
      var(--trans-pink-dark) 100%
    );
    opacity: 0.22;
    z-index: -1;
    background-size: 400% 400%;
    animation: subtle-pride-shift 20s ease infinite;
  }

  @keyframes subtle-pride-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .firebase-card {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 16px !important;
    padding: 1.5rem !important;
    margin-bottom: 1.5rem !important;
    box-shadow: var(--shadow-md) !important;
    transition: var(--transition-smooth) !important;
    position: relative !important;
    overflow: hidden !important;
  }

  .firebase-card::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 3px !important;
    background: linear-gradient(
      90deg,
      var(--pride-red-dark),
      var(--pride-orange-dark),
      var(--pride-yellow-dark),
      var(--pride-green-dark),
      var(--pride-blue-dark),
      var(--pride-purple-dark)
    ) !important;
    opacity: 0 !important;
    transition: opacity var(--transition-smooth) !important;
  }

  .firebase-card:hover {
    transform: translateY(-4px) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    box-shadow: var(--shadow-lg), var(--shadow-pride) !important;
    background: var(--glass-hover) !important;
  }

  .firebase-card:hover::before {
    opacity: 1 !important;
  }

  .btn-primary-pride {
    background: linear-gradient(
      135deg,
      var(--pride-purple-dark),
      var(--pride-blue-dark),
      var(--trans-blue-dark)
    ) !important;
    background-size: 200% 200% !important;
    border: none !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 0.875rem 2rem !important;
    border-radius: 12px !important;
    animation: gradient-shift 8s ease infinite !important;
    cursor: pointer !important;
    transition: var(--transition-smooth) !important;
  }

  .btn-primary-pride:hover {
    box-shadow: 0 8px 24px rgba(91, 206, 250, 0.3) !important;
    transform: translateY(-2px) !important;
  }

  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .pride-gradient {
    background: linear-gradient(
      120deg,
      var(--trans-blue-dark),
      var(--trans-pink-dark),
      var(--pan-pink-dark),
      var(--pride-purple-dark),
      var(--pride-blue-dark)
    ) !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    animation: rainbow-text-slide 10s linear infinite !important;
  }

  @keyframes rainbow-text-slide {
    to { background-position: 200% center; }
  }

  .badge-pride {
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    padding: 0.4rem 0.875rem !important;
    border-radius: 20px !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    background: var(--glass-bg) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
  }

  .badge-pride.trans {
    border-color: var(--trans-blue-dark) !important;
    color: var(--trans-blue-dark) !important;
    box-shadow: 0 0 12px rgba(91, 206, 250, 0.2) !important;
  }

  .badge-pride.pan {
    border-color: var(--pan-pink-dark) !important;
    color: var(--pan-pink-dark) !important;
    box-shadow: 0 0 12px rgba(255, 33, 140, 0.2) !important;
  }

  .badge-pride.rainbow {
    background: linear-gradient(
      90deg,
      var(--pride-red-dark),
      var(--pride-purple-dark)
    ) !important;
    border: none !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  }

  .pride-firebase-theme .landing-container {
    background: var(--firebase-dark) !important;
    color: var(--text-primary) !important;
  }
  .pride-firebase-theme .landing-header {
    background: var(--glass-bg) !important;
    border-bottom: 1px solid var(--glass-border) !important;
    backdrop-filter: blur(16px) !important;
  }
  .pride-firebase-theme .landing-hero {
    background: var(--firebase-elevated) !important;
  }
  .pride-firebase-theme .landing-title {
    -webkit-text-fill-color: transparent !important;
  }
  .pride-firebase-theme .landing-card {
    background: var(--glass-bg) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--glass-border) !important;
    box-shadow: var(--shadow-md) !important;
  }
  .pride-firebase-theme .landing-feature-card {
    background: var(--firebase-card) !important;
    border: 1px solid var(--glass-border) !important;
    box-shadow: var(--shadow-sm) !important;
  }
  .pride-firebase-theme .landing-cta {
    color: #fff !important;
  }
  .pride-firebase-theme .register-container {
    background: var(--firebase-dark) !important;
  }
  .pride-firebase-theme .register-card {
    background: var(--firebase-elevated) !important;
    border: 1px solid var(--glass-border) !important;
    box-shadow: var(--shadow-md) !important;
  }
  .pride-firebase-theme .register-input {
    background: var(--glass-bg) !important;
    border: 1px solid var(--glass-border) !important;
    color: var(--text-primary) !important;
  }
  .pride-firebase-theme .register-button-primary {
    color: #fff !important;
  }
  .pride-firebase-theme .register-button-secondary {
    background: var(--glass-bg) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--glass-border) !important;
  }
  .pride-firebase-theme .register-role-button {
    background: var(--firebase-card) !important;
    color: var(--text-secondary) !important;
    border: 1px solid var(--glass-border) !important;
  }
  .pride-firebase-theme .privacy-notice {
    border: 1px solid var(--glass-border) !important;
    color: var(--text-primary) !important;
  }
`;

export default function PrideThemeStyles() {
  useEffect(() => {
    // Aplicar estilos inline inmediatamente
    const styleElement = document.createElement('style');
    styleElement.textContent = prideThemeStyles;
    styleElement.id = 'pride-theme-styles';
    
    // Asegurar que los estilos se apliquen primero
    const existingStyles = document.getElementById('pride-theme-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    document.head.insertBefore(styleElement, document.head.firstChild);
    
    // Aplicar estilos al body inmediatamente
    document.body.style.background = '#121212';
    document.body.style.color = '#e8e8e8';
    document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    
    return () => {
      const styles = document.getElementById('pride-theme-styles');
      if (styles) {
        styles.remove();
      }
    };
  }, []);

  return null; // Este componente no renderiza nada visible
}

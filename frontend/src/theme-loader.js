// Cargar tema Pride + Firebase Dark Theme
import './styles/pride-firebase-theme.css';

// Exportar función para asegurar que el tema se aplique
export function loadPrideTheme() {
  // Asegurar que las variables CSS estén disponibles
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--theme-loaded', 'true');
  }
}
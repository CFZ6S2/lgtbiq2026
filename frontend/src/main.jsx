import React from 'react'
import { createRoot } from 'react-dom/client'
import MainApp from './MainApp.jsx'
import ThemeLoader from './components/ThemeLoader.jsx'
import './styles.css'
import './styles/pride-firebase-theme.css'
import { loadPrideTheme } from './theme-loader.js'
import PrideThemeStyles from './components/PrideThemeStyles.jsx'
import ForcePrideTheme from './components/ForcePrideTheme.jsx'

// Cargar tema Pride
loadPrideTheme();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ForcePrideTheme />
    <PrideThemeStyles />
    <ThemeLoader>
      <MainApp />
    </ThemeLoader>
  </React.StrictMode>
)

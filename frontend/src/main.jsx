import React from 'react'
import { createRoot } from 'react-dom/client'
import MainApp from './MainApp.jsx'
import ThemeLoader from './components/ThemeLoader.jsx'
import './styles.css'
import { loadPrideTheme } from './theme-loader.js'

// Cargar tema Pride
loadPrideTheme();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeLoader>
      <MainApp />
    </ThemeLoader>
  </React.StrictMode>
)

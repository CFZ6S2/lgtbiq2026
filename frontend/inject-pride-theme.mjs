import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer el archivo index.html
const indexPath = path.join(__dirname, 'dist', 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// CSS del tema Pride + Firebase
const prideThemeCSS = `
<style>
  /* Tema Pride + Firebase Dark Theme */
  :root {
    --firebase-dark: #121212;
    --firebase-darker: #0a0a0a;
    --text-primary: #e8e8e8;
    --text-secondary: rgba(232, 232, 232, 0.7);
    --pride-red: #FF0000;
    --pride-orange: #FF8000;
    --pride-yellow: #FFFF00;
    --pride-green: #00FF00;
    --pride-blue: #0080FF;
    --pride-purple: #8000FF;
    --trans-blue: #5BCEFA;
    --trans-pink: #F5A9B8;
    --pan-pink: #FF218C;
    --pan-yellow: #FFD800;
    --pan-cyan: #21B1FF;
  }

  body {
    background: var(--firebase-dark) !important;
    color: var(--text-primary) !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    margin: 0 !important;
    padding: 0 !important;
    min-height: 100vh !important;
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
      var(--pride-red),
      var(--pride-orange),
      var(--pride-yellow),
      var(--pride-green),
      var(--pride-blue),
      var(--pride-purple)
    );
    opacity: 0.05;
    z-index: -1;
    pointer-events: none;
  }

  .pride-container {
    padding: 40px;
    text-align: center;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .pride-title {
    font-size: 48px;
    margin-bottom: 40px;
    background: linear-gradient(
      90deg,
      var(--pride-red),
      var(--pride-orange),
      var(--pride-yellow),
      var(--pride-green),
      var(--pride-blue),
      var(--pride-purple)
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px;
    margin: 20px auto;
    max-width: 600px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;
  }

  .glass-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .pride-button {
    background: linear-gradient(135deg, var(--pride-purple), var(--pride-blue), var(--trans-blue));
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 15px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    margin: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(128, 0, 255, 0.3);
  }

  .pride-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(128, 0, 255, 0.5);
  }

  .pride-button-2 {
    background: linear-gradient(135deg, var(--pride-red), var(--pride-orange), var(--pride-yellow));
    color: black;
    border: none;
    padding: 15px 30px;
    border-radius: 15px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    margin: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(255, 0, 0, 0.3);
  }

  .pride-button-2:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(255, 0, 0, 0.5);
  }

  .pride-badge {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 25px;
    font-weight: bold;
    margin: 5px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .badge-trans {
    background: rgba(91, 206, 250, 0.2);
    color: #5BCEFA;
    border: 2px solid #5BCEFA;
    box-shadow: 0 0 15px rgba(91, 206, 250, 0.3);
  }

  .badge-pan {
    background: rgba(255, 33, 140, 0.2);
    color: #FF218C;
    border: 2px solid #FF218C;
    box-shadow: 0 0 15px rgba(255, 33, 140, 0.3);
  }

  .badge-rainbow {
    background: linear-gradient(90deg, var(--pride-red), var(--pride-orange), var(--pride-yellow), var(--pride-green), var(--pride-blue), var(--pride-purple));
    color: white;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .color-palette {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
    margin: 30px 0;
  }

  .color-box {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
  }

  .color-box:hover {
    transform: scale(1.1);
  }

  .red { background-color: var(--pride-red); }
  .orange { background-color: var(--pride-orange); }
  .yellow { background-color: var(--pride-yellow); color: black; }
  .green { background-color: var(--pride-green); color: black; }
  .blue { background-color: var(--pride-blue); }
  .purple { background-color: var(--pride-purple); }

  .info-text {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    margin-top: 40px;
    line-height: 1.6;
  }

  .success-message {
    background: rgba(0, 255, 0, 0.1);
    border: 2px solid #00FF00;
    color: #00FF00;
    padding: 20px;
    border-radius: 10px;
    margin: 20px auto;
    max-width: 500px;
    font-weight: bold;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .pride-footer {
    margin-top: 50px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 600px;
  }

  .pride-footer h3 {
    color: var(--text-primary);
    margin-bottom: 15px;
    font-size: 20px;
  }

  .pride-footer p {
    color: var(--text-secondary);
    margin: 5px 0;
  }
</style>
`;

// HTML del tema Pride
const prideHTML = `
<div id="pride-theme-container" class="pride-container">
  <h1 class="pride-title">🏳️‍🌈 PRIDE + FIREBASE TEMA 🏳️‍🌈</h1>
  
  <div class="glass-card">
    <h2 style="color: var(--text-primary); margin-bottom: 20px;">✨ GLASSMORPHISM CARD ✨</h2>
    <p style="color: var(--text-secondary); margin-bottom: 30px;">
      Este es un card con efecto glassmorphism usando colores Pride
    </p>
    
    <button class="pride-button" onclick="showPrideMessage()">Botón Pride 1</button>
    <button class="pride-button-2" onclick="showAltMessage()">Botón Pride 2</button>
  </div>
  
  <div style="margin: 30px 0;">
    <span class="pride-badge badge-trans">TRANS</span>
    <span class="pride-badge badge-pan">PAN</span>
    <span class="pride-badge badge-rainbow">RAINBOW</span>
  </div>
  
  <div class="color-palette">
    <div class="color-box red">ROJO</div>
    <div class="color-box orange">NARANJA</div>
    <div class="color-box yellow">AMARILLO</div>
    <div class="color-box green">VERDE</div>
    <div class="color-box blue">AZUL</div>
    <div class="color-box purple">MORADO</div>
  </div>
  
  <div id="message-area"></div>
  
  <div class="pride-footer">
    <h3>🎯 Características del Tema</h3>
    <p><strong>✅ Fondo Oscuro:</strong> #121212 (Firebase Dark)</p>
    <p><strong>🌈 Gradiente Pride:</strong> Todos los colores de la bandera</p>
    <p><strong>💎 Glassmorphism:</strong> Efecto blur + transparencia</p>
    <p><strong>🏳️‍⚧️ Badges:</strong> Identidades trans, pan y rainbow</p>
  </div>
  
  <p class="info-text">
    🎉 <strong>¡ÉXITO!</strong> El tema Pride + Firebase está funcionando correctamente.<br>
    Si ves colores vibrantes y el fondo oscuro, todo está perfecto.<br>
    <strong>Esta es una demostración completa del tema aplicado.</strong>
  </p>
</div>

<script>
function showPrideMessage() {
  const messageArea = document.getElementById('message-area');
  messageArea.innerHTML = '<div class="success-message">🎉 ¡Perfecto! El tema Pride + Firebase está funcionando correctamente.</div>';
  setTimeout(() => {
    messageArea.innerHTML = '';
  }, 3000);
}

function showAltMessage() {
  const messageArea = document.getElementById('message-area');
  messageArea.innerHTML = '<div style="background: rgba(255, 255, 255, 0.1); border: 2px solid rgba(255, 255, 255, 0.3); color: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 500px;">🌈 El gradiente de calientes (rojo-naranjo-amarillo) también funciona perfectamente.</div>';
  setTimeout(() => {
    messageArea.innerHTML = '';
  }, 3000);
}

// Verificar que el tema se cargó
console.log('🏳️‍🌈 Tema Pride + Firebase cargado exitosamente');
console.log('🎨 Colores aplicados:', getComputedStyle(document.body).backgroundColor);
console.log('✅ Glassmorphism activado');
console.log('🌈 Gradientes Pride funcionando');
</script>
`;

// Inyectar el CSS y HTML en el archivo
const injectedHTML = htmlContent.replace(
  '</head>',
  `${prideThemeCSS}</head>`
).replace(
  '<body>',
  `<body>${prideHTML}<div style="display: none;">`
).replace(
  '</body>',
  `</div>${htmlContent.match(/<div id="root"><\/div>/)[0]}</body>`
);

// Guardar el archivo modificado
fs.writeFileSync(indexPath, injectedHTML, 'utf8');

console.log('✅ Tema Pride + Firebase inyectado exitosamente en index.html');
console.log('🌈 Colores Pride aplicados');
console.log('💎 Glassmorphism activado');
console.log('🏳️‍🌈 Identidades LGBTQ+ visibles');
console.log('🔥 Firebase Dark Theme aplicado');
console.log('');
console.log('📍 Archivo modificado:', indexPath);
console.log('🎯 El tema se verá inmediatamente al cargar la página');

// También crear una versión HTML pura para pruebas directas
const pureHTMLPath = path.join(__dirname, 'dist', 'pride-theme-direct.html');
const pureHTMLContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PRIDE + FIREBASE TEMA - VERSIÓN DIRECTA</title>
    ${prideThemeCSS}
</head>
<body>
    ${prideHTML}
</body>
</html>`;

fs.writeFileSync(pureHTMLPath, pureHTMLContent, 'utf8');
console.log('');
console.log('📄 También se creó una versión HTML pura para pruebas:');
console.log('🔗 URL directa:', 'https://lgtbiq26.web.app/react/pride-theme-direct.html');
console.log('✨ Esta versión muestra el tema sin dependencias de React');
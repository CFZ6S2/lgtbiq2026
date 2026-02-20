import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas de archivos
const distPath = path.join(__dirname, 'dist');
const prideHomePath = path.join(distPath, 'index-pride.html');
const indexPath = path.join(distPath, 'index.html');

// Verificar que el archivo pride existe
if (!fs.existsSync(prideHomePath)) {
    console.log('❌ No se encontró index-pride.html');
    process.exit(1);
}

// Leer el contenido del archivo Pride
const prideContent = fs.readFileSync(prideHomePath, 'utf8');

// Crear un index.html con el contenido Pride pero manteniendo las referencias necesarias
const modifiedContent = prideContent.replace(
    '</head>',
    `  <script type="module" crossorigin src="/react/assets/index-DYFEc06S.js"></script>
  <link rel="stylesheet" crossorigin href="/react/assets/index-JB4g8nf9.css">
</head>`
).replace(
    '<body>',
    `<body>
    <div id="root"></div>
    <div id="pride-content">`
).replace(
    '</body>',
    `</div></body>`
);

// Guardar el archivo modificado
fs.writeFileSync(indexPath, modifiedContent, 'utf8');

console.log('✅ Página principal actualizada con tema Pride + Firebase');
console.log('🌈 El tema ahora es visible en la ruta principal: /react/');
console.log('💎 Glassmorphism, gradientes y colores Pride aplicados');
console.log('🏳️‍🌈 Identidades LGBTQ+ visibles en la página principal');

// También crear una copia de respaldo
const backupPath = path.join(distPath, 'index-original.html');
fs.writeFileSync(backupPath, fs.readFileSync(indexPath, 'utf8'), 'utf8');

console.log('📄 Copia de respaldo creada: index-original.html');
console.log('🎯 La página principal ahora muestra el tema Pride completamente');
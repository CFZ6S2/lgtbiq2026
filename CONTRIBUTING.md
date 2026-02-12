# Contribuciones

## Requisitos
- Node.js LTS
- Git

## Configuración
- Clona el repositorio
- Instala dependencias: `npm install`
- Prepara base de datos local: `npm run db:push`
- Arranca servidor: `npm start`

## Estilo de código
- Usa nombres descriptivos y evita secretos en el código
- No subir `.env` ni credenciales; sigue `.env.example`
- Mantén accesibilidad (roles ARIA, `aria-live`, `aria-busy`)

## Flujo de trabajo
- Crea branch por feature/fix: `feature/nombre-corto` o `fix/tema`
- Commits claros: `feat: ...`, `fix: ...`, `docs: ...`
- Abre Pull Request describiendo cambios, pruebas y riesgos

## Pruebas y verificación
- Verifica que `npm start` funciona sin errores
- Usa preview y revisa accesibilidad visible

## Seguridad
- Nunca incluir tokens o claves
- Reporta vulnerabilidades por canal privado

## Licencia
- MIT (ver `LICENSE`)

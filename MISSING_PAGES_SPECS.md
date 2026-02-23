# Documento de Especificaciones - Nuevas Páginas de Prisma

Este documento detalla las páginas y componentes necesarios para completar la arquitectura funcional de la aplicación **Prisma**, basándose en los requisitos de negocio (conexión social, citas, chat seguro) y la API existente.

## 1. Arquitectura de Navegación

La aplicación interna (`/app`) utilizará una navegación persistente (barra inferior en móvil, lateral en escritorio) para facilitar el acceso a las secciones principales.

### Estructura de Rutas (/app/*)

| Ruta | Componente | Descripción | Estado |
| :--- | :--- | :--- | :--- |
| `/app` | `DiscoveryPage` | Página principal de exploración de perfiles (Home). | ✅ Implementado |
| `/app/matches` | `MatchesPage` | Lista de usuarios con los que has hecho match y chats activos. | ✅ Implementado |
| `/app/map` | `MapPage` | Mapa interactivo para ver usuarios cercanos (si hay consentimiento). | 🚧 Pendiente |
| `/app/profile` | `ProfilePage` | Visualización y edición del perfil propio. | ✅ Implementado |
| `/app/settings` | `SettingsPage` | Configuración de cuenta, privacidad y notificaciones. | 🚧 Pendiente |
| `/app/chat/:id` | `ChatDetailPage` | Conversación individual con un usuario. | ✅ Implementado |
| `/app/user/:id` | `UserProfilePage` | Perfil público de otro usuario. | 🚧 Pendiente |

---

## 2. Especificaciones Detalladas por Página

### 2.1. Discovery Page (Home)
**Propósito:** Permitir al usuario descubrir otros perfiles basados en sus preferencias y ubicación.
**Componentes Requeridos:**
- **Filtros:** Botón para filtrar por distancia, edad, género.
- **Card Stack:** Tarjetas de usuarios con foto principal, nombre, edad y distancia.
- **Action Buttons:** Like (❤️), Pass (❌), Super Like (⭐).
**Estado Actual:**
- UI básica de Cards implementada.
- Integración parcial con `firebaseAPI.getRecommendations`.
- Lógica de Swipe simulada.

### 2.2. Matches & Chat Page
**Propósito:** Listar las conexiones exitosas y conversaciones activas.
**Componentes Requeridos:**
- **Matches Carousel:** Fila horizontal con nuevos matches recientes (círculos con fotos).
- **Chat List:** Lista vertical de conversaciones recientes con último mensaje y hora.
- **Search Bar:** Buscar entre matches/chats.
**Estado Actual:**
- Lista de matches y chats implementada con datos simulados.
- Navegación a detalle de chat funcionando.

### 2.3. Profile Page (Mi Perfil)
**Propósito:** Ver y editar la información del usuario autenticado.
**Componentes Requeridos:**
- **Profile Header:** Foto de perfil grande, nombre, edad, insignias de verificación.
- **Gallery:** Grid de fotos adicionales.
- **Bio Section:** Texto "Sobre mí".
- **Details Grid:** Intereses, orientación, pronombres, ubicación.
- **Edit Button:** Lleva a modo edición o modal.
**Estado Actual:**
- Visualización y Edición implementadas.
- Integración con `firebaseAPI` (getUserProfile, updateUserProfile) funcional.

### 2.4. Map Page (Opcional/Fase 2)
**Propósito:** Visualizar usuarios en un mapa.
**Estado Actual:** Placeholder.

### 2.5. Settings Page
**Propósito:** Gestionar la cuenta.
**Estado Actual:** Placeholder (botón Logout en ProfilePage temporalmente).

---

## 3. Requisitos Técnicos Transversales

- **Responsividad:** Diseño Mobile-First. Uso de Tailwind CSS para breakpoints.
- **Accesibilidad (WCAG 2.1):**
    - Uso correcto de etiquetas semánticas (`<nav>`, `<main>`, `<header>`).
    - Atributos `aria-label` en botones de iconos.
    - Contraste de colores suficiente (verificado en tema Pride).
    - Navegación por teclado funcional.
- **Performance:**
    - Lazy Loading de rutas (`React.lazy`).
    - Optimización de imágenes (uso de formatos modernos si es posible, o atributos `loading="lazy"`).
    - Skeleton screens durante la carga de datos.
- **Estado Global:**
    - Uso de Context API o simplemente props/lifting state para datos de usuario compartidos.

## 4. Plan de Pruebas

### Unitarias (Vitest/Jest)
- Verificar renderizado de componentes principales sin crash. (✅ Implementado)
- Verificar lógica de filtros en Discovery.
- Verificar validación de formularios en Perfil.

### Integración
- Flujo: Navegar de Home -> Perfil -> Editar -> Guardar -> Ver cambios.
- Flujo: Home -> Match -> Chat -> Enviar mensaje.

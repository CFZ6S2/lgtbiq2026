# 🚀 Fase 3: API de Preferencias y Frontend de Filtros

## 📋 Resumen de Implementación

Esta fase implementa la interfaz completa para que los usuarios puedan configurar sus preferencias de descubrimiento y reportar usuarios problemáticos, integrándose perfectamente con el sistema de recomendaciones y moderación desarrollado en la Fase 2.

## ✨ Nuevas Características Implementadas

### 1. Sistema de Preferencias de Usuario (`apiUsersV2`)

#### 🔧 Backend - Firebase Functions

**Nuevo Servicio:** `functions/src/services/userService.ts`
- Gestión completa de configuraciones de descubrimiento
- Validación de rangos de edad (mínima ≤ máxima)
- Auditoría automática de cambios
- Gestión de restricciones de usuario (bloqueos, shadow bans)

**Nuevos Handlers:** `functions/src/api/users.ts`
- `GET /api/users/discovery` - Obtener preferencias actuales
- `PUT /api/users/discovery` - Actualizar preferencias
- `GET /api/users/profile` - Obtener perfil completo
- `POST /api/users/report` - Reportar usuario con lógica de seguridad automática

#### 🎨 Frontend - Componentes React

**Componente Principal:** `frontend/src/components/DiscoveryFilters.jsx`
- Interfaz intuitiva con sliders para edad y distancia
- Botones toggle para género y roles de interés
- Checkboxes para intenciones (romance, amistad, poliamor)
- Validación en tiempo real
- Diseño responsive con Tailwind CSS

**Botón Flotante:** `frontend/src/components/DiscoveryFilterButton.jsx`
- Botón flotante accesible desde cualquier pantalla
- Modal con animaciones suaves
- Integración seamless con el contexto de la aplicación

**Sistema de Reportes:** `frontend/src/components/UserReportButton.jsx`
- Interfaz mejorada para reportar usuarios
- Múltiples categorías de reporte predefinidas
- Campo de detalles adicionales
- Confirmación de envío con feedback visual
- Advertencia sobre uso responsable

### 2. Lógica de Seguridad Automática

**Auto-moderación Inteligente:**
- **5 reportes en 24h:** Usuario automáticamente marcado para revisión urgente
- **10 reportes en 24h:** Aplicación automática de shadow ban
- Sistema de prevención de reportes duplicados
- Auditoría completa de todas las acciones

**Validaciones de Seguridad:**
- Prevención de auto-reportes
- Verificación de reportes pendientes duplicados
- Validación de datos con Zod schemas
- Manejo robusto de errores

### 3. Endpoints de API Desplegados

| Función | URL | Métodos | Descripción |
|---------|-----|---------|-------------|
| `apiUsersV2` | https://us-central1-lgtbiq26.cloudfunctions.net/apiUsersV2 | GET, PUT, POST | API completa de gestión de usuarios |
| `apiDiscoveryV2` | https://us-central1-lgtbiq26.cloudfunctions.net/apiDiscoveryV2 | GET, POST | Recomendaciones y discovery |
| `apiModerationV2` | https://us-central1-lgtbiq26.cloudfunctions.net/apiModerationV2 | GET, POST | Panel de moderación |
| `apiHealthV2` | https://us-central1-lgtbiq26.cloudfunctions.net/apiHealthV2 | GET | Health check y status |

## 🎯 Cómo Integrar en tu Aplicación

### 1. Importar Componentes

```javascript
import DiscoveryFilterButton from '../components/DiscoveryFilterButton';
import UserReportButton from '../components/UserReportButton';
```

### 2. Agregar a tu Página de Swipe

```javascript
// En tu componente SwipePage
const SwipePage = () => {
  const [discoveryFilters, setDiscoveryFilters] = useState(null);

  const handleFiltersUpdate = (newFilters) => {
    setDiscoveryFilters(newFilters);
    // Recargar perfiles con nuevos filtros
    reloadProfiles(newFilters);
  };

  return (
    <div className="relative min-h-screen">
      {/* Tu contenido de swipe existente */}
      
      {/* Botón flotante de filtros */}
      <DiscoveryFilterButton onFiltersUpdated={handleFiltersUpdate} />
      
      {/* En el perfil de cada usuario */}
      {currentUser && (
        <div className="absolute top-4 right-4 z-10">
          <UserReportButton 
            userId={currentUser.id}
            userName={currentUser.name}
          />
        </div>
      )}
    </div>
  );
};
```

### 3. Configuración de Variables de Entorno

```javascript
// En tu archivo .env o configuración
VITE_API_URL=https://us-central1-lgtbiq26.cloudfunctions.net
```

### 4. Manejo de Telegram Web App

Los componentes están diseñados para funcionar con Telegram Web App:
- Obtienen automáticamente `initData` de `window.Telegram.WebApp`
- Fallback a datos de prueba en desarrollo
- Validación completa del token de Telegram

## 📊 Estructura de Datos

### Preferencias de Descubrimiento

```typescript
interface DiscoverySettings {
  minAge?: number;              // 18-99
  maxAge?: number;              // 18-99
  maxDistance?: number;         // 1-1000 km
  interestedInGender?: string[];  // ['male', 'female', 'non-binary']
  interestedInRoles?: string[]; // ['ACTIVO', 'PASIVO', 'VERSATIL']
  lookingForFriends?: boolean;  // Búsqueda de amistad
  lookingForRomance?: boolean;  // Búsqueda de romance
  lookingForPoly?: boolean;     // Búsqueda de relaciones poliamorosas
}
```

### Categorías de Reporte

- `INAPPROPRIATE_CONTENT` - Contenido inapropiado
- `HARASSMENT` - Acoso o acoso sexual
- `FAKE_PROFILE` - Perfil falso o engañoso
- `SPAM` - Spam o mensajes no deseados
- `HATE_SPEECH` - Discurso de odio
- `MINOR` - Usuario menor de edad
- `OTHER` - Otro motivo

## 🔒 Seguridad y Privacidad

### Medidas Implementadas:

1. **Validación de Datos:** Todos los inputs validados con Zod schemas
2. **Prevención de Abuso:** Límite de reportes por usuario y tiempo
3. **Auditoría Completa:** Todos los cambios registrados con timestamp e IP
4. **Auto-moderación:** Sistema automático de detección de usuarios problemáticos
5. **Prevención de Reportes Falsos:** Advertencias claras y consecuencias

### Privacidad:

- Los filtros son privados y solo visibles para el usuario
- Los reportes son anónimos para el usuario reportado
- La auditoría es accesible solo para moderadores autorizados

## 🧪 Testing

### Prueba de Preferencias

```bash
# Obtener preferencias actuales
curl -X GET "https://us-central1-lgtbiq26.cloudfunctions.net/apiUsersV2/api/users/discovery?initData=test_init_data_12345"

# Actualizar preferencias
curl -X PUT "https://us-central1-lgtbiq26.cloudfunctions.net/apiUsersV2/api/users/discovery" \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "test_init_data_12345",
    "minAge": 25,
    "maxAge": 45,
    "maxDistance": 100,
    "interestedInGender": ["male"],
    "lookingForRomance": true
  }'
```

### Prueba de Reporte

```bash
# Reportar usuario
curl -X POST "https://us-central1-lgtbiq26.cloudfunctions.net/apiUsersV2/api/users/report" \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "test_init_data_12345",
    "reportedUserId": "user456",
    "reason": "INAPPROPRIATE_CONTENT",
    "details": "Contenido inapropiado en el perfil"
  }'
```

## 🎨 Personalización Visual

Los componentes están diseñados con Tailwind CSS y pueden ser fácilmente personalizados:

### Colores Principales:
- **Púrpura (#9333ea):** Primario, botones de acción
- **Rosa (#ec4899):** Secundario, acentos
- **Grises:** Fondos y texto secundario

### Clases CSS Personalizadas:
- `.slider-purple:` Estilos personalizados para sliders
- Gradientes animados en botones principales
- Sombras y efectos hover para mejor UX

## 📈 Métricas y Monitoreo

### Eventos de Auditoría Registrados:
- `DISCOVERY_SETTINGS_UPDATED` - Cambios en preferencias
- `USER_REPORTED` - Nuevos reportes de usuarios
- `AUTO_FLAG_TRIGGERED` - Activación de auto-moderación
- `SHADOW_BAN_APPLIED` - Aplicación de shadow ban automático

### Monitoreo Recomendado:
- Tasa de uso de filtros por usuario
- Distribución de categorías de reporte
- Tiempo promedio de resolución de reportes
- Efectividad del algoritmo de recomendación

## 🚀 Próximos Pasos Sugeridos

1. **Analytics de Uso:** Implementar tracking de qué filtros usan más los usuarios
2. **Filtros Avanzados:** Añadir filtros por intereses, hobbies, etc.
3. **IA de Moderación:** Implementar detección automática de contenido problemático
4. **Sistema de Recompensas:** Recompensar a usuarios que reporten contenido válido
5. **Moderación Colaborativa:** Permitir a usuarios confiables ayudar en la moderación

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación:
1. Verifica los logs en Firebase Console
2. Revisa la sección de errores en este documento
3. Consulta la documentación de Firebase Functions
4. Contacta al equipo de desarrollo

---

**✨ Felicitaciones por completar la Fase 3! Tu aplicación ahora tiene una experiencia de usuario completa con filtros avanzados y sistema de moderación profesional.** 🌈
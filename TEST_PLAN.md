# Plan de Pruebas: Autenticación y Redirección

Este documento describe los pasos para verificar la solución implementada para el problema de redirección y la nueva funcionalidad de acceso directo.

## 1. Pruebas de Usuario No Registrado / Sesión Nueva

**Objetivo:** Verificar que un usuario nuevo o sin sesión pueda iniciar sesión y sea redirigido al dashboard.

1.  **Estado Inicial:** Navegador en modo incógnito o sesión cerrada.
2.  **Acción:** Ir a la página principal (`/`).
3.  **Resultado Esperado:**
    *   Se muestra el botón "Iniciar con Telegram".
    *   NO se muestra el botón "Ir al Dashboard".
4.  **Acción:** Hacer clic en "Iniciar con Telegram" y completar la autenticación en el widget.
5.  **Resultado Esperado:**
    *   El widget se cierra.
    *   Se muestra un mensaje de carga o transición.
    *   La aplicación redirige automáticamente a `/app`.
    *   Se muestra la pantalla de "Bienvenid@" en el dashboard.
    *   **NO** se redirige a `/register`.

## 2. Pruebas de Usuario con Sesión Activa (Acceso Directo)

**Objetivo:** Verificar que un usuario ya autenticado pueda acceder directamente sin volver a loguearse.

1.  **Estado Inicial:** Usuario ya autenticado (después de la prueba 1).
2.  **Acción:** Volver a la página principal (`/`) o recargar la página.
3.  **Resultado Esperado:**
    *   La página detecta la sesión activa.
    *   En lugar del botón de Telegram, se muestra:
        *   Un saludo: "Hola, [Nombre]"
        *   Un botón destacado: "Ir al Dashboard"
        *   Un enlace pequeño para "Cerrar sesión".
4.  **Acción:** Hacer clic en "Ir al Dashboard".
5.  **Resultado Esperado:**
    *   Redirección inmediata a `/app`.
    *   Acceso correcto al contenido del dashboard.

## 3. Pruebas de Cierre de Sesión

**Objetivo:** Verificar que el cierre de sesión funcione y restaure el estado inicial.

1.  **Estado Inicial:** Usuario en la página principal con sesión activa.
2.  **Acción:** Hacer clic en "Cerrar sesión".
3.  **Resultado Esperado:**
    *   La interfaz se actualiza.
    *   Desaparece el botón "Ir al Dashboard".
    *   Aparece nuevamente el botón "Iniciar con Telegram".

## 4. Pruebas de Error de Autenticación (Simulado)

**Objetivo:** Verificar que un fallo en el widget no redirija erróneamente al registro.

1.  **Estado Inicial:** Página principal.
2.  **Nota:** Si ocurre un error de red o el usuario cancela el login en el widget.
3.  **Resultado Esperado:**
    *   Se muestra una alerta indicando el error.
    *   El usuario permanece en la página principal (`/`).
    *   **NO** se redirige a `/register`.

## 5. Verificación de Protección de Rutas

1.  **Acción:** Intentar acceder a `/app` sin estar logueado (en incógnito).
2.  **Resultado Esperado:**
    *   Se carga la página.
    *   Se muestra el mensaje "No autenticado" o un spinner de carga seguido del mensaje.
    *   No se permite ver el contenido protegido.

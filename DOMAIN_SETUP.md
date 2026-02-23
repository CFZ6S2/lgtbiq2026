# Resolución de "Bot Invalid Domain"

El error **"Bot Invalid Domain"** ocurre cuando intentas usar el Widget de Login de Telegram en un dominio que no ha sido autorizado previamente con `@BotFather`.

## Pasos para Solucionar

### 1. Identificar el Dominio
Tu aplicación está desplegada en:
> **https://lgtbiq26.web.app**

(También puede ser accesible vía `https://lgtbiq26.firebaseapp.com`)

### 2. Configurar en Telegram (@BotFather)
Debes decirle a Telegram que confíe en este dominio.

1.  Abre Telegram y busca al usuario **@BotFather**.
2.  Envía el comando: `/mybots`
3.  Selecciona tu bot de la lista (el que tiene ID `8540644362`).
4.  Ve a **Bot Settings** (Ajustes del Bot).
5.  Selecciona **Domain** (o `Set Domain`).
6.  Envía la URL de tu dominio:
    ```text
    https://lgtbiq26.web.app
    ```
7.  (Opcional) Si usas la otra URL de Firebase, repite el proceso o usa esa: `https://lgtbiq26.firebaseapp.com`

### 3. Verificar
1.  Espera unos segundos.
2.  Abre tu sitio web: [https://lgtbiq26.web.app](https://lgtbiq26.web.app)
3.  Haz clic en el botón "Iniciar con Telegram".
4.  El widget debería abrirse correctamente sin mostrar el error "Invalid Domain".

## Notas Importantes

*   **Localhost:** Telegram **NO** permite usar `localhost` como dominio válido para el widget de producción. Por eso implementamos el botón **"[DEV] Simular Login"** en tu entorno local.
*   **HTTPS:** El dominio siempre debe usar `https`, lo cual Firebase Hosting proporciona automáticamente.

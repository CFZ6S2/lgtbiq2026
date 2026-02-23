"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramBot = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const telegraf_1 = require("telegraf");
const crypto = __importStar(require("crypto"));
// Initialize admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// Configuración del bot
const cfg = functions.config().telegram || {};
const botToken = process.env.BOT_TOKEN || cfg.bot_token || '';
if (!botToken) {
    console.error('BOT_TOKEN no configurado. El bot de Telegram no funcionará.');
}
const bot = new telegraf_1.Telegraf(botToken);
// Middleware para logging
bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log('Response time: %sms', ms);
});
// Comando /start
bot.start((ctx) => {
    ctx.reply('¡Hola! Bienvenido a Prisma, la comunidad LGBTIQ+ segura. 🏳️‍🌈\n\n' +
        'Para comenzar tu registro, necesito verificar tu número de teléfono. ' +
        'Esto nos ayuda a mantener la comunidad segura y evitar cuentas falsas.\n\n' +
        'Usa el comando /register para iniciar.', telegraf_1.Markup.keyboard([
        ['/register']
    ]).resize());
});
// Comando /register
bot.command('register', async (ctx) => {
    // Verificar si el usuario ya está registrado
    const userId = String(ctx.from.id);
    const userSnapshot = await db.collection('users').where('telegramId', '==', userId).get();
    if (!userSnapshot.empty) {
        return ctx.reply('¡Ya estás registrado! Puedes usar la aplicación web para acceder.');
    }
    return ctx.reply('Por favor, comparte tu contacto para verificar tu cuenta. ' +
        'Solo usaremos esto para validación de seguridad.', telegraf_1.Markup.keyboard([
        [telegraf_1.Markup.button.contactRequest('📱 Compartir contacto')]
    ]).resize());
});
// Manejo de contacto
bot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;
    const userId = String(ctx.from.id);
    // Verificar que el contacto pertenece al usuario que envía el mensaje
    if (contact.user_id !== ctx.from.id) {
        return ctx.reply('Error: Por favor comparte tu propio contacto.');
    }
    try {
        // Hash del número de teléfono para privacidad
        const phoneHash = crypto.createHash('sha256').update(contact.phone_number).digest('hex');
        // Verificar si el número ya está en uso
        const existingPhone = await db.collection('users').where('phoneHash', '==', phoneHash).get();
        if (!existingPhone.empty) {
            return ctx.reply('Este número de teléfono ya está asociado a otra cuenta.');
        }
        // Crear registro temporal o marcar como verificado
        // En este caso, creamos el usuario base
        await db.collection('users').doc(userId).set({
            telegramId: userId,
            phoneHash: phoneHash,
            phoneVerified: true,
            username: ctx.from.username || null,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name || null,
            language: ctx.from.language_code || 'es',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending_profile' // Estado para indicar que falta completar perfil en web
        }, { merge: true });
        await ctx.reply('¡Verificación exitosa! ✅\n\n' +
            'Tu cuenta ha sido creada. Ahora puedes completar tu perfil en nuestra aplicación web.', telegraf_1.Markup.removeKeyboard());
        // Opcional: Enviar botón para abrir la Web App
        return ctx.reply('Completa tu perfil aquí:', telegraf_1.Markup.inlineKeyboard([
            telegraf_1.Markup.button.url('Abrir Prisma', 'https://lgtbiq26.web.app/register')
        ]));
    }
    catch (error) {
        console.error('Error al registrar usuario:', error);
        return ctx.reply('Hubo un error al procesar tu registro. Por favor intenta más tarde.');
    }
});
// Exportar función de webhook
exports.telegramBot = functions.https.onRequest(async (req, res) => {
    // Solo procesar actualizaciones de Telegram
    // Validar secret token si se configura
    try {
        await bot.handleUpdate(req.body, res);
    }
    catch (err) {
        console.error('Error handling update:', err);
        res.status(500).send('Error');
    }
});
//# sourceMappingURL=bot.js.map
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDiscoveryStats = exports.handleDiscoveryAction = exports.handleDiscoverySettings = exports.handleRecommendations = void 0;
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
const recommendationService_js_1 = require("../services/recommendationService.js");
const auditService_js_1 = require("../services/auditService.js");
const validateInitData_js_1 = require("../validateInitData.js");
// Esquemas de validación
const ZRecsBody = zod_1.z.object({
    initData: zod_1.z.string(),
    filterOrientations: zod_1.z.array(zod_1.z.string()).optional(),
    intentsFriends: zod_1.z.boolean().optional(),
    intentsRomance: zod_1.z.boolean().optional(),
    intentsPoly: zod_1.z.boolean().optional(),
    maxDistanceKm: zod_1.z.number().optional(),
    limit: zod_1.z.number().min(1).max(50).optional().default(20),
    excludeBlocked: zod_1.z.boolean().optional().default(true),
    excludeAlreadyLiked: zod_1.z.boolean().optional().default(true),
    excludeMatches: zod_1.z.boolean().optional().default(true)
});
const ZDiscoverySettingsBody = zod_1.z.object({
    initData: zod_1.z.string(),
    minAge: zod_1.z.number().min(18).max(99).optional().default(18),
    maxAge: zod_1.z.number().min(18).max(99).optional().default(99),
    maxDistance: zod_1.z.number().min(1).max(500).optional().default(50),
    interestedInGender: zod_1.z.array(zod_1.z.string()).optional().default([]),
    interestedInRoles: zod_1.z.array(zod_1.z.enum(['TOP', 'BOTTOM', 'VERSATILE', 'OTHER'])).optional().default([]),
    lookingForFriends: zod_1.z.boolean().optional().default(true),
    lookingForRomance: zod_1.z.boolean().optional().default(true),
    lookingForPoly: zod_1.z.boolean().optional().default(true)
});
const ZDiscoveryActionBody = zod_1.z.object({
    initData: zod_1.z.string(),
    targetUserId: zod_1.z.string(),
    action: zod_1.z.enum(['view', 'like', 'pass', 'block']),
    score: zod_1.z.number().optional()
});
const recommendationService = recommendationService_js_1.RecommendationService.getInstance();
const auditService = auditService_js_1.AuditService.getInstance();
/**
 * Handler para obtener recomendaciones de usuarios
 */
async function handleRecommendations(req, res) {
    var _a;
    try {
        // Validar entrada
        const validation = ZRecsBody.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                ok: false,
                error: 'Datos inválidos',
                details: validation.error.errors
            });
        }
        const { initData, filterOrientations, intentsFriends, intentsRomance, intentsPoly, maxDistanceKm, limit, excludeBlocked, excludeAlreadyLiked, excludeMatches } = validation.data;
        // Validar init data
        const validationResult = (0, validateInitData_js_1.validateInitData)(initData, process.env.BOT_TOKEN || '');
        if (!validationResult.valid || !((_a = validationResult.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({
                ok: false,
                error: 'Init data inválido'
            });
        }
        const userId = validationResult.user.id.toString();
        // Verificar si el usuario está bloqueado
        const blockStatus = await auditService.isUserBlocked(userId);
        if (blockStatus.blocked) {
            return res.status(403).json({
                ok: false,
                error: 'Usuario bloqueado',
                reason: blockStatus.reason
            });
        }
        // Obtener configuración de descubrimiento actualizada
        const currentSettings = await recommendationService.getDiscoverySettings(userId);
        const updatedSettings = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, currentSettings), (maxDistanceKm && { maxDistance: maxDistanceKm })), (intentsFriends !== undefined && { lookingForFriends: intentsFriends })), (intentsRomance !== undefined && { lookingForRomance: intentsRomance })), (intentsPoly !== undefined && { lookingForPoly: intentsPoly }));
        // Actualizar configuración si hay cambios
        if (JSON.stringify(updatedSettings) !== JSON.stringify(currentSettings)) {
            await req.app.locals.db.collection('discoverySettings').doc(userId).set(updatedSettings);
        }
        // Obtener recomendaciones
        const recommendations = await recommendationService.getRecommendations({
            userId,
            limit,
            excludeBlocked,
            excludeAlreadyLiked,
            excludeMatches
        });
        // Registrar acción de descubrimiento
        await recommendationService.logDiscoveryAction(userId, 'view', 'batch', recommendations.length > 0 ? recommendations[0].compatibilityScore : undefined);
        // Registrar en auditoría
        await auditService.logAction({
            actorId: userId,
            targetId: 'system',
            action: 'RECOMMENDATIONS_REQUESTED',
            details: {
                limit,
                results: recommendations.length,
                filters: { filterOrientations, intentsFriends, intentsRomance, intentsPoly, maxDistanceKm }
            }
        });
        return res.json({
            ok: true,
            recommendations: recommendations.map(rec => ({
                user: {
                    id: rec.user.id,
                    displayName: rec.user.displayName,
                    bio: rec.user.bio,
                    city: rec.user.city,
                    orientation: rec.user.orientation,
                    age: rec.user.age
                },
                score: rec.compatibilityScore,
                distance: rec.distance
            }))
        });
    }
    catch (error) {
        console.error('Error obteniendo recomendaciones:', error);
        return res.status(500).json({
            ok: false,
            error: 'Error interno del servidor'
        });
    }
}
exports.handleRecommendations = handleRecommendations;
/**
 * Handler para actualizar configuración de descubrimiento
 */
async function handleDiscoverySettings(req, res) {
    var _a;
    try {
        // Validar entrada
        const validation = ZDiscoverySettingsBody.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                ok: false,
                error: 'Datos inválidos',
                details: validation.error.errors
            });
        }
        const _b = validation.data, { initData } = _b, settings = __rest(_b, ["initData"]);
        // Validar init data
        const validationResult = (0, validateInitData_js_1.validateInitData)(initData, process.env.BOT_TOKEN || '');
        if (!validationResult.valid || !((_a = validationResult.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({
                ok: false,
                error: 'Init data inválido'
            });
        }
        const userId = validationResult.user.id.toString();
        // Actualizar configuración
        await req.app.locals.db.collection('discoverySettings').doc(userId).set(settings);
        // Registrar en auditoría
        await auditService.logAction({
            actorId: userId,
            targetId: userId,
            action: 'DISCOVERY_SETTINGS_UPDATED',
            details: settings
        });
        return res.json({
            ok: true,
            message: 'Configuración actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('Error actualizando configuración de descubrimiento:', error);
        return res.status(500).json({
            ok: false,
            error: 'Error interno del servidor'
        });
    }
}
exports.handleDiscoverySettings = handleDiscoverySettings;
/**
 * Handler para registrar acciones de descubrimiento (ver, like, pass, block)
 */
async function handleDiscoveryAction(req, res) {
    var _a;
    try {
        // Validar entrada
        const validation = ZDiscoveryActionBody.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                ok: false,
                error: 'Datos inválidos',
                details: validation.error.errors
            });
        }
        const { initData, targetUserId, action, score } = validation.data;
        // Validar init data
        const validationResult = (0, validateInitData_js_1.validateInitData)(initData, process.env.BOT_TOKEN || '');
        if (!validationResult.valid || !((_a = validationResult.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({
                ok: false,
                error: 'Init data inválido'
            });
        }
        const userId = validationResult.user.id.toString();
        // Verificar si el usuario está bloqueado
        const blockStatus = await auditService.isUserBlocked(userId);
        if (blockStatus.blocked) {
            return res.status(403).json({
                ok: false,
                error: 'Usuario bloqueado',
                reason: blockStatus.reason
            });
        }
        // Registrar acción
        await recommendationService.logDiscoveryAction(userId, action, targetUserId, score);
        // Manejar acciones específicas
        switch (action) {
            case 'like':
                // Crear like en base de datos
                await req.app.locals.db.collection('likes').add({
                    fromId: userId,
                    toId: targetUserId,
                    timestamp: firestore_1.FieldValue.serverTimestamp()
                });
                break;
            case 'block':
                // Crear bloqueo
                await req.app.locals.db.collection('blocks').add({
                    blockerId: userId,
                    blockedId: targetUserId,
                    timestamp: firestore_1.FieldValue.serverTimestamp()
                });
                break;
            case 'pass':
                // Registrar pass para evitar mostrar de nuevo
                await req.app.locals.db.collection('passes').add({
                    userId: userId,
                    passedUserId: targetUserId,
                    timestamp: firestore_1.FieldValue.serverTimestamp()
                });
                break;
        }
        // Registrar en auditoría
        await auditService.logAction({
            actorId: userId.toString(),
            targetId: targetUserId.toString(),
            action: `DISCOVERY_${action.toUpperCase()}`,
            details: { score }
        });
        return res.json({
            ok: true,
            message: `Acción ${action} registrada exitosamente`
        });
    }
    catch (error) {
        console.error('Error registrando acción de descubrimiento:', error);
        return res.status(500).json({
            ok: false,
            error: 'Error interno del servidor'
        });
    }
}
exports.handleDiscoveryAction = handleDiscoveryAction;
/**
 * Handler para obtener estadísticas de descubrimiento
 */
async function handleDiscoveryStats(req, res) {
    var _a;
    try {
        const { initData } = req.body;
        // Validar init data
        const validationResult = (0, validateInitData_js_1.validateInitData)(initData, process.env.BOT_TOKEN || '');
        if (!validationResult.valid || !((_a = validationResult.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({
                ok: false,
                error: 'Init data inválido'
            });
        }
        const userId = validationResult.user.id.toString();
        const stats = await recommendationService.getDiscoveryStats(userId);
        return res.json({
            ok: true,
            stats
        });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas de descubrimiento:', error);
        return res.status(500).json({
            ok: false,
            error: 'Error interno del servidor'
        });
    }
}
exports.handleDiscoveryStats = handleDiscoveryStats;
//# sourceMappingURL=recommendations.js.map
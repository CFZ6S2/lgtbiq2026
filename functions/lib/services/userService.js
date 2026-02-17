"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const firebase_js_1 = require("../config/firebase.js");
const firestore_1 = require("firebase-admin/firestore");
class UserService {
    /**
     * Obtener la configuración de descubrimiento de un usuario
     */
    async getDiscoverySettings(userId) {
        try {
            const settingsDoc = await firebase_js_1.db.collection('discoverySettings').doc(userId).get();
            if (!settingsDoc.exists) {
                // Retornar configuración por defecto
                return {
                    minAge: 18,
                    maxAge: 99,
                    maxDistance: 50,
                    interestedInGender: [],
                    interestedInRoles: [],
                    lookingForFriends: true,
                    lookingForRomance: true,
                    lookingForPoly: false
                };
            }
            return settingsDoc.data();
        }
        catch (error) {
            console.error('Error obteniendo configuración de descubrimiento:', error);
            throw new Error('Error al obtener configuración de descubrimiento');
        }
    }
    /**
     * Actualizar la configuración de descubrimiento de un usuario
     */
    async updateDiscoverySettings(userId, settings) {
        try {
            // Validar que la edad mínima no sea mayor que la máxima
            if (settings.minAge && settings.maxAge && settings.minAge > settings.maxAge) {
                throw new Error('La edad mínima no puede ser mayor que la edad máxima');
            }
            const settingsWithTimestamp = Object.assign(Object.assign({}, settings), { updatedAt: firestore_1.FieldValue.serverTimestamp() });
            await firebase_js_1.db.collection('discoverySettings').doc(userId).set(settingsWithTimestamp, { merge: true });
            // Registrar en auditoría
            await firebase_js_1.db.collection('auditLog').add({
                actorId: userId,
                targetId: userId,
                action: 'DISCOVERY_SETTINGS_UPDATED',
                details: settings,
                timestamp: firestore_1.FieldValue.serverTimestamp(),
                ip: 'system' // Se puede obtener del request si está disponible
            });
            return await this.getDiscoverySettings(userId) || {
                minAge: 18,
                maxAge: 99,
                maxDistance: 50,
                interestedInGender: [],
                interestedInRoles: [],
                lookingForFriends: true,
                lookingForRomance: true,
                lookingForPoly: false
            };
        }
        catch (error) {
            console.error('Error actualizando configuración de descubrimiento:', error);
            throw error;
        }
    }
    /**
     * Obtener el perfil completo de un usuario incluyendo configuración de descubrimiento
     */
    async getUserProfile(userId) {
        try {
            const [userDoc, settingsDoc] = await Promise.all([
                firebase_js_1.db.collection('users').doc(userId).get(),
                firebase_js_1.db.collection('discoverySettings').doc(userId).get()
            ]);
            if (!userDoc.exists) {
                throw new Error('Usuario no encontrado');
            }
            const userData = userDoc.data();
            const settingsData = settingsDoc.exists ? settingsDoc.data() : await this.getDiscoverySettings(userId);
            return Object.assign(Object.assign({}, userData), { discoverySettings: settingsData, id: userId });
        }
        catch (error) {
            console.error('Error obteniendo perfil de usuario:', error);
            throw new Error('Error al obtener perfil de usuario');
        }
    }
    /**
     * Verificar si un usuario está bloqueado o tiene restricciones
     */
    async getUserRestrictions(userId) {
        var _a;
        try {
            const userDoc = await firebase_js_1.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return { isBlocked: true, isShadowBanned: true };
            }
            const userData = userDoc.data();
            if (!userData) {
                return { isBlocked: true, isShadowBanned: true };
            }
            const now = new Date();
            // Verificar bloqueo activo
            const isBlocked = userData.isBlocked || false;
            const blockExpiresAt = (_a = userData.blockExpiresAt) === null || _a === void 0 ? void 0 : _a.toDate();
            const blockExpired = blockExpiresAt && blockExpiresAt < now;
            // Verificar shadow ban
            const isShadowBanned = userData.isShadowBanned || false;
            return {
                isBlocked: isBlocked && !blockExpired,
                blockReason: userData.blockReason,
                blockExpiresAt: blockExpiresAt,
                isShadowBanned
            };
        }
        catch (error) {
            console.error('Error verificando restricciones de usuario:', error);
            return { isBlocked: true, isShadowBanned: true };
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map
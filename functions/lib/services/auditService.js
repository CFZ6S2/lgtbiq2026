"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
class AuditService {
    static getInstance() {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }
    /**
     * Registra una acción en el log de auditoría
     */
    async logAction(entry) {
        try {
            const logEntry = Object.assign(Object.assign({}, entry), { timestamp: firestore_1.FieldValue.serverTimestamp() });
            const docRef = await firebase_1.db.collection('auditLogs').add(logEntry);
            return docRef.id;
        }
        catch (error) {
            console.error('Error registrando acción de auditoría:', error);
            throw new Error('No se pudo registrar la acción de auditoría');
        }
    }
    /**
     * Obtiene el log de auditoría para un usuario específico (como actor o target)
     */
    async getUserAuditLog(userId, limit = 50) {
        try {
            const [actorLogs, targetLogs] = await Promise.all([
                firebase_1.db.collection('auditLogs')
                    .where('actorId', '==', userId)
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get(),
                firebase_1.db.collection('auditLogs')
                    .where('targetId', '==', userId)
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get()
            ]);
            const allLogs = [
                ...actorLogs.docs.map(doc => (Object.assign({ id: doc.id }, doc.data()))),
                ...targetLogs.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())))
            ];
            // Ordenar por timestamp y limitar
            allLogs.sort((a, b) => {
                var _a, _b;
                const timeA = ((_a = a.timestamp) === null || _a === void 0 ? void 0 : _a.toMillis()) || 0;
                const timeB = ((_b = b.timestamp) === null || _b === void 0 ? void 0 : _b.toMillis()) || 0;
                return timeB - timeA;
            });
            return allLogs.slice(0, limit);
        }
        catch (error) {
            console.error('Error obteniendo log de auditoría:', error);
            return [];
        }
    }
    /**
     * Crea una acción de moderación
     */
    async createModerationAction(action) {
        try {
            const actionData = Object.assign(Object.assign({}, action), { createdAt: firestore_1.FieldValue.serverTimestamp(), expiresAt: action.duration ?
                    new Date(Date.now() + (action.duration * 24 * 60 * 60 * 1000)) :
                    null });
            const docRef = await firebase_1.db.collection('moderationActions').add(actionData);
            // Registrar en auditoría
            await this.logAction({
                actorId: action.moderatorId,
                targetId: action.targetUserId,
                action: action.action,
                details: {
                    moderationActionId: docRef.id,
                    reason: action.reason,
                    duration: action.duration
                }
            });
            return docRef.id;
        }
        catch (error) {
            console.error('Error creando acción de moderación:', error);
            throw new Error('No se pudo crear la acción de moderación');
        }
    }
    /**
     * Revierte una acción de moderación
     */
    async reverseModerationAction(actionId, moderatorId, reason) {
        var _a, _b;
        try {
            const actionRef = firebase_1.db.collection('moderationActions').doc(actionId);
            const actionDoc = await actionRef.get();
            if (!actionDoc.exists) {
                throw new Error('Acción de moderación no encontrada');
            }
            await actionRef.update({
                status: 'REVERSED',
                reversedBy: moderatorId,
                reverseReason: reason,
                reversedAt: firestore_1.FieldValue.serverTimestamp()
            });
            // Registrar en auditoría
            await this.logAction({
                actorId: moderatorId,
                targetId: (_a = actionDoc.data()) === null || _a === void 0 ? void 0 : _a.targetUserId,
                action: 'MODERATION_REVERSE',
                details: {
                    originalActionId: actionId,
                    originalAction: (_b = actionDoc.data()) === null || _b === void 0 ? void 0 : _b.action,
                    reason
                }
            });
        }
        catch (error) {
            console.error('Error revirtiendo acción de moderación:', error);
            throw new Error('No se pudo revertir la acción de moderación');
        }
    }
    /**
     * Obtiene las acciones de moderación activas para un usuario
     */
    async getActiveModerationActions(userId) {
        try {
            const snapshot = await firebase_1.db.collection('moderationActions')
                .where('targetUserId', '==', userId)
                .where('status', '==', 'ACTIVE')
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            console.error('Error obteniendo acciones de moderación activas:', error);
            return [];
        }
    }
    /**
     * Crea un reporte
     */
    async createReport(report) {
        try {
            const reportData = Object.assign(Object.assign({}, report), { createdAt: firestore_1.FieldValue.serverTimestamp() });
            const docRef = await firebase_1.db.collection('reports').add(reportData);
            // Registrar en auditoría
            await this.logAction({
                actorId: report.reporterId,
                targetId: report.reportedId,
                action: 'USER_REPORT',
                details: {
                    reportId: docRef.id,
                    reason: report.reason,
                    category: report.category
                }
            });
            return docRef.id;
        }
        catch (error) {
            console.error('Error creando reporte:', error);
            throw new Error('No se pudo crear el reporte');
        }
    }
    /**
     * Resuelve un reporte
     */
    async resolveReport(reportId, moderatorId, resolution, status) {
        var _a;
        try {
            const reportRef = firebase_1.db.collection('reports').doc(reportId);
            const reportDoc = await reportRef.get();
            if (!reportDoc.exists) {
                throw new Error('Reporte no encontrado');
            }
            await reportRef.update({
                status,
                moderatorId,
                resolution,
                resolvedAt: firestore_1.FieldValue.serverTimestamp()
            });
            // Registrar en auditoría
            await this.logAction({
                actorId: moderatorId,
                targetId: (_a = reportDoc.data()) === null || _a === void 0 ? void 0 : _a.reportedId,
                action: 'REPORT_RESOLVED',
                details: {
                    reportId,
                    resolution,
                    status
                }
            });
        }
        catch (error) {
            console.error('Error resolviendo reporte:', error);
            throw new Error('No se pudo resolver el reporte');
        }
    }
    /**
     * Obtiene reportes pendientes para moderación
     */
    async getPendingReports(limit = 50) {
        try {
            const snapshot = await firebase_1.db.collection('reports')
                .where('status', '==', 'PENDING')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            console.error('Error obteniendo reportes pendientes:', error);
            return [];
        }
    }
    /**
     * Verifica si un usuario tiene acceso a funciones de moderación
     */
    async hasModerationAccess(userId) {
        try {
            const userDoc = await firebase_1.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return false;
            }
            const userData = userDoc.data();
            return (userData === null || userData === void 0 ? void 0 : userData.role) === 'MODERATOR' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'ADMIN';
        }
        catch (error) {
            console.error('Error verificando acceso de moderación:', error);
            return false;
        }
    }
    /**
     * Verifica si un usuario está bloqueado o suspendido
     */
    async isUserBlocked(userId) {
        var _a;
        try {
            const actions = await this.getActiveModerationActions(userId);
            const blockingActions = actions.filter(action => action.action === 'USER_BAN' || action.action === 'USER_SUSPEND');
            if (blockingActions.length === 0) {
                return { blocked: false };
            }
            // Tomar la acción más reciente
            const latestAction = blockingActions[0];
            // Verificar si está expirada
            if (latestAction.expiresAt && latestAction.expiresAt.toDate() < new Date()) {
                // Marcar como expirada
                await firebase_1.db.collection('moderationActions').doc(latestAction.id).update({
                    status: 'EXPIRED'
                });
                return { blocked: false };
            }
            return {
                blocked: true,
                reason: latestAction.reason,
                expiresAt: (_a = latestAction.expiresAt) === null || _a === void 0 ? void 0 : _a.toDate()
            };
        }
        catch (error) {
            console.error('Error verificando si usuario está bloqueado:', error);
            return { blocked: false };
        }
    }
    /**
     * Obtiene estadísticas de moderación
     */
    async getModerationStats(timeRange = 'week') {
        try {
            const now = new Date();
            const startDate = new Date();
            switch (timeRange) {
                case 'day':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            const [reportsSnapshot, actionsSnapshot] = await Promise.all([
                firebase_1.db.collection('reports')
                    .where('createdAt', '>=', startDate)
                    .get(),
                firebase_1.db.collection('moderationActions')
                    .where('createdAt', '>=', startDate)
                    .get()
            ]);
            const reports = reportsSnapshot.docs.map(doc => doc.data());
            const actions = actionsSnapshot.docs.map(doc => doc.data());
            const categoryCounts = {};
            reports.forEach(report => {
                categoryCounts[report.category] = (categoryCounts[report.category] || 0) + 1;
            });
            const topCategories = Object.entries(categoryCounts)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            return {
                totalReports: reports.length,
                pendingReports: reports.filter(r => r.status === 'PENDING').length,
                resolvedReports: reports.filter(r => r.status === 'RESOLVED' || r.status === 'DISMISSED').length,
                totalActions: actions.length,
                activeActions: actions.filter(a => a.status === 'ACTIVE').length,
                topReportCategories: topCategories
            };
        }
        catch (error) {
            console.error('Error obteniendo estadísticas de moderación:', error);
            return {
                totalReports: 0,
                pendingReports: 0,
                resolvedReports: 0,
                totalActions: 0,
                activeActions: 0,
                topReportCategories: []
            };
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=auditService.js.map
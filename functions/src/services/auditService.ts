import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';

export interface AuditLogEntry {
  id?: string;
  actorId: string;
  targetId: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: any;
}

export interface ModerationAction {
  id?: string;
  moderatorId: string;
  targetUserId: string;
  action: ModerationActionType;
  reason: string;
  evidence?: string[];
  duration?: number; // en días, para acciones temporales
  status: 'ACTIVE' | 'REVERSED' | 'EXPIRED';
  createdAt?: any;
  expiresAt?: any;
}

export type ModerationActionType = 
  | 'USER_BAN'
  | 'USER_SUSPEND'
  | 'PROFILE_HIDE'
  | 'PROFILE_VERIFY'
  | 'MESSAGE_DELETE'
  | 'REPORT_RESOLVE'
  | 'REPORT_DISMISS'
  | 'USER_WARN';

export interface Report {
  id?: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  details?: string;
  category: ReportCategory;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  moderatorId?: string;
  resolution?: string;
  createdAt?: any;
  resolvedAt?: any;
}

export type ReportCategory = 
  | 'HARASSMENT'
  | 'INAPPROPRIATE_CONTENT'
  | 'FAKE_PROFILE'
  | 'SPAM'
  | 'UNDERAGE'
  | 'OTHER';

export class AuditService {
  private static instance: AuditService;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Registra una acción en el log de auditoría
   */
  async logAction(entry: AuditLogEntry): Promise<string> {
    try {
      const logEntry = {
        ...entry,
        timestamp: FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('auditLogs').add(logEntry);
      return docRef.id;
    } catch (error) {
      console.error('Error registrando acción de auditoría:', error);
      throw new Error('No se pudo registrar la acción de auditoría');
    }
  }

  /**
   * Obtiene el log de auditoría para un usuario específico (como actor o target)
   */
  async getUserAuditLog(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const [actorLogs, targetLogs] = await Promise.all([
        db.collection('auditLogs')
          .where('actorId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get(),
        db.collection('auditLogs')
          .where('targetId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get()
      ]);

      const allLogs = [
        ...actorLogs.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry)),
        ...targetLogs.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry))
      ];

      // Ordenar por timestamp y limitar
      allLogs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });

      return allLogs.slice(0, limit);
    } catch (error) {
      console.error('Error obteniendo log de auditoría:', error);
      return [];
    }
  }

  /**
   * Crea una acción de moderación
   */
  async createModerationAction(action: ModerationAction): Promise<string> {
    try {
      const actionData = {
        ...action,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: action.duration ? 
          new Date(Date.now() + (action.duration * 24 * 60 * 60 * 1000)) : 
          null
      };

      const docRef = await db.collection('moderationActions').add(actionData);
      
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
    } catch (error) {
      console.error('Error creando acción de moderación:', error);
      throw new Error('No se pudo crear la acción de moderación');
    }
  }

  /**
   * Revierte una acción de moderación
   */
  async reverseModerationAction(actionId: string, moderatorId: string, reason: string): Promise<void> {
    try {
      const actionRef = db.collection('moderationActions').doc(actionId);
      const actionDoc = await actionRef.get();

      if (!actionDoc.exists) {
        throw new Error('Acción de moderación no encontrada');
      }

      await actionRef.update({
        status: 'REVERSED',
        reversedBy: moderatorId,
        reverseReason: reason,
        reversedAt: FieldValue.serverTimestamp()
      });

      // Registrar en auditoría
      await this.logAction({
        actorId: moderatorId,
        targetId: actionDoc.data()?.targetUserId,
        action: 'MODERATION_REVERSE',
        details: {
          originalActionId: actionId,
          originalAction: actionDoc.data()?.action,
          reason
        }
      });
    } catch (error) {
      console.error('Error revirtiendo acción de moderación:', error);
      throw new Error('No se pudo revertir la acción de moderación');
    }
  }

  /**
   * Obtiene las acciones de moderación activas para un usuario
   */
  async getActiveModerationActions(userId: string): Promise<ModerationAction[]> {
    try {
      const snapshot = await db.collection('moderationActions')
        .where('targetUserId', '==', userId)
        .where('status', '==', 'ACTIVE')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ModerationAction));
    } catch (error) {
      console.error('Error obteniendo acciones de moderación activas:', error);
      return [];
    }
  }

  /**
   * Crea un reporte
   */
  async createReport(report: Omit<Report, 'id' | 'createdAt'>): Promise<string> {
    try {
      const reportData = {
        ...report,
        createdAt: FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('reports').add(reportData);

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
    } catch (error) {
      console.error('Error creando reporte:', error);
      throw new Error('No se pudo crear el reporte');
    }
  }

  /**
   * Resuelve un reporte
   */
  async resolveReport(reportId: string, moderatorId: string, resolution: string, status: 'RESOLVED' | 'DISMISSED'): Promise<void> {
    try {
      const reportRef = db.collection('reports').doc(reportId);
      const reportDoc = await reportRef.get();

      if (!reportDoc.exists) {
        throw new Error('Reporte no encontrado');
      }

      await reportRef.update({
        status,
        moderatorId,
        resolution,
        resolvedAt: FieldValue.serverTimestamp()
      });

      // Registrar en auditoría
      await this.logAction({
        actorId: moderatorId,
        targetId: reportDoc.data()?.reportedId,
        action: 'REPORT_RESOLVED',
        details: {
          reportId,
          resolution,
          status
        }
      });
    } catch (error) {
      console.error('Error resolviendo reporte:', error);
      throw new Error('No se pudo resolver el reporte');
    }
  }

  /**
   * Obtiene reportes pendientes para moderación
   */
  async getPendingReports(limit: number = 50): Promise<Report[]> {
    try {
      const snapshot = await db.collection('reports')
        .where('status', '==', 'PENDING')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Report));
    } catch (error) {
      console.error('Error obteniendo reportes pendientes:', error);
      return [];
    }
  }

  /**
   * Verifica si un usuario tiene acceso a funciones de moderación
   */
  async hasModerationAccess(userId: string): Promise<boolean> {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return false;
      }

      const userData = userDoc.data();
      return userData?.role === 'MODERATOR' || userData?.role === 'ADMIN';
    } catch (error) {
      console.error('Error verificando acceso de moderación:', error);
      return false;
    }
  }

  /**
   * Verifica si un usuario está bloqueado o suspendido
   */
  async isUserBlocked(userId: string): Promise<{
    blocked: boolean;
    reason?: string;
    expiresAt?: Date;
  }> {
    try {
      const actions = await this.getActiveModerationActions(userId);
      
      const blockingActions = actions.filter(action => 
        action.action === 'USER_BAN' || action.action === 'USER_SUSPEND'
      );

      if (blockingActions.length === 0) {
        return { blocked: false };
      }

      // Tomar la acción más reciente
      const latestAction = blockingActions[0];
      
      // Verificar si está expirada
      if (latestAction.expiresAt && latestAction.expiresAt.toDate() < new Date()) {
        // Marcar como expirada
        await db.collection('moderationActions').doc(latestAction.id!).update({
          status: 'EXPIRED'
        });
        return { blocked: false };
      }

      return {
        blocked: true,
        reason: latestAction.reason,
        expiresAt: latestAction.expiresAt?.toDate()
      };
    } catch (error) {
      console.error('Error verificando si usuario está bloqueado:', error);
      return { blocked: false };
    }
  }

  /**
   * Obtiene estadísticas de moderación
   */
  async getModerationStats(timeRange: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<{
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    totalActions: number;
    activeActions: number;
    topReportCategories: { category: string; count: number }[];
  }> {
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
        db.collection('reports')
          .where('createdAt', '>=', startDate)
          .get(),
        db.collection('moderationActions')
          .where('createdAt', '>=', startDate)
          .get()
      ]);

      const reports = reportsSnapshot.docs.map(doc => doc.data() as Report);
      const actions = actionsSnapshot.docs.map(doc => doc.data() as ModerationAction);

      const categoryCounts: Record<string, number> = {};
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
    } catch (error) {
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
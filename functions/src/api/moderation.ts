import { Request, Response } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { AuditService } from '../services/auditService.js';
import { validateInitData } from '../validateInitData.js';

// Extender la interfaz Request para incluir userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Esquemas de validación
const ZModerationActionBody = z.object({
  initData: z.string(),
  targetUserId: z.string(),
  action: z.enum(['USER_BAN', 'USER_SUSPEND', 'PROFILE_HIDE', 'PROFILE_VERIFY', 'MESSAGE_DELETE', 'USER_WARN']),
  reason: z.string().min(10).max(500),
  evidence: z.array(z.string()).optional(),
  duration: z.number().int().min(1).max(365).optional() // días, solo para suspensiones
});

const ZReportResolveBody = z.object({
  initData: z.string(),
  reportId: z.string(),
  resolution: z.enum(['RESOLVED', 'DISMISSED']),
  reason: z.string().min(10).max(500)
});

const ZCreateReportBody = z.object({
  initData: z.string(),
  reportedUserId: z.string(),
  reason: z.string().min(10).max(500),
  category: z.enum(['HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'SPAM', 'UNDERAGE', 'OTHER']),
  details: z.string().optional()
});

const ZModerationReverseBody = z.object({
  initData: z.string(),
  actionId: z.string(),
  reason: z.string().min(10).max(500)
});

const auditService = AuditService.getInstance();

/**
 * Middleware para verificar acceso de moderación
 */
async function requireModeratorAccess(req: Request, res: Response, next: Function) {
  try {
    const { initData } = req.body;
    
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
      return res.status(401).json({
        ok: false,
        error: 'Init data inválido'
      });
    }

    const userId = validationResult.user.id.toString();
    const hasAccess = await auditService.hasModerationAccess(userId);

    if (!hasAccess) {
      return res.status(403).json({
        ok: false,
        error: 'Acceso denegado. Se requieren permisos de moderador.'
      });
    }

    // Agregar userId al request para uso posterior
    req.userId = userId;
    return next();
  } catch (error) {
    console.error('Error verificando acceso de moderación:', error);
    res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para crear una acción de moderación
 */
export async function handleModerationAction(req: Request, res: Response) {
  try {
    // Validar entrada
    const validation = ZModerationActionBody.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        details: validation.error.errors
      });
    }

    const { targetUserId, action, reason, evidence, duration } = validation.data;
    const moderatorId = req.userId;

    // Verificar si el usuario objetivo existe y no es un moderador/admin
    const targetUserDoc = await req.app.locals.db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      return res.status(404).json({
        ok: false,
        error: 'Usuario objetivo no encontrado'
      });
    }

    const targetUserData = targetUserDoc.data();
    if (targetUserData?.role !== 'USER') {
      return res.status(403).json({
        ok: false,
        error: 'No se pueden moderar usuarios con rol de moderador o administrador'
      });
    }

    // Verificar si ya hay una acción activa del mismo tipo
    const existingActions = await auditService.getActiveModerationActions(targetUserId);
    const hasActiveAction = existingActions.some(a => a.action === action && a.status === 'ACTIVE');
    
    if (hasActiveAction && action !== 'PROFILE_VERIFY') {
      return res.status(400).json({
        ok: false,
        error: 'Ya existe una acción activa de este tipo para este usuario'
      });
    }

    // Verificar que tenemos moderatorId
    if (!moderatorId) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no autenticado'
      });
    }

    // Crear la acción de moderación
    const actionId = await auditService.createModerationAction({
      moderatorId,
      targetUserId,
      action,
      reason,
      evidence,
      duration,
      status: 'ACTIVE'
    });

    // Aplicar cambios según el tipo de acción
    switch (action) {
      case 'USER_BAN':
      case 'USER_SUSPEND':
        // Actualizar el estado del usuario para reflejar el bloqueo
        await req.app.locals.db.collection('users').doc(targetUserId).update({
          isBanned: true,
          banReason: reason,
          banExpiresAt: duration ? 
            new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : 
            null
        });
        break;

      case 'PROFILE_HIDE':
        await req.app.locals.db.collection('profiles').doc(targetUserId).update({
          isHidden: true,
          hiddenReason: reason
        });
        break;

      case 'PROFILE_VERIFY':
        await req.app.locals.db.collection('profiles').doc(targetUserId).update({
          isVerified: true,
          verifiedAt: FieldValue.serverTimestamp(),
          verifiedBy: moderatorId
        });
        break;

      case 'USER_WARN':
        // Enviar notificación al usuario
        await req.app.locals.db.collection('notifications').add({
          userId: targetUserId,
          type: 'SYSTEM_ALERT',
          title: 'Advertencia de Moderación',
          body: reason,
          createdAt: FieldValue.serverTimestamp()
        });
        break;
    }

    return res.json({
      ok: true,
      actionId,
      message: `Acción de moderación ${action} aplicada exitosamente`
    });

  } catch (error) {
    console.error('Error aplicando acción de moderación:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para revertir una acción de moderación
 */
export async function handleReverseModerationAction(req: Request, res: Response) {
  try {
    // Validar entrada
    const validation = ZModerationReverseBody.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        details: validation.error.errors
      });
    }

    const { actionId, reason } = validation.data;
    const moderatorId = req.userId;

    // Verificar que tenemos moderatorId
    if (!moderatorId) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no autenticado'
      });
    }

    // Obtener la acción original para verificar permisos
    const actionDoc = await req.app.locals.db.collection('moderationActions').doc(actionId).get();
    if (!actionDoc.exists) {
      return res.status(404).json({
        ok: false,
        error: 'Acción de moderación no encontrada'
      });
    }

    const actionData = actionDoc.data();
    
    // Verificar que el moderador tenga permisos adecuados (solo admins pueden revertir acciones de otros moderadores)
    if (actionData?.moderatorId !== moderatorId) {
      const moderatorDoc = await req.app.locals.db.collection('users').doc(moderatorId).get();
      if (moderatorDoc.data()?.role !== 'ADMIN') {
        return res.status(403).json({
          ok: false,
          error: 'Solo los administradores pueden revertir acciones de otros moderadores'
        });
      }
    }

    // Revertir la acción
    await auditService.reverseModerationAction(actionId, moderatorId, reason);

    // Deshacer los cambios aplicados
    const targetUserId = actionData?.targetUserId;
    const originalAction = actionData?.action;

    switch (originalAction) {
      case 'USER_BAN':
      case 'USER_SUSPEND':
        await req.app.locals.db.collection('users').doc(targetUserId).update({
          isBanned: false,
          banReason: null,
          banExpiresAt: null
        });
        break;

      case 'PROFILE_HIDE':
        await req.app.locals.db.collection('profiles').doc(targetUserId).update({
          isHidden: false,
          hiddenReason: null
        });
        break;

      case 'PROFILE_VERIFY':
        await req.app.locals.db.collection('profiles').doc(targetUserId).update({
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null
        });
        break;
    }

    return res.json({
      ok: true,
      message: 'Acción de moderación revertida exitosamente'
    });

  } catch (error) {
    console.error('Error revirtiendo acción de moderación:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para obtener reportes pendientes
 */
export async function handleGetPendingReports(req: Request, res: Response) {
  try {
    const { limit = 50 } = req.query;

    const reports = await auditService.getPendingReports(Number(limit));

    // Obtener información adicional de los usuarios involucrados
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const [reporterDoc, reportedDoc] = await Promise.all([
          req.app.locals.db.collection('users').doc(report.reporterId).get(),
          req.app.locals.db.collection('users').doc(report.reportedId).get()
        ]);

        return {
          ...report,
          reporter: reporterDoc.exists ? {
            id: reporterDoc.id,
            displayName: reporterDoc.data()?.displayName,
            username: reporterDoc.data()?.username
          } : null,
          reported: reportedDoc.exists ? {
            id: reportedDoc.id,
            displayName: reportedDoc.data()?.displayName,
            username: reportedDoc.data()?.username
          } : null
        };
      })
    );

    return res.json({
      ok: true,
      reports: enrichedReports
    });

  } catch (error) {
    console.error('Error obteniendo reportes pendientes:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para resolver un reporte
 */
export async function handleResolveReport(req: Request, res: Response) {
  try {
    // Validar entrada
    const validation = ZReportResolveBody.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        details: validation.error.errors
      });
    }

    const { reportId, resolution, reason } = validation.data;
    const moderatorId = req.userId;
    
    // Verificar que tenemos moderatorId
    if (!moderatorId) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no autenticado'
      });
    }

    // Resolver el reporte
    await auditService.resolveReport(reportId, moderatorId, reason, resolution);

    return res.json({
      ok: true,
      message: `Reporte ${resolution.toLowerCase()} exitosamente`
    });

  } catch (error) {
    console.error('Error resolviendo reporte:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para crear un reporte
 */
export async function handleCreateReport(req: Request, res: Response) {
  try {
    // Validar entrada
    const validation = ZCreateReportBody.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        details: validation.error.errors
      });
    }

    const { initData, reportedUserId, reason, category, details } = validation.data;

    // Validar init data
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
      return res.status(401).json({
        ok: false,
        error: 'Init data inválido'
      });
    }

    const reporterId = validationResult.user.id.toString();

    // Verificar que no se esté reportando a sí mismo
    if (reporterId === reportedUserId) {
      return res.status(400).json({
        ok: false,
        error: 'No puedes reportarte a ti mismo'
      });
    }

    // Verificar que el usuario reportado exista
    const reportedUserDoc = await req.app.locals.db.collection('users').doc(reportedUserId).get();
    if (!reportedUserDoc.exists) {
      return res.status(404).json({
        ok: false,
        error: 'Usuario reportado no encontrado'
      });
    }

    // Verificar que no haya un reporte activo del mismo usuario
    const existingReports = await req.app.locals.db.collection('reports')
      .where('reporterId', '==', reporterId)
      .where('reportedId', '==', reportedUserId)
      .where('status', '==', 'PENDING')
      .get();

    if (!existingReports.empty) {
      return res.status(400).json({
        ok: false,
        error: 'Ya tienes un reporte pendiente para este usuario'
      });
    }

    // Crear el reporte
    const reportId = await auditService.createReport({
      reporterId,
      reportedId: reportedUserId,
      reason,
      category,
      details,
      status: 'PENDING'
    });

    return res.json({
      ok: true,
      reportId,
      message: 'Reporte creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando reporte:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para obtener estadísticas de moderación
 */
export async function handleModerationStats(req: Request, res: Response) {
  try {
    const { timeRange = 'week' } = req.query;

    const stats = await auditService.getModerationStats(timeRange as any);

    return res.json({
      ok: true,
      stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de moderación:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para obtener el log de auditoría de un usuario
 */
export async function handleUserAuditLog(req: Request, res: Response) {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const { limit = 50 } = req.query;

    const auditLog = await auditService.getUserAuditLog(userId, Number(limit));

    return res.json({
      ok: true,
      auditLog
    });

  } catch (error) {
    console.error('Error obteniendo log de auditoría:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

// Función wrapper para aplicar middleware de autenticación
function withModeratorAccess(handler: Function) {
  return async (req: Request, res: Response, next: Function) => {
    try {
      // Ejecutar el middleware de autenticación
      await requireModeratorAccess(req, res, async () => {
        // Si pasa la autenticación, ejecutar el handler principal
        await handler(req, res);
      });
      return; // Agregar return explícito
    } catch (error) {
      console.error('Error en middleware de moderación:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error interno del servidor'
      });
    }
  };
}

// Exportar handlers con middleware de autenticación
export const moderationHandlers = {
  createAction: withModeratorAccess(handleModerationAction),
  reverseAction: withModeratorAccess(handleReverseModerationAction),
  getPendingReports: withModeratorAccess(handleGetPendingReports),
  resolveReport: withModeratorAccess(handleResolveReport),
  createReport: handleCreateReport,
  getStats: withModeratorAccess(handleModerationStats),
  getUserAuditLog: withModeratorAccess(handleUserAuditLog)
};
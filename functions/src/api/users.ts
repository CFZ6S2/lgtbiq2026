import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService.js';
import { validateInitData } from '../validateInitData.js';
import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const userService = new UserService();

// Esquemas de validación
const discoverySettingsSchema = z.object({
  minAge: z.number().min(18).max(99).optional(),
  maxAge: z.number().min(18).max(99).optional(),
  maxDistance: z.number().min(1).max(1000).optional(),
  interestedInGender: z.array(z.string()).optional(),
  interestedInRoles: z.array(z.enum(['ACTIVO', 'PASIVO', 'VERSATIL'])).optional(),
  lookingForFriends: z.boolean().optional(),
  lookingForRomance: z.boolean().optional(),
  lookingForPoly: z.boolean().optional(),
}).refine(data => {
  if (data.minAge && data.maxAge && data.minAge > data.maxAge) {
    return false;
  }
  return true;
}, {
  message: "La edad mínima no puede ser mayor que la máxima",
  path: ["minAge"]
});

/**
 * Handler para obtener la configuración de descubrimiento del usuario
 */
export async function handleGetDiscoverySettings(req: Request, res: Response) {
  try {
    const { initData } = req.query;

    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Init data requerido'
      });
    }

    // Validar init data
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
      return res.status(401).json({
        ok: false,
        error: 'Init data inválido'
      });
    }

    const userId = validationResult.user.id.toString();
    const settings = await userService.getDiscoverySettings(userId);

    return res.json({
      ok: true,
      settings: settings || {
        minAge: 18,
        maxAge: 99,
        maxDistance: 50,
        interestedInGender: [],
        interestedInRoles: [],
        lookingForFriends: true,
        lookingForRomance: true,
        lookingForPoly: false
      }
    });

  } catch (error) {
    console.error('Error obteniendo configuración de descubrimiento:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para actualizar la configuración de descubrimiento del usuario
 */
export async function handleUpdateDiscoverySettings(req: Request, res: Response) {
  try {
    const { initData } = req.body;

    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Init data requerido'
      });
    }

    // Validar init data
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
      return res.status(401).json({
        ok: false,
        error: 'Init data inválido'
      });
    }

    // Validar el body con Zod
    const validation = discoverySettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        details: validation.error.errors
      });
    }

    const userId = validationResult.user.id.toString();
    const settings = validation.data;

    const updatedSettings = await userService.updateDiscoverySettings(userId, settings);

    return res.json({
      ok: true,
      settings: updatedSettings,
      message: 'Configuración actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando configuración de descubrimiento:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
}

/**
 * Handler para obtener el perfil completo del usuario
 */
export async function handleGetUserProfile(req: Request, res: Response) {
  try {
    const { initData } = req.query;

    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Init data requerido'
      });
    }

    // Validar init data
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
      return res.status(401).json({
        ok: false,
        error: 'Init data inválido'
      });
    }

    const userId = validationResult.user.id.toString();
    const profile = await userService.getUserProfile(userId);

    return res.json({
      ok: true,
      profile
    });

  } catch (error) {
    console.error('Error obteniendo perfil de usuario:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para crear un reporte de usuario con lógica de seguridad automática
 */
export async function handleCreateUserReport(req: Request, res: Response) {
  try {
    const { initData, reportedUserId, reason, details } = req.body;

    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Init data requerido'
      });
    }

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        ok: false,
        error: 'Usuario reportado y motivo requeridos'
      });
    }

    // Validar init data
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
      return res.status(401).json({
        ok: false,
        error: 'Init data inválido'
      });
    }

    const reporterId = validationResult.user.id.toString();

    // Verificar que no se esté reportando a uno mismo
    if (reporterId === reportedUserId) {
      return res.status(400).json({
        ok: false,
        error: 'No puedes reportarte a ti mismo'
      });
    }

    // Verificar que no haya un reporte pendiente duplicado
    const existingReport = await db.collection('reports')
      .where('reporterId', '==', reporterId)
      .where('reportedId', '==', reportedUserId)
      .where('status', '==', 'PENDING')
      .limit(1)
      .get();

    if (!existingReport.empty) {
      return res.status(409).json({
        ok: false,
        error: 'Ya tienes un reporte pendiente para este usuario'
      });
    }

    // Crear el reporte
    const reportRef = await db.collection('reports').add({
      reporterId,
      reportedId: reportedUserId,
      reason,
      details: details || '',
      status: 'PENDING',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Lógica de seguridad automática
    await checkAutoModeration(reportedUserId);

    // Registrar en auditoría
    await db.collection('auditLog').add({
      actorId: reporterId,
      targetId: reportedUserId,
      action: 'USER_REPORTED',
      details: { reason, details, reportId: reportRef.id },
      timestamp: FieldValue.serverTimestamp()
    });

    return res.json({
      ok: true,
      reportId: reportRef.id,
      message: 'Reporte creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando reporte de usuario:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Lógica de seguridad automática - verificar si un usuario debe ser marcado para revisión
 */
async function checkAutoModeration(userId: string): Promise<void> {
  try {
    // Verificar reportes recientes en las últimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentReports = await db.collection('reports')
      .where('reportedId', '==', userId)
      .where('createdAt', '>=', oneDayAgo)
      .where('status', '==', 'PENDING')
      .get();

    const reportCount = recentReports.size;

    // Si hay 5 o más reportes en 24 horas, marcar para revisión urgente
    if (reportCount >= 5) {
      await db.collection('moderationFlags').doc(userId).set({
        userId,
        flagged: true,
        reason: 'AUTO_FLAG: Múltiples reportes recientes',
        reportCount,
        createdAt: FieldValue.serverTimestamp(),
        autoAction: true
      }, { merge: true });

      // Opcional: Enviar notificación a moderadores
      console.log(`⚠️ USUARIO AUTO-MARCADO: ${userId} tiene ${reportCount} reportes en 24h`);
    }

    // Si hay 10 o más reportes, aplicar shadow ban automático
    if (reportCount >= 10) {
      await db.collection('users').doc(userId).update({
        isShadowBanned: true,
        shadowBanReason: 'AUTO_SHADOW_BAN: Exceso de reportes',
        shadowBannedAt: FieldValue.serverTimestamp()
      });

      console.log(`🚫 SHADOW BAN AUTOMÁTICO: ${userId}`);
    }

  } catch (error) {
    console.error('Error en verificación de auto-moderación:', error);
  }
}
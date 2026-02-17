import { Request, Response } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { RecommendationService } from '../services/recommendationService.js';
import { AuditService } from '../services/auditService.js';
import { validateInitData } from '../validateInitData.js';

// Esquemas de validación
const ZRecsBody = z.object({
  initData: z.string(),
  filterOrientations: z.array(z.string()).optional(),
  intentsFriends: z.boolean().optional(),
  intentsRomance: z.boolean().optional(),
  intentsPoly: z.boolean().optional(),
  maxDistanceKm: z.number().optional(),
  limit: z.number().min(1).max(50).optional().default(20),
  excludeBlocked: z.boolean().optional().default(true),
  excludeAlreadyLiked: z.boolean().optional().default(true),
  excludeMatches: z.boolean().optional().default(true)
});

const ZDiscoverySettingsBody = z.object({
  initData: z.string(),
  minAge: z.number().min(18).max(99).optional().default(18),
  maxAge: z.number().min(18).max(99).optional().default(99),
  maxDistance: z.number().min(1).max(500).optional().default(50),
  interestedInGender: z.array(z.string()).optional().default([]),
  interestedInRoles: z.array(z.enum(['TOP', 'BOTTOM', 'VERSATILE', 'OTHER'])).optional().default([]),
  lookingForFriends: z.boolean().optional().default(true),
  lookingForRomance: z.boolean().optional().default(true),
  lookingForPoly: z.boolean().optional().default(true)
});

const ZDiscoveryActionBody = z.object({
  initData: z.string(),
  targetUserId: z.string(),
  action: z.enum(['view', 'like', 'pass', 'block']),
  score: z.number().optional()
});

const recommendationService = RecommendationService.getInstance();
const auditService = AuditService.getInstance();

/**
 * Handler para obtener recomendaciones de usuarios
 */
export async function handleRecommendations(req: Request, res: Response) {
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

    const { 
      initData, 
      filterOrientations, 
      intentsFriends, 
      intentsRomance, 
      intentsPoly, 
      maxDistanceKm,
      limit,
      excludeBlocked,
      excludeAlreadyLiked,
      excludeMatches
    } = validation.data;

    // Validar init data
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
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
    const updatedSettings = {
      ...currentSettings,
      ...(maxDistanceKm && { maxDistance: maxDistanceKm }),
      ...(intentsFriends !== undefined && { lookingForFriends: intentsFriends }),
      ...(intentsRomance !== undefined && { lookingForRomance: intentsRomance }),
      ...(intentsPoly !== undefined && { lookingForPoly: intentsPoly })
    };

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
    await recommendationService.logDiscoveryAction(userId, 'view', 'batch', 
      recommendations.length > 0 ? recommendations[0].compatibilityScore : undefined
    );

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

  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para actualizar configuración de descubrimiento
 */
export async function handleDiscoverySettings(req: Request, res: Response) {
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

    const { initData, ...settings } = validation.data;

    // Validar init data
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
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

  } catch (error) {
    console.error('Error actualizando configuración de descubrimiento:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para registrar acciones de descubrimiento (ver, like, pass, block)
 */
export async function handleDiscoveryAction(req: Request, res: Response) {
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
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
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
          timestamp: FieldValue.serverTimestamp()
        });
        break;

      case 'block':
        // Crear bloqueo
        await req.app.locals.db.collection('blocks').add({
          blockerId: userId,
          blockedId: targetUserId,
          timestamp: FieldValue.serverTimestamp()
        });
        break;

      case 'pass':
        // Registrar pass para evitar mostrar de nuevo
        await req.app.locals.db.collection('passes').add({
          userId: userId,
          passedUserId: targetUserId,
          timestamp: FieldValue.serverTimestamp()
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

  } catch (error) {
    console.error('Error registrando acción de descubrimiento:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Handler para obtener estadísticas de descubrimiento
 */
export async function handleDiscoveryStats(req: Request, res: Response) {
  try {
    const { initData } = req.body;

    // Validar init data
    const validationResult = validateInitData(initData, process.env.BOT_TOKEN || '');
    if (!validationResult.valid || !validationResult.user?.id) {
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

  } catch (error) {
    console.error('Error obteniendo estadísticas de descubrimiento:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}
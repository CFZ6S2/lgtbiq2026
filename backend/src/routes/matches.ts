import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { createSwipe, getUserMatches, updateMatchStatus as updateMatchStatusSvc, getRecentSwipes } from '../services/matchService';

const router = Router();

// Esquemas de validación
const swipeSchema = z.object({
  targetUserId: z.string().min(1),
  action: z.enum(['like', 'dislike', 'superlike'])
});

const updateMatchSchema = z.object({
  matchId: z.string().min(1),
  status: z.enum(['active', 'blocked', 'reported'])
});

// Realizar swipe (like/dislike)
router.post('/swipe',
  validateRequest(swipeSchema),
  asyncHandler(async (req: any, res: any) => {
    const { targetUserId, action } = req.body;
    const currentUserId = req.user.telegramId;

    // Verificar que no sea el mismo usuario
    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'No puedes hacer swipe en ti mismo' });
    }

    const { swipe, match } = await createSwipe(currentUserId, targetUserId, action);
    if (!swipe && !match) return res.status(400).json({ error: 'No se pudo crear el swipe' });
    const isMatch = Boolean(match);

    res.json({
      message: 'Swipe registrado exitosamente',
      swipe: {
        id: swipe.id,
        action: swipe.action,
        createdAt: swipe.createdAt
      },
      match: isMatch ? {
        id: match.id,
        matchedUser: {
          id: match.user2.id,
          telegramId: match.user2.telegramId,
          name: match.user2.name,
          photos: match.user2.photos
        },
        createdAt: match.createdAt
      } : null
    });
  })
);

// Obtener matches del usuario
router.get('/my-matches',
  asyncHandler(async (req: any, res: any) => {
    const currentUserId = req.user.telegramId;

    const { matches, currentUserId: currentLocalId } = await getUserMatches(currentUserId) as any;
    const formattedMatches = matches.map((match: any) => {
      const matchedUser = match.user1Id === currentLocalId ? match.user2 : match.user1;
      return {
        id: match.id,
        user: {
          id: matchedUser.id,
          telegramId: matchedUser.telegramId,
          name: matchedUser.name,
          bio: matchedUser.bio,
          photos: matchedUser.photos,
          lastSeen: matchedUser.lastSeen
        },
        matchedAt: match.createdAt,
        lastInteraction: match.updatedAt
      };
    });

    res.json({ matches: formattedMatches });
  })
);

// Actualizar estado de un match (bloquear, reportar)
router.put('/status',
  validateRequest(updateMatchSchema),
  asyncHandler(async (req: any, res: any) => {
    const { matchId, status } = req.body;
    const currentUserId = req.user.telegramId;

    const { updated, error } = await updateMatchStatusSvc(currentUserId, matchId, status);
    if (error) return res.status(404).json({ error });

    res.json({
      message: `Match ${status === 'blocked' ? 'bloqueado' : 'reportado'} exitosamente`,
      match: updated
    });
  })
);

// Obtener swipes recientes
router.get('/swipes/recent',
  asyncHandler(async (req: any, res: any) => {
    const currentUserId = req.user.telegramId;
    const limit = parseInt(req.query.limit as string) || 20;

    const swipes = await getRecentSwipes(currentUserId, limit);

    const formattedSwipes = swipes.map(swipe => ({
      id: swipe.id,
      targetUser: {
        id: swipe.targetUser.id,
        telegramId: swipe.targetUser.telegramId,
        name: swipe.targetUser.name,
        photos: swipe.targetUser.photos
      },
      action: swipe.action,
      createdAt: swipe.createdAt
    }));

    res.json({ swipes: formattedSwipes });
  })
);

export { router as matchRoutes };

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { updateLocation as updateLocationSvc, searchNearby as searchNearbySvc } from '../services/mapService';

const router = Router();

// Esquemas de validación
const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(1000).optional()
});

const searchNearbySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1).max(100).default(50), // km
  limit: z.number().min(1).max(100).default(20),
  interests: z.array(z.string()).max(10).optional(),
  ageRange: z.object({
    min: z.number().min(18).max(100),
    max: z.number().min(18).max(100)
  }).optional(),
  gender: z.enum(['male', 'female', 'other', 'all']).optional()
});

// Actualizar ubicación del usuario
router.post('/location',
  validateRequest(updateLocationSchema),
  asyncHandler(async (req: any, res: any) => {
    const { latitude, longitude, accuracy } = req.body;
    const currentUserId = req.user.telegramId;

    const updatedUser = await updateLocationSvc(currentUserId, { latitude, longitude, accuracy });

    res.json({
      message: 'Ubicación actualizada exitosamente',
      location: updatedUser.location,
      lastSeen: updatedUser.lastSeen
    });
  })
);

// Buscar usuarios cercanos en el mapa
router.get('/nearby',
  validateRequest(searchNearbySchema),
  asyncHandler(async (req: any, res: any) => {
    const { 
      latitude, 
      longitude, 
      radius, 
      limit, 
      interests, 
      ageRange: _ageRange, 
      gender: _gender 
    } = req.query;

    const currentUserId = req.user.telegramId;

    // Obtener usuario actual para excluirlo de la búsqueda
    const nearbyUsers = await searchNearbySvc(currentUserId, { latitude, longitude, radius, limit, interests });

    res.json({
      users: nearbyUsers,
      total: nearbyUsers.length,
      searchRadius: radius,
      center: { latitude, longitude }
    });
  })
);

// Obtener ubicación de un usuario específico (si es match)
router.get('/user/:userId/location',
  asyncHandler(async (req: any, res: any) => {
    const { userId } = req.params;
    const currentUserId = req.user.telegramId;

    const currentUser = await prisma.user.findUnique({
      where: { telegramId: currentUserId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: {
        id: true,
        telegramId: true,
        name: true,
        location: true,
        lastSeen: true
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si hay un match activo entre los usuarios
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: currentUser.id, user2Id: targetUser.id },
          { user1Id: targetUser.id, user2Id: currentUser.id }
        ],
        status: 'active'
      }
    });

    if (!match) {
      return res.status(403).json({ 
        error: 'No puedes ver la ubicación de este usuario',
        message: 'Solo puedes ver ubicaciones de usuarios con los que tienes un match activo'
      });
    }

    res.json({
      user: {
        id: targetUser.id,
        telegramId: targetUser.telegramId,
        name: targetUser.name,
        location: targetUser.location,
        lastSeen: targetUser.lastSeen
      }
    });
  })
);

// Obtener eventos LGBTIQ+ cercanos (simulado)
router.get('/events',
  asyncHandler(async (req: any, res: any) => {
    const { latitude, longitude, radius = 100 } = req.query;

    // En una implementación real, conectarías con una API de eventos
    // o tendrías tu propia base de datos de eventos
    const mockEvents = [
      {
        id: '1',
        name: 'Marcha del Orgullo',
        description: 'Marcha anual por los derechos LGBTIQ+',
        location: {
          latitude: parseFloat(latitude) + 0.01,
          longitude: parseFloat(longitude) + 0.01,
          address: 'Plaza Principal'
        },
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // En 7 días
        type: 'march',
        organizer: 'Colectivo LGBTIQ+ Local',
        attendees: 156,
        isLgbtq: true
      },
      {
        id: '2',
        name: 'Fiesta de la Diversidad',
        description: 'Noche de música y baile para la comunidad',
        location: {
          latitude: parseFloat(latitude) - 0.02,
          longitude: parseFloat(longitude) + 0.015,
          address: 'Club Rainbow'
        },
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // En 3 días
        type: 'party',
        organizer: 'Rainbow Events',
        attendees: 89,
        isLgbtq: true
      },
      {
        id: '3',
        name: 'Charla: Salud Sexual y Diversidad',
        description: 'Charla informativa sobre salud sexual para personas LGBTIQ+',
        location: {
          latitude: parseFloat(latitude) + 0.005,
          longitude: parseFloat(longitude) - 0.01,
          address: 'Centro de Salud Comunitario'
        },
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // En 5 días
        type: 'talk',
        organizer: 'Asociación de Salud LGBTIQ+',
        attendees: 45,
        isLgbtq: true
      }
    ];

    // Calcular distancia y filtrar por radio
    const nearbyEvents = mockEvents.map(event => ({
      ...event,
      distance: 0
    }));

    res.json({
      events: nearbyEvents,
      total: nearbyEvents.length,
      searchRadius: radius
    });
  })
);

export { router as mapRoutes };

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { getUserByTelegramId, updateUserProfile as updateProfileSvc, addUserPhoto, getNearbyUsers as getNearbySvc } from '../services/userService';

const router = Router();

// Esquemas de validación
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  interests: z.array(z.string()).max(10).optional(),
  preferences: z.object({
    ageRange: z.object({
      min: z.number().min(18).max(100),
      max: z.number().min(18).max(100)
    }).optional(),
    distance: z.number().min(1).max(500).optional(),
    gender: z.enum(['male', 'female', 'other', 'all']).optional()
  }).optional()
});

const uploadPhotoSchema = z.object({
  photoUrl: z.string().url(),
  isProfile: z.boolean().optional()
});

// Obtener perfil de usuario
router.get('/profile', asyncHandler(async (req: any, res: any) => {
  const user = await getUserByTelegramId(req.user.telegramId);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({ user });
}));

// Actualizar perfil
router.put('/profile', 
  validateRequest(updateProfileSchema), 
  asyncHandler(async (req: any, res: any) => {
    const { name, bio, location, interests, preferences } = req.body;

    const updatedUser = await updateProfileSvc(req.user.telegramId, { name, bio, location, interests, preferences });

    res.json({ 
      message: 'Perfil actualizado exitosamente',
      user: updatedUser 
    });
  })
);

// Subir foto
router.post('/photos',
  validateRequest(uploadPhotoSchema),
  asyncHandler(async (req: any, res: any) => {
    const { photoUrl, isProfile = false } = req.body;

    const photo = await addUserPhoto(req.user.telegramId, photoUrl, isProfile);
    if (!photo) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ 
      message: 'Foto subida exitosamente',
      photo 
    });
  })
);

// Obtener usuarios cercanos
router.get('/nearby', asyncHandler(async (req: any, res: any) => {
  const { lat, lng, radius: _radius = 50 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitud y longitud requeridas' });
  }

  // Aquí implementarías la lógica de búsqueda geoespacial
  // Por ahora, devolvemos usuarios con ubicación configurada
  const users = await getNearbySvc(req.user.telegramId);

  res.json({ users });
}));

export { router as userRoutes };

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validation';
import { validateTelegramInitData, signJwt } from '../middleware/auth';
import prisma from '../lib/prisma';
import { auth as firebaseAuth } from '../lib/firebase';

const router = Router();

const telegramAuthSchema = z.object({
  initData: z.string().min(10),
});

router.post(
  '/telegram',
  validateRequest(telegramAuthSchema),
  asyncHandler(async (req: any, res: any) => {
    const { initData } = req.body as { initData: string };

    const isValid = validateTelegramInitData(initData);
    if (!isValid) {
      return res.status(401).json({ error: 'initData inválido' });
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get('user');
    if (!userRaw) {
      return res.status(400).json({ error: 'Datos de usuario no presentes' });
    }
    const tgUser = JSON.parse(userRaw);
    const telegramId = String(tgUser.id);

    // Upsert usuario en Base de Datos
    const user = (await (prisma as any).user.upsert({
      where: { telegramId },
      update: {
        displayName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null,
        updatedAt: new Date(),
      },
      create: {
        telegramId,
        displayName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })) as any;

    // Emitir JWT para API propia
    const jwtToken = signJwt({ sub: user.id, telegramId: user.telegramId });

    // Crear Custom Token de Firebase para autenticar en el cliente
    const firebaseUid = `tg:${user.telegramId}`;
    const firebaseCustomToken = await firebaseAuth.createCustomToken(firebaseUid, { telegramId: user.telegramId });

    return res.json({
      message: 'Autenticado correctamente',
      token: jwtToken,
      firebaseCustomToken,
      user,
    });
  })
);

export { router as authRoutes };

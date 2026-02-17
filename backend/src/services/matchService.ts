import prisma from '../lib/prisma';

export const createSwipe = async (currentTelegramId: string, targetTelegramId: string, action: 'like' | 'dislike' | 'superlike'): Promise<any> => {
  const currentUser = (await prisma.user.findUnique({ where: { telegramId: currentTelegramId } } as any)) as any;
  const targetUser = (await prisma.user.findUnique({ where: { telegramId: targetTelegramId } } as any)) as any;
  if (!currentUser || !targetUser) return { error: 'Usuario no encontrado' };

  const existingSwipe = (await prisma.swipe.findFirst({
    where: { swiperId: currentUser.id, targetUserId: targetUser.id }
  } as any)) as any;
  if (existingSwipe) return { error: 'Ya has hecho swipe en este usuario' };

  const swipe = (await prisma.swipe.create({
    data: {
      swiperId: currentUser.id,
      targetUserId: targetUser.id,
      action,
      createdAt: new Date()
    }
  } as any)) as any;

  let match = null as any;
  if (action === 'like' || action === 'superlike') {
    const reciprocalSwipe = (await prisma.swipe.findFirst({
      where: {
        swiperId: targetUser.id,
        targetUserId: currentUser.id,
        action: { in: ['like', 'superlike'] }
      }
    } as any)) as any;
    if (reciprocalSwipe) {
      match = (await prisma.match.create({
        data: {
          user1Id: currentUser.id,
          user2Id: targetUser.id,
          status: 'active',
          createdAt: new Date()
        },
      } as any)) as any;
    }
  }

  return { swipe, match };
};

export const getUserMatches = async (telegramId: string): Promise<any> => {
  const currentUser = (await prisma.user.findUnique({ where: { telegramId } } as any)) as any;
  if (!currentUser) return [];

  const matches = (await prisma.match.findMany({
    where: {
      OR: [{ user1Id: currentUser.id }, { user2Id: currentUser.id }],
      status: 'active'
    },
    orderBy: { updatedAt: 'desc' }
  } as any)) as any;

  return { matches, currentUserId: currentUser.id };
};

export const updateMatchStatus = async (telegramId: string, matchId: string, status: 'active' | 'blocked' | 'reported'): Promise<any> => {
  const currentUser = (await prisma.user.findUnique({ where: { telegramId } } as any)) as any;
  if (!currentUser) return { error: 'Usuario no encontrado' };

  const match = (await prisma.match.findFirst({
    where: { id: matchId, OR: [{ user1Id: currentUser.id }, { user2Id: currentUser.id }] }
  } as any)) as any;
  if (!match) return { error: 'Match no encontrado' };

  const updated = (await prisma.match.update({
    where: { id: matchId },
    data: { status, updatedAt: new Date() }
  } as any)) as any;
  return { updated };
};

export const getRecentSwipes = async (telegramId: string, take: number): Promise<any[]> => {
  const currentUser = (await prisma.user.findUnique({ where: { telegramId } } as any)) as any;
  if (!currentUser) return [];

  const swipes = (await prisma.swipe.findMany({
    where: { swiperId: currentUser.id },
    orderBy: { createdAt: 'desc' },
    take
  } as any)) as any;
  return swipes as any[];
};

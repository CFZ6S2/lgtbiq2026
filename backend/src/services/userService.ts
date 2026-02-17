import prisma from '../lib/prisma';

export const getUserByTelegramId = async (telegramId: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { telegramId }
  } as any);
  return user as any;
};

export const updateUserProfile = async (telegramId: string, data: any): Promise<any> => {
  const updated = await prisma.user.update({
    where: { telegramId },
    data: {
      ...data,
      isProfileComplete: true
    }
  } as any);
  return updated as any;
};

export const addUserPhoto = async (telegramId: string, url: string, isProfile: boolean): Promise<any> => {
  const user = (await prisma.user.findUnique({
    where: { telegramId }
  } as any)) as any;
  if (!user) return null;

  if (isProfile) {
    await prisma.user.update({
      where: { telegramId },
      data: { photos: { profile: url } } as any
    } as any);
  }

  return (await prisma.photo.create({
    data: {
      url,
      userId: user.id,
      isProfile
    }
  } as any)) as any;
};

export const getNearbyUsers = async (telegramId: string): Promise<any[]> => {
  const users = await prisma.user.findMany({
    where: {
      location: { not: null },
      telegramId: { not: telegramId },
      isProfileComplete: true
    },
    take: 20
  } as any);
  return users as any[];
};

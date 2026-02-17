import prisma from '../lib/prisma';

const toRad = (value: number) => (value * Math.PI) / 180;
const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const updateLocation = async (telegramId: string, location: any): Promise<any> => {
  const updated = await prisma.user.update({
    where: { telegramId },
    data: {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        updatedAt: new Date().toISOString()
      },
      lastSeen: new Date()
    }
  } as any);
  return updated as any;
};

export const searchNearby = async (telegramId: string, options: { latitude: number; longitude: number; radius: number; limit: number; interests?: string[] }) => {
  const where: any = {
    telegramId: { not: telegramId },
    isProfileComplete: true,
    location: { not: null }
  };
  if (options.interests && options.interests.length) {
    where.interests = { hasSome: options.interests };
  }

  const users = (await prisma.user.findMany({
    where,
    take: options.limit * 2
  } as any)) as any[];

  const nearby = users
    .map((u) => ({
      ...u,
      distance: Math.round(distanceKm(options.latitude, options.longitude, u.location.latitude, u.location.longitude) * 10) / 10
    }))
    .filter((u) => u.distance <= options.radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, options.limit);

  return nearby;
};

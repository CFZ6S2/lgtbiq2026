import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import prisma from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    telegramId: string;
    name?: string | null;
  };
}

export const signJwt = (payload: any) => jwt.sign(payload, config.JWT_SECRET as any, { expiresIn: config.JWT_EXPIRES_IN as any } as any) as any;

export const verifyJwt = (token: string) => {
  return jwt.verify(token, config.JWT_SECRET);
};

export const validateTelegramInitData = (initData: string) => {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckArr: string[] = [];
  Array.from(urlParams.keys())
    .sort()
    .forEach((key) => dataCheckArr.push(`${key}=${urlParams.get(key)}`));
  const dataCheckString = dataCheckArr.join('\\n');

  const secretKey = crypto
    .createHash('sha256')
    .update('WebAppData')
    .update(config.TELEGRAM_BOT_TOKEN)
    .digest();

  const checkHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return checkHash === hash;
};

export const validateTelegramAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyJwt(token) as any;

    const user = await (prisma as any).user.findUnique({
      where: { id: (decoded as any).sub },
    });
    if (!user) {
      res.status(401).json({ error: 'Usuario no válido' });
      return;
    }
    req.user = { id: (user as any).id, telegramId: (user as any).telegramId, name: (user as any).displayName };
    return next();
  } catch (e) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }
};

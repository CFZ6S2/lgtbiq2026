import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL || typeof process.env.DATABASE_URL !== 'string' || !process.env.DATABASE_URL.trim()) {
  throw new Error('DATABASE_URL requerida en .env')
}

export const prisma = new PrismaClient()

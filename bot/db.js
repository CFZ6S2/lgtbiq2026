import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db'

export const prisma = new PrismaClient()

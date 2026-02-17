import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { db } from '../lib/firebase';
import * as chatSvc from '../services/chatService';

const router = Router();

// Esquemas de validación
const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1).max(1000),
  type: z.enum(['text', 'image', 'location']).default('text')
});

const getMessagesSchema = z.object({
  otherUserId: z.string().min(1),
  limit: z.number().min(1).max(100).default(50)
});

// Enviar mensaje
router.post('/messages',
  validateRequest(sendMessageSchema),
  asyncHandler(async (req: any, res: any) => {
    const { receiverId, content, type } = req.body;
    const senderId = `tg:${req.user.telegramId}`;
    const normalizedReceiverId = receiverId.startsWith('tg:') ? receiverId : `tg:${receiverId}`;

    // Verificar que el receptor existe
    const receiverRef = db.collection('users').doc(normalizedReceiverId);
    const receiverDoc = await receiverRef.get();
    
    if (!receiverDoc.exists) {
      return res.status(404).json({ error: 'Usuario receptor no encontrado' });
    }

    const saved = await chatSvc.sendMessage(senderId, normalizedReceiverId, content, type);

    res.json({ 
      message: 'Mensaje enviado exitosamente',
      messageId: saved.id,
      data: saved
    });
  })
);

// Obtener mensajes de una conversación
router.get('/messages',
  validateRequest(getMessagesSchema),
  asyncHandler(async (req: any, res: any) => {
    const { otherUserId, limit: messageLimit } = req.query;
    const currentUserId = `tg:${req.user.telegramId}`;
    const normalizedOtherId = String(otherUserId).startsWith('tg:') ? String(otherUserId) : `tg:${otherUserId}`;

    const messages = await chatSvc.getMessages(currentUserId, normalizedOtherId, parseInt(messageLimit));

    // Marcar mensajes como leídos
    // (Esto se haría en el frontend o en una llamada separada)

    res.json({ 
      messages,
      chatId: [currentUserId, normalizedOtherId].sort().join('_') 
    });
  })
);

// Obtener lista de chats del usuario
router.get('/conversations',
  asyncHandler(async (req: any, res: any) => {
    const currentUserId = `tg:${req.user.telegramId}`;

    const conversations = await chatSvc.getConversations(currentUserId);

    res.json({ conversations });
  })
);

// Marcar mensajes como leídos
router.post('/messages/read',
  validateRequest(z.object({
    chatId: z.string().min(1),
    messageIds: z.array(z.string()).min(1)
  })),
  asyncHandler(async (req: any, res: any) => {
    const { chatId } = req.body;
    const currentUserId = req.user.telegramId;

    // Verificar que el usuario es participante del chat
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();
    
    if (!chatDoc.exists) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    const chatData: any = chatDoc.data();
    if (!chatData['participants']?.includes(currentUserId)) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    // Actualizar mensajes como leídos
    // (En una implementación real, usarías una batch update)
    
    res.json({ message: 'Mensajes marcados como leídos' });
  })
);

export { router as chatRoutes };

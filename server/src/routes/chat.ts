import { Router } from 'express';

import { authMiddleware } from '../middlewares/auth';

import { 
    getConversations, 
    getOrCreateConversation,
    getMessages,
    deleteMessage,
} from '../controllers/chat';

const router = Router();

// Всі маршрути в цьому роутері захищені authMiddleware
router.use(authMiddleware);

router.get('/conversations', getConversations);
router.post('/conversations/:userId', getOrCreateConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.delete('/messages/:messageId', deleteMessage);
export default router;
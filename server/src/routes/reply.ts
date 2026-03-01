import { Router } from 'express';
import { createReply, getRepliesByTweet, deleteReply } from '../controllers/reply';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/:tweetId', getRepliesByTweet);
router.post('/:tweetId', authMiddleware, createReply);
router.delete('/:replyId', authMiddleware, deleteReply);

export default router;
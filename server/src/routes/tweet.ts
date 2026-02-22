import { Router } from 'express';

import { createTweet, getTweets, deleteTweet, likeTweet } from '../controllers/tweet';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/', authMiddleware, createTweet);
router.get('/', getTweets);
router.delete('/:id', authMiddleware, deleteTweet);
router.post('/:id/like', authMiddleware, likeTweet);

export default router;
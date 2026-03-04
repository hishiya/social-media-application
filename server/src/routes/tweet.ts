import { Router } from 'express';

import { createTweet, getTweets, deleteTweet, likeTweet, getTweetsByUser, editTweet } from '../controllers/tweet';
// authMiddleware — перевіряє чи користувач авторизований, якщо так, додає userId до req
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.post('/', authMiddleware, createTweet);
router.get('/user/:username', getTweetsByUser);
router.get('/', getTweets);
router.delete('/:id', authMiddleware, deleteTweet);
router.post('/:id/like', authMiddleware, likeTweet);
router.patch('/:id', authMiddleware, editTweet);

export default router;
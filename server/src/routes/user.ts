import { Router } from 'express';
import { getProfile, followUser, updateProfile } from '../controllers/user';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/:username', getProfile);

router.post('/:id/follow', authMiddleware, followUser);

router.put('/me', authMiddleware, updateProfile);

export default router;
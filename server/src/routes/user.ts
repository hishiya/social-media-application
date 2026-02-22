import { Router } from 'express';
import { getProfile, followUser } from '../controllers/user';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/:username', getProfile);

router.post('/:id/follow', authMiddleware, followUser);

export default router;
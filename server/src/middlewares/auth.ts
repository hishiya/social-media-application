import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const authMiddleware = (
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Invalid token format' });
        return;
    }

    const payload = verifyToken(token);

    if (!payload) {
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
    }

    req.userId = payload.userId;

    next();
}

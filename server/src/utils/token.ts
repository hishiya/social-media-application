import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
    const JWT_SECRET = process.env.JWT_SECRET!;
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: '7d',
    })
}

interface TokenPayload {
    userId: string;
}

export const verifyToken = (token: string): TokenPayload | null => {
    const JWT_SECRET = process.env.JWT_SECRET!;
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}
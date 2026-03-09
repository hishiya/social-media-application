import { Server } from 'socket.io';

// Socket.io працює поверх HTTP сервера, тому спочатку створюємо HTTP сервер
import http from 'http';

import Message from './models/Message';
import Conversation from './models/Conversation';

import { verifyToken } from './utils/token';

export const initSocket = (httpServer: http.Server) => {
    const io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST'],
        }
    })

    io.use((socket, next) => {
        const token = socket.handshake.auth.token as string;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const payload = verifyToken(token);

        if (!payload) {
            return next(new Error('Authentication error: Invalid token'));
        }

        // Зберігаємо userId в даних сокета для подальшого використання
        socket.data.userId = payload.userId;
        next();
    })

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.data.userId}, socketId: ${socket.id}`);

        socket.on('join_conversation', async ({ conversationId }: { conversationId: string }) => {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: socket.data.userId,
            })

            if (!conversation) {
                socket.emit('error', { message: 'Access denied to this conversation' });
                return;
            }

            socket.join(conversationId);
            console.log(`User ${socket.data.userId} joined conversation ${conversationId}`);
        })

        socket.on('send_message', async ({ conversationId, text }: { conversationId: string, text: string }) => {
            if (!text || !text.trim()) return;

            if (text.trim().length > 2000) return;

            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: socket.data.userId,
            })

            if (!conversation) {
                socket.emit('error', { message: 'Access denied to this conversation' });
                return;
            }

            const message = new Message({
                conversation: conversationId,
                sender: socket.data.userId,
                text: text.trim(),
            })

            await message.save();

            await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
            await message.populate('sender', 'username avatar _id');

            io.to(conversationId).emit('new_message', message.toObject());

            console.log(`Message saved and broadcast in room ${conversationId}`)
        })

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.data.userId}`);
        })
    })

    return io;
}
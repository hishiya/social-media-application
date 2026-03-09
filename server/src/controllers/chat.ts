import { Request, Response } from 'express';

import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';

export const getConversations = async (req: Request, res: Response) => {
    try {
        // req.userId рядок, але Mongoose очікує ObjectId, тому потрібно конвертувати
        const userId = req.userId;

        const conversations = await Conversation.find({ participants: userId })

            .populate('participants', 'username avatar _id')
            .sort({ updatedAt: -1 });
        
        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err});
    }
}

export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        // req.userId — ID поточного авторизованого юзера
        const myId = req.userId!;
        
        // req.params.userId — ID юзера з яким відкриваємо розмову (з URL)
        const otherId = req.params.userId;

        // Перевіряємо чи існує інший юзер в БД
        const otherUser = await User.findById(otherId);
        
        // Якщо юзера не знайдено — повертаємо 404
        if (!otherUser) {
            res.status(404).json({ message: 'User not found' });
            return; // зупиняємо виконання функції
        }

        // Перевіряємо чи юзер не намагається написати сам собі
        if (myId.toString() === otherId.toString()) {
            res.status(400).json({ message: 'Cannot chat with yourself' });
            return;
        }

        // Шукаємо існуючу розмову між двома юзерами
        // $all — MongoDB оператор: масив містить ВСІ вказані елементи
        // $size: 2 — масив рівно 2 елементи (щоб не знайти групові чати у майбутньому)
        let conversation = await Conversation.findOne({
            participants: { $all: [myId, otherId], $size: 2 },
        }).populate('participants', 'username avatar _id'); // одразу популяція

        // Якщо розмова не існує — створюємо нову
        if (!conversation) {
            // new Conversation({...}) — створюємо екземпляр моделі
            const newConversation = new Conversation({
                // participants — масив з двох ID
                participants: [myId, otherId],
            });
            
            // .save() — зберігаємо документ в MongoDB
            await newConversation.save();
            
            // Після збереження популяємо (бо щойно збережений документ не має populate)
            conversation = await Conversation.findById(newConversation._id)
                .populate('participants', 'username avatar _id');
        }

        // Повертаємо розмову (нову або існуючу)
        res.json({ conversation });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const { conversationId } = req.params;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId, // перевіряємо, що користувач є учасником розмови
        })

        if (!conversation) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const page = Number(req.query.page) || 1;
        const limit = 30;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'username avatar _id')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit);

        res.json({ messages });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
}

export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const { messageId } = req.params;

        const message = await Message.findById(messageId);

        if (!message) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }

        if (message.sender.toString() !== userId) {
            res.status(403).json({ message: 'You can only delete your own messages' });
            return;
        }

        await Message.findByIdAndUpdate(messageId, { isDeleted: true });

        // Дістаємо conversationId з повідомлення щоб надіслати подію в правильну кімнату
        const conversationId = message.conversation.toString();

        const io = req.app.get('io');

        if (io) {
            io.to(conversationId).emit('message_deleted', { messageId });
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
}
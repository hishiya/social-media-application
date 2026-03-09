import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import http from 'http';
import { initSocket } from './socket';

import chatRoutes from './routes/chat';
import authRoutes from './routes/auth';
import tweetRoutes from './routes/tweet';
import userRoutes from './routes/user';
import replyRoutes from './routes/reply';
import searchRoutes from './routes/search';
import uploadRoutes from './routes/upload';

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

// Перед роздачею статичних файлів (зображень/відео) вручну встановлюємо заголовок
// Cross-Origin-Resource-Policy: cross-origin — дозволяємо завантажувати ресурси
// з інших origin-ів (наприклад localhost:5173 завантажує картинку з localhost:5000)
// Без цього Helmet за замовчуванням ставить 'same-origin', що блокує завантаження
// (req, res, next) — стандартний Express middleware: req = запит, res = відповідь, next = далі
app.use('/uploads', (req, res, next) => {
    // res.setHeader(name, value) — вручну встановлюємо HTTP-заголовок відповіді
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // next() — передаємо управління наступному middleware (express.static)
    next();
});

// express.static() — вбудований middleware Express, який просто роздає файли з папки
// path.join(__dirname, '..', 'uploads') — абсолютний шлях до папки uploads/
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/replies', replyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT ?? 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) throw new Error('MONGO_URI is not defined in .env');

// Створюємо HTTP сервер вручну, щоб потім передати його в Socket.io
const httpServer = http.createServer(app);

// Ініціалізуємо Socket.io, передаючи йому HTTP сервер
const io = initSocket(httpServer);

// Зберігаємо io в app, щоб мати доступ до нього в контролерах
app.set('io', io);

mongoose
  .connect(MONGO_URI)
  .then(() => httpServer.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Startup error:', err);
    process.exit(1);
  });
  
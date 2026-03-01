import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import tweetRoutes from './routes/tweet';
import userRoutes from './routes/user';
import replyRoutes from './routes/reply';

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/replies', replyRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT ?? 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) throw new Error('MONGO_URI is not defined in .env');

mongoose
  .connect(MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Startup error:', err);
    process.exit(1);
  });
  
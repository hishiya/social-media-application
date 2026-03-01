import { useState } from 'react';
import { type Tweet, likeTweet, deleteTweet } from '../api/tweet';
import { type Reply, getRepliesByTweet, createReply } from '../api/reply';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ReplyCard  from './ReplyCard';

interface TweetCardProps {
    tweet: Tweet;
    onUpdate: (updated: Tweet) => void;
    onDelete: (id: string) => void;
}

const TweetCard = ({ tweet, onUpdate, onDelete }: TweetCardProps) => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    const isLiked = user ? tweet.likes.includes(user.id) : false;
    const isOwner = user?.id === tweet.author._id;

    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const formattedDate = new Date(tweet.createdAt).toLocaleDateString('uk-UA');

    const handleLike = async () => {
        try {
            const updated = await likeTweet(tweet._id);
            onUpdate(updated);
        } catch (error) {
            console.error(error);
        }
    }

    const handleDelete = async () => {
        try {
            await deleteTweet(tweet._id);
            onDelete(tweet._id);
        } catch (error) {
            console.error(error);
        }
    }

    const handleToggleReplies = async () => {
        if (showReplies) {
            setShowReplies(false);
            return;
        }

        setShowReplies(true);
        setRepliesLoading(true);

        try {
            const data = await getRepliesByTweet(tweet._id);
            setReplies(data);
        } catch (error) {
            console.error(error);
        } finally {
            setRepliesLoading(false);
        }
    }

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!replyText.trim()) return;

        setSubmitting(true);

        try {
            const newReply = await createReply(tweet._id, replyText.trim());

            setReplies([...replies, newReply])
            setReplyText('');
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    }

    const handleDeleteReply = (replyId: string) => {
        setReplies(replies.filter((r) => r._id !== replyId));
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">

            {/* ── Верхня частина: аватар + ім'я + дата ── */}
            <div className="flex items-center gap-3 mb-3">

                {/* Аватар автора твіту */}
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold overflow-hidden">
                    {tweet.author.avatar
                        ? <img src={tweet.author.avatar} alt="avatar" className="w-full h-full object-cover" />
                        : tweet.author.username[0].toUpperCase()
                    }
                </div>

                {/* Ім'я автора — клік веде на профіль */}
                <div>
                    <p
                        className="font-semibold text-white hover:underline cursor-pointer"
                        onClick={() => navigate(`/profile/${tweet.author.username}`)}
                    >
                        @{tweet.author.username}
                    </p>
                    <p className="text-gray-500 text-sm">{formattedDate}</p>
                </div>
            </div>

            {/* ── Текст твіту ── */}
            <p className="text-white mb-4 leading-relaxed">{tweet.text}</p>

            {/* ── Кнопки дій (лайк, відповісти, видалити) ── */}
            <div className="flex items-center gap-4">

                {/* Кнопка лайку (без змін) */}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                        isLiked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-400'
                    }`}
                >
                    {isLiked ? '❤️' : '🤍'}
                    <span>{tweet.likes.length}</span>
                </button>

                {/* ── НОВА кнопка "Відповісти" ── */}
                {/* Показує кількість репляїв якщо вони вже завантажені */}
                <button
                    onClick={handleToggleReplies} // відкрити/закрити секцію
                    className={`flex items-center gap-1 text-sm transition-colors ${
                        showReplies
                            ? 'text-blue-400'  // синій якщо секція відкрита
                            : 'text-gray-500 hover:text-blue-400' // сірий інакше
                    }`}
                >
                    💬 {/* іконка чату */}
                    {/* Показуємо кількість репляїв лише якщо вони завантажені */}
                    {showReplies && <span>{replies.length}</span>}
                </button>

                {/* Кнопка видалення (тільки для автора, без змін) */}
                {isOwner && (
                    <button
                        onClick={handleDelete}
                        className="text-sm text-gray-500 hover:text-red-400 transition-colors ml-auto"
                    >
                        Видалити
                    </button>
                )}
            </div>

            {/* ── Секція репляїв — показується тільки якщо showReplies = true ── */}
            {/* && — якщо showReplies = false, нічого не рендериться */}
            {showReplies && (
                <div className="mt-4 flex flex-col gap-2">

                    {/* Горизонтальна лінія-розділювач */}
                    <div className="border-t border-gray-800" />

                    {/* Показуємо "Завантаження..." поки repliesLoading = true */}
                    {repliesLoading ? (
                        <p className="text-gray-500 text-sm py-2">Завантаження...</p>
                    ) : (
                        <>
                            {/* Список репляїв — якщо є */}
                            {replies.length > 0 ? (
                                <div className="flex flex-col gap-2 mt-1">
                                    {/* .map() — обходимо кожен реплай і рендеримо ReplyCard */}
                                    {replies.map((reply) => (
                                        <ReplyCard
                                            key={reply._id}           // унікальний ключ для React (обов'язково при .map())
                                            reply={reply}             // передаємо об'єкт репляя
                                            onDelete={handleDeleteReply} // передаємо функцію видалення
                                        />
                                    ))}
                                </div>
                            ) : (
                                // Якщо репляїв немає
                                <p className="text-gray-600 text-sm py-1">Ще немає відповідей</p>
                            )}

                            {/* ── Форма для написання нової відповіді ── */}
                            {/* onSubmit — викликається при натисканні кнопки або Enter у формі */}
                            <form
                                onSubmit={handleSubmitReply}
                                className="flex gap-2 mt-2"
                            >
                                <input
                                    type="text"
                                    value={replyText}                          // контрольоване поле — значення з useState
                                    onChange={(e) => setReplyText(e.target.value)} // оновлюємо стан при кожному символі
                                    placeholder="Написати відповідь..."
                                    maxLength={280}                            // максимум символів
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    // flex-1 — займає весь доступний простір (залишок після кнопки)
                                />
                                <button
                                    type="submit"          // при кліку сабмітить форму (викликає onSubmit)
                                    disabled={submitting || !replyText.trim()} // disable якщо іде запит АБО поле порожнє
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {submitting ? '...' : 'Відповісти'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default TweetCard;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Tweet, getTweets, createTweet } from '../api/tweet';
import TweetCard from '../components/TweetCard';
import { useAuthStore } from '../store/authStore';

const FeedPage = () => {
    const [tweets, setTweets] = useState<Tweet[]>([]);
    const [text, setText] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchTweets = async () => {
            try {
                const data = await getTweets();
                setTweets(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchTweets();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!text.trim()) return;

        setSubmitting(true);
        try {
            const newTweet = await createTweet(text);
            setTweets([newTweet, ...tweets]);
            setText('');
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    }

    const handleUpdate = (updated: Tweet) => {
        setTweets(tweets.map(t => t._id === updated._id ? updated : t));
    }

    const handleDelete = (id: string) => {
        setTweets(tweets.filter(t => t._id !== id));
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">

      {/* Шапка сайту */}
      <header className="border-b border-gray-800 px-4 py-3 flex justify-between items-center sticky top-0 bg-gray-950 z-10">
        {/* sticky top-0 — шапка залишається зверху при скролі */}
        <h1 className="text-xl font-bold">Головна</h1>

        <div className="flex items-center gap-4">
          {/* Показуємо ім'я поточного юзера */}
          <span className="text-gray-400 text-sm">@{user?.username}</span>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Вийти
          </button>
        </div>
      </header>

      {/* Основний контент — обмежуємо ширину по центру */}
      <main className="max-w-xl mx-auto px-4 py-4">

        {/* Форма створення твіту */}
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Що відбувається?"
            rows={3}
            maxLength={280}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
          />

          {/* Нижня частина форми — лічильник символів та кнопка */}
          <div className="flex justify-between items-center mt-2">

            {/* Лічильник: 0/280, 140/280 тощо */}
            {/* Колір червоніє коли близько до ліміту */}
            <span className={`text-sm ${text.length > 260 ? 'text-red-400' : 'text-gray-500'}`}>
              {text.length}/280
            </span>

            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-full transition-colors"
            >
              {submitting ? 'Надсилаю...' : 'Твітнути'}
            </button>
          </div>
        </form>

        {/* Список твітів */}
        {loading ? (
          // Поки завантажуємо — показуємо текст
          <p className="text-center text-gray-500 py-8">Завантаження...</p>
        ) : tweets.length === 0 ? (
          // Якщо твітів немає — показуємо повідомлення
          <p className="text-center text-gray-500 py-8">Твітів ще немає. Будь першим!</p>
        ) : (
          // Інакше — рендеримо список
          // flex flex-col gap-4 — вертикальний список з відступами між картками
          <div className="flex flex-col gap-4">
            {tweets.map((tweet) => (
              // key — обов'язковий атрибут при рендері списків у React
              // Допомагає React розуміти який елемент змінився
              <TweetCard
                key={tweet._id}
                tweet={tweet}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
    )
}

export default FeedPage;
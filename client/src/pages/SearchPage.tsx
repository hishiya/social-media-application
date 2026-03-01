import { useState, useEffect, use } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { search, type SearchUser, type SearchTweet } from "../api/search";
import { useAuthStore } from "../store/authStore";
import Navbar from "../components/Navbar";

const SearchPage = () => {
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [users, setUsers] = useState<SearchUser[]>([]);
    const [tweets, setTweets] = useState<SearchTweet[]>([]);

    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q && q.trim()) {
            setQuery(q);
            performSearch(q);
        }
    }, [searchParams]);

    const performSearch = async (q: string) => {
        setError('');
        setLoading(true);
        setSearched(false);

        try {
            const data = await search(q.trim());
            setUsers(data.users);
            setTweets(data.tweets);
            setSearched(true);
        } catch (err) {
            setError('Помилка при пошуку. Спробуйте ще раз.');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearchParams({ q: query.trim() });
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />

            <main className="max-w-xl mx-auto px-4 py-6">

                <h1 className="text-xl font-bold mb-4">Пошук</h1>

                {/* Форма пошуку */}
                <form
                    onSubmit={handleSubmit}
                    className="flex gap-2 mb-6"
                >
                    <input
                        type="text"
                        value={query}                            // контрольоване поле
                        onChange={(e) => setQuery(e.target.value)} // оновлення стану при введенні
                        placeholder="Ім'я користувача або текст твіту..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        // flex-1 — займає весь доступний простір (все крім кнопки)
                        autoFocus // автоматично фокус на це поле при відкритті сторінки
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()} // вимкнено якщо завантаження або порожньо
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? '...' : 'Знайти'}
                    </button>
                </form>

                {/* Помилка */}
                {error && (
                    <p className="text-red-400 mb-4 text-sm">{error}</p>
                )}

                {/* Блок результатів — показуємо тільки якщо пошук вже виконувався */}
                {searched && (
                    <>
                        {/* ── Секція юзерів ── */}
                        <div className="mb-6">
                            <h2 className="text-base font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                {/* tracking-wider — збільшений міжлітерний інтервал */}
                                Користувачі
                            </h2>

                            {users.length === 0 ? (
                                <p className="text-gray-600 text-sm">Нікого не знайдено</p>
                            ) : (
                                <ul className="flex flex-col gap-1">
                                    {/* .map() — перетворюємо кожен елемент масиву в JSX */}
                                    {users.map((u) => (
                                        <li
                                            key={u._id} // унікальний key — обов'язковий для React при .map()
                                            onClick={() => navigate(`/profile/${u.username}`)} // перехід на профіль
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-900 cursor-pointer transition-colors"
                                        >
                                            {/* Аватар юзера */}
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
                                                {/* flex-shrink-0 — не стискати аватар якщо текст довгий */}
                                                {u.avatar
                                                    ? <img
                                                        src={u.avatar}
                                                        alt="avatar"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                        // onError — якщо картинка не завантажилася, ховаємо її
                                                      />
                                                    : u.username[0].toUpperCase() // перша літера як fallback
                                                }
                                            </div>

                                            {/* Ім'я і біо */}
                                            <div className="min-w-0">
                                                {/* min-w-0 — дозволяє truncate спрацювати всередині flex */}
                                                <p className="font-semibold text-white">
                                                    @{u.username}
                                                </p>
                                                {/* Біо — показуємо тільки якщо воно є */}
                                                {u.bio && (
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {/* truncate — обрізає текст з "..." якщо не вміщується */}
                                                        {u.bio}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Роздільник між блоками */}
                        <div className="border-t border-gray-800 mb-6" />

                        {/* ── Секція твітів ── */}
                        <div>
                            <h2 className="text-base font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                Твіти
                            </h2>

                            {tweets.length === 0 ? (
                                <p className="text-gray-600 text-sm">Твітів не знайдено</p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {tweets.map((tweet) => (
                                        <li
                                            key={tweet._id}
                                            onClick={() => navigate(`/profile/${tweet.author.username}`)}
                                            // Клік на твіт веде на профіль автора
                                            className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-gray-600 transition-colors"
                                        >
                                            {/* Верхній рядок: аватар + ім'я + дата */}
                                            <div className="flex items-center gap-2 mb-2">
                                                {/* Аватар автора */}
                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                                                    {tweet.author.avatar
                                                        ? <img
                                                            src={tweet.author.avatar}
                                                            alt="avatar"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                                          />
                                                        : tweet.author.username[0].toUpperCase()
                                                    }
                                                </div>

                                                {/* Ім'я автора */}
                                                <span className="font-semibold text-sm text-white">
                                                    @{tweet.author.username}
                                                </span>

                                                {/* Дата — toLocaleDateString перетворює ISO рядок на локальний формат */}
                                                <span className="text-xs text-gray-500 ml-auto">
                                                    {/* ml-auto — прижимає дату вправо */}
                                                    {new Date(tweet.createdAt).toLocaleDateString('uk-UA')}
                                                </span>
                                            </div>

                                            {/* Текст твіту */}
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {tweet.text}
                                            </p>

                                            {/* Кількість лайків */}
                                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                                                <span>❤️</span>
                                                <span>{tweet.likes.length}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default SearchPage
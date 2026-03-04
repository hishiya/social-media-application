import { useState } from 'react';

// Імпортуємо editTweet (раніше не був підключений до компонента)
import { type Tweet, likeTweet, deleteTweet, editTweet } from '../api/tweet';
import { type Reply, getRepliesByTweet, createReply } from '../api/reply';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ReplyCard from './ReplyCard';

// Тип пропсів компонента
interface TweetCardProps {
    tweet: Tweet;                       // об'єкт твіту для відображення
    onUpdate: (updated: Tweet) => void; // колбек: при оновленні (лайк, редагування)
    onDelete: (id: string) => void;     // колбек: при видаленні
}

const TweetCard = ({ tweet, onUpdate, onDelete }: TweetCardProps) => {
    // Отримуємо поточного авторизованого юзера зі Zustand-стору
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    // Чи лайкнув поточний юзер цей твіт
    // tweet.likes — масив ID юзерів що лайкнули
    // .includes(user.id) — перевіряємо чи є поточний юзер у списку
    const isLiked = user ? tweet.likes.includes(user.id) : false;

    // Чи є поточний юзер автором цього твіту
    const isOwner = user?.id === tweet.author._id;

    // ── Стани для репляїв ──
    const [showReplies, setShowReplies] = useState(false);     // чи відкрита секція репляїв
    const [replies, setReplies] = useState<Reply[]>([]);       // масив репляїв
    const [repliesLoading, setRepliesLoading] = useState(false); // чи завантажуються
    const [replyText, setReplyText] = useState('');             // текст нового репляю
    const [submitting, setSubmitting] = useState(false);        // чи надсилається реплай

    // ── Стани для редагування твіту ──
    const [isEditing, setIsEditing] = useState(false);   // режим редагування on/off
    const [editText, setEditText] = useState(tweet.text); // текст у textarea редагування
    const [editMedia, setEditMedia] = useState<string[]>(tweet.media || []); // медіа при редагуванні (поки не використовується)
    const [editLoading, setEditLoading] = useState(false); // чи надсилається PATCH запит

    // Форматуємо дату українською локаллю
    // toLocaleDateString('uk-UA') → "03.03.2026"
    const formattedDate = new Date(tweet.createdAt).toLocaleDateString('uk-UA');

    // ── Обробник лайку ──
    const handleLike = async () => {
        try {
            const updated = await likeTweet(tweet._id); // POST /api/tweets/:id/like
            onUpdate(updated); // передаємо оновлений твіт батькові
        } catch (error) {
            console.error(error);
        }
    };

    // ── Обробник видалення ──
    const handleDelete = async () => {
        try {
            await deleteTweet(tweet._id); // DELETE /api/tweets/:id
            onDelete(tweet._id);          // повідомляємо батька → видаляємо з масиву
        } catch (error) {
            console.error(error);
        }
    };

    // ── Обробник збереження редагування ──
    const handleEditSave = async () => {
        // Не відправляємо якщо текст порожній або не змінився
        if (!editText.trim() || editText.trim() === tweet.text) {
            setIsEditing(false); // просто закриваємо режим
            return;
        }

        setEditLoading(true); // блокуємо кнопку "Зберегти"

        try {
            // editTweet(id, text) — PATCH /api/tweets/:id з { text }
            // Повертає оновлений твіт з isEdited: true
            const updated = await editTweet(tweet._id, editText.trim());

            onUpdate(updated);   // передаємо оновлений твіт батькові
            setIsEditing(false); // виходимо з режиму редагування
        } catch (error) {
            console.error(error);
        } finally {
            setEditLoading(false); // розблоковуємо кнопку
        }
    };

    // ── Обробник скасування редагування ──
    const handleEditCancel = () => {
        // Повертаємо textarea до оригінального тексту
        setEditText(tweet.text);
        setIsEditing(false); // закриваємо режим
    };

    // ── Обробник відкриття/закриття репляїв ──
    const handleToggleReplies = async () => {
        if (showReplies) {
            setShowReplies(false);
            return;
        }

        setShowReplies(true);
        setRepliesLoading(true);

        try {
            const data = await getRepliesByTweet(tweet._id); // GET /api/replies/:tweetId
            setReplies(data);
        } catch (error) {
            console.error(error);
        } finally {
            setRepliesLoading(false);
        }
    };

    // ── Обробник надсилання репляю ──
    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault(); // зупиняємо стандартний сабміт форми
        if (!replyText.trim()) return;

        setSubmitting(true);
        try {
            const newReply = await createReply(tweet._id, replyText.trim());
            setReplies([...replies, newReply]); // додаємо реплай в кінець
            setReplyText(''); // очищаємо поле
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Функція видалення репляю ──
    const handleDeleteReply = (replyId: string) => {
        setReplies(replies.filter((r) => r._id !== replyId));
    };

    // ── Допоміжна функція: визначити чи URL є відео ──
    // Перевіряємо розширення файлу в URL
    // /\.(mp4|webm|ogg|mov)$/i — regex:
    //   \. — крапка перед розширенням
    //   (mp4|webm|ogg|mov) — один із цих форматів
    //   $ — кінець рядка
    //   i — ігнорувати регістр (.MP4 теж підійде)
    const isVideoUrl = (url: string): boolean => {
        return /\.(mp4|webm|ogg|mov)$/i.test(url);
    };

    return (
        // bg-gray-900 — темно-сіра картка, border — рамка, rounded-xl — закруглені кути
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">

            {/* ── Верхня частина: аватар + ім'я + дата + значок відредаговано ── */}
            <div className="flex items-center gap-3 mb-3">

                {/* Аватар автора */}
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold overflow-hidden">
                    {tweet.author.avatar
                        // Якщо аватар є — показуємо зображення
                        ? <img src={tweet.author.avatar} alt="avatar" className="w-full h-full object-cover" />
                        // Інакше — перша буква імені у верхньому регістрі
                        : tweet.author.username[0].toUpperCase()
                    }
                </div>

                {/* Блок: ім'я + дата */}
                <div>
                    {/* Клік по імені — навігація на профіль */}
                    <p
                        className="font-semibold text-white hover:underline cursor-pointer"
                        onClick={() => navigate(`/profile/${tweet.author.username}`)}
                    >
                        @{tweet.author.username}
                    </p>

                    {/* Дата + значок "(відредаговано)" */}
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        {formattedDate}
                        {/* tweet.isEdited && ... — рендеримо тільки якщо твіт відредаговано */}
                        {tweet.isEdited && (
                            <span className="text-gray-600 text-xs">(відредаговано)</span>
                        )}
                    </p>
                </div>
            </div>

            {/* ── Текст твіту або форма редагування ── */}
            {/* isEditing ? ... : ... — тернарний оператор: якщо редагуємо — форма, інакше текст */}
            {isEditing ? (
                // ── РЕЖИМ РЕДАГУВАННЯ ──
                <div className="mb-4">
                    <textarea
                        value={editText}                               // контрольоване поле
                        onChange={(e) => setEditText(e.target.value)}  // оновлюємо стан
                        maxLength={280}    // ліміт як у оригіналу
                        rows={3}
                        autoFocus         // автоматично ставимо курсор у поле при відкритті
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none focus:outline-none focus:border-blue-500"
                    />

                    {/* Лічильник символів при редагуванні */}
                    <p className={`text-xs mt-1 text-right ${editText.length > 260 ? 'text-red-400' : 'text-gray-600'}`}>
                        {editText.length}/280
                    </p>

                    {/* Кнопки дій редагування */}
                    <div className="flex gap-2 mt-2">
                        {/* Зберегти */}
                        <button
                            onClick={handleEditSave}
                            disabled={editLoading || !editText.trim()} // блокуємо якщо завантажується або порожнє
                            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors disabled:opacity-50"
                        >
                            {editLoading ? 'Зберігаю...' : 'Зберегти'}
                        </button>

                        {/* Скасувати */}
                        <button
                            onClick={handleEditCancel}
                            className="text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded-full border border-gray-700 transition-colors"
                        >
                            Скасувати
                        </button>
                    </div>
                </div>
            ) : (
                // ── ЗВИЧАЙНИЙ РЕЖИМ ПЕРЕГЛЯДУ ──
                <p className="text-white mb-4 leading-relaxed">{tweet.text}</p>
            )}

            {/* ── Медіа-вкладення ── */}
            {/* tweet.media.length > 0 && ... — рендеримо блок тільки якщо є медіа */}
            {tweet.media && tweet.media.length > 0 && (
                // flex flex-col gap-2 — вертикальний список якщо кілька медіа
                <div className="flex flex-col gap-2 mb-4">
                    {/* Обходимо масив URL медіа */}
                    {tweet.media.map((url, index) => (
                        // key={index} — при відсутності унікального ID використовуємо індекс
                        // (для статичного списку медіа це прийнятно)
                        <div key={index} className="rounded-xl overflow-hidden border border-gray-800">
                            {/* Перевіряємо тип за розширенням URL */}
                            {isVideoUrl(url) ? (
                                // Відео — з controls для управління
                                <video
                                    src={url}
                                    controls // стандартні кнопки відтворення
                                    className="w-full max-h-80" // max-h-80 = 320px
                                />
                            ) : (
                                // Зображення
                                <img
                                    src={url}
                                    alt={`медіа ${index + 1}`}
                                    // object-cover — заповнює без спотворення
                                    // cursor-pointer — показуємо що можна клікнути
                                    className="w-full max-h-80 object-cover cursor-pointer"
                                    // onClick — відкриваємо в новій вкладці для повного розміру
                                    onClick={() => window.open(url, '_blank')} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Кнопки дій (лайк, відповісти, редагувати, видалити) ── */}
            <div className="flex items-center gap-4">

                {/* Лайк */}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                        isLiked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-400'
                    }`}
                >
                    {isLiked ? '❤️' : '🤍'}
                    <span>{tweet.likes.length}</span>
                </button>

                {/* Відповісти */}
                <button
                    onClick={handleToggleReplies}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                        showReplies ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'
                    }`}
                >
                    💬
                    {showReplies && <span>{replies.length}</span>}
                </button>

                {/* Кнопки для АВТОРА твіту */}
                {/* isOwner && ... — рендеримо тільки якщо поточний юзер = автор */}
                {isOwner && (
                    // ml-auto — відштовхуємо в правий кут
                    <div className="flex items-center gap-3 ml-auto">

                        {/* Редагувати — показуємо тільки якщо НЕ в режимі редагування */}
                        {/* !isEditing — логічне НЕ: true коли isEditing = false */}
                        {!isEditing && (
                            <button
                                // Вмикаємо режим редагування
                                // setEditText(tweet.text) — заповнюємо textarea поточним текстом
                                onClick={() => {
                                    setEditText(tweet.text); // текст у поле редагування
                                    setIsEditing(true);      // вмикаємо режим редагування
                                }}
                                className="text-sm text-gray-500 hover:text-blue-400 transition-colors"
                            >
                                Редагувати
                            </button>
                        )}

                        {/* Видалити */}
                        <button
                            onClick={handleDelete}
                            className="text-sm text-gray-500 hover:text-red-400 transition-colors"
                        >
                            Видалити
                        </button>
                    </div>
                )}
            </div>

            {/* ── Секція репляїв ── */}
            {showReplies && (
                <div className="mt-4 flex flex-col gap-2">
                    <div className="border-t border-gray-800" />

                    {repliesLoading ? (
                        <p className="text-gray-500 text-sm py-2">Завантаження...</p>
                    ) : (
                        <>
                            {replies.length > 0 ? (
                                <div className="flex flex-col gap-2 mt-1">
                                    {replies.map((reply) => (
                                        <ReplyCard
                                            key={reply._id}
                                            reply={reply}
                                            onDelete={handleDeleteReply}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm py-1">Ще немає відповідей</p>
                            )}

                            {/* Форма нового репляю */}
                            <form onSubmit={handleSubmitReply} className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Написати відповідь..."
                                    maxLength={280}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !replyText.trim()}
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
};

export default TweetCard;
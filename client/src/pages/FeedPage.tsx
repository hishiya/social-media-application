// client/src/pages/FeedPage.tsx

// useState — хук для реактивних змінних (при зміні — компонент перерендерується)
// useEffect — хук для сайд-ефектів (наприклад: fetch при монтуванні)
// useRef    — хук для посилань на DOM-елементи (не викликає ререндер)
import { useState, useEffect, useRef } from 'react';

// Імпортуємо тип Tweet та всі необхідні API-функції
// type Tweet — лише TypeScript-тип, не потрапляє в JS-бандл (ключове слово type)
import { type Tweet, getTweets, createTweet, uploadMedia } from '../api/tweet';

// Імпортуємо компоненти
import TweetCard from '../components/TweetCard';
import Navbar from '../components/Navbar';

const FeedPage = () => {
    // ── Стани для списку твітів ──
    const [tweets, setTweets] = useState<Tweet[]>([]); // масив твітів, початково порожній
    const [text, setText] = useState<string>('');       // текст нового твіту
    const [loading, setLoading] = useState<boolean>(true);     // чи завантажується стрічка
    const [submitting, setSubmitting] = useState<boolean>(false); // чи надсилається форма

    // ── Стани для медіа-вкладення ──
    const [mediaUrl, setMediaUrl] = useState<string>('');         // URL файлу НА СЕРВЕРІ (після upload)
    const [mediaPreview, setMediaPreview] = useState<string>(''); // тимчасовий локальний URL для прев'ю
    const [uploading, setUploading] = useState<boolean>(false);   // чи іде завантаження файлу зараз
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null); // тип медіа

    // useRef<HTMLInputElement>(null):
    // - useRef         → React-хук для посилання на DOM
    // - <HTMLInputElement> → TypeScript-тип (посилання саме на <input> елемент)
    // - (null)         → початкове значення до монтування компонента
    // Потрібен щоб програмно викликати click() на прихованому input[type=file]
    const fileInputRef = useRef<HTMLInputElement>(null);

    // useEffect виконується після першого рендеру компонента
    // [] — масив залежностей порожній → ефект спрацьовує ОДИН РАЗ при монтуванні
    useEffect(() => {
        // async функція всередині useEffect (сам useEffect не може бути async)
        const fetchTweets = async () => {
            try {
                const data = await getTweets(); // GET /api/tweets
                setTweets(data);                // зберігаємо в стан → ререндер
            } catch (error) {
                console.error(error);
            } finally {
                // finally — виконується завжди, незалежно від успіху/помилки
                setLoading(false); // прибираємо спіннер
            }
        };
        fetchTweets();
    }, []); // ← порожній масив = виконати тільки при монтуванні

    // ── Обробник вибору файлу через input[type=file] ──
    // React.ChangeEvent<HTMLInputElement> — тип події для <input onChange>
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // e.target.files — FileList (схожий на масив обраних файлів)
        // ?. — optional chaining: якщо files == null — не крашнеться, поверне undefined
        // [0] — перший (і єдиний) файл
        const file = e.target.files?.[0];

        // Якщо користувач закрив діалог без вибору файлу — виходимо
        if (!file) return;

        // URL.createObjectURL(file) — вбудована браузерна функція
        // Створює тимчасовий локальний URL (blob:http://...) без відправки на сервер
        // Дозволяє МИТТЄВО показати прев'ю ще до завантаження файлу
        const localPreviewUrl = URL.createObjectURL(file);
        setMediaPreview(localPreviewUrl); // одразу показуємо прев'ю

        // file.type — MIME-тип файлу, наприклад: 'image/jpeg', 'image/png', 'video/mp4'
        // .startsWith('image/') — перевіряємо групу типу без конкретного формату
        if (file.type.startsWith('image/')) {
            setMediaType('image'); // встановлюємо тип → JSX покаже <img>
        } else if (file.type.startsWith('video/')) {
            setMediaType('video'); // встановлюємо тип → JSX покаже <video>
        }

        // Починаємо реальне завантаження файлу на сервер
        setUploading(true); // показуємо "Завантаження..."

        try {
            // uploadMedia(file) — з api/tweet.ts
            // POST /api/upload з FormData → повертає { url: 'http://localhost:5000/uploads/abc.jpg' }
            const url = await uploadMedia(file);

            // Зберігаємо сервер-URL — він піде у createTweet() при сабміті
            setMediaUrl(url);
        } catch (error) {
            console.error('Помилка завантаження медіа:', error);
            // При помилці — скидаємо все, щоб не відправити зламаний твіт
            setMediaPreview('');
            setMediaUrl('');
            setMediaType(null);
            // Скидаємо value інпуту — щоб наступний вибір того самого файлу спрацював
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } finally {
            setUploading(false); // прибираємо індикатор незалежно від результату
        }
    };

    // ── Функція видалення прикріпленого медіа ──
    const handleRemoveMedia = () => {
        setMediaPreview('');  // прибираємо прев'ю
        setMediaUrl('');      // прибираємо сервер-URL
        setMediaType(null);   // прибираємо тип

        // Скидаємо value файлового інпуту
        // Це важливо: без цього якщо користувач видалить і захоче додати той самий файл —
        // onChange НЕ спрацює (бо value не змінився)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // ── Обробник сабміту форми ──
    const handleSubmit = async (e: React.FormEvent) => {
        // e.preventDefault() — зупиняємо стандартну поведінку браузера (перезавантаження сторінки)
        e.preventDefault();

        // Перевіряємо: тільки пробіли — не відправляємо
        if (!text.trim()) return;

        // Якщо медіа ще завантажується — теж чекаємо
        if (uploading) return;

        setSubmitting(true); // блокуємо кнопку "Твітнути"

        try {
            // Формуємо масив медіа: якщо mediaUrl є — кладемо в масив [url], інакше []
            // Наша API функція приймає text: string та media: string[] = []
            const mediaArray: string[] = mediaUrl ? [mediaUrl] : [];

            // createTweet(text, media) — POST /api/tweets з { text, media }
            const newTweet = await createTweet(text, mediaArray);

            // Додаємо новий твіт НА ПОЧАТОК масиву (найновіший зверху)
            // [newTweet, ...tweets] — spread-оператор: розпаковує старий масив
            setTweets([newTweet, ...tweets]);

            // ── Скидаємо форму після успішного твіту ──
            setText('');      // очищаємо текстове поле
            setMediaUrl('');   // очищаємо сервер-URL
            setMediaPreview(''); // очищаємо прев'ю
            setMediaType(null);  // очищаємо тип

            // Скидаємо value файлового інпуту (щоб можна було завантажити той самий файл знову)
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false); // розблоковуємо кнопку
        }
    };

    // ── Колбеки для TweetCard ──

    // onUpdate — коли твіт оновлено (лайк або редагування)
    // tweets.map() — обходимо масив, замінюємо тільки той твіт що змінився
    const handleUpdate = (updated: Tweet) => {
        setTweets(tweets.map(t => t._id === updated._id ? updated : t));
    };

    // onDelete — коли твіт видалено
    // tweets.filter() — повертає новий масив БЕЗ видаленого твіту
    const handleDelete = (id: string) => {
        setTweets(tweets.filter(t => t._id !== id));
    };

    // ── JSX — що рендериться на екрані ──
    return (
        // min-h-screen — мінімальна висота = висота вікна браузера
        // bg-gray-950 — дуже темний фон, text-white — білий текст
        <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />

            {/* max-w-xl mx-auto — обмежуємо ширину і центруємо */}
            {/* px-4 py-4 — відступи: горизонтальні 16px, вертикальні 16px */}
            <main className="max-w-xl mx-auto px-4 py-4">

                {/* ── Форма створення твіту ── */}
                {/* onSubmit — викликається при натисканні кнопки type="submit" або Enter */}
                <form onSubmit={handleSubmit} className="mb-6">

                    {/* Текстова область для тексту твіту */}
                    <textarea
                        value={text}                              // контрольоване поле
                        onChange={(e) => setText(e.target.value)} // оновлюємо стан при кожному символі
                        placeholder="Що відбувається?"
                        rows={3}       // висота = 3 рядки
                        maxLength={280} // максимум 280 символів (як Twitter)
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
                        // resize-none — забороняємо ресайз textarea вручну
                        // focus:border-blue-500 — синя рамка при фокусі
                    />

                    {/* ── Прев'ю прикріпленого медіа ── */}
                    {/* mediaPreview && ... — рендеримо блок ТІЛЬКИ якщо є прев'ю */}
                    {mediaPreview && (
                        // relative — для позиціонування кнопки "✕" поверх прев'ю
                        <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-700">

                            {/* Умовний рендер: якщо тип 'image' — показуємо <img>, інакше <video> */}
                            {mediaType === 'image' ? (
                                <img
                                    src={mediaPreview}      // blob:// URL або сервер URL
                                    alt="прев'ю"
                                    // max-h-64 — максимальна висота прев'ю = 256px
                                    // object-cover — зображення заповнює блок без спотворення
                                    className="w-full max-h-64 object-cover"
                                />
                            ) : (
                                <video
                                    src={mediaPreview}
                                    controls  // стандартні елементи управління відео
                                    className="w-full max-h-64"
                                />
                            )}

                            {/* Кнопка видалення медіа — абсолютно позиціонована у правому верхньому кутку */}
                            <button
                                type="button" // type="button" — щоб НЕ сабмітило форму при кліку!
                                onClick={handleRemoveMedia}
                                // absolute top-2 right-2 — 8px від верху та правого краю контейнера
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-colors"
                                title="Видалити медіа"
                            >
                                ✕ {/* символ хрестика */}
                            </button>

                            {/* Індикатор завантаження поверх прев'ю */}
                            {/* uploading && ... — показуємо напівпрозорий оверлей поки файл іде на сервер */}
                            {uploading && (
                                // absolute inset-0 — розтягуємо на весь батьківський блок
                                // bg-black/50 — чорний колір з 50% прозорістю
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-sm">Завантаження...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Нижня панель форми ── */}
                    {/* flex — рядок, items-center — вирівнювання по центру вертикально */}
                    <div className="flex justify-between items-center mt-2">

                        {/* Ліва частина: кнопка прикріпити + лічильник */}
                        <div className="flex items-center gap-3">

                            {/* Прихований файловий інпут — користувач його не бачить */}
                            {/* ref — підключаємо useRef щоб програмно викликати click() */}
                            {/* accept — які типи файлів дозволені у файловому діалозі */}
                            {/* onChange — спрацьовує коли користувач обрав файл */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,video/*"
                                className="hidden" // ховаємо стандартний інпут
                            />

                            {/* Кнопка яка ВІДКРИВАЄ файловий діалог */}
                            {/* type="button" — ВАЖЛИВО: без цього кнопка сабмітить форму! */}
                            <button
                                type="button"
                                // onClick: fileInputRef.current — DOM-елемент input
                                // ?. — optional chaining: якщо current == null — не крашнеться
                                // .click() — програмно відкриваємо файловий діалог
                                onClick={() => fileInputRef.current?.click()}
                                // disabled якщо вже є медіа або іде завантаження
                                disabled={!!mediaPreview || uploading}
                                className="text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xl"
                                title="Прикріпити фото або відео"
                            >
                                📎
                            </button>

                            {/* Лічильник символів */}
                            {/* text-red-400 — червоний колір коли > 260 символів */}
                            <span className={`text-sm ${text.length > 260 ? 'text-red-400' : 'text-gray-500'}`}>
                                {text.length}/280
                            </span>
                        </div>

                        {/* Кнопка відправки */}
                        <button
                            type="submit"
                            // disabled якщо: надсилається, текст порожній, або медіа ще завантажується
                            disabled={submitting || !text.trim() || uploading}
                            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-full transition-colors"
                        >
                            {/* Показуємо різний текст залежно від стану */}
                            {submitting ? 'Надсилаю...' : uploading ? 'Чекаю файл...' : 'Твітнути'}
                        </button>
                    </div>
                </form>

                {/* ── Список твітів ── */}
                {loading ? (
                    <p className="text-center text-gray-500 py-8">Завантаження...</p>
                ) : tweets.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Твітів ще немає. Будь першим!</p>
                ) : (
                    // flex flex-col gap-4 — вертикальна колонка з відступами 16px між картками
                    <div className="flex flex-col gap-4">
                        {/* tweets.map() — обходимо масив і для кожного твіту рендеримо TweetCard */}
                        {tweets.map((tweet) => (
                            // key — ОБОВ'ЯЗКОВИЙ унікальний ідентифікатор при рендері списку
                            // Допомагає React розуміти який елемент змінився (оптимізація DOM)
                            <TweetCard
                                key={tweet._id}
                                tweet={tweet}
                                onUpdate={handleUpdate} // (updated: Tweet) => void
                                onDelete={handleDelete} // (id: string) => void
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default FeedPage;
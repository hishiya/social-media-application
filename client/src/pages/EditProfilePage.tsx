// client/src/pages/EditProfilePage.tsx

// useState  — стани компонента
// useEffect — виконати код після рендеру
// useRef    — посилання на DOM-елемент (для file input)
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, getProfile } from '../api/user';

// uploadMedia — імпортуємо з tweet.ts (та сама функція, вона загальна для будь-яких файлів)
// POST /api/upload → повертає URL збереженого файлу
import { uploadMedia } from '../api/tweet';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore(); // беремо user та setUser зі стору

    // ── Стани полів форми ──
    // Початкові значення: user?.username — якщо user не null, беремо username, інакше ''
    // ?. — optional chaining, ?? '' — nullish coalescing (якщо undefined/null → '')
    const [username, setUsername] = useState(user?.username ?? '');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(''); // URL аватарки (або із сервера, або введений вручну)
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // ── Допоміжні стани ──
    const [loading, setLoading] = useState(false);           // чи надсилається форма
    const [fetchingProfile, setFetchingProfile] = useState(true); // чи підвантажуємо профіль
    const [error, setError] = useState('');                  // повідомлення про помилку
    const [success, setSuccess] = useState('');              // повідомлення про успіх

    // avatarUploading — окремий стан для завантаження файлу
    // (відмінний від loading, щоб не блокувати всю форму)
    const [avatarUploading, setAvatarUploading] = useState(false);

    // useRef для прихованого <input type="file"> аватарки
    // HTMLInputElement — TypeScript знає що .current — це <input>-елемент
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // ── Підвантаження поточних даних профілю при монтуванні ──
    useEffect(() => {
        // Якщо юзер ще не завантажений у стор — нічого не робимо
        if (!user?.username) return;

        // GET /api/users/:username → отримуємо повні дані профілю
        getProfile(user.username)
            .then((profile) => {
                setUsername(profile.username);
                setBio(profile.bio ?? '');     // ?? '' — якщо bio = null, ставимо ''
                setAvatar(profile.avatar ?? ''); // так само для avatar
            })
            .catch(() => {
                // Якщо помилка — поля залишаться порожніми або з даними зі стору
            })
            .finally(() => setFetchingProfile(false)); // прибираємо спіннер завантаження

    }, [user?.username]); // залежність: перезапустити якщо змінився username у сторі

    // ── Обробник вибору файлу аватарки ──
    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // e.target.files?.[0] — перший обраний файл (або undefined якщо не обрали)
        const file = e.target.files?.[0];
        if (!file) return; // закрили діалог без вибору — нічого не робимо

        // Перевіряємо що це зображення (аватарка не може бути відео)
        if (!file.type.startsWith('image/')) {
            setError('Для аватарки можна використовувати тільки зображення');
            return;
        }

        setAvatarUploading(true); // показуємо індикатор
        setError('');             // очищаємо попередні помилки

        try {
            // uploadMedia(file) — та сама функція що й для медіа твітів
            // POST /api/upload з FormData, повертає { url: 'http://...' }
            const url = await uploadMedia(file);

            // Встановлюємо отриманий URL в стан avatar
            // При сабміті форми він потрапить у updateProfile({ avatar: url })
            setAvatar(url);
        } catch (err) {
            console.error('Помилка завантаження аватарки:', err);
            setError('Не вдалося завантажити аватарку. Спробуйте ще раз.');
        } finally {
            setAvatarUploading(false); // прибираємо індикатор

            // Скидаємо value інпуту — щоб можна було вибрати той самий файл знову
            if (avatarInputRef.current) {
                avatarInputRef.current.value = '';
            }
        }
    };

    // ── Обробник сабміту форми ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // зупиняємо перезавантаження сторінки
        setError('');
        setSuccess('');

        // Валідація паролів
        if (newPassword && newPassword !== confirmPassword) {
            setError('Нові паролі не збігаються');
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setError('Новий пароль має бути не менше 6 символів');
            return;
        }

        setLoading(true);

        try {
            // updateProfile — PUT /api/users/me
            // Передаємо тільки ті поля що є непустими (undefined = не передавати поле)
            const updatedUser = await updateProfile({
                username: username.trim() || undefined,
                bio: bio.trim() !== '' ? bio.trim() : undefined,
                // avatar тепер може бути або URL введений вручну, або URL з сервера після upload
                avatar: avatar.trim() !== '' ? avatar.trim() : undefined,
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined,
            });

            // Оновлюємо дані в Zustand-сторі (щоб Navbar та інші компоненти оновились)
            setUser({
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
            });

            setSuccess('Профіль успішно оновлено!');

            // Переходимо на профіль через 1 секунду
            // setTimeout — затричка з колбеком (функцією що виконається через 1000мс)
            setTimeout(() => {
                navigate(`/profile/${updatedUser.username}`);
            }, 1000);

        } catch (err: unknown) {
            // Дістаємо повідомлення помилки з axios response
            // TypeScript не знає тип err, тому перевіряємо структуру вручну
            const message =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            setError(message ?? 'Помилка при оновленні профілю');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />

            <main className="max-w-xl mx-auto px-4 py-6">
                {/* Кнопка "Назад" */}
                <button
                    onClick={() => navigate(-1)} // navigate(-1) — повернутись на попередню сторінку
                    className="text-gray-400 hover:text-white transition-colors mb-4 block"
                >
                    ← Назад
                </button>

                <h1 className="text-xl font-bold mb-6">Редагувати профіль</h1>

                {/* Якщо профіль ще завантажується — показуємо повідомлення */}
                {fetchingProfile ? (
                    <p className="text-gray-400">Завантаження...</p>
                ) : (
                    // onSubmit — при натисканні "Зберегти" або Enter у формі
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* ── Поле: Ім'я користувача ── */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Ім'я користувача
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="username"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* ── Поле: Біографія ── */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Біографія</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Розкажіть про себе..."
                                maxLength={160}
                                rows={3}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                            />
                            {/* Лічильник символів біо */}
                            <p className="text-xs text-gray-600 text-right mt-1">{bio.length}/160</p>
                        </div>

                        {/* ── Секція аватарки ── */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Аватарка</label>

                            {/* Поточне прев'ю аватарки (якщо є URL) */}
                            {avatar && (
                                <div className="flex items-center gap-3 mb-3">
                                    <img
                                        src={avatar}
                                        alt="аватар"
                                        // onError — якщо URL зламаний, ховаємо картинку
                                        // e.currentTarget — DOM-елемент що спричинив подію
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
                                    />
                                    <span className="text-xs text-gray-500">Поточна аватарка</span>
                                </div>
                            )}

                            {/* Ряд: поле URL + кнопка завантаження файлу */}
                            {/* flex items-center gap-2 — горизонтальне вирівнювання */}
                            <div className="flex items-center gap-2">

                                {/* Поле введення URL вручну */}
                                <input
                                    type="text"
                                    value={avatar}
                                    onChange={(e) => setAvatar(e.target.value)}
                                    placeholder="https://example.com/photo.jpg"
                                    // flex-1 — займає весь доступний простір (ширина - кнопка)
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />

                                {/* Прихований файловий інпут для аватарки */}
                                {/* ref — підключаємо до avatarInputRef */}
                                {/* accept="image/*" — тільки зображення (не відео) */}
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    onChange={handleAvatarFileChange}
                                    accept="image/*"
                                    className="hidden" // ховаємо стандартний некрасивий інпут
                                />

                                {/* Кнопка що відкриває файловий діалог */}
                                {/* type="button" — ОБОВ'ЯЗКОВО щоб не сабмітити форму! */}
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    // disabled якщо іде завантаження файлу
                                    disabled={avatarUploading}
                                    // shrink-0 — не стискати кнопку якщо мало місця
                                    className="shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Завантажити фото з комп'ютера"
                                >
                                    {/* Показуємо різний текст залежно від стану */}
                                    {avatarUploading ? 'Завантаження...' : '📎 Файл'}
                                </button>
                            </div>

                            {/* Підказка під полем */}
                            <p className="text-xs text-gray-600 mt-1">
                                Вставте URL або завантажте файл з комп'ютера
                            </p>
                        </div>

                        {/* ── Роздільник ── */}
                        <div className="border-t border-gray-800 my-2" />

                        <p className="text-sm text-gray-400 font-medium">
                            Зміна паролю (необов'язково)
                        </p>

                        {/* ── Поточний пароль ── */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Поточний пароль
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* ── Новий пароль ── */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Новий пароль</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* ── Підтвердження нового паролю ── */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Повторіть новий пароль
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* ── Повідомлення про помилку або успіх ── */}
                        {/* error && ... — рендеримо тільки якщо error не порожній рядок */}
                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}
                        {success && (
                            <p className="text-green-400 text-sm">{success}</p>
                        )}

                        {/* ── Кнопка відправки ── */}
                        <button
                            type="submit"
                            // disabled якщо форма надсилається АБО аватарка ще завантажується
                            disabled={loading || avatarUploading}
                            className="bg-white text-black font-semibold rounded-full py-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
};

export default EditProfilePage;
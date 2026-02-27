import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, getProfile } from '../api/user';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();

    const [username, setUsername] = useState(user?.username ?? '');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Підвантажуємо поточні дані профілю при відкритті сторінки
    useEffect(() => {
        if (!user?.username) return;

        getProfile(user.username)
            .then((profile) => {
                setUsername(profile.username);
                setBio(profile.bio ?? '');
                setAvatar(profile.avatar ?? '');
            })
            .catch(() => {
                // не критично — поля залишаться порожніми
            })
            .finally(() => setFetchingProfile(false));
    }, [user?.username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Перевірка паролів
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
            const updatedUser = await updateProfile({
                username: username.trim() || undefined,
                bio: bio.trim() !== '' ? bio.trim() : undefined,
                avatar: avatar.trim() !== '' ? avatar.trim() : undefined,
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined,
            });

            // Оновлюємо дані в store
            setUser({
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
            });

            setSuccess('Профіль успішно оновлено!');

            // Переходимо на профіль через 1 секунду
            setTimeout(() => {
                navigate(`/profile/${updatedUser.username}`);
            }, 1000);

        } catch (err: unknown) {
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
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white transition-colors mb-4 block"
                >
                    ← Назад
                </button>

                <h1 className="text-xl font-bold mb-6">Редагувати профіль</h1>

                {fetchingProfile ? (
                    <p className="text-gray-400">Завантаження...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        {/* Username */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Ім'я користувача</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="username"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Bio */}
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
                            <p className="text-xs text-gray-600 text-right mt-1">{bio.length}/160</p>
                        </div>

                        {/* Avatar URL */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">URL аватара</label>
                            <input
                                type="text"
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                placeholder="https://example.com/photo.jpg"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            {avatar && (
                                <div className="mt-2 flex items-center gap-3">
                                    <img
                                        src={avatar}
                                        alt="аватар"
                                        className="w-12 h-12 rounded-full object-cover border border-gray-700"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                    <span className="text-xs text-gray-500">Попередній перегляд</span>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-800 my-2" />

                        <p className="text-sm text-gray-400 font-medium">Зміна паролю (необов'язково)</p>

                        {/* Current Password */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Поточний пароль</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* New Password */}
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

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Повторіть новий пароль</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Error / Success messages */}
                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}
                        {success && (
                            <p className="text-green-400 text-sm">{success}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
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

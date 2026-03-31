import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile, getProfile } from "../api/user";

import { uploadMedia } from "../api/tweet";
import { useAuthStore } from "../store/authStore";
import Navbar from "../components/Navbar";
import { usePageTitle } from "../hooks/usePageTitle";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  usePageTitle("Edit");

  useEffect(() => {
    if (!user?.username) return;

    getProfile(user.username)
      .then((profile) => {
        setUsername(profile.username);
        setBio(profile.bio ?? "");
        setAvatar(profile.avatar ?? "");
      })
      .catch(() => {})
      .finally(() => setFetchingProfile(false));
  }, [user?.username]);

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Для аватарки можна використовувати тільки зображення");
      return;
    }

    setAvatarUploading(true);
    setError("");

    try {
      const url = await uploadMedia(file);

      setAvatar(url);
    } catch (err) {
      console.error("Помилка завантаження аватарки:", err);
      setError("Не вдалося завантажити аватарку. Спробуйте ще раз.");
    } finally {
      setAvatarUploading(false);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Нові паролі не збігаються");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("Новий пароль має бути не менше 6 символів");
      return;
    }

    setLoading(true);

    try {
      const updatedUser = await updateProfile({
        username: username.trim() || undefined,
        bio: bio.trim() !== "" ? bio.trim() : undefined,

        avatar: avatar.trim() !== "" ? avatar.trim() : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      setUser({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      });

      setSuccess("Профіль успішно оновлено!");

      setTimeout(() => {
        navigate(`/profile/${updatedUser.username}`);
      }, 1000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(message ?? "Помилка при оновленні профілю");
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

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Біографія
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Розкажіть про себе..."
                maxLength={160}
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />

              <p className="text-xs text-gray-600 text-right mt-1">
                {bio.length}/160
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Аватарка
              </label>

              {avatar && (
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={avatar}
                    alt="аватар"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
                  />
                  <span className="text-xs text-gray-500">
                    Поточна аватарка
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />

                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Завантажити фото з комп'ютера"
                >
                  {avatarUploading ? "Завантаження..." : "📎 Файл"}
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-1">
                Вставте URL або завантажте файл з комп'ютера
              </p>
            </div>

            <div className="border-t border-gray-800 my-2" />

            <p className="text-sm text-gray-400 font-medium">
              Зміна паролю (необов'язково)
            </p>

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

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Новий пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

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

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}

            <button
              type="submit"
              disabled={loading || avatarUploading}
              className="bg-white text-black font-semibold rounded-full py-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Збереження..." : "Зберегти"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default EditProfilePage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    const [error, setError] = useState<string>('')

    const [loading, setLoading] = useState<boolean>(false)

    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const data = await login(email, password)
            setAuth(data.token, data.user)
            navigate('/feed')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Щось пішло не так')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">

            {/* w-full max-w-md — ширина до 448px, p-8 — відступи */}
            <div className="w-full max-w-md p-8">

                <h1 className="text-3xl font-bold mb-8 text-center">Увійти</h1>

                {/* onSubmit — викликає handleSubmit при натисканні кнопки або Enter */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}                          // прив'язуємо значення до стану
                        onChange={(e) => setEmail(e.target.value)}  // оновлюємо стан при кожному символі
                        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                        required                              // браузерна валідація — поле обов'язкове
                    />

                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                        required
                    />

                    {/* показуємо помилку тільки якщо вона є (error !== '') */}
                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}   // забороняємо натискати поки йде запит
                        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-full py-3 font-bold transition-colors"
                    >
                        {/* змінюємо текст кнопки залежно від стану завантаження */}
                        {loading ? 'Завантаження...' : 'Увійти'}
                    </button>
                </form>

                {/* посилання на реєстрацію */}
                <p className="text-center mt-6 text-gray-500">
                    Немає акаунту?{' '}
                    {/* href="/register" — звичайне посилання працює, але краще буде useNavigate пізніше */}
                    <a href="/register" className="text-blue-500 hover:underline">
                        Зареєструватись
                    </a>
                </p>
            </div>
        </div>
    )
}

export default LoginPage;
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

import socket from "../socket";

const Navbar = () => {
    const navigate = useNavigate()

    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)

    const handleLogout = () => {
        socket.disconnect() // відключаємо сокет при виході
        logout()
        navigate("/login")
    }

    return (
        <header className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">

            {/* Ліва частина — назва сайту, клік переходить на стрічку */}
            <span
                onClick={() => navigate('/feed')}
                className="text-xl font-bold cursor-pointer hover:text-blue-400 transition-colors"
            >
                Twitter
            </span>

            {/* Права частина — ім'я юзера і кнопка виходу */}
            <div className="flex items-center gap-4">

                <button
                    onClick={() => navigate('/search')}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Пошук" // tooltip при наведенні
                >
                    {/* SVG іконка пошуку — не залежить від бібліотек */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}        // товщина лінії
                        stroke="currentColor" // колір береться з CSS color (успадковується від батька)
                        className="w-5 h-5"   // 20x20px
                    >
                        {/* Коло лупи */}
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"
                        />
                    </svg>
                </button>

                {/* Кнопка переходу до чату */}
                <button
                    onClick={() => navigate('/chat')}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Повідомлення"
                >
                    {/* SVG іконка чат-бульбашки */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        {/* Шлях іконки "chat bubble" */}
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                        />
                    </svg>
                </button>

                {/* Клік на ім'я переходить на власний профіль */}
                {/* user?.username — optional chaining: якщо user = null, не крашнеться */}
                <span
                    onClick={() => navigate(`/profile/${user?.username}`)}
                    className="text-gray-400 text-sm hover:text-white cursor-pointer transition-colors"
                >
                    @{user?.username}
                </span>

                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Вийти
                </button>
            </div>
        </header>
    )
}

export default Navbar
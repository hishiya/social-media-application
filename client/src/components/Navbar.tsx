import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const Navbar = () => {
    const navigate = useNavigate()

    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)

    const handleLogout = () => {
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
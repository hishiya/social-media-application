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
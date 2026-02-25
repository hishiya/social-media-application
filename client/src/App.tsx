import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import axios from "axios"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import PrivateRoute from "./components/PrivateRoute"
import FeedPage from "./pages/FeedPage"
import { useAuthStore } from "./store/authStore"
import ProfilePage from "./pages/ProfilePage"

function App() {
  const { token, setUser, logout } = useAuthStore()

  useEffect(() => {
    // Якщо токен є — відновлюємо юзера з сервера
    // Це вирішує проблему: після refresh user = null, але токен є
    if (!token) return

    axios
      .get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // res.data.user містить { _id, username, email, ... }
        // Але наш store очікує { id, username, email }
        // тому перетворюємо _id → id
        setUser({
          id: res.data.user._id,
          username: res.data.user.username,
          email: res.data.user.email,
        })
      })
      .catch(() => {
        // Якщо токен протух або невалідний — розлогінюємо
        logout()
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // [] — виконується лише один раз при завантаженні додатку

  return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
                <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
  )
}

export default App
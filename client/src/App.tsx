import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import PrivateRoute from "./components/PrivateRoute"

const FeedPage = () => {
    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <h1 className="text-3xl font-bold mb-8 text-center">Стрічка</h1>
        </div>
    )
}

function App() {
  return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
            </Routes>
        </BrowserRouter>
  )
}

export default App
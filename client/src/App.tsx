import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

const LoginPage = () => (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <h1 className="text-2xl font-bold">Login Page</h1>
    </div>
)

const RegisterPage = () => (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <h1 className="text-2xl font-bold">Register Page</h1>
    </div>
)

const FeedPage = () => (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <h1 className="text-2xl font-bold">Feed Page</h1>
    </div>
)

function App() {
  return (
    // BrowserRouter — обгортає весь додаток, надає контекст роутингу
        // Без нього Routes і Route не працюватимуть
        <BrowserRouter>
            <Routes>
                {/* Route path="/" — що показати на головній сторінці */}
                {/* Navigate to="/login" — одразу перенаправляє на /login */}
                {/* replace — замінює поточний запис в history браузера замість додавання нового */}
                {/* без replace кнопка "назад" в браузері поверне знову на / і знову редіректить */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* element — JSX який рендериться коли URL збігається з path */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/feed" element={<FeedPage />} />
            </Routes>
        </BrowserRouter>
  )
}

export default App
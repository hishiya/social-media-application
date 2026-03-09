import { Link } from "react-router-dom"

export const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-gray-950 text-white grid items-center justify-center">
            <div className="flex flex-col items-center">
                <h1 className="text-4xl font-bold mb-2">404 - Сторінку не знайдено</h1>
                <Link to="/" className="text-blue-500 hover:underline" replace>
                    Повернутися на головну
                </Link>
            </div>
        </div>
    )
}
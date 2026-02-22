import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"

interface Props {
    children: React.ReactNode
}

const PrivateRoute = ({ children }: Props) => {
    const token = useAuthStore((state) => state.token)

    if (!token) {
        return <Navigate to="/login" replace />
    }
    return <>{children}</>
}

export default PrivateRoute
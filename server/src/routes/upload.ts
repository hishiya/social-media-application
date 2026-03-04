import { Router } from "express"

import { uploadFile } from "../controllers/upload"
import { authMiddleware } from "../middlewares/auth"

// Імпортуємо налаштування multer з utils/upload.ts
import { upload } from "../utils/upload"

const router = Router()

// upload.single('file') — multer middleware:
//   'file' — це ім'я поля у FormData, яке фронтенд використовує при надсиланні файлу
//   .single() — очікуємо рівно один файл
// Спочатку authMiddleware (перевірка токену), потім multer (обробка файлу), потім контролер
router.post('/', authMiddleware, upload.single('file'), uploadFile)

export default router